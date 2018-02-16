'use strict';

const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

describe('#write()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('write string to a new file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = 'some text';
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.store.get(filepath).state).toBe('modified');
  });

  it('write buffer to a new file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = Buffer.from('omg!', 'base64');
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents.toString());
    expect(fs.store.get(filepath).state).toBe('modified');
  });

  it('write an existing file', () => {
    const filepath = path.join(__dirname, 'fixtures/file-a.txt');
    const contents = 'some text';
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.store.get(filepath).state).toBe('modified');
  });
});
