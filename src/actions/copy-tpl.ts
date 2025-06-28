import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import type { CopyOptions } from './copy.js';
import { processTpl, renderTpl } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: CopyOptions,
) {
  data ||= {};
  tplOptions ||= {};

  this.copy(from, to, {
    ...options,
    fileTransform(destPath: string, sourcePath: string, contents: Buffer) {
      const processedPath = renderTpl(destPath, data, tplOptions);
      const processedContent = processTpl({ contents, filename: sourcePath, data, tplOptions });
      return [processedPath.replace(/.ejs$/, ''), processedContent];
    },
  });
}
