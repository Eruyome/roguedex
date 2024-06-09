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

function scriptInjector() {
    const scriptElem = document.createElement("script");
    scriptElem.src = chrome.runtime.getURL("/content/utils.js");
    scriptElem.type = "module";
    document.head.append(scriptElem);
    scriptElem.addEventListener("load", initUtilities);
}

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

function changeOpacity(e) {
    const divId = e.target.id.split("-")[0];
    const div = document.getElementById(divId);
    uiDataGlobals.wrapperDivPositions[divId].opacity = e.target.value;
    div.style.opacity = `${e.target.value / 100}`;
}

async function changePokemonCardPage(click, partyId, pokemonData) {
    const buttonId = click.target.id;
    const divId = buttonId.split("-")[0];
    const direction = buttonId.split("-")[1];
    const partySize = uiDataGlobals.activePokemonParties[partyId].pokemon.length;

    if (partySize == 0) {  // might never happen, just in case.
        const sessionData = window.Utils.LocalStorage.getSessionData();
        await initCreation(sessionData);
    }
    else if (partySize <= 1) {  // no need if only 1 pokemon in party
        return
    }

    if (direction === 'up') {
        uiDataGlobals.pages[divId] = getCyclicPageIndex(uiDataGlobals.pages[divId], partySize, -1);
    } else if (direction === 'down') {
        uiDataGlobals.pages[divId] = getCyclicPageIndex(uiDataGlobals.pages[divId], partySize, 1);
    }
    await createCardsDiv(partyId, pokemonData, uiDataGlobals.pages[divId]);    
}

/* pokemon cards */

async function chooseCardType(divId, pokemon, weather, minified) {
    if (minified) {
        return await createPokemonCardDivMinified(divId, pokemon, weather);
    } else {
        return await createPokemonCardDiv(divId, pokemon, weather);
    }
}

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

function saveCardWrapperPositions(divId, properties) {
    Object.keys(properties).forEach(prop => {
        uiDataGlobals.wrapperDivPositions[divId][prop] = properties[prop];
    });
}

function setElementProperties(element, properties) {
    Object.keys(properties).forEach(prop => {
        element.style[prop] = properties[prop];
    });
}

async function createPokemonCardDivMinified(cardId, pokemon, weather) {
    const savedData = await window.Utils.LocalStorage.getPlayerData();
    const dexData = savedData.dexData;
    const dexIvs = dexData[pokemon.baseId].ivs;
    const ivsGeneratedHTML = window.lit.generateCardIVsHTML(pokemon, dexIvs);

    return {
        html: window.lit.createPokemonCardDivMinified(cardId, pokemon, dexIvs, ivsGeneratedHTML, weather)
    };
}

async function createPokemonCardDiv(cardId, pokemon, weather) {
    const opacitySlider = window.lit.createOpacitySliderDiv(cardId, changeOpacity, uiDataGlobals.wrapperDivPositions[cardId].opacity, "10", "100");
    const typeEffectivenessHTML = window.lit.createTypeEffectivenessWrapper(pokemon.typeEffectiveness);

    return {
        html: window.lit.createPokemonCardDiv(cardId, pokemon, opacitySlider, typeEffectivenessHTML, weather)
    };
}

/**
 * Creates the sidebar and bottom-panel elements.
 * Binds click controls to switch between showing IVs and movesets (optional: keyboard and gamepad). 
 * 
 * @param {Object} sessionData
 */
function createPanels(sessionData) {
    const sidebarTemplate = window.lit.createSidebarTemplate(sessionData);
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

const generateIVsHTML__ = (pokemon, dexIvs, simpleDisplay = false, addStyleClasses = false) => html`
    ${Object.keys(pokemon.ivs).map(i => {
        const curIV = pokemon.ivs[i];
        const dexIv = dexIvs[i];
        const isBetter = curIV > dexIv;
        const isWorse = curIV < dexIv;
        const icon = isBetter ? '↑' : (isWorse ? '↓' : '-');
        const color = isBetter ? '#00FF00' : (isWorse ? '#FF0000' : '#FFFF00');
        const colorStyle = !simpleDisplay && !addStyleClasses ? { color: color } : {};
        const ivValue = simpleDisplay ? curIV : html`${curIV}${icon}`;
        const statClass = addStyleClasses ? `stat-p-colors` : '';
        const valueClass = addStyleClasses ? `stat-c-colors` : '';

        return html`
            <div class="stat-p ${statClass}">
                ${Stat[i]}:&nbsp;
                <div class="stat-c ${valueClass}" style=${styleMap(colorStyle)}>${ivValue}</div>&nbsp;&nbsp;
            </div>
        `;
    })}
`;

/**
 * Updates the sidebar cards with the provided Pokémon data.
 * 
 * @param {Object} sessionData - The session data containing various modifiers.
 * @param {string} partyID - The ID of the party ('allies' or 'enemies').
 * @param {number} maxPokemonForDetailedView - The maximum number of Pokémon for detailed view.
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

async function sidebarSwitchBetweenIVsAndMoveset() {
    const sidebarElement = document.getElementById('roguedex-sidebar');

    const currentInfo = sidebarElement.dataset.shownPokemonTextInfo || 'ivs';
    const newInfo = currentInfo === 'ivs' ? 'movesets' : 'ivs';

    sidebarElement.dataset.shownPokemonTextInfo = newInfo;
    sidebarElement.classList.toggle('hideIVs', newInfo !== 'ivs');
    sidebarElement.classList.toggle('hideMoveset', newInfo !== 'movesets');
}

/**
 * Updates the bottom panel content (weather, global modifiers, pokemon specific modifiers).
 * 
 * @param {Object} sessionData - The session data containing various modifiers.
 * @param {Object} pokemonData - The data for the Pokémon in the party.
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

function deleteAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    element.innerHTML = '';
}

async function scaleElements() {
    const data = await browserApi.storage.sync.get('scaleFactor');
    const scaleFactorMulti = data.scaleFactor || 1;
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactorWidth = currentWidth / baseWidth;
    const scaleFactorHeight = currentHeight / baseHeight;
    const scaleFactor = scaleFactorWidth < scaleFactorHeight ? scaleFactorWidth : scaleFactorHeight;
    const enemiesDiv = document.getElementById('enemies');
    const alliesDiv = document.getElementById('allies');
    enemiesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
    alliesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
}

/* should probably refactor this and combine it with the scaleElements() function */
async function scaleSidebarElements() {
    const data = await browserApi.storage.sync.get('sidebarScaleFactor');
    const scaleFactorMulti = data.sidebarScaleFactor || 1;
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactorWidth = currentWidth / baseWidth;
    const scaleFactorHeight = currentHeight / baseHeight;
    const scaleFactor = scaleFactorWidth < scaleFactorHeight ? scaleFactorWidth : scaleFactorHeight;
    const sidebarDiv = document.getElementById('roguedex-sidebar');
    sidebarDiv.style.fontSize = `${12 * scaleFactor * scaleFactorMulti}px`;
}

async function toggleSidebar() {
    const data = await browserApi.storage.sync.get('showSidebar');
    const sidebarToggleState = data.showSidebar;
    const sidebarElement = document.getElementById('roguedex-sidebar');
    const bottomPanelElement = document.getElementById('roguedex-bottom-panel');
    const gameAppElement = document.getElementById('app');
    const runningStatusElement = document.getElementsByClassName('running-status')[0];
    const enemyCardDiv = document.getElementById('enemies');
    const allyCardDiv = document.getElementById('allies');

    if (sidebarToggleState === true) {
        sidebarElement.classList.remove('hidden');
        sidebarElement.classList.add('active');
        gameAppElement.classList.add('sidebar-active');
        runningStatusElement.classList.add('sidebar-active');
        bottomPanelElement.classList.add('sidebar-active');

        allyCardDiv.classList.add('hidden');
        enemyCardDiv.classList.add('hidden');
        console.info("SIDEBAR toggled ON, #enemies and #allies DOM elements (pokemon cards) have been hidden via css classes.");
    } else if (sidebarToggleState === false) {
        sidebarElement.classList.remove('active');
        sidebarElement.classList.add('hidden');
        gameAppElement.classList.remove('sidebar-active');
        runningStatusElement.classList.remove('sidebar-active');
        bottomPanelElement.classList.remove('sidebar-active');

        allyCardDiv.classList.remove('hidden');
        enemyCardDiv.classList.remove('hidden');
        console.info("SIDEBAR toggled OFF, #enemies and #allies DOM elements (pokemon cards) have been shown again via css classes.");
    }
}

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

async function toggleSidebarPartyDisplay(partyID, state) {
    const sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`);
    sidebarPartyElement.classList.toggle('visible', state);
    sidebarPartyElement.classList.toggle('hidden', !state);
}

async function switchSidebarTypesDisplay(state) {
    const sidebarElement = document.getElementById('roguedex-sidebar');
    sidebarElement.classList.toggle('compactTypeDisplay', state);
    sidebarElement.classList.toggle('defaultTypeDisplay', !state);
}

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

async function dataMapping(pokemonLocation, divId, sessionData) {
    // const extensionSettings = await window.Utils.LocalStorage.getExtensionSettings();
    const modifiers = (pokemonLocation === "enemyParty" ? sessionData.enemyModifiers : sessionData.modifiers);

    await window.Utils.PokeMapper.getPokemonArray(sessionData[pokemonLocation], sessionData.arena, modifiers, pokemonLocation).then(async (pokemonData) => {
        weather = Object.hasOwn(pokemonData, 'weather') ? pokemonData.weather : null;
        const partyID = (pokemonLocation === "enemyParty" ? "enemies" : "allies");
        uiDataGlobals.activePokemonParties[partyID] = pokemonData;
        //const pIndex = getCyclicPageIndex(uiDataGlobals.pages[divId], pokemonData.pokemon.length);
        uiDataGlobals.pages[divId] = getCyclicPageIndex(uiDataGlobals.pages[divId], pokemonData.pokemon.length);

        await createCardsDiv(divId, pokemonData.pokemon, uiDataGlobals.pages[divId]).then(() => {
            scaleElements();
        });        

        if (!initStates.panelsInitialized) {
            initStates.panelsInitialized = true;
            createPanels(sessionData, pokemonData);           
        }        

        await renderSidebarPartyTemplate(sessionData, partyID);
        if (initStates.panelsInitialized) {            
            await updateBottomPanel(sessionData, pokemonData);
        }
    });
}

function getCyclicPageIndex(currentIndex, maxLength, increment = 0) {
    /* 
     *  Uses the modulo operator %. It gives you the remainder of a division operation,
     *  which can be used to wrap the number back to 0 when it exceeds the maximum value.
     *  Expects an array.length as maxLength, accounts for this length not being 0-based.
    */
    return (currentIndex + maxLength + increment) % maxLength
}

function extensionSettingsListener() {
    browserApi.storage.onChanged.addListener(async function (changes, namespace) {
        for (const [key, values = {oldValue, newValue}] of Object.entries(changes)) {
            if (key === 'showMinified') {
                const sessionData = window.Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
            }
            if (key === 'scaleFactor') {
                await scaleElements();
            }
            if (key === 'showEnemies') {
                const sessionData = window.Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
                await toggleSidebarPartyDisplay('enemies', values.newValue);
            }
            if (key === 'showParty') {
                const sessionData = window.Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
                await toggleSidebarPartyDisplay('allies', values.newValue);
            }
            if (key === 'showSidebar') {
                const sessionData = window.Utils.LocalStorage.getSessionData();
                await toggleSidebar();
            }
            if (key === 'sidebarPosition') {
                const sessionData = window.Utils.LocalStorage.getSessionData();
                await changeSidebarPosition(sessionData);
            }
            if (key === 'sidebarScaleFactor') {
                await scaleSidebarElements();
            }
            if (key === 'sidebarCompactTypes') {
                await switchSidebarTypesDisplay(values.newValue);
            }            
        }
    });
}

function listenForDataUiModeChange() {
    function observeTouchControls() {
        const touchControlsElement = document.getElementById('touchControls');
        if (touchControlsElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode') {
                        const newValue = touchControlsElement.getAttribute('data-ui-mode');
                        console.info('[data-ui-mode] new value:', newValue);

                        // Logic for handling data-ui-mode changes
                        if (newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
                            try {
                                window.Utils.LocalStorage.setSessionData();
                                const sessionData = window.Utils.LocalStorage.getSessionData();
                                if (sessionData && Object.keys(sessionData).length > 0) {                                    
                                    await initCreation(sessionData);
                                    initStates.sessionIntialized = true;
                                    updateExtensionStatus({sessionState: initStates.sessionIntialized});                                    
                                } else {
                                    console.warn("SessionData empty. 'initCreation(sessionData)' was skipped. UI won't work for the moment.");
                                    initStates.sessionIntialized = false;
                                    updateExtensionStatus({sessionState: initStates.sessionIntialized});
                                }                      
                            } catch (err) {
                                console.warn("Getting sessionData failed. UI won't work for the moment.");
                                console.error(err)
                            }
                        }
                        if (newValue === "SAVE_SLOT") {
                            window.Utils.LocalStorage.clearAllSessionData();
                            initStates.sessionIntialized = false;
                            updateExtensionStatus({sessionState: initStates.sessionIntialized});
                        }
                        if (newValue === "SAVE_SLOT" || newValue === "TITLE" || newValue === "MODIFIER_SELECT" || newValue === "STARTER_SELECT") {                            
                            deletePokemonCardWrappers();
                        }
                    }
                });
            });

            observer.observe(touchControlsElement, {attributes: true});
            // console.info('Touch control listener called');
        } else {
            console.error('Element with ID "touchControls" not found.');
            // Retry after a short delay if the element might be added later
            setTimeout(observeTouchControls, 1000);
        }
    }

    observeTouchControls();
}

function onElementAvailable(selector, callback) {
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

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

// Existing synchronous function to resize the bottom panel
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