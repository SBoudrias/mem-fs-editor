'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const memFs = require('mem-fs');
const sinon = require('sinon');
const editor = require('..');

const rmSync = filesystem.rmSync || filesystem.rmdirSync;

describe('#commit()', () => {
  const outputRoot = path.join(os.tmpdir(), 'mem-fs-editor-test');
  const outputDir = path.join(outputRoot, 'output');
  const filename = path.join(outputDir, 'file.txt');
  const filenameNew = path.join(outputDir, 'file-new.txt');

  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    sinon.spy(store, 'add');

    fs = editor.create(store);
    fs.write(filename, 'foo');

    expect(store.add.callCount).toEqual(1);
  });

  afterEach(() => {
    rmSync(outputRoot, { recursive: true });
  });

  it('triggers callback when done', async () => {
    await fs.commitFileAsync(store.get(filename));
    expect(filesystem.readFileSync(filename).toString()).toEqual('foo');
  });

  it('adds non existing file to store', async () => {
    await fs.commitFileAsync({
      path: filenameNew,
      contents: Buffer.from('bar'),
      state: 'modified',
    });
    expect(store.add.callCount).toEqual(2);
  });

  it("doesn't readd same file to store", async () => {
    await fs.commitFileAsync(store.get(filename));
    expect(store.add.callCount).toEqual(1);
  });
});
