import path from 'path';
import { globSync } from 'tinyglobby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';

import type { MemFsEditorFile } from '../index.js';
import type { Store } from 'mem-fs';
import { setDeletedFileState } from '../state.js';
import { globify } from '../util.js';

function deleteFile<EditorFile extends MemFsEditorFile>(store: Store<EditorFile>, path: string) {
  const file = store.get(path);
  setDeletedFileState(file);
  file.contents = null;
  store.add(file);
}

function deleteAction<EditorFile extends MemFsEditorFile>(
  store: Store<EditorFile>,
  paths: string | string[],
  options: { globOptions?: Omit<Parameters<typeof globSync>[0], 'patterns'> } = {},
) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  paths = paths.map((filePath) => path.resolve(filePath));
  paths = globify(paths);

  const files = globSync(paths, { ...options.globOptions, absolute: true, onlyFiles: true });
  files.forEach((file) => {
    deleteFile(store, file);
  });

  store.each((file) => {
    if (multimatch([normalize(file.path)], paths).length !== 0) {
      deleteFile(store, file.path);
    }
  });
}

export default deleteAction;
