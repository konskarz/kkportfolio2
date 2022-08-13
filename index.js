(function(window, document) {
	'use strict';

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
	function load(urls, callback) {
		var loaded = 0, required = urls.length,
			head = document.querySelector('head'), el;
		function onload() {
			loaded++;
			if(loaded === required && typeof callback === 'function') callback();
		}
		urls.forEach(function(url) {
			if('js' in url) {
				el = document.createElement('script');
				el.src = url.js;
				el.async = true;
			}
			else if('css' in url) {
				el = document.createElement('link');
				el.rel = 'stylesheet';
				el.href = url.css;
			}
			else return;
			el.addEventListener('load', onload);
			head.appendChild(el);
		});
	}

	var apps = {
			dialog: document.getElementById('dialog'),
			activeClass: 'dialog-open',
			styleProperty: 'padding-right',
			activeViewer: null,
			openDialog: function() {
				var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
				this.navbars = scrollbarWidth ? document.querySelectorAll('.navbar') : null;
				document.body.classList.add(this.activeClass);
				if(this.navbars) {
					var i = 0, ii = this.navbars.length, navbar, current;
					for(; i < ii; i++) {
						navbar = this.navbars[i];
						current = parseFloat(window.getComputedStyle(navbar)[this.styleProperty]);
						navbar.style.setProperty(this.styleProperty, current + scrollbarWidth + 'px');
					}
				}
			},
			closeDialog: function() {
				if(this.navbars) for(var i = 0, ii = this.navbars.length; i < ii; i++) this.navbars[i].style.removeProperty(this.styleProperty);
				document.body.classList.remove(this.activeClass);
			},
			openViewer: function(params) {
				this[params.viewer].open(params);
				this.openDialog();
				this.activeViewer = params.viewer;
			},
			closeViewer: function() {
				if(history.state) history.pushState(null, '');
				this.closeDialog();
				this.activeViewer = null;
			},
			initAudioPlayer: function() {
				if(window.AudioPlayer.canPlay('mp3')) {
					this.audioPlayer = new window.AudioPlayer({
						'element': '#dialog .audio-player',
						'playlistElement': '#music .section-content',
						'playlistSelector': '[data-toggle="mp3_player"]',
						'mediaMetadata': {
							'artwork': [{
								'src': 'http://konskar.free.fr/20110405_100808_KarzanovK_512x512.jpg'
							}]
						}
					});
				}
			},
			initPDFViewer: function() {
				this.pdfViewer = new window.PDFViewer();
				this.pdfViewer.onclose = this.closeViewer.bind(this);
			},
			initFileBrowser: function() {
				this.fileBrowser = new window.FileBrowser({
					'dirUrl': '/script.php?action=dir&path=',
					'zipUrl': '/script.php?action=zip&path='
				});
				this.fileBrowser.onclose = this.closeViewer.bind(this);
			},
			onpopstate: function(e) {
				if(!e.state && this.activeViewer) {
					cancelEvent(e);
					this[this.activeViewer].close();
				}
				else if(e.state && 'viewer' in e.state && e.state.viewer !== this.activeViewer) {
					cancelEvent(e);
					this.openViewer(e.state);
				}
			},
			onclick: function(e) {
				var da = 'data-toggle',
					trg = getTarget(e.target, e.currentTarget, '[' + da + ']'),
					attr = trg ? trg.getAttribute(da) : null;
				if(attr && /pdf_viewer|file_browser/.test(attr)) {
					var params = {'element': '#dialog .files-viewer'};
					if(attr === 'pdf_viewer') {
						params.viewer = 'pdfViewer';
						params.href = trg.getAttribute('href').replace(/.*\/\/[^/]*/, '');
					}
					else if(attr === 'file_browser') {
						params.viewer = 'fileBrowser';
						params.path = /path=([^&]+)/.exec(trg.getAttribute('href'))[1];
					}
					cancelEvent(e);
					this.openViewer(params);
				}
			},
			handleEvent: function(e) {
				if(this['on' + e.type]) this['on' + e.type](e);
			},
			init: function() {
				window.addEventListener('popstate', this);
				document.addEventListener('click', this);
			}
		};

	(function scrollSpy(selector, activeClass) {
		var links = document.querySelector(selector).querySelectorAll('a[href^="#"]'),
			i = 0, ii = links.length, section, sections = [], targets = {}, active;
		function activate(target) {
			target.classList.add(activeClass);
			active = target;
		}
		for(; i < ii; i++) {
			section = document.querySelector(links[i].getAttribute('href'));
			sections.push(section);
			targets[section.id] = links[i];
		}
		activate(links[0]);
		window.addEventListener('scroll', function() {
			var scrolled = window.pageYOffset + 1;
			sections.forEach(function(item) {
				if(item.offsetTop <= scrolled && targets[item.id] !== active) {
					active.classList.remove(activeClass);
					activate(targets[item.id]);
				}
			});
		});
	})('.navbar.fixed-top', 'active');
	(function orientationChangeFix(selector, top) {
		var element = null, offset = 0;
		window.addEventListener('orientationchange', function() {
			var elements = document.querySelectorAll(selector),
				scrolled = window.pageYOffset + top,
				i = 0, ii = elements.length, offsetTop;
			for(; i < ii; i++) {
				offsetTop = elements[i].offsetTop;
				if(offsetTop >= scrolled) {
					element = elements[i];
					offset = offsetTop - window.pageYOffset;
					break;
				}
			}
		});
		window.addEventListener('resize', function() {
			if(element) {
				window.scrollTo(0, element.offsetTop - offset);
				element = null;
			}
		});
	})('h1, h2, a, p', 56);
	
	load([{'js':'https://www.googletagmanager.com/gtag/js?id=G-XXMS0PGHEG'}], function() {
		window.dataLayer = window.dataLayer || [];
		function gtag(){window.dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', 'G-XXMS0PGHEG');
	});
	load([{'js':'https://cdn.jsdelivr.net/npm/list.js@2.3.1/dist/list.min.js'}], function() {
		['music', 'scores', 'projects'].forEach(function(item) {
			new window.List(item, {
				'listClass': 'section-content',
				'valueNames': ['media-title', 'media-subtitle', 'media-description', 'media-date']
			});
		});
		load([{'js':'/projects/kkportfolio2/bookmarks.js'}], function() {
			new window.Bookmarks({'element': '#bookmarks'});
		});
	});
	load([{'js':'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/es5/build/pdf.min.js'},
		{'js':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/prism.min.js'},
		{'js':'/projects/kkportfolio2/audio_player.js'}], function() {
		apps.initAudioPlayer();
		load([{'js':'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/es5/web/pdf_viewer.js'},
			{'css':'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/es5/web/pdf_viewer.css'},
			{'js':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/components/prism-markup-templating.min.js'},
			{'js':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/components/prism-java.min.js'},
			{'js':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/components/prism-nsis.min.js'},
			{'js':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/components/prism-php.min.js'},
			{'css':'https://cdn.jsdelivr.net/npm/prismjs@1.28.0/themes/prism.css'}], function() {
			load([{'js':'/projects/kkportfolio2/pdf_viewer.js'}], function() {
				apps.initPDFViewer();
				load([{'js':'/projects/kkportfolio2/file_browser.js'}], function() {
					apps.initFileBrowser();
					apps.init();
				});
			});
		});
	});

})(window, document);
