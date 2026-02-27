import { isBinary } from '../util.js';
import type { MemFsEditor } from '../index.js';
import ejs from 'ejs';

export default async function (
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data: ejs.Data = {},
  tplOptions?: ejs.Options,
  options?: Omit<NonNullable<Parameters<MemFsEditor['copyAsync']>[2]>, 'fileTransform'>,
) {
  await this.copyAsync(from, to, {
    ...options,
    async fileTransform(destPath: string, sourcePath: string, contents: Buffer): Promise<[string, string | Buffer]> {
      const processedPath = await ejs.render(destPath, data, tplOptions);
      const processedContent = isBinary(sourcePath, contents)
        ? contents
        : await ejs.render(contents.toString(), data, {
            // Setting filename by default allow including partials.
            filename: sourcePath,
            cache: false,
            ...tplOptions,
            // This cannot be set to true because `include()` then also become async which change the behaviors of templates...
          });

      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
