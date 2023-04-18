import { describe, beforeEach, it, expect } from 'vitest';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

const fileA = getFixture('file-a.txt');
const fileDelete = getFixture('deleteAfter');

describe('#exists()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it("file doesn't exist", () => {
    expect(fs.exists('something that doesnt exist')).toBeFalsy();
  });

  it('file does exist', () => {
    fs.read(fileA);
    expect(fs.exists(fileA)).toBeTruthy();
  });

  it("file doesn't exist after delete", () => {
    fs.write(fileDelete, 'some content');
    fs.delete(fileDelete);
    expect(fs.exists(fileDelete)).toBeFalsy();
  });
});
