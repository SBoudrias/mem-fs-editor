'use strict';

const {render} = require('../util');

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
