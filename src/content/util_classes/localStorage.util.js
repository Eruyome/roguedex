/**
 * @fileoverview Utility class for handling local storage operations, including session data management, image caching, 
 *      and retrieving extension settings. This file provides methods for saving, retrieving, and clearing session data 
 *      and cached images, as well as methods to get and set extension settings from synchronized storage.
 *      Retrieves player data (save data).
 * @file 'src/content/util_classes/localStorage.utils.js'
 * @class LocalStorageClass
 */

class LocalStorageClass {
    constructor() {
        this.slotId = -1;
        this.saveKey = "x0i2O7WRiANTqPmZ";
        this.sessionData = {};
        this.setSessionData();
    }

    /**
     * Clears all session data from local storage.
     */
    clearAllSessionData() {
        setTimeout(() => {
            for (const key in window.localStorage) {
                if (key.includes('sessionData')) window.localStorage.removeItem(key);
            }
        }, 1000);
    }

    /**
     * Saves an image to the local storage cache.
     * @param {string} key - The key to identify the cached image.
     * @param {string} imageData - The base64-encoded image data to be saved.
     */
    saveImageToCache(key, imageData) {
        try {
            window.localStorage.setItem(`img_cache_${key}`, imageData);
        } catch (e) {
            console.error("Failed to save image to cache", e);
        }
    }

    /**
     * Retrieves an image from the local storage cache.
     * @param {string} key - The key to identify the cached image.
     * @returns {string|null} The base64-encoded image data, or null if not found.
     */
    getImageFromCache(key) {
        return window.localStorage.getItem(`img_cache_${key}`);
    }

    /**
     * Clears all cached images from local storage.
     */
    clearImageCache() {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
            if (key.startsWith('img_cache_')) {
                window.localStorage.removeItem(key);
            }
        });
    }

    /**
     * Sets the session data by decrypting the data stored in local storage.
     */
    setSessionData() {
        let currentSessionData = null;
        for (const key in window.localStorage) {
            if ((this.slotId > 0 && key.includes(`sessionData${this.slotId}`)) || key.includes('sessionData')) {
                currentSessionData = window.localStorage.getItem(key);
                break;
            }
        }
        if (currentSessionData) {
            this.sessionData = JSON.parse(CryptoJS.AES.decrypt(currentSessionData, this.saveKey).toString(CryptoJS.enc.Utf8));
            console.log("Got session data", this.sessionData, "for slot id", this.slotId);
        } else {
            this.sessionData = {};
        }
    }

    /**
     * Gets the current session data.
     * @returns {object} The current session data.
     */
    getSessionData() {
        this.setSessionData();
        return this.sessionData;
    }

    /**
     * Retrieves the extension settings from synchronized storage.
     * @returns {Promise<object>} A promise that resolves to the extension settings.
     */
    async getExtensionSettings() {
        return new Promise((resolve) => {
            browserApi.storage.sync.get(['showMinified', 'scaleFactor', 'showEnemies', 'showParty', 'showSidebar', 'sidebarPosition', 'sidebarScaleFactor', 'sidebarCompactTypes'], (data) => {
                if (data.showMinified === undefined) {
                    browserApi.storage.sync.set({ 'showMinified': false });
                    data.showMinified = false;
                }
                if (data.scaleFactor === undefined) {
                    browserApi.storage.sync.set({ 'scaleFactor': 1 });
                    data.scaleFactor = 1;
                }
                if (data.showEnemies === undefined) {
                    browserApi.storage.sync.set({ 'showEnemies': true });
                    data.showEnemies = true;
                }
                if (data.showParty === undefined) {
                    browserApi.storage.sync.set({ 'showParty': true });
                    data.showParty = true;
                }
                if (data.showSidebar === undefined) {
                    browserApi.storage.sync.set({ 'sidebarPosition': 'Left' });
                    data.sidebarPosition = 'Left';
                }
                if (data.sidebarScaleFactor === undefined) {
                    browserApi.storage.sync.set({ 'sidebarScaleFactor': 1 });
                    data.sidebarScaleFactor = 1;
                }
                if (data.sidebarCompactTypes === undefined) {
                    browserApi.storage.sync.set({ 'sidebarCompactTypes': false });
                    data.sidebarCompactTypes = false;
                }
                resolve(data);
            });
        });
    }

    /**
     * Gets player data from local storage.
     * @returns {object} The decrypted player data.
     */
    getPlayerData() {
        const localStorageData = window.localStorage.getItem(this.getDataKey('data_'));
        const decryptedString = CryptoJS.AES.decrypt(localStorageData, this.saveKey).toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    }

    /**
     * Retrieves the key for a given data type from local storage.
     * @param {string} matchString - The string to match the key.
     * @returns {string} The matching key.
     */
    getDataKey(matchString) {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
            if (key.includes(matchString)) {
                return key;
            }
        }
    }
}