const fs = require('fs');

const STATE = 'state';

const STATE_CLEARED = 'stateCleared';

const STATE_MODIFIED = 'modified';

const STATE_DELETED = 'deleted';

const IS_NEW = 'isNew';

const setFileState = (file, state) => {
  file[STATE] = state;
};

const isFileNew = (file) => {
  if (file[IS_NEW] === undefined) {
    file[IS_NEW] = !fs.existsSync(file.path);
  }

  return file[IS_NEW];
};

const isFileStateModified = (file) => file[STATE] === STATE_MODIFIED;

const setModifiedFileState = (file) => setFileState(file, STATE_MODIFIED);

const isFileStateDeleted = (file) => file[STATE] === STATE_DELETED;

const setDeletedFileState = (file) => setFileState(file, STATE_DELETED);

const isFilePending = (file) =>
  isFileStateModified(file) || (isFileStateDeleted(file) && !isFileNew(file));

const setCommittedFile = (file) => {
  file.committed = true;
};

const isFileCommitted = (file) => Boolean(file.committed);

const resetFileState = (file) => {
  delete file[STATE];
};

const clearFileState = (file) => {
  if (file[STATE]) {
    file[STATE_CLEARED] = file[STATE];
  }

  resetFileState(file);
  delete file[IS_NEW];
};

const hasState = (file) => Boolean(file[STATE]);

const hasClearedState = (file) => Boolean(file[STATE_CLEARED]);

module.exports = {
  STATE,
  STATE_CLEARED,
  STATE_MODIFIED,
  STATE_DELETED,
  isFileStateModified,
  setModifiedFileState,
  isFileStateDeleted,
  setDeletedFileState,
  setCommittedFile,
  isFileCommitted,
  isFileNew,
  isFilePending,
  resetFileState,
  clearFileState,
  hasState,
  hasClearedState,
};
