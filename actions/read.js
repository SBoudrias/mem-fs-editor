'use strict';

var assert = require('assert');

module.exports = function (path) {
  var file = this.store.get(path);

  assert(['unexistent', 'deleted'].indexOf(file.state) === -1, path + ' doesn\'t exist');

  return file.contents.toString();
};
