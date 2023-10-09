import { Data, Options } from 'ejs';
import type { MemFsEditor } from '../index.js';
import { render } from '../util.js';
import { AppendOptions } from './append.js';

export default function appendTpl(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  context?: Data,
  tplSettings?: Options,
  options?: AppendOptions,
) {
  this.append(to, render(contents.toString(), context, tplSettings), options);
}
