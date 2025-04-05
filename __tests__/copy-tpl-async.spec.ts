import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import path, { resolve } from 'path';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import normalize from 'normalize-path';
import { getFixture } from './fixtures.js';

describe('#copyTpl()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs());
  });

  it('copy file and process contents as underscore template', async () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(filepath, newPath, { name: 'new content' });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('fallback to memory file', async () => {
    const filepath = getFixture('file-tpl.txt');
    await memFs.copyAsync(filepath, filepath + '.mem');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(filepath + '.mem', newPath, { name: 'new content' });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('allow setting custom template delimiters', async () => {
    const filepath = getFixture('file-tpl-custom-delimiter.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(
      filepath,
      newPath,
      { name: 'mustache' },
      {
        delimiter: '?',
      },
    );
    expect(memFs.read(newPath)).toBe('mustache' + os.EOL);
  });

  it('allow including partials', async () => {
    const filepath = getFixture('file-tpl-include.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(filepath, newPath);
    expect(memFs.read(newPath)).toBe('partial' + os.EOL + os.EOL);
  });

  it('allow appending files', async () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file-append.txt';
    await memFs.copyTplAsync(filepath, newPath, { name: 'new content' });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL);
    await memFs.copyTplAsync(filepath, newPath, { name: 'new content' }, undefined, {
      append: true,
    });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL + 'new content' + os.EOL);
  });

  it('allow including glob options', async () => {
    const filenames = [getFixture('file-tpl-partial.txt'), getFixture('file-tpl.txt')];
    const copyOptions = {
      globOptions: {
        ignore: [normalize(filenames[1])],
      },
    };
    const newPath = '/new/path';
    await memFs.copyTplAsync(filenames, newPath, {}, {}, copyOptions);
    expect(memFs.exists(path.join(newPath, 'file-tpl-partial.txt'))).toBeTruthy();
    expect(memFs.exists(path.join(newPath, 'file-tpl.txt'))).toBeFalsy();
  });

  it('perform no substitution on binary files', async () => {
    const filepath = getFixture('file-binary.bin');
    const newPath = '/new/path/file.bin';
    await memFs.copyTplAsync(filepath, newPath);
    expect(memFs.read(newPath)).toBe(memFs.read(filepath));
  });

  it('allow passing circular function context', async () => {
    const b = {} as any;
    const a = { name: 'new content', b };
    b.a = a;
    const filepath = getFixture('file-circular.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(
      filepath,
      newPath,
      {},
      {
        context: { a },
      },
    );
    expect(memFs.read(newPath)).toBe('new content new content' + os.EOL);
  });

  it('removes ejs extension when globbing', async () => {
    const filepath = getFixture('ejs');
    const newPath = '/new/path/';
    await memFs.copyTplAsync(filepath, newPath);
    expect(memFs.exists(path.join(newPath, 'file-ejs-extension.txt'))).toBeTruthy();
  });

  it("doens't removes ejs extension when not globbing", async () => {
    const filepath = getFixture('ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    await memFs.copyTplAsync(filepath, newPath);
    expect(memFs.exists(newPath)).toBeTruthy();
  });

  it('keeps template path in file history', async () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(filepath, newPath, { name: 'new content' });
    expect(memFs.store.get(newPath).history).toMatchObject([resolve(filepath), resolve(newPath)]);
  });
});
