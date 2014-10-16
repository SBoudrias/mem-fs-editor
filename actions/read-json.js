'use strict';

module.exports = function (path) {
  return JSON.parse(this.read(path));
};
