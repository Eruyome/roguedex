/**
 * @fileoverview Contains general-use lit-html templates and helper functions.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.lit.' prefix.
 * @file 'src/content/lit-templates/general.js'
 */

(function(window) {
    window.lit = window.lit || {};

    /**
     * Generates HTML for a small tooltip.
     * 
     * @param {string} tip - Tooltip contents.
     * @memberof lit
     * @returns {Lit-HTML-Template} - A lit-html template result representing the HTML markup.
     * @function createTooltipDiv
     */
    window.lit.createTooltipDiv = (tip) => html`
        <div class="text-base tooltiptext">${unsafeHTML(tip)}</div>
    `;

    window.lit.capitalizeFirstLetter = (string) => {
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Generates HTML for a status bar, showing certain info about the running extension.
     * 
     * @param {object} properties
     * @memberof lit
     * @returns {Lit-HTML-Template} - A lit-html template result representing the HTML markup.
     * @function updateExtensionStatusElement
     */
    window.lit.updateExtensionStatusElement = (properties) => {
        return html`            
            <span class="rd-status-text">${properties.text}</span>
            ${!properties.sessionState ? html`
                <span class="rd-status-session">Session data not loaded! UI won't work for now.</span>
            ` : '' }            
        `;
    }

})(window);