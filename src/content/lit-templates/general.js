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
    window.lit.createTooltipDiv = (tip) => {
        return html`
            <div class="text-base tooltiptext">${unsafeHTML(tip)}</div>
        `;
    }

    /**
     * Capitalizes the first letter of any string.
     * 
     * @param {string} string - Any input string.
     * @memberof lit
     * @returns {string} The capitalized string.
     * @function capitalizeFirstLetter
     */
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
                <span class="rd-status-session">Session data not loaded yet! UI might not work (try reloading if it persists).</span>
            ` : '' }
        `;
    }

    /**
     * Generates HTML for an exclamation icon that give a hint/reminder to open the settings menu and how to.
     * 
     * @memberof lit
     * @returns {Lit-HTML-Template} - A lit-html template result representing the HTML markup.
     * @function createSettingsHintElement
     */
    window.lit.createSettingsHintElement = () => {
        let tooltipContent = '';
        tooltipContent += `<span>Make sure to take a look at the <b>Settings Menu</b>! (You can disable this hint there)</span>`;
        tooltipContent += `<br>`;
        tooltipContent += `<span>If the extension icon shows in your <b>browsers extension area</b> (top right corner),</span>`;
        tooltipContent += `<span>click the icon.</span>`;
        tooltipContent += `<span>If it doesn't, you have to pin the extension:</span>`;
        tooltipContent += `<span>1. Click the <b>Puzzle Piece Icon</b> in the top-right corner of your browser.</span>`;
        tooltipContent += `<span>2. Find the <b>RogueDex extension</b> in the list that appears.</span>`;
        tooltipContent += `<span>3. Pin the Extension:</span>`;
        tooltipContent += `<span>&nbsp;&nbsp;&nbsp;&nbsp;<b>Chrome</b>: Click the pin icon next to the extension's name.</span>`;
        tooltipContent += `<span>&nbsp;&nbsp;&nbsp;&nbsp;<b>Firefox</b>: Click the pin icon next to the extension's name or select "Pin to Toolbar".</span>`;

        return html`
            <div id="rd-settings-hint" class="tooltip">
                <span class="rd-hint-icon">&#8505;</span>
                ${window.lit.createTooltipDiv(tooltipContent)}
            </div>
        `;
    }
        
    /**
     * Creates a tooltip HTML template for an individual Pokémon.
     * 
     * @function createPokemonTooltipDiv
     * @param {Object} pokemon - The data object for the Pokémon.
     * @param {string} pokemon.name - The name of the Pokémon.
     * @param {string} pokemon.speciesName - The base Pokémon of the fusion.
     * @param {string} pokemon.fusionPokemon - The fusion Pokémon.
     * @param {string[]} pokemon.currentTypes - An array of the current types of the Pokémon.
     * @param {number} pokemon.level - The level of the Pokémon.
     * @param {boolean} pokemon.shiny - Indicates if the Pokémon is shiny.
     * @param {number} pokemon.luck - The luck value of the Pokémon.
     * @param {number} pokemon.fusionLuck - The luck value of the fusion Pokémon.
     * @param {number} pokemon.friendship - The friendship experience of the Pokémon.
     * @returns {Lit-HTML-Template} - The HTML template for the Pokémon tooltip.
     */
    window.lit.createPokemonTooltipDiv = (pokemon) => {
        let variant = ( pokemon.paradox ? `Paradox (${window.lit.capitalizeFirstLetter(pokemon.paradox)})` : '' );
        variant += ( pokemon.paradox && pokemon.region ? ' | ' : '' );
        variant += ( pokemon.region ? `(${window.lit.capitalizeFirstLetter(pokemon.region)}) Region` : '' );

        return html`
            <div class="text-base tooltiptext">
                <span>Name: ${pokemon.name} [Gen ${pokemon.gen}]</span></br>
                ${ pokemon.rarity ? html`
                    <span>Rare: ${window.lit.capitalizeFirstLetter(pokemon.rarity)}</span></br>
                `: ''}
                ${ pokemon.variant ? html`
                    <span>Variant: ${variant}</span></br>
                `: ''}
                ${ pokemon.variant || pokemon.rarity ? html`
                    <span> </span></br>
                `: ''}
                ${ pokemon.fusionId ? html`
                    <span>Fusion Base: ${window.lit.capitalizeFirstLetter(pokemon.speciesName)}</span></br>
                    <span>Fused with: ${window.lit.capitalizeFirstLetter(pokemon.fusionPokemon)}</span></br>
                    <span> </span></br>
                `: ''}
                ${( !pokemon.fusionId && ( pokemon.baseId !== pokemon.id ) ) ? html`
                    <span>Starter: ${window.lit.capitalizeFirstLetter(pokemon.basePokemon)}</span></br>
                    <span> </span></br>
                `: ''}
                <span>Types: ${pokemon.currentTypes.join(', ')}</span></br>
                <span>Level: ${pokemon.level}</span></br>
                ${ pokemon.shiny ? html`
                    <span>Shiny: ${pokemon.shiny ? 'Yes' : 'No'}</span></br>
                    <span>Luck bonus: ${pokemon.luck + pokemon.fusionLuck}</span></br>
                `: ''}
                <span>Friendship EXP: ${pokemon.friendship}</span>
            </div>
        `;
    }

    /**
     * Retrieves an object mapping Pokémon types to their respective numeric identifiers.
     * 
     * @memberof lit
     * @returns {Object} An object where keys are type names and values are numeric identifiers.
     * @function getTypeList
     */
    window.lit.getTypeList = () => {
        let Types
        (function (Types) {
            Types[Types.normal = 1] = 1;
            Types[Types.fighting = 2] = 2;
            Types[Types.flying = 3] = 3;
            Types[Types.poison = 4] = 4;
            Types[Types.ground = 5] = 5;
            Types[Types.rock = 6] = 6;
            Types[Types.bug = 7] = 7;
            Types[Types.ghost = 8] = 8;
            Types[Types.steel = 9] = 9;
            Types[Types.fire = 10] = 10;
            Types[Types.water = 11] = 11;
            Types[Types.grass = 12] = 12;
            Types[Types.electric = 13] = 13;
            Types[Types.psychic = 14] = 14;
            Types[Types.ice = 15] = 15;
            Types[Types.dragon = 16] = 16;
            Types[Types.dark = 17] = 17;
            Types[Types.fairy = 18] = 18;
            Types[Types.stellar = 19] = 19;
        })(Types || (Types = {}));

        return Types
    }

    /**
     * Retrieves an object mapping Pokémon types to their respective icon urls.
     * 
     * @memberof lit
     * @returns {Object} An object where keys are type names and values are url strings.
     * @function getTypeList
     */
    window.lit.getTypeIconUrls = () => {
        const prefix1 = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/';
        const prefix2 = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/brilliant-diamond-and-shining-pearl/';

        const Urls = {
            normal: prefix1 + 1 +".png",
            fighting: prefix1 + 2 +".png",
            flying: prefix2 + 3 +".png",
            poison: prefix1 + 4 +".png",
            ground: prefix1 + 5 +".png",
            rock: prefix1 + 6 +".png",
            bug: prefix2 + 7 +".png",
            ghost: prefix1 + 8 +".png",
            steel: prefix2 + 9 +".png",
            fire: prefix1 + 10 +".png",
            water: prefix2 + 11 +".png",
            grass: prefix2 + 12 +".png",
            electric: prefix1 + 13 +".png",
            psychic: prefix1 + 14 +".png",
            // ice: prefix1 + 15 +".png",
            ice: "https://archives.bulbagarden.net/media/upload/9/9b/IceIC_Masters.png",
            dragon: prefix1 + 16 +".png",
            dark: prefix1 + 17 +".png",
            // fairy: prefix2 + 18 +".png",
            fairy: "https://archives.bulbagarden.net/media/upload/f/fa/FairyIC_Masters.png",
            stellar: "https://archives.bulbagarden.net/media/upload/4/4e/Stellar_icon_SV.png"
        };

        return Urls;
    };

    /**
     * Retrieves the stat changes associated with a given Pokémon nature.
     * 
     * @param {string} nature - The name of the nature.
     * @returns {[string, string]} An array containing the increased and decreased stats.
     * - The first element is the stat that increases.
     * - The second element is the stat that decreases.
     */
    window.lit.getNatureStatChange = (nature) => {
        const natures = {
            "hardy": { inc: "ATK", dec: "ATK" },
            "lonely": { inc: "ATK", dec: "DEF" },
            "brave": { inc: "ATK", dec: "SPD" },
            "adamant": { inc: "ATK", dec: "Sp.ATK" },
            "naughty": { inc: "ATK", dec: "Sp.DEF" },
            "bold": { inc: "DEF", dec: "ATK" },
            "docile": { inc: "DEF", dec: "DEF" },
            "relaxed": { inc: "DEF", dec: "SPD" },
            "impish": { inc: "DEF", dec: "Sp.ATK" },
            "lax": { inc: "DEF", dec: "Sp.DEF" },
            "timid": { inc: "SPD", dec: "ATK" },
            "hasty": { inc: "SPD", dec: "DEF" },
            "serious": { inc: "SPD", dec: "SPD" },
            "jolly": { inc: "SPD", dec: "Sp.ATK" },
            "naive": { inc: "SPD", dec: "Sp.DEF" },
            "modest": { inc: "Sp.ATK", dec: "ATK" },
            "mild": { inc: "Sp.ATK", dec: "DEF" },
            "quiet": { inc: "Sp.ATK", dec: "SPD" },
            "bashful": { inc: "Sp.ATK", dec: "Sp.ATK" },
            "rash": { inc: "Sp.ATK", dec: "Sp.DEF" },
            "calm": { inc: "Sp.DEF", dec: "ATK" },
            "gentle": { inc: "Sp.DEF", dec: "DEF" },
            "sassy": { inc: "Sp.DEF", dec: "SPD" },
            "careful": { inc: "Sp.DEF", dec: "Sp.ATK" },
            "quirky": { inc: "Sp.DEF", dec: "Sp.DEF" }
        };
        const natureObj = natures[nature.toLowerCase()];
        return [ natureObj.inc || '', natureObj.dec || '' ]
    }

    /**
     * Retrieves an object mapping Pokémon region names to their respective icon urls.
     * 
     * @memberof lit
     * @returns {Object} An object where keys are type names and values are url strings.
     * @function getTypeList
     */
    window.lit.getVariantSymbol = (name) => {
        const urls = {
            alola : 'https://archives.bulbagarden.net/media/upload/0/04/Black_clover_HOME.png',
            hisui: 'https://archives.bulbagarden.net/media/upload/6/6e/Arceus_mark_HOME.png',
            galar: 'https://archives.bulbagarden.net/media/upload/6/6e/Galar_symbol_HOME.png',
            paldea: 'https://archives.bulbagarden.net/media/upload/f/fe/Paldea_icon_HOME.png',
            paradox: 'https://archives.bulbagarden.net/media/upload/archive/f/fa/20240123090536%21SetSymbolParadox_Rift.png'
        };

        return urls[name] || null;
    };

    /**
     * Retrieves an object mapping Pokémon stats to their respective names.
     * 
     * @memberof lit
     * @returns {Object} An object where keys are stat identifiers and values are stat names.
     * @function getStatList
     */
    window.lit.getStatList = () => {
        let Stat;
        (function (Stat) {
            Stat[Stat.HP = 0] = "HP";
            Stat[Stat.ATK = 1] = "ATK";
            Stat[Stat.DEF = 2] = "DEF";
            Stat[Stat.SPATK = 3] = "SPATK";
            Stat[Stat.SPDEF = 4] = "SPDEF";
            Stat[Stat.SPD = 5] = "SPD";
        })(Stat || (Stat = {}));

        return Stat
    }

    /**
     * Checks if the current device is a mobile device based on the user agent.
     * 
     * @function mobileCheck
     * @memberof lit
     * @returns {boolean} True if the device is a mobile device, false otherwise.
     */
    window.lit.mobileCheck = () => {
        let check = false;
        /**
         * @function
         * @description Self-invoking function to check the user agent for mobile devices.
         * @param {string} userAgent - The user agent string to test against the mobile device regex.
         * https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
         */

        // eslint-disable-next-line
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    };

})(window);