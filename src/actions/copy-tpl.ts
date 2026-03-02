import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import { isBinary } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  options?: Omit<NonNullable<Parameters<MemFsEditor['copy']>[2]>, 'fileTransform' | 'transformData'> & {
    transformOptions?: ejs.Options;
  },
) {
  this.copy(from, to, {
    ...options,
    transformData: data,
    fileTransform({ destinationPath, sourcePath, contents, data, options }) {
      if (options?.async) {
        throw new Error('Async EJS rendering is not supported');
      }

      let processedPath = ejs.render(destinationPath, data, {
        ...options,
        cache: false, // Cache uses filename as key, which is not provided in this case.
        async: false,
      });
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            ...options,
            async: false,
          });
      if (!to.endsWith('.ejs')) {
        // If the initial destination path ends with .ejs, the output is expected to be .ejs file, so we keep the extension. Remove .ejs extension for other cases.
        processedPath = processedPath.replace(/.ejs$/, '');
      }

      return { path: processedPath, contents: processedContent };
    },
  });
}
