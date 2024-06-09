/**
 * @fileoverview This content script is part of a browser extension. It includes functions for interacting with the UI,
 *      handling data-ui-mode changes, observing DOM elements, and adjusting UI elements based on canvas resizing.
 *      Specifically it creates and handles overlay cards with enemy and ally pokemon information, and optionally
 *      a sidebar and bottompanel the does the same and more.
 * @file 'src/content/content.js'
 */

/* Ideally only bundle/import what is used. 
 * lit-html: https://lit.dev/
 * Template rendering.
 * templates and helper functions are prefixed with `window.lit.`
*/
const { html, render, ref, unsafeHTML, unsafeSVG, templateContent, asyncAppend, asyncReplace, until, 
	live, guard, cache, keyed, ifDefined, range, repeat, join, map, choose, when, classMap, styleMap } = window.LitHtml;

const initStates = { panelsInitialized : false, cardsInitialized: false, resizeObserverInitialized : false, sessionIntialized : false };
const uiDataGlobals = {}
uiDataGlobals.activePokemonParties = { "enemies" : {}, "allies" : {} };
uiDataGlobals.wrapperDivPositions = {
    'enemies': {
        'top': '0',
        'left': '0',
        'opacity': '100'
    },
    'allies': {
        'top': '0',
        'left': 'auto',
        'right': '0',
        'opacity': '100'
    }
}
uiDataGlobals.pages = {
    "enemies": 0,
    "allies": 0,
}

let Types
(function (Types) {
    Types[Types.normal = 1] = 1;
    Types[Types.fighting = 2] = 2;
    Types[Types.flying = 3] = 3;
    Types[Types.poison = 4] = 4;
    Types[Types.ground = 5] = 5;
    Types[Types.rock = 6] = 6;
    Types[Types.bug = 7] = 7;
    Types[Types.ghost = 8] = 8;
    Types[Types.steel = 9] = 9;
    Types[Types.fire = 10] = 10;
    Types[Types.water = 11] = 11;
    Types[Types.grass = 12] = 12;
    Types[Types.electric = 13] = 13;
    Types[Types.psychic = 14] = 14;
    Types[Types.ice = 15] = 15;
    Types[Types.dragon = 16] = 16;
    Types[Types.dark = 17] = 17;
    Types[Types.fairy = 18] = 18;
})(Types || (Types = {}));

let Stat;
(function (Stat) {
    Stat[Stat.HP = 0] = "HP";
    Stat[Stat.ATK = 1] = "ATK";
    Stat[Stat.DEF = 2] = "DEF";
    Stat[Stat.SPATK = 3] = "SPATK";
    Stat[Stat.SPDEF = 4] = "SPDEF";
    Stat[Stat.SPD = 5] = "SPD";
})(Stat || (Stat = {}));


scriptInjector();
updateExtensionStatus();
listenForDataUiModeChange();

/**
 * Injects a script into the current webpage.
 * @function scriptInjector
 */
function scriptInjector() {
    const scriptElem = document.createElement("script");
    scriptElem.src = chrome.runtime.getURL("/content/utils.js");
    scriptElem.type = "module";
    document.head.append(scriptElem);
    scriptElem.addEventListener("load", initUtilities);
}

/**
 * Initializes utility functions after the injected script is loaded.
 * @function initUtilities
 * @memberof scriptInjector
 */
function initUtilities() {
    // Initialize and set up UtilsClass
    window.Utils = new UtilsClass();
    window.Utils.init();

    // Listen for the 'isReadyChange' event to check if all scripts are loaded
    window.Utils.addEventListener('isReadyChange', () => {
        if (window.Utils.isReady) {
            console.info("All Scripts Loaded!");
            extensionSettingsListener();
        } else {
            console.info("Error Loading Scripts :(");
        }
    });
}

/**
 * Updates the status display of the extension.
 * @function updateExtensionStatus
 * @param {Object} properties - The properties to update the status.
 * @memberof window
 */
function updateExtensionStatus(properties) {
    let wrapper = document.getElementById('extension-status');
    if (!wrapper) {  
        render(html`<div class="text-base running-status" id="extension-status"></div>`, document.body, { renderBefore: document.body.firstChild });
        wrapper = document.getElementById('extension-status');
    }
    // Use an empty string if properties.text is '', a default value if null/undefined, otherwise use the provided value.
    const text = properties?.text === '' ? '' : (properties?.text ?? 'RogueDex is running!');
    // Uses 'unknown' when 'properties.sessionState' is null or undefined.
    const sessionState = properties?.sessionState ?? 'dont-show';

    const extensionStatusHTML = window.lit.updateExtensionStatusElement({ text, sessionState });
    render(extensionStatusHTML, wrapper)
}

/**
 * Enables dragging functionality for pokemon cards.
 * @function enableDragElement
 * @param {HTMLElement} elmnt - The element to enable dragging for.
 */
function enableDragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Attach the pointerdown event handler
    elmnt.onpointerdown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.type === 'submit' || e.target.type === 'range') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onpointerup = stopDragging;
        document.onpointermove = dragElement;
    }

    function dragElement(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function stopDragging() {
        document.onpointerup = null;
        document.onpointermove = null;
        console.log(elmnt)
        saveCardWrapperPositions(elmnt.id, { top : elmnt.style.top, left : elmnt.style.left, right : "auto" });
    }
}

/**
 * Initializes Pokemon card wrapper elements on the webpage.
 * @function initPokemonCardWrappers
 * @param {boolean} [sidebarState=false] - The state of the sidebar.
 * @param {string} [id1="enemies"] - The ID of the first wrapper.
 * @param {string} [id2="allies"] - The ID of the second wrapper.
 */
async function initPokemonCardWrappers(sidebarState = false, id1 = "enemies", id2 = "allies") {
    if (initStates.cardsInitialized && document.getElementById(id1) && document.getElementById(id2)) {
        return;
    }
    
    const enemiesWrapper = window.lit.createCardWrapper(id1, sidebarState);
    const alliesWrapper = window.lit.createCardWrapper(id2, sidebarState);

    await new Promise((resolve) => {
        const body = document.body;
        
        // Render the elements
        render(enemiesWrapper, body, { renderBefore: body.firstChild });
        render(alliesWrapper, body, { renderBefore: body.firstChild });
        
        // Move the rendered elements to be the last children of the body
        const enemies = body.querySelector(`#${id1}`);
        const allies = body.querySelector(`#${id2}`);        
        body.appendChild(enemies);
        body.appendChild(allies);
        initStates.cardsInitialized = true;
        
        const newWrapper1 = document.getElementById(id1);
        const newWrapper2 = document.getElementById(id2);
        if (newWrapper1) {
            enableDragElement(newWrapper1);
        }
        if (newWrapper2) {
            enableDragElement(newWrapper2);
        }

        if (false) {
            console.log(`${id1} pokemon card wrapper created:`, newWrapper1)
            console.log(`${id2} pokemon card wrapper created:`, newWrapper2)
        }

        resolve();
    });
}

/**
 * Deletes Pokemon card wrapper elements from the webpage.
 * @function deletePokemonCardWrappers
 * @param {string} [id1="enemies"] - The ID of the first wrapper.
 * @param {string} [id2="allies"] - The ID of the second wrapper.
 */
async function deletePokemonCardWrappers(id1 = "enemies", id2 = "allies") {
    const enemiesWrapper = document.getElementById(id1);
    const alliesWrapper = document.getElementById(id2);
    
    if (enemiesWrapper) {
        enemiesWrapper.remove();
    } else {
        console.warn(`Tried to delete element with id ${id1}, not found.`);
    }

    if (alliesWrapper) {
        alliesWrapper.remove();
    } else {
        console.warn(`Tried to delete element with id ${id2}, not found.`);
    }

    initStates.cardsInitialized = false;
}

/**
 * Changes the opacity of pokemon cards.
 * @function changeOpacity
 * @param {Event} e - The event triggering the opacity change.
 */
function changeOpacity(e) {
    const { id } = e.target;
    const divId = id.split("-")[0];
    const div = document.getElementById(divId);

    if (div) {
        const opacity = e.target.value / 100;
        uiDataGlobals.wrapperDivPositions[divId].opacity = opacity;
        div.style.opacity = `${opacity}`;
    } else {
        console.error(`Element with ID '${divId}' not found.`);
    }
}

/**
 * Changes the displayed page of Pokemon cards (cycles through pokemon in target party).
 * @function changePokemonCardPage
 * @async
 * @param {Event} click - The click event triggering the page change.
 * @param {string} partyId - The ID of the Pokemon party.
 * @param {Object[]} pokemonData - Data of the Pokemon.
 */
async function changePokemonCardPage(click, partyId, pokemonData) {
    const { id } = click.target;
    const [divId, direction] = id.split("-"); // Destructuring for clarity
    
    const partySize = uiDataGlobals.activePokemonParties[partyId].pokemon.length;

    // If no Pokemon in the party, initialize creation
    if (partySize === 0) {
        const sessionData = window.Utils.LocalStorage.getSessionData();
        await initCreation(sessionData);
    } else if (partySize <= 1) { // Skip if only one Pokemon in the party
        // No need to change the page
        return;
    }

    // Update page index based on direction
    if (direction === 'up' || direction === 'down') {
        uiDataGlobals.pages[divId] = getCyclicPageIndex(uiDataGlobals.pages[divId], partySize, direction === 'up' ? -1 : 1);
    } else {
        console.error(`Invalid direction: ${direction}`);
        return;
    }

    await createCardsDiv(partyId, pokemonData, uiDataGlobals.pages[divId]);
}

/**
 * Chooses the type of Pokemon card to create (normal/big or minified).
 * @function chooseCardType
 * @async
 * @param {string} divId - The ID of the wrapper div.
 * @param {Object} pokemon - The Pokemon data.
 * @param {string} weather - The weather condition.
 * @param {boolean} minified - Flag indicating if the card should be minified.
 * @returns {Promise<import('Lit-HTML-Template')>} - The created Pokemon card template.
 */
async function chooseCardType(divId, pokemon, weather, minified) {
    if (minified) {
        return await createPokemonCardDivMinified(divId, pokemon, weather);
    } else {
        return await createPokemonCardDiv(divId, pokemon, weather);
    }
}

/**
 * Creates a div containing Pokemon cards.
 * @function createCardsDiv
 * @async
 * @param {string} divId - The ID of the wrapper div.
 * @param {Object[]} pokemonData - Data of the Pokemon.
 * @param {number} pokemonIndex - The index of the current Pokemon.
 * @returns {Promise<HTMLElement>} - The created wrapper div.
 */
async function createCardsDiv(divId, pokemonData, pokemonIndex) {
    const pokemon = pokemonData[pokemonIndex];
    const extensionSettings = await window.Utils.LocalStorage.getExtensionSettings();
    const top = uiDataGlobals.wrapperDivPositions[divId]?.top || '0px';
    const left = uiDataGlobals.wrapperDivPositions[divId]?.left || '0px';
    const right = uiDataGlobals.wrapperDivPositions[divId]?.right || 'auto';
    const opacity = `${Number(uiDataGlobals.wrapperDivPositions[divId]?.opacity || 100) / 100}`;
    const weather = pokemonData.weather;

    return chooseCardType(divId, pokemon, weather, extensionSettings.showMinified).then(async (cardObj) => {
        const additionalParams = [divId, pokemonData];
        const buttonsObj = window.lit.createArrowButtonsDiv(divId, "↑", "↓", extensionSettings.showMinified, changePokemonCardPage, ...additionalParams);

        const content = html`
            ${buttonsObj.html}
            ${cardObj.html}
        `;

        await updateCardWrapper(divId, top, left, right, opacity, content, extensionSettings.showSidebar);

        window.Utils.PokemonIconDrawer.getPokemonIcon(pokemon, divId);
        return document.getElementById(divId);
    });
}

/**
 * Updates the Poekmon Card element contents.
 * @function updateCardWrapper
 * @async
 * @param {string} divId - The ID of the wrapper div.
 * @param {string} top - The top position of the div.
 * @param {string} left - The left position of the div.
 * @param {string} right - The right position of the div.
 * @param {string} opacity - The opacity of the div.
 * @param {import('Lit-HTML-Template')} content - The content to render in the wrapper.
 * @param {boolean} [showSidebar=false] - Flag indicating if the sidebar should be shown.
 */
async function updateCardWrapper(divId, top, left, right, opacity, content, showSidebar = false) {
    const existingWrapper = document.getElementById(divId);
    
    if (existingWrapper) {
        setElementProperties(existingWrapper, { top, left, right: right || "auto", opacity });
        render(content, existingWrapper);
    } else {
        await initPokemonCardWrappers(showSidebar);
        const newWrapper = document.getElementById(divId);
        newWrapper.style.position = 'absolute';
        setElementProperties(existingWrapper, { top, left, right, opacity });
        render(content, newWrapper);
    }
}

/**
 * Saves the position properties of a card element.
 * @function saveCardWrapperPositions
 * @param {string} divId - The ID of the wrapper div.
 * @param {Object} properties - The position properties to save.
 */
function saveCardWrapperPositions(divId, properties) {
    Object.keys(properties).forEach(prop => {
        uiDataGlobals.wrapperDivPositions[divId][prop] = properties[prop];
    });
}

/**
 * Sets properties for an HTML element.
 * @function setElementProperties
 * @param {HTMLElement} element - The HTML element to set properties for.
 * @param {Object} properties - The properties to set.
 */
function setElementProperties(element, properties) {
    if (element) {
        Object.keys(properties).forEach(prop => {
            element.style[prop] = properties[prop];
        });
    }    
}

/**
 * Creates a minified Pokemon card template.
 * @function createPokemonCardDivMinified
 * @async
 * @param {string} cardId - The ID of the card.
 * @param {Object} pokemon - The Pokemon data.
 * @param {string} weather - The weather condition.
 * @returns {Promise<{html: import('Lit-HTML-Template')}>} - The created minified Pokemon card template.
 */
async function createPokemonCardDivMinified(cardId, pokemon, weather) {
    const savedData = await window.Utils.LocalStorage.getPlayerData();
    const dexData = savedData.dexData;
    const dexIvs = dexData[pokemon.baseId].ivs;
    const ivsGeneratedHTML = window.lit.generateCardIVsHTML(pokemon, dexIvs);

    return {
        html: window.lit.createPokemonCardContentMinified(cardId, pokemon, ivsGeneratedHTML, weather)
    };
}

/**
 * Creates a full-size Pokemon card template.
 * @function createPokemonCardDiv
 * @async
 * @param {string} cardId - The ID of the card.
 * @param {Object} pokemon - The Pokemon data.
 * @param {string} weather - The weather condition.
 * @returns {Promise<{html: import('Lit-HTML-Template')}>} - The created full-size Pokemon card template.
 */
async function createPokemonCardDiv(cardId, pokemon, weather) {
    const opacitySlider = window.lit.createOpacitySliderDiv(cardId, changeOpacity, uiDataGlobals.wrapperDivPositions[cardId].opacity, "10", "100");
    const typeEffectivenessHTML = window.lit.createTypeEffectivenessWrapper(pokemon.typeEffectiveness);

    return {
        html: window.lit.createPokemonCardContent(cardId, pokemon, opacitySlider, typeEffectivenessHTML, weather)
    };
}

/**
 * Creates the sidebar and bottom panel elements.
 * Binds click controls to switch between showing IVs and movesets.
 * @function createPanels
 */
function createPanels() {
    const sidebarTemplate = window.lit.createSidebarTemplate();
    const bottomPanelTemplate = window.lit.createBottomPanelTemplate();

    render(sidebarTemplate, document.body, { renderBefore: document.body.firstChild });
    render(bottomPanelTemplate, document.body, { renderBefore: null });
    
    onElementAvailable("#roguedex-bottom-panel", () => {
        observeGameCanvasResize();
    });

    onElementAvailable("#sidebar-switch-iv-moves", () => {
        const uiControllerSwitchIVsMovesetDisplay = new UIController(sidebarSwitchBetweenIVsAndMoveset, '#sidebar-switch-iv-moves', { bindMouse: true, bindKeyboard: false, bindGamepad: false });
        // uiControllerSwitchIVsMovesetDisplay.setBindings(null, [6, 5]) // xbox lt + rb
    });    
}

/**
 * Updates the sidebar cards with the provided Pokémon data.
 * @function renderSidebarPartyTemplate
 * @async
 * @param {Object} sessionData - The session data.
 * @param {string} partyID - The ID of the party ('allies' or 'enemies').
 * @param {number} [maxPokemonForDetailedView=8] - The maximum number of Pokémon for detailed view.
 */
async function renderSidebarPartyTemplate(sessionData, partyID, maxPokemonForDetailedView = 8) {
    const savedData = window.Utils.LocalStorage.getPlayerData();
    const pokeData = uiDataGlobals.activePokemonParties[partyID];
    const sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`);

    if (pokeData?.pokemon?.length) {
        const partyTemplate = window.lit.createSidebarPartyTemplate(pokeData, partyID, savedData.dexData, sessionData, maxPokemonForDetailedView);
        render(partyTemplate, sidebarPartyElement);

        for (const [i, value] of pokeData.pokemon.entries()) {
            await window.Utils.PokemonIconDrawer.getPokemonIcon(value, `sidebar_${partyID}_${i}`);
        }
    }

    const headerElement = document.getElementById(`sidebar-header`);
    const headerTemplate = window.lit.updateSidebarHeader(sessionData);
    render(headerTemplate, headerElement);
}

/**
 * Toggles between displaying IVs and movesets in the sidebar.
 * @function sidebarSwitchBetweenIVsAndMoveset
 * @async
 */
async function sidebarSwitchBetweenIVsAndMoveset() {
    const sidebarElement = document.getElementById('roguedex-sidebar');

    const currentInfo = sidebarElement.dataset.shownPokemonTextInfo || 'ivs';
    const newInfo = currentInfo === 'ivs' ? 'movesets' : 'ivs';

    sidebarElement.dataset.shownPokemonTextInfo = newInfo;
    sidebarElement.classList.toggle('hideIVs', newInfo !== 'ivs');
    sidebarElement.classList.toggle('hideMoveset', newInfo !== 'movesets');
}

/**
 * Updates the bottom panel content.
 * @function updateBottomPanel
 * @async
 * @param {Object} sessionData - The session data.
 * @param {Object} pokemonData - The Pokémon data.
 */
async function updateBottomPanel(sessionData, pokemonData) {
    const partyID = pokemonData.partyId;
    if (partyID == "enemies") {
        return;
    }

    const bottomPanelElement = document.getElementById('roguedex-bottom-panel');

    const showTab = (tabId) => {
        window.lit.updateActiveTab(tabId);
    };
    const template = window.lit.createBottomPanelContentTemplate(sessionData, pokemonData, showTab);
    render(template, bottomPanelElement);
    const activeTabId = window.lit.getActiveTab();

    if (!activeTabId) {
        showTab('bottom-panel-global');
    }
}

/**
 * Scales elements based on the window size.
 * @function scaleElements
 * @async
 */
async function scaleElements() {
    const partiesScaleFactor = await getScaleFactor('scaleFactor', 1);
    const scaleFactor = await calculateScaleFactor();
    
    const enemiesDiv = document.getElementById('enemies');
    const alliesDiv = document.getElementById('allies');
    
    scaleFont(enemiesDiv, scaleFactor, partiesScaleFactor, 16);
    scaleFont(alliesDiv, scaleFactor, partiesScaleFactor, 16);
}

/**
 * Scales sidebar elements based on the window size.
 * @function scaleSidebarElements
 * @async
 */
async function scaleSidebarElements() {
    const scaleFactorMulti = await getScaleFactor('sidebarScaleFactor', 1);
    const scaleFactor = await calculateScaleFactor();
    
    const sidebarDiv = document.getElementById('roguedex-sidebar');
    scaleFont(sidebarDiv, scaleFactor, scaleFactorMulti, 12);
}

/**
 * Retrieves the scale factor from storage.
 * @function getScaleFactor
 * @async
 * @param {string} storageKey - The key to retrieve from storage.
 * @param {number} defaultValue - The default value if the key is not found in storage.
 * @returns {Promise<number>} - The retrieved scale factor.
 */
async function getScaleFactor(storageKey, defaultValue) {
    const data = await browserApi.storage.sync.get(storageKey);
    return data[storageKey] || defaultValue;
}

/**
 * Scales the font size of an element.
 * @function scaleFont
 * @param {HTMLElement} element - The element to scale the font size of.
 * @param {number} scaleFactor - The scale factor.
 * @param {number} scaleFactorMulti - The scale factor multiplier.
 * @param {number} baseSize - The base font size.
 */
function scaleFont(element, scaleFactor, scaleFactorMulti, baseSize) {
    element.style.fontSize = `${baseSize * scaleFactor * scaleFactorMulti}px`;
}

/**
 * Calculates the scale factor based on the window size.
 * @function calculateScaleFactor
 * @async
 * @returns {Promise<number>} - The calculated scale factor.
 */
async function calculateScaleFactor() {
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactorWidth = currentWidth / baseWidth;
    const scaleFactorHeight = currentHeight / baseHeight;
    return Math.min(scaleFactorWidth, scaleFactorHeight);
}

/**
 * Toggles the sidebar visibility, shows/hides some other UI elements and changes the properties of others
 * to make the UI work well with a displayed sidebar and bottompanel.
 * @function toggleSidebar
 * @async
 */
async function toggleSidebar() {
    const { showSidebar } = await browserApi.storage.sync.get('showSidebar');
    const sidebarElement = document.querySelector('#roguedex-sidebar');
    const bottomPanelElement = document.querySelector('#roguedex-bottom-panel');
    const gameAppElement = document.querySelector('#app');
    const runningStatusElement = document.querySelector('.running-status');
    const enemyCardDiv = document.querySelector('#enemies');
    const allyCardDiv = document.querySelector('#allies');
    
    const toggleClasses = (element, active) => {
        element.classList.toggle('active', active);
        element.classList.toggle('hidden', !active);
    };

    if (showSidebar) {
        toggleClasses(sidebarElement, true);
        gameAppElement.classList.add('sidebar-active');
        runningStatusElement.classList.add('sidebar-active');
        bottomPanelElement.classList.add('sidebar-active');
        toggleClasses(allyCardDiv, false);
        toggleClasses(enemyCardDiv, false);
        console.info("SIDEBAR toggled ON, #enemies and #allies DOM elements (pokemon cards) have been hidden via css classes.");
    } else {
        toggleClasses(sidebarElement, false);
        gameAppElement.classList.remove('sidebar-active');
        runningStatusElement.classList.remove('sidebar-active');
        bottomPanelElement.classList.remove('sidebar-active');
        toggleClasses(allyCardDiv, true);
        toggleClasses(enemyCardDiv, true);
        console.info("SIDEBAR toggled OFF, #enemies and #allies DOM elements (pokemon cards) have been shown again via css classes.");
    }
}

/**
 * Changes the position of the sidebar (left, right of the game app).
 * @function changeSidebarPosition
 * @async
 */
async function changeSidebarPosition() {
    const { sidebarPosition } = await browserApi.storage.sync.get('sidebarPosition');
    const sidebarParentElement = document.body;
    const bottomPanelElement = document.getElementById('roguedex-bottom-panel');

    const positions = ['Left', 'Right', 'Top', 'Bottom'];
    positions.forEach(position => {
        sidebarParentElement.classList.remove(`sidebar-${position}`);
        bottomPanelElement.classList.remove(`sidebar-${position}`);
    });

    sidebarParentElement.classList.add(`sidebar-${sidebarPosition}`);
    bottomPanelElement.classList.add(`sidebar-${sidebarPosition}`);
}

/**
 * Toggles the display of a sidebar party (enemies/allies).
 * @function toggleSidebarPartyDisplay
 * @async
 * @param {string} partyID - The ID of the party ('enemies' or 'allies').
 * @param {boolean} state - The desired display state.
 */
async function toggleSidebarPartyDisplay(partyID, state) {
    const sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`);
    sidebarPartyElement.classList.toggle('visible', state);
    sidebarPartyElement.classList.toggle('hidden', !state);
}

/**
 * Switches between compact and default types display in the sidebar.
 * @function switchSidebarTypesDisplay
 * @async
 * @param {boolean} state - The desired display state.
 */
async function switchSidebarTypesDisplay(state) {
    const sidebarElement = document.getElementById('roguedex-sidebar');
    sidebarElement.classList.toggle('compactTypeDisplay', state);
    sidebarElement.classList.toggle('defaultTypeDisplay', !state);
}

/**
 * Initializes the UI creation process and some of its updating processes.
 * @function initCreation
 * @async
 * @param {Object} sessionData - The session data.
 */
async function initCreation(sessionData) {   
    await initPokemonCardWrappers();

    const extensionSettings = await window.Utils.LocalStorage.getExtensionSettings();
    if (extensionSettings.showEnemies) {
        await dataMapping("enemyParty", "enemies", sessionData);
    }
    if (extensionSettings.showParty) {
        await dataMapping("party", "allies", sessionData);
    }
    if (extensionSettings.showSidebar) {
        await toggleSidebar(sessionData);
        await changeSidebarPosition(sessionData);
    }    
    await switchSidebarTypesDisplay(extensionSettings.sidebarCompactTypes);
}

/**
 * Creates arrays of pokemon objects for either the enemy or ally party. Data is taken from sessionData and processed
 * by the class window.Utils.PokeMapper.
 * @function dataMapping
 * @async
 * @param {string} pokemonLocation - The location of the Pokémon data ('enemyParty' or 'party').
 * @param {string} divId - The ID of the div.
 * @param {Object} sessionData - The session data.
 */
async function dataMapping(pokemonLocation, divId, sessionData) {
    const modifiers = pokemonLocation === "enemyParty" ? sessionData.enemyModifiers : sessionData.modifiers;

    try {
        const pokemonData = await window.Utils.PokeMapper.getPokemonArray(sessionData[pokemonLocation], sessionData.arena, modifiers, pokemonLocation);
        const weather = pokemonData.weather || null;
        const partyID = pokemonLocation === "enemyParty" ? "enemies" : "allies";

        uiDataGlobals.activePokemonParties[partyID] = pokemonData;
        uiDataGlobals.pages[divId] = getCyclicPageIndex(uiDataGlobals.pages[divId], pokemonData.pokemon.length);

        await new Promise(resolve => {
            createCardsDiv(divId, pokemonData.pokemon, uiDataGlobals.pages[divId]);
            resolve();
        });
        scaleElements();

        if (!initStates.panelsInitialized) {
            initStates.panelsInitialized = true;
            createPanels();
        }

        await renderSidebarPartyTemplate(sessionData, partyID);

        if (initStates.panelsInitialized) {
            await updateBottomPanel(sessionData, pokemonData);
        }
    } catch (error) {
        console.error("Error occurred during pokemon data mapping:", error);
    }
}

/**
 * Gets the cyclic page index based on the current index and maximum length.
 * @function getCyclicPageIndex
 * @param {number} currentIndex - The current index.
 * @param {number} maxLength - The maximum length.
 * @param {number} [increment=0] - The increment value.
 * @returns {number} - The cyclic page index.
 */
function getCyclicPageIndex(currentIndex, maxLength, increment = 0) {
    /* 
     *  Uses the modulo operator %. It gives you the remainder of a division operation,
     *  which can be used to wrap the number back to 0 when it exceeds the maximum value.
     *  Expects an array.length as maxLength, accounts for this length not being 0-based.
    */
    return (currentIndex + maxLength + increment) % maxLength
}

/**
 * Listens for changes in extension settings.
 * @function extensionSettingsListener
 */
function extensionSettingsListener() {
    browserApi.storage.onChanged.addListener(async function (changes, namespace) {
        const sessionData = window.Utils.LocalStorage.getSessionData();
        
        for (const [key, values = {oldValue, newValue}] of Object.entries(changes)) {
            switch (key) {
                case 'showMinified':
                    await initCreation(sessionData);
                    break;
                case 'scaleFactor':
                    await scaleElements();
                    break;
                case 'showEnemies':
                    await initCreation(sessionData);
                    await toggleSidebarPartyDisplay('enemies', values.newValue);
                    break;
                case 'showParty':
                    await initCreation(sessionData);
                    await toggleSidebarPartyDisplay('allies', values.newValue);
                    break;
                case 'showSidebar':
                    await toggleSidebar();
                    break;
                case 'sidebarPosition':
                    await changeSidebarPosition(sessionData);
                    break;
                case 'sidebarScaleFactor':
                    await scaleSidebarElements();
                    break;
                case 'sidebarCompactTypes':
                    await switchSidebarTypesDisplay(values.newValue);
                    break;
                default:
                    console.error(`Unhandled key: ${key}`);
                    break;
            }
        }
    });
}

/**
 * Listens for changes in data-ui-mode attribute and handles corresponding actions.
 * Actions such as updating sessionData, creating, deleting or updating UI elements.
 * @function listenForDataUiModeChange
 */
function listenForDataUiModeChange() {
    function handleDataUIModeChange(newValue) {
        try {
            switch (newValue) {
                case "MESSAGE":
                case "COMMAND":
                case "CONFIRM":
                    handleSessionInitialization();
                    break;
                case "SAVE_SLOT":
                    handleSaveSlotMode();
                    break;
                case "TITLE":
                case "MODIFIER_SELECT":
                case "STARTER_SELECT":
                    handleModeWithPokemonCards();
                    break;
                default:
                    console.warn("Unhandled data-ui-mode:", newValue);
                    break;
            }
        } catch (err) {
            console.error("An error occurred while handling data-ui-mode change:", err);
        }
    }

    function handleSessionInitialization() {
        window.Utils.LocalStorage.setSessionData();
        const sessionData = window.Utils.LocalStorage.getSessionData();
        if (sessionData && Object.keys(sessionData).length > 0) {
            initStates.sessionIntialized = true;
            updateExtensionStatus({sessionState: initStates.sessionIntialized});
            initCreation(sessionData);
        } else {
            console.warn("SessionData empty. UI won't work for the moment.");
            initStates.sessionIntialized = false;
            updateExtensionStatus({sessionState: initStates.sessionIntialized});
        }
    }

    function handleSaveSlotMode() {
        window.Utils.LocalStorage.clearAllSessionData();
        initStates.sessionIntialized = false;
        updateExtensionStatus({sessionState: initStates.sessionIntialized});
    }

    function handleModeWithPokemonCards() {
        deletePokemonCardWrappers();
    }

    function observeTouchControls() {
        const touchControlsElement = document.getElementById('touchControls');
        if (touchControlsElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode') {
                        const newValue = touchControlsElement.getAttribute('data-ui-mode');
                        console.info('[data-ui-mode] new value:', newValue);
                        handleDataUIModeChange(newValue);
                    }
                });
            });

            observer.observe(touchControlsElement, {attributes: true});
        } else {
            console.error('Element with ID "touchControls" not found.');
            setTimeout(observeTouchControls, 1000); // Retry after a short delay
        }
    }

    observeTouchControls();
}

/**
 * Executes a callback when a specified element becomes available in the DOM.
 * @function onElementAvailable
 * @param {string} selector - The CSS selector for the target element.
 * @param {Function} callback - The callback function to execute when the element becomes available.
 */
function onElementAvailable(selector, callback) {
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Observes the resizing of the game canvas and adjusts UI elements accordingly (bottompanel).
 * @function observeGameCanvasResize
 */
async function observeGameCanvasResize() {
    if (initStates.resizeObserverInitialized) {
        return;
    }    
    initStates.resizeObserverInitialized = true;

    const sidebarElement = document.getElementById("roguedex-sidebar");
    const bottomPanelElement = document.getElementById('roguedex-bottom-panel');

    // Function to check if the sidebar is visible
    function isSidebarVisible() {
        return window.getComputedStyle(sidebarElement).display !== "none";
    }

    // Function to resize the UI bottom panel
    function resizeUI(entries) {
        for (const entry of entries) {
            const { right, width, height } = entry.contentRect;
            resizeUIBottomPanel(right, width, height);
        }
    }

    // Function to show the bottom panel and resize the UI bottom panel
    function showBottomPanelAndResize(entries) {
        resizeUI(entries);
        bottomPanelElement.style.display = ''; // Set it back to default display value after resizing
    }

    // Initially hide the bottom panel if the sidebar is not visible
    if (!isSidebarVisible()) {
        bottomPanelElement.style.display = 'none';
    }

    // ResizeObserver to observe canvas resize
    const resizeObserver = new ResizeObserver(async (entries) => {
        const extensionSettings = await window.Utils.LocalStorage.getExtensionSettings();
        if (extensionSettings.showSidebar) {
            if (isSidebarVisible()) {
                showBottomPanelAndResize(entries);
            } else {
                // If sidebar is not visible, use MutationObserver
                useMutationObserver(entries, extensionSettings);
            }
        }
    });

    // Observe the canvas element
    resizeObserver.observe(document.getElementById('app').getElementsByTagName('canvas')[0]);

    // Function to handle MutationObserver logic
    function useMutationObserver(entries, extensionSettings) {
        // MutationObserver to detect changes in the sidebar's display property
        const mutationObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                    if (isSidebarVisible()) {
                        // If sidebar becomes visible, disconnect the MutationObserver
                        mutationObserver.disconnect();
                        // Perform resize logic and show the bottom panel
                        showBottomPanelAndResize(entries);
                    }
                }
            }
        });

        // Start observing the sidebar for attribute changes
        mutationObserver.observe(sidebarElement, { attributes: true, attributeFilter: ['style', 'class'] });
    }
}

/**
 * Resizes the UI bottom panel based on the dimensions of the canvas and sidebar.
 * @function resizeUIBottomPanel
 * @param {number} right - The right offset of the canvas.
 * @param {number} width - The width of the canvas.
 * @param {number} height - The height of the canvas.
 */
function resizeUIBottomPanel(right, width, height) {
    const panel = document.getElementById('roguedex-bottom-panel');
    const sidePanel = document.getElementById('roguedex-sidebar');

    if (panel) {
        const sidebarPos = sidePanel.getBoundingClientRect();
        const pageWidth = window.innerWidth;
        const pageHeight = window.innerHeight;

        // Bottom panel should take up the height that is leftover from the game app's canvas
        panel.style['max-height'] = `${pageHeight - Math.round(height)}px`;

        // Bottom panel should fill out the entire leftover horizontal space,
        // and should therefore be "anchored" to the sidebar.
        panel.style['max-width'] = `${pageWidth - sidebarPos.width}px`;
    }
}