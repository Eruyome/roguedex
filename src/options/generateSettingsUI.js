/**
 * @fileoverview
 * This module generates the settings user interface based on the settings template provided.
 * @file 'src/options/generateSettingsUI.js'
 */

import settingsTemplate from './settingsTemplate.js';

/**
 * Generates HTML for a setting option using template literals.
 * @param {Object} setting - The setting object from the template.
 * @param {string} option - The option value.
 * @returns {string} - The HTML string representing the setting option.
 */
const createOptionHTML = (setting, option) => {
    const appended = setting.appendText || '';
    const value = setting.type === 'Bool' 
        ? (option === 'Yes' ? 'true' : 'false') 
        : option;

    return `
        <span class="option" 
              data-setting="${setting.localStorage}" 
              data-value="${value}">
            ${option}${appended}
        </span>
    `;
};

/**
 * Generates the settings user interface dynamically based on the settings template.
 */
const generateSettingsUI = () => {
    const container = document.getElementById('input-container');

    const settingsHTML = Object.values(settingsTemplate).map(setting => {
        const optionsHTML = setting.options.map(option => createOptionHTML(setting, option)).join('');

        const boolLabelClass = setting.type === 'Bool' ? 'bool-label' : '';

        return `
            <div class="input-item">
                <div class="setting-wrapper collapsible">
                    <label class="setting-label ${boolLabelClass}">
                        <span>${setting.text}</span>
                    </label>
                    <span class="setting-options">
                        ${optionsHTML}
                    </span>
                </div>
                <div class="setting-desc-wrapper">
                    <span class="setting-desc">${setting.desc}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = settingsHTML;

    initializeCollapsibles();
};

/**
 * Initializes the collapsible behavior.
 * Closes other collapsibles when one is opened.
 */
const initializeCollapsibles = () => {
    const labels = document.querySelectorAll('.setting-label');

    labels.forEach(label => {
        label.addEventListener('click', function() {
            // Find the closest .input-item element
            const inputItem = label.closest('.input-item');

            // Close all other collapsibles
            document.querySelectorAll('.input-item').forEach(item => {
                if (item !== inputItem) {
                    item.classList.remove('open');
                }
            });

            // Adjust width if the collapsible is being opened
            adjustDescWrapperWidth(inputItem);
            // Toggle the clicked collapsible
            inputItem.classList.toggle('open');
        });
    });
};

/**
 * Adjusts the width of .setting-desc-wrapper to match the width of .setting-wrapper.
 * @param {HTMLElement} inputItem - The .input-item element to adjust.
 */
const adjustDescWrapperWidth = (inputItem) => {
    const settingWrapper = inputItem.querySelector('.setting-wrapper');
    const descWrapper = inputItem.querySelector('.setting-desc-wrapper');

    if (settingWrapper && descWrapper) {
        // Get the actual width of setting-wrapper using getBoundingClientRect
        const wrapperWidth = settingWrapper.getBoundingClientRect().width;

        console.log([settingWrapper, descWrapper, wrapperWidth])
        // Set the width of setting-desc-wrapper to match the width of setting-wrapper
        descWrapper.style.width = `${wrapperWidth}px`;
        descWrapper.style.maxWidth = `${wrapperWidth}px`;
    }
};

export default generateSettingsUI;
