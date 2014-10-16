'use strict';

function EditionInterface(store) {
  this.store = store;
}

EditionInterface.prototype.read = require('./actions/read.js');
EditionInterface.prototype.readJSON = require('./actions/read-json.js');
EditionInterface.prototype.write = require('./actions/write.js');
EditionInterface.prototype.delete = require('./actions/delete.js');
EditionInterface.prototype.copy = require('./actions/copy.js');
EditionInterface.prototype.copyTpl = require('./actions/copy-tpl.js');

exports.create = function (store) {
  return new EditionInterface(store);
};
