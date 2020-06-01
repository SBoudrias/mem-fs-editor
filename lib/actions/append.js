'use strict';

var EOL = require('os').EOL;

module.exports = function (to, contents, options) {
  options = {
    trimEnd: true,
    separator: EOL,
    ...options
  };

  var currentContents = this.read(to);
  if (options.trimEnd) {
    currentContents = currentContents.replace(/\s+$/, '');
  }

  this.write(to, currentContents + options.separator + contents);
};
