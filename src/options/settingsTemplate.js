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
        desc: "Removes the top left info icon that informs about this settings menu."
    },
    1: {
        text: "Use Minified Overlay Cards",
        options: ["No", "Yes"],
        localStorage: "showMinified",
        type: "Bool",
        desc: "Use a smaller, more compact version of the the overlay pokemon cards."
    },
    2: {
        text: "Minified Cards: Show Types",
        options: ["No", "Yes"],
        localStorage: "showMiniCardTypes",
        type: "Bool",
        desc: "Toggles showing the pokemon type effectivenesses on the minified cards."
    },
    3: {
        text: "Overlay Opacity",
        options: ["100", "80", "70", "60", "50", "40", "25"],
        localStorage: "overlayOpacity",
        type: "Int",
        desc: "Changes the opacity (non-transparency) of the overlay pokemon cards."
    },
    4: {
        text: "Show Enemy Party",
        options: ["No", "Yes"],
        localStorage: "showEnemies",
        type: "Bool",
        desc: "Toggles showing the enemy party UI. Works for both the overlay cards and the sidebar."
    },
    5: {
        text: "Show Ally Party",
        options: ["No", "Yes"],
        localStorage: "showParty",
        type: "Bool",
        desc: "Toggles showing the ally party UI. Works for both the overlay cards and the sidebar."
    },
    6: {
        text: "Overlay Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "scaleFactor",
        type: "Float",
        desc: "Changes the scale (text, icon and other element sizes) of the overlay pokemon cards."
    },
    7: {
        text: "Status Bar Position",
        options: ["Top", "Bottom"],
        localStorage: "statusbarPosition",
        type: "String",
        desc: 'Changes the position of the small status bar that is showing "RogueDex is running!"'
    },
    8: {
        text: "Menu Type",
        options: ["1", "2", "3", "4", "5"],
        localStorage: "menuType",
        type: "Int",
        desc: "Changes this menues styling."
    },
    9: {
        text: "Show Sidebar",
        options: ["No", "Yes"],
        localStorage: "showSidebar",
        type: "Bool",
        desc: "Toggles between showing the overlay pokemon cards and the sidebar + bottom panel."
    },
    10: {
        text: "Sidebar Position",
        options: ["Left", "Right"],
        localStorage: "sidebarPosition",
        type: "String",
        desc: "Toggles the sidebar position."
    },
    11: {
        text: "Sidebar Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "sidebarScaleFactor",
        type: "Float",
        desc: "Changes the scale (text, icon and other element sizes) of the sidebar."
    },
    12: {
        text: "Sidebar: Compact Types",
        options: ["No", "Yes"],
        localStorage: "sidebarCompactTypes",
        type: "Bool",
        desc: "Toggles between showing the default type effectiveness display and a more compact one. Sidebar only."
    },
    13: {
        text: "Side: Small view at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarCondenseBreakpoint",
        type: "Int",
        desc: "Number of pokemon at which the sidebar automatically switches to using the compact type effectiveness display. Number = total pokemon of both parties. Switches back when this number drops."
    },
    14: {
        text: "Side: Hide Allies at # of Pokemon",
        options: ["9", "11", "12", "100"],
        localStorage: "sidebarHideAlliesBreakpoint",
        type: "Int",
        desc: "Number of pokemon at which the sidebar hides all ally pokemon. Number = total pokemon of both parties. Switches back when this number drops."
    },
    15: {
        text: "Bottom Panel Scale",
        options: ["0.4", "0.6", "0.8", "1.0", "1.25", "1.5", "2.0"],
        appendText: "x",
        localStorage: "bottompanelScaleFactor",
        type: "Float",
        desc: "Changes the scale (text, icon and other element sizes) of the bottom panel."
    }
};

export default settingsTemplate;