import { describe, beforeEach, it } from 'vitest';
import sinon from 'sinon';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#extendJSON()', () => {
  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs());
  });

  it('extends content of existing JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { b: 2 };
    const write = sinon.spy(memFs, 'write');
    const read = sinon.stub(memFs, 'readJSON').returns({ a: 'a', b: 'b' });
    memFs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({ a: 'a', b: 2 }, null, 2) + '\n');
    write.restore();
    read.restore();
  });

  it('writes to unexisting JSON file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    const write = sinon.spy(memFs, 'write');
    memFs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({ foo: 'bar' }, null, 2) + '\n');
    write.restore();
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = { foo: 'bar' };
    const write = sinon.spy(memFs, 'write');
    memFs.extendJSON(filepath, contents, ['\n'], 4);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, ['\n'], 4) + '\n');
    write.restore();
  });
});
