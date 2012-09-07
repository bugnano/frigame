/*global jQuery, friGame, Float32Array, mat4 */
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

	$.extend(fg.PAnimation, {
		initBuffers: function () {
			var
				gl = fg.gl,
				options = this.options,
				halfWidth = options.halfWidth,
				halfHeight = options.halfHeight,
				vertices,
				vertexPositionBuffer
			;

			if (!gl) {
				return;
			}

			vertexPositionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
			vertices = [
				halfWidth, halfHeight, 0,
				-halfWidth, halfHeight, 0,
				halfWidth, -halfHeight, 0,
				-halfWidth, -halfHeight, 0
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			vertexPositionBuffer.itemSize = 3;
			vertexPositionBuffer.numItems = 4;

			this.vertexPositionBuffer = vertexPositionBuffer;
		},

		initTexture: function () {
			var
				gl = fg.gl,
				options = this.options,
				img = options.img,
				img_width = img.width,
				img_height = img.height
			;

			if (!gl) {
				return;
			}

			this.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);

			this.textureSize = new Float32Array([options.frameWidth / img_width, options.frameHeight / img_height]);
			options.offsetx /= img_width;
			options.multix /= img_width;
			options.deltax /= img_width;
			options.offsety /= img_height;
			options.multiy /= img_height;
			options.deltay /= img_height;
		}
	});

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.getShader = function (str, id) {
		var
			gl = fg.gl,
			shader
		;

		if (!gl) {
			return;
		}

		shader = gl.createShader(id);

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return null;
		}

		return shader;
	};

	fg.initShaders = function () {
        var
			gl = fg.gl,
			fragmentShader,
			vertexShader,
			shaderProgram
		;

		if (!gl) {
			return;
		}

        fragmentShader = fg.getShader([
			'precision mediump float;',

			'varying vec2 vTextureCoord;',

			'uniform float uAlpha;',

			'uniform sampler2D uSampler;',

			'void main(void) {',
				'vec4 textureColor = texture2D(uSampler, vTextureCoord);',
				'gl_FragColor = vec4(textureColor.rgb, textureColor.a * uAlpha);',
			'}'
		].join('\n'), gl.FRAGMENT_SHADER);

        vertexShader = fg.getShader([
			'attribute vec3 aVertexPosition;',
			'attribute vec2 aTextureCoord;',

			'uniform mat4 uMVMatrix;',
			'uniform mat4 uPMatrix;',

			'varying vec2 vTextureCoord;',

			'uniform vec2 uTextureOffset;',
			'uniform vec2 uTextureSize;',

			'void main(void) {',
				'gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);',
				'vTextureCoord = uTextureOffset + (uTextureSize * aTextureCoord);',
			'}'
		].join('\n'), gl.VERTEX_SHADER);

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			return;
		}

		gl.useProgram(shaderProgram);

		shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
		gl.enableVertexAttribArray(shaderProgram.aVertexPosition);

		shaderProgram.aTextureCoord = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
		gl.enableVertexAttribArray(shaderProgram.aTextureCoord);

		shaderProgram.uPMatrix = gl.getUniformLocation(shaderProgram, 'uPMatrix');
		shaderProgram.uMVMatrix = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
		shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');

		shaderProgram.uTextureSize = gl.getUniformLocation(shaderProgram, 'uTextureSize');
		shaderProgram.uTextureOffset = gl.getUniformLocation(shaderProgram, 'uTextureOffset');

		shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, 'uAlpha');

		fg.shaderProgram = shaderProgram;
	};

	fg.initBuffers = function () {
        var
			gl = fg.gl,
			textureCoords,
			textureCoordBuffer
		;

		if (!gl) {
			return;
		}

		textureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
		textureCoords = [
			// Front face
			1, 1,
			0, 1,
			1, 0,
			0, 0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		textureCoordBuffer.itemSize = 2;
		textureCoordBuffer.numItems = 4;

		fg.textureCoordBuffer = textureCoordBuffer;
	};

	fg.mvPushMatrix = function () {
		var
			copy = mat4.create()
		;

		mat4.set(fg.mvMatrix, copy);
		fg.mvMatrixStack.push(copy);
	};

	fg.mvPopMatrix = function () {
		var
			mvMatrixStack = fg.mvMatrixStack
		;

		if (mvMatrixStack.length) {
			fg.mvMatrix = mvMatrixStack.pop();
		}
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PWebGLSprite = Object.create(fg.PSprite);
	$.extend(fg.PWebGLSprite, {
		draw: function () {
			var
				options = this.options,
				animation = options.animation,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				old_alpha,
				animation_options,
				currentFrame = options.currentFrame,
				gl = fg.gl,
				shaderProgram = fg.shaderProgram,
				mvMatrix = fg.mvMatrix,
				pMatrix = fg.pMatrix
			;

			if (animation && !options.hidden) {
				animation_options = animation.options;

				fg.mvPushMatrix();

				mat4.translate(mvMatrix, [this.centerx, this.centery, 0]);

				if (angle) {
					mat4.rotate(mvMatrix, angle, [0, 0, 1]);
				}

				if ((scaleh !== 1) || (scalev !== 1)) {
					mat4.scale(mvMatrix, [scaleh, scalev, 1]);
				}

				old_alpha = fg.globalAlpha;
				fg.globalAlpha *= alpha;

				gl.bindBuffer(gl.ARRAY_BUFFER, animation.vertexPositionBuffer);
				gl.vertexAttribPointer(shaderProgram.aVertexPosition, animation.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

				gl.bindBuffer(gl.ARRAY_BUFFER, fg.textureCoordBuffer);
				gl.vertexAttribPointer(shaderProgram.aTextureCoord, fg.textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, animation.texture);
				gl.uniform1i(shaderProgram.uSampler, 0);

				gl.uniform2fv(shaderProgram.uTextureSize, animation.textureSize);
				gl.uniform2f(
					shaderProgram.uTextureOffset,
					animation_options.offsetx + options.multix + (currentFrame * animation_options.deltax),
					animation_options.offsety + options.multiy + (currentFrame * animation_options.deltay)
				);

				gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, pMatrix);
				gl.uniformMatrix4fv(shaderProgram.uMVMatrix, false, mvMatrix);

				gl.uniform1f(shaderProgram.alphaUniform, fg.globalAlpha);

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, animation.vertexPositionBuffer.numItems);

				fg.mvPopMatrix();

				fg.globalAlpha = old_alpha;
			}
		}
	});

	fg.Sprite = function () {
		var
			sprite = Object.create(fg.PWebGLSprite)
		;

		sprite.init.apply(sprite, arguments);

		return sprite;
	};

	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //
	// ******************************************************************** //

	fg.PWebGLSpriteGroup = Object.create(fg.PSpriteGroup);
	$.extend(fg.PWebGLSpriteGroup, {
		init: function (name, options, parent) {
			var
				gl,
				dom,
				width,
				height,
				str_width,
				str_height,
				canvas,
				animations = fg.resourceManager.animations,
				len_animations = animations.length,
				i,
				mvMatrix = mat4.create(),
				mvMatrixStack = [],
				pMatrix = mat4.create()
			;

			fg.PSpriteGroup.init.apply(this, arguments);

			if (!parent) {
				width = options.width;
				height = options.height;
				str_width = String(width);
				str_height = String(height);

				dom = $(['<canvas id="', name, '" width ="', str_width, '" height="', str_height, '"></canvas>'].join('')).prependTo(options.parentDOM);
				dom.addClass(fg.cssClass);	// Reset background properties set by external CSS
				dom.css({
					'left': '0px',
					'top': '0px',
					'width': [str_width, 'px'].join(''),
					'height': [str_height, 'px'].join(''),
					'overflow': 'hidden'
				});

				this.dom = dom;

				try {
					// Try to grab the standard context. If it fails, fallback to experimental.
					canvas = dom.get(0);
					gl = canvas.getContext('webgl', {alpha: false}) || canvas.getContext('experimental-webgl', {alpha: false});
				} catch (e) {
				}

				if (gl) {
					gl.viewportWidth = width;
					gl.viewportHeight = height;

					fg.gl = gl;
					fg.initShaders();
					fg.initBuffers();
					for (i = 0; i < len_animations; i += 1) {
						animations[i].initBuffers();
						animations[i].initTexture();
					}

					fg.mvMatrix = mvMatrix;
					fg.mvMatrixStack = mvMatrixStack;
					fg.pMatrix = pMatrix;

					gl.clearColor(0, 0, 0, 0);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
					gl.enable(gl.BLEND);
					gl.disable(gl.DEPTH_TEST);

					gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
					gl.clear(gl.COLOR_BUFFER_BIT);

					mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, -1, 1, pMatrix);

					mat4.identity(mvMatrix);
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
				left = this.left,
				top = this.top,
				angle = options.angle,
				scaleh = options.scaleh,
				scalev = options.scalev,
				alpha = options.alpha,
				old_alpha,
				context_saved,
				gl = fg.gl,
				mvMatrix = fg.mvMatrix
			;

			if (!this.parent) {
				gl.clear(gl.COLOR_BUFFER_BIT);
				fg.globalAlpha = 1;
			}

			if (this.layers.length && !options.hidden) {
				if ((angle) || (scaleh !== 1) || (scalev !== 1)) {
					fg.mvPushMatrix();
					context_saved = true;

					mat4.translate(mvMatrix, [this.centerx, this.centery, 0]);

					if (angle) {
						mat4.rotate(mvMatrix, angle, [0, 0, 1]);
					}

					if ((scaleh !== 1) || (scalev !== 1)) {
						mat4.scale(mvMatrix, [scaleh, scalev, 1]);
					}

					mat4.translate(mvMatrix, [-this.halfWidth, -this.halfHeight, 0]);
				} else if (left || top) {
					fg.mvPushMatrix();
					context_saved = true;

					mat4.translate(mvMatrix, [left, top, 0]);
				} else {
					context_saved = false;
				}

				old_alpha = fg.globalAlpha;
				fg.globalAlpha *= alpha;

				fg.PSpriteGroup.draw.apply(this, arguments);

				if (context_saved) {
					fg.mvPopMatrix();
				}

				fg.globalAlpha = old_alpha;

			}
		}
	});

	fg.SpriteGroup = function () {
		var
			group = Object.create(fg.PWebGLSpriteGroup)
		;

		group.init.apply(group, arguments);

		return group;
	};
}(jQuery, friGame));

