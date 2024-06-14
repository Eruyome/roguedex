/**
 * @typedef {Object} Setting
 * @property {string} text - The description of the setting.
 * @property {string[]} options - The available options for the setting.
 * @property {string} localStorage - The key used for storing the setting in local storage.
 * @property {string} type - The data type of the setting's value.
 * @property {string} [appendText] - Optional text to append to the option value when displayed.
 */

/**
 * A template for settings configuration. Each key represents a setting with its
 * description, options, and other relevant information.
 * 
 * @type {Object<number, Setting>}
 */

const settingsTemplate = {
    0: {
        text: "Use Minified Overlay Cards",
        options: ["No", "Yes"],
        localStorage: "showMinified",
        type: "Bool"
    },
    1: {
        text: "Show Enemy Party",
        options: ["No", "Yes"],
        localStorage: "showEnemies",
        type: "Bool"
    },
    2: {
        text: "Show Ally Party",
        options: ["No", "Yes"],
        localStorage: "showParty",
        type: "Bool"
    },
    3: {
        text: "Overlay Scale",
        options: ["0.5", "1.0", "1.5", "2.0","2.5","3.0"],
        appendText: "x",
        localStorage: "scaleFactor",
        type: "Float"
    },
    4: {
        text: "Menu Type",
        options: ["1", "2", "3", "4", "5"],
        localStorage: "menuType",
        type: "Int"
    },
    5: {
        text: "Show Sidebar",
        options: ["No", "Yes"],
        localStorage: "showSidebar",
        type: "Bool"
    },
    6: {
        text: "Sidebar Position",
        options: ["Left", "Right"],
        localStorage: "sidebarPosition",
        type: "String"
    },
    7: {
        text: "Sidebar Scale",
        options: ["0.5", "1.0", "1.5", "2.0","2.5","3.0"],
        appendText: "x",
        localStorage: "sidebarScaleFactor",
        type: "Float"
    },
    8: {
        text: "Side: Compact TypeEffectiveness ",
        options: ["No", "Yes"],
        localStorage: "sidebarCompactTypes",
        type: "Bool"
    },
    9: {
        text: "Side: Small view at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarCondenseBreakpoint",
        type: "Int"
    },
    10: {
        text: "Side: Hide Allies at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarHideAlliesBreakpoint",
        type: "Int"
    },
    11: {
        text: "Bottom Panel Scale",
        options: ["0.5", "1.0", "1.5", "2.0","2.5","3.0"],
        appendText: "x",
        localStorage: "bottompanelScaleFactor",
        type: "Float"
    }
    /*,
    12: {
        text: "Sidebar Width",
        options: ["20", "25", "30", "35", "40"],
        appendText: "%",
        localStorage: "sidebarWidth",
        type: "Int"
    }
    */
};

export default settingsTemplate;