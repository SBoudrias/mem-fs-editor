'use strict';

var assert = require('assert');

module.exports = function (path, options) {
  options = options || { raw: false };
  var file = this.store.get(path);

  assert(file.contents !== null && file.state !== 'deleted', path + ' doesn\'t exist');

  return options.raw ? file.contents : file.contents.toString();
};
