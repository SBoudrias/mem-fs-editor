'use strict';

var path = require('path');
var sinon = require('sinon');
var editor = require('..');
var memFs = require('mem-fs');

describe('#extendJSON()', function () {
  beforeEach(function () {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('extends content of existing JSON file', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = {b: 2};
    var write = sinon.spy(this.fs, 'write');
    var read = sinon.stub(this.fs, 'readJSON').returns({a: 'a', b: 'b'});
    this.fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({a: 'a', b: 2}, null, 2) + '\n');
    write.restore();
    read.restore();
  });

  it('writes to unexisting JSON file', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = {foo: 'bar'};
    var write = sinon.spy(this.fs, 'write');
    this.fs.extendJSON(filepath, contents);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWithMatch(write, filepath, JSON.stringify({foo: 'bar'}, null, 2) + '\n');
    write.restore();
  });

  it('stringify with optional arguments (for JSON.stringify)', function () {
    var filepath = path.join(__dirname, 'fixtures/does-not-exist.txt');
    var contents = {foo: 'bar'};
    var write = sinon.spy(this.fs, 'write');
    this.fs.extendJSON(filepath, contents, '\n', 4);
    sinon.assert.calledOnce(write);
    sinon.assert.calledWith(write, filepath, JSON.stringify(contents, '\n', 4) + '\n');
    write.restore();
  });
});
