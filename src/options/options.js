/**
 * @fileoverview Manages the initialization of options, event listeners, and UI updates for the extension options page.
 * @file 'src/options/options.js'
 */

import OptionsManager from './optionsManager.js';
import ImageInjector from './imageInjector.js';
import generateSettingsUI from './generateSettingsUI.js';

/**
 * Initializes the settings UI, sets up event listeners, and restores previous options.
 */
document.addEventListener('DOMContentLoaded', () => {
    generateSettingsUI();

    /** @type {OptionsManager} */
    const optionsManager = new OptionsManager();
    /** @type {ImageInjector} */
    const imageInjector = new ImageInjector();

    /** @type {number} */
    let focusedSettingIndex = 0;
    /** @type {NodeListOf<Element>} */
    const settings = document.querySelectorAll('.input-item');

    /**
     * Updates the focus of the settings UI based on the current focusedSettingIndex.
     */
    const updateFocus = () => {
        settings.forEach((setting, index) => {
            const label = setting.querySelector('.setting-label');
            if (index === focusedSettingIndex) {
                label.classList.add('focus');
            } else {
                label.classList.remove('focus');
            }
        });
    };

    /**
     * Handles the change of an option for a given setting.
     * @param {Element} setting - The setting element containing the options.
     * @param {string} directionOrValue - The direction ('left', 'right') or specific value to change to.
     */
    const handleOptionChange = (setting, directionOrValue) => {
        const options = setting.querySelectorAll('.option');
        let selectedIndex = Array.from(options).findIndex(option => option.classList.contains('selected'));
        if (directionOrValue === 'left' && selectedIndex > 0) {
            selectedIndex -= 1;
        } else if (directionOrValue === 'right' && selectedIndex < options.length - 1) {
            selectedIndex += 1;
        } else if (directionOrValue !== "left" && directionOrValue !== "right") {
            selectedIndex = Array.from(options).findIndex(option => option.getAttribute('data-value') === directionOrValue);
        }
        options.forEach(option => option.classList.remove('selected'));
        options[selectedIndex].classList.add('selected');

        const option = options[selectedIndex];
        const settingName = option.getAttribute('data-setting');
        const value = option.getAttribute('data-value');

        optionsManager.saveOption(settingName, value);

        if (settingName === 'menuType') {
            imageInjector.injectImages(parseInt(value, 10));
        } else if (settingName === 'scaleFactor') {
            optionsManager.updateScale(value);
        }
    };

    /**
     * Handles keyboard navigation for changing settings and options.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (focusedSettingIndex > 0) {
                    focusedSettingIndex -= 1;
                    updateFocus();
                }
                break;
            case 'ArrowDown':
                if (focusedSettingIndex < settings.length - 1) {
                    focusedSettingIndex += 1;
                    updateFocus();
                }
                break;
            case 'ArrowLeft':
                handleOptionChange(settings[focusedSettingIndex], 'left');
                break;
            case 'ArrowRight':
                handleOptionChange(settings[focusedSettingIndex], 'right');
                break;
        }
    });

    /**
     * Attach click event listeners to the options for handling option changes.
     */
    document.querySelectorAll('.setting-options .option').forEach(option => {
        option.addEventListener('click', (event) => {
            const setting = event.target.closest('.input-item');
            focusedSettingIndex = Array.from(settings).indexOf(setting);
            updateFocus();
            handleOptionChange(setting, event.target.getAttribute('data-value'));
        });
    });

    /**
     * Restores the options from storage and updates the UI.
     */
    optionsManager.restoreOptions((menuType) => {
        imageInjector.injectImages(menuType);
        updateFocus();
    });
});
