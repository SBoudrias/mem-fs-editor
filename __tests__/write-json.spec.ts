import { describe, beforeEach, it, expect, vi } from 'vitest';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#writeJSON()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs());
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    vi.spyOn(memFs, 'write');
    memFs.writeJSON(filepath, contents, null, 2);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify(contents, null, 2) + '\n');
  });

  it('defaults indentation to 2 if stringify argument is not provided', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    vi.spyOn(memFs, 'write');
    memFs.writeJSON(filepath, contents);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify(contents, null, 2) + '\n');
  });

  it('write json object to a new file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    memFs.writeJSON(filepath, contents);
    expect(memFs.read(filepath)).toBe(JSON.stringify(contents, null, 2) + '\n');
  });

  it('write json object to an existing file', () => {
    const filepath = getFixture('file.json');
    const contents = { bar: 'foo' };
    memFs.writeJSON(filepath, contents);
    expect(memFs.read(filepath)).toBe(JSON.stringify(contents, null, 2) + '\n');
  });

  it('calls write() with stringified JSON object', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    vi.spyOn(memFs, 'write');
    memFs.writeJSON(filepath, contents);
    expect(memFs.write).toHaveBeenCalledTimes(1);
    expect(memFs.write).toHaveBeenCalledWith(filepath, JSON.stringify(contents, null, 2) + '\n');
  });
});
