import assert from 'assert';
import fs from 'fs';
import path from 'path';
import createDebug from 'debug';
import { globSync, isDynamicPattern, type GlobOptions } from 'tinyglobby';
import multimatch from 'multimatch';
import type { Options as MultimatchOptions } from 'multimatch';
import normalize from 'normalize-path';
import File from 'vinyl';
import { writeInternal } from './write.js';

import type { MemFsEditor } from '../index.js';
import { resolveFromPaths, getCommonPath, ResolvedFrom, resolveGlobOptions, globify } from '../util.js';

const debug = createDebug('mem-fs-editor:copy');

type CopySingleOptions = {
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
  fileTransform?: (destinationPath: string, sourcePath: string, contents: Buffer) => [string, string | Buffer];
};

type CopyOptions = CopySingleOptions & {
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

export function copy(this: MemFsEditor, from: string | string[], to: string, options: CopyOptions = {}) {
  const { fromBasePath = getCommonPath(from), noGlob } = options;
  const hasGlobOptions = Boolean(options.globOptions);
  const hasMultimatchOptions = Boolean(options.storeMatchOptions);
  assert(!noGlob || !hasGlobOptions, '`noGlob` and `globOptions` are mutually exclusive');
  assert(!noGlob || !hasMultimatchOptions, '`noGlob` and `storeMatchOptions` are mutually exclusive');

  const resolvedFromPaths = resolveFromPaths({ from, fromBasePath });
  const hasDynamicPattern = resolvedFromPaths.some((f) => isDynamicPattern(normalize(f.from)));
  const { preferFiles } = resolveGlobOptions({
    noGlob,
    hasDynamicPattern,
    hasGlobOptions,
  });

  const foundFiles: ResolvedFrom[] = [];
  const globResolved: ResolvedFrom[] = [];

  for (const resolvedFromPath of resolvedFromPaths) {
    const { from: filePath, resolvedFrom } = resolvedFromPath;
    if (preferFiles && this.exists(resolvedFrom)) {
      foundFiles.push(resolvedFromPath);
    } else if (noGlob) {
      throw new Error('Trying to copy from a source that does not exist: ' + filePath);
    } else {
      globResolved.push(resolvedFromPath);
    }
  }

  if (globResolved.length > 0) {
    const patterns = globResolved.map((file) => globify(file.from)).flat();
    const globbedFiles = globSync(patterns, {
      cwd: fromBasePath,
      ...options.globOptions,
      absolute: true,
      onlyFiles: true,
    }).map((filePath) => path.resolve(filePath));

    const normalizedStoreFilePaths = this.store
      .all()
      .map((file) => file.path)
      .filter((filePath) => !globbedFiles.includes(filePath))
      .map((filePath) => normalize(filePath))
      // The store may have a glob path and when we try to copy it will fail because not real file
      .filter((filePath) => !isDynamicPattern(filePath));

    multimatch(normalizedStoreFilePaths, patterns, options.storeMatchOptions).forEach((filePath) => {
      globbedFiles.push(path.resolve(filePath));
    });

    const foundResolvedFrom = foundFiles.map((file) => file.resolvedFrom);
    foundFiles.push(
      ...resolveFromPaths({
        from: globbedFiles
          .map((filePath) => normalize(filePath))
          .filter((filePath) => !foundResolvedFrom.includes(filePath)),
        fromBasePath,
      }),
    );
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(
    options.ignoreNoMatch || foundFiles.length > 0,
    'Trying to copy from a source that does not exist: ' + from.toString(),
  );

  // If `from` is an array, or if it contains any dynamic patterns, or if it doesn't exist, `to` must be a directory.
  const treatToAsDir = Array.isArray(from) || !preferFiles || globResolved.length > 0;
  if (treatToAsDir) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination',
    );
  }

  foundFiles.forEach((file) => {
    const toFile = treatToAsDir ? path.join(to, file.relativeFrom) : to;

    copySingle(this, file.resolvedFrom, toFile, options);
  });
}

const defaultFileTransform: NonNullable<CopySingleOptions['fileTransform']> = (destPath, _srcPath, contents) => [
  destPath,
  contents,
];

export function copySingle(editor: MemFsEditor, from: string, to: string, options: CopySingleOptions = {}) {
  assert(editor.exists(from), 'Trying to copy from a source that does not exist: ' + from);

  debug('Copying %s to %s with %o', from, to, options);
  const file = editor.store.get(from);

  let contents: string | Buffer;
  if (!file.contents) {
    throw new Error(`Cannot copy empty file ${from}`);
  }

  const { fileTransform = defaultFileTransform } = options;
  [to, contents] = fileTransform(path.resolve(to), from, file.contents);

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
        stat: (file.stat as any) ?? fs.statSync(file.path),
        path: to,
        history: [file.path],
      }),
    );
  }
}
