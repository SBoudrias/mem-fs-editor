import { describe, beforeEach, it, expect, afterEach } from 'vitest';
import filesystem from 'fs';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import { type MemFsEditor, create } from '../src/index.js';

const rmSync = filesystem.rmSync || filesystem.rmdirSync;

describe('#dump()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');
  const subdir = 'foo';
  let store;
  let fs: MemFsEditor;

  beforeEach(async () => {
    store = createMemFs();
    fs = create(store);

    fs.write(path.join(output, subdir, 'committed'), 'committed');
    fs.write(path.join(output, subdir, 'committed-delete'), 'committed-delete');
    fs.write(path.join(output, subdir, 'committed-changed'), 'orig');
    fs.write(path.join(output, subdir, 'committed-delete-changed'), 'orig');
    await fs.commit();

    fs.delete(path.join(output, subdir, 'committed-delete'));
    await fs.commit();

    fs.write(path.join(output, subdir, 'committed-changed'), 'committed-changed');
    fs.write(path.join(output, subdir, 'not-committed'), 'not-committed');
    fs.write(path.join(output, subdir, 'not-committed-delete'), 'not-committed-delete');

    fs.delete(path.join(output, subdir, 'committed-delete-changed'));
    fs.delete(path.join(output, subdir, 'not-committed-delete'));
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', () => {
    expect(fs.dump(output)).toMatchSnapshot();
  });

  describe('with custom filter', () => {
    it('should match snapshot', () => {
      expect(fs.dump(output, (file) => file.path.endsWith('not-committed'))).toMatchSnapshot();
    });
  });

  describe('with a glob pattern', () => {
    it('should return files that matches the pattern and have state or stateCleared', () => {
      expect(fs.dump(output, '**/*committed')).toMatchSnapshot();
    });
  });
});
