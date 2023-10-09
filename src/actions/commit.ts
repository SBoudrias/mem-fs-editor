import { isFileTransform } from 'mem-fs';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';
import type { FileTransform, PipelineOptions } from './pipeline.js';

import { createCommitTransform } from '../transform.js';

async function commit<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  options?: PipelineOptions<EditorFile> | FileTransform<EditorFile>,
  ...transforms: FileTransform<EditorFile>[]
): Promise<void> {
  await this.pipeline(options, ...transforms, createCommitTransform(this));
}

export default commit;
