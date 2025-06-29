import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import commondir from 'commondir';
import { isDynamicPattern } from 'tinyglobby';
import normalize from 'normalize-path';
import { isBinaryFileSync } from 'isbinaryfile';
import textextensions from 'textextensions';
import binaryextensions from 'binaryextensions';

function notNullOrExclusion(file?: string) {
  return file != null && file.charAt(0) !== '!';
}

export function getCommonPath(filePath: string | string[]): string {
  if (Array.isArray(filePath)) {
    const paths = filePath.filter(notNullOrExclusion).map(getCommonPath);

    return commondir(paths);
  }

  const globStartIndex = filePath.indexOf('*');
  if (globStartIndex !== -1) {
    return path.dirname(filePath.substring(0, globStartIndex + 1));
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    return filePath;
  }

  return path.dirname(filePath);
}

export function globify(inputFilePath: string): string | string[];
export function globify(inputFilePath: string[]): string[];
export function globify(inputFilePath: string | string[]): string | string[] {
  if (Array.isArray(inputFilePath)) {
    return inputFilePath.reduce<string[]>((memo, pattern) => memo.concat(globify(pattern)), []);
  }

  const filePath = normalize(inputFilePath);

  if (isDynamicPattern(filePath)) {
    return filePath;
  }

  if (!fs.existsSync(filePath)) {
    // The target of a pattern who's not a glob and doesn't match an existing
    // entity on the disk is ambiguous. As such, match both files and directories.
    return [filePath, normalize(path.join(filePath, '**'))];
  }

  const fsStats = fs.statSync(filePath);
  if (fsStats.isFile()) {
    return filePath;
  }

  if (fsStats.isDirectory()) {
    return normalize(path.join(filePath, '**'));
  }

  throw new Error('Only file path or directory path are supported.');
}

export function isBinary(filePath: string, newFileContents?: Buffer) {
  const extension = path.extname(filePath).replace(/^\./, '') || path.basename(filePath);
  if (binaryextensions.includes(extension)) {
    return true;
  }

  if (textextensions.includes(extension)) {
    return false;
  }

  return (
    (fs.existsSync(filePath) && isBinaryFileSync(filePath)) || (newFileContents && isBinaryFileSync(newFileContents))
  );
}

export function renderTpl(template: string, data?: ejs.Data, options?: ejs.Options): string {
  return ejs.render(template, data, { cache: false, ...options, async: false });
}

export function processTpl({
  contents,
  filename,
  data,
  tplOptions,
}: {
  contents: Buffer;
  filename: string;
  destination?: string;
  data?: ejs.Data;
  tplOptions?: ejs.Options;
}): string | Buffer {
  if (isBinary(filename, contents)) {
    return contents;
  }

  return ejs.render(contents.toString(), data, {
    // Setting filename by default allow including partials.
    filename,
    cache: true,
    ...tplOptions,
    async: false,
  });
}

export type ResolvedFrom = {
  from: string;
  resolvedFrom: string;
  relativeFrom: string;
};

export function resolveFromPaths({
  from,
  fromBasePath,
}: {
  from: string | string[];
  fromBasePath: string;
}): ResolvedFrom[] {
  return (Array.isArray(from) ? from : [from]).map((filePath) => {
    const filePathIsAbsolute = path.isAbsolute(filePath);
    const relativeFrom = filePathIsAbsolute ? path.relative(fromBasePath, filePath) : filePath;
    const resolvedFrom = filePathIsAbsolute ? filePath : path.resolve(fromBasePath, filePath);
    return { from: filePath, resolvedFrom, relativeFrom };
  });
}

export function resolveGlobOptions({ noGlob, hasGlobOptions, hasDynamicPattern }) {
  return { preferFiles: noGlob || (!hasGlobOptions && !hasDynamicPattern) };
}
