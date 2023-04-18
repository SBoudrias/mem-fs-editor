import { EOL } from 'os';
import type { MemFsEditor } from '../index.js';

export type AppendOptions = { create?: boolean; trimEnd?: boolean; separator?: string };

export default function append(this: MemFsEditor, to: string, contents: string | Buffer, options?: AppendOptions) {
  options = {
    trimEnd: true,
    separator: EOL,
    ...options,
  };

  if (!this.exists(to) && options.create) {
    this.write(to, contents);
    return;
  }

  let currentContents = this.read(to);
  if (!currentContents) {
    throw new Error(`Error appending to ${to}, file is empty.`);
  }
  if (currentContents && options.trimEnd) {
    currentContents = currentContents.replace(/\s+$/, '');
  }

  this.write(to, currentContents + options.separator + contents.toString());
}
