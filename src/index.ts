import type { Store } from 'mem-fs';
import type Vinyl from 'vinyl';

export type { PipelineOptions, FileTransform } from 'mem-fs';

import read from './actions/read.js';
import readJSON from './actions/read-json.js';
import exists from './actions/exists.js';
import write, { _write } from './actions/write.js';
import writeJSON from './actions/write-json.js';
import extendJSON from './actions/extend-json.js';
import append from './actions/append.js';
import appendTpl from './actions/append-tpl.js';
import deleteAction from './actions/delete.js';
import { copy, _copySingle } from './actions/copy.js';
import { copyTpl, _processTpl } from './actions/copy-tpl.js';
import { copyAsync, _copySingleAsync } from './actions/copy-async.js';
import copyTplAsync from './actions/copy-tpl-async.js';
import move from './actions/move.js';
import commit from './actions/commit.js';
import dump from './actions/dump.js';

export type { AppendOptions } from './actions/append.js';
export type { CopyOptions } from './actions/copy.js';
export type { CopyAsyncOptions } from './actions/copy-async.js';
export type { MemFsEditorFileDump } from './actions/dump.js';

export interface MemFsEditorFile {
  path: string;
  stat?: { mode?: number } | null;
  contents: Buffer | null;

  committed?: boolean;
  isNew?: boolean;
  state?: 'modified' | 'deleted';
  stateCleared?: 'modified' | 'deleted';
}

// We don't support StreamFile and stat is not guaranteed to be a fs.Stat instance
export interface VinylMemFsEditorFile extends Omit<Vinyl, 'contents' | 'stat'>, MemFsEditorFile {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MemFsEditor<EditorFile extends MemFsEditorFile = VinylMemFsEditorFile> {
  store: Store<EditorFile>;

  constructor(store: Store<EditorFile>) {
    this.store = store;
  }
}

export interface MemFsEditor<EditorFile extends MemFsEditorFile = VinylMemFsEditorFile> {
  read: typeof read;
  readJSON: typeof readJSON;
  exists: typeof exists;
  _write: typeof _write<EditorFile>;
  write: typeof write;
  writeJSON: typeof writeJSON;
  extendJSON: typeof extendJSON;
  append: typeof append;
  appendTpl: typeof appendTpl;
  delete: typeof deleteAction;
  copy: typeof copy;
  _copySingle: typeof _copySingle;
  copyTpl: typeof copyTpl;
  _processTpl: typeof _processTpl;
  copyAsync: typeof copyAsync;
  _copySingleAsync: typeof _copySingleAsync;
  copyTplAsync: typeof copyTplAsync;
  move: typeof move;
  commit: typeof commit<EditorFile>;
  dump: typeof dump<EditorFile>;
}

MemFsEditor.prototype.read = read;
MemFsEditor.prototype.readJSON = readJSON;
MemFsEditor.prototype.exists = exists;
MemFsEditor.prototype._write = _write;
MemFsEditor.prototype.write = write;
MemFsEditor.prototype.writeJSON = writeJSON;
MemFsEditor.prototype.extendJSON = extendJSON;
MemFsEditor.prototype.append = append;
MemFsEditor.prototype.appendTpl = appendTpl;
MemFsEditor.prototype.delete = deleteAction;
MemFsEditor.prototype.copy = copy;
MemFsEditor.prototype._copySingle = _copySingle;
MemFsEditor.prototype.copyTpl = copyTpl;
MemFsEditor.prototype._processTpl = _processTpl;
MemFsEditor.prototype.copyAsync = copyAsync;
MemFsEditor.prototype._copySingleAsync = _copySingleAsync;
MemFsEditor.prototype.copyTplAsync = copyTplAsync;
MemFsEditor.prototype.move = move;
MemFsEditor.prototype.commit = commit;
MemFsEditor.prototype.dump = dump;

export function create<T extends MemFsEditorFile>(store: Store<T>) {
  return new MemFsEditor<T>(store);
}
