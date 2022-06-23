(function(root, factory) {
	if(typeof define === 'function' && define.amd) define([], factory);
	else if(typeof exports === 'object' && module.exports) module.exports = factory();
	else root.Chat = factory();
}(this, function() {
	'use strict';
	
	document.querySelector('#manifest-placeholder').setAttribute('href', 
		URL.createObjectURL(new Blob([JSON.stringify({
			'name': 'Chat',
			'start_url': window.location.href,
			'icons': [
				{
					'src': 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.0/icons/chat-text.svg',
					'sizes': 'any',
					'type': 'image/svg+xml'
				}
			],
			'display': 'standalone'
		})], {type: 'application/json'})));

	var params = (function(l) {
			var p = new URLSearchParams(l.search);
			return {
				'id': Math.floor(100000 + Math.random() * 900000).toString(),
				'ios': /iPad|iPhone|iPod/.test(navigator.userAgent),
				'share': l.search ? l.href.replace(l.search, '?u=guest') : l.href,
				'user': p.get('u'),
				'password': p.get('p')
			};
		})(window.location),
		dataAttribute = 'data-chat',
		defaults = {
			'templates': {
				'chatLayout': '<div class="navbar p-3"><div class="navbar-brand text-truncate" data-chat="title">Chat</div></div><div class="row no-gutters px-3 mb-auto overflow-auto" data-chat="log"></div><form class="input-group p-3"><input type="text" class="form-control" data-chat="message" hidden><input type="text" maxlength="50" class="form-control rounded-left" data-chat="name"><div class="input-group-append"><button class="btn input-group-text rounded-right"><i class="bi bi-save"></i></button><button class="btn input-group-text" hidden><i class="bi bi-send"></i></button></div></form><div class="modal-backdrop bg-light" data-chat="splash"><div class="d-flex w-100 h-100" data-chat="location"></div></div>',
				'chatLocation': '<a href="{href}" class="btn m-auto" data-chat="cancel" hidden><img alt="Cancel" src="https://chart.googleapis.com/chart?cht=qr&chs=174x174&chco=000000,f8f9fa&chld=M|0&chl={href}"></a><button class="btn m-auto" data-chat="start"><img alt="Start" src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.0/icons/chat-text.svg" width="174" height="174"></button>',
				'msgSys': '<div class="col-12 my-2 text-center"><small>{message}</small></div>',
				'msgOut': '<div class="col-10 my-2 py-2 px-3 rounded text-white bg-dark offset-2"><div class="mb-1">{message}</div><small class="d-block text-right">{time}</small></div>',
				'msgIn': '<div class="col-10 my-2 py-2 px-3 rounded text-white bg-secondary"><div class="mb-1">{message}</div><small class="d-block text-right">{time}</small></div>'
			},
			'languages': ['en', 'de', 'ru'],
			'url': '/chat.php',
			'peerc': { 'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}] },
			'dclabel': 'Chat',
			'system': {
				'timeout': {
					'notify': 5 * 1000,
					'abort': 60 * 1000
				},
				'en': {
					'wait': 'Please wait for connection',
					'abort': 'Connection could not be established<br>Please <a href="#" data-chat="restart">try</a> again later',
					'unsend': 'Your messages are stored as long as this page is open. Messages are sent only when connected',
					'join': ' connected',
					'left': ' disconnected<br><a href="#" data-chat="restart">Restart</a>'
				},
				'de': {
					'wait': 'Bitte auf Verbindung warten',
					'abort': 'Verbindung könnte nicht hergestellt werden<br>Bitte <a href="#" data-chat="restart">versuchen</a> Sie es später noch einmal',
					'unsend': 'Ihre Nachrichten werden gespeichert, solange diese Seite geöffnet ist. Nachrichten werden nur gesendet, wenn verbunden',
					'join': ' verbunden',
					'left': ' getrennt<br><a href="#" data-chat="restart">Neu&nbsp;starten</a>'
				},
				'ru': {
					'wait': 'Пожалуйста, дождитесь подключения',
					'abort': 'Не удалось установить подключение<br>Пожалуйста, <a href="#" data-chat="restart">попробуйте</a> позже',
					'unsend': 'Ваши сообщения сохраняются, пока открыта эта страница. Сообщения отправляются, только при подключении',
					'join': ' подключился',
					'left': ' отключился<br><a href="#" data-chat="restart">Перезапуск</a>'
				}
			},
			'input': {
				'name': {
					'en': 'Name',
					'de': 'Name',
					'ru': 'Имя'
				},
				'message': {
					'en': 'Message',
					'de': 'Nachricht',
					'ru': 'Сообщение'
				}
			}
		};

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
	function findFirst(trg, src) {
		var i = 0, ii = trg.length;
		for(; i < ii; i++) if(src.indexOf(trg[i]) !== -1) return trg[i];
		return src[0];
	}
	function toggleHidden(children) {
		var h = 'hidden', i = 0, ii = children.length, it;
		for(; i < ii; i++) {
			it = children[i];
			if(it.hasAttribute(h)) it.removeAttribute(h);
			else it[h] = true;
		}
	}
	function scrollBottom(element) {
		element.scrollTop = element.scrollHeight - element.clientHeight;
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
		focus: function(element) {
			if(element.hidden) toggleHidden(element.parentElement);
			if(!params.ios) element.focus();
		},
		view: function(elements) {
			['name', 'message'].forEach(function(item) {
				elements[item].placeholder = this.options.input[item][this.lang];
			}, this);
			if(params.user) elements.name.value = params.user;
			if(elements.splash) elements.splash.hidden = true;
			if(elements.name.value) this.focus(elements.message);
			else this.focus(elements.name);
		},
		insert: function(template, data) {
			this.elements.log.insertAdjacentHTML('beforeend', nano(template, data));
			scrollBottom(this.elements.log);
		},
		push: function(message) {
			this.insert(this.options.templates.msgSys, {
				'message': message,
				'time': new Date().toLocaleTimeString()
			});
		},
		send: function(data) {
			if(this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(data));
			else {
				this.unsend.push(JSON.stringify(data));
				if(this.unsend.length === 1) this.push(this.options.system[this.lang].unsend);
			}
			this.insert(this.options.templates.msgOut, data);
		},
		onmessage: function(e) {
			var data = JSON.parse(e.data);
			this.elements.title.textContent = document.title = data.name;
			if(data.message) this.insert(this.options.templates.msgIn, data);
			else if(data.push) this.push(data.name + this.options.system[this.lang][data.push]);
		},
		onopen: function() {
			this.dc.send(JSON.stringify({
				'name': this.elements.name.value || params.user || params.id,
				'push': 'join'
			}));
			while(this.unsend.length) this.dc.send(this.unsend.shift());
		},
		onclose: function() {
			this.push(document.title + this.options.system[this.lang].left);
			this.stop();
		},
		dcstart: function() {
			['open', 'close', 'message'].forEach(function(item) {
				this.dc.addEventListener(item, this);
			}, this);
		},
		dcstop: function() {
			if(this.dc.readyState !== 'connecting') {
				['open', 'close', 'message'].forEach(function(item) {
					this.dc.removeEventListener(item, this);
				}, this);
			}
			if(this.dc.readyState !== 'closed') this.dc.close();
			delete this.dc;
		},
		postform: function(url, data, callback) {
			if(!url || !data) return;
			var init = {
					'method': 'POST',
					'body': new FormData()
				}, name;
			for(name in data) init.body.append(name,
				Object.prototype.toString.call(data[name]) === '[object Object]' ?
					JSON.stringify(data[name]) : data[name]);
			fetch(url, init).then(function(response) {
				return response.text();
			}).then(function(body) {
				if(callback) callback(body);
			});
		},
		postjson: function(url, data, headers, callback) {
			if(!url || !data) return;
			var init = {
					'method': 'POST',
					'headers': { 'Content-Type': 'application/json;charset=utf-8' },
					'body': JSON.stringify(data)
				};
			if(headers) extend(init.headers, headers);
			fetch(url, init).then(function(response) {
				return response.json();
			}).then(function(body) {
				if(callback) callback(body);
			});
		},
		pcerror: function(err) {
			console.error(err);
			this.stop();
		},
		addice: function(ice) {
			ice.forEach(function(item) {
				this.pc.addIceCandidate(new RTCIceCandidate(item));
			}, this);
		},
		setdesc: function(description) {
			this.msg.event = description.type;
			this.msg.data.desc = description;
			return this.pc.setLocalDescription(description);
		},
		accept: function(data) {
			var self = this;
			this.view(this.elements);
			if(this.elements.location) toggleHidden(this.elements.location.children);
			this.pc.setRemoteDescription(data.desc).then(function() {
				self.addice(data.ice);
				self.dcstart();
			}).catch(this.pcerror.bind(this));
		},
		answer: function(data) {
			var self = this;
			this.pc.setRemoteDescription(data.desc).then(function() {
				self.addice(data.ice);
				return self.pc.createAnswer();
			}).then(this.setdesc.bind(this)).catch(this.pcerror.bind(this));
		},
		offer: function() {
			if(this.elements.location) toggleHidden(this.elements.location.children);
			if(this.elements.splash && this.elements.splash.hidden) this.elements.splash.removeAttribute('hidden');
			this.dc = this.pc.createDataChannel(this.options.dclabel);
			this.pc.createOffer().then(this.setdesc.bind(this)).catch(this.pcerror.bind(this));
		},
		notify: function() {},
		wait: function(timeout) {
			setTimeout(function(self) {
				if(!self.dc) self.notify(self.elements.name.value || params.user || params.id);
			}, timeout.notify, this);
			setTimeout(function(self) {
				if(!self.dc) self.abort();
			}, timeout.abort, this);
		},
		ssestart: function(events) {
			this.sse = new EventSource(this.options.url);
			events.forEach(function(item) {
				this.sse.addEventListener(item, this);
			}, this);
		},
		ssestop: function(events, closed) {
			events.forEach(function(item) {
				this.sse.removeEventListener(item, this);
			}, this);
			this.sse.close();
			delete this.sse;
			if(closed) this.postform(this.options.url, { 'event': 'closed' });
		},
		ondatachannel: function(e) {
			this.dc = e.channel;
			this.dcstart();
		},
		onicecandidate: function(e) {	
			if(e.candidate) this.msg.data.ice.push(e.candidate);
			else this.postform(this.options.url, this.msg);
		},
		onanswer: function(e) {
			this.ssestop(['answer'], true);
			this.accept(JSON.parse(e.data));
		},
		onoffer: function(e) {
			this.ssestop(['offer'], false);
			this.answer(JSON.parse(e.data));
		},
		onclosed: function() {
			this.sse.removeEventListener('closed', this);
			this.push(this.options.system[this.lang].wait);
			this.wait(this.options.system.timeout);
		},
		start: function() {
			this.pc = new RTCPeerConnection(this.options.peerc);
			this.msg = { 'data': { 'ice': [] } };
			['icecandidate', 'datachannel'].forEach(function(item) {
				this.pc.addEventListener(item, this);
			}, this);
			if(params.password) {
				this.msg.password = params.password
				this.ssestart(['answer']);
				this.offer();
			}
			else {
				this.view(this.elements);
				if(params.user || this.elements.name.value) this.ssestart(['closed', 'offer']);
			}
		},
		stop: function() {
			this.elements.title.textContent = document.title = this.options.dclabel;
			if(this.sse) this.ssestop(['closed', 'offer', 'answer'], true);
			if(this.dc) this.dcstop();
			if(this.pc) {
				['icecandidate', 'datachannel'].forEach(function(item) {
					this.pc.removeEventListener(item, this);
				}, this);
				this.pc.close();
				['msg', 'pc'].forEach(function(item) {
					delete this[item];
				}, this);
			}
		},
		restart: function() {
			if(this.pc) this.stop();
			this.start();
		},
		abort: function() {
			this.push(this.options.system[this.lang].abort);
			this.stop();
		},
		cancel: function() {
			if(this.elements.location) toggleHidden(this.elements.location.children);
			this.stop();
		},
		change: function() {
			if(!params.ios) this.elements.message.focus();
			if(this.elements.name.value) {
				if(!this.pc) this.start();
				else if(!this.dc && !this.sse) this.ssestart(['closed', 'offer']);
			}
		},
		onbeforeunload: function() {
			this.stop();
		},
		onclick: function(e) {
			if(this.element && this.element === e.currentTarget) {
				var trg = getTarget(e.target, e.currentTarget, '[' + dataAttribute + ']'),
					attr = trg ? trg.getAttribute(dataAttribute) : null;
				if(attr && this[attr]) {
					cancelEvent(e);
					this[attr](e);
				}
			}
		},
		onsubmit: function(e) {
			e.preventDefault();
			if(this.elements.message.value) {
				this.send({
					'name': this.elements.name.value || params.user || params.id,
					'message': this.elements.message.value,
					'time': new Date().toLocaleTimeString()
				});
				this.elements.message.value = '';
				if(!params.ios) this.elements.message.focus();
			}
			else {
				toggleHidden(e.target);
				if(this.elements.message.hidden) this.elements.name.select();
				else this.change();
			}
		},
		handleEvent: function(e) {
			if(this['on' + e.type]) this['on' + e.type](e);
		},
		show: function(options) {
			var element = (options.element && typeof options.element === 'string' ?
					document.querySelector(options.element) :
					options.element) || document.createElement('div'),
				remove = !options.element || !document.body.contains(element),
				empty = !element.hasChildNodes(),
				elements = {};
			if(remove) document.body.appendChild(element);
			if(empty) element.insertAdjacentHTML('beforeend', options.templates.chatLayout);
			var nl = element.querySelectorAll('[' + dataAttribute + ']'), i = 0, ii = nl.length;
			for(; i < ii; i++) elements[nl[i].getAttribute(dataAttribute)] = nl[i];
			['title', 'name', 'message', 'log'].forEach(function(item) {
				if(!elements[item]) throw new Error(item + ' element is required');
			});
			if(elements.location && options.templates.chatLocation) elements.location
				.insertAdjacentHTML('beforeend', nano(options.templates.chatLocation, {'href': params.share}));
			['click', 'submit'].forEach(function(item) {
				element.addEventListener(item, this);
			}, this);
			this.element = element;
			this.elementRemove = remove;
			this.elementEmpty = empty;
			this.elements = elements;
		},
		hide: function() {
			['click', 'submit'].forEach(function(item) {
				this.element.removeEventListener(item, this);
			}, this);
			if(this.elementRemove) this.element.remove();
			else if(this.elementEmpty) this.element.textContent = '';
			else for(var name in this.elements) this.elements[name].textContent = '';
			['elements', 'elementEmpty', 'elementRemove', 'element'].forEach(function(item) {
				delete this[item];
			}, this);
		},
		init: function(options) {
			window.addEventListener('beforeunload', this);
			setTemplates(options.templates);
			this.lang = findFirst(navigator.languages, options.languages);
			this.unsend = [];
			this.show(options);
		},
		destroy: function() {
			this.stop();
			this.hide();
			window.removeEventListener('beforeunload', this);
			['lang', 'unsend', 'options'].forEach(function(item) {
				delete this[item];
			}, this);
		}
	};
	
	return Plugin;
}));