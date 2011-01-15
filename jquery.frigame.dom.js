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

(function ($) {
	var
		friGame = $.friGame;

	friGame.PrototypeDomSprite = Object.create(friGame.PrototypeSprite);
	$.extend(friGame.PrototypeDomSprite, {
		init: function (name, options, parent) {
			var
				args = Array.prototype.slice.call(arguments),
				dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent.dom);

			this.dom = dom;
			dom.css('position', 'absolute');

			friGame.PrototypeSprite.init.apply(this, args);
		},

		remove: function () {
			var
				args = Array.prototype.slice.call(arguments);

			this.dom.remove();

			friGame.PrototypeSprite.remove.apply(this, args);
		},

		setAnimation: function (animation, callback) {
			var
				args = Array.prototype.slice.call(arguments),
				options,
				animation_options;

			friGame.PrototypeSprite.setAnimation.apply(this, args);

			options = this.options;
			animation_options = animation.options;

			this.dom.css({
				'width': options.frameWidth,
				'height': options.frameHeight,
				'background-image': ['url("', animation_options.imageURL, '")'].join(''),
				'background-position': '0 0'
			});

			return this;
		},

		posx: function (x) {
			var
				options = this.options;

			if (x !== undefined) {
				this.dom.css('left', [String(x - options.posOffsetX), 'px'].join(''));

				options.posx = x;

				return this;
			} else {
				return options.posx;
			}
		},

		posy: function (y) {
			var
				options = this.options;

			if (y !== undefined) {
				this.dom.css('top', [String(y - options.posOffsetY), 'px'].join(''));

				options.posy = y;

				return this;
			} else {
				return options.posy;
			}
		},

		transform: function (angle, factor) {
			var
				dom = this.dom,
				options = this.options,
				angle_rad = ((angle % 360) * Math.PI) / 180,
				transform = ['rotate(', String(angle_rad), 'rad) scale(', String(factor), ')'].join(''),
				filter,
				cos,
				sin,
				newWidth,
				newHeight;

			dom.css({
				'width': [String(options.frameWidth), 'px'].join(''),
				'height': [String(options.frameHeight), 'px'].join('')
			});

			if (dom.css('-moz-transform')) {
				// For firefox from 3.5
				dom.css('-moz-transform', transform);
			} else if (dom.css('-o-transform')) {
				// For opera from 10.50
				dom.css('-o-transform', transform);
			} else if (
				(dom.css('-webkit-transform') !== null) &&
				(dom.css('-webkit-transform') !== undefined)
			) {
				// For safari from 3.1 (and chrome)
				dom.css('-webkit-transform', transform);
			} else if (dom.css('filter') !== undefined) {
				// For ie from 5.5
				cos = Math.cos(angle_rad) * factor;
				sin = Math.sin(angle_rad) * factor;
				filter = ['progid:DXImageTransform.Microsoft.Matrix(M11=', String(cos),
					',M12=', String(-sin), 
					',M21=', String(sin),
					',M22=', String(cos),
					',SizingMethod="auto expand",FilterType="nearest neighbor")'].join('');
				dom.css('filter', filter);
				newWidth = dom.width();
				newHeight = dom.height();
				options.posOffsetX = (newWidth - options.frameWidth) / 2;
				options.posOffsetY = (newHeight - options.frameHeight) / 2;

				dom.css({
					'left': [String(options.posx - options.posOffsetX), 'px'].join(''),
					'top': [String(options.posy - options.posOffsetY), 'px'].join('')
				});
			}

			return this;
		},

		draw: function () {
			var
				options = this.options,
				animation_options = options.animation.options;

			if (options.idleCounter === 0) {
				if (animation_options.type === friGame.ANIMATION_HORIZONTAL) {
					this.dom.css('background-position', [String(-(animation_options.frameWidth * options.currentFrame)), 'px 0'].join(''));
				} else if (options.type === friGame.ANIMATION_VERTICAL) {
					this.dom.css('background-position', ['0 ', String(-(animation_options.frameHeight * options.currentFrame)), 'px'].join(''));
				} else {
					// No animation
					$.noop();
				}
			}
		}
	});

	friGame.Sprite = function (name, options, parent) {
		var
			sprite = Object.create(friGame.PrototypeDomSprite);

		sprite.init(name, options, parent);

		return sprite;
	};

	friGame.PrototypeDomSpriteGroup = Object.create(friGame.PrototypeSpriteGroup);
	$.extend(friGame.PrototypeDomSpriteGroup, {
		init: function (name, parent) {
			var
				args = Array.prototype.slice.call(arguments),
				dom,
				parent_dom;

			if (parent) {
				parent_dom = parent.dom;
			} else {
				parent_dom = $('#playground');
			}

			dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent_dom);
			this.dom = dom;
			dom.css({
				'position': 'absolute',
				'width': parent_dom.css('width'),
				'height': parent_dom.css('height')
			});

			friGame.PrototypeSpriteGroup.init.apply(this, args);
		},

		remove: function () {
			var
				args = Array.prototype.slice.call(arguments);

			this.dom.remove();

			friGame.PrototypeSpriteGroup.remove.apply(this, args);
		}
	});

	friGame.SpriteGroup = function (name, parent) {
		var
			group = Object.create(friGame.PrototypeDomSpriteGroup);

		group.init(name, parent);

		return group;
	};
}(jQuery));

