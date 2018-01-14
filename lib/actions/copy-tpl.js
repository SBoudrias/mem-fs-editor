'use strict';

var path = require('path');
var extend = require('deep-extend');
var ejs = require('ejs');
var isBinaryFile = require("isbinaryfile");

function render(contents, filename, context, tplSettings) {
  if (isBinaryFile.sync(filename)) {
    return contents.toString();
  } else {
    return ejs.render(
      contents.toString(),
      context,
      // Setting filename by default allow including partials.
      extend({filename: filename}, tplSettings)
    );
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
