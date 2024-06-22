import fetch from 'node-fetch';
import fs from 'fs';
import retry from 'retry';

// Read command-line arguments
// "node this-script.js 50" can be used to limit the fetching to the first 50 pokemon.
// "node this-script.js --use-existing" can be used to skip fetching and use existing data.
// "node this-script.js --regional-fix" can be used to generate regional fix files.
const args = process.argv.slice(2);
const limit = args.length > 0 && !isNaN(args[0]) ? parseInt(args[0], 10) : null;
const useExisting = args.includes('--use-existing');
const generateRegionalFix = args.includes('--regional-fix');

const outputSubfolder = 'fetched_data'; // Subfolder where output will be saved
const jsonName = 'pokemon-list';
const jsName = 'pokemonList';
const baseUrl = 'https://pokeapi.co/api/v2';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// List of regional suffixes
const regionals = ['alola', 'galar', 'hisui', 'paldea'];

// Global flag to enable/disable type comparison
// Type comparison might work in special cases but should be avoided in general
const compareTypes = false;

// Fetch data with retries
async function fetchWithRetry(url, retries = 5, delayMs = 1000) {
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

// Fetch the list of all Pokémon species, optionally limited
async function fetchAllPokemonSpecies(limit = null) {
    let species = [];
    let nextUrl = `${baseUrl}/pokemon-species?limit=1000`;

    while (nextUrl && (limit === null || species.length < limit)) {
        console.log(`Fetching species list from: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        species = species.concat(data.results);
        nextUrl = data.next;

        // Stop fetching if we have reached the limit
        if (limit !== null && species.length >= limit) {
            species = species.slice(0, limit);
            break;
        }
    }

    return species;
}

// Fetch details for each species to get forms and variants
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
        basePokemonId: parseInt(basePokemon.url.split('/').slice(-2, -1)[0] ?? '0', 10),
        basePokemonName: basePokemon.name ?? '',
        defaultVarietyId: parseInt(defaultVariety.pokemon.url.split('/').slice(-2, -1)[0], 10),
        defaultVarietyName: defaultVariety.pokemon.name,
        isLegendary: speciesData.is_legendary,
        isMythical: speciesData.is_mythical,
        types: variety.pokemon.types.map(typeInfo => typeInfo.type.name) // Include types for each form
    }));

    return forms;
}

// Fetch details for each form/variant to get types, abilities, and sprite URL
async function fetchPokemonData(pokemonUrl, basePokemonId, basePokemonName, defaultVarietyId, defaultVarietyName, isLegendary, isMythical) {
    console.log(`Fetching data for Pokémon: ${pokemonUrl}`);
    const pokemonData = await fetchWithRetry(pokemonUrl);

    return {
        id: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map(typeInfo => typeInfo.type.name),
        abilities: pokemonData.abilities.map(abilityInfo => ({
            name: abilityInfo.ability.name,
            is_hidden: abilityInfo.is_hidden,
            slot: abilityInfo.slot
        })),
        sprite: pokemonData.sprites.front_default,
        basePokemonId: basePokemonId,
        basePokemonName: basePokemonName,
        defaultVarietyId: defaultVarietyId,
        defaultVarietyName: defaultVarietyName,
        isLegendary: isLegendary,
        isMythical: isMythical
    };
}

async function getPokemonDetails() {
    let allPokemonDetailsArray;
    try {
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
            // Get all form URLs for each species
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
        });

        const allPokemonDetails = Object.fromEntries(allPokemonDetailsArray.map(detail => [detail.id, detail]));

        // Overwrite base name and id with regional name and id if applicable
        for (const detail of allPokemonDetailsArray) {
            const nameParts = detail.name.split('-');
            if (nameParts.length > 1) {
                const suffix = nameParts.slice(1).join('-');
                const basePokemon = allPokemonDetails[detail.basePokemonId];
                const regionalSuffixMatch = regionals.some(region => suffix.includes(region));

                if (basePokemon && (regionalSuffixMatch || (compareTypes && !basePokemon.types.every(type => detail.types.includes(type))))) {
                    const regionalBaseName = `${detail.basePokemonName}-${suffix}`;
                    const regionalBase = allPokemonDetailsArray.find(pokemon => pokemon.name === regionalBaseName);
                    if (regionalBase && regionalBase.id !== detail.basePokemonId) {
                        detail.basePokemonName = regionalBase.name;
                        detail.basePokemonId = regionalBase.id;
                    }
                }
            }
        }

        // Write the details to the default output files (overwrite them if they exist)
        const defaultJsonOutputFilename = `${outputSubfolder}/${jsonName}.json`;
        const defaultJsOutputFilename = `${outputSubfolder}/${jsName}.js`;
        fs.writeFileSync(defaultJsonOutputFilename, JSON.stringify(allPokemonDetails, null, 2));
        console.log(`\nPokemon data has been saved to ${defaultJsonOutputFilename}`);
        fs.writeFileSync(defaultJsOutputFilename, `window.__pokemonList = ${JSON.stringify(allPokemonDetails, null, 2)};`);
        console.log(`Pokemon data has been saved to ${defaultJsOutputFilename}`);

        // Write the regional fix files if --regional-fix argument is used
        if (generateRegionalFix) {
            const jsonOutputFilename = `${outputSubfolder}/${jsonName}-regional-fix.json`;
            const jsOutputFilename = `${outputSubfolder}/${jsName}-regional-fix.js`;
            fs.writeFileSync(jsonOutputFilename, JSON.stringify(allPokemonDetails, null, 2));
            console.log(`\nPokemon data has been saved to ${jsonOutputFilename}`);
            fs.writeFileSync(jsOutputFilename, `window.__pokemonList = ${JSON.stringify(allPokemonDetails, null, 2)};`);
            console.log(`Pokemon data has been saved to ${jsOutputFilename}`);
        }

    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
    }
}

// Run the function to fetch and save Pokémon details
getPokemonDetails();
