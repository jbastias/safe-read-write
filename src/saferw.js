import lockfile from 'lockfile';
import fs from 'mz/fs';

export function lock(path, options = {}) {
  return new Promise((resolve, reject) => {
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
  const lockPath = `${path}.lock`;
  return lock(lockPath)
    .then(() => fs.writeFile(path, data, options))
    .then(() => unlock(lockPath));
}

export function safeRead(path, options = { encoding: 'utf8' }) {
  const lockPath = `${path}.lock`;
  let data = '';
  return lock(lockPath)
    .then(() => fs.readFile(path, options))
    .then(_data => data = _data)
    .then(() => unlock(lockPath))
    .then(() => data);
}
