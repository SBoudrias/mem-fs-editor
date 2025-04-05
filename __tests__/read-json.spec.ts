import { describe, beforeEach, it, expect, vi } from 'vitest';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import escape from 'escape-regexp';
import { getFixture } from './fixtures.js';

describe('#readJSON()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('read the content of a file', () => {
    const obj = memFs.readJSON(getFixture('file.json')) as { foo: string };
    expect(obj.foo).toBe('bar');
  });

  it('calls read() with path', () => {
    vi.spyOn(memFs, 'read');

    const file = getFixture('file.json');
    memFs.readJSON(file);
    expect(memFs.read).toHaveBeenCalledTimes(1);
    expect(memFs.read).toHaveBeenCalledWith(file);
  });

  it('return defaults if file does not exist and defaults is provided', () => {
    const obj = memFs.readJSON(getFixture('no-such-file.json'), {
      foo: 'bar',
    }) as { foo: string };
    expect(obj.foo).toBe('bar');
  });

  it('throw error if file could not be parsed as JSON, even if defaults is provided', () => {
    expect(
      memFs.readJSON.bind(memFs, getFixture('file-tpl.txt'), {
        foo: 'bar',
      }),
    ).toThrow();
  });

  it('throw error with file path info', () => {
    const filePath = getFixture('file-tpl.txt');
    expect(
      memFs.readJSON.bind(
        memFs,
        // @ts-expect-error - Expecting it to throw
        new RegExp(escape(filePath)),
      ),
    ).toThrow();
  });
});
