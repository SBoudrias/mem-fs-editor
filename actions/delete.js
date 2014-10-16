'use strict';

var assert = require('assert');

module.exports = function (path) {
  var file = this.store.get(path);
  file.state = 'deleted';
  file.contents = new Buffer('');
};
