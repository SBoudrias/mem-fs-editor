'use strict';

var path = require('path');
var extend = require('deep-extend');
var ejs = require('ejs');
var isBinaryFile = require("isbinaryfile");

function shouldPerformTemplateSubstitution(filename, tplSettings) {
  return !isBinaryFile.sync(filename) || tplSettings.forceBinarySubstition;
}

function render(contents, filename, context, tplSettings) {
  if (shouldPerformTemplateSubstitution(filename, tplSettings)) {
    return ejs.render(
      contents.toString(),
      context,
      // Setting filename by default allow including partials.
      extend({filename: filename}, tplSettings)
    );
  } else {
    return contents.toString();
  }
}

module.exports = function (from, to, context, tplSettings, options) {
  context = context || {};

  this.copy(from, to, extend(options || {}, {
    process: function (contents, filename) {
      return render(contents, filename, context, tplSettings || {});
    }
  }));
};
