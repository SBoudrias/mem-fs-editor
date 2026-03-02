import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { MemFsEditor, MemFsEditorFile, create } from '../src/index.js';
import { create as createMemFs } from 'mem-fs';
import { getFixture } from './fixtures.js';

for (const method of ['copy', 'copyAsync'] as const) {
  type CopySyncAsyncFunction = MemFsEditor[typeof method];
  type CopySyncAsyncOptions = NonNullable<Parameters<CopySyncAsyncFunction>[2]>;

  describe(`#${method}()`, () => {
    let memFs: MemFsEditor;
    let outputDir: string;

    beforeEach(async () => {
      memFs = create(createMemFs<MemFsEditorFile>());
      outputDir = path.join(os.tmpdir(), 'mem-fs-editor', Math.random().toString().split('.')[1]);
      await fs.mkdir(outputDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(outputDir, { recursive: true, force: true });
    });

    it(method === 'copy' ? "doesn't return a promise" : 'returns a promise', () => {
      const filepath = getFixture('file-a.txt');
      const newPath = '/new/path/file.txt';
      const ret = memFs[method](filepath, newPath);
      expect(ret instanceof Promise).toBe(method !== 'copy');
    });

    it('copy file', async () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = memFs.read(filepath);
      const newPath = '/new/path/file.txt';
      await memFs[method](filepath, newPath);
      expect(memFs.read(newPath)).toBe(initialContents);
      expect(memFs.store.get(newPath).state).toBe('modified');
    });

    it('supports non-vinyl files', async () => {
      const filepath = getFixture('file-a.txt');
      const { contents, path } = memFs.store.loadFile(filepath);
      const file = { contents, path };
      memFs.store.add(file);
      const newPath = '/new/path/file.txt';
      await memFs[method](filepath, newPath);
      expect(memFs.store.get(newPath).state).toBe('modified');
    });

    describe('using append option', () => {
      it('should append file to file already loaded', async () => {
        const filepath = getFixture('file-a.txt');
        const initialContents = memFs.read(filepath);
        const newPath = '/new/path/file.txt';

        await memFs[method](filepath, newPath, { append: true });
        expect(memFs.read(newPath)).toBe(initialContents);
        expect(memFs.store.get(newPath).state).toBe('modified');

        await memFs[method](filepath, newPath, { append: true });
        expect(memFs.read(newPath)).toBe(initialContents + initialContents);
      });
    });

    it('can copy directory not committed to disk', async () => {
      const sourceDir = getFixture('../../test/foo');
      const destDir = getFixture('../../test/bar');
      memFs.write(path.join(sourceDir, 'file-a.txt'), 'a');
      memFs.write(path.join(sourceDir, 'file-b.txt'), 'b');

      await memFs[method](path.join(sourceDir, '**'), destDir);

      expect(memFs.read(path.join(destDir, 'file-a.txt'))).toBe('a');
      expect(memFs.read(path.join(destDir, 'file-b.txt'))).toBe('b');
    });

    it('throws when trying to copy from a non-existing file', async () => {
      const filepath = getFixture('does-not-exits');
      const newPath = getFixture('../../test/new/path/file.txt');
      if (method === 'copy') {
        expect(() => {
          memFs[method](filepath, newPath);
        }).toThrow();
      } else {
        await expect(memFs[method](filepath, newPath)).rejects.toThrow();
      }
    });

    it('throws when trying to copy from a non-existing file with noGlob option', async () => {
      const filepath = getFixture('does-not-exits');
      const newPath = getFixture('../../test/new/path/file.txt');
      if (method === 'copy') {
        expect(() => {
          memFs[method](filepath, newPath, { noGlob: true });
        }).toThrow('Trying to copy from a source that does not exist: ');
      } else {
        await expect(memFs[method](filepath, newPath, { noGlob: true })).rejects.toThrow(
          'Trying to copy from a source that does not exist: ',
        );
      }
    });

    it('transforms file path and contents using fileTransform', async () => {
      const filepath = getFixture('file-a.txt');
      const transformedPath = getFixture('../../test/transformed/path/file.txt');
      const transformedContent = 'transformed content';

      await memFs[method](filepath, 'any', {
        fileTransform() {
          return { path: transformedPath, contents: Buffer.from(transformedContent) };
        },
      });

      expect(memFs.read(transformedPath)).toBe(transformedContent);
    });

    it('uses default fileTransform when not provided', async () => {
      const filepath = getFixture('file-a.txt');
      const initialContents = memFs.read(filepath);
      const destPath = 'new/path/file.txt';

      await memFs[method](filepath, destPath);

      expect(memFs.read(destPath)).toBe(initialContents);
    });

    it('copy by directory', async () => {
      await memFs[method](getFixture(), outputDir);
      expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('copy by globbing', async () => {
      await memFs[method](getFixture('**'), outputDir);
      expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('copy by globbing multiple patterns', async () => {
      await memFs[method]([getFixture('**'), '!**/*tpl*'], outputDir);
      expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
      expect(() => {
        memFs.read(path.join(outputDir, 'file-tpl.txt'));
      }).toThrow();
    });

    it('transforms files when globbing', async () => {
      const fileTransform = vi
        .fn<NonNullable<CopySyncAsyncOptions['fileTransform']>>()
        .mockImplementation(({ destinationPath, contents }) =>
          method === 'copy'
            ? { path: destinationPath, contents }
            : Promise.resolve({ path: destinationPath, contents }),
        ) as any;
      await memFs[method](getFixture('**'), outputDir, { fileTransform });
      expect(fileTransform).toHaveBeenCalledTimes(13); // 10 total files under 'fixtures', not counting folders
      expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('accepts directory name with "."', async () => {
      await memFs[method](getFixture('**'), outputDir);
      expect(memFs.read(path.join(outputDir, 'file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('requires destination directory when globbing', async () => {
      if (method === 'copy') {
        expect(() => {
          memFs[method](getFixture('**'), getFixture('file-a.txt'));
        }).toThrow();
      } else {
        await expect(memFs[method](getFixture('**'), getFixture('file-a.txt'))).rejects.toThrow();
      }
    });

    it('preserve permissions', async () => {
      const filename = path.join(outputDir, 'perm.txt');
      const copyname = path.join(outputDir, 'copy-perm.txt');
      await fs.writeFile(filename, 'foo', { mode: 0o755, encoding: 'utf-8' });

      await memFs[method](filename, copyname);

      await memFs.commit();
      const oldStat = await fs.stat(filename);
      const newStat = await fs.stat(copyname);
      expect(newStat.mode).toBe(oldStat.mode);
    });

    it('copy with globbing disabled', async () => {
      const newPath = path.join(outputDir, 'file.txt');
      await memFs[method](getFixture('file-(specia!-char$).txt'), newPath, {
        noGlob: true,
      });
      expect(memFs.read(newPath)).toBe('special' + os.EOL);
    });

    it('copy glob like file when noGlob', async () => {
      const newPath = path.join(outputDir, 'file.txt');
      await memFs[method](getFixture('[file].txt'), newPath, {
        noGlob: true,
      });
      expect(memFs.read(newPath)).toBe('foo' + os.EOL);
    });

    it('accepts fromBasePath', async () => {
      await memFs[method](['file-a.txt', 'nested/file.txt'], outputDir, {
        fromBasePath: path.join(import.meta.dirname, 'fixtures'),
        noGlob: true,
      });
      expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('detects fromBasePath from common prefix', async () => {
      await memFs[method]([getFixture('file-a.txt'), getFixture('nested/file.txt')], outputDir, {
        noGlob: true,
      });
      expect(memFs.read(path.join(outputDir, '/file-a.txt'))).toBe('foo' + os.EOL);
      expect(memFs.read(path.join(outputDir, '/nested/file.txt'))).toBe('nested' + os.EOL);
    });

    it('provides correct parameters to fileTransform', async () => {
      const filepath = getFixture('file-tpl.txt');
      const newPath = '/new/path/file.txt';
      const transformData = { name: 'bar' };
      const transformOptions = { async: true };
      await memFs[method](filepath, newPath, {
        fileTransform: (({ destinationPath, sourcePath, contents, options, data }) => {
          // Verify that sourcePath is the original template file
          expect(sourcePath).toBe(filepath);
          // Verify that destPath is the target path
          expect(destinationPath).toBe(path.resolve(newPath));
          // Verify that content is the original file content
          expect(contents.toString().trim()).toBe('<%= name %>');
          // Verify that options is the same as transformOptions
          expect(options).toMatchObject(transformOptions);
          // Verify that data is the same as transformData
          expect(data).toMatchObject(transformData);
          // Return unmodified path and content
          return method === 'copy'
            ? { path: destinationPath, contents }
            : Promise.resolve({ path: destinationPath, contents });
        }) as any,
        transformData,
        transformOptions,
      });
    });
  });
}
