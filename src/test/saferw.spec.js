import { expect } from 'chai';
import fs from 'mz/fs';
import randomstring from 'randomstring';
import { delay, checkAndWait, lock, unlock, check, safeWrite, safeRead } from '../saferw';

const tempfile = (prefix = 'temp') => `/tmp/${prefix}-${randomstring.generate(8)}`;

describe('checkAndWait', () => {
  let filePath;

  beforeEach(() => filePath = tempfile());
  
  describe('checkAndWait checks for file lock, waits and repeats', () => {
    it('should return false after 30 ms', done => {
      const start = +new Date();
      setTimeout(() => fs.unlink(filePath), 30);
      fs.writeFile(filePath, 'STUFF').then(() => checkAndWait(filePath, 10, 10)).then(res => {
        const end = +new Date();
        const diff = end - start;
        // console.log('diff: ', diff, res, filePath);
        expect(diff).to.be.above(30);
        expect(res).to.be.false;
        done();
      });
    });

    it('should return true after 100 ms', done => {
      const start = +new Date();
      setTimeout(() => fs.unlink(filePath), 150);

      fs.writeFile(filePath, 'STUFF').then(() => checkAndWait(filePath, 10, 10)).then(res => {
        const end = +new Date();
        const diff = end - start;
        // console.log('diff: ', diff, res, filePath);
        expect(diff).to.be.above(100);
        expect(res).to.be.true;
        done();
      });
    });

  });  
});  

describe('delay', () => {
  const start = +new Date();
  it('should return false if file does not exist', done => {
    delay(20).then(delay => { 
      const end = +new Date();
      const diff = end - start;
      expect(diff).to.be.above(delay);
      done(); 
    });
  });  
});  

describe('lockfile', () => {

  describe('check', () => {
    const path = tempfile('check');
    it('should return false if file does not exist', done => {
      check(path)
        .then(checkResult => expect(checkResult).to.be.equal(false))
        .then(() => done());
    });

    it('should return true if file does exist', done => {
      lock(path)
        .then(() => check(path))
        .then(checkResult => expect(checkResult).to.be.equal(true))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

    it('should fail if lock file exists', done => {
      lock(path)
        .then(() => lock(path, { retries: 13, wait: 100 }))
        .catch(err => { 
          // console.log(err); 
          done();
        });
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
    let path;
    beforeEach(() => path = tempfile('safe-write'));

    it("should write file safely", done => {
      safeWrite(path, 'SAFEWRITE')
        .then(() => fs.readFile(path, 'utf8'))
        .then(data => expect(data).to.be.equal('SAFEWRITE'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

    it("should fail lock file already locked", done => {
      lock(`${path}.lock`)
        .then(() => safeWrite(path, 'SAFEWRITE', { retries: 10, wait: 1000 }))
        .catch(err => {
          // console.log('already locked', err.toString());
          expect(/file locked/.test(err)).to.be.true;
          done();
        });
    });

    it("should succeed lock file is lock file is removed", done => {
      const lockPath = `${path}.lock`;
      setTimeout(() => fs.unlink(lockPath), 50);
      lock(`${path}.lock`)
        .then(() => safeWrite(path, 'SAFEWRITE', { retries: 10, wait: 1000 }))
        .then(() => {
          return fs.readFile(path, 'utf8').then(data => {
            expect(data).to.be.equal('SAFEWRITE');
            return fs.unlink(path).then(() => done());
          });
        });
    });
  });

  describe('safeRead', () => {
    let path;
    beforeEach(() => path = tempfile('safe-read'));

    it("should read file safely", done => {
      safeWrite(path, 'SAFEREAD')
        .then(() => safeRead(path))
        .then(data => expect(data).to.be.equal('SAFEREAD'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

    it("should fail lock file already locked", done => {
      lock(`${path}.lock`)
        .then(() => safeRead(path))
        .catch(err => {
          // console.log('already locked', err.toString());
          expect(/file locked/.test(err)).to.be.true;
          done();
        });
    });

    it("should succeed lock file is lock file is removed", done => {
      const lockPath = `${path}.lock`;
      setTimeout(() => fs.unlink(lockPath), 50);
      lock(lockPath)
        .then(() => safeWrite(path, 'SAFEREAD'))
        .then(() => safeRead(path))
        .then(data => expect(data).to.be.equal('SAFEREAD'))
        .then(() => fs.unlink(path))
        .then(() => done());
    });

  });

});
