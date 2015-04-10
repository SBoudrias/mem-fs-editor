'use strict';

var path = require('path');
var _ = require('lodash');

module.exports = function (from, to, options) {
  options = options || {};

  var tplContext = options.tplContext || {};
  var tplSettings = options.tplSettings || {};

  var copyOption = _(options).omit('tplContext', 'tplSettings').assign({
    process: function (contents) {
      return _.template(contents.toString(), tplSettings)(tplContext);
    }
  }).value();

  this.copy(from, to, copyOption);
};
