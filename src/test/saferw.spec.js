import { expect } from 'chai';
import fs from 'mz/fs';
import randomstring from 'randomstring';
import { lock, unlock, check, safeWrite, safeRead } from '../saferw';

const tempfile = (prefix = 'temp') => `/tmp/${prefix}-${randomstring.generate(8)}`;

describe('lockfile', () => {

  describe('check', () => {
    const path = tempfile('check');
    it('should return false if file does not exist', done => {
      check(path)
        .then(checkResult => expect(checkResult).to.be.equal(false))
        .then(() => done());
    });

    it('should return false if file does not exist', done => {
      lock(path)
        .then(() => check(path))
        .then(checkResult => expect(checkResult).to.be.equal(true))
        .then(() => fs.unlink(path))
        .then(() => done());
    });
  });

  describe('lock', () => {
    it('should allow me to read and write', done => {
      const path = tempfile('lock');
      lock(path)
        .then(() => fs.writeFile(path, 'LOCK', 'utf8'))
        .then(() => fs.readFile(path, 'utf8').then(data => expect(data).be.equal('LOCK')))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

    it('should block me from opening a new lock', done => {
      const path = tempfile('lock');
      lock(path)
        .then(() => lock(path))
        .catch(err => expect(err.code).to.be.equal('EEXIST'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

    it('should block me from opening a new lock', done => {
      const path = tempfile('lock');
      lock(path)
        .then(() => lock(path))
        .catch(err => expect(err.code).to.be.equal('EEXIST'))
        .then(() => unlock(path))
        .then(() => lock(path))
        .then(() => fs.unlink(path))
        .then(() => done());
    });
  });

  describe('unlock', () => {
    const path = tempfile('unlock');
    it('should return true when file doesn\'t exist', done => {
      unlock(path)
        .then(unlock => expect(unlock).to.be.equal(true))
        .then(() => done());
    });

    it('should return true when file does exist and remove file', done => {
      fs.writeFile(path, 'UNLOCK', 'utf8')
        .then(() => fs.readFile(path, 'utf8')
                    .then(data => expect(data).to.be.equal('UNLOCK')))
        .then(() => unlock(path))
        .then(unlock => expect(unlock).to.be.equal(true))
        .then(() => fs.access(path))
        .catch(err => expect(err.code).to.be.equal('ENOENT'))
        .then(() => done());
    });
  });

  describe('safeWrite', () => {
    const path = tempfile('safe-write');
    it("should write file safely", done => {
      safeWrite(path, 'SAFEWRITE')
        .then(() => fs.readFile(path, 'utf8'))
        .then(data => expect(data).to.be.equal('SAFEWRITE'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });
  });

  describe('safeRead', () => {
    const path = tempfile('safe-read');
    it("should read file safely", done => {
      safeWrite(path, 'SAFEREAD')
        .then(() => safeRead(path))
        .then(data => expect(data).to.be.equal('SAFEREAD'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });
  });

});
