/*global Modernizr, btoa, jQuery, friGame */
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

(function ($, fg) {
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.support = {
		ieFilter: false,
		transformFunction: '',
		opacity: Modernizr.opacity,
		rgba: Modernizr.rgba,
		svg: Modernizr.svg
	};

	if (Modernizr.csstransforms) {
		fg.support.transformFunction = Modernizr.prefixed('transform');
	}

	if (Modernizr.backgroundsize) {
		fg.support.backgroundsize = Modernizr.prefixed('backgroundSize');
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

			if (startColor === endColor) {
				// Solid color
				if (startColor.a === 1) {
					this.css_options = {
						'background-color': ['rgb(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ')'].join('')
					};
				} else {
					if (support.rgba) {
						this.css_options = {
							'background-color': ['rgba(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ',', String(startColor.a), ')'].join('')
						};
					} else if (support.ieFilter) {
						// Alpha supported through proprietary filter
						str_a = ['0', Math.round(startColor.a * 255).toString(16).toUpperCase()].join('');
						str_r = ['0', startColor.r.toString(16).toUpperCase()].join('');
						str_g = ['0', startColor.g.toString(16).toUpperCase()].join('');
						str_b = ['0', startColor.b.toString(16).toUpperCase()].join('');
						start_color_string = ['#', str_a.slice(str_a.length - 2), str_r.slice(str_r.length - 2), str_g.slice(str_g.length - 2), str_b.slice(str_b.length - 2)].join('');

						this.ie_filter = ['progid:DXImageTransform.Microsoft.Gradient(GradientType=0,startColorstr="', start_color_string, '",endColorstr="', start_color_string, '")'].join('');
					} else {
						// Alpha not supported, use a simple rgb color
						this.css_options = {
							'background-color': ['rgb(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ')'].join('')
						};
					}
				}
			} else {
				// Gradient
				if (support.svg) {
					start_color_string = ['rgb(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ')'].join('');
					end_color_string = ['rgb(', String(endColor.r), ',', String(endColor.g), ',', String(endColor.b), ')'].join('');

					if (this.type === fg.GRADIENT_HORIZONTAL) {
						x2 = 100;
						y2 = 0;
					} else {
						x2 = 0;
						y2 = 100;
					}

					svg = [
						'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">',
							'<defs>',
								'<linearGradient id="friGameGradient', String(fg.nextGradientId), '" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="', String(x2), '%" y2="', String(y2), '%">',
									'<stop offset="0%" stop-color="', start_color_string, '" stop-opacity="', String(startColor.a), '" />',
									'<stop offset="100%" stop-color="', end_color_string, '" stop-opacity="', String(endColor.a), '" />',
								'</linearGradient>',
							'</defs>',

							'<rect x="0" y="0" width="1" height="1" fill="url(#friGameGradient', String(fg.nextGradientId), ')" />',
						'</svg>'
					].join('');
					fg.nextGradientId += 1;

					this.css_options = {
						'background-image': ['url("data:image/svg+xml;base64,', btoa(svg), '")'].join('')
					};

					if (support.backgroundsize) {
						this.css_options[support.backgroundsize] = '100% 100%';
					}
				} else if (support.ieFilter) {
					// Gradient supported through proprietary filter
					str_a = ['0', Math.round(startColor.a * 255).toString(16).toUpperCase()].join('');
					str_r = ['0', startColor.r.toString(16).toUpperCase()].join('');
					str_g = ['0', startColor.g.toString(16).toUpperCase()].join('');
					str_b = ['0', startColor.b.toString(16).toUpperCase()].join('');
					start_color_string = ['#', str_a.slice(str_a.length - 2), str_r.slice(str_r.length - 2), str_g.slice(str_g.length - 2), str_b.slice(str_b.length - 2)].join('');

					str_a = ['0', Math.round(endColor.a * 255).toString(16).toUpperCase()].join('');
					str_r = ['0', endColor.r.toString(16).toUpperCase()].join('');
					str_g = ['0', endColor.g.toString(16).toUpperCase()].join('');
					str_b = ['0', endColor.b.toString(16).toUpperCase()].join('');
					end_color_string = ['#', str_a.slice(str_a.length - 2), str_r.slice(str_r.length - 2), str_g.slice(str_g.length - 2), str_b.slice(str_b.length - 2)].join('');

					if (this.type === fg.GRADIENT_HORIZONTAL) {
						type = 1;
					} else {
						type = 0;
					}

					this.ie_filter = ['progid:DXImageTransform.Microsoft.Gradient(GradientType=', type, ',startColorstr="', start_color_string, '",endColorstr="', end_color_string, '")'].join('');
				} else {
					// Fallback to solid color
					if (startColor.a === 1) {
						this.css_options = {
							'background-color': ['rgb(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ')'].join('')
						};
					} else {
						if (support.rgba) {
							this.css_options = {
								'background-color': ['rgba(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ',', String(startColor.a), ')'].join('')
							};
						} else {
							// Alpha not supported, use a simple rgb color
							this.css_options = {
								'background-color': ['rgb(', String(startColor.r), ',', String(startColor.g), ',', String(startColor.b), ')'].join('')
							};
						}
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

	$.extend(fg.PBaseSprite, {
		// Implementation details

		transform: function () {
			var
				options = this.options,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				transform = []
			;

			if (angle) {
				transform.push.apply(transform, ['rotate(', String(angle), 'rad)']);
			}

			if ((scaleh !== 1) || (scalev !== 1)) {
				transform.push.apply(transform, ['scale(', String(scaleh), ',', String(scalev), ')']);
			}

			return transform.join('');
		},

		ieTransform: function () {
			var
				options = this.options,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				cos,
				sin,
				filter
			;

			// Apply the transformation matrix
			if ((angle) || (scaleh !== 1) || (scalev !== 1)) {
				cos = Math.cos(angle);
				sin = Math.sin(angle);
				filter = [
					'progid:DXImageTransform.Microsoft.Matrix(M11=', String(cos * scaleh),
					',M12=', String(-sin * scalev),
					',M21=', String(sin * scaleh),
					',M22=', String(cos * scalev),
					',SizingMethod="auto expand",FilterType="nearest neighbor")'
				].join('');
			} else {
				filter = '';
			}

			this.ieFilters.matrix = filter;
		},

		ieAlpha: function () {
			var
				alpha = this.options.alpha,
				filter
			;

			// Apply the transformation matrix
			if (alpha !== 1) {
				filter = ['progid:DXImageTransform.Microsoft.Alpha(opacity=', String(Math.round(alpha * 100)), ')'].join('');
			} else {
				filter = '';
			}

			this.ieFilters.alpha = filter;
		},

		applyIeFilters: function () {
			var
				dom = this.dom,
				options = this.options,
				filters = this.ieFilters,
				newWidth,
				newHeight,
				round = Math.round
			;

			// Step 1: Apply the filters
			dom.css('filter', [filters.matrix, filters.alpha, filters.gradient].join(''));

			// Step 2: Adjust the element position according to the new width and height
			newWidth = dom.width();
			newHeight = dom.height();
			options.posOffsetX = round((newWidth - this.width) / 2);
			options.posOffsetY = round((newHeight - this.height) / 2);
			dom.css({
				'left': [String(this.left - options.posOffsetX), 'px'].join(''),
				'top': [String(this.top - options.posOffsetY), 'px'].join('')
			});
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PDOMSprite = Object.create(fg.PSprite);
	$.extend(fg.PDOMSprite, {
		init: function (name, options, parent) {
			fg.PSprite.init.apply(this, arguments);

			this.old_options = {};

		},

		// Public functions

		remove: function () {
			if (this.dom) {
				this.dom.remove();
			}

			fg.PSprite.remove.apply(this, arguments);
		},

		// Implementation details

		draw: function () {
			var
				options = this.options,
				old_options = this.old_options,
				currentFrame = options.currentFrame,
				animation = options.animation,
				animation_options,
				dom = this.dom,
				left = this.left,
				top = this.top,
				multix = options.multix,
				multiy = options.multiy,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				hidden = options.hidden,
				css_options = {},
				update_css = false,
				update_position = false,
				support = fg.support,
				transformFunction = support.transformFunction,
				ieFilter = support.ieFilter,
				apply_ie_filters = false
			;

			if (animation && alpha && !options.hidden) {
				animation_options = animation.options;

				if (!dom) {
					dom = $(['<div id="', this.name, '"></div>'].join('')).appendTo(this.parent.dom);
					dom.addClass(fg.cssClass);	// Reset background properties set by external CSS

					this.dom = dom;

					if (ieFilter) {
						this.ieFilters = {
							matrix: '',
							alpha: '',
							gradient: ''
						};
					}
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
						'width': [String(this.width), 'px'].join(''),
						'height': [String(this.height), 'px'].join(''),
						'background-image': ['url("', animation_options.imageURL, '")'].join('')
					});
					update_css = true;
					update_position = true;

					if (ieFilter) {
						if ((angle) || (scaleh !== 1) || (scalev !== 1)) {
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

				if (update_position || ((options.idleCounter === 0) && (animation_options.numberOfFrame !== 1))) {
					css_options['background-position'] = [
						String(-(animation_options.offsetx + multix + (currentFrame * animation_options.deltax))),
						'px ',
						String(-(animation_options.offsety + multiy + (currentFrame * animation_options.deltay))),
						'px'
					].join('');
					update_css = true;
				}

				if	(
						(angle !== old_options.angle)
					||	(scaleh !== old_options.scaleh)
					||	(scalev !== old_options.scalev)
					) {
					if (transformFunction) {
						css_options[transformFunction] = this.transform();
						update_css = true;
					} else if (ieFilter) {
						this.ieTransform();
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Transforms not supported
					}

					old_options.angle = angle;
					old_options.scaleh = scaleh;
					old_options.scalev = scalev;
				}

				if (alpha !== old_options.alpha) {
					if (!old_options.alpha) {
						dom.show();
					}

					if (support.opacity) {
						if (alpha !== 1) {
							css_options.opacity = String(alpha);
						} else {
							css_options.opacity = '';
						}
						update_css = true;
					} else if (ieFilter) {
						this.ieAlpha();
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Opacity not supported
					}

					old_options.alpha = alpha;
				}

				if (update_css) {
					dom.css(css_options);
				}

				if (ieFilter && apply_ie_filters) {
					this.applyIeFilters();
				}
			} else {
				if (dom) {
					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}

					if ((!animation) && (animation !== old_options.animation)) {
						dom.css({
							'background-image': '',
							'background-position': ''
						});
						old_options.animation = animation;
					}

					if ((!alpha) && (alpha !== old_options.alpha)) {
						dom.hide();
						old_options.alpha = alpha;
					}
				}
			}
		}
	});

	fg.Sprite = function () {
		var
			sprite = Object.create(fg.PDOMSprite)
		;

		sprite.init.apply(sprite, arguments);

		return sprite;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PDOMSpriteGroup = Object.create(fg.PSpriteGroup);
	$.extend(fg.PDOMSpriteGroup, {
		init: function (name, options, parent) {
			var
				dom
			;

			fg.PSpriteGroup.init.apply(this, arguments);

			this.old_options = {};

			if (!parent) {
				dom = $(['<div id="', name, '"></div>'].join('')).prependTo(options.parentDOM);
				dom.addClass(fg.cssClass);	// Reset background properties set by external CSS
				dom.css({
					'left': '0px',
					'top': '0px',
					'width': [String(options.width), 'px'].join(''),
					'height': [String(options.height), 'px'].join(''),
					'overflow': 'hidden'
				});

				this.dom = dom;

				if (dom.get(0).filters) {
					fg.support.ieFilter = true;
					this.ieFilters = {
						matrix: '',
						alpha: '',
						gradient: ''
					};
				} else {
					fg.support.ieFilter = false;
				}
			}
		},

		// Public functions

		remove: function () {
			fg.PSpriteGroup.remove.apply(this, arguments);

			if (this.dom) {
				this.dom.remove();
			}
		},

		// Implementation details

		draw: function () {
			var
				options = this.options,
				old_options = this.old_options,
				dom = this.dom,
				left = this.left,
				top = this.top,
				width = this.width,
				height = this.height,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				hidden = options.hidden,
				css_options = {},
				update_css = false,
				support = fg.support,
				transformFunction = support.transformFunction,
				ieFilter = support.ieFilter,
				apply_ie_filters = false
			;

			if (this.layers.length && alpha && !options.hidden) {
				if (!this.dom) {
					dom = $(['<div id="', this.name, '"></div>'].join('')).appendTo(this.parent.dom);
					dom.addClass(fg.cssClass);	// Reset background properties set by external CSS

					this.dom = dom;

					if (ieFilter) {
						this.ieFilters = {
							matrix: '',
							alpha: '',
							gradient: ''
						};
					}
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

				if (width !== old_options.width) {
					css_options.width = [String(width), 'px'].join('');
					update_css = true;

					if (ieFilter) {
						if ((angle) || (scaleh !== 1) || (scalev !== 1)) {
							// For transformed objects force the update of the ie filters in order
							// to have the position adjusted according to the transformed width and height
							apply_ie_filters = true;
						}
					}

					old_options.width = width;
				}

				if (height !== old_options.height) {
					css_options.height = [String(height), 'px'].join('');
					update_css = true;

					if (ieFilter) {
						if ((angle) || (scaleh !== 1) || (scalev !== 1)) {
							// For transformed objects force the update of the ie filters in order
							// to have the position adjusted according to the transformed width and height
							apply_ie_filters = true;
						}
					}

					old_options.width = height;
				}

				if	(
						(angle !== old_options.angle)
					||	(scaleh !== old_options.scaleh)
					||	(scalev !== old_options.scalev)
					) {
					if (transformFunction) {
						css_options[transformFunction] = this.transform();
						update_css = true;
					} else if (ieFilter) {
						this.ieTransform();
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Transforms not supported
					}

					old_options.angle = angle;
					old_options.scaleh = scaleh;
					old_options.scalev = scalev;
				}

				if (alpha !== old_options.alpha) {
					if (!old_options.alpha) {
						dom.show();
					}

					if (support.opacity) {
						if (alpha !== 1) {
							css_options.opacity = String(alpha);
						} else {
							css_options.opacity = '';
						}
						update_css = true;
					} else if (ieFilter) {
						this.ieAlpha();
						update_css = true;
						apply_ie_filters = true;
					} else {
						$.noop();	// Opacity not supported
					}

					old_options.alpha = alpha;
				}

				if (update_css) {
					dom.css(css_options);
				}

				if (ieFilter && apply_ie_filters) {
					this.applyIeFilters();
				}

				fg.PSpriteGroup.draw.apply(this, arguments);
			} else {
				if (dom) {
					if (hidden && (hidden !== old_options.hidden)) {
						dom.hide();
						old_options.hidden = hidden;
					}

					if ((!alpha) && (alpha !== old_options.alpha)) {
						dom.hide();
						old_options.alpha = alpha;
					}
				}
			}
		}
	});

	fg.SpriteGroup = function () {
		var
			group = Object.create(fg.PDOMSpriteGroup)
		;

		group.init.apply(group, arguments);

		return group;
	};
}(jQuery, friGame));

