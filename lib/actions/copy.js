'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const globby = require('globby');
const multimatch = require('multimatch');
const util = require('../util');
const normalize = require('normalize-path');

function applyProcessingFunc(process, contents, filename) {
  const output = process(contents, filename);
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

exports.copy = function (from, to, options, context, tplSettings) {
  to = path.resolve(to);
  options = options || {};

  let files = [];
  if (options.noGlob) {
    const fromFiles = Array.isArray(from) ? from : [from];
    files = fromFiles.filter(
      (filepath) => this.store.existsInMemory(filepath) || fs.existsSync(filepath)
    );
  } else {
    const fromGlob = util.globify(from);
    const globOptions = { ...options.globOptions, nodir: true };
    const diskFiles = globby
      .sync(fromGlob, globOptions)
      .map((file) => path.resolve(file));

    const storeFiles = [];
    this.store.each((file) => {
      // The store may have a glob path and when we try to copy it will fail because not real file
      if (
        !diskFiles.includes(file.path) &&
        !globby.hasMagic(normalize(file.path)) &&
        multimatch([file.path], fromGlob).length !== 0
      ) {
        storeFiles.push(file.path);
      }
    });
    files = diskFiles.concat(storeFiles);
  }

  let generateDestination = () => to;
  if (
    Array.isArray(from) ||
    !this.exists(from) ||
    (globby.hasMagic(normalize(from)) && !options.noGlob)
  ) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination'
    );

    const processDestinationPath = options.processDestinationPath || ((path) => path);
    const root = options.fromBasePath || util.getCommonPath(from);
    generateDestination = (filepath) => {
      const toFile = path.relative(root, filepath);
      return processDestinationPath(path.join(to, toFile));
    };
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(
    options.ignoreNoMatch || files.length > 0,
    'Trying to copy from a source that does not exist: ' + from
  );

  files.forEach((file) => {
    let toFile = generateDestination(file);
    if (context) {
      toFile = util.render(toFile, context, { ...tplSettings, cache: false });
    }

    this._copySingle(file, toFile, options, context, tplSettings);
  });
};

exports._copySingle = function (from, to, options = {}) {
  assert(this.exists(from), 'Trying to copy from a source that does not exist: ' + from);

  const file = this.store.get(from);

  let { contents } = file;
  if (options.process) {
    contents = applyProcessingFunc(options.process, file.contents, file.path);
  }

  if (options.append) {
    if (!this.store.existsInMemory) {
      throw new Error('Current mem-fs is not compatible with append');
    }

    if (this.store.existsInMemory(to)) {
      this.append(to, contents, { create: true, ...options });
      return;
    }
  }

  this.write(to, contents, file.stat);
};
