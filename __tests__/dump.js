'use strict';

const filesystem = require('fs');
const os = require('os');
const path = require('path');
const memFs = require('mem-fs');
const editor = require('..');

describe('#dump()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');
  const subdir = 'foo';
  let store;
  let fs;

  beforeEach(async function () {
    filesystem.rmdirSync(output, {recursive: true});

    store = memFs.create();
    fs = editor.create(store);

    fs.write(path.join(output, subdir, 'committed'), 'committed');
    fs.write(path.join(output, subdir, 'committed-delete'), 'committed-delete');
    fs.write(path.join(output, subdir, 'committed-changed'), 'orig');
    fs.write(path.join(output, subdir, 'committed-delete-changed'), 'orig');
    await fs.commit();

    fs.delete(path.join(output, subdir, 'committed-delete'));
    await fs.commit();

    fs.write(path.join(output, subdir, 'committed-changed'), 'committed-changed');
    fs.write(path.join(output, subdir, 'not-committed'), 'not-committed');
    fs.write(path.join(output, subdir, 'not-committed-delete'), 'not-committed-delete');

    fs.delete(path.join(output, subdir, 'committed-delete-changed'));
    fs.delete(path.join(output, subdir, 'not-committed-delete'));
  });

  it('should match snapshot', () => {
    expect(fs.dump(output)).toMatchSnapshot();
  });
});
