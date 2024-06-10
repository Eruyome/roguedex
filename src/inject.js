/**
 * @fileoverview
 * This content script initializes and loads an injected script into the current web page.
 * It also detects the browser environment and retrieves the appropriate browser API.
 * @file 'src/inject.js'
 */

console.info('RogueDex content script start.');

/**
 * Initializes the browser API based on the browser environment.
 * @returns {object|null} The browser API object or null if unsupported browser.
 */
const browserApi = (() => {
    if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined" && typeof browser.runtime.getURL === "function") {
        return browser; // Firefox or compatible
    } else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.runtime.getURL === "function") {
        return chrome; // Chrome or compatible
    } else {
        console.error("Browser API not found or unsupported browser"); // Unsupported browser or environment
        return null;
    }
})();

// inject injected script
const s = document.createElement('script');
s.src = browserApi.runtime.getURL('injected.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
 
