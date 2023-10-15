import { Duplex } from 'stream';
import commitFileAsync from './actions/commit-file-async.js';
import type { MemFsEditorFile } from './index.js';

export const createCommitTransform = <EditorFile extends MemFsEditorFile = MemFsEditorFile>() =>
  Duplex.from(async function* (generator: AsyncGenerator<EditorFile>) {
    for await (const file of generator) {
      await commitFileAsync(file);
      yield file;
    }
  });
