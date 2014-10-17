'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#write()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('write string to a new file', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = 'some text';
    this.fs.write(filepath, contents);
    assert.equal(this.fs.read(filepath), contents);
    assert.equal(this.fs.store.get(filepath).state, 'modified');
  });

  it('write buffer to a new file', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = new Buffer('omg!', 'base64');
    this.fs.write(filepath, contents);
    assert.equal(this.fs.read(filepath), contents.toString());
    assert.equal(this.fs.store.get(filepath).state, 'modified');
  });

  it('write an existing file', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var contents = 'some text';
    this.fs.write(filepath, contents);
    assert.equal(this.fs.read(filepath), contents);
    assert.equal(this.fs.store.get(filepath).state, 'modified');
  });
});
