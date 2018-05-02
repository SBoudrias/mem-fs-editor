'use strict';

module.exports = function (from, to, context, options) {
	context = context || {};

  	this.copy(from, to, options, context);
  	this.delete(from, options);
};
