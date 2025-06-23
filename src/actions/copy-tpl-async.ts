import fs from 'fs/promises';
import { isBinary, processTpl, renderFile } from '../util.js';
import type { MemFsEditor } from '../index.js';
import type { Data, Options } from 'ejs';
import type { CopyAsyncOptions } from './copy-async.js';

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
        if (isBinary(filename)) {
          return fs.readFile(filename);
        }

        return renderFile(filename, context, tplSettings);
      },
      process: (contents, filename, destination) =>
        processTpl({
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
