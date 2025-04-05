import { describe, beforeEach, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import { type MemFsEditor, type MemFsEditorFile, create } from '../src/index.js';
import commitFileAsync from '../src/actions/commit-file-async.js';

const rmSync = fs.rmSync || fs.rmdirSync;

// Permission mode are handled differently by windows.
// More information can be found at Node source https://github.com/nodejs/node/blob/8cf33850bea691d8c53b2d4175c959c8549aa76c/deps/uv/src/win/fs.c#L1743-L1761
// Windows only changes readonly flag and ignores user/group.
// Use only the modes that are available at Windows.
const READ_WRITE_MODE = 0o666;
const READ_ONLY_MODE = 0o444;

describe('#commitFileAsync()', () => {
  const outputRoot = path.join(os.tmpdir(), 'mem-fs-editor-test' + Math.random());
  const outputDir = path.join(outputRoot, 'output');
  const filename = path.join(outputDir, 'file.txt');
  const filenameNew = path.join(outputDir, 'file-new.txt');
  let newFile: MemFsEditorFile;

  let memFs: MemFsEditor;

  beforeEach(() => {
    const store = createMemFs();
    vi.spyOn(store, 'add');

    memFs = create(store);
    memFs.write(filename, 'foo');

    newFile = {
      path: filenameNew,
      contents: Buffer.from('bar'),
      state: 'modified',
    };

    expect(store.add).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    rmSync(outputRoot, { recursive: true, force: true });
  });

  it('writes a modified file to disk', async () => {
    await commitFileAsync(memFs.store.get(filename));
    expect(fs.readFileSync(filename).toString()).toEqual('foo');
  });

  it('writes non existing file to disk', async () => {
    await commitFileAsync(newFile);
    expect(fs.existsSync(filenameNew)).toBe(true);
  });

  it("doesn't commit an unmodified file", async () => {
    await commitFileAsync({
      ...newFile,
      state: undefined,
    });
    expect(fs.existsSync(filenameNew)).toBe(false);
  });

  it('throws if the file is a directory', async () => {
    fs.mkdirSync(filenameNew, { recursive: true });
    await expect(commitFileAsync(newFile)).rejects.toThrow();
  });

  it('throws if the directory is a file', async () => {
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.writeFileSync(path.dirname(filenameNew), 'foo');
    await expect(commitFileAsync(newFile)).rejects.toThrow();
  });

  it('deletes a file', async () => {
    fs.mkdirSync(path.dirname(filenameNew), { recursive: true });
    fs.writeFileSync(filenameNew, 'foo');
    await commitFileAsync({
      ...newFile,
      state: 'deleted',
    });
    expect(fs.existsSync(filenameNew)).toBe(false);
  });

  it('sets file permission', async () => {
    await commitFileAsync({
      ...newFile,
      stat: { mode: READ_ONLY_MODE },
    });
    // eslint-disable-next-line no-bitwise
    expect(fs.statSync(filenameNew).mode & 0o777).toEqual(READ_ONLY_MODE);
  });

  it('updates file permission', async () => {
    await commitFileAsync({
      ...newFile,
      stat: { mode: READ_WRITE_MODE },
    });

    await commitFileAsync({
      ...newFile,
      stat: { mode: READ_ONLY_MODE },
    });

    // eslint-disable-next-line no-bitwise
    expect(fs.statSync(filenameNew).mode & 0o777).toEqual(READ_ONLY_MODE);
  });

  it("doesn't readd same file to store", async () => {
    await commitFileAsync(memFs.store.get(filename));
    expect(memFs.store.add).toHaveBeenCalledTimes(1);
  });
});
