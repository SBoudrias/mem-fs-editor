import { describe, beforeEach, it, expect } from 'vitest';
import { getFixture } from './fixtures.js';
import Editor from '../lib/index.js';

const state = Editor.State;

describe('state', () => {
  let file;
  beforeEach(() => {
    file = {};
  });

  it('setModifiedFileState()/isFileStateModified()', () => {
    expect(file.state).toBe(undefined);
    expect(state.isFileStateModified(file)).toBe(false);

    state.setModifiedFileState(file);

    expect(file.state).toBe('modified');
    expect(state.isFileStateModified(file)).toBe(true);
  });

  it('setDeletedFileState()/isFileStateDeleted()', () => {
    expect(file.state).toBe(undefined);
    expect(state.isFileStateDeleted(file)).toBe(false);

    state.setDeletedFileState(file);

    expect(file.state).toBe('deleted');
    expect(state.isFileStateDeleted(file)).toBe(true);
  });

  it('setCommittedFile()/fileStateIsCommitted()', () => {
    expect(file.committed).toBe(undefined);
    expect(state.isFileCommitted(file)).toBe(false);

    state.setCommittedFile(file);

    expect(file.committed).toBe(true);
    expect(state.isFileCommitted(file)).toBe(true);
  });

  it('resetFileState()', () => {
    file.state = 'foo';
    file.isNew = true;

    state.resetFileState(file);

    expect(file.state).toBe(undefined);
    expect(file.isNew).toBe(true);
  });

  it('resetFileCommitStates()', () => {
    file.state = 'foo';
    file.isNew = true;
    file.stateCleared = 'bar';
    file.committed = true;

    state.resetFileCommitStates(file);

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

    state.resetFile(file);

    expect(file.state).toBe(undefined);
    expect(file.isNew).toBe(undefined);
    expect(file.stateCleared).toBe(undefined);
    expect(file.committed).toBe(undefined);
  });

  it('clearFileState()', () => {
    file.state = 'foo';
    file.isNew = true;

    state.clearFileState(file);

    expect(file.state).toBe(undefined);
    expect(file.clearedState).toBe(file.state);
    expect(file.isNew).toBe(undefined);
    expect(state.hasClearedState(file)).toBe(true);
  });

  describe('isFileNew()', () => {
    it('with new file', () => {
      expect(file.isNew).toBe(undefined);
      file.path = 'foo';

      expect(state.isFileNew(file)).toBe(true);
      expect(file.isNew).toBe(true);
    });

    it('with existing file', () => {
      expect(file.isNew).toBe(undefined);
      file.path = getFixture('file-a.txt');

      expect(state.isFileNew(file)).toBe(false);
      expect(file.isNew).toBe(false);
    });
  });

  describe('isFilePending()', () => {
    it('unkown state', () => {
      expect(state.isFilePending(file)).toBe(false);
    });

    it('modified state', () => {
      state.setModifiedFileState(file);
      expect(state.isFilePending(file)).toBe(true);
    });

    it('delete state and new file', () => {
      file.path = 'foo';
      state.setDeletedFileState(file);
      expect(state.isFilePending(file)).toBe(false);
    });

    it('delete state and existing file', () => {
      file.path = getFixture('file-a.txt');
      state.setDeletedFileState(file);
      expect(state.isFilePending(file)).toBe(true);
    });
  });
});
