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

class UtilsClass extends EventTarget {  // eslint-disable-line no-unused-vars
    constructor() {
        super();
        this.PokeMapper = null;
        this.LocalStorage = null;
        this.PokemonIconDrawer = null;
        this.classesReady = {
            "pokemonMapper.util.js": false,
            "localStorage.util.js": false,
            "uiController.util.js": false,
            "pokemonIconDrawer.util.js": false,
        };
        this._isReady = false;
        this.index = 0;
    }

    get isReady() {
        return this._isReady;
    }

    set isReady(value) {
        if (this._isReady !== value) {
            this._isReady = value;
            this.dispatchEvent(new Event('isReadyChange'));
        }
    }

    init() {
        this.scriptInjector();
    }

    checkIfReady() {
        let isReady = true;
        for (const key in this.classesReady) {
            if (!this.classesReady[key]) {
                isReady = false;
                break;
            }
        }
        this.isReady = isReady;
    }

    scriptInjector() {
        if (this.index >= contentInjectables.length) {
            console.log("All scripts injected.");
            return;
        }

        const targetScript = contentInjectables[this.index];
        console.log(`Injecting script: ${targetScript}`);
        const scriptElem = document.createElement("script");
        scriptElem.src = chrome.runtime.getURL(targetScript);
        scriptElem.type = "module";
        document.head.appendChild(scriptElem);

        scriptElem.addEventListener("load", () => {
            console.log(`${targetScript} loaded.`);
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
            this.index += 1;
            this.scriptInjector();
        });

        scriptElem.addEventListener("error", (e) => {
            console.error(`Failed to load script: ${targetScript}`, e);
        });
    }
}