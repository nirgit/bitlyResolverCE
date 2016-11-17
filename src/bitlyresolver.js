'use strict';

var END_POINT = {
  BITLY: 'https://bitlyresolver.herokuapp.com/resolveBitly?url=',
  GOOGL: 'https://bitlyresolver.herokuapp.com/resolveGoogl?url='
};

var URL_FORMAT = {
  BITLY: 'bit.ly',
  GOOGL: 'goo.gl',
};

var nodeNamesToIgnore = {
  'html': 'html',
  'body': 'body',
  'video': 'video',
  'audio': 'audio',
  'object': 'object',
  'script': 'script',
  'form': 'form',
  'iframe': 'iframe',
  'img': 'img',
  'embed': 'embed',
  'canvas': 'canvas'
};

var MAX_SIZE_BEFORE_CLEANUP = 500;
var lastBitlyLinks = {};

var lastAjax = 0;
var statusDiv = null;

function init() {
  statusDiv = createStatusMessage();
  $(document.body).append(statusDiv);

  bindListeners(statusDiv);
};

function bindListeners(statusDiv) {
  $(statusDiv).on('click', function() {
    hideStatus(statusDiv);
  });

  $(document).mousemove(debounce(handleMouseMove, 100));
}

function handleMouseMove(mouseEvent) {
  if (mouseEvent && isDomElementWithoutChildren(mouseEvent.target)) {
    var content = mouseEvent.target.innerText;
    var linkToCheck = getLinkToCheck(content);
    if (shouldCheckNode(mouseEvent.target) && linkToCheck) {
      setBubblePosition(mouseEvent.clientX, mouseEvent.clientY);
      if (lastBitlyLinks[content]) {
        updateBubble(lastBitlyLinks[content]);
      } else {
        lastBitlyLinks[content] = {status: 0, resolvedUrl: 'Resolving link...'};
        lastAjax = Date.now();
        $.get(linkToCheck).then(function(res) {
          lastBitlyLinks[content] = res;
          updateBubble(lastBitlyLinks[content]);
        }).fail(function() {
          lastBitlyLinks[content] = {status: 0, resolvedUrl: 'Could not resolve link'};
        });
      }
    } else {
      hideStatus(statusDiv);
    }
  } else {
    hideStatus(statusDiv);
  }
}

function isDomElementWithoutChildren(element) {
  return element && element.children.length === 0;
}

function debounce(func, millis) {
  var last = Date.now();
  return function() {
    var now = Date.now();
    if (now - last > millis) {
      last = now;
      return func.apply(null, arguments);
    }
    return undefined;
  };
}

function getLinkToCheck(content) {
  content = content || '';
  if (content.indexOf(URL_FORMAT.BITLY) >= 0) {
    return getLinkToCheckByFormat(content, URL_FORMAT.BITLY, END_POINT.BITLY);
  }
  if (content.indexOf(URL_FORMAT.GOOGL) >= 0) {
    return getLinkToCheckByFormat(content, URL_FORMAT.GOOGL, END_POINT.GOOGL);
  }
  return null;
}

function getLinkToCheckByFormat(content, format, endpoint) {
  content = content || '';
  var index = content.indexOf('http://' + format);
  if (index < 0) {
    index = content.indexOf('https://' + format)
  }
  if (index < 0) {
    index = content.indexOf(format);
  }
  if (index < 0) {
    return null;
  }
  return endpoint + content.substr(index);
}

function shouldCheckNode(node) {
  var nodeName = (node || {}).nodeName;
  var nameAsLowerCase = (nodeName || '').toLowerCase();
  return !nodeNamesToIgnore[nameAsLowerCase];
}

function setBubblePosition(x, y) {
  if (y + 20 > document.documentElement.clientHeight) {
    y -= 20;
  }
  if (x + 150 > document.documentElement.clientWidth) {
    x-= 200;
  }
  statusDiv.style.top = y + 'px';
  statusDiv.style.left = x + 'px';
}

function updateBubble(result) {
  statusDiv.innerHTML = result.resolvedUrl;
  statusDiv.style.opacity = 1;
  var statusDivPos = $(statusDiv).position();
  var statusDivWidth = $(statusDiv).width();
  if (statusDivPos.left + statusDivWidth > document.documentElement.clientWidth) {
    statusDiv.style.right = 0;
    statusDiv.style.left = '';
  } else {
    statusDiv.style.right = '';
  }
}

function hideStatus(statusDiv) {
  if (statusDiv) {
    statusDiv.style.opacity = 0;
    cleanupCachedLinksIfExceededSize();
  }
}

function cleanupCachedLinksIfExceededSize() {
  if (_.size(lastBitlyLinks) > MAX_SIZE_BEFORE_CLEANUP) {
    lastBitlyLinks = {};
  }
}

function createStatusMessage() {
  var statusDiv = document.createElement('div');
  statusDiv.innerHTML = '';
  $(statusDiv).css({
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
  });
  return statusDiv;
}

init();
