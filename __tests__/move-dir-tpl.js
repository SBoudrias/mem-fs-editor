'use strict';

const path = require('path');
const editor = require('..');
const memFs = require('mem-fs');

describe('#move()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('move directory', () => {
    const dirpath = path.join(__dirname, 'fixtures');
    const newdirpath = '/new/path';
    fs.moveDirTpl(dirpath, newdirpath, {tag: 'newTag'});
    expect(fs.exists('/new/path/nested-newTag-package/file.txt')).toBeTruthy();
  });
});
