import { isBinary } from '../util.js';
import type { MemFsEditor } from '../index.js';
import ejs from 'ejs';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  options?: Omit<NonNullable<Parameters<MemFsEditor['copyAsync']>[2]>, 'fileTransform'> & {
    transformOptions?: ejs.Options;
  },
) {
  await this.copyAsync(from, to, {
    ...options,
    async fileTransform(destinationPath, sourcePath, contents) {
      const { transformOptions } = options ?? {};
      const processedPath = await ejs.render(destinationPath, data, transformOptions);
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : await ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            cache: false,
            ...transformOptions,
            // This cannot be set to true because `include()` then also become async which change the behaviors of templates...
          });

      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
