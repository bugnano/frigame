/*global jQuery */
/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true */

// Copyright (c) 2011 Franco Bugnano

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

(function ($) {
	var
		friGame = {};

	$.friGame = friGame;

	$.extend(friGame, {
		// "constants" for the different type of an animation
		ANIMATION_VERTICAL: 1,		// genertated by a verical offset of the background
		ANIMATION_HORIZONTAL: 2,	// genertated by a horizontal offset of the background
		ANIMATION_ONCE: 4,			// played only once (else looping indefinitly)
		ANIMATION_MULTI: 16,		// The image file contains many animations

		// basic values
		refreshRate: 30,

		animations: [],
		sprites: {},
		groups: {},
		callbacks: [],

		PrototypeAnimation: {
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
				deltax: 0,
				deltay: 0,
				multix: 0,
				multiy: 0,
				once: false
			},

			init: function (options) {
				var
					img = new Image();

				this.options = Object.create(this.defaults);
				options = $.extend(this.options, options);

				options.rate = Math.round(options.rate / friGame.refreshRate);
				if (options.rate === 0) {
					options.rate = 1;
				}

				img.src = options.imageURL;

				friGame.animations.push(this);

				this.img = img;
			},

			onLoad: function () {
				var
					options = this.options,
					img = this.img,
					delta = options.delta,
					distance = options.distance;

				if (options.type & friGame.ANIMATION_HORIZONTAL) {
					if (options.type & friGame.ANIMATION_MULTI) {
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
				} else if (options.type & friGame.ANIMATION_VERTICAL) {
					if (options.type & friGame.ANIMATION_MULTI) {
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

				if (options.type & friGame.ANIMATION_ONCE) {
					options.once = true;
				}
			}
		},

		Animation: function () {
			var
				animation = Object.create(friGame.PrototypeAnimation);

			animation.init.apply(animation, arguments);

			return animation;
		},

		PrototypeBaseSprite: {
			defaults: {
				posx: 0,
				posy: 0,
				posOffsetX: 0,
				posOffsetY: 0,
				translateX: 0,
				translateY: 0,
				idleCounter: 0,
				currentFrame: 0,
				angle: 0,
				factor: 1,
				multix: 0,
				multiy: 0,
				factorh: 1,
				factorv: 1
			},

			init: function (name, options, parent) {
				friGame.sprites[name] = this;

				this.name = name;
				this.parent = parent;

				this.options = Object.create(this.defaults);
				options = $.extend(this.options, options);

				this.posx(options.posx);
				this.posy(options.posy);
				this.setAnimation(options.animation, options.callback);
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

				delete friGame.sprites[name];
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

			rotate: function (angle) {
				var
					options = this.options;

				options.angle = angle;

				if (options.animation) {
					this.transform();
				}

				return this;
			},

			scale: function (factor) {
				var
					options = this.options;

				options.factor = factor;

				if (options.animation) {
					this.transform();
				}

				return this;
			},

			fliph: function () {
				var
					options = this.options;

				options.factorh *= -1;

				if (options.animation) {
					this.transform();
				}

				return this;
			},

			flipv: function () {
				var
					options = this.options;

				options.factorv *= -1;

				if (options.animation) {
					this.transform();
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
					animation = this.options.animation;

				if (animation) {
					return animation.options.frameWidth;
				} else {
					return 0;
				}
			},

			height: function () {
				var
					animation = this.options.animation;

				if (animation) {
					return animation.options.frameHeight;
				} else {
					return 0;
				}
			}
		},

		Sprite: function () {
			var
				sprite = Object.create(friGame.PrototypeSprite);

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

			addSprite: function (name, options) {
				var
					sprite = friGame.Sprite(name, options, this);

				this.layers.push({name: name, obj: sprite});

				return this;
			},

			addGroup: function (name) {
				var
					group = friGame.SpriteGroup(name, this);

				this.layers.push({name: name, obj: group});

				return group;
			},

			end: function () {
				var
					parent = this.parent;

				if (parent) {
					return parent;
				} else {
					return this;
				}
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

				delete friGame.groups[name];
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
				group = Object.create(friGame.PrototypeSpriteGroup);

			group.init.apply(group, arguments);

			return group;
		},

		preload: function () {
			var
				animations = friGame.animations,
				len_animations = animations.length,
				completed = 0,
				i;

			for (i = 0; i < len_animations; i += 1) {
				if (animations[i].img.complete) {
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
					var
						options = this.options;

					this.setAnimation(options.animation, options.callback);
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
				sceengraph = friGame.groups.sceengraph;

			if (sceengraph) {
				sceengraph.update();
				sceengraph.draw();
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
		}
	});

	friGame.playground = function () {
		var
			sceengraph = friGame.groups.sceengraph;

		if (!sceengraph) {
			sceengraph = friGame.SpriteGroup('sceengraph', null);
		}

		return sceengraph;
	};
}(jQuery));

