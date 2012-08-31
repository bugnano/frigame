/*global jQuery */
/*jslint bitwise: true, sloppy: true, white: true, browser: true */

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
window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback, element) {
			window.setTimeout(callback, 1000 / 60);
		};
}());

// Date.now() by Mozilla
if (!Date.now) {
	Date.now = function () {
		return (new Date()).getTime();
	};
}

(function ($) {
	var
		friGame = {}
	;

	$.friGame = friGame;

	$.extend(friGame, {
		// Public constants

		// constants for the different type of an animation
		ANIMATION_VERTICAL: 1,		// genertated by a verical offset of the background
		ANIMATION_HORIZONTAL: 2,	// genertated by a horizontal offset of the background
		ANIMATION_ONCE: 4,			// played only once (else looping indefinitly)
		ANIMATION_PINGPONG: 32,		// at the last frame of the animation it reverses

		// constants for the various positions
		XPOS_LEFT: 0,
		XPOS_RIGHT: 1,
		XPOS_CENTER: 2,
		YPOS_TOP: 0,
		YPOS_BOTTOM: 1,
		YPOS_CENTER: 2,

		// Implementation details

		refreshRate: 30
	});

	$.extend(friGame, {
		// Public options
		sprites: {},
		groups: {},

		// Implementation details

		images: {},
		animations: [],
		callbacks: [],

		drawDone: true
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeRect = {
		init: function (options) {
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
				radius: 0
			});

			this.last_x = 'left';
			this.last_y = 'top';

			if (this.resize) {
				this.resize(options);
			}
		},

		resize: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				round = Math.round,
				change_radius
			;

			if (new_options.width !== undefined) {
				my_options.width = round(new_options.width);
				my_options.halfWidth = round(new_options.width / 2);
				change_radius = true;
			} else if (new_options.halfWidth !== undefined) {
				my_options.width = round(new_options.halfWidth * 2);
				my_options.halfWidth = round(new_options.halfWidth);
				change_radius = true;
			} else {
				// No width is being redefined
				change_radius = false;
			}

			if (new_options.height !== undefined) {
				my_options.height = round(new_options.height);
				my_options.halfHeight = round(new_options.height / 2);
				change_radius = true;
			} else if (new_options.halfHeight !== undefined) {
				my_options.height = round(new_options.halfHeight * 2);
				my_options.halfHeight = round(new_options.halfHeight);
				change_radius = true;
			} else {
				// No height is being redefined
				change_radius = false;
			}

			if (change_radius) {
				my_options.radius = Math.max(my_options.halfWidth, my_options.halfHeight);
			} else {
				// Check if the radius is redefined only if width or height are not redefined
				if (new_options.radius !== undefined) {
					my_options.radius = round(new_options.radius);

					my_options.width = my_options.radius * 2;
					my_options.halfWidth = my_options.radius;
					my_options.height = my_options.width;
					my_options.halfHeight = my_options.halfWidth;
				}
			}

			if (this.move) {
				this.move(options);
			}

			return this;
		},

		move: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				round = Math.round,
				last_x,
				last_y
			;

			// STEP 1: Memorize the last option that has been redefined

			if (new_options.centerx !== undefined) {
				my_options.centerx = round(new_options.centerx);
				last_x = 'centerx';
			} else if (new_options.right !== undefined) {
				my_options.right = round(new_options.right);
				last_x = 'right';
			} else if (new_options.left !== undefined) {
				my_options.left = round(new_options.left);
				last_x = 'left';
			} else {
				// No x is being redefined
				last_x = this.last_x;
			}

			if (new_options.centery !== undefined) {
				my_options.centery = round(new_options.centery);
				last_y = 'centery';
			} else if (new_options.bottom !== undefined) {
				my_options.bottom = round(new_options.bottom);
				last_y = 'bottom';
			} else if (new_options.top !== undefined) {
				my_options.top = round(new_options.top);
				last_y = 'top';
			} else {
				// No y is being redefined
				last_y = this.last_y;
			}

			// STEP 2: Adjust the other parameters according to the last defined option
			// NOTE: The parameters are adjusted even if no x or y is being redefined because
			// the rect width and height might have changed

			if (last_x === 'centerx') {
				my_options.left = my_options.centerx - my_options.halfWidth;
				my_options.right = my_options.left + my_options.width;
			} else if (last_x === 'right') {
				my_options.left = my_options.right - my_options.width;
				my_options.centerx = my_options.left + my_options.halfWidth;
			} else {
				my_options.centerx = my_options.left + my_options.halfWidth;
				my_options.right = my_options.left + my_options.width;
			}

			if (last_y === 'centery') {
				my_options.top = my_options.centery - my_options.halfHeight;
				my_options.bottom = my_options.top + my_options.height;
			} else if (last_y === 'bottom') {
				my_options.top = my_options.bottom - my_options.height;
				my_options.centery = my_options.top + my_options.halfHeight;
			} else {
				my_options.centery = my_options.top + my_options.halfHeight;
				my_options.bottom = my_options.top + my_options.height;
			}

			this.last_x = last_x;
			this.last_y = last_y;

			return this;
		},

		left: function () {
			return this.options.left;
		},

		right: function () {
			return this.options.right;
		},

		centerx: function () {
			return this.options.centerx;
		},

		top: function () {
			return this.options.top;
		},

		bottom: function () {
			return this.options.bottom;
		},

		centery: function () {
			return this.options.centery;
		},

		width: function () {
			return this.options.width;
		},

		height: function () {
			return this.options.height;
		},

		halfWidth: function () {
			return this.options.halfWidth;
		},

		halfHeight: function () {
			return this.options.halfHeight;
		},

		radius: function () {
			return this.options.radius;
		},

		collidePointRect: function (x, y) {
			var
				options = this.options
			;

			return	(
					((x >= options.left) && (x < options.right))
				&&	((y >= options.top) && (y < options.bottom))
			);
		},

		collideRect: function (otherRect) {
			var
				my_options = this.options,
				other_options = otherRect.options,
				my_left = my_options.left,
				my_right = my_options.right,
				my_top = my_options.top,
				my_bottom = my_options.bottom,
				other_left = other_options.left,
				other_right = other_options.right,
				other_top = other_options.top,
				other_bottom = other_options.bottom
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
				my_options = this.options,
				dx = x - my_options.centerx,
				dy = y - my_options.centery,
				radius = my_options.radius
			;

			return (((dx * dx) + (dy * dy)) < (radius * radius));
		},

		collideCircle: function (otherRect) {
			var
				my_options = this.options,
				other_options = otherRect.options,
				dx = other_options.centerx - my_options.centerx,
				dy = other_options.centery - my_options.centery,
				radii = my_options.radius + other_options.radius
			;

			return (((dx * dx) + (dy * dy)) < (radii * radii));
		}
	};

	friGame.Rect = function () {
		var
			rect = Object.create(friGame.PrototypeRect)
		;

		rect.init.apply(rect, arguments);

		return rect;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeAnimation = {
		init: function (imageURL, options) {
			var
				my_options,
				img
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
				rate: friGame.refreshRate,
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

			options.rate = Math.round(options.rate / friGame.refreshRate);
			if (options.rate === 0) {
				options.rate = 1;
			}

			my_options.imageURL = imageURL;

			if (friGame.images[imageURL]) {
				img = friGame.images[imageURL];
			} else {
				img = new Image();
				img.src = imageURL;
				friGame.images[imageURL] = img;
			}

			my_options.img = img;

			friGame.animations.push(this);
		},

		// Public functions

		width: function () {
			return this.options.frameWidth;
		},

		height: function () {
			return this.options.frameHeight;
		},

		// Implementation details

		onLoad: function () {
			var
				options = this.options,
				img = options.img,
				round = Math.round
			;

			if (options.type & friGame.ANIMATION_HORIZONTAL) {
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
			} else if (options.type & friGame.ANIMATION_VERTICAL) {
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

			if (options.type & friGame.ANIMATION_ONCE) {
				options.once = true;
			}

			if (options.type & friGame.ANIMATION_PINGPONG) {
				options.pingpong = true;
			}
		}
	};

	friGame.Animation = function () {
		var
			animation = Object.create(friGame.PrototypeAnimation)
		;

		animation.init.apply(animation, arguments);

		return animation;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeBaseSprite = {
		default_options: {
			// Public options
			animation: null,
			animationIndex: 0,
			callback: null,
			posx: 0,
			posy: 0,
			xpos: friGame.XPOS_LEFT,
			ypos: friGame.YPOS_TOP
		},

		default_details: {
			// Implementation details
			left: 0,
			top: 0,
			translatex: 0,
			translatey: 0,
			idleCounter: 0,
			currentFrame: 0,
			frameIncrement: 1,
			multix: 0,
			multiy: 0,
			angle: 0,
			scalex: 1,
			scaley: 1,
			fliph: 1,
			flipv: 1,
			hidden: false,

			// ieFilter specific
			posOffsetX: 0,
			posOffsetY: 0
		},

		init: function (name, options, parent) {
			var
				details = Object.create(this.default_details)
			;

			friGame.sprites[name] = this;

			this.name = name;
			this.parent = parent;

			this.options = Object.create(this.default_options);
			options = $.extend(this.options, options);

			this.details = details;

			this.setAnimation(options);
			this.move();
		},

		// Public functions

		setAnimation: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				my_details = this.details,
				round = Math.round,
				animation,
				index,
				animation_options,
				animation_redefined = new_options.animation !== undefined,
				index_redefined = new_options.animationIndex !== undefined
			;

			// Set the new options
			$.extend(my_options, new_options);

			animation = my_options.animation;
			if (animation) {
				animation_options = animation.options;
			}

			if (animation_redefined) {
				if (animation) {
					my_details.translatex = round(my_details.left + animation_options.halfWidth);
					my_details.translatey = round(my_details.top + animation_options.halfHeight);
				} else {
					my_details.translatex = round(my_details.left);
					my_details.translatey = round(my_details.top);
				}

				// If the animation gets redefined, set default index of 0
				if ((my_options.animationIndex !== 0) && (!index_redefined)) {
					my_options.animationIndex = 0;
					index_redefined = true;
				}
			}

			if (index_redefined) {
				if (animation) {
					index = my_options.animationIndex;

					my_details.multix = index * animation_options.multix;
					my_details.multiy = index * animation_options.multiy;
				} else {
					my_details.multix = 0;
					my_details.multiy = 0;
				}
			}

			if (animation_redefined || index_redefined) {
				my_details.idleCounter = 0;
				my_details.currentFrame = 0;
				my_details.frameIncrement = 1;
				this.endAnimation = false;
			}

			return this;
		},

		move: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				my_details = this.details,
				round = Math.round,
				left,
				top,
				xpos,
				ypos,
				animation = my_options.animation,
				animation_options
			;

			// Set the new options
			$.extend(my_options, new_options);

			if (animation) {
				animation_options = animation.options;

				xpos = my_options.xpos;
				if (xpos === friGame.XPOS_CENTER) {
					left = my_options.posx - animation_options.halfWidth;
				} else if (xpos === friGame.XPOS_RIGHT) {
					left = my_options.posx - animation_options.frameWidth;
				} else {
					left = my_options.posx;
				}

				ypos = my_options.ypos;
				if (ypos === friGame.YPOS_CENTER) {
					top = my_options.posy - animation_options.halfHeight;
				} else if (ypos === friGame.YPOS_BOTTOM) {
					top = my_options.posy - animation_options.frameHeight;
				} else {
					top = my_options.posy;
				}

				my_details.translatex = round(left + animation_options.halfWidth);
				my_details.translatey = round(top + animation_options.halfHeight);
			} else {
				left = my_options.posx;
				top = my_options.posy;

				my_details.translatex = round(left);
				my_details.translatey = round(top);
			}

			my_details.left = round(left);
			my_details.top = round(top);

			return this;
		},

		rotate: function (angle) {
			if (angle === undefined) {
				return this.details.angle;
			}

			this.details.angle = angle;

			return this;
		},

		scale: function (scalex, scaley) {
			if (scalex === undefined) {
				return this.details.scalex;
			}

			this.details.scalex = scalex;

			if (scaley === undefined) {
				// If scaley isn't specified, it is assumed to be equal to scalex.
				this.details.scaley = scalex;
			} else {
				this.details.scaley = scaley;
			}

			return this;
		},

		fliph: function (flip) {
			if (flip === undefined) {
				return (this.details.fliph < 0);
			}

			if (flip) {
				this.details.fliph = -1;
			} else {
				this.details.fliph = 1;
			}

			return this;
		},

		flipv: function (flip) {
			if (flip === undefined) {
				return (this.details.flipv < 0);
			}

			if (flip) {
				this.details.flipv = -1;
			} else {
				this.details.flipv = 1;
			}

			return this;
		},

		posx: function () {
			return this.options.posx;
		},

		posy: function () {
			return this.options.posy;
		},

		width: function () {
			var
				animation = this.options.animation,
				w = 0
			;

			if (animation) {
				w = animation.options.frameWidth;
			}

			return w;
		},

		height: function () {
			var
				animation = this.options.animation,
				h = 0
			;

			if (animation) {
				h = animation.options.frameHeight;
			}

			return h;
		},

		hide: function () {
			this.details.hidden = true;

			return this;
		},

		show: function () {
			this.details.hidden = false;

			return this;
		},

		remove: function () {
			var
				parent = this.parent,
				parent_layers = parent.layers,
				len_parent_layers = parent_layers.length,
				name = this.name,
				i
			;

			for (i = 0; i < len_parent_layers; i += 1) {
				if (parent_layers[i].name === name) {
					parent_layers.splice(i, 1);
					break;
				}
			}

			delete friGame.sprites[name];
		},

		// Implementation details

		update: function () {
			var
				options = this.options,
				details = this.details,
				callback = options.callback,
				animation = options.animation,
				animation_options,
				currentFrame = details.currentFrame
			;

			if (!this.endAnimation) {
				if (animation) {
					animation_options = animation.options;

					details.idleCounter += 1;
					if (details.idleCounter >= animation_options.rate) {
						details.idleCounter = 0;
						currentFrame += details.frameIncrement;
						if (animation_options.pingpong) {
							// In pingpong animations the end is when the frame goes below 0
							if (currentFrame < 0) {
								details.frameIncrement = 1;
								if (animation_options.once) {
									currentFrame = 0;
									details.idleCounter = 1;
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
								details.currentFrame = currentFrame;

								if (callback) {
									callback.call(this, this);
								}
							} else if (currentFrame >= animation_options.numberOfFrame) {
								// Last frame reached, change animation direction
								details.frameIncrement = -1;
								if (animation_options.numberOfFrame > 1) {
									currentFrame -= 2;
								} else {
									currentFrame -= 1;
								}
								details.currentFrame = currentFrame;
							} else {
								// This is no particular frame, simply update the details
								details.currentFrame = currentFrame;
							}
						} else {
							// Normal animation
							if (currentFrame >= animation_options.numberOfFrame) {
								// Last frame reached
								if (animation_options.once) {
									currentFrame -= 1;
									details.idleCounter = 1;
									this.endAnimation = true;
								} else {
									currentFrame = 0;
								}

								// Update the details before the callback
								details.currentFrame = currentFrame;

								if (callback) {
									callback.call(this, this);
								}
							} else {
								// This is no particular frame, simply update the details
								details.currentFrame = currentFrame;
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
	};

	friGame.Sprite = function () {
		var
			sprite = Object.create(friGame.PrototypeSprite)
		;

		sprite.init.apply(sprite, arguments);

		return sprite;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeBaseSpriteGroup = {
		default_options: {
			// Public options
			posx: 0,
			posy: 0,
			xpos: friGame.XPOS_LEFT,
			ypos: friGame.YPOS_TOP,
			width: 0,
			height: 0
		},

		default_details: {
			// Implementation details
			left: 0,
			top: 0,
			halfWidth: 0,
			halfHeight: 0,
			hidden: false
		},

		init: function (name, options, parent) {
			var
				details = Object.create(this.default_details)
			;

			friGame.groups[name] = this;

			this.layers = [];
			this.name = name;
			this.parent = parent;

			this.options = Object.create(this.default_options);
			options = $.extend(this.options, options);

			this.details = details;

			this.resize();
		},

		// Public functions

		resize: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				my_details = this.details,
				round = Math.round,
				parent = this.parent
			;

			// Set the new options
			$.extend(my_options, new_options);

			if (parent) {
				// A width of 0 means the same width as the parent
				if (!my_options.width) {
					my_options.width = parent.options.width;
				}

				// A height of 0 means the same height as the parent
				if (!my_options.height) {
					my_options.height = parent.options.height;
				}
			}

			my_details.halfWidth = round(my_options.width / 2);
			my_details.halfHeight = round(my_options.height / 2);

			return this.move();
		},

		move: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				my_details = this.details,
				round = Math.round,
				left,
				top,
				xpos,
				ypos
			;

			// Set the new options
			$.extend(my_options, new_options);

			xpos = my_options.xpos;
			if (xpos === friGame.XPOS_CENTER) {
				left = my_options.posx - my_details.halfWidth;
			} else if (xpos === friGame.XPOS_RIGHT) {
				left = my_options.posx - my_options.width;
			} else {
				left = my_options.posx;
			}

			ypos = my_options.ypos;
			if (ypos === friGame.YPOS_CENTER) {
				top = my_options.posy - my_details.halfHeight;
			} else if (ypos === friGame.YPOS_BOTTOM) {
				top = my_options.posy - my_options.height;
			} else {
				top = my_options.posy;
			}

			my_details.left = round(left);
			my_details.top = round(top);

			return this;
		},

		addSprite: function (name, options) {
			var
				sprite = friGame.Sprite(name, options, this)
			;

			this.layers.push({name: name, obj: sprite});

			return this;
		},

		addGroup: function (name, options) {
			var
				group = friGame.SpriteGroup(name, options, this)
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

		hide: function () {
			this.details.hidden = true;

			return this;
		},

		show: function () {
			this.details.hidden = false;

			return this;
		},

		remove: function () {
			var
				layers = this.layers,
				parent = this.parent,
				parent_layers,
				len_parent_layers,
				name = this.name,
				i
			;

			while (layers.length) {
				layers[0].obj.remove();
			}

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

			delete friGame.groups[name];
		},

		// Implementation details

		update: function () {
			var
				layers = this.layers,
				len_layers = layers.length,
				i
			;

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
	};

	friGame.SpriteGroup = function () {
		var
			group = Object.create(friGame.PrototypeSpriteGroup)
		;

		group.init.apply(group, arguments);

		return group;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	$.extend(friGame, {
		// Public functions

		playground: function (parentDOM) {
			var
				scenegraph = friGame.groups.scenegraph,
				dom
			;

			if (!scenegraph) {
				if (parentDOM) {
					dom = $(parentDOM);
				} else {
					dom = $('#playground');
				}

				scenegraph = friGame.SpriteGroup('scenegraph', {width: dom.width(), height: dom.height(), parentDOM: dom}, null);

				// The scenegraph cannot be resized or moved
				scenegraph.resize = null;
				scenegraph.move = null;
			}

			return scenegraph;
		},

		startGame: function (callback, rate) {
			if (rate) {
				friGame.refreshRate = rate;
			}

			friGame.completeCallback = callback;
			friGame.idPreload = setInterval(friGame.preload, 100);

			return this;
		},

		stopGame: function () {
			clearInterval(friGame.idRefresh);

			return this;
		},

		registerCallback: function (callback, rate) {
			rate = Math.round(rate / friGame.refreshRate);
			if (rate === 0) {
				rate = 1;
			}

			friGame.callbacks.push({callback: callback, rate: rate, idleCounter: 0});

			return this;
		},

		// Implementation details

		preload: function () {
			var
				animations = friGame.animations,
				len_animations = animations.length,
				completed = 0,
				i
			;

			for (i = 0; i < len_animations; i += 1) {
				if (animations[i].details.img.complete) {
					completed += 1;
				}
			}

			if (friGame.loadCallback) {
				if (len_animations !== 0) {
					friGame.loadCallback(completed / len_animations);
				} else {
					friGame.loadCallback(1);
				}
			}

			if (completed === len_animations) {
				clearInterval(friGame.idPreload);

				for (i = 0; i < len_animations; i += 1) {
					animations[i].onLoad();
				}

				$.each(friGame.sprites, function () {
					this.setAnimation(this.options);
					this.move();
				});

				if (friGame.loadCallback) {
					delete friGame.loadCallback;
				}

				if (friGame.completeCallback) {
					friGame.completeCallback();
				}

				friGame.idRefresh = setInterval(friGame.refresh, friGame.refreshRate);
			}
		},

		refresh: function () {
			var
				callbacks = friGame.callbacks,
				len_callbacks = callbacks.length,
				callback,
				retval,
				remove_callbacks = [],
				len_remove_callbacks,
				i,
				scenegraph = friGame.groups.scenegraph
			;

			if (scenegraph) {
				scenegraph.update();

				if (friGame.drawDone) {
					friGame.drawDone = false;
					window.requestAnimFrame(friGame.draw);
				}
			}

			for (i = 0; i < len_callbacks; i += 1) {
				callback = callbacks[i];
				callback.idleCounter += 1;
				if (callback.idleCounter >= callback.rate) {
					callback.idleCounter = 0;
					retval = callback.callback.call(friGame);
					if (retval) {
						remove_callbacks.unshift(i);
					}
				}
			}

			len_remove_callbacks = remove_callbacks.length;
			for (i = 0; i < len_remove_callbacks; i += 1) {
				callbacks.splice(i, 1);
			}
		},

		draw: function () {
			friGame.groups.scenegraph.draw();
			friGame.drawDone = true;
		}
	});
}(jQuery));

