import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import { isBinary } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  options?: Omit<NonNullable<Parameters<MemFsEditor['copy']>[2]>, 'fileTransform'> & {
    transformOptions?: ejs.Options;
  },
) {
  this.copy(from, to, {
    ...options,
    fileTransform(destinationPath, sourcePath, contents) {
      const { transformOptions } = options ?? {};
      if (transformOptions?.async) {
        throw new Error('Async EJS rendering is not supported');
      }

      const processedPath = ejs.render(destinationPath, data, { cache: false, ...transformOptions, async: false });
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            cache: true,
            ...transformOptions,
            async: false,
          });
      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
