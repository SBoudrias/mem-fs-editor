import assert from 'assert';
import fs from 'fs';
import path from 'path';
import createDebug from 'debug';
import type { Data, Options } from 'ejs';
import { globSync, isDynamicPattern } from 'tinyglobby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';
import File from 'vinyl';

import type { MemFsEditor } from '../index.js';
import { resolveFromPaths, render, getCommonPath, ResolvedFrom, globify, resolveGlobOptions } from '../util.js';

const debug = createDebug('mem-fs-editor:copy');

function applyProcessingFunc(
  process: (contents: string | Buffer, filepath: string, destination: string) => string | Buffer,
  contents: string | Buffer,
  filename: string,
  destination: string,
) {
  const output = process(contents, filename, destination);
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

export type CopyOptions = CopySingleOptions & {
  noGlob?: boolean;
  globOptions?: Omit<Parameters<typeof globSync>[0], 'patterns'>;
  ignoreNoMatch?: boolean;
  fromBasePath?: string;
  processDestinationPath?: (filepath: string) => string;
};

export function copy(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  options: CopyOptions = {},
  context?: Data,
  tplSettings?: Options,
) {
  const { fromBasePath = getCommonPath(from), noGlob } = options;
  const resolvedFromPaths = resolveFromPaths({ from, fromBasePath });
  const hasDynamicPattern = resolvedFromPaths.some((f) => isDynamicPattern(normalize(f.from)));
  const { preferFiles } = resolveGlobOptions({
    noGlob,
    hasDynamicPattern,
    hasGlobOptions: Boolean(options.globOptions),
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
    });
    this.store.each((file) => {
      const normalizedFilepath = normalize(file.path);
      // The store may have a glob path and when we try to copy it will fail because not real file
      if (
        !globbedFiles.includes(normalizedFilepath) &&
        !isDynamicPattern(normalizedFilepath) &&
        multimatch([normalizedFilepath], patterns).length !== 0
      ) {
        globbedFiles.push(file.path);
      }
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

  const processDestinationPath = options.processDestinationPath || ((destPath) => destPath);
  foundFiles.forEach((file) => {
    let toFile = treatToAsDir ? processDestinationPath(path.join(to, file.relativeFrom)) : to;
    if (context) {
      toFile = render(toFile, context, { ...tplSettings, cache: false });
    }

    this._copySingle(file.resolvedFrom, toFile, options);
  });
}

export type CopySingleOptions = {
  append?: boolean;
  process?: (contents: string | Buffer, filepath: string, destination: string) => string | Buffer;
};

export function _copySingle(this: MemFsEditor, from: string, to: string, options: CopySingleOptions = {}) {
  assert(this.exists(from), 'Trying to copy from a source that does not exist: ' + from);

  debug('Copying %s to %s with %o', from, to, options);
  const file = this.store.get(from);
  to = path.resolve(to);

  let { contents } = file;
  if (!contents) {
    throw new Error(`Cannot copy empty file ${from}`);
  }

  if (options.process) {
    contents = applyProcessingFunc(options.process, contents, file.path, to);
  }

  if (options.append) {
    // Safety check against legacy API
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.store.existsInMemory) {
      throw new Error('Current mem-fs is not compatible with append');
    }

    if (this.store.existsInMemory(to)) {
      this.append(to, contents, { create: true, ...options });
      return;
    }
  }

  if (File.isVinyl(file)) {
    this._write(
      Object.assign(file.clone({ contents: false, deep: false }), {
        contents,
        path: to,
      }),
    );
  } else {
    this._write(
      new File({
        contents,
        stat: (file.stat as any) ?? fs.statSync(file.path),
        path: to,
        history: [file.path],
      }),
    );
  }
}
