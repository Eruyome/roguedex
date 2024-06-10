/**
 * @fileoverview
 * This script intercepts XMLHttpRequests to enable reading web request responses' body, which cannot be directly accessed in background.js.
 * It sends a message to background.js with the response data, where it can be processed and sent back to the content.js script.
 * @file 'src/injected.js'
 */

/**
 * Intercepts XMLHttpRequests to capture request details.
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest object.
 */
(function (xhr) {
    const xhrPrototype = xhr.prototype;

    const originalOpen = xhrPrototype.open;
    const originalSend = xhrPrototype.send;

    /**
     * Overrides the open method of XMLHttpRequest to capture the request method and URL.
     * @param {string} method - The request method.
     * @param {string} url - The request URL.
     */
    xhrPrototype.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    /**
     * Overrides the send method of XMLHttpRequest to capture the response.
     * @param {*} postData - The data to send with the request.
     */
    xhrPrototype.send = function (postData) {   // eslint-disable-line no-unused-vars
        // Uncomment if you need to log the request details
        // console.log('Injected script XHR request:', this._method, this._url, this.getAllResponseHeaders(), postData);
        this.addEventListener('load', function () {
            // Uncomment if you need to send the response to content script
            // window.postMessage({ type: 'xhr', data: this.response }, '*');
        });
        return originalSend.apply(this, arguments);
    };
})(XMLHttpRequest);
