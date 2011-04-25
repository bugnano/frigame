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

	friGame.PrototypeAnimation = Object.create(friGame.PrototypeBaseAnimation);

	friGame.PrototypeSprite = Object.create(friGame.PrototypeBaseSprite);
	$.extend(friGame.PrototypeSprite, {
		init: function (name, options, parent) {
			var
				dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent.dom);

			this.dom = dom;
			dom.css('position', 'absolute');

			friGame.PrototypeBaseSprite.init.apply(this, arguments);
		},

		remove: function () {
			this.dom.remove();

			friGame.PrototypeBaseSprite.remove.apply(this, arguments);
		},

		setAnimation: function (animation, callback) {
			var
				options = this.options,
				animation_options;

			friGame.PrototypeBaseSprite.setAnimation.apply(this, arguments);

			if (typeof animation === 'number') {
				if (options.animation) {
					animation_options = options.animation.options;

					this.dom.css('background-position', [
						String(-(animation_options.offsetx + options.multix)),
						'px ',
						String(-(animation_options.offsety + options.multiy)),
						'px'
					].join(''));
				}
			} else if (animation) {
				animation_options = animation.options;

				this.dom.css({
					'width': [String(animation_options.frameWidth), 'px'].join(''),
					'height': [String(animation_options.frameHeight), 'px'].join(''),
					'background-image': ['url("', animation_options.imageURL, '")'].join(''),
					'background-position': [
						String(-animation_options.offsetx),
						'px ',
						String(-animation_options.offsety),
						'px'
					].join('')
				});

				if (friGame.filterFunction) {
					if ((options.angle) || (options.factor !== 1) || (options.factorh !== 1) || (options.factorv !== 1)) {
						this.ieFilter();
					}
				}
			} else {
				this.dom.css('background-image', 'none');
			}

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

		transform: function () {
			var
				dom = this.dom,
				options = this.options,
				transformFunction = friGame.transformFunction,
				angle = options.angle,
				factor = options.factor,
				factorh = options.factorh,
				factorv = options.factorv,
				transform = [];

			if (transformFunction) {
				if (angle) {
					transform.push.apply(transform, ['rotate(', String(angle), 'rad)']);
				}

				if ((factor !== 1) || (factorh !== 1) || (factorv !== 1)) {
					transform.push.apply(transform, ['scale(', String(factorh * factor), ',', String(factorv * factor), ')']);
				}

				dom.css(transformFunction, transform.join(''));
			} else if (friGame.filterFunction) {
				this.ieFilter();
			} else {
				$.noop();
			}

			return this;
		},

		ieFilter: function () {
			var
				dom = this.dom,
				options = this.options,
				animation_options = options.animation.options,
				angle = options.angle,
				factor = options.factor,
				factorh = options.factorh,
				factorv = options.factorv,
				cos,
				sin,
				filter,
				newWidth,
				newHeight;

			// Step 1: Apply the transformation matrix
			if ((angle) || (factor !== 1) || (factorh !== 1) || (factorv !== 1)) {
				cos = Math.cos(angle) * factor;
				sin = Math.sin(angle) * factor;
				filter = ['progid:DXImageTransform.Microsoft.Matrix(M11=', String(cos * factorh),
					',M12=', String(-sin * factorv), 
					',M21=', String(sin * factorh),
					',M22=', String(cos * factorv),
					',SizingMethod="auto expand",FilterType="nearest neighbor")'].join('');
			} else {
				filter = '';
			}

			dom.css(friGame.filterFunction, filter);

			// Step 2: Adjust the element position according to the new width and height
			newWidth = dom.width();
			newHeight = dom.height();
			options.posOffsetX = (newWidth - animation_options.frameWidth) / 2;
			options.posOffsetY = (newHeight - animation_options.frameHeight) / 2;
			dom.css({
				'left': [String(options.posx - options.posOffsetX), 'px'].join(''),
				'top': [String(options.posy - options.posOffsetY), 'px'].join('')
			});
		},

		draw: function () {
			var
				options = this.options,
				currentFrame = options.currentFrame,
				animation_options;

			if (options.animation) {
				animation_options = options.animation.options;
				if ((options.idleCounter === 0) && (animation_options.numberOfFrame !== 1)) {
					this.dom.css('background-position', [
						String(-(animation_options.offsetx + options.multix + (currentFrame * animation_options.deltax))),
						'px ',
						String(-(animation_options.offsety + options.multiy + (currentFrame * animation_options.deltay))),
						'px'
					].join(''));
				}
			}
		},

		show: function () {
			this.dom.show();
		},

		hide: function () {
			this.dom.hide();
		}
	});

	friGame.PrototypeSpriteGroup = Object.create(friGame.PrototypeBaseSpriteGroup);
	$.extend(friGame.PrototypeSpriteGroup, {
		init: function (name, parent) {
			var
				dom,
				parent_dom;

			if (parent) {
				parent_dom = parent.dom;
			} else {
				parent_dom = $('#playground');
			}

			dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent_dom);

			if (!parent) {
				if (dom.css('-moz-transform')) {
					friGame.transformFunction = '-moz-transform';
				} else if (dom.css('-o-transform')) {
					friGame.transformFunction = '-o-transform';
				} else if ((dom.css('transform') !== null) && (dom.css('transform') !== undefined)) {
					friGame.transformFunction = 'transform';
				} else if ((dom.css('-webkit-transform') !== null) && (dom.css('-webkit-transform') !== undefined)) {
					friGame.transformFunction = '-webkit-transform';
				} else if (dom.css('filter') !== undefined) {
					friGame.filterFunction = 'filter';
				} else {
					$.noop();
				}
			}

			dom.css({
				'position': 'absolute',
				'width': parent_dom.css('width'),
				'height': parent_dom.css('height')
			});

			this.dom = dom;

			friGame.PrototypeBaseSpriteGroup.init.apply(this, arguments);
		},

		remove: function () {
			this.dom.remove();

			friGame.PrototypeBaseSpriteGroup.remove.apply(this, arguments);
		}
	});
}(jQuery));

