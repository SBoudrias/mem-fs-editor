'use strict';

var assert = require('assert');
var _ = require('lodash');
var glob = require('glob');
var util = require('../util/util');

function deleteFile(path, store) {
  var file = store.get(path);
  file.state = 'deleted';
  file.contents = new Buffer('');
  store.add(file);
}

module.exports = function (path, options) {
  path = util.globify(path);
  options = options || { globOptions : {} };

  var globOptions = _.extend(options.globOptions, { sync: true });
  var g = new glob.Glob(path, globOptions);
  var files = g.found;
  files.forEach(function (file) {
    deleteFile(file, this.store);
  }.bind(this));

  this.store.each(function (file) {
    if (g.minimatch.match(file.path)) {
      deleteFile(file.path, this.store);
    }
  }.bind(this));
};
