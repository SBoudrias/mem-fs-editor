'use strict';

const path = require('path');
const normalize = require('normalize-path');

const {hasClearedState, hasState, STATE, STATE_CLEARED} = require('../state');

module.exports = function (cwd = process.cwd(), filter = file => hasClearedState(file) || hasState(file)) {
  return Object.fromEntries(
    this.store.all().filter(file => filter(file)).map(file => {
      const filePath = normalize(cwd ? path.relative(cwd, file.path) : file.path);
      const fileDump = {
        contents: file.contents ? file.contents.toString() : file.contents
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
