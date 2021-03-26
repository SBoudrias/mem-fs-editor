'use strict';

var ejs = require('ejs');
var isBinaryFileSync = require('isbinaryfile').isBinaryFileSync;

function render(contents, context, tplSettings) {
  let result;

  const contentsBuffer = Buffer.from(contents, 'binary');
  if (isBinaryFileSync(contentsBuffer, contentsBuffer.length)) {
    result = contentsBuffer;
  } else {
    result = ejs.render(
      contents.toString(),
      context,
      tplSettings
    );
  }

  return result;
}

module.exports = function (from, to, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  this.copy(
    from,
    to,
    {
      processDestinationPath: path => path.replace(/.ejs$/, ''),
      ...options,
      process: function (contents, filename) {
        return render(contents, context, {
          // Setting filename by default allow including partials.
          filename: filename,
          ...tplSettings
        });
      }
    },
    context,
    tplSettings
  );
};
