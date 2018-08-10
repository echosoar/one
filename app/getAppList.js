'use strict';
const fs = require('fs');
const os = require('os');
const url = require('url');
const dirCheck = require('./dirCheck');
const checkLight = (appDir, commonName, pkg, resArr) => {

  let lightJsAddr = `${appDir}/build/light.js`
  if (!fs.existsSync(lightJsAddr)) return;
  let res = {
    name: pkg.appInfo.name,
    lightName: pkg.appInfo.lightName,
    commonName: commonName + '-onelightapp',
    originName: commonName,
    icon: pkg.appInfo.icon,
    version: pkg.version,
    classify: 'light',
    js: url.format({
      pathname: lightJsAddr,
      protocol: 'file:',
      slashes: true
    })
  };

  let cssAddr = `${appDir}/build/light.css`;
  if (fs.existsSync(cssAddr)) {
    res.css = url.format({
      pathname: cssAddr,
      protocol: 'file:',
      slashes: true
    });
  }

  resArr.push(res);

}
const getApplist = () => {
  dirCheck();
  let appDirPath = `${os.homedir()}/one/app`;
  let appLoveDataPath = `${os.homedir()}/one/data/love.json`;
  let appLove = [];
  let returnData = {
    dev: [],
    love: [],
    usage: []
  };


  if (!fs.existsSync(appDirPath)) return returnData;

  if (fs.existsSync(appLoveDataPath)) {
    appLove = require(appLoveDataPath);
    if (!appLove || !appLove.map) appLove = [];
  }
  let lightApp = [];
  let appList = fs.readdirSync(appDirPath).map(dir => {
    if (dir == '.' || dir == '..') return;

    let commonName = dir;
    let originName = dir;
    let appDir = `${appDirPath}/${dir}`;
    let appPkgAddr = `${appDir}/package.json`;
    if (!fs.existsSync(appPkgAddr)) return;
    let pkg = require(appPkgAddr);
    if (!pkg.appInfo) return;

    let jsAddr = `${appDir}/build/index.js`;
    checkLight(appDir, commonName, pkg, lightApp);
    


    if (!fs.existsSync(jsAddr)) return;

    
    

    let classify = 'usage';
    if (/_dev$/.test(commonName)) {
      classify = 'dev';
      commonName = commonName.replace(/_dev$/, '');
    } else if (appLove.indexOf(commonName) != -1) {
      classify = 'love';
    }

    let res = {
      name: pkg.appInfo.name,
      commonName,
      originName,
      icon: pkg.appInfo.icon,
      version: pkg.version,
      js: url.format({
        pathname: jsAddr,
        protocol: 'file:',
        slashes: true
      }),
      classify
    };

    let cssAddr = `${appDir}/build/index.css`;
    if (fs.existsSync(cssAddr)) {
      res.css = url.format({
        pathname: cssAddr,
        protocol: 'file:',
        slashes: true
      });
    }

    return res;
  }).filter(app => app);

  return appList.concat(lightApp);
};

module.exports = getApplist;