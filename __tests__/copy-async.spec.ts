import { describe, beforeEach, it, expect, afterEach } from 'vitest';
import filesystem from 'fs';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import { MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#copyAsync()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('copy file', async () => {
    const filepath = getFixture('file-a.txt');
    const initialContents = fs.read(filepath);
    const newPath = '/new/path/file.txt';
    await fs.copyAsync(filepath, newPath);
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

    it('should append file to file already loaded', async () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = fs.read(filepath);
      const newPath = '/new/path/file.txt';
      await fs.copyAsync(filepath, newPath, { append: true });

      expect(fs.write.callCount).toBe(1);
      expect(fs.append.callCount).toBe(0);
      expect(fs.read(newPath)).toBe(initialContents);
      expect(fs.store.get(newPath).state).toBe('modified');

      await fs.copyAsync(filepath, newPath, { append: true });

      expect(fs.write.callCount).toBe(2);
      expect(fs.append.callCount).toBe(1);
      expect(fs.read(newPath)).toBe(initialContents + initialContents);
    });

    it('should throw if mem-fs is not compatible', async () => {
      store.existsInMemory = undefined;
      const filepath = getFixture('file-a.txt');
      const newPath = '/new/path/file.txt';
      expect(fs.copyAsync(filepath, newPath, { append: true, processFile: () => '' })).rejects.toEqual(
        new Error('Current mem-fs is not compatible with append'),
      );
    });
  });

  it('can copy directory not commited to disk', async () => {
    const sourceDir = getFixture('../../test/foo');
    const destDir = getFixture('../../test/bar');
    fs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    fs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    await fs.copyAsync(path.join(sourceDir, '**'), destDir);

    expect(fs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(fs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', async () => {
    const filepath = getFixture('does-not-exits');
    const newPath = getFixture('../../test/new/path/file.txt');
    expect(fs.copyAsync(filepath, newPath)).rejects.toThrow();
  });

  it('copy file and process contents', async () => {
    const filepath = getFixture('file-a.txt');
    const contents = 'some processed contents';
    const newPath = getFixture('../../test/new/path/file.txt');
    await fs.copyAsync(filepath, newPath, {
      processFile(filename) {
        expect(filename).toEqual(filepath);
        return contents;
      },
    });
    expect(fs.read(newPath)).toBe(contents);
  });

  it('copy by directory', async () => {
    const outputDir = getFixture('../../test/output');
    await fs.copyAsync(getFixture(), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', async () => {
    const outputDir = getFixture('../../test/output');
    await fs.copyAsync(getFixture('**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', async () => {
    const outputDir = getFixture('../../test/output');
    await fs.copyAsync([getFixture('**'), '!**/*tpl*'], outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read.bind(fs, path.join(outputDir, 'file-tpl.txt'))).toThrow();
  });

  it('copy files by globbing and process contents', async () => {
    const outputDir = getFixture('../../test/output');
    const processFile = sinon.stub().callsFake(function (from) {
      return this.store.get(from).contents;
    });
    await fs.copyAsync(getFixture('**'), outputDir, {
      processFile,
    });
    sinon.assert.callCount(processFile, 13); // 10 total files under 'fixtures', not counting folders
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', async () => {
    const outputDir = getFixture('../../test/out.put');
    await fs.copyAsync(getFixture('**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts template paths', async () => {
    const outputFile = getFixture('test/<%= category %>/file-a.txt');
    await fs.copyAsync(getFixture('file-a.txt'), outputFile, {}, { category: 'foo' });
    expect(fs.read(getFixture('test/foo/file-a.txt'))).toBe('foo' + os.EOL);
  });

  it('requires destination directory when globbing', async () => {
    expect(fs.copyAsync(getFixture('**'), getFixture('file-a.txt'))).rejects.toThrow();
  });

  it('preserve permissions', async () => {
    const filename = path.join(os.tmpdir(), 'perm.txt');
    const copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    filesystem.writeFileSync(filename, 'foo', { mode: parseInt(733, 8) });

    await fs.copyAsync(filename, copyname);

    await fs.commit();
    const oldStat = filesystem.statSync(filename);
    const newStat = filesystem.statSync(copyname);
    expect(newStat.mode).toBe(oldStat.mode);
  });
});
