'use strict';

var {pipeline} = require('stream');
const {createTransform} = require('../util');

module.exports = function (filters, stream, cb) {
  var self = this;

  if (typeof filters === 'function') {
    cb = filters;
    filters = [];
    stream = undefined;
  } else if (typeof stream === 'function') {
    cb = stream;
    stream = undefined;
  }

  stream = stream || this.store.stream();
  var modifiedFilter = createTransform(function (file, _enc, cb) {
    // Don't process deleted file who haven't been commited yet.
    if (file.state === 'modified' || (file.state === 'deleted' && !file.isNew)) {
      this.push(file);
    }

    cb();
  });

  var commitFilter = createTransform(function (file, _enc, cb) {
    self.commitFileAsync(file).then(() => cb()).catch(error => cb(error));
  });

  pipeline(
    stream,
    modifiedFilter,
    ...filters,
    commitFilter,
    (...args) => cb(...args)
  );
};
