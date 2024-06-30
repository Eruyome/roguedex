/**
 * @fileoverview Description of the PokemonMapper class and its methods.
 * @file 'src/content/util_classes/pokemonMapper.utils.js'
 * @class PokemonMapperClass
 */

// eslint-disable-next-line no-unused-vars
class PokemonMapperClass{
    constructor() {
        this.W2I = window.__WeatherMap;
        this.I2W = null;
        this.N2I = window.__NatureMap;
        this.I2N = null;
        this.MoveList = window.__moveList;
        this.AbilityList = window.__abilityList;
        this.PokemonList = window.__pokemonList;
        this.PokemonSpriteBaseUrl = window.__pokemonSpriteBaseUrl;
        this.IdConversionList = null;
        PokemonMapperClass.#init(this);
    }

    /**
     * Initializes the PokemonMapperClass instance.
     * @param {PokemonMapperClass} $this - The instance of PokemonMapperClass.
     * @function
     */
    static #init($this) {
        $this.I2W = PokemonMapperClass.#calculateInverseMap($this.W2I);
        $this.I2N = PokemonMapperClass.#calculateInverseMap($this.N2I);
        $this.IdConversionList = PokemonMapperClass.#getIdConversionList();
    }
    
    /**
     * Calculates the inverse of a given map.
     * @param {Object} map - The map to invert.
     * @returns {Object} The inverted map.
     * @function
     */
    static #calculateInverseMap(map) {
        const returnMap = {};
        for (const [key, value] of Object.entries(map)) {
            returnMap[value] = key;
        }
        return returnMap;
    }

    /**
     * Maps a party to an array of Pokémon objects.
     * @param {Array} party - The party to map.
     * @param {Array} battleModifiers - The battle modifiers.
     * @returns {Array} The array of Pokémon objects.
     * @function
     */
    static #mapPartyToPokemonArray(party, battleModifiers) {
        return party.map(pokemon => ({
            species: pokemon.species,
            abilityIndex: pokemon.abilityIndex,
            nature: pokemon.nature,
            ivs: pokemon.ivs,
            pokerus: pokemon.pokerus,
            shiny: pokemon.shiny,
            variant: pokemon.variant,
            fusionSpecies: (Object.hasOwn(pokemon,'fusionSpecies')) ? pokemon.fusionSpecies : null,
            fusionAbilityIndex: pokemon.fusionAbilityIndex,
            moveset: pokemon.moveset,
            boss: pokemon.boss,
            friendship: pokemon.friendship,
            level: pokemon.level,
            luck: pokemon.luck,
            fusionLuck: pokemon.fusionLuck,
            natureOverride: pokemon.natureOverride,
            formIndex: pokemon.formIndex,
            modifiers: PokemonMapperClass.#getPokemonModifiers(pokemon, battleModifiers),
        }));
    }

    /**
     * Retrieves the modifiers for a given Pokémon.
     * @param {Object} pokemon - The Pokémon object.
     * @param {Array} modifiers - The list of modifiers.
     * @returns {Object} The modifiers for the Pokémon.
     * @function
     */
    static #getPokemonModifiers(pokemon, modifiers) {
        const typeList = [ "NORMAL", "FIGHTING", "FLYING", "POISON", "GROUND", "ROCK", "BUG", "GHOST", "STEEL", "FIRE", "WATER", "GRASS", "ELECTRIC",
            "PSYCHIC", "ICE", "DRAGON", "DARK", "FAIRY", "STELLAR"];
        const attackModifierList = ["silk_scarf","black_belt","sharp_beak","poison_barb","soft_sand","hard_stone","silver_powder","spell_tag","metal_coat",
            "charcoal","mystic_water","miracle_seed","magnet","twisted_spoon","never_melt_ice","dragon_fang","black_glasses","fairy_feather"]

        const berryList = ["SITRUS", "LUM", "ENIGMA", "LIECHI", "GANLON", "PETAYA", "APICOT", "SALAC", "LANSAT", "STARF", "LEPPA"];
        const othersList = ['REVIVER_SEED', 'LEFTOVERS','LUCKY_EGG', 'GOLDEN_EGG', 'WIDE_LENS', 'SOOTHE_BELL', 'GRIP_CLAW', 'FOCUS_BAND', 'GOLDEN_PUNCH', 'SHELL_BELL', 
            'SOUL_DEW', 'KINGS_ROCK', 'BATON', 'SILK_SCARF', 'BLACK_BELT', 'POISON_BARB', 'SOFT_SAND', 'HARD_STONE', 'SILVER_POWDER', 'METAL_COAT', 'SPELL_TAG', 'CHARCOAL',
            'MYSTIC_WATER', 'MIRACLE_SEED', 'MAGNET', 'TWISTED_SPOON', 'NEVER-MELT_ICE', 'DRAGON_FANG', 'BLACK_GLASSES', 'FAIRY_FEATHER', 'MINI_BLACK_HOLE', 'ATTACK_TYPE_BOOSTER'    
        ];
        const modifierList = {};
        modifierList.berries = [];
        modifierList.others = [];
        modifierList.attackBoosts = [];

        /*  Go over all enemy/party battle modifiers and match which ones apply to this pokemon.
         *  Further process some, simply push the rest.
        */
        modifiers?.forEach((modifier) => {
            // pokemon id as randomly assigned by the game, not the species id.
            if (modifier?.args?.[0] === pokemon.id) {
                if (modifier.typeId.toUpperCase() === "TERA_SHARD") {
                    const teraState = {};
                    teraState.typeId = modifier.typePregenArgs[0]; // modifier.args[2] should also work
                    teraState.type = typeList[teraState.typeId];
                    teraState.battlesLeft = modifier.args[2];
                    teraState.stackCount = modifier.stackCount;
                    modifierList.teraState = teraState;
                }
                else if (modifier.typeId.toUpperCase() === "BERRY") {
                    const berry = {};
                    berry.typeId = modifier.typePregenArgs[0];  // modifier.args[2] should also work
                    berry.type = berryList[berry.typeId];
                    berry.stackCount = modifier.stackCount;
                    modifierList.berries.push(berry);
                }
                else if (modifier.typeId.toUpperCase() === "ATTACK_TYPE_BOOSTER") {
                    const attackBoost = {};
                    attackBoost.typeId = attackModifierList[modifier.typePregenArgs[0]].toUpperCase();
                    attackBoost.id = modifier.typePregenArgs[0];
                    attackBoost.stackCount = modifier.stackCount;
                    modifierList.attackBoosts.push(attackBoost);
                }
                else if (othersList.includes(modifier.typeId)) {
                    modifierList.others.push(modifier)
                }
            }
        });
        return modifierList
    }

    /**
     * Retrieves the Tera type from the modifiers.
     * @param {Object} modifiers - The list of modifiers.
     * @returns {Array|null} The Tera type array or null if not present.
     * @function
     */
    static #getTeraType(modifiers) {
        // should return an array with a single string like "Water"
        if (modifiers?.teraState?.type) {
            return [modifiers.teraState.type.toLowerCase()]
        } else {
            return null;
        }
    }

    /**
     * Get the current types of a Pokémon based on Tera type, fusion types, and base types.
     * @param {string[]} teraType - The Tera type(s) of the Pokémon.
     * @param {string[]} fusionTypes - The fusion types of the Pokémon.
     * @param {string[]} baseTypes - The base types of the Pokémon.
     * @returns {string[]} The current types of the Pokémon.
     */
    static #getCurrentTypes(teraType, fusionTypes, baseTypes) {
        // Return the (always single) Tera type if it exists
        if (teraType?.length) {
            return [teraType[0]];
        }

        // Determine the first and second types based on fusion types and base types
        const firstType = baseTypes[0];

        // With the optional chaining operator (?.), the expression will short-circuit if fusionTypes is null/undefined and returns undefined without throwing an error.
        // The || operator is used to evaluate expressions from left to right and returns the first "truthy" value it encounters
        const secondType = fusionTypes?.[1] || fusionTypes?.[0] || baseTypes?.[1] || '';

        // Return the types ensuring a Pokémon cannot have the same type twice and secondType is a valid non-empty string
        return (firstType === secondType || typeof secondType !== 'string' || secondType === '') ? [firstType] : [firstType, secondType];
    }

    /**
     * Retrieves the Pokémon moveset with detailed type information.
     * @param {Object} movelist - The list of moves.
     * @param {Object} movesetObj - The moveset object.
     * @returns {Promise<Array>} The detailed moveset.
     * @function
     */
    static async #getPokemonTypeMoveset(movelist, movesetObj) {
        // https://pokeapi.co/api/v2/move/${id}
        
        /* currently does not account for g-moves and z-moves */
        const moveset = movesetObj.map(move => ({
            id: move.moveId,
            name: movelist.default[move.moveId].name,
            type: movelist.default[move.moveId].type,
            category: movelist.default[move.moveId].category,
            power: movelist.default[move.moveId].power,
            maxPP: movelist.default[move.moveId].pp, // doesn't account for pp up
            accuracy: movelist.default[move.moveId].accuracy,
        }));
        return moveset
    }

    /**
     * Retrieves detailed type effectiveness information.
     * @param {Array} typeArray - The array of types.
     * @returns {Promise<Object>} The detailed type effectiveness.
     * @function
     */
    static async #getPokemonTypeEffectivenessDetailed(typeArray) {
        const types = typeArray;

        try {
            const { weaknesses, resistances, immunities, cssClasses } = await PokemonMapperClass.#calculateTypeEffectivenessDetailed(types);        
            return {
                weaknesses,
                resistances,
                immunities,
                cssClasses
            }
        } catch (error) {
            console.error(error)
        }
        return { }
    }

     /**
     * Calculates detailed type effectiveness for given types.
     * @param {Array} types - The array of types.
     * @returns {Promise<Object>} The detailed type effectiveness.
     * @function
     */
    static async #calculateTypeEffectivenessDetailed(types) {
        const typesInPokemondbOrder = [
            "normal",
            "fire",
            "water",
            "electric",
            "grass",
            "ice",
            "fighting",
            "poison",
            "ground",
            "flying",
            "psychic",
            "bug",
            "rock",
            "ghost",
            "dragon",
            "dark",
            "steel",
            "fairy",
            "stellar"
        ];

        const _ = 1;
        const h = 1 / 2;     

        // matrix of types against other types in pokemonDB order
        // https://pokemondb.net/type
        // taken from https://github.com/wavebeem/pkmn.help/blob/master/src/misc/data-matchups.ts
        const genDefault = [
            [_, _, _, _, _, _, _, _, _, _, _, _, h, 0, _, _, h, _, _],
            [_, h, h, _, 2, 2, _, _, _, _, _, 2, h, _, h, _, 2, _, _],
            [_, 2, h, _, h, _, _, _, 2, _, _, _, 2, _, h, _, _, _, _],
            [_, _, 2, h, h, _, _, _, 0, 2, _, _, _, _, h, _, _, _, _],
            [_, h, 2, _, h, _, _, h, 2, h, _, h, 2, _, h, _, h, _, _],
            [_, h, h, _, 2, h, _, _, 2, 2, _, _, _, _, 2, _, h, _, _],
            [2, _, _, _, _, 2, _, h, _, h, h, h, 2, 0, _, 2, 2, h, _],
            [_, _, _, _, 2, _, _, h, h, _, _, _, h, h, _, _, 0, 2, _],
            [_, 2, _, 2, h, _, _, 2, _, 0, _, h, 2, _, _, _, 2, _, _],
            [_, _, _, h, 2, _, 2, _, _, _, _, 2, h, _, _, _, h, _, _],
            [_, _, _, _, _, _, 2, 2, _, _, h, _, _, _, _, 0, h, _, _],
            [_, h, _, _, 2, _, h, h, _, h, 2, _, _, h, _, 2, h, h, _],
            [_, 2, _, _, _, 2, h, _, h, 2, _, 2, _, _, _, _, h, _, _],
            [0, _, _, _, _, _, _, _, _, _, 2, _, _, 2, _, h, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, 2, _, h, 0, _],
            [_, _, _, _, _, _, h, _, _, _, 2, _, _, 2, _, h, _, h, _],
            [_, h, h, h, _, 2, _, _, _, _, _, _, 2, _, _, _, h, 2, _],
            [_, h, _, _, _, _, 2, h, _, _, _, _, _, _, 2, 2, h, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];

        const weaknesses = { 'normal' : [], 'double' : [] }
        const resistances = { 'normal' : [], 'double' : [] }
        const immunities = { 'normal' : [] }
        const cssClasses = {}

        const type1 = types[0];
        const primaryIndex = typesInPokemondbOrder.indexOf(type1);

        if (types.length === 1) {
            typesInPokemondbOrder.forEach((attackerType, i) => {
                const defenderType1 = genDefault[i][primaryIndex];
                if (defenderType1 === 0) {
                    immunities.normal.push(attackerType)
                    cssClasses[attackerType] = 'no-dmg'
                }
                else if (defenderType1 === 2) {
                    weaknesses.normal.push(attackerType)
                    cssClasses[attackerType] = 'double-dmg'
                }
                else if (defenderType1 === _) {
                    // for the moment don't return, default dmg not being used
                }
                else if (defenderType1 === h) {
                    resistances.normal.push(attackerType)
                    cssClasses[attackerType] = 'resist'
                }
            });
        }
        else if (types.length > 1) {
            const type2 = types[1];       
            const secondaryIndex = typesInPokemondbOrder.indexOf(type2);           

            typesInPokemondbOrder.forEach((attackerType, i) => {
                const defenderType1 = genDefault[i][primaryIndex]
                const defenderType2 = genDefault[i][secondaryIndex]

                // at least 1 type is immune => immune
                if (defenderType1 === 0 || defenderType2 === 0) {
                    immunities.normal.push(attackerType)
                    cssClasses[attackerType] = 'no-dmg'
                    
                }
                // both types are weak => quadrupel dmg
                else if ((defenderType1 === 2 && defenderType2 === 2)) {
                    weaknesses.double.push(attackerType)
                    cssClasses[attackerType] = 'super-dmg'
                }
                // one type is weak, the other takes normal dmg => double dmg
                else if ((defenderType1 === 2 && defenderType2 === 1) || (defenderType2 === 2 && defenderType1 === 1)) {
                    weaknesses.normal.push(attackerType)
                    cssClasses[attackerType] = 'double-dmg'
                }
                // one type is weak, the other resists (half) => normal dmg
                else if ((defenderType1 === 2 && defenderType2 === h) || (defenderType2 === 2 && defenderType1 === h)) {
                    // for the moment don't return, default dmg not being used
                }
                // both types take normal dmg => normal dmg
                else if (defenderType1 === _ && defenderType2 === _) {
                    // for the moment don't return, default dmg not being used
                }
                // one type resists, the other takes normal dmg => half dmg
                else if ((defenderType1 === h && defenderType2 === _) || (defenderType2 === h && defenderType1 === _)) {
                    resistances.normal.push(attackerType)
                    cssClasses[attackerType] = 'resist'
                }
                // both types resist (half) => quarter dmg
                else if (defenderType1 === h && defenderType2 === h) {
                    resistances.double.push(attackerType)
                    cssClasses[attackerType] = 'super-resist'
                }
            });
        }

        return { weaknesses, resistances, immunities, cssClasses };    
    }

    /**
     * Retrieves the Pokémon ability information.
     * 
     * @async
     * @function
     * @param {number} pokemonId - The ID of the Pokémon.
     * @param {number} pokemonAbilityIndex - The index of the Pokémon's ability.
     * @param {number} [fusionId] - The ID of the fusion Pokémon (optional).
     * @param {number} [fusionAbilityIndex] - The index of the fusion Pokémon's ability (optional).
     * @returns {Promise<Object>} A promise that resolves to an object containing the ability name, description, and whether it is a hidden ability.
     */
    async getPokemonAbility(pokemonId, pokemonAbilityIndex, fusionId, fusionAbilityIndex) {
        const $this = this;
        let pokeID;
        let abilityIndex;
        if (fusionId) {
            pokeID = fusionId;
            abilityIndex = fusionAbilityIndex;
        }
        else {
            pokeID = pokemonId;
            abilityIndex = pokemonAbilityIndex;
        }

        try {
            const pokemonAbilityData = $this.PokemonList[pokeID].abilities;
            const abilityLength = pokemonAbilityData.length;
            if (abilityIndex >= abilityLength) {
                abilityIndex = abilityLength - 1;   // Pokerogue uses a "None" ability as padding when pokémon have less than 3.
            }
            const abilityName = pokemonAbilityData[abilityIndex].name;

            return {
                'name': abilityName.toUpperCase().replace('-', ' '),
                'description': $this.AbilityList[abilityName].flavor_text_entries[0].flavor_text,   // may have to be changed if a data file with multiple languages were to be used.
                'isHidden': pokemonAbilityData[abilityIndex].is_hidden
            }

        } catch (error) {
            return {
                'name': 'null',
                'description': 'null',
                'isHidden': false
            }
        }
    }

    /**
     * Capitalizes the first letter of a string.
     * 
     * @function
     * @param {string} string - The input string to be capitalized.
     * @returns {string} The string with the first letter capitalized.
     */
    capitalizeFirstLetter(string) {
        if (typeof string !== 'string') {
            return '';
        }
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Retrieves the full type effectiveness for all cases based on the provided type arrays.
     * 
     * @function
     * @private
     * @static
     * @param {string[]} baseTypeArray - The array of base types.
     * @param {string[]} fusionTypeArray - The array of fusion types.
     * @param {string[]} teraTypeArray - The array of tera types.
     * @returns {Promise<Object>} A promise that resolves to an object containing the type effectiveness details.
     */
    static async #getFullTypeEffectivenessAllCases(baseTypeArray, fusionTypeArray, teraTypeArray) {
        if (teraTypeArray) {
            return await PokemonMapperClass.#getPokemonTypeEffectivenessDetailed(teraTypeArray);
        }
        else if (fusionTypeArray) {
            const newTypeArray = [baseTypeArray[0], (fusionTypeArray.length > 1 ? fusionTypeArray[1] : fusionTypeArray[0]) ];
            return await PokemonMapperClass.#getPokemonTypeEffectivenessDetailed(newTypeArray);            
        }
        else{
            return await PokemonMapperClass.#getPokemonTypeEffectivenessDetailed(baseTypeArray);
        }
    }

    /**
     * Retrieves an array of Pokémon data based on the provided parameters.
     * 
     * @function
     * @param {Object[]} pokemonData - The data of the Pokémon.
     * @param {Object} arena - The arena information.
     * @param {Object} modifiers - The modifiers for the Pokémon.
     * @param {string} pokemonLocation - The "location" of the Pokémon, in this case meaning "enemy" or "ally" party.
     * @returns {Promise<Object>} A promise that resolves to an object containing the Pokémon array, weather information, and party ID.
     */
    async getPokemonArray(pokemonData, arena, modifiers, pokemonLocation) {
        const $this = this;
        const pokemonArray = PokemonMapperClass.#mapPartyToPokemonArray(pokemonData, modifiers);
        let frontendPokemonArray = [];
        let weather = {};

        if (arena.weather && arena.weather.weatherType) {
            weather = {
                type: $this.I2W[arena.weather.weatherType],
                turnsLeft: arena.weather.turnsLeft || 0,
            };
        }

        const pokemonPromises = pokemonArray.map(async (pokemon) => {
            const pokemonName = PokemonMapperClass.#getPokemonSpeciesName($this, pokemon.species);
            const speciesId = PokemonMapperClass.#getSpeciesId($this, pokemon.species);
            const speciesIdPreConversion = pokemon.species;
            const fusionSpeciesId = PokemonMapperClass.#getSpeciesId($this, pokemon.fusionSpecies);

            const moveset = await PokemonMapperClass.#getPokemonTypeMoveset($this.MoveList, pokemon.moveset);            
            const rarity = PokemonMapperClass.#getPokemonRarity($this, pokemon.species);

            const baseTypes = $this.PokemonList[speciesId]?.types;
            const fusionTypes = $this.PokemonList[fusionSpeciesId]?.types;            
            const teraType = PokemonMapperClass.#getTeraType(pokemon.modifiers);
            const typeEffectiveness = await PokemonMapperClass.#getFullTypeEffectivenessAllCases( baseTypes, fusionTypes, teraType );
            const currentTypes = PokemonMapperClass.#getCurrentTypes(teraType, fusionTypes, baseTypes);

            const basePokemon = $this.PokemonList[speciesId]?.basePokemonName;   // name of the starter pokemon / lowest in the evolution chain
            const basePokemonId = $this.PokemonList[speciesId]?.basePokemonId;   
            const tempConvertedId = PokemonMapperClass.#findOriginalPokemonId($this, basePokemonId);
            const basePokemonIdPreConversion = tempConvertedId !== basePokemonId ? tempConvertedId : basePokemonId;   // savedata is saved using the pre-converted id

            const fusionPokemon = $this.PokemonList[fusionSpeciesId]?.name;
            const name = $this.getPokemonName(pokemonName, fusionPokemon, basePokemon);

            const pokemonSprite = PokemonMapperClass.#getPokemonSpriteUrl($this, speciesId);
            const fusionPokemonSprite = fusionSpeciesId ? PokemonMapperClass.#getPokemonSpriteUrl($this, fusionSpeciesId) : null; 

            return {
                id: speciesId,
                idPreConversion: speciesIdPreConversion,
                name: $this.capitalizeFirstLetter(name.toUpperCase()),
                speciesName: $this.capitalizeFirstLetter(pokemonName),
                typeEffectiveness: {
                    weaknesses: typeEffectiveness.weaknesses,
                    resistances: typeEffectiveness.resistances,
                    immunities: typeEffectiveness.immunities,
                    cssClasses: typeEffectiveness.cssClasses,
                },
                ivs: pokemon.ivs,
                ability: await $this.getPokemonAbility(speciesId, pokemon.abilityIndex, fusionSpeciesId, pokemon.fusionAbilityIndex),
                nature: $this.I2N[pokemon.nature],
                basePokemon: $this.capitalizeFirstLetter(basePokemon),
                baseId: parseInt($this.PokemonList[speciesId].basePokemonId),
                basePokemonIdPreConversion,
                sprite: pokemonSprite, 
                fusionId: fusionSpeciesId,
                fusionPokemon: ( fusionPokemon ? $this.capitalizeFirstLetter(fusionPokemon) : null ),
                fusionPokemonSprite,
                moveset,
                rarity,
                boss: pokemon.boss,
                friendship: pokemon.friendship,
                level: pokemon.level,
                luck: pokemon.luck,
                shiny: pokemon.shiny,
                pokerus: pokemon.pokerus,
                fusionLuck: pokemon.fusionLuck,
                modifiers: pokemon.modifiers,
                currentTypes: currentTypes.map(type => $this.capitalizeFirstLetter(type)),
            };
        });

        frontendPokemonArray = await Promise.all(pokemonPromises);

        const partyId = ( pokemonLocation.toLocaleLowerCase() === 'enemyparty' ? 'enemies' : 'allies' );
        return { pokemon: frontendPokemonArray, weather, partyId };
    }

    /**
     * Retrieves the name of a Pokémon based on the provided parameters.
     * 
     * @function
     * @param {string} pokemonName - The name of the Pokémon species.
     * @param {string} fusionSpeciesId - The ID of the fused species.
     * @param {string} basePokemonName - The name of the base Pokémon.
     * @param {string} fusionPokemon - The name of the fusion Pokémon.
     * @returns {string} The name of the Pokémon.
     */
    getPokemonName(pokemonName, fusionPokemon, basePokemonName ) {
        if (fusionPokemon) {
            const nameA = pokemonName;
            const nameB = fusionPokemon;
            return this.getFusedSpeciesName(nameA, nameB);
        }
        else if (pokemonName) {
            return pokemonName;
        }
        else {
            // return only the first part of the name (removes suffixes like -galar and other variants)
            return basePokemonName.split('-')[0];
        }
    }

    /**
     * Constructs the name of a fused species based on the names of the two species.
     * 
     * @function
     * @param {string} speciesAName - The name of the first species.
     * @param {string} speciesBName - The name of the second species.
     * @returns {string} The name of the fused species.
     */
    getFusedSpeciesName(speciesAName, speciesBName) {
        const fragAPattern = /([a-z]{2}.*?[aeiou(?:y$)\-']+)(.*?)$/i;
        const fragBPattern = /([a-z]{2}.*?[aeiou(?:y$)\-'])(.*?)$/i;

        const [ speciesAPrefixMatch, speciesBPrefixMatch ] = [ speciesAName, speciesBName ].map(n => /^(?:[^ ]+) /.exec(n));
        const [ speciesAPrefix, speciesBPrefix ] = [ speciesAPrefixMatch, speciesBPrefixMatch ].map(m => m ? m[0] : '');

        if (speciesAPrefix)
            speciesAName = speciesAName.slice(speciesAPrefix.length);
        if (speciesBPrefix)
            speciesBName = speciesBName.slice(speciesBPrefix.length);

        const [ speciesASuffixMatch, speciesBSuffixMatch ] = [ speciesAName, speciesBName ].map(n => / (?:[^ ]+)$/.exec(n));
        const [ speciesASuffix, speciesBSuffix ] = [ speciesASuffixMatch, speciesBSuffixMatch ].map(m => m ? m[0] : '');

        if (speciesASuffix)
            speciesAName = speciesAName.slice(0, -speciesASuffix.length);
        if (speciesBSuffix)
            speciesBName = speciesBName.slice(0, -speciesBSuffix.length);

        const splitNameA = speciesAName.split(/ /g);
        const splitNameB = speciesBName.split(/ /g);

        const fragAMatch = fragAPattern.exec(speciesAName);
        const fragBMatch = fragBPattern.exec(speciesBName);
        let fragA;
        let fragB;

        fragA = splitNameA.length === 1
            ? fragAMatch ? fragAMatch[1] : speciesAName
            : splitNameA[splitNameA.length - 1];

        if (splitNameB.length === 1) {
            if (fragBMatch) {
                const lastCharA = fragA.slice(fragA.length - 1);
                const prevCharB = fragBMatch[1].slice(fragBMatch.length - 1);
                fragB = (/[-']/.test(prevCharB) ? prevCharB : '') + fragBMatch[2] || prevCharB;
                if (lastCharA === fragB[0]) {
                    if (/[aiu]/.test(lastCharA))
                        fragB = fragB.slice(1);
                    else {
                        const newCharMatch = new RegExp(`[^${lastCharA}]`).exec(fragB);
                        if (newCharMatch?.index > 0)
                            fragB = fragB.slice(newCharMatch.index);
                    }
                }
            } else
                fragB = speciesBName;
        } else
            fragB = splitNameB[splitNameB.length - 1];

        if (splitNameA.length > 1)
            fragA = `${splitNameA.slice(0, splitNameA.length - 1).join(' ')} ${fragA}`;

        fragB = `${fragB.slice(0, 1).toLowerCase()}${fragB.slice(1)}`;
        return `${speciesAPrefix || speciesBPrefix}${fragA}${fragB}${speciesBSuffix || speciesASuffix}`;
    }

    /**
     * Retrieves the ID of a Pokémon species from the Pokémon list.
     * 
     * @function
     * @memberof PokemonMapperClass
     * @private
     * @param {Object} $this - The instance of the PokemonMapperClass.
     * @param {string} speciesId - The ID of the species to retrieve.
     * @returns {string} The name of the Pokémon species.
     */
    static #getPokemonSpeciesName($this, speciesId) {
        let name = $this.PokemonList[speciesId]?.name;
        if (!name) {
            name = $this.PokemonList[PokemonMapperClass.#convertPokemonId($this, speciesId)]?.name;
        }
        return name
    }

    /**
     * Retrieves the rarity (legendary, mythical, none) of a Pokémon from the Pokémon list.
     * 
     * @function
     * @memberof PokemonMapperClass
     * @private
     * @param {Object} $this - The instance of the PokemonMapperClass.
     * @param {string} speciesId - The ID of the species to retrieve the rarity of.
     * @returns {string} The rarity of the Pokémon species (legendary, mythical, ultra).
     */
    static #getPokemonRarity($this, speciesId) {
        let rarity = $this.PokemonList[speciesId]?.rarity;
        return rarity ? rarity : '';
    }

    /**
     * Retrieves the ID of a Pokémon species from the Pokémon list or converts it if necessary.
     * 
     * @function
     * @memberof PokemonMapperClass
     * @private
     * @param {Object} $this - The instance of the PokemonMapperClass.
     * @param {string} speciesId - The ID of the species to retrieve.
     * @returns {string} The ID of the Pokémon species.
     */
    static #getSpeciesId($this, speciesId) {
        if ($this.PokemonList[speciesId]?.name) {            
            // if this species id returns something useful, use it
            return speciesId;
        } else {
            // otherwise use the converted id     
            return PokemonMapperClass.#convertPokemonId($this, speciesId);
        }
    }

    /**
     * Gets the URL for the Pokémon sprite based on its ID.
     * @param {Object} $this - The current instance of the class.
     * @param {number} id - The ID of the Pokémon.
     * @returns {string|null} The URL of the Pokémon sprite or null if not found.
     */
    static #getPokemonSpriteUrl($this, id) {
        const spriteBaseUrl = $this.PokemonSpriteBaseUrl;
        const u = $this.PokemonList[id].sprite;
        const r = PokemonMapperClass.#classifyImageUrl(u);
        if (r === "fileUrl") {
            return u
        }
        else if (r === "file") {
            return spriteBaseUrl + u;
        }
        else if (r === "invalid") {
            return spriteBaseUrl + id + '.png';
        }
        else if (r === "baseUrl") {
            return u + id + '.png';
        }
        return null
    }

    /**
     * Classifies the type of URL based on regex patterns.
     * @param {string|null|undefined} url - The URL to classify.
     * @returns {'fileUrl'|'file'|'baseUrl'|'invalid'} The classification of the URL.
     */
    static #classifyImageUrl(url) {
        if (!url) {
            return 'invalid';
        }
    
        // Regex patterns for classification
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?$/;
        const filenameWithExtensionRegex = /^[^/]+\.[^/]+$/; // Updated regex pattern
    
        // Check if it's just a filename + filetype
        if (filenameWithExtensionRegex.test(url)) {
            return 'file';
        }
    
        // Check if it's a valid URL
        if (urlRegex.test(url)) {
            // Extract path from the URL
            const pathStartIndex = url.indexOf('//') > -1 ? url.indexOf('/', url.indexOf('//') + 2) : -1;
            const path = pathStartIndex > -1 ? url.slice(pathStartIndex) : '';
    
            // Split path into segments
            const segments = path.split('/').filter(segment => segment.trim() !== '');
    
            // If there are segments, check the last one for filename + extension
            if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                if (filenameWithExtensionRegex.test(lastSegment)) {
                    return 'fileUrl';
                } else {
                    return 'baseUrl';
                }
            } else {
                return 'baseUrl';
            }
        } else {
            return 'invalid';
        }
    }

    /**
     * Converts a Pokémon ID using a predefined conversion list. This is needed to get the "correct" IDs for some
     * Pokémon, for example all Alolan and Galar Pokémon.
     * 
     * @function
     * @param {Object} $this - The instance of the PokemonMapperClass.
     * @param {number} pokemonId - The ID of the Pokémon to convert.
     * @returns {number} The converted Pokémon ID, if found in the conversion list; otherwise, returns the original ID.
     */
    static #convertPokemonId($this, pokemonId) {
        const conversionList = $this.IdConversionList;
        if (pokemonId in conversionList) {
            return conversionList[pokemonId];
        } else {
            return pokemonId;
        }
    }

    /**
     * Finds the original Pokémon ID by looking up its converted value in the predefined conversion list.
     * 
     * @function
     * @param {Object} $this - The instance of the PokemonMapperClass.
     * @param {number} convertedId - The converted ID of the Pokémon to find the original ID for.
     * @returns {number} The original Pokémon ID, if found by the converted value; otherwise, returns the converted ID.
     */
    static #findOriginalPokemonId($this, convertedId) {
        const conversionList = $this.IdConversionList;
        const convertedIdNumber = Number(convertedId); // Coerce convertedId to number
    
        for (const [originalId, value] of Object.entries(conversionList)) {
            if (Number(value) === convertedIdNumber) { // Ensure value is also compared as number
                return Number(originalId);
            }
        }
        return convertedIdNumber; // Return the original convertedId if no match found
    }

    /**
     * Pokémon ID conversion list. This is needed to get the "correct" IDs for some
     * Pokémon, for example all Alolan and Galar Pokémon (regional).
     * 
     * @function
     * @returns {Object} Conversion list.
     */
    static #getIdConversionList() {
        return {
            2019: 10091,
            2020: 10092,
            2026: 10100,
            2027: 10101,
            2028: 10102,
            2037: 10103,
            2038: 10104,
            2050: 10105,
            2051: 10106,
            2052: 10107,
            2053: 10108,
            2074: 10109,
            2075: 10110,
            2076: 10111,
            2088: 10112,
            2089: 10113,
            2103: 10114,
            2105: 10115,
            2670: 10061,
            4052: 10161,
            4077: 10162,
            4078: 10163,
            4079: 10164,
            4080: 10165,
            4083: 10166,
            4110: 10167,
            4122: 10168,
            4144: 10169,
            4145: 10170,
            4146: 10171,
            4199: 10172,
            4222: 10173,
            4263: 10174,
            4264: 10175,
            4554: 10176,
            4555: 10177,
            4562: 10179,
            4618: 10180,
            6058: 10229,
            6059: 10230,
            6100: 10231,
            6101: 10232,
            6157: 10233,
            6211: 10234,
            6215: 10235,
            6503: 10236,
            6549: 10237,
            6570: 10238,
            6571: 10239,
            6628: 10240,
            6705: 10241,
            6706: 10242,
            6713: 10243,
            6724: 10244,
            8128: 10252,
            8194: 10253,
            8901: 10272
        };
    }
}



