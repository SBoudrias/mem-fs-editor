import filesystem from 'fs';
import path, { resolve } from 'path';
import { Duplex } from 'stream';
import os from 'os';
import { describe, beforeEach, it, expect, afterEach, vi } from 'vitest';
import { create as createMemFs } from 'mem-fs';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { getFixture } from './fixtures.js';
import { isFilePending } from '../src/state.js';

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

    // eslint-disable-next-line require-yield
    const filter = Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
      // eslint-disable-next-line no-unreachable-loop, @typescript-eslint/no-unused-vars
      for await (const _file of generator) {
        called++;
        throw new Error(`error ${called}`);
      }
    });

    await expect(fs.commit(filter)).rejects.toThrow(/error 1/);
  });

  it('call filters and update memory model', async () => {
    let called = 0;

    await fs.commit(
      Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
        for await (const file of generator) {
          called++;
          file.contents = Buffer.from('modified');
          yield file;
        }
      }),
    );

    expect(called).toBe(100);
    expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
  });

  it('call filters, update memory model and commit selected files', async () => {
    let called = 0;

    await fs.commit(
      { filter: (file) => file.path.endsWith('1.txt') && isFilePending(file) },
      Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
        for await (const file of generator) {
          called++;
          file.contents = Buffer.from('modified');
          yield file;
        }
      }),
    );
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
    await expect(fs.commit()).rejects.toThrow(/is not a directory/);
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

    const writeFile = vi.spyOn(filesystem.promises, 'writeFile');

    await fs.commit({ filter: () => true });

    expect(writeFile).toHaveBeenCalled();
    expect(writeFile).not.toBeCalledWith(resolve('to-delete'), expect.anything(), expect.anything());
  });

  it('does not pass files who are deleted before being commited through the pipeline', async () => {
    fs.write('to-delete', 'foo');
    fs.delete('to-delete');
    fs.copy(getFixture('file-a.txt'), 'copy-to-delete');
    fs.delete('copy-to-delete');
    fs.store.get('to-delete');

    await fs.commit(
      Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
        for await (const file of generator) {
          expect(file.path).not.toEqual(path.resolve('to-delete'));
          expect(file.path).not.toEqual(path.resolve('copy-to-delete'));
          yield file;
        }
      }),
    );
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
