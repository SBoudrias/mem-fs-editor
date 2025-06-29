import { processTpl, renderTpl } from '../util.js';
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
  await this.copyAsync(from, to, {
    ...options,
    fileTransform(destPath: string, sourcePath: string, contents: Buffer): [string, string | Buffer] {
      // Process the destination path as a template
      const processedPath = renderTpl(destPath, data, tplOptions);

      // Process the file contents
      const processedContent = processTpl({ contents, filename: sourcePath, data, tplOptions });

      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
