'use strict';

var ejs = require('ejs');
var fs = require('fs').promises;
var {isBinaryFile} = require('isbinaryfile');
const {render} = require('../util');

async function renderFile(filename, context, tplSettings) {
  let result;

  if (await isBinaryFile(filename)) {
    result = await fs.readFile(filename);
  } else {
    result = await ejs.renderFile(filename, context, tplSettings);
  }

  return result;
}

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
        return renderFile(filename, context, tplSettings);
      },
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
