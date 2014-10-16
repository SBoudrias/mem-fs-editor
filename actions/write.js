'use strict';

module.exports = function (path, contents) {
  var file = this.store.get(path);
  file.contents = new Buffer(contents);
  file.state = 'modified';
  this.store.add(file);
  return file.contents.toString();
};
