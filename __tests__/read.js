'use strict';

const os = require('os');
const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

const fileA = path.join(__dirname, 'fixtures/file-a.txt');

describe('#read()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('read the content of a file', () => {
    const content = fs.read(fileA);
    expect(content).toBe('foo' + os.EOL);
  });

  it('get the buffer content of a file', () => {
    const content = fs.read(fileA, {raw: true});
    expect(content).toBeInstanceOf(Buffer);
    expect(content.toString()).toBe('foo' + os.EOL);
  });

  it('throws if file does not exist', () => {
    expect(fs.read.bind(fs, 'file-who-does-not-exist.txt')).toThrow();
  });

  it('throws if file is deleted', () => {
    fs.delete(fileA);
    expect(fs.read.bind(fs, 'file-who-does-not-exist.txt')).toThrow();
  });

  it('returns defaults as String if file does not exist and defaults is provided', () => {
    const content = fs.read('file-who-does-not-exist.txt', {defaults: 'foo' + os.EOL});
    expect(content).toBe('foo' + os.EOL);
  });

  it('returns defaults as String if file does not exist and defaults is provided as empty string', () => {
    const content = fs.read('file-who-does-not-exist.txt', {defaults: ''});
    expect(content).toBe('');
  });

  it('returns defaults as Buffer if file does not exist and defaults is provided', () => {
    const content = fs.read('file-who-does-not-exist.txt', {
      defaults: Buffer.from('foo' + os.EOL),
      raw: true
    });
    expect(content).toBeInstanceOf(Buffer);
    expect(content.toString()).toBe('foo' + os.EOL);
  });

  it('returns defaults if file is deleted', () => {
    fs.delete(fileA);
    const content = fs.read(fileA, {defaults: 'foo'});
    expect(content).toBe('foo');
  });

  it('allows defaults to be null', () => {
    const content = fs.read('not-existing.file', {defaults: null});
    expect(content).toBeNull();
  });
});
