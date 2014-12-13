'use strict';

var assert = require('assert');
var path = require('path');
var sinon = require('sinon');
var editor = require('..');
var memFs = require('mem-fs');

describe('#writeJSON()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('stringify with optional arguments (for JSON.stringify)', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = { foo: 'bar' };
    var write = sinon.spy(this.fs, 'write');
    this.fs.writeJSON(filepath, contents, null, 2);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, null, 2));
    write.restore();
  });

  it('defaults indentation to 2 if stringify argument is not provided', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = { foo: 'bar' };
    var write = sinon.spy(this.fs, 'write');
    this.fs.writeJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, null, 2));
    write.restore();
  });

  it('write json object to a new file', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = { foo: 'bar' };
    this.fs.writeJSON(filepath, contents);
    assert.equal(this.fs.read(filepath), JSON.stringify(contents, null, 2));
  });

  it('write json object to an existing file', function () {
    var filepath = path.join(__dirname, 'fixtures/file.json');
    var contents = { bar: 'foo' };
    this.fs.writeJSON(filepath, contents);
    assert.equal(this.fs.read(filepath), JSON.stringify(contents, null, 2));
  });

  it('calls write() with stringified JSON object', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = { foo: 'bar' };
    var write = sinon.spy(this.fs, 'write');
    this.fs.writeJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify(contents, null, 2));
    write.restore();
  });
});
