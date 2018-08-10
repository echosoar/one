'use strict';

import { Component, render } from 'preact';
import Header from '_/components/header/index.js';
import Home from '_/pages/home/index.js';
import './main.less';

const { ipcRenderer } = window.electron;

class One extends Component {

  constructor(props) {
    super(props);
    this.state = {
      status: null,
      nowApp: '',
      nowAppInfo: {},
      openedAppList: {},
      appList: []
    }

    this.bindEvent();

    this.getData('status', this.ipcState.bind(this));
    this.getData('appList', this.ipcState.bind(this));
    
  }

  bindEvent() {
    ipcRenderer.on('openHome', () => {
      this.handleOpen('home');
    });
  }

  getData(data, cb) {
    let originType = (data.type || data);
    let intype = originType + '-timeid-' + Date.now() + Math.random();
    if (data.type) {
      data.type = intype;
    } else {
      data = intype;
    }
    if (cb) {
      ipcRenderer.on(intype, (e, data) => {
        cb(originType , data);
      });
    }
    ipcRenderer.send('getData', data);
  }

  ipcState(key, value) {

    this.setState({
      [key]: value,
      now: Date.now()
    });
  }

  getScript(appInfo) {    
    let { js, commonName, originName, css } = appInfo;
    let appName = 'app-' + commonName;
    let containerName = 'contain-' + commonName;
    let container = document.getElementById(containerName);
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('id', containerName);
      container.setAttribute('class', 'container');
      document.body.appendChild(container);
    }

    container.style.display = 'block';

    if (css) {
      let cssName = 'css-' + commonName;
      let cssNode = document.getElementById(cssName);
      if (!cssNode) {
        cssNode = document.createElement('link');
        cssNode.setAttribute('id', cssName);
        cssNode.setAttribute('href', css);
        cssNode.setAttribute('type', 'text/css');
        cssNode.setAttribute('rel', 'stylesheet');
        document.head.appendChild(cssNode);
      }
    }

    if (window[commonName]) {
      this.renderAppContent(window[commonName], container, commonName);
      return;
    } else if (document.getElementById(appName)) {
      if (document.getElementById(appName).getAttribute('data-status') == 'loading') {
        return;
      } else {
        this.handleClose(appInfo);
        return;
      }
    } else {
      this.getData({
        type: 'checkFile',
        appName: commonName,
        appDirName: originName
      }, () => {

        let script = document.createElement('script');
        script.setAttribute('data-status', 'loading');
        script.setAttribute('id', appName);
        script.setAttribute('src', js + '?v=' + Date.now());
        script.onload = () => {
          script.setAttribute('data-status', 'loaded');
          this.getScript(appInfo);
        }
        document.head.appendChild(script);
      });

    }
  }

  renderAppContent(AppClass, container, commonName) {
    if (container.innerHTML) return;
    render(<AppClass {...this.getInnerProps(commonName)} />, container);
  }

  getInnerProps(commonName) {
    return {
      storage: {
        get: (key, cb) => {
          this.getData({
            type: 'getLocalData',
            key: commonName + '-' + (key || 'main')
          }, (key, data) => { cb(data); });
        },
        set: (key, data, cb) => {
          this.getData({
            type: 'setLocalData',
            key: commonName + '-' + (key || 'main'),
            data
          }, (key, data) => { cb(data); });
        }
      },
      fetch: (url, method, data, cb) => {
        this.getData({
          type: 'fetchRemoteData',
          url, method, data
        }, (key, data) => { cb(data); });
      }
    }
  }

  handleClose(appName) {

    let { openedAppList, nowApp } = this.state;
    delete openedAppList[appName];

    if (nowApp != appName) {
      let oldContainer = document.getElementById('contain-' + nowApp);
      if (oldContainer) oldContainer.style.display = 'none';
    }

    let container = document.getElementById('contain-' + appName);
    if (container) container.parentNode.removeChild(container);

    this.setState({
      nowApp: 'home',
      nowAppInfo: null,
      openedAppList,
      now: Date.now()
    });
  }

  handleOpen(app) {

    let { openedAppList, nowApp } = this.state;


    
    if (nowApp) {
      let oldContainer = document.getElementById('contain-' + nowApp);
      if (oldContainer) oldContainer.style.display = 'none';
    }
   
    if (app == 'home') {
      this.setState({
        nowApp: 'home',
        nowAppInfo: null
      });
    } else {
      if (!openedAppList[app.commonName]) openedAppList[app.commonName] = app;
      this.setState({
        nowApp: app.commonName,
        nowAppInfo: app,
        openedAppList,
        now: Date.now()
      });
    }
   
  }

  renderApp() {

    let { nowApp, nowAppInfo, appList } = this.state;
    if (!nowApp || nowApp == 'home') {
      return <Home appList={appList} onOpen={this.handleOpen.bind(this)} fun={{
        getData: this.getData
      }} getInnerProps={this.getInnerProps.bind(this)} />;
    }
    this.getScript(nowAppInfo);
    return <span />;
  }

  render() {
    let { status, nowApp, openedAppList, appList } = this.state;
    if (!status) return <span />;
    return <div>
      <Header nowApp={nowApp} status={status} openedAppList={openedAppList} onOpen={this.handleOpen.bind(this)} onClose={this.handleClose.bind(this)}  />
      {
        this.renderApp()
      }
    </div>
  }
}

render(<One />, document.getElementById('container'));