'use strict';

const assert = require('assert');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const globby = require('globby');
const multimatch = require('multimatch');
const util = require('../util');
const normalize = require('normalize-path');

async function applyProcessingFileFunc(processFile, filename) {
  const output = await Promise.resolve(processFile.call(this, filename));
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

function renderFilepath(filepath, context, tplSettings) {
  if (!context) {
    return filepath;
  }

  return util.render(filepath, context, tplSettings);
}

async function getOneFile(from) {
  let oneFile;
  if (typeof from === 'string') {
    oneFile = from;
  } else {
    return undefined;
  }

  const resolved = path.resolve(oneFile);
  try {
    if ((await fsPromises.stat(resolved)).isFile()) {
      return resolved;
    }
  } catch (_) {}

  return undefined;
}

exports.copyAsync = async function (from, to, options, context, tplSettings) {
  to = path.resolve(to);
  options = options || {};
  const oneFile = await getOneFile(from);
  if (oneFile) {
    return this._copySingleAsync(
      oneFile,
      renderFilepath(to, context, tplSettings),
      options
    );
  }

  const fromGlob = util.globify(from);

  const globOptions = { ...options.globOptions, nodir: true };
  const diskFiles = globby
    .sync(fromGlob, globOptions)
    .map((filepath) => path.resolve(filepath));
  const storeFiles = [];
  this.store.each((file) => {
    // The store may have a glob path and when we try to copy it will fail because not real file
    if (
      !globby.hasMagic(normalize(file.path)) &&
      multimatch([file.path], fromGlob).length !== 0 &&
      !diskFiles.includes(file.path)
    ) {
      storeFiles.push(file.path);
    }
  });

  let generateDestination = () => to;
  if (Array.isArray(from) || !this.exists(from) || globby.hasMagic(normalize(from))) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination'
    );

    const processDestinationPath = options.processDestinationPath || ((path) => path);
    const root = util.getCommonPath(from);
    generateDestination = (filepath) => {
      const toFile = path.relative(root, filepath);
      return processDestinationPath(path.join(to, toFile));
    };
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(
    options.ignoreNoMatch || diskFiles.length > 0 || storeFiles.length > 0,
    'Trying to copy from a source that does not exist: ' + from
  );

  await Promise.all([
    ...diskFiles.map((file) =>
      this._copySingleAsync(
        file,
        renderFilepath(generateDestination(file), context, tplSettings),
        options
      )
    ),
    ...storeFiles.map((file) =>
      Promise.resolve(
        this._copySingle(
          file,
          renderFilepath(generateDestination(file), context, tplSettings),
          options
        )
      )
    ),
  ]);
};

exports._copySingleAsync = async function (from, to, options = {}) {
  if (!options.processFile) {
    return this._copySingle(from, to, options);
  }

  const contents = await applyProcessingFileFunc.call(this, options.processFile, from);

  if (options.append) {
    if (!this.store.existsInMemory) {
      throw new Error('Current mem-fs is not compatible with append');
    }

    if (this.store.existsInMemory(to)) {
      this.append(to, contents, { create: true, ...options });
      return;
    }
  }

  const stat = await fsPromises.stat(from);
  this.write(to, contents, stat);
};
