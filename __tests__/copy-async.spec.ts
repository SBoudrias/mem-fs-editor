import { describe, beforeEach, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

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
    await memFs.copyAsync(filepath, newPath, {
      fileTransform(destPath: string, sourcePath: string, fileContents: Buffer): [string, Buffer] {
        expect(destPath).toBe(path.resolve(newPath));
        expect(sourcePath).toBe(filepath);
        expect(fileContents).toBeInstanceOf(Buffer);
        return [transformedPath, Buffer.from(contents)];
      },
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
      .fn()
      .mockImplementation((destPath: string, sourcePath: string, contents: Buffer): [string, Buffer] => [
        destPath,
        contents,
      ]);
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
});
