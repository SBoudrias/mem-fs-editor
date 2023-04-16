import { describe, it, expect } from 'vitest';
import filesystem from 'fs';
import path from 'path';
import sinon from 'sinon';
import util from '../lib/util.js';
import normalize from 'normalize-path';
import { getFixture } from './fixtures.js';

describe('util.getCommonPath()', () => {
  it('find the common root of /a/b/c, where /a/b/c is an existing directory', () => {
    const filePath = getFixture();
    expect(util.getCommonPath(filePath)).toBe(filePath);
  });

  it('find the common root of /a/b/c, where /a/b/c is an existing file', () => {
    const filePath = getFixture();
    expect(util.getCommonPath(path.join(filePath, 'file-a.txt'))).toBe(filePath);
  });

  it('find the common root of /a/b/c, where /a/b/c is a non-existing file', () => {
    const filePath = getFixture();
    expect(util.getCommonPath(path.join(filePath, 'does-not-exists.txt'))).toBe(filePath);
  });

  it('find the common root of glob /a/b/**', () => {
    expect(util.getCommonPath('/a/b/**')).toBe('/a/b');
  });

  it('find the common root of glob /a/b*/c', () => {
    expect(util.getCommonPath('/a/b*/c')).toBe('/a');
  });

  it('find the common root of glob /a/b/*.ext', () => {
    expect(util.getCommonPath('/a/b/*.ext')).toBe('/a/b');
  });

  it('find the common root of multiple globs', () => {
    expect(util.getCommonPath(['/a/b/*.ext', '/a/b/c/*.ext', '!**/c/**'])).toBe('/a/b');
  });
});

describe('util.globify()', () => {
  it('returns path for file path', () => {
    const filePath = getFixture('file-a.txt');
    expect(util.globify(filePath)).toBe(normalize(filePath));
  });

  it('returns pattern matching both files and directory for nonexisting paths', () => {
    const filePath = '/nonexisting.file';
    expect(util.globify(filePath)).toEqual([
      normalize(filePath),
      normalize(path.join(filePath, '**')),
    ]);
  });

  it('returns glob for glob path', () => {
    const filePath = getFixture('*.txt');
    expect(util.globify(filePath)).toBe(normalize(filePath));

    const filePath2 = getFixture('file-{a,b}.txt');
    expect(util.globify(filePath2)).toBe(normalize(filePath2));
  });

  it('returns globified path for directory path', () => {
    const filePath = getFixture('nested');
    expect(util.globify(filePath)).toBe(normalize(path.join(filePath, '**')));
  });

  it('throws if target path is neither a file or a directory', () => {
    sinon.stub(filesystem, 'statSync').returns({
      isFile: () => false,
      isDirectory: () => false,
    });

    const filePath = getFixture('file-a.txt');
    expect(util.globify.bind(util, filePath)).toThrow();

    filesystem.statSync.restore();
  });
});
