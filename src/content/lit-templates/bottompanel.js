/**
 * @fileoverview Contains lit-html templates and helper functions that are being used to create and update the bottompanel.
 *          Functions and templates are added to the window as properties.
 *          Accessible with the 'window.lit.' prefix.
 * @file 'src/content/lit-templates/bottompanel.js'
 */

(function(window) {
    window.lit = window.lit || {};

    /**
     * Creates the template for the bottom panel.
     * @function createBottomPanelTemplate
     * @returns {Lit-HTML-Template} The HTML template for the bottom panel.
     */
    window.lit.createBottomPanelTemplate = () => {
        return html`
            <div class="roguedex-bottom-panel sidebar-Left" id="roguedex-bottom-panel"></div>
        `;
    };

    /**
     * Changes which tab contents are displayed in the bottom panel.
     * 
     * @function updateActiveTab
     * @param {string} tabId - The ID of the tab to make active.
     */
    window.lit.updateActiveTab = (tabId) => {
        const tabs = document.querySelectorAll('.bottom-panel-tab-content');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabId);
        });

        const buttons = document.querySelectorAll('.bottom-panel-tab-button');
        buttons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
        });
    };

    /**
     * Retrieves the ID of the active tab in the bottom panel.
     * 
     * @function getActiveTab
     * @memberof lit
     * @returns {string|null} The ID of the active tab, or null if no tab is active.
     */
    window.lit.getActiveTab = () => {
        const activeTab = document.querySelector('.bottom-panel-tab-content.active');
        return activeTab ? activeTab.id : null;
    };

    /**
     * Creates the template for the content of the bottom panel.
     * @function createBottomPanelContentTemplate
     * @param {Object} sessionData - The session data.
     * @param {Object} pokemonData - The data for the Pokémon.
     * @param {Function} showTab - The function to show a specific tab.
     * @memberof lit
     * @returns {Lit-HTML-Template} The HTML template for the content of the bottom panel.
     */
    window.lit.createBottomPanelContentTemplate = (sessionData, pokemonData, showTab) => {
        const activeTab = 'bottom-panel-global'; // Default to showing the global tab initially

        let luckTotal = 0;
        if (pokemonData.partyId === 'allies') {
            luckTotal = pokemonData.pokemon.reduce((total, pokemon) => total + pokemon.luck + pokemon.fusionLuck, 0);
        }

        const weatherHtml = window.lit.createWeatherHtml(pokemonData.weather);
        const modifierHtml = window.lit.generateBattleModifierHtml(sessionData, luckTotal);
        const pokemonTabsHtml = window.lit.createPokemonTabsHtml(pokemonData.pokemon, activeTab);

        return html`
            <div class="roguedex-bottom-panel-content">
                <div class="bottom-panel-tabs">
                    <div class="bottom-panel-tab-buttons">
                        <button class="bottom-panel-tab-button active" data-tab="bottom-panel-global" @click=${() => showTab('bottom-panel-global')}>Global</button>
                        ${pokemonData.pokemon.map((pokemon, index) => html`
                            <button class="bottom-panel-tab-button ${activeTab === 'bottom-panel-pokemon-' + index ? 'active' : ''}" 
                                @click=${() => showTab(`bottom-panel-pokemon-${index}`)}
                                data-tab="bottom-panel-pokemon-${index}"
                            >${pokemon.name}
                            </button>
                        `)}
                    </div>
                    <div class="bottom-panel-tab-content" id="bottom-panel-global">
                        ${weatherHtml ? weatherHtml : ''}
                        ${modifierHtml}
                    </div>
                    ${pokemonTabsHtml}
                </div>
            </div>
        `;
    };

    /**
     * Creates the HTML for the weather information if applicable.
     * 
     * @param {Object} weather - The weather data object.
     * @param {string} weather.type - The type of weather.
     * @param {number} weather.turnsLeft - The number of turns left for the weather.
     * @memberof lit
     * @returns {Lit-HTML-Template|null} - The HTML template for the weather or null if no weather data.
     */
    window.lit.createWeatherHtml = (weather) => {
        if (weather.type && weather.turnsLeft) {
            return html`
                <div class="bottom-panel-weather-box">
                    <div class="text-base">
                        <span>Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</span>
                    </div>
                </div>
            `;
        }
        return null;
    };

    /**
     * Creates the HTML for the tabs corresponding to each Pokémon.
     * @function createPokemonTabsHtml
     * @param {Array<Object>} pokemonArray - An array of Pokémon data objects.
     * @param {string} activeTab - The ID of the active tab.
     * @memberof lit
     * @returns {Array<Lit-HTML-Template>} An array of HTML templates for the Pokémon tabs.
     */
    window.lit.createPokemonTabsHtml = (pokemonArray, activeTab) => {
        return pokemonArray.map((pokemon, index) => html`
            <div class="bottom-panel-tab-content ${activeTab === 'bottom-panel-pokemon-' + index ? 'active' : ''}" id="bottom-panel-pokemon-${index}">
                ${window.lit.createPokemonTable(pokemon)}
            </div>
        `);
    };

    /**
     * Creates a table HTML template for an individual Pokémon's data.
     * Adds tables which list and summarize data of all kinds of pokemon specific modifers that are currently active.
     * 
     * @param {Object} pokemon - The data object for the Pokémon.
     * @memberof lit
     * @returns {Lit-HTML-Template} - The HTML template for the Pokémon data table.
     */
    window.lit.createPokemonTable = (pokemon) => {
        const modifiers = {
            leftOvers: window.lit.getModifier(pokemon?.modifiers?.others, 'LEFTOVERS'),
            wideLens: window.lit.getModifier(pokemon?.modifiers?.others, 'WIDE_LENS'),
            kingsRock: window.lit.getModifier(pokemon?.modifiers?.others, 'KINGS_ROCK'),
            focusBand: window.lit.getModifier(pokemon?.modifiers?.others, 'FOCUS_BAND'),
            gripClaw: window.lit.getModifier(pokemon?.modifiers?.others, 'GRIP_CLAW'),
            soulDew: window.lit.getModifier(pokemon?.modifiers?.others, 'SOUL_DEW'),
            goldenPunch: window.lit.getModifier(pokemon?.modifiers?.others, 'GOLDEN_PUNCH'),
            shellBell: window.lit.getModifier(pokemon?.modifiers?.others, 'SHELL_BELL'),
            goldenEgg: window.lit.getModifier(pokemon?.modifiers?.others, 'GOLDEN_EGG'),
            reviverSeed: window.lit.getModifier(pokemon?.modifiers?.others, 'REVIVER_SEED'),
            sootheBell: window.lit.getModifier(pokemon?.modifiers?.others, 'SOOTHE_BELL'),
            baton: window.lit.getModifier(pokemon?.modifiers?.others, 'BATON'),
            luckEgg: window.lit.getModifier(pokemon?.modifiers?.others, 'LUCKY_EGG'),
            minyBlackhole: window.lit.getModifier(pokemon?.modifiers?.others, 'MINI_BLACK_HOLE'),
        
            typeBooster_normal: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'SILK_SCARF'),
            typeBooster_fight: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'BLACK_BELT'),
            typeBooster_flying: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'SHARP_BEAK'),
            typeBooster_poison: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'POISON_BARB'),
            typeBooster_ground: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'SOFT_SAND'),
            typeBooster_rock: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'HARD_STONE'),
            typeBooster_bug: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'SILVER_POWDER'),
            typeBooster_ghost: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'SPELL_TAG'),
            typeBooster_steel: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'METAL_COAT'),
            typeBooster_fire: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'CHARCOAL'),
            typeBooster_water: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'MYSTIC_WATER'),
            typeBooster_grass: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'MIRACLE_SEED'),
            typeBooster_electric: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'MAGNET'),
            typeBooster_psychic: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'TWISTED_SPOON'),
            typeBooster_ice: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'NEVER_MELT_ICE'),
            typeBooster_dragon: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'DRAGON_FANG'),
            typeBooster_dark: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'BLACK_GLASSES'),
            typeBooster_fairy: window.lit.getModifier(pokemon?.modifiers?.attackBoosts, 'FAIRY_FEATHER')
        };

        const modifiersList = [
            { label: 'Accuracy Up (Wide Lens)', value: modifiers.wideLens.stackCount * 5, unit: '' },
            { label: 'Flinch chance (King\'s Rock)', value: modifiers.kingsRock.stackCount * 10, unit: '%' },
            { label: 'Survive chance (Focus Band)', value: modifiers.focusBand.stackCount * 10, unit: '%' },
            { label: 'Steal chance (Grip Claw)', value: modifiers.gripClaw.stackCount * 10, unit: '%' },
            { label: 'Soul Dew', value: modifiers.soulDew.stackCount * 1, unit: '' },
            { label: 'DMG converted to money', value: modifiers.goldenPunch.stackCount * 50, unit: '%' },
            { label: 'Reviver Seed', value: modifiers.reviverSeed.stackCount * 1, unit: '' },
            { label: 'Baton', value: modifiers.baton.stackCount * 1, unit: '' },
            { label: 'Miny Blackhole', value: modifiers.minyBlackhole.stackCount * 1, unit: '' },        
            { label: 'Friendship EXP+', value: modifiers.sootheBell.stackCount * 50, unit: '%' },
            { label: 'EXP+', value: modifiers.luckEgg.stackCount * 100 + modifiers.goldenEgg.stackCount * 40, unit: '%' },
            { label: 'HP Leech (Soothe Bell)', value: Math.floor(Math.max(modifiers.shellBell.stackCount * 12.5), 100), unit: '%' },
            { label: 'Recover HP (Leftovers)', value: Math.floor(Math.max(modifiers.leftOvers.stackCount * 6.25), 100), unit: '%' },

            { label: 'Normal dmg+', value: modifiers.typeBooster_normal.stackCount * 20, unit: '%' },
            { label: 'Fighting dmg+', value: modifiers.typeBooster_fight.stackCount * 20, unit: '%' },
            { label: 'Flying dmg+', value: modifiers.typeBooster_flying.stackCount * 20, unit: '%' },
            { label: 'Poison dmg+', value: modifiers.typeBooster_poison.stackCount * 20, unit: '%' },
            { label: 'Ground dmg+', value: modifiers.typeBooster_ground.stackCount * 20, unit: '%' },
            { label: 'Rock dmg+', value: modifiers.typeBooster_rock.stackCount * 20, unit: '%' },
            { label: 'Bug dmg+', value: modifiers.typeBooster_bug.stackCount * 20, unit: '%' },
            { label: 'Ghost dmg+', value: modifiers.typeBooster_ghost.stackCount * 20, unit: '%' },
            { label: 'Steel dmg+', value: modifiers.typeBooster_steel.stackCount * 20, unit: '%' },
            { label: 'Fire dmg+', value: modifiers.typeBooster_fire.stackCount * 20, unit: '%' },
            { label: 'Water dmg+', value: modifiers.typeBooster_water.stackCount * 20, unit: '%' },
            { label: 'Grass dmg+', value: modifiers.typeBooster_grass.stackCount * 20, unit: '%' },
            { label: 'Electric dmg+', value: modifiers.typeBooster_electric.stackCount * 20, unit: '%' },
            { label: 'Psychic dmg+', value: modifiers.typeBooster_psychic.stackCount * 20, unit: '%' },
            { label: 'Ice dmg+', value: modifiers.typeBooster_ice.stackCount * 20, unit: '%' },
            { label: 'Dragon dmg+', value: modifiers.typeBooster_dragon.stackCount * 20, unit: '%' },
            { label: 'Dark dmg+', value: modifiers.typeBooster_dark.stackCount * 20, unit: '%' },
            { label: 'Fairy dmg+', value: modifiers.typeBooster_fairy.stackCount * 20, unit: '%' }
        ];

        const createModifiersTable = (modifiersList) => {
            // Filter out modifiers with value 0, undefined, or null
            const filteredModifiers = modifiersList.filter(modifier => modifier.value);
        
            // If no modifiers are present, return a single row with the fallback message
            if (filteredModifiers.length === 0) {
                return html`
                    <table class="bottom-panel-enemy-modifiers">
                        <tr>
                            <td colspan="4">This pokemon currently has none of the chosen modifiers.</td>
                        </tr>
                    </table>
                `;
            }
        
            // Split the filteredModifiers into groups of 12 modifiers per table (6 rows, 2 cells per row)
            const tables = [];
            for (let i = 0; i < filteredModifiers.length; i += 12) {
                tables.push(filteredModifiers.slice(i, i + 12));
            }
        
            return html`
                ${tables.map(table => html`
                    <table class="bottom-panel-pokemon-modifiers">
                        ${table.map((modifier, index) => index % 2 === 0 ? html`
                            <tr>
                                <td class="modifier-label">${modifier.label}</td>
                                <td class="modifier-value">${modifier.value}${modifier.unit}</td>
                                ${table[index + 1] ? html`
                                    <td class="modifier-label">${table[index + 1].label}</td>
                                    <td class="modifier-value">${table[index + 1].value}${table[index + 1].unit}</td>
                                ` : html`
                                    <td class="modifier-label"></td>
                                    <td class="modifier-value"></td>
                                `}
                            </tr>
                        ` : '')}
                    </table>
                `)}
            `;
        };

        return createModifiersTable(modifiersList);
    };

    /**
     * Generates the HTML for the battle modifiers (general modifiers that affect pokemon
     * but are non-specific to each one).
     * 
     * @function generateBattleModifierHtml
     * @param {Object} sessionData - The session data containing various modifiers.
     * @param {number} luckTotal - The total luck value from the party.
     * @memberof lit
     * @returns {Lit-HTML-Template} The HTML template for the battle modifiers.
     */
    window.lit.generateBattleModifierHtml = (sessionData, luckTotal) => {
        const modifiers = {
            expCharmGold: window.lit.getModifier(sessionData?.modifiers, 'GOLDEN_EXP_CHARM'),
            expCharmNormal: window.lit.getModifier(sessionData?.modifiers, 'EXP_CHARM'),
            expCharmSuper: window.lit.getModifier(sessionData?.modifiers, 'SUPER_EXP_CHARM'),
            expShare: window.lit.getModifier(sessionData?.modifiers, 'EXP_SHARE'),
            candyJars: window.lit.getModifier(sessionData?.modifiers, 'CANDY_JAR'),
            amuletCoins: window.lit.getModifier(sessionData?.modifiers, 'AMULET_COIN'),
            shiningCharms: window.lit.getModifier(sessionData?.modifiers, 'SHINY_CHARM'),
            healingCharms: window.lit.getModifier(sessionData?.modifiers, 'HEALING_CHARM'),
            abilityCharms: window.lit.getModifier(sessionData?.modifiers, 'ABILITY_CHARM')
        };

        const enemyModifiers = {
            statusHealChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_STATUS_EFFECT_HEAL_CHANCE'),
            dmgReduction: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_DAMAGE_REDUCTION'),
            attackSleepChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ATTACK_SLEEP_CHANCE'),
            endureChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ENDURE_CHANCE'),
            attackBurnChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ATTACK_BURN_CHANCE'),
            dmgBoost: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_DAMAGE_BOOSTER'),
            attackPoisonChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ATTACK_POISON_CHANCE'),
            attackFreezeChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ATTACK_FREEZE_CHANCE'),
            attackParalyzeChance: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_ATTACK_PARALYZE_CHANCE'),
            heal: window.lit.getModifier(sessionData?.enemyModifiers, 'ENEMY_HEAL')
        };

        const partyModifiers = [
            { label: 'Total Party XP multiplier', value: (modifiers.expCharmNormal.stackCount * 25) + (modifiers.expCharmSuper.stackCount * 60) + (modifiers.expCharmGold.stackCount * 100), unit: '%' },
            { label: 'Total Shiny Charms', value: modifiers.shiningCharms.stackCount, unit: '' },
            { label: 'Total Party XP share', value: modifiers.expShare.stackCount * 20, unit: '%' },
            { label: 'Healing effectiveness', value: modifiers.healingCharms.stackCount * 10, unit: '%' },
            { label: 'Total Candy Jars', value: modifiers.candyJars.stackCount, unit: '' },
            { label: 'Total Ability Charms', value: modifiers.abilityCharms.stackCount, unit: '' },
            { label: 'Total Gold Rewards multiplier', value: modifiers.amuletCoins.stackCount * 20, unit: '%' },
            { label: 'Party Luck (shinies)', value: luckTotal, unit: '' }
        ];

        const enemyModifiersList = [
            { label: 'Status heal chance', value: enemyModifiers.statusHealChance.stackCount * 10, unit: '%' },
            { label: 'Attack sleep chance', value: enemyModifiers.attackSleepChance.stackCount * 10, unit: '%' },
            { label: 'Heal per turn', value: enemyModifiers.heal.stackCount * 2, unit: '%' },
            { label: 'Attack burn chance', value: enemyModifiers.attackBurnChance.stackCount * 10, unit: '%' },
            { label: 'Damage reduction', value: enemyModifiers.dmgReduction.stackCount * 2.5, unit: '%' },
            { label: 'Attack poison chance', value: enemyModifiers.attackPoisonChance.stackCount * 10, unit: '%' },
            { label: 'Damage boost', value: enemyModifiers.dmgBoost.stackCount * 5, unit: '%' },
            { label: 'Attack freeze chance', value: enemyModifiers.attackFreezeChance.stackCount * 10, unit: '%' },
            { label: 'Endure chance', value: enemyModifiers.endureChance.stackCount * 2.5, unit: '%' },
            { label: 'Attack paralyze chance', value: enemyModifiers.attackParalyzeChance.stackCount * 10, unit: '%' }
        ];

        /**
         * Creates a table HTML template for the given data.
         * 
         * @param {string} caption - The caption for the table.
         * @param {string} cssTag - The CSS tag for the table.
         * @param {Array} data - The data array to populate the table rows.
         * @memberof lit
         * @returns {Lit-HTML-Template} - The HTML template for the table.
         */
        const createTable = (caption, cssTag, data) => {
            // <caption>${caption}</caption>
            return html`
                <table class="bottom-panel-${cssTag}-modifiers">                    
                    ${data.map((item, index) => index % 2 === 0 ? html`
                        <tr>
                            <td class="${item.value === 0 ? 'bottom-panel-zeroValue' : ''}">${item.label}</td>
                            <td class="${item.value === 0 ? 'bottom-panel-zeroValue' : ''}">${item.value}${item.unit}</td>
                            ${data[index + 1] ? html`
                                <td class="${data[index + 1].value === 0 ? 'bottom-panel-zeroValue' : ''}">${data[index + 1].label}</td>
                                <td class="${data[index + 1].value === 0 ? 'bottom-panel-zeroValue' : ''}">${data[index + 1].value}${data[index + 1].unit}</td>
                            ` : html`<td></td><td></td>`}
                        </tr>
                    ` : '')}
                </table>
            `;
        }

        return html`
            <div class="bottom-panel-modifiers-wrapper">
                ${createTable('Ally party:', 'party', partyModifiers)}
                ${createTable('Enemy:', 'enemy', enemyModifiersList)}
            </div>
        `;
    }

    /**
     * Retrieves the modifier object for a given type from an array of modifiers.
     * @function getModifier
     * @param {Array} modifiers - The array of modifier objects.
     * @param {string} typeId - The ID of the type to retrieve the modifier for.
     * @memberof lit
     * @returns {Object} The modifier object for the given type.
     */
    window.lit.getModifier = (modifiers, typeId) => {
        return (modifiers ?? []).find(item => item.typeId === typeId) ?? { stackCount: 0 };
    }

})(window);