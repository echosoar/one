'use strict';

import { Component } from 'preact';
import './index.less';

class Header extends Component {

  handleOpen(appName) {
    this.props.onOpen && this.props.onOpen(appName);
  }

  handleClose(appName, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onClose && this.props.onClose(appName);
  }

  render() {
    let { nowApp, openedAppList, status } = this.props;
    
    let type = 'normal';
    if (status && status.type != type) type = status.type;

    let allOpened = Object.keys(openedAppList).map(key => {
      if (key == nowApp || key == 'home') return false;
      return openedAppList[key];
    }).filter(app => app);

    if ((!nowApp || nowApp =='home') && !allOpened.length) {
      return <div class="header">
        <div class="headerInner">
          <div class="headerText">One is more!</div>
        </div>
      </div>;
    } else {
      let width = document.body.clientWidth - ( type == 'normal' ? 80: 0) - 200;
      let size = Math.floor(width / 100);

      
      return <div class="header">
        <div class="headerInner">
          <div class="headerTabs" style={{paddingLeft:( type == 'normal' ? '80px': '0')}}>
            <div class={"tabItem" + ( nowApp == 'home' ? ' opened': '')} onClick={this.handleOpen.bind(this, 'home')}>
              <div class="tabItemIcon home"></div>
              <div class="tabItemName">Home</div>
            </div>
            { openedAppList[nowApp] && <div class="tabItem opened">
              <div class="tabItemIcon" style={{backgroundImage: `url("${openedAppList[nowApp].icon}")`}}></div>
              <div class="tabItemName">{ openedAppList[nowApp].name }</div>
              <div class="tabClose" onClick={this.handleClose.bind(this, openedAppList[nowApp].commonName )}></div>
            </div> }
            {
              allOpened.slice(0, size).map(app => {
                return <div class="tabItem" onClick={this.handleOpen.bind(this, app)}>
                  <div class="tabItemIcon" style={{backgroundImage: `url("${app.icon}")`}}></div>
                  <div class="tabItemName">{app.name}</div>
                  <div class="tabClose" onClick={this.handleClose.bind(this, app.commonName )}></div>
                </div>
              })
            }
          </div>
        </div>
      </div>
    }
  }
}

export default Header;