import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import { renderTpl } from '../util.js';
import append from './append.js';

export default function appendTpl(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: Parameters<typeof append>[2],
) {
  this.append(to, renderTpl(contents.toString(), data, tplOptions), options);
}
