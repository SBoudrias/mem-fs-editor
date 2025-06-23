import { EOL } from 'os';
import type { MemFsEditor } from '../index.js';

export default function append(
  this: MemFsEditor,
  to: string,
  contents: string | Buffer,
  options?: { create?: boolean; trimEnd?: boolean; separator?: string },
) {
  const opts = {
    create: false,
    trimEnd: true,
    separator: EOL,
    ...options,
  };

  if (!this.exists(to) && !opts.create) {
    throw new Error(`${to} doesn't exist`);
  }

  let currentContent = this.read(to, { defaults: '' });
  if (currentContent && opts.trimEnd) {
    currentContent = currentContent.trimEnd();
  }

  const newContent = currentContent ? currentContent + opts.separator + contents.toString() : contents;
  this.write(to, newContent);
}
