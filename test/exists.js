'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

var fileA = path.join(__dirname, 'fixtures/file-a.txt');
var fileDelete = path.join(__dirname, 'fixtures/deleteAfter');

describe('#exists()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('file doesn\'t exist', function () {
    assert.equal(this.fs.exists('something that doesnt exist'), false);
  });

  it('file does exist', function () { 
    this.fs.read(fileA);
    assert.equal(this.fs.exists(fileA), true);
  });

  it('file doesn\'t exist after delete', function () {
    this.fs.write(fileDelete, 'some content' );
    this.fs.delete(fileDelete);
    assert.equal(this.fs.exists(fileDelete), false);
  });
});
