import fetch from 'node-fetch';
import fs from 'fs';
import retry from 'retry';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const outputSubfolder = 'fetched_data'; // Subfolder where output will be saved
const jsonName = 'ability-list';
const jsName = 'abilityList';
const baseUrl = 'https://pokeapi.co/api/v2';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch function with retry logic
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

// Fetch all abilities
async function fetchAllAbilities() {
    let abilities = [];
    let nextUrl = `${baseUrl}/ability?limit=1000`;

    while (nextUrl) {
        console.log(`Fetching abilities list from: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        abilities = abilities.concat(data.results);
        nextUrl = data.next;
    }

    return abilities;
}

// Fetch ability details
async function fetchAbilityDetails(abilityUrl, includeAllLanguages) {
    console.log(`Fetching details for ability: ${abilityUrl}`);
    const abilityData = await fetchWithRetry(abilityUrl);

    const abilityInfo = {
        name: abilityData.name,
        hidden_for_pokemon: [],
        flavor_text_entries: []
    };

    // Get flavor text entries and keep the latest for each language
    const latestFlavorTexts = {};
    abilityData.flavor_text_entries.forEach(entry => {
        const lang = entry.language.name;
        if (includeAllLanguages || lang === 'en') {
            latestFlavorTexts[lang] = entry.flavor_text;
        }
    });

    for (const [lang, flavor_text] of Object.entries(latestFlavorTexts)) {
        abilityInfo.flavor_text_entries.push({
            language: lang,
            flavor_text: flavor_text
        });
    }

    // Check if it's a hidden ability for any Pokémon
    abilityData.pokemon.forEach(pokemonEntry => {
        if (pokemonEntry.is_hidden) {
            abilityInfo.hidden_for_pokemon.push(pokemonEntry.pokemon.name);
        }
    });

    return abilityInfo;
}

// Main function to get all abilities
async function getAllAbilities(includeAllLanguages) {
    try {
        console.log('Fetching all abilities...');
        const abilitiesList = await fetchAllAbilities();

        const allAbilitiesDetails = {};
        for (const ability of abilitiesList) {
            const abilityDetail = await fetchAbilityDetails(ability.url, includeAllLanguages);
            allAbilitiesDetails[abilityDetail.name] = abilityDetail;
            await delay(50); // Adding a small delay between requests to avoid rate limiting
        }

        // Determine the output filenames
        const filenameSuffix = includeAllLanguages ? '_all_languages' : '';
        const jsonOutputFilename = `${outputSubfolder}/${jsonName}${filenameSuffix}.json`;
        const jsOutputFilename = `${outputSubfolder}/${jsName}${filenameSuffix}.js`;

        // Write the details to a JSON file
        fs.writeFileSync(jsonOutputFilename, JSON.stringify(allAbilitiesDetails, null, 2));
        console.log(`\nAbility details have been saved to ${jsonOutputFilename}`);

        // Write the details to a JavaScript file
        fs.writeFileSync(jsOutputFilename, `window.__abilityList = ${JSON.stringify(allAbilitiesDetails, null, 2)};`);
        console.log(`Ability details have been saved to ${jsOutputFilename}`);
    } catch (error) {
        console.error('Error fetching abilities data:', error);
    }
}

// CLI argument handling
const argv = yargs(hideBin(process.argv))
    .option('all-languages', {
        alias: 'a',
        description: 'Include data for all languages',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h')
    .argv;

// Run the function to fetch and save abilities details
getAllAbilities(argv.allLanguages);
