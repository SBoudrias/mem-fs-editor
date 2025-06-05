import { describe, beforeEach, it, expect, vi } from 'vitest';
import os from 'os';
import path, { resolve } from 'path';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import normalize from 'normalize-path';
import { getFixture } from './fixtures.js';
import multimatch from 'multimatch';
import { globSync } from 'tinyglobby';

vi.mock('multimatch', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return { ...actual, default: vi.fn().mockImplementation(actual.default) };
});

vi.mock('tinyglobby', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return { ...actual, globSync: vi.fn().mockImplementation(actual.globSync) };
});

describe('#copyTpl()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('copy file and process contents as underscore template', () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    memFs.copyTpl(filepath, newPath, { name: 'new content' });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL);
  });

  it('allow setting custom template delimiters', () => {
    const filepath = getFixture('file-tpl-custom-delimiter.txt');
    const newPath = '/new/path/file.txt';
    memFs.copyTpl(
      filepath,
      newPath,
      { name: 'mustache' },
      {
        delimiter: '?',
      },
    );
    expect(memFs.read(newPath)).toBe('mustache' + os.EOL);
  });

  it('allow including partials', () => {
    const filepath = getFixture('file-tpl-include.txt');
    const newPath = '/new/path/file.txt';
    memFs.copyTpl(filepath, newPath);
    expect(memFs.read(newPath)).toBe('partial' + os.EOL + os.EOL);
  });

  it('allow appending files', () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file-append.txt';
    memFs.copyTpl(filepath, newPath, { name: 'new content' });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL);
    memFs.copyTpl(filepath, newPath, { name: 'new content' }, undefined, {
      append: true,
    });
    expect(memFs.read(newPath)).toBe('new content' + os.EOL + 'new content' + os.EOL);
  });

  it('should pass globOptions to glob', () => {
    const globOptions = { debug: false } as const;
    const filepath = getFixture('file-tpl-partial.*');
    memFs.copyTpl([filepath], '/new/path/', {}, {}, { globOptions, fromBasePath: getFixture() });

    expect(globSync).toHaveBeenCalledWith([normalize(filepath)], expect.objectContaining(globOptions));
  });

  it('should fail when passing noGlob and globOptions', () => {
    expect(() => {
      memFs.copyTpl(['foo'], '/new/path/', {}, {}, { globOptions: { debug: false }, noGlob: true });
    }).toThrowError('`noGlob` and `globOptions` are mutually exclusive');
  });

  it('should pass storeMatchOptions to multimatch', () => {
    const storeMatchOptions = { debug: false } as const;
    const filepath = getFixture('file-tpl-partial.*');
    memFs.copyTpl([filepath], '/new/path/', {}, {}, { storeMatchOptions, fromBasePath: getFixture() });

    expect(multimatch).toHaveBeenCalledWith(expect.any(Array), [normalize(filepath)], storeMatchOptions);
  });

  it('should fail when passing noGlob and storeMatchOptions', () => {
    expect(() => {
      memFs.copyTpl(['foo'], '/new/path/', {}, {}, { storeMatchOptions: { debug: false }, noGlob: true });
    }).toThrowError('`noGlob` and `storeMatchOptions` are mutually exclusive');
  });

  it('perform no substitution on binary files', () => {
    const filepath = getFixture('file-binary.bin');
    const newPath = '/new/path/file.bin';
    memFs.copyTpl(filepath, newPath);
    expect(memFs.read(newPath)).toBe(memFs.read(filepath));
  });

  it('perform no substitution on binary files from memory file store', () => {
    const filepath = getFixture('file-binary.bin');
    const pathCopied = path.resolve('/new/path/file-inmemory.bin');
    const newPath = '/new/path/file.bin';
    memFs.copy(filepath, pathCopied);
    memFs.copyTpl(pathCopied, newPath);
    expect(memFs.read(newPath)).toBe(memFs.read(filepath));
  });

  it('allow passing circular function context', () => {
    const b = {} as any;
    const a = { name: 'new content', b };
    b.a = a;
    const filepath = getFixture('file-circular.txt');
    const newPath = '/new/path/file.txt';
    memFs.copyTpl(
      filepath,
      newPath,
      {},
      {
        context: { a },
      },
    );
    expect(memFs.read(newPath)).toBe('new content new content' + os.EOL);
  });

  it('removes ejs extension when globbing', () => {
    const filepath = getFixture('ejs');
    const newPath = '/new/path/';
    memFs.copyTpl(filepath, newPath);
    expect(memFs.exists(path.join(newPath, 'file-ejs-extension.txt'))).toBeTruthy();
  });

  it("doens't removes ejs extension when not globbing", () => {
    const filepath = getFixture('ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    memFs.copyTpl(filepath, newPath);
    expect(memFs.exists(newPath)).toBeTruthy();
  });

  it('keeps template path in file history', () => {
    const filepath = getFixture('ejs/file-ejs-extension.txt.ejs');
    const newPath = '/new/path/file-ejs-extension.txt.ejs';
    memFs.copyTpl(filepath, newPath);
    expect(memFs.store.get(newPath).history).toMatchObject([resolve(filepath), resolve(newPath)]);
  });
});
