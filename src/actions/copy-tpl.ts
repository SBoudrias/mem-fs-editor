import type { Data, Options } from 'ejs';
import type { MemFsEditor } from '../index.js';
import type { CopyOptions } from './copy.js';
import { processTpl } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  context?: Data,
  tplSettings?: Options,
  options?: CopyOptions,
) {
  context ||= {};
  tplSettings ||= {};

  this.copy(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      process: (contents, filename) => processTpl({ contents, filename, context, tplSettings }),
    },
    context,
    tplSettings,
  );
}
