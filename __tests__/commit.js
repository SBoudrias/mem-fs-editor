'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const memFs = require('mem-fs');
const editor = require('..');
const {createTransform} = require('../lib/util');

describe('#commit()', () => {
  const fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs;

  beforeEach(() => {
    filesystem.rmdirSync(fixtureDir, {recursive: true});
    store = memFs.create();
    fs = editor.create(store);
    filesystem.mkdirSync(fixtureDir, {recursive: true});

    // Create a 100 files to exercise the stream high water mark
    let i = 100;
    while (i--) {
      filesystem.writeFileSync(path.join(fixtureDir, 'file-' + i + '.txt'), 'foo');
    }

    fs.copy(fixtureDir + '/**', output);
    filesystem.rmdirSync(output, {recursive: true});
  });

  it('triggers callback when done', done => {
    fs.commit(done);
  });

  it('call filters and trigger callback on error', done => {
    let called = 0;

    let filter = createTransform(function (file, enc, cb) {
      called++;
      cb(new Error(`error ${called}`));
    });

    fs.commit([filter], error => {
      expect(called).toBe(1);
      expect(error.message).toBe('error 1');
      done();
    });
  });

  it('call filters and update memory model', done => {
    let called = 0;

    let filter = createTransform(function (file, enc, cb) {
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

  it('call filters, update memory model and commit selected files', done => {
    let called = 0;

    let filter = createTransform(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    let beforeFilter = createTransform(function (file, enc, cb) {
      if (file.path.endsWith('1.txt')) {
        this.push(file);
      }

      cb();
    });

    fs.commit([filter], store.stream().pipe(beforeFilter), () => {
      expect(called).toBe(10);
      expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
      expect(fs.read(path.join(output, 'file-2.txt'))).not.toBe('modified');
      expect(store.get(path.join(output, 'file-1.txt')).committed).toBeTruthy();
      expect(store.get(path.join(output, 'file-2.txt')).result).toBe(undefined);
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

  it('handle error when write fails', done => {
    filesystem.writeFileSync(output, 'foo');
    fs.commit(async error => {
      filesystem.unlinkSync(output);
      if (error) {
        done();
        return;
      }

      done(new Error('should not happen'));
    });
  });

  it('delete file from disk', done => {
    const file = path.join(output, 'delete.txt');
    filesystem.mkdirSync(output, {recursive: true});
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(file);
    fs.commit(() => {
      expect(filesystem.existsSync(file)).toBeFalsy();
      expect(store.get(file).committed).toBeTruthy();
      done();
    });
  });

  it('delete directories from disk', done => {
    const file = path.join(output, 'nested/delete.txt');
    filesystem.mkdirSync(path.join(output, 'nested'), {recursive: true});
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
      createTransform(function (file, enc, cb) {
        expect(file.path).not.toEqual(path.resolve('to-delete'));
        expect(file.path).not.toEqual(path.resolve('copy-to-delete'));

        this.push(file);
        cb();
      })
    ], done);
  });
});
