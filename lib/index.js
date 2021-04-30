'use strict';

function EditionInterface(store) {
  this.store = store;
}

EditionInterface.prototype.read = require('./actions/read.js');
EditionInterface.prototype.readJSON = require('./actions/read-json.js');
EditionInterface.prototype.exists = require('./actions/exists');
EditionInterface.prototype.write = require('./actions/write.js');
EditionInterface.prototype.writeJSON = require('./actions/write-json.js');
EditionInterface.prototype.extendJSON = require('./actions/extend-json.js');
EditionInterface.prototype.append = require('./actions/append.js');
EditionInterface.prototype.appendTpl = require('./actions/append-tpl.js');
EditionInterface.prototype.delete = require('./actions/delete.js');
EditionInterface.prototype.copy = require('./actions/copy.js').copy;
EditionInterface.prototype._copySingle = require('./actions/copy.js')._copySingle;
EditionInterface.prototype.copyTpl = require('./actions/copy-tpl.js').copyTpl;
EditionInterface.prototype._processTpl = require('./actions/copy-tpl.js')._processTpl;
EditionInterface.prototype.copyAsync = require('./actions/copy-async.js').copyAsync;
EditionInterface.prototype._copySingleAsync = require('./actions/copy-async.js')._copySingleAsync;
EditionInterface.prototype.copyTplAsync = require('./actions/copy-tpl-async.js');
EditionInterface.prototype.move = require('./actions/move.js');
EditionInterface.prototype.commit = require('./actions/commit.js');
EditionInterface.prototype.commitFileAsync = require('./actions/commit-file-async.js');
EditionInterface.prototype.dump = require('./actions/dump.js');

exports.create = function (store) {
  return new EditionInterface(store);
};

exports.State = require('./state');
