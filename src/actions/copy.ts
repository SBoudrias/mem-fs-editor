import assert from 'assert';
import fs from 'fs';
import path, { resolve } from 'path';
import { globSync, isDynamicPattern } from 'tinyglobby';
import multimatch from 'multimatch';
import { Data, Options } from 'ejs';
import normalize from 'normalize-path';
import File from 'vinyl';

import type { MemFsEditor } from '../index.js';
import { globify, parseOptions, render } from '../util.js';

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
  processDestinationPath?: (string) => string;
};

export function copy(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  options: CopyOptions = {},
  context?: Data,
  tplSettings?: Options,
) {
  const opts = parseOptions({ from, to, fromBasePath: options.fromBasePath });
  from = opts.from;
  to = opts.to;
  const { fromBasePath } = opts;

  let files: string[] = [];
  if (options.noGlob) {
    files = from.filter((f) => this.store.existsInMemory(f) || fs.existsSync(f));
  } else {
    const fromGlob = globify(from);
    const diskFiles = globSync(fromGlob, { ...options.globOptions, absolute: true, onlyFiles: true }).map(p => normalize(p));

    const storeFiles: string[] = [];
    this.store.each((file) => {
      const normalizedFilepath = normalize(file.path);
      // The store may have a glob path and when we try to copy it will fail because not real file
      if (
        !diskFiles.includes(file.path) &&
        !isDynamicPattern(normalizedFilepath) &&
        multimatch([normalizedFilepath], fromGlob).length !== 0
      ) {
        storeFiles.push(file.path);
      }
    });
    files = diskFiles.concat(storeFiles);
  }

  // Sanity checks: Makes sure we copy at least one file.
  assert(options.ignoreNoMatch || files.length > 0, 'Trying to copy from a source that does not exist: ' + from[0]);

  let generateDestination: (string: string) => string = () => to;
  if (from.length > 1 || !this.exists(from[0]) || (isDynamicPattern(from[0]) && !options.noGlob)) {
    assert(
      !this.exists(to) || fs.statSync(to).isDirectory(),
      'When copying multiple files, provide a directory as destination',
    );

    const processDestinationPath = options.processDestinationPath || ((path) => path);
    generateDestination = (filepath) => {
      const toFile = path.relative(fromBasePath, filepath);
      return processDestinationPath(path.posix.join(to, toFile));
    };
  }

  files.forEach((file) => {
    let toFile = generateDestination(file);
    if (context) {
      toFile = render(toFile, context, { ...tplSettings, cache: false });
    }

    this._copySingle(file, toFile, options);
  });
}

export type CopySingleOptions = {
  append?: boolean;
  process?: (contents: string | Buffer, filepath: string, destination: string) => string | Buffer;
};

export function _copySingle(this: MemFsEditor, from: string, to: string, options: CopySingleOptions = {}) {
  assert(this.exists(from), 'Trying to copy from a source that does not exist: ' + from);

  const file = this.store.get(from);
  to = resolve(to);

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
