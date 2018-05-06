'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const sinon = require('sinon');
const editor = require('..');
const memFs = require('mem-fs');

describe('#copy()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('copy file', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const initialContents = fs.read(filepath);
    const newPath = '/new/path/file.txt';
    fs.copy(filepath, newPath);
    expect(fs.read(newPath)).toBe(initialContents);
    expect(fs.store.get(newPath).state).toBe('modified');
  });

  it('can copy directory not commited to disk', () => {
    let sourceDir = path.join(__dirname, '../test/foo');
    let destDir = path.join(__dirname, '../test/bar');
    fs.write(path.join(sourceDir, 'file-a.txt'), 'a');
    fs.write(path.join(sourceDir, 'file-b.txt'), 'b');

    fs.copy(path.join(sourceDir, '**'), destDir);

    expect(fs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
    expect(fs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exits');
    const newPath = path.join(__dirname, '../test/new/path/file.txt');
    expect(fs.copy.bind(fs, filepath, newPath)).toThrow();
  });

  it('copy file and process contents', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const initialContents = fs.read(filepath);
    const contents = 'some processed contents';
    const newPath = path.join(__dirname, '../test/new/path/file.txt');
    fs.copy(filepath, newPath, {
      process(contentsArg) {
        expect(contentsArg).toBeInstanceOf(Buffer);
        expect(contentsArg.toString()).toEqual(initialContents);
        return contents;
      }
    });
    expect(fs.read(newPath)).toBe(contents);
  });

  it('copy by directory', () => {
    let outputDir = path.join(__dirname, '../test/output');
    fs.copy(path.join(__dirname, '/fixtures'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing', () => {
    let outputDir = path.join(__dirname, '../test/output');
    fs.copy(path.join(__dirname, '/fixtures/**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('copy by globbing multiple patterns', () => {
    let outputDir = path.join(__dirname, '../test/output');
    fs.copy([path.join(__dirname, '/fixtures/**'), '!**/*tpl*'], outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    expect(fs.read.bind(fs, path.join(outputDir, 'file-tpl.txt'))).toThrow();
  });

  it('copy files by globbing and process contents', () => {
    let outputDir = path.join(__dirname, '../test/output');
    const process = sinon.stub().returnsArg(0);
    fs.copy(path.join(__dirname, '/fixtures/**'), outputDir, {process});
    sinon.assert.callCount(process, 9); // 7 total files under 'fixtures', not counting folders
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('accepts directory name with "."', () => {
    let outputDir = path.join(__dirname, '../test/out.put');
    fs.copy(path.join(__dirname, '/fixtures/**'), outputDir);
    expect(fs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
    expect(fs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
  });

  it('requires destination directory when globbing', () => {
    expect(
      fs.copy.bind(
        fs,
        path.join(__dirname, '/fixtures/**'),
        path.join(__dirname, '/fixtures/file-a.txt')
      )
    ).toThrow();
  });

  it('preserve permissions', done => {
    const filename = path.join(os.tmpdir(), 'perm.txt');
    const copyname = path.join(os.tmpdir(), 'copy-perm.txt');
    filesystem.writeFileSync(filename, 'foo', {mode: parseInt(733, 8)});

    fs.copy(filename, copyname);

    fs.commit(() => {
      const oldStat = filesystem.statSync(filename);
      const newStat = filesystem.statSync(copyname);
      expect(newStat.mode).toBe(oldStat.mode);
      done();
    });
  });
});
