'use strict';

const fs = require('fs').promises;
const path = require('path');
const {
  clearFileState,
  isFileStateModified,
  isFileStateDeleted,
  setCommittedFile,
} = require('../state');

async function write(file) {
  const dir = path.dirname(file.path);
  try {
    if (!(await fs.stat(dir)).isDirectory()) {
      throw new Error(`${file.path} is not a directory`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
    } else {
      throw error;
    }
  }

  const options = {};
  if (file.stat) {
    options.mode = file.stat.mode;
  }

  await fs.writeFile(file.path, file.contents, options);

  if (options.mode !== undefined) {
    const { mode } = await fs.stat(file.path);
    // eslint-disable-next-line no-bitwise
    if ((mode & 0o777) !== (options.mode & 0o777)) {
      await fs.chmod(file.path, options.mode);
    }
  }
}

async function remove(file) {
  const remove = fs.rm || fs.rmdir;
  await remove(file.path, { recursive: true });
}

module.exports = async function (file) {
  const existingFile = this.store.get(file.path);
  if (!existingFile || existingFile !== file) {
    this.store.add(file);
  }

  if (isFileStateModified(file)) {
    setCommittedFile(file);
    await write(file);
  } else if (isFileStateDeleted(file)) {
    setCommittedFile(file);
    await remove(file);
  }

  clearFileState(file);
};
