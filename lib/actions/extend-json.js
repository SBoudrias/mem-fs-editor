'use strict';

const extend = require('deep-extend');

module.exports = function (filepath, contents, replacer, space) {
  const originalContent = this.readJSON(filepath, {});
  const newContent = extend({}, originalContent, contents);

  this.writeJSON(filepath, newContent, replacer, space);
};
