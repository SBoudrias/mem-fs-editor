import { describe, beforeEach, it, expect, expectTypeOf } from 'vitest';
import os from 'os';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

const fileA = getFixture('file-a.txt');

describe('#read()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('read the content of a file', () => {
    const content = memFs.read(fileA);
    expectTypeOf(content).toEqualTypeOf<string>();
    expect(content).toBe('foo' + os.EOL);
  });

  it('get the buffer content of a file', () => {
    const content = memFs.read(fileA, { raw: true });
    expectTypeOf(content).toEqualTypeOf<Buffer>();
    expect(content).toBeInstanceOf(Buffer);
    expect(content.toString()).toBe('foo' + os.EOL);
  });

  it('throws if file does not exist', () => {
    expect(() => {
      memFs.read('file-who-does-not-exist.txt');
    }).toThrow();
  });

  it('throws if file is deleted', () => {
    memFs.delete(fileA);
    expect(() => {
      memFs.read('file-who-does-not-exist.txt');
    }).toThrow();
  });

  it('returns defaults as String if file does not exist and defaults is provided', () => {
    const content = memFs.read('file-who-does-not-exist.txt', {
      defaults: 'foo' + os.EOL,
    });
    expectTypeOf(content).toEqualTypeOf<string>();
    expect(content).toBe('foo' + os.EOL);
  });

  it('returns defaults as String if file does not exist and defaults is provided as empty string', () => {
    const content = memFs.read('file-who-does-not-exist.txt', { defaults: '' });
    expectTypeOf(content).toEqualTypeOf<string>();
    expect(content).toBe('');
  });

  it('returns defaults as Buffer if file does not exist and defaults is provided', () => {
    const content = memFs.read('file-who-does-not-exist.txt', {
      defaults: Buffer.from('foo' + os.EOL),
      raw: true,
    });
    expectTypeOf(content).toEqualTypeOf<Buffer | Buffer<ArrayBuffer>>();
    expect(content).toBeInstanceOf(Buffer);
    expect(content.toString()).toBe('foo' + os.EOL);
  });

  it('returns defaults if file is deleted', () => {
    memFs.delete(fileA);
    const content = memFs.read(fileA, { defaults: 'foo' });
    expectTypeOf(content).toEqualTypeOf<string>();
    expect(content).toBe('foo');
  });

  it('allows defaults to be null', () => {
    const content = memFs.read('not-existing.file', { defaults: null });
    expectTypeOf(content).toEqualTypeOf<string | null>();
    expect(content).toBeNull();
  });
});
