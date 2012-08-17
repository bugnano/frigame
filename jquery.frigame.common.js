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
		fg = {}
	;

	$.friGame = fg;

	$.extend(fg, {
		// "constants" for the different type of an animation
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

		// basic values
		refreshRate: 30,

		animations: [],
		sprites: {},
		groups: {},
		callbacks: [],

		drawDone: true,

		PrototypeBaseAnimation: {
			defaults: {
				imageURL: '',
				numberOfFrame: 1,
				delta: 0,
				rate: 30,
				type: 0,
				distance: 0,
				offsetx: 0,
				offsety: 0,
				frameWidth: 0,
				frameHeight: 0,
				halfWidth: 0,
				halfHeight: 0,
				deltax: 0,
				deltay: 0,
				multix: 0,
				multiy: 0,
				once: false
			},

			init: function (options) {
				var
					img = new Image()
				;

				this.options = Object.create(this.defaults);
				options = $.extend(this.options, options);

				options.rate = Math.round(options.rate / fg.refreshRate);
				if (options.rate === 0) {
					options.rate = 1;
				}

				img.src = options.imageURL;

				fg.animations.push(this);

				this.img = img;
			},

			onLoad: function () {
				var
					options = this.options,
					img = this.img,
					delta = options.delta,
					distance = options.distance
				;

				if (options.type & fg.ANIMATION_HORIZONTAL) {
					if (options.type & fg.ANIMATION_MULTI) {
						options.deltax = delta;
						options.deltay = 0;
						options.multix = 0;
						options.multiy = distance;
						options.frameWidth = delta;
						options.frameHeight = distance;
					} else {
						options.deltax = delta;
						options.deltay = 0;
						options.multix = 0;
						options.multiy = 0;
						options.frameWidth = delta;
						options.frameHeight = img.height - options.offsety;
					}
				} else if (options.type & fg.ANIMATION_VERTICAL) {
					if (options.type & fg.ANIMATION_MULTI) {
						options.deltax = 0;
						options.deltay = delta;
						options.multix = distance;
						options.multiy = 0;
						options.frameWidth = distance;
						options.frameHeight = delta;
					} else {
						options.deltax = 0;
						options.deltay = delta;
						options.multix = 0;
						options.multiy = 0;
						options.frameWidth = img.width - options.offsetx;
						options.frameHeight = delta;
					}
				} else {
					options.deltax = 0;
					options.deltay = 0;
					options.multix = 0;
					options.multiy = 0;
					options.frameWidth = img.width - options.offsetx;
					options.frameHeight = img.height - options.offsety;
				}

				options.halfWidth = ((options.frameWidth / 2) + 0.5) << 0;
				options.halfHeight = ((options.frameHeight / 2) + 0.5) << 0;

				if (options.type & fg.ANIMATION_ONCE) {
					options.once = true;
				}
			}
		},

		Animation: function () {
			var
				animation = Object.create(fg.PrototypeAnimation)
			;

			animation.init.apply(animation, arguments);

			return animation;
		},

		PrototypeBaseSprite: {
			defaults: {
				posx: 0,
				posy: 0,
				xpos: fg.XPOS_LEFT,
				ypos: fg.YPOS_TOP,
				translateX: 0,
				translateY: 0,
				posOffsetX: 0,
				posOffsetY: 0,
				oldPosx: 0,
				oldPosy: 0,
				idleCounter: 0,
				currentFrame: 0,
				multix: 0,
				multiy: 0,
				angle: 0,
				factor: 1,
				oldAngle: 0,
				oldFactor: 1,
				factorh: 1,
				factorv: 1,
				oldFactorh: 1,
				oldFactorv: 1
			},

			init: function (name, options, parent) {
				var
					xpos,
					ypos
				;

				fg.sprites[name] = this;

				this.name = name;
				this.parent = parent;

				this.options = Object.create(this.defaults);
				options = $.extend(this.options, options);

				this.setAnimation(options.animation, options.callback);

				xpos = options.xpos;
				if (xpos === fg.XPOS_CENTER) {
					this.setCenterX(options.posx);
				} else if (xpos === fg.XPOS_RIGHT) {
					this.setRight(options.posx);
				} else {
					this.setLeft(options.posx);
				}

				ypos = options.ypos;
				if (ypos === fg.YPOS_CENTER) {
					this.setCenterY(options.posy);
				} else if (ypos === fg.YPOS_BOTTOM) {
					this.setBottom(options.posy);
				} else {
					this.setTop(options.posy);
				}
			},

			remove: function () {
				var
					parent = this.parent,
					parent_layers = parent.layers,
					len_parent_layers = parent_layers.length,
					name = this.name,
					i;

				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						parent_layers.splice(i, 1);
						break;
					}
				}

				delete fg.sprites[name];
			},

			setAnimation: function (animation, callback) {
				var
					options = this.options,
					animation_options;

				if (typeof animation === 'number') {
					if (options.animation) {
						animation_options = options.animation.options;
						options.multix = animation * animation_options.multix;
						options.multiy = animation * animation_options.multiy;
					}
				} else {
					options.animation = animation;
					options.multix = 0;
					options.multiy = 0;
				}

				options.callback = callback;
				options.idleCounter = 0;
				options.currentFrame = 0;
				this.endAnimation = false;

				return this;
			},

			setLeft: function (x) {
				var
					options = this.options,
					animation = options.animation
				;

				options.posx = (x + 0.5) << 0;

				if (animation) {
					options.translateX = ((x + animation.options.halfWidth) + 0.5) << 0;
				} else {
					options.translateX = (x + 0.5) << 0;
				}

				return this;
			},

			getLeft: function () {
				return this.options.posx;
			},

			setTop: function (y) {
				var
					options = this.options,
					animation = options.animation;

				options.posy = (y + 0.5) << 0;

				if (animation) {
					options.translateY = ((y + animation.options.halfHeight) + 0.5) << 0;
				} else {
					options.translateY = (y + 0.5) << 0;
				}

				return this;
			},

			getTop: function () {
				return this.options.posy;
			},

			setRight: function (x) {
				var
					animation = this.options.animation
				;

				if (animation) {
					x -= animation.options.frameWidth;
				}

				return this.setLeft(x);
			},

			getRight: function () {
				var
					animation = this.options.animation,
					x = this.getLeft()
				;

				if (animation) {
					x += animation.options.frameWidth;
				}

				return x;
			},

			setBottom: function (y) {
				var
					animation = this.options.animation
				;

				if (animation) {
					y -= animation.options.frameHeight;
				}

				return this.setTop(y);
			},

			getBottom: function () {
				var
					animation = this.options.animation,
					y = this.getTop()
				;

				if (animation) {
					y += animation.options.frameHeight;
				}

				return y;
			},

			setCenterX: function (x) {
				var
					animation = this.options.animation
				;

				if (animation) {
					x -= animation.options.halfWidth;
				}

				return this.setLeft(x);
			},

			getCenterX: function () {
				var
					animation = this.options.animation,
					x = this.getLeft()
				;

				if (animation) {
					x += animation.options.halfWidth;
				}

				return x;
			},

			setCenterY: function (y) {
				var
					animation = this.options.animation
				;

				if (animation) {
					y -= animation.options.halfHeight;
				}

				return this.setTop(y);
			},

			getCenterY: function () {
				var
					animation = this.options.animation,
					y = this.getTop()
				;

				if (animation) {
					y += animation.options.halfHeight;
				}

				return y;
			},

			rotate: function (angle) {
				var
					options = this.options;

				options.angle = angle;

				return this;
			},

			scale: function (factor) {
				var
					options = this.options;

				options.factor = factor;

				return this;
			},

			fliph: function (flip) {
				var
					options = this.options;

				if (flip === undefined) {
					options.factorh *= -1;
				} else if (flip) {
					options.factorh = -1;
				} else {
					options.factorh = 1;
				}

				return this;
			},

			flipv: function (flip) {
				var
					options = this.options;

				if (flip === undefined) {
					options.factorv *= -1;
				} else if (flip) {
					options.factorv = -1;
				} else {
					options.factorv = 1;
				}

				return this;
			},

			update: function () {
				var
					options = this.options,
					animation = options.animation,
					animation_options,
					currentFrame = options.currentFrame;

				if (!this.endAnimation) {
					if (animation) {
						animation_options = animation.options;

						options.idleCounter += 1;
						if (options.idleCounter >= animation_options.rate) {
							options.idleCounter = 0;
							currentFrame += 1;
							if (currentFrame >= animation_options.numberOfFrame) {
								if (animation_options.once) {
									currentFrame -= 1;
									options.idleCounter += 1;
									this.endAnimation = true;
								} else {
									currentFrame = 0;
								}

								if (options.callback) {
									options.callback(this);
								}
							}
							options.currentFrame = currentFrame;
						}
					}
				}
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
			}
		},

		Sprite: function () {
			var
				sprite = Object.create(fg.PrototypeSprite);

			sprite.init.apply(sprite, arguments);

			return sprite;
		},

		PrototypeBaseSpriteGroup: {
			init: function (name, parent) {
				fg.groups[name] = this;

				this.layers = [];
				this.name = name;
				this.parent = parent;
			},

			addSprite: function (name, options) {
				var
					sprite = fg.Sprite(name, options, this);

				this.layers.push({name: name, obj: sprite});

				return this;
			},

			addGroup: function (name) {
				var
					group = fg.SpriteGroup(name, this);

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

			remove: function () {
				var
					layers = this.layers,
					parent = this.parent,
					parent_layers = parent.layers,
					len_parent_layers = parent_layers.length,
					name = this.name,
					i;

				while (layers.length) {
					layers[0].remove();
				}

				for (i = 0; i < len_parent_layers; i += 1) {
					if (parent_layers[i].name === name) {
						parent_layers.splice(i, 1);
						break;
					}
				}

				delete fg.groups[name];
			},

			update: function () {
				var
					layers = this.layers,
					len_layers = layers.length,
					i;

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
					i;

				for (i = 0; i < len_layers; i += 1) {
					layers[i].obj.draw();
				}
			},

			show: function () {
				var
					layers = this.layers,
					len_layers = layers.length,
					i;

				for (i = 0; i < len_layers; i += 1) {
					layers[i].obj.show();
				}
			},

			hide: function () {
				var
					layers = this.layers,
					len_layers = layers.length,
					i;

				for (i = 0; i < len_layers; i += 1) {
					layers[i].obj.hide();
				}
			}
		},

		SpriteGroup: function () {
			var
				group = Object.create(fg.PrototypeSpriteGroup);

			group.init.apply(group, arguments);

			return group;
		},

		preload: function () {
			var
				animations = fg.animations,
				len_animations = animations.length,
				completed = 0,
				i;

			for (i = 0; i < len_animations; i += 1) {
				if (animations[i].img.complete) {
					completed += 1;
				}
			}

			if (fg.loadCallback) {
				if (len_animations !== 0) {
					fg.loadCallback(completed / len_animations);
				} else {
					fg.loadCallback(1);
				}
			}

			if (completed === len_animations) {
				clearInterval(fg.idPreload);

				for (i = 0; i < len_animations; i += 1) {
					animations[i].onLoad();
				}

				$.each(fg.sprites, function () {
					var
						options = this.options;

					this.setAnimation(options.animation, options.callback);
				});

				if (fg.loadCallback) {
					delete fg.loadCallback;
				}

				if (fg.completeCallback) {
					fg.completeCallback();
				}

				fg.idRefresh = setInterval(fg.refresh, fg.refreshRate);
			}
		},

		draw: function () {
			fg.groups.scenegraph.draw();
			fg.drawDone = true;
		},

		refresh: function () {
			var
				callbacks = fg.callbacks,
				len_callbacks = callbacks.length,
				callback,
				retval,
				remove_callbacks = [],
				len_remove_callbacks,
				i,
				scenegraph = fg.groups.scenegraph;

			if (scenegraph) {
				scenegraph.update();

				if (fg.drawDone) {
					fg.drawDone = false;
					window.requestAnimFrame(fg.draw);
				}
			}

			for (i = 0; i < len_callbacks; i += 1) {
				callback = callbacks[i];
				callback.idleCounter += 1;
				if (callback.idleCounter >= callback.rate) {
					callback.idleCounter = 0;
					retval = callback.callback();
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

		startGame: function (callback, rate) {
			if (rate) {
				fg.refreshRate = rate;
			}

			fg.completeCallback = callback;
			fg.idPreload = setInterval(fg.preload, 100);

			return this;
		},

		stopGame: function () {
			clearInterval(fg.idRefresh);

			return this;
		},

		registerCallback: function (callback, rate) {
			rate = Math.round(rate / fg.refreshRate);
			if (rate === 0) {
				rate = 1;
			}

			fg.callbacks.push({callback: callback, rate: rate, idleCounter: 0});

			return this;
		}
	});

	fg.playground = function () {
		var
			scenegraph = fg.groups.scenegraph;

		if (!scenegraph) {
			scenegraph = fg.SpriteGroup('scenegraph', null);
		}

		return scenegraph;
	};
}(jQuery));

