'use strict';

const os = require('os');
const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

describe('#appendTpl()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('appends to file and processes contents as underscore template', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const orginalContent = fs.read(filepath).toString();
    const contentPath = path.join(__dirname, 'fixtures/file-tpl.txt');
    const contents = fs.read(contentPath);
    fs.appendTpl(filepath, contents, {
      name: 'bar'
    });
    expect(fs.read(filepath)).toBe(orginalContent + 'bar' + os.EOL);
  });

  it('allows setting custom template delimiters', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const orginalContent = fs.read(filepath).toString();
    const contentPath = path.join(__dirname, 'fixtures/file-tpl-custom-delimiter.txt');
    const contents = fs.read(contentPath);
    fs.appendTpl(filepath, contents, {
      name: 'bar'
    },
    {
      delimiter: '?'
    });
    expect(fs.read(filepath)).toBe(orginalContent + 'bar' + os.EOL);
  });

  it('throws an exception when no template data passed', () => {
    const f = () => {
      const filepath = path.join(__dirname, 'fixtures/file-a.txt');
      const contentPath = path.join(__dirname, 'fixtures/file-tpl.txt');
      const contents = fs.read(contentPath);
      fs.appendTpl(filepath, contents);
    };

    expect(f).toThrow(ReferenceError);
  });
});
