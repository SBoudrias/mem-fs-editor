import type { MemFsEditor } from '../index.js';

function read<const DefaultType extends string | null = string>(
  this: MemFsEditor,
  filepath: string,
  options?: { raw?: boolean; defaults?: DefaultType },
): string | DefaultType;
function read<const DefaultType extends Buffer | null = Buffer>(
  this: MemFsEditor,
  filepath: string,
  options: { raw?: true; defaults?: DefaultType },
): Buffer | string | DefaultType;
function read(
  this: MemFsEditor,
  filepath: string,
  options?: { raw?: boolean; defaults?: string | Buffer | null },
): Buffer | string | null {
  options ||= { raw: false };
  const file = this._getExisting(filepath);

  if (file === null) {
    if ('defaults' in options) {
      return options.defaults ?? null;
    }

    throw new Error(filepath + " doesn't exist");
  }

  return options.raw ? file.contents : file.contents.toString();
}

export default read;
