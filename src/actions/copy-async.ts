import assert from 'assert';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import type { Data, Options } from 'ejs';
import { globbySync, isDynamicPattern, type Options as GlobbyOptions } from 'globby';
import multimatch from 'multimatch';
import { render, globify, getCommonPath } from '../util.js';
import normalize from 'normalize-path';
import File from 'vinyl';
import type { MemFsEditor } from '../index.js';
import { AppendOptions } from './append.js';
import { CopySingleOptions } from './copy.js';

async function applyProcessingFileFunc(
  this: MemFsEditor,
  processFile: CopySingleAsyncOptions['processFile'],
  filename: string,
) {
  const output = await Promise.resolve(processFile!.call(this, filename));
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

function renderFilepath(filepath, context, tplSettings) {
  if (!context) {
    return filepath;
  }

  return render(filepath, context, tplSettings);
}

async function getOneFile(from: string | string[]) {
  let oneFile;
  if (typeof from === 'string') {
    oneFile = from;
  } else {
    return undefined;
  }

  const resolved = path.resolve(oneFile);
  try {
    if ((await fsPromises.stat(resolved)).isFile()) {
      return resolved;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {}

  return undefined;
}

export type CopyAsyncOptions = CopySingleAsyncOptions & {
  globOptions?: GlobbyOptions;
  processDestinationPath?: (string) => string;
  ignoreNoMatch?: boolean;
};

export async function copyAsync(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  options?: CopyAsyncOptions,
  context?: Data,
  tplSettings?: Options,
) {
  to = path.resolve(to);
  options ||= {};
  const oneFile = await getOneFile(from);
  if (oneFile) {
    return this._copySingleAsync(oneFile, renderFilepath(to, context, tplSettings), options);
  }

  const fromGlob = globify(from);

  const globOptions = { ...options.globOptions, nodir: true };
  const diskFiles = globbySync(fromGlob, globOptions).map((filepath) => path.resolve(filepath));
  const storeFiles: string[] = [];
  this.store.each((file) => {
    const normalizedFilepath = normalize(file.path);
    // The store may have a glob path and when we try to copy it will fail because not real file
    if (
      !isDynamicPattern(normalizedFilepath) &&
      multimatch([normalizedFilepath], fromGlob).length !== 0 &&
      !diskFiles.includes(file.path)
    ) {
      storeFiles.push(file.path);
    }
  });

  let generateDestination: (string) => string = () => to;
  if (Array.isArray(from) || !this.exists(from) || isDynamicPattern(normalize(from))) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination',
    );

    const processDestinationPath = options.processDestinationPath || ((path) => path);
    const root = getCommonPath(from);
    generateDestination = (filepath) => {
      const toFile = path.relative(root, filepath);
      return processDestinationPath(path.join(to, toFile));
    };
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(
    options.ignoreNoMatch || diskFiles.length > 0 || storeFiles.length > 0,
    'Trying to copy from a source that does not exist: ' + String(from),
  );

  await Promise.all([
    ...diskFiles.map((file) =>
      this._copySingleAsync(file, renderFilepath(generateDestination(file), context, tplSettings), options),
    ),
    ...storeFiles.map((file) => {
      this._copySingle(file, renderFilepath(generateDestination(file), context, tplSettings), options);
      return Promise.resolve();
    }),
  ]);
}

export type CopySingleAsyncOptions = AppendOptions &
  CopySingleOptions & {
    append?: boolean;
    processFile?: (this: MemFsEditor, filepath: string) => string | Promise<string | Buffer>;
  };

export async function _copySingleAsync(
  this: MemFsEditor,
  from: string,
  to: string,
  options: CopySingleAsyncOptions = {},
) {
  if (!options.processFile) {
    this._copySingle(from, to, options);
    return;
  }

  from = path.resolve(from);

  const contents = await applyProcessingFileFunc.call(this, options.processFile, from);

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

  this._write(
    new File({
      contents,
      stat: await fsPromises.stat(from),
      path: to,
      history: [from],
    }),
  );
}
