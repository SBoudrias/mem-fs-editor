'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#delete()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('delete a file', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    this.fs.delete(filepath);
    assert.throws(this.fs.read.bind(this.fs, filepath));
    assert.equal(this.fs.store.get(filepath).state, 'deleted');
  });

  it('delete a directory', function () {
    var dirpath = path.join(__dirname, 'fixtures/nested');
    var nestedFile = path.join(dirpath, 'file.txt');
    this.fs.delete(dirpath);
    assert.equal(this.fs.store.get(dirpath).state, 'deleted');
    assert.equal(this.fs.store.get(nestedFile).state, 'deleted');
  });
});
