import type { MemFsEditor } from '../index.js';

function read(this: MemFsEditor, filepath: string, options?: never): string;
function read<const DefaultType extends string | null>(
  this: MemFsEditor,
  filepath: string,
  options: { raw?: false; defaults: DefaultType },
): string | DefaultType;
function read(this: MemFsEditor, filepath: string, options: { raw: true; defaults?: never }): Buffer;
function read<const DefaultType extends Buffer | null>(
  this: MemFsEditor,
  filepath: string,
  options: { raw: true; defaults: DefaultType },
): Buffer | DefaultType;
function read(
  this: MemFsEditor,
  filepath: string,
  options?: { raw?: boolean; defaults?: string | Buffer | null },
): Buffer | string | null {
  options ||= { raw: false };
  const file = this.store.get(filepath);

  if (file.contents === null) {
    if ('defaults' in options) {
      return options.defaults ?? null;
    }

    throw new Error(filepath + " doesn't exist");
  }

  return options.raw ? file.contents : file.contents.toString();
}

export default read;
