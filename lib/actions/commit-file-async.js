'use strict';

var fs = require('fs').promises;
var path = require('path');
var {clearFileState, isFileStateModified, isFileStateDeleted, setCommittedFile} = require('../state');

async function write(file) {
  var dir = path.dirname(file.path);
  try {
    if (!(await fs.stat(dir)).isDirectory()) {
      throw new Error(`${file.path} is not a directory`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dir, {recursive: true});
    } else {
      throw error;
    }
  }

  await fs.writeFile(file.path, file.contents, {
    mode: file.stat ? file.stat.mode : null
  });
}

async function remove(file) {
  let remove = fs.rm || fs.rmdir;
  await remove(file.path, {recursive: true});
}

module.exports = async function (file) {
  this.store.add(file);
  if (isFileStateModified(file)) {
    setCommittedFile(file);
    await write(file);
  } else if (isFileStateDeleted(file)) {
    setCommittedFile(file);
    await remove(file);
  }

  clearFileState(file);
};
