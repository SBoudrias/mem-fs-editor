import type { MemFsEditor } from '../index.js';

const DEFAULT_INDENTATION = 2;

export default function writeJSON(
  this: MemFsEditor,
  filepath: string,
  contents: any,
  replacer?: ((this: any, key: string, value: any) => any) | (number | string)[] | null,
  space?: string | number,
) {
  /* c8 ignore next 4 */
  const jsonStr =
    typeof replacer === 'function'
      ? JSON.stringify(contents, replacer, space || DEFAULT_INDENTATION) + '\n'
      : JSON.stringify(contents, replacer, space || DEFAULT_INDENTATION) + '\n';

  return this.write(filepath, jsonStr);
}
