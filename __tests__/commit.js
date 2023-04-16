import filesystem from 'fs';
import os from 'os';
import path from 'path';
import memFs from 'mem-fs';
import sinon from 'sinon';
import editor from '../lib/index.js';
import util from '../lib/util.js';
import { getFixture } from './fixtures.js';

const { createTransform } = util;

const rmSync = filesystem.rmSync || filesystem.rmdirSync;

describe('#commit()', () => {
  const fixtureDir = path.join(os.tmpdir(), '/mem-fs-editor-test-fixture');
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test' + Math.random());
  const NUMBER_FILES = 100;

  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);
    filesystem.mkdirSync(fixtureDir, { recursive: true, force: true });

    // Create a 100 files to exercise the stream high water mark
    let i = NUMBER_FILES;
    while (i--) {
      filesystem.writeFileSync(path.join(fixtureDir, 'file-' + i + '.txt'), 'foo');
    }

    fs.copy(fixtureDir + '/**', output);
  });

  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
    rmSync(output, { recursive: true, force: true });
  });

  it('triggers callback when done', (done) => {
    fs.commit(done);
  });

  it('should match snapshot', (done) => {
    fs.commit((error) => {
      expect(fs.dump(output)).toMatchSnapshot();
      done(error);
    });
  });

  it('call filters and trigger callback on error', (done) => {
    let called = 0;

    const filter = createTransform((file, enc, cb) => {
      called++;
      cb(new Error(`error ${called}`));
    });

    fs.commit([filter], (error) => {
      expect(called).toBe(1);
      expect(error.message).toBe('error 1');
      done();
    });
  });

  it('call filters and update memory model', (done) => {
    let called = 0;

    const filter = createTransform(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    fs.commit([filter], () => {
      expect(called).toBe(100);
      expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
      done();
    });
  });

  it('call filters, update memory model and commit selected files', (done) => {
    let called = 0;

    const filter = createTransform(function (file, enc, cb) {
      called++;
      file.contents = Buffer.from('modified');
      this.push(file);
      cb();
    });

    const beforeFilter = createTransform(function (file, enc, cb) {
      if (file.path.endsWith('1.txt')) {
        this.push(file);
      }

      cb();
    });

    fs.commit([filter], store.stream().pipe(beforeFilter), () => {
      expect(called).toBe(10);
      expect(fs.read(path.join(output, 'file-1.txt'))).toBe('modified');
      expect(fs.read(path.join(output, 'file-2.txt'))).not.toBe('modified');
      expect(store.get(path.join(output, 'file-1.txt')).committed).toBeTruthy();
      expect(store.get(path.join(output, 'file-2.txt')).result).toBe(undefined);
      done();
    });
  });

  it('write file to disk', (done) => {
    fs.commit((error) => {
      expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-1.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-50.txt'))).toBeTruthy();
      expect(filesystem.existsSync(path.join(output, 'file-99.txt'))).toBeTruthy();
      done(error);
    });
  }, 10000);

  it('handle error when write fails', (done) => {
    filesystem.writeFileSync(output, 'foo');
    fs.commit(async (error) => {
      filesystem.unlinkSync(output);
      if (error) {
        done();
        return;
      }

      done(new Error('should not happen'));
    });
  });

  it('delete file from disk', (done) => {
    const file = path.join(output, 'delete.txt');
    filesystem.mkdirSync(output, { recursive: true, force: true });
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(file);
    fs.commit(() => {
      expect(filesystem.existsSync(file)).toBeFalsy();
      expect(store.get(file).committed).toBeTruthy();
      done();
    });
  });

  it('delete directories from disk', (done) => {
    const file = path.join(output, 'nested/delete.txt');
    filesystem.mkdirSync(path.join(output, 'nested'), {
      recursive: true,
      force: true,
    });
    filesystem.writeFileSync(file, 'to delete');

    fs.delete(path.join(output, 'nested'));
    fs.commit(() => {
      expect(filesystem.existsSync(file)).toBeFalsy();
      done();
    });
  });

  it('reset file status after commiting', (done) => {
    fs.commit(() => {
      expect(fs.store.get(path.join(output, '/file-a.txt')).state).toBeUndefined();
      done();
    });
  });

  it('does not commit files who are deleted before being commited', (done) => {
    fs.write('to-delete', 'foo');
    fs.delete('to-delete');
    fs.copy(getFixture('file-a.txt'), 'copy-to-delete');
    fs.delete('copy-to-delete');
    fs.store.get('to-delete');

    fs.commitFileAsync = sinon.stub().returns(Promise.resolve());
    fs.commit(
      [
        createTransform(function (file, enc, cb) {
          expect(file.path).not.toEqual(path.resolve('to-delete'));
          expect(file.path).not.toEqual(path.resolve('copy-to-delete'));

          this.push(file);
          cb();
        }),
      ],
      () => {
        expect(fs.commitFileAsync.callCount).toBe(NUMBER_FILES);
        done();
      }
    );
  });
});

describe('#copy() and #commit()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);

    fs.copy(getFixture('**'), output);
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', (done) => {
    fs.commit((error) => {
      expect(fs.dump(output)).toMatchSnapshot();
      done(error);
    });
  });
});

describe('#copyTpl() and #commit()', () => {
  const output = path.join(os.tmpdir(), '/mem-fs-editor-test');

  let store;
  let fs;

  beforeEach(() => {
    store = memFs.create();
    fs = editor.create(store);

    const a = { name: 'foo' };
    const b = { a };
    a.b = b;

    fs.copyTpl(getFixture('**'), output, { name: 'bar' }, { context: { a } });
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('should match snapshot', (done) => {
    fs.commit((error) => {
      expect(fs.dump(output)).toMatchSnapshot();
      done(error);
    });
  });
});
