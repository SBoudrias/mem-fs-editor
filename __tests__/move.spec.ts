import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import path from 'path';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#move()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs());
  });

  it('move file', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const newpath = '/new/path/file.txt';
    memFs.move(filepath, newpath);
    expect(memFs.read(newpath)).toBe(initialContents);
    expect(memFs.read.bind(memFs, filepath)).toThrow();
  });

  it('move directory', () => {
    const filename = 'file.txt';
    const dirpath = getFixture('nested');
    const filepath = path.join(dirpath, filename);
    const newdirpath = '/new/path';
    const newfilepath = path.join(newdirpath, filename);
    memFs.move(dirpath, newdirpath);
    expect(memFs.store.get(newfilepath).state).toBe('modified');
    expect(memFs.read.bind(memFs, filepath)).toThrow();
  });

  it('move file to an existing `to` path', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const newpath = getFixture('nested/file.txt');
    memFs.move(filepath, newpath);
    expect(memFs.read(newpath)).toBe(initialContents);
    expect(memFs.read.bind(memFs, filepath)).toThrow();
  });

  it('move directory to an existing `to` path (as a directory)', () => {
    const dirpath = getFixture('other');
    const filepath = getFixture('another.txt');
    const contents = 'another';
    const fromdir = getFixture('nested');

    memFs.write(filepath, contents);
    memFs.move(fromdir, dirpath);

    expect(memFs.read(path.join(dirpath, 'file.txt'))).toBe('nested' + os.EOL);
    expect(memFs.read(filepath)).toBe(contents);
    expect(memFs.read.bind(memFs, path.join(fromdir, 'file.txt'))).toThrow();
  });

  it('throws when moving directory to an existing `to` path (as a file)', () => {
    const filepath = getFixture('file-a.txt');
    const frompath = getFixture('nested');

    expect(memFs.move.bind(memFs, frompath, filepath)).toThrow();
  });
});
