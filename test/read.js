'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

var fileA = path.join(__dirname, 'fixtures/file-a.txt');

describe('#read()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('read the content of a file', function () {
    var content = this.fs.read(fileA);
    assert.equal(content, 'foo\n');
  });

  it('get the buffer content of a file', function () {
    var content = this.fs.read(fileA, { raw: true });
    assert(content instanceof Buffer);
    assert.equal(content.toString(), 'foo\n');
  });

  it('throws if file does not exist', function () {
    assert.throws(this.fs.read.bind(this.fs, 'file-who-does-not-exist.txt'));
  });

  it('return defaults as String if file does not exsit and defaults is provided', function () {
    var content = this.fs.read('file-who-does-not-exist.txt', { defaults: 'foo\n' });
    assert.equal(content, 'foo\n');
  });

  it('return defaults as Buffer if file does not exsit and defaults is provided', function () {
    var content = this.fs.read('file-who-does-not-exist.txt', {
      defaults: new Buffer('foo\n'),
      raw: true
    });
    assert(content instanceof Buffer);
    assert.equal(content.toString(), 'foo\n');
  });
});
