import fs from 'fs';
import { MemFsEditorFile } from './index.js';

const STATE = 'state';

const STATE_CLEARED = 'stateCleared';

const STATE_MODIFIED = 'modified';

const STATE_DELETED = 'deleted';

const IS_NEW = 'isNew';

export const setFileState = (file: MemFsEditorFile, state) => {
  file[STATE] = state;
};

export const isFileNew = (file: MemFsEditorFile) => {
  if (file[IS_NEW] === undefined) {
    file[IS_NEW] = !fs.existsSync(file.path);
  }

  return file[IS_NEW];
};

export const isFileStateModified = (file: MemFsEditorFile) => file[STATE] === STATE_MODIFIED;

export const setModifiedFileState = (file: MemFsEditorFile) => {
  setFileState(file, STATE_MODIFIED);
};

export const isFileStateDeleted = (file: MemFsEditorFile) => file[STATE] === STATE_DELETED;

export const setDeletedFileState = (file: MemFsEditorFile) => {
  setFileState(file, STATE_DELETED);
};

export const isFilePending = (file: MemFsEditorFile) =>
  isFileStateModified(file) || (isFileStateDeleted(file) && !isFileNew(file));

export const setCommittedFile = (file: MemFsEditorFile) => {
  file.committed = true;
};

export const isFileCommitted = (file: MemFsEditorFile) => Boolean(file.committed);

export const resetFileState = (file: MemFsEditorFile) => {
  delete file[STATE];
};

/**
 * Delete commit related states.
 */
export const resetFileCommitStates = (file: MemFsEditorFile) => {
  delete file[STATE_CLEARED];
  delete file.committed;
};

/**
 * Delete all mem-fs-editor`s related states.
 */
export const resetFile = (file: MemFsEditorFile) => {
  resetFileState(file);
  resetFileCommitStates(file);
  delete file[IS_NEW];
};

export const clearFileState = (file: MemFsEditorFile) => {
  if (file[STATE]) {
    file[STATE_CLEARED] = file[STATE];
  }

  resetFileState(file);
  delete file[IS_NEW];
};

export const hasState = (file: MemFsEditorFile) => Boolean(file[STATE]);

export const hasClearedState = (file: MemFsEditorFile) => Boolean(file[STATE_CLEARED]);
