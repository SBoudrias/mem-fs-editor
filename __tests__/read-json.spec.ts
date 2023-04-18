import { describe, beforeEach, it, expect } from 'vitest';
import sinon from 'sinon';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import escape from 'escape-regexp';
import { getFixture } from './fixtures.js';

describe('#readJSON()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
  });

  it('read the content of a file', () => {
    const obj = fs.readJSON(getFixture('file.json'));
    expect(obj.foo).toBe('bar');
  });

  it('calls read() with path', () => {
    const read = sinon.spy(fs, 'read');
    const file = getFixture('file.json');
    fs.readJSON(file);
    sinon.assert.calledOnce(read);
    sinon.assert.calledWith(read, file);
    read.restore();
  });

  it('return defaults if file does not exist and defaults is provided', () => {
    const obj = fs.readJSON(getFixture('no-such-file.json'), {
      foo: 'bar',
    });
    expect(obj.foo).toBe('bar');
  });

  it('throw error if file could not be parsed as JSON, even if defaults is provided', () => {
    expect(
      fs.readJSON.bind(fs, getFixture('file-tpl.txt'), {
        foo: 'bar',
      })
    ).toThrow();
  });

  it('throw error with file path info', () => {
    const filePath = getFixture('file-tpl.txt');
    expect(fs.readJSON.bind(fs, new RegExp(escape(filePath)))).toThrow();
  });
});
