'use strict';

const ejs = require('ejs');

module.exports = function (to, contents, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  this.append(
    to,
    ejs.render(
      contents.toString(),
      context,
      tplSettings,
    ),
    options);
};
