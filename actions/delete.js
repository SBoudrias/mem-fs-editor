'use strict';

var assert = require('assert');

function deleteFile(file, store) {
  file.state = 'deleted';
  file.contents = new Buffer('');
  store.add(file);
}

module.exports = function (path) {
  var deletedPath = this.store.get(path).path;

  this.store.each(function (file) {
    if (file.path.indexOf(deletedPath) === 0) {
      deleteFile(file, this.store);
    }
  }.bind(this));
};
