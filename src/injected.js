// This is a hack because in background.js we cannot read web request response's body.
// When we need to do that, we intercept the web request here, and send a message to background.js with the response data, elaborate there and send back to content.js
(function (xhr) {
    const xhrPrototype = xhr.prototype;

    const originalOpen = xhrPrototype.open;
    const originalSend = xhrPrototype.send;

    xhrPrototype.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

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
