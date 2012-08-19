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

(function ($) {
	var
		fg = $.friGame
	;

	fg.PrototypeAnimation = Object.create(fg.PrototypeBaseAnimation);

	fg.PrototypeSprite = Object.create(fg.PrototypeBaseSprite);
	$.extend(fg.PrototypeSprite, {
		init: function (name, options, parent) {
			var
				dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent.dom);

			this.dom = dom;
			dom.css('position', 'absolute');

			fg.PrototypeBaseSprite.init.apply(this, arguments);

			this.draw();
		},

		remove: function () {
			this.dom.remove();

			fg.PrototypeBaseSprite.remove.apply(this, arguments);
		},

		setAnimation: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				animation,
				animation_options,
				index_changed = false,
				css_options
			;

			fg.PrototypeBaseSprite.setAnimation.apply(this, arguments);

			animation = my_options.animation;
			animation_options = animation && animation.options;

			if (new_options.hasOwnProperty('animationIndex')) {
				if (animation) {
					this.dom.css('background-position', [
						String(-(animation_options.offsetx + my_options.multix)),
						'px ',
						String(-(animation_options.offsety + my_options.multiy)),
						'px'
					].join(''));

					index_changed = true;
				}
			}

			if (new_options.hasOwnProperty('animation')) {
				if (animation) {
					css_options = {
						'width': [String(animation_options.frameWidth), 'px'].join(''),
						'height': [String(animation_options.frameHeight), 'px'].join(''),
						'background-image': ['url("', animation_options.imageURL, '")'].join('')
					};

					if (!index_changed) {
						css_options['background-position'] = [
							String(-(animation_options.offsetx + my_options.multix)),
							'px ',
							String(-(animation_options.offsety + my_options.multiy)),
							'px'
						].join('');
					}

					this.dom.css(css_options);

					if (fg.filterFunction) {
						if ((my_options.angle) || (my_options.factor !== 1) || (my_options.factorh !== 1) || (my_options.factorv !== 1)) {
							this.ieFilter();
						}
					}
				} else {
					this.dom.css('background-image', 'none');
				}
			}

			return this;
		},

		transform: function () {
			var
				dom = this.dom,
				options = this.options,
				transformFunction = fg.transformFunction,
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
			} else if (fg.filterFunction) {
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

			dom.css(fg.filterFunction, filter);

			// Step 2: Adjust the element position according to the new width and height
			newWidth = dom.width();
			newHeight = dom.height();
			options.posOffsetX = (((newWidth - animation_options.frameWidth) / 2) + 0.5) << 0;
			options.posOffsetY = (((newHeight - animation_options.frameHeight) / 2) + 0.5) << 0;
			dom.css({
				'left': [String(options.left - options.posOffsetX), 'px'].join(''),
				'top': [String(options.top - options.posOffsetY), 'px'].join('')
			});
		},

		draw: function () {
			var
				options = this.options,
				currentFrame = options.currentFrame,
				animation_options,
				left = options.left,
				top = options.top,
				angle = options.angle,
				factor = options.factor,
				factorh = options.factorh,
				factorv = options.factorv;

			if (options.animation) {
				if (left !== options.oldLeft) {
					this.dom.css('left', [String(left - options.posOffsetX), 'px'].join(''));
					options.oldLeft = left;
				}

				if (top !== options.oldTop) {
					this.dom.css('top', [String(top - options.posOffsetY), 'px'].join(''));
					options.oldTop = top;
				}

				if ((angle !== options.oldAngle) ||
						(factor !== options.oldFactor) ||
						(factorh !== options.oldFactorh) ||
						(factorv !== options.oldFactorv)) {
					this.transform();
					options.oldAngle = angle;
					options.oldFactor = factor;
					options.oldFactorh = factorh;
					options.oldFactorv = factorv;
				}

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

	fg.PrototypeSpriteGroup = Object.create(fg.PrototypeBaseSpriteGroup);
	$.extend(fg.PrototypeSpriteGroup, {
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
					fg.transformFunction = '-moz-transform';
				} else if (dom.css('-o-transform')) {
					fg.transformFunction = '-o-transform';
				} else if ((dom.css('msTransform') !== null) && (dom.css('msTransform') !== undefined)) {
					fg.transformFunction = 'msTransform';
				} else if ((dom.css('transform') !== null) && (dom.css('transform') !== undefined)) {
					fg.transformFunction = 'transform';
				} else if ((dom.css('-webkit-transform') !== null) && (dom.css('-webkit-transform') !== undefined)) {
					fg.transformFunction = '-webkit-transform';
				} else if (dom.css('filter') !== undefined) {
					fg.filterFunction = 'filter';
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

			fg.PrototypeBaseSpriteGroup.init.apply(this, arguments);
		},

		remove: function () {
			this.dom.remove();

			fg.PrototypeBaseSpriteGroup.remove.apply(this, arguments);
		}
	});
}(jQuery));

