'use strict';

var path = require('path');
var _ = require('lodash');

module.exports = function (from, to, context, tplSettings) {
  context = context || {};
  tplSettings = tplSettings || {};
  this.copy(from, to, {
    process: function (contents) {
      return _.template(contents.toString(), tplSettings)(context);
    }
  });
};
