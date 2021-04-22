'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const memFs = require('mem-fs');
const editor = require('..');

describe('#commit()', () => {
  const outputRoot = path.join(os.tmpdir(), 'mem-fs-editor-test');
  const outputDir = path.join(outputRoot, 'output');
  const filename = path.join(outputDir, 'file.txt');

  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);

    fs.write(filename, 'foo');
  });

  afterEach(() => {
    filesystem.rmdirSync(outputRoot, {recursive: true});
  });

  it('triggers callback when done', async () => {
    await fs.commitFileAsync(store.get(filename));
    expect(filesystem.readFileSync(filename).toString()).toEqual('foo');
  });
});
