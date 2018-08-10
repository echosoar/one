'use strict';
const fs = require('fs');
const os = require('os');

const Storage  = {
  get: (key) => {
    let dataFilePath = `${os.homedir()}/one/data/${key}.onedata`;
    if (!fs.existsSync(dataFilePath)) return null;
    let data = fs.readFileSync(dataFilePath).toString();
    try {
      return JSON.parse(data);
    } catch(e) {
      return null;
    }
  },
  set: (key, data) => {
    let dataFilePath = `${os.homedir()}/one/data/${key}.onedata`;
    let indata = '';
    try {
      indata = JSON.stringify(data);
      fs.writeFileSync(dataFilePath, indata);
      return true;
    } catch(e) {
      return false;
    }
  }
}

module.exports = Storage;