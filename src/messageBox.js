'use strict';

function getStatusMessageCSS() {
    return {
        'background': '#ffffff',
        'border': '1px solid #000000',
        'border-radius': '5px',
        'padding': '10px',
        'position': 'fixed',
        'opacity': 0,
        'transition': '.3s ease all',
        'box-shadow': '5px 5px 8px #2b799c',
        'max-width': '400px',
        'overflow-wrap': 'break-word',
        'z-index': 999999,
        'pointer-events': 'none',
        'font-weight': 'lighter'
    };
}

function createStatusMessage() {
    var statusDiv = document.createElement('div');
    statusDiv.id = 'bitlyResolverBox-' + Date.now().toString(36);
    statusDiv.innerHTML = '';
    $(statusDiv).css(getStatusMessageCSS());
    return statusDiv;
}

module.exports = {
    create: createStatusMessage
};
