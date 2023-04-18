import { describe, beforeEach, it, expect } from 'vitest';
import sinon from 'sinon';
import { type MemFsEditor, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

describe('#write()', () => {
  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    sinon.spy(store, 'add');

    fs = create(store);
  });

  it('write string to a new file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = 'some text';
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.store.get(filepath).state).toBe('modified');
  });

  it('write buffer to a new file', () => {
    const filepath = getFixture('does-not-exist.txt');
    const contents = Buffer.from('omg!', 'base64');
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents.toString());
    expect(fs.store.get(filepath).state).toBe('modified');
  });

  it('write an existing file', () => {
    const filepath = getFixture('file-a.txt');
    const contents = 'some text';
    fs.write(filepath, contents);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.store.get(filepath).state).toBe('modified');
  });

  it("doesn't re-add an identical file that already exist in memory", () => {
    const filepath = getFixture('file-a.txt');
    const contents = 'some text';
    fs.write(filepath, contents);
    expect(store.add.callCount).toBe(1);
    expect(fs.read(filepath)).toBe(contents);
    expect(fs.store.get(filepath).state).toBe('modified');

    fs.write(filepath, contents);
    expect(store.add.callCount).toBe(1);
  });
});
