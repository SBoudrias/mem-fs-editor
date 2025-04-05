import { Transform } from 'stream';
import commitFileAsync from './actions/commit-file-async.js';
import type { MemFsEditorFile } from './index.js';

export const createCommitTransform = () =>
  new Transform({
    objectMode: true,
    transform(file: MemFsEditorFile, _encoding, callback) {
      commitFileAsync(file).then(
        () => {
          callback(null, file);
        },
        (error) => {
          callback(error);
        },
      );
    },
  });
