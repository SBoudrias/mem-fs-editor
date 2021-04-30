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

  it('deletes existing files', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    fs.delete(filepath);
    expect(fs.read.bind(fs, filepath)).toThrow();

    const file = fs.store.get(filepath);
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes a directory with existing files', () => {
    const dirpath = path.join(__dirname, 'fixtures/nested');
    const nestedFile = path.join(dirpath, 'file.txt');
    fs.delete(dirpath);

    const file = fs.store.get(nestedFile);
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes new files', () => {
    fs.write('foo', 'foo');
    fs.delete('foo');

    const file = fs.store.get('foo');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes new directories', () => {
    fs.write('/test/bar/foo.txt', 'foo');
    fs.delete('/test/bar/');

    const file = fs.store.get('/test/bar/foo.txt');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('delete new files if specifying a full path', () => {
    fs.write('bar', 'bar');
    fs.delete(path.resolve('bar'));

    const file = fs.store.get('bar');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });
});
