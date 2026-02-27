import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';

export default function appendTpl(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: NonNullable<Parameters<MemFsEditor['append']>[2]>,
) {
  if (tplOptions?.async) {
    throw new Error('Async EJS rendering is not supported');
  }

  this.append(to, ejs.render(contents.toString(), data, { ...tplOptions, async: false }), options);
}
