import type { MemFsEditor } from '../index.js';
import { CopyOptions } from './copy.js';

export default function (this: MemFsEditor, from: string, to: string, options?: CopyOptions) {
  this.copy(from, to, options);
  this.delete(from, options);
}
