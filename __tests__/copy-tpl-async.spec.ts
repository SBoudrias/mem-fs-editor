import { describe, beforeEach, it, expect, vi } from 'vitest';
import os from 'os';
import path, { resolve } from 'path';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';
import multimatch from 'multimatch';
import { glob } from 'tinyglobby';
import normalizePath from 'normalize-path';

vi.mock('multimatch', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return { ...actual, default: vi.fn().mockImplementation(actual.default) };
});

vi.mock('tinyglobby', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return { ...actual, glob: vi.fn().mockImplementation(actual.glob) };
});

describe('#copyTplAsync()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
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

  it('fallback to memory file with array', async () => {
    const filepath = getFixture('file-tpl.txt');
    await memFs.copyAsync(filepath, filepath + '.mem');
    const newPath = '/new/path/';
    await memFs.copyTplAsync([filepath + '.mem'], newPath, { name: 'new content' });
    expect(memFs.read(`${newPath}file-tpl.txt.mem`)).toBe('new content' + os.EOL);
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

  it('should pass globOptions to glob', async () => {
    const globOptions = { debug: false } as const;
    const filepath = getFixture('file-tpl-partial.*');
    await memFs.copyTplAsync([filepath], '/new/path/', {}, {}, { globOptions, fromBasePath: getFixture() });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    expect(glob).toHaveBeenCalledWith([normalizePath(filepath)], expect.objectContaining(globOptions));
  });

  it('should fail when passing noGlob and globOptions', async () => {
    await expect(
      memFs.copyTplAsync(['foo'], '/new/path/', {}, {}, { globOptions: { debug: false }, noGlob: true }),
    ).rejects.toThrowError('`noGlob` and `globOptions` are mutually exclusive');
  });

  it('should pass storeMatchOptions to multimatch', async () => {
    const storeMatchOptions = { debug: false } as const;
    const filepath = getFixture('file-tpl-partial.*');
    await memFs.copyTplAsync([filepath], '/new/path/', {}, {}, { storeMatchOptions, fromBasePath: getFixture() });

    expect(multimatch).toHaveBeenCalledWith(expect.any(Array), [normalizePath(filepath)], storeMatchOptions);
  });

  it('should fail when passing noGlob and storeMatchOptions', async () => {
    await expect(
      memFs.copyTplAsync(['foo'], '/new/path/', {}, {}, { storeMatchOptions: { debug: false }, noGlob: true }),
    ).rejects.toThrowError('`noGlob` and `storeMatchOptions` are mutually exclusive');
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

  it('keeps template path in file history', async () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    await memFs.copyTplAsync(filepath, newPath, { name: 'new content' });
    expect(memFs.store.get(newPath).history).toMatchObject([resolve(filepath), resolve(newPath)]);
  });
});
