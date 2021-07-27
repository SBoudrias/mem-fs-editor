const {createTransform} = require('./util');
const {isFilePending} = require('./state');

const createPendingFilesPassthrough = () => createTransform((file, _enc, cb) => {
  // Don't process deleted file who haven't been commited yet.
  cb(undefined, isFilePending(file) ? file : undefined);
});

const createCommitTransform = memFsEditor => createTransform((file, _enc, cb) => {
  memFsEditor.commitFileAsync(file).then(() => cb()).catch(error => cb(error));
});

module.exports = {createPendingFilesPassthrough, createCommitTransform};
