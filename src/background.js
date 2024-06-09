const browserApi = (() => {
    if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined" && typeof browser.runtime.getURL === "function") {
        return browser; // Firefox or compatible
    } else if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.runtime.getURL === "function") {
        return chrome; // Chrome or compatible
    } else {
        console.error("Browser API not found or unsupported browser"); // Unsupported browser or environment
        return null;
    }
})();

if (browserApi) {
    browserApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "fetchFusionImageHtml") {
            const { fusionId, pokemonId } = request;

            fetch(`https://if.daena.me/find/?head=${fusionId}&body=${pokemonId}`)
                .then(response => response.text())
                .then(html => {
                    sendResponse({ success: true, html });
                })
                .catch(error => {
                    console.error('Error fetching fusion image HTML:', error);
                    sendResponse({ success: false, error });
                });

            return true; // Will respond asynchronously
        } else if (request.action === "showOptions") {
            browserApi.windows.create({ 
                url: browserApi.runtime.getURL("options/options.html"), 
                type: "popup", 
                height: 800,
                width: 710 
            });
        } else if (request.action === "fetchImage") {
            fetch(request.url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok. Status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        sendResponse({ success: true, dataUrl: reader.result });
                    };
                    reader.onerror = () => {
                        sendResponse({ success: false, error: 'Failed to read blob' });
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('Error fetching image:', error);
                    sendResponse({ success: false, error: error.message || 'Unknown fetch error' });
                });

            return true; // Will respond asynchronously
        }
    });
}