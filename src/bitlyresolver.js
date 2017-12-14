'use strict';

import constants from './constants';
import utils from './utils';
import messageBox from './messageBox';

const END_POINT = 'https://bitlyresolver.herokuapp.com/resolve?url=';

var URL_FORMAT = {
  BITLY: 'bit.ly',
  GOOGL: 'goo.gl',
  OWLY: 'ow.ly'
};

var nodeNamesToIgnore = constants.NODE_TAGS_TO_IGNORE;

var MAX_SIZE_BEFORE_CLEANUP = constants.CACHE_SIZE;
var linksCache = {};

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

  $(document).mousemove(utils.debounce(handleMouseMove, 100));
}

function handleMouseMove(mouseEvent) {
  if (mouseEvent && isDomElementWithoutChildren(mouseEvent.target)) {
    var content = mouseEvent.target.innerText;
    var linkToCheck = getLinkToCheck(content);
    if (shouldCheckDOMNode(mouseEvent.target) && linkToCheck) {
      setBubblePosition(mouseEvent.clientX, mouseEvent.clientY);
      if (linksCache[content]) {
        updateBubble(linksCache[content], mouseEvent.target);
      } else {
        resolveURLOnServer(content, linkToCheck, mouseEvent);
      }
      return;
    }
  }
  hideStatus(statusDiv, false, mouseEvent);
}

function resolveURLOnServer(content, linkToCheck, mouseEvent) {
  linksCache[content] = {status: 0, resolvedUrl: 'Resolving link...'};
  lastAjax = Date.now();
  $.get(linkToCheck).then(function(res) {
    linksCache[content] = res;
    updateBubble(linksCache[content], mouseEvent.target);
  }).fail(function() {
    linksCache[content] = {status: 0, resolvedUrl: 'Could not resolve link'};
  });
}

function isDomElementWithoutChildren(element) {
  return element && element.children.length === 0;
}

function getLinkToCheck(content) {
  content = content || '';
  if (_.isEmpty(content) || _.size(content) < 4) {
    return null;
  }
  for (var sName in URL_FORMAT) {
    var shortener = URL_FORMAT[sName];
    if (content.indexOf(shortener) >= 0) {
      return END_POINT + content;
    }
  }
  return null;
}

function shouldCheckDOMNode(node) {
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
  if (_.size(linksCache) > MAX_SIZE_BEFORE_CLEANUP) {
    linksCache = {};
  }
}

init();

export default {};
