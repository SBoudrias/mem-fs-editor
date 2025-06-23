import crypto from 'node:crypto';
import { describe, beforeEach, it, expect } from 'vitest';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import { type MemFsEditor, MemFsEditorFile, create } from '../src/index.js';

describe('#dump()', () => {
  let testDir: string;
  let memFs: MemFsEditor;

  beforeEach(async () => {
    const subdir = 'foo';

    const hash = crypto.createHash('md5').digest('hex');
    testDir = path.join(os.tmpdir(), 'mem-fs-editor-test', hash);
    memFs = create(createMemFs<MemFsEditorFile>());

    memFs.write(path.join(testDir, subdir, 'committed'), 'committed');
    memFs.write(path.join(testDir, subdir, 'committed-delete'), 'committed-delete');
    memFs.write(path.join(testDir, subdir, 'committed-changed'), 'orig');
    memFs.write(path.join(testDir, subdir, 'committed-delete-changed'), 'orig');
    await memFs.commit();

    memFs.delete(path.join(testDir, subdir, 'committed-delete'));
    await memFs.commit();

    memFs.write(path.join(testDir, subdir, 'committed-changed'), 'committed-changed');
    memFs.write(path.join(testDir, subdir, 'not-committed'), 'not-committed');
    memFs.write(path.join(testDir, subdir, 'not-committed-delete'), 'not-committed-delete');

    memFs.delete(path.join(testDir, subdir, 'committed-delete-changed'));
    memFs.delete(path.join(testDir, subdir, 'not-committed-delete'));
  });

  it('should match snapshot', () => {
    expect(memFs.dump(testDir)).toMatchInlineSnapshot(`
      {
        "foo/committed": {
          "contents": "committed",
          "stateCleared": "modified",
        },
        "foo/committed-changed": {
          "contents": "committed-changed",
          "state": "modified",
          "stateCleared": "modified",
        },
        "foo/committed-delete": {
          "contents": null,
          "stateCleared": "deleted",
        },
        "foo/committed-delete-changed": {
          "contents": null,
          "state": "deleted",
          "stateCleared": "modified",
        },
        "foo/not-committed": {
          "contents": "not-committed",
          "state": "modified",
        },
        "foo/not-committed-delete": {
          "contents": null,
          "state": "deleted",
        },
      }
    `);
  });

  describe('with custom filter', () => {
    it('should match snapshot', () => {
      expect(memFs.dump(testDir, (file) => file.path.endsWith('not-committed'))).toMatchInlineSnapshot(`
        {
          "foo/not-committed": {
            "contents": "not-committed",
            "state": "modified",
          },
        }
      `);
    });
  });

  describe('with a glob pattern', () => {
    it('should return files that matches the pattern and have state or stateCleared', () => {
      expect(memFs.dump(testDir, '**/*committed')).toMatchInlineSnapshot(`
        {
          "foo/committed": {
            "contents": "committed",
            "stateCleared": "modified",
          },
          "foo/not-committed": {
            "contents": "not-committed",
            "state": "modified",
          },
        }
      `);
    });
  });
});
