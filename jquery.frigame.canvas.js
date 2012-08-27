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

	friGame.PrototypeAnimation = Object.create(friGame.PrototypeBaseAnimation);

	friGame.PrototypeSprite = Object.create(friGame.PrototypeBaseSprite);
	$.extend(friGame.PrototypeSprite, {
		draw: function () {
			var
				options = this.options,
				details = this.details,
				animation = options.animation,
				angle = details.angle,
				scalex = details.scalex,
				scaley = details.scaley,
				fliph = details.fliph,
				flipv = details.flipv,
				animation_options,
				animation_details,
				frameWidth,
				frameHeight,
				currentFrame = details.currentFrame,
				ctx = friGame.ctx
			;

			if (animation && !details.hidden) {
				animation_options = animation.options;
				animation_details = animation.details;
				frameWidth = animation_options.frameWidth;
				frameHeight = animation_options.frameHeight;

				ctx.save();

				ctx.translate(details.translatex, details.translatey);

				if (angle) {
					ctx.rotate(angle);
				}

				if ((scalex !== 1) || (scaley !== 1) || (fliph !== 1) || (flipv !== 1)) {
					ctx.scale(fliph * scalex, flipv * scaley);
				}

				friGame.safeDrawImage(
					ctx,
					animation_details.img,
					animation_options.offsetx + details.multix + (currentFrame * animation_details.deltax),
					animation_options.offsety + details.multiy + (currentFrame * animation_details.deltay),
					frameWidth,
					frameHeight,
					-(animation_details.halfWidth),
					-(animation_details.halfHeight),
					frameWidth,
					frameHeight
				);

				ctx.restore();
			}
		}
	});

	friGame.PrototypeSpriteGroup = Object.create(friGame.PrototypeBaseSpriteGroup);
	$.extend(friGame.PrototypeSpriteGroup, {
		init: function (name, parent) {
			var
				dom,
				parent_dom,
				width,
				height
			;

			friGame.PrototypeBaseSpriteGroup.init.apply(this, arguments);

			if (!parent) {
				parent_dom = $('#playground');
				width = parent_dom.width();
				height = parent_dom.height();
				dom = $(['<canvas id="', name, '" width ="', String(width), '" height="', String(height), '"></canvas>'].join('')).appendTo(parent_dom);
				friGame.ctx = document.getElementById(name).getContext('2d');
				this.canvasWidth = width;
				this.canvasHeight = height;
			}
		},

		draw: function () {
			if (!this.parent) {
				friGame.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			}

			friGame.PrototypeBaseSpriteGroup.draw.apply(this, arguments);
		}
	});

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

