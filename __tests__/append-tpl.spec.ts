import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import editor from '../lib/index.js';
import memFs from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#appendTpl()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('appends to file and processes contents as underscore template', () => {
    const filepath = getFixture('file-a.txt');
    const orginalContent = fs.read(filepath).toString();
    const contentPath = getFixture('file-tpl.txt');
    const contents = fs.read(contentPath);
    fs.appendTpl(filepath, contents, {
      name: 'bar',
    });
    expect(fs.read(filepath)).toBe(orginalContent + 'bar' + os.EOL);
  });

  it('allows setting custom template delimiters', () => {
    const filepath = getFixture('file-a.txt');
    const orginalContent = fs.read(filepath).toString();
    const contentPath = getFixture('file-tpl-custom-delimiter.txt');
    const contents = fs.read(contentPath);
    fs.appendTpl(filepath, contents, { name: 'bar' }, { delimiter: '?' });
    expect(fs.read(filepath)).toBe(orginalContent + 'bar' + os.EOL);
  });

  it('throws an exception when no template data passed', () => {
    const f = () => {
      const filepath = getFixture('file-a.txt');
      const contentPath = getFixture('file-tpl.txt');
      const contents = fs.read(contentPath);
      fs.appendTpl(filepath, contents);
    };

    expect(f).toThrow(ReferenceError);
  });
});
