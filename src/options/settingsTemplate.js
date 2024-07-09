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
        text: "Disable Settings Menu Hint",
        options: ["Yes", "No"],
        localStorage: "disableSettingsHint",
        type: "Bool",

    },
    1: {
        text: "Use Minified Overlay Cards",
        options: ["No", "Yes"],
        localStorage: "showMinified",
        type: "Bool"
    },
    2: {
        text: "Overlay Opacity",
        options: ["100", "80", "70", "60", "50", "40", "25"],
        localStorage: "overlayOpacity",
        type: "Int"
    },
    3: {
        text: "Show Enemy Party",
        options: ["No", "Yes"],
        localStorage: "showEnemies",
        type: "Bool"
    },
    4: {
        text: "Show Ally Party",
        options: ["No", "Yes"],
        localStorage: "showParty",
        type: "Bool"
    },
    5: {
        text: "Overlay Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "scaleFactor",
        type: "Float"
    },
    6: {
        text: "Status Bar Position",
        options: ["Top", "Bottom"],
        localStorage: "statusbarPosition",
        type: "String"
    },
    7: {
        text: "Menu Type",
        options: ["1", "2", "3", "4", "5"],
        localStorage: "menuType",
        type: "Int"
    },
    8: {
        text: "Show Sidebar",
        options: ["No", "Yes"],
        localStorage: "showSidebar",
        type: "Bool"
    },
    9: {
        text: "Sidebar Position",
        options: ["Left", "Right"],
        localStorage: "sidebarPosition",
        type: "String"
    },
    10: {
        text: "Sidebar Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "sidebarScaleFactor",
        type: "Float"
    },
    11: {
        text: "Side: Compact TypeEffectiveness ",
        options: ["No", "Yes"],
        localStorage: "sidebarCompactTypes",
        type: "Bool"
    },
    12: {
        text: "Side: Small view at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarCondenseBreakpoint",
        type: "Int"
    },
    13: {
        text: "Side: Hide Allies at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarHideAlliesBreakpoint",
        type: "Int"
    },
    14: {
        text: "Bottom Panel Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "bottompanelScaleFactor",
        type: "Float"
    }
};

export default settingsTemplate;