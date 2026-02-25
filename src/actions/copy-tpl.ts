import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import { isBinary } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: Parameters<MemFsEditor['copy']>[2],
) {
  if (tplOptions?.async) {
    throw new Error('Async EJS rendering is not supported in appendTpl');
  }

  data ||= {};
  tplOptions ||= {};

  this.copy(from, to, {
    ...options,
    fileTransform(destPath: string, sourcePath: string, contents: Buffer) {
      const processedPath = ejs.render(destPath, data, { cache: false, ...tplOptions, async: false });
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            cache: true,
            ...tplOptions,
            async: false,
          });
      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
