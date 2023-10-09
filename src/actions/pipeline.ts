import type { MemFsEditor, MemFsEditorFile } from '../index.js';
import {
  type PipelineOptions as MemFsPipelineOptions,
  type FileTransform as MemFsFileTransform,
  isFileTransform,
} from 'mem-fs';

import { isFilePending } from '../state.js';

export type PipelineOptions<EditorFile extends MemFsEditorFile> = MemFsPipelineOptions<EditorFile> & {
  pendingFiles?: boolean;
};

export type FileTransform<EditorFile extends MemFsEditorFile> = MemFsFileTransform<EditorFile>;

async function pipeline<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  options?: PipelineOptions<EditorFile> | FileTransform<EditorFile>,
  ...transforms: FileTransform<EditorFile>[]
): Promise<void> {
  let storeOptions: PipelineOptions<EditorFile> | undefined;
  let filter: ((file: EditorFile) => boolean) | undefined = isFilePending;

  if (isFileTransform(options)) {
    transforms = [options, ...transforms];
  } else if (options) {
    const { pendingFiles = true, filter: passedFilter, ...pipelineOptions } = options as PipelineOptions<EditorFile>;
    if (passedFilter && pendingFiles) {
      filter = (file: EditorFile) => isFilePending(file) && passedFilter(file);
    } else {
      filter = pendingFiles ? isFilePending : passedFilter;
    }
    storeOptions = pipelineOptions;
  }

  await this.store.pipeline({ ...storeOptions, filter }, ...transforms);
}

export default pipeline;
