'use strict';

const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

const fileA = path.join(__dirname, 'fixtures/file-a.txt');
const fileDelete = path.join(__dirname, 'fixtures/deleteAfter');

describe('#exists()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('file doesn\'t exist', () => {
    expect(fs.exists('something that doesnt exist')).toBeFalsy();
  });

  it('file does exist', () => {
    fs.read(fileA);
    expect(fs.exists(fileA)).toBeTruthy();
  });

  it('file doesn\'t exist after delete', () => {
    fs.write(fileDelete, 'some content');
    fs.delete(fileDelete);
    expect(fs.exists(fileDelete)).toBeFalsy();
  });
});
