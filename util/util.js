'use strict';

var path = require('path');

exports.getCommonPath = function (files) {
  var dirs = files.map(path.dirname);
  var root = dirs.reduce(function (prev, current) {
    var keep = [];
    prev = prev.split('/');
    current = current.split('/');
    prev.forEach(function (part, index) {
      if (part === current[index]) {
        keep.push(part);
      }
    });
    return keep.join('/');
  }, dirs[0]);

  return root || '/';
};
