// import CryptoJS from '../libs/crypto-js.min.js';
// import Utils from "./utils.js";

const runningStatusDiv = document.createElement('div')
runningStatusDiv.textContent = 'RogueDex is running!'
runningStatusDiv.classList.add('text-base')
runningStatusDiv.classList.add('running-status')
document.body.insertBefore(runningStatusDiv, document.body.firstChild);
scriptInjector();

function scriptInjector() {
    const scriptElem = document.createElement("script");
    scriptElem.src = chrome.runtime.getURL("/content/utils.js");
    scriptElem.type = "module";
    document.head.append(scriptElem);
    scriptElem.addEventListener("load", initUtilities);
}

let Utils;

function initUtilities(e) {
    Utils = new UtilsClass();
    Utils.init();
    Utils.addEventListener('isReadyChange', () => {
        if (Utils.isReady) {
            //Utils.LocalStorage.clearImageCache();
            console.log("All Scripts Loaded!")
            //touchControlListener();
            extensionSettingsListener();
        } else {
            console.log("Error Loading Scripts :(")
        }
    });
}

let wrapperDivPositions = {
    'enemies': {
        'top': '0',
        'left': '0',
        'opacity': '100'
    },
    'allies': {
        'top': '0',
        'left': '0',
        'opacity': '100'
    }
}

let lastPartyHashes = {
    'enemies': 0,
    'allies': 0
}

function createEnemyDiv(showSidebar = false) {
    const enemies = document.createElement("div");
    enemies.className = 'enemy-team'
    if (showSidebar) {
        enemies.className = 'hidden'
    }
    enemies.id = "enemies";
    return enemies;
}

function createAlliesDiv(showSidebar = false) {
    const allies = document.createElement("div");
    allies.className = 'allies-team'
    if (showSidebar) {
        allies.className = 'hidden'
    }
    allies.id = "allies";
    return allies;
}

// Enables drag-and-drop functionality on an element
function enableDragElement(elmnt) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    const dragStartElement = elmnt;

    // Attach the mousedown event handler
    dragStartElement.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        if (e.target.type === 'submit' || e.target.type === 'range') return
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = stopDragging;
        document.onmousemove = dragElement;
    }

    // Handles dragging movement
    function dragElement(e) {
        e = e || window.event;
        if (e.target.type === 'submit' || e.target.type === 'range') return
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    // Stops dragging on mouse release
    function stopDragging() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

createSidebar()
const enemiesDiv = createEnemyDiv()
const alliesDiv = createAlliesDiv()

enableDragElement(enemiesDiv);
enableDragElement(alliesDiv);

document.body.append(enemiesDiv);
document.body.append(alliesDiv);

let Types
(function (Types) {
    Types[Types["normal"] = 1] = 1;
    Types[Types["fighting"] = 2] = 2;
    Types[Types["flying"] = 3] = 3;
    Types[Types["poison"] = 4] = 4;
    Types[Types["ground"] = 5] = 5;
    Types[Types["rock"] = 6] = 6;
    Types[Types["bug"] = 7] = 7;
    Types[Types["ghost"] = 8] = 8;
    Types[Types["steel"] = 9] = 9;
    Types[Types["fire"] = 10] = 10;
    Types[Types["water"] = 11] = 11;
    Types[Types["grass"] = 12] = 12;
    Types[Types["electric"] = 13] = 13;
    Types[Types["psychic"] = 14] = 14;
    Types[Types["ice"] = 15] = 15;
    Types[Types["dragon"] = 16] = 16;
    Types[Types["dark"] = 17] = 17;
    Types[Types["fairy"] = 18] = 18;
})(Types || (Types = {}));

let Stat;
(function (Stat) {
    Stat[Stat["HP"] = 0] = "HP";
    Stat[Stat["ATK"] = 1] = "ATK";
    Stat[Stat["DEF"] = 2] = "DEF";
    Stat[Stat["SPATK"] = 3] = "SPATK";
    Stat[Stat["SPDEF"] = 4] = "SPDEF";
    Stat[Stat["SPD"] = 5] = "SPD";
})(Stat || (Stat = {}));


function createTooltipDiv(tip) {
    const tooltip = document.createElement('div')
    tooltip.classList.add('text-base')
    tooltip.classList.add('tooltiptext')
    tooltip.textContent = tip
    return tooltip
}

// Current values: weaknesses, resistances, immunities
function createTypeEffectivenessWrapper(typeEffectivenesses) {
    let typesHTML = `
        ${Object.keys(typeEffectivenesses).map((effectiveness) => {
        const effectivenessObj = typeEffectivenesses[effectiveness];
        console.log(typeEffectivenesses);
        if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length)) return '';

        const tooltipMap = {
            weaknesses: "Weak to",
            resistances: "Resists",
            immunities: "Immune to"
        };

        const allTypes = [
            ...(effectivenessObj.normal || []),
            ...(effectivenessObj.double || [])
        ];

        return `
          <div class="pokemon-${effectiveness} tooltip">
              ${allTypes.map((type, counter) => {
            const cssClass = getTypeEffectivenessCssClass(type, typeEffectivenesses);
            if (effectiveness === "cssClasses") {
                return ''; // Skip if effectiveness is not equal to cssClass
            }
            return `
                      ${/* The current html structure requires to wrap every third element in a div, the implementation here gets a bit ugly. */''}
                      ${(counter % 3 === 0) ? `<div>` : ''}

                      <div class="type-icon ${cssClass}" 
                          style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${Types[type]}.png')"></div>
                      
                      ${/* Closing div, after every third element or when the arrays max length is reached. */''}
                      ${((counter + 1) % 3 === 0) || ((counter + 1) === allTypes.length) ? `</div>` : ''}
                  `;
        }).join('')}
              ${createTooltipDiv(tooltipMap[effectiveness] || "")}
          </div>
       `;
    }).join('')}`;

    return typesHTML;
}


function getTypeEffectivenessCssClass(type, typeEffectivenessDetailed) {
    try {
        return typeEffectivenessDetailed.cssClasses[type]
    } catch (error) {
        return ''
    }
}

function createTooltipDiv(tip) {
    const tooltipHtml = `
		<div class="text-base tooltiptext">${tip}</div>
	`
    return tooltipHtml
}


const pages = {
    "enemies": 0,
    "allies": 0,
}
const partySize = {
    "enemies": 0,
    "allies": 0
}
let weather = {};

function createArrowButtonsDiv(divId, upString, downString, showMinified) {
    let sizes = "2.5em !important"
    if (showMinified) {
        sizes = "1em !important"
    }
    let result = {};
    result.idUp = `${divId}-up`
    result.idDown = `${divId}-down`
    result.html = `
		<div class="arrow-button-wrapper" style="font-size: ${sizes}">
			<button class="text-base arrow-button" id="${result.idUp}">${upString}</button>
			<button class="text-base arrow-button" id="${result.idDown}">${downString}</button>
		</div>
	`

    return result
}

function createOpacitySliderDiv(divId, initialValue = "100", min = "10", max = "100") {
    let result = {};
    result.id = `${divId}-slider`
    result.html = `
  		<div class="slider-wrapper">
  			<div class="text-base">Opacity:</div>
  			<input class="op-slider" type="range" min="${min}" max="${max}" value="${initialValue}" id="${result.id}">
  		</div>
  	`
    return result
}

function changeOpacity(e) {
    const divId = e.target.id.split("-")[0]
    const div = document.getElementById(divId)
    wrapperDivPositions[divId].opacity = e.target.value
    div.style.opacity = `${e.target.value / 100}`
}

async function changePage(click) {
    const buttonId = click.target.id
    const divId = buttonId.split("-")[0]
    const direction = buttonId.split("-")[1]
    if (direction === 'up') {
        if (pages[divId] > 0) {
            pages[divId] -= 1
        } else {
            pages[divId] = partySize[divId]
        }
    } else if (direction === 'down') {
        if (pages[divId] < partySize[divId]) {
            pages[divId] += 1
        } else {
            pages[divId] = partySize[divId]
        }
    }
    let sessionData = Utils.LocalStorage.getSessionData();
    await initCreation(sessionData);
}

async function createPokemonCardDiv(cardId, pokemon) {
    let opacityRangeMin = 10;
    let opacityRangeMax = 100;
    // getPokemonIcon(pokemon);
    let pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const opacitySlider = createOpacitySliderDiv(cardId, wrapperDivPositions[cardId].opacity, opacityRangeMin, opacityRangeMax);
    const typeEffectivenessHTML = createTypeEffectivenessWrapper(pokemon.typeEffectiveness);
    let cardHTML = `
  	<div class="pokemon-cards">
	    <div class="pokemon-card">
	      ${opacitySlider.html}
	      <div style="display: flex;">
	        <canvas id="pokemon-icon_${cardId}" class="pokemon-icon">
	        </canvas>
	        ${typeEffectivenessHTML}
	        
	      </div>

	      <div class="text-base">
	      	<div class="tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
	        	Ability: ${pokemon.ability.name} 
	        	${createTooltipDiv(pokemon.ability.description)}
	        </div>
	        &nbsp-&nbsp 
	        <div class = "tooltip">
	        	Nature: ${pokemon.nature}
	        	${createTooltipDiv("")}
	        </div>
	      </div>
	      <div class="text-base">
	        HP: ${pokemon.ivs[Stat["HP"]]}, ATK: ${pokemon.ivs[Stat["ATK"]]}, DEF: ${pokemon.ivs[Stat["DEF"]]}
	      </div>
	      <div class="text-base">
	        SPE: ${pokemon.ivs[Stat["SPD"]]}, SPD: ${pokemon.ivs[Stat["SPDEF"]]}, SPA: ${pokemon.ivs[Stat["SPATK"]]}
	      </div>
	        
	      ${(weather.type && weather.turnsLeft) ?
        `<div class="text-base">Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</div>`
        : ''}
	    </div>
    </div>
  `

    const cardObj = {}
    cardObj.html = cardHTML;
    cardObj.slider = opacitySlider.id;

    return cardObj
}

function generateMovesetHTML(pokemon) {
    let html = '';    
    for (let i in pokemon.moveset) {
        let move = pokemon.moveset[i];
        html += `
            <div class="tooltip">
                <div class="pokemon-move">
                    <span class="pokemon-move-name">${move.name}</span>
                    <span class="pokemon-move-type">${move.type}</span>
                </div>                
                ${createTooltipDiv(`Category: ${move.category}<br>Power: ${move.name}<br>maxPP: ${move.maxPP}<br>Accuracy: ${move.accuracy}`)}
            </div>            
        `
    }

    return html;
}

function generateIVsHTML(pokemon, dexIvs, simpleDisplay = false, addStyleClasses = false) {
    let fullHTML = ``;
    for (let i in pokemon.ivs) {
        let curIV = pokemon.ivs[i];

        if (simpleDisplay === true && addStyleClasses === false) {
            // skip the colors and indicators for whether the ivs would be an upgrade for your own starters
            fullHTML += `<div class="stat-p">${Stat[i]}:&nbsp;<div class="stat-c">${curIV}</div>&nbsp;&nbsp;</div>`;
        } else if (simpleDisplay === true && addStyleClasses === true) {
            // skip the color gradients and indicators, but add css-classes to style the descriptors and values differently
            fullHTML += `<div class="stat-p stat-p-colors">${Stat[i]}:&nbsp;<div class="stat-c stat-c-colors">${curIV}</div>&nbsp;&nbsp;</div>`;
        } else if (simpleDisplay === false && addStyleClasses === true) {
            // don't skip the color gradients and indicators, but add css-classes to style the descriptors and values differently anyways
            fullHTML += `<div class="stat-p stat-p-colors">${Stat[i]}:&nbsp;<div class="stat-c stat-c-colors">${curIV}</div>&nbsp;&nbsp;</div>`;
        } else {
            // add (hardcode) color gradients and icons
            fullHTML += `<div class="stat-p">${Stat[i]}:&nbsp;<div class="stat-c" style="color: ${getColor(curIV)}">${curIV}${ivComparison(curIV, dexIvs[i])}</div>&nbsp;&nbsp;</div>`;
        }
    }
    return fullHTML;
}

function ivComparison(pokeIv, dexIv) {
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
    let returnHTML = `<div class="stat-icon" style="color: ${colorS} !important; opacity: 0.3">${iconA}</div>`
    return returnHTML;
}

const imageCache = {};
async function getPokemonIcon(pokemon, divId) {
    const DISABLE_FUN_FUSION = true;
    const cacheKey = pokemon.fusionId ? `${pokemon.name}-${pokemon.fusionId}` : pokemon.name;
    console.time(`getPokemonIcon_${cacheKey}`); // Start the timer

    const canvas = document.getElementById(`pokemon-icon_${divId}`);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;
        const image1 = new Image();
        const image2 = new Image();
        const fusionImage = new Image();

        const loadImageFromBlobUrl = (image, blobUrl) => {
            return new Promise((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = blobUrl;
            });
        };

        const drawSingleImage = (image) => {
            const width = image.width;
            const height = image.height;
            const parentHeight = parent.clientHeight;
            const canvasWidth = parentHeight * (width / height);

            canvas.width = canvasWidth;
            canvas.height = parentHeight;

            ctx.drawImage(image, 0, 0, width, height, 0, 0, canvasWidth, parentHeight);
        };

        const drawCombinedImages = () => {
            const width = image1.width;
            const height = image1.height;
            const parentHeight = parent.clientHeight;
            const canvasWidth = parentHeight * (width / height);

            canvas.width = canvasWidth;
            canvas.height = parentHeight;

            ctx.drawImage(image1, 0, 0, width, height / 2, 0, 0, canvasWidth, parentHeight / 2);
            ctx.drawImage(image2, 0, height / 2, width, height / 2, 0, parentHeight / 2, canvasWidth, parentHeight / 2);
        };

        const fetchImageAndCache = (url, cacheKey, image) => {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: "fetchImage",
                    url: url
                }, response => {
                    if (response.success) {
                        const blobUrl = response.dataUrl;
                        imageCache[cacheKey] = blobUrl; // Save Blob URL to memory cache
                        Utils.LocalStorage.saveImageToCache(cacheKey, blobUrl); // Save to local storage
                        loadImageFromBlobUrl(image, blobUrl).then(resolve).catch(reject);
                    } else {
                        reject(response.error);
                    }
                });
            });
        };

        const image1Src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
        const image2Src = pokemon.fusionId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.fusionId}.png` : null;

        const cachedImage = imageCache[cacheKey] || Utils.LocalStorage.getImageFromCache(cacheKey);

        const fallbackToSeparateImages = () => {
            Promise.all([
                fetchImageAndCache(image1Src, `${pokemon.name}-1`, image1),
                fetchImageAndCache(image2Src, `${pokemon.name}-2`, image2)
            ])
                .then(drawCombinedImages)
                .then(() => {
                    // Combine the images into a single canvas and cache it
                    const combinedCanvas = document.createElement('canvas');
                    combinedCanvas.width = canvas.width;
                    combinedCanvas.height = canvas.height;
                    const combinedCtx = combinedCanvas.getContext('2d');
                    combinedCtx.drawImage(canvas, 0, 0);
                    const combinedDataUrl = combinedCanvas.toDataURL();

                    imageCache[cacheKey] = combinedDataUrl; // Save combined image to memory cache
                    Utils.LocalStorage.saveImageToCache(cacheKey, combinedDataUrl); // Save combined image to local storage

                    console.timeEnd(`getPokemonIcon_${cacheKey}`); // End the timer
                })
                .catch(error => console.error(error));
        };

        if (cachedImage) {
            console.log('Using cached image');

            const blobUrl = cachedImage;
            imageCache[cacheKey] = blobUrl; // Save to memory cache if loaded from local storage
            loadImageFromBlobUrl(image1, blobUrl).then(() => {
                if (pokemon.fusionId) {
                    loadImageFromBlobUrl(image2, blobUrl).then(drawCombinedImages).catch(error => console.error(error));
                } else {
                    drawSingleImage(image1);
                }
                console.timeEnd(`getPokemonIcon_${cacheKey}`); // End the timer
            }).catch(error => console.error(error));
        } else {
            if (pokemon.fusionId) {
                if (!DISABLE_FUN_FUSION) {
                    const fusionName = Utils.PokeMapper.capitalizeFirstLetter(Utils.PokeMapper.I2P[pokemon.fusionId]);
                    const pokeName = Utils.PokeMapper.capitalizeFirstLetter(Utils.PokeMapper.I2P[pokemon.id]);

                    chrome.runtime.sendMessage({
                        action: "fetchFusionImageHtml",
                        fusionId: fusionName,
                        pokemonId: pokeName
                    }, response => {
                        if (response.success) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.html, 'text/html');
                            const figure = doc.querySelector('figure.sprite.sprite-variant-main');
                            if (figure) {
                                const img = figure.querySelector('img');
                                if (img) {
                                    chrome.runtime.sendMessage({
                                        action: "fetchImage",
                                        url: img.src
                                    }, imageResponse => {
                                        if (imageResponse.success) {
                                            const blobUrl = imageResponse.dataUrl;
                                            imageCache[cacheKey] = blobUrl; // Save Blob URL to memory cache
                                            Utils.LocalStorage.saveImageToCache(cacheKey, blobUrl); // Save to local storage
                                            loadImageFromBlobUrl(fusionImage, blobUrl)
                                                .then(() => {
                                                    drawSingleImage(fusionImage);
                                                    console.timeEnd(`getPokemonIcon_${cacheKey}`); // End the timer
                                                })
                                                .catch(error => console.error(error));
                                        } else {
                                            console.error('Failed to fetch fusion image:', imageResponse.error);
                                            fallbackToSeparateImages();
                                        }
                                    });
                                    return;
                                }
                            }
                        }
                        fallbackToSeparateImages();
                    });
                } else {
                    fallbackToSeparateImages();
                }
            } else {
                fetchImageAndCache(image1Src, cacheKey, image1)
                    .then(() => {
                        drawSingleImage(image1);
                        console.timeEnd(`getPokemonIcon_${cacheKey}`); // End the timer
                    })
                    .catch(error => console.error(error));
            }
        }
    }
    console.log(pokemon);
}


async function createPokemonCardDiv_minified(cardId, pokemon) {
    let savedData = Utils.LocalStorage.getPlayerData();
    let dexData = savedData["dexData"];
    let dexIvs = dexData[pokemon.baseId]["ivs"];
    console.log(savedData);
    let opacityRangeMin = 10;
    let opacityRangeMax = 100;
    let pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const opacitySlider = createOpacitySliderDiv(cardId, wrapperDivPositions[cardId].opacity, opacityRangeMin, opacityRangeMax);
    const typeEffectivenessHTML = createTypeEffectivenessWrapper(pokemon.typeEffectiveness);
    let ivsGeneratedHTML = generateIVsHTML(pokemon, dexIvs);
    //${opacitySlider.html}
    // <div style="display: flex;">
    //     <div class="pokemon-icon">
    //         <img src="${pokemonImageUrl}">
    //     </div>
    //     // ${typeEffectivenessHTML}
    //
    // </div>
    let cardHTML = `
  	<div class="pokemon-cards">
	    <div class="pokemon-card">
	        <div class="text-base centered-flex">${pokemon.name}</div>
	      <div class="text-base centered-flex">
	      <div class="image-overlay">
	      <canvas id="pokemon-icon_${cardId}" class="pokemon-icon"></canvas>
            </div>
	      	<div class="tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
	        	Ability: ${pokemon.ability.name} 
	        	${createTooltipDiv(pokemon.ability.description)}
	        </div>
	        &nbsp-&nbsp 
	        <div class = "tooltip">
	        	Nature: ${pokemon.nature}
	        	${createTooltipDiv("")}
	        </div>
	      </div>
	      <div class="text-base stat-cont">
	        ${ivsGeneratedHTML}
	      </div>
	        
	      ${(weather.type && weather.turnsLeft) ?
        `<div class="text-base">Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</div>`
        : ''}
	    </div>
    </div>
  `

    const cardObj = {}
    cardObj.html = cardHTML;
    //cardObj.slider = opacitySlider.id;
    return cardObj
}

function createWrapperDiv(divId, showSidebar) {
    const oldDiv = document.getElementById(divId)
    if (oldDiv) {
        wrapperDivPositions[divId].top = oldDiv.style.top;
        wrapperDivPositions[divId].left = oldDiv.style.left;
        oldDiv.remove();
    }
    const newDiv = divId === 'enemies' ? createEnemyDiv(showSidebar) : createAlliesDiv(showSidebar)
    enableDragElement(newDiv)
    newDiv.style.top = wrapperDivPositions[divId].top
    newDiv.style.left = wrapperDivPositions[divId].left
    newDiv.style.opacity = "" + (Number(wrapperDivPositions[divId].opacity) / 100)
    return newDiv;
}

function getColor(num) {
    if (num < 0 || num > 31) {
        throw new Error('Number must be between 0 and 31');
    }

    // Calculate the red component: It decreases as 'num' increases
    let red = Math.floor(255 * (1 - num / 31));
    // Calculate the green component: It increases as 'num' increases
    let green = Math.floor(255 * (num / 31));
    // Blue component is always 0 for a red to green gradient
    let blue = 0;

    // Convert each color component to a hex string and pad with 0 if necessary
    let redHex = red.toString(16).padStart(2, '0');
    let greenHex = green.toString(16).padStart(2, '0');
    let blueHex = blue.toString(16).padStart(2, '0');

    // Combine the hex values and return the result
    return `#${redHex}${greenHex}${blueHex}`;
}


async function chooseCardType(divId, pokemon, minified) {
    if (minified) {
        return cardsObj = await createPokemonCardDiv_minified(divId, pokemon);
    } else {
        return cardsObj = await createPokemonCardDiv(divId, pokemon);
    }
}

async function createCardsDiv(divId, pokemonData, pokemonIndex) {
    const pokemon = pokemonData[pokemonIndex]
    let extensionSettings = await Utils.LocalStorage.getExtensionSettings();
    let newDiv = createWrapperDiv(divId, extensionSettings.showSidebar);

    return await chooseCardType(divId, pokemon, extensionSettings.showMinified).then(async (cardObj) => {
        const buttonsObj = createArrowButtonsDiv(divId, "↑", "↓", extensionSettings.showMinified);
        const cardsHTML = `
    	   ${buttonsObj.html}
    	   ${cardObj.html}
        `;
        newDiv.insertAdjacentHTML("afterbegin", cardsHTML)
        document.body.append(newDiv);
        getPokemonIcon(pokemon, divId);

        if (cardObj.slider) {
            document.getElementById(cardObj.slider).addEventListener('input', changeOpacity)
        }
        document.getElementById(buttonsObj.idUp).addEventListener('click', (event) => {
            changePage(event);
        })
        document.getElementById(buttonsObj.idDown).addEventListener('click', (event) => {
            changePage(event);
        })
        return newDiv
    })
}

function createSidebar() {
    const sidebarHtml = `
        <div class="roguedex-sidebar" id="roguedex-sidebar">
            <div class="sidebar-header" id="sidebar-header">
                <span>RogueDex</span>
            </div>
            <div class="sidebar-enemies-box visible" id="sidebar-enemies-box"></div>
            <div class="sidebar-allies-box visible" id="sidebar-allies-box"></div>
        </div>
    `
    const bottomPanelHtml = `
        <div class="roguedex-bottom-panel sidebar-Left" id="roguedex-bottom-panel">
            <div class="roguedex-bottom-panel-content">RogueDex Bottom Panel</div>
        </div>
    `

    document.body.insertAdjacentHTML("afterbegin", sidebarHtml)
    document.body.insertAdjacentHTML("beforeend", bottomPanelHtml)
}

function createSidebarTypeEffectivenessWrapper(typeEffectivenesses) {
    let typesHTML = `
        ${Object.keys(typeEffectivenesses).map((effectiveness) => {
        const effectivenessObj = typeEffectivenesses[effectiveness];
        if (!effectivenessObj || (!effectivenessObj.normal?.length && !effectivenessObj.double?.length)) return '';
        if (effectiveness === "cssClasses") {
            return ''; // Skip if effectiveness is not equal to cssClass
        }

        const allTypes = [
            ...(effectivenessObj.normal || []),
            ...(effectivenessObj.double || [])
        ];

        return `
            <div class="pokemon-type-effectiveness-category pokemon-type-${effectiveness}">
                ${allTypes.map((type, counter) => `
                    <div class="pokemon-type-icon ${getTypeEffectivenessCssClass(type, typeEffectivenesses)}" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${Types[type]}.png')"></div>
                `).join('')}
            </div>
        `;
    }).join('')}`;

    return typesHTML;
}

/*
    Updates party information for both sides (allies, enemies) in the sidebar.    
*/
async function updateSidebarCards(partyID, sessionData, pokemonData) {
    console.log(sessionData)
    console.log(pokemonData)

    const trainer = sessionData.trainer;
    const enemyPartySize = sessionData.enemyParty.length;
    const allyPartySize = sessionData.party.length;
    const maxPokemonForDetailedView = 8;
    const isTrainerBattle = (trainer != null);
    let css_class_condensed = '';

    /* Change the sidebar view to a more condensed version when more than 8 pokemon are fighting. (Olny some trianer battles) */
    if ((enemyPartySize + allyPartySize) > maxPokemonForDetailedView && partyID == 'allies') {
        css_class_condensed = 'condensed';
    }

    /* Update bottom panel information. Logic will be handled in updateBottomPanel(). */
    await updateBottomPanel(partyID, pokemonData)

    /* Update the sidebars header. For now only sets/removes the trainer battle label. */
    await updateSidebarHeader(isTrainerBattle);

    const sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`)  
    let savedData = Utils.LocalStorage.getPlayerData()
    let dexData = savedData["dexData"]

    sidebarPartyElement.replaceChildren();

    let partyWrapperHtml = `
        <div class="${partyID}-party">
            <div class="sidebar-party-info" id="sidebar-${partyID}-party-info"></div>
            ${pokemonData.pokemon.map((pokemon, counter) => `
                <div class="pokemon-entry ${css_class_condensed}" id="sidebar_${partyID}_${counter}">
                    <div class="pokemon-entry-image">
                        <canvas id="pokemon-icon_sidebar_${partyID}_${counter}" class="pokemon-entry-icon"></canvas>

                        <div class="sidebar-pokemon-info tooltip" style="position: absolute; ${partyID == 'enemies' ? 'display: none;' : ''}">
                            <span class="sidebar-pokemon-level">Lvl. ${pokemon.level}</span>
                            <span class="sidebar-pokemon-shiny">${pokemon.shiny ? '☀' : ''}</span>
                            <span class="sidebar-pokemon-luck">☘ ${pokemon.luck}</span>
                            ${createTooltipDiv(`Pokemons current level: ${pokemon.level}.<br>Is shiny: ${pokemon.shiny ? 'Yes' : 'No'}.<br>Pokemon luck (shiny bonus): ${pokemon.luck}.`)}
                        </div>

                    </div>
                    <div class="pokemon-type-effectiveness-wrapper">
                        ${createSidebarTypeEffectivenessWrapper(pokemon.typeEffectiveness)}
                    </div>
                    <div class="pokemon-info-text-wrapper">
                        <div class="pokemon-ability-nature">
                            <span class="pokemon-ability tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
                                <span class="pokemon-ability-description">
                                    Ability:
                                </span>
                                <span class="pokemon-ability-value">
                                    ${pokemon.ability.name}
                                </span>
                                ${createTooltipDiv(pokemon.ability.description)}
                            </span>                            
                            <span class="pokemon-nature tooltip">
                                <span class="pokemon-nature-description">
                                    Nature:
                                </span>
                                <span class="pokemon-nature-value">
                                    ${pokemon.nature}
                                </span>
                            </span>
                        </div>                       
                        
                        <div class="pokemon-ivs stat-cont">
                            ${partyID == 'allies' ? generateIVsHTML(pokemon, dexData[pokemon.baseId]["ivs"], true, true) : generateIVsHTML(pokemon, dexData[pokemon.baseId]["ivs"])}
                        </div>                       
                        
                        <div class="pokemon-moveset-wrapper">
                            ${partyID == 'allies' ? generateMovesetHTML(pokemon) : ''}                
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `
    sidebarPartyElement.insertAdjacentHTML("afterbegin", partyWrapperHtml)

    /* Draw all pokemon icons onto the added canvas elements. */
    pokemonData.pokemon.forEach(function (value, i) {
        getPokemonIcon(value, `sidebar_${partyID}_${i}`)
    })
}

async function updateSidebarHeader(isTrainerBattle) {
    const sidebarHeaderElement = document.getElementById('sidebar-header');
    sidebarHeaderElement.replaceChildren();

    if (isTrainerBattle) {
        let html = `
            <span>RogueDex</span>
            <span class=sidebar-header-trainer-battle>(Trainer Battle)</span>
        `
        sidebarHeaderElement.insertAdjacentHTML("afterbegin", html)
    } else {
        let html = `
            <span>RogueDex</span>
        `
        sidebarHeaderElement.insertAdjacentHTML("afterbegin", html)
    }
    return
}

async function updateBottomPanel(partyID, pokemonData) {
    const bottomPanelElement = document.getElementById(`roguedex-bottom-panel`)
    bottomPanelElement.replaceChildren();
    
    let weatherHtml = '';
    if (pokemonData.weather.type && pokemonData.weather.turnsLeft) {
        weatherHtml = `
            <div class="bottom-panel-weather-box">
                <div class="text-base">
                    <span>Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</span>
                </div>
            </div>         
        `
    } else {
        // delete existing weather div
    }
    
    /* Calculate the allies party total luck (from shinies). */    
    let luckTotal = 0;
    if (partyID == 'allies') {        
        pokemonData.pokemon.forEach(function (value, i) {
            luckTotal += value.luck;
        })
    }
    let luckHtml = `<div class="bottom-panel-party-luck"><span>Total Party Luck (from shinies): ${luckTotal}.</span></div>`;
    
    let html = `
        <div class="roguedex-bottom-panel-content">
            <div class="roguedex-bottom-panel-header">RogueDex Bottom Panel</div>
            ${weatherHtml}
            ${luckHtml}
        </div>
    `    
    bottomPanelElement.insertAdjacentHTML("afterbegin", html);
    return
}

function deleteAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    element.innerHTML = '';
}

function deleteWrapperDivs() {
    try {
        console.log("DELETE CALLED")
        let enemies = document.getElementById("enemies");
        console.log(enemies);
        deleteAllChildren(enemies);
        let allies = document.getElementById("allies");
        deleteAllChildren(allies);
    } catch (e) {
        console.error(e)
    }
}

function clearSidebar() {
    try {
        console.log("DELETE CALLED [for sidebar]")
        let enemies = document.getElementById("sidebar-enemies-box");
        let allies = document.getElementById("sidebar-allies-box");
        //console.log(enemies);
        //console.log(allies);
        deleteAllChildren(enemies);
        deleteAllChildren(allies);
    } catch (e) {
        console.error(e)
    }
}

async function scaleElements() {
    const data = await browserApi.storage.sync.get('scaleFactor');
    const scaleFactorMulti = data.scaleFactor || 1;
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactor_width = currentWidth / baseWidth;
    const scaleFactor_height = currentHeight / baseHeight;
    let scaleFactor = scaleFactor_width < scaleFactor_height ? scaleFactor_width : scaleFactor_height;
    const enemiesDiv = document.getElementById('enemies');
    const alliesDiv = document.getElementById('allies');
    enemiesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
    alliesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
}

/* should probably refactor this and combine it with the scaleElements() function */
async function scaleSidebarElements() {
    const data = await browserApi.storage.sync.get('sidebarScaleFactor');
    const scaleFactorMulti = data.sidebarScaleFactor || 1;
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactor_width = currentWidth / baseWidth;
    const scaleFactor_height = currentHeight / baseHeight;
    let scaleFactor = scaleFactor_width < scaleFactor_height ? scaleFactor_width : scaleFactor_height;
    const sidebarDiv = document.getElementById('roguedex-sidebar');
    sidebarDiv.style.fontSize = `${12 * scaleFactor * scaleFactorMulti}px`;
}

async function toggleSidebar() {
    const data = await browserApi.storage.sync.get('showSidebar')
    const sidebarToggleState = data.showSidebar
    let sidebarElement = document.getElementById('roguedex-sidebar')
    let bottomPanelElement = document.getElementById('roguedex-bottom-panel')
    let gameAppElement = document.getElementById('app')
    let runningStatusElement = document.getElementsByClassName('running-status')[0]
    let enemyCardDiv = document.getElementById('enemies')
    let allyCardDiv = document.getElementById('allies')

    if (sidebarToggleState === true) {
        sidebarElement.classList.remove('hidden')
        sidebarElement.classList.add('active')
        gameAppElement.classList.add('sidebar-active')
        runningStatusElement.classList.add('sidebar-active')
        bottomPanelElement.classList.add('sidebar-active')

        allyCardDiv.classList.add('hidden')
        enemyCardDiv.classList.add('hidden')
        console.log("SIDEBAR toggled ON, #enemies and #allies DOM elements (pokemon cards) have been hidden via css classes.")
    } else if (sidebarToggleState === false) {
        sidebarElement.classList.remove('active')
        sidebarElement.classList.add('hidden')
        gameAppElement.classList.remove('sidebar-active')
        runningStatusElement.classList.remove('sidebar-active')
        bottomPanelElement.classList.remove('sidebar-active')

        allyCardDiv.classList.remove('hidden')
        enemyCardDiv.classList.remove('hidden')
        console.log("SIDEBAR toggled OFF, #enemies and #allies DOM elements (pokemon cards) have been shown again via css classes.")
    }
}

async function changeSidebarPosition() {
    const data = await browserApi.storage.sync.get('sidebarPosition')
    const sidebarPosition = data.sidebarPosition
    let sidebarParentElement = document.body
    let bottomPanelElement = document.getElementById('roguedex-bottom-panel')

    sidebarParentElement.classList.remove('sidebar-Left', 'sidebar-Right', 'sidebar-Top', 'sidebar-Bottom')
    sidebarParentElement.classList.add(`sidebar-${sidebarPosition}`)
    bottomPanelElement.classList.remove('sidebar-Right', 'sidebar-Left')
    bottomPanelElement.classList.add(`sidebar-${sidebarPosition}`)
}

async function toggleSidebarPartyDisplay(partyID, state) {
    let sidebarPartyElement = document.getElementById(`sidebar-${partyID}-box`)
    if (state) {
        sidebarPartyElement.classList.add('visible')
        sidebarPartyElement.classList.remove('hidden')
    } else {
        sidebarPartyElement.classList.remove('visible')
        sidebarPartyElement.classList.add('hidden')
    }
}

async function initCreation(sessionData) {
    deleteWrapperDivs();
    //clearSidebar();
    let extensionSettings = await Utils.LocalStorage.getExtensionSettings()
    if (extensionSettings.showEnemies) {
        await dataMapping("enemyParty", "enemies", sessionData);
    }
    if (extensionSettings.showParty) {
        await dataMapping("party", "allies", sessionData);
    }
    if (extensionSettings.showSidebar) {
        await toggleSidebar(sessionData);
        await changeSidebarPosition(sessionData);
    }
}

async function dataMapping(pokemonLocation, divId, sessionData) {
    await Utils.PokeMapper.getPokemonArray(sessionData[pokemonLocation], sessionData.arena).then(async (pokemonData) => {
        weather = pokemonData.hasOwnProperty('weather') ? pokemonData.weather : null;
        partySize[divId] = pokemonData.pokemon.length;
        let pIndex = determinePage(divId, pokemonData.pokemon);
        await createCardsDiv(divId, pokemonData.pokemon, pIndex).then(() => {
            scaleElements();
        });
        await updateSidebarCards(divId, sessionData, pokemonData);
        observeGameCanvasResize();
    });
}

function determinePage(divId, pokemon) {
    if (pages[divId] >= pokemon.length) {
        pages[divId] = pokemon.length - 1;
        return pages[divId];
    } else {
        return pages[divId];
    }
}

function extensionSettingsListener() {
    browserApi.storage.onChanged.addListener(async function (changes, namespace) {
        for (let [key, values = {oldValue, newValue}] of Object.entries(changes)) {
            if (key === 'showMinified') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
            }
            if (key === 'scaleFactor') {
                await scaleElements();
            }
            if (key === 'showEnemies') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
                await toggleSidebarPartyDisplay('enemies', values.newValue);
            }
            if (key === 'showParty') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
                await toggleSidebarPartyDisplay('allies', values.newValue);
            }
            if (key === 'showSidebar') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await toggleSidebar(sessionData);
            }
            if (key === 'sidebarPosition') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await changeSidebarPosition(sessionData);
            }
            if (key === 'sidebarScaleFactor') {
                await scaleSidebarElements();
            }
        }
    });
}


// function touchControlListener() {
//     const touchControlsElement = document.getElementById('touchControls');
//     console.log("Touch control listener called");
//     if (touchControlsElement) {
//         const observer = new MutationObserver((mutations) => {
//             mutations.forEach(async (mutation) => {
//                 if (mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode') {
//                     const newValue = touchControlsElement.getAttribute('data-ui-mode');
//                     console.log('New data-ui-mode:', newValue);
//                     if (newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
//                         Utils.LocalStorage.setSessionData();
//                         let sessionData = Utils.LocalStorage.getSessionData();
//                         await initCreation(sessionData);
//                     }
//                     if (newValue === "SAVE_SLOT") {
//                         Utils.LocalStorage.clearAllSessionData();
//                     }
//                     if (newValue === "SAVE_SLOT" || newValue === "TITLE" || newValue === "MODIFIER_SELECT" || newValue === "STARTER_SELECT") {
//                         deleteWrapperDivs()
//                     }
//                 }
//             });
//         });
//
//         window.addEventListener('resize', scaleElements);
//         observer.observe(touchControlsElement, {attributes: true});
//     }
// }

function listenForDataUiModeChange() {
    function observeTouchControls() {
        const touchControlsElement = document.getElementById('touchControls');
        if (touchControlsElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode') {
                        const newValue = touchControlsElement.getAttribute('data-ui-mode');
                        console.log('New value:', newValue);

                        // Existing logic for handling data-ui-mode changes
                        if (newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
                            try {
                                Utils.LocalStorage.setSessionData();
                                let sessionData = Utils.LocalStorage.getSessionData();
                                await initCreation(sessionData);
                            } catch (err) {
                                console.error(err)
                            }
                        }
                        if (newValue === "SAVE_SLOT") {
                            Utils.LocalStorage.clearAllSessionData();
                        }
                        if (newValue === "SAVE_SLOT" || newValue === "TITLE" || newValue === "MODIFIER_SELECT" || newValue === "STARTER_SELECT") {
                            deleteWrapperDivs()
                            //clearSidebar()
                        }
                    }
                });
            });

            observer.observe(touchControlsElement, {attributes: true});
            console.log('Touch control listener called');
        } else {
            console.error('Element with ID "touchControls" not found.');
            // Retry after a short delay if the element might be added later
            setTimeout(observeTouchControls, 1000);
        }
    }

    observeTouchControls();
}

listenForDataUiModeChange();

function observeGameCanvasResize() {
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            //console.log(entry)
            resizeUIBottomPanel(entry.contentRect.right, entry.contentRect.width, entry.contentRect.height)
        }
        //console.log("Size changed");
    });

    resizeObserver.observe(document.getElementById('app').getElementsByTagName('canvas')[0]);
}

function resizeUIBottomPanel(right, width, height) {

    let panel = document.getElementById('roguedex-bottom-panel')
    //const gameApp = document.getElementById('app')
    const sidePanel = document.getElementById('roguedex-sidebar')

    if (typeof panel === "undefined") {
        return
    } else {
        //const gameAppPos = gameApp.getBoundingClientRect();
        const sidebarPos = sidePanel.getBoundingClientRect();

        let pageWidth = window.innerWidth;
        let pageHeight = window.innerHeight;
        /* bottom panel should take up the height that is leftover from the game apps canvas */
        panel.style['max-height'] = `${pageHeight - Math.round(height)}px`;

        /*  
            bottom panel should fill out the entire leftover horizontal space,
            and should therefore be "anchored" to the sidebar.
        */
        panel.style['max-width'] = `${pageWidth - sidebarPos.width}px`;
    }
}