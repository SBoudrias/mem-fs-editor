import type { MemFsEditor } from '../index.js';

const DEFAULT_INDENTATION = 2;

export default function writeJSON(
  this: MemFsEditor,
  filepath: string,
  contents: any,
  replacer?: ((this: any, key: string, value: any) => any) | (number | string)[] | null,
  space?: string | number,
) {
  let jsonStr;
  if (typeof replacer === 'function') {
    jsonStr = JSON.stringify(contents, replacer, space || DEFAULT_INDENTATION) + '\n';
  } else {
    jsonStr = JSON.stringify(contents, replacer, space || DEFAULT_INDENTATION) + '\n';
  }

  return this.write(filepath, jsonStr);
}
