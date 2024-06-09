/**
 * @fileoverview Contains lit-html templates and helper functions that are being used to create 
 *          and update pokemon cards.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.lit.' prefix.
 * @file 'src/content/lit-templates/cards.js'
 */

(function(window) {
    window.lit = window.lit || {};

    window.lit.createCardWrapper = (partyID, showSidebar = false) => {
        const classes = `${partyID == 'enemies' ? 'enemy-team' : 'allies-team'} ${showSidebar ? 'hidden' : ''}`;

        return html`
            <div id="${partyID}" class="${classes}"></div>
        `;
    };    

    window.lit.createPokemonCardDiv = (cardId, pokemon, opacitySlider, typeEffectivenessHTML, weather) => {
        return html`
            <div class="pokemon-cards">
                <div class="pokemon-card">
                    ${opacitySlider.html}
                    <div style="display: flex;">
                        <canvas id="pokemon-icon_${cardId}" class="pokemon-icon"></canvas>
                        ${typeEffectivenessHTML}
                    </div>
                    <div class="text-base">
                        <div class="tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
                            Ability: ${pokemon.ability.name}
                            ${window.lit.createTooltipDiv(pokemon.ability.description)}
                        </div>
                        &nbsp-&nbsp 
                        <div class="tooltip">
                            Nature: ${pokemon.nature}
                            ${window.lit.createTooltipDiv("")}
                        </div>
                    </div>
                    <div class="text-base">
                        HP: ${pokemon.ivs[Stat.HP]}, ATK: ${pokemon.ivs[Stat.ATK]}, DEF: ${pokemon.ivs[Stat.DEF]}
                    </div>
                    <div class="text-base">
                        SPE: ${pokemon.ivs[Stat.SPD]}, SPD: ${pokemon.ivs[Stat.SPDEF]}, SPA: ${pokemon.ivs[Stat.SPATK]}
                    </div>
                    ${weather?.type && weather?.turnsLeft ? html`
                        <div class="text-base">Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    window.lit.createPokemonCardDivMinified = (cardId, pokemon, dexIvs, ivsGeneratedHTML, weather) => {
        return html`
            <div class="pokemon-cards">
                <div class="pokemon-card">
                    <div class="text-base centered-flex">${pokemon.name}</div>
                    <div class="text-base centered-flex">
                        <div class="image-overlay">
                            <canvas id="pokemon-icon_${cardId}" class="pokemon-icon"></canvas>
                        </div>
                        <div class="tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
                            Ability: ${pokemon.ability.name} 
                            ${window.lit.createTooltipDiv(pokemon.ability.description)}
                        </div>
                        &nbsp-&nbsp 
                        <div class="tooltip">
                            Nature: ${pokemon.nature}
                            ${window.lit.createTooltipDiv("")}
                        </div>
                    </div>
                    <div class="text-base stat-cont">
                        ${unsafeHTML(ivsGeneratedHTML)}
                    </div>
                    ${(weather?.type && weather?.turnsLeft) ?
                        html`<div class="text-base">Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</div>` : ''}
                </div>
            </div>
        `;
    };

    window.lit.createTypeEffectivenessWrapper = (typeEffectivenesses) => {
        return html`
            ${Object.keys(typeEffectivenesses).map((effectiveness) => {
                const effectivenessObj = typeEffectivenesses[effectiveness];
                if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length)) return;
                if (effectiveness === "cssClasses") return;               

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
                                            style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${Types[type]}.png')"></div>
                                    `;
                                })}
                            </div>
                        `)}
                        ${window.lit.createTooltipDiv(tooltipMap[effectiveness] || "")}
                    </div>
                `;
            })}
        `;
    };    

    window.lit.generateCardIVsHTML = (pokemon, dexIvs, simpleDisplay = false, addStyleClasses = false) => {
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
            return `<div class="stat-icon" style="color: ${colorS} !important; opacity: 0.3">${iconA}</div>`;
        };

        let fullHTML = ``;
        for (const i in pokemon.ivs) {
            const curIV = pokemon.ivs[i];
            if (simpleDisplay && !addStyleClasses) {
                fullHTML += `<div class="stat-p">${Stat[i]}:&nbsp;<div class="stat-c">${curIV}</div>&nbsp;&nbsp;</div>`;
            } else if (simpleDisplay && addStyleClasses) {
                fullHTML += `<div class="stat-p stat-p-colors">${Stat[i]}:&nbsp;<div class="stat-c stat-c-colors">${curIV}</div>&nbsp;&nbsp;</div>`;
            } else if (!simpleDisplay && addStyleClasses) {
                fullHTML += `<div class="stat-p stat-p-colors">${Stat[i]}:&nbsp;<div class="stat-c stat-c-colors">${curIV}</div>&nbsp;&nbsp;</div>`;
            } else {
                fullHTML += `<div class="stat-p">${Stat[i]}:&nbsp;<div class="stat-c" style="color: ${getColor(curIV)}">${curIV}${ivComparison(curIV, dexIvs[i])}</div>&nbsp;&nbsp;</div>`;
            }
        }
        return fullHTML;
    };

    window.lit.createArrowButtonsDiv = (divId, upString, downString, showMinified, clickFunction, ...additionalParams) => {
        const sizes = (showMinified ? "1em !important" : "2.5em !important");
        const result = {};
        result.idUp = `${divId}-up`;
        result.idDown = `${divId}-down`;
        result.html = html`
            <div class="arrow-button-wrapper" style="font-size: ${sizes}">
                <button class="text-base arrow-button" @click=${(e) => clickFunction(e, ...additionalParams)} id="${result.idUp}">${upString}</button>
                <button class="text-base arrow-button" @click=${(e) => clickFunction(e, ...additionalParams)} id="${result.idDown}">${downString}</button>
            </div>
        `;
        return result;
    };

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

})(window);
