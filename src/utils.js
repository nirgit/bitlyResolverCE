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

const Utils = {
  debounce: debounce
};

export default Utils;
