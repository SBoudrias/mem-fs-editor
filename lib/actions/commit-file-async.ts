import fs from 'fs/promises';
import path from 'path';
import { clearFileState, isFileStateModified, isFileStateDeleted, setCommittedFile } from '../state.js';
import type { MemFsEditor, MemFsEditorFile } from '../index.js';

async function write(file: MemFsEditorFile) {
  if (!file.contents) {
    throw new Error(`${file.path} cannot write an empty file`);
  }
  const dir = path.dirname(file.path);
  try {
    if (!(await fs.stat(dir)).isDirectory()) {
      throw new Error(`${file.path} is not a directory`);
    }
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
    } else {
      throw error;
    }
  }

  const newMode = file.stat?.mode;
  await fs.writeFile(file.path, file.contents, { mode: newMode });

  if (newMode !== undefined) {
    const { mode: existingMode } = await fs.stat(file.path);
    // eslint-disable-next-line no-bitwise
    if ((existingMode & 0o777) !== (newMode & 0o777)) {
      await fs.chmod(file.path, newMode);
    }
  }
}

async function remove(file: MemFsEditorFile) {
  const remove = fs.rm || fs.rmdir;
  await remove(file.path, { recursive: true });
}

export default async function commitFileAsync<EditorFile extends MemFsEditorFile>(
  this: MemFsEditor<EditorFile>,
  file: EditorFile
) {
  const existingFile = this.store.get(file.path);
  if (!existingFile || existingFile !== file) {
    this.store.add(file);
  }

  if (isFileStateModified(file)) {
    setCommittedFile(file);
    await write(file);
  } else if (isFileStateDeleted(file)) {
    setCommittedFile(file);
    await remove(file);
  }

  clearFileState(file);
}
