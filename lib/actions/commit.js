'use strict';

var {pipeline} = require('stream');
const {createPendingFilesPassthrough, createCommitTransform} = require('../transform');

module.exports = function (filters, stream, cb) {
  if (typeof filters === 'function') {
    cb = filters;
    filters = [];
    stream = undefined;
  } else if (typeof stream === 'function') {
    cb = stream;
    stream = undefined;
  }

  stream = stream || this.store.stream();

  pipeline(
    stream,
    createPendingFilesPassthrough(),
    ...filters,
    createCommitTransform(this),
    (...args) => cb(...args)
  );
};
