import { Transform, TransformCallback } from 'stream';

import { isFilePending } from './state.js';
import type { MemFsEditor, MemFsEditorFile } from './index.js';

export function createTransform<EditorFile extends MemFsEditorFile = MemFsEditorFile>(
  transform: (file: EditorFile, encoding: BufferEncoding, cb: TransformCallback) => void
) {
  return new Transform({
    objectMode: true,
    transform(...args) {
      transform.apply(this, args);
    },
  });
}

export const createPendingFilesPassthrough = () =>
  createTransform((file, _enc, cb) => {
    // Don't process deleted file who haven't been commited yet.
    cb(undefined, isFilePending(file) ? file : undefined);
  });

export const createCommitTransform = <EditorFile extends MemFsEditorFile = MemFsEditorFile>(
  memFsEditor: MemFsEditor<EditorFile>
) =>
  createTransform<EditorFile>((file, _enc, cb) => {
    memFsEditor
      .commitFileAsync(file)
      .then(() => cb())
      .catch((error) => cb(error));
  });
