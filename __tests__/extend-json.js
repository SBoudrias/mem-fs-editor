'use strict';

const path = require('path');
const sinon = require('sinon');
const editor = require('..');
const memFs = require('mem-fs');

describe('#extendJSON()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('extends content of existing JSON file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {b: 2};
    const write = sinon.spy(fs, 'write');
    const read = sinon.stub(fs, 'readJSON').returns({a: 'a', b: 'b'});
    fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({a: 'a', b: 2}, null, 2) + '\n');
    write.restore();
    read.restore();
  });

  it('writes to unexisting JSON file', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    const write = sinon.spy(fs, 'write');
    fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({foo: 'bar'}, null, 2) + '\n');
    write.restore();
  });

  it('stringify with optional arguments (for JSON.stringify)', () => {
    const filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    const contents = {foo: 'bar'};
    const write = sinon.spy(fs, 'write');
    fs.extendJSON(filepath, contents, '\n', 4);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, '\n', 4) + '\n');
    write.restore();
  });
});
