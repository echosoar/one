'use strict';

import { Component } from 'preact';
import './light.less';
const { ipcRenderer } = window.electron;
class Light extends Component {

  constructor(props) {
    super(props);
    this.state = {
      LightComponent: null
    }

    this.loadScript(props.data);
  }
  loadScript(appInfo) {

    let { js, commonName, originName, css } = appInfo;
    let appName = 'lightapp-' + commonName;
    let appComponentName = 'lightappComp-' + commonName;

    if (css) {
      let cssName = 'lightcss-' + commonName;
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

    if (window[appComponentName]) {

      this.setState({
        LightComponent: window[appComponentName]
      });
      return;
    } else if (document.getElementById(appName)) {
      if (document.getElementById(appName).getAttribute('data-status') == 'loading') {
        return;
      } else {

        return;
      }
    } else {
      this.props.fun.getData({
        type: 'checkFile',
        appName: appComponentName,
        appDirName: originName,
        appType: 'light'
      }, () => {
        let script = document.createElement('script');
        script.setAttribute('data-status', 'loading');
        script.setAttribute('id', appName);
        script.setAttribute('src', js + '?v=' + Date.now());
        script.onload = () => {
          script.setAttribute('data-status', 'loaded');
          this.loadScript(appInfo);
        }
        document.head.appendChild(script);
      });
    }
  }


  renderAppContent() {

  }

  render() {
    let { LightComponent } = this.state;

    let { data, getInnerProps } = this.props;
    return <div class="lightAppItem">
      { LightComponent && <LightComponent {...getInnerProps(data.originName)} /> }
      <div class="lightInfo">
          <div class="lightInfoIcon" style={{backgroundImage: `url("${data.icon}")`}}></div>
          <div class="lightInfoName">{data.lightName || data.name}</div>
      </div>
    </div>;
  }
}

export default Light;