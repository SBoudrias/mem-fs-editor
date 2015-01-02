'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');
var File = require('vinyl');
var util = require('../util/util');

function applyProcessingFunc(process, contents) {
  var output = process(contents);
  return output instanceof Buffer ? output : new Buffer(output);
}

exports.copy = function(from, to, options) {
  from = util.globify(from);
  to = path.resolve(to);
  options = options || { globOptions : {} };

  if (!glob.hasMagic(from)) {
    return this._copySingle(from, to, options);
  }

  assert(
    !this.exists(to) || fs.statSync(to).isDirectory(),
    'When copying with glob patterns, provide a directory as destination'
  );

  var globOptions = _.extend(options.globOptions, { nodir: true });
  var files = glob.sync(from, globOptions);
  var root = util.getCommonPath(from);

  files.forEach(function (file) {
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
