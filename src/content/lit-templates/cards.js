/**
 * @fileoverview Contains lit-html templates and helper functions that are being used to create 
 *          and update pokemon cards.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.lit.' prefix.
 * @file 'src/content/lit-templates/cards.js'
 */

(function(window) {
    window.lit = window.lit || {};

    /**
     * Creates a wrapper element for Pokémon cards.
     * @param {string} partyID - The ID of the party ('enemies' or 'allies').
     * @param {boolean} [showSidebar=false] - Flag indicating whether the sidebar is shown.
     * @returns {Lit-HTML-Template} The wrapper element for Pokémon cards.
     * @memberof lit
     * @function createCardWrapper
     */
    window.lit.createCardWrapper = (partyID, showSidebar) => {
        const displayClass = showSidebar ? 'hidden-because-sidebar-active' : 'active-because-sidebar-hidden';
        const classes = `${partyID.toLowerCase() === 'enemies' ? 'enemy-team' : 'allies-team'} ${displayClass}`;

        return html`
            <div id="${partyID}" class="${classes}"></div>
        `;
    };

    /**
     * Creates a div element and it's content for a Pokémon card.
     * @param {string} cardId - The ID of the Pokémon card.
     * @param {Object} pokemon - The Pokémon object.
     * @param {Lit-HTML-Template} opacitySliderTemplate - lit-html object containing the opactiy slider HTML.
     * @param {Lit-HTML-Template} typeEffectivenessHTML - lit-html object containing the type effectiveness HTML.
     * @param {Object} weather - The weather object.
     * @returns {Lit-HTML-Template} The div element for the Pokémon card.
     * @memberof lit
     * @function createPokemonCardContent
     */
    window.lit.createPokemonCardContent = (cardId, pokemon, opacitySliderTemplate, typeEffectivenessHTML, weather) => {
        const Stat = window.lit.getStatList();
        const rarityClass = (pokemon.rarity.length && (cardId.toLowerCase() === 'enemies') ? 'pokemon-rarity-' + pokemon.rarity : '');
        const maxOneTrue = [pokemon.region, pokemon.rarity, pokemon.variant].filter(Boolean).length <= 1;
        const generationLabel = (maxOneTrue ? 'Gen ' + pokemon.gen : pokemon.gen);   // add some more text when only one other element is shown

        return html`
            <div class="pokemon-cards">
                <div class="pokemon-card">
                    <div style="display: flex;">
                        <div class="${rarityClass}" style="position: relative;">
                            <canvas id="pokemon-icon_${cardId}" class="pokemon-icon"></canvas>
                            ${cardId === 'enemies' ? html`
                                <div class="card-pokemon-info enemies tooltip">
                                    ${window.lit.createPokemonTooltipDiv(pokemon)}
                                    ${pokemon.gen ? html`
                                        <span class="card-pokemon-info-generation">${generationLabel}</span>
                                    ` : '' }
                                    ${pokemon.rarity ? html`
                                        <span class="card-pokemon-info-rarity ${pokemon.rarity}">${pokemon.rarityLabel || ''}</span>
                                    ` : '' }
                                    ${pokemon.paradox ? html`
                                        <span class="card-pokemon-info-paradox">Par</span>
                                    ` : '' }
                                    ${pokemon.region ? html`
                                        <span class="card-pokemon-info-region" style="background-image: url(${window.lit.getVariantSymbol(pokemon.region)})"></span>
                                    ` : '' }
                                </div>
                            ` : '' }
                        </div>
                        ${typeEffectivenessHTML}
                    </div>
                    <div class="pokemon-card-text-wrapper">
                        <div class="text-base">
                            <div class="tooltip">
                                <span>Ability: </span>
                                <span class="${pokemon.ability.isHidden ? 'hidden-ability' : ''}">${pokemon.ability.name}</span>
                                ${window.lit.createTooltipDiv(`<span>${pokemon.ability.description}</span>`)}
                            </div>
                            ${ pokemon.nature ? html`
                                <div class="tooltip">
                                    <span>&nbsp;-&nbsp;Nature: ${pokemon.nature}</span>
                                    ${window.lit.createTooltipDiv("")}
                                </div>
                            ` : '' }
                        </div>
                        <div class="text-base">
                            <span>HP: ${pokemon.ivs[Stat.HP]}, ATK: ${pokemon.ivs[Stat.ATK]}, DEF: ${pokemon.ivs[Stat.DEF]}</span>
                        </div>
                        <div class="text-base">
                            <span>SPE: ${pokemon.ivs[Stat.SPD]}, SPD: ${pokemon.ivs[Stat.SPDEF]}, SPA: ${pokemon.ivs[Stat.SPATK]}</span>
                        </div>
                        ${weather?.type && weather?.turnsLeft ? html`
                            <div class="text-base">
                                <span>Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Creates a div element and it's content for a minified Pokémon card.
     * @param {string} cardId - The ID of the Pokémon card.
     * @param {Object} pokemon - The Pokémon object.
     * @param {string} ivsGeneratedHTML - Pre-generated html string for pokemon IVs.
     * @param {Object} weather - The weather object.
     * @returns {Lit-HTML-Template} The div element for the minified Pokémon card.
     * @memberof lit
     * @function createPokemonCardContentMinified
     */
    window.lit.createPokemonCardContentMinified = (cardId, pokemon, ivsGeneratedHTML, weather) => {
        const rarityClass = (pokemon.rarity.length && (cardId.toLowerCase() === 'enemies') ? 'pokemon-rarity-' + pokemon.rarity : '');

        return html`
            <div class="pokemon-cards">
                <div class="pokemon-card">
                    <div class="text-base centered-flex">${pokemon.name}</div>
                    <div class="text-base centered-flex">
                        <div class="image-overlay minified ${rarityClass}">
                            <canvas id="pokemon-icon_${cardId}" class="pokemon-icon minified"></canvas>
                        </div>
                        <div class="tooltip">
                            <span>Ability: </span>
                            <span class="${pokemon.ability.isHidden ? 'hidden-ability' : ''}">${pokemon.ability.name}</span>
                            ${window.lit.createTooltipDiv(`<span>${pokemon.ability.description}</span>`)}
                        </div>
                        ${ pokemon.nature ? html`
                            <div class="tooltip">
                                <span>&nbsp;-&nbsp;Nature: ${pokemon.nature}</span>
                                ${window.lit.createTooltipDiv("")}
                            </div>
                        ` : '' }
                    </div>
                    <div class="text-base stat-cont">
                        ${unsafeHTML(ivsGeneratedHTML)}
                    </div>
                    ${weather?.type && weather?.turnsLeft ? html`
                        <div class="text-base">
                            <span>Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    /**
     * Creates a wrapper element for type effectiveness.
     * @param {Object} typeEffectivenesses - The type effectiveness object.
     * @returns {Lit-HTML-Template} The wrapper element for type effectivenesses.
     * @memberof lit
     * @function createTypeEffectivenessWrapper
     */
    window.lit.createTypeEffectivenessWrapper = (typeEffectivenesses) => {
        return html`
            ${Object.keys(typeEffectivenesses).map((effectiveness) => {
                const TypeIconUrls = window.lit.getTypeIconUrls();
                const effectivenessObj = typeEffectivenesses[effectiveness];
                if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length)) return null;
                if (effectiveness === "cssClasses") return null;

                const tooltipMap = {
                    weaknesses: "Weak to",
                    resistances: "Resists",
                    immunities: "Immune to"
                };

                const allTypes = [
                    ...(effectivenessObj.double || []),
                    ...(effectivenessObj.normal || [])
                ];

                // Group types into arrays of 3.
                const groupedTypes = [];
                for (let i = 0; i < allTypes.length; i += 3) {
                    groupedTypes.push(allTypes.slice(i, i + 3));
                }

                return html`
                    <div class="pokemon-${effectiveness} tooltip">
                        ${groupedTypes.map((group) => html`
                            <div>
                                ${group.map((type) => {
                                    const cssClass = typeEffectivenesses.cssClasses[type];
                                    return html`
                                        <div class="pokemon-type-icon ${cssClass}" 
                                            style="background-image: url(${TypeIconUrls[type]})">
                                        </div>
                                    `;
                                })}
                            </div>
                        `)}
                        ${ tooltipMap[effectiveness] ? html`
                            ${window.lit.createTooltipDiv(`<span>${tooltipMap[effectiveness]}</span>`)}
                        ` : ''}
                    </div>
                `;
            })}
        `;
    };

    /**
     * Generates HTML for displaying IVs.
     * @param {Object} pokemon - The Pokémon object.
     * @param {Object} dexIvs - The IVs object.
     * @param {boolean} [simpleDisplay=false] - Flag indicating whether to display in a simple format.
     * @param {boolean} [addStyleClasses=false] - Flag indicating whether to add style classes.
     * @returns {string} The HTML for displaying IVs.
     * @memberof lit
     * @function generateCardIVsHTML
     */
    window.lit.generateCardIVsHTML = (pokemon, dexData, simpleDisplay = false, addStyleClasses = false) => {
        const Stat = window.lit.getStatList();
        const saveDataId = pokemon.basePokemonIdPreConversion;
        const dexIvs = dexData[saveDataId]?.ivs || dexData[pokemon.baseId]?.ivs || {};
    
        const getColor = (num) => {
            if (num < 0 || num > 31) {
                throw new Error('Number must be between 0 and 31');
            }
    
            const red = Math.floor(255 * (1 - num / 31));
            const green = Math.floor(255 * (num / 31));
            const blue = 0;
    
            const redHex = red.toString(16).padStart(2, '0');
            const greenHex = green.toString(16).padStart(2, '0');
            const blueHex = blue.toString(16).padStart(2, '0');
    
            return `#${redHex}${greenHex}${blueHex}`;
        };
    
        const ivComparison = (pokeIv, dexIv) => {
            let iconA = "";
            let colorS = "#00FF00";
            if (pokeIv > dexIv) {
                iconA = "↑";
                colorS = "#00FF00";
            } else if (pokeIv < dexIv) {
                iconA = "↓";
                colorS = "#FF0000";
            } else {
                iconA = "-";
                colorS = "#FFFF00";
            }
            return `<span class="stat-icon" style="color: ${colorS} !important; opacity: 0.7">${iconA}</span>`;
        };
    
        let fullHTML = '';
        for (const i in pokemon.ivs) {
            const curIV = pokemon.ivs[i];
            const dexIv = dexIvs[i];
    
            if (typeof dexIv !== 'number') {
                // Handle case where dexIv is not a number (null, undefined, or other non-numeric value)
                continue; // Skip this iteration if dexIv is not valid
            }
    
            if (simpleDisplay && !addStyleClasses) {
                fullHTML += `<div class="stat-p"><span>${Stat[i]}: </span><span class="stat-c">${curIV}</span></div>`;
            } else if (simpleDisplay && addStyleClasses) {
                fullHTML += `<div class="stat-p stat-p-colors"><span>${Stat[i]}: </span><span class="stat-c stat-c-colors">${curIV}</span></div>`;
            } else if (!simpleDisplay && addStyleClasses) {
                fullHTML += `<div class="stat-p stat-p-colors"><span>${Stat[i]}: </span><span class="stat-c stat-c-colors">${curIV}</span></div>`;
            } else {
                fullHTML += `<div class="stat-p"><span>${Stat[i]}: </span><span class="stat-c" style="color: ${getColor(curIV)}">${curIV}</span>${ivComparison(curIV, dexIv)}</div>`;
            }
        }
    
        if (fullHTML === '') {
            // Default HTML if there are no valid IVs to display
            fullHTML = `<div class="stat-p"><span>No IVs found for base/starter pokemon: ${pokemon.basePokemon}, id: ${saveDataId}</span></div>`;
        }
    
        return fullHTML;
    };
    

    /**
     * Creates a div element for arrow buttons.
     * @param {string} divId - The ID of the div element.
     * @param {string} upString - The text for the up button.
     * @param {string} downString - The text for the down button.
     * @param {boolean} showMinified - Flag indicating whether to show the minified version.
     * @param {Function} clickFunction - The function to be called on click.
     * @param {Array} additionalParams - Additional parameters for the click function.
     * @returns {Lit-HTML-Template} The div element for the arrow buttons.
     * @memberof lit
     * @function createArrowButtonsDiv
     */
    window.lit.createArrowButtonsDiv = (divId, upString, downString, showMinified, clickFunction, ...additionalParams) => {
        const isMinified = (showMinified ? 'minified' : '');
        const isMobileDevice = window.lit.mobileCheck() ? 'mobile' : 'desktop' ;    // 'desktop' added for clarity, no css needed
        const result = {};
        result.idUp = `${divId}-up`;
        result.idDown = `${divId}-down`;

        result.html = html`
            <div class="arrow-button-wrapper ${isMobileDevice} ${isMinified}">
                <button class="text-base arrow-button" @click=${(e) => clickFunction(e, ...additionalParams)} id="${result.idUp}">${upString}</button>
                <button class="text-base arrow-button" @click=${(e) => clickFunction(e, ...additionalParams)} id="${result.idDown}">${downString}</button>
            </div>
        `;
        return result;
    };

    /**
     * Creates a div element for an opacity slider.
     * @param {string} divId - The ID of the div element.
     * @param {Function} changeOpacity - The function to be called on opacity change.
     * @param {string} [initialValue="100"] - The initial value of the slider.
     * @param {string} [min="10"] - The minimum value of the slider.
     * @param {string} [max="100"] - The maximum value of the slider.
     * @returns {Object} Contains the slider element id and lit-html object.
     * @memberof lit
     * @function createOpacitySliderDiv
     */
    window.lit.createOpacitySliderDiv = (divId, changeOpacity, initialValue = "100", min = "10", max = "100") => {
        const result = {};
        result.id = `${divId}-slider`;
        result.html = html`
            <div class="slider-wrapper">
                <div class="text-base">Opacity:</div>
                <input class="op-slider" @input=${changeOpacity} type="range" min="${min}" max="${max}" value="${initialValue}" id="${result.id}">
            </div>
        `;
        return result;
    };

    window.lit.getScrollbarWidth = () => {
        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);
      
        // Creating inner element and placing it in the container
        const inner = document.createElement('div');
        outer.appendChild(inner);
        
        // Calculating difference between container's full width and the child width
        const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
      
        // Removing temporary elements from the DOM
        outer.parentNode.removeChild(outer);
      
        return scrollbarWidth;
    }

})(window);
