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
    fs.write('/test/foo/file-a.txt', 'a');
    fs.write('/test/foo/file-b.txt', 'b');

    fs.copy('/test/foo/**', '/test/bar/');

    expect(fs.read('/test/bar/file-a.txt')).toBe('a');
    expect(fs.read('/test/bar/file-b.txt')).toBe('b');
  });

  it('throws when trying to copy from a non-existing file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exits');
    const newPath = '/new/path/file.txt';
    expect(fs.copy.bind(fs, filepath, newPath)).toThrow();
  });

  it('copy file and process contents', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const initialContents = fs.read(filepath);
    const contents = 'some processed contents';
    const newPath = '/new/path/file.txt';
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
    fs.copy(path.join(__dirname, '/fixtures'), '/output');
    expect(fs.read('/output/file-a.txt')).toBe('foo\n');
    expect(fs.read('/output/nested/file.txt')).toBe('nested\n');
  });

  it('copy by globbing', () => {
    fs.copy(path.join(__dirname, '/fixtures/**'), '/output');
    expect(fs.read('/output/file-a.txt')).toBe('foo\n');
    expect(fs.read('/output/nested/file.txt')).toBe('nested\n');
  });

  it('copy by globbing multiple patterns', () => {
    fs.copy([path.join(__dirname, '/fixtures/**'), '!**/*tpl*'], '/output');
    expect(fs.read('/output/file-a.txt')).toBe('foo\n');
    expect(fs.read('/output/nested/file.txt')).toBe('nested\n');
    expect(fs.read.bind(fs, '/output/file-tpl.txt')).toThrow();
  });

  it('copy files by globbing and process contents', () => {
    const process = sinon.stub().returnsArg(0);
    fs.copy(path.join(__dirname, '/fixtures/**'), '/output', {process});
    sinon.assert.callCount(process, 9); // 7 total files under 'fixtures', not counting folders
    expect(fs.read('/output/file-a.txt')).toBe('foo\n');
    expect(fs.read('/output/nested/file.txt')).toBe('nested\n');
  });

  it('accepts directory name with "."', () => {
    fs.copy(path.join(__dirname, '/fixtures/**'), '/out.put');
    expect(fs.read('/out.put/file-a.txt')).toBe('foo\n');
    expect(fs.read('/out.put/nested/file.txt')).toBe('nested\n');
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
