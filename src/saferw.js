import lockfile from 'lockfile';
import fs from 'mz/fs';

export function delay(ms = 100) {
  return new Promise(resolve => setTimeout(() => resolve(ms), ms));
}

export function checkAndWait(path, wait = 50, repeat = 3 ) {
  // console.log(path, wait, repeat);
  return check(path).then(res => {
    if (!res) {
      return res;
    } else {
      return delay(wait).then(() => { return repeat && checkAndWait(path, wait, repeat - 1) || res });
    }
  });
}

export function lock(path, options = {}) {
  return new Promise((resolve, reject) => {
    // console.log('lock options: ', options);
    lockfile.lock(path, options, err => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

export function unlock(path) {
  return new Promise((resolve, reject) => {
    lockfile.unlock(path, err => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

export function check(path, options = {}) {
  return new Promise((resolve, reject) => {
    lockfile.check(path, options, function (err, checkResult) {
      if (err) return reject(err);
      resolve(checkResult);
    });
  });
}

export function safeWrite(path, data, options = { encoding: 'utf8' }) {
  // options.encoding = options.encoding || 'utf8';
  const lockPath = `${path}.lock`;
    // console.log(path, lockPath, data, options);
  return checkAndWait(lockPath).then(busy => {
      // console.log('busy: ', busy);
      if (busy) throw new Error(`file locked: ${lockPath}`);
      return lock(lockPath, options);
    }) 
    .then(() => fs.writeFile(path, data, options))
    // .then(() => fs.readFile(path).then(data => console.log(`data: ${data}`)))
    .then(() => unlock(lockPath));
}

export function safeRead(path, options = { encoding: 'utf8' }) {
  const lockPath = `${path}.lock`;
  let data = '';
  // return lock(lockPath)
  return checkAndWait(lockPath).then(busy => {
    if (busy) throw new Error(`file locked: ${lockPath}`);
    return lock(lockPath, options);
  }).then(() => fs.readFile(path, options))
    .then(_data => data = _data)
    .then(() => unlock(lockPath))
    .then(() => data);
}
