'use strict';
const fs = require('fs');
const os = require('os');
const appCheck = (appDirName, appName, type) => {
  const appFile = `${os.homedir()}/one/app/${appDirName}/build/${type || 'index'}.js`;

  if (!fs.existsSync(appFile)) return false;

  let preData = `;(function() {let n = '${appName}';let exports = {};let module = {exports: null};let define = function(fn) { window[n] = fn() }; define.amd = 1;let cf = function() {`;
  let endData = `};new cf();window[n] = module.exports;})();`;

  let jsData = fs.readFileSync(appFile).toString();

  let reg = new RegExp(`^;\\(function\\(\\) \\{let n = '${appName.replace(/([^\w_])/g, '\\$1')}'`)

  if (reg.test(jsData)) {
    return true;
  }

  fs.writeFileSync(appFile, preData + jsData + endData);
  return true;

}

module.exports = appCheck;