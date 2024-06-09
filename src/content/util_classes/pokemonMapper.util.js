class PokemonMapperClass{
    constructor() {
        //this.W2I = window.__WeatherMap;
        //this.I2W = null;
        this.N2I = window.__NatureMap;
        this.I2N = null;
        this.MoveList = window.__moveList;
        this.AbilityList = window.__abilityList;
        this.PokemonList = window.__pokemonList;
        PokemonMapperClass.#init(this);
    }

    static #init($this) {
        //$this.I2W = PokemonMapperClass.#calculateInverseMap($this.W2I);
        $this.I2N = PokemonMapperClass.#calculateInverseMap($this.N2I);
    }

    static #calculateInverseMap(map) {
        const returnMap = {};
        for (const [key, value] of Object.entries(map)) {
            returnMap[value] = key;
        }
        return returnMap;
    }

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
                if (modifier.typeId == "TERA_SHARD") {
                    const teraState = {};
                    teraState.typeId = modifier.typePregenArgs[0]; // modifier.args[2] should also work
                    teraState.type = typeList[teraState.typeId];
                    teraState.battlesLeft = modifier.args[2];
                    teraState.stackCount = modifier.stackCount;
                    modifierList.teraState = teraState;
                }
                else if (modifier.typeId == "BERRY") {
                    const berry = {};
                    berry.typeId = modifier.typePregenArgs[0];  // modifier.args[2] should also work
                    berry.type = berryList[berry.typeId];
                    berry.stackCount = modifier.stackCount;
                    modifierList.berries.push(berry);
                }
                else if (modifier.typeId == "ATTACK_TYPE_BOOSTER") {
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

    static #getTeraType(modifiers) {
        // should return an array with a single string like "Water"
        if (modifiers?.teraState?.type) {
            return [modifiers.teraState.type.toLowerCase()]
        } else {
            return null;
        }
    }
    
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

    static async #getPokemonTypeEffectivenessDetailed(typeArray) {
        let types = typeArray;

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
        ]

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

    capitalizeFirstLetter(string) {
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

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
            const pokemonId = PokemonMapperClass.#getPokemonId($this, pokemon.species);
            const speciesId = PokemonMapperClass.#getSpeciesId($this, pokemon.species);
            const fusionSpeciesId = PokemonMapperClass.#getSpeciesId($this, pokemon.fusionSpecies);

            const fusionId = $this.PokemonList[fusionSpeciesId]?.name;

            const moveset = await PokemonMapperClass.#getPokemonTypeMoveset($this.MoveList, pokemon.moveset);

            const baseTypes = $this.PokemonList[speciesId]?.types;
            const fusionTypes = $this.PokemonList[fusionSpeciesId]?.types;            
            const teraType = PokemonMapperClass.#getTeraType(pokemon.modifiers);
            const typeEffectiveness = await PokemonMapperClass.#getFullTypeEffectivenessAllCases( baseTypes, fusionTypes, teraType );

            const basePokemon = $this.PokemonList[speciesId].basePokemonName;
            const fusionPokemon = $this.PokemonList[fusionSpeciesId]?.basePokemonName;
            const name = $this.getPokemonName(pokemonId, fusionSpeciesId, basePokemon, fusionPokemon);
            const pokemonSprite = $this.PokemonList[speciesId].sprite;

            return {
                id: speciesId,
                name: $this.capitalizeFirstLetter(name.toUpperCase()),
                typeEffectiveness: {
                    weaknesses: typeEffectiveness.weaknesses,
                    resistances: typeEffectiveness.resistances,
                    immunities: typeEffectiveness.immunities,
                    cssClasses: typeEffectiveness.cssClasses,
                },
                ivs: pokemon.ivs,
                ability: await $this.getPokemonAbility(speciesId, pokemon.abilityIndex, fusionSpeciesId, pokemon.fusionAbilityIndex),
                nature: $this.I2N[pokemon.nature],
                basePokemon,
                baseId: $this.PokemonList[speciesId].basePokemonId,
                sprite: pokemonSprite,
                fusionId: fusionSpeciesId,
                fusionPokemon: fusionPokemon,
                moveset,
                boss: pokemon.boss,
                friendship: pokemon.friendship,
                level: pokemon.level,
                luck: pokemon.luck,
                shiny: pokemon.shiny,
                pokerus: pokemon.pokerus,
                fusionLuck: pokemon.fusionLuck,
                modifiers: pokemon.modifiers,
                currentTypes: (teraType?.length ? teraType : (fusionTypes?.length ? [baseTypes[0], fusionTypes[1]] : baseTypes)),
            };
        });

        frontendPokemonArray = await Promise.all(pokemonPromises);

        const partyId = ( pokemonLocation == 'enemyParty' ? 'enemies' : 'allies' )
        return { pokemon: frontendPokemonArray, weather, partyId : partyId };
    }

    getPokemonName(pokemonId, fusionSpeciesId, basePokemon, fusionPokemon) {
        if (fusionSpeciesId) {
            const nameA = basePokemon;
            const nameB = fusionPokemon;
            return this.getFusedSpeciesName(nameA, nameB);
            // getFusedSpeciesName
        }
        else if (pokemonId) {
            return pokemonId;
        }
        else {        
            return basePokemon;
        }
    }

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

    static #getPokemonId($this, speciesId) {
        let id = $this.PokemonList[speciesId]?.name;
        if (!id) {
            id = $this.PokemonList[$this.convertPokemonId(speciesId)]?.name;
        }
        return id
    }

    static #getSpeciesId($this, speciesId) {
        if ($this.PokemonList[speciesId]?.name) {            
            // if this species id returns something useful, use it
            return speciesId;
        } else {
            // otherwise use the converted id
            return $this.convertPokemonId(speciesId);
        }
    }

    convertPokemonId(pokemonId) {
        const conversionList = {
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
        }
        if (pokemonId in conversionList) {
            return conversionList[pokemonId]
        } else {
            return pokemonId
        }
    }
}



