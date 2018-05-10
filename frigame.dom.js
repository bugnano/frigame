/*global Modernizr, jQuery, friGame */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2018 Franco Bugnano

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

(function ($, fg) {
	'use strict';

	var
		overrides = {}
	;

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.support = {
		ieFilter: false,
		rgba: Modernizr.rgba,
		svg: Modernizr.svg
	};

	if (Modernizr.opacity) {
		fg.support.opacity = Modernizr.prefixed('opacity');
	}

	if (Modernizr.csstransforms) {
		fg.support.transformFunction = Modernizr.prefixed('transform');
		fg.support.transformOrigin = Modernizr.prefixed('transformOrigin');
	}

	if (Modernizr.backgroundsize) {
		fg.support.backgroundsize = Modernizr.prefixed('backgroundSize');
	}

	if (Modernizr.borderradius) {
		fg.support.borderTopLeftRadius = Modernizr.prefixed('borderTopLeftRadius');
		fg.support.borderTopRightRadius = Modernizr.prefixed('borderTopRightRadius');
		fg.support.borderBottomRightRadius = Modernizr.prefixed('borderBottomRightRadius');
		fg.support.borderBottomLeftRadius = Modernizr.prefixed('borderBottomLeftRadius');
	}

	if (Modernizr.backgroundblendmode) {
		fg.support.mixBlendMode = Modernizr.prefixed('mixBlendMode');
	}

	if (Modernizr.cssmask) {
		fg.support.maskImage = Modernizr.prefixed('maskImage');
		fg.support.maskSize = Modernizr.prefixed('maskSize');
	}

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.nextGradientId = 0;

	$.extend(fg.PGradient, {
		initDOM: function () {
			var
				startColor = this.startColor,
				endColor = this.endColor,
				str_a,
				str_r,
				str_g,
				str_b,
				start_color_string,
				end_color_string,
				type,
				x2,
				y2,
				svg,
				support = fg.support
			;

			// If used as a border, only the solid color is supported
			if (startColor.a === 1) {
				this.solid_color = 'rgb(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ')';
			} else {
				if (support.rgba) {
					this.solid_color = this.startColorStr;
				} else {
					// Alpha not supported, use a simple rgb color
					this.solid_color = 'rgb(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ')';
				}
			}

			if (startColor === endColor) {
				// Solid color
				if (startColor.a === 1) {
					this.css_options = {
						'background-color': 'rgb(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ')'
					};
				} else {
					if (support.rgba) {
						this.css_options = {
							'background-color': this.startColorStr
						};
					} else if (support.ieFilter) {
						// Alpha supported through proprietary filter
						str_a = '0' + Math.round(startColor.a * 255).toString(16).toUpperCase();
						str_r = '0' + startColor.r.toString(16).toUpperCase();
						str_g = '0' + startColor.g.toString(16).toUpperCase();
						str_b = '0' + startColor.b.toString(16).toUpperCase();
						start_color_string = '#' + str_a.slice(str_a.length - 2) + str_r.slice(str_r.length - 2) + str_g.slice(str_g.length - 2) + str_b.slice(str_b.length - 2);

						this.ie_filter = 'progid:DXImageTransform.Microsoft.Gradient(GradientType=0,startColorstr="' + start_color_string + '",endColorstr="' + start_color_string + '")';
					} else {
						// Alpha not supported, use a simple rgb color
						this.css_options = {
							'background-color': 'rgb(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ')'
						};
					}
				}
			} else {
				// Gradient
				if (support.svg) {
					start_color_string = 'rgb(' + String(startColor.r) + ',' + String(startColor.g) + ',' + String(startColor.b) + ')';
					end_color_string = 'rgb(' + String(endColor.r) + ',' + String(endColor.g) + ',' + String(endColor.b) + ')';

					if (this.type === fg.GRADIENT_HORIZONTAL) {
						x2 = 100;
						y2 = 0;
					} else {
						x2 = 0;
						y2 = 100;
					}

					svg = '' +
						'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">' +
							'<defs>' +
								'<linearGradient id="friGameGradient' + String(fg.nextGradientId) + '" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="' + String(x2) + '%" y2="' + String(y2) + '%">' +
									'<stop offset="0%" stop-color="' + start_color_string + '" stop-opacity="' + String(startColor.a) + '" />' +
									'<stop offset="100%" stop-color="' + end_color_string + '" stop-opacity="' + String(endColor.a) + '" />' +
								'</linearGradient>' +
							'</defs>' +

							'<rect x="0" y="0" width="1" height="1" fill="url(#friGameGradient' + String(fg.nextGradientId) + ')" />' +
						'</svg>'
					;
					fg.nextGradientId += 1;

					this.css_options = {
						'background-image': 'url("data:image/svg+xml;base64,' + btoa(svg) + '")'
					};

					if (support.backgroundsize) {
						this.css_options[support.backgroundsize] = '100% 100%';
					}
				} else if (support.ieFilter) {
					// Gradient supported through proprietary filter
					str_a = '0' + Math.round(startColor.a * 255).toString(16).toUpperCase();
					str_r = '0' + startColor.r.toString(16).toUpperCase();
					str_g = '0' + startColor.g.toString(16).toUpperCase();
					str_b = '0' + startColor.b.toString(16).toUpperCase();
					start_color_string = '#' + str_a.slice(str_a.length - 2) + str_r.slice(str_r.length - 2) + str_g.slice(str_g.length - 2) + str_b.slice(str_b.length - 2);

					str_a = '0' + Math.round(endColor.a * 255).toString(16).toUpperCase();
					str_r = '0' + endColor.r.toString(16).toUpperCase();
					str_g = '0' + endColor.g.toString(16).toUpperCase();
					str_b = '0' + endColor.b.toString(16).toUpperCase();
					end_color_string = '#' + str_a.slice(str_a.length - 2) + str_r.slice(str_r.length - 2) + str_g.slice(str_g.length - 2) + str_b.slice(str_b.length - 2);

					if (this.type === fg.GRADIENT_HORIZONTAL) {
						type = 1;
					} else {
						type = 0;
					}

					this.ie_filter = 'progid:DXImageTransform.Microsoft.Gradient(GradientType=' + type + ',startColorstr="' + start_color_string + '",endColorstr="' + end_color_string + '")';
				} else {
					// Fallback to solid color
					this.css_options = {
						'background-color': this.solid_color
					};
				}
			}

			this.dom_initialized = true;
		},

		getBackground: function (background_type, css_options, ie_filters) {
			var
				apply_ie_filters = false
			;

			if (!this.dom_initialized) {
				this.initDOM();
			}

			if (this.css_options) {
				$.extend(css_options, this.css_options);
			}

			if (this.ie_filter) {
				ie_filters.gradient = this.ie_filter;
				apply_ie_filters = true;
			}

			return apply_ie_filters;
		},

		getSolidColor: function () {
			if (!this.dom_initialized) {
				this.initDOM();
			}

			return this.solid_color;
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	$.extend(fg.PAnimation, {
		getBackground: function (background_type, css_options, ie_filters) {
			var
				support = fg.support,
				apply_ie_filters = false,
				imageURL = this.options.frameset[0].imageURL
			;

			if (background_type === fg.BACKGROUND_STRETCHED) {
				if (support.backgroundsize) {
					// The proper way to stretch the background
					css_options['background-image'] = 'url("' + imageURL + '")';
					css_options[support.backgroundsize] = '100% 100%';
				} else if (support.ieFilter) {
					// Background stretching supported through proprietary filter
					ie_filters.image = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + imageURL + '",sizingMethod="scale")';
					apply_ie_filters = true;
				} else {
					// Background stretching not supported, fall back to tiled
					css_options['background-image'] = 'url("' + imageURL + '")';
				}
			} else {
				// A simple tiled background
				css_options['background-image'] = 'url("' + imageURL + '")';
			}

			return apply_ie_filters;
		},

		getMask: function (mask_type, css_options, ie_filters) {
			var
				support = fg.support,
				apply_ie_filters = false,
				imageURL = this.options.frameset[0].imageURL
			;

			if (support.maskImage) {
				css_options[support.maskImage] = 'url("' + imageURL + '")';

				if (mask_type === fg.MASK_STRETCHED) {
					css_options[support.maskSize] = '100% 100%';
				}
			}

			// There are no fallback options here. If the CSS Mask is not supported, it is simply ignored

			return apply_ie_filters;
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	$.extend(fg.PBaseSprite, {
		// Implementation details

		transform: function (angle, scaleh, scalev) {
			var
				transform = ''
			;

			if (angle) {
				transform += 'rotate(' + String(angle) + 'rad)';
			}

			if ((scaleh !== 1) || (scalev !== 1)) {
				transform += 'scale(' + String(scaleh) + ',' + String(scalev) + ')';
			}

			return transform;
		},

		ieTransform: function (angle, scaleh, scalev, transformOriginx, transformOriginy) {
			var
				filters = this.ieFilters,
				cos,
				sin,
				m11,
				m12,
				m21,
				m22,
				translated_centerx,
				translated_centery,
				transformed_centerx,
				transformed_centery,
				filter
			;

			// Apply the transformation matrix
			if (angle || (scaleh !== 1) || (scalev !== 1)) {
				cos = Math.cos(angle);
				sin = Math.sin(angle);
				m11 = cos * scaleh;
				m12 = -sin * scalev;
				m21 = sin * scaleh;
				m22 = cos * scalev;
				filter = '' +
					'progid:DXImageTransform.Microsoft.Matrix(M11=' + String(m11) +
					',M12=' + String(m12) +
					',M21=' + String(m21) +
					',M22=' + String(m22) +
					',SizingMethod="auto expand",FilterType="nearest neighbor")'
				;

				// Adjust the transform origin (STEP 1/2)
				// Based on:
				// http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php

				// Take the original center of the element and translate it by the negated transform origin
				translated_centerx = this.halfWidth - transformOriginx;
				translated_centery = this.halfHeight - transformOriginy;

				// Apply the matrix transform to the result
				transformed_centerx = (m11 * translated_centerx) + (m12 * translated_centery);
				transformed_centery = (m21 * translated_centerx) + (m22 * translated_centery);

				// Translate the result by the transform origin
				filters.transformedCenterx = transformed_centerx + transformOriginx;
				filters.transformedCentery = transformed_centery + transformOriginy;
			} else {
				filter = '';

				filters.transformedCenterx = 0;
				filters.transformedCentery = 0;
			}

			this.ieFilters.matrix = filter;
		},

		ieAlpha: function (alpha) {
			var
				filter
			;

			// Apply the opacity
			if (alpha !== 1) {
				filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + String(Math.round(alpha * 100)) + ')';
			} else {
				filter = '';
			}

			this.ieFilters.alpha = filter;
		},

		applyIeFilters: function (left, top) {
			var
				dom = this.dom,
				options = this.options,
				filters = this.ieFilters,
				matrix = filters.matrix,
				newWidth,
				newHeight,
				round = Math.round
			;

			// Step 1: Apply the filters
			dom.css('filter', matrix + filters.alpha + filters.gradient + filters.image);

			// Step 2: Adjust the element position according to the new width and height
			if (matrix) {
				// Adjust the transform origin (STEP 2/2)
				newWidth = dom.width();
				newHeight = dom.height();

				// Subtract from the x value of the result half the width of the bounding box,
				// and from the y value of the result half the height of the bounding box
				options.posOffsetX = -round(filters.transformedCenterx - (newWidth / 2));
				options.posOffsetY = -round(filters.transformedCentery - (newHeight / 2));
			} else {
				options.posOffsetX = 0;
				options.posOffsetY = 0;
			}

			dom.css({
				'left': String(left - options.posOffsetX) + 'px',
				'top': String(top - options.posOffsetY) + 'px'
			});
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	overrides.PSprite = fg.pick(fg.PSprite, [
		'init',
		'remove'
	]);

	$.extend(fg.PSprite, {
		init: function (name, options, parent) {
			overrides.PSprite.init.apply(this, arguments);

			this.old_options = {};
		},

		// Public functions

		remove: function () {
			if (this.dom) {
				this.dom.remove();
			}

			overrides.PSprite.remove.apply(this, arguments);
		},

		// Implementation details

		draw: function (interp) {
			var
				round = Math.round,
				options = this.options,
				old_options = this.old_options,
				parent = this.parent,
				currentSpriteSheet = options.currentSpriteSheet,
				currentFrame = options.currentFrame,
				animation = options.animation,
				sprite_sheet,
				imageURL,
				dom = this.dom,
				left = this.left,
				top = this.top,
				width = this.width,
				height = this.height,
				prevLeft = this.prevLeft,
				prevTop = this.prevTop,
				insidePlayground,
				multix = options.multix,
				multiy = options.multiy,
				transformOriginx = options.transformOriginx,
				transformOriginy = options.transformOriginy,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				hidden = options.hidden,
				blendMode = options.blendMode,
				css_options = {},
				update_css = false,
				update_position = false,
				support = fg.support,
				transformFunction = support.transformFunction,
				transformOrigin = support.transformOrigin,
				ieFilter = support.ieFilter,
				apply_ie_filters = false,
				last_sprite = fg.last_sprite
			;

			if ((left !== prevLeft) || (top !== prevTop)) {
				if (this.frameCounterLastMove === (fg.frameCounter - 1)) {
					left = round((left * interp) + (prevLeft * (1 - interp)));
					top = round((top * interp) + (prevTop * (1 - interp)));
				} else {
					this.prevLeft = left;
					this.prevTop = top;
				}
			}

			insidePlayground = fg.insidePlayground(left, top, width, height);

			if (insidePlayground && animation && alpha && scaleh && scalev && !options.hidden) {
				if (!dom) {
					dom = $('<div id="' + fg.domPrefix + this.name + '"></div>');
					dom.addClass(fg.cssClass);	// Reset background properties set by external CSS

					if (last_sprite === parent) {
						dom.prependTo(fg.s[parent].dom);
					} else {
						dom.insertAfter(fg.s[last_sprite].dom);
					}

					old_options.last_sprite = last_sprite;

					this.dom = dom;

					if (ieFilter) {
						this.ieFilters = {
							matrix: '',
							alpha: '',
							gradient: '',
							image: ''
						};
					}
				} else {
					if (last_sprite !== old_options.last_sprite) {
						// The position in the DOM has changed
						dom.detach();
						if (last_sprite === parent) {
							dom.prependTo(fg.s[parent].dom);
						} else {
							dom.insertAfter(fg.s[last_sprite].dom);
						}

						old_options.last_sprite = last_sprite;
					}
				}

				fg.last_sprite = this.name;

				if (insidePlayground !== old_options.insidePlayground) {
					dom.show();
					old_options.insidePlayground = insidePlayground;
				}

				if (hidden !== old_options.hidden) {
					dom.show();
					old_options.hidden = hidden;
				}

				if (left !== old_options.left) {
					css_options.left = String(left - options.posOffsetX) + 'px';
					update_css = true;

					old_options.left = left;
				}

				if (top !== old_options.top) {
					css_options.top = String(top - options.posOffsetY) + 'px';
					update_css = true;

					old_options.top = top;
				}

				sprite_sheet = this.animation_options.frameset[currentSpriteSheet];
				imageURL = sprite_sheet.imageURL;

				if (imageURL !== old_options.imageURL) {
					css_options['background-image'] = 'url("' + imageURL + '")';
					update_css = true;
					update_position = true;

					old_options.imageURL = imageURL;
				}

				if (animation !== old_options.animation) {
					$.extend(css_options, {
						'width': String(width) + 'px',
						'height': String(height) + 'px'
					});
					update_css = true;
					update_position = true;

					if (ieFilter) {
						if (angle || (scaleh !== 1) || (scalev !== 1)) {
							// For transformed objects force the update of the ie filters in order
							// to have the position adjusted according to the transformed width and height
							apply_ie_filters = true;
						}
					}

					old_options.animation = animation;
				}

				if ((multix !== old_options.multix)  || (multiy !== old_options.multiy)) {
					update_position = true;

					old_options.multix = multix;
					old_options.multiy = multiy;
				}

				if (update_position || (currentSpriteSheet !== old_options.currentSpriteSheet) || (currentFrame !== old_options.currentFrame)) {
					css_options['background-position'] = '' +
						String(-(sprite_sheet.offsetx + multix + (currentFrame * sprite_sheet.deltax))) +
						'px ' +
						String(-(sprite_sheet.offsety + multiy + (currentFrame * sprite_sheet.deltay))) +
						'px'
					;
					update_css = true;

					old_options.currentSpriteSheet = currentSpriteSheet;
					old_options.currentFrame = currentFrame;
				}

				if (typeof transformOriginx === 'string') {
					transformOriginx = this[transformOriginx];
				}

				if (typeof transformOriginy === 'string') {
					transformOriginy = this[transformOriginy];
				}

				if ((!transformFunction) && (ieFilter)) {
					if	(
							(transformOriginx !== old_options.transformOriginx)
						||	(transformOriginy !== old_options.transformOriginy)
						||	(angle !== old_options.angle)
						||	(scaleh !== old_options.scaleh)
						||	(scalev !== old_options.scalev)
						) {
						if ((!old_options.scaleh) || (!old_options.scalev)) {
							dom.show();
						}

						this.ieTransform(angle, scaleh, scalev, transformOriginx, transformOriginy);
						update_css = true;
						apply_ie_filters = true;

						old_options.transformOriginx = transformOriginx;
						old_options.transformOriginy = transformOriginy;
						old_options.angle = angle;
						old_options.scaleh = scaleh;
						old_options.scalev = scalev;
					}
				} else {
					if ((transformOriginx !== old_options.transformOriginx) || (transformOriginy !== old_options.transformOriginy)) {
						if (transformOrigin) {
							css_options[transformOrigin] = transformOriginx + 'px ' + transformOriginy + 'px';
							update_css = true;
						}

						old_options.transformOriginx = transformOriginx;
						old_options.transformOriginy = transformOriginy;
					}

					if	(
							(angle !== old_options.angle)
						||	(scaleh !== old_options.scaleh)
						||	(scalev !== old_options.scalev)
						) {
						if ((!old_options.scaleh) || (!old_options.scalev)) {
							dom.show();
						}

						if (transformFunction) {
							css_options[transformFunction] = this.transform(angle, scaleh, scalev);
							update_css = true;
						}

						old_options.angle = angle;
						old_options.scaleh = scaleh;
						old_options.scalev = scalev;
					}
				}

				if (alpha !== old_options.alpha) {
					if (!old_options.alpha) {
						dom.show();
					}

					if (support.opacity) {
						if (alpha !== 1) {
							css_options[support.opacity] = String(alpha);
						} else {
							css_options[support.opacity] = '';
						}
						update_css = true;
					} else if (ieFilter) {
						this.ieAlpha(alpha);
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Opacity not supported
					}

					old_options.alpha = alpha;
				}

				if (blendMode !== old_options.blendMode) {
					if (support.mixBlendMode) {
						if (blendMode) {
							css_options[support.mixBlendMode] = blendMode;
						} else {
							css_options[support.mixBlendMode] = '';
						}
						update_css = true;
					}

					old_options.blendMode = blendMode;
				}

				if (update_css) {
					dom.css(css_options);
				}

				if (ieFilter && apply_ie_filters) {
					this.applyIeFilters(left, top);
				}
			} else {
				if (dom) {
					fg.last_sprite = this.name;

					if (!insidePlayground && (insidePlayground !== old_options.insidePlayground)) {
						dom.hide();
						old_options.insidePlayground = insidePlayground;
					}

					if ((!animation) && (animation !== old_options.animation)) {
						dom.css({
							'background-image': '',
							'background-position': ''
						});
						old_options.imageURL = null;
						old_options.animation = animation;
					}

					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}

					if ((!alpha) && (alpha !== old_options.alpha)) {
						dom.hide();
						old_options.alpha = alpha;
					}

					if ((!scaleh) && (scaleh !== old_options.scaleh)) {
						dom.hide();
						old_options.scaleh = scaleh;
					}

					if ((!scalev) && (scalev !== old_options.scalev)) {
						dom.hide();
						old_options.scalev = scalev;
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

	overrides.PSpriteGroup = fg.pick(fg.PSpriteGroup, [
		'init',
		'remove',
		'draw'
	]);

	$.extend(fg.PSpriteGroup, {
		init: function (name, options, parent) {
			var
				dom
			;

			this.old_options = {};

			if (!parent) {
				dom = $('<div id="' + fg.domPrefix + name + '"></div>').prependTo($(options.parentDOM));
				dom.addClass(fg.cssClass);	// Reset background properties set by external CSS
				dom.css({
					'left': '0px',
					'top': '0px',
					'width': String(options.width) + 'px',
					'height': String(options.height) + 'px',
					'overflow': 'hidden'
				});

				this.old_options.last_sprite = name;

				this.dom = dom;

				if (dom.get(0).filters) {
					fg.support.ieFilter = true;
					this.ieFilters = {
						matrix: '',
						alpha: '',
						gradient: '',
						image: ''
					};
				} else {
					fg.support.ieFilter = false;
				}
			}

			// Call the overridden function last, in order to have the callbacks called once the object has been fully initialized
			overrides.PSpriteGroup.init.apply(this, arguments);
		},

		// Public functions

		remove: function () {
			overrides.PSpriteGroup.remove.apply(this, arguments);

			if (this.dom) {
				this.dom.remove();
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
				background = options.background,
				backgroundType = options.backgroundType,
				mask = options.mask,
				maskType = options.maskType,
				has_border = options.hasBorder,
				top_left_radius = options.borderTopLeftRadius,
				top_right_radius = options.borderTopRightRadius,
				bottom_right_radius = options.borderBottomRightRadius,
				bottom_left_radius = options.borderBottomLeftRadius,
				border_width = (has_border && options.borderWidth) || 0,
				border_color = has_border && options.borderColor,
				border_width_changed = border_width !== old_options.borderWidth,
				transformOriginx = options.transformOriginx,
				transformOriginy = options.transformOriginy,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				hidden = options.hidden,
				crop = options.crop,
				blendMode = options.blendMode,
				css_options = {},
				update_css = false,
				dom = this.dom,
				support = fg.support,
				transformFunction = support.transformFunction,
				transformOrigin = support.transformOrigin,
				ieFilter = support.ieFilter,
				ie_filters = ieFilter && this.ieFilters,
				apply_ie_filters = false,
				last_sprite = fg.last_sprite,
				name = this.name
			;

			if (!parent) {
				last_sprite = name;
				fg.last_sprite = last_sprite;
			}

			if ((left !== prevLeft) || (top !== prevTop)) {
				if (this.frameCounterLastMove === (fg.frameCounter - 1)) {
					left = round((left * interp) + (prevLeft * (1 - interp)));
					top = round((top * interp) + (prevTop * (1 - interp)));
				} else {
					this.prevLeft = left;
					this.prevTop = top;
				}
			}

			if ((this.layers.length || background || border_color) && alpha && scaleh && scalev && !options.hidden) {
				if (!this.dom) {
					dom = $('<div id="' + fg.domPrefix + this.name + '"></div>');
					dom.addClass(fg.cssClass);	// Reset background properties set by external CSS

					if (last_sprite === parent) {
						dom.prependTo(fg.s[parent].dom);
					} else {
						dom.insertAfter(fg.s[last_sprite].dom);
					}

					old_options.last_sprite = last_sprite;

					this.dom = dom;

					if (ieFilter) {
						this.ieFilters = {
							matrix: '',
							alpha: '',
							gradient: '',
							image: ''
						};

						ie_filters = this.ieFilters;
					}
				} else {
					if (last_sprite !== old_options.last_sprite) {
						// The position in the DOM has changed
						dom.detach();
						if (last_sprite === parent) {
							dom.prependTo(fg.s[parent].dom);
						} else {
							dom.insertAfter(fg.s[last_sprite].dom);
						}

						old_options.last_sprite = last_sprite;
					}
				}

				fg.last_sprite = this.name;

				if (hidden !== old_options.hidden) {
					dom.show();
					old_options.hidden = hidden;
				}

				if ((left !== old_options.left) || border_width_changed) {
					css_options.left = String(left - options.posOffsetX - border_width) + 'px';
					update_css = true;

					old_options.left = left;
				}

				if ((top !== old_options.top) || border_width_changed) {
					css_options.top = String(top - options.posOffsetY - border_width) + 'px';
					update_css = true;

					old_options.top = top;
				}

				if (width !== old_options.width) {
					css_options.width = String(width) + 'px';
					update_css = true;

					if (ieFilter) {
						if (angle || (scaleh !== 1) || (scalev !== 1)) {
							// For transformed objects force the update of the ie filters in order
							// to have the position adjusted according to the transformed width and height
							apply_ie_filters = true;
						}
					}

					old_options.width = width;
				}

				if (height !== old_options.height) {
					css_options.height = String(height) + 'px';
					update_css = true;

					if (ieFilter) {
						if (angle || (scaleh !== 1) || (scalev !== 1)) {
							// For transformed objects force the update of the ie filters in order
							// to have the position adjusted according to the transformed width and height
							apply_ie_filters = true;
						}
					}

					old_options.height = height;
				}

				if (typeof transformOriginx === 'string') {
					transformOriginx = this[transformOriginx];
				}

				if (typeof transformOriginy === 'string') {
					transformOriginy = this[transformOriginy];
				}

				if ((!transformFunction) && (ieFilter)) {
					if	(
							(transformOriginx !== old_options.transformOriginx)
						||	(transformOriginy !== old_options.transformOriginy)
						||	(angle !== old_options.angle)
						||	(scaleh !== old_options.scaleh)
						||	(scalev !== old_options.scalev)
						) {
						if ((!old_options.scaleh) || (!old_options.scalev)) {
							dom.show();
						}

						this.ieTransform(angle, scaleh, scalev, transformOriginx, transformOriginy);
						update_css = true;
						apply_ie_filters = true;

						old_options.transformOriginx = transformOriginx;
						old_options.transformOriginy = transformOriginy;
						old_options.angle = angle;
						old_options.scaleh = scaleh;
						old_options.scalev = scalev;
					}
				} else {
					if ((transformOriginx !== old_options.transformOriginx) || (transformOriginy !== old_options.transformOriginy)) {
						if (transformOrigin) {
							css_options[transformOrigin] = transformOriginx + 'px ' + transformOriginy + 'px';
							update_css = true;
						}

						old_options.transformOriginx = transformOriginx;
						old_options.transformOriginy = transformOriginy;
					}

					if	(
							(angle !== old_options.angle)
						||	(scaleh !== old_options.scaleh)
						||	(scalev !== old_options.scalev)
						) {
						if ((!old_options.scaleh) || (!old_options.scalev)) {
							dom.show();
						}

						if (transformFunction) {
							css_options[transformFunction] = this.transform(angle, scaleh, scalev);
							update_css = true;
						}

						old_options.angle = angle;
						old_options.scaleh = scaleh;
						old_options.scalev = scalev;
					}
				}

				if (alpha !== old_options.alpha) {
					if (!old_options.alpha) {
						dom.show();
					}

					if (support.opacity) {
						if (alpha !== 1) {
							css_options[support.opacity] = String(alpha);
						} else {
							css_options[support.opacity] = '';
						}
						update_css = true;
					} else if (ieFilter) {
						this.ieAlpha(alpha);
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Opacity not supported
					}

					old_options.alpha = alpha;
				}

				if (blendMode !== old_options.blendMode) {
					if (support.mixBlendMode) {
						if (blendMode) {
							css_options[support.mixBlendMode] = blendMode;
						} else {
							css_options[support.mixBlendMode] = '';
						}
						update_css = true;
					}

					old_options.blendMode = blendMode;
				}

				if ((background !== old_options.background) || (backgroundType !== old_options.backgroundType)) {
					// Reset all the background options before applying the new background
					css_options['background-color'] = '';
					css_options['background-image'] = '';
					if (support.backgroundsize) {
						css_options[support.backgroundsize] = '';
					}

					if (ie_filters && ie_filters.gradient) {
						ie_filters.gradient = '';
						apply_ie_filters = true;
					}

					if (ie_filters && ie_filters.image) {
						ie_filters.image = '';
						apply_ie_filters = true;
					}

					if (background) {
						if (background.getBackground(backgroundType, css_options, ie_filters)) {
							apply_ie_filters = true;
						}
					}

					update_css = true;

					old_options.background = background;
					old_options.backgroundType = backgroundType;
				}

				if ((mask !== old_options.mask) || (maskType !== old_options.maskType)) {
					// Reset all the mask options before applying the new mask
					if (support.maskImage) {
						css_options[support.maskImage] = '';
						css_options[support.maskSize] = '';
					}

					if (mask) {
						if (mask.getMask(maskType, css_options, ie_filters)) {
							apply_ie_filters = true;
						}
					}

					update_css = true;

					old_options.mask = mask;
					old_options.maskType = maskType;
				}

				if (support.borderTopLeftRadius) {
					if ((top_left_radius !== old_options.borderTopLeftRadius) || border_width_changed) {
						if (top_left_radius) {
							css_options[support.borderTopLeftRadius] = String(top_left_radius + border_width) + 'px';
						} else {
							css_options[support.borderTopLeftRadius] = '';
						}

						update_css = true;

						old_options.borderTopLeftRadius = top_left_radius;
					}

					if ((top_right_radius !== old_options.borderTopRightRadius) || border_width_changed) {
						if (top_right_radius) {
							css_options[support.borderTopRightRadius] = String(top_right_radius + border_width) + 'px';
						} else {
							css_options[support.borderTopRightRadius] = '';
						}

						update_css = true;

						old_options.borderTopRightRadius = top_right_radius;
					}

					if ((bottom_right_radius !== old_options.borderBottomRightRadius) || border_width_changed) {
						if (bottom_right_radius) {
							css_options[support.borderBottomRightRadius] = String(bottom_right_radius + border_width) + 'px';
						} else {
							css_options[support.borderBottomRightRadius] = '';
						}

						update_css = true;

						old_options.borderBottomRightRadius = bottom_right_radius;
					}

					if ((bottom_left_radius !== old_options.borderBottomLeftRadius) || border_width_changed) {
						if (bottom_left_radius) {
							css_options[support.borderBottomLeftRadius] = String(bottom_left_radius + border_width) + 'px';
						} else {
							css_options[support.borderBottomLeftRadius] = '';
						}

						update_css = true;

						old_options.borderBottomLeftRadius = bottom_left_radius;
					}
				}

				if (border_width_changed) {
					if (border_width) {
						css_options['border-width'] = String(border_width) + 'px';
					} else {
						css_options['border-width'] = '';
					}

					update_css = true;

					old_options.borderWidth = border_width;
				}

				if (border_color !== old_options.borderColor) {
					if (border_color) {
						css_options['border-color'] = border_color.getSolidColor();
					} else {
						css_options['border-color'] = '';
					}

					update_css = true;

					old_options.borderWidth = border_width;
				}

				if (crop !== old_options.crop) {
					// Cropping has no effect on the playground
					if (parent) {
						if (crop) {
							css_options.overflow = 'hidden';
						} else {
							css_options.overflow = 'visible';
						}
						update_css = true;
					}

					old_options.crop = crop;
				}

				if (update_css) {
					dom.css(css_options);
				}

				if (ieFilter && apply_ie_filters) {
					this.applyIeFilters(left, top);
				}

				overrides.PSpriteGroup.draw.apply(this, arguments);

				// Update the last sprite after drawing all the children nodes
				fg.last_sprite = name;
			} else {
				if (dom) {
					fg.last_sprite = this.name;

					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}

					if ((!alpha) && (alpha !== old_options.alpha)) {
						dom.hide();
						old_options.alpha = alpha;
					}

					if ((!scaleh) && (scaleh !== old_options.scaleh)) {
						dom.hide();
						old_options.scaleh = scaleh;
					}

					if ((!scalev) && (scalev !== old_options.scalev)) {
						dom.hide();
						old_options.scalev = scalev;
					}
				}
			}
		}
	});
}(jQuery, friGame));

