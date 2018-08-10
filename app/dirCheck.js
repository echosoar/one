'use strict';
const fs = require('fs');
const os = require('os');
let dirCheck = () => {
  const oneDirPath = `${os.homedir()}/one/`;
  const appDirPath = `${oneDirPath}app/`;
  const dataDirPath = `${oneDirPath}data/`;
  if (!fs.existsSync(oneDirPath)) fs.mkdirSync(oneDirPath, '0777');
  if (!fs.existsSync(appDirPath)) fs.mkdirSync(appDirPath, '0777');
  if (!fs.existsSync(dataDirPath)) fs.mkdirSync(dataDirPath, '0777');
}

module.exports = dirCheck;