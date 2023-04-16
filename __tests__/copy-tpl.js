import os from 'os';
import path from 'path';
import editor from '../lib/index.js';
import memFs from 'mem-fs';
import normalize from 'normalize-path';
import { getFixture } from './fixtures.js';

describe('#copyTpl()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('copy file and process contents as underscore template', () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath, { name: 'new content' });
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('allow setting custom template delimiters', () => {
    const filepath = getFixture('file-tpl-custom-delimiter.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(
      filepath,
      newPath,
      { name: 'mustache' },
      {
        delimiter: '?',
      }
    );
    expect(fs.read(newPath)).toBe('mustache' + os.EOL);
  });

  it('allow including partials', () => {
    const filepath = getFixture('file-tpl-include.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(filepath, newPath);
    expect(fs.read(newPath)).toBe('partial' + os.EOL + os.EOL);
  });

  it('allow appending files', () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file-append.txt';
    fs.copyTpl(filepath, newPath, { name: 'new content' });
    expect(fs.read(newPath)).toBe('new content' + os.EOL);
    fs.copyTpl(filepath, newPath, { name: 'new content' }, undefined, {
      append: true,
    });
    expect(fs.read(newPath)).toBe('new content' + os.EOL + 'new content' + os.EOL);
  });

  it('allow including glob options', () => {
    const filenames = [getFixture('file-tpl-partial.txt'), getFixture('file-tpl.txt')];
    const copyOptions = {
      globOptions: {
        ignore: [normalize(filenames[1])],
      },
    };
    const newPath = '/new/path';
    fs.copyTpl(filenames, newPath, {}, {}, copyOptions);
    expect(fs.exists(path.join(newPath, 'file-tpl-partial.txt'))).toBeTruthy();
    expect(fs.exists(path.join(newPath, 'file-tpl.txt'))).toBeFalsy();
  });

  it('perform no substitution on binary files', () => {
    const filepath = getFixture('file-binary.bin');
    const newPath = '/new/path/file.bin';
    fs.copyTpl(filepath, newPath);
    expect(fs.read(newPath)).toBe(fs.read(filepath));
  });

  it('perform no substitution on binary files from memory file store', () => {
    const filepath = getFixture('file-binary.bin');
    const pathCopied = path.resolve('/new/path/file-inmemory.bin');
    const newPath = '/new/path/file.bin';
    fs.copy(filepath, pathCopied);
    fs.copyTpl(pathCopied, newPath);
    expect(fs.read(newPath)).toBe(fs.read(filepath));
  });

  it('allow passing circular function context', () => {
    const b = {};
    const a = { name: 'new content', b };
    b.a = a;
    const filepath = getFixture('file-circular.txt');
    const newPath = '/new/path/file.txt';
    fs.copyTpl(
      filepath,
      newPath,
      {},
      {
        context: { a },
      }
    );
    expect(fs.read(newPath)).toBe('new content new content' + os.EOL);
  });

  it('removes ejs extension when globbing', () => {
    const filepath = getFixture('ejs');
    const newPath = '/new/path/';
    fs.copyTpl(filepath, newPath);
    expect(fs.exists(path.join(newPath, 'file-ejs-extension.txt'))).toBeTruthy();
  });

  it("doens't removes ejs extension when not globbing", () => {
    const filepath = getFixture('ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    fs.copyTpl(filepath, newPath);
    expect(fs.exists(newPath)).toBeTruthy();
  });
});
