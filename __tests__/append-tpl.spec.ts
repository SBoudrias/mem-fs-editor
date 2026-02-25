import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#appendTpl()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it("doesn't accept async EJS rendering", () => {
    expect(() => {
      memFs.appendTpl('', '', {}, { async: true });
    }).toThrowError('Async EJS rendering is not supported in appendTpl');
  });

  it('appends to file and processes contents as underscore template', () => {
    const filepath = getFixture('file-a.txt');
    const originalContent = memFs.read(filepath);
    const contentPath = getFixture('file-tpl.txt');
    const contents = memFs.read(contentPath);
    memFs.appendTpl(filepath, contents, {
      name: 'bar',
    });
    expect(memFs.read(filepath)).toBe(originalContent + 'bar' + os.EOL);
  });

  it('allows setting custom template delimiters', () => {
    const filepath = getFixture('file-a.txt');
    const originalContent = memFs.read(filepath);
    const contentPath = getFixture('file-tpl-custom-delimiter.txt');
    const contents = memFs.read(contentPath);
    memFs.appendTpl(filepath, contents, { name: 'bar' }, { delimiter: '?' });
    expect(memFs.read(filepath)).toBe(originalContent + 'bar' + os.EOL);
  });

  it('throws an exception when no template data passed', () => {
    const f = () => {
      const filepath = getFixture('file-a.txt');
      const contentPath = getFixture('file-tpl.txt');
      const contents = memFs.read(contentPath);
      memFs.appendTpl(filepath, contents);
    };

    expect(f).toThrow(ReferenceError);
  });
});
