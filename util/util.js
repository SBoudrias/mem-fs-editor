'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');

exports.getCommonPath = function (filePath) {
  filePath = this.globify(filePath);
  var globStartIndex = filePath.indexOf('*');
  if (globStartIndex !== -1) {
    filePath = filePath.substring(0, globStartIndex + 1);
  }

  return path.dirname(filePath);
};


exports.globify = function (filePath) {
  if (glob.hasMagic(filePath) || !fs.existsSync(filePath)) {
    return filePath;
  }

  var fsStats = fs.statSync(filePath);
  if (fsStats.isFile()) {
    return filePath;
  } else if (fsStats.isDirectory()) {
    return path.join(filePath, '**');
  } else {
    throw new Error('Only file path or directory path are supported.');
  }
};
