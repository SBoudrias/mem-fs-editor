'use strict';

const ejs = require('ejs');
const {isBinary} = require('../util');

module.exports._processTpl = function ({contents, filename, context, tplSettings}) {
  if (isBinary(filename, contents)) {
    return contents;
  }

  return ejs.render(
    contents.toString(),
    context,
    {
      // Setting filename by default allow including partials.
      filename,
      ...tplSettings,
    },
  );
};

module.exports.copyTpl = function (from, to, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  this.copy(
    from,
    to,
    {
      processDestinationPath: path => path.replace(/.ejs$/, ''),
      ...options,
      process: (contents, filename) => this._processTpl({contents, filename, context, tplSettings}),
    },
    context,
    tplSettings,
  );
};
