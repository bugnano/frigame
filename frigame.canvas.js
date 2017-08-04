/*global friGame */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2017 Franco Bugnano

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

		addGroup: function (ctx, group) {
			var
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
					gradient = fg.ctx.createLinearGradient(0, 0, width, height);
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
					gradient_groups[name] = null;
					delete gradient_groups[name];

					if (gradients[dimension]) {
						gradient_groups = gradients[dimension].groups;
						if (gradient_groups[name]) {
							// Remove the group from the dimension
							gradient_groups[name] = null;
							delete gradient_groups[name];
							if (fg.isEmptyObject(gradient_groups)) {
								// If no groups are using this dimension, delete the gradient
								gradients[dimension] = null;
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
		createCanvas: function (width, height) {
			var
				canvas
			;

			canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			this.canvas = canvas;
			this.canvas_width = width;
			this.canvas_height = height;
			this.ctx = canvas.getContext('2d');
		},

		drawBackground: function (ctx, group) {
			var
				img = this.options.frameset[0].img,
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
					style = fg.ctx.createPattern(img, 'repeat');
					this.style = style;
				}

				ctx.fillStyle = style;
				ctx.fill();
			}
		},

		drawMask: function (ctx, group) {
			var
				group_options = group.options,
				mask_type = group_options.maskType,
				background_type = group_options.backgroundType,
				background = group_options.background,
				background_name = background.name,
				img = this.options.frameset[0].img,
				style = this.style,
				width = group.width,
				height = group.height,
				canvas = this.canvas,
				canvas_width = this.canvas_width,
				canvas_height = this.canvas_height,
				my_ctx = this.ctx
			;

			if (!canvas) {
				this.createCanvas(width, height);
				canvas = this.canvas;
				canvas_width = this.canvas_width;
				canvas_height = this.canvas_height;
				my_ctx = this.ctx;
			}

			if ((width !== this.last_width) || (height !== this.last_height) || (mask_type !== this.last_mask_type) || (background_type !== this.last_background_type) || (background_name !== this.last_background)) {
				if (canvas_width < width) {
					canvas.width = width;
					canvas_width = width;
					this.canvas_width = width;
				}

				if (canvas_height < height) {
					canvas.height = height;
					canvas_height = height;
					this.canvas_height = height;
				}

				// STEP 1: Draw the mask
				my_ctx.globalCompositeOperation = 'copy';
				my_ctx.rect(0, 0, width, height);
				if (mask_type === fg.MASK_STRETCHED) {
					// Stretched mask
					fg.safeDrawImage(
						my_ctx,
						img,
						0,
						0,
						img.width,
						img.height,
						0,
						0,
						width,
						height
					);
				} else {
					// Tiled mask
					if (!style) {
						style = fg.ctx.createPattern(img, 'repeat');
						this.style = style;
					}

					my_ctx.fillStyle = style;
					my_ctx.fill();
				}

				// STEP 2: Draw the background
				my_ctx.globalCompositeOperation = 'source-in';
				background.drawBackground(my_ctx, group);

				this.last_width = width;
				this.last_height = height;
				this.last_mask_type = mask_type;
				this.last_background_type = background_type;
				this.last_background = background_name;
			}

			// Finally, draw the canvas inside the group
			fg.safeDrawImage(
				ctx,
				canvas,
				0,
				0,
				width,
				height,
				0,
				0,
				width,
				height
			);
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.extend(fg.PSprite, {
		draw: function (interp) {
			var
				round = Math.round,
				options = this.options,
				animation = options.animation,
				transformOriginx = options.transformOriginx,
				transformOriginy = options.transformOriginy,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				old_alpha,
				alpha_changed,
				old_blend_mode,
				blend_mode_changed,
				sprite_sheet,
				left = this.left,
				top = this.top,
				width = this.width,
				height = this.height,
				prevLeft = this.prevLeft,
				prevTop = this.prevTop,
				frameCounter,
				insidePlayground,
				currentFrame = options.currentFrame,
				ctx = fg.ctx
			;

			if ((left !== prevLeft) || (top !== prevTop)) {
				frameCounter = fg.frameCounter - 1;

				if (frameCounter !== this.frameCounterLastMove) {
					this.prevLeft = left;
					this.prevTop = top;
					this.frameCounterLastMove = frameCounter;
				} else {
					top = round((top * interp) + (prevTop * (1 - interp)));
					left = round((left * interp) + (prevLeft * (1 - interp)));
				}
			}

			insidePlayground = fg.insidePlayground(left, top, width, height);

			if (insidePlayground && animation && alpha && scaleh && scalev && !options.hidden) {
				sprite_sheet = this.animation_options.frameset[options.currentSpriteSheet];

				if (alpha !== 1) {
					// Don't save the entire context only for alpha changes
					old_alpha = fg.globalAlpha;
					fg.globalAlpha *= alpha;
					ctx.globalAlpha = fg.globalAlpha;
					alpha_changed = true;
				} else {
					alpha_changed = false;
				}

				if (options.blendMode) {
					old_blend_mode = ctx.globalCompositeOperation;
					ctx.globalCompositeOperation = options.blendMode;
					blend_mode_changed = true;
				} else {
					blend_mode_changed = false;
				}

				if (angle || (scaleh !== 1) || (scalev !== 1)) {
					ctx.save();

					if (typeof transformOriginx === 'string') {
						transformOriginx = this[transformOriginx];
					}

					if (typeof transformOriginy === 'string') {
						transformOriginy = this[transformOriginy];
					}

					ctx.translate(left + transformOriginx, top + transformOriginy);

					if (angle) {
						ctx.rotate(angle);
					}

					if ((scaleh !== 1) || (scalev !== 1)) {
						ctx.scale(scaleh, scalev);
					}

					ctx.translate(-transformOriginx, -transformOriginy);

					fg.safeDrawImage(
						ctx,
						sprite_sheet.img,
						sprite_sheet.offsetx + options.multix + (currentFrame * sprite_sheet.deltax),
						sprite_sheet.offsety + options.multiy + (currentFrame * sprite_sheet.deltay),
						width,
						height,
						0,
						0,
						width,
						height
					);

					ctx.restore();
				} else {
					fg.safeDrawImage(
						ctx,
						sprite_sheet.img,
						sprite_sheet.offsetx + options.multix + (currentFrame * sprite_sheet.deltax),
						sprite_sheet.offsety + options.multiy + (currentFrame * sprite_sheet.deltay),
						width,
						height,
						left,
						top,
						width,
						height
					);
				}

				if (blend_mode_changed) {
					ctx.globalCompositeOperation = old_blend_mode;
				}

				if (alpha_changed) {
					ctx.globalAlpha = old_alpha;
					fg.globalAlpha = old_alpha;
				}
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
					canvas.id = fg.domPrefix + name;
					canvas.width = width;
					canvas.height = height;
					dom.insertBefore(canvas, dom.firstChild);
					canvas.className = fg.cssClass;	// Reset background properties set by external CSS
					fg.extend(canvas.style, {
						'left': '0px',
						'top': '0px',
						'width': String(width) + 'px',
						'height': String(height) + 'px',
						'overflow': 'hidden'
					});

					this.dom = canvas;

					fg.ctx = canvas.getContext('2d');
				}
			}

			// Call the overridden function last, in order to have the callbacks called once the object has been fully initialized
			overrides.PSpriteGroup.init.apply(this, arguments);

			this.gradients = {};
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

		draw: function (interp) {
			var
				round = Math.round,
				options = this.options,
				old_options = this.old_options,
				parent = this.parent,
				left = this.left,
				top = this.top,
				width = this.width,
				height = this.height,
				prevLeft = this.prevLeft,
				prevTop = this.prevTop,
				frameCounter,
				insidePlayground,
				background,
				old_background = old_options.background,
				mask = options.mask,
				top_left_radius = options.borderTopLeftRadius,
				top_right_radius = options.borderTopRightRadius,
				bottom_right_radius = options.borderBottomRightRadius,
				bottom_left_radius = options.borderBottomLeftRadius,
				border_radius = top_left_radius || top_right_radius || bottom_right_radius || bottom_left_radius,
				border_width = options.borderWidth,
				border_half_width = border_width / 2,
				border_color,
				old_border_color = old_options.borderColor,
				background_changed,
				border_changed,
				size_changed = (width !== old_options.width) || (height !== old_options.height),
				transformOriginx = options.transformOriginx,
				transformOriginy = options.transformOriginy,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				crop = options.crop,
				old_alpha,
				alpha_changed,
				old_blend_mode,
				blend_mode_changed,
				context_saved,
				ctx = fg.ctx
			;

			if (!parent) {
				ctx.clearRect(0, 0, width, height);
				fg.globalAlpha = 1;
			}

			if ((left !== prevLeft) || (top !== prevTop)) {
				frameCounter = fg.frameCounter - 1;

				if (frameCounter !== this.frameCounterLastMove) {
					this.prevLeft = left;
					this.prevTop = top;
					this.frameCounterLastMove = frameCounter;
				} else {
					top = round((top * interp) + (prevTop * (1 - interp)));
					left = round((left * interp) + (prevLeft * (1 - interp)));
				}
			}

			insidePlayground = fg.insidePlayground(left, top, width, height);
			background = insidePlayground && options.background;
			border_color = insidePlayground && border_width && options.borderColor;
			background_changed = background !== old_background;
			border_changed = border_color !== old_border_color;

			if (insidePlayground) {
				if (background_changed || border_changed || size_changed) {
					if (background_changed || size_changed) {
						if (old_background && old_background.removeGroup) {
							this.gradients[old_background.name] -= 1;
							if (size_changed || (!this.gradients[old_background.name])) {
								old_background.removeGroup(this);
							}
						}

						if (background && background.addGroup) {
							if (!this.gradients[background.name]) {
								this.gradients[background.name] = 1;
							} else {
								this.gradients[background.name] += 1;
							}

							background.addGroup(ctx, this);
						}

						old_options.background = background;
					}

					if (border_changed || size_changed) {
						if (old_border_color && old_border_color.removeGroup) {
							this.gradients[old_border_color.name] -= 1;
							if (size_changed || (!this.gradients[old_border_color.name])) {
								old_border_color.removeGroup(this);
							}
						}

						if (border_color && border_color.addGroup) {
							if (!this.gradients[border_color.name]) {
								this.gradients[border_color.name] = 1;
							} else {
								this.gradients[border_color.name] += 1;
							}

							border_color.addGroup(ctx, this);
						}

						old_options.borderColor = border_color;
					}

					old_options.width = width;
					old_options.height = height;
				}
			}

			if ((this.layers.length || background || border_color) && alpha && scaleh && scalev && !options.hidden) {
				if (angle || (scaleh !== 1) || (scalev !== 1)) {
					ctx.save();
					context_saved = true;

					if (typeof transformOriginx === 'string') {
						transformOriginx = this[transformOriginx];
					}

					if (typeof transformOriginy === 'string') {
						transformOriginy = this[transformOriginy];
					}

					ctx.translate(left + transformOriginx, top + transformOriginy);

					if (angle) {
						ctx.rotate(angle);
					}

					if ((scaleh !== 1) || (scalev !== 1)) {
						ctx.scale(scaleh, scalev);
					}

					ctx.translate(-transformOriginx, -transformOriginy);
				} else if (left || top) {
					ctx.save();
					context_saved = true;

					ctx.translate(left, top);
				} else {
					context_saved = false;
				}

				if (alpha !== 1) {
					// Don't save the entire context only for alpha changes
					old_alpha = fg.globalAlpha;
					fg.globalAlpha *= alpha;
					ctx.globalAlpha = fg.globalAlpha;
					alpha_changed = true;
				} else {
					alpha_changed = false;
				}

				if (options.blendMode) {
					old_blend_mode = ctx.globalCompositeOperation;
					ctx.globalCompositeOperation = options.blendMode;
					blend_mode_changed = true;
				} else {
					blend_mode_changed = false;
				}

				if (background || crop) {
					// Prepare a rect path for the background and the clipping region
					ctx.beginPath();

					if (border_radius) {
						fg.roundedRect(ctx, 0, 0, width, height, top_left_radius, top_right_radius, bottom_right_radius, bottom_left_radius);
					} else {
						ctx.rect(0, 0, width, height);
					}

					ctx.closePath();
				}

				if (background) {
					if (mask) {
						mask.drawMask(ctx, this);
					} else {
						background.drawBackground(ctx, this);
					}
				}

				if (border_color) {
					ctx.beginPath();

					if (border_radius) {
						fg.roundedRect(ctx, -border_half_width, -border_half_width, width + border_width, height + border_width,
							top_left_radius ? top_left_radius + border_half_width : 0,
							top_right_radius ? top_right_radius + border_half_width : 0,
							bottom_right_radius ? bottom_right_radius + border_half_width : 0,
							bottom_left_radius ? bottom_left_radius + border_half_width : 0
						);
					} else {
						ctx.rect(-border_half_width, -border_half_width, width + border_width, height + border_width);
					}

					ctx.closePath();

					border_color.setStrokeStyle(ctx, this);
					ctx.lineWidth = border_width;
					ctx.stroke();
				}

				if (crop) {
					if (!context_saved) {
						ctx.save();
						context_saved = true;
					}

					if (border_color) {
						// The border has created a new path, so the old path must be re-created here
						ctx.beginPath();

						if (border_radius) {
							fg.roundedRect(ctx, 0, 0, width, height, top_left_radius, top_right_radius, bottom_right_radius, bottom_left_radius);
						} else {
							ctx.rect(0, 0, width, height);
						}

						ctx.closePath();
					}

					ctx.clip();
				}

				overrides.PSpriteGroup.draw.apply(this, arguments);

				if (context_saved) {
					// ctx.restore restores also the globalCompositeOperation and globalAlpha values
					ctx.restore();

					if (alpha_changed) {
						fg.globalAlpha = old_alpha;
					}
				} else {
					if (blend_mode_changed) {
						ctx.globalCompositeOperation = old_blend_mode;
					}

					if (alpha_changed) {
						ctx.globalAlpha = old_alpha;
						fg.globalAlpha = old_alpha;
					}
				}
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

	fg.roundedRect = function (ctx, x, y, width, height, top_left_radius, top_right_radius, bottom_right_radius, bottom_left_radius) {
		var
			pi = Math.PI,
			pi_2 = pi / 2,
			right = x + width,
			bottom = y + height,
			top_left_x = x + top_left_radius,
			top_right_x = right - top_right_radius,
			bottom_right_y = bottom - bottom_right_radius,
			bottom_left_x = x + bottom_left_radius,
			top_left_y = y + top_left_radius
		;

		ctx.moveTo(top_left_x, y);

		ctx.lineTo(top_right_x, y);

		if (top_right_radius) {
			ctx.arc(top_right_x, y + top_right_radius, top_right_radius, -pi_2, 0, false);
		}

		ctx.lineTo(right, bottom_right_y);

		if (bottom_right_radius) {
			ctx.arc(right - bottom_right_radius, bottom_right_y, bottom_right_radius, 0, pi_2, false);
		}

		ctx.lineTo(bottom_left_x, bottom);

		if (bottom_left_radius) {
			ctx.arc(bottom_left_x, bottom - bottom_left_radius, bottom_left_radius, pi_2, pi, false);
		}

		ctx.lineTo(x, top_left_y);

		if (top_left_radius) {
			ctx.arc(top_left_x, top_left_y, top_left_radius, pi, -pi_2, false);
		}
	};
}(friGame));

