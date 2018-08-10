(function () {
'use strict';

var options = {};

function extend(obj, props) {
  for (var i in props) {
    obj[i] = props[i];
  }return obj;
}

var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

var items = [];

function enqueueRender(component) {
	if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
		(options.debounceRendering || defer)(rerender);
	}
}

function rerender() {
	var p,
	    list = items;
	items = [];
	while (p = list.pop()) {
		if (p._dirty) { renderComponent(p); }
	}
}

function isSameNodeType(node, vnode, hydrating) {
	if (typeof vnode === 'string' || typeof vnode === 'number') {
		return node.splitText !== undefined;
	}
	if (typeof vnode.nodeName === 'string') {
		return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
	}
	return hydrating || node._componentConstructor === vnode.nodeName;
}

function isNamedNode(node, nodeName) {
	return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

function getNodeProps(vnode) {
	var props = extend({}, vnode.attributes);
	props.children = vnode.children;

	var defaultProps = vnode.nodeName.defaultProps;
	if (defaultProps !== undefined) {
		for (var i in defaultProps) {
			if (props[i] === undefined) {
				props[i] = defaultProps[i];
			}
		}
	}

	return props;
}

function createNode(nodeName, isSvg) {
	var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
	node.normalizedNodeName = nodeName;
	return node;
}

function removeNode(node) {
	var parentNode = node.parentNode;
	if (parentNode) { parentNode.removeChild(node); }
}

function setAccessor(node, name, old, value, isSvg) {
	if (name === 'className') { name = 'class'; }

	if (name === 'key') {} else if (name === 'ref') {
		if (old) { old(null); }
		if (value) { value(node); }
	} else if (name === 'class' && !isSvg) {
		node.className = value || '';
	} else if (name === 'style') {
		if (!value || typeof value === 'string' || typeof old === 'string') {
			node.style.cssText = value || '';
		}
		if (value && typeof value === 'object') {
			if (typeof old !== 'string') {
				for (var i in old) {
					if (!(i in value)) { node.style[i] = ''; }
				}
			}
			for (var i in value) {
				node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
			}
		}
	} else if (name === 'dangerouslySetInnerHTML') {
		if (value) { node.innerHTML = value.__html || ''; }
	} else if (name[0] == 'o' && name[1] == 'n') {
		var useCapture = name !== (name = name.replace(/Capture$/, ''));
		name = name.toLowerCase().substring(2);
		if (value) {
			if (!old) { node.addEventListener(name, eventProxy, useCapture); }
		} else {
			node.removeEventListener(name, eventProxy, useCapture);
		}
		(node._listeners || (node._listeners = {}))[name] = value;
	} else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
		try {
			node[name] = value == null ? '' : value;
		} catch (e) {}
		if ((value == null || value === false) && name != 'spellcheck') { node.removeAttribute(name); }
	} else {
		var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));

		if (value == null || value === false) {
			if (ns) { node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); }else { node.removeAttribute(name); }
		} else if (typeof value !== 'function') {
			if (ns) { node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); }else { node.setAttribute(name, value); }
		}
	}
}

function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}

var mounts = [];

var diffLevel = 0;

var isSvgMode = false;

var hydrating = false;

function flushMounts() {
	var c;
	while (c = mounts.pop()) {
		if (options.afterMount) { options.afterMount(c); }
		if (c.componentDidMount) { c.componentDidMount(); }
	}
}

function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	if (!diffLevel++) {
		isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

		hydrating = dom != null && !('__preactattr_' in dom);
	}

	var ret = idiff(dom, vnode, context, mountAll, componentRoot);

	if (parent && ret.parentNode !== parent) { parent.appendChild(ret); }

	if (! --diffLevel) {
		hydrating = false;

		if (!componentRoot) { flushMounts(); }
	}

	return ret;
}

function idiff(dom, vnode, context, mountAll, componentRoot) {
	var out = dom,
	    prevSvgMode = isSvgMode;

	if (vnode == null || typeof vnode === 'boolean') { vnode = ''; }

	if (typeof vnode === 'string' || typeof vnode === 'number') {
		if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
			if (dom.nodeValue != vnode) {
				dom.nodeValue = vnode;
			}
		} else {
			out = document.createTextNode(vnode);
			if (dom) {
				if (dom.parentNode) { dom.parentNode.replaceChild(out, dom); }
				recollectNodeTree(dom, true);
			}
		}

		out['__preactattr_'] = true;

		return out;
	}

	var vnodeName = vnode.nodeName;
	if (typeof vnodeName === 'function') {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}

	isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

	vnodeName = String(vnodeName);
	if (!dom || !isNamedNode(dom, vnodeName)) {
		out = createNode(vnodeName, isSvgMode);

		if (dom) {
			while (dom.firstChild) {
				out.appendChild(dom.firstChild);
			}
			if (dom.parentNode) { dom.parentNode.replaceChild(out, dom); }

			recollectNodeTree(dom, true);
		}
	}

	var fc = out.firstChild,
	    props = out['__preactattr_'],
	    vchildren = vnode.children;

	if (props == null) {
		props = out['__preactattr_'] = {};
		for (var a = out.attributes, i = a.length; i--;) {
			props[a[i].name] = a[i].value;
		}
	}

	if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
		if (fc.nodeValue != vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	} else if (vchildren && vchildren.length || fc != null) {
			innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
		}

	diffAttributes(out, vnode.attributes, props);

	isSvgMode = prevSvgMode;

	return out;
}

function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
	var originalChildren = dom.childNodes,
	    children = [],
	    keyed = {},
	    keyedLen = 0,
	    min = 0,
	    len = originalChildren.length,
	    childrenLen = 0,
	    vlen = vchildren ? vchildren.length : 0,
	    j,
	    c,
	    f,
	    vchild,
	    child;

	if (len !== 0) {
		for (var i = 0; i < len; i++) {
			var _child = originalChildren[i],
			    props = _child['__preactattr_'],
			    key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
			if (key != null) {
				keyedLen++;
				keyed[key] = _child;
			} else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
				children[childrenLen++] = _child;
			}
		}
	}

	if (vlen !== 0) {
		for (var i = 0; i < vlen; i++) {
			vchild = vchildren[i];
			child = null;

			var key = vchild.key;
			if (key != null) {
				if (keyedLen && keyed[key] !== undefined) {
					child = keyed[key];
					keyed[key] = undefined;
					keyedLen--;
				}
			} else if (min < childrenLen) {
					for (j = min; j < childrenLen; j++) {
						if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
							child = c;
							children[j] = undefined;
							if (j === childrenLen - 1) { childrenLen--; }
							if (j === min) { min++; }
							break;
						}
					}
				}

			child = idiff(child, vchild, context, mountAll);

			f = originalChildren[i];
			if (child && child !== dom && child !== f) {
				if (f == null) {
					dom.appendChild(child);
				} else if (child === f.nextSibling) {
					removeNode(f);
				} else {
					dom.insertBefore(child, f);
				}
			}
		}
	}

	if (keyedLen) {
		for (var i in keyed) {
			if (keyed[i] !== undefined) { recollectNodeTree(keyed[i], false); }
		}
	}

	while (min <= childrenLen) {
		if ((child = children[childrenLen--]) !== undefined) { recollectNodeTree(child, false); }
	}
}

function recollectNodeTree(node, unmountOnly) {
	var component = node._component;
	if (component) {
		unmountComponent(component);
	} else {
		if (node['__preactattr_'] != null && node['__preactattr_'].ref) { node['__preactattr_'].ref(null); }

		if (unmountOnly === false || node['__preactattr_'] == null) {
			removeNode(node);
		}

		removeChildren(node);
	}
}

function removeChildren(node) {
	node = node.lastChild;
	while (node) {
		var next = node.previousSibling;
		recollectNodeTree(node, true);
		node = next;
	}
}

function diffAttributes(dom, attrs, old) {
	var name;

	for (name in old) {
		if (!(attrs && attrs[name] != null) && old[name] != null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
		}
	}

	for (name in attrs) {
		if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
		}
	}
}

var recyclerComponents = [];

function createComponent(Ctor, props, context) {
	var inst,
	    i = recyclerComponents.length;

	if (Ctor.prototype && Ctor.prototype.render) {
		inst = new Ctor(props, context);
		Component.call(inst, props, context);
	} else {
		inst = new Component(props, context);
		inst.constructor = Ctor;
		inst.render = doRender;
	}

	while (i--) {
		if (recyclerComponents[i].constructor === Ctor) {
			inst.nextBase = recyclerComponents[i].nextBase;
			recyclerComponents.splice(i, 1);
			return inst;
		}
	}

	return inst;
}

function doRender(props, state, context) {
	return this.constructor(props, context);
}

function setComponentProps(component, props, renderMode, context, mountAll) {
	if (component._disable) { return; }
	component._disable = true;

	component.__ref = props.ref;
	component.__key = props.key;
	delete props.ref;
	delete props.key;

	if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
		if (!component.base || mountAll) {
			if (component.componentWillMount) { component.componentWillMount(); }
		} else if (component.componentWillReceiveProps) {
			component.componentWillReceiveProps(props, context);
		}
	}

	if (context && context !== component.context) {
		if (!component.prevContext) { component.prevContext = component.context; }
		component.context = context;
	}

	if (!component.prevProps) { component.prevProps = component.props; }
	component.props = props;

	component._disable = false;

	if (renderMode !== 0) {
		if (renderMode === 1 || options.syncComponentUpdates !== false || !component.base) {
			renderComponent(component, 1, mountAll);
		} else {
			enqueueRender(component);
		}
	}

	if (component.__ref) { component.__ref(component); }
}

function renderComponent(component, renderMode, mountAll, isChild) {
	if (component._disable) { return; }

	var props = component.props,
	    state = component.state,
	    context = component.context,
	    previousProps = component.prevProps || props,
	    previousState = component.prevState || state,
	    previousContext = component.prevContext || context,
	    isUpdate = component.base,
	    nextBase = component.nextBase,
	    initialBase = isUpdate || nextBase,
	    initialChildComponent = component._component,
	    skip = false,
	    snapshot = previousContext,
	    rendered,
	    inst,
	    cbase;

	if (component.constructor.getDerivedStateFromProps) {
		state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
		component.state = state;
	}

	if (isUpdate) {
		component.props = previousProps;
		component.state = previousState;
		component.context = previousContext;
		if (renderMode !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
			skip = true;
		} else if (component.componentWillUpdate) {
			component.componentWillUpdate(props, state, context);
		}
		component.props = props;
		component.state = state;
		component.context = context;
	}

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	if (!skip) {
		rendered = component.render(props, state, context);

		if (component.getChildContext) {
			context = extend(extend({}, context), component.getChildContext());
		}

		if (isUpdate && component.getSnapshotBeforeUpdate) {
			snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
		}

		var childComponent = rendered && rendered.nodeName,
		    toUnmount,
		    base;

		if (typeof childComponent === 'function') {

			var childProps = getNodeProps(rendered);
			inst = initialChildComponent;

			if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
				setComponentProps(inst, childProps, 1, context, false);
			} else {
				toUnmount = inst;

				component._component = inst = createComponent(childComponent, childProps, context);
				inst.nextBase = inst.nextBase || nextBase;
				inst._parentComponent = component;
				setComponentProps(inst, childProps, 0, context, false);
				renderComponent(inst, 1, mountAll, true);
			}

			base = inst.base;
		} else {
			cbase = initialBase;

			toUnmount = initialChildComponent;
			if (toUnmount) {
				cbase = component._component = null;
			}

			if (initialBase || renderMode === 1) {
				if (cbase) { cbase._component = null; }
				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
			}
		}

		if (initialBase && base !== initialBase && inst !== initialChildComponent) {
			var baseParent = initialBase.parentNode;
			if (baseParent && base !== baseParent) {
				baseParent.replaceChild(base, initialBase);

				if (!toUnmount) {
					initialBase._component = null;
					recollectNodeTree(initialBase, false);
				}
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount);
		}

		component.base = base;
		if (base && !isChild) {
			var componentRef = component,
			    t = component;
			while (t = t._parentComponent) {
				(componentRef = t).base = base;
			}
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}
	}

	if (!isUpdate || mountAll) {
		mounts.unshift(component);
	} else if (!skip) {

		if (component.componentDidUpdate) {
			component.componentDidUpdate(previousProps, previousState, snapshot);
		}
		if (options.afterUpdate) { options.afterUpdate(component); }
	}

	while (component._renderCallbacks.length) {
		component._renderCallbacks.pop().call(component);
	}if (!diffLevel && !isChild) { flushMounts(); }
}

function buildComponentFromVNode(dom, vnode, context, mountAll) {
	var c = dom && dom._component,
	    originalComponent = c,
	    oldDom = dom,
	    isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
	    isOwner = isDirectOwner,
	    props = getNodeProps(vnode);
	while (c && !isOwner && (c = c._parentComponent)) {
		isOwner = c.constructor === vnode.nodeName;
	}

	if (c && isOwner && (!mountAll || c._component)) {
		setComponentProps(c, props, 3, context, mountAll);
		dom = c.base;
	} else {
		if (originalComponent && !isDirectOwner) {
			unmountComponent(originalComponent);
			dom = oldDom = null;
		}

		c = createComponent(vnode.nodeName, props, context);
		if (dom && !c.nextBase) {
			c.nextBase = dom;

			oldDom = null;
		}
		setComponentProps(c, props, 1, context, mountAll);
		dom = c.base;

		if (oldDom && dom !== oldDom) {
			oldDom._component = null;
			recollectNodeTree(oldDom, false);
		}
	}

	return dom;
}

function unmountComponent(component) {
	if (options.beforeUnmount) { options.beforeUnmount(component); }

	var base = component.base;

	component._disable = true;

	if (component.componentWillUnmount) { component.componentWillUnmount(); }

	component.base = null;

	var inner = component._component;
	if (inner) {
		unmountComponent(inner);
	} else if (base) {
		if (base['__preactattr_'] && base['__preactattr_'].ref) { base['__preactattr_'].ref(null); }

		component.nextBase = base;

		removeNode(base);
		recyclerComponents.push(component);

		removeChildren(base);
	}

	if (component.__ref) { component.__ref(null); }
}

function Component(props, context) {
	this._dirty = true;

	this.context = context;

	this.props = props;

	this.state = this.state || {};

	this._renderCallbacks = [];
}

extend(Component.prototype, {
	setState: function setState(state, callback) {
		var prev = this.prevState = this.state;
		if (typeof state === 'function') { state = state(prev, this.props); }
		this.state = extend(extend({}, prev), state);
		if (callback) { this._renderCallbacks.push(callback); }
		enqueueRender(this);
	},
	forceUpdate: function forceUpdate(callback) {
		if (callback) { this._renderCallbacks.push(callback); }
		renderComponent(this, 2);
	},
	render: function render() {}
});

function render(vnode, parent, merge) {
  return diff(merge, vnode, {}, false, parent, false);
}


//# sourceMappingURL=preact.mjs.map

'use strict';

var Header = (function (Component$$1) {
  function Header () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Header.__proto__ = Component$$1;
  Header.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Header.prototype.constructor = Header;

  Header.prototype.handleOpen = function handleOpen (appName) {
    this.props.onOpen && this.props.onOpen(appName);
  };

  Header.prototype.handleClose = function handleClose (appName, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onClose && this.props.onClose(appName);
  };

  Header.prototype.render = function render$$1 () {
    var this$1 = this;

    var ref = this.props;
    var nowApp = ref.nowApp;
    var openedAppList = ref.openedAppList;
    var status = ref.status;
    
    var type = 'normal';
    if (status && status.type != type) { type = status.type; }

    var allOpened = Object.keys(openedAppList).map(function (key) {
      if (key == nowApp || key == 'home') { return false; }
      return openedAppList[key];
    }).filter(function (app) { return app; });

    if ((!nowApp || nowApp =='home') && !allOpened.length) {
      return preact.h( 'div', { class: "header" },
        preact.h( 'div', { class: "headerInner" },
          preact.h( 'div', { class: "headerText" }, "One is more!")
        )
      );
    } else {
      var width = document.body.clientWidth - ( type == 'normal' ? 80: 0) - 200;
      var size = Math.floor(width / 100);

      
      return preact.h( 'div', { class: "header" },
        preact.h( 'div', { class: "headerInner" },
          preact.h( 'div', { class: "headerTabs", style: {paddingLeft:( type == 'normal' ? '80px': '0')} },
            preact.h( 'div', { class: "tabItem" + ( nowApp == 'home' ? ' opened': ''), onClick: this.handleOpen.bind(this, 'home') },
              preact.h( 'div', { class: "tabItemIcon home" }),
              preact.h( 'div', { class: "tabItemName" }, "Home")
            ),
            openedAppList[nowApp] && preact.h( 'div', { class: "tabItem opened" },
              preact.h( 'div', { class: "tabItemIcon", style: {backgroundImage: ("url(\"" + (openedAppList[nowApp].icon) + "\")")} }),
              preact.h( 'div', { class: "tabItemName" }, openedAppList[nowApp].name),
              preact.h( 'div', { class: "tabClose", onClick: this.handleClose.bind(this, openedAppList[nowApp].commonName ) })
            ),
            allOpened.slice(0, size).map(function (app) {
                return preact.h( 'div', { class: "tabItem", onClick: this$1.handleOpen.bind(this$1, app) },
                  preact.h( 'div', { class: "tabItemIcon", style: {backgroundImage: ("url(\"" + (app.icon) + "\")")} }),
                  preact.h( 'div', { class: "tabItemName" }, app.name),
                  preact.h( 'div', { class: "tabClose", onClick: this$1.handleClose.bind(this$1, app.commonName ) })
                )
              })
          )
        )
      )
    }
  };

  return Header;
}(Component));

'use strict';

var Light = (function (Component$$1) {
  function Light(props) {
    Component$$1.call(this, props);
    this.state = {
      LightComponent: null
    };

    this.loadScript(props.data);
  }

  if ( Component$$1 ) Light.__proto__ = Component$$1;
  Light.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Light.prototype.constructor = Light;
  Light.prototype.loadScript = function loadScript (appInfo) {
    var this$1 = this;


    var js = appInfo.js;
    var commonName = appInfo.commonName;
    var originName = appInfo.originName;
    var css = appInfo.css;
    var appName = 'lightapp-' + commonName;
    var appComponentName = 'lightappComp-' + commonName;

    if (css) {
      var cssName = 'lightcss-' + commonName;
      var cssNode = document.getElementById(cssName);
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
      }, function () {
        var script = document.createElement('script');
        script.setAttribute('data-status', 'loading');
        script.setAttribute('id', appName);
        script.setAttribute('src', js + '?v=' + Date.now());
        script.onload = function () {
          script.setAttribute('data-status', 'loaded');
          this$1.loadScript(appInfo);
        };
        document.head.appendChild(script);
      });
    }
  };


  Light.prototype.renderAppContent = function renderAppContent () {

  };

  Light.prototype.render = function render$$1 () {
    var ref = this.state;
    var LightComponent = ref.LightComponent;

    var ref$1 = this.props;
    var data = ref$1.data;
    var getInnerProps = ref$1.getInnerProps;
    return preact.h( 'div', { class: "lightAppItem" },
      LightComponent && preact.h( LightComponent, getInnerProps(data.originName)),
      preact.h( 'div', { class: "lightInfo" },
          preact.h( 'div', { class: "lightInfoIcon", style: {backgroundImage: ("url(\"" + (data.icon) + "\")")} }),
          preact.h( 'div', { class: "lightInfoName" }, data.lightName || data.name)
      )
    );
  };

  return Light;
}(Component));

'use strict';

var Home = (function (Component$$1) {
  function Home () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Home.__proto__ = Component$$1;
  Home.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Home.prototype.constructor = Home;

  Home.prototype.renderList = function renderList () {
    var ref = this.props;
    var appList = ref.appList;

    var app = {
      dev: [],
      love: [],
      usage: [],
      light: []
    };

    console.log(app);

    if (!appList) { return; }
    appList.map(function (item) {
      app[item.classify || 'usage'].push(item);
    });
   
    return preact.h( 'div', { class: "list" },
      this.renderLight(app.light),
      this.renderListByType('本地开发中', app.dev),
      this.renderListByType('我喜欢的', app.love),
      this.renderListByType('我使用的', app.usage)
    )

  };

  Home.prototype.renderLight = function renderLight (light) {
    var this$1 = this;

    if (!light.length) { return; }
    return preact.h( 'div', { class: "lightApp" },
      preact.h( 'div', { class: "lightAppContainer" },
        light.map(function (light) {
            return preact.h( Light, { data: light, fun: this$1.props.fun, getInnerProps: this$1.props.getInnerProps });
          })
      )
    )
  };

  Home.prototype.renderListByType = function renderListByType (title, list) {
    var this$1 = this;

    if (!list || !list.length) { return preact.h( 'div', null ); }
    return preact.h( 'div', null,
      preact.h( 'div', { class: "listTitle" }, title),
      preact.h( 'div', { class: "listItems" }, list.map(function (item) {
          return preact.h( 'div', { class: "appItem", onClick: function () {
            this$1.props.onOpen(item);
          } },
            preact.h( 'div', { class: "appLogo", style: {background: ("url(\"" + (item.icon) + "\") center/contain no-repeat")} }),
            preact.h( 'div', { class: "appName" }, item.name)
          );
        }))
    )
  };

  Home.prototype.render = function render$$1 () {
    return preact.h( 'div', { class: "home" },
      preact.h( 'div', { class: "searchForm" },
        preact.h( 'input', { class: "searchInput", placeholder: "搜索One功能组件" })
      ),
      this.renderList()
    )
  };

  return Home;
}(Component));

'use strict';

var ref = window.electron;
var ipcRenderer = ref.ipcRenderer;

var One = (function (Component$$1) {
  function One(props) {
    Component$$1.call(this, props);
    this.state = {
      status: null,
      nowApp: '',
      nowAppInfo: {},
      openedAppList: {},
      appList: []
    };

    this.bindEvent();

    this.getData('status', this.ipcState.bind(this));
    this.getData('appList', this.ipcState.bind(this));
    
  }

  if ( Component$$1 ) One.__proto__ = Component$$1;
  One.prototype = Object.create( Component$$1 && Component$$1.prototype );
  One.prototype.constructor = One;

  One.prototype.bindEvent = function bindEvent () {
    var this$1 = this;

    ipcRenderer.on('openHome', function () {
      this$1.handleOpen('home');
    });
  };

  One.prototype.getData = function getData (data, cb) {
    var originType = (data.type || data);
    var intype = originType + '-timeid-' + Date.now() + Math.random();
    if (data.type) {
      data.type = intype;
    } else {
      data = intype;
    }
    if (cb) {
      ipcRenderer.on(intype, function (e, data) {
        cb(originType , data);
      });
    }
    ipcRenderer.send('getData', data);
  };

  One.prototype.ipcState = function ipcState (key, value) {

    this.setState(( obj = {
      now: Date.now()
    }, obj[key] = value, obj));
    var obj;
  };

  One.prototype.getScript = function getScript (appInfo) {
    var this$1 = this;
    
    var js = appInfo.js;
    var commonName = appInfo.commonName;
    var originName = appInfo.originName;
    var css = appInfo.css;
    var appName = 'app-' + commonName;
    var containerName = 'contain-' + commonName;
    var container = document.getElementById(containerName);
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('id', containerName);
      container.setAttribute('class', 'container');
      document.body.appendChild(container);
    }

    container.style.display = 'block';

    if (css) {
      var cssName = 'css-' + commonName;
      var cssNode = document.getElementById(cssName);
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
      }, function () {

        var script = document.createElement('script');
        script.setAttribute('data-status', 'loading');
        script.setAttribute('id', appName);
        script.setAttribute('src', js + '?v=' + Date.now());
        script.onload = function () {
          script.setAttribute('data-status', 'loaded');
          this$1.getScript(appInfo);
        };
        document.head.appendChild(script);
      });

    }
  };

  One.prototype.renderAppContent = function renderAppContent (AppClass, container, commonName) {
    if (container.innerHTML) { return; }
    render(preact.h( AppClass, this.getInnerProps(commonName)), container);
  };

  One.prototype.getInnerProps = function getInnerProps (commonName) {
    var this$1 = this;

    return {
      storage: {
        get: function (key, cb) {
          this$1.getData({
            type: 'getLocalData',
            key: commonName + '-' + (key || 'main')
          }, function (key, data) { cb(data); });
        },
        set: function (key, data, cb) {
          this$1.getData({
            type: 'setLocalData',
            key: commonName + '-' + (key || 'main'),
            data: data
          }, function (key, data) { cb(data); });
        }
      },
      fetch: function (url, method, data, cb) {
        this$1.getData({
          type: 'fetchRemoteData',
          url: url, method: method, data: data
        }, function (key, data) { cb(data); });
      }
    }
  };

  One.prototype.handleClose = function handleClose (appName) {

    var ref = this.state;
    var openedAppList = ref.openedAppList;
    var nowApp = ref.nowApp;
    delete openedAppList[appName];

    if (nowApp != appName) {
      var oldContainer = document.getElementById('contain-' + nowApp);
      if (oldContainer) { oldContainer.style.display = 'none'; }
    }

    var container = document.getElementById('contain-' + appName);
    if (container) { container.parentNode.removeChild(container); }

    this.setState({
      nowApp: 'home',
      nowAppInfo: null,
      openedAppList: openedAppList,
      now: Date.now()
    });
  };

  One.prototype.handleOpen = function handleOpen (app) {

    var ref = this.state;
    var openedAppList = ref.openedAppList;
    var nowApp = ref.nowApp;


    
    if (nowApp) {
      var oldContainer = document.getElementById('contain-' + nowApp);
      if (oldContainer) { oldContainer.style.display = 'none'; }
    }
   
    if (app == 'home') {
      this.setState({
        nowApp: 'home',
        nowAppInfo: null
      });
    } else {
      if (!openedAppList[app.commonName]) { openedAppList[app.commonName] = app; }
      this.setState({
        nowApp: app.commonName,
        nowAppInfo: app,
        openedAppList: openedAppList,
        now: Date.now()
      });
    }
   
  };

  One.prototype.renderApp = function renderApp () {

    var ref = this.state;
    var nowApp = ref.nowApp;
    var nowAppInfo = ref.nowAppInfo;
    var appList = ref.appList;
    if (!nowApp || nowApp == 'home') {
      return preact.h( Home, { appList: appList, onOpen: this.handleOpen.bind(this), fun: {
        getData: this.getData
      }, getInnerProps: this.getInnerProps.bind(this) });
    }
    this.getScript(nowAppInfo);
    return preact.h( 'span', null );
  };

  One.prototype.render = function render$$1 () {
    var ref = this.state;
    var status = ref.status;
    var nowApp = ref.nowApp;
    var openedAppList = ref.openedAppList;
    if (!status) { return preact.h( 'span', null ); }
    return preact.h( 'div', null,
      preact.h( Header, { nowApp: nowApp, status: status, openedAppList: openedAppList, onOpen: this.handleOpen.bind(this), onClose: this.handleClose.bind(this) }),
      this.renderApp()
    )
  };

  return One;
}(Component));

render(preact.h( One, null ), document.getElementById('container'));

}());
//# sourceMappingURL=main.js.map
