import { EOL } from 'os';
import type { MemFsEditor } from '../index.js';

export type AppendOptions = { create?: boolean; trimEnd?: boolean; separator?: string };

export default function append(this: MemFsEditor, to: string, contents: string | Buffer, options?: AppendOptions) {
  const opts = {
    trimEnd: true,
    separator: EOL,
    ...options,
  };

  if (!this.exists(to) && opts.create) {
    this.write(to, contents);
    return;
  }

  let currentContents = this.read(to);
  if (!currentContents) {
    throw new Error(`Error appending to ${to}, file is empty.`);
  }

  if (currentContents && opts.trimEnd) {
    currentContents = currentContents.replace(/\s+$/, '');
  }

  this.write(to, currentContents + opts.separator + contents.toString());
}
