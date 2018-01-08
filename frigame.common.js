/*global define, module, self, global, require */
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

(function (root, factory) {
	'use strict';

	if ((typeof define === 'function') && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if ((typeof module === 'object') && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.friGame = factory();
	}
}(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	var
		root,
		fg = {},
		imageSize,
		requestAnimFrame
	;

	if (typeof window !== 'undefined') {
		// Browser
		root = window;
	} else {
		// Node.js
		root = global;

		// The friGame namespace
		// !!! WARNING !!! Pollutes global namespace (but useful for plugins)
		root.friGame = fg;

		// performance.now()
		// !!! WARNING !!! Pollutes global namespace (but coherent with browsers)
		try {
			root.performance = require('perf_hooks').performance;
		} catch (e) {
			if (root.console) {
				console.warn('Cannot import "perf_hooks". Try updating nodejs.');
			}
		}

		// Image
		try {
			imageSize = require('image-size');
		} catch (e) {
			if (root.console) {
				console.warn('Cannot import "image-size". Try installing "image-size" with npm.');
			}
		}
	}

	// Date.now() by Mozilla
	if (!Date.now) {
		Date.now = function () {
			return (new Date()).getTime();
		};
	}

	// performance.now by Tony Gentilcore
	if (!root.performance) {
		root.performance = {};
	}

	if (!performance.now) {
		performance.now = (function () {
			return	performance.mozNow ||
					performance.msNow ||
					performance.oNow ||
					performance.webkitNow ||
					Date.now;
		}());
	}

	// shim layer with setTimeout fallback by Paul Irish / Erik Moller
	requestAnimFrame = (function () {
		var
			lastTime = 0,
			vendors = ['ms', 'moz', 'webkit', 'o'],
			request = root.requestAnimationFrame,
			x
		;

		for (x = 0; (x < vendors.length) && (!request); x += 1) {
			request = root[vendors[x] + 'RequestAnimationFrame'];
		}

		if (!request) {
			request = function (callback) {
				var
					currTime = performance.now(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = setTimeout(function () {
						callback(currTime + timeToCall);
					}, timeToCall)
				;

				lastTime = currTime + timeToCall;

				return id;
			};
		}

		return request;
	}());

	// Prototypal Inheritance by Douglas Crockford
	if (typeof Object.create !== 'function') {
		Object.create = function (o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	}

	// Extend a given object with all the properties of the source object
	fg.extend = function (obj, source) {
		/*jshint forin: false */
		var
			prop,
			copy
		;

		if (source) {
			for (prop in source) {
				copy = source[prop];

				// Prevent never-ending loop and don't bring in undefined values
				if ((obj !== copy) && (copy !== undefined)) {
					obj[prop] = copy;
				}
			}
		}

		return obj;
	};

	fg.extend(fg, {
		// Public constants

		GRADIENT_VERTICAL: 0,
		GRADIENT_HORIZONTAL: 1,

		ANIMATION_VERTICAL: 0,
		ANIMATION_HORIZONTAL: 1,

		BACKGROUND_TILED: 0,
		BACKGROUND_STRETCHED: 1,

		MASK_TILED: 0,
		MASK_STRETCHED: 1,

		REFRESH_RATE: 1000 / 60

		// Implementation details
	});

	fg.extend(fg, {
		// Public options

		cssClass: 'friGame',
		domPrefix: 'friGame_',

		resources: {},
		sprites: {},

		// Implementation details

		playgroundCallbacks: [],
		running: false,
		idDraw: null,
		currentTime: 0,
		accumulator: 0,
		absLeft: 0,
		absTop: 0,
		frameCounter: 0
	});

	// r is mapped to resources and s is mapped to sprites in order to have a more convenient
	// access to these frequently used objects
	fg.r = fg.resources;
	fg.s = fg.sprites;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg, {
		Maker: function (proto) {
			return function () {
				var
					obj = Object.create(proto)
				;

				obj.init.apply(obj, arguments);

				return obj;
			};
		},

		noop: function () {
		},

		isEmptyObject: function (obj) {
			/*jshint forin: false */
			var
				name
			;

			for (name in obj) {
				return false;
			}

			return true;
		},

		each: function(obj, callback) {
			/*jshint forin: false */
			var
				value,
				i,
				length = obj.length
			;

			if (length >= 0) {
				for (i = 0; i < length; i += 1) {
					value = obj[i];

					if (callback.call(value, i, value) === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					value = obj[i];

					if (callback.call(value, i, value) === false) {
						break;
					}
				}
			}

			return obj;
		},

		// Return a new object with only the keys defined in the keys array parameter
		pick: function (obj, keys) {
			var
				len_keys = keys.length,
				result = {},
				key,
				i
			;

			for (i = 0; i < len_keys; i += 1) {
				key = keys[i];
				if (obj[key] !== undefined) {
					result[key] = obj[key];
				}
			}

			return result;
		},

		inArray: function (elem, arr, i) {
			var
				len
			;

			if (arr) {
				len = arr.length;

				i = i || 0;
				if (i < 0) {
					i = Math.max(0, len + i);
				}

				while (i < len) {
					if (arr[i] === elem) {
						return i;
					}

					i += 1;
				}
			}

			return -1;
		},

		truncate: function (n) {
			if (n < 0) {
				return Math.ceil(n);
			}

			return Math.floor(n);
		},

		clamp: function (n, minVal, maxVal) {
			return Math.min(Math.max(n, minVal), maxVal);
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.resourceManager = {
		// Public options

		// Implementation details
		idPreload: null,
		preloadList: [],
		loadCallback: null,
		startCallbacks: [],
		completeCallback: null,

		// Public functions

		addResource: function (name, resource) {
			if (root.console && fg.r[name]) {
				console.error('Resource with name ' + name + ' already exists');
				console.trace();
			}

			fg.resourceManager.preloadList.push(resource);
			fg.r[name] = resource;

			return fg.resourceManager;
		},

		removeResource: function (name, options) {
			var
				new_options = options || {},
				resource = fg.r[name],
				resourceManager = fg.resourceManager,
				preload_list = resourceManager.preloadList,
				len_preload_list = preload_list.length,
				i
			;

			if (resource) {
				if (resource.remove) {
					resource.remove();
				}

				for (i = 0; i < len_preload_list; i += 1) {
					if (preload_list[i] === resource) {
						preload_list.splice(i, 1);
						break;
					}
				}

				fg.r[name] = null;
				delete fg.r[name];
			} else {
				if (root.console && (!new_options.suppressWarning)) {
					console.warn('Resource with name ' + name + ' already removed');
					console.trace();
				}
			}

			return resourceManager;
		},

		clear: function () {
			var
				resourceManager = fg.resourceManager,
				removeResource = resourceManager.removeResource,
				r = fg.r,
				resource_name,
				resource_names = [],
				len_resource_names,
				i
			;

			for (resource_name in r) {
				if (r.hasOwnProperty(resource_name)) {
					resource_names.push(resource_name);
				}
			}

			len_resource_names = resource_names.length;
			for (i = 0; i < len_resource_names; i += 1) {
				removeResource(resource_names[i]);
			}

			return resourceManager;
		},

		// Implementation details

		preload: function () {
			var
				resourceManager = fg.resourceManager,
				preload_list = resourceManager.preloadList,
				len_preload_list = preload_list.length,
				completed = 0,
				loadCallback = resourceManager.loadCallback,
				start_callbacks = resourceManager.startCallbacks,
				len_start_callbacks = start_callbacks.length,
				completeCallback = resourceManager.completeCallback,
				i
			;

			for (i = 0; i < len_preload_list; i += 1) {
				if ((!(preload_list[i].complete)) || (preload_list[i].complete())) {
					completed += 1;
				}
			}

			if (loadCallback) {
				if (len_preload_list !== 0) {
					loadCallback.call(fg, completed / len_preload_list);
				} else {
					loadCallback.call(fg, 1);
				}
			}

			if (completed === len_preload_list) {
				if (loadCallback) {
					resourceManager.loadCallback = null;
				}

				if (resourceManager.idPreload !== null) {
					clearInterval(resourceManager.idPreload);
					resourceManager.idPreload = null;
				}

				for (i = 0; i < len_preload_list; i += 1) {
					if (preload_list[i].onLoad) {
						preload_list[i].onLoad();
					}
				}
				preload_list.splice(0, len_preload_list);

				for (i = 0; i < len_start_callbacks; i += 1) {
					start_callbacks[i].call(fg);
				}
				start_callbacks.splice(0, len_start_callbacks);

				// Trigger the update before the completeCallback in order to allow calling stopGame
				// from the completeCallback
				if (fg.running && (fg.idDraw === null) && fg.s.playground) {
					fg.accumulator = 0;
					fg.currentTime = performance.now();
					fg.idDraw = requestAnimFrame(fg.draw);
				}

				if (completeCallback) {
					// Set to null the completeCallback before calling the completeCallback
					// in order to enable recursion
					resourceManager.completeCallback = null;
					completeCallback.call(fg);
				}
			}
		}
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PGradient = {
		init: function (startColor, endColor, type) {
			var
				clamp = fg.clamp,
				round = Math.round,
				startColorStr
			;

			this.startColor = {
				r: 0,
				g: 0,
				b: 0,
				a: 1
			};

			if (startColor) {
				startColor = fg.extend(this.startColor, fg.pick(startColor, ['r', 'g', 'b', 'a']));
			} else {
				startColor = this.startColor;
			}

			startColor.r = clamp(round(startColor.r), 0, 255);
			startColor.g = clamp(round(startColor.g), 0, 255);
			startColor.b = clamp(round(startColor.b), 0, 255);
			startColor.a = clamp(startColor.a, 0, 1);
			startColorStr = 'rgba(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ',' + String(startColor.a) + ')';
			this.startColorStr = startColorStr;
			this.name = startColorStr;

			if (endColor) {
				this.endColor = {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				};

				endColor = fg.extend(this.endColor, fg.pick(endColor, ['r', 'g', 'b', 'a']));
				endColor.r = clamp(round(endColor.r), 0, 255);
				endColor.g = clamp(round(endColor.g), 0, 255);
				endColor.b = clamp(round(endColor.b), 0, 255);
				endColor.a = clamp(endColor.a, 0, 1);
				this.endColorStr = 'rgba(' + String(endColor.r) + ',' + String(endColor.g) + ',' + String(endColor.b) + ',' + String(endColor.a) + ')';

				if (startColorStr === this.endColorStr) {
					this.endColor = startColor;
				} else {
					this.name += this.endColorStr;
				}
			} else {
				this.endColor = startColor;
				this.endColorStr = startColorStr;
			}

			if (type !== undefined) {
				this.type = type;
			} else {
				this.type = fg.GRADIENT_VERTICAL;
			}
		},

		// Public functions

		remove: function () {
			var
				gradient = this
			;

			fg.each(fg.s, function () {
				var
					options = this.options
				;

				if (options.background === gradient) {
					this.setBackground({background: null});
				}

				if (options.borderColor === gradient) {
					this.setBorder({borderColor: null});
				}
			});
		}

		// Implementation details
	};

	fg.Gradient = fg.Maker(fg.PGradient);

	fg.resourceManager.addGradient = function (name) {
		var
			args = Array.prototype.slice.call(arguments, 1),
			gradient = fg.Gradient.apply(this, args)
		;

		gradient.name = name;

		return fg.resourceManager.addResource(name, gradient);
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PAnimation = {
		// Public options

		// Implementation details
		images: {},

		init: function (imageURL, options) {
			var
				my_options,
				new_options,
				sprite_sheet,
				my_frameset,
				frameset,
				len_frameset,
				i
			;

			// If imageURL is not a string, it means that it has been omitted,
			// so let's adjust the variable names accordingly.
			// Another way of omitting imageURL is by explicitly passing null,
			// in that case no variable name change is necessary.
			if (imageURL && (typeof imageURL !== 'string')) {
				options = imageURL;
				imageURL = null;
			}

			new_options = options || {};

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			fg.extend(my_options, {
				// Public options
				rate: fg.REFRESH_RATE,
				once: false,
				pingpong: false,
				backwards: false,
				frameWidth: 0,
				frameHeight: 0,
				frameset: [],

				// Implementation details
				halfWidth: 0,
				halfHeight: 0
			});

			fg.extend(my_options, fg.pick(new_options, [
				'rate',
				'once',
				'pingpong',
				'backwards',
				'frameWidth',
				'frameHeight'
			]));

			my_options.rate = Math.max(Math.round(new_options.rate / fg.REFRESH_RATE), 1) || 1;

			my_frameset = my_options.frameset;

			if (imageURL) {
				// Set default options
				sprite_sheet = {
					imageURL: imageURL,
					numberOfFrame: 1,
					type: fg.ANIMATION_HORIZONTAL,
					offsetx: 0,
					offsety: 0
				};

				fg.extend(sprite_sheet, fg.pick(new_options, [
					'numberOfFrame',
					'type',
					'offsetx',
					'offsety'
				]));

				sprite_sheet.img = this.getImage(imageURL);

				my_frameset.push(sprite_sheet);
			}

			frameset = new_options.frameset;
			if (frameset) {
				len_frameset = frameset.length;
				if (len_frameset) {
					// The default imageURL is the one of the first element
					if (!imageURL) {
						imageURL = frameset[0].imageURL;
					}

					for (i = 0; i < len_frameset; i += 1) {
						// Set default options
						sprite_sheet = {
							imageURL: imageURL,
							numberOfFrame: 1,
							type: fg.ANIMATION_HORIZONTAL,
							offsetx: 0,
							offsety: 0
						};

						fg.extend(sprite_sheet, fg.pick(frameset[i], [
							'imageURL',
							'numberOfFrame',
							'type',
							'offsetx',
							'offsety'
						]));

						sprite_sheet.img = this.getImage(sprite_sheet.imageURL);

						my_frameset.push(sprite_sheet);
					}
				}
			}
		},

		// Public functions

		remove: function () {
			var
				imageURL,
				PAnimation = fg.PAnimation,
				animation = this,
				frameset = this.options.frameset,
				len_frameset = frameset.length,
				i
			;

			// Step 1: Remove myself from all the sprites
			fg.each(fg.s, function () {
				var
					options = this.options
				;

				if (options.animation === animation) {
					this.setAnimation({animation: null});
				}

				if (options.background === animation) {
					this.setBackground({background: null});
				}

				if (options.mask === animation) {
					this.setMask({mask: null});
				}
			});

			// Step 2: Decrease the images reference count
			for (i = 0; i < len_frameset; i += 1) {
				imageURL = frameset[i].imageURL;
				PAnimation.images[imageURL].refCount -= 1;
				if (PAnimation.images[imageURL].refCount <= 0) {
					PAnimation.images[imageURL] = null;
					delete PAnimation.images[imageURL];
				}
			}
		},

		// Implementation details

		complete: function () {
			var
				complete = true,
				frameset = this.options.frameset,
				len_frameset = frameset.length,
				img,
				i
			;

			for (i = 0; i < len_frameset; i += 1) {
				img = frameset[i].img;
				// Apparently there are some cases where img.complete is true, even if its width and height are not known yet
				if (!(img.complete && img.width && img.height)) {
					complete = false;
					break;
				}
			}

			return complete;
		},

		onLoad: function () {
			var
				options = this.options,
				img,
				round = fg.truncate,
				frameWidth,
				frameHeight,
				sprite_sheet,
				frameset = options.frameset,
				len_frameset = frameset.length,
				i
			;

			if (len_frameset) {
				// The first sprite sheet is used to calculate the frame dimensions
				sprite_sheet = frameset[0];
				img = sprite_sheet.img;

				if (sprite_sheet.type === fg.ANIMATION_VERTICAL) {
					// On multi vertical animations the frameWidth parameter is required
					if (!options.frameWidth) {
						options.frameWidth = img.width - sprite_sheet.offsetx;
					}

					// On vertical animations the frameHeight parameter is optional
					if (!options.frameHeight) {
						options.frameHeight = round((img.height - sprite_sheet.offsety) / sprite_sheet.numberOfFrame);
					}
				} else {
					// On horizontal animations the frameWidth parameter is optional
					if (!options.frameWidth) {
						options.frameWidth = round((img.width - sprite_sheet.offsetx) / sprite_sheet.numberOfFrame);
					}

					// On multi horizontal animations the frameHeight parameter is required
					if (!options.frameHeight) {
						options.frameHeight = img.height - sprite_sheet.offsety;
					}
				}
			}

			frameWidth = options.frameWidth;
			frameHeight = options.frameHeight;
			for (i = 0; i < len_frameset; i += 1) {
				sprite_sheet = frameset[i];
				if (sprite_sheet.type === fg.ANIMATION_VERTICAL) {
					sprite_sheet.deltax = 0;
					sprite_sheet.deltay = frameHeight;
					sprite_sheet.multix = frameWidth;
					sprite_sheet.multiy = 0;
				} else {
					sprite_sheet.deltax = frameWidth;
					sprite_sheet.deltay = 0;
					sprite_sheet.multix = 0;
					sprite_sheet.multiy = frameHeight;
				}
			}

			options.halfWidth = round(frameWidth / 2);
			options.halfHeight = round(frameHeight / 2);

			this.width = frameWidth;
			this.height = frameHeight;
			this.halfWidth = options.halfWidth;
			this.halfHeight = options.halfHeight;
		},

		getImage: function (imageURL) {
			var
				img,
				PAnimation = fg.PAnimation
			;

			if (PAnimation.images[imageURL]) {
				img = PAnimation.images[imageURL].img;
				PAnimation.images[imageURL].refCount += 1;
			} else {
				if (typeof Image !== 'undefined') {
					img = new Image();
					img.src = imageURL;
				} else if (imageSize) {
					img = fg.extend({complete: true}, fg.pick(imageSize(imageURL), ['width', 'height']));
				} else {
					if (root.console) {
						console.error('Cannot read image. Try installing "image-size" with npm.');
						console.trace();
					}

					// Fallback to a 1x1px image
					img = {
						width: 1,
						height: 1,
						complete: true
					};
				}

				PAnimation.images[imageURL] = {
					img: img,
					refCount: 1
				};
			}

			return img;
		}
	};

	fg.Animation = fg.Maker(fg.PAnimation);

	fg.resourceManager.addAnimation = function (name) {
		var
			args = Array.prototype.slice.call(arguments, 1),
			animation = fg.Animation.apply(this, args)
		;

		animation.name = name;

		return fg.resourceManager.addResource(name, animation);
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PRect = {
		init: function (options) {
			// Set default options
			fg.extend(this, {
				// Public read-only properties
				left: 0,
				right: 0,
				centerx: 0,
				top: 0,
				bottom: 0,
				centery: 0,
				width: 0,
				height: 0,
				halfWidth: 0,
				halfHeight: 0,
				radius: 0,

				// Implementation details
				last_x: 'left',
				last_y: 'top'
			});

			if (this.resize) {
				this.resize(options);
			}
		},

		resize: function (options) {
			var
				new_options = options || {},
				round = fg.truncate,
				max = Math.max,
				change_radius
			;

			// width MUST have priority over halfWidth
			if (new_options.width !== undefined) {
				this.width = max(round(new_options.width), 0) || 0;
				this.halfWidth = max(round(new_options.width / 2), 0) || 0;
				change_radius = true;
			} else if (new_options.halfWidth !== undefined) {
				this.width = max(round(new_options.halfWidth * 2), 0) || 0;
				this.halfWidth = max(round(new_options.halfWidth), 0) || 0;
				change_radius = true;
			} else {
				// No width is being redefined
				change_radius = false;
			}

			// height MUST have priority over halfHeight
			if (new_options.height !== undefined) {
				this.height = max(round(new_options.height), 0) || 0;
				this.halfHeight = max(round(new_options.height / 2), 0) || 0;
				change_radius = true;
			} else if (new_options.halfHeight !== undefined) {
				this.height = max(round(new_options.halfHeight * 2), 0) || 0;
				this.halfHeight = max(round(new_options.halfHeight), 0) || 0;
				change_radius = true;
			} else {
				// No height is being redefined
				change_radius = false;
			}

			if (change_radius) {
				this.radius = max(this.halfWidth, this.halfHeight);
			} else {
				// Check if the radius is redefined only if width or height are not redefined
				if (new_options.radius !== undefined) {
					this.radius = max(round(new_options.radius), 0) || 0;

					this.width = this.radius * 2;
					this.height = this.width;
					this.halfWidth = this.radius;
					this.halfHeight = this.halfWidth;
				}
			}

			if (this.move) {
				this.move(options);
			}

			return this;
		},

		move: function (options) {
			var
				new_options = options || {},
				round = fg.truncate,
				last_x,
				last_y
			;

			// STEP 1: Memorize the last option that has been redefined

			if ((new_options.last_x !== undefined) && (new_options[new_options.last_x] !== undefined)) {
				this[new_options.last_x] = round(new_options[new_options.last_x]);
				last_x = new_options.last_x;
			} else if (new_options.centerx !== undefined) {
				this.centerx = round(new_options.centerx);
				last_x = 'centerx';
			} else if (new_options.right !== undefined) {
				this.right = round(new_options.right);
				last_x = 'right';
			} else if (new_options.left !== undefined) {
				this.left = round(new_options.left);
				last_x = 'left';
			} else {
				// No x is being redefined
				last_x = this.last_x;
			}

			if ((new_options.last_y !== undefined) && (new_options[new_options.last_y] !== undefined)) {
				this[new_options.last_y] = round(new_options[new_options.last_y]);
				last_y = new_options.last_y;
			} else if (new_options.centery !== undefined) {
				this.centery = round(new_options.centery);
				last_y = 'centery';
			} else if (new_options.bottom !== undefined) {
				this.bottom = round(new_options.bottom);
				last_y = 'bottom';
			} else if (new_options.top !== undefined) {
				this.top = round(new_options.top);
				last_y = 'top';
			} else {
				// No y is being redefined
				last_y = this.last_y;
			}

			// STEP 2: Adjust the other parameters according to the last defined option
			// NOTE: The parameters are adjusted even if no x or y is being redefined because
			// the rect width and height might have changed

			if (last_x === 'centerx') {
				this.left = this.centerx - this.halfWidth;
				this.right = this.left + this.width;
			} else if (last_x === 'right') {
				this.left = this.right - this.width;
				this.centerx = this.left + this.halfWidth;
			} else {
				this.centerx = this.left + this.halfWidth;
				this.right = this.left + this.width;
			}

			if (last_y === 'centery') {
				this.top = this.centery - this.halfHeight;
				this.bottom = this.top + this.height;
			} else if (last_y === 'bottom') {
				this.top = this.bottom - this.height;
				this.centery = this.top + this.halfHeight;
			} else {
				this.centery = this.top + this.halfHeight;
				this.bottom = this.top + this.height;
			}

			this.last_x = last_x;
			this.last_y = last_y;

			return this;
		},

		collideRect: function (otherRect) {
			return	(!(
					(this.bottom <= otherRect.top)
				||	(this.top >= otherRect.bottom)
				||	(this.left >= otherRect.right)
				||	(this.right <= otherRect.left)
			));
		},

		collideRectPoint: function (x, y) {
			return	(
					(x >= this.left)
				&&	(x < this.right)
				&&	(y >= this.top)
				&&	(y < this.bottom)
			);
		},

		collideRectCircle: function (otherRect) {
			var
				clamp = fg.clamp,
				centerx = otherRect.centerx,
				centery = otherRect.centery,
				radius = otherRect.radius,
				nearest_x = clamp(centerx, this.left, this.right),
				nearest_y = clamp(centery, this.top, this.bottom),
				dx = centerx - nearest_x,
				dy = centery - nearest_y
			;

			return (((dx * dx) + (dy * dy)) < (radius * radius));
		},

		collideCircle: function (otherRect) {
			var
				dx = otherRect.centerx - this.centerx,
				dy = otherRect.centery - this.centery,
				radii = this.radius + otherRect.radius
			;

			return (((dx * dx) + (dy * dy)) < (radii * radii));
		},

		collideCirclePoint: function (x, y) {
			var
				dx = x - this.centerx,
				dy = y - this.centery,
				radius = this.radius
			;

			return (((dx * dx) + (dy * dy)) < (radius * radius));
		},

		collideCircleRect: function (otherRect) {
			var
				clamp = fg.clamp,
				centerx = this.centerx,
				centery = this.centery,
				radius = this.radius,
				nearest_x = clamp(centerx, otherRect.left, otherRect.right),
				nearest_y = clamp(centery, otherRect.top, otherRect.bottom),
				dx = centerx - nearest_x,
				dy = centery - nearest_y
			;

			return (((dx * dx) + (dy * dy)) < (radius * radius));
		}
	};

	// Deprecated
	fg.PRect.collidePointRect = fg.PRect.collideRectPoint;
	fg.PRect.collidePointCircle = fg.PRect.collideCirclePoint;

	fg.Rect = fg.Maker(fg.PRect);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PBaseSprite = Object.create(fg.PRect);
	fg.extend(fg.PBaseSprite, {
		init: function (name, options, parent) {
			var
				my_options
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			fg.extend(my_options, {
				// Public options

				// Implementation details
				transformOriginx: 'halfWidth',
				transformOriginy: 'halfHeight',
				angle: 0,
				scalex: 1,
				scaley: 1,
				fliph: 1,
				flipv: 1,
				alpha: 1,
				hidden: false,

				scaleh: 1,
				scalev: 1,

				blendMode: null,

				// ieFilter specific
				posOffsetX: 0,
				posOffsetY: 0
			});

			if (root.console && fg.s[name]) {
				console.error('Sprite with name ' + name + ' already exists');
				console.trace();
			}

			fg.s[name] = this;

			// name and parent are public read-only properties
			this.name = name;
			this.parent = parent;

			// A public userData property can be useful to the game
			this.userData = null;

			// Implementation details
			this.callbacks = [];
			this.needsUpdate = false;
			this.frameCounterLastMove = fg.frameCounter;
			this.prevLeft = 0;
			this.prevTop = 0;

			// Call fg.PRect.init after setting this.parent
			fg.PRect.init.call(this, options);

			this.prevLeft = this.left;
			this.prevTop = this.top;
		},

		// Public functions

		remove: function () {
			var
				parent = this.parent,
				parent_obj,
				parent_layers,
				len_parent_layers,
				parent_update_list,
				len_parent_update_list,
				name = this.name,
				userData = this.userData,
				i
			;

			// Set userData to null before calling its remove() method,
			// in order to allow calling this.remove() inside userData.remove()
			this.userData = null;

			if (userData && userData.remove) {
				userData.remove();
			}

			if (parent) {
				parent_obj = fg.s[parent];
				if (!parent_obj.clearing) {
					parent_layers = parent_obj.layers;
					len_parent_layers = parent_layers.length;
					for (i = 0; i < len_parent_layers; i += 1) {
						if (parent_layers[i].name === name) {
							parent_layers.splice(i, 1);
							break;
						}
					}

					this.needsUpdate = false;
					parent_update_list = parent_obj.updateList;
					len_parent_update_list = parent_update_list.length;
					for (i = 0; i < len_parent_update_list; i += 1) {
						if (parent_update_list[i].name === name) {
							parent_update_list.splice(i, 1);
							break;
						}
					}

					parent_obj.checkUpdate();
				}
			}

			if (fg.s[name]) {
				fg.s[name] = null;
				delete fg.s[name];
			} else {
				if (root.console) {
					console.warn('Sprite with name ' + name + ' already removed');
					console.trace();
				}
			}
		},

		registerCallback: function (callback, rate) {
			rate = Math.max(Math.round(rate / fg.REFRESH_RATE), 1) || 1;

			this.callbacks.push({callback: callback, rate: rate, idleCounter: 0, remove: false});

			this.checkUpdate();

			return this;
		},

		removeCallback: function (callback, options) {
			var
				new_options = options || {},
				found = false,
				callbacks = this.callbacks,
				len_callbacks = callbacks.length,
				callback_obj,
				i
			;

			for (i = 0; i < len_callbacks; i += 1) {
				callback_obj = callbacks[i];
				if (callback_obj.callback === callback) {
					found = true;

					// Mark the callback to be removed at the next update
					callback_obj.remove = true;

					// Don't end the loop here, as the same callback function might have been registered more than once
				}
			}

			if (root.console && (!found) && (!new_options.suppressWarning)) {
				console.warn('No callbacks removed');
				console.trace();
			}

			return this;
		},

		clearCallbacks: function () {
			var
				callbacks = this.callbacks,
				len_callbacks = callbacks.length,
				i
			;

			for (i = 0; i < len_callbacks; i += 1) {
				// Mark the callback to be removed at the next update
				callbacks[i].remove = true;
			}

			return this;
		},

		hide: function () {
			this.options.hidden = true;

			return this;
		},

		show: function () {
			this.options.hidden = false;

			return this;
		},

		toggle: function (showOrHide) {
			if (showOrHide === undefined) {
				showOrHide = this.options.hidden;
			}

			this.options.hidden = !showOrHide;

			return this;
		},

		drawFirst: function () {
			var
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				obj,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				// Step 1: Remove myself from the parent layers
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						obj = parent_layers.splice(i, 1)[0];
						break;
					}
				}

				// Step 2: Insert myself
				if (obj) {
					parent_layers.unshift(obj);
				}
			}

			return this;
		},

		drawLast: function () {
			var
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				obj,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				// Step 1: Remove myself from the parent layers
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						obj = parent_layers.splice(i, 1)[0];
						break;
					}
				}

				// Step 2: Insert myself
				if (obj) {
					parent_layers.push(obj);
				}
			}

			return this;
		},

		getDrawIndex: function () {
			var
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						return i;
					}
				}
			}

			return 0;
		},

		drawTo: function (index) {
			var
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				obj,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				// Step 1: Remove myself from the parent layers
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						obj = parent_layers.splice(i, 1)[0];
						break;
					}
				}

				// Step 2: Insert myself
				if (obj) {
					parent_layers.splice(fg.clamp(Math.round(index), 0, parent_layers.length), 0, obj);
				}
			}

			return this;
		},

		drawBefore: function (name) {
			var
				found = false,
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				my_name = this.name,
				obj,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				// Step 1: Remove myself from the parent layers
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === my_name) {
						obj = parent_layers.splice(i, 1)[0];
						len_parent_layers -= 1;
						break;
					}
				}

				// Step 2: Find the position and insert myself
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						found = true;
						break;
					}
				}

				if (obj) {
					parent_layers.splice(i, 0, obj);
				}
			}

			if (root.console && (!found)) {
				console.error('Sprite with name ' + name + ' not found in the same sprite group');
				console.trace();
			}

			return this;
		},

		drawAfter: function (name) {
			var
				found = false,
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				my_name = this.name,
				obj,
				i
			;

			if (parent) {
				parent_layers = fg.s[parent].layers;
				len_parent_layers = parent_layers.length;

				// Step 1: Remove myself from the parent layers
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === my_name) {
						obj = parent_layers.splice(i, 1)[0];
						len_parent_layers -= 1;
						break;
					}
				}

				// Step 2: Find the position and insert myself
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						found = true;

						// The insertion is done after this one
						i += 1;
						break;
					}
				}

				if (obj) {
					parent_layers.splice(i, 0, obj);
				}
			}

			if (root.console && (!found)) {
				console.error('Sprite with name ' + name + ' not found in the same sprite group');
				console.trace();
			}

			return this;
		},

		transformOrigin: function (originx, originy) {
			var
				options = this.options,
				round = fg.truncate
			;

			if (originx === undefined) {
				return options.transformOriginx;
			}

			if (typeof originx === 'string') {
				if (root.console) {
					if (!((originx === 'halfWidth') || (originx === 'width'))) {
						console.error('Invalid originx: ' + originx);
						console.trace();
					}
				}
			} else {
				originx = round(originx) || 0;
			}

			options.transformOriginx = originx;

			if (originy === undefined) {
				// If originy isn't specified, it is assumed to be equal to originx.
				if (originx === 'halfWidth') {
					options.transformOriginy = 'halfHeight';
				} else if (originx === 'width') {
					options.transformOriginy = 'height';
				} else {
					options.transformOriginy = originx;
				}
			} else {
				if (typeof originy === 'string') {
					options.transformOriginy = originy;

					if (root.console) {
						if (!((originy === 'halfHeight') || (originy === 'height'))) {
							console.error('Invalid originy: ' + originy);
							console.trace();
						}
					}
				} else {
					options.transformOriginy = round(originy) || 0;
				}
			}

			return this;
		},

		transformOriginx: function (originx) {
			var
				options = this.options
			;

			if (originx === undefined) {
				return options.transformOriginx;
			}

			if (typeof originx === 'string') {
				options.transformOriginx = originx;

				if (root.console) {
					if (!((originx === 'halfWidth') || (originx === 'width'))) {
						console.error('Invalid originx: ' + originx);
						console.trace();
					}
				}
			} else {
				options.transformOriginx = fg.truncate(originx) || 0;
			}

			return this;
		},

		transformOriginy: function (originy) {
			var
				options = this.options
			;

			if (originy === undefined) {
				return options.transformOriginy;
			}

			if (typeof originy === 'string') {
				options.transformOriginy = originy;

				if (root.console) {
					if (!((originy === 'halfHeight') || (originy === 'height'))) {
						console.error('Invalid originy: ' + originy);
						console.trace();
					}
				}
			} else {
				options.transformOriginy = fg.truncate(originy) || 0;
			}

			return this;
		},

		rotate: function (angle) {
			if (angle === undefined) {
				return this.options.angle;
			}

			this.options.angle = angle;

			return this;
		},

		scale: function (sx, sy) {
			var
				options = this.options
			;

			if (sx === undefined) {
				return options.scalex;
			}

			options.scalex = sx;
			options.scaleh = sx * options.fliph;

			if (sy === undefined) {
				// If sy isn't specified, it is assumed to be equal to sx.
				options.scaley = sx;
				options.scalev = sx * options.flipv;
			} else {
				options.scaley = sy;
				options.scalev = sy * options.flipv;
			}

			return this;
		},

		scalex: function (sx) {
			var
				options = this.options
			;

			if (sx === undefined) {
				return options.scalex;
			}

			options.scalex = sx;
			options.scaleh = sx * options.fliph;

			return this;
		},

		scaley: function (sy) {
			var
				options = this.options
			;

			if (sy === undefined) {
				return options.scaley;
			}

			options.scaley = sy;
			options.scalev = sy * options.flipv;

			return this;
		},

		fliph: function (flip) {
			var
				options = this.options
			;

			if (flip === undefined) {
				return (options.fliph < 0);
			}

			if (flip) {
				options.fliph = -1;
				options.scaleh = -(options.scalex);
			} else {
				options.fliph = 1;
				options.scaleh = options.scalex;
			}

			return this;
		},

		flipv: function (flip) {
			var
				options = this.options
			;

			if (flip === undefined) {
				return (options.flipv < 0);
			}

			if (flip) {
				options.flipv = -1;
				options.scalev = -(options.scaley);
			} else {
				options.flipv = 1;
				options.scalev = options.scaley;
			}

			return this;
		},

		opacity: function (alpha) {
			if (alpha === undefined) {
				return this.options.alpha;
			}

			this.options.alpha = fg.clamp(alpha, 0, 1);

			return this;
		},

		blendMode: function (mode) {
			if (mode === undefined) {
				return this.options.blendMode;
			}

			this.options.blendMode = mode;

			return this;
		},

		getAbsRect: function () {
			var
				left = this.left,
				top = this.top,
				parent = fg.s[this.parent]
			;

			while (parent) {
				left += parent.left;
				top += parent.top;
				parent = fg.s[parent.parent];
			}

			return fg.Rect({left: left, top: top, width: this.width, height: this.height});
		},

		move: function (options) {
			var
				frameCounter = fg.frameCounter
			;

			if (frameCounter !== this.frameCounterLastMove) {
				this.prevLeft = this.left;
				this.prevTop = this.top;
				this.frameCounterLastMove = frameCounter;
			}

			fg.PRect.move.apply(this, arguments);
		},

		// Implementation details

		checkUpdate: function () {
			var
				oldNeedsUpdate = this.needsUpdate
			;

			if (this.callbacks.length === 0) {
				this.needsUpdate = false;
			} else {
				this.needsUpdate = true;
			}

			this.updateNeedsUpdate(oldNeedsUpdate);
		},

		updateNeedsUpdate: function (oldNeedsUpdate) {
			var
				parent = this.parent,
				name = this.name,
				parent_update_list,
				len_parent_update_list,
				i
			;

			if (parent) {
				if (this.needsUpdate && (!oldNeedsUpdate)) {
					fg.s[parent].updateList.push({name: name, obj: this});
				} else if ((!this.needsUpdate) && oldNeedsUpdate) {
					parent_update_list = fg.s[parent].updateList;
					len_parent_update_list = parent_update_list.length;
					for (i = 0; i < len_parent_update_list; i += 1) {
						if (parent_update_list[i].name === name) {
							parent_update_list.splice(i, 1);
							break;
						}
					}
				}
			}
		},

		update: function () {
			var
				callbacks = this.callbacks,
				len_callbacks = callbacks.length,
				callback_obj,
				retval,
				remove_callbacks = [],
				len_remove_callbacks,
				i
			;

			for (i = 0; i < len_callbacks; i += 1) {
				callback_obj = callbacks[i];
				if (callback_obj.remove) {
					remove_callbacks.unshift(i);
				} else {
					callback_obj.idleCounter += 1;
					if (callback_obj.idleCounter >= callback_obj.rate) {
						callback_obj.idleCounter = 0;
						retval = callback_obj.callback.call(this, this);
						if (retval) {
							remove_callbacks.unshift(i);
						}
					}
				}
			}

			len_remove_callbacks = remove_callbacks.length;
			if (len_remove_callbacks) {
				for (i = 0; i < len_remove_callbacks; i += 1) {
					callbacks.splice(remove_callbacks[i], 1);
				}

				this.checkUpdate();
			}
		},

		draw: fg.noop
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PSprite = Object.create(fg.PBaseSprite);
	fg.extend(fg.PSprite, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {}
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			fg.extend(my_options, {
				// Public options
				animation: null,
				animationIndex: 0,
				callback: null,

				// Implementation details
				idleCounter: 0,
				lastSpriteSheet: 0,
				currentSpriteSheet: 0,
				numberOfFrame: 0,
				currentFrame: 0,
				frameIncrement: 1,
				multix: 0,
				multiy: 0,
				paused: false
			});

			fg.PBaseSprite.init.apply(this, arguments);

			// If the animation has not been defined, force
			// the animation to null in order to resize and move
			// the sprite inside setAnimation
			if (new_options.animation === undefined) {
				new_options.animation = null;
			}

			this.setAnimation(new_options);

			this.prevLeft = this.left;
			this.prevTop = this.top;
		},

		// Public functions

		setAnimation: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				animation,
				index,
				animation_options,
				sprite_sheet,
				animation_redefined = new_options.animation !== undefined,
				index_redefined = new_options.animationIndex !== undefined
			;

			if (animation_redefined) {
				animation = fg.r[new_options.animation];
				my_options.animation = animation;
				my_options.callback = null;
				my_options.paused = false;

				// Force new width and height based on the animation frame size
				if (animation) {
					animation_options = Object.create(animation.options);

					new_options.width = animation_options.frameWidth;
					new_options.height = animation_options.frameHeight;
				} else {
					if (root.console && new_options.animation) {
						console.error('Animation with name ' + new_options.animation + ' does not exist');
						console.trace();
					}

					animation_options = null;

					new_options.width = 0;
					new_options.height = 0;
				}

				this.animation_options = animation_options;

				// Call the resize method with all the options in order to update the position
				fg.PBaseSprite.resize.call(this, new_options);

				// If the animation gets redefined, set default index of 0
				if ((my_options.animationIndex !== 0) && (!index_redefined)) {
					new_options.animationIndex = 0;
					index_redefined = true;
				}
			}

			animation_options = this.animation_options;

			if (new_options.rate !== undefined) {
				animation_options.rate = Math.max(Math.round(new_options.rate / fg.REFRESH_RATE), 1) || 1;
			}

			if (new_options.once !== undefined) {
				animation_options.once = new_options.once;
				animation_redefined = true;
			}

			if (new_options.pingpong !== undefined) {
				animation_options.pingpong = new_options.pingpong;
				animation_redefined = true;
			}

			if (new_options.backwards !== undefined) {
				animation_options.backwards = new_options.backwards;
				animation_redefined = true;
			}

			if (animation_redefined || index_redefined) {
				if (animation_options && (animation_options.backwards)) {
					my_options.lastSpriteSheet = animation_options.frameset.length - 1;
					my_options.currentSpriteSheet = my_options.lastSpriteSheet;
					my_options.numberOfFrame = animation_options.frameset[my_options.currentSpriteSheet].numberOfFrame;
					my_options.currentFrame = my_options.numberOfFrame - 1;
					my_options.frameIncrement = -1;
				} else {
					my_options.currentSpriteSheet = 0;
					if (animation_options) {
						my_options.lastSpriteSheet = animation_options.frameset.length - 1;
						my_options.numberOfFrame = animation_options.frameset[0].numberOfFrame;
					} else {
						my_options.lastSpriteSheet = 0;
						my_options.numberOfFrame = 0;
					}
					my_options.currentFrame = 0;
					my_options.frameIncrement = 1;
				}

				my_options.idleCounter = 0;
				this.endAnimation = false;
			}

			if (index_redefined) {
				index = new_options.animationIndex;
				my_options.animationIndex = index;

				animation = my_options.animation;
				if (animation && index) {
					sprite_sheet = animation_options.frameset[my_options.currentSpriteSheet];
					my_options.multix = index * sprite_sheet.multix;
					my_options.multiy = index * sprite_sheet.multiy;
				} else {
					my_options.multix = 0;
					my_options.multiy = 0;
				}
			}

			if (new_options.callback !== undefined) {
				my_options.callback = new_options.callback;
			}

			if (new_options.paused !== undefined) {
				my_options.paused = new_options.paused;
			}

			this.checkUpdate();

			return this;
		},

		resize: null,	// Sprites cannot be explicitly resized

		// Implementation details

		checkUpdate: function () {
			var
				options = this.options,
				oldNeedsUpdate = this.needsUpdate
			;

			if	(
					(this.callbacks.length === 0)
				&&	(
						(this.endAnimation || options.paused)
					||	(
							(!options.callback)
						&&	((!options.animation) || ((options.lastSpriteSheet <= 0) && (options.numberOfFrame <= 1)))
						)
					)
				) {
				this.needsUpdate = false;
			} else {
				this.needsUpdate = true;
			}

			this.updateNeedsUpdate(oldNeedsUpdate);
		},

		update: function () {
			var
				options = this.options,
				callback = options.callback,
				animation = options.animation,
				animation_options = this.animation_options,
				currentSpriteSheet = options.currentSpriteSheet,
				currentFrame = options.currentFrame
			;

			if (!(this.endAnimation || options.paused)) {
				if (animation) {
					options.idleCounter += 1;
					if (options.idleCounter >= animation_options.rate) {
						options.idleCounter = 0;
						currentFrame += options.frameIncrement;
						if (animation_options.backwards) {
							// Backwards animations
							if (animation_options.pingpong) {
								// In pingpong animations the end is when the frame returns to the last frame
								if (currentFrame >= options.numberOfFrame) {
									if (currentSpriteSheet < options.lastSpriteSheet) {
										currentSpriteSheet += 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = 0;
									} else {
										options.frameIncrement = -1;
										if (animation_options.once) {
											currentFrame -= 1;
											options.idleCounter = 1;
											this.endAnimation = true;
										} else {
											// The first frame has already been displayed, start from the second
											if (options.numberOfFrame > 1) {
												currentFrame -= 2;
											} else if (options.lastSpriteSheet > 0) {
												currentSpriteSheet -= 1;
												options.currentSpriteSheet = currentSpriteSheet;
												options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
												currentFrame = options.numberOfFrame - 1;
											} else {
												currentFrame -= 1;
											}
										}

										// Update the details before the callback
										options.currentFrame = currentFrame;

										if (callback) {
											callback.call(this, this);
										}
									}
								} else if (currentFrame < 0) {
									if (currentSpriteSheet > 0) {
										currentSpriteSheet -= 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = options.numberOfFrame - 1;
									} else {
										// Last frame reached, change animation direction
										options.frameIncrement = 1;
										// The first frame has already been displayed, start from the second
										if (options.numberOfFrame > 1) {
											currentFrame = 1;
										} else if (options.lastSpriteSheet > 0) {
											currentSpriteSheet += 1;
											options.currentSpriteSheet = currentSpriteSheet;
											options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
											currentFrame = 0;
										} else {
											currentFrame = 0;
										}
										options.currentFrame = currentFrame;
									}
								} else {
									// This is no particular frame, simply update the details
									options.currentFrame = currentFrame;
								}
							} else {
								// Normal animation
								if (currentFrame < 0) {
									if (currentSpriteSheet > 0) {
										currentSpriteSheet -= 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = options.numberOfFrame - 1;
									} else {
										// Last frame reached
										if (animation_options.once) {
											currentFrame = 0;
											options.idleCounter = 1;
											this.endAnimation = true;
										} else {
											currentSpriteSheet = options.lastSpriteSheet;
											options.currentSpriteSheet = currentSpriteSheet;
											options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
											currentFrame = options.numberOfFrame - 1;
										}

										// Update the details before the callback
										options.currentFrame = currentFrame;

										if (callback) {
											callback.call(this, this);
										}
									}
								} else {
									// This is no particular frame, simply update the details
									options.currentFrame = currentFrame;
								}
							}
						} else {
							// Forwards animations
							if (animation_options.pingpong) {
								// In pingpong animations the end is when the frame goes below 0
								if (currentFrame < 0) {
									if (currentSpriteSheet > 0) {
										currentSpriteSheet -= 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = options.numberOfFrame - 1;
									} else {
										options.frameIncrement = 1;
										if (animation_options.once) {
											currentFrame = 0;
											options.idleCounter = 1;
											this.endAnimation = true;
										} else {
											// The first frame has already been displayed, start from the second
											if (options.numberOfFrame > 1) {
												currentFrame = 1;
											} else if (options.lastSpriteSheet > 0) {
												currentSpriteSheet += 1;
												options.currentSpriteSheet = currentSpriteSheet;
												options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
												currentFrame = 0;
											} else {
												currentFrame = 0;
											}
										}

										// Update the details before the callback
										options.currentFrame = currentFrame;

										if (callback) {
											callback.call(this, this);
										}
									}
								} else if (currentFrame >= options.numberOfFrame) {
									if (currentSpriteSheet < options.lastSpriteSheet) {
										currentSpriteSheet += 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = 0;
									} else {
										// Last frame reached, change animation direction
										options.frameIncrement = -1;
										if (options.numberOfFrame > 1) {
											currentFrame -= 2;
										} else if (options.lastSpriteSheet > 0) {
											currentSpriteSheet -= 1;
											options.currentSpriteSheet = currentSpriteSheet;
											options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
											currentFrame = options.numberOfFrame - 1;
										} else {
											currentFrame -= 1;
										}
										options.currentFrame = currentFrame;
									}
								} else {
									// This is no particular frame, simply update the details
									options.currentFrame = currentFrame;
								}
							} else {
								// Normal animation
								if (currentFrame >= options.numberOfFrame) {
									if (currentSpriteSheet < options.lastSpriteSheet) {
										currentSpriteSheet += 1;
										options.currentSpriteSheet = currentSpriteSheet;
										options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
										options.currentFrame = 0;
									} else {
										// Last frame reached
										if (animation_options.once) {
											currentFrame -= 1;
											options.idleCounter = 1;
											this.endAnimation = true;
										} else {
											currentSpriteSheet = 0;
											options.currentSpriteSheet = currentSpriteSheet;
											options.numberOfFrame = animation_options.frameset[currentSpriteSheet].numberOfFrame;
											currentFrame = 0;
										}

										// Update the details before the callback
										options.currentFrame = currentFrame;

										if (callback) {
											callback.call(this, this);
										}
									}
								} else {
									// This is no particular frame, simply update the details
									options.currentFrame = currentFrame;
								}
							}
						}
					}
				} else {
					// Make sure that the callback is called even if there is no animation
					if (callback) {
						callback.call(this, this);
					}
				}
			}

			fg.PBaseSprite.update.call(this);
		}
	});

	fg.Sprite = fg.Maker(fg.PSprite);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PSpriteGroup = Object.create(fg.PBaseSprite);
	fg.extend(fg.PSpriteGroup, {
		init: function (name, options, parent) {
			var
				my_options,
				new_options = options || {}
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			fg.extend(my_options, {
				// Public options
				background: null,
				backgroundType: fg.BACKGROUND_TILED,
				mask: null,
				maskType: fg.MASK_TILED,
				crop: false,
				borderTopLeftRadius: 0,
				borderTopRightRadius: 0,
				borderBottomRightRadius: 0,
				borderBottomLeftRadius: 0,
				borderWidth: 1,
				borderColor: null,

				// Implementation details
				hasBorder: false
			});

			// The playground has a parentDOM property
			if (new_options.parentDOM) {
				this.parentDOM = new_options.parentDOM;
			}

			this.layers = [];

			fg.PBaseSprite.init.apply(this, arguments);

			this.updateList = [];

			this.clearing = false;

			// If the background has not been defined, force
			// the background to null in order to be
			// symmetric with the sprite and setAnimation
			if (new_options.background === undefined) {
				new_options.background = null;
			}

			if (new_options.mask === undefined) {
				new_options.mask = null;
			}

			this.setBackground(new_options);
			this.setMask(new_options);
			this.setBorder(new_options);
		},

		// Public functions

		remove: function () {
			this.clear();

			fg.PBaseSprite.remove.apply(this, arguments);
		},

		resize: function (options) {
			var
				new_options = {},
				set_new_options = false,
				parent
			;

			// Set the new options
			fg.PBaseSprite.resize.call(this, options);

			if (this.parent) {
				parent = fg.s[this.parent];

				// A width of 0 means the same width as the parent
				if (!this.width) {
					new_options.width = parent.width;
					set_new_options = true;
				}

				// A height of 0 means the same height as the parent
				if (!this.height) {
					new_options.height = parent.height;
					set_new_options = true;
				}

				if (set_new_options) {
					fg.PBaseSprite.resize.call(this, new_options);
				}
			}

			return this;
		},

		clear: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			this.clearing = true;

			for (i = 0; i < len_layers; i += 1) {
				layers[i].obj.remove();
			}

			this.clearing = false;

			this.layers.splice(0, len_layers);
			this.updateList.splice(0, this.updateList.length);

			this.checkUpdate();

			return this;
		},

		children: function (callback) {
			var
				layers = this.layers,
				len_layers = layers.length,
				layer,
				layer_obj,
				retval,
				i
			;

			if (callback) {
				for (i = 0; i < len_layers; i += 1) {
					layer = layers[i];
					if (layer) {
						layer_obj = layer.obj;
						retval = callback.call(layer_obj, layer_obj);
						if (retval) {
							break;
						}
					}
				}
			}

			return this;
		},

		setBackground: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				new_background = new_options.background
			;

			if (new_background !== undefined) {
				if (new_background) {
					if (typeof new_background === 'string') {
						my_options.background = fg.r[new_background] || null;
					} else {
						my_options.background = new_background;
					}
				} else {
					my_options.background = null;
				}

				if (root.console && new_background && (!my_options.background)) {
					console.error('Background with name ' + new_background + ' does not exist');
					console.trace();
				}
			}

			if (new_options.backgroundType !== undefined) {
				my_options.backgroundType = new_options.backgroundType;
			}

			return this;
		},

		setMask: function (options) {
			var
				my_options = this.options,
				new_options = options || {}
			;

			if (new_options.mask !== undefined) {
				my_options.mask = fg.r[new_options.mask] || null;

				if (root.console && new_options.mask && (!my_options.mask)) {
					console.error('Mask with name ' + new_options.mask + ' does not exist');
					console.trace();
				}
			}

			if (new_options.maskType !== undefined) {
				my_options.maskType = new_options.maskType;
			}

			return this;
		},

		setBorder: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				new_border = new_options.borderColor,
				borderRadius = new_options.borderRadius,
				max = Math.max,
				radius_length,
				round = fg.truncate
			;

			if (new_border !== undefined) {
				if (new_border) {
					if (typeof new_border === 'string') {
						my_options.borderColor = fg.r[new_border] || null;
					} else {
						my_options.borderColor = new_border;
					}
				} else {
					my_options.borderColor = null;
				}

				if (root.console && new_border && (!my_options.borderColor)) {
					console.error('Color with name ' + new_border + ' does not exist');
					console.trace();
				}
			}

			// Support the borderRadius shorthand property both as a single number and
			// as an array, in order to set the radius for multiple corners at once
			if (borderRadius !== undefined) {
				if (typeof borderRadius === 'number') {
					borderRadius = max(round(borderRadius), 0) || 0;
					my_options.borderTopLeftRadius = borderRadius;
					my_options.borderTopRightRadius = borderRadius;
					my_options.borderBottomRightRadius = borderRadius;
					my_options.borderBottomLeftRadius = borderRadius;
				} else {
					radius_length = borderRadius.length;
					if (radius_length >= 4) {
						my_options.borderTopLeftRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderTopRightRadius = max(round(borderRadius[1]), 0) || 0;
						my_options.borderBottomRightRadius = max(round(borderRadius[2]), 0) || 0;
						my_options.borderBottomLeftRadius = max(round(borderRadius[3]), 0) || 0;
					} else if (radius_length === 3) {
						my_options.borderTopLeftRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderTopRightRadius = max(round(borderRadius[1]), 0) || 0;
						my_options.borderBottomRightRadius = max(round(borderRadius[2]), 0) || 0;
						my_options.borderBottomLeftRadius = max(round(borderRadius[1]), 0) || 0;
					} else if (radius_length === 2) {
						my_options.borderTopLeftRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderTopRightRadius = max(round(borderRadius[1]), 0) || 0;
						my_options.borderBottomRightRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderBottomLeftRadius = max(round(borderRadius[1]), 0) || 0;
					} else {
						my_options.borderTopLeftRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderTopRightRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderBottomRightRadius = max(round(borderRadius[0]), 0) || 0;
						my_options.borderBottomLeftRadius = max(round(borderRadius[0]), 0) || 0;
					}
				}
			}

			if (new_options.borderTopLeftRadius !== undefined) {
				my_options.borderTopLeftRadius = max(round(new_options.borderTopLeftRadius), 0) || 0;
			}

			if (new_options.borderTopRightRadius !== undefined) {
				my_options.borderTopRightRadius = max(round(new_options.borderTopRightRadius), 0) || 0;
			}

			if (new_options.borderBottomRightRadius !== undefined) {
				my_options.borderBottomRightRadius = max(round(new_options.borderBottomRightRadius), 0) || 0;
			}

			if (new_options.borderBottomLeftRadius !== undefined) {
				my_options.borderBottomLeftRadius = max(round(new_options.borderBottomLeftRadius), 0) || 0;
			}

			if (new_options.borderWidth !== undefined) {
				my_options.borderWidth = max(round(new_options.borderWidth), 0) || 0;
			}

			if (my_options.borderColor && my_options.borderWidth) {
				my_options.hasBorder = true;
			} else {
				my_options.hasBorder = false;
			}

			return this;
		},

		crop: function (cropping) {
			var
				options = this.options
			;

			if (cropping === undefined) {
				return options.crop;
			}

			options.crop = cropping;

			return this;
		},

		addSprite: function (name, options) {
			var
				sprite = fg.Sprite(name, options, this.name)
			;

			this.layers.push({name: name, obj: sprite});

			this.checkUpdate();

			return this;
		},

		insertSprite: function (name, options) {
			var
				sprite = fg.Sprite(name, options, this.name)
			;

			this.layers.unshift({name: name, obj: sprite});

			this.checkUpdate();

			return this;
		},

		addGroup: function (name, options) {
			var
				group = fg.SpriteGroup(name, options, this.name)
			;

			this.layers.push({name: name, obj: group});

			this.checkUpdate();

			return group;
		},

		insertGroup: function (name, options) {
			var
				group = fg.SpriteGroup(name, options, this.name)
			;

			this.layers.unshift({name: name, obj: group});

			this.checkUpdate();

			return group;
		},

		end: function () {
			var
				parent = this.parent
			;

			if (!parent) {
				parent = this.name;
			}

			return fg.s[parent];
		},

		// Implementation details

		checkUpdate: function () {
			var
				oldNeedsUpdate = this.needsUpdate
			;

			if ((this.callbacks.length === 0) && (this.layers.length === 0)) {
				this.needsUpdate = false;
			} else {
				this.needsUpdate = true;
			}

			this.updateNeedsUpdate(oldNeedsUpdate);
		},

		update: function () {
			var
				update_list = this.updateList,
				len_update_list = update_list.length,
				i
			;

			for (i = 0; i < len_update_list; i += 1) {
				if (update_list[i]) {
					update_list[i].obj.update();
				}
			}

			fg.PBaseSprite.update.call(this);
		},

		draw: function (interp) {
			var
				round = Math.round,
				left = round((this.left * interp) + (this.prevLeft * (1 - interp))),
				top = round((this.top * interp) + (this.prevTop * (1 - interp))),
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			fg.absLeft += left;
			fg.absTop += top;

			for (i = 0; i < len_layers; i += 1) {
				layers[i].obj.draw(interp);
			}

			fg.absLeft -= left;
			fg.absTop -= top;
		}
	});

	fg.SpriteGroup = fg.Maker(fg.PSpriteGroup);

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg, {
		// Public functions

		playground: function (dom) {
			var
				i,
				playground = fg.s.playground,
				playground_callbacks = fg.playgroundCallbacks,
				len_playground_callbacks = playground_callbacks.length
			;

			if (!playground) {
				if (typeof document !== 'undefined') {
					// Browser
					if (typeof dom === 'string') {
						// Allow the ID to start with the '#' symbol
						if (dom[0] === '#') {
							dom = dom.split('#')[1];
						}

						dom = document.getElementById(dom);
					} else if (!dom) {
						// Default to the element with id of 'playground'
						dom = document.getElementById('playground');
					} else if (dom.jquery) {
						dom = dom.get(0);
					}
				} else {
					// Node.js
					if ((!dom) || (typeof dom === 'string')) {
						dom = {};
					}

					if (!(dom.offsetWidth)) {
						dom.offsetWidth = 300;
					}

					if (!(dom.offsetHeight)) {
						dom.offsetHeight = 150;
					}
				}

				playground = fg.SpriteGroup('playground', {width: dom.offsetWidth, height: dom.offsetHeight, parentDOM: dom}, '');

				// The playground cannot be resized or moved
				playground.resize = null;
				playground.move = null;
				playground.crop = null;

				// Call the playgroundCallbacks only after the playground has been completely created
				for (i = 0; i < len_playground_callbacks; i += 1) {
					playground_callbacks[i].call(playground, dom);
				}
				playground_callbacks.splice(0, len_playground_callbacks);

				if (fg.running && (fg.idDraw === null)) {
					fg.accumulator = 0;
					fg.currentTime = performance.now();
					fg.idDraw = requestAnimFrame(fg.draw);
				}
			}

			return playground;
		},

		startGame: function (callback) {
			var
				resourceManager = fg.resourceManager
			;

			fg.running = true;

			if (callback !== undefined) {
				if (root.console && callback && resourceManager.completeCallback) {
					if (root.console) {
						console.warn('Overriding the existing startGame callback');
						console.trace();
					}
				}

				resourceManager.completeCallback = callback;
			}

			// Call preload() now, in order to have the resources initialize
			// inside the function that called startGame. This is useful for
			// preloading sounds in mobile environments, for example, where
			// the sounds will not load if audio.load() is not called in an user
			// event handler such as mousedown.
			resourceManager.preload();

			if (resourceManager.idPreload === null) {
				resourceManager.idPreload = setInterval(resourceManager.preload, 100);
			}

			return this;
		},

		stopGame: function () {
			fg.running = false;

			return this;
		},

		loadCallback: function (callback) {
			fg.resourceManager.loadCallback = callback;

			return this;
		},

		startCallback: function (callback) {
			fg.resourceManager.startCallbacks.push(callback);

			return this;
		},

		playgroundCallback: function (callback) {
			var
				playground = fg.s.playground
			;

			if (!playground) {
				fg.playgroundCallbacks.push(callback);
			} else {
				setTimeout(function () {
					callback.call(playground, playground.parentDOM);
				}, 0);
			}

			return this;
		},

		forceRedraw: function () {
			if (fg.idDraw === null) {
				fg.idDraw = requestAnimFrame(fg.draw);
			}

			return this;
		},

		// Implementation details

		draw: function (timestamp) {
			var
				playground = fg.s.playground,
				dt = fg.REFRESH_RATE,
				numUpdateSteps = 0,
				accumulator = fg.accumulator,
				newTime = timestamp, //performance.now(),
				frameTime = newTime - fg.currentTime
			;

			if (fg.running) {
				fg.idDraw = requestAnimFrame(fg.draw);

				fg.currentTime = newTime;
				accumulator += frameTime;

				if (accumulator >= dt) {
					while (accumulator >= dt) {
						playground.update();
						accumulator -= dt;

						fg.frameCounter += 1;

						// Avoid the spiral of death
						numUpdateSteps += 1;
						if (numUpdateSteps >= 240) {
							accumulator = 0;
							// TO DO -- Maybe a callback should be called here
							break;
						}
					}
				}

				fg.accumulator = accumulator;
			} else {
				fg.idDraw = null;
			}

			playground.draw(accumulator / dt);
		},

		insidePlayground: function (left, top, width, height) {
			var
				playground = fg.s.playground,
				sprite_left = fg.absLeft + left,
				sprite_top = fg.absTop + top
			;

			return	(!(
					((sprite_top + height) <= 0)
				||	(sprite_top >= playground.height)
				||	(sprite_left >= playground.width)
				||	((sprite_left + width) <= 0)
			));
		}
	});

	return fg;
}));

