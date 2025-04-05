import { describe, beforeEach, it, expect } from 'vitest';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

const fileA = getFixture('file-a.txt');
const fileDelete = getFixture('deleteAfter');

describe('#exists()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it("file doesn't exist", () => {
    expect(memFs.exists('something that doesnt exist')).toBeFalsy();
  });

  it('file does exist', () => {
    memFs.read(fileA);
    expect(memFs.exists(fileA)).toBeTruthy();
  });

  it("file doesn't exist after delete", () => {
    memFs.write(fileDelete, 'some content');
    memFs.delete(fileDelete);
    expect(memFs.exists(fileDelete)).toBeFalsy();
  });
});
