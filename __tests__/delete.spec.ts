import { describe, beforeEach, it, expect } from 'vitest';
import path from 'path';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#delete()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs());
  });

  it('deletes existing files', () => {
    const filepath = getFixture('file-a.txt');
    memFs.delete(filepath);
    expect(memFs.read.bind(memFs, filepath)).toThrow();

    const file = memFs.store.get(filepath);
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes a directory with existing files', () => {
    const dirpath = getFixture('nested');
    const nestedFile = path.join(dirpath, 'file.txt');
    memFs.delete(dirpath);

    const file = memFs.store.get(nestedFile);
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes new files', () => {
    memFs.write('foo', 'foo');
    memFs.delete('foo');

    const file = memFs.store.get('foo');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('deletes new directories', () => {
    memFs.write('/test/bar/foo.txt', 'foo');
    memFs.delete('/test/bar/');

    const file = memFs.store.get('/test/bar/foo.txt');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });

  it('delete new files if specifying a full path', () => {
    memFs.write('bar', 'bar');
    memFs.delete(path.resolve('bar'));

    const file = memFs.store.get('bar');
    expect(file.contents).toBe(null);
    expect(file.state).toBe('deleted');
  });
});
