import fs from 'fs/promises';
import { isBinary, processTpl } from '../util.js';
import type { MemFsEditor } from '../index.js';
import ejs from 'ejs';
import type { CopyAsyncOptions } from './copy-async.js';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  tplOptions?: ejs.Options,
  options?: CopyAsyncOptions,
) {
  await this.copyAsync(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      processFile(filename) {
        if (isBinary(filename)) {
          return fs.readFile(filename);
        }

        return ejs.renderFile(filename, data, { cache: true, ...tplOptions });
      },
      process: (contents, filename, destination) =>
        processTpl({
          contents,
          filename,
          destination,
          data,
          tplOptions,
        }),
    },
    data,
    tplOptions,
  );
}
