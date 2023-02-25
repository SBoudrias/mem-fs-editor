'use strict';

const path = require('path');
const normalize = require('normalize-path');
const minimatch = require('minimatch');

const { hasClearedState, hasState, STATE, STATE_CLEARED } = require('../state');

const defaultDumpFilter = (file) => hasClearedState(file) || hasState(file);

module.exports = function (cwd = process.cwd(), filter = defaultDumpFilter) {
  if (typeof filter === 'string') {
    const pattern = filter;
    filter = (file) => defaultDumpFilter(file) && minimatch(file.path, pattern);
  }

  return Object.fromEntries(
    this.store
      .all()
      .filter((file) => filter(file, cwd))
      .map((file) => {
        const filePath = normalize(cwd ? path.relative(cwd, file.path) : file.path);
        const fileDump = {
          contents: file.contents ? file.contents.toString() : file.contents,
        };
        if (file[STATE]) {
          fileDump[STATE] = file[STATE];
        }

        if (file[STATE_CLEARED]) {
          fileDump[STATE_CLEARED] = file[STATE_CLEARED];
        }

        return [filePath, fileDump];
      })
  );
};
