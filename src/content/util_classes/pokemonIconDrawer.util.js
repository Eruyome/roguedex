/**
 * Represents a utility class for drawing Pokémon icons onto canvases.
 * This class handles the fetching and caching of Pokémon images.
 * @class PokemonIconDrawer
 */

class PokemonIconDrawer {
    /**
     * Creates an instance of PokemonIconDrawer. 
     * If an instance already exists, returns the existing instance.
     */
    constructor() {
        if (!PokemonIconDrawer.instance) {
            this.imageCache = {};
            this.timers = new Set();
            this.DISABLE_FUN_FUSION = true;
            PokemonIconDrawer.instance = this;
        }
        return PokemonIconDrawer.instance;
    }

    /**
     * Returns the singleton instance of PokemonIconDrawer.
     * If an instance doesn't exist, creates a new one.
     * @returns {PokemonIconDrawer} The singleton instance of PokemonIconDrawer.
     */
    static getInstance() {
        if (!PokemonIconDrawer.instance) {
            PokemonIconDrawer.instance = new PokemonIconDrawer();
        }
        return PokemonIconDrawer.instance;
    }

    /**
     * Retrieves and draws the icon of a Pokémon onto a canvas.
     * If the icon is already cached, uses the cached version.
     * @param {Object} pokemon - The Pokémon object containing information about the Pokémon.
     * @param {string} divId - The ID of the canvas element where the Pokémon icon will be drawn.
     * @returns {Promise<void>} A Promise that resolves once the icon is drawn onto the canvas.
     */
    async getPokemonIcon(pokemon, divId) {
        const cacheKey = pokemon.fusionId ? `${pokemon.name}-${pokemon.fusionId}` : pokemon.name;

        if (!this.timers.has(cacheKey)) {
            // console.time(`getPokemonIcon_${cacheKey}`);
            this.timers.add(cacheKey);
        }

        const canvas = document.getElementById(`pokemon-icon_${divId}`);
        if (!canvas) {
            console.error(`Canvas element with ID pokemon-icon_${divId} not found.`);
            return;
        }

        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;

        const image1 = new Image();
        const image2 = new Image();
        const fusionImage = new Image();

        const loadImageFromBlobUrl = (image, blobUrl) => new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = blobUrl;
        });

        const drawFallbackText = () => {
            canvas.parentElement.insertAdjacentHTML("beforeend", `<span class="canvas-fallback-text">${pokemon.name}</span>`);
        };

        const drawImage = (image, startX, startY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight) => {
            ctx.drawImage(image, startX, startY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        };

        const drawSingleImage = (image) => {
            const width = image.width;
            const height = image.height;
            const parentHeight = parent.clientHeight;
            const canvasWidth = parentHeight * (width / height);

            canvas.width = canvasWidth;
            canvas.height = parentHeight;

            drawImage(image, 0, 0, width, height, 0, 0, canvasWidth, parentHeight);
        };

        const drawCombinedImages = (image1, image2) => {
            const width = image1.width;
            const height = image1.height;
            const parentHeight = parent.clientHeight;
            const canvasWidth = parentHeight * (width / height);

            canvas.width = canvasWidth;
            canvas.height = parentHeight;

            drawImage(image1, 0, 0, width, height / 2, 0, 0, canvasWidth, parentHeight / 2);
            drawImage(image2, 0, height / 2, width, height / 2, 0, parentHeight / 2, canvasWidth, parentHeight / 2);
        };

        const fetchImageAndCache = (url, cacheKey) => new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "fetchImage", url }, response => {
                if (response.success) {
                    const blobUrl = response.dataUrl;
                    this.imageCache[cacheKey] = blobUrl;
                    window.Utils.LocalStorage.saveImageToCache(cacheKey, blobUrl);
                    resolve({ success: true, dataUrl: blobUrl });
                } else {
                    const errMsg = `Function: "fetchImageAndCache()". Failed to fetch image from ${url}. Error: ${response.errorMessage || 'Unknown error'}`;
                    resolve({ success: false, error: response.error, errorMessage: errMsg });
                }
            });
        });        

        const fetchFusionImage = () => new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "fetchFusionImageHtml"
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
                                    resolve({ success: true, dataUrl: imageResponse.dataUrl });
                                } else {
                                    reject(imageResponse.error);
                                }
                            });
                            return;
                        }
                    }
                }
                resolve({ success: false });
            });
        });

        const cachedImage = this.imageCache[cacheKey] || window.Utils.LocalStorage.getImageFromCache(cacheKey);

        const fallbackToSeparateImages = async () => {
            try {
                const [image1Response, image2Response] = await Promise.all([
                    fetchImageAndCache(`${pokemon.sprite}`, `${pokemon.name}-1`),
                    fetchImageAndCache(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.fusionId}.png`, `${pokemon.name}-2`)
                ]);   
                await Promise.all([loadImageFromBlobUrl(image1, image1Response.dataUrl), loadImageFromBlobUrl(image2, image2Response.dataUrl)]);
                drawCombinedImages(image1, image2);
                cacheCombinedImage(canvas, cacheKey);
            } catch (error) {
                console.error(error);
            }
        };

        const cacheCombinedImage = (canvas, cacheKey) => {
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.width = canvas.width;
            combinedCanvas.height = canvas.height;
            const combinedCtx = combinedCanvas.getContext('2d');
            combinedCtx.drawImage(canvas, 0, 0);
            const combinedDataUrl = combinedCanvas.toDataURL();

            this.imageCache[cacheKey] = combinedDataUrl;
            window.Utils.LocalStorage.saveImageToCache(cacheKey, combinedDataUrl);
        };

        if (cachedImage) {
            try {
                const blobUrl = cachedImage;
                await loadImageFromBlobUrl(image1, blobUrl);
                if (pokemon.fusionId) {
                    await loadImageFromBlobUrl(image2, blobUrl);
                    drawCombinedImages(image1, image2);
                } else {
                    drawSingleImage(image1);
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            try {
                if (pokemon.fusionId && !this.DISABLE_FUN_FUSION) {                
                    const response = await fetchFusionImage();
                    if (response.success) {
                        const blobUrl = response.dataUrl;
                        this.imageCache[cacheKey] = blobUrl;
                        window.Utils.LocalStorage.saveImageToCache(cacheKey, blobUrl);
                        await loadImageFromBlobUrl(fusionImage, blobUrl);
                        drawSingleImage(fusionImage);
                    } else {
                        await fallbackToSeparateImages();
                    }
                } else if (pokemon.fusionId) {
                    await fallbackToSeparateImages();
                } else {
                    const response = await fetchImageAndCache(`${pokemon.sprite}`, cacheKey);
                    if (response.success) {
                        await loadImageFromBlobUrl(image1, response.dataUrl);
                        drawSingleImage(image1);
                    } else {
                        console.error({"success" : response.success, "error-message" : response.errMsg, "error" : response.error});
                        drawFallbackText();
                    }
                }
            } catch (error) {
                console.error(error);
                drawFallbackText();
            }
        }

        if (this.timers.has(cacheKey)) {
            // console.timeEnd(`getPokemonIcon_${cacheKey}`);
            this.timers.delete(cacheKey);
        }
    }    
}
