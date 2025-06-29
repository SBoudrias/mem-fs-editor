import assert from 'assert';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import createDebug from 'debug';

import { glob, isDynamicPattern } from 'tinyglobby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';
import File from 'vinyl';

import type { MemFsEditor } from '../index.js';
import type { CopyOptions, CopySingleOptions } from './copy.js';
import { resolveFromPaths, getCommonPath, type ResolvedFrom, globify, resolveGlobOptions } from '../util.js';
import { writeInternal } from './write.js';
import { copySingle } from './copy.js';
import append from './append.js';

const debug = createDebug('mem-fs-editor:copy-async');

async function getOneFile(filepath: string) {
  const resolved = path.resolve(filepath);
  try {
    if ((await fsPromises.stat(resolved)).isFile()) {
      return resolved;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {}

  return undefined;
}

export type CopySingleAsyncOptions = Parameters<typeof append>[2] &
  Omit<CopySingleOptions, 'fileTransform'> & {
    append?: boolean;

    /**
     * Transform both the file path and content during copy.
     * @param destinationPath The destination file path
     * @param sourcePath The source file path
     * @param contents The file content as Buffer
     * @returns Tuple of [new filepath, new content]
     */
    fileTransform?: (
      destinationPath: string,
      sourcePath: string,
      contents: Buffer,
    ) => [string, string | Buffer] | Promise<[string, string | Buffer]>;
  };

export type CopyAsyncOptions = CopyOptions & CopySingleAsyncOptions;

export async function copyAsync(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  options: CopyAsyncOptions = {},
) {
  to = path.resolve(to);
  const { noGlob } = options;
  const hasGlobOptions = Boolean(options.globOptions);
  const hasMultimatchOptions = Boolean(options.storeMatchOptions);
  assert(!noGlob || !hasGlobOptions, '`noGlob` and `globOptions` are mutually exclusive');
  assert(!noGlob || !hasMultimatchOptions, '`noGlob` and `storeMatchOptions` are mutually exclusive');

  if (typeof from === 'string') {
    // If `from` is a string and an existing file just go ahead and copy it.
    if (this.store.existsInMemory(from) && this.exists(from)) {
      copySingle(this, from, to, options);
      return;
    }

    const oneFile = await getOneFile(from);
    if (oneFile) {
      return copySingleAsync(this, oneFile, to, options);
    }
  }

  const fromBasePath = getCommonPath(from);
  const resolvedFromPaths = resolveFromPaths({ from, fromBasePath });
  const hasDynamicPattern = resolvedFromPaths.some((f) => isDynamicPattern(normalize(f.from)));
  const { preferFiles } = resolveGlobOptions({
    noGlob: false,
    hasDynamicPattern,
    hasGlobOptions: Boolean(options.globOptions),
  });

  const storeFiles: string[] = [];
  const globResolved: ResolvedFrom[] = [];

  for (const resolvedFromPath of resolvedFromPaths) {
    const { resolvedFrom } = resolvedFromPath;
    if (this.store.existsInMemory(resolvedFrom)) {
      storeFiles.push(resolvedFrom);
    } else {
      globResolved.push(resolvedFromPath);
    }
  }

  let diskFiles: string[] = [];
  if (globResolved.length > 0) {
    const patterns = globResolved.map((file) => globify(file.from)).flat();
    diskFiles = (await glob(patterns, { ...options.globOptions, absolute: true, onlyFiles: true })).map((file) =>
      path.resolve(file),
    );

    const normalizedStoreFilePaths = this.store
      .all()
      .map((file) => file.path)
      .filter((filePath) => !diskFiles.includes(filePath))
      .map((filePath) => normalize(filePath))
      // The store may have a glob path and when we try to copy it will fail because not real file
      .filter((filePath) => !isDynamicPattern(filePath));

    multimatch(normalizedStoreFilePaths, patterns, options.storeMatchOptions).forEach((filePath) => {
      storeFiles.push(path.resolve(filePath));
    });
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(
    options.ignoreNoMatch || diskFiles.length > 0 || storeFiles.length > 0,
    'Trying to copy from a source that does not exist: ' + String(from),
  );

  // If `from` is an array, or if it contains any dynamic patterns, or if it doesn't exist, `to` must be a directory.
  const treatToAsDir = Array.isArray(from) || !preferFiles || globResolved.length > 0;
  let generateDestination: (filepath: string) => string = () => to;
  if (treatToAsDir) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination',
    );

    generateDestination = (filepath) => path.join(to, path.relative(fromBasePath, filepath));
  }

  await Promise.all([
    ...diskFiles.map((file) => copySingleAsync(this, file, generateDestination(file), options)),
    ...storeFiles.map((file) => {
      copySingle(this, file, generateDestination(file), options);
      return Promise.resolve();
    }),
  ]);
}

const defaultFileTransform = (destPath: string, _sourcePath: string, contents: Buffer): [string, Buffer] => [
  destPath,
  contents,
];

async function copySingleAsync(editor: MemFsEditor, from: string, to: string, options: CopySingleAsyncOptions = {}) {
  from = path.resolve(from);

  debug('Copying %s to %s with %o', from, to, options);

  const file = editor.store.get(from);
  let contents: string | Buffer;
  if (!file.contents) {
    throw new Error(`Cannot copy empty file ${from}`);
  }

  const { fileTransform = defaultFileTransform } = options;
  [to, contents] = await Promise.resolve(fileTransform(path.resolve(to), from, file.contents));

  if (options.append) {
    if (editor.store.existsInMemory(to)) {
      editor.append(to, contents, { create: true, ...options });
      return;
    }
  }

  writeInternal(
    editor.store,
    new File({
      contents: Buffer.from(contents),
      stat: await fsPromises.stat(from),
      path: to,
      history: [from],
    }),
  );
}
