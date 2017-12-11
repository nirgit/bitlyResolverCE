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

module.exports = {
    debounce: debounce
};
