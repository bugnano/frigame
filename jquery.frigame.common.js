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
		ANIMATION_MULTI: 16,		// The image file contains many animations

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

		drawDone: true,

		PrototypeBaseAnimation: {
			default_options: {
				// Public options
				numberOfFrame: 1,
				rate: friGame.refreshRate,
				type: 0,
				offsetx: 0,
				offsety: 0,
				frameWidth: 0,
				frameHeight: 0
			},

			default_details: {
				// Implementation details
				imageURL: '',
				img: null,
				halfWidth: 0,
				halfHeight: 0,
				deltax: 0,
				deltay: 0,
				multix: 0,
				multiy: 0,
				once: false
			},

			init: function (imageURL, options) {
				var
					img,
					details = Object.create(this.default_details)
				;

				this.options = Object.create(this.default_options);
				options = $.extend(this.options, options);

				this.details = details;

				options.rate = Math.round(options.rate / friGame.refreshRate);
				if (options.rate === 0) {
					options.rate = 1;
				}

				details.imageURL = imageURL;

				if (friGame.images[imageURL]) {
					img = friGame.images[imageURL];
				} else {
					img = new Image();
					img.src = imageURL;
					friGame.images[imageURL] = img;
				}

				details.img = img;

				friGame.animations.push(this);
			},

			// Implementation details

			onLoad: function () {
				var
					options = this.options,
					details = this.details,
					img = details.img,
					round = Math.round
				;

				if (options.type & friGame.ANIMATION_HORIZONTAL) {
					// On horizontal animations the frameWidth parameter is optional
					if (!options.frameWidth) {
						options.frameWidth = round((img.width - options.offsetx) / options.numberOfFrame);
					}

					if (options.type & friGame.ANIMATION_MULTI) {
						// On multi horizontal animations the frameHeight parameter is required
						details.deltax = options.frameWidth;
						details.deltay = 0;
						details.multix = 0;
						details.multiy = options.frameHeight;
					} else {
						// On multi horizontal animations the frameHeight parameter is optional
						if (!options.frameHeight) {
							options.frameHeight = img.height - options.offsety;
						}

						details.deltax = options.frameWidth;
						details.deltay = 0;
						details.multix = 0;
						details.multiy = 0;
					}
				} else if (options.type & friGame.ANIMATION_VERTICAL) {
					// On vertical animations the frameHeight parameter is optional
					if (!options.frameHeight) {
						options.frameHeight = round((img.height - options.offsety) / options.numberOfFrame);
					}

					if (options.type & friGame.ANIMATION_MULTI) {
						// On multi vertical animations the frameWidth parameter is required
						details.deltax = 0;
						details.deltay = options.frameHeight;
						details.multix = options.frameWidth;
						details.multiy = 0;
					} else {
						// On multi vertical animations the frameWidth parameter is optional
						if (!options.frameWidth) {
							options.frameWidth = img.width - options.offsetx;
						}

						details.deltax = 0;
						details.deltay = options.frameHeight;
						details.multix = 0;
						details.multiy = 0;
					}
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

					details.deltax = 0;
					details.deltay = 0;
					details.multix = 0;
					details.multiy = 0;
				}

				details.halfWidth = round(options.frameWidth / 2);
				details.halfHeight = round(options.frameHeight / 2);

				if (options.type & friGame.ANIMATION_ONCE) {
					details.once = true;
				}
			}
		},

		Animation: function () {
			var
				animation = Object.create(friGame.PrototypeAnimation)
			;

			animation.init.apply(animation, arguments);

			return animation;
		},

		PrototypeBaseSprite: {
			default_options: {
				// Public options
				animation: null,
				animationIndex: 0,
				callback: null,
				posx: 0,
				posy: 0,
				xpos: friGame.XPOS_LEFT,
				ypos: friGame.YPOS_TOP,

				// Implementation details
				factor: 1,

				// DOM specific
				oldLeft: 0,
				oldTop: 0,
				oldAngle: 0,
				oldFactor: 1,
				oldFactorh: 1,
				oldFactorv: 1
			},

			default_details: {
				// Implementation details
				left: 0,
				top: 0,
				translatex: 0,
				translatey: 0,
				idleCounter: 0,
				currentFrame: 0,
				multix: 0,
				multiy: 0,
				angle: 0,

				fliph: 1,
				flipv: 1,

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
					animation_details,
					animation_redefined = new_options.animation !== undefined,
					index_redefined = new_options.animationIndex !== undefined
				;

				// Set the new options
				$.extend(my_options, new_options);

				animation = my_options.animation;
				if (animation) {
					animation_options = animation.options;
					animation_details = animation.details;
				}

				if (animation_redefined) {
					if (animation) {
						my_details.translatex = round(my_details.left + animation_details.halfWidth);
						my_details.translatey = round(my_details.top + animation_details.halfHeight);
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

						my_details.multix = index * animation_details.multix;
						my_details.multiy = index * animation_details.multiy;
					} else {
						my_details.multix = 0;
						my_details.multiy = 0;
					}
				}

				if (animation_redefined || index_redefined) {
					my_details.idleCounter = 0;
					my_details.currentFrame = 0;
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
					animation_options,
					animation_details
				;

				// Set the new options
				$.extend(my_options, new_options);

				if (animation) {
					animation_options = animation.options;
					animation_details = animation.details;

					xpos = my_options.xpos;
					if (xpos === friGame.XPOS_CENTER) {
						left = my_options.posx - animation_details.halfWidth;
					} else if (xpos === friGame.XPOS_RIGHT) {
						left = my_options.posx - animation_options.frameWidth;
					} else {
						left = my_options.posx;
					}

					ypos = my_options.ypos;
					if (ypos === friGame.YPOS_CENTER) {
						top = my_options.posy - animation_details.halfHeight;
					} else if (ypos === friGame.YPOS_BOTTOM) {
						top = my_options.posy - animation_options.frameHeight;
					} else {
						top = my_options.posy;
					}

					my_details.translatex = round(left + animation_details.halfWidth);
					my_details.translatey = round(top + animation_details.halfHeight);
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

			scale: function (factor) {
				var
					options = this.options
				;

				options.factor = factor;

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
					animation_details,
					currentFrame = details.currentFrame
				;

				if (!this.endAnimation) {
					if (animation) {
						animation_options = animation.options;
						animation_details = animation.details;

						details.idleCounter += 1;
						if (details.idleCounter >= animation_options.rate) {
							details.idleCounter = 0;
							currentFrame += 1;
							if (currentFrame >= animation_options.numberOfFrame) {
								if (animation_details.once) {
									currentFrame -= 1;
									details.idleCounter = 1;
									this.endAnimation = true;
								} else {
									currentFrame = 0;
								}

								if (callback) {
									callback.call(this, this);
								}
							}
							details.currentFrame = currentFrame;
						}
					} else {
						// Make sure that the callback is called even if there is no animation
						if (callback) {
							callback.call(this, this);
						}
					}
				}
			}
		},

		Sprite: function () {
			var
				sprite = Object.create(friGame.PrototypeSprite)
			;

			sprite.init.apply(sprite, arguments);

			return sprite;
		},

		PrototypeBaseSpriteGroup: {
			init: function (name, parent) {
				friGame.groups[name] = this;

				this.layers = [];
				this.name = name;
				this.parent = parent;
			},

			// Public functions

			addSprite: function (name, options) {
				var
					sprite = friGame.Sprite(name, options, this)
				;

				this.layers.push({name: name, obj: sprite});

				return this;
			},

			addGroup: function (name) {
				var
					group = friGame.SpriteGroup(name, this)
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
				var
					layers = this.layers,
					len_layers = layers.length,
					i
				;

				for (i = 0; i < len_layers; i += 1) {
					layers[i].obj.hide();
				}
			},

			show: function () {
				var
					layers = this.layers,
					len_layers = layers.length,
					i
				;

				for (i = 0; i < len_layers; i += 1) {
					layers[i].obj.show();
				}
			},

			remove: function () {
				var
					layers = this.layers,
					parent = this.parent,
					parent_layers = parent.layers,
					len_parent_layers = parent_layers.length,
					name = this.name,
					i
				;

				while (layers.length) {
					layers[0].remove();
				}

				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						parent_layers.splice(i, 1);
						break;
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
		},

		SpriteGroup: function () {
			var
				group = Object.create(friGame.PrototypeSpriteGroup)
			;

			group.init.apply(group, arguments);

			return group;
		},

		// Public functions

		playground: function () {
			var
				scenegraph = friGame.groups.scenegraph
			;

			if (!scenegraph) {
				scenegraph = friGame.SpriteGroup('scenegraph', null);
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

