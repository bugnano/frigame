/*global jQuery, friGame */
/*jslint nomen: true, sloppy: true, white: true, browser: true */

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
// based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

(function ($, fg) {
	var
		speeds = {
			slow: 600,
			fast: 200,
			_default: 400
		},

		easings = {
			linear: function (t) {
				return t;
			},
			swing: function (t) {
				return 0.5 - (Math.cos(t * Math.PI) / 2);
			},
			easeInQuad: function (t) {
				return t * t;
			},
			easeOutQuad: function (t) {
				return -1 * t * (t - 2);
			},
			easeInOutQuad: function (t) {
				t *= 2;
				if (t < 1) {
					return 0.5 * t * t;
				}

				t -= 1;
				return -0.5 * ((t * (t - 2)) - 1);
			},
			easeInCubic: function (t) {
				return t * t * t;
			},
			easeOutCubic: function (t) {
				t -= 1;
				return (t * t * t) + 1;
			},
			easeInOutCubic: function (t) {
				t *= 2;
				if (t < 1) {
					return 0.5 * t * t * t;
				}

				t -= 2;
				return 0.5 * ((t * t * t) + 2);
			},
			easeInQuart: function (t) {
				return t * t * t * t;
			},
			easeOutQuart: function (t) {
				t -= 1;
				return -1 * ((t * t * t * t) - 1);
			},
			easeInOutQuart: function (t) {
				t *= 2;
				if (t < 1) {
					return 0.5 * t * t * t * t;
				}

				t -= 2;
				return -0.5 * ((t * t * t * t) - 2);
			},
			easeInQuint: function (t) {
				return t * t * t * t * t;
			},
			easeOutQuint: function (t) {
				t -= 1;
				return (t * t * t * t * t) + 1;
			},
			easeInOutQuint: function (t) {
				t *= 2;
				if (t < 1) {
					return 0.5 * t* t * t * t * t;
				}

				t -= 2;
				return 0.5 * ((t * t * t * t * t) + 2);
			},
			easeInSine: function (t) {
				return (-1 * Math.cos(t * (Math.PI / 2))) + 1;
			},
			easeOutSine: function (t) {
				return Math.sin(t * (Math.PI / 2));
			},
			easeInOutSine: function (t) {
				return -0.5 * (Math.cos(Math.PI * t) - 1);
			},
			easeInExpo: function (t) {
				return (t === 0) ? 0 : Math.pow(2, 10 * (t - 1));
			},
			easeOutExpo: function (t) {
				return (t === 1) ? 1 : (-Math.pow(2, -10 * t) + 1);
			},
			easeInOutExpo: function (t) {
				if (t === 0) {
					return 0;
				}

				if (t === 1) {
					return 1;
				}

				t *= 2;
				if (t < 1) {
					return 0.5 * Math.pow(2, 10 * (t - 1));
				}

				t -= 1;
				return 0.5 * (-Math.pow(2, -10 * t) + 2);
			},
			easeInCirc: function (t) {
				return -1 * (Math.sqrt(1 - (t * t)) - 1);
			},
			easeOutCirc: function (t) {
				t -= 1;
				return Math.sqrt(1 - (t * t));
			},
			easeInOutCirc: function (t) {
				t *= 2;
				if (t < 1) {
					return -0.5 * (Math.sqrt(1 - (t * t)) - 1);
				}

				t -= 2;
				return 0.5 * (Math.sqrt(1 - (t * t)) + 1);
			},
			easeInElastic: function (t) {
				var
					p = 0.3,
					s = p / 4
				;

				if (t === 0) {
					return 0;
				}

				if (t === 1) {
					return 1;
				}

				t -= 1;
				return -(Math.pow(2, 10 * t) * Math.sin((t - s) * (2 * Math.PI) / p));
			},
			easeOutElastic: function (t) {
				var
					p = 0.3,
					s = p / 4
				;

				if (t === 0) {
					return 0;
				}

				if (t === 1) {
					return 1;
				}

				return (Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p)) + 1;
			},
			easeInOutElastic: function (t) {
				var
					p = 0.45,
					s = p / 4
				;

				if (t === 0) {
					return 0;
				}

				t *= 2;
				if (t === 2) {
					return 1;
				}

				if (t < 1) {
					t -= 1;
					return -0.5 * (Math.pow(2, 10 * t) * Math.sin((t - s) * (2 * Math.PI) / p));
				}

				t -= 1;
				return (Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5) + 1;
			},
			easeInBack: function (t) {
				var
					s = 1.70158
				;

				return t * t *(((s + 1) * t) - s);
			},
			easeOutBack: function (t) {
				var
					s = 1.70158
				;

				t -= 1;
				return (t * t * (((s + 1) * t) + s)) + 1;
			},
			easeInOutBack: function (t) {
				var
					s = 1.70158 * 1.525
				;

				t *= 2;
				if (t < 1) {
					return 0.5 * (t * t * (((s + 1) * t) - s));
				}

				t -= 2;
				return 0.5 * (t * t * (((s + 1) * t) + s) + 2);
			},
			easeInBounce: function (t) {
				return 1 - easings.easeOutBounce(1 - t);
			},
			easeOutBounce: function (t) {
				if (t < (1 / 2.75)) {
					return 7.5625 * t * t;
				}

				if (t < (2 / 2.75)) {
					t -= 1.5 / 2.75;
					return 7.5625 * (t * t) + 0.75;
				}

				if (t < (2.5 / 2.75)) {
					t -= 2.25 / 2.75;
					return 7.5625 * (t * t) + 0.9375;
				}

				t -= 2.625 / 2.75;
				return 7.5625 * (t * t) + 0.984375;
			},
			easeInOutBounce: function (t) {
				if (t < 0.5) {
					return easings.easeInBounce(t * 2) * 0.5;
				}

				return (easings.easeOutBounce((t * 2) - 1) * 0.5) + 0.5;
			}
		},

		opacityStep = function () {
			var
				fx = this.fx.opacity
			;

			if (fx.current_step >= fx.num_step) {
				this.opacity(fx.target);
				if (fx.callback) {
					fx.callback.call(this);
				}

				delete this.fx.opacity;

				// return true in order to stop the callback
				return true;
			}

			this.opacity(this.opacity() + fx.step);
			fx.current_step += 1;
		}
	;

	// Only for debug
	fg.easings = easings;

	$.extend(fg.PBaseSprite, {
		fadeIn: function (duration, callback) {
			return this.fadeTo(duration, 1, callback);
		},

		fadeOut: function (duration, callback) {
			return this.fadeTo(duration, 0, callback);
		},

		fadeTo: function (duration, opacity, callback) {
			var
				speed,
				num_step
			;

			if (typeof duration === 'number') {
				speed = duration;
			} else if (speeds[duration]) {
				speed = speeds[duration];
			} else {
				speed = speeds._default;
			}

			num_step = Math.floor(speed / fg.REFRESH_RATE) || 1;

			this.fx = this.fx || {};
			this.fx.opacity = {
				target: opacity,
				current_step: 0,
				num_step: num_step,
				step: (opacity - this.opacity()) / num_step,
				callback: callback
			};

			this.registerCallback(opacityStep, fg.REFRESH_RATE);

			return this;
		}
	});
}(jQuery, friGame));

