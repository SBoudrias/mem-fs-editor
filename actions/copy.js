'use strict';

var path = require('path');
var File = require('vinyl');

module.exports = function (from, to, options) {
  options = options || {};
  var contents = this.read(from);
  var fullToPath = path.resolve(to);
  var newFile = new File({
    cwd: process.cwd(),
    base: path.basename(fullToPath),
    path: fullToPath,
    contents: new Buffer(options.process ? options.process(contents) : contents)
  });

  this.store.add(newFile);
};
