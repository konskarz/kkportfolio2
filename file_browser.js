(function(root, factory) {
	if(typeof define === 'function' && define.amd) define([], factory);
	else if(typeof exports === 'object' && module.exports) module.exports = factory();
	else root.FileBrowser = factory();
}(this, function() {
	'use strict';
	
	var isMobile = (function() {
			return (navigator.platform !== undefined && navigator.platform === 'MacIntel'
				&& navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 1)
				|| /Mobi|Tablet|Android|iPad|iPhone/.test(navigator.userAgent);
		})(),
		isFirefox = (function() {
			return /irefox/.test(navigator.userAgent);
		})(),
		highlighter = (function() {
			// https://bugs.chromium.org/p/chromium/issues/detail?id=1297594
			if(isMobile && !isFirefox) return null;
			if(window.Prism !== undefined) return {
				types: {
					'clike':		['c','h','cpp','hpp','c++'],
					'css':			['less','mf'],
					'javascript':	['js','json'],
					'markup':		['htm','html','shtml','xhtml','xml','mxml','jardesc','svg','wml'],
					'actionscript':	['as'],
					'applescript':	['scpt'],
					'aspnet':		['asp','aspx'],
					'bash':			['bsh'],
					'batch':		['bat','cmd'],
					'brainfuck':	['b','bf'],
					'coffeescript':	['coffee'],
					'eiffel':		['e'],
					'erlang':		['erl'],
					'fsharp':		['fs'],
					'fortran':		['f','f90'],
					'gherkin':		['feature'],
					'groovy':		['gsh','gvy','gy'],
					'haskell':		['hs','lhs'],
					'ini':			['properties'],
					'java':			['j','jsp'],
					'julia':		['jl'],
					'keyman':		['kmn'],
					'latex':		['tex'],
					'lolcode':		['lol','lols'],
					'makefile':		['make'],
					'matlab':		['m'],
					'nasm':			['asm'],
					'nsis':			['nsh','nsi'],
					'pascal':		['pas'],
					'perl':			['pl'],
					'php':			['php2','php3','php4','php5','phtml'],
					'powershell':	['ps1','psm1'],
					'python':		['py'],
					'ruby':			['rb'],
					'rust':			['rs'],
					'scheme':		['scm','ss'],
					'smalltalk':	['st'],
					'smarty':		['tpl'],
					'stylus':		['styl'],
					'typescript':	['ts']
				},
				language: function(type) {
					return window.Prism.languages[type];
				},
				highlight: function(src, lang) {
					return window.Prism.highlight(src, window.Prism.languages[lang], lang);
				}
			};
			if(window.hljs !== undefined) return {
				types: {
					'actionscript':	['as'],
					'applescript':	['scpt','osascript'],
					'bash':			['bsh','sh'],
					'brainfuck':	['b','bf'],
					'c':			['h'],
					'cpp':			['cc','c++','h++','hpp','hh','hxx','cxx'],
					'coffeescript':	['coffee','cson','iced'],
					'csharp':		['cs','c#'],
					'css':			['less','mf'],
					'diff':			['patch'],
					'erlang':		['erl'],
					'fsharp':		['fs','f#'],
					'fortran':		['f','f90','f95'],
					'gherkin':		['feature'],
					'go':			['golang'],
					'groovy':		['gsh','gvy','gy'],
					'haskell':		['hs','lhs'],
					'ini':			['properties','toml'],
					'java':			['j','jsp'],
					'javascript':	['js','jsx','mjs','cjs'],
					'json':			['json'],
					'julia':		['jl'],
					'kotlin':		['kt','kts'],
					'latex':		['tex'],
					'less':			['less'],
					'lua':			['lua'],
					'makefile':		['mk','mak','make'],
					'markdown':		['md','mkdown','mkd'],
					'matlab':		['m'],
					'nsis':			['nsh','nsi'],
					'objectivec':	['mm','objc','obj-c','obj-c++','objective-c++'],
					'pascal':		['pas'],
					'perl':			['pl','pm'],
					'php':			['php2','php3','php4','php5','phtml'],
					'php-template':	['ctp','latte','mustache','tpl','twig'],
					'powershell':	['ps1','psm1'],
					'python':		['py','gyp','ipython'],
					'python-repl':	['pycon'],
					'r':			['r'],
					'ruby':			['rb','gemspec','podspec','thor','irb'],
					'rust':			['rs'],
					'scheme':		['scm','ss'],
					'scss':			['scss'],
					'shell':		['console','shellsession'],
					'smalltalk':	['st'],
					'stylus':		['styl'],
					'sql':			['sql'],
					'swift':		['swift'],
					'typescript':	['ts','tsx'],
					'vbnet':		['vb'],
					'xml':			['htm','html','shtml','xhtml','xml','mxml','jardesc','rss','atom','xjb','xsd','xsl','plist','svg','wml','wsf'],
					'yaml':			['yml']
				},
				language: function(type) {
					return window.hljs.getLanguage(type);
				},
				highlight: function(src, lang) {
					return window.hljs.highlight(src, {language: lang, ignoreIllegals: true}).value;
				}
			};
			return null;
		})(),
		canPdf = (function() {
			function getAXO(name) {
				try { return new window.ActiveXObject(name); } catch(e) { return null; }
			}
			if(isMobile) return false;
			if(navigator.mimeTypes['application/pdf'] !== undefined) return true;
			if(isFirefox) {
				var uas = navigator.userAgent.split('rv:');
				return uas.length > 1 && parseInt(uas[1].split('.')[0], 10) > 18;
			}
			return 'ActiveXObject' in window && !!(getAXO('AcroPDF.PDF') || getAXO('PDF.PdfCtrl'));
		})(),
		fileTypes = (function() {
			var types = {
				'pre': ['applescript','as','asp','aspx','atom','asm','b','bf','bas','bashrc','bat','bbcolors','bowerrc','bsh','c','c#','c++','cc','cfc','cfg','cfm','cjs','cmd','cnf','coffee','conf','console','cpp','cs','cson','css','csslintrc','csv','ctp','curlrc','cxx','diff','e','eco','editorconfig','ejs','emacs','eml','erb','erl','eslintignore','eslintrc','f','f#','f90','f95','feature','fs','gemrc','gemspec','gitattributes','gitconfig','gitignore','go','golang','gsh','gvy','gvimrc','gy','gyp','h','h++','haml','hbs','hgignore','hh','hpp','hs','htaccess','htm','html','hxx','iced','ini','ino','irb','ipython','irbrc','itermcolors','j','jade','jardesc','j','java','jl','js','jscsrc','jshintignore','jshintrc','json','jsonld','jsp','jsx','kmn','kt','kts','latte','less','lhs','ls','log','lol','lols','lua','m','mak','make','markdown','md','mdown','mdwn','mf','mht','mhtml','mjs','mk','mkd','mkdn','mkdown','mm','mustache','mxml','nfo','npmrc','npmignore','nsh','nsi','nvmrc','objc','obj-c','obj-c++','objective-c++','osascript','pas','patch','pbxproj','pch','php','php2','php3','php4','php5','phtml','pl','plist','pm','podspec','properties','ps1','psm1','py','pycon','r','rb','rdoc','rdoc_options','reg','ron','rs','rss','rst','rtf','rvmrc','sass','scala','scm','scpt','scss','seestyle','sh','shellsession','sls','ss','sss','sh','shtml','strings','st','styl','stylus','sub','sublime-build','sublime-commands','sublime-completions','sublime-keymap','sublime-macro','sublime-menu','sublime-project','sublime-settings','sublime-workspace','svg','sql','svg','swift','terminal','tex','text','textile','thor','tmLanguage','tmTheme','toml','tpl','ts','tsv','tsx','twig','txt','vb','vbs','vim','viminfo','vimrc','webapp','wml','wsf','xht','xhtml','xjb','xml','xsd','xsl','yaml','yml','zsh','zshrc'],
				'img': ['bmp','gif','ico','jpg','jpeg','png']
			};
			function getMediaTypes(el, src) {
				var trg = [], name;
				if(el.canPlayType) for(name in src) if(el.canPlayType(name) !== '') Array.prototype.push.apply(trg, src[name]);
				return trg;
			}
			function getCodeTypes(src, highlighter) {
				var trg = [], i = 0, ii = src.length;
				for(; i < ii; i++) {
					if(highlighter.language(getType(src[i], highlighter.types) || src[i])) {
						trg.push(src[i]);
						src.splice(i, 1);
						i--;
					}
				}
				return trg;
			}
			types.audio = getMediaTypes(document.createElement('audio'), {
				'audio/mp4':	['m4a'],
				'audio/mpeg':	['mp3'],
				'audio/ogg':	['ogg','oga'],
				'audio/wav':	['wav']
			});
			types.video = getMediaTypes(document.createElement('video'), {
				'video/mp4':	['mp4','m4v'],
				'video/ogg':	['ogv'],
				'video/webm':	['webm']
			});
			if(highlighter) types.code = getCodeTypes(types.pre, highlighter);
			if(window.PDFViewer !== undefined || canPdf) types.pdf = ['pdf'];
			return types;
		})(),
		DOMP = new DOMParser(),
		getUrl = {
			path: function(url) {
				return url.replace(/^\/|\/$/g, '').split('/');
			},
			name: function(url) {
				return this.path(url).pop();
			},
			text: function(url) {
				return decodeURI(this.name(url));
			},
			ext: function(url) {
				return url.slice(url.lastIndexOf('/') + 1).lastIndexOf('.') > 0 ?
					this.name(url).split('.').pop().toLowerCase() : '';
			},
			depth: function(url, root) {
				var relative = url.replace(root, '');
				return relative ? this.path(relative).length : 0;
			}
		},
		dataAttribute = {
			'main': 'data-fb-main',
			'node': 'data-fb-node-id',
			'type': 'data-fb-node-type',
			'group': 'data-fb-group-id',
			'indent': 'data-fb-indent'
		},
		defaults = {
			'templates': {
				'fileBrowserLayout': '<div class="flex-shrink-0 navbar navbar-expand navbar-light bg-light"><div class="navbar-nav"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Close" data-fb-main="close"><i class="bi bi-x" aria-hidden="true"></i></button></div><div class="navbar-nav overflow-auto mr-auto" data-fb-main="crumbs"></div><div class="navbar-nav" data-fb-main="prevnext"></div></div><div class="flex-grow-1 row no-gutters flex-nowrap overflow-hidden"><div class="d-none d-lg-block col-3 overflow-auto"><div class="nav nav-pills flex-column py-2" data-fb-main="tree"></div></div><div class="col overflow-auto" data-fb-main="content"></div></div>',
				'fileBrowserPrevNext': '<a class="nav-link text-nowrap user-select-none" href="{prev.a_attr.href}" title="{prev.a_attr.title}" data-fb-node-id="{prev.id}" aria-label="Previous"><i class="bi bi-chevron-left" aria-hidden="true"></i></a><a class="nav-link text-nowrap user-select-none" href="{next.a_attr.href}" title="{next.a_attr.title}" data-fb-node-id="{next.id}" aria-label="Next"><i class="bi bi-chevron-right" aria-hidden="true"></i></a>',
				'fileBrowserCrumbsItem': '<a class="nav-link text-nowrap user-select-none" href="{a_attr.href}" title="{a_attr.title}" data-fb-node-id="{id}">{text}</a>',
				'fileBrowserTreeGroup': '<div class="nav flex-column flex-nowrap" data-fb-group-id="{id}"></div>',
				'fileBrowserTreeItem': '<a class="nav-link rounded-0 text-nowrap user-select-none" href="{a_attr.href}" title="{a_attr.title}" data-fb-node-id="{id}"><i class="{icon} mr-2"></i><span>{text}</span></a>',
				'fileBrowserCgroup': '<div class="nav nav-pills mh-100 flex-column flex-md-row py-2 py-md-0"></div>',
				'fileBrowserCitem': '<a class="nav-link w-auto col-md-3 col-xl-2 px-3 my-md-2 rounded-0 text-truncate text-md-center user-select-none" href="{a_attr.href}" title="{a_attr.title}" data-fb-node-id="{id}" data-fb-node-type="{data.type}"><i class="{icon} mr-2 d-md-none"></i><i class="{icon} d-none d-md-block h2"></i><span>{text}</span></a>',
				'fileBrowserCpre': '<pre class="w-100 h-100 m-0 p-3"></pre>',
				'fileBrowserCcode': '<pre class="w-100 h-100 m-0 p-3"><code></code></pre>',
				'fileBrowserCimg': '<img class="d-block mw-100 mh-100" src="{a_attr.href}">',
				'fileBrowserCaudio': '<audio class="mw-100 mh-100" src="{a_attr.href}" controls="controls"></audio>',
				'fileBrowserCvideo': '<video class="mw-100 mh-100" src="{a_attr.href}" controls="controls"></video>',
				'fileBrowserCpdf': '<object class="d-block w-100 h-100" data="{a_attr.href}" type="application/pdf"></object>',
				'fileBrowserClnk': '<iframe class="border-0 d-block w-100 h-100" src="{a_attr.href}"></iframe>',
				'fileBrowserCpdfViewer': '<div class="position-absolute w-100 h-100 overflow-auto" data-pv-main="main"><div class="pdfViewer"></div><div class="position-absolute bg-dark" style="left:0;height:1px;" data-pv-main="progress"></div></div>'
			},
			'icons': {
				'dir': 'bi bi-folder',
				'bin': 'bi bi-file',
				'pre': 'bi bi-file-text',
				'code': 'bi bi-file-code',
				'img': 'bi bi-file-image',
				'audio': 'bi bi-file-music',
				'video': 'bi bi-file-play',
				'pdf': 'bi bi-file-pdf',
				'lnk': 'bi bi-link'
			},
			'tree': {
				'activeClass': 'active',
				'indent': 1.5
			}
		};

	/* Element.matches() polyfill: https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill */
	if(!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector/* IE9/10/11 & Edge */ || Element.prototype.webkitMatchesSelector/* Android <4.44, Chrome <34, SF <7.1, iOS <8 */ || Element.prototype.mozMatchesSelector/* FF <34 */;
	function getTarget(target, currentTarget, selector) {
		do {
			if(target.matches(selector)) return target;
			else target = target.parentElement;
		} while(target && target !== currentTarget);
		return null;
	}
	function stopPropagation(event) {
		if(event.stopImmediatePropagation) event.stopImmediatePropagation();
		else event.stopPropagation();
	}
	function cancelEvent(event) {
		event.preventDefault();
		stopPropagation(event);
	}
	function setTemplates(templates) {
		var name, el;
		for(name in templates) {
			el = document.getElementById(name);
			if(el) templates[name] = el.innerHTML.trim();
		}
	}
	function nano(template, data) {
		/* https://github.com/trix/nano/issues/6 */
		return template.replace(/{([\w.]*)}/g, function(str, key) {
			var keys = key.split('.'), v = data[keys.shift()], i = 0, l = keys.length;
			while(i < l) v = v[keys[i++]];
			return (typeof v == 'undefined' || v == null) ? '' : v;
		});
	}
	function getElement(template) {
		var el = document.createElement('div');
		el.innerHTML = template;
		return el.firstChild;
	}
	function getXHR(url) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url || '/');
		if('overrideMimeType' in xhr) xhr.overrideMimeType('text/plain');
		xhr.send();
		return xhr;
	}
	function getType(item, types) {
		for(var name in types) if(types[name].indexOf(item) !== -1) return name;
		return '';
	}
	function empty(element) {
		element.textContent = '';
		return element;
	}
	function findAllByAttr(parent, attribute) {
		return parent.querySelectorAll('[' + attribute + ']');
	}
	function findByAttrValue(parent, attribute, value) {
		return parent.querySelector('[' + attribute + '="' + value + '"]');
	}
	function childOrParent(parent, selector) {
		var child = parent.querySelector(selector);
		return child ? child : parent;
	}
	function resetScroll(element) {
		element.scrollLeft = 0;
		element.scrollTop = 0;
	}
	function scrollRight(element) {
		element.scrollLeft = element.scrollWidth - element.clientWidth;
	}
	function extend() {
		var target = arguments[0], i = 1, ii = arguments.length, options, name;
		for(; i < ii; i++) {
			for(name in (options = arguments[i])) {
				if(Object.prototype.toString.call(options[name]) === '[object Object]') target[name] = extend({}, target[name], options[name]);
				else target[name] = options[name];
			}
		}
		return target;
	}

	function Plugin(options) {
		this.options = extend({}, defaults, options);
		this.dataset = {};
		this.init(this.options);
	}
	Plugin.prototype = {
		getNode: function(id) {
			return this.data.filter(function(n) {
				return n.id === id;
			})[0];
		},
		getChildren: function(id) {
			return this.data.filter(function(n) {
				return n.parent === id;
			});
		},
		hasChildren: function(id) {
			return this.data.some(function(n) {
				return n.parent === id;
			});
		},
		getViewable: function(id) {
			return this.data.filter(function(n) {
				return n.parent === id && n.data.type !== 'bin'; // !/dir|bin/.test(n.data.type)
			});
		},
		refreshContent: function(node, children) {
			if(!this.elements.content) return;
			var i = 0, ii = children.length, group = getElement(nano(this.options.templates.fileBrowserCgroup, node));
			for(; i < ii; i++) group.insertAdjacentHTML('beforeend', nano(this.options.templates.fileBrowserCitem, children[i]));
			empty(this.elements.content).appendChild(group);
			resetScroll(this.elements.content);
		},
		refreshPrevNext: function(node) {
			if(!this.elements.prevnext) return;
			empty(this.elements.prevnext);
			if(node.id !== this.root.id) {
				var viewable = this.getViewable(node.parent),
					index = viewable.indexOf(node),
					prev = viewable[index === 0 ? viewable.length - 1 : index - 1],
					next = viewable[index === viewable.length - 1 ? 0 : index + 1];
				if(viewable.length > 1) this.elements.prevnext.insertAdjacentHTML('beforeend', nano(this.options.templates.fileBrowserPrevNext, {'prev': prev, 'next': next}));
			}
		},
		refreshCrumbs: function(node) {
			if(!this.elements.crumbs) return;
			var el = this.elements.crumbs,
				tpl = this.options.templates.fileBrowserCrumbsItem,
				active = getElement(nano(tpl, node));
			if(node.data.type === 'dir' || node.data.type === 'lnk') {
				active.removeAttribute(dataAttribute.node);
				if(!this.options.zipUrl) active.style = 'pointer-events: none;';
				else {
					active.href = this.options.zipUrl + node.a_attr.href;
					active.download = node.text;
				}
			}
			empty(el).appendChild(active);
			while(node.parent) {
				node = this.getNode(node.parent);
				el.insertAdjacentHTML('afterbegin', nano(tpl, node));
			}
			scrollRight(this.elements.crumbs);
		},
		closeTree: function(node, isCurrent) {
			var group = node.id === this.root.id ? this.elements.tree : findByAttrValue(this.elements.tree, dataAttribute.group, node.id),
				opened = findAllByAttr(group, dataAttribute.group), i = 0, ii = opened.length;
			for(; i < ii; i++) {
				this.getNode(opened[i].getAttribute(dataAttribute.group)).data.opened = false;
				opened[i].remove();
			}
			if(isCurrent && node.id !== this.root.id) this.refreshAll(this.getNode(node.parent), true);
		},
		getTreeItemTpl: function(depth) {
			var tpl = getElement(this.options.templates.fileBrowserTreeItem),
				indent = tpl.getAttribute(dataAttribute.indent) || this.options.tree.indent;
			tpl.insertAdjacentHTML('afterbegin', '<span style="padding-left:' + depth * indent + 'rem;"/>');
			return tpl.outerHTML;
		},
		setTreeGroup: function(node, children, group) {
			var i = 0, ii = children.length, tpl = this.getTreeItemTpl(node.data.depth + 1);
			for(; i < ii; i++) group.insertAdjacentHTML('beforeend', nano(tpl, children[i]));
		},
		openTree: function(node, children) {
			if(!this.elements.tree) return;
			if(node.id !== this.root.id) {
				this.fixTree(this.getNode(node.parent));
				var group = getElement(nano(this.options.templates.fileBrowserTreeGroup, node)),
					item = findByAttrValue(this.elements.tree, dataAttribute.node, node.id);
				this.setTreeGroup(node, children, group);
				item.parentNode.insertBefore(group, item.nextSibling);
			}
			else this.setTreeGroup(node, children, empty(this.elements.tree));
			node.data.opened = true;
		},
		fixTree: function(node) {
			if(!node.data.opened) this.openTree(node, this.getChildren(node.id));
		},
		activateTreeItem: function(node) {
			if(!this.elements.tree) return;
			var cls = this.options.tree.activeClass,
				active = this.elements.tree.querySelector('.' + cls);
			if(active) active.classList.remove(cls);
			if(node.id !== this.root.id) findByAttrValue(this.elements.tree, dataAttribute.node, node.id).classList.add(cls);
		},
		refreshAll: function(node, isOpened) {
			var children = this.getChildren(node.id);
			this.refreshContent(node, children);
			this.refreshPrevNext(node);
			this.refreshCrumbs(node);
			if(isOpened) this.closeTree(node, false);
			else this.openTree(node, children);
			this.activateTreeItem(node);
			this.currentNodeId = node.id;
		},
		setData: function(data, node) {
			for(var i = 0, ii = data.length; i < ii; i++) {
				if(data[i].data.type !== 'dir') data[i].data.type = getType(data[i].data.ext, fileTypes) || 'bin';
				data[i].icon = this.options.icons[data[i].data.type];
			}
			Array.prototype.push.apply(this.data, data);
			this.refreshAll(node, false);
		},
		aai2json: function(doc, node) {
			if(!/Index of/i.test(doc.title)) return [];
			var links = doc.querySelectorAll('a:not([href^="."]):not([href^="/"]):not([href^="?"])'),
				href = node.a_attr.href, depth = getUrl.depth(href, this.root.a_attr.href),
				i = 0, ii = links.length, json = [], url, text, is_dir;
			for(; i < ii; i++) {
				url = href + links[i].getAttribute('href');
				text = getUrl.text(url);
				is_dir = url.slice(-1) === '/';
				json.push({
					'id': url.replace(/^\/|\/$/g, ''),
					'parent': node.id,
					'text': text,
					'a_attr': {
						'href': url,
						'title': text
					},
					'data': {
						'type': is_dir ? 'dir' : 'bin',
						'ext': is_dir ? false : getUrl.ext(url),
						'depth': depth
					}
				});
			}
			return json.sort(function(a, b) {
				if(a.data.type === b.data.type) return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1;
				else return a.data.type > b.data.type ? -1 : 1;
			});
		},
		getData: function(node, callback) {
			var self = this, dirUrl = this.options.dirUrl;
			getXHR(dirUrl ? dirUrl + node.a_attr.href : node.a_attr.href).onload = function() {
				if(dirUrl) callback.call(self, JSON.parse(this.response), node);
				else callback.call(self, self.aai2json(DOMP.parseFromString(this.response, 'text/html'), node), node);
			};
		},
		fixLnk: function(node) {
			node.icon = this.options.icons.lnk;
			node.data.type = 'lnk';
			var oldItem = findByAttrValue(this.elements.tree, dataAttribute.node, node.id),
				newItem = getElement(nano(this.getTreeItemTpl(node.data.depth), node));
			oldItem.parentNode.replaceChild(newItem, oldItem);
		},
		procMedia: function(node, event, callback) {
			var el = getElement(nano(this.options.templates['fileBrowserC' + node.data.type], node));
			el.addEventListener(event, callback, {once : true});
			empty(this.elements.content).appendChild(el);
		},
		proc_img: function(node, callback) {
			this.procMedia(node, 'load', callback);
		},
		proc_audio: function(node, callback) {
			this.procMedia(node, 'loadedmetadata', callback);
		},
		proc_video: function(node, callback) {
			this.procMedia(node, 'loadedmetadata', callback);
		},
		proc_lnk: function(node, callback) {
			this.procMedia(node, 'load', callback);
		},
		proc_pdf: function(node, callback) {
			if(this.pdfViewer) {
				this.pdfViewer.options.pdfjsViewer.eventBus.on('pagesinit', callback, {once: true});
				this.pdfViewer.open(extend({}, node.a_attr, {element: empty(this.elements.content)}));
			}
			else this.procMedia(node, 'load', callback);
		},
		proc_pre: function(node, callback) {
			var el = this.elements.content,
				tpl = getElement(this.options.templates.fileBrowserCpre),
				pre = childOrParent(tpl, 'pre');
			getXHR(node.a_attr.href).onload = function() {
				pre.textContent = this.response;
				empty(el).appendChild(tpl);
				callback();
			};
		},
		proc_code: function(node, callback) {
			if(!highlighter) return this.proc_pre(node, callback);
			var el = this.elements.content,
				tpl = getElement(this.options.templates.fileBrowserCcode),
				code = childOrParent(tpl, 'code');
			getXHR(node.a_attr.href).onload = function() {
				code.innerHTML = highlighter.highlight(this.response, 
					getType(node.data.ext, highlighter.types) || node.data.ext);
				empty(el).appendChild(tpl);
				callback();
			};
		},
		proc_bin: function(node) {
			if(node.data.type === 'lnk' && !this.options.zipUrl) return;
			var a = document.createElement('a');
			a.href = node.data.type === 'lnk' ? this.options.zipUrl + node.a_attr.href : node.a_attr.href;
			a.download = node.text;
			this.element.appendChild(a);
			a.click();
			a.remove();
		},
		procFile: function(node) {
			if(!this.elements.content) return;
			this['proc_' + node.data.type](node, function() {
				resetScroll(this.elements.content);
				this.refreshPrevNext(node);
				this.refreshCrumbs(node);
				this.fixTree(this.getNode(node.parent));
				this.activateTreeItem(node);
				this.currentNodeId = node.id;
			}.bind(this));
		},
		changeDir: function(node) {
			if(this.hasChildren(node.id)) this.refreshAll(node, node.data.opened);
			else this.getData(node, function(data) {
				if(data.length !== 0) this.setData(data, node);
				else {
					this.fixLnk(node);
					this.procFile(node);
				}
			});
		},
		changeNode: function(id, pushState) {
			var node = this.getNode(id),
				isDir = node.data.type === 'dir',
				isCurrent = id === this.currentNodeId;
			if(isDir) {
				if(!isCurrent) this.changeDir(node);
				else this.closeTree(node, isCurrent);
			}
			else {
				if(!isCurrent) this.procFile(node);
				else this.proc_bin(node);
			}
			if('viewer' in this.params && pushState
				&& node.data.type !== 'bin'
				&& (isDir || !isCurrent)) history.pushState(extend({}, this.params, {'id': node.id}), '');
		},
		onpopstate: function(e) {
			if('viewer' in this.params && e.state
				&& 'viewer' in e.state && e.state.viewer === this.params.viewer
				&& 'path' in e.state && e.state.path === this.root.a_attr.href
				&& 'id' in e.state) {
					cancelEvent(e);
					this.changeNode(e.state.id)
				}
		},
		onclick: function(e) {
			if(this.element && this.element === e.currentTarget) {
				var trg = getTarget(e.target, e.currentTarget, '[' + dataAttribute.node + ']'),
					attr = trg ? trg.getAttribute(dataAttribute.node) : null;
				if(attr) {
					cancelEvent(e);
					this.changeNode(attr, true);
				}
				else {
					trg = getTarget(e.target, e.currentTarget, '[' + dataAttribute.main + ']');
					attr = trg ? trg.getAttribute(dataAttribute.main) : null;
					if(attr && this[attr]) {
						cancelEvent(e);
						this[attr](e);
					}
				}
			}
		},
		handleEvent: function(e) {
			if(this['on' + e.type]) this['on' + e.type](e);
		},
		open: function(params) {
			if(!params.path) return;
			this.params = params;
			var text = getUrl.text(params.path),
				element = (params.element && typeof params.element === 'string' ? document.querySelector(params.element) : params.element) || document.createElement('div'),
				remove = !params.element || !document.body.contains(element),
				empty = !element.hasChildNodes(),
				elements = {};
			if(remove) document.body.appendChild(element);
			if(empty) element.insertAdjacentHTML('beforeend', this.options.templates.fileBrowserLayout);
			var nl = findAllByAttr(element, dataAttribute.main), i = 0, ii = nl.length;
			for(; i < ii; i++) elements[nl[i].getAttribute(dataAttribute.main)] = nl[i];
			window.addEventListener('popstate', this);
			element.addEventListener('click', this);
			this.element = element;
			this.elementRemove = remove;
			this.elementEmpty = empty;
			this.elements = elements;
			if(text in this.dataset) {
				this.data = this.dataset[text];
				this.root = this.getNode('#');
				if('id' in params) this.changeNode(params.id); 
				else this.refreshAll(this.root, false);
			}
			else {
				this.root = {
					'id': '#',
					'text': text,
					'a_attr': {'href': params.path, 'title': text},
					'parent': false,
					'data': {'type': 'dir', 'depth': -1}
				};
				this.data = [this.root];
				this.dataset[text] = this.data;
				this.refreshCrumbs(this.root);
				this.getData(this.root, this.setData);
			}
			if('viewer' in params && !('id' in params)) history.pushState(extend({}, params, {'id': this.root.id}), '');
		},
		close: function() {
			if(this.onclose && typeof this.onclose === 'function') this.onclose();
			this.element.removeEventListener('click', this);
			window.removeEventListener('popstate', this);
			if(this.elementRemove) this.element.remove();
			else if(this.elementEmpty) this.element.textContent = '';
			else for(var name in this.elements) this.elements[name].textContent = '';
			for(var i = 0, ii = this.data.length; i < ii; i++) this.data[i].data.opened = false;
			['currentNodeId', 'data', 'root', 'elements', 'elementEmpty', 'elementRemove', 'element', 'params'].forEach(function(item) {
				delete this[item];
			}, this);
		},
		init: function(options) {
			setTemplates(options.templates);
			if(window.PDFViewer !== undefined) this.pdfViewer = new window.PDFViewer({'pdfViewerLayout': options.templates.fileBrowserCpdfViewer});
		},
		destroy: function() {
			if(this.pdfViewer) {
				this.pdfViewer.destroy();
				delete this.pdfViewer;
			}
			['dataset', 'options'].forEach(function(item) {
				delete this[item];
			}, this);
			if(this.onclose) delete this.onclose;
		}
	};
	
	return Plugin;
}));