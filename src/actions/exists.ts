import type { MemFsEditor, VinylMemFsEditorFile } from '../index.js';

type ExistingFile = { contents: Exclude<VinylMemFsEditorFile['contents'], null> } & VinylMemFsEditorFile;

export function getExisting(this: MemFsEditor, filepath: string): ExistingFile | null {
  const file = this.store.get(filepath);

  return file.contents === null ? null : (file as ExistingFile);
}

export default function exist(this: MemFsEditor, filepath: string) {
  return this._getExisting(filepath) !== null;
}
