// const browserApi = typeof browser !== "undefined" ? browser : chrome;
// import CryptoJS from '../libs/crypto-js.min';

class LocalStorageClass {
    constructor() {
        this.slotId = -1;
        this.saveKey = "x0i2O7WRiANTqPmZ";
        this.sessionData = {};
        this.setSessionData();
    }

    clearAllSessionData() {
        setTimeout(() => {
            for (const key in window.localStorage) {
                if (key.includes('sessionData')) window.localStorage.removeItem(key);
            }
        }, 1000);
    }

    saveImageToCache(key, imageData) {
        try {
            window.localStorage.setItem(`img_cache_${key}`, imageData);
        } catch (e) {
            console.error("Failed to save image to cache", e);
        }
    }

    getImageFromCache(key) {
        return window.localStorage.getItem(`img_cache_${key}`);
    }

    clearImageCache() {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
            if (key.startsWith('img_cache_')) {
                window.localStorage.removeItem(key);
            }
        });
    }

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

    getSessionData() {
        this.setSessionData();
        return this.sessionData;
    }

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

    getPlayerData() {
        const localStorageData = window.localStorage.getItem(this.getDataKey('data_'));
        const decryptedString = CryptoJS.AES.decrypt(localStorageData, this.saveKey).toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    }

    getDataKey(matchString) {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
            if (key.includes(matchString)) {
                return key;
            }
        }
    }
}