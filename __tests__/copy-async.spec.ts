import { describe, beforeEach, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

type CopyAsyncFunction = MemFsEditor['copyAsync'];
type CopyAsyncOptions = NonNullable<Parameters<CopyAsyncFunction>[2]>;

describe('#copyAsync()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
  });

  it('copy file', async () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const newPath = '/new/path/file.txt';
    await memFs.copyAsync(filepath, newPath);
    expect(memFs.read(newPath)).toBe(initialContents);
    expect(memFs.store.get(newPath).state).toBe('modified');
  });

  it('throws when trying to copy from a non-existing file', async () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    await expect(memFs.copyAsync(filepath, newPath)).rejects.toThrow();
  });

  describe('using append option', () => {
    it('should append file to file already loaded', async () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = memFs.read(filepath);
      const newPath = '/new/path/file.txt';

      await memFs.copyAsync(filepath, newPath, { append: true });
      expect(memFs.read(newPath)).toBe(initialContents);
      expect(memFs.store.get(newPath).state).toBe('modified');

      await memFs.copyAsync(filepath, newPath, { append: true });
      expect(memFs.read(newPath)).toBe(initialContents + initialContents);
    });
  });

  it('can copy directory not committed to disk', async () => {
    const sourceDir = getFixture('../../test/foo');
    const destDir = getFixture('../../test/bar');
    memFs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    memFs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    await memFs.copyAsync(path.join(sourceDir, '**'), destDir);

    expect(memFs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(memFs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', async () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    await expect(memFs.copyAsync(filepath, newPath)).rejects.toThrow();
  });

  it('transforms file path and contents using fileTransform', async () => {
    const filepath = getFixture('file-a.txt');
    const contents = 'some processed contents';
    const newPath = getFixture('../../test/new/path/file.txt');
    const transformedPath = getFixture('../../test/transformed/path/file.txt');
    const transformOptions = { someOption: true };
    await memFs.copyAsync(filepath, newPath, {
      fileTransform({ destinationPath, sourcePath, contents: fileContents, options }) {
        expect(destinationPath).toBe(path.resolve(newPath));
        expect(sourcePath).toBe(filepath);
        expect(fileContents).toBeInstanceOf(Buffer);
        expect(options).toMatchObject({ someOption: true });
        return { path: transformedPath, contents: Buffer.from(contents) };
      },
      transformOptions,
    });
    expect(memFs.read(transformedPath)).toBe(contents);
  });

  it('copy by directory', async () => {
    const outputDir = getFixture('../../test/output');
    await memFs.copyAsync(getFixture(), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', async () => {
    const outputDir = getFixture('../../test/output');
    await memFs.copyAsync(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', async () => {
    const outputDir = getFixture('../../test/output');
    await memFs.copyAsync([getFixture('**'), '!**/*tpl*'], outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(() => {
      memFs.read(path.join(outputDir, 'file-tpl.txt'));
    }).toThrow();
  });

  it('transforms files when globbing', async () => {
    const outputDir = getFixture('../../test/output');
    const fileTransform = vi
      .fn<NonNullable<CopyAsyncOptions['fileTransform']>>()
      .mockImplementation(({ destinationPath, contents }) => ({ path: destinationPath, contents }));
    await memFs.copyAsync(getFixture('**'), outputDir, { fileTransform });
    expect(fileTransform).toHaveBeenCalledTimes(13); // 10 total files under 'fixtures', not counting folders
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', async () => {
    const outputDir = getFixture('../../test/out.put');
    await memFs.copyAsync(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('requires destination directory when globbing', async () => {
    await expect(memFs.copyAsync(getFixture('**'), getFixture('file-a.txt'))).rejects.toThrow();
  });

  it('preserve permissions', async () => {
    const filename = path.join(os.tmpdir(), 'perm.txt');
    const copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    fs.writeFileSync(filename, 'foo', { mode: 0o733 });

    await memFs.copyAsync(filename, copyname);

    await memFs.commit();
    const oldStat = fs.statSync(filename);
    const newStat = fs.statSync(copyname);
    expect(newStat.mode).toBe(oldStat.mode);
  });

  it('accepts fromBasePath', async () => {
    const outputDir = path.join(os.tmpdir(), 'mem-fs-editor');
    await memFs.copyAsync(['file-a.txt', 'nested/file.txt'], outputDir, {
      fromBasePath: path.join(import.meta.dirname, 'fixtures'),
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('detects fromBasePath from common prefix', async () => {
    const outputDir = getFixture('../../test/output');
    await memFs.copyAsync([getFixture('file-a.txt'), getFixture('nested/file.txt')], outputDir, {
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('provides correct parameters to fileTransform', async () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    const transformOptions = { async: true };
    const transformData = { someData: 123 };
    await memFs.copyAsync(filepath, newPath, {
      fileTransform({ destinationPath, sourcePath, contents, options, data }) {
        // Verify that sourcePath is the original template file
        expect(sourcePath).toBe(filepath);
        // Verify that destPath is the target path
        expect(destinationPath).toBe(path.resolve(newPath));
        // Verify that content is the original file content
        expect(contents.toString().trim()).toBe('<%= name %>');
        // Verify that options is the same as transformOptions
        expect(options).toMatchObject(transformOptions);
        // Verify that data is the same as transformData
        expect(data).toMatchObject(transformData);
        // Return unmodified path and content
        return { path: destinationPath, contents };
      },
      transformOptions,
      transformData,
    });
  });
});
