/*global jQuery,  */
/*jslint bitwise: true, forin: true, sloppy: true, white: true, browser: true */

// Copyright (c) 2011-2012 Franco Bugnano

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

// Prototypal Inheritance by Douglas Crockford
if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}

// shim layer with setTimeout fallback by Paul Irish
if (!window.requestAnimFrame) {
	window.requestAnimFrame = (function () {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (callback) {
				window.setTimeout(callback, 1000 / 60);
			};
	}());
}

// Date.now() by Mozilla
if (!Date.now) {
	Date.now = function () {
		return (new Date()).getTime();
	};
}

// The friGame namespace
var friGame = {};

(function ($, fg) {
	$.extend(fg, {
		// Public constants

		// constants for the different type of an animation
		ANIMATION_VERTICAL: 1,		// genertated by a verical offset of the background
		ANIMATION_HORIZONTAL: 2,	// genertated by a horizontal offset of the background
		ANIMATION_ONCE: 4,			// played only once (else looping indefinitly)
		ANIMATION_PINGPONG: 32,		// at the last frame of the animation it reverses

		GRADIENT_VERTICAL: 0,
		GRADIENT_HORIZONTAL: 1,

		// Implementation details

		refreshRate: 30
	});

	$.extend(fg, {
		// Public options

		cssClass: 'friGame',

		sprites: {},

		// Implementation details

		idUpdate: null,
		drawDone: true
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	// Return a new object with only the keys defined in the keys array parameter
	fg.pick = function (obj, keys) {
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
	};

	// Perform a member to member comparison of two objects to determine if they are equal
	fg.isEqual = function (a, b) {
		var
			key,
			num_keys_a = 0,
			num_keys_b = 0,
			result = true
		;

		for (key in a) {
			if (a[key] === undefined) {
				if (b[key] !== undefined) {
					result = false;
					break;
				}
			} else {
				num_keys_a += 1;
				if (a[key] !== b[key]) {
					result = false;
					break;
				}
			}
		}

		if (result) {
			for (key in b) {
				if (b[key] !== undefined) {
					num_keys_b += 1;
				}
			}

			result = num_keys_a === num_keys_b;
		}

		return result;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.resourceManager = {
		// Public options

		// Implementation details
		idPreload: null,
		images: {},
		animations: [],
		loadCallback: null,
		startCallbacks: [],
		completeCallback: null,

		// Public functions

		// Implementation details

		preload: function () {
			var
				resourceManager = fg.resourceManager,
				animations = resourceManager.animations,
				len_animations = animations.length,
				completed = 0,
				loadCallback = resourceManager.loadCallback,
				start_callbacks = resourceManager.startCallbacks,
				len_start_callbacks = start_callbacks.length,
				i
			;

			for (i = 0; i < len_animations; i += 1) {
				if (animations[i].complete()) {
					completed += 1;
				}
			}

			if (loadCallback) {
				if (len_animations !== 0) {
					loadCallback(completed / len_animations);
				} else {
					loadCallback(1);
				}
			}

			if (completed === len_animations) {
				if (loadCallback) {
					resourceManager.loadCallback = null;
				}

				clearInterval(resourceManager.idPreload);
				resourceManager.idPreload = null;

				for (i = 0; i < len_animations; i += 1) {
					animations[i].onLoad();
				}

				for (i = 0; i < len_start_callbacks; i += 1) {
					start_callbacks[i]();
				}
				start_callbacks.splice(0, len_start_callbacks);

				if (resourceManager.completeCallback) {
					resourceManager.completeCallback();
					resourceManager.completeCallback = null;
				}

				if (fg.idUpdate === null) {
					fg.idUpdate = setInterval(fg.update, fg.refreshRate);
				}
			}
		}
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PRect = {
		init: function (options) {
			// Set default options
			$.extend(this, {
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
				round = Math.floor,
				change_radius
			;

			// width MUST have priority over halfWidth
			if (new_options.width !== undefined) {
				this.width = round(new_options.width);
				this.halfWidth = round(new_options.width / 2);
				change_radius = true;
			} else if (new_options.halfWidth !== undefined) {
				this.width = round(new_options.halfWidth * 2);
				this.halfWidth = round(new_options.halfWidth);
				change_radius = true;
			} else {
				// No width is being redefined
				change_radius = false;
			}

			// height MUST have priority over halfHeight
			if (new_options.height !== undefined) {
				this.height = round(new_options.height);
				this.halfHeight = round(new_options.height / 2);
				change_radius = true;
			} else if (new_options.halfHeight !== undefined) {
				this.height = round(new_options.halfHeight * 2);
				this.halfHeight = round(new_options.halfHeight);
				change_radius = true;
			} else {
				// No height is being redefined
				change_radius = false;
			}

			if (change_radius) {
				this.radius = Math.max(this.halfWidth, this.halfHeight);
			} else {
				// Check if the radius is redefined only if width or height are not redefined
				if (new_options.radius !== undefined) {
					this.radius = round(new_options.radius);

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
				round = Math.floor,
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

		collidePointRect: function (x, y) {
			return	(
					((x >= this.left) && (x < this.right))
				&&	((y >= this.top) && (y < this.bottom))
			);
		},

		collideRect: function (otherRect) {
			var
				my_left = this.left,
				my_right = this.right,
				my_top = this.top,
				my_bottom = this.bottom,
				other_left = otherRect.left,
				other_right = otherRect.right,
				other_top = otherRect.top,
				other_bottom = otherRect.bottom
			;

			return	(
						(
							((my_left >= other_left) && (my_left < other_right))
						||	((other_left >= my_left) && (other_left < my_right))
						)
					&&	(
							((my_top >= other_top) && (my_top < other_bottom))
						||	((other_top >= my_top) && (other_top < my_bottom))
						)
			);
		},

		collidePointCircle: function (x, y) {
			var
				dx = x - this.centerx,
				dy = y - this.centery,
				radius = this.radius
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
		}
	};

	fg.Rect = function () {
		var
			rect = Object.create(fg.PRect)
		;

		rect.init.apply(rect, arguments);

		return rect;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PAnimation = {
		init: function (imageURL, options) {
			var
				my_options,
				img,
				resourceManager = fg.resourceManager
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			$.extend(my_options, {
				// Public options
				numberOfFrame: 1,
				rate: fg.refreshRate,
				type: 0,
				offsetx: 0,
				offsety: 0,
				frameWidth: 0,
				frameHeight: 0,

				// Implementation details
				imageURL: '',
				img: null,
				halfWidth: 0,
				halfHeight: 0,
				deltax: 0,
				deltay: 0,
				multix: 0,
				multiy: 0,
				once: false,
				pingpong: false
			});

			options = $.extend(my_options, options);

			options.rate = Math.round(options.rate / fg.refreshRate);
			if (options.rate === 0) {
				options.rate = 1;
			}

			my_options.imageURL = imageURL;

			if (resourceManager.images[imageURL]) {
				img = resourceManager.images[imageURL];
			} else {
				img = new Image();
				img.src = imageURL;
				resourceManager.images[imageURL] = img;
			}

			my_options.img = img;

			resourceManager.animations.push(this);
		},

		// Public functions

		width: function () {
			return this.options.frameWidth;
		},

		height: function () {
			return this.options.frameHeight;
		},

		// Implementation details

		complete: function () {
			return this.options.img.complete;
		},

		onLoad: function () {
			var
				options = this.options,
				img = options.img,
				round = Math.floor
			;

			if (options.type & fg.ANIMATION_HORIZONTAL) {
				// On horizontal animations the frameWidth parameter is optional
				if (!options.frameWidth) {
					options.frameWidth = round((img.width - options.offsetx) / options.numberOfFrame);
				}

				// On multi horizontal animations the frameHeight parameter is required
				if (!options.frameHeight) {
					options.frameHeight = img.height - options.offsety;
				}

				options.deltax = options.frameWidth;
				options.deltay = 0;
				options.multix = 0;
				options.multiy = options.frameHeight;
			} else if (options.type & fg.ANIMATION_VERTICAL) {
				// On multi vertical animations the frameWidth parameter is required
				if (!options.frameWidth) {
					options.frameWidth = img.width - options.offsetx;
				}

				// On vertical animations the frameHeight parameter is optional
				if (!options.frameHeight) {
					options.frameHeight = round((img.height - options.offsety) / options.numberOfFrame);
				}

				options.deltax = 0;
				options.deltay = options.frameHeight;
				options.multix = options.frameWidth;
				options.multiy = 0;
			} else {
				// Neither horizontal, nor vertical animation. Force single frame
				options.numberOfFrame = 1;

				// On single frame animations the frameWidth parameter is optional
				if (!options.frameWidth) {
					options.frameWidth = img.width - options.offsetx;
				}

				// On single frame animations the frameHeight parameter is optional
				if (!options.frameHeight) {
					options.frameHeight = img.height - options.offsety;
				}

				options.deltax = 0;
				options.deltay = 0;
				options.multix = 0;
				options.multiy = 0;
			}

			options.halfWidth = round(options.frameWidth / 2);
			options.halfHeight = round(options.frameHeight / 2);

			if (options.type & fg.ANIMATION_ONCE) {
				options.once = true;
			}

			if (options.type & fg.ANIMATION_PINGPONG) {
				options.pingpong = true;
			}
		}
	};

	fg.Animation = function () {
		var
			animation = Object.create(fg.PAnimation)
		;

		animation.init.apply(animation, arguments);

		return animation;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PGradient = {
		init: function (startColor, endColor, type) {
			var
				my_options,
				img,
				round = Math.floor
			;

			this.startColor = {
				r: 0,
				g: 0,
				b: 0,
				a: 1
			};

			if (startColor) {
				startColor = $.extend(this.startColor, fg.pick(startColor, ['r', 'g', 'b', 'a']));
				startColor.r = round(startColor.r);
				startColor.g = round(startColor.g);
				startColor.b = round(startColor.b);
			}

			if (endColor) {
				this.endColor = {
					r: 0,
					g: 0,
					b: 0,
					a: 1
				};

				endColor = $.extend(this.endColor, fg.pick(endColor, ['r', 'g', 'b', 'a']));
				endColor.r = round(endColor.r);
				endColor.g = round(endColor.g);
				endColor.b = round(endColor.b);

				if (fg.isEqual(this.startColor, this.endColor)) {
					this.endColor = this.startColor;
				}
			} else {
				this.endColor = this.startColor;
			}

			if (type !== undefined) {
				this.type = type;
			} else {
				this.type = fg.GRADIENT_VERTICAL;
			}
		}
	};

	fg.Gradient = function () {
		var
			gradient = Object.create(fg.PGradient)
		;

		gradient.init.apply(gradient, arguments);

		return gradient;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PBaseSprite = Object.create(fg.PRect);
	$.extend(fg.PBaseSprite, {
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
			$.extend(my_options, {
				// Public options

				// Implementation details
				angle: 0,
				scalex: 1,
				scaley: 1,
				fliph: 1,
				flipv: 1,
				alpha: 1,
				hidden: false,

				scaleh: 1,
				scalev: 1,

				// ieFilter specific
				posOffsetX: 0,
				posOffsetY: 0
			});

			// A public userData property can be useful to the game
			this.userData = null;

			fg.sprites[name] = this;

			// name and parent are public read-only properties
			this.name = name;
			this.parent = parent;

			// Implementation details
			this.callbacks = [];

			// Call PRect.init after setting this.parent
			fg.PRect.init.call(this, options);
		},

		// Public functions

		remove: function () {
			var
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				i
			;

			if (parent) {
				parent_layers = parent.layers;
				len_parent_layers = parent_layers.length;
				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						parent_layers.splice(i, 1);
						break;
					}
				}
			}

			delete fg.sprites[name];
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

			this.options.alpha = alpha;

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

		hidden: function () {
			return this.options.hidden;
		},

		registerCallback: function (callback, rate) {
			rate = Math.round(rate / fg.refreshRate);
			if (rate === 0) {
				rate = 1;
			}

			this.callbacks.push({callback: callback, rate: rate, idleCounter: 0});

			return this;
		},

		// Implementation details

		update: function () {
			var
				callbacks = this.callbacks,
				len_callbacks = callbacks.length,
				callback,
				retval,
				remove_callbacks = [],
				len_remove_callbacks,
				i
			;

			for (i = 0; i < len_callbacks; i += 1) {
				callback = callbacks[i];
				callback.idleCounter += 1;
				if (callback.idleCounter >= callback.rate) {
					callback.idleCounter = 0;
					retval = callback.callback.call(this);
					if (retval) {
						remove_callbacks.unshift(i);
					}
				}
			}

			len_remove_callbacks = remove_callbacks.length;
			for (i = 0; i < len_remove_callbacks; i += 1) {
				callbacks.splice(i, 1);
			}
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PSprite = Object.create(fg.PBaseSprite);
	$.extend(fg.PSprite, {
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
			$.extend(my_options, {
				// Public options
				animation: null,
				animationIndex: 0,
				callback: null,

				// Implementation details
				idleCounter: 0,
				currentFrame: 0,
				frameIncrement: 1,
				multix: 0,
				multiy: 0
			});

			fg.PBaseSprite.init.apply(this, arguments);

			// If the animation has not been defined, force
			// the animation to null in order to resize and move
			// the sprite inside setAnimation
			if (new_options.animation === undefined) {
				new_options.animation = null;
			}

			this.setAnimation(new_options);
		},

		// Public functions

		setAnimation: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				animation,
				index,
				animation_options,
				animation_redefined = new_options.animation !== undefined,
				index_redefined = new_options.animationIndex !== undefined,
				callback_redefined = new_options.callback !== undefined
			;

			if (animation_redefined) {
				animation = new_options.animation;
				my_options.animation = animation;

				// Force new width and height based on the animation frame size
				if (animation) {
					animation_options = animation.options;

					new_options.width = animation_options.frameWidth;
					new_options.height = animation_options.frameHeight;
				} else {
					new_options.width = 0;
					new_options.height = 0;
				}

				// Call the resize method with all the options in order to update the position
				fg.PBaseSprite.resize.call(this, new_options);

				// If the animation gets redefined, set default index of 0
				if ((my_options.animationIndex !== 0) && (!index_redefined)) {
					new_options.animationIndex = 0;
					index_redefined = true;
				}

				// If the animation gets redefined, the callback could be reset here
			}

			if (index_redefined) {
				index = new_options.animationIndex;
				my_options.animationIndex = index;

				animation = my_options.animation;
				if (animation) {
					animation_options = animation.options;

					my_options.multix = index * animation_options.multix;
					my_options.multiy = index * animation_options.multiy;
				} else {
					my_options.multix = 0;
					my_options.multiy = 0;
				}
			}

			if (animation_redefined || index_redefined) {
				my_options.idleCounter = 0;
				my_options.currentFrame = 0;
				my_options.frameIncrement = 1;
				this.endAnimation = false;
			}

			if (callback_redefined) {
				my_options.callback = new_options.callback;
			}

			return this;
		},

		resize: null,	// Sprites cannot be explicitly resized

		// Implementation details

		update: function () {
			var
				options = this.options,
				callback = options.callback,
				animation = options.animation,
				animation_options,
				currentFrame = options.currentFrame
			;

			fg.PBaseSprite.update.call(this);

			if (!this.endAnimation) {
				if (animation) {
					animation_options = animation.options;

					options.idleCounter += 1;
					if (options.idleCounter >= animation_options.rate) {
						options.idleCounter = 0;
						currentFrame += options.frameIncrement;
						if (animation_options.pingpong) {
							// In pingpong animations the end is when the frame goes below 0
							if (currentFrame < 0) {
								options.frameIncrement = 1;
								if (animation_options.once) {
									currentFrame = 0;
									options.idleCounter = 1;
									this.endAnimation = true;
								} else {
									// The first frame has already been displayed, start from the second
									if (animation_options.numberOfFrame > 1) {
										currentFrame = 1;
									} else {
										currentFrame = 0;
									}
								}

								// Update the details before the callback
								options.currentFrame = currentFrame;

								if (callback) {
									callback.call(this, this);
								}
							} else if (currentFrame >= animation_options.numberOfFrame) {
								// Last frame reached, change animation direction
								options.frameIncrement = -1;
								if (animation_options.numberOfFrame > 1) {
									currentFrame -= 2;
								} else {
									currentFrame -= 1;
								}
								options.currentFrame = currentFrame;
							} else {
								// This is no particular frame, simply update the details
								options.currentFrame = currentFrame;
							}
						} else {
							// Normal animation
							if (currentFrame >= animation_options.numberOfFrame) {
								// Last frame reached
								if (animation_options.once) {
									currentFrame -= 1;
									options.idleCounter = 1;
									this.endAnimation = true;
								} else {
									currentFrame = 0;
								}

								// Update the details before the callback
								options.currentFrame = currentFrame;

								if (callback) {
									callback.call(this, this);
								}
							} else {
								// This is no particular frame, simply update the details
								options.currentFrame = currentFrame;
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
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PSpriteGroup = Object.create(fg.PBaseSprite);
	$.extend(fg.PSpriteGroup, {
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
			$.extend(my_options, {
				// Public options

				// Implementation details
			});

			this.layers = [];

			fg.PBaseSprite.init.apply(this, arguments);
		},

		// Public functions

		remove: function () {
			var
				layers = this.layers
			;

			while (layers.length) {
				layers[0].obj.remove();
			}

			fg.PBaseSprite.remove.apply(this, arguments);
		},


		resize: function (options) {
			var
				new_options = {},
				set_new_options = false,
				parent = this.parent
			;

			// Set the new options
			fg.PBaseSprite.resize.call(this, options);

			if (parent) {
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

		addSprite: function (name, options) {
			var
				sprite = fg.Sprite(name, options, this)
			;

			this.layers.push({name: name, obj: sprite});

			return this;
		},

		addGroup: function (name, options) {
			var
				group = fg.SpriteGroup(name, options, this)
			;

			this.layers.push({name: name, obj: group});

			return group;
		},

		end: function () {
			var
				parent = this.parent
			;

			if (!parent) {
				parent = this;
			}

			return parent;
		},

		children: function (callback) {
			var
				layers = this.layers,
				len_layers = layers.length,
				layer,
				i
			;

			if (callback) {
				for (i = 0; i < len_layers; i += 1) {
					layer = layers[i];
					if (layer) {
						callback.call(layer.obj, layer.name);
					}
				}
			}

			return this;
		},

		// Implementation details

		update: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			fg.PBaseSprite.update.call(this);

			for (i = 0; i < len_layers; i += 1) {
				if (layers[i]) {
					layers[i].obj.update();
				}
			}
		},

		draw: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

			for (i = 0; i < len_layers; i += 1) {
				layers[i].obj.draw();
			}
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	$.extend(fg, {
		// Public functions

		playground: function (parentDOM) {
			var
				scenegraph = fg.sprites.scenegraph,
				dom
			;

			if (!scenegraph) {
				if (parentDOM) {
					dom = $(parentDOM);
				} else {
					dom = $('#playground');
				}

				scenegraph = fg.SpriteGroup('scenegraph', {width: dom.width(), height: dom.height(), parentDOM: dom}, null);

				// The scenegraph cannot be resized or moved
				scenegraph.resize = null;
				scenegraph.move = null;
			}

			return scenegraph;
		},

		loadCallback: function (callback) {
			fg.resourceManager.loadCallback = callback;
		},

		startCallback: function (callback) {
			fg.resourceManager.startCallbacks.push(callback);
		},

		startGame: function (callback, rate) {
			var
				resourceManager = fg.resourceManager
			;

			if (rate) {
				fg.refreshRate = rate;
			}

			resourceManager.completeCallback = callback;

			if (resourceManager.idPreload === null) {
				resourceManager.idPreload = setInterval(resourceManager.preload, 100);
			}

			return this;
		},

		stopGame: function () {
			clearInterval(fg.idUpdate);
			fg.idUpdate = null;

			return this;
		},

		// Implementation details

		update: function () {
			var
				scenegraph = fg.sprites.scenegraph
			;

			if (scenegraph) {
				scenegraph.update();

				if (fg.drawDone) {
					fg.drawDone = false;
					window.requestAnimFrame(fg.draw);
				}
			}
		},

		draw: function () {
			fg.sprites.scenegraph.draw();
			fg.drawDone = true;
		}
	});
}(jQuery, friGame));

