'use strict';

const path = require('path');
const sinon = require('sinon');
const editor = require('..');
const memFs = require('mem-fs');
const escape = require('escape-regexp');

describe('#readJSON()', () => {
  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
  });

  it('read the content of a file', () => {
    const obj = fs.readJSON(path.join(__dirname, 'fixtures/file.json'));
    expect(obj.foo).toBe('bar');
  });

  it('calls read() with path', () => {
    const read = sinon.spy(fs, 'read');
    const file = path.join(__dirname, 'fixtures/file.json');
    fs.readJSON(file);
    sinon.assert.calledOnce(read);
    sinon.assert.calledWith(read, file);
    read.restore();
  });

  it('return defaults if file does not exist and defaults is provided', () => {
    const obj = fs.readJSON(path.join(__dirname, 'no-such-file.json'), {foo: 'bar'});
    expect(obj.foo).toBe('bar');
  });

  it('throw error if file could not be parsed as JSON, even if defaults is provided', () => {
    expect(fs.readJSON.bind(fs, path.join(__dirname, 'fixtures/file-tpl.txt'), {foo: 'bar'})).toThrow();
  });

  it('throw error with file path info', () => {
    var filePath = path.join(__dirname, 'fixtures/file-tpl.txt');
    expect(fs.readJSON.bind(fs, new RegExp(escape(filePath)))).toThrow();
  });
});
