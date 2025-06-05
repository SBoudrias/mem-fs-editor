import type { MemFsEditor } from '../index.js';

function read(
  this: MemFsEditor,
  filepath: string,
  options?: { raw?: boolean; defaults?: string | null },
): string | null;
function read(
  this: MemFsEditor,
  filepath: string,
  options: { raw?: true; defaults?: Buffer | null },
): Buffer | string | null;
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

  return options.raw ? file.contents : file.contents.toString() || null;
}

export default read;
