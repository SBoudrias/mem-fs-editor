'use strict';

var assert = require('assert');
var path = require('path');
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
});
