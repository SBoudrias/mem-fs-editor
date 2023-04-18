import { describe, beforeEach, it } from 'vitest';
import sinon from 'sinon';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#extendJSON()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('extends content of existing JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { b: 2 };
    const write = sinon.spy(fs, 'write');
    const read = sinon.stub(fs, 'readJSON').returns({ a: 'a', b: 'b' });
    fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({ a: 'a', b: 2 }, null, 2) + '\n');
    write.restore();
    read.restore();
  });

  it('writes to unexisting JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    const write = sinon.spy(fs, 'write');
    fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({ foo: 'bar' }, null, 2) + '\n');
    write.restore();
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    const write = sinon.spy(fs, 'write');
    fs.extendJSON(filepath, contents, ['\n'], 4);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, ['\n'], 4) + '\n');
    write.restore();
  });
});
