import os from 'os';
import path from 'path';
import editor from '../lib/index.js';
import memFs from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#move()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('move file', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = fs.read(filepath);
    const newpath = '/new/path/file.txt';
    fs.move(filepath, newpath);
    expect(fs.read(newpath)).toBe(initialContents);
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move directory', () => {
    const filename = 'file.txt';
    const dirpath = getFixture('nested');
    const filepath = path.join(dirpath, filename);
    const newdirpath = '/new/path';
    const newfilepath = path.join(newdirpath, filename);
    fs.move(dirpath, newdirpath);
    expect(fs.store.get(newfilepath).state).toBe('modified');
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move file to an existing `to` path', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = fs.read(filepath);
    const newpath = getFixture('nested/file.txt');
    fs.move(filepath, newpath);
    expect(fs.read(newpath)).toBe(initialContents);
    expect(fs.read.bind(fs, filepath)).toThrow();
  });

  it('move directory to an existing `to` path (as a directory)', () => {
    const dirpath = getFixture('other');
    const filepath = getFixture('another.txt');
    const contents = 'another';
    const fromdir = getFixture('nested');

    fs.write(filepath, contents);
    fs.move(fromdir, dirpath);

    expect(fs.read(path.join(dirpath, 'file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.read.bind(fs, path.join(fromdir, 'file.txt'))).toThrow();
  });

  it('throws when moving directory to an existing `to` path (as a file)', () => {
    const filepath = getFixture('file-a.txt');
    const frompath = getFixture('nested');

    expect(fs.move.bind(fs, frompath, filepath)).toThrow();
  });
});
