'use strict';

var path = require('path');
var assert = require('assert');
var util = require('../util/util');

describe('util.getCommonPath()', function () {
  it('find the common root of /a/b/c, where /a/b/c is an existing directory', function () {
    var filePath = path.resolve(__dirname, 'fixtures');
    assert.equal(util.getCommonPath(filePath), filePath);
  });

  it('find the common root of /a/b/c, where /a/b/c is an existing file', function () {
    var filePath = path.resolve(__dirname, 'fixtures');
    assert.equal(util.getCommonPath(path.join(filePath, 'file-a.txt')), filePath);
  });

  it('find the common root of glob /a/b/**', function () {
    assert.equal(util.getCommonPath('/a/b/**'), '/a/b');
  });

  it('find the common root of glob /a/b*/c', function () {
    assert.equal(util.getCommonPath('/a/b*/c'), '/a');
  });

  it('find the common root of glob /a/b/*.ext', function () {
    assert.equal(util.getCommonPath('/a/b/*.ext'), '/a/b');
  });
});


describe('util.globify()', function () {
  it('returns path for file path', function () {
    var filePath = path.resolve(__dirname, 'fixtures/file-a.txt');
    assert.equal(util.globify(filePath), filePath);
  });

  it('returns path for nonexisting path', function () {
    var filePath = '/nonexisting.file';
    assert.equal(util.globify(filePath), filePath);
  });

  it('returns glob for glob path', function () {
    var filePath = path.resolve(__dirname, 'fixtures/*.txt');
    assert.equal(util.globify(filePath), filePath);

    var filePath2 = path.resolve(__dirname, 'fixtures/file-{a,b}.txt');
    assert.equal(util.globify(filePath2), filePath2);
  });

  it('returns globified path for directory path', function () {
    var filePath = path.resolve(__dirname, 'fixtures/nested');
    assert.equal(util.globify(filePath), path.join(filePath, '**'));
  });
});
