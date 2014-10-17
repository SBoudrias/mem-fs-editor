'use strict';

var assert = require('assert');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#copyTpl()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('copy file and process contents as underscore template', function () {
    var filepath = path.join(__dirname, 'fixtures/file-tpl.txt');
    var newPath = '/new/path/file.txt';
    this.fs.copyTpl(filepath, newPath, { name: 'new content' });
    assert.equal(this.fs.read(newPath), 'new content\n');
  });

  it('copy file with template settings', function() {
    var filepath = path.join(__dirname, 'fixtures/file-tpl-mustache.txt');
    var newPath = '/new/path/file.txt';
    this.fs.copyTpl(filepath, newPath, { name: 'mustache' }, {
      interpolate: /{{([\s\S]+?)}}/g
    });
    assert.equal(this.fs.read(newPath), 'mustache\n');
  });
});
