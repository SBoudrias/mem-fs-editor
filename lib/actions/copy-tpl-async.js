'use strict';

const fs = require('fs').promises;
const { isBinary, renderFile } = require('../util');

module.exports = async function (from, to, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  await this.copyAsync(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      async processFile(filename) {
        if (isBinary(filename, null)) {
          return fs.readFile(filename);
        }

        return renderFile(filename, context, tplSettings);
      },
      process: (contents, filename, destination) =>
        this._processTpl({
          contents,
          filename,
          destination,
          context,
          tplSettings,
        }),
    },
    context,
    tplSettings
  );
};
