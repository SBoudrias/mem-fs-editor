'use strict';

const { EOL } = require('os');

module.exports = function (to, contents, options) {
  options = {
    trimEnd: true,
    separator: EOL,
    ...options,
  };

  if (!this.exists(to) && options.create) {
    this.write(to, contents);
    return;
  }

  let currentContents = this.read(to);
  if (options.trimEnd) {
    currentContents = currentContents.replace(/\s+$/, '');
  }

  this.write(to, currentContents + options.separator + contents);
};
