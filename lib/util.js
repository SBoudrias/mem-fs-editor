'use strict';

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const commondir = require('commondir');
const globby = require('globby');
const normalize = require('normalize-path');
const { Transform } = require('stream');
const { isBinaryFileSync } = require('isbinaryfile');

const { default: textextensions } = require('textextensions');
const { default: binaryextensions } = require('binaryextensions');

function notNullOrExclusion(file) {
  return file != null && file.charAt(0) !== '!';
}

exports.getCommonPath = function (filePath) {
  if (Array.isArray(filePath)) {
    filePath = filePath.filter(notNullOrExclusion).map(this.getCommonPath.bind(this));

    return commondir(filePath);
  }

  const globStartIndex = filePath.indexOf('*');
  if (globStartIndex !== -1) {
    filePath = filePath.substring(0, globStartIndex + 1);
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    return filePath;
  }

  return path.dirname(filePath);
};

exports.globify = function (filePath) {
  if (Array.isArray(filePath)) {
    return filePath.reduce(
      (memo, pattern) => memo.concat(this.globify(normalize(pattern))),
      []
    );
  }

  filePath = normalize(filePath);

  if (globby.hasMagic(filePath)) {
    return filePath;
  }

  if (!fs.existsSync(filePath)) {
    // The target of a pattern who's not a glob and doesn't match an existing
    // entity on the disk is ambiguous. As such, match both files and directories.
    return [filePath, normalize(path.join(filePath, '**'))];
  }

  const fsStats = fs.statSync(filePath);
  if (fsStats.isFile()) {
    return filePath;
  }

  if (fsStats.isDirectory()) {
    return normalize(path.join(filePath, '**'));
  }

  throw new Error('Only file path or directory path are supported.');
};

exports.createTransform = function (transform) {
  return new Transform({
    objectMode: true,
    transform(...args) {
      return transform.apply(this, args);
    },
  });
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
    (newFileContents &&
      isBinaryFileSync(
        Buffer.isBuffer(newFileContents) ? newFileContents : Buffer.from(newFileContents)
      ))
  );
};

exports.render = function (template, data, options) {
  return ejs.render(template, data, { cache: false, ...options });
};

exports.renderFile = function (template, data, options) {
  return ejs.renderFile(template, data, { cache: true, ...options });
};
