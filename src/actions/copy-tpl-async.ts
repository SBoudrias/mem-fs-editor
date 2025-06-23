import fs from 'fs/promises';
import { isBinary, processTpl, renderFile } from '../util.js';
import type { MemFsEditor } from '../index.js';
import type { Data } from 'ejs';
import type { CopyAsyncOptions } from './copy-async.js';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  templateData: Data = {},
  options: Omit<CopyAsyncOptions, 'templateData'> = {},
) {
  const { templateOptions } = options;

  await this.copyAsync(from, to, {
    processDestinationPath: (path) => path.replace(/.ejs$/, ''),
    ...options,
    async processFile(filename) {
      if (isBinary(filename)) {
        return fs.readFile(filename);
      }

      return renderFile(filename, templateData, templateOptions);
    },
    process: (contents, filename, destination) =>
      processTpl({
        contents,
        filename,
        destination,
        templateData,
        templateOptions,
      }),
    templateData,
  });
}
