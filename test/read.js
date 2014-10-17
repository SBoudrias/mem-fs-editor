'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#read()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('read the content of a file', function () {
    var content = this.fs.read(path.join(__dirname, 'fixtures/file-a.txt'));
    assert.equal(content, 'foo\n');
  });

  it('throws if file does not exist', function () {
    assert.throws(this.fs.read.bind(this.fs, 'file-who-does-not-exist.txt'));
  });
});
