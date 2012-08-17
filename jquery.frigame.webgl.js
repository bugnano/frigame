/*global jQuery, Float32Array, mat4 */
/*jslint bitwise: true, sloppy: true, white: true, browser: true */

// Copyright (c) 2011 Franco Bugnano

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

(function ($) {
	var
		friGame = $.friGame;

	friGame.PrototypeAnimation = Object.create(friGame.PrototypeBaseAnimation);
	$.extend(friGame.PrototypeAnimation, {
		initBuffers: function () {
			var
				gl = friGame.gl,
				options = this.options,
				halfWidth = options.halfWidth,
				halfHeight = options.halfHeight,
				vertices,
				vertexPositionBuffer;

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

			options.vertexPositionBuffer = vertexPositionBuffer;
		},

		initTexture: function () {
			var
				gl = friGame.gl,
				options = this.options,
				img = this.img,
				img_width = img.width,
				img_height = img.height;

			if (!gl) {
				return;
			}

			options.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, options.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);

			options.textureSize = new Float32Array([options.frameWidth / img_width, options.frameHeight / img_height]);
			options.offsetx /= img_width;
			options.multix /= img_width;
			options.deltax /= img_width;
			options.offsety /= img_height;
			options.multiy /= img_height;
			options.deltay /= img_height;
		}
	});

	friGame.getShader = function (str, id) {
		var
			gl = friGame.gl,
			shader;

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

	friGame.initShaders = function () {
        var
			gl = friGame.gl,
			fragmentShader,
			vertexShader,
			shaderProgram;

		if (!gl) {
			return;
		}

        fragmentShader = friGame.getShader([
			'#ifdef GL_ES',
			'precision highp float;',
			'#endif',

			'varying vec2 vTextureCoord;',

			'uniform sampler2D uSampler;',

			'void main(void) {',
			'	gl_FragColor = texture2D(uSampler, vTextureCoord);',
			'}'
		].join('\n'), gl.FRAGMENT_SHADER);

        vertexShader = friGame.getShader([
			'attribute vec3 aVertexPosition;',
			'attribute vec2 aTextureCoord;',

			'uniform mat4 uMVMatrix;',
			'uniform mat4 uPMatrix;',

			'varying vec2 vTextureCoord;',

			'uniform vec2 uTextureOffset;',
			'uniform vec2 uTextureSize;',

			'void main(void) {',
			'	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);',
			'	vTextureCoord = uTextureOffset + (uTextureSize * aTextureCoord);',
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

		friGame.shaderProgram = shaderProgram;
	};

	friGame.initBuffers = function () {
        var
			gl = friGame.gl,
			textureCoords,
			textureCoordBuffer;

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

		friGame.textureCoordBuffer = textureCoordBuffer;
	};

	friGame.mvPushMatrix = function () {
		var
			copy = mat4.create();

		mat4.set(friGame.mvMatrix, copy);
		friGame.mvMatrixStack.push(copy);
	};

	friGame.mvPopMatrix = function () {
		var
			mvMatrixStack = friGame.mvMatrixStack;

		if (mvMatrixStack.length) {
			friGame.mvMatrix = mvMatrixStack.pop();
		}
	};

	friGame.PrototypeSprite = Object.create(friGame.PrototypeBaseSprite);
	$.extend(friGame.PrototypeSprite, {
		setAnimation: function (animation, index, callback) {
			var
				options = this.options,
				animation_options;

			friGame.PrototypeBaseSprite.setAnimation.apply(this, arguments);

			if (animation) {
				animation_options = animation.options;
				options.translateX = ((options.posx + animation_options.halfWidth) + 0.5) << 0;
				options.translateY = ((options.posy + animation_options.halfHeight) + 0.5) << 0;
			}

			return this;
		},

		draw: function () {
			var
				options = this.options,
				animation = options.animation,
				angle = options.angle,
				factor = options.factor,
				factorh = options.factorh,
				factorv = options.factorv,
				animation_options,
				frameWidth,
				frameHeight,
				currentFrame = options.currentFrame,
				gl = friGame.gl,
				shaderProgram = friGame.shaderProgram,
				mvMatrix = friGame.mvMatrix,
				pMatrix = friGame.pMatrix;

			if (animation && !options.hidden) {
				animation_options = animation.options;
				frameWidth = animation_options.frameWidth;
				frameHeight = animation_options.frameHeight;

				friGame.mvPushMatrix();
				mat4.translate(mvMatrix, [options.translateX, options.translateY, 0]);
				if (angle) {
					mat4.rotate(mvMatrix, angle, [0, 0, 1]);
				}
				if ((factor !== 1) || (factorh !== 1) || (factorv !== 1)) {
					mat4.scale(mvMatrix, [factorh * factor, factorv * factor, 1]);
				}

				gl.bindBuffer(gl.ARRAY_BUFFER, animation_options.vertexPositionBuffer);
				gl.vertexAttribPointer(shaderProgram.aVertexPosition, animation_options.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

				gl.bindBuffer(gl.ARRAY_BUFFER, friGame.textureCoordBuffer);
				gl.vertexAttribPointer(shaderProgram.aTextureCoord, friGame.textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, animation_options.texture);
				gl.uniform1i(shaderProgram.uSampler, 0);

				gl.uniform2fv(shaderProgram.uTextureSize, animation_options.textureSize);
				gl.uniform2f(shaderProgram.uTextureOffset,
					animation_options.offsetx + options.multix + (currentFrame * animation_options.deltax),
					animation_options.offsety + options.multiy + (currentFrame * animation_options.deltay));

				gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, pMatrix);
				gl.uniformMatrix4fv(shaderProgram.uMVMatrix, false, mvMatrix);

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, animation_options.vertexPositionBuffer.numItems);

				friGame.mvPopMatrix();
			}
		},

		show: function () {
			this.options.hidden = false;
		},

		hide: function () {
			this.options.hidden = true;
		}
	});

	friGame.PrototypeSpriteGroup = Object.create(friGame.PrototypeBaseSpriteGroup);
	$.extend(friGame.PrototypeSpriteGroup, {
		init: function (name, parent) {
			var
				gl,
				dom,
				parent_dom,
				width,
				height,
				animations = friGame.animations,
				len_animations = animations.length,
				i,
				mvMatrix = mat4.create(),
				mvMatrixStack = [],
				pMatrix = mat4.create();

			if (parent === null) {
				parent_dom = $('#playground');
				width = parent_dom.width();
				height = parent_dom.height();
				dom = $(['<canvas id="', name, '" width ="', String(width), '" height="', String(height), '"></canvas>'].join('')).appendTo(parent_dom);
				try {
					gl = document.getElementById(name).getContext('experimental-webgl');
					gl.viewportWidth = width;
					gl.viewportHeight = height;
				} catch (e) {
				}

				if (gl) {
					friGame.gl = gl;
					friGame.initShaders();
					friGame.initBuffers();
					for (i = 0; i < len_animations; i += 1) {
						animations[i].initBuffers();
						animations[i].initTexture();
					}

					friGame.mvMatrix = mvMatrix;
					friGame.mvMatrixStack = mvMatrixStack;
					friGame.pMatrix = pMatrix;

					gl.clearColor(1, 1, 1, 1);
					gl.disable(gl.DEPTH_TEST);

					gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
					gl.clear(gl.COLOR_BUFFER_BIT);

					mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, -1, 1, pMatrix);

					mat4.identity(mvMatrix);
				}
			}

			friGame.PrototypeBaseSpriteGroup.init.apply(this, arguments);
		}
	});
}(jQuery));

