'use strict';

var fs = require('fs');
var path = require('path');
var commondir = require('commondir');
var globby = require('globby');
var normalize = require('normalize-path');
const {Transform} = require('stream');
var isBinaryFileSync = require('isbinaryfile').isBinaryFileSync;

const {default: textextensions} = require('textextensions');
const {default: binaryextensions} = require('binaryextensions');

function notNullOrExclusion(file) {
  return file != null && file.charAt(0) !== '!';
}

exports.getCommonPath = function (filePath) {
  if (Array.isArray(filePath)) {
    filePath = filePath
      .filter(notNullOrExclusion)
      .map(this.getCommonPath.bind(this));

    return commondir(filePath);
  }

  var globStartIndex = filePath.indexOf('*');
  if (globStartIndex !== -1) {
    filePath = filePath.substring(0, globStartIndex + 1);
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    return filePath;
  }

  return path.dirname(filePath);
};

exports.globify = function (filePath) {
  if (Array.isArray(filePath)) {
    return filePath.reduce((memo, pattern) => memo.concat(this.globify(normalize(pattern))), []);
  }

  filePath = normalize(filePath);

  if (globby.hasMagic(filePath)) {
    return filePath;
  }

  if (!fs.existsSync(filePath)) {
    // The target of a pattern who's not a glob and doesn't match an existing
    // entity on the disk is ambiguous. As such, match both files and directories.
    return [
      filePath,
      normalize(path.join(filePath, '**'))
    ];
  }

  var fsStats = fs.statSync(filePath);
  if (fsStats.isFile()) {
    return filePath;
  }

  if (fsStats.isDirectory()) {
    return normalize(path.join(filePath, '**'));
  }

  throw new Error('Only file path or directory path are supported.');
};

exports.createTransform = function (transform) {
  const stream = new Transform({
    objectMode: true,
    transform: function (...args) {
      return transform.apply(this, args);
    }
  });
  return stream;
};

exports.isBinary = (filePath, newFileContents) => {
  const extension = path.extname(filePath).replace(/^\./, '') || path.basename(filePath);
  if (binaryextensions.includes(extension)) {
    return true;
  }

  if (textextensions.includes(extension)) {
    return false;
  }

  return (
    (fs.existsSync(filePath) && isBinaryFileSync(filePath)) ||
    (newFileContents && isBinaryFileSync(Buffer.isBuffer(newFileContents) ? newFileContents : Buffer.from(newFileContents)))
  );
};
