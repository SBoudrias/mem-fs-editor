'use strict';

var path = require('path');
var File = require('vinyl');

function applyProcessingFunc(process, contents) {
  var output = process(contents);
  return output instanceof Buffer ? output : new Buffer(output);
}

module.exports = function (from, to, options) {
  options = options || {};
  var contents = this.read(from, { raw: true });
  if (options.process) {
    contents = applyProcessingFunc(options.process, contents);
  }
  var fullToPath = path.resolve(to);
  var newFile = new File({
    cwd: process.cwd(),
    base: path.basename(fullToPath),
    path: fullToPath,
    contents: contents
  });

  this.store.add(newFile);
};
