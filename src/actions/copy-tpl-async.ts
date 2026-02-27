import { isBinary } from '../util.js';
import type { MemFsEditor } from '../index.js';
import ejs from 'ejs';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  options?: Omit<NonNullable<Parameters<MemFsEditor['copyAsync']>[2]>, 'fileTransform' | 'transformData'> & {
    transformOptions?: ejs.Options;
  },
) {
  await this.copyAsync(from, to, {
    ...options,
    transformData: data,
    async fileTransform({ destinationPath, sourcePath, contents, data, options }) {
      const processedPath = await ejs.render(destinationPath, data, {
        ...options,
        cache: false, // Cache uses filename as key, which is not provided in this case.
      });
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : await ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            // Async option cannot be set to true because `include()` then also become async which change the behaviors of templates.
            // Users must pass async value in transformOptions if they want to use async features of ejs.
            ...options,
          });

      return { path: processedPath.replace(/.ejs$/, ''), contents: processedContent };
    },
  });
}
