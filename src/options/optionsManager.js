/**
 * @fileoverview
 * This class manages options for the extension settings.
 * @file 'src/options/optionsManager.js'
 * @class OptionsManager
 */

import settingsTemplate from './settingsTemplate.js';

class OptionsManager {
    constructor() {
        this.browserApi = typeof browser !== "undefined" ? browser : chrome;
    }

    /**
     * Saves an option setting.
     * @param {string} setting - The setting to save.
     * @param {string|number} value - The value of the setting.
     */
    saveOption(setting, value) {
        const settings = {};
        if (setting === 'menuType' || setting === 'scaleFactor' || setting === 'sidebarScaleFactor' || setting === 'bottompanelScaleFactor' || setting === 'sidebarCondenseBreakpoint' || setting === 'sidebarHideAlliesBreakpoint' || setting === 'overlayOpacity') {
            settings[setting] = parseFloat(value);
        } else if (value === 'true' || value === 'false') {
            settings[setting] = value === 'true';
        } else {
            settings[setting] = value;
        }
        this.browserApi.storage.sync.set(settings, () => {
            if (this.browserApi.runtime.lastError) {
                console.error('Error saving option:', this.browserApi.runtime.lastError);
            } else {
                console.log('Option saved successfully');
            }
        });
    }

     /**
     * Restores options from storage and updates UI accordingly.
     * @param {Function} callback - The function to call after restoring options.
     */
    restoreOptions(callback) {
        const keys = Object.values(settingsTemplate).map(setting => setting.localStorage);
        this.browserApi.storage.sync.get(keys, (data) => {
            if (this.browserApi.runtime.lastError) {
                console.error('Error retrieving options:', this.browserApi.runtime.lastError);
            } else {
                document.querySelectorAll('.setting-options .option').forEach(option => {
                    // Get the setting and value from the data attributes of the current option
                    const setting = option.getAttribute('data-setting');
                    const value = option.getAttribute('data-value');
                    
                    let parsedValue;
                    // Determine how to parse the value based on the setting type
                    if ( setting === 'menuType' || setting === 'scaleFactor' || setting === 'sidebarScaleFactor' || setting === 'bottompanelScaleFactor' || setting === 'sidebarCondenseBreakpoint' || setting === 'sidebarHideAlliesBreakpoint' || setting === 'overlayOpacity') {
                        // Parse numeric values as floats
                        parsedValue = parseFloat(value);
                    }
                    else {
                        // Convert 'true'/'false' strings to boolean
                        parsedValue = value === 'true';
                    }
                
                    // Check if the current option should be selected
                    const isSelected = data[setting] === parsedValue || (setting === 'sidebarPosition' && data[setting] === value);
                    
                    // Add the 'selected' class if the option matches the setting value
                    if (isSelected) {
                        option.classList.add('selected');
                    }
                });

                if (callback) {
                    callback(data.menuType || 1);
                }
            }
        });
    }

    /**
     * Updates scale UI elements.
     * @param {number} value - The scale value.
     */
    updateScale(value) {
        const scaleFactor = parseFloat(value);
        document.getElementById('scaleValue').textContent = scaleFactor;
        // Update any other necessary elements based on scale factor      
    }

    /**
     * Scales UI elements.
     */
    scaleElements() {
        const manualScaleFactor = document.getElementById('scaleSlider').value;
        document.getElementById('scaleValue').textContent = manualScaleFactor;
    }

    /**
     * Saves options to storage.
     */
    saveOptions() {
        const showMin = document.querySelector('.option[data-setting="showMinified"].selected').getAttribute('data-value') === 'true';
        const overlayOpacity = parseInt(document.querySelector('.option[data-setting="overlayOpacity"].selected').getAttribute('data-value'), 10);
        const showEnemy = document.querySelector('.option[data-setting="showEnemies"].selected').getAttribute('data-value') === 'true';
        const showParty = document.querySelector('.option[data-setting="showParty"].selected').getAttribute('data-value') === 'true';
        const scaleFactor = document.getElementById('scaleSlider').value;
        const menuType = parseInt(document.querySelector('.option[data-setting="menuType"].selected').getAttribute('data-value'), 10);
        const showSidebar = document.querySelector('.option[data-setting="showSidebar"].selected').getAttribute('data-value') === 'true';
        const sidebarPosition = document.querySelector('.option[data-setting="sidebarPosition"].selected').getAttribute('data-value') === 'true';
        const sidebarScaleFactor = parseFloat(document.querySelector('.option[data-setting="sidebarScaleFactor"].selected').getAttribute('data-value'));
        const sidebarCompactTypes = document.querySelector('.option[data-setting="sidebarCompactTypes"].selected').getAttribute('data-value') === 'true';
        const bottompanelScaleFactor = parseFloat(document.querySelector('.option[data-setting="bottompanelScaleFactor"].selected').getAttribute('data-value'));
        const sidebarCondenseBreakpoint = parseInt(document.querySelector('.option[data-setting="sidebarCondenseBreakpoint"].selected').getAttribute('data-value'), 10);
        const sidebarHideAlliesBreakpoint = parseInt(document.querySelector('.option[data-setting="sidebarHideAlliesBreakpoint"].selected').getAttribute('data-value'), 10);

        this.browserApi.storage.sync.set({
            'showMinified': showMin,
            'overlayOpacity' : overlayOpacity,
            'scaleFactor': scaleFactor,
            'showEnemies': showEnemy,
            'showParty': showParty,
            'menuType': menuType,
            'showSidebar': showSidebar,
            'sidebarPosition': sidebarPosition,
            'sidebarScaleFactor': sidebarScaleFactor,
            'sidebarCompactTypes': sidebarCompactTypes,
            'bottompanelScaleFactor': bottompanelScaleFactor,
            'sidebarCondenseBreakpoint': sidebarCondenseBreakpoint,
            'sidebarHideAlliesBreakpoint': sidebarHideAlliesBreakpoint,
        }, () => {
            if (this.browserApi.runtime.lastError) {
                console.error('Error saving options:', this.browserApi.runtime.lastError);
            } else {
                console.log('Options saved successfully');
            }
        });
    }
}

export default OptionsManager;
