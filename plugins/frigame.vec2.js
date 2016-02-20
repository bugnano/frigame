/*global friGame */
/*jshint bitwise: true, curly: true, eqeqeq: true, esversion: 3, forin: true, freeze: true, funcscope: true, futurehostile: true, iterator: true, latedef: true, noarg: true, nocomma: true, nonbsp: true, nonew: true, notypeof: false, shadow: outer, singleGroups: false, strict: true, undef: true, unused: true, varstmt: false, eqnull: false, plusplus: true, browser: true, laxbreak: true, laxcomma: true */

// Copyright (c) 2011-2016 Franco Bugnano

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
(function (fg) {
	'use strict';

	fg.Vec2 = {
		randomUnit: function (out) {
			var
				angle = Math.random() * Math.PI * 2
			;

			out.x = Math.cos(angle);
			out.y = Math.sin(angle);
		},

		random: function (out, scale) {
			var
				mag,
				angle = Math.random() * Math.PI * 2
			;

			if (scale === undefined) {
				scale = 1;
			}

			mag = Math.random() * scale;
			out.x = Math.cos(angle) * mag;
			out.y = Math.sin(angle) * mag;
		},

		clone: function (out, a) {
			out.x = a.x;
			out.y = a.y;
		},

		magnitude: function (a) {
			var
				x = a.x,
				y = a.y
			;

			return Math.sqrt((x * x) + (y * y));
		},

		squaredMagnitude: function (a) {
			var
				x = a.x,
				y = a.y
			;

			return ((x * x) + (y * y));
		},

		azimuth: function (a) {
			return Math.atan2(a.y, a.x);
		},

		fromMagAngle: function (out, mag, angle) {
			out.x = Math.cos(angle) * mag;
			out.y = Math.sin(angle) * mag;
		},

		fromValues: function (out, x, y) {
			out.x = x;
			out.y = y;
		},

		scale: function (out, value) {
			out.x *= value;
			out.y *= value;
		},

		invert: function (out) {
			out.x *= -1;
			out.y *= -1;
		},

		normalize: function (out) {
			var
				x = out.x,
				y = out.y,
				mag = (x * x) + (y * y)
			;

			if (mag) {
				mag = 1 / Math.sqrt(mag);
			}

			out.x = x * mag;
			out.y = y * mag;
		},

		add: function (out, a) {
			out.x += a.x;
			out.y += a.y;
		},

		subtract: function (out, a) {
			out.x -= a.x;
			out.y -= a.y;
		},

		rotate: function (out, angle) {
			var
				x = out.x,
				y = out.y,
				cos = Math.cos(angle),
				sin = Math.sin(angle)
			;

			out.x = (x * cos) - (y * sin);
			out.y = (y * cos) + (x * sin);
		},

		rotateAroundPoint: function (out, a, axisPoint, angle) {
			var
				Vec2 = fg.Vec2
			;

			Vec2.clone(out, a);
			Vec2.subtract(out, axisPoint);
			Vec2.rotate(out, angle);
			Vec2.add(out, axisPoint);
		},

		equals: function (a, b) {
			return ((a.x === b.x) && (a.y === b.y));
		},

		distance: function (a, b) {
			var
				dx = a.x - b.x,
				dy = a.y - b.y
			;

			return Math.sqrt((dx * dx) + (dy * dy));
		},

		squaredDistance: function (a, b) {
			var
				dx = a.x - b.x,
				dy = a.y - b.y
			;

			return ((dx * dx) + (dy * dy));
		},

		sum: function (out, a, b) {
			out.x = a.x + b.x;
			out.y = a.y + b.y;
		},

		difference: function (out, a, b) {
			out.x = a.x - b.x;
			out.y = a.y - b.y;
		},

		dot: function (a, b) {
			return ((a.x * b.x) + (a.y * b.y));
		},

		lerp: function (out, a, b, t) {
			var
				ax = a.x,
				ay = a.y
			;

			out.x = ax + (t * (b.x - ax));
			out.y = ay + (t * (b.y - ay));
		}
	};
}(friGame));

