import { describe, beforeEach, it, expect, afterEach } from 'vitest';
import filesystem from 'fs';
import os from 'os';
import path, { dirname } from 'path';
import sinon from 'sinon';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('#copy()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('copy file', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = fs.read(filepath);
    const newPath = '/new/path/file.txt';
    fs.copy(filepath, newPath);
    expect(fs.read(newPath)).toBe(initialContents);
    expect(fs.store.get(newPath).state).toBe('modified');
  });

  describe('using append option', () => {
    beforeEach(() => {
      sinon.spy(fs, 'append');
      sinon.spy(fs, 'write');
    });
    afterEach(() => {
      fs.write.restore();
      fs.append.restore();
    });

    it('should append file to file already loaded', () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = fs.read(filepath);
      const newPath = '/new/path/file.txt';
      fs.copy(filepath, newPath, { append: true });

      expect(fs.write.callCount).toBe(1);
      expect(fs.append.callCount).toBe(0);
      expect(fs.read(newPath)).toBe(initialContents);
      expect(fs.store.get(newPath).state).toBe('modified');

      fs.copy(filepath, newPath, { append: true });

      expect(fs.write.callCount).toBe(2);
      expect(fs.append.callCount).toBe(1);
      expect(fs.read(newPath)).toBe(initialContents + initialContents);
    });

    it('should throw if mem-fs is not compatible', () => {
      store.existsInMemory = undefined;
      const filepath = getFixture('file-a.txt');
      const newPath = '/new/path/file.txt';
      expect(() => fs.copy(filepath, newPath, { append: true })).toThrow();
    });
  });

  it('can copy directory not commited to disk', () => {
    const sourceDir = getFixture('../../test/foo');
    const destDir = getFixture('../../test/bar');
    fs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    fs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    fs.copy(path.join(sourceDir, '**'), destDir);

    expect(fs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(fs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    expect(fs.copy.bind(fs, filepath, newPath)).toThrow();
  });

  it('copy file and process contents', () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = fs.read(filepath);
    const contents = 'some processed contents';
    const newPath = getFixture('../../test/new/path/file.txt');
    fs.copy(filepath, newPath, {
      process(contentsArg) {
        expect(contentsArg).toBeInstanceOf(Buffer);
        expect(contentsArg.toString()).toEqual(initialContents);
        return contents;
      },
    });
    expect(fs.read(newPath)).toBe(contents);
  });

  it('copy by directory', () => {
    const outputDir = getFixture('../../test/output');
    fs.copy(getFixture(), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', () => {
    const outputDir = getFixture('../../test/output');
    fs.copy(getFixture('**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', () => {
    const outputDir = getFixture('../../test/output');
    fs.copy([getFixture('**'), '!**/*tpl*'], outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read.bind(fs, path.join(outputDir, 'file-tpl.txt'))).toThrow();
  });

  it('copy files by globbing and process contents', () => {
    const outputDir = getFixture('../../test/output');
    const process = sinon.stub().returnsArg(0);
    fs.copy(getFixture('**'), outputDir, { process });
    sinon.assert.callCount(process, 13); // 10 total files under 'fixtures', not counting folders
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', () => {
    const outputDir = getFixture('../../test/out.put');
    fs.copy(getFixture('**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts template paths', () => {
    const outputFile = getFixture('test/<%= category %>/file-a.txt');
    fs.copy(getFixture('file-a.txt'), outputFile, {}, { category: 'foo' });
    expect(fs.read(getFixture('test/foo/file-a.txt'))).toBe('foo' + os.EOL);
  });

  it('requires destination directory when globbing', () => {
    expect(fs.copy.bind(fs, getFixture('**'), getFixture('file-a.txt'))).toThrow();
  });

  it('preserve permissions', async () => {
    const filename = path.join(os.tmpdir(), 'perm.txt');
    const copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    filesystem.writeFileSync(filename, 'foo', { mode: parseInt(733, 8) });

    fs.copy(filename, copyname);

    await fs.commit();
    const oldStat = filesystem.statSync(filename);
    const newStat = filesystem.statSync(copyname);
    expect(newStat.mode).toBe(oldStat.mode);
  });

  it('copy with globbing disabled', () => {
    const newPath = getFixture('../../test/output', 'file.txt');
    fs.copy(getFixture('file-(specia!-char$).txt'), newPath, {
      noGlob: true,
    });
    expect(fs.read(newPath)).toBe('special' + os.EOL);
  });

  it('copy glob like file when noGlob', () => {
    const newPath = getFixture('../../test/output', 'file.txt');
    fs.copy(getFixture('[file].txt'), newPath, {
      noGlob: true,
    });
    expect(fs.read(newPath)).toBe('foo' + os.EOL);
  });

  it('accepts fromBasePath', () => {
    const outputDir = getFixture('../../test/output');
    fs.copy(['file-a.txt', 'nested/file.txt'], outputDir, {
      fromBasePath: path.join(__dirname, 'fixtures'),
      noGlob: true,
    });
    expect(fs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts detects fromBasePath from common', () => {
    const outputDir = getFixture('../../test/output');
    fs.copy([getFixture('file-a.txt'), getFixture('nested/file.txt')], outputDir, {
      noGlob: true,
    });
    expect(fs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });
});
