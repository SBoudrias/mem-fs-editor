import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';

describe('#write()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('appends new content to new file', () => {
    memFs.append('append.txt', 'b', { create: true });

    expect(memFs.read('append.txt')).toBe('b');
  });

  it('appends new content to file', () => {
    memFs.write('append.txt', 'a\n\n\n');
    memFs.append('append.txt', 'b');

    expect(memFs.read('append.txt')).toBe('a' + os.EOL + 'b');
  });

  it('allows specifying custom separator', () => {
    memFs.write('append.txt', 'a');
    memFs.append('append.txt', 'b', { separator: ', ' });

    expect(memFs.read('append.txt')).toBe('a, b');
  });

  it('allows disabling end trim', () => {
    memFs.write('append.txt', 'a\n\n');
    memFs.append('append.txt', 'b', { trimEnd: false });

    expect(memFs.read('append.txt')).toBe('a\n\n' + os.EOL + 'b');
  });
});
