import extend from 'deep-extend';
import type { MemFsEditor } from '../index.js';

export default function extendJSON(
  this: MemFsEditor,
  filepath: string,
  contents?: Record<string, unknown>,
  replacer?: ((this: any, key: string, value: any) => any) | (number | string)[] | null,
  space?: string | number
) {
  const originalContent = this.readJSON(filepath, {});
  const newContent = extend({}, originalContent, contents);

  this.writeJSON(filepath, newContent, replacer, space);
}
