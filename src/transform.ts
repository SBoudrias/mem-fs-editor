import type { MemFsEditor, MemFsEditorFile } from './index.js';
import { Duplex } from 'stream';

export const createCommitTransform = <EditorFile extends MemFsEditorFile = MemFsEditorFile>(
  memFsEditor: MemFsEditor<EditorFile>
) =>
  Duplex.from(async function* (generator: AsyncGenerator<EditorFile>) {
    for await (const file of generator) {
      await memFsEditor.commitFileAsync(file);
      yield file;
    }
  });
