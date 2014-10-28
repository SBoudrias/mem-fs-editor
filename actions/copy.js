'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var File = require('vinyl');
var util = require('../util/util');

function applyProcessingFunc(process, contents) {
  var output = process(contents);
  return output instanceof Buffer ? output : new Buffer(output);
}

function isFile(filepath) {
  return fs.existsSync(filepath) && fs.statSync(filepath).isFile();
};

exports.copy = function (from, to, options) {
  to = path.resolve(to);
  if (from.indexOf('*') === -1) {
    return this._copySingle(from, to, options)
  }

  assert(
    path.extname(to) === '',
    'When copying with glob patterns, provide a directory as destination'
  );

  var files = glob.sync(from).filter(isFile);
  var root = util.getCommonPath(files);

  files.forEach(function (file, index) {
    var toFile = path.relative(root, file);
    toFile = path.join(to, toFile);
    this._copySingle(file, toFile, options);
  }, this);
};

exports._copySingle = function (from, to, options) {
  options = options || {};
  var file = this.store.get(from);

  var newFile = file.clone();
  newFile.cwd = process.cwd();
  newFile.base = path.basename(to);
  newFile.path = to;
  newFile.state = 'modified';

  if (options.process) {
    newFile.contents = applyProcessingFunc(options.process, file.contents);
  }

  this.store.add(newFile);
};
