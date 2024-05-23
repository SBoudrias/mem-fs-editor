import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import commondir from 'commondir';
import { isDynamicPattern } from 'globby';
import normalize from 'normalize-path';
import { isBinaryFileSync } from 'isbinaryfile';

import textextensions from 'textextensions';
import binaryextensions from 'binaryextensions';

function notNullOrExclusion(file) {
  return file != null && file.charAt(0) !== '!';
}

export const getCommonPath = function (filePath: string | string[]): string {
  if (Array.isArray(filePath)) {
    filePath = filePath.filter(notNullOrExclusion).map(getCommonPath);

    return commondir(filePath);
  }

  const globStartIndex = filePath.indexOf('*');
  if (globStartIndex !== -1) {
    filePath = filePath.substring(0, globStartIndex + 1);
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    return filePath;
  }

  return path.dirname(filePath);
};

export const globify = function (filePath: string | string[]): string | string[] {
  if (Array.isArray(filePath)) {
    return filePath.reduce((memo, pattern) => memo.concat(globify(pattern as string)), [] as string[]);
  }

  filePath = normalize(filePath) as string;

  if (isDynamicPattern(filePath)) {
    return filePath;
  }

  if (!fs.existsSync(filePath)) {
    // The target of a pattern who's not a glob and doesn't match an existing
    // entity on the disk is ambiguous. As such, match both files and directories.
    return [filePath, normalize(path.join(filePath, '**')) as string];
  }

  const fsStats = fs.statSync(filePath);
  if (fsStats.isFile()) {
    return filePath;
  }

  if (fsStats.isDirectory()) {
    return normalize(path.join(filePath, '**')) as string;
  }

  throw new Error('Only file path or directory path are supported.');
};

export const isBinary = (filePath, newFileContents) => {
  const extension = path.extname(filePath).replace(/^\./, '') || path.basename(filePath);
  if (binaryextensions.includes(extension)) {
    return true;
  }

  if (textextensions.includes(extension)) {
    return false;
  }

  return (
    (fs.existsSync(filePath) && isBinaryFileSync(filePath)) ||
    (newFileContents &&
      isBinaryFileSync(Buffer.isBuffer(newFileContents) ? newFileContents : Buffer.from(newFileContents)))
  );
};

export const render = function (template: string, data?: ejs.Data, options?: ejs.Options): string {
  return ejs.render(template, data, { cache: false, ...options }) as string;
};

export const renderFile = function (template: string, data?: ejs.Data, options?: ejs.Options): Promise<string> {
  return ejs.renderFile(template, data, { cache: true, ...options });
};
