'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

var fileA = path.join(__dirname, 'fixtures/file-a.txt');

describe('#exists()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('doesn\'t exist', function () {
    
    assert.deepEqual(this.fs.exists('something that doesnt exist'), false);
  });

  it('does exist', function () {
    
    this.fs.read(fileA);
    assert.deepEqual(this.fs.exists(fileA), true);
  });
});
