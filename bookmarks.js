(function (root, factory) {
	if (typeof define === 'function' && define.amd) define(['List'], factory);
	else if (typeof module === 'object' && module.exports) module.exports = factory(require('List'));
	else root.Bookmarks = factory(root.List);
}(this, function(List) {
	'use strict';

	var dataAttribute = 'data-bm-main',
		defaults = {
			'bookmarksLayout': '<div class="section-header py-4 row flex-shrink-0"><h2 class="h3 font-weight-light mb-0 pt-3 col-sm-4 col-md-7">Bookmarks</h2><form class="col pt-3 input-group"><select class="form-control" data-bm-main="tags"><option value="">All</option></select><input type="search" class="search form-control" data-bm-main="search" placeholder="Search"><select class="form-control" data-bm-main="sites"><option value="https://google.com/search?q=">Google</option></select></form></div><div class="section-content row flex-nowrap mb-2 pb-4 overflow-auto"><ul class="list nav flex-column col-10 col-md-7 px-0"></ul></div>',
			'path': '/Bookmarks',
			'data': {
				'main': 'roots.other',
				'search': 'Search',
				'children': 'children',
				'name': 'name',
				'url': 'url',
				'sort': 'date_added'
			},
			'list': {
				'item': '<li class="nav-item w-100"><a href="#" class="name url nav-link text-truncate" rel="external"></a></li>',
				'valueNames': ['name', {'name': 'url', 'attr': 'href'}]
			}
		};
	
	function getXHR(url) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url || '/');
		if('overrideMimeType' in xhr) xhr.overrideMimeType('text/plain');
		xhr.send();
		return xhr;
	}
	function jsonPath(data, path) {
		for(var i = 0, ii = path.length; i < ii; i++) data = data[path[i]];
		return data;
	}
	function findIndex(array, key, value) {
		for(var i = 0, ii = array.length; i < ii; i++) if(array[i][key] === value) return i;
		return -1;
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
		this.init(this.options);
	}
	Plugin.prototype = {
		filter: function(value) {
			if(value === '') this.list.filter();
			else this.list.filter(function(item) {
					return item.values().tag === value;
				});
		},
		search: function(input, select) {
			if(input && input.value !== '') window.open(encodeURI(select.value + input.value));
		},
		onsubmit: function(e) {
			e.preventDefault();
			if(this.elements.sites) this.search(this.elements.search, this.elements.sites);
		},
		onchange: function(e) {
			if(e.target === this.elements.tags) this.filter(e.target.value);
			else if(e.target === this.elements.sites) this.search(this.elements.search, e.target);
		},
		handleEvent: function(e) {
			if(this['on' + e.type]) this['on' + e.type](e);
		},
		setData: function(data, options) {
			var mainData = jsonPath(data, options.main.split('.'))[options.children],
				searchIndex = options.search ? findIndex(mainData, options.name, options.search) : -1;
			if(searchIndex !== -1) {
				var searchData = mainData.splice(searchIndex, 1)[0][options.children], i = 0, ii = searchData.length;
				if(this.elements.sites && this.elements.sites.options) for(; i < ii; i++) this.elements.sites.options.add(new Option(searchData[i][options.name], searchData[i][options.url]));
			}
			var node = {}, flatData = [];
			while(mainData.length !== 0) {
				node = mainData.shift();
				if(options.children in node) {
					for(var j = 0, jj = node[options.children].length; j < jj; j++) {
						node[options.children][j].tag = node[options.name];
						mainData.push(node[options.children][j]);
					}
					if(this.elements.tags && this.elements.tags.options) this.elements.tags.options.add(new Option(node[options.name], node[options.name]));
				}
				else flatData.push(node);
			}
			if(options.sort) flatData.sort(function(a, b){
					return a[options.sort] < b[options.sort] ? 1 : -1;
				});
			this.list.add(flatData);
		},
		initElement: function(element, layout) {
			var remove = !document.body.contains(element),
				empty = !element.hasChildNodes(),
				elements = {};
			if(remove) document.body.appendChild(element);
			if(empty) element.insertAdjacentHTML('beforeend', layout);
			var nl = element.querySelectorAll('[' + dataAttribute + ']'), i = 0, ii = nl.length;
			for(; i < ii; i++) elements[nl[i].getAttribute(dataAttribute)] = nl[i];
			['submit', 'change'].forEach(function(item) {
				element.addEventListener(item, this);
			}, this);
			this.element = element,
			this.elementRemove = remove,
			this.elementEmpty = empty,
			this.elements = elements;
		},
		destroyElement: function() {
			['submit', 'change'].forEach(function(item) {
				this.element.removeEventListener(item, this);
			}, this);
			if(this.elementRemove) this.element.remove();
			else if(this.elementEmpty) this.element.textContent = '';
			['elements', 'elementEmpty', 'elementRemove', 'element'].forEach(function(item) {
				delete this[item];
			}, this);
		},
		init: function(options) {
			var self = this, layout = document.getElementById('bookmarksLayout'),
				element = options.element && typeof options.element === 'string' ? document.querySelector(options.element) : options.element;
			if(layout) options.bookmarksLayout = layout.innerHTML.trim();
			layout = document.getElementById('bookmarksListItemLayout');
			if(layout) options.list.item = layout.innerHTML.trim();
			if(element) {
				this.initElement(element, options.bookmarksLayout);
				this.list = new List(element, options.list);
				getXHR(options.path).onload = function() {
					self.setData(JSON.parse(this.response), options.data);
				};
			}
		},
		destroy: function() {
			if(this.element) {
				delete this.list;
				this.destroyElement();
			}
			delete this.options;
		}
	};
	
	return Plugin;
}));