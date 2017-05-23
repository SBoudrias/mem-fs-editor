'use strict';

const path = require('path');
const sinon = require('sinon');
const editor = require('..');
const memFs = require('mem-fs');

describe('#writeJSON()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    const write = sinon.spy(fs, 'write');
    fs.writeJSON(filepath, contents, null, 2);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, null, 2) + '\n');
    write.restore();
  });

  it('defaults indentation to 2 if stringify argument is not provided', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    const write = sinon.spy(fs, 'write');
    fs.writeJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, null, 2) + '\n');
    write.restore();
  });

  it('write json object to a new file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    fs.writeJSON(filepath, contents);
    expect(fs.read(filepath)).toBe(JSON.stringify(contents, null, 2) + '\n');
  });

  it('write json object to an existing file', () => {
    const filepath = path.join(__dirname, 'fixtures/file.json');
    const contents = {bar: 'foo'};
    fs.writeJSON(filepath, contents);
    expect(fs.read(filepath)).toBe(JSON.stringify(contents, null, 2) + '\n');
  });

  it('calls write() with stringified JSON object', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    const write = sinon.spy(fs, 'write');
    fs.writeJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify(contents, null, 2) + '\n');
    write.restore();
  });
});
