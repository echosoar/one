'use strict';

import { Component } from 'preact';
import Light from './light';
import './index.less';

class Home extends Component {

  renderList() {
    let { appList } = this.props;

    let app = {
      dev: [],
      love: [],
      usage: [],
      light: []
    };

    console.log(app);

    if (!appList) return;
    appList.map(item => {
      app[item.classify || 'usage'].push(item);
    });
   
    return <div class="list">
      { this.renderLight(app.light) }
      { this.renderListByType('本地开发中', app.dev) }
      { this.renderListByType('我喜欢的', app.love) }
      { this.renderListByType('我使用的', app.usage) }
    </div>

  }

  renderLight(light) {
    if (!light.length) return;
    return <div class="lightApp">
      <div class="lightAppContainer">
        {
          light.map(light => {
            return <Light data={light} fun={this.props.fun} getInnerProps={this.props.getInnerProps} />;
          })
        }
      </div>
    </div>
  }

  renderListByType(title, list) {
    if (!list || !list.length) return <div></div>;
    return <div>
      <div class="listTitle">{ title }</div>
      <div class="listItems">{
        list.map(item => {
          return <div class="appItem" onClick={() => {
            this.props.onOpen(item);
          }}>
            <div class="appLogo" style={{background: `url("${item.icon}") center/contain no-repeat`}}></div>
            <div class="appName">{ item.name }</div>
          </div>;
        })
      }</div>
    </div>
  }

  render() {
    return <div class="home">
      <div class="searchForm">
        <input class="searchInput" placeholder="搜索One功能组件" />
      </div>
      {
        this.renderList()
      }
    </div>
  }
}

export default Home;