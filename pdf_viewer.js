(function(root, factory) {
	if(typeof define === 'function' && define.amd) define(['pdfjsLib', 'pdfjsViewer'], factory);
	else if(typeof exports === 'object' && module.exports) module.exports = factory(require('pdfjsLib'), require('pdfjsViewer'));
	else root.PDFViewer = factory(root.pdfjsLib, root.pdfjsViewer);
}(this, function(pdfjsLib, pdfjsViewer) {
	'use strict';
	
	// ToDo: better way to initialize pdf.worker.js and /cmaps/
	var pdfjsFilePath = document.querySelector('script[src*="/pdf."]').src,
		canPdf = (function() {
			function getAXO(name) {
				try { return new window.ActiveXObject(name); } catch(e) { return null; }
			}
			if(navigator.mimeTypes['application/pdf'] !== undefined) return true;
			if((navigator.platform !== undefined && navigator.platform === 'MacIntel'
				&& navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 1)
				|| /Mobi|Tablet|Android|iPad|iPhone/.test(navigator.userAgent)) return false;
			if(/irefox/.test(navigator.userAgent)) {
				var uas = navigator.userAgent.split('rv:');
				return uas.length > 1 && parseInt(uas[1].split('.')[0], 10) > 18;
			}
			return 'ActiveXObject' in window && !!(getAXO('AcroPDF.PDF') || getAXO('PDF.PdfCtrl'));
		})(),
		disableCreateObjectURL = /MSIE|Trident|CriOS/.test(navigator.userAgent), // IE, Chrome for iOS
		dataAttribute = 'data-pv-main',
		defaults = {
			'pdfViewerLayout': '<div class="navbar navbar-expand navbar-light bg-light"><div class="navbar-nav"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Close" data-pv-main="close"><i class="bi bi-x" aria-hidden="true"></i></button></div><span class="navbar-text user-select-none px-2 text-truncate mr-auto" data-pv-main="title"></span><div class="navbar-nav d-none d-md-flex"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Previous page" disabled data-pv-main="previous"><i class="bi bi-arrow-up" aria-hidden="true"></i></button><span class="navbar-text user-select-none px-2" data-pv-main="page">1</span><span class="navbar-text user-select-none">/</span><span class="navbar-text user-select-none px-2" data-pv-main="pages"></span><button type="button" class="btn btn-link border-0 nav-link" aria-label="Next page" data-pv-main="next"><i class="bi bi-arrow-down" aria-hidden="true"></i></button></div><div class="navbar-nav d-none d-sm-flex"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Zoom Out" data-pv-main="zoomOut"><i class="bi bi-dash" aria-hidden="true"></i></button><span class="navbar-text user-select-none px-2" data-pv-main="scale"></span><button type="button" class="btn btn-link border-0 nav-link" aria-label="Zoom In" data-pv-main="zoomIn"><i class="bi bi-plus" aria-hidden="true"></i></button><button type="button" class="btn btn-link border-0 nav-link" aria-label="Fit to width" data-pv-main="fitWidth"><i class="bi bi-arrow-left-right" aria-hidden="true"></i></button><button type="button" class="btn btn-link border-0 nav-link" aria-label="Fit to height" data-pv-main="fitHeight"><i class="bi bi-arrow-down-up" aria-hidden="true"></i></button></div><div class="navbar-nav"><button type="button" class="btn btn-link border-0 nav-link" aria-label="Print" data-pv-main="print" hidden><i class="bi bi-printer" aria-hidden="true"></i></button><button type="button" class="btn btn-link border-0 nav-link" aria-label="Download" data-pv-main="download"><i class="bi bi-download" aria-hidden="true"></i></button></div><div class="viewer-progress position-absolute bg-dark" style="height:1px;bottom:0;left:0;" data-pv-main="progress"></div></div><div class="viewer-main flex-grow-1 position-relative"><div class="position-absolute w-100 h-100 overflow-auto" data-pv-main="main"><div class="pdfViewer"></div></div></div>',
			'printFrameStyle': {
				'position': 'fixed',
				'right': 0,
				'bottom': 0,
				'width': 0,
				'height': 0,
				'border': 0
			},
			'linkService': {
				'externalLinkTarget': 2, // NONE: 0, SELF: 1, BLANK: 2, PARENT: 3, TOP: 4 - https://github.com/mozilla/pdf.js/blob/v2.6.347/src/display/display_utils.js#L391
				'ignoreDestinationZoom': true
			},
			'pdfjsViewer': {
				'removePageBorders': true,
				'textLayerMode': 0 // DISABLE: 0, ENABLE: 1, ENABLE_ENHANCE: 2 - https://github.com/mozilla/pdf.js/blob/v2.6.347/web/ui_utils.js#L38
			},
			'pdfjsLib': {
				'cMapPacked': true,
				'disableRange': true // http://perso99-g5.free.fr/overload.html
			},
			'scale': {
				'defaultScaleValue': 'auto', // page-actual, page-width, page-height, page-fit, auto - https://github.com/mozilla/pdf.js/blob/v2.6.347/web/base_viewer.js#L731
				'defaultScaleDelta': 1.1,
				'minScale': 0.25,
				'maxScale': 5.0
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
	function ctrlCombination(event) {
		return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
	}
	function getWorkerSrc() {
		return pdfjsFilePath.replace(/(\.(?:min\.)?js)(\?.*)?$/i, '.worker$1$2');
	}
	function getCmapUrl() {
		return pdfjsFilePath.split('/').slice(0, pdfjsFilePath.indexOf('es5/') !== -1 ? -3 : -2).join('/') + '/cmaps/';
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
		setPage: function(value, pushState) {
			this.pdfViewer.currentPageNumber = value;
			if('viewer' in this.params && pushState) history.pushState(extend({}, this.params, {'page': value}), '')
		},
		previous: function() {
			this.setPage(this.pdfViewer.currentPageNumber - 1, true);
		},
		next: function() {
			this.setPage(this.pdfViewer.currentPageNumber + 1, true);
		},
		zoomOut: function(ticks) {
			var newScale = this.pdfViewer.currentScale,
				options = this.options.scale;
			do {
				newScale = (newScale / options.defaultScaleDelta).toFixed(2);
				newScale = Math.floor(newScale * 10) / 10;
				newScale = Math.max(options.minScale, newScale);
			} while (--ticks && newScale > options.minScale);
			this.pdfViewer.currentScaleValue = newScale;
		},
		zoomIn: function(ticks) {
			var newScale = this.pdfViewer.currentScale,
				options = this.options.scale;
			do {
				newScale = (newScale * options.defaultScaleDelta).toFixed(2);
				newScale = Math.ceil(newScale * 10) / 10;
				newScale = Math.min(options.maxScale, newScale);
			} while (--ticks && newScale < options.maxScale);
			this.pdfViewer.currentScaleValue = newScale;
		},
		zoomAuto: function() {
			this.pdfViewer.currentScaleValue = 'auto';
		},
		fitWidth: function() {
			this.pdfViewer.currentScaleValue = 'page-width';
		},
		fitHeight: function() {
			this.pdfViewer.currentScaleValue = 'page-height';
		},
		print: function() {
			this.printFrame.src = disableCreateObjectURL ? this.pdfFile.url : URL.createObjectURL(this.pdfFile.blob);
			if(!this.element.contains(this.printFrame)) this.element.appendChild(this.printFrame);
		},
		download: function() {
			if(canPdf && navigator.msSaveBlob) return navigator.msSaveBlob(this.pdfFile.blob, this.pdfFile.filename);
			var a = document.createElement('a');
			a.href = disableCreateObjectURL || !canPdf ? this.pdfFile.url : URL.createObjectURL(this.pdfFile.blob);
			if('download' in a && canPdf) a.download = this.pdfFile.filename;
			this.element.appendChild(a);
			a.click();
			a.remove();
		},
		onframeload: function() {
			this.contentWindow.focus();
			this.contentWindow.print();
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
		onkeydown: function(e) {
			if(canPdf && e.keyCode === 80 && ctrlCombination(e)) {
				cancelEvent(e);
				this.print();
			}
			else if(e.keyCode === 83 && ctrlCombination(e)) {
				cancelEvent(e);
				this.download();
			}
			else if((e.keyCode === 109 || e.keyCode === 189) && ctrlCombination(e)) {
				cancelEvent(e);
				this.zoomOut();
			}
			else if((e.keyCode === 107 || e.keyCode === 187) && ctrlCombination(e)) {
				cancelEvent(e);
				this.zoomIn();
			}
			else if((e.keyCode === 48 || e.keyCode === 96) && ctrlCombination(e)) {
				cancelEvent(e);
				this.zoomAuto();
			}
			else if(this.pdfViewer.currentPageNumber > 1 && e.keyCode === 37 && ctrlCombination(e)) {
				cancelEvent(e);
				this.previous();
			}
			else if(this.pdfViewer.currentPageNumber < this.pdfViewer.pdfDocument.numPages && e.keyCode === 39 && ctrlCombination(e)) {
				cancelEvent(e);
				this.next();
			}
		},
		onresize: function() {
			var currentScaleValue = this.pdfViewer.currentScaleValue;
			if(/auto|page-fit|page-width/.test(currentScaleValue)) this.pdfViewer.currentScaleValue = currentScaleValue;
			this.pdfViewer.update();
		},
		onpopstate: function(e) {
			if('viewer' in this.params && e.state
				&& 'viewer' in e.state && e.state.viewer === this.params.viewer
				&& 'href' in e.state && e.state.href === this.pdfFile.url
				&& 'page' in e.state) {
					cancelEvent(e);
					this.setPage(e.state.page);
				}
		},
		handleEvent: function(e) {
			this['on' + e.type](e);
		},
		onpagesinit: function(e) {
			e.source.currentScaleValue = e.source.pdfViewerPlugin.options.scale.defaultScaleValue;
		},
		onpagechanging: function(e) {
			var elements = e.source.pdfViewerPlugin.elements;
			if(elements.page) elements.page.textContent = e.pageNumber;
			if(elements.previous) elements.previous.disabled = e.pageNumber <= 1;
			if(elements.next) elements.next.disabled = e.pageNumber >= e.source.pdfDocument.numPages;
		},
		onscalechanging: function(e) {
			var scale = e.source.pdfViewerPlugin.elements.scale;
			if(scale) scale.textContent = Math.round(e.scale * 100) + '%';
		},
		getFilename: function(url) {
			var filename = pdfjsLib.getFilenameFromUrl(url) || url;
			try {filename = decodeURIComponent(filename);} catch(e) {
				// decodeURIComponent may throw URIError,
				// fall back to using the unprocessed url in that case
			}
			return filename;
		},
		setTitle: function(title) {
			if(this.elements.title) this.elements.title.textContent = title;
		},
		onprogress: function(data) {
			this.style.width = Math.round(data.loaded / data.total * 100) + '%';
		},
		setPages: function(numPages) {
			if(this.elements.pages) this.elements.pages.textContent = numPages;
		},
		close: function() {
			if(!this.loadingTask) return window.Promise.resolve();
			if(this.onclose && typeof this.onclose === 'function') this.onclose();
			var promise = this.loadingTask.destroy();
			// debugger;
			this.element.removeEventListener('click', this);
			this.elements.main.removeEventListener('click', stopPropagation, true);
			['resize', 'keydown', 'popstate'].forEach(function(item) {
				// getEventListeners(window)
				window.removeEventListener(item, this);
			}, this);
			if(canPdf) {
				this.printFrame.removeEventListener('load', this.onframeload);
				this.printFrame.src = '';
			}
			if(this.pdfViewer) {
				['pagesinit', 'pagechanging', 'scalechanging'].forEach(function(item) {
					this.pdfViewer.eventBus.off(item, this['on' + item]);
				}, this);
				this.pdfViewer.linkService.setDocument(null);
				this.pdfViewer.setDocument(null);
			}
			if(this.elementRemove) this.element.remove();
			else if(this.elementEmpty) this.element.textContent = '';
			else {
				if(canPdf && this.element.contains(this.printFrame)) this.printFrame.remove();
				if(canPdf && this.elements.print) this.elements.print.hidden = true;
				if(this.elements.page) this.elements.page.textContent = '1';
				if(this.elements.scale) this.elements.scale.textContent = '';
				this.setPages('');
				this.setTitle('');
			}
			['pdfViewer', 'pdfFile', 'loadingTask', 'elements', 'elementEmpty', 'elementRemove', 'element', 'params'].forEach(function(item) {
				delete this[item];
			}, this);
			return promise;
		},
		open: function(params) {
			if(this.loadingTask) {
				return this.close().then(function() {
					return this.open(params);
				}.bind(this));
			}
			if(!params.href) return;
			this.params = params;
			var element = (params.element && typeof params.element === 'string' ? document.querySelector(params.element) : params.element) || document.createElement('div'),
				remove = !params.element || !document.body.contains(element),
				empty = !element.hasChildNodes(),
				elements = {};
			if(remove) document.body.appendChild(element);
			if(empty) element.insertAdjacentHTML('beforeend', this.options.pdfViewerLayout);
			var nl = element.querySelectorAll('[' + dataAttribute + ']'), i = 0, ii = nl.length;
			for(; i < ii; i++) elements[nl[i].getAttribute(dataAttribute)] = nl[i];
			if(!elements.main) return;
			this.element = element;
			this.elementRemove = remove;
			this.elementEmpty = empty;
			this.elements = elements;
			if(elements.print && canPdf) elements.print.removeAttribute('hidden');
			var self = this, filename = params.title || this.getFilename(params.href);
			this.setTitle(filename);
			this.loadingTask = pdfjsLib.getDocument(extend(this.options.pdfjsLib, {url: params.href}));
			if(elements.progress) this.loadingTask.onProgress = this.onprogress.bind(elements.progress);
			return this.loadingTask.promise.then(function(pdfDocument) {
				if(elements.progress) elements.progress.style.width = 0;
				self.setPages(pdfDocument.numPages);
				pdfDocument.getMetadata().then(function(data) {
					if(data.info.Title) self.setTitle(data.info.Title);
				});
				var pdfViewer = new pdfjsViewer.PDFViewer(extend(self.options.pdfjsViewer, {container: elements.main}));
				pdfViewer.linkService.setViewer(pdfViewer);
				pdfViewer.pdfViewerPlugin = self;
				self.pdfViewer = pdfViewer;
				['pagesinit', 'pagechanging', 'scalechanging'].forEach(function(item) {
					pdfViewer.eventBus.on(item, self['on' + item], true);
				});
				pdfViewer.setDocument(pdfDocument);
				pdfViewer.linkService.setDocument(pdfDocument);
				pdfDocument.getData().then(function(data) {
					self.pdfFile = {
						url: params.href,
						filename: filename,
						blob: new Blob([data], {type: 'application/pdf'})
					};
					if(canPdf) self.printFrame.addEventListener('load', self.onframeload);
					['resize', 'keydown', 'popstate'].forEach(function(item) {
						window.addEventListener(item, self);
					});
					elements.main.addEventListener('click', stopPropagation, true);
					element.addEventListener('click', self);
					if('page' in params) self.setPage(params.page);
					else if('viewer' in params) history.pushState(extend({}, params, {'page': 1}), '');
				});
			});
		},
		init: function(options) {
			var layout = document.getElementById('pdfViewerLayout');
			if(layout) options.pdfViewerLayout = layout.innerHTML.trim();
			if(canPdf) {
				this.printFrame = document.createElement('iframe');
				extend(this.printFrame.style, options.printFrameStyle);
			}
			options.pdfjsViewer.eventBus = new pdfjsViewer.EventBus();
			options.pdfjsViewer.linkService = new pdfjsViewer.PDFLinkService(extend({eventBus: options.pdfjsViewer.eventBus}, options.linkService));
			options.pdfjsViewer.l10n = pdfjsViewer.NullL10n;
			if(!options.pdfjsLib.cMapUrl) options.pdfjsLib.cMapUrl = getCmapUrl();
			pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc || getWorkerSrc();
		},
		destroy: function() {
			if(this.loadingTask) {
				return this.close().then(function() {
					return this.destroy();
				}.bind(this));
			}
			pdfjsLib.GlobalWorkerOptions.workerSrc = '';
			if(canPdf) delete this.printFrame;
			delete this.options;
			if(this.onclose) delete this.onclose;
		}
	};
	
	return Plugin;
}));