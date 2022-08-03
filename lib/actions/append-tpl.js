'use strict';

const { render } = require('../util');

module.exports = function (to, contents, context, tplSettings, options) {
  context = context || {};
  tplSettings = tplSettings || {};

  this.append(to, render(contents.toString(), context, tplSettings), options);
};
