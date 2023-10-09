import path from 'path';
import normalize from 'normalize-path';
import { minimatch } from 'minimatch';

import { hasClearedState, hasState } from '../state.js';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';

const defaultDumpFilter = (file) => hasClearedState(file) || hasState(file);

export type MemFsEditorFileDump = {
  contents: string | null;
  state?: string;
  stateCleared?: string;
};

export default function <EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  cwd = process.cwd(),
  filter?: string | ((file: EditorFile, cwd: string) => boolean),
) {
  const filterFile: (file: EditorFile, cwd: string) => boolean =
    typeof filter === 'string'
      ? (file: MemFsEditorFile) => defaultDumpFilter(file) && minimatch(file.path, filter)
      : filter ?? defaultDumpFilter;

  return Object.fromEntries(
    this.store
      .all()
      .filter((file) => filterFile(file, cwd))
      .map((file) => {
        const filePath = normalize(cwd ? path.relative(cwd, file.path) : file.path);
        const fileDump: MemFsEditorFileDump = {
          contents: file.contents?.toString() ?? null,
        };
        if (file.state) {
          fileDump.state = file.state;
        }

        if (file.stateCleared) {
          fileDump.stateCleared = file.stateCleared;
        }

        return [filePath, fileDump];
      }),
  );
}
