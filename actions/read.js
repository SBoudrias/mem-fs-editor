'use strict';

var assert = require('assert');

module.exports = function (path, options) {
  options = options || { raw: false };
  var file = this.store.get(path);

  if (file.state === 'deleted' || file.contents === null) {
    file.contents = options.defaults ? new Buffer(options.defaults) : null;
  }

  assert(file.contents !== null, path + ' doesn\'t exist');

  return options.raw ? file.contents : file.contents.toString();
};
