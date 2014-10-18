'use strict';

var assert = require('assert');
var util = require('../util/util');

describe('util.getCommonPath()', function () {
  it('find the common root of files in same directory', function () {
    assert.equal(
      util.getCommonPath(['/a/b/c.js', '/a/b/d.js', '/a/b/e.js']),
      '/a/b'
    );
  });

  it('find the common root of files in differents directory', function () {
    assert.equal(
      util.getCommonPath(['/a/b/c.js', '/a/c/d.js', '/a/b/e.js']),
      '/a'
    );
  });

  it('find the common root of files sharing no common root', function () {
    assert.equal(
      util.getCommonPath(['/a/b/c.js', '/b/d.js', '/c/e.js']),
      '/'
    );
  });
});
