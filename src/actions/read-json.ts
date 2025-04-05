import type { MemFsEditor } from '../index.js';

export default function readJSON(this: MemFsEditor, filepath: string, defaults?: any) {
  if (this.exists(filepath)) {
    try {
      const content = this.read(filepath);
      if (!content) {
        throw new Error(`${filepath} has no content`);
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error('Could not parse JSON in file: ' + filepath + '. Detail: ' + (error as Error).message);
    }
  } else {
    return defaults;
  }
}
