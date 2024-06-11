/**
 * @fileoverview
 * This class manages the initialization and injection of utility scripts into the content page.
 * It also handles the loading and instantiation of utility classes once the scripts are injected and loaded.
 * @file 'src/content/utils.js'
 * @class UtilsClass
 */

/**
 * Array containing paths to the utility scripts to be injected.
 * @type {string[]}
 */
const contentInjectables = [
    "/content/maps/natureMap.js",
    "/content/maps/weatherMap.js",
    "/content/maps/moveList.js",
    // "/content/data/moveList.js",
    "/content/data/abilityList.js",
    "/content/data/pokemonList.js",
    "/content/util_classes/pokemonMapper.util.js",
    "/content/util_classes/localStorage.util.js",
    "/content/util_classes/pokemonIconDrawer.util.js",
    "/content/util_classes/uiController.util.js"
];

/**
 * Class representing utility functions and managing the injection of utility scripts.
 */
class UtilsClass {
    constructor() {
        this.PokeMapper = null;
        this.LocalStorage = null;
        this.PokemonIconDrawer = null;
        this.UiController = null;
        this.classesReady = {
            "pokemonMapper.util.js": false,
            "localStorage.util.js": false,
            "uiController.util.js": false,
            "pokemonIconDrawer.util.js": false,
        };
        this._isReady = false;
        this.index = 0;
        this.eventListeners = {};
    }

    /**
     * Registers an event listener.
     * @param {string} event - The event to listen for.
     * @param {Function} listener - The callback function to execute when the event is fired.
     */
    on(event, listener) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(listener);
    }

    /**
     * Dispatches an event to all registered listeners.
     * @param {string} event - The event to dispatch.
     */
    dispatchEvent(event) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(listener => listener());
        }
    }

    /**
     * Gets the readiness state.
     * @returns {boolean}
     */
    get isReady() {
        return this._isReady;
    }

    /**
     * Sets the readiness state and dispatches an event if the state changes.
     * @param {boolean} value - The new readiness state.
     */
    set isReady(value) {
        if (this._isReady !== value) {
            this._isReady = value;
            this.dispatchEvent('isReadyChange');
        }
    }

    /**
     * Initializes the UtilsClass by injecting scripts.
     */
    init() {
        console.log("UtilsClass init called.");
        this.injectScripts();
    }

    /**
     * Injects utility scripts into the content page.
     * @private
     */
    injectScripts() {
        if (this.index >= contentInjectables.length) {
            console.log("All scripts injected.");
            this.checkIfReady();
            return;
        }

        const targetScript = contentInjectables[this.index];
        console.log(`Injecting script: ${targetScript}`);
        const scriptElem = document.createElement("script");
        scriptElem.src = this.browserApi.runtime.getURL(targetScript);
        scriptElem.type = "module";
        document.head.appendChild(scriptElem);

        scriptElem.addEventListener("load", () => {
            console.log(`${targetScript} loaded.`);
            this.handleScriptLoaded(targetScript);
            this.index += 1;
            this.injectScripts();
        });

        scriptElem.addEventListener("error", (e) => {
            console.error(`Failed to load script: ${targetScript}`, e);
        });
    }

     /**
     * Handles the loaded state of the injected scripts and instantiates utility classes accordingly.
     * @param {string} targetScript - The path of the loaded script.
     * @private
     */
    handleScriptLoaded(targetScript) {
        if (targetScript.includes("/content/util_classes/pokemonMapper.util.js")) {
            this.classesReady["pokemonMapper.util.js"] = true;
            this.PokeMapper = new PokemonMapperClass();
        } else if (targetScript.includes("/content/util_classes/localStorage.util.js")) {
            this.classesReady["localStorage.util.js"] = true;
            this.LocalStorage = new LocalStorageClass();
        } else if (targetScript.includes("/content/util_classes/pokemonIconDrawer.util.js")) {
            this.classesReady["pokemonIconDrawer.util.js"] = true;
            this.PokemonIconDrawer = new PokemonIconDrawer();
        } else if (targetScript.includes("/content/util_classes/uiController.util.js")) {
            this.classesReady["uiController.util.js"] = true;
            // this.UiController = new UIController();
        }
        this.checkIfReady();
    }

    /**
     * Checks if all utility classes are ready and updates the readiness state.
     * @private
     */
    checkIfReady() {
        this.isReady = Object.values(this.classesReady).every(value => value);
    }

    /**
     * Detects the browser environment and returns the appropriate browser API object.
     * @returns {Object | null} The browser API object or null if unsupported browser or environment.
     * @readonly
     */
    get browserApi() {
        if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined" && typeof browser.runtime.getURL === "function") {
            return browser; // Firefox or compatible
        } else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.runtime.getURL === "function") {
            return chrome; // Chrome or compatible
        } else {
            console.error("Browser API not found or unsupported browser");
            return null;
        }
    }
}

// Attach an instance of UtilsClass to the window object
window.Utils = new UtilsClass();
console.debug("UtilsClass instance created and assigned to window.Utils:", window.Utils);
    