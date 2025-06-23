import ejs from 'ejs';
import type { MemFsEditor } from '../index.js';
import { renderTpl } from '../util.js';
import { AppendOptions } from './append.js';

export default function appendTpl(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  data?: ejs.Data,
  tplOptions?: ejs.Options,
  options?: AppendOptions,
) {
  this.append(to, renderTpl(contents.toString(), data, tplOptions), options);
}
