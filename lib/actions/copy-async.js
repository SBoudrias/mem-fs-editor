'use strict';

var assert = require('assert');
var fs = require('fs');
var fsPromises = require('fs').promises;
var path = require('path');
var globby = require('globby');
var multimatch = require('multimatch');
var ejs = require('ejs');
var util = require('../util');
var normalize = require('normalize-path');

async function applyProcessingFileFunc(processFile, filename, self) {
  var output = await Promise.resolve(processFile.call(self, filename));
  return output instanceof Buffer ? output : Buffer.from(output);
}

function renderFilepath(filepath, context, tplSettings) {
  if (!context) {
    return filepath;
  }

  return ejs.render(filepath, context, tplSettings);
}

async function getOneFile(from) {
  var oneFile;
  if (typeof from === 'string') {
    oneFile = from;
  } else {
    return undefined;
  }

  var resolved = path.resolve(oneFile);
  try {
    if ((await fsPromises.stat(resolved)).isFile()) {
      return resolved;
    }
  } catch (e) {
  }

  return undefined;
}

exports.copyAsync = async function (from, to, options, context, tplSettings) {
  to = path.resolve(to);
  options = options || {};
  var oneFile = await getOneFile(from);
  if (oneFile) {
    return this._copySingleAsync(oneFile, renderFilepath(to, context, tplSettings), options);
  }

  var fromGlob = util.globify(from);

  var globOptions = {...options.globOptions, nodir: true};
  var diskFiles = globby.sync(fromGlob, globOptions).map(filepath => path.resolve(filepath));
  var storeFiles = [];
  this.store.each(file => {
    // The store may have a glob path and when we try to copy it will fail because not real file
    if (!globby.hasMagic(normalize(file.path)) && multimatch([file.path], fromGlob).length !== 0 && !diskFiles.includes(file.path)) {
      storeFiles.push(file.path);
    }
  });

  var generateDestination = () => to;
  if (Array.isArray(from) || !this.exists(from) || globby.hasMagic(normalize(from))) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination'
    );

    const processDestinationPath = options.processDestinationPath || (path => path);
    var root = util.getCommonPath(from);
    generateDestination = filepath => {
      var toFile = path.relative(root, filepath);
      return processDestinationPath(path.join(to, toFile));
    };
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(options.ignoreNoMatch || diskFiles.length > 0 || storeFiles.length > 0, 'Trying to copy from a source that does not exist: ' + from);

  await Promise.all([
    ...diskFiles.map(file => {
      return this._copySingleAsync(file, renderFilepath(generateDestination(file), context, tplSettings), options);
    }),
    ...storeFiles.map(file => {
      return Promise.resolve(this._copySingle(file, renderFilepath(generateDestination(file), context, tplSettings), options));
    })
  ]);
};

exports._copySingleAsync = async function (from, to, options = {}) {
  if (!options.processFile) {
    return this._copySingle(from, to, options);
  }

  var contents = await applyProcessingFileFunc(options.processFile, from, this);

  if (options.append) {
    if (!this.store.existsInMemory) {
      throw new Error('Current mem-fs is not compatible with append');
    }

    if (this.store.existsInMemory(to)) {
      this.append(to, contents, {create: true, ...options});
      return;
    }
  }

  var stat = await fsPromises.stat(from);
  this.write(to, contents, stat);
};
