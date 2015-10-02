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

  it.only('copy files by globbing and process contents as underscore template', function () {
    var filepath = [path.join(__dirname, 'fixtures/.tpls/**'), '!**/*.exclude'];
    var newPath = '/new/path/';
    this.fs.copyTpl(filepath, newPath, { name: 'new content' });
    assert.equal(this.fs.read(newPath + 'file-tpl-glob-1.txt'), 'new content\n');
    assert.equal(this.fs.read(newPath + 'file-tpl-glob-2.txt'), 'new content\n');
    assert.equal(this.fs.read(newPath + 'file-tpl-glob-3.txt'), 'new content\n');
    assert.throws(this.fs.read.bind(this.fs, newPath + 'file-tpl-glob-3.exclude'));
  });

  it('allow setting custom template delimiters', function() {
    var filepath = path.join(__dirname, 'fixtures/file-tpl-custom-delimiter.txt');
    var newPath = '/new/path/file.txt';
    this.fs.copyTpl(filepath, newPath, { name: 'mustache' }, {
      delimiter: '?'
    });
    assert.equal(this.fs.read(newPath), 'mustache\n');
  });

  it('allow including partials', function() {
    var filepath = path.join(__dirname, 'fixtures/file-tpl-include.txt');
    var newPath = '/new/path/file.txt';
    this.fs.copyTpl(filepath, newPath);
    assert.equal(this.fs.read(newPath), 'partial\n\n');
  });
});
