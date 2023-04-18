import assert from 'assert';

import { isFileStateModified, setModifiedFileState } from '../state.js';
import type { MemFsEditor } from '../index.js';

export default function write(
  this: MemFsEditor,
  filepath: string,
  contents: string | Buffer,
  stat?: { mode?: number } | null
) {
  assert(typeof contents === 'string' || Buffer.isBuffer(contents), 'Expected `contents` to be a String or a Buffer');

  const file = this.store.get(filepath);
  const newContents = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (
    !isFileStateModified(file) ||
    !Buffer.isBuffer(file.contents) ||
    !newContents.equals(file.contents) ||
    (stat && file.stat !== stat)
  ) {
    setModifiedFileState(file);
    file.contents = newContents;
    file.stat = stat ?? null;
    this.store.add(file);
  }

  return file.contents.toString();
}
