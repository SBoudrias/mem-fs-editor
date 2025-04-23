import { describe, beforeEach, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path, { dirname } from 'path';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('#copy()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('copy file', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const newPath = '/new/path/file.txt';
    memFs.copy(filepath, newPath);
    expect(memFs.read(newPath)).toBe(initialContents);
    expect(memFs.store.get(newPath).state).toBe('modified');
  });

  describe('using append option', () => {
    beforeEach(() => {
      vi.spyOn(memFs, 'append');
      vi.spyOn(memFs, '_write');
    });

    it('should append file to file already loaded', () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = memFs.read(filepath) ?? '';
      const newPath = '/new/path/file.txt';
      memFs.copy(filepath, newPath, { append: true });

      expect(memFs._write).toHaveBeenCalledTimes(1);
      expect(memFs.append).toHaveBeenCalledTimes(0);
      expect(memFs.read(newPath)).toBe(initialContents);
      expect(memFs.store.get(newPath).state).toBe('modified');

      memFs.copy(filepath, newPath, { append: true });

      expect(memFs._write).toHaveBeenCalledTimes(2);
      expect(memFs.append).toHaveBeenCalledTimes(1);
      expect(memFs.read(newPath)).toBe(initialContents + initialContents);
    });

    it('should throw if mem-fs is not compatible', () => {
      // @ts-expect-error - This is a legacy API
      memFs.store.existsInMemory = undefined;
      const filepath = getFixture('file-a.txt');
      const newPath = '/new/path/file.txt';
      expect(() => {
        memFs.copy(filepath, newPath, { append: true });
      }).toThrow();
    });
  });

  it('can copy directory not commited to disk', () => {
    const sourceDir = getFixture('../../test/foo');
    const destDir = getFixture('../../test/bar');
    memFs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    memFs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    memFs.copy(path.join(sourceDir, '**'), destDir);

    expect(memFs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(memFs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    expect(memFs.copy.bind(memFs, filepath, newPath)).toThrow();
  });

  it('copy file and process contents', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const contents = 'some processed contents';
    const newPath = getFixture('../../test/new/path/file.txt');
    memFs.copy(filepath, newPath, {
      process(contentsArg) {
        expect(contentsArg).toBeInstanceOf(Buffer);
        expect(contentsArg.toString()).toEqual(initialContents);
        return contents;
      },
    });
    expect(memFs.read(newPath)).toBe(contents);
  });

  it('copy by directory', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy(getFixture(), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy([getFixture('**'), '!**/*tpl*'], outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(memFs.read.bind(memFs, path.join(outputDir, 'file-tpl.txt'))).toThrow();
  });

  it('copy files by globbing and process contents', () => {
    const outputDir = getFixture('../../test/output');
    const process = vi.fn().mockImplementation((f) => f);
    memFs.copy(getFixture('**'), outputDir, { process });
    expect(process).toHaveBeenCalledTimes(13); // 10 total files under 'fixtures', not counting folders
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', () => {
    const outputDir = getFixture('../../test/out.put');
    memFs.copy(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts template paths', () => {
    const outputFile = getFixture('test/<%= category %>/file-a.txt');
    memFs.copy(getFixture('file-a.txt'), outputFile, {}, { category: 'foo' });
    expect(memFs.read(getFixture('test/foo/file-a.txt'))).toBe('foo' + os.EOL);
  });

  it('requires destination directory when globbing', () => {
    expect(memFs.copy.bind(memFs, getFixture('**'), getFixture('file-a.txt'))).toThrow();
  });

  it('preserve permissions', async () => {
    const copyFolder = path.join(os.tmpdir(), 'mem-fs-editor');
    fs.rmSync(copyFolder, { recursive: true, force: true });
    const filename = path.join(copyFolder, 'perm.txt');
    const copyname = path.join(copyFolder, 'copy-perm.txt');
    fs.mkdirSync(copyFolder, { recursive: true });
    fs.writeFileSync(filename, 'foo', { mode: 0o733 });

    memFs.copy(filename, copyname);

    await memFs.commit();
    const oldStat = fs.statSync(filename);
    const newStat = fs.statSync(copyname);
    expect(newStat.mode).toBe(oldStat.mode);

    fs.rmSync(copyFolder, { recursive: true, force: true });
  });

  it('copy with globbing disabled', () => {
    const newPath = getFixture('../../test/output', 'file.txt');
    memFs.copy(getFixture('file-(specia!-char$).txt'), newPath, {
      noGlob: true,
    });
    expect(memFs.read(newPath)).toBe('special' + os.EOL);
  });

  it('copy glob like file when noGlob', () => {
    const newPath = getFixture('../../test/output', 'file.txt');
    memFs.copy(getFixture('[file].txt'), newPath, {
      noGlob: true,
    });
    expect(memFs.read(newPath)).toBe('foo' + os.EOL);
  });

  it('accepts fromBasePath', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy(['file-a.txt', 'nested/file.txt'], outputDir, {
      fromBasePath: path.join(__dirname, 'fixtures'),
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts detects fromBasePath from common', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy([getFixture('file-a.txt'), getFixture('nested/file.txt')], outputDir, {
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });
});
