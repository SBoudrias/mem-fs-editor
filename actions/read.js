'use strict';

var assert = require('assert');

module.exports = function (path) {
  var file = this.store.get(path);

  assert(file.state !== 'unexistent', path + ' doesn\'t exist');

  return file.contents.toString();
};
