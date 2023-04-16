import { describe, beforeEach, it, expect } from 'vitest';
import { getFixture } from './fixtures.js';
import {
  clearFileState,
  hasClearedState,
  isFileCommitted,
  isFileNew,
  isFilePending,
  isFileStateDeleted,
  isFileStateModified,
  resetFile,
  resetFileCommitStates,
  resetFileState,
  setCommittedFile,
  setDeletedFileState,
  setModifiedFileState,
} from '../lib/state.js';

describe('state', () => {
  let file;
  beforeEach(() => {
    file = {};
  });

  it('setModifiedFileState()/isFileStateModified()', () => {
    expect(file.state).toBe(undefined);
    expect(isFileStateModified(file)).toBe(false);

    setModifiedFileState(file);

    expect(file.state).toBe('modified');
    expect(isFileStateModified(file)).toBe(true);
  });

  it('setDeletedFileState()/isFileStateDeleted()', () => {
    expect(file.state).toBe(undefined);
    expect(isFileStateDeleted(file)).toBe(false);

    setDeletedFileState(file);

    expect(file.state).toBe('deleted');
    expect(isFileStateDeleted(file)).toBe(true);
  });

  it('setCommittedFile()/fileStateIsCommitted()', () => {
    expect(file.committed).toBe(undefined);
    expect(isFileCommitted(file)).toBe(false);

    setCommittedFile(file);

    expect(file.committed).toBe(true);
    expect(isFileCommitted(file)).toBe(true);
  });

  it('resetFileState()', () => {
    file.state = 'foo';
    file.isNew = true;

    resetFileState(file);

    expect(file.state).toBe(undefined);
    expect(file.isNew).toBe(true);
  });

  it('resetFileCommitStates()', () => {
    file.state = 'foo';
    file.isNew = true;
    file.stateCleared = 'bar';
    file.committed = true;

    resetFileCommitStates(file);

    expect(file.state).toBe('foo');
    expect(file.isNew).toBe(true);
    expect(file.stateCleared).toBe(undefined);
    expect(file.committed).toBe(undefined);
  });

  it('resetFile()', () => {
    file.state = 'foo';
    file.isNew = true;
    file.stateCleared = 'bar';
    file.committed = true;

    resetFile(file);

    expect(file.state).toBe(undefined);
    expect(file.isNew).toBe(undefined);
    expect(file.stateCleared).toBe(undefined);
    expect(file.committed).toBe(undefined);
  });

  it('clearFileState()', () => {
    file.state = 'foo';
    file.isNew = true;

    clearFileState(file);

    expect(file.state).toBe(undefined);
    expect(file.clearedState).toBe(file.state);
    expect(file.isNew).toBe(undefined);
    expect(hasClearedState(file)).toBe(true);
  });

  describe('isFileNew()', () => {
    it('with new file', () => {
      expect(file.isNew).toBe(undefined);
      file.path = 'foo';

      expect(isFileNew(file)).toBe(true);
      expect(file.isNew).toBe(true);
    });

    it('with existing file', () => {
      expect(file.isNew).toBe(undefined);
      file.path = getFixture('file-a.txt');

      expect(isFileNew(file)).toBe(false);
      expect(file.isNew).toBe(false);
    });
  });

  describe('isFilePending()', () => {
    it('unkown state', () => {
      expect(isFilePending(file)).toBe(false);
    });

    it('modified state', () => {
      setModifiedFileState(file);
      expect(isFilePending(file)).toBe(true);
    });

    it('delete state and new file', () => {
      file.path = 'foo';
      setDeletedFileState(file);
      expect(isFilePending(file)).toBe(false);
    });

    it('delete state and existing file', () => {
      file.path = getFixture('file-a.txt');
      setDeletedFileState(file);
      expect(isFilePending(file)).toBe(true);
    });
  });
});
