'use strict';

var messageBox = require('messageBox');

var END_POINT = {
  BITLY: 'https://bitlyresolver.herokuapp.com/resolveBitly?url=',
  GOOGL: 'https://bitlyresolver.herokuapp.com/resolveGoogl?url=',
  OWLY: 'https://bitlyresolver.herokuapp.com/resolveOwly?url='
};

var URL_FORMAT = {
  BITLY: 'bit.ly',
  GOOGL: 'goo.gl',
  OWLY: 'ow.ly'
};

var SHORTENERS = {
  BITLY: {
    format: URL_FORMAT.BITLY,
    url: END_POINT.BITLY
  },
  GOOGL: {
    format: URL_FORMAT.GOOGL,
    url: END_POINT.GOOGL
  },
  OWLY: {
    format: URL_FORMAT.OWLY,
    url: END_POINT.OWLY
  }
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
var isBubbleShowing = false;
var lastBubblePosition = {x: 0, y: 0};
var bubbleShowTime = 0;

function init() {
  statusDiv = messageBox.create();
  $(document.body).append(statusDiv);

  bindListeners(statusDiv);
};

function bindListeners(statusDiv) {
  $(statusDiv).on('click', function() {
    hideStatus(statusDiv, true);
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
        updateBubble(lastBitlyLinks[content], mouseEvent.target);
      } else {
        lastBitlyLinks[content] = {status: 0, resolvedUrl: 'Resolving link...'};
        lastAjax = Date.now();
        $.get(linkToCheck).then(function(res) {
          lastBitlyLinks[content] = res;
          updateBubble(lastBitlyLinks[content], mouseEvent.target);
        }).fail(function() {
          lastBitlyLinks[content] = {status: 0, resolvedUrl: 'Could not resolve link'};
        });
      }
    } else {
      hideStatus(statusDiv, false, mouseEvent);
    }
  } else {
    hideStatus(statusDiv, false, mouseEvent);
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
  for (var sName in SHORTENERS) {
    var shortener = SHORTENERS[sName];
    if (content.indexOf(shortener.format) >= 0) {
      return getLinkToCheckByFormat(content, shortener.format, shortener.url);
    }
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
  lastBubblePosition = {x: x, y: y};
  if (y + 20 > document.documentElement.clientHeight) {
    y -= 20;
  }
  if (x + 150 > document.documentElement.clientWidth) {
    x-= 200;
  }
  statusDiv.style.top = y + 'px';
  statusDiv.style.left = x + 'px';
}

function updateBubble(result, domElement) {
  isBubbleShowing = true;
  bubbleShowTime = Date.now();
  var titleToKeep = domElement.getAttribute('title');
  domElement.setAttribute('title', '');
  domElement.setAttribute('data-xtitle', titleToKeep);
  statusDiv.domNodeWithLink = domElement;
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

function hideStatus(statusDiv, isForced, mouseEvent) {
  if (isForced || didMouseLeaveFastEnough(mouseEvent)) {
    bubbleShowTime = 0;
    isBubbleShowing = false;
    if (statusDiv) {
      statusDiv.style.opacity = 0;
      cleanupCachedLinksIfExceededSize();

      var domElement = statusDiv.domNodeWithLink;
      if (domElement) {
        var keptTitle = domElement.getAttribute('data-xtitle');
        domElement.setAttribute('title', keptTitle);
        domElement.removeAttribute('data-xtitle');
        statusDiv.domNodeWithLink = null;
      }
    }
  }
}

function didMouseLeaveFastEnough(mouseEvent) {
  var mouseX = mouseEvent.clientX;
  var mouseY = mouseEvent.clientY;
  var dist = Math.sqrt(Math.pow(lastBubblePosition.x - mouseX, 2) + Math.pow(lastBubblePosition.y - mouseY, 2));
  var time = Date.now() - bubbleShowTime;
  return (dist / time > 10) || dist > 70;
}

function cleanupCachedLinksIfExceededSize() {
  if (_.size(lastBitlyLinks) > MAX_SIZE_BEFORE_CLEANUP) {
    lastBitlyLinks = {};
  }
}

init();
