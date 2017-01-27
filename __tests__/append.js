'use strict';

var assert = require('assert');
var editor = require('..');
var memFs = require('mem-fs');

describe('#write()', function () {
  beforeEach(function () {
    var store = memFs.create();
    this.fs = editor.create(store);
  });

  it('appends new content to file', function () {
    this.fs.write('append.txt', 'a\n\n\n');
    this.fs.append('append.txt', 'b');

    assert.equal(this.fs.read('append.txt'), 'a\nb');
  });

  it('allows specifying custom separator', function () {
    this.fs.write('append.txt', 'a');
    this.fs.append('append.txt', 'b', {separator: ', '});

    assert.equal(this.fs.read('append.txt'), 'a, b');
  });

  it('allows disabling end trim', function () {
    this.fs.write('append.txt', 'a\n\n');
    this.fs.append('append.txt', 'b', {trimEnd: false});

    assert.equal(this.fs.read('append.txt'), 'a\n\n\nb');
  });
});
