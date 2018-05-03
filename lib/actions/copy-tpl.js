'use strict';

var extend = require('deep-extend');
var ejs = require('ejs');
var isBinaryFile = require('isbinaryfile');

function render(contents, filename, context, tplSettings) {
  let result;

  if (isBinaryFile.sync(filename)) {
    result = Buffer.from(contents, 'binary');
  } else {
    result = ejs.render(
      contents.toString(),
      context,
      // Setting filename by default allow including partials.
      extend({filename: filename}, tplSettings)
    );
  }

  return result;
}

module.exports = function (from, to, context, tplSettings, options) {
  context = context || {};

  this.copy(from, to, extend(options || {}, {
    process: function (contents, filename) {
      return render(contents, filename, context, tplSettings || {});
    }
  }));
};
