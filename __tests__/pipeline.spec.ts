import { describe, beforeEach, it, expect, afterEach, vi } from 'vitest';
import filesystem from 'fs';
import os from 'os';
import path from 'path';
import { create as createMemFs } from 'mem-fs';
import { MemFsEditor, create } from '../src/index.js';
import { isFilePending } from '../src/state.js';

const rmSync = filesystem.rmSync || filesystem.rmdirSync;

describe('#pipeline()', () => {
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

  describe('options', () => {
    it('passes isFilePending to mem-fs by default', async () => {
      const pipelineSpy = vi.spyOn(fs.store, 'pipeline').mockResolvedValue();
      const filter = vi.fn();

      await fs.pipeline(filter);

      expect(pipelineSpy).toBeCalledWith({ filter: isFilePending }, filter);
    });

    it("don't pass isFilePending if pendingFiles is false", async () => {
      const pipelineSpy = vi.spyOn(fs.store, 'pipeline').mockResolvedValue();
      const filter = vi.fn();

      await fs.pipeline({ pendingFiles: false }, filter);

      expect(pipelineSpy).toBeCalledWith({}, filter);
    });

    it('passes mem-fs options through', async () => {
      const pipelineSpy = vi.spyOn(fs.store, 'pipeline').mockResolvedValue();
      const filter = vi.fn();

      await fs.pipeline({ refresh: true, pendingFiles: false }, filter);

      expect(pipelineSpy).toBeCalledWith({ refresh: true }, filter);
    });

    it('passes all filters through', async () => {
      const pipelineSpy = vi.spyOn(fs.store, 'pipeline').mockResolvedValue();
      const filter1 = vi.fn();
      const filter2 = vi.fn();
      const filter3 = vi.fn();

      await fs.pipeline(filter1, filter2, filter3);

      expect(pipelineSpy).toBeCalledWith(expect.any(Object), filter1, filter2, filter3);
    });
  });
});
