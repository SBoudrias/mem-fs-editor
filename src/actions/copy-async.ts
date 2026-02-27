import assert from 'assert';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import createDebug from 'debug';

import { glob, GlobOptions, isDynamicPattern } from 'tinyglobby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';
import File from 'vinyl';

import type { MemFsEditor } from '../index.js';
import type { Options as MultimatchOptions } from 'multimatch';
import { resolveFromPaths, getCommonPath, type ResolvedFrom, globify, resolveGlobOptions } from '../util.js';
import { writeInternal } from './write.js';

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

type CopySingleAsyncOptions = Parameters<MemFsEditor['append']>[2] & {
  append?: boolean;

  /**
   * @experimental This API is experimental and may change without a major version bump.
   *
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

type CopyAsyncOptions = CopySingleAsyncOptions & {
  noGlob?: boolean;
  /**
   * Options for disk globbing.
   * Glob options that should be compatible with minimatch results.
   */
  globOptions?: Pick<
    GlobOptions,
    'caseSensitiveMatch' | 'cwd' | 'debug' | 'deep' | 'dot' | 'expandDirectories' | 'followSymbolicLinks'
  >;
  /**
   * Options for store files matching.
   */
  storeMatchOptions?: MultimatchOptions;
  ignoreNoMatch?: boolean;
  fromBasePath?: string;
};

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
    const oneFile = await getOneFile(from);
    if (oneFile) {
      return copySingleAsync(this, oneFile, to, options);
    }
  }

  const { fromBasePath = getCommonPath(from) } = options;
  const resolvedFromPaths = resolveFromPaths({ from, fromBasePath });
  const hasDynamicPattern = resolvedFromPaths.some((f) => isDynamicPattern(normalize(f.from)));
  const { preferFiles } = resolveGlobOptions({
    noGlob,
    hasDynamicPattern,
    hasGlobOptions,
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
    diskFiles = (
      await glob(patterns, { cwd: fromBasePath, ...options.globOptions, absolute: true, onlyFiles: true })
    ).map((file) => path.resolve(file));

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
    ...storeFiles.map((file) => copySingleAsync(this, file, generateDestination(file), options)),
  ]);
}

const defaultFileTransform: NonNullable<CopyAsyncOptions['fileTransform']> = (destPath, _sourcePath, contents) => [
  destPath,
  contents,
];

async function copySingleAsync(editor: MemFsEditor, from: string, to: string, options: CopySingleAsyncOptions = {}) {
  from = path.resolve(from);

  debug('Copying %s to %s with %o', from, to, options);

  const file = editor.store.get(from);
  assert(file.contents, `Cannot copy empty file ${from}`);

  const { fileTransform = defaultFileTransform } = options;
  const transformPromise = fileTransform(path.resolve(to), from, file.contents);
  let contents: string | Buffer;
  [to, contents] = await transformPromise;

  if (options.append && editor.store.existsInMemory(to)) {
    editor.append(to, contents, { create: true, ...options });
  } else if (File.isVinyl(file)) {
    writeInternal(
      editor.store,
      Object.assign(file.clone({ contents: false, deep: false }), {
        contents: Buffer.from(contents),
        path: to,
      }),
    );
  } else {
    writeInternal(
      editor.store,
      new File({
        contents: Buffer.from(contents),
        stat: file.stat as any,
        path: to,
        history: [file.path],
      }),
    );
  }
}
