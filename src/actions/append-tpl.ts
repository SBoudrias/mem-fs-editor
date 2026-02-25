import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';

export default function appendTpl(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: Parameters<MemFsEditor['append']>[2],
) {
  this.append(to, ejs.render(contents.toString(), data, tplOptions), options);
}
