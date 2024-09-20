/**
 * @fileoverview Contains lit-html templates and helper functions that are being used to create and update the sidebar.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.roguedexLit.' prefix.
 * @file 'src/content/lit-templates/sidebar.js'
 */

(function (window) {
    window.roguedexLit = window.roguedexLit || {};

    /**
     * Creates the HTML template for the sidebar.
     *
     * @param {boolean} isMobile - Flag that indicates whether the extension runs on a mobile (touch) device.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - The HTML template result.
     * @function createSidebarTemplate
     */
    window.roguedexLit.createSidebarTemplate = (isMobile) => {
        const mobileTag = isMobile ? "mobile" : "";

        // prettier-ignore
        return roguedex.litHtml`
            <div class="roguedex-sidebar hideIVs" id="roguedex-sidebar" data-shown-pokemon-text-info="movesets"> 
                <div class="sidebar-header" id="sidebar-header">
                    <button id="sidebar-switch-iv-moves" class="tooltip ${mobileTag}"><span>&#8644;</span></button>
                </div>
                <div class="sidebar-enemies-box visible" id="sidebar-enemies-box"></div>
                <div class="sidebar-allies-box visible" id="sidebar-allies-box"></div>
            </div>
        `;
    };

    /**
     * Updates the sidebar header based on the session data.
     *
     * @param {Object} sessionData - The session data object.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - The HTML template result.
     * @function updateSidebarHeader
     */
    window.roguedexLit.updateSidebarHeader = (sessionData) => {
        const trainer = sessionData.trainer;
        const isTrainerBattle = trainer != null;

        // prettier-ignore
        return roguedex.litHtml`
            <span>RogueDex</span>
            ${!isTrainerBattle ? '' : roguedex.litHtml`
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
     * @param {Object} sessionData
     * @param {boolean} isMobile - Flag that indicates whether the extension runs on a mobile (touch) device.
     * @param {boolean} condensedView - Flag that indicates whether the condensed party display should be used.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - The HTML template result.
     * @function createSidebarPartyTemplate
     */
    window.roguedexLit.createSidebarPartyTemplate = (
        pokemonData,
        partyID,
        dexData,
        sessionData,
        condensedView,
        isMobile
    ) => {
        const mobileTag = isMobile ? "mobile" : "";
        return roguedex.litHtml`
            <div class="${partyID}-party">
                ${pokemonData.pokemon.map((pokemon, counter) => {
                    const saveDataId = pokemon.basePokemonIdPreConversion;
                    const ivSaveData = dexData[saveDataId].ivs || dexData[pokemon.baseId].ivs || {};
                    const allZeroStarterIVs = dexData[saveDataId]?.ivs?.every((num) => num === 0);
                    const rarityClass =
                        pokemon.rarity.length && partyID.toLowerCase() === "enemies" ?
                            "pokemon-rarity-" + pokemon.rarity
                        :   "";
                    const maxOneTrue =
                        [pokemon.region, pokemon.rarity, pokemon.variant].filter(Boolean).length <= 1;
                    const generationLabel = maxOneTrue ? "Gen " + pokemon.gen : pokemon.gen; // add some more text when only one other element as most is shown
                    const natureStats = window.roguedexLit.getNatureStatChange(pokemon.nature);
                    const natureDescriptionHTML =
                        (natureStats[0] ? `<span>+ ${natureStats[0]}</span>` : "") +
                        (natureStats[1] ? `<span>- ${natureStats[1]}</span>` : "");

                    // prettier-ignore
                    return roguedex.litHtml`
                        <div class="pokemon-entry ${condensedView}" id="sidebar_${partyID}_${counter}">
                            <div class="pokemon-entry-image tooltip ${mobileTag} ${rarityClass}">
                                ${window.roguedexLit.createPokemonTooltipDiv(pokemon)}
                                <canvas id="pokemon-icon_sidebar_${partyID}_${counter}" class="pokemon-entry-icon"></canvas>

                                ${partyID === 'allies' ? roguedex.litHtml`
                                    <div class="sidebar-pokemon-info allies">
                                        <span class="sidebar-pokemon-level">L ${pokemon.level}</span>                                        
                                        ${pokemon.shiny ? roguedex.litHtml`
                                            <div class="four-pointed-star"></div>
                                        ` : ''}
                                        ${pokemon.luck || pokemon.fusionLuck ? roguedex.litHtml`
                                            <span class="sidebar-pokemon-luck">☘ ${pokemon.luck + pokemon.fusionLuck}</span>
                                        ` : ''}
                                    </div>
                                ` : '' }
                                ${partyID === 'enemies' ? roguedex.litHtml`
                                    <div class="sidebar-pokemon-info enemies">
                                        ${pokemon.gen ? roguedex.litHtml`
                                            <span class="sidebar-pokemon-info-generation">${generationLabel}</span>
                                        ` : '' }
                                        ${pokemon.rarity ? roguedex.litHtml`
                                            <span class="sidebar-pokemon-info-rarity ${pokemon.rarity}">${pokemon.rarityLabel || ''}</span>
                                        ` : '' }
                                        ${pokemon.paradox ? roguedex.litHtml`
                                            <span class="sidebar-pokemon-info-paradox">Par</span>
                                        ` : '' }
                                        ${pokemon.region ? roguedex.litHtml`
                                            <div class="sidebar-pokemon-info-region" style="background-image: url(${window.roguedexLit.getVariantSymbol(pokemon.region)})"></div>
                                        ` : '' }
                                    </div>
                                ` : '' }
                            </div>
                            <div class="pokemon-type-effectiveness-wrapper compact">
                                ${window.roguedexLit.createSidebarTypeEffectivenessWrapperCompact(pokemon.typeEffectiveness, isMobile, 5, 3)}
                            </div>
                            <div class="pokemon-type-effectiveness-wrapper default">
                                ${window.roguedexLit.createSidebarTypeEffectivenessWrapper(pokemon.typeEffectiveness, isMobile)}
                            </div>
                            <div class="pokemon-info-text-wrapper">
                                <div class="pokemon-ability-nature">
                                    <span class="pokemon-ability  ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
                                        <span class="pokemon-ability-description">Ability:</span>
                                        <div class="tooltip ${mobileTag}" style="display:inline;">
                                            <span class="pokemon-ability-value">${pokemon.ability.name}</span>
                                            ${window.roguedexLit.createTooltipDiv(`<span>${pokemon.ability.description}</span>`)}
                                        </div>                                                                                
                                    </span>
                                    <span class="pokemon-nature">
                                        <span class="pokemon-nature-description">Nature:</span>
                                        <div class="tooltip ${mobileTag}" style="display:inline;">
                                            <span class="pokemon-nature-value">${pokemon.nature}</span>
                                            ${window.roguedexLit.createTooltipDiv(natureDescriptionHTML)}
                                        </div>
                                    </span>
                                </div>
                                <div class="pokemon-ivs stat-cont ${allZeroStarterIVs ? 'warn-zeroIVs' : ''}">
                                    ${window.roguedexLit.generateIVsHTML(pokemon, ivSaveData, partyID === 'allies', partyID === 'allies')}
                                </div>
                                ${partyID === 'enemies' ? '' : roguedex.litHtml`
                                    <div class="pokemon-moveset-wrapper">
                                        ${window.roguedexLit.generateMovesetHTML(pokemon, isMobile)}
                                    </div>
                                `}                       
                            </div>
                        </div>
                    `;
                })}            
            </div>
        `;
    };

    /**
     * Decides whether to show the default or a condensed view of the pokemon type effectivenesses,
     * based on how many poekmon are participating in the battle.
     *
     * @param {Object} sessionData - The session data object.
     * @param {number} maxPokemonForDetailedView - The maximum number of Pokémon for detailed view.
     * @memberof roguedexLit
     * @returns {string} - The CSS class.
     * @function getCssClassCondensed
     */
    window.roguedexLit.getCssClassCondensed = (sessionData, maxPokemonForDetailedView) => {
        const totalPartySize = sessionData.enemyParty.length + sessionData.party.length;

        if (maxPokemonForDetailedView !== null && totalPartySize > maxPokemonForDetailedView) {
            return "condensed";
        }
        return "";
    };

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
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - A lit-html template result representing the HTML markup.
     * @function generateIVsHTML
     */
    window.roguedexLit.generateIVsHTML = (pokemon, dexIvs, simpleDisplay = false, addStyleClasses = false) => {
        const Stat = window.roguedexLit.getStatList();
        const ivs = pokemon.ivs || {};
        const saveDataId = pokemon.basePokemonIdPreConversion;
        const defaultHtml = roguedex.litHtml`<div>No IVs found for base/starter pokemon: ${pokemon.basePokemon}, id: ${saveDataId}</div>`;

        // prettier-ignore
        return roguedex.litHtml`
            ${Object.keys(ivs).length > 0 ? Object.keys(ivs).map(i => {
                const curIV = ivs[i];
                const dexIv = dexIvs[i];
                const isBetter = curIV > dexIv;
                const isWorse = curIV < dexIv;
                const icon = isBetter ? '↑' : (isWorse ? '↓' : '-');
                const color = isBetter ? '#00FF00' : (isWorse ? '#FF0000' : '#FFFF00');
                const colorStyle = !simpleDisplay && !addStyleClasses ? { color } : {};
                const statClass = addStyleClasses ? `stat-p-colors` : '';
                const valueClass = addStyleClasses ? `stat-c-colors` : '';

                return roguedex.litHtml`
                    <div class="stat-p ${statClass}">
                        <span>${Stat[i]}:</span>
                        <span class="stat-c ${valueClass}" style=${roguedex.litStyleMap(colorStyle)}>
                            ${curIV}
                        </span>
                        ${ simpleDisplay ? '' : roguedex.litHtml`
                            <span class="stat-icon">${icon}</span>
                        `}
                    </div>
                `;
            }) : defaultHtml}
        `;
    };

    /**
     * Generates HTML for displaying a Pokemon's moveset.
     *
     * @param {object} pokemon - Object representing all data known about this current Pokémon.
     * @param {boolean} isMobile - Flag that indicates whether the extension runs on a mobile (touch) device.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - A lit-html template result representing the HTML markup.
     * @function
     */
    window.roguedexLit.generateMovesetHTML = (pokemon, isMobile) => {
        const mobileTag = isMobile ? "mobile" : "";
        return roguedex.litHtml`
            ${Object.keys(pokemon.moveset).map((i) => {
                const move = pokemon.moveset[i];
                let moveTipHTML = "";
                moveTipHTML += `<span>Name: ${move.name}</span>`;
                moveTipHTML += `<span>Type: ${move.type}</span>`;
                moveTipHTML += `<span>Category: ${move.category}</span>`;
                moveTipHTML += `<span>Power: ${move.power}</span>`;
                moveTipHTML += `<span>Accuracy: ${move.accuracy}</span>`;

                // prettier-ignore
                return roguedex.litHtml`
                    <div class="pokemon-move">
                        <span class="pokemon-move-name move-${move.type.toLowerCase()} tooltip ${mobileTag}">
                            ${move.name}
                            ${window.roguedexLit.createTooltipDiv(moveTipHTML)}
                        </span>
                    </div>
                `;
            })}
        `;
    };

    /**
     * Creates the HTML template for the compact sidebar type effectiveness wrapper.
     * Type categories are directly chained after each other, continuing rows in a
     * "snaking" manner, with type icons being shown flowing right to left, left to right
     * in multiple rows.
     *
     * @param {Object} typeEffectivenesses - The type effectiveness data object.
     * @param {boolean} isMobile - Flag that indicates whether the extension runs on a mobile (touch) device.
     * @param {number} maxItemsPerRow - The maximum number of items per row.
     * @param {number} maxRows - The maximum number of rows.
     * @param {boolean} growRowLength - Whether to grow the row length.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - The HTML template result.
     * @function createSidebarTypeEffectivenessWrapperCompact
     */
    window.roguedexLit.createSidebarTypeEffectivenessWrapperCompact = (
        typeEffectivenesses,
        isMobile,
        maxItemsPerRow = 5,
        maxRows = 4,
        growRowLength = true
    ) => {
        const mobileTag = isMobile ? "mobile" : "";
        const TypeIconUrls = window.roguedexLit.getTypeIconUrls();
        const typeItemList = [];
        let globalCounter = 0;
        let itemsPerRow = maxItemsPerRow;
        let numberOfRows = maxRows;
        let totalNumberOfTypes = 0;

        try {
            totalNumberOfTypes = Object.keys(typeEffectivenesses.cssClasses).length;
        } catch {}

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
            if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length))
                return;
            if (effectiveness === "cssClasses") return;

            const allTypes = [...(effectivenessObj.double || []), ...(effectivenessObj.normal || [])];

            allTypes.forEach((type) => {
                const iconCssClass = (() => {
                    try {
                        return `pokemon-type-icon ${typeEffectivenesses.cssClasses[type]}`;
                    } catch {
                        return "pokemon-type-icon";
                    }
                })();

                const tempListItem = {
                    iconCssClasses: iconCssClass,
                    typeEffectiveness: effectiveness,
                    type,
                    iconUrl: `${TypeIconUrls[type]}`,
                    wrapperCssClasses: `type-effectiveness-category pokemon-type-${effectiveness}`,
                    additionalStyles: "",
                    order: (globalCounter % itemsPerRow) + 1,
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
            rows.push(roguedex.litHtml`
                <div class="type-effectiveness-row">
                    ${rowItems.map((item, counter) => {
                        const firstOfType =
                            (
                                counter === 0 ||
                                rowItems[counter - 1].typeEffectiveness !== item.typeEffectiveness
                            ) ?
                                " " + "first-of-type-category"
                            :   "";

                        let lastOfType = "";
                        const hasNextItem = i + counter + 1 < typeItemList.length;
                        const nextItemTypeDifferent =
                            hasNextItem &&
                            typeItemList[i + counter + 1].typeEffectiveness !== item.typeEffectiveness;
                        const isLastItem = i + counter + 1 === typeItemList.length;

                        if (nextItemTypeDifferent || isLastItem) {
                            lastOfType = " " + "last-of-type-category";
                        }

                        const transparencyClasses = window.roguedexLit.determineTransparencyClasses(
                            item,
                            Math.floor(i / itemsPerRow) + 1,
                            itemsPerRow,
                            firstOfType,
                            lastOfType
                        );
                        const typeToolTipHTML = window.roguedexLit.getTypeIconToolTipHTML(
                            item.typeEffectiveness,
                            item.iconCssClasses,
                            item.type
                        );

                        // prettier-ignore
                        return roguedex.litHtml`
                            <div class="${item.wrapperCssClasses}${firstOfType}${lastOfType} ${transparencyClasses}" data-order="${item.order}">
                                <div class="pokemon-type-icon-wrapper tooltip ${mobileTag}">
                                    <div class="${item.iconCssClasses}" style="background-image: url('${item.iconUrl}'); ${item.additionalStyles}"></div>
                                    ${window.roguedexLit.createTooltipDiv(typeToolTipHTML)}
                                </div>
                            </div>
                        `;
                    })}
                </div>
            `);
        }

        // prettier-ignore
        return roguedex.litHtml`
            <div class="type-effectiveness-block">
                ${rows}
            </div>
        `;
    };

    /**
     * Creates a tooltip that shows which element (type) the type icon represents, whether the pokemon is weak, resistant or immune to the type
     * and what dmg multiplier applies.
     *
     * @param {string} typeEffectiveness - Type effectiveness category (immunities / resistances / weaknesses).
     * @param {string} iconCssClasses - Type icon css classes string.
     * @param {string} type
     * @memberof roguedexLit
     * @returns {string} - The HTML as a string.
     * @function getTypeIconToolTipHTML
     */
    window.roguedexLit.getTypeIconToolTipHTML = (typeEffectiveness, iconCssClasses, type) => {
        const weakLabel = "Weak";
        const resistLabel = "Resistant";
        const immuneLabel = "Immune";
        let effectivenessLabel =
            typeEffectiveness.toLowerCase() === "resistances" ? resistLabel
            : typeEffectiveness.toLowerCase() === "weaknesses" ? weakLabel
            : immuneLabel;
        effectivenessLabel =
            iconCssClasses.includes("super") ? "Very " + effectivenessLabel : effectivenessLabel;

        const dmgMultiObj = {
            "no-dmg": 0,
            "double-dmg": 2,
            "super-dmg": 4,
            resist: 0.5,
            "super-resist": 0.25,
        };
        const dmgMultiKey =
            Object.keys(dmgMultiObj) // searches for the keys as substrings in iconCssClasses
                .sort((a, b) => b.length - a.length) // sort by length first to make sure to find "super-resist" before "resist"
                .find((key) => iconCssClasses.includes(key)) || "";
        const dmgMulti = dmgMultiKey ? "x" + dmgMultiObj[dmgMultiKey] : "unknown";
        const typeToolTipHTML = `<span>${window.roguedexLit.capitalizeFirstLetter(type)}</span><span>${effectivenessLabel}</span><span>DMG: <b>${dmgMulti}</b></span>`;

        return typeToolTipHTML;
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
     * @memberof roguedexLit
     * @returns {string} - The transparency classes.
     * @function determineTransparencyClasses
     */
    window.roguedexLit.determineTransparencyClasses = (item, rowCounter, itemsPerRow, firstOfType, lastOfType) => {
        let transparencyClasses = "";
        /*
         *   Create a "snaking" flow of items, (left to right => right to left => repeat)
         */

        if (firstOfType && lastOfType) {
            /* First and last (only) item of category. */
            transparencyClasses += "";
        } else if (!lastOfType && !firstOfType && item.order === itemsPerRow && rowCounter % 2 === 0) {
            /* Even row, end of row item, continue category into next row. */
            transparencyClasses += " transp-bottom transp-right ";
        } else if (!lastOfType && !firstOfType && item.order === itemsPerRow) {
            /* Continue category into next row. */
            transparencyClasses += " transp-bottom transp-left ";
        } else if (lastOfType && item.order === itemsPerRow && rowCounter % 2 === 1) {
            /* Unven row, don't continue category into next row. */
            transparencyClasses += " transp-left ";
        } else if (lastOfType && item.order === itemsPerRow && rowCounter % 2 === 0) {
            /* Even row, don't continue category into next row. */
            transparencyClasses += " transp-right ";
        } else if (firstOfType && item.order === itemsPerRow) {
            /* Start category, continue it into next row. */
            transparencyClasses += " transp-bottom ";
        } else if (lastOfType && !firstOfType && item.order === itemsPerRow) {
            /* End category with multiple items in this row. */
            transparencyClasses += " transp-left ";
        } else if (!lastOfType && !firstOfType && item.order > 1 && item.order < itemsPerRow) {
            /* Inbetween items that don't start or end a category. */
            transparencyClasses = " transp-left transp-right ";
        } else if (item.order === itemsPerRow && rowCounter % 2 === 1) {
            /* Unven row, end of row item, don't continue into next row. */
            transparencyClasses += " transp-left ";
        } else if (!lastOfType && item.order === 1 && rowCounter % 2 === 0) {
            /* Even row, start of row item, continue category. */
            transparencyClasses += " transp-left ";
        } else if (lastOfType && item.order > 1 && item.order < itemsPerRow && rowCounter % 2 === 1) {
            /* Unven row, inbetween items that end a category. */
            transparencyClasses = " transp-left ";
        } else if (lastOfType && item.order > 1 && item.order < itemsPerRow && rowCounter % 2 === 0) {
            /* Even row, inbetween items that end a category. */
            transparencyClasses = " transp-right ";
        } else if (!lastOfType && !firstOfType && item.order === 1 && rowCounter % 2 === 1) {
            /* Unven row, first of row, continue category. */
            transparencyClasses = " transp-right ";
        } else if (firstOfType && rowCounter % 2 === 1) {
            transparencyClasses += " transp-right ";
        } else if (firstOfType && rowCounter % 2 === 0) {
            transparencyClasses += " transp-left ";
        }

        return transparencyClasses;
    };

    /**
     * Template function for rendering the non-compact sidebar type effectiveness wrapper.
     *
     * @param {Object} typeEffectivenesses - The type effectiveness data object.
     * @param {boolean} isMobile - Flag that indicates whether the extension runs on a mobile (touch) device.
     * @memberof roguedexLit
     * @returns {Lit-HTML-Template} - The HTML template result.
     * @function createSidebarTypeEffectivenessWrapper
     */
    window.roguedexLit.createSidebarTypeEffectivenessWrapper = (typeEffectivenesses, isMobile) => {
        const mobileTag = isMobile ? "mobile" : "";
        return roguedex.litHtml`
            ${Object.keys(typeEffectivenesses).map((effectiveness) => {
                const TypeIconUrls = window.roguedexLit.getTypeIconUrls();
                const effectivenessObj = typeEffectivenesses[effectiveness];
                if (
                    !effectivenessObj ||
                    (!effectivenessObj.normal?.length && !effectivenessObj.double?.length) ||
                    effectiveness === "cssClasses"
                ) {
                    return "";
                }

                const allTypes = [...(effectivenessObj.double || []), ...(effectivenessObj.normal || [])];

                // prettier-ignore
                return roguedex.litHtml`
                    <div class="pokemon-type-effectiveness-category pokemon-type-${effectiveness}">
                        ${allTypes.map((type) => {
                            const typeToolTipHTML = window.roguedexLit.getTypeIconToolTipHTML(effectiveness, typeEffectivenesses.cssClasses[type], type);

                            return roguedex.litHtml`                    
                                <div class="pokemon-type-icon-wrapper tooltip ${mobileTag}">
                                    <div class="pokemon-type-icon ${typeEffectivenesses.cssClasses[type] || ''}" style="background-image: url('${TypeIconUrls[type]}'), url('${TypeIconUrls[type]}');"></div>
                                    ${window.roguedexLit.createTooltipDiv(typeToolTipHTML)}
                                </div>
                            `;
                        })}
                    </div>
                `;
            })}
        `;
    };
})(window);
