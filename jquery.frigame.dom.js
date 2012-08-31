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
		friGame = $.friGame
	;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeDOMSprite = Object.create(friGame.PrototypeSprite);
	$.extend(friGame.PrototypeDOMSprite, {
		init: function (name, options, parent) {
			friGame.PrototypeSprite.init.apply(this, arguments);

			this.old_options = {};
		},

		// Public functions

		remove: function () {
			if (this.dom) {
				this.dom.remove();
			}

			friGame.PrototypeSprite.remove.apply(this, arguments);
		},

		// Implementation details

		transform: function () {
			var
				dom = this.dom,
				options = this.options,
				transformFunction = friGame.transformFunction,
				angle = options.angle,
				scalex = options.scalex,
				scaley = options.scaley,
				fliph = options.fliph,
				flipv = options.flipv,
				transform = []
			;

			if (transformFunction) {
				if (angle) {
					transform.push.apply(transform, ['rotate(', String(angle), 'rad)']);
				}

				if ((scalex !== 1) || (scaley !== 1) || (fliph !== 1) || (flipv !== 1)) {
					transform.push.apply(transform, ['scale(', String(fliph * scalex), ',', String(flipv * scaley), ')']);
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
				animation = options.animation,
				animation_options = animation.options,
				angle = options.angle,
				scalex = options.scalex,
				scaley = options.scaley,
				fliph = options.fliph,
				flipv = options.flipv,
				cos,
				sin,
				filter,
				newWidth,
				newHeight,
				round = Math.round
			;

			// Step 1: Apply the transformation matrix
			if ((angle) || (scalex !== 1) || (scaley !== 1) || (fliph !== 1) || (flipv !== 1)) {
				cos = Math.cos(angle);
				sin = Math.sin(angle);
				filter = [
					'progid:DXImageTransform.Microsoft.Matrix(M11=', String(cos * fliph * scalex),
					',M12=', String(-sin * flipv * scaley),
					',M21=', String(sin * fliph * scalex),
					',M22=', String(cos * flipv * scaley),
					',SizingMethod="auto expand",FilterType="nearest neighbor")'
				].join('');
			} else {
				filter = '';
			}

			dom.css(friGame.filterFunction, filter);

			// Step 2: Adjust the element position according to the new width and height
			newWidth = dom.width();
			newHeight = dom.height();
			options.posOffsetX = round((newWidth - options.width) / 2);
			options.posOffsetY = round((newHeight - options.height) / 2);
			dom.css({
				'left': [String(options.left - options.posOffsetX), 'px'].join(''),
				'top': [String(options.top - options.posOffsetY), 'px'].join('')
			});
		},

		draw: function () {
			var
				options = this.options,
				old_options = this.old_options,
				currentFrame = options.currentFrame,
				animation = options.animation,
				animation_options,
				dom = this.dom,
				left = options.left,
				top = options.top,
				multix = options.multix,
				multiy = options.multiy,
				angle = options.angle,
				scalex = options.scalex,
				scaley = options.scaley,
				fliph = options.fliph,
				flipv = options.flipv,
				hidden = options.hidden,
				css_options = {},
				update_css = false,
				update_position = false,
				update_transform = false
			;

			if (animation && !hidden) {
				animation_options = animation.options;

				if (!dom) {
					dom = $(['<div id="', this.name, '"></div>'].join('')).appendTo(this.parent.dom);

					dom.css({
						'position': 'absolute',
						'margin': '0px',
						'padding': '0px',
						'border': 'none',
						'outline': 'none',
						'background': 'none'	// Reset background properties set by external CSS
					});

					this.dom = dom;
				}

				if (hidden !== old_options.hidden) {
					dom.show();
					old_options.hidden = hidden;
				}

				if (left !== old_options.left) {
					css_options.left = [String(left - options.posOffsetX), 'px'].join('');
					update_css = true;

					old_options.left = left;
				}

				if (top !== old_options.top) {
					css_options.top = [String(top - options.posOffsetY), 'px'].join('');
					update_css = true;

					old_options.top = top;
				}

				if (animation !== old_options.animation) {
					$.extend(css_options, {
						'width': [String(options.width), 'px'].join(''),
						'height': [String(options.height), 'px'].join(''),
						'background-image': ['url("', animation_options.imageURL, '")'].join('')
					});
					update_css = true;
					update_position = true;

					if ((angle) || (scalex !== 1) || (scaley !== 1) || (fliph !== 1) || (flipv !== 1)) {
						update_transform = true;
					}

					old_options.animation = animation;
				}

				if ((multix !== old_options.multix)  || (multiy !== old_options.multiy)) {
					update_position = true;

					old_options.multix = multix;
					old_options.multiy = multiy;
				}

				if (update_position || ((options.idleCounter === 0) && (animation_options.numberOfFrame !== 1))) {
					css_options['background-position'] = [
						String(-(animation_options.offsetx + multix + (currentFrame * animation_options.deltax))),
						'px ',
						String(-(animation_options.offsety + multiy + (currentFrame * animation_options.deltay))),
						'px'
					].join('');
					update_css = true;
				}

				if (update_css) {
					dom.css(css_options);
				}

				if	(
						update_transform
					||	(angle !== old_options.angle)
					||	(scalex !== old_options.scalex)
					||	(scaley !== old_options.scaley)
					||	(fliph !== old_options.fliph)
					||	(flipv !== old_options.flipv)
					) {
					this.transform();

					old_options.angle = angle;
					old_options.scalex = scalex;
					old_options.scaley = scaley;
					old_options.fliph = fliph;
					old_options.flipv = flipv;
				}
			} else {
				if (dom) {
					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}

					if ((!animation) && (animation !== old_options.animation)) {
						dom.css('background', 'none');
						old_options.animation = animation;
					}
				}
			}
		}
	});

	friGame.Sprite = function () {
		var
			sprite = Object.create(friGame.PrototypeDOMSprite)
		;

		sprite.init.apply(sprite, arguments);

		return sprite;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeDOMSpriteGroup = Object.create(friGame.PrototypeSpriteGroup);
	$.extend(friGame.PrototypeDOMSpriteGroup, {
		init: function (name, options, parent) {
			var
				dom
			;

			friGame.PrototypeSpriteGroup.init.apply(this, arguments);

			this.old_options = {};

			if (!parent) {
				dom = this.makeDOM(name, options.parentDOM);

				if (dom.css('-moz-transform')) {
					friGame.transformFunction = '-moz-transform';
				} else if (dom.css('-o-transform')) {
					friGame.transformFunction = '-o-transform';
				} else if ((dom.css('msTransform') !== null) && (dom.css('msTransform') !== undefined)) {
					friGame.transformFunction = 'msTransform';
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
		},

		// Public functions

		remove: function () {
			friGame.PrototypeSpriteGroup.remove.apply(this, arguments);

			if (this.dom) {
				this.dom.remove();
			}
		},

		// Implementation details

		makeDOM: function (name, parent_dom) {
			var
				options = this.options,
				old_options = this.old_options,
				left,
				top,
				width,
				height,
				overflow,
				dom = $(['<div id="', name, '"></div>'].join('')).appendTo(parent_dom)
			;

			left = options.left;
			top = options.top;
			width = options.width;
			height = options.height;
			old_options.left = left;
			old_options.top = top;
			old_options.width = width;
			old_options.height = height;

			if (!this.parent) {
				overflow = 'hidden';
			} else {
				overflow = 'visible';
			}

			dom.css({
				'position': 'absolute',
				'left': [String(left), 'px'].join(''),
				'top': [String(top), 'px'].join(''),
				'width': [String(width), 'px'].join(''),
				'height': [String(height), 'px'].join(''),
				'margin': '0px',
				'padding': '0px',
				'border': 'none',
				'outline': 'none',
				'background': 'none',
				'overflow': overflow
			});

			this.dom = dom;

			return dom;
		},

		draw: function () {
			var
				options = this.options,
				old_options = this.old_options,
				dom = this.dom,
				left = options.left,
				top = options.top,
				width = options.width,
				height = options.height,
				hidden = options.hidden,
				css_options = {},
				update_css = false
			;

			if (this.layers.length && !hidden) {
				if (!this.dom) {
					dom = this.makeDOM(this.name, this.parent.dom);
				}

				if (hidden !== old_options.hidden) {
					dom.show();
					old_options.hidden = hidden;
				}

				if (left !== old_options.left) {
					css_options.left = [String(left), 'px'].join('');
					update_css = true;

					old_options.left = left;
				}

				if (top !== old_options.top) {
					css_options.top = [String(top), 'px'].join('');
					update_css = true;

					old_options.top = top;
				}

				if (width !== old_options.width) {
					css_options.width = [String(width), 'px'].join('');
					update_css = true;

					old_options.width = top;
				}

				if (height !== old_options.height) {
					css_options.height = [String(height), 'px'].join('');
					update_css = true;

					old_options.width = top;
				}

				if (update_css) {
					dom.css(css_options);
				}

				friGame.PrototypeSpriteGroup.draw.apply(this, arguments);
			} else {
				if (dom) {
					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}
				}
			}
		}
	});

	friGame.SpriteGroup = function () {
		var
			group = Object.create(friGame.PrototypeDOMSpriteGroup)
		;

		group.init.apply(group, arguments);

		return group;
	};
}(jQuery));

