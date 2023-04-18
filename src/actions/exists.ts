import type { MemFsEditor } from '../index.js';

export default function exist(this: MemFsEditor, filepath: string) {
  const file = this.store.get(filepath);

  return file.contents !== null;
}
