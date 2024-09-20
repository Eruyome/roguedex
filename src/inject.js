/**
 * @fileoverview
 * This content script initializes and loads an injected script into the current web page.
 * It also detects the browser environment and retrieves the appropriate browser API.
 * @file 'src/inject.js'
 */

console.info("[RogueDex] Extension active. Script initialization starting.");

/**
 * Initializes the browser API based on the browser environment.
 * @returns {object|null} The browser API object or null if unsupported browser.
 */
const browserApi = (() => {
    if (
        typeof browser !== "undefined" &&
        typeof browser.runtime !== "undefined" &&
        typeof browser.runtime.getURL === "function"
    ) {
        return browser; // Firefox or compatible
    } else if (
        typeof chrome !== "undefined" &&
        typeof chrome.runtime !== "undefined" &&
        typeof chrome.runtime.getURL === "function"
    ) {
        return chrome; // Chrome or compatible
    } else {
        console.error("[RogueDex] Browser API not found or unsupported browser!"); // Unsupported browser or environment
        return null;
    }
})();

/**
 * Injects a script into the current web page.
 * @param {string} scriptName - The name of the script to inject.
 */
const injectScript = (scriptName) => {
    const scriptElement = document.createElement("script");
    scriptElement.src = browserApi.runtime.getURL(scriptName);
    scriptElement.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(scriptElement);
};

// Inject the 'injected.js' script for all browsers
injectScript("injected.js");
