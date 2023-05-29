import type { PipelineSource } from 'stream';
import type { pipeline as pipelineType } from 'stream/promises';
import readableStream from 'readable-stream';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';

const pipeline = readableStream.Stream.promises.pipeline as typeof pipelineType;

import { createPendingFilesPassthrough, createCommitTransform } from '../transform.js';
import { isFilePending } from '../state.js';

function commit<EditorFile extends MemFsEditorFile>(this: MemFsEditor<EditorFile>, stream?: PipelineSource<any>);
function commit<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  filters?: any[],
  stream?: PipelineSource<any>
);
function commit<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  filters?: any[] | PipelineSource<any>,
  stream?: PipelineSource<any>
) {
  if (!Array.isArray(filters)) {
    stream = filters;
    filters = [];
  }

  stream = stream ?? this.store.stream({ filter: (file: EditorFile) => isFilePending(file) });
  filters = filters ?? [];

  return pipeline(stream, createPendingFilesPassthrough(), ...filters, createCommitTransform(this));
}

export default commit;
