'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var memFs = require('mem-fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var through = require('through2');
var editor = require('..');

describe('#commit()', function () {
  var fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  var output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  beforeEach(function(done) {
    rimraf.sync(fixtureDir);
    var store = memFs.create();
    this.fs = editor.create(store);
    mkdirp.sync(fixtureDir);

    // Create a 100 files to exercise the stream high water mark
    var i = 100;
    while (i--) {
      fs.writeFileSync(path.join(fixtureDir, 'file-' + i + '.txt'), 'foo');
    }
    this.fs.copy(fixtureDir + '/**', output);
    rimraf(output, done);
  });

  it('triggers callback when done', function (done) {
    this.fs.commit(done);
  });

  it('call filters and update memory model', function (done) {
    var called = 0;

    var filter = through.obj(function (file, enc, cb) {
      called++;
      file.contents = new Buffer('modified');
      this.push(file)
      cb();
    });

    this.fs.commit([filter], function () {
      assert.equal(called, 100);
      assert.equal(this.fs.read(path.join(output, 'file-1.txt')), 'modified');
      done();
    }.bind(this));
  });

  it('write file to disk', function (done) {
    this.fs.commit(function () {
      assert(fs.existsSync(path.join(output, 'file-1.txt')));
      assert(fs.existsSync(path.join(output, 'file-50.txt')));
      assert(fs.existsSync(path.join(output, 'file-99.txt')));
      done();
    });
  });

  it('delete file from disk', function (done) {
    var file = path.join(output, 'delete.txt');
    mkdirp.sync(output);
    fs.writeFileSync(file, 'to delete');

    this.fs.delete(file);
    this.fs.commit(function () {
      assert(!fs.existsSync(file));
      done();
    });
  });

  it('delete directories from disk', function (done) {
    var file = path.join(output, 'nested/delete.txt');
    mkdirp.sync(path.join(output, 'nested'));
    fs.writeFileSync(file, 'to delete');

    this.fs.delete(path.join(output, 'nested'));
    this.fs.commit(function () {
      assert(!fs.existsSync(file));
      done();
    });
  });

  it('reset file status after commiting', function (done) {
    this.fs.commit(function () {
      assert.equal(this.fs.store.get(path.join(output, '/file-a.txt')).state, undefined);
      done();
    }.bind(this));
  });
});
