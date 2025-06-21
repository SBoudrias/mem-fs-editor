import type { MemFsEditor } from '../index.js';

export default function readJSON(this: MemFsEditor, filepath: string, defaults?: undefined): object | undefined;
export default function readJSON<T>(this: MemFsEditor, filepath: string, defaults: T): object | T;
export default function readJSON(this: MemFsEditor, filepath: string, defaults?: unknown) {
  if (this.exists(filepath)) {
    try {
      const content = this.read(filepath);
      return JSON.parse(content) as object;
    } catch (error) {
      throw new Error('Could not parse JSON in file: ' + filepath + '. Detail: ' + (error as Error).message);
    }
  } else {
    return defaults;
  }
}
