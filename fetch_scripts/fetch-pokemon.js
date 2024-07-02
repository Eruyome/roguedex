import fetch from 'node-fetch';  // Importing fetch for making HTTP requests
import fs from 'fs';             // Importing fs for file system operations
import retry from 'retry';       // Importing retry for retrying failed operations

// Read command-line arguments
// "node this-script.js 50" can be used to limit the fetching to the first 50 Pokémon.
// "node this-script.js --use-existing" can be used to skip fetching and use existing data.
// "node this-script.js --regional-fix" can be used to generate regional fix files.
const args = process.argv.slice(2);  // Extracting command-line arguments excluding node command and script filename
const limit = args.length > 0 && !isNaN(args[0]) ? parseInt(args[0], 10) : null;  // Limit of Pokémon species to fetch, parsed from the first argument if it's a number
const useExisting = args.includes('--use-existing');  // Flag to indicate if existing Pokémon data should be used
const generateRegionalFix = args.includes('--regional-fix');  // Flag to indicate if regional fix files should be generated

const outputSubfolder = 'fetched_data';  // Subfolder where fetched data will be stored
const jsonName = 'pokemon-list';         // Base name for JSON output file
const jsName = 'pokemonList';            // Base name for JS output file
const baseUrl = 'https://pokeapi.co/api/v2';  // Base URL for PokeAPI
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));  // Utility function for creating delays with promises

const regionals = ['alola', 'galar', 'hisui', 'paldea'];  // List of regional suffixes
const paradoxPokemon = {
    ancient: [984, 985, 988, 986, 987, 988, 989, 1005, 1007, 1009, 1020, 1021],  // List of ancient Pokémon IDs
    future: [990, 991, 992, 993, 994, 995, 1006, 1008, 1010, 1022, 1023]          // List of future Pokémon IDs
};
const ultraBeasts = [793, 794, 795, 796, 797, 798, 799, 806, 803, 804, 805];  // List of Ultra Beasts Pokémon IDs

// Global flag to enable/disable type comparison
// Type comparison might work in special cases but should be avoided in general
const compareTypes = false;

/**
 * Retrieves data from a URL with retry functionality.
 * @param {string} url - The URL to fetch data from.
 * @param {number} [retries=5] - Number of retry attempts on failure.
 * @param {number} [delayMs=100] - Initial delay in milliseconds between retries.
 * @returns {Promise<any>} - Promise resolving to fetched data.
 */
async function fetchWithRetry(url, retries = 5, delayMs = 100) {
    // Retry operation setup with exponential backoff
    const operation = retry.operation({
        retries: retries,
        factor: 2,
        minTimeout: delayMs,
        maxTimeout: delayMs * 16
    });

    return new Promise((resolve, reject) => {
        operation.attempt(async currentAttempt => {
            try {
                console.log(`Fetching URL: ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                resolve(data);
            } catch (error) {
                if (operation.retry(error)) {
                    console.warn(`Fetch error: ${error.message}. Retrying attempt ${currentAttempt}...`);
                    return;
                }
                reject(operation.mainError());
            }
        });
    });
}

/**
 * Fetches all Pokémon species from the API.
 * @param {number} [limit=null] - Optional limit on the number of species to fetch.
 * @returns {Promise<Array>} - Promise resolving to an array of Pokémon species.
 */
async function fetchAllPokemonSpecies(limit = null) {
    let species = [];
    let nextUrl = `${baseUrl}/pokemon-species?limit=1000`;

    while (nextUrl && (limit === null || species.length < limit)) {
        console.log(`Fetching species list from: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        species = species.concat(data.results);
        nextUrl = data.next;

        if (limit !== null && species.length >= limit) {
            species = species.slice(0, limit);
            break;
        }
    }

    return species;
}

/**
 * Fetches details for each species to get forms and variants.
 * @param {string} speciesUrl - URL of the Pokémon species.
 * @returns {Promise<Array>} - Promise resolving to an array of Pokémon data.
 */
async function fetchPokemonForms(speciesUrl) {
    console.log(`Fetching forms for species: ${speciesUrl}`);
    const speciesData = await fetchWithRetry(speciesUrl);

    // Fetch the evolution chain to get the base Pokémon
    const evolutionChainUrl = speciesData.evolution_chain.url;
    const evolutionData = await fetchWithRetry(evolutionChainUrl);

    // Find the base Pokémon in the evolution chain
    let basePokemon = {};
    if (evolutionData.chain.species) {
        basePokemon.name = evolutionData.chain.species.name;
        basePokemon.url = evolutionData.chain.species.url;
    }

    // Find the default variety
    const defaultVariety = speciesData.varieties.find(variety => variety.is_default);

    // Each species can have multiple forms
    const forms = speciesData.varieties.map(variety => ({
        pokemonUrl: variety.pokemon.url,
        basePokemonId: basePokemon.url ? parseInt(basePokemon.url.split('/').slice(-2, -1)[0], 10) : 0,
        basePokemonName: basePokemon.name ?? '',
        defaultVarietyId: defaultVariety && defaultVariety.pokemon.url ? parseInt(defaultVariety.pokemon.url.split('/').slice(-2, -1)[0], 10) : 0,
        defaultVarietyName: defaultVariety ? defaultVariety.pokemon.name : '',
        isLegendary: speciesData.is_legendary,
        isMythical: speciesData.is_mythical,
        types: variety.pokemon.types ? variety.pokemon.types.map(typeInfo => typeInfo.type.name) : []
    }));

    return forms;
}

/**
 * Fetches details for each form/variant to get types, abilities, and sprite URL.
 * @param {string} pokemonUrl - URL of the Pokémon.
 * @param {number} basePokemonId - Base Pokémon ID.
 * @param {string} basePokemonName - Base Pokémon name.
 * @param {number} defaultVarietyId - Default variety ID.
 * @param {string} defaultVarietyName - Default variety name.
 * @param {boolean} isLegendary - Indicates if the Pokémon is legendary.
 * @param {boolean} isMythical - Indicates if the Pokémon is mythical.
 * @returns {Promise<Object>} - Promise resolving to Pokémon data.
 */
async function fetchPokemonData(pokemonUrl, basePokemonId, basePokemonName, defaultVarietyId, defaultVarietyName, isLegendary, isMythical) {
    console.log(`Fetching data for Pokémon: ${pokemonUrl}`);

    let pokemonData;
    let sprite = null;
    let spriteBaseUrl = null;

    try {
        // Fetch variant Pokémon data
        pokemonData = await fetchWithRetry(pokemonUrl);

        // Extract sprite URL and determine base URL
        if (pokemonData.sprites && pokemonData.sprites.front_default) {
            sprite = pokemonData.sprites.front_default;
            // Extract base URL by removing the last part of the URL
            spriteBaseUrl = sprite.substring(0, sprite.lastIndexOf('/') + 1);
        }

        // Fetch base Pokémon data using basePokemonId
        if (!sprite) {
            const basePokemonUrl = `${baseUrl}/pokemon/${basePokemonId}`;
            const basePokemonData = await fetchWithRetry(basePokemonUrl);

            // Use base Pokémon's sprite as fallback
            if (basePokemonData.sprites && basePokemonData.sprites.front_default) {
                sprite = basePokemonData.sprites.front_default;
                // Extract base URL by removing the last part of the URL
                spriteBaseUrl = sprite.substring(0, sprite.lastIndexOf('/') + 1);
            }
        }
    } catch (error) {
        console.error(`Error fetching Pokémon data for ${pokemonUrl}:`, error);
    }

    return {
        id: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map(typeInfo => typeInfo.type.name),
        abilities: pokemonData.abilities.map(abilityInfo => ({
            name: abilityInfo.ability.name,
            is_hidden: abilityInfo.is_hidden,
            slot: abilityInfo.slot
        })),
        sprite: sprite ? sprite.split('/').pop() : null,
        spriteBaseUrl: spriteBaseUrl,
        basePokemonId: basePokemonId,
        basePokemonName: basePokemonName,
        defaultVarietyId: defaultVarietyId,
        defaultVarietyName: defaultVarietyName,
        rarity: isLegendary ? 'legendary' : isMythical ? 'mythical' : ultraBeasts.includes(pokemonData.id) ? 'ultra' : null
    };
}

/**
 * Fetches all Pokémon details, processes them, and saves to JSON and JS files.
 * Handles optional parameters from command line.
 * @returns {void}
 */
async function getPokemonDetails() {
    let allPokemonDetailsArray;
    let spriteBaseUrls = {};
    
    try {
        // Fetch Pokémon details
        if (useExisting) {
            console.log('Using existing Pokémon data...');
            const jsonInputFilename = `${outputSubfolder}/${jsonName}.json`;
            const data = fs.readFileSync(jsonInputFilename, 'utf8');
            allPokemonDetailsArray = Object.values(JSON.parse(data));
        } else {
            console.log('Fetching all Pokémon species...');
            const speciesList = await fetchAllPokemonSpecies(limit);
            const pokemonUrls = [];

            console.log('Fetching forms for each species...');
            for (const species of speciesList) {
                const formUrls = await fetchPokemonForms(species.url);
                pokemonUrls.push(...formUrls);
            }

            console.log('Fetching details for each form...');
            // Use Promise.all to fetch details for each form concurrently
            const pokemonDetailsPromises = pokemonUrls.map(({ pokemonUrl, basePokemonId, basePokemonName, defaultVarietyId, defaultVarietyName, isLegendary, isMythical }) =>
                fetchPokemonData(pokemonUrl, basePokemonId, basePokemonName, defaultVarietyId, defaultVarietyName, isLegendary, isMythical)
            );

            allPokemonDetailsArray = await Promise.all(pokemonDetailsPromises);
        }

        // Convert all integer fields to integers
        allPokemonDetailsArray.forEach(detail => {
            detail.id = parseInt(detail.id, 10);
            detail.basePokemonId = parseInt(detail.basePokemonId, 10);
            detail.defaultVarietyId = parseInt(detail.defaultVarietyId, 10);
            
            // Collect sprite base URLs
            if (detail.spriteBaseUrl) {
                if (!spriteBaseUrls[detail.spriteBaseUrl]) {
                    spriteBaseUrls[detail.spriteBaseUrl] = [];
                }
                spriteBaseUrls[detail.spriteBaseUrl].push(detail.id);
                delete detail.spriteBaseUrl; // Remove spriteBaseUrl from each Pokémon detail
            }
        });

        // Determine the final sprite base URL(s) to use in the output
        let finalSpriteBaseUrl = null;
        if (Object.keys(spriteBaseUrls).length === 1) {
            finalSpriteBaseUrl = Object.keys(spriteBaseUrls)[0];
        }

        // Create an object of all Pokémon details keyed by their IDs
        const allPokemonDetails = Object.fromEntries(allPokemonDetailsArray.map(detail => [detail.id, detail]));

        // Process Pokémon names with regional suffixes and identify ancient or future Pokémon
        for (const detail of allPokemonDetailsArray) {
            const nameParts = detail.name.split('-');
            if (nameParts.length > 1) {
                const suffix = nameParts.slice(1).join('-');
                const basePokemon = allPokemonDetails[detail.basePokemonId];
                
                const matchedRegion = regionals.find(region => suffix.includes(region));
                if (matchedRegion) {
                    detail.region = matchedRegion;
                }

                if (basePokemon && (matchedRegion || (compareTypes && !basePokemon.types.every(type => detail.types.includes(type))))) {
                    const regionalBaseName = `${detail.basePokemonName}-${suffix}`;
                    const regionalBase = allPokemonDetailsArray.find(pokemon => pokemon.name === regionalBaseName);
                    if (regionalBase && regionalBase.id !== detail.basePokemonId) {
                        detail.basePokemonName = regionalBase.name;
                        detail.basePokemonId = regionalBase.id;
                    }
                }
            }

            // Identify Pokémon as ancient or future if in the paradox list
            if (paradoxPokemon.ancient.includes(detail.id)) {
                detail.paradox = 'ancient';
            } else if (paradoxPokemon.future.includes(detail.id)) {
                detail.paradox = 'future';
            }
        }

        // Write output to JSON and JS files
        const defaultJsonOutputFilename = `${outputSubfolder}/${jsonName}.json`;
        const defaultJsOutputFilename = `${outputSubfolder}/${jsName}.js`;

        fs.writeFileSync(defaultJsonOutputFilename, JSON.stringify(allPokemonDetails, null, 2));
        console.log(`\nPokemon data has been saved to ${defaultJsonOutputFilename}`);

        // Write Pokémon data to JS file, optionally including sprite base URL
        if (finalSpriteBaseUrl) {
            fs.writeFileSync(defaultJsOutputFilename, `window.__pokemonSpriteBaseUrl = "${finalSpriteBaseUrl}";\nwindow.__pokemonList = ${JSON.stringify(allPokemonDetails, null, 2)};`);
        } else {
            fs.writeFileSync(defaultJsOutputFilename, `window.__pokemonList = ${JSON.stringify(allPokemonDetails, null, 2)};`);
        }
        console.log(`Pokemon data has been saved to ${defaultJsOutputFilename}`);

        // Generate regional fix files if requested (--regional-fix cli argument)
        if (generateRegionalFix) {
            const jsonOutputFilename = `${outputSubfolder}/${jsonName}-regional-fix.json`;
            const jsOutputFilename = `${outputSubfolder}/${jsName}-regional-fix.js`;
            fs.writeFileSync(jsonOutputFilename, JSON.stringify(allPokemonDetails, null, 2));
            console.log(`\nRegional fix Pokémon data has been saved to ${jsonOutputFilename}`);
            fs.writeFileSync(jsOutputFilename, `window.__pokemonListRegionalFix = ${JSON.stringify(allPokemonDetails, null, 2)};`);
            console.log(`Regional fix Pokémon data has been saved to ${jsOutputFilename}`);
        }

        // Write sprite base URLs to a separate file if there are multiple unique URLs
        if (Object.keys(spriteBaseUrls).length > 1) {
            const spriteBaseUrlFilename = `${outputSubfolder}/pokemon-sprite-base-urls.json`;
            fs.writeFileSync(spriteBaseUrlFilename, JSON.stringify(spriteBaseUrls, null, 2));
            console.log(`Sprite base URLs have been saved to ${spriteBaseUrlFilename}`);
        }
    } catch (error) {
        console.error('Error fetching Pokémon details:', error);
    }
}

/**
 * Executes the process to fetch and process Pokémon details.
 * @returns {void}
 */
async function main() {
    await getPokemonDetails();  // Call the function to start fetching Pokémon details
}

// Execute main function
main();  // Start the main process
