'use strict';

var ejs = require('ejs');
var fs = require('fs').promises;
const {isBinary} = require('../util');

module.exports = async function (from, to, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  await this.copyAsync(
    from,
    to,
    {
      processDestinationPath: path => path.replace(/.ejs$/, ''),
      ...options,
      processFile: async function (filename) {
        if (isBinary(filename, null)) {
          return fs.readFile(filename);
        }

        return ejs.renderFile(filename, context, tplSettings);
      },
      process: (contents, filename, destination) => this._processTpl({contents, filename, destination, context, tplSettings})
    },
    context,
    tplSettings
  );
};
