import type { MemFsEditor } from '../index.js';

const DEFAULT_INDENTATION = 2;

export default function writeJSON(
  this: MemFsEditor,
  filepath: string,
  contents: any,
  replacer?: ((this: any, key: string, value: any) => any) | (number | string)[] | null,
  space?: string | number,
) {
  return this.write(
    filepath,
    JSON.stringify(
      contents,
      // Convert to any due to multiples stringify signatures.
      replacer as any,
      space || DEFAULT_INDENTATION,
    ) + '\n',
  );
}
