/*global friGame, global */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2019 Franco Bugnano

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

(function (fg) {
	'use strict';

	var
		root,
		overrides = {},
		tween_queue = [],
		tweening = false
	;

	if (typeof window !== 'undefined') {
		// Browser
		root = window;
	} else {
		// Node.js
		root = global;
	}

	function tweenStep() {
		/*jshint validthis: true */
		var
			len_queue = tween_queue.length,
			i_queue,
			remove_queue = [],
			len_remove_queue,
			tween_obj,
			target_obj,
			property,
			i_property,
			property_list,
			len_property_list,
			step
		;

		// Process all the tweens in the queue
		for (i_queue = 0; i_queue < len_queue; i_queue += 1) {
			tween_obj = tween_queue[i_queue];
			target_obj = tween_obj.target_obj;

			property_list = tween_obj.property_list;
			len_property_list = property_list.length;

			tween_obj.current_step += 1;

			if (tween_obj.remove) {
				// This object has been marked for removal
				remove_queue.unshift(i_queue);
			} else if (tween_obj.current_step >= tween_obj.num_step) {
				// This object has finished its tweening

				// Set every property to its target value
				for (i_property = 0; i_property < len_property_list; i_property += 1) {
					property = property_list[i_property];
					property.setValue(target_obj, property.target_value);
				}

				// Call the complete callback
				if (tween_obj.callback) {
					tween_obj.callback.call(target_obj, target_obj);
				}

				// Mark this object for removal
				remove_queue.unshift(i_queue);
			} else {
				step = tween_obj.easing(tween_obj.current_step / tween_obj.num_step);

				// Set the properties to the current value
				for (i_property = 0; i_property < len_property_list; i_property += 1) {
					property = property_list[i_property];
					property.setValue(target_obj, property.start_value + (property.change * step));
				}
			}
		}

		// Remove all the completed tweens
		len_remove_queue = remove_queue.length;
		for (i_queue = 0; i_queue < len_remove_queue; i_queue += 1) {
			tween_queue.splice(remove_queue[i_queue], 1);
		}

		// If there are no more tweens in the queue, this callback can be stopped
		if (tween_queue.length === 0) {
			tweening = false;

			// return true in order to stop the callback
			return true;
		}
	}

	fg.fx = {
		speeds: {
			slow: 600,
			fast: 200,
			_default: 400
		},

		easing: {
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
				return -(t * (t - 2));
			},
			easeInOutQuad: function (t) {
				t *= 2;
				if (t < 1) {
					return (t * t) / 2;
				}

				t -= 1;
				return -((t * (t - 2)) - 1) / 2;
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
					return (t * t * t) / 2;
				}

				t -= 2;
				return ((t * t * t) + 2) / 2;
			},
			easeInQuart: function (t) {
				return t * t * t * t;
			},
			easeOutQuart: function (t) {
				t -= 1;
				return -((t * t * t * t) - 1);
			},
			easeInOutQuart: function (t) {
				t *= 2;
				if (t < 1) {
					return (t * t * t * t) / 2;
				}

				t -= 2;
				return -((t * t * t * t) - 2) / 2;
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
					return (t * t * t * t * t) / 2;
				}

				t -= 2;
				return ((t * t * t * t * t) + 2) / 2;
			},
			easeInSine: function (t) {
				return -(Math.cos(t * (Math.PI / 2))) + 1;
			},
			easeOutSine: function (t) {
				return Math.sin(t * (Math.PI / 2));
			},
			easeInOutSine: function (t) {
				return -(Math.cos(Math.PI * t) - 1) / 2;
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
					return Math.pow(2, 10 * (t - 1)) / 2;
				}

				t -= 1;
				return (-Math.pow(2, -10 * t) + 2) / 2;
			},
			easeInCirc: function (t) {
				return -(Math.sqrt(1 - (t * t)) - 1);
			},
			easeOutCirc: function (t) {
				t -= 1;
				return Math.sqrt(1 - (t * t));
			},
			easeInOutCirc: function (t) {
				t *= 2;
				if (t < 1) {
					return -(Math.sqrt(1 - (t * t)) - 1) / 2;
				}

				t -= 2;
				return (Math.sqrt(1 - (t * t)) + 1) / 2;
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
					return -(Math.pow(2, 10 * t) * Math.sin((t - s) * (2 * Math.PI) / p)) / 2;
				}

				t -= 1;
				return ((Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p)) / 2) + 1;
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
					return (t * t * (((s + 1) * t) - s)) / 2;
				}

				t -= 2;
				return (t * t * (((s + 1) * t) + s) + 2) / 2;
			},
			easeInBounce: function (t) {
				return 1 - fg.fx.easing.easeOutBounce(1 - t);
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
					return fg.fx.easing.easeInBounce(t * 2) / 2;
				}

				return (fg.fx.easing.easeOutBounce((t * 2) - 1) / 2) + 0.5;
			}
		},

		hooks: {
			left: {
				get: function (s) {
					return s.left;
				},
				set: function (s, value) {
					s.move({left: value});
				}
			},
			right: {
				get: function (s) {
					return s.right;
				},
				set: function (s, value) {
					s.move({right: value});
				}
			},
			centerx: {
				get: function (s) {
					return s.centerx;
				},
				set: function (s, value) {
					s.move({centerx: value});
				}
			},
			top: {
				get: function (s) {
					return s.top;
				},
				set: function (s, value) {
					s.move({top: value});
				}
			},
			bottom: {
				get: function (s) {
					return s.bottom;
				},
				set: function (s, value) {
					s.move({bottom: value});
				}
			},
			centery: {
				get: function (s) {
					return s.centery;
				},
				set: function (s, value) {
					s.move({centery: value});
				}
			},
			width: {
				get: function (s) {
					return s.width;
				},
				set: function (s, value) {
					s.resize({width: value});
				}
			},
			height: {
				get: function (s) {
					return s.height;
				},
				set: function (s, value) {
					s.resize({height: value});
				}
			},
			halfWidth: {
				get: function (s) {
					return s.halfWidth;
				},
				set: function (s, value) {
					s.resize({halfWidth: value});
				}
			},
			halfHeight: {
				get: function (s) {
					return s.halfHeight;
				},
				set: function (s, value) {
					s.resize({halfHeight: value});
				}
			},
			radius: {
				get: function (s) {
					return s.radius;
				},
				set: function (s, value) {
					s.resize({radius: value});
				}
			},
			transformOrigin: {
				get: function (s) {
					var
						origin = s.transformOrigin()
					;

					if (typeof origin === 'string') {
						origin = s[origin];
					}

					return origin;
				},
				set: function (s, value) {
					s.transformOrigin(value);
				}
			},
			transformOriginx: {
				get: function (s) {
					var
						origin = s.transformOriginx()
					;

					if (typeof origin === 'string') {
						origin = s[origin];
					}

					return origin;
				},
				set: function (s, value) {
					s.transformOriginx(value);
				}
			},
			transformOriginy: {
				get: function (s) {
					var
						origin = s.transformOriginy()
					;

					if (typeof origin === 'string') {
						origin = s[origin];
					}

					return origin;
				},
				set: function (s, value) {
					s.transformOriginy(value);
				}
			},
			rotate: {
				get: function (s) {
					return s.rotate();
				},
				set: function (s, value) {
					s.rotate(value);
				}
			},
			scale: {
				get: function (s) {
					return s.scale();
				},
				set: function (s, value) {
					s.scale(value);
				}
			},
			scalex: {
				get: function (s) {
					return s.scalex();
				},
				set: function (s, value) {
					s.scalex(value);
				}
			},
			scaley: {
				get: function (s) {
					return s.scaley();
				},
				set: function (s, value) {
					s.scaley(value);
				}
			},
			opacity: {
				get: function (s) {
					return s.opacity();
				},
				set: function (s, value) {
					s.opacity(value);
				}
			},

			// Hooks only for sprite groups
			borderRadius: {
				get: function (s) {
					return s.options.borderTopLeftRadius;
				},
				set: function (s, value) {
					s.setBorder({borderRadius: value});
				}
			},
			borderTopLeftRadius: {
				get: function (s) {
					return s.options.borderTopLeftRadius;
				},
				set: function (s, value) {
					s.setBorder({borderTopLeftRadius: value});
				}
			},
			borderTopRightRadius: {
				get: function (s) {
					return s.options.borderTopRightRadius;
				},
				set: function (s, value) {
					s.setBorder({borderTopRightRadius: value});
				}
			},
			borderBottomRightRadius: {
				get: function (s) {
					return s.options.borderBottomRightRadius;
				},
				set: function (s, value) {
					s.setBorder({borderBottomRightRadius: value});
				}
			},
			borderBottomLeftRadius: {
				get: function (s) {
					return s.options.borderBottomLeftRadius;
				},
				set: function (s, value) {
					s.setBorder({borderBottomLeftRadius: value});
				}
			},
			borderWidth: {
				get: function (s) {
					return s.options.borderWidth;
				},
				set: function (s, value) {
					s.setBorder({borderWidth: value});
				}
			}
		},

		tween: function (hooks, properties, options) {
			var
				new_options = options || {},
				speeds = fg.fx.speeds,
				easing_list = fg.fx.easing,
				duration = new_options.duration,
				easing = new_options.easing,
				easing_function = easing_list[easing],
				speed,
				property,
				tween_obj,
				property_list,
				hook,
				start_value,
				target_value,
				target_obj = this
			;

			if (typeof duration === 'number') {
				speed = duration;
			} else if (speeds[duration]) {
				speed = speeds[duration];
			} else {
				speed = speeds._default;
			}

			if (!easing_function) {
				if ((easing) && (root.console)) {
					console.warn('Easing with name ' + easing + '  does not exist');
					console.trace();
				}

				easing_function = easing_list.swing;
			}

			tween_obj = {
				name: new_options.name,
				target_obj: target_obj,
				remove: false,
				current_step: 0,
				num_step: fg.framesFromMs(speed),
				easing: easing_function,
				callback: new_options.callback,
				property_list: []
			};

			property_list = tween_obj.property_list;

			for (property in properties) {
				if (hooks[property]) {
					hook = hooks[property];

					start_value = hook.get(target_obj);
					target_value = properties[property];

					property_list.push({
						start_value: start_value,
						target_value: target_value,
						change: target_value - start_value,
						setValue: hook.set
					});
				}
			}

			tween_queue.push(tween_obj);
			if (!tweening) {
				tweening = true;
				fg.s.playground.registerCallback(tweenStep);
			}

			return this;
		},

		clearTweens: function () {
			var
				len_queue = tween_queue.length,
				i_queue,
				tween_obj
			;

			for (i_queue = 0; i_queue < len_queue; i_queue += 1) {
				tween_obj = tween_queue[i_queue];
				if (tween_obj.target_obj === this) {
					// Mark this object for removal
					tween_obj.remove = true;
				}
			}

			return this;
		},

		removeTween: function (name, options) {
			var
				new_options = options || {},
				found = false,
				len_queue = tween_queue.length,
				i_queue,
				tween_obj
			;

			for (i_queue = 0; i_queue < len_queue; i_queue += 1) {
				tween_obj = tween_queue[i_queue];
				if ((tween_obj.target_obj === this) && (tween_obj.name === name)) {
					found = true;

					// Mark this object for removal
					tween_obj.remove = true;
				}
			}

			if (root.console && (!found) && (!new_options.suppressWarning)) {
				console.warn('Tween with name ' + name + ' does not exist');
				console.trace();
			}

			return this;
		}
	};

	fg.fx.remove = fg.fx.clearTweens;

	fg.playgroundCallback(function () {
		overrides.playground = fg.pick(this, [
			'clearCallbacks'
		]);

		fg.extend(this, {
			clearCallbacks: function () {
				overrides.playground.clearCallbacks.apply(this, arguments);

				tween_queue.splice(0, tween_queue.length);
				tweening = false;

				return this;
			}
		});
	});

	overrides.PBaseSprite = fg.pick(fg.PBaseSprite, [
		'remove'
	]);

	fg.extend(fg.PBaseSprite, {
		tween: function (properties, options) {
			return fg.fx.tween.call(this, fg.fx.hooks, properties, options);
		},

		clearTweens: fg.fx.clearTweens,
		removeTween: fg.fx.removeTween,

		remove: function () {
			fg.fx.remove.call(this);

			overrides.PBaseSprite.remove.apply(this, arguments);
		},

		fadeIn: function (duration, callback) {
			return this.fadeTo(duration, 1, callback);
		},

		fadeOut: function (duration, callback) {
			return this.fadeTo(duration, 0, callback);
		},

		fadeTo: function (duration, opacity, callback) {
			return this.tween({opacity: opacity}, {
				duration: duration,
				callback: callback
			});
		}
	});

	fg.delay = function(duration, callback) {
		return fg.fx.tween.call(fg, fg.fx.hooks, {}, {
			easing: 'linear',
			duration: duration,
			callback: callback
		});
	};
}(friGame));

