(function(root, factory) {
	if(typeof define === 'function' && define.amd) define([], factory());
	else if(typeof exports === 'object' && module.exports) module.exports = factory();
	else root.AudioPlayer = factory();
}(this, function() {
	'use strict';

	var audio = document.createElement('audio'),
		audioTypes = (function() {
			var types = {
				'audio/mp4':	['m4a'],
				'audio/mpeg':	['mp3'],
				'audio/ogg':	['ogg','oga'],
				'audio/wav':	['wav']
			}, at = [], name;
			if(audio.canPlayType) for(name in types) if(audio.canPlayType(name) !== '') Array.prototype.push.apply(at, types[name]);
			return at;
		})(),
		dataAttribute = 'data-ap-main',
		defaults = {
			'audioPlayerLayout': '<div class="navbar navbar-expand navbar-light bg-light"><div class="navbar-nav"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Previous Track" data-ap-main="previoustrack"><i class="bi bi-skip-backward" aria-hidden="true"></i></button><button type="button" class="btn btn-link border-0 nav-link" aria-label="Next Track" data-ap-main="nexttrack"><i class="bi bi-skip-forward" aria-hidden="true"></i></button><button type="button" class="btn btn-link border-0 nav-link" aria-label="Play or Pause" data-ap-main="playpause"><i class="bi bi-play" aria-hidden="true"></i><i class="bi bi-pause" aria-hidden="true" hidden></i></button></div><div class="flex-grow-1 navbar-nav align-items-center overflow-hidden"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Audio Title" data-ap-main="toggleme"><i class="bi bi-tag" aria-hidden="true"></i></button><input type="range" value="0" class="custom-range mx-2" min="0" max="100" step="0.01" data-ap-main="seek"><div class="navbar-text user-select-none px-2" data-ap-main="time">00:00</div><button type="button" class="btn btn-link border-0 nav-link" aria-label="Audio Seek" data-ap-main="toggleme" hidden><i class="bi bi-sliders" aria-hidden="true"></i></button><div class="navbar-text user-select-none text-nowrap overflow-auto mx-2" data-ap-main="title" hidden></div></div></div>',
			'activeClass': 'active',
			'skipTime': 10
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
	function notCombination(event) {
		return !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
	}
	function formatTime(seconds) {
		return [Math.floor(seconds / 60) % 60, seconds % 60].map(function(v) {
			return (v < 10 ? '0' : '') + v;
		}).join(':');
	}
	function getText(element) {
		return element.textContent.trim().replace(/[\r\n\t]+/gm, ' ');
	}
	function toggleHidden(children) {
		var h = 'hidden', i = 0, ii = children.length, it;
		for(; i < ii; i++) {
			it = children[i];
			if(it.hasAttribute(h)) it.removeAttribute(h);
			else it[h] = true;
		}
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
		toggleme: function(target) {
			toggleHidden(target.parentElement.children);
		},
		sametrack: function() {
			audio[audio.paused ? 'play' : 'pause']();
		},
		changetrack: function(target) {
			if(this.current && 'classList' in this.current) this.current.classList.remove(this.options.activeClass);
			this.current = target;
			if(!audio.paused && this.elements && this.elements.playpause) toggleHidden(this.elements.playpause.children);
			audio.src = this.current.href;
			audio.play();
			var title = 'title' in this.current && this.current.title ? this.current.title : getText(this.current);
			if(this.mediaMetadata) this.mediaMetadata.title = title;
			if(this.elements && this.elements.title) this.elements.title.textContent = title;
			if('classList' in this.current) this.current.classList.add(this.options.activeClass);
		},
		findtrack: function(callback) {
			if(this.playlistElement && this.playlistSelector) {
				var list = this.playlistElement.querySelectorAll(this.playlistSelector),
					index = this.current ? Array.prototype.indexOf.call(list, this.current) : -1;
				this.changetrack(list[callback(index, list.length)]);
			}
			else this.close();
		},
		previoustrack: function() {
			this.findtrack(function(index, length) {
				return index > 0 ? index - 1 : length - 1;
			});
		},
		nexttrack: function() {
			this.findtrack(function(index, length) {
				return index + 1 < length ? index + 1 : 0;
			});
		},
		playpause: function() {
			if(this.current) this.sametrack();
			else this.nexttrack();
		},
		muteunmute: function() {
			audio.muted = audio.muted ? false : true;
			toggleHidden(this.elements.muteunmute.children);
		},
		seekbackward: function() {
			if(audio.duration) audio.currentTime = Math.max(audio.currentTime - this.options.skipTime, 0);
		},
		seekforward: function() {
			if(audio.duration) audio.currentTime = Math.min(audio.currentTime + this.options.skipTime, audio.duration);
		},
		seekto: function(d) {
			if(audio.duration) {
				if(d.fastSeek && ('fastSeek' in audio)) audio.fastSeek(d.seekTime);
				else audio.currentTime = d.seekTime;
			}
		},
		seek: function(e) {
			if(audio.duration) audio.currentTime = e.target.value / 100 * audio.duration;
		},
		volume: function(e) {
			audio.volume = e.target.value / 100;
		},
		open: function(target) {
			if(target && 'href' in target) {
				if(this.onopen && typeof this.onopen === 'function') this.onopen();
				if(target === this.current) this.sametrack();
				else this.changetrack(target);
			}
		},
		close: function() {
			if(this.onclose && typeof this.onclose === 'function') this.onclose();
			if(!audio.paused) audio.pause();
			audio.removeAttribute('src');
			if(!this.current) return;
			if('classList' in this.current) this.current.classList.remove(this.options.activeClass);
			delete this.current;
		},
		onclick: function(e) {
			if(this.element && this.element === e.currentTarget) {
				var trg = getTarget(e.target, e.currentTarget, '[' + dataAttribute + ']'),
					attr = trg ? trg.getAttribute(dataAttribute) : null;
				if(attr && this[attr]) {
					cancelEvent(e);
					this[attr](trg);
				}
			}
			else if(this.playlistSelector && this.playlistElement && this.playlistElement === e.currentTarget) {
				var target = getTarget(e.target, e.currentTarget, this.playlistSelector);
				if(target) {
					cancelEvent(e);
					this.open(target);
				}
			}
		},
		onkeydown: function(e) {
			if(e.keyCode === 32 && notCombination(e)) {
				cancelEvent(e);
				this.playpause();
			}
			else if(e.keyCode === 37 && notCombination(e)) {
				cancelEvent(e);
				this.previoustrack();
			}
			else if(e.keyCode === 39 && notCombination(e)) {
				cancelEvent(e);
				this.nexttrack();
			}
		},
		oninput: function(e) {
			var attr = e.target.getAttribute(dataAttribute);
			if(attr && this[attr]) this[attr](e);
		},
		onplay: function() {
			toggleHidden(this.elements.playpause.children);
		},
		onpause: function() {
			toggleHidden(this.elements.playpause.children);
		},
		ontimeupdate: function() {
			if(audio.currentTime > 0) {
				this.elements.time.innerHTML = formatTime((audio.duration - audio.currentTime).toFixed(0));
				this.elements.seek.value = audio.currentTime / audio.duration * 100;
			}
		},
		onended: function() {
			this.nexttrack();
		},
		handleEvent: function(e) {
			if(this['on' + e.type]) this['on' + e.type](e);
		},
		initSession: function(metadata) {
			var ms = navigator.mediaSession,
				md = new window.MediaMetadata(metadata);
			this.mediaMetadata = ms.metadata = md;
			['previoustrack', 'nexttrack'].forEach(function(item) {
				if(this[item]) ms.setActionHandler(item, this[item].bind(this));
			}, this);
		},
		destroySession: function() {
			var ms = navigator.mediaSession;
			['previoustrack', 'nexttrack'].forEach(function(item) {
				if(this[item]) ms.setActionHandler(item, null);
			}, this);
			ms.metadata = null;
			delete this.mediaMetadata;
		},
		initPlaylist: function(element, selector) {
			var el = element || document.body,
				sel = selector || 'a',
				trg = el.querySelector(sel);
			if(trg) {
				this.playlistSelector = sel;
				this.playlistElement = element || trg.parentElement;
				this.playlistElement.addEventListener('click', this);
			}
		},
		destroyPlaylist: function() {
			this.playlistElement.removeEventListener('click', this);
			delete this.playlistElement;
			delete this.playlistSelector;
		},
		initElement: function(element, layout) {
			var remove = !document.body.contains(element),
				empty = !element.hasChildNodes(),
				elements = {};
			if(remove) document.body.appendChild(element);
			if(empty) element.insertAdjacentHTML('beforeend', layout);
			var nl = element.querySelectorAll('[' + dataAttribute + ']'), i = 0, ii = nl.length;
			for(; i < ii; i++) elements[nl[i].getAttribute(dataAttribute)] = nl[i];
			document.addEventListener('keydown', this);
			['click', 'input'].forEach(function(item) {
				element.addEventListener(item, this);
			}, this);
			['play', 'pause', 'timeupdate'].forEach(function(item) {
				audio.addEventListener(item, this);
			}, this);
			this.element = element,
			this.elementRemove = remove,
			this.elementEmpty = empty,
			this.elements = elements;
		},
		destroyElement: function() {
			['play', 'pause', 'timeupdate'].forEach(function(item) {
				audio.removeEventListener(item, this);
			}, this);
			['click', 'input'].forEach(function(item) {
				this.element.removeEventListener(item, this);
			}, this);
			document.removeEventListener('keydown', this);
			if(this.elementRemove) this.element.remove();
			else if(this.elementEmpty) this.element.textContent = '';
			['elements', 'elementEmpty', 'elementRemove', 'element'].forEach(function(item) {
				delete this[item];
			}, this);
		},
		init: function(options) {
			var layout = document.getElementById('audioPlayerLayout'),
				element = options.element && typeof options.element === 'string' ? document.querySelector(options.element) : options.element,
				playlistElement = options.playlistElement && typeof options.playlistElement === 'string' ? document.querySelector(options.playlistElement) : options.playlistElement;
			if(layout) options.audioPlayerLayout = layout.innerHTML.trim();
			audio.addEventListener('ended', this);
			if(options.mediaMetadata && 'mediaSession' in navigator) this.initSession(options.mediaMetadata);
			if(playlistElement || options.playlistSelector) this.initPlaylist(playlistElement, options.playlistSelector);
			if(element) this.initElement(element, options.audioPlayerLayout);
		},
		destroy: function() {
			if(this.current) this.close();
			if(this.element) this.destroyElement();
			if(this.playlistElement) this.destroyPlaylist();
			if(this.mediaMetadata) this.destroySession();
			audio.removeEventListener('ended', this);
			delete this.options;
			['onopen', 'onclose'].forEach(function(item) {
				if(this[item]) delete this[item];
			}, this);
		}
	};
	Plugin.canPlay = function(type) {
		return audioTypes.indexOf(type) !== -1;
	};
	
	return Plugin;
}));