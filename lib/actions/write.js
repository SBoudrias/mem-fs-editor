'use strict';

var assert = require('assert');
var {setModifiedFileState} = require('../state');

module.exports = function (filepath, contents, stat) {
  assert(
    typeof contents === 'string' || Buffer.isBuffer(contents),
    'Expected `contents` to be a String or a Buffer'
  );

  var file = this.store.get(filepath);
  setModifiedFileState(file);
  file.contents = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  file.stat = stat;
  this.store.add(file);

  return file.contents.toString();
};
