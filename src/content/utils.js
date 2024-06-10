/**
 * @fileoverview
 * This class manages the initialization and injection of utility scripts into the content page.
 * It also handles the loading and instantiation of utility classes once the scripts are injected and loaded.
 * @file 'src/content/utils.js'
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
 * Utility class that manages the injection and loading of scripts and the instantiation of utility classes.
 * @class UtilsClass
 * @extends {EventTarget}
 */
class UtilsClass extends EventTarget {
    constructor() {
        super();
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
    }

    /**
     * Gets the readiness state of the UtilsClass.
     * @type {boolean}
     */
    get isReady() {
        return this._isReady;
    }

    /**
     * Sets the readiness state of the UtilsClass and dispatches an 'isReadyChange' event.
     * @type {boolean}
     */
    set isReady(value) {
        if (this._isReady !== value) {
            this._isReady = value;
            this.dispatchEvent(new Event('isReadyChange'));
        }
    }

    /**
     * Initializes the UtilsClass by injecting scripts.
     */
    init() {
        this.injectScripts();
    }

     /**
     * Checks if all utility classes are ready.
     */
    checkIfReady() {
        this.isReady = Object.values(this.classesReady).every(value => value);
    }

    /**
     * Injects utility scripts into the content page.
     */
    injectScripts() {
        if (this.index >= contentInjectables.length) {
            console.log("All scripts injected.");
            return;
        }

        const targetScript = contentInjectables[this.index];
        console.log(`Injecting script: ${targetScript}`);
        const scriptElem = document.createElement("script");
        scriptElem.src = browserApi.runtime.getURL(targetScript);
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
}
