import path from 'path';
import { globSync } from 'tinyglobby';
import multimatch from 'multimatch';
import normalize from 'normalize-path';

import type { MemFsEditor } from '../index.js';
import { setDeletedFileState } from '../state.js';
import { globify } from '../util.js';

export default function deleteAction(
  this: MemFsEditor,
  paths: string | string[],
  options?: { globOptions?: Omit<Parameters<typeof globSync>[0], 'patterns'> },
) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  paths = paths.map((filePath) => path.resolve(filePath));
  paths = globify(paths);
  options ||= {};

  const globOptions = options.globOptions || {};
  const files = new Set([
    ...globSync(paths, { ...globOptions, absolute: true, onlyFiles: true }).map((filePath) => path.resolve(filePath)),
    ...multimatch(
      this.store
        .all()
        .map((file) => file.path)
        .map((filePath) => normalize(filePath)),
      paths,
    ).map((filePath) => path.resolve(filePath)),
  ]);
  files.forEach((file) => {
    const storeFile = this.store.get(file);
    setDeletedFileState(storeFile);
    storeFile.contents = null;
    this.store.add(storeFile);
  });
}
