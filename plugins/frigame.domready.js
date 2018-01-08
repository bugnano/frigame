/*global friGame, self */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2018 Franco Bugnano

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Uses ideas and APIs inspired by:
// gameQuery Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org), licensed under the MIT
// Based on domready (c) Dustin Diaz 2012 - License MIT

(function (fg) {
	'use strict';

	var
		fns,
		fn,
		testEl,
		hack,
		loaded
	;

	function flush() {
		var
			f
		;

		loaded = 1;
		while (fns.length) {
			f = fns.shift();
			f.call(fg, fg);
		}
	}

	if (typeof window !== 'undefined') {
		// Browser
		fns = [];
		testEl = document.documentElement;
		hack = (!document.addEventListener) && testEl.doScroll;
		loaded = document.readyState === 'complete';

		if (document.addEventListener) {
			fn = function () {
				document.removeEventListener('DOMContentLoaded', fn, false);
				window.removeEventListener('load', fn, false);
				flush();
			};

			document.addEventListener('DOMContentLoaded', fn, false);

			// A fallback to window.onload, that will always work
			window.addEventListener('load', fn, false);
		} else if (document.attachEvent) {
			fn = function () {
				if (document.readyState === 'complete') {
					document.detachEvent('onreadystatechange', fn);
					window.detachEvent('onload', fn);
					flush();
				}
			};

			document.attachEvent('onreadystatechange', fn);

			// A fallback to window.onload, that will always work
			window.attachEvent('onload', fn);
		}

		fg.ready = function (callback) {
			if (loaded) {
				// Handle it asynchronously to allow scripts the opportunity to delay ready
				setTimeout(function () { callback.call(fg, fg); }, 1);
			} else {
				if (hack) {
					if (self !== top) {
						fns.push(callback);
					} else {
						(function () {
							try {
								testEl.doScroll('left');
							} catch (e) {
								setTimeout(function () { fg.ready(callback); }, 50);
								return fg;
							}

							loaded = 1;
							setTimeout(function () { callback.call(fg, fg); }, 1);
						}());
					}
				} else {
					fns.push(callback);
				}
			}

			return fg;
		};
	} else {
		// Node.js
		fg.ready = function (callback) {
			setTimeout(function () { callback.call(fg, fg); }, 1);

			return fg;
		};
	}
}(friGame));

