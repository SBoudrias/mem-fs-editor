import assert from 'assert';
import { resolve } from 'path';
import fs from 'fs';
import { isFileStateModified, setModifiedFileState } from '../state.js';
import File from 'vinyl';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';
import type { Store } from 'mem-fs';

type CompareFile = { contents: null | Buffer; stat?: { mode?: number } | null };

export const isMemFsEditorFileEqual = (a: CompareFile, b: CompareFile) => {
  /* c8 ignore next */
  if (a.stat?.mode !== b.stat?.mode) {
    return false;
  }

  return a.contents === b.contents || (a.contents && b.contents && a.contents.equals(b.contents));
};

export function writeInternal<EditorFile extends MemFsEditorFile>(store: Store<EditorFile>, file: EditorFile) {
  if (store.existsInMemory(file.path)) {
    // Backward compatibility, keep behavior for existing files, custom properties may have been added
    const existingFile = store.get(file.path);
    if (!isFileStateModified(existingFile) || !isMemFsEditorFileEqual(existingFile, file)) {
      const { contents, stat } = file;
      setModifiedFileState(existingFile);
      Object.assign(existingFile, { contents, stat: stat ?? existingFile.stat });
      store.add(existingFile);
    }
  } else {
    setModifiedFileState(file);
    store.add(file);
  }
}

export default function write(
  this: MemFsEditor,
  filepath: string,
  contents: string | Buffer,
  stat: fs.Stats | undefined = undefined,
) {
  assert(typeof contents === 'string' || Buffer.isBuffer(contents), 'Expected `contents` to be a String or a Buffer');

  const newContents = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);

  writeInternal(
    this.store,
    new File({
      path: resolve(filepath),
      contents: newContents,
      stat,
    }),
  );

  return contents.toString();
}
