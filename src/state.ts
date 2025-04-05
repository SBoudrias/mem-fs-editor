import fs from 'fs';
import { MemFsEditorFile } from './index.js';

const states: Record<string, MemFsEditorFile['state']> = {
  MODIFIED: 'modified',
  DELETED: 'deleted',
};

export const setFileState = (file: MemFsEditorFile, state: MemFsEditorFile['state']) => {
  file.state = state;
};

export const isFileNew = (file: MemFsEditorFile) => {
  if (file.isNew === undefined) {
    file.isNew = !fs.existsSync(file.path);
  }

  return file.isNew;
};

export const isFileStateModified = (file: MemFsEditorFile) => file.state === states.MODIFIED;

export const setModifiedFileState = (file: MemFsEditorFile) => {
  setFileState(file, states.MODIFIED);
};

export const isFileStateDeleted = (file: MemFsEditorFile) => file.state === states.DELETED;

export const setDeletedFileState = (file: MemFsEditorFile) => {
  setFileState(file, states.DELETED);
};

export const isFilePending = (file: MemFsEditorFile) =>
  isFileStateModified(file) || (isFileStateDeleted(file) && !isFileNew(file));

export const setCommittedFile = (file: MemFsEditorFile) => {
  file.committed = true;
};

export const isFileCommitted = (file: MemFsEditorFile) => Boolean(file.committed);

export const resetFileState = (file: MemFsEditorFile) => {
  delete file.state;
};

/**
 * Delete commit related states.
 */
export const resetFileCommitStates = (file: MemFsEditorFile) => {
  delete file.stateCleared;
  delete file.committed;
};

/**
 * Delete all mem-fs-editor`s related states.
 */
export const resetFile = (file: MemFsEditorFile) => {
  resetFileState(file);
  resetFileCommitStates(file);
  delete file.isNew;
};

export const clearFileState = (file: MemFsEditorFile) => {
  if (file.state) {
    file.stateCleared = file.state;
  }

  resetFileState(file);
  delete file.isNew;
};

export const hasState = (file: MemFsEditorFile) => Boolean(file.state);

export const hasClearedState = (file: MemFsEditorFile) => Boolean(file.stateCleared);
