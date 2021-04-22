'use strict';

var fs = require('fs').promises;
var path = require('path');

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
  await fs.rmdir(file.path, {recursive: true});
}

module.exports = async function (file) {
  this.store.add(file);
  if (file.state === 'modified') {
    file.committed = true;
    await write(file);
  } else if (file.state === 'deleted') {
    file.committed = true;
    await remove(file);
  }

  delete file.state;
  delete file.isNew;
};
