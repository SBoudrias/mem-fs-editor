'use strict';

const os = require('os');
const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');
const normalize = require('normalize-path');

describe('#copyTpl()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('copy file and process contents as underscore template', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl.txt');
    const newPath = '/new/path/file.txt';
    await fs.copyTplAsync(filepath, newPath, {name: 'new content'});
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('fallback to memory file', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl.txt');
    await fs.copyAsync(filepath, filepath + '.mem');
    const newPath = '/new/path/file.txt';
    await fs.copyTplAsync(filepath + '.mem', newPath, {name: 'new content'});
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('allow setting custom template delimiters', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl-custom-delimiter.txt');
    const newPath = '/new/path/file.txt';
    await fs.copyTplAsync(filepath, newPath, {name: 'mustache'}, {
      delimiter: '?',
    });
    expect(fs.read(newPath)).toBe('mustache' + os.EOL);
  });

  it('allow including partials', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl-include.txt');
    const newPath = '/new/path/file.txt';
    await fs.copyTplAsync(filepath, newPath);
    expect(fs.read(newPath)).toBe('partial' + os.EOL + os.EOL);
  });

  it('allow appending files', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-tpl.txt');
    const newPath = '/new/path/file-append.txt';
    await fs.copyTplAsync(filepath, newPath, {name: 'new content'});
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
    await fs.copyTplAsync(filepath, newPath, {name: 'new content'}, undefined, {append: true});
    expect(fs.read(newPath)).toBe('new content' + os.EOL + 'new content' + os.EOL);
  });

  it('allow including glob options', async () => {
    const filenames = [
      path.join(__dirname, 'fixtures/file-tpl-partial.txt'),
      path.join(__dirname, 'fixtures/file-tpl.txt'),
    ];
    const copyOptions = {
      globOptions: {
        ignore: [normalize(filenames[1])],
      },
    };
    const newPath = '/new/path';
    await fs.copyTplAsync(filenames, newPath, {}, {}, copyOptions);
    expect(fs.exists(path.join(newPath, 'file-tpl-partial.txt'))).toBeTruthy();
    expect(fs.exists(path.join(newPath, 'file-tpl.txt'))).toBeFalsy();
  });

  it('perform no substitution on binary files', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-binary.bin');
    const newPath = '/new/path/file.bin';
    await fs.copyTplAsync(filepath, newPath);
    expect(fs.read(newPath)).toBe(fs.read(filepath));
  });

  it('allow passing circular function context', async () => {
    const b = {};
    const a = {name: 'new content', b};
    b.a = a;
    const filepath = path.join(__dirname, 'fixtures/file-circular.txt');
    const newPath = '/new/path/file.txt';
    await fs.copyTplAsync(filepath, newPath, {}, {
      context: {a},
    });
    expect(fs.read(newPath)).toBe('new content new content' + os.EOL);
  });

  it('removes ejs extension when globbing', async () => {
    const filepath = path.join(__dirname, 'fixtures/ejs');
    const newPath = '/new/path/';
    await fs.copyTplAsync(filepath, newPath);
    expect(fs.exists(path.join(newPath, 'file-ejs-extension.txt'))).toBeTruthy();
  });

  it('doens\'t removes ejs extension when not globbing', async () => {
    const filepath = path.join(__dirname, 'fixtures/ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    await fs.copyTplAsync(filepath, newPath);
    expect(fs.exists(newPath)).toBeTruthy();
  });
});
