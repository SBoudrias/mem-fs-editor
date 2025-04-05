import fs from 'fs/promises';
import { isBinary, renderFile } from '../util.js';
import type { MemFsEditor } from '../index.js';
import { Data, Options } from 'ejs';
import { CopyAsyncOptions } from './copy-async.js';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  context?: Data,
  tplSettings?: Options,
  options?: CopyAsyncOptions,
) {
  context ||= {};
  tplSettings ||= {};

  await this.copyAsync(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      async processFile(filename) {
        if (isBinary(filename, null)) {
          return fs.readFile(filename);
        }

        return renderFile(filename, context, tplSettings);
      },
      process: (contents, filename, destination) =>
        this._processTpl({
          contents,
          filename,
          destination,
          context,
          tplSettings,
        }),
    },
    context,
    tplSettings,
  );
}
