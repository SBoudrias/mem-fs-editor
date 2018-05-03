'use strict';

const os = require('os');
const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

describe('#move()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('move file', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const initialContents = fs.read(filepath);
    const newpath = '/new/path/file.txt';
    fs.move(filepath, newpath);
    expect(fs.read(newpath)).toBe(initialContents);
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move directory', () => {
    const filename = 'file.txt';
    const dirpath = path.join(__dirname, 'fixtures/nested');
    const filepath = path.join(dirpath, filename);
    const newdirpath = '/new/path';
    const newfilepath = path.join(newdirpath, filename);
    fs.move(dirpath, newdirpath);
    expect(fs.store.get(newfilepath).state).toBe('modified');
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move file to an existing `to` path', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const initialContents = fs.read(filepath);
    const newpath = path.join(__dirname, 'fixtures/nested/file.txt');
    fs.move(filepath, newpath);
    expect(fs.read(newpath)).toBe(initialContents);
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move directory to an existing `to` path (as a directory)', () => {
    const dirpath = path.join(__dirname, 'fixtures/other');
    const filepath = path.join(__dirname, 'another.txt');
    const contents = 'another';
    const fromdir = path.join(__dirname, 'fixtures/nested');

    fs.write(filepath, contents);
    fs.move(fromdir, dirpath);

    expect(fs.read(path.join(dirpath, 'file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.read.bind(fs, path.join(fromdir, 'file.txt'))).toThrow();
  });

  it('throws when moving directory to an existing `to` path (as a file)', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const frompath = path.join(__dirname, 'fixtures/nested');

    expect(fs.move.bind(fs, frompath, filepath)).toThrow();
  });
});
