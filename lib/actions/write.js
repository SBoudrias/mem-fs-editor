'use strict';

const assert = require('assert');
const {isFileStateModified, setModifiedFileState} = require('../state');

module.exports = function (filepath, contents, stat) {
  assert(
    typeof contents === 'string' || Buffer.isBuffer(contents),
    'Expected `contents` to be a String or a Buffer',
  );

  const file = this.store.get(filepath);
  const newContents = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (
    !isFileStateModified(file)
    || !Buffer.isBuffer(file.contents)
    || !newContents.equals(file.contents)
    || (stat !== undefined && file.stat !== stat)
  ) {
    setModifiedFileState(file);
    file.contents = newContents;
    file.stat = stat;
    this.store.add(file);
  }

  return file.contents.toString();
};
