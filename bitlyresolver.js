'use strict';

var statusDiv = null;
var lastMove = 0;

var END_POINT = 'https://bitlyresolver.herokuapp.com/resolveBitly?url=';

var nodeNamesToIgnore = {
  'html': 'html',
  'body': 'body',
  'video': 'video',
  'audio': 'audio',
  'object': 'object',
  'script': 'script',
  'form': 'form',
  'iframe': 'iframe',
  'img': 'img'
};

var lastBitlyLinks = {};
var lastAjax = 0;

function init() {
  statusDiv = createStatusMessage();
  document.body.appendChild(statusDiv);

  bindListeners();
};

function bindListeners() {
  $(statusDiv).on('click', function() {
    hideStatus();
  });

  document.addEventListener('mousemove', function(mouseEvent) {
    if (Date.now() - lastAjax < 100) {
      return;
    }
    if (mouseEvent && mouseEvent.target && mouseEvent.target.children.length === 0) {
      var content = mouseEvent.target.innerText;
      var linkToCheck = getLinkToCheck(content);
      if (shouldCheckNode(mouseEvent.target) && linkToCheck) {
        setBubblePosition(mouseEvent.clientX, mouseEvent.clientY);
        if (lastBitlyLinks[content]) {
          updateStatus(lastBitlyLinks[content]);
        } else {
          lastAjax = Date.now();
          $.get(END_POINT + linkToCheck).then(function(res) {
            lastBitlyLinks[content] = res;
            updateStatus(lastBitlyLinks[content]);
          });
        }
      } else {
        hideStatus();
      }
    } else {
      hideStatus();
    }
  });
}

function getLinkToCheck(content) {
  var index = content.indexOf('http://bit.ly');
  if (index < 0) {
    index = content.indexOf('https://bit.ly')
  }
  if (index < 0) {
    index = content.indexOf('bit.ly');
  }
  if (index < 0) {
    return null;
  }
  return content.substr(index);
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

function updateStatus(result) {
  if (result.status === '200') {
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
}

function hideStatus() {
  statusDiv.style.opacity = 0;
}

function createStatusMessage() {
  var statusDiv = document.createElement('div');
  statusDiv.innerHTML = '';
  $(statusDiv).css({
    'background': 'white',
    'border': '1px solid black',
    'padding': '5px',
    'position': 'fixed',
    'opacity': 0,
    'transition': '.3s ease all',
    'box-shadow': '5px 5px 5px #8ec78e',
    'max-width': '500px',
    'overflow-wrap': 'break-word';
    'z-index': 999999,
    'pointer-events': 'none'
  });
  return statusDiv;
}

init();
