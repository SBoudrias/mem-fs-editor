'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#move()', function () {
  beforeEach(function () {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('move file', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var initialContents = this.fs.read(filepath);
    var newpath = '/new/path/file.txt';
    this.fs.move(filepath, newpath);
    assert.equal(this.fs.read(newpath), initialContents);
    assert.throws(this.fs.read.bind(this.fs, filepath));
  });

  it('move directory', function () {
    var filename = 'file.txt';
    var dirpath = path.join(__dirname, 'fixtures/nested');
    var filepath = path.join(dirpath, filename);
    var newdirpath = '/new/path';
    var newfilepath = path.join(newdirpath, filename);
    this.fs.move(dirpath, newdirpath);
    assert.equal(this.fs.store.get(newfilepath).state, 'modified');
    assert.throws(this.fs.read.bind(this.fs, filepath));
  });

  it('move file to an existing `to` path', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var initialContents = this.fs.read(filepath);
    var newpath = path.join(__dirname, 'fixtures/nested/file.txt');
    this.fs.move(filepath, newpath);
    assert.equal(this.fs.read(newpath), initialContents);
    assert.throws(this.fs.read.bind(this.fs, filepath));
  });

  it('move directory to an existing `to` path (as a directory)', function () {
    var dirpath = path.join(__dirname, 'fixtures/other');
    var filepath = path.join(__dirname, 'another.txt');
    var contents = 'another';
    var fromdir = path.join(__dirname, 'fixtures/nested');

    this.fs.write(filepath, contents);
    this.fs.move(fromdir, dirpath);

    assert.equal(this.fs.read(path.join(dirpath, 'file.txt')), 'nested\n');
    assert.equal(this.fs.read(filepath), contents);
    assert.throws(this.fs.read.bind(this.fs, path.join(fromdir, 'file.txt')));
  });

  it('throws when moving directory to an existing `to` path (as a file)', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var frompath = path.join(__dirname, 'fixtures/nested');

    assert.throws(this.fs.move.bind(this.fs, frompath, filepath));
  });
});
