'use strict';

const path = require('path');
const globby = require('globby');
const multimatch = require('multimatch');
const util = require('../util');
const { setDeletedFileState } = require('../state');

function deleteFile(path, store) {
  const file = store.get(path);
  setDeletedFileState(file);
  file.contents = null;
  store.add(file);
}

module.exports = function (paths, options) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  paths = paths.map((filePath) => path.resolve(filePath));
  paths = util.globify(paths);
  options = options || {};

  const globOptions = options.globOptions || {};
  const files = globby.sync(paths, globOptions);
  files.forEach((file) => {
    deleteFile(file, this.store);
  });

  this.store.each((file) => {
    if (multimatch([file.path], paths).length !== 0) {
      deleteFile(file.path, this.store);
    }
  });
};
