import fs from 'fs';
import path, { resolve } from 'path';
import { Duplex } from 'stream';
import os from 'os';
import { describe, beforeEach, it, expect, afterEach, vi } from 'vitest';
import { create as createMemFs } from 'mem-fs';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { getFixture } from './fixtures.js';
import { isFilePending } from '../src/state.js';

describe('#commit()', () => {
  const fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test' + String(Math.random()));
  const NUMBER_FILES = 100;

  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());
    fs.mkdirSync(fixtureDir, { recursive: true });

    // Create a 100 files to exercise the stream high water mark
    let i = NUMBER_FILES;
    while (i--) {
      fs.writeFileSync(path.join(fixtureDir, 'file-' + String(i) + '.txt'), 'foo');
    }

    memFs.copy(fixtureDir + '/**', output);
  });

  afterEach(() => {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await memFs.commit();
    expect(memFs.dump(output)).toMatchSnapshot();
  });

  it('call filters and trigger callback on error', async () => {
    let called = 0;

    // eslint-disable-next-line require-yield
    const filter = Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
      // eslint-disable-next-line no-unreachable-loop, @typescript-eslint/no-unused-vars
      for await (const _file of generator) {
        called++;
        throw new Error(`error ${String(called)}`);
      }
    });

    await expect(memFs.commit(filter)).rejects.toThrow(/error 1/);
  });

  it('call filters and update memory model', async () => {
    let called = 0;

    await memFs.commit(
      Duplex.from(async function* (generator: AsyncGenerator<MemFsEditorFile>) {
        for await (const file of generator) {
          called++;
          file.contents = Buffer.from('modified');
          yield file;
        }
      }),
    );

    expect(called).toBe(100);
    expect(memFs.read(path.join(output, 'file-1.txt'))).toBe('modified');
  });

  it('call filters, update memory model and commit selected files', async () => {
    let called = 0;

    await memFs.commit(
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
    expect(memFs.read(path.join(output, 'file-1.txt'))).toBe('modified');
    expect(memFs.read(path.join(output, 'file-2.txt'))).not.toBe('modified');
    expect(memFs.store.get(path.join(output, 'file-1.txt')).committed).toBeTruthy();
    expect(memFs.store.get(path.join(output, 'file-2.txt')).result).toBe(undefined);
  });

  it('write file to disk', async () => {
    await memFs.commit();
    expect(fs.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
    expect(fs.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
    expect(fs.existsSync(path.join(output, 'file-50.txt'))).toBeTruthy();
    expect(fs.existsSync(path.join(output, 'file-99.txt'))).toBeTruthy();
  }, 10000);

  it('handle error when write fails', async () => {
    fs.writeFileSync(output, 'foo');
    await expect(memFs.commit()).rejects.toThrow(/is not a directory/);
  });

  it('delete file from disk', async () => {
    const file = path.join(output, 'delete.txt');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(file, 'to delete');

    memFs.delete(file);
    await memFs.commit();
    expect(fs.existsSync(file)).toBeFalsy();
    expect(memFs.store.get(file).committed).toBeTruthy();
  });

  it('delete directories from disk', async () => {
    const file = path.join(output, 'nested/delete.txt');
    fs.mkdirSync(path.join(output, 'nested'), { recursive: true });
    fs.writeFileSync(file, 'to delete');

    memFs.delete(path.join(output, 'nested'));
    await memFs.commit();
    expect(fs.existsSync(file)).toBeFalsy();
  });

  it('reset file status after commiting', async () => {
    await memFs.commit();
    expect(memFs.store.get(path.join(output, '/file-a.txt')).state).toBeUndefined();
  });

  it('does not commit files who are deleted before being commited', async () => {
    memFs.write('to-delete', 'foo');
    memFs.delete('to-delete');
    memFs.copy(getFixture('file-a.txt'), 'copy-to-delete');
    memFs.delete('copy-to-delete');
    memFs.store.get('to-delete');

    const writeFile = vi.spyOn(fs.promises, 'writeFile');

    await memFs.commit({ filter: () => true });

    expect(writeFile).toHaveBeenCalled();
    expect(writeFile).not.toBeCalledWith(resolve('to-delete'), expect.anything(), expect.anything());
  });

  it('does not pass files who are deleted before being commited through the pipeline', async () => {
    memFs.write('to-delete', 'foo');
    memFs.delete('to-delete');
    memFs.copy(getFixture('file-a.txt'), 'copy-to-delete');
    memFs.delete('copy-to-delete');
    memFs.store.get('to-delete');

    await memFs.commit(
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

  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());

    memFs.copy(getFixture('**'), output);
  });

  afterEach(() => {
    fs.rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await memFs.commit();
    expect(memFs.dump(output)).toMatchSnapshot();
  });
});

describe('#copyTpl() and #commit()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let memFs: MemFsEditor;

  beforeEach(() => {
    memFs = create(createMemFs<MemFsEditorFile>());

    const a = { name: 'foo' } as any;
    const b = { a };
    a.b = b;

    memFs.copyTpl(getFixture('**'), output, { name: 'bar' }, { context: { a } });
  });

  afterEach(() => {
    fs.rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', async () => {
    await memFs.commit();
    expect(memFs.dump(output)).toMatchSnapshot();
  });
});
