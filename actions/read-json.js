'use strict';

module.exports = function (path, defaults) {
  if (this.exists(path)) {
    return JSON.parse(this.read(path));
  } else {
    return defaults;
  }
};
