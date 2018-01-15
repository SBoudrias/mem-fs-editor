'use strict';

const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

describe('#delete()', () => {
  let store;
  let fs;

  beforeEach(function () {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('deletes a file', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    fs.delete(filepath);
    expect(fs.read.bind(fs, filepath)).toThrow();
    expect(fs.store.get(filepath).state).toBe('deleted');
  });

  it('deletes a directory', () => {
    const dirpath = path.join(__dirname, 'fixtures/nested');
    const nestedFile = path.join(dirpath, 'file.txt');
    fs.delete(dirpath);
    expect(fs.store.get(nestedFile).state).toBe('deleted');
  });

  it('deletes new files', () => {
    fs.write('foo', 'foo');
    fs.delete('foo');
    expect(fs.store.get('foo').state).toBe('deleted');
  });

  it('deletes new directories', () => {
    fs.write('/test/bar/foo.txt', 'foo');
    fs.delete('/test/bar/');
    expect(fs.store.get('/test/bar/foo.txt').state).toBe('deleted');
  });

  it('after delete a file should set isNew flag on write', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    fs.delete(filepath);
    fs.write(filepath, 'foo');
    expect(fs.store.get(filepath).isNew).toBeTruthy();
  });

  it('delete new files if specifying a full path', () => {
    fs.write('bar', 'bar');
    fs.delete(path.resolve('bar'));
    expect(fs.store.get('bar').state).toBe('deleted');
  });
});
