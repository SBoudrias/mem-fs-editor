'use strict';

const { promisify } = require('util');
const { pipeline: _pipeline } = require('stream');
const pipeline = promisify(_pipeline);

const { createPendingFilesPassthrough, createCommitTransform } = require('../transform');
const { isFilePending } = require('../state');

module.exports = function (filters, stream, cb) {
  if (typeof filters === 'function') {
    cb = filters;
    filters = [];
    stream = undefined;
  } else if (typeof stream === 'function') {
    cb = stream;
    stream = undefined;
  }

  stream = stream || this.store.stream({ filter: (file) => isFilePending(file) });
  filters = filters || [];

  const promise = pipeline(
    stream,
    createPendingFilesPassthrough(),
    ...filters,
    createCommitTransform(this)
  );
  if (cb) {
    return promise.then(() => cb(), cb);
  }

  return promise;
};
