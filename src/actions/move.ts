import type { MemFsEditor } from '../index.js';

export default function (this: MemFsEditor, from: string, to: string, options?: Parameters<MemFsEditor['copy']>[2]) {
  this.copy(from, to, options);
  this.delete(from, options);
}
