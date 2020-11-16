'use strict';

const os = require('os');
const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');
const normalize = require('normalize-path');

describe('#copyTpl()', () => {
  let store;
  let fs;

  beforeEach(function () {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('copy file and process contents as underscore template', () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath, {name: 'new content'});
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('allow setting custom template delimiters', function () {
    const filepath = path.join(__dirname, 'fixtures/file-tpl-custom-delimiter.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath, {name: 'mustache'}, {
      delimiter: '?'
    });
    expect(fs.read(newPath)).toBe('mustache' + os.EOL);
  });

  it('allow including partials', function () {
    const filepath = path.join(__dirname, 'fixtures/file-tpl-include.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath);
    expect(fs.read(newPath)).toBe('partial' + os.EOL + os.EOL);
  });

  it('allow including glob options', function () {
    const filenames = [
      path.join(__dirname, 'fixtures/file-tpl-partial.txt'),
      path.join(__dirname, 'fixtures/file-tpl.txt')
    ];
    const copyOptions = {
      globOptions: {
        ignore: [normalize(filenames[1])]
      }
    };
    const newPath = '/new/path';
    fs.copyTpl(filenames, newPath, {}, {}, copyOptions);
    expect(fs.exists(path.join(newPath, 'file-tpl-partial.txt'))).toBeTruthy();
    expect(fs.exists(path.join(newPath, 'file-tpl.txt'))).toBeFalsy();
  });

  it('perform no substitution on binary files', function () {
    const filepath = path.join(__dirname, 'fixtures/file-binary.bin');
    const newPath = '/new/path/file.bin';
    fs.copyTpl(filepath, newPath);
    expect(fs.read(newPath)).toBe(fs.read(filepath));
  });

  it('perform no substitution on binary files from memory file store', function () {
    const filepath = path.join(__dirname, 'fixtures/file-binary.bin');
    const pathCopied = path.resolve('/new/path/file-inmemory.bin');
    const newPath = '/new/path/file.bin';
    fs.copy(filepath, pathCopied);
    fs.copyTpl(pathCopied, newPath);
    expect(fs.read(newPath)).toBe(fs.read(filepath));
  });

  it('allow passing circular function context', function () {
    const b = {};
    const a = {name: 'new content', b};
    b.a = a;
    const filepath = path.join(__dirname, 'fixtures/file-circular.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath, {}, {
      context: {a}
    });
    expect(fs.read(newPath)).toBe('new content new content' + os.EOL);
  });

  it('removes ejs extension when globbing', function () {
    const filepath = path.join(__dirname, 'fixtures/ejs');
    const newPath = '/new/path/';
    fs.copyTpl(filepath, newPath);
    expect(fs.exists(path.join(newPath, 'file-ejs-extension.txt'))).toBeTruthy();
  });

  it('doens\'t removes ejs extension when not globbing', function () {
    const filepath = path.join(__dirname, 'fixtures/ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    fs.copyTpl(filepath, newPath);
    expect(fs.exists(newPath)).toBeTruthy();
  });
});
