import fetch from 'node-fetch';
import fs from 'fs/promises';
import retry from 'retry';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';

const outputSubfolder = 'fetched_data'; // Subfolder where output will be saved
const jsonName = 'move-list';
const jsName = 'moveList';
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
                const responseData = await response.json();
                if (!response.ok) {
                    if (response.status === 404) {
                        console.warn(`Move not found for URL: ${url}`);
                        resolve({ id: null, url: url, error: 'Move not found' });
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                }
                resolve(responseData);
            } catch (error) {
                if (operation.retry(error)) {
                    console.warn(`Fetch error: ${error.message}. Retrying attempt ${currentAttempt}...`);
                    return;
                }
                console.error(`Failed to fetch URL: ${url}. Skipping this request.`);
                resolve(null); // Resolve with null to indicate that the request failed
            }
        });
    });
}

// Fetch all moves
async function fetchAllMoves() {
    let moves = [];
    let nextUrl = `${baseUrl}/move?limit=1000`;

    while (nextUrl) {
        console.log(`Fetching moves list from: ${nextUrl}`);
        const data = await fetchWithRetry(nextUrl);
        if (data === null) continue; // Skip this request if it failed
        moves = moves.concat(data.results);
        nextUrl = data.next;
    }

    return moves;
}

// Fetch move details
async function fetchMoveDetails(moveUrl, includeAllLanguages, problematicMoves) {
    console.log(`Fetching details for move: ${moveUrl}`);
    try {
        const moveData = await fetchWithRetry(moveUrl);

        if (moveData === null) {
            problematicMoves.push({ id: null, url: moveUrl, error: 'Failed to fetch move details' });
            return { id: null, name: null, error: 'Failed to fetch move details' };
        }

        const moveInfo = {
            id: moveData.id,
            type: moveData.type.name,
            category: moveData.damage_class.name,
            pp: moveData.pp,
            power: moveData.power,
            accuracy: moveData.accuracy,
            is_gmax: moveData.is_gmax,
            is_zmove: moveData.is_z_move,
            names: {},
            flavor_text_entries: {}
        };

        // Extract move names and flavor text for all languages
        if (includeAllLanguages) {
            for (const name of moveData.names) {
                moveInfo.names[name.language.name] = name.name;
            }
            for (const flavorText of moveData.flavor_text_entries) {
                moveInfo.flavor_text_entries[flavorText.language.name] = flavorText.flavor_text;
            }
        } else {
            // Extract only English move name and flavor text
            const englishName = moveData.names.find(name => name.language.name === 'en');
            if (englishName) {
                moveInfo.names['en'] = englishName.name;
            }
            const englishFlavorText = moveData.flavor_text_entries.find(entry => entry.language.name === 'en');
            if (englishFlavorText) {
                moveInfo.flavor_text_entries['en'] = englishFlavorText.flavor_text;
            }
        }

        return moveInfo;
    } catch (error) {
        console.error(`Error fetching move details for ${moveUrl}:`, error.message);
        problematicMoves.push({ id: null, url: moveUrl, error: error.message });
        return { id: null, name: null, error: 'Failed to fetch move details' };
    }
}

// Main function to get all moves
async function getAllMoves(includeAllLanguages) {
    const problematicMoves = [];
    try {
        console.log('Fetching all moves...');
        const movesList = await fetchAllMoves();

        const allMovesDetails = {};
        for (const move of movesList) {
            const moveDetail = await fetchMoveDetails(move.url, includeAllLanguages, problematicMoves);
            if (moveDetail.id !== null) { // Ensure we don't add null entries
                allMovesDetails[moveDetail.id] = moveDetail;
            }
            await delay(50); // Adding a small delay between requests to avoid rate limiting
        }

        // Determine the output filenames
        const filenameSuffix = includeAllLanguages ? '_all_languages' : '';
        const jsonOutputFilename = path.join(outputSubfolder, `${jsonName}${filenameSuffix}.json`);
        const jsOutputFilename = path.join(outputSubfolder, `${jsName}${filenameSuffix}.js`);

        // Write the details to a JSON file
        await fs.writeFile(jsonOutputFilename, JSON.stringify(allMovesDetails, null, 2));
        console.log(`\nMove details have been saved to ${jsonOutputFilename}`);

        // Write the details to a JavaScript file
        await fs.writeFile(jsOutputFilename, `window.__moveList = ${JSON.stringify(allMovesDetails, null, 2)};`);
        console.log(`Move details have been saved to ${jsOutputFilename}`);
    } catch (error) {
        console.error('Error fetching moves data:', error);
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

// Run the function to fetch and save moves details
getAllMoves(argv.allLanguages);
