import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import { MemFsEditor, create } from '../lib/index.js';
import { create as createMemFs } from 'mem-fs';

describe('#write()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('appends new content to new file', () => {
    fs.append('append.txt', 'b', { create: true });

    expect(fs.read('append.txt')).toBe('b');
  });

  it('appends new content to file', () => {
    fs.write('append.txt', 'a\n\n\n');
    fs.append('append.txt', 'b');

    expect(fs.read('append.txt')).toBe('a' + os.EOL + 'b');
  });

  it('allows specifying custom separator', () => {
    fs.write('append.txt', 'a');
    fs.append('append.txt', 'b', { separator: ', ' });

    expect(fs.read('append.txt')).toBe('a, b');
  });

  it('allows disabling end trim', () => {
    fs.write('append.txt', 'a\n\n');
    fs.append('append.txt', 'b', { trimEnd: false });

    expect(fs.read('append.txt')).toBe('a\n\n' + os.EOL + 'b');
  });
});
