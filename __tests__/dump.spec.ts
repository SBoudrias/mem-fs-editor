import { describe, beforeEach, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import { type MemFsEditor, create } from '../src/index.js';

const rmSync = fs.rmSync || fs.rmdirSync;

describe('#dump()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');
  const subdir = 'foo';
  let memFs: MemFsEditor;

  beforeEach(async () => {
    memFs = create(createMemFs());

    memFs.write(path.join(output, subdir, 'committed'), 'committed');
    memFs.write(path.join(output, subdir, 'committed-delete'), 'committed-delete');
    memFs.write(path.join(output, subdir, 'committed-changed'), 'orig');
    memFs.write(path.join(output, subdir, 'committed-delete-changed'), 'orig');
    await memFs.commit();

    memFs.delete(path.join(output, subdir, 'committed-delete'));
    await memFs.commit();

    memFs.write(path.join(output, subdir, 'committed-changed'), 'committed-changed');
    memFs.write(path.join(output, subdir, 'not-committed'), 'not-committed');
    memFs.write(path.join(output, subdir, 'not-committed-delete'), 'not-committed-delete');

    memFs.delete(path.join(output, subdir, 'committed-delete-changed'));
    memFs.delete(path.join(output, subdir, 'not-committed-delete'));
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', () => {
    expect(memFs.dump(output)).toMatchSnapshot();
  });

  describe('with custom filter', () => {
    it('should match snapshot', () => {
      expect(memFs.dump(output, (file) => file.path.endsWith('not-committed'))).toMatchSnapshot();
    });
  });

  describe('with a glob pattern', () => {
    it('should return files that matches the pattern and have state or stateCleared', () => {
      expect(memFs.dump(output, '**/*committed')).toMatchSnapshot();
    });
  });
});
