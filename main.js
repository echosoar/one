'use strict';
const Electron = require('electron');
const path = require('path');
const url = require('url');
const dirCheck = require('./app/dirCheck');
const GetAppList = require('./app/getAppList');
const AppCheck = require('./app/appCheck');
const FetchData = require('./app/fetchData');
const OneStorage = require('./app/oneStorage');
const { app, BrowserWindow, ipcMain, globalShortcut } = Electron;

class One {
  constructor() {
    console.log("start one");
    this.init();
    this.status = {
      type: 'normal'
    };
    this.bindAppEvent();
    this.ready().then(() => {
      this.info();
      this.bindGlobalShortcut();
      this.start();
    });
    
  }

  init() {
    dirCheck();
  }

  bindGlobalShortcut() {
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      this.win.show();
    });
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      this.send('openHome');
      this.win.show();
    });
  }

  ready() {
    return new Promise(resolve => {
      app.on('ready', resolve);
    });
  }

  async info() {
    let screenSize = Electron.screen.getPrimaryDisplay().size;
    this.status.width = screenSize.width - 360;
    this.status.height = screenSize.height - 230;


  }

  getSize(max) {
    let screenSize = Electron.screen.getPrimaryDisplay().size;
    this.status.width = screenSize.width -( max? 0 : 360);
    this.status.height = screenSize.height - ( max? 0 : 230);
  }
  bindAppEvent() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    });
    
    app.on('activate', () => {
      if (this.win === null) this.start();
    });
  }

  start() {
    this.createWindow();
  }

  createWindow() {
    this.win = new BrowserWindow({
      width: this.status.width,
      height: this.status.height,
      titleBarStyle: 'hiddenInset',
      resizable: false
    });
    this.content = this.win.webContents;
    this.bindRenderEvent();

    this.win.loadURL(url.format({
      pathname: path.join(__dirname, 'main.html'),
      protocol: 'file:',
      slashes: true
    }));
    
    // this.content.openDevTools()
    this.bindWinEvent();
    
  }

  bindWinEvent() {
    this.win.on('closed', () => {
      this.win = null;
    });

    this.win.on('enter-full-screen', () => {
      this.getSize(true);
      this.statusChange('type', 'max');
    });
    this.win.on('leave-full-screen', () => {
      this.getSize();
      this.statusChange('type', 'normal');
    });
  }

  statusChange(key, value) {
    this.status[key] = value;
    this.send('changeStatus', this.status);
  }

  send(type, data) {
    // console.log(type, data)
    this.content.send(type, data);
  }

  bindRenderEvent() {
    ipcMain.on('getData', (event, data) => {
      let type = data && data.type || data;
      if (!type) return;
      let originType = type.replace(/-timeid-.*?$/, '');
      switch(originType) {
        case 'status':
          this.send(type, this.status);
          break;
        case 'appList':
          this.send(type, GetAppList());
          break;
        case 'checkFile':
          this.send(type, AppCheck(data.appDirName, data.appName, data.appType));
          break;
        case 'getLocalData':
          this.send(type, OneStorage.get(data.key));
          break;
        case 'setLocalData':
          this.send(type, OneStorage.set(data.key, data.data));
          break;
        case 'fetchRemoteData':
          FetchData(data.url, data.method, data.data, data.params).then(result => {
            this.send(type, result);
          });
          break;
      }
    });
  }
}

new One();
