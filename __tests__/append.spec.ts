import { describe, beforeEach, it, expect } from 'vitest';
import { EOL } from 'os';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';

describe('#append()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('appends new content to a new file', () => {
    memFs.append('append.txt', 'b', { create: true });

    expect(memFs.read('append.txt')).toBe('b');
  });

  it("fails if file doesn't exist", () => {
    expect(() => {
      memFs.append('append.txt', 'b', { create: false });
    }).toThrowErrorMatchingInlineSnapshot(`[Error: append.txt doesn't exist]`);
  });

  it("fails by default if file doesn't exist", () => {
    expect(() => {
      memFs.append('append.txt', 'b');
    }).toThrowErrorMatchingInlineSnapshot(`[Error: append.txt doesn't exist]`);
  });

  it('trims previous file and appends new content', () => {
    memFs.write('append.txt', 'a\n\n\n');
    memFs.append('append.txt', 'b');

    expect(memFs.read('append.txt')).toBe('a' + EOL + 'b');
  });

  it('allows specifying custom separator', () => {
    memFs.write('append.txt', 'a');
    memFs.append('append.txt', 'b', { separator: ', ' });

    expect(memFs.read('append.txt')).toBe('a, b');
  });

  it('disables end trim', () => {
    memFs.write('append.txt', 'a\n\n');
    memFs.append('append.txt', 'b', { trimEnd: false });

    expect(memFs.read('append.txt')).toBe('a\n\n' + EOL + 'b');
  });
});
