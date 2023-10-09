import { isFileTransform, type FileTransform, type PipelineOptions } from 'mem-fs';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';

import { createCommitTransform } from '../transform.js';
import { isFilePending } from '../state.js';

async function commit<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  options?: PipelineOptions<EditorFile> | FileTransform<EditorFile>,
  ...transforms: FileTransform<EditorFile>[]
): Promise<void> {
  if (isFileTransform(options)) {
    transforms = [options, ...transforms];
    options = undefined;
  }

  await this.store.pipeline({ filter: isFilePending, ...options }, ...transforms, createCommitTransform());
}

export default commit;
