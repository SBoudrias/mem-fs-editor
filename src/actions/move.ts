import type { MemFsEditor } from '../index.js';
import { CopyOptions } from './copy.js';
import deleteAction from './delete.js';

export default function (this: MemFsEditor, from: string, to: string, options?: CopyOptions) {
  this.copy(from, to, options);
  deleteAction(this.store, from, options);
}
