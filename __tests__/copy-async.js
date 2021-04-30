'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const sinon = require('sinon');
const editor = require('..');
const memFs = require('mem-fs');

describe('#copyAsync()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('copy file', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
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
      const filepath = path.join(__dirname, 'fixtures/file-a.txt');
      const initialContents = fs.read(filepath);
      const newPath = '/new/path/file.txt';
      await fs.copyAsync(filepath, newPath, {append: true});

      expect(fs.write.callCount).toBe(1);
      expect(fs.append.callCount).toBe(0);
      expect(fs.read(newPath)).toBe(initialContents);
      expect(fs.store.get(newPath).state).toBe('modified');

      await fs.copyAsync(filepath, newPath, {append: true});

      expect(fs.write.callCount).toBe(2);
      expect(fs.append.callCount).toBe(1);
      expect(fs.read(newPath)).toBe(initialContents + initialContents);
    });

    it('should throw if mem-fs is not compatible', async () => {
      store.existsInMemory = undefined;
      const filepath = path.join(__dirname, 'fixtures/file-a.txt');
      const newPath = '/new/path/file.txt';
      expect(fs.copyAsync(filepath, newPath, {append: true, processFile: () => ''})).rejects.toEqual(new Error('Current mem-fs is not compatible with append'));
    });
  });

  it('can copy directory not commited to disk', async () => {
    let sourceDir = path.join(__dirname, '../test/foo');
    let destDir = path.join(__dirname, '../test/bar');
    fs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    fs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    await fs.copyAsync(path.join(sourceDir, '**'), destDir);

    expect(fs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(fs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', async () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exits');
    const newPath = path.join(__dirname, '../test/new/path/file.txt');
    expect(fs.copyAsync(filepath, newPath)).rejects.toThrow();
  });

  it('copy file and process contents', async () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const contents = 'some processed contents';
    const newPath = path.join(__dirname, '../test/new/path/file.txt');
    await fs.copyAsync(filepath, newPath, {
      processFile(filename) {
        expect(filename).toEqual(filepath);
        return contents;
      }
    });
    expect(fs.read(newPath)).toBe(contents);
  });

  it('copy by directory', async () => {
    let outputDir = path.join(__dirname, '../test/output');
    await fs.copyAsync(path.join(__dirname, '/fixtures'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', async () => {
    let outputDir = path.join(__dirname, '../test/output');
    await fs.copyAsync(path.join(__dirname, '/fixtures/**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', async () => {
    let outputDir = path.join(__dirname, '../test/output');
    await fs.copyAsync([path.join(__dirname, '/fixtures/**'), '!**/*tpl*'], outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read.bind(fs, path.join(outputDir, 'file-tpl.txt'))).toThrow();
  });

  it('copy files by globbing and process contents', async () => {
    let outputDir = path.join(__dirname, '../test/output');
    const processFile = sinon.stub().callsFake(function (from) {
      return this.store.get(from).contents;
    });
    await fs.copyAsync(path.join(__dirname, '/fixtures/**'), outputDir, {processFile});
    sinon.assert.callCount(processFile, 11); // 9 total files under 'fixtures', not counting folders
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', async () => {
    let outputDir = path.join(__dirname, '../test/out.put');
    await fs.copyAsync(path.join(__dirname, '/fixtures/**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts template paths', async () => {
    let outputFile = path.join(__dirname, 'test/<%= category %>/file-a.txt');
    await fs.copyAsync(
      path.join(__dirname, '/fixtures/file-a.txt'),
      outputFile,
      {},
      {category: 'foo'}
    );
    expect(
      fs.read(path.join(__dirname, 'test/foo/file-a.txt'))
    ).toBe('foo' + os.EOL);
  });

  it('requires destination directory when globbing', async () => {
    expect(
      fs.copyAsync(
        path.join(__dirname, '/fixtures/**'),
        path.join(__dirname, '/fixtures/file-a.txt')
      )
    ).rejects.toThrow();
  });

  it('preserve permissions', async done => {
    const filename = path.join(os.tmpdir(), 'perm.txt');
    const copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    filesystem.writeFileSync(filename, 'foo', {mode: parseInt(733, 8)});

    await fs.copyAsync(filename, copyname);

    fs.commit(() => {
      const oldStat = filesystem.statSync(filename);
      const newStat = filesystem.statSync(copyname);
      expect(newStat.mode).toBe(oldStat.mode);
      done();
    });
  });
});
