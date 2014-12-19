'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var editor = require('..');
var memFs = require('mem-fs');

describe('#copy()', function () {
  beforeEach(function() {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('copy file', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var initialContents = this.fs.read(filepath);
    var newPath = '/new/path/file.txt';
    this.fs.copy(filepath, newPath);
    assert.equal(this.fs.read(newPath), initialContents);
    assert.equal(this.fs.store.get(newPath).state, 'modified');
  });

  it('copy file and process contents', function () {
    var filepath = path.join(__dirname, 'fixtures/file-a.txt');
    var initialContents = this.fs.read(filepath);
    var contents = 'some processed contents';
    var newPath = '/new/path/file.txt';
    this.fs.copy(filepath, newPath, {
      process: function (contentsArg) {
        assert(contentsArg instanceof Buffer)
        assert.equal(contentsArg, initialContents);
        return contents;
      }
    });
    assert.equal(this.fs.read(newPath), contents);
  });

  it('copy by directory', function () {
    this.fs.copy(__dirname + '/fixtures', '/output');
    assert.equal(this.fs.read('/output/file-a.txt'), 'foo\n');
    assert.equal(this.fs.read('/output/nested/file.txt'), 'nested\n');
  });

  it('copy by globbing', function () {
    this.fs.copy(__dirname + '/fixtures/**', '/output');
    assert.equal(this.fs.read('/output/file-a.txt'), 'foo\n');
    assert.equal(this.fs.read('/output/nested/file.txt'), 'nested\n');
  });

  it('accepts directory name with "."', function () {
    this.fs.copy(__dirname + '/fixtures/**', '/out.put');
    assert.equal(this.fs.read('/out.put/file-a.txt'), 'foo\n');
    assert.equal(this.fs.read('/out.put/nested/file.txt'), 'nested\n');
  });

  it('requires destination directory when globbing', function () {
    assert.throws(
      this.fs.copy.bind(this.fs, __dirname + '/fixtures/**', __dirname + '/fixtures/file-a.txt')
    );
  });

  it('preserve permissions', function (done) {
    var filename = path.join(os.tmpdir(), 'perm.txt');
    var copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    fs.writeFileSync(filename, 'foo', { mode: parseInt(733, 8) });

    this.fs.copy(filename, copyname);

    this.fs.commit(function () {
      var oldStat = fs.statSync(filename);
      var newStat = fs.statSync(copyname);
      assert.equal(newStat.mode, oldStat.mode);
      done();
    });
  });
});
