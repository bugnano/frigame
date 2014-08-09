/*global friGame */
/*jslint white: true, browser: true */

// Copyright (c) 2011-2014 Franco Bugnano

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

(function (fg) {
	'use strict';

	var
		overrides = {}
	;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg.PGradient, {
		initCanvas: function () {
			var
				startColor = this.startColor,
				endColor = this.endColor
			;

			if (startColor === endColor) {
				// Solid color
				this.style = this.startColorStr;
			} else {
				// Gradient
				this.gradients = {};
				this.gradient_groups = {};
			}

			this.canvas_initialized = true;
		},

		addGroup: function (group) {
			var
				ctx = fg.ctx,
				width = group.width,
				height = group.height,
				dimension,
				name = group.name,
				gradients,
				gradient
			;

			if (!this.canvas_initialized) {
				this.initCanvas();
			}

			gradients = this.gradients;
			if (gradients) {
				if (this.type === fg.GRADIENT_HORIZONTAL) {
					dimension = width;
					height = 0;
				} else {
					dimension = height;
					width = 0;
				}

				if (!gradients[dimension]) {
					// Create a gradient for this dimension
					gradient = ctx.createLinearGradient(0, 0, width, height);
					gradient.addColorStop(0, this.startColorStr);
					gradient.addColorStop(1, this.endColorStr);

					gradients[dimension] = {
						style: gradient,
						groups: {}
					};
				}

				// Memorize the groups that have this dimension
				gradients[dimension].groups[name] = true;
				this.gradient_groups[name] = dimension;
			}
		},

		removeGroup: function (group) {
			var
				dimension,
				name = group.name,
				gradients,
				gradient_groups
			;

			if (!this.canvas_initialized) {
				this.initCanvas();
			}

			gradients = this.gradients;
			if (gradients) {
				gradient_groups = this.gradient_groups;
				if (gradient_groups[name] !== undefined) {
					// Get the gradient dimension according to the group name
					dimension = gradient_groups[name];
					delete gradient_groups[name];

					if (gradients[dimension]) {
						gradient_groups = gradients[dimension].groups;
						if (gradient_groups[name]) {
							// Remove the group from the dimension
							delete gradient_groups[name];
							if (fg.isEmptyObject(gradient_groups)) {
								// If no groups are using this dimension, delete the gradient
								delete gradients[dimension];
							}
						}
					}
				}
			}
		},

		setFillStyle: function (ctx, group) {
			var
				width = group.width,
				height = group.height,
				dimension
			;

			if (this.style) {
				// Solid color
				ctx.fillStyle = this.style;
			} else {
				// Gradient
				if (this.type === fg.GRADIENT_HORIZONTAL) {
					dimension = width;
				} else {
					dimension = height;
				}

				ctx.fillStyle = this.gradients[dimension].style;
			}
		},

		setStrokeStyle: function (ctx, group) {
			var
				width = group.width,
				height = group.height,
				dimension
			;

			if (this.style) {
				// Solid color
				ctx.strokeStyle = this.style;
			} else {
				// Gradient
				if (this.type === fg.GRADIENT_HORIZONTAL) {
					dimension = width;
				} else {
					dimension = height;
				}

				ctx.strokeStyle = this.gradients[dimension].style;
			}
		},

		drawBackground: function (ctx, group) {
			this.setFillStyle(ctx, group);
			ctx.fill();
		}
	});
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg.PAnimation, {
		drawBackground: function (ctx, group) {
			var
				img = this.options.img,
				style = this.style
			;

			if (group.options.backgroundType === fg.BACKGROUND_STRETCHED) {
				// Stretched background
				fg.safeDrawImage(
					ctx,
					img,
					0,
					0,
					img.width,
					img.height,
					0,
					0,
					group.width,
					group.height
				);
			} else {
				// Tiled background
				if (!style) {
					style = ctx.createPattern(img, 'repeat');
					this.style = style;
				}

				ctx.fillStyle = style;
				ctx.fill();
			}
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg.PSprite, {
		draw: function () {
			var
				options = this.options,
				animation = options.animation,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				old_alpha,
				animation_options = this.animation_options,
				width = this.width,
				height = this.height,
				currentFrame = options.currentFrame,
				ctx = fg.ctx
			;

			if (fg.insidePlayground(this) && animation && alpha && scaleh && scalev && !options.hidden) {
				ctx.save();

				ctx.translate(this.centerx, this.centery);

				if (angle) {
					ctx.rotate(angle);
				}

				if ((scaleh !== 1) || (scalev !== 1)) {
					ctx.scale(scaleh, scalev);
				}

				old_alpha = fg.globalAlpha;
				if (alpha !== 1) {
					fg.globalAlpha *= alpha;
					ctx.globalAlpha = fg.globalAlpha;
				}

				fg.safeDrawImage(
					ctx,
					animation_options.img,
					animation_options.offsetx + options.multix + (currentFrame * animation_options.deltax),
					animation_options.offsety + options.multiy + (currentFrame * animation_options.deltay),
					width,
					height,
					-(this.halfWidth),
					-(this.halfHeight),
					width,
					height
				);

				ctx.restore();

				fg.globalAlpha = old_alpha;
			}
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	overrides.PSpriteGroup = fg.pick(fg.PSpriteGroup, [
		'init',
		'remove',
		'draw'
	]);

	fg.extend(fg.PSpriteGroup, {
		init: function (name, options, parent) {
			var
				dom,
				width,
				height,
				canvas
			;

			this.old_options = {};

			if (!parent) {
				dom = options.parentDOM;
				if (dom.getContext) {
					this.dom = null;

					fg.ctx = dom.getContext('2d');

					// Force the width and height of the sprite group the same as the ones defined for the canvas
					options.width = dom.width || 300;
					options.height = dom.height || 150;
				} else {
					width = options.width;
					height = options.height;

					canvas = document.createElement('canvas');
					canvas.id = [fg.domPrefix, name].join('');
					canvas.width = width;
					canvas.height = height;
					dom.insertBefore(canvas, dom.firstChild);
					canvas.className = fg.cssClass;	// Reset background properties set by external CSS
					fg.extend(canvas.style, {
						'left': '0px',
						'top': '0px',
						'width': [String(width), 'px'].join(''),
						'height': [String(height), 'px'].join(''),
						'overflow': 'hidden'
					});

					this.dom = canvas;

					fg.ctx = canvas.getContext('2d');
				}
			}

			// Call the overridden function last, in order to have the callbacks called once the object has been fully initialized
			overrides.PSpriteGroup.init.apply(this, arguments);
		},

		// Public functions

		remove: function () {
			var
				background = this.options.background,
				old_background = this.old_options.background,
				border_color = this.options.borderColor,
				old_border_color = this.old_options.borderColor,
				dom = this.dom
			;

			overrides.PSpriteGroup.remove.apply(this, arguments);

			if (old_background && old_background.removeGroup) {
				old_background.removeGroup(this);
			}

			if (background && background.removeGroup) {
				background.removeGroup(this);
			}

			if (old_border_color && old_border_color.removeGroup) {
				old_border_color.removeGroup(this);
			}

			if (border_color && border_color.removeGroup) {
				border_color.removeGroup(this);
			}

			if (dom && dom.parentNode) {
				dom.parentNode.removeChild(dom);
			}
		},

		// Implementation details

		draw: function () {
			var
				options = this.options,
				old_options = this.old_options,
				parent = this.parent,
				left = this.left,
				top = this.top,
				width = this.width,
				height = this.height,
				insidePlayground = fg.insidePlayground(this),
				background = insidePlayground && options.background,
				old_background = old_options.background,
				border_radius = options.borderRadius,
				border_width = options.borderWidth,
				border_double_width = border_width * 2,
				border_quad_width = border_width * 4,
				border_color = insidePlayground && border_width && options.borderColor,
				old_border_color = old_options.borderColor,
				background_changed = background !== old_background,
				border_changed = border_color !== old_border_color,
				size_changed = (width !== old_options.width) || (height !== old_options.height),
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				crop = options.crop,
				old_alpha,
				alpha_changed,
				context_saved,
				ctx = fg.ctx
			;

			if (!parent) {
				fg.ctx.clearRect(0, 0, width, height);
				fg.globalAlpha = 1;
			}

			if (insidePlayground) {
				if (background_changed || border_changed || size_changed) {
					if (background_changed || size_changed) {
						if (old_background && old_background.removeGroup) {
							// TO DO -- If the background color and boder color were the same, and now the background color changes,
							// this removeGroup will cause problems with the border, as this color is still used by this group.
							old_background.removeGroup(this);
						}

						if (background && background.addGroup) {
							background.addGroup(this);
						}
					}

					if (border_changed || size_changed) {
						if (old_border_color && old_border_color.removeGroup) {
							old_border_color.removeGroup(this);
						}

						if (border_color && border_color.addGroup) {
							border_color.addGroup(this);
						}
					}

					old_options.width = width;
					old_options.height = height;
					old_options.background = background;
					old_options.borderColor = border_color;
				}
			}

			if ((this.layers.length || background || border_color) && alpha && scaleh && scalev && !options.hidden) {
				if (angle || (scaleh !== 1) || (scalev !== 1)) {
					ctx.save();
					context_saved = true;

					ctx.translate(this.centerx, this.centery);

					if (angle) {
						ctx.rotate(angle);
					}

					if ((scaleh !== 1) || (scalev !== 1)) {
						ctx.scale(scaleh, scalev);
					}

					ctx.translate(-this.halfWidth, -this.halfHeight);
				} else if (left || top) {
					ctx.save();
					context_saved = true;

					ctx.translate(left, top);
				} else {
					context_saved = false;
				}

				old_alpha = fg.globalAlpha;
				if (alpha !== 1) {
					// Don't save the entire context only for alpha changes
					fg.globalAlpha *= alpha;
					ctx.globalAlpha = fg.globalAlpha;
					alpha_changed = true;
				} else {
					alpha_changed = false;
				}

				if (background || crop) {
					// Prepare a rect path for the background and the clipping region
					ctx.beginPath();

					if (border_radius) {
						fg.roundedRect(ctx, 0, 0, width, height, border_radius);
					} else {
						ctx.rect(0, 0, width, height);
					}
				}

				if (background) {
					background.drawBackground(ctx, this);
				}

				if (border_color) {
					// The border has to be drawn only outside the rect, to do so there are 2 ways:
					// 1. Set the clip region outside the rect, and draw the rect with a double sized stroke
					// 2. Draw a bigger rect with a normal stroke
					// Here method 1 is used, as I don't know which one is faster (2 sounds faster...), and
					// I don't know how to handle the border radius using option 2.
					ctx.save();

					ctx.beginPath();

					ctx.rect(-border_double_width, -border_double_width, width + border_quad_width, height + border_quad_width);

					fg.roundedRect(ctx, 0, 0, width, height, border_radius);

					ctx.clip();

					ctx.beginPath();

					if (border_radius) {
						fg.roundedRect(ctx, 0, 0, width, height, border_radius);
					} else {
						ctx.rect(0, 0, width, height);
					}

					border_color.setStrokeStyle(ctx, this);
					ctx.lineWidth = border_double_width;
					ctx.stroke();

					ctx.restore();
				}

				if (crop) {
					if (!context_saved) {
						ctx.save();
						context_saved = true;
					}

					ctx.clip();
				}

				overrides.PSpriteGroup.draw.apply(this, arguments);

				if (context_saved) {
					// ctx.restore restores also the globalAlpha value
					ctx.restore();
				} else {
					if (alpha_changed) {
						ctx.globalAlpha = old_alpha;
					}
				}

				fg.globalAlpha = old_alpha;
			}
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.safeDrawImage = function (tox, img, sx, sy, sw, sh, dx, dy, dw, dh) {
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

	fg.roundedRect = function (ctx, x, y, width, height, radius) {
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height-radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
	};
}(friGame));

