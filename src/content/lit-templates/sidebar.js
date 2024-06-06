/**
 * @fileoverview Contains lit-html templates and helper functions that are being used to create and update the sidebar.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.lit.' prefix.
 * @file 'src/content/lit-templates/sidebar.js'
 */

(function(window) {
    window.lit = window.lit || {};

    /**
     * Creates the HTML template for the sidebar.
     * 
     * @param {Object} sessionData - The session data object.
     * @returns {TemplateResult} - The HTML template result.
     */
    window.lit.createSidebarTemplate = (sessionData) => {
        return html`
            <div class="roguedex-sidebar hideIVs" id="roguedex-sidebar" data-shown-pokemon-text-info="movesets">        
                <button id="sidebar-switch-iv-moves" class="tooltip">&#8644; ${window.lit.createTooltipDiv('Switch between showing ally IVs and movesets.')}</button>
                <div class="sidebar-header" id="sidebar-header"></div>                
                <div class="sidebar-enemies-box visible" id="sidebar-enemies-box"></div>
                <div class="sidebar-allies-box visible" id="sidebar-allies-box"></div>
            </div>
        `;
    };

    /**
     * Updates the sidebar header based on the session data.
     * 
     * @param {Object} sessionData - The session data object.
     * @returns {TemplateResult} - The HTML template result.
     */
    window.lit.updateSidebarHeader = (sessionData) => {
        const trainer = sessionData.trainer;
        const isTrainerBattle = (trainer != null);
    
        return html`
            <span>RogueDex</span>
            ${!isTrainerBattle ? '' : html`
                <span class=sidebar-header-trainer-battle>(Trainer Battle)</span>
            `}
        `;
    };

    /**
     * Template function for rendering the party entries in the sidebar.
     * 
     * @param {Object} pokemonData - The Pokémon data object.
     * @param {string} partyID - The ID of the party ('allies' or 'enemies').
     * @param {Object} dexData - The Pokédex data.
     * @returns {TemplateResult} - The HTML template result.
     */
    window.lit.createSidebarPartyTemplate = (pokemonData, partyID, dexData, sessionData, maxPokemonForDetailedView = 8) => html`
        <div class="${partyID}-party">
            ${pokemonData.pokemon.map((pokemon, counter) => html`
                <div class="pokemon-entry ${window.lit.getCssClassCondensed(sessionData, maxPokemonForDetailedView)}" id="sidebar_${partyID}_${counter}">
                    <div class="pokemon-entry-image">
                        <canvas id="pokemon-icon_sidebar_${partyID}_${counter}" class="pokemon-entry-icon"></canvas>
                        <div class="sidebar-pokemon-info tooltip" style="position: absolute; ${partyID === 'enemies' ? 'display: none;' : ''}">
                            <span class="sidebar-pokemon-level">Lvl. ${pokemon.level}</span>
                            <span class="sidebar-pokemon-shiny">${pokemon.shiny ? '☀' : ''}</span>
                            <span class="sidebar-pokemon-luck">☘ ${pokemon.luck}</span>
                            ${window.lit.createTooltipDiv(`Pokemons current level: ${pokemon.level}.<br>Is shiny: ${pokemon.shiny ? 'Yes' : 'No'}.<br>Pokemon luck (shiny bonus): ${pokemon.luck}.`)}
                        </div>
                    </div>
                    <div class="pokemon-type-effectiveness-wrapper compact">
                        ${window.lit.createSidebarTypeEffectivenessWrapperCompact(pokemon.typeEffectiveness, 5, 3)}
                    </div>
                    <div class="pokemon-type-effectiveness-wrapper default">
                        ${window.lit.createSidebarTypeEffectivenessWrapper(pokemon.typeEffectiveness)}
                    </div>
                    <div class="pokemon-info-text-wrapper">
                        <div class="pokemon-ability-nature">
                            <span class="pokemon-ability tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
                                <span class="pokemon-ability-description">Ability:</span>
                                <span class="pokemon-ability-value">${pokemon.ability.name}</span>
                                ${window.lit.createTooltipDiv(pokemon.ability.description)}
                            </span>
                            <span class="pokemon-nature tooltip">
                                <span class="pokemon-nature-description">Nature:</span>
                                <span class="pokemon-nature-value">${pokemon.nature}</span>
                            </span>
                        </div>
                        <div class="pokemon-ivs stat-cont">
                            ${window.lit.generateIVsHTML(pokemon, dexData[pokemon.baseId].ivs, partyID === 'allies', partyID === 'allies')}
                        </div>
                        ${partyID === 'enemies' ? '' : html`
                            <div class="pokemon-moveset-wrapper">
                                ${window.lit.generateMovesetHTML(pokemon)}
                            </div>
                        `}                       
                    </div>
                </div>
            `)}
        </div>
    `;

    /**
     * Decides whether to show the default or a condensed view of the pokemon type effectivenesses,
     * based on how many poekmon are participating in the battle.
     * 
     * @param {Object} sessionData - The session data object.
     * @param {number} maxPokemonForDetailedView - The maximum number of Pokémon for detailed view.
     * @returns {string} - The CSS class.
     */
    window.lit.getCssClassCondensed = (sessionData, maxPokemonForDetailedView) => {
        const enemyPartySize = sessionData.enemyParty.length;
        const allyPartySize = sessionData.party.length;    
        return (enemyPartySize + allyPartySize) > maxPokemonForDetailedView ? 'condensed' : '';
    }

    /**
    * Generates HTML for a multiline display of a pokemons IVs.
    * 
    * This function generates HTML markup representing the IVs (Individual Values) of a Pokémon. 
    * It can show color gradients and icons to indicate how good the IVs are and whether they are an 
    * upgrade over the user's starter Pokémon IVs.
    * 
    * @param {object} pokemon - Object representing all data know about this current pokemon.
    * @param {object} dexIvs - IV values of the base Pokémon, taken from the user's save file.
    * @param {boolean} simpleDisplay - Whether default or simplified version is returned.
    * @param {boolean} addStyleClasses - Whether colors and indicators should be shown.
    * @returns {TemplateResult} - A lit-html template result representing the HTML markup.
    */
    window.lit.generateIVsHTML = (pokemon, dexIvs, simpleDisplay = false, addStyleClasses = false) => html`
        ${Object.keys(pokemon.ivs).map(i => {
            const curIV = pokemon.ivs[i];
            const dexIv = dexIvs[i];
            const isBetter = curIV > dexIv;
            const isWorse = curIV < dexIv;
            const icon = isBetter ? '↑' : (isWorse ? '↓' : '-');
            const color = isBetter ? '#00FF00' : (isWorse ? '#FF0000' : '#FFFF00');
            const colorStyle = !simpleDisplay && !addStyleClasses ? { color: color } : {};
            const ivValue = simpleDisplay ? curIV : html`${curIV}${icon}`;
            const statClass = addStyleClasses ? `stat-p-colors` : '';
            const valueClass = addStyleClasses ? `stat-c-colors` : '';

            return html`
                <div class="stat-p ${statClass}">
                    ${Stat[i]}:&nbsp;
                    <div class="stat-c ${valueClass}" style=${styleMap(colorStyle)}>${ivValue}</div>&nbsp;&nbsp;
                </div>
            `;
        })}
    `;

    /**
     * Generates HTML for displaying a Pokemon's moveset.
     * 
     * @param {object} pokemon - Object representing all data known about this current Pokémon.
     * @returns {TemplateResult} - A lit-html template result representing the HTML markup.
     */
    window.lit.generateMovesetHTML = (pokemon) => html`
        ${Object.keys(pokemon.moveset).map(i => {
            const move = pokemon.moveset[i];
            return html`
                <div class="pokemon-move">
                    <span class="pokemon-move-name move-${move.type.toLowerCase()}">${move.name}</span>
                </div>
            `;
        })}
    `;

    /**
     * Creates the HTML template for the compact sidebar type effectiveness wrapper.
     * Type categories are directly chained after each other, continuing rows in a
     * "snaking" manner, with type icons being shown flowing right to left, left to right
     * in multiple rows.
     * 
     * @param {Object} typeEffectivenesses - The type effectiveness data object.
     * @param {number} maxItemsPerRow - The maximum number of items per row.
     * @param {number} maxRows - The maximum number of rows.
     * @param {boolean} growRowLength - Whether to grow the row length.
     * @returns {TemplateResult} - The HTML template result.
     */
    window.lit.createSidebarTypeEffectivenessWrapperCompact = (typeEffectivenesses, maxItemsPerRow = 5, maxRows = 4, growRowLength = true) => {
        const urlPrefix = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield';
        const typeItemList = [];
        let globalCounter = 0;
        let itemsPerRow = maxItemsPerRow;
        let numberOfRows = maxRows;
        let totalNumberOfTypes = 0;

        try {
            totalNumberOfTypes = Object.keys(typeEffectivenesses.cssClasses).length;
        } catch (err) {}

        // Adjust the number of items per row or number of rows if needed
        while (totalNumberOfTypes / itemsPerRow > numberOfRows) {
            if (growRowLength) {
                itemsPerRow++;
            } else {
                numberOfRows++;
            }
        }

        // Populate the typeItemList with items containing type effectiveness data
        Object.keys(typeEffectivenesses).forEach((effectiveness) => {
            const effectivenessObj = typeEffectivenesses[effectiveness];
            if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length)) return;
            if (effectiveness === "cssClasses") return;

            const allTypes = [
                ...(effectivenessObj.double || []),
                ...(effectivenessObj.normal || [])
            ];

            allTypes.forEach((type) => {
                const iconCssClass = (() => {
                    try {
                        return `pokemon-type-icon ${typeEffectivenesses.cssClasses[type]}`;
                    } catch (error) {
                        return 'pokemon-type-icon';
                    }
                })();

                const tempListItem = {
                    iconCssClasses: iconCssClass,
                    typeEffectiveness: effectiveness,
                    iconUrl: `${urlPrefix}/${Types[type]}.png`,
                    wrapperCssClasses: `type-effectiveness-category pokemon-type-${effectiveness}`,
                    order: (globalCounter % itemsPerRow) + 1
                };

                typeItemList.push(tempListItem);
                globalCounter++;
            });
        });

        /*
            Create an array of rows: Instead of conditionally adding opening and closing div tags, we create rows as arrays of lit-html templates.
            Slice the items per row: Use slice to divide the typeItemList into chunks representing rows.
            Map over the rows: Each row is mapped to a div containing the items.
            Combine the rows: The rows are combined into a single lit-html template, which ensures that each row is properly closed.
        */
        const rows = [];
        for (let i = 0; i < typeItemList.length; i += itemsPerRow) {
            const rowItems = typeItemList.slice(i, i + itemsPerRow);
            rows.push(html`
                <div class="type-effectiveness-row">
                    ${rowItems.map((item, counter) => {
                        const firstOfType = counter === 0 || rowItems[counter - 1].typeEffectiveness !== item.typeEffectiveness ? ' ' + 'first-of-type-category' : '';

                        let lastOfType = '';
                        const hasNextItem = ( i + counter + 1 < typeItemList.length );
                        const nextItemTypeDifferent = hasNextItem && typeItemList[i + counter + 1].typeEffectiveness !== item.typeEffectiveness;
                        const isLastItem = ( i + counter + 1 === typeItemList.length );

                        if (nextItemTypeDifferent || isLastItem) {
                            lastOfType = ' ' + 'last-of-type-category';
                        }

                        const transparencyClasses = window.lit.determineTransparencyClasses(item, Math.floor(i / itemsPerRow) + 1, itemsPerRow, firstOfType, lastOfType);
                        return html`
                            <div class="${item.wrapperCssClasses}${firstOfType}${lastOfType} ${transparencyClasses}" data-order="${item.order}">
                                <div class="${item.iconCssClasses}" style="background-image: url('${item.iconUrl}')"></div>
                            </div>
                        `;
                    })}
                </div>
            `);
        }

        return html`
            <div class="type-effectiveness-block">
                ${rows}
            </div>
        `;
    };

    /**
     * Determines the transparency classes for sidebar type effectiveness items.
     * These classes are needed to properly draw the borders of the type categories
     * to wrap all types of a category within a "snaking" wrapper.
     * 
     * @param {Object} item - The item data object.
     * @param {number} rowCounter - The row counter.
     * @param {number} itemsPerRow - The number of items per row.
     * @param {string} firstOfType - The first-of-type class.
     * @param {string} lastOfType - The last-of-type class.
     * @returns {string} - The transparency classes.
     */
    window.lit.determineTransparencyClasses = (item, rowCounter, itemsPerRow, firstOfType, lastOfType) => {
        let transparencyClasses = '';
        /* 
        *   Create a "snaking" flow of items, (left to right => right to left => repeat)
        */

        /* First and last (only) item of category. */
        if (firstOfType && lastOfType) {
            transparencyClasses += '';
        }
        /* Even row, end of row item, continue category into next row. */
        else if (!lastOfType && !firstOfType && item.order === itemsPerRow && (rowCounter % 2 === 0)) {
            transparencyClasses += ' transp-bottom transp-right ';
        }
        /* Continue category into next row. */
        else if (!lastOfType && !firstOfType && item.order === itemsPerRow) {
            transparencyClasses += ' transp-bottom transp-left ';
        }
        /* Unven row, don't continue category into next row. */
        else if (lastOfType && item.order === itemsPerRow && (rowCounter % 2 === 1)) {
            transparencyClasses += ' transp-left ';
        }
        /* Even row, don't continue category into next row. */
        else if (lastOfType && item.order === itemsPerRow && (rowCounter % 2 === 0)) {
            transparencyClasses += ' transp-right ';
        }
        /* Start category, continue it into next row. */
        else if (firstOfType && item.order === itemsPerRow) {
            transparencyClasses += ' transp-bottom ';
        }
        /* End category with multiple items in this row. */
        else if (lastOfType && !firstOfType && item.order === itemsPerRow) {
            transparencyClasses += ' transp-left ';
        }
        /* Inbetween items that don't start or end a category. */
        else if (!lastOfType && !firstOfType && item.order > 1 && item.order < itemsPerRow) {
            transparencyClasses = ' transp-left transp-right ';
        }
        /* Unven row, end of row item, don't continue into next row. */
        else if (item.order === itemsPerRow && (rowCounter % 2 === 1)) {
            transparencyClasses += ' transp-left ';
        }
        /* Even row, start of row item, continue category. */
        else if (!lastOfType && item.order === 1 && (rowCounter % 2 === 0)) {
            transparencyClasses += ' transp-left ';
        }
        /* Unven row, inbetween items that end a category. */
        else if (lastOfType && item.order > 1 && item.order < itemsPerRow && (rowCounter % 2 === 1)) {
            transparencyClasses = ' transp-left ';
        }
        /* Even row, inbetween items that end a category. */
        else if (lastOfType && item.order > 1 && item.order < itemsPerRow && (rowCounter % 2 === 0)) {
            transparencyClasses = ' transp-right ';
        }
        /* Unven row, first of row, continue category. */
        else if (!lastOfType && !firstOfType && item.order === 1 && (rowCounter % 2 === 1)) {
            transparencyClasses = ' transp-right ';
        }
        else if (firstOfType && (rowCounter % 2 === 1)) {
            transparencyClasses += ' transp-right ';
        }
        else if (firstOfType && (rowCounter % 2 === 0)) {
            transparencyClasses += ' transp-left ';
        }

        return transparencyClasses;
    };

    /**
    * Template function for rendering the non-compact sidebar type effectiveness wrapper.
    * 
    * @param {Object} typeEffectivenesses - The type effectiveness data object.
    * @returns {TemplateResult} - The HTML template result.
    */
    window.lit.createSidebarTypeEffectivenessWrapper = (typeEffectivenesses) => html`
        ${Object.keys(typeEffectivenesses).map(effectiveness => {
            const effectivenessObj = typeEffectivenesses[effectiveness];
            if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length) || effectiveness === 'cssClasses') {
                return '';
            }

            const allTypes = [...(effectivenessObj.double || []), ...(effectivenessObj.normal || [])];
            
            return html`
                <div class="pokemon-type-effectiveness-category pokemon-type-${effectiveness}">
                    ${allTypes.map(type => html`
                    <div class="pokemon-type-icon ${typeEffectivenesses.cssClasses[type] || ''}" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${Types[type]}.png')"></div>
                    `)}
                </div>
            `;
        })}
    `;
})(window);