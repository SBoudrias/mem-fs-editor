import { describe, beforeEach, it, expect, vi } from 'vitest';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#extendJSON()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('extends content of existing JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { b: 2 };

    vi.spyOn(memFs, 'write');
    vi.spyOn(memFs, 'readJSON').mockReturnValue({ a: 'a', b: 'b' });

    memFs.extendJSON(filepath, contents);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify({ a: 'a', b: 2 }, null, 2) + '\n');
  });

  it('writes to unexisting JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    vi.spyOn(memFs, 'write');
    memFs.extendJSON(filepath, contents);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify({ foo: 'bar' }, null, 2) + '\n');
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    vi.spyOn(memFs, 'write');
    memFs.extendJSON(filepath, contents, ['\n'], 4);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify(contents, ['\n'], 4) + '\n');
  });
});
