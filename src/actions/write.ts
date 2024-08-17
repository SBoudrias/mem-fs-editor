import assert from 'assert';
import { resolve } from 'path';

import { isFileStateModified, setModifiedFileState } from '../state.js';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';
import File from 'vinyl';

type CompareFile = { contents: null | Buffer; stat?: { mode?: number } | null };

export const isMemFsEditorFileEqual = (a: CompareFile, b: CompareFile) => {
  if (a.stat?.mode !== b.stat?.mode) {
    return false;
  }
  return a.contents === b.contents || a.contents?.equals(b.contents!);
};

export function _write<EditorFile extends MemFsEditorFile>(this: MemFsEditor<EditorFile>, file: EditorFile) {
  if (this.store.existsInMemory(file.path)) {
    // Backward compatibility, keep behavior for existing files, custom properties may have been added
    const existingFile = this.store.get(file.path);
    if (!isFileStateModified(existingFile) || !isMemFsEditorFileEqual(existingFile, file)) {
      const { contents, stat } = file;
      setModifiedFileState(existingFile);
      Object.assign(existingFile, { contents, stat: stat ?? existingFile.stat });
      this.store.add(existingFile);
    }
  } else {
    setModifiedFileState(file);
    this.store.add(file);
  }
}

export default function write(
  this: MemFsEditor,
  filepath: string,
  contents: string | Buffer,
  stat: { mode?: number } | null = null,
) {
  assert(typeof contents === 'string' || Buffer.isBuffer(contents), 'Expected `contents` to be a String or a Buffer');

  const newContents = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  this._write(
    new File({
      path: resolve(filepath),
      contents: newContents,
      stat: stat as any,
    }),
  );
  return contents.toString();
}
