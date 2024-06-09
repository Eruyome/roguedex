import fetch from 'node-fetch';
import fs from 'fs';
import retry from 'retry';

const outputSubfolder = 'fetched_data'; // Subfolder where output will be saved
const jsonName = 'pokemon-list';
const jsName = 'pokemonList';
const baseUrl = 'https://pokeapi.co/api/v2';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

// Fetch the list of all Pokémon species
async function fetchAllPokemonSpecies() {
    let species = [];
    let nextUrl = `${baseUrl}/pokemon-species?limit=1000`;

    while (nextUrl) {
        console.log(`Fetching species list from: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        species = species.concat(data.results);
        nextUrl = data.next;
    }

    return species;
}

// Fetch details for each species to get forms and variants
async function fetchPokemonForms(speciesUrl) {
    console.log(`Fetching forms for species: ${speciesUrl}`);
    const speciesData = await fetchWithRetry(speciesUrl);

    // Each species can have multiple forms
    const forms = speciesData.varieties.map(variety => ({
        pokemonUrl: variety.pokemon.url,
        basePokemonId: speciesData.id,
        basePokemonName: speciesData.name
    }));

    return forms;
}

// Fetch details for each form/variant to get types, abilities, and sprite URL
async function fetchPokemonData(pokemonUrl, basePokemonId, basePokemonName) {
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
        basePokemonName: basePokemonName
    };
}

async function getPokemonDetails() {
    try {
        console.log('Fetching all Pokémon species...');
        const speciesList = await fetchAllPokemonSpecies();
        const pokemonUrls = [];

        console.log('Fetching forms for each species...');
        // Get all form URLs for each species
        for (const species of speciesList) {
            const formUrls = await fetchPokemonForms(species.url);
            pokemonUrls.push(...formUrls);
        }

        const allPokemonDetails = {};

        console.log('Fetching details for each form...');
        // Get details for each form
        for (const { pokemonUrl, basePokemonId, basePokemonName } of pokemonUrls) {
            try {
                const pokemonDetail = await fetchPokemonData(pokemonUrl, basePokemonId, basePokemonName);
                allPokemonDetails[pokemonDetail.id] = pokemonDetail;
            } catch (error) {
                console.error(`Failed to fetch data for ${pokemonUrl}: ${error.message}`);
            }
            await delay(50); // Adding a small delay between requests to avoid rate limiting
        }

        // Determine the output filenames
        const jsonOutputFilename = `${outputSubfolder}/${jsonName}.json`;
        const jsOutputFilename = `${outputSubfolder}/${jsName}.js`;

        // Write the details to a JSON file
        fs.writeFileSync(jsonOutputFilename, JSON.stringify(allPokemonDetails, null, 2));
        console.log(`\nPokemon data has been saved to ${jsonOutputFilename}`);

        // Write the details to a JavaScript file
        fs.writeFileSync(jsOutputFilename, `window.__pokemonList = ${JSON.stringify(allPokemonDetails, null, 2)};`);
        console.log(`Pokemon data has been saved to ${jsOutputFilename}`);
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
    }
}

// Run the function to fetch and save Pokémon details
getPokemonDetails();
