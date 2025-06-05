import { Data, Options } from 'ejs';
import { isBinary, render } from '../util.js';
import type { MemFsEditor } from '../index.js';
import { CopySingleOptions } from './copy.js';

export function _processTpl(
  this: MemFsEditor,
  {
    contents,
    filename,
    context,
    tplSettings,
  }: {
    contents: Buffer;
    filename: string;
    destination?: string;
    context?: Data;
    tplSettings?: Options;
  },
) {
  if (isBinary(filename, contents)) {
    return contents;
  }

  return render(contents.toString(), context, {
    // Setting filename by default allow including partials.
    filename,
    cache: true,
    ...tplSettings,
  });
}

export function copyTpl(
  this: MemFsEditor,
  from: string | string[],
  to: string,
  context?: Data,
  tplSettings?: Options,
  options?: CopySingleOptions,
) {
  context ||= {};
  tplSettings ||= {};

  this.copy(
    from,
    to,
    {
      processDestinationPath: (path) => path.replace(/.ejs$/, ''),
      ...options,
      process: (contents, filename) => this._processTpl({ contents, filename, context, tplSettings }),
    },
    context,
    tplSettings,
  );
}
