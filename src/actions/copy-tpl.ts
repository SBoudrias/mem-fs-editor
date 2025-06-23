import type { Data } from 'ejs';
import type { MemFsEditor } from '../index.js';
import type { CopyOptions } from './copy.js';
import { processTpl } from '../util.js';

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  templateData: Data = {},
  options: Omit<CopyOptions, 'templateData'> = {},
) {
  const { templateOptions } = options;
  this.copy(from, to, {
    processDestinationPath: (path) => path.replace(/.ejs$/, ''),
    ...options,
    process: (contents, filename) => processTpl({ contents, filename, templateData, templateOptions }),
    templateData,
  });
}
