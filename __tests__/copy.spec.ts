import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#copy()', () => {
  let memFs: MemFsEditor;
  let outputDir: string;

  beforeEach(async () => {
    memFs = create(createMemFs<MemFsEditorFile>());
    outputDir = path.join(os.tmpdir(), 'mem-fs-editor');
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('copy file', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const newPath = '/new/path/file.txt';
    memFs.copy(filepath, newPath);
    expect(memFs.read(newPath)).toBe(initialContents);
    expect(memFs.store.get(newPath).state).toBe('modified');
  });

  it('supports non-vinyl files', () => {
    const filepath = getFixture('file-a.txt');
    const { contents, path } = memFs.store.loadFile(filepath);
    const file = { contents, path };
    memFs.store.add(file);
    const newPath = '/new/path/file.txt';
    memFs.copy(filepath, newPath);
    expect(memFs.store.get(newPath).state).toBe('modified');
  });

  describe('using append option', () => {
    it('should append file to file already loaded', () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = memFs.read(filepath);
      const newPath = '/new/path/file.txt';

      memFs.copy(filepath, newPath, { append: true });
      expect(memFs.read(newPath)).toBe(initialContents);
      expect(memFs.store.get(newPath).state).toBe('modified');

      memFs.copy(filepath, newPath, { append: true });
      expect(memFs.read(newPath)).toBe(initialContents + initialContents);
    });
  });

  it('can copy directory not committed to disk', () => {
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
    expect(() => {
      memFs.copy(filepath, newPath);
    }).toThrow();
  });

  it('throws when trying to copy from a non-existing file with noGlob option', () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    expect(() => {
      memFs.copy(filepath, newPath, { noGlob: true });
    }).toThrow('Trying to copy from a source that does not exist: ');
  });

  it('transforms file path and contents using fileTransform', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const transformedPath = 'transformed/path/file.txt';
    const transformedContent = 'transformed content';

    memFs.copy(filepath, transformedPath, {
      fileTransform(destPath, _srcPath, contents) {
        expect(contents).toBeInstanceOf(Buffer);
        expect(contents.toString()).toBe(initialContents);
        expect(destPath).toBe(path.resolve(transformedPath));
        return [destPath, Buffer.from(transformedContent)];
      },
    });

    expect(memFs.read(transformedPath)).toBe(transformedContent);
  });

  it('uses default fileTransform when not provided', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = memFs.read(filepath);
    const destPath = 'new/path/file.txt';

    memFs.copy(filepath, destPath);

    expect(memFs.read(destPath)).toBe(initialContents);
  });

  it('copy by directory', () => {
    memFs.copy(getFixture(), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', () => {
    memFs.copy(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', () => {
    memFs.copy([getFixture('**'), '!**/*tpl*'], outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(() => {
      memFs.read(path.join(outputDir, 'file-tpl.txt'));
    }).toThrow();
  });

  it('copy files by globbing and process contents', () => {
    const fileTransform = vi.fn().mockImplementation((destPath, _srcPath, contents) => [destPath, contents]);
    memFs.copy(getFixture('**'), outputDir, { fileTransform });
    expect(fileTransform).toHaveBeenCalledTimes(13); // 10 total files under 'fixtures', not counting folders
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', () => {
    memFs.copy(getFixture('**'), outputDir);
    expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('requires destination directory when globbing', () => {
    expect(() => {
      memFs.copy(getFixture('**'), getFixture('file-a.txt'));
    }).toThrow();
  });

  it('preserve permissions', async () => {
    const filename = path.join(outputDir, 'perm.txt');
    const copyname = path.join(outputDir, 'copy-perm.txt');
    await fs.writeFile(filename, 'foo', { mode: 0o733 });

    memFs.copy(filename, copyname);

    await memFs.commit();
    const oldStat = await fs.stat(filename);
    const newStat = await fs.stat(copyname);
    expect(newStat.mode).toBe(oldStat.mode);
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
    memFs.copy(['file-a.txt', 'nested/file.txt'], outputDir, {
      fromBasePath: path.join(import.meta.dirname, 'fixtures'),
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('detects fromBasePath from common prefix', () => {
    const outputDir = getFixture('../../test/output');
    memFs.copy([getFixture('file-a.txt'), getFixture('nested/file.txt')], outputDir, {
      noGlob: true,
    });
    expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('provides source filepath to fileTransform', () => {
    const filepath = getFixture('file-tpl.txt');
    const newPath = '/new/path/file.txt';
    memFs.copy(filepath, newPath, {
      fileTransform(destPath: string, sourcePath: string, contents: Buffer): [string, Buffer] {
        // Verify that sourcePath is the original template file
        expect(sourcePath).toBe(filepath);
        // Verify that destPath is the target path
        expect(destPath).toBe(path.resolve(newPath));
        // Verify that content is the original file content
        expect(contents.toString().trim()).toBe('<%= name %>');
        // Return unmodified path and content
        return [destPath, contents];
      },
    });
  });
});
