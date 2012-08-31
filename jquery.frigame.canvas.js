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
// Uses the safeDrawImage function taken from:
// Akihabara Copyright (c) 2010 Francesco Cottone, http://www.kesiev.com/, licensed under the MIT

(function ($) {
	var
		friGame = $.friGame
	;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeCanvasSprite = Object.create(friGame.PrototypeSprite);
	$.extend(friGame.PrototypeCanvasSprite, {
		draw: function () {
			var
				options = this.options,
				animation = options.animation,
				angle = options.angle,
				scalex = options.scalex,
				scaley = options.scaley,
				fliph = options.fliph,
				flipv = options.flipv,
				animation_options,
				width = options.width,
				height = options.height,
				currentFrame = options.currentFrame,
				ctx = friGame.ctx
			;

			if (animation && !options.hidden) {
				animation_options = animation.options;

				ctx.save();

				ctx.translate(options.centerx, options.centery);

				if (angle) {
					ctx.rotate(angle);
				}

				if ((scalex !== 1) || (scaley !== 1) || (fliph !== 1) || (flipv !== 1)) {
					ctx.scale(fliph * scalex, flipv * scaley);
				}

				friGame.safeDrawImage(
					ctx,
					animation_options.img,
					animation_options.offsetx + options.multix + (currentFrame * animation_options.deltax),
					animation_options.offsety + options.multiy + (currentFrame * animation_options.deltay),
					width,
					height,
					-(options.halfWidth),
					-(options.halfHeight),
					width,
					height
				);

				ctx.restore();
			}
		}
	});

	friGame.Sprite = function () {
		var
			sprite = Object.create(friGame.PrototypeCanvasSprite)
		;

		sprite.init.apply(sprite, arguments);

		return sprite;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.PrototypeCanvasSpriteGroup = Object.create(friGame.PrototypeSpriteGroup);
	$.extend(friGame.PrototypeCanvasSpriteGroup, {
		init: function (name, options, parent) {
			var
				dom,
				width,
				height
			;

			friGame.PrototypeSpriteGroup.init.apply(this, arguments);

			if (!parent) {
				width = String(options.width);
				height = String(options.height);

				dom = $(['<canvas id="', name, '" width ="', width, '" height="', height, '"></canvas>'].join('')).appendTo(options.parentDOM);
				dom.css({
					'position': 'absolute',
					'left': '0px',
					'top': '0px',
					'width': [width, 'px'].join(''),
					'height': [height, 'px'].join(''),
					'margin': '0px',
					'padding': '0px',
					'border': 'none',
					'outline': 'none',
					'background': 'none',
					'overflow': 'hidden'
				});

				this.dom = dom;

				friGame.ctx = document.getElementById(name).getContext('2d');
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

		draw: function () {
			var
				options = this.options,
				left = options.left,
				top = options.top,
				hidden = options.hidden,
				ctx = friGame.ctx,
				context_saved = false
			;

			if (!this.parent) {
				friGame.ctx.clearRect(0, 0, options.width, options.height);
			}

			if (this.layers.length && !hidden) {
				if (left || top) {
					if (!context_saved) {
						ctx.save();
						context_saved = true;
					}

					ctx.translate(left, top);
				}

				friGame.PrototypeSpriteGroup.draw.apply(this, arguments);

				if (context_saved) {
					ctx.restore();
				}
			}
		}
	});

	friGame.SpriteGroup = function () {
		var
			group = Object.create(friGame.PrototypeCanvasSpriteGroup)
		;

		group.init.apply(group, arguments);

		return group;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	friGame.safeDrawImage = function (tox, img, sx, sy, sw, sh, dx, dy, dw, dh) {
		if ((!img) || (!tox)) {
			return;
		}

		if (sx < 0) {
			dx -= (dw / sw) * sx;
			sw += sx;
			sx = 0;
		}

		if (sy < 0) {
			dy -= (dh / sh) * sy;
			sh += sy;
			sy = 0;
		}

		if (sx + sw > img.width) {
			dw = (dw / sw) * (img.width - sx);
			sw = img.width - sx;
		}

		if (sy + sh > img.height) {
			dh = (dh / sh) * (img.height - sy);
			sh = img.height - sy;
		}

		if ((sh > 0) && (sw > 0) && (sx < img.width) && (sy < img.height)) {
			tox.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
		}
	};
}(jQuery));

