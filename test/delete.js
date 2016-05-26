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

  it('delete new files', function () {
    this.fs.write('foo', 'foo');
    this.fs.delete('foo');
    assert.equal(this.fs.store.get('foo').state, 'deleted');
  });

  it('after delete a file should set isNew flag on write', function() {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    this.fs.delete(filepath);
    this.fs.write(filepath, 'foo');
    assert.equal(this.fs.store.get(filepath).isNew, true);
  });

  it('delete new files if specifying a full path', function () {
    this.fs.write('bar', 'bar');
    this.fs.delete(path.resolve('bar'));
    assert.equal(this.fs.store.get('bar').state, 'deleted');
  });
});
