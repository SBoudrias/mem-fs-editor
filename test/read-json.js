'use strict';

var assert = require('assert');
var path = require('path');
var sinon = require('sinon');
var editor = require('..');
var memFs = require('mem-fs');

describe('#readJSON()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('read the content of a file', function () {
    var obj = this.fs.readJSON(path.join(__dirname, 'fixtures/file.json'));
    assert.equal(obj.foo, 'bar');
  });

  it('calls read() with path', function () {
    var read = sinon.spy(this.fs, 'read');
    var file = path.join(__dirname, 'fixtures/file.json');
    this.fs.readJSON(file);
    sinon.assert.calledOnce(read);
    sinon.assert.calledWith(read, file);
    read.restore();
  });

  it('return defaults if file does not exist and defaults is provided', function () {
    var obj = this.fs.readJSON(path.join(__dirname, 'no-such-file.json'), { foo: 'bar' });
    assert.equal(obj.foo, 'bar');
  });

  it('throw error if file could not be parsed as JSON, even if defaults is provided', function () {
    assert.throws(this.fs.readJSON.bind(this.fs, path.join(__dirname, 'fixtures/file-tpl.txt'), { foo: 'bar' }));
  })
});
