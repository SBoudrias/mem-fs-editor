'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const memFs = require('mem-fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const through = require('through2');
const editor = require('..');

describe('#commit()', () => {
  const fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs;

  beforeEach(done => {
    rimraf.sync(fixtureDir);
    store = memFs.create();
    fs = editor.create(store);
    mkdirp.sync(fixtureDir);

    // Create a 100 files to exercise the stream high water mark
    let i = 100;
    while (i--) {
      filesystem.writeFileSync(path.join(fixtureDir, 'file-' + i + '.txt'), 'foo');
    }

    fs.copy(fixtureDir + '/**', output);
    rimraf(output, done);
  });

  it('triggers callback when done', done => {
    fs.commit(done);
  });

  it('call filters and update memory model', done => {
    let called = 0;

    let filter = through.obj(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    fs.commit([filter], () => {
      expect(called).toBe(100);
      expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
      done();
    });
  });

  it('write file to disk', done => {
    fs.commit(() => {
      expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-50.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-99.txt'))).toBeTruthy();
      done();
    });
  });

  it('delete file from disk', done => {
    const file = path.join(output, 'delete.txt');
    mkdirp.sync(output);
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(file);
    fs.commit(() => {
      expect(filesystem.existsSync(file)).toBeFalsy();
      done();
    });
  });

  it('delete directories from disk', done => {
    const file = path.join(output, 'nested/delete.txt');
    mkdirp.sync(path.join(output, 'nested'));
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(path.join(output, 'nested'));
    fs.commit(() => {
      expect(filesystem.existsSync(file)).toBeFalsy();
      done();
    });
  });

  it('reset file status after commiting', done => {
    fs.commit(() => {
      expect(fs.store.get(path.join(output, '/file-a.txt')).state).toBeUndefined();
      done();
    });
  });

  it('does not commit files who are deleted before being commited', done => {
    fs.write('to-delete', 'foo');
    fs.delete('to-delete');
    fs.copy(path.join(__dirname, 'fixtures/file-a.txt'), 'copy-to-delete');
    fs.delete('copy-to-delete');

    fs.store.get('to-delete');
    fs.commit([
      through.obj(function (file, enc, cb) {
        expect(file.path).not.toEqual(path.resolve('to-delete'));
        expect(file.path).not.toEqual(path.resolve('copy-to-delete'));

        this.push(file);
        cb();
      })
    ], done);
  });
});
