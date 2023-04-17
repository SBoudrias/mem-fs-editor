import { describe, beforeEach, it, expect, afterEach } from 'vitest';
import filesystem from 'fs';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import sinon from 'sinon';
import { MemFsEditor, create } from '../lib/index.js';
import { createTransform } from '../lib/transform.js';
import { getFixture } from './fixtures.js';

const rmSync = filesystem.rmSync || filesystem.rmdirSync;

describe('#commit()', () => {
  const fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test' + Math.random());
  const NUMBER_FILES = 100;

  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);
    filesystem.mkdirSync(fixtureDir, { recursive: true });

    // Create a 100 files to exercise the stream high water mark
    let i = NUMBER_FILES;
    while (i--) {
      filesystem.writeFileSync(path.join(fixtureDir, 'file-' + i + '.txt'), 'foo');
    }

    fs.copy(fixtureDir + '/**', output);
  });

  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await fs.commit();
    expect(fs.dump(output)).toMatchSnapshot();
  });

  it('call filters and trigger callback on error', async () => {
    let called = 0;

    const filter = createTransform((file, enc, cb) => {
      called++;
      cb(new Error(`error ${called}`));
    });

    await expect(fs.commit([filter])).rejects.toMatch(/error 1/);
  });

  it('call filters and update memory model', async () => {
    let called = 0;

    const filter = createTransform(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    await fs.commit([filter]);
    expect(called).toBe(100);
    expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
  });

  it('call filters, update memory model and commit selected files', async () => {
    let called = 0;

    const filter = createTransform(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    const beforeFilter = createTransform(function (file, enc, cb) {
      if (file.path.endsWith('1.txt')) {
        this.push(file);
      }

      cb();
    });

    await fs.commit([filter], store.stream().pipe(beforeFilter));
    expect(called).toBe(10);
    expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
    expect(fs.read(path.join(output, 'file-2.txt'))).not.toBe('modified');
    expect(store.get(path.join(output, 'file-1.txt')).committed).toBeTruthy();
    expect(store.get(path.join(output, 'file-2.txt')).result).toBe(undefined);
  });

  it('write file to disk', async () => {
    await fs.commit();
    expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
    expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
    expect(filesystem.existsSync(path.join(output, 'file-50.txt'))).toBeTruthy();
    expect(filesystem.existsSync(path.join(output, 'file-99.txt'))).toBeTruthy();
  }, 10000);

  it('handle error when write fails', async () => {
    filesystem.writeFileSync(output, 'foo');
    await expect(fs.commit()).rejects.toMatch(/is not a directory/);
  });

  it('delete file from disk', async () => {
    const file = path.join(output, 'delete.txt');
    filesystem.mkdirSync(output, { recursive: true });
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(file);
    await fs.commit();
    expect(filesystem.existsSync(file)).toBeFalsy();
    expect(store.get(file).committed).toBeTruthy();
  });

  it('delete directories from disk', async () => {
    const file = path.join(output, 'nested/delete.txt');
    filesystem.mkdirSync(path.join(output, 'nested'), { recursive: true });
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(path.join(output, 'nested'));
    await fs.commit();
    expect(filesystem.existsSync(file)).toBeFalsy();
  });

  it('reset file status after commiting', async () => {
    await fs.commit();
    expect(fs.store.get(path.join(output, '/file-a.txt')).state).toBeUndefined();
  });

  it('does not commit files who are deleted before being commited', async () => {
    fs.write('to-delete', 'foo');
    fs.delete('to-delete');
    fs.copy(getFixture('file-a.txt'), 'copy-to-delete');
    fs.delete('copy-to-delete');
    fs.store.get('to-delete');

    fs.commitFileAsync = sinon.stub().returns(Promise.resolve());
    await fs.commit([
      createTransform(function (file, enc, cb) {
        expect(file.path).not.toEqual(path.resolve('to-delete'));
        expect(file.path).not.toEqual(path.resolve('copy-to-delete'));

        this.push(file);
        cb();
      }),
    ]);
    expect(fs.commitFileAsync.callCount).toBe(NUMBER_FILES);
  });
});

describe('#copy() and #commit()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);

    fs.copy(getFixture('**'), output);
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await fs.commit();
    expect(fs.dump(output)).toMatchSnapshot();
  });
});

describe('#copyTpl() and #commit()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs: MemFsEditor;

  beforeEach(() => {
    store = createMemFs();
    fs = create(store);

    const a = { name: 'foo' } as any;
    const b = { a };
    a.b = b;

    fs.copyTpl(getFixture('**'), output, { name: 'bar' }, { context: { a } });
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await fs.commit();
    expect(fs.dump(output)).toMatchSnapshot();
  });
});
