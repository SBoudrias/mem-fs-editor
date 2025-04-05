import path from 'path';
import { globbySync, type Options as GlobbyOptions } from 'globby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';

import type { MemFsEditor, MemFsEditorFile } from '../index.js';
import type { Store } from 'mem-fs';
import { setDeletedFileState } from '../state.js';
import { globify } from '../util.js';

function deleteFile(path: string, store: Store<MemFsEditorFile>) {
  const file = store.get(path);
  setDeletedFileState(file);
  file.contents = null;
  store.add(file);
}

export default function deleteAction(
  this: MemFsEditor,
  paths: string | string[],
  options?: { globOptions?: GlobbyOptions },
) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  paths = paths.map((filePath) => path.resolve(filePath));
  paths = globify(paths);
  options ||= {};

  const globOptions = options.globOptions || {};
  const files = globbySync(paths, globOptions);
  files.forEach((file) => {
    deleteFile(file, this.store);
  });

  this.store.each((file) => {
    if (multimatch([normalize(file.path)], paths).length !== 0) {
      deleteFile(file.path, this.store);
    }
  });
}
