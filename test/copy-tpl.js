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

  it('allow including glob options', function() {
    var filenames = [
      path.join(__dirname, 'fixtures/file-tpl-partial.txt'),
      path.join(__dirname, 'fixtures/file-tpl.txt')
    ];
    var copyOptions = {
      globOptions: {
        ignore: filenames[1]
      }
    };
    var newPath = '/new/path';
    this.fs.copyTpl(filenames, newPath, {}, {}, copyOptions);
    assert.equal(this.fs.exists(path.join(newPath, 'file-tpl-partial.txt')), true);
    assert.equal(this.fs.exists(path.join(newPath, 'file-tpl.txt')), false);
  });
});
