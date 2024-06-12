/**
 * @fileoverview Represents a utility class for drawing Pokémon icons onto canvases.
 *      This class handles the fetching and caching of Pokémon images.
 * @file 'src/content/util_classes/pokemonIconDrawer.utils.js'
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

        /**
         * Loads an image from a data URL (blob converted to data URL).
         * @param {HTMLImageElement} image - The image element to load the data URL into.
         * @param {string} blobUrl - The blob URL of the image.
         * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image.
         */
        const loadImageFromBlobUrl_ = (image, blobUrl) => new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = blobUrl;
        });
        const loadImageFromBlobUrl = (imgElement, dataUrl) => {
            return new Promise((resolve, reject) => {
                imgElement.onload = () => resolve();
                imgElement.onerror = () => reject(new Error('Failed to load image from Blob URL'));
                imgElement.src = dataUrl;
            });
        };

        /**
         * Draws fallback text on the canvas if the image cannot be loaded.
         */
        const drawFallbackText = () => {
            canvas.parentElement.insertAdjacentHTML("beforeend", `<span class="canvas-fallback-text">${pokemon.name}</span>`);
        };

        /**
         * Draws an image on the canvas.
         * @param {HTMLImageElement} image - The image to be drawn.
         * @param {number} startX - The x-coordinate of the top-left corner of the source rectangle.
         * @param {number} startY - The y-coordinate of the top-left corner of the source rectangle.
         * @param {number} sourceWidth - The width of the source rectangle.
         * @param {number} sourceHeight - The height of the source rectangle.
         * @param {number} destX - The x-coordinate of the top-left corner of the destination rectangle.
         * @param {number} destY - The y-coordinate of the top-left corner of the destination rectangle.
         * @param {number} destWidth - The width of the destination rectangle.
         * @param {number} destHeight - The height of the destination rectangle.
         */
        const drawImage = (image, startX, startY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight) => {
            ctx.drawImage(image, startX, startY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        };

        /**
         * Draws a single image on the canvas.
         * @param {HTMLImageElement} image - The image to be drawn.
         */
        const drawSingleImage = (image) => {
            const width = image.width;
            const height = image.height;
            const parentHeight = parent.clientHeight;
            const canvasWidth = parentHeight * (width / height);

            canvas.width = canvasWidth;
            canvas.height = parentHeight;

            drawImage(image, 0, 0, width, height, 0, 0, canvasWidth, parentHeight);
        };

         /**
         * Draws two combined images on the canvas.
         * @param {HTMLImageElement} image1 - The first image to be drawn.
         * @param {HTMLImageElement} image2 - The second image to be drawn.
         */
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

        /**
         * Fetches an image from a URL and caches it.
         * @param {string} url - The URL of the image to be fetched.
         * @param {string} cacheKey - The key to use for caching the image.
         * @returns {Promise<Object>} A promise that resolves with the success status and data URL of the fetched image.
         */
        const fetchImageAndCache = (url, cacheKey) => {
            return new Promise((resolve) => {
                const message = { action: "fetchImage", url };
        
                const handleResponse = (response) => {
                    if (response.success) {
                        const blobUrl = response.dataUrl;
                        this.imageCache[cacheKey] = blobUrl;
                        window.Utils.LocalStorage.saveImageToCache(cacheKey, blobUrl);
                        resolve({ success: true, dataUrl: blobUrl });
                    } else {
                        const errMsg = `Function: "fetchImageAndCache()". Failed to fetch image from ${url}. Error: ${response.errorMessage || 'Unknown error'}`;
                        resolve({ success: false, error: response.error, errorMessage: errMsg });
                    }
                };
        
                if (typeof browser !== 'undefined') { // Firefox environment (uses promises)
                    browser.runtime.sendMessage(message)
                        .then(handleResponse)
                        .catch(error => {
                            const errMsg = `Function: "fetchImageAndCache()". Failed to fetch image from ${url}. Error: ${error.message || 'Unknown error'}`;
                            resolve({ success: false, error: error, errorMessage: errMsg });
                        });
                } else { // Chrome environment (uses callbacks)
                    chrome.runtime.sendMessage(message, handleResponse);
                }
            });
        };
        
        /**
         * Fetches the HTML for a fusion image.
         * @returns {Promise<Object>} A promise that resolves with the success status and data URL of the fetched fusion image.
         */
        const fetchFusionImage = () => {
            return new Promise((resolve, reject) => {
                const message = { action: "fetchFusionImageHtml" };
        
                const handleResponse = (response) => {
                    if (response.success) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.html, 'text/html');
                        const figure = doc.querySelector('figure.sprite.sprite-variant-main');
                        if (figure) {
                            const img = figure.querySelector('img');
                            if (img) {
                                const imageMessage = { action: "fetchImage", url: img.src };
                                
                                const handleImageResponse = (imageResponse) => {
                                    if (imageResponse.success) {
                                        resolve({ success: true, dataUrl: imageResponse.dataUrl });
                                    } else {
                                        reject(imageResponse.error);
                                    }
                                };
        
                                if (typeof browser !== 'undefined') { // Firefox environment (uses promises)
                                    browser.runtime.sendMessage(imageMessage)
                                        .then(handleImageResponse)
                                        .catch(error => reject(error));
                                } else { // Chrome environment (uses callbacks)
                                    chrome.runtime.sendMessage(imageMessage, handleImageResponse);
                                }
                                return;
                            }
                        }
                    }
                    resolve({ success: false });
                };
        
                if (typeof browser !== 'undefined') { // Firefox environment (uses promises)
                    browser.runtime.sendMessage(message)
                        .then(handleResponse)
                        .catch(error => resolve({ success: false, error: error }));
                } else { // Chrome environment (uses callbacks)
                    chrome.runtime.sendMessage(message, handleResponse);
                }
            });
        };

        const cachedImage = this.imageCache[cacheKey] || window.Utils.LocalStorage.getImageFromCache(cacheKey);

        /**
         * Fetches separate images for a fusion Pokémon and combines them.
         */        
        const fallbackToSeparateImages = async () => {
            try {
                // Fetch images concurrently
                const [image1Response, image2Response] = await Promise.all([
                    fetchImageAndCache(`${pokemon.sprite}`, `${pokemon.name}-1`),
                    fetchImageAndCache(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.fusionId}.png`, `${pokemon.name}-2`)
                ]);
        
                // Check if both images are fetched successfully
                if (!image1Response.dataUrl || !image2Response.dataUrl) {
                    throw new Error('Failed to fetch one or both images.');
                }
        
                // Load images from blob URLs with cross-origin handling
                const image1 = new Image();
                const image2 = new Image();
        
                // Set crossOrigin attribute to handle cross-origin images
                image1.crossOrigin = "anonymous";
                image2.crossOrigin = "anonymous";
        
                await Promise.all([
                    loadImageFromBlobUrl(image1, image1Response.dataUrl),
                    loadImageFromBlobUrl(image2, image2Response.dataUrl)
                ]);
        
                // Ensure images are fully loaded before drawing
                if (!image1.complete || !image2.complete) {
                    throw new Error('One or both images failed to load completely.');
                }
        
                // Draw the combined images on the canvas
                drawCombinedImages(image1, image2);
        
                // Cache the combined image
                cacheCombinedImage(canvas, cacheKey);
            } catch (error) {
                if (error.message.includes('The operation is insecure')) {
                    console.warn('Harmless error in fallbackToSeparateImages():', error.message);
                }
                else if (error.message.includes('CanvasRenderingContext2D.drawImage: Passed-in canvas is empty')) {
                    console.debug('Non-critical error in fallbackToSeparateImages():', error.message);
                } else {
                    console.error('Error in fallbackToSeparateImages:', error.message);
                }
            }
        };

        /**
         * Caches a combined image.
         * @param {HTMLCanvasElement} canvas - The canvas containing the combined image.
         * @param {string} cacheKey - The key to use for caching the combined image.
         */
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
