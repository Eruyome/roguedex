/**
 * @fileoverview This content script is part of a browser extension. It includes functions for interacting with the UI,
 *      handling data-ui-mode changes, observing DOM elements, and adjusting UI elements based on canvas resizing.
 *      Specifically it creates and handles overlay cards with enemy and ally pokemon information, and optionally
 *      a sidebar and bottompanel the does the same and more.
 * @file 'src/content/content.js'
 */

scriptInjector();

function initializeRogueDex() {
    // Create and initialize the global `window.roguedex` object
    window.roguedex = {
        /* Ideally only bundle/import what is used.
         * lit-html: https://lit.dev/
         * Template rendering.
         * Templates and helper functions are prefixed with `window.roguedexLit.`, defined in "src/content/lit-templates/*.js".
        */
        /* eslint-disable */
        // Assign lit-html functions to roguedex object
        litHtml: window.roguedexLitHtml.html,
        litRender: window.roguedexLitHtml.render,
        litUnsafeHTML: window.roguedexLitHtml.unsafeHTML,
        litStyleMap: window.roguedexLitHtml.styleMap,
        
        /*  Add the rest when needed:
        litRef: window.roguedexLitHtml.ref,
        litUnsafeSVG: window.roguedexLitHtml.unsafeSVG,
        litTemplateContent: window.roguedexLitHtml.templateContent,
        litAsyncAppend: window.roguedexLitHtml.asyncAppend,
        litAsyncReplace: window.roguedexLitHtml.asyncReplace,
        litUntil: window.roguedexLitHtml.until,
        litLive: window.roguedexLitHtml.live,
        litGuard: window.roguedexLitHtml.guard,
        litCache: window.roguedexLitHtml.cache,
        litKeyed: window.roguedexLitHtml.keyed,
        litIfDefined: window.roguedexLitHtml.ifDefined,
        litRange: window.roguedexLitHtml.range,
        litRepeat: window.roguedexLitHtml.repeat,
        litJoin: window.roguedexLitHtml.join,
        litMap: window.roguedexLitHtml.map,
        litChoose: window.roguedexLitHtml.choose,
        litWhen: window.roguedexLitHtml.when,
        litClassMap: window.roguedexLitHtml.classMap,
        */
        /* eslint-enable */

        // Set initial environment and state data
        developmentENV: false,
        initStates: {
            panelsInitialized: false,
            cardsInitialized: false,
            resizeObserverInitialized: false,
            sessionIntialized: false,
        },

        // Initialize global UI state data
        uiData: {
            activePokemonParties: { enemies: {}, allies: {} },
            scrollbarWidth: window.roguedexLit.getScrollbarWidth(),
            isMobile: window.roguedexLit.mobileCheck(),
            wrapperDivPositions: {
                enemies: {
                    top: "0",
                    left: "0",
                    right: "auto",
                    opacity: "100",
                },
                allies: {
                    top: "0",
                    left: "auto",
                    right: "0",
                    opacity: "100",
                },
            },
            pages: {
                enemies: 0,
                allies: 0,
            },
        }
    };

    initCustomLogger();
    listenForDataUiModeChange();
    extensionSettingsListener();
    setDevEnv();
}

/**
 * Injects the utils.js script if it is not properly initialized.
 */
function scriptInjector() {
    if (!isUtilsProperlyInitialized()) {
        const scriptElem = document.createElement("script");
        scriptElem.src = browserApi.runtime.getURL("/content/utils.js");
        console.debug("[RogueDex] Browser api :", browserApi);
        console.debug("[RogueDex] UtilsClass url:", scriptElem.src);
        scriptElem.type = "module";
        (document.head || document.documentElement).appendChild(scriptElem);

        scriptElem.addEventListener("load", () => {
            console.debug("[RogueDex] window.RoguedexUtils:", window.RoguedexUtils);
            initUtilities();
            console.debug("[RogueDex] Utils script loaded.");
        });
    } else {
        console.debug("[RogueDex] Utils class is properly initialized.");
        // Call initUtilities directly if UtilsClass is already initialized
        initUtilities();
    }

    // Set CSS url variables in the :root pseudo-class
    const rarityHoloFadeUrl = browserApi.runtime.getURL("/images/foil/compressed/holo-fade.gif");
    const rarityHoloUrl = browserApi.runtime.getURL("/images/foil/compressed/holo.png");
    const extensionIcon = browserApi.runtime.getURL("/images/RogueDexIcon.png");
    document.documentElement.style.setProperty(
        "--extension-rarity-bg-image-holo-fade",
        `url(${rarityHoloFadeUrl})`
    );
    document.documentElement.style.setProperty("--extension-rarity-bg-image-holo", `url(${rarityHoloUrl})`);
    document.documentElement.style.setProperty("--extension-icon", `url(${extensionIcon})`);
}

/**
 * Checks if the UtilsClass is properly initialized.
 * @returns {boolean} True if UtilsClass is properly initialized, false otherwise.
 */
function isUtilsProperlyInitialized() {
    if (window.RoguedexUtils && window.RoguedexUtils instanceof UtilsClass) {
        // Check for expected properties and methods
        return typeof window.RoguedexUtils.init === "function" && typeof window.RoguedexUtils.injectScripts === "function";
    }
    return false;
}

/**
 * Initializes utility functions after the injected script is loaded.
 * Initializes some element states.
 *
 * @function initUtilities
 * @memberof scriptInjector
 */
function initUtilities() {
    if (window.RoguedexUtils && window.RoguedexUtils instanceof UtilsClass) {
        // Listen for 'isReadyChange' event to determine when all scripts are loaded
        window.RoguedexUtils.on("isReadyChange", () => {
            if (window.RoguedexUtils.isReady) {                
                initializeRogueDex();
                roguedexLogger.info("All Scripts Loaded!");

                // TODO: make sure this always works (formerly executed on localStorageClassReady)
                updateExtensionStatus();
                setInitialPokemonCardPosition("allies", 5, roguedex.uiData.scrollbarWidth, 1.5, 25);
                setInitialPokemonCardPosition("enemies", 5, roguedex.uiData.scrollbarWidth, 1.5, 25);
            } else {
                console.info("[RogueDex] Error Loading Scripts :(");
            }
        });

        // Call UtilsClass.init() to start the initialization process
        window.RoguedexUtils.init();
        window.RoguedexUtils.on("localStorageClassReady", () => {
           // updateExtensionStatus();
           // setInitialPokemonCardPosition("allies", 5, roguedex.uiData.scrollbarWidth, 1.5, 25);
           // setInitialPokemonCardPosition("enemies", 5, roguedex.uiData.scrollbarWidth, 1.5, 25);
        });
    } else {
        console.error("[RogueDex] UtilsClass is not properly initialized.");
    }
}

/**
 * @function initCustomLogger
 * @description Initializes the `roguedexLogger` object that wraps standard console methods and conditionally logs messages 
 * based on the value of the `window.roguedex.developmentENV` flag.
 * Use it like the default "console" logger.
 * 
 * The logger adds a "[RogueDex]" prefix to messages for all methods but only outputs `log`, `warn`, `debug`, `time`, `timeEnd`
 * when the `window.roguedex.developmentENV` flag is true.
 * 
 * Note: The `window.roguedex.developmentENV` flag is only set after loading the user settings. Some logs have to use the 
 * normal `console` logger instead because they run too early (before the whole Util classes init process).
 * Alternatively set the flag to true on declaration, use the custom logger and have it potentially set to false again
 * because of the chosen user settings.
 * 
 * @namespace roguedexLogger
 * @property {Function} log - Logs a message to the console if `developerENV` is true.
 * @property {Function} warn - Logs a warning to the console if `developerENV` is true.
 * @property {Function} debug - Logs a debug message to the console if `developerENV` is true.
 * @property {Function} error - Logs an error message to the console if `developerENV` is true.
 * @property {Function} info - Logs an info message to the console if `developerENV` is true.
 */

function initCustomLogger() {
    (function(global) {
        // Define a custom logger object
        const roguedexLogger = {};

        // List of logging methods with conditional behavior
        const conditionalMethods = ['log', 'warn', 'debug', 'time', 'timeEnd'];

        // List of logging methods with always-on behavior
        const alwaysOnMethods = ['error', 'info'];

        // Utility function to get the stack trace file information
        function getFileInfo() {
            const stack = new Error().stack;
            const stackLines = stack.split('\n');
            
            if (stackLines.length > 2) {
                // Extract relevant part of the stack trace using regex
                const match = stackLines[2].match(/([^\s]+:\d+:\d+)/);
                return match ? match[0] : '';
            }
            return '';
        }

        // Create custom logger functions for conditional methods
        conditionalMethods.forEach(method => {
            roguedexLogger[method] = function(...args) {
                // Check if developmentENV is true before logging
                if (window.roguedex && window.roguedex.developmentENV) {
                    // Add prefix
                    const prefix = '[RogueDex] ';
                    const fileInfo = getFileInfo();

                    // Add the prefix to the first argument if it's a string
                    if (typeof args[0] === 'string') {
                        args[0] = prefix + args[0];
                    } else {
                        // Insert prefix if the first argument is not a string
                        args.unshift(prefix);
                    }

                    // Add file info as the last argument if there's at least one argument
                    if (args.length > 0) {
                        args.push(fileInfo);
                    } else {
                        // If no arguments, create a new list with just prefix and fileInfo
                        args = [prefix, fileInfo];
                    }

                    // Use the original console method with the provided arguments
                    console[method](...args);
                }
            };
        });

        // Create custom logger functions for always-on methods
        alwaysOnMethods.forEach(method => {
            roguedexLogger[method] = function(...args) {
                // Add prefix
                const prefix = '[RogueDex] ';

                // Add the prefix to the first argument if it's a string
                if (typeof args[0] === 'string') {
                    args[0] = prefix + args[0];
                } else {
                    // Insert prefix if the first argument is not a string
                    args.unshift(prefix);
                }

                // Use the original console method with the provided arguments
                console[method](...args);
            };
        });

        // Attach the custom logger to the global scope with a unique name
        global.roguedexLogger = roguedexLogger;

    })(typeof window !== "undefined" ? window : global);
}

/**
 * Sets the initial position of a Pokemon card based on the card ID and various position parameters.
 *
 * @function setInitialPokemonCardPosition
 * @param {string} cardId - The ID of the Pokemon card.
 * @param {number} defaultYPos - The default Y position (top) of the card in pixels.
 * @param {number} scrollbarWidth - The width of the scrollbar in pixels.
 * @param {number} scrollbarMulti - A multiplier for the scrollbar width.
 * @param {number} scrollbarWidthFallback - A fallback width for the scrollbar in case the actual width is not provided.
 *
 * @returns {void}
 */
function setInitialPokemonCardPosition(
    cardId,
    defaultYPos,
    scrollbarWidth,
    scrollbarMulti,
    scrollbarWidthFallback
) {
    let storedPos;
    try {
        storedPos = window.RoguedexUtils.LocalStorage.getPokemonCardPosFromStorage(cardId);
    } catch (e) {
        roguedexLogger.error(e);
    }

    if (!storedPos?.x || !storedPos?.y) {
        roguedex.uiData.wrapperDivPositions[cardId].top = `${defaultYPos}px`;

        const horizontalPos = `${scrollbarWidth ? scrollbarWidth * scrollbarMulti : scrollbarWidthFallback}px`;
        if (cardId.toLowerCase() === "allies") {
            roguedex.uiData.wrapperDivPositions[cardId].right = horizontalPos;
            roguedex.uiData.wrapperDivPositions[cardId].left = "auto";
        } else {
            roguedex.uiData.wrapperDivPositions[cardId].right = "auto";
            roguedex.uiData.wrapperDivPositions[cardId].left = horizontalPos;
        }
    } else {
        // should be numbers, convert them to be sure
        const xPos = parseFloat(storedPos.x);
        const yPos = parseFloat(storedPos.y);
        roguedex.uiData.wrapperDivPositions[cardId].top = `${yPos}px`;
        roguedex.uiData.wrapperDivPositions[cardId].left = `${xPos}px`;
        roguedex.uiData.wrapperDivPositions[cardId].right = "auto";
    }
}

/**
 * Updates the status display of the extension and draws the settings hint icon.
 * Sets a click eventListener that opens the settings menu on mobile.
 * @function updateExtensionStatus
 * @param {Object} properties - The properties to update the status.
 * @memberof window
 */
async function updateExtensionStatus(properties) {
    const extensionSettings = await window.RoguedexUtils.LocalStorage.getExtensionSettings();
    let wrapper = document.getElementById("extension-status");

    if (!wrapper) {
        roguedex.litRender(
            roguedex.litHtml`<div
                class="text-base running-status"
                id="extension-status"
            ></div>`,
            document.body,
            { renderBefore: document.body.firstChild }
        );
        wrapper = document.getElementById("extension-status");
    }
    // Use an empty string if properties.text is '', a default value if null/undefined, otherwise use the provided value.
    const text = properties?.text === "" ? "" : (properties?.text ?? "RogueDex");
    // Uses 'unknown' when 'properties.sessionState' is null or undefined.
    const sessionState = properties?.sessionState ?? "dont-show";

    const extensionStatusHTML = window.roguedexLit.updateExtensionStatusElement({
        text,
        sessionState,
    });
    roguedex.litRender(extensionStatusHTML, wrapper);
    changeStatusbarPosition();

    if (extensionSettings.disableSettingsHint === false) {
        createSettingsHint();
        toggleSettingsHint(false);
    }

    // Add eventlistener to open the settings menu in a popup window. Mobile only.
    if (roguedex.uiData.isMobile) {
        const openOptions = document.getElementById('rd-status-text');
        if (openOptions && !openOptions.hasAttribute('data-listener-added')) {
            openOptions.addEventListener('click', () => {
                sendMessage({ action: 'showOptions' });
            });
            openOptions.setAttribute('data-listener-added', 'true'); // Mark the listener as added
        }

        function sendMessage(message) {
            if (typeof browser !== "undefined") {
                return browser.runtime.sendMessage(message)
                    .catch(error => {
                        roguedexLogger.error("Error sending message in Firefox:", error);
                        return {
                            success: false,
                            error,
                            errorMessage: error.message || "Unknown error"
                        };
                    });
            } else if (typeof chrome !== "undefined") {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            const error = new Error(chrome.runtime.lastError.message || "Unknown error");
                            error.details = chrome.runtime.lastError;
                            roguedexLogger.error("Error sending message in Chrome:", error);
                            reject(error);  // Rejecting with an Error instance
                        } else {
                            resolve(response);
                        }
                    });
                });
            } else {
                roguedexLogger.error("Unsupported browser environment!");
            }
        }
    }
}

/**
 * Creates an icon that serves as a hint/reminder to open the settings menu, and how to.
 * @function createSettingsHint
 */
async function createSettingsHint() {
    const settingsHintElement = window.roguedexLit.createSettingsHintElement(roguedex.uiData.isMobile);
    roguedex.litRender(settingsHintElement, document.body);
}

/**
 * Enables dragging functionality for pokemon cards.
 * @function enableDragCardElement
 * @param {HTMLElement} elmnt - The element to enable dragging for.
 */
function enableDragCardElement(elmnt) {
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;

    // Attach the pointerdown event handler
    elmnt.onpointerdown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.type === "submit" || e.target.type === "range") return;
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
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        elmnt.style.right = "auto";
    }

    function stopDragging() {
        document.onpointerup = null;
        document.onpointermove = null;
        updateCardElementPosition(elmnt);
    }
}

/**
 * Makes sure that the element is fully visible in the viewport and saves it's position to a temporary object and to local storage.
 *
 * @function updateElementPosition
 * @param {HTMLElement} element - The element to be repositioned and saved.
 */
function updateCardElementPosition(elmnt) {
    repositionElementWithinViewport(elmnt, roguedex.uiData.scrollbarWidth * 1.5);
    saveCardWrapperPositions(elmnt.id, {
        top: elmnt.style.top,
        left: elmnt.style.left,
        right: elmnt.style.right,
    });
}

/**
 * Repositions the specified element within the browser viewport while maintaining a specified margin from the right and bottom edges (to avoid scrollbars).
 *
 * @function repositionElementWithinViewport
 * @param {HTMLElement} element - The element to be repositioned.
 * @param {number} [marginFromEdge=0] - The margin in pixels to maintain from the bottom and right edges of the viewport.
 */
function repositionElementWithinViewport(element, marginFromEdge = 0) {
    // Get element's bounding rectangle
    const rect = element.getBoundingClientRect();

    // Calculate necessary adjustments based on viewport size and element dimensions
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    // Calculate new position to keep the margin from the viewport edge
    let newTop = rect.top;
    let newLeft = rect.left;

    // Adjust top position if element is partially or fully above the viewport
    if (rect.top < 0) {
        newTop = 0;
    }

    // Adjust left position if element is partially or fully to the left of the viewport
    if (rect.left < 0) {
        newLeft = 0;
    }

    // Adjust bottom position if element is partially or fully below the viewport
    if (rect.bottom > viewportHeight) {
        newTop = viewportHeight - rect.height - marginFromEdge;
    }

    // Adjust right position if element is partially or fully to the right of the viewport
    if (rect.right > viewportWidth) {
        newLeft = viewportWidth - rect.width - marginFromEdge;
    }

    // Apply new position to the element
    element.style.top = `${newTop}px`;
    element.style.left = `${newLeft}px`;
}

/**
 * Initializes Pokemon card wrapper elements on the webpage.
 * @function initPokemonCardWrappers
 * @param {boolean} [showSidebar=false] - The state of the sidebar.
 * @param {string} [id1="enemies"] - The ID of the first wrapper.
 * @param {string} [id2="allies"] - The ID of the second wrapper.
 */
function initPokemonCardWrappers(showSidebar = false, id1 = "enemies", id2 = "allies") {
    return new Promise((resolve) => {
        const initialize = async () => {
            if (roguedex.initStates.cardsInitialized && document.getElementById(id1) && document.getElementById(id2)) {
                resolve();
                return;
            }

            const enemiesWrapper = window.roguedexLit.createCardWrapper(id1, showSidebar);
            const alliesWrapper = window.roguedexLit.createCardWrapper(id2, showSidebar);

            const body = document.body;

            // Render the elements
            roguedex.litRender(enemiesWrapper, body, { renderBefore: body.firstChild });
            roguedex.litRender(alliesWrapper, body, { renderBefore: body.firstChild });

            // Move the rendered elements to be the last children of the body
            const enemies = body.querySelector(`#${id1}`);
            const allies = body.querySelector(`#${id2}`);
            body.appendChild(enemies);
            body.appendChild(allies);

            // Initialize drag functionality
            const newWrapper1 = document.getElementById(id1);
            const newWrapper2 = document.getElementById(id2);
            if (newWrapper1) {
                enableDragCardElement(newWrapper1);
            }
            if (newWrapper2) {
                enableDragCardElement(newWrapper2);
            }

            // Optional console logs
            const debug = false;
            if (debug) {
                roguedexLogger.log(`${id1} pokemon card wrapper created:`, newWrapper1);
                roguedexLogger.log(`${id2} pokemon card wrapper created:`, newWrapper2);
            }

            roguedex.initStates.cardsInitialized = true;

            resolve();
        };

        initialize();
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
        roguedexLogger.warn(`Tried to delete element with id ${id1}, not found.`);
    }

    if (alliesWrapper) {
        alliesWrapper.remove();
    } else {
        roguedexLogger.warn(`Tried to delete element with id ${id2}, not found.`);
    }

    roguedex.initStates.cardsInitialized = false;
}

/**
 * Changes the opacity of pokemon cards.
 * @function changePokemonCardOpacity
 * @param {Array} elementIds - Id list of target elements.
 * @param {Integer} value - Value to change opacity to (0 - 100%).
 */
function changePokemonCardOpacity(elementIds, value) {
    const opacity = value / 100;

    elementIds.forEach((divId) => {
        const div = document.getElementById(divId);
        if (div) {
            roguedex.uiData.wrapperDivPositions[divId].opacity = value;
            div.style.opacity = `${opacity}`;
        } else {
            roguedexLogger.error(`Change Pokemon Card Opacity: Element with ID '${divId}' not found.`);
        }
    });
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

    const partySize = roguedex.uiData.activePokemonParties[partyId].pokemon.length;

    // If no Pokemon in the party, initialize creation
    if (partySize === 0) {
        const sessionData = window.RoguedexUtils.LocalStorage.getSessionData();
        await initCreation(sessionData);
    } else if (partySize <= 1) {
        // Skip if only one Pokemon in the party
        // No need to change the page
        return;
    }

    // Update page index based on direction
    if (direction === "up" || direction === "down") {
        roguedex.uiData.pages[divId] = getCyclicPageIndex(
            roguedex.uiData.pages[divId],
            partySize,
            direction === "up" ? -1 : 1
        );
    } else {
        roguedexLogger.error(`Invalid direction: ${direction}`);
        return;
    }

    await createCardsDiv(partyId, pokemonData, roguedex.uiData.pages[divId]);
}

/**
 * Chooses the type of Pokemon card to create (normal/big or minified).
 * @function chooseCardType
 * @async
 * @param {string} divId - The ID of the wrapper div.
 * @param {Object} pokemon - The Pokemon data.
 * @param {string} weather - The weather condition.
 * @param {boolean} minified - Flag indicating if the card should be minified.
 * @param {boolean} showMiniCardTypes - Flag indicating if the minified cards type effectivenesses should be shown.
 * @returns {Promise<Lit-HTML-Template>} - The created Pokemon card template.
 */
async function chooseCardType(divId, pokemon, weather, minified, showMiniCardTypes) {
    if (minified) {
        return await createPokemonCardDivMinified(divId, pokemon, weather, showMiniCardTypes);
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
    const extensionSettings = await window.RoguedexUtils.LocalStorage.getExtensionSettings();
    const top = roguedex.uiData.wrapperDivPositions[divId]?.top || "10px";
    const left =
        roguedex.uiData.wrapperDivPositions[divId]?.left ||
        `${roguedex.uiData.scrollbarWidth ? roguedex.uiData.scrollbarWidth : "18"}px`;
    const right = roguedex.uiData.wrapperDivPositions[divId]?.right || "auto";
    const opacity = `${Number(roguedex.uiData.wrapperDivPositions[divId]?.opacity || 100) / 100}`;
    const weather = pokemonData.weather;

    return chooseCardType(
        divId,
        pokemon,
        weather,
        extensionSettings.showMinified,
        extensionSettings.showMiniCardTypes
    ).then(async (cardObj) => {
        const additionalParams = [divId, pokemonData];
        const buttonsObj = window.roguedexLit.createArrowButtonsDiv(
            divId,
            "↑",
            "↓",
            extensionSettings.showMinified,
            changePokemonCardPage,
            ...additionalParams
        );

        const content = roguedex.litHtml` ${buttonsObj.html} ${cardObj.html} `;

        await updateCardWrapper(divId, top, left, right, opacity, content, extensionSettings.showSidebar);
        window.RoguedexUtils.PokemonIconDrawer.getPokemonIcon(pokemon, divId);
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
 * @param {Lit-HTML-Template} content - The content to render in the wrapper.
 * @param {boolean} [showSidebar=false] - Flag indicating if the sidebar should be shown.
 */
async function updateCardWrapper(divId, top, left, right, opacity, content, showSidebar = false) {
    const existingWrapper = document.getElementById(divId);

    if (existingWrapper) {
        setElementProperties(existingWrapper, {
            top,
            left,
            right: right || "auto",
            opacity,
        });
        roguedex.litRender(content, existingWrapper);
    } else {
        await initPokemonCardWrappers(showSidebar);
        const newWrapper = document.getElementById(divId);
        newWrapper.style.position = "absolute";
        setElementProperties(existingWrapper, { top, left, right, opacity });
        roguedex.litRender(content, newWrapper);
    }

    const updatedWrapper = document.getElementById(divId);
    if (window.getComputedStyle(updatedWrapper).display !== "none") {
        updateCardElementPosition(updatedWrapper);
    }
}

/**
 * Saves the position properties of a card element.
 * @function saveCardWrapperPositions
 * @param {string} divId - The ID of the wrapper div.
 * @param {Object} properties - The position properties to save.
 */
function saveCardWrapperPositions(divId, properties) {
    Object.keys(properties).forEach((prop) => {
        roguedex.uiData.wrapperDivPositions[divId][prop] = properties[prop];
    });

    window.RoguedexUtils.LocalStorage.savePokemonCardPosToStorage(
        divId,
        parseFloat(properties.left),
        parseFloat(properties.top)
    );
}

/**
 * Sets properties for an HTML element.
 * @function setElementProperties
 * @param {HTMLElement} element - The HTML element to set properties for.
 * @param {Object} properties - The properties to set.
 */
function setElementProperties(element, properties) {
    if (element) {
        Object.keys(properties).forEach((prop) => {
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
 * @param {boolean} showMiniCardTypes - Flag indicating whether the type effectivenesses should be shown.
 * @returns {Promise<Lit-HTML-Template>} - The created minified Pokemon card template.
 */
async function createPokemonCardDivMinified(cardId, pokemon, weather, showMiniCardTypes) {
    const savedData = await window.RoguedexUtils.LocalStorage.getPlayerData();
    const dexData = savedData.dexData;
    const simpleDisplay = cardId.toLowerCase() === "allies";
    const ivsGeneratedHTML = window.roguedexLit.generateCardIVsHTML(pokemon, dexData, simpleDisplay);

    return {
        html: window.roguedexLit.createPokemonCardContentMinified(
            cardId,
            pokemon,
            ivsGeneratedHTML,
            weather,
            showMiniCardTypes,
            roguedex.uiData.isMobile
        ),
    };
}

/**
 * Creates a full-size Pokemon card template.
 * @function createPokemonCardDiv
 * @async
 * @param {string} cardId - The ID of the card.
 * @param {Object} pokemon - The Pokemon data.
 * @param {string} weather - The weather condition.
 * @returns {Promise<Lit-HTML-Template>} - The created full-size Pokemon card template.
 */
async function createPokemonCardDiv(cardId, pokemon, weather) {
    const typeEffectivenessHTML = window.roguedexLit.createTypeEffectivenessWrapper(pokemon.typeEffectiveness);

    return {
        html: window.roguedexLit.createPokemonCardContent(
            cardId,
            pokemon,
            typeEffectivenessHTML,
            weather,
            roguedex.uiData.isMobile
        ),
    };
}

/**
 * Creates the sidebar and bottom panel elements.
 * Binds click controls to switch between showing IVs and movesets.
 * @function createPanels
 */
function createPanels() {
    const sidebarTemplate = window.roguedexLit.createSidebarTemplate(roguedex.uiData.isMobile);
    const bottomPanelTemplate = window.roguedexLit.createBottomPanelTemplate();

    roguedex.litRender(sidebarTemplate, document.body, {
        renderBefore: document.body.firstChild,
    });
    roguedex.litRender(bottomPanelTemplate, document.body, { renderBefore: null });

    onElementAvailable("#roguedex-bottom-panel", () => {
        observeGameCanvasResize();
    });

    onElementAvailable("#sidebar-switch-iv-moves", () => {
        // eslint-disable-next-line no-unused-vars
        const uiControllerSwitchIVsMovesetDisplay = new UIController(
            sidebarSwitchBetweenIVsAndMoveset,
            "#sidebar-switch-iv-moves",
            { bindMouse: true, bindKeyboard: false, bindGamepad: false }
        );
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
async function renderSidebarPartyTemplate(
    sessionData,
    partyID,
    maxPokemonForDetailedView = null,
    breakpointOverridePartyDisplay = null
) {
    const savedData = window.RoguedexUtils.LocalStorage.getPlayerData();
    const pokeData = roguedex.uiData.activePokemonParties[partyID];
    const sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`);

    if (pokeData?.pokemon?.length) {
        const condensedView = await adjustSidebarView(
            maxPokemonForDetailedView,
            breakpointOverridePartyDisplay
        );
        const partyTemplate = window.roguedexLit.createSidebarPartyTemplate(
            pokeData,
            partyID,
            savedData.dexData,
            sessionData,
            condensedView,
            roguedex.uiData.isMobile
        );
        roguedex.litRender(partyTemplate, sidebarPartyElement);

        for (const [i, value] of pokeData.pokemon.entries()) {
            window.RoguedexUtils.PokemonIconDrawer.getPokemonIcon(value, `sidebar_${partyID}_${i}`);
        }
    }

    const headerElement = document.getElementById(`sidebar-header`);
    const headerTemplate = window.roguedexLit.updateSidebarHeader(sessionData);
    roguedex.litRender(headerTemplate, headerElement);
}

/**
 * Adjusts the sidebar view based on the number of Pokémon in the sidebar and the specified breakpoints.
 *
 * @param {number|null} maxPokemonForDetailedView - The maximum number of Pokémon in the sidebar at which the view should be switched to a more condensed/smaller one. If null, the value is fetched from the extension settings.
 * @param {number|null} breakpointOverridePartyDisplay - The breakpoint of Pokémon in the sidebar at which the ally party should be hidden. If null, the value is fetched from the extension settings.
 * @returns {Promise<string>} - Returns a promise that resolves to a string indicating the condensed view state, will be used as css slass in some cases.
 */
async function adjustSidebarView(maxPokemonForDetailedView, breakpointOverridePartyDisplay) {
    const extensionSettings = await window.RoguedexUtils.LocalStorage.getExtensionSettings();
    const showParty = extensionSettings.showParty;

    if (maxPokemonForDetailedView === null) {
        // breakpoint of pokemon in the sidebar at both party views should be switched to a more condensed/smaller one.
        maxPokemonForDetailedView = extensionSettings.sidebarCondenseBreakpoint;
    }
    if (breakpointOverridePartyDisplay === null) {
        // breakpoint of pokemon in the sidebar at which the ally party should be hidden.
        breakpointOverridePartyDisplay = extensionSettings.sidebarHideAlliesBreakpoint;
    }
    // roguedexLogger.log('maxPokemonForDetailedView: ', maxPokemonForDetailedView, 'breakpointOverridePartyDisplay: ', breakpointOverridePartyDisplay)

    const enemyCount = roguedex.uiData.activePokemonParties.enemies?.pokemon?.length ?? 0; // return 0 if undefined
    const allyCount = roguedex.uiData.activePokemonParties.allies?.pokemon?.length ?? 0; // return 0 if undefined

    const totalPartySize = enemyCount + allyCount;
    const overridePartyDisplayState = totalPartySize >= breakpointOverridePartyDisplay; // returns a boolean value (true/false)
    const displayedPartySize =
        enemyCount + (showParty && overridePartyDisplayState === false ? allyCount : 0);
    // roguedexLogger.log('totalPartySize: ', totalPartySize, 'displayedPartySize: ', displayedPartySize, 'showParty: ', showParty, 'overridePartyDisplayState: ', overridePartyDisplayState)

    let condensedView = "";
    if (overridePartyDisplayState === false && totalPartySize <= maxPokemonForDetailedView) {
        /* Don't forcefully hide ally party; breakpoint not reached (total number of pokemon in the sidebar).
         * Total number of currently displayed pokemon is fine; breakpoint to switch to condensed view not reached.
         * Reset previously set temporary states, uses defaults according to user settings.
         */
        await toggleSidebarPartyDisplay("allies", showParty);
        switchSidebarTypesDisplay(extensionSettings.sidebarCompactTypes);
        condensedView = "";
    } else if (overridePartyDisplayState === false && totalPartySize > maxPokemonForDetailedView) {
        // too many pokemon, no override to hide allies; change to defaultView + condensed
        /* Don't forcefully hide ally party; breakpoint not reached (total number of pokemon in the sidebar).
         * Total number of currently displayed pokemon too high; breakpoint to switch to condensed reached.
         */
        switchSidebarTypesDisplay(false);
        await toggleSidebarPartyDisplay("allies", showParty);
        condensedView = "condensed";
    } else if (overridePartyDisplayState === true && displayedPartySize > maxPokemonForDetailedView) {
        /* Forcefully hide ally party because breakpoint reached (total number of pokemon in the sidebar).
         * This reduces the number of currently displayed pokemon; breakpoint to switch to condensed reached despite of that.
         */
        await toggleSidebarPartyDisplay("allies", false);
        switchSidebarTypesDisplay(extensionSettings.sidebarCompactTypes);
    } else if (overridePartyDisplayState === true && displayedPartySize < maxPokemonForDetailedView) {
        /* Forcefully hide ally party because breakpoint reached (total number of pokemon in the sidebar).
         * This reduces the number of currently displayed pokemon; breakpoint to switch to condensed view not reached because of that.
         */
        await toggleSidebarPartyDisplay("allies", false);
        switchSidebarTypesDisplay(extensionSettings.sidebarCompactTypes);
        condensedView = "";
    }

    return condensedView;
}

/**
 * Toggles the 'condensed' CSS class on every .pokemon-entry element based on the given view state.
 *
 * @param {string} condensedView - The view state indicating whether to apply the condensed class. If the value is 'condensed', the class will be added; otherwise, it will be removed.
 */
function toggleCondensedSidebarView(condensedView) {
    const pokemonEntries = document.querySelectorAll(".pokemon-entry");
    pokemonEntries.forEach((entry) => {
        entry.classList.toggle("condensed", condensedView.toLowerCase() === "condensed");
    });
}

/**
 * Toggles between displaying IVs and movesets in the sidebar.
 * @function sidebarSwitchBetweenIVsAndMoveset
 * @async
 */
async function sidebarSwitchBetweenIVsAndMoveset() {
    const sidebarElement = document.getElementById("roguedex-sidebar");

    const currentInfo = sidebarElement.dataset.shownPokemonTextInfo || "ivs";
    const newInfo = currentInfo === "ivs" ? "movesets" : "ivs";

    sidebarElement.dataset.shownPokemonTextInfo = newInfo;
    sidebarElement.classList.toggle("hideIVs", newInfo !== "ivs");
    sidebarElement.classList.toggle("hideMoveset", newInfo !== "movesets");
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
    if (partyID.toLowerCase() === "enemies") {
        return;
    }

    const bottomPanelElement = document.getElementById("roguedex-bottom-panel");

    const showTab = (tabId) => {
        window.roguedexLit.updateActiveTab(tabId);
    };
    const template = window.roguedexLit.createBottomPanelContentTemplate(sessionData, pokemonData, showTab);
    roguedex.litRender(template, bottomPanelElement);
    const activeTabId = window.roguedexLit.getActiveTab();

    if (!activeTabId) {
        showTab("bottom-panel-global");
    }
}

/**
 * Calls all scaling functions (overlay, sidebar, bottom panel).
 * @function scaleAllElements
 * @param {boolean} overlay - Flag that indicates whether the overlay should be scaled.
 * @param {boolean} sidebar - Flag that indicates whether the sidebar should be scaled.
 * @param {boolean} bottomPanel - Flag that indicates whether the bottomPanel should be scaled.
 * @async
 */
async function scaleAllElements(overlay = true, sidebar = true, bottomPanel = true) {
    if (overlay) {
        scaleOverlayElements();
    }
    if (sidebar) {
        scaleSidebarElements();
    }
    if (bottomPanel) {
        scaleBottomPanelElements();
    }
}

/**
 * Scales elements based on the window size.
 * @function scaleOverlayElements
 * @async
 */
async function scaleOverlayElements() {
    const scaleFactorMulti = await getScaleFactor("scaleFactor", 1);
    const scaleFactor = await calculateScaleFactor();

    const enemiesDiv = document.getElementById("enemies");
    const alliesDiv = document.getElementById("allies");

    scaleFont(enemiesDiv, scaleFactor, scaleFactorMulti);
    scaleFont(alliesDiv, scaleFactor, scaleFactorMulti);
    // roguedexLogger.debug("POKEMON CARDS scaled.", "scaleFactor: ", scaleFactorMulti, "scaleFactor: ", scaleFactorMulti);
}

/**
 * Scales sidebar elements based on the window size.
 * @function scaleSidebarElements
 * @async
 */
async function scaleSidebarElements() {
    const scaleFactorMulti = await getScaleFactor("sidebarScaleFactor", 1);
    const scaleFactor = await calculateScaleFactor();

    const sidebarDiv = document.getElementById("roguedex-sidebar");
    scaleFont(sidebarDiv, scaleFactor, scaleFactorMulti);
    // roguedexLogger.debug("SIDEBAR scaled.", "scaleFactor: ", scaleFactorMulti, "scaleFactor: ", scaleFactorMulti);
}

/**
 * Scales bottom panel elements based on the window size.
 * @function scaleBottomPanelElements
 * @async
 */
async function scaleBottomPanelElements() {
    const scaleFactorMulti = await getScaleFactor("bottompanelScaleFactor", 1);
    const scaleFactor = await calculateScaleFactor();

    const bottomPanelDiv = document.getElementById("roguedex-bottom-panel");
    scaleFont(bottomPanelDiv, scaleFactor, scaleFactorMulti);
    // roguedexLogger.debug("BOTTOM PANEL scaled.", "scaleFactor: ", scaleFactorMulti, "scaleFactor: ", scaleFactorMulti);
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
function scaleFont(element, scaleFactor, scaleFactorMulti) {
    const bodyElement = document.body;
    const computedStyle = window.getComputedStyle(bodyElement);
    const baseFontSize = computedStyle.fontSize;
    const baseFontSizeNumber = Math.round(parseFloat(baseFontSize));
    let newFontSize = baseFontSizeNumber * scaleFactor * scaleFactorMulti;
    newFontSize = Math.round(newFontSize);

    element.style.fontSize = `${newFontSize}px`;
}

/**
 * Calculates the scale factor based on the window size.
 * @function calculateScaleFactor
 * @async
 * @returns {Promise<number>} - The calculated scale factor.
 */
async function calculateScaleFactor() {
    const baseWidth = window.screen.width;
    const baseHeight = window.screen.height;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactorWidth = currentWidth / baseWidth;
    const scaleFactorHeight = currentHeight / baseHeight;

    // Calculate the minimum scale factor
    let scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

    // Round to the nearest decimal
    scaleFactor = Math.round(scaleFactor * 10) / 10;

    // Check if within 0.15 of any full integer
    const roundedToNearestInteger = Math.round(scaleFactor);
    if (Math.abs(scaleFactor - roundedToNearestInteger) <= 0.15) {
        scaleFactor = roundedToNearestInteger;
    }

    return scaleFactor;
}

/**
 * Toggles the sidebar visibility, shows/hides some other UI elements and changes the properties of others
 * to make the UI work well with a displayed sidebar and bottompanel.
 * @function toggleSidebar
 * @async
 */
async function toggleSidebar() {
    const { showSidebar } = await browserApi.storage.sync.get("showSidebar");
    const sidebarElement = document.querySelector("#roguedex-sidebar");
    const bottomPanelElement = document.querySelector("#roguedex-bottom-panel");
    const gameAppElement = document.querySelector("#app");
    const runningStatusElement = document.querySelector(".running-status");
    const enemyCardDiv = document.querySelector("#enemies");
    const allyCardDiv = document.querySelector("#allies");

    const toggleClasses = (element, active, isSidebar = false) => {
        try {
            if (!element) {
                // throw new Error("Element does not exist");
                roguedexLogger.error("toggleSidebar(): Element does not exist:", element);
            }
            if (isSidebar) {
                element.classList.toggle("active", active);
                element.classList.toggle("hidden", !active);
            } else {
                element.classList.toggle("active-because-sidebar-hidden", active);
                element.classList.toggle("hidden-because-sidebar-active", !active);
            }
        } catch (error) {
            roguedexLogger.error("Error toggling classes:", error.message, error);
        }
    };

    if (showSidebar) {
        toggleClasses(sidebarElement, true, true);
        gameAppElement.classList.add("sidebar-active");
        runningStatusElement.classList.add("sidebar-active");
        changeStatusbarPosition("Bottom");
        bottomPanelElement.classList.add("sidebar-active");
        toggleClasses(allyCardDiv, false);
        toggleClasses(enemyCardDiv, false);
        roguedexLogger.debug(
            "SIDEBAR toggled ON, #enemies and #allies DOM elements (pokemon cards) have been hidden via css classes."
        );
    } else {
        toggleClasses(sidebarElement, false, true);
        gameAppElement.classList.remove("sidebar-active");
        runningStatusElement.classList.remove("sidebar-active");
        changeStatusbarPosition();
        bottomPanelElement.classList.remove("sidebar-active");
        toggleClasses(allyCardDiv, true);
        toggleClasses(enemyCardDiv, true);
        roguedexLogger.debug(
            "SIDEBAR toggled OFF, #enemies and #allies DOM elements (pokemon cards) have been shown again via css classes."
        );
    }
}

/**
 * Changes the position of the sidebar (left, right of the game app).
 * @function changeSidebarPosition
 * @async
 */
async function changeSidebarPosition() {
    const { sidebarPosition: newPosition } = await browserApi.storage.sync.get("sidebarPosition");
    const sidebarParentElement = document.body;
    const bottomPanelElement = document.getElementById("roguedex-bottom-panel");
    const pokerogueTncLinksElement = document.getElementById("tnc-links"); // not part of this extension, added by pokerogue

    // Remove old positions
    ["Left", "Right"].forEach((oldPosition) => {
        sidebarParentElement?.classList.remove(`sidebar-${oldPosition}`);
        bottomPanelElement?.classList.remove(`sidebar-${oldPosition}`);
        pokerogueTncLinksElement?.classList.remove(`sidebar-${oldPosition}`);
    });

    // Add new position
    sidebarParentElement?.classList.add(`sidebar-${newPosition}`);
    bottomPanelElement?.classList.add(`sidebar-${newPosition}`);
    pokerogueTncLinksElement?.classList.add(`sidebar-${newPosition}`);
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
    sidebarPartyElement?.classList.toggle("visible", state);
    sidebarPartyElement?.classList.toggle("hidden", !state);

    const moveIvSwitchElement = document.getElementById("sidebar-switch-iv-moves");
    moveIvSwitchElement?.classList.toggle("visible", state);
    moveIvSwitchElement?.classList.toggle("hidden", !state);
}

/**
 * Toggles the display of a card overlay party (enemies/allies).
 * @function togglePokemonCardDisplay
 * @async
 * @param {string} partyID - The ID of the party ('enemies' or 'allies').
 * @param {boolean} state - The desired display state.
 */
async function togglePokemonCardDisplay(partyID, state) {
    const pokemonCardElement = document.getElementById(`${partyID}`);
    pokemonCardElement?.classList.toggle("visible", state); // no css apllied, added for clarity
    pokemonCardElement?.classList.toggle("disabled", !state);
}

/**
 * Toggles the display of a minified card overlays type effectivenesses.
 * @function toggleMiniCardTypes
 * @param {boolean} state - The desired display state.
 */
function toggleMiniCardTypes(state) {
    const cardTypeWrapperElements = document.querySelectorAll(
        ".pokemon-card .pokemon-type-effectiveness-wrapper"
    );
    cardTypeWrapperElements.forEach((element) => {
        if (state) {
            element.classList.add("visible"); // no css apllied, added for clarity
            element.classList.remove("disabled");
        } else {
            element.classList.add("disabled"); // no css apllied, added for clarity
            element.classList.remove("visible");
        }
    });
}

/**
 * Switches between compact and default types display in the sidebar.
 * @function switchSidebarTypesDisplay
 * @async
 * @param {boolean} state - The desired display state.
 */
async function switchSidebarTypesDisplay(state) {
    const sidebarElement = document.getElementById("roguedex-sidebar");
    sidebarElement?.classList.toggle("compactTypeDisplay", state);
    sidebarElement?.classList.toggle("defaultTypeDisplay", !state);
}

/**
 * Changes the position of the extension statusbar (top, bottom).
 * @function changeStatusbarPosition
 * @param {string} forcePosition - Force top or bottom position, no matter the user settings.
 * @async
 */
async function changeStatusbarPosition() {
    let { statusbarPosition: newPosition } = await browserApi.storage.sync.get("statusbarPosition");

    const sidebarElement = document.getElementById("roguedex-sidebar");
    try {
        const sidebarVisible = window.getComputedStyle(sidebarElement).display !== "none";
        if (sidebarVisible) {
            newPosition = "Bottom";
        }
    } catch {}
    const statusbarElement = document.getElementById("extension-status");

    // Remove old position
    ["Top", "Bottom"].forEach((oldPosition) => {
        statusbarElement?.classList.remove(`statusbar-${oldPosition}`);
    });
    // Add new position
    statusbarElement?.classList.add(`statusbar-${newPosition}`);
}

/**
 * Toggles the display of the settings hint icon.
 * @function toggleSettingsHint
 * @async
 * @param {boolean} state - The desired display state; false = shown; true = hidden.
 */
async function toggleSettingsHint(state) {
    const settingsHintElement = document.getElementById("rd-settings-hint");
    if (!settingsHintElement && state === false) {
        await createSettingsHint();
    }
    if (settingsHintElement) {
        settingsHintElement.classList.toggle("visible", !state); // no css apllied, added for clarity
        settingsHintElement.classList.toggle("disabled", state);
    }
}

/**
 * Initializes the UI creation process and some of its updating processes.
 * @function initCreation
 * @async
 * @param {Object} sessionData - The session data.
 * @param {boolean} scaleUI - Whether the UI scaling function should be triggered, true by default.
 */
async function initCreation(sessionData, scaleUI = true) {
    const extensionSettings = await window.RoguedexUtils.LocalStorage.getExtensionSettings();

    await initPokemonCardWrappers(extensionSettings.showSidebar);
    if (extensionSettings.showEnemies) {
        await dataMapping("enemyParty", "enemies", sessionData, scaleUI);
    }
    if (extensionSettings.showParty) {
        await dataMapping("party", "allies", sessionData, scaleUI);
    }
    toggleMiniCardTypes(extensionSettings.showMiniCardTypes);

    if (extensionSettings.showSidebar) {
        await toggleSidebar(sessionData);
        await changeSidebarPosition(sessionData);
    }
    await switchSidebarTypesDisplay(extensionSettings.sidebarCompactTypes);
}

/**
 * Creates arrays of pokemon objects for either the enemy or ally party. Data is taken from sessionData and processed
 * by the class window.RoguedexUtils.PokeMapper.
 * @function dataMapping
 * @async
 * @param {string} pokemonLocation - The location of the Pokémon data ('enemyParty' or 'party').
 * @param {string} divId - The ID of the div.
 * @param {Object} sessionData - The session data.
 */
async function dataMapping(pokemonLocation, divId, sessionData, scaleUI) {
    const modifiers = pokemonLocation === "enemyParty" ? sessionData.enemyModifiers : sessionData.modifiers;

    try {
        const pokemonData = await window.RoguedexUtils.PokeMapper.getPokemonArray(
            sessionData[pokemonLocation],
            sessionData.arena,
            modifiers,
            pokemonLocation
        );
        const partyID = pokemonLocation === "enemyParty" ? "enemies" : "allies";

        roguedex.uiData.activePokemonParties[partyID] = pokemonData;
        roguedex.uiData.pages[divId] = getCyclicPageIndex(
            roguedex.uiData.pages[divId],
            pokemonData.pokemon.length
        );

        await new Promise((resolve) => {
            createCardsDiv(divId, pokemonData.pokemon, roguedex.uiData.pages[divId]);
            resolve();
        });

        if (!roguedex.initStates.panelsInitialized) {
            roguedex.initStates.panelsInitialized = true;
            createPanels();
        }

        await renderSidebarPartyTemplate(sessionData, partyID);

        if (roguedex.initStates.panelsInitialized) {
            await updateBottomPanel(sessionData, pokemonData);
            scaleBottomPanelElements();
        }

        if (scaleUI) {
            scaleAllElements(true, true, roguedex.initStates.panelsInitialized);
        }
    } catch (error) {
        roguedexLogger.error("Error occurred during pokemon data mapping:", error);
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
    return (currentIndex + maxLength + increment) % maxLength;
}

/**
 * Listens for changes in extension settings.
 * @function extensionSettingsListener
 */
function extensionSettingsListener() {
    browserApi.storage.onChanged.addListener(async function (changes) {
        const sessionData = window.RoguedexUtils.LocalStorage.getSessionData();

        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (oldValue === newValue) {
                continue;
            }
            switch (key) {
                case "showMinified":
                    await initCreation(sessionData);
                    break;
                case "showMiniCardTypes":
                    toggleMiniCardTypes(newValue);
                    break;
                case "overlayOpacity":
                    changePokemonCardOpacity(["enemies", "allies"], newValue);
                    break;
                case "scaleFactor":
                    await scaleOverlayElements();
                    break;
                case "showEnemies":
                    await initCreation(sessionData);
                    await toggleSidebarPartyDisplay("enemies", newValue);
                    await togglePokemonCardDisplay("enemies", newValue);
                    break;
                case "showParty":
                    await initCreation(sessionData);
                    await toggleSidebarPartyDisplay("allies", newValue);
                    await togglePokemonCardDisplay("allies", newValue);
                    break;
                case "showSidebar":
                    await toggleSidebar();
                    await initCreation(sessionData, false); // lazy way to make sure that all canvases are drawn
                    break;
                case "sidebarPosition":
                    await changeSidebarPosition();
                    break;
                case "sidebarScaleFactor":
                    await scaleSidebarElements();
                    break;
                case "sidebarCompactTypes":
                    await switchSidebarTypesDisplay(newValue);
                    break;
                case "bottompanelScaleFactor":
                    await scaleBottomPanelElements();
                    break;
                case "sidebarCondenseBreakpoint":
                    toggleCondensedSidebarView(await adjustSidebarView(newValue, null));
                    break;
                case "sidebarHideAlliesBreakpoint":
                    toggleCondensedSidebarView(await adjustSidebarView(null, newValue));
                    break;
                case "disableSettingsHint":
                    toggleSettingsHint(newValue);
                    break;
                case "statusbarPosition":
                    changeStatusbarPosition();
                    break;
                case "enableDevLogs": 
                    setDevEnv();
                    break
                case "menuType":
                    // do nothing?
                    break;
                default:
                    roguedexLogger.error(`Unhandled key in extensionSettingsListener(): ${key}`);
                    break;
            }
        }
    });
    roguedexLogger.debug("Extension settings listener activated.");
}

/**
 * Sets the global developmentENV variable according to the user settings.
 * @function setDevEnv
 * @async
 */
async function setDevEnv() {
    const { enableDevLogs } = await browserApi.storage.sync.get("enableDevLogs");
    if (enableDevLogs !== undefined && enableDevLogs !== null) {
        window.roguedex.developmentENV = enableDevLogs;
    }
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
                case "STARTER_SELECT":
                    handleModeWithPokemonCards();
                    break;
                case "MODIFIER_SELECT":
                    // do nothing?
                    break;
                case "LOADING":
                    roguedexLogger.info("Unhandled data-ui-mode: LOADING");
                    break;
                default:
                    roguedexLogger.warn("Unhandled data-ui-mode:", newValue);
                    break;
            }
        } catch (err) {
            roguedexLogger.error("An error occurred while handling data-ui-mode change:", err);
        }
    }

    function handleSessionInitialization() {
        window.RoguedexUtils.LocalStorage.setSessionData();
        const sessionData = window.RoguedexUtils.LocalStorage.getSessionData();
        if (sessionData && Object.keys(sessionData).length > 0) {
            roguedex.initStates.sessionIntialized = true;
            updateExtensionStatus({
                sessionState: roguedex.initStates.sessionIntialized,
            });
            initCreation(sessionData);
        } else {
            roguedexLogger.warn("SessionData empty. UI won't work for the moment.");
            roguedex.initStates.sessionIntialized = false;
            updateExtensionStatus({
                sessionState: roguedex.initStates.sessionIntialized,
            });
        }
    }

    function handleSaveSlotMode() {
        window.RoguedexUtils.LocalStorage.clearAllSessionData();
        roguedex.initStates.sessionIntialized = false;
        updateExtensionStatus({ sessionState: roguedex.initStates.sessionIntialized });
    }

    function handleModeWithPokemonCards() {
        deletePokemonCardWrappers();
    }

    function observeTouchControls() {
        const touchControlsElement = document.getElementById("touchControls");
        if (touchControlsElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === "attributes" && mutation.attributeName === "data-ui-mode") {
                        const newValue = touchControlsElement.getAttribute("data-ui-mode");
                        roguedexLogger.debug("[data-ui-mode] new value:", newValue);
                        handleDataUIModeChange(newValue);
                    }
                });
            });

            observer.observe(touchControlsElement, { attributes: true });
        } else {
            roguedexLogger.error('Element with ID "touchControls" not found.');
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
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        const observer = new MutationObserver((mutations, observerInstance) => {
            mutations.forEach((mutation) => {
                const nodes = Array.from(mutation.addedNodes);
                for (const node of nodes) {
                    if (node.nodeType === 1 && node.matches(selector)) {
                        callback(node);
                        observerInstance.disconnect();
                        return;
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

/**
 * Observes the resizing of the game canvas and adjusts UI elements accordingly (bottompanel).
 * @function observeGameCanvasResize
 */
async function observeGameCanvasResize() {
    if (roguedex.initStates.resizeObserverInitialized) {
        return;
    }
    roguedex.initStates.resizeObserverInitialized = true;

    const sidebarElement = document.getElementById("roguedex-sidebar");
    const bottomPanelElement = document.getElementById("roguedex-bottom-panel");
    const overlayCardEnemiesElement = document.getElementById("enemies");
    const overlayCardAlliesElement = document.getElementById("allies");

    // Function to check if the sidebar is visible
    function isSidebarVisible() {
        return window.getComputedStyle(sidebarElement).display !== "none";
    }

    // Function to show the bottom panel and resize it's container
    function showBottomPanelAndResize(entries) {
        for (const entry of entries) {
            const { right, width, height } = entry.contentRect;
            resizeUIBottomPanel(right, width, height);
        }
        bottomPanelElement.style.display = ""; // Set it back to default display value after resizing
    }

    // Function to make sure the pokemon overlay cards are inside the viewport on resizing
    function checkOverlayCardPositions(showSidebar) {
        try {
            if (showSidebar) {
                overlayCardEnemiesElement.style.visibility = "";
                overlayCardEnemiesElement.style.display = "flex";
                overlayCardAlliesElement.style.visibility = "";
                overlayCardAlliesElement.style.display = "flex";
                updateCardElementPosition(overlayCardEnemiesElement);
                updateCardElementPosition(overlayCardAlliesElement);
                overlayCardEnemiesElement.style.display = "";
                overlayCardAlliesElement.style.display = "";
                overlayCardEnemiesElement.style.visibility = "";
                overlayCardAlliesElement.style.visibility = "";
            } else {
                updateCardElementPosition(overlayCardEnemiesElement);
                updateCardElementPosition(overlayCardAlliesElement);
            }
        } catch {}
    }

    // Initially hide the bottom panel if the sidebar is not visible
    if (!isSidebarVisible()) {
        bottomPanelElement.style.display = "none";
    }

    // ResizeObserver to observe game app canvas element resize
    const resizeObserver = new ResizeObserver(async (entries) => {
        const extensionSettings = await window.RoguedexUtils.LocalStorage.getExtensionSettings();
        scaleAllElements();

        if (extensionSettings.showSidebar) {
            if (isSidebarVisible()) {
                showBottomPanelAndResize(entries);
            } else {
                // If sidebar is not visible, use MutationObserver
                useMutationObserver(entries, extensionSettings);
            }
        }
        checkOverlayCardPositions(extensionSettings.showSidebar);
    });

    // Observe the game canvas element
    resizeObserver.observe(document.getElementById("app").getElementsByTagName("canvas")[0]);

    // Wait for the sidebar to become visible before showing and resizing the bottom panel
    function useMutationObserver(entries) {
        // MutationObserver to detect changes in the sidebar's display property
        const mutationObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.attributeName === "style" || mutation.attributeName === "class") {
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
        mutationObserver.observe(sidebarElement, {
            attributes: true,
            attributeFilter: ["style", "class"],
        });
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
    const panel = document.getElementById("roguedex-bottom-panel");
    const sidePanel = document.getElementById("roguedex-sidebar");

    if (panel) {
        const sidebarPos = sidePanel.getBoundingClientRect();
        const pageWidth = window.innerWidth;
        const pageHeight = window.innerHeight;

        // Bottom panel should take up the height that is leftover from the game app's canvas
        panel.style["max-height"] = `${pageHeight - Math.round(height)}px`;

        // Bottom panel should fill out the entire leftover horizontal space,
        // and should therefore be "anchored" to the sidebar.
        panel.style["max-width"] = `${pageWidth - sidebarPos.width}px`;
    }
}
