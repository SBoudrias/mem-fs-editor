import { describe, beforeEach, it, expect } from 'vitest';
import path from 'path';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#delete()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('deletes existing files', () => {
    const filepath = getFixture('file-a.txt');
    fs.delete(filepath);
    expect(fs.read.bind(fs, filepath)).toThrow();

    const file = fs.store.get(filepath);
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes a directory with existing files', () => {
    const dirpath = getFixture('nested');
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
