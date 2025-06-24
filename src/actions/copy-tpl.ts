import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import type { CopyOptions } from './copy.js';
import { processTpl } from '../util.js';

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

  this.copy(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      process: (contents, filename) => processTpl({ contents, filename, data, tplOptions }),
    },
    data,
    tplOptions,
  );
}
