/*global jQuery, friGame */
/*jslint white: true, browser: true */

(function ($, fg) {
	'use strict';

	var
		G = {
			BRICK_WIDTH: 32,
			BRICK_HEIGHT: 32,
			REFRESH_RATE: 30,
			STATE_STUCK: 0,
			STATE_MOVING: 1,
			BALL_SPEED: 8,
			START_ANGLE: -45 * Math.PI / 180
		}
	;

	$(function () {
		fg.resourceManager
			.addGradient('top_gradient', {r: 127, g: 191, b: 255})
			.addGradient('middle_gradient', {r: 127, g: 191, b: 255}, {r: 191, g: 255, b: 255})
			.addGradient('bottom_gradient', {r: 191, g: 255, b: 255}, {r: 63, g: 255, b: 95})
			.addAnimation('blue_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 0 * G.BRICK_HEIGHT, frameWidth: G.BRICK_WIDTH, frameHeight: G.BRICK_HEIGHT})
			.addAnimation('green_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 1 * G.BRICK_HEIGHT, frameWidth: G.BRICK_WIDTH, frameHeight: G.BRICK_HEIGHT})
			.addAnimation('brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 2 * G.BRICK_HEIGHT, frameWidth: G.BRICK_WIDTH, frameHeight: G.BRICK_HEIGHT})
			.addAnimation('red_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 3 * G.BRICK_HEIGHT, frameWidth: G.BRICK_WIDTH, frameHeight: G.BRICK_HEIGHT})
			.addAnimation('ball', 'ball_large.png')
			.addAnimation('paddle', 'paddle_middle.png')
		;

		fg.startGame(function () {
			var
				i,
				num_bricks,
				brick_name
			;

			fg.playground()
				.addGroup('top_background', {background: 'top_gradient', left: 0, top: (0 * fg.s.playground.height) / 3, width: fg.s.playground.width, height: fg.s.playground.height / 3}).end()
				.addGroup('middle_background', {background: 'middle_gradient', left: 0, top: (1 * fg.s.playground.height) / 3, width: fg.s.playground.width, height: fg.s.playground.height / 3}).end()
				.addGroup('bottom_background', {background: 'bottom_gradient', left: 0, top: (2 * fg.s.playground.height) / 3, width: fg.s.playground.width, height: fg.s.playground.height / 3}).end()
			;

			G.bricks = {};
			num_bricks = fg.s.playground.width / G.BRICK_WIDTH;
			for (i = 0; i < num_bricks; i += 1) {
				brick_name = ['red_brick', String(i)].join('');
				fg.s.playground.addSprite(brick_name, {animation: 'red_brick', left: i * G.BRICK_WIDTH, top: 2 * G.BRICK_HEIGHT});
				fg.s[brick_name].userData = {energy: 2};
				G.bricks[brick_name] = fg.s[brick_name];

				brick_name = ['brick', String(i)].join('');
				fg.s.playground.addSprite(brick_name, {animation: 'brick', left: i * G.BRICK_WIDTH, top: 3 * G.BRICK_HEIGHT});
				fg.s[brick_name].userData = {energy: 3};
				G.bricks[brick_name] = fg.s[brick_name];

				brick_name = ['green_brick', String(i)].join('');
				fg.s.playground.addSprite(brick_name, {animation: 'green_brick', left: i * G.BRICK_WIDTH, top: 4 * G.BRICK_HEIGHT});
				fg.s[brick_name].userData = {energy: 3};
				G.bricks[brick_name] = fg.s[brick_name];

				brick_name = ['blue_brick', String(i)].join('');
				fg.s.playground.addSprite(brick_name, {animation: 'blue_brick', left: i * G.BRICK_WIDTH, top: 5 * G.BRICK_HEIGHT});
				fg.s[brick_name].userData = {energy: 2};
				G.bricks[brick_name] = fg.s[brick_name];
			}

			fg.s.playground
				.addSprite('paddle', {animation: 'paddle', centerx: fg.s.playground.centerx, bottom: fg.s.playground.bottom - fg.r.paddle.height})
				.addSprite('ball', {animation: 'ball', centerx: fg.s.paddle.centerx, bottom: fg.s.paddle.top})
			;

			fg.s.paddle.userData = {
				left_circle: fg.Rect({left: fg.s.paddle.left, centery: fg.s.paddle.centery, radius: fg.s.paddle.halfHeight}),
				right_circle: fg.Rect({right: fg.s.paddle.right, centery: fg.s.paddle.centery, radius: fg.s.paddle.halfHeight}),
				middle_square: fg.Rect({centerx: fg.s.paddle.centerx, centery: fg.s.paddle.centery, width: fg.s.paddle.width - fg.s.paddle.height, height: fg.s.paddle.height})
			};

			fg.s.ball.userData = {
				state: G.STATE_STUCK,
				speed_x: 0,
				speed_y: 0
			};

			$('#playground').mousedown(function () {
				if (fg.s.ball.userData.state === G.STATE_STUCK) {
					fg.s.ball.userData.state = G.STATE_MOVING;
					fg.s.ball.userData.speed_x = G.BALL_SPEED * Math.cos(G.START_ANGLE);
					fg.s.ball.userData.speed_y = G.BALL_SPEED * Math.sin(G.START_ANGLE);
				}
			});

			fg.s.paddle.registerCallback(function () {
				this.move({centerx: fg.clamp(fg.mouseTracker.x, this.halfWidth, fg.s.playground.width - this.halfWidth)});
				this.userData.left_circle.move({left: this.left});
				this.userData.right_circle.move({right: this.right});
				this.userData.middle_square.move({centerx: this.centerx});
				if (fg.s.ball.userData.state === G.STATE_STUCK) {
					fg.s.ball.move({centerx: this.centerx});
				}
			}, G.REFRESH_RATE);

			fg.s.ball.registerCallback(function () {
				var
					angle,
					left_circle = fg.s.paddle.userData.left_circle,
					right_circle = fg.s.paddle.userData.right_circle,
					middle_square = fg.s.paddle.userData.middle_square
				;

				if (this.userData.state === G.STATE_MOVING) {
					this.move({centerx: this.centerx + this.userData.speed_x, centery: this.centery + this.userData.speed_y});

					// Check collision with playground
					if	(
							((this.left <= fg.s.playground.left) && (this.userData.speed_x < 0))
						||	((this.right >= fg.s.playground.right) && (this.userData.speed_x > 0))
						) {
						this.userData.speed_x *= -1;
					}

					if	(
							((this.top <= fg.s.playground.top) && (this.userData.speed_y < 0))
						||	((this.bottom >= fg.s.playground.bottom) && (this.userData.speed_y > 0))
						) {
						this.userData.speed_y *= -1;
					}

					// Check collision with paddle
					if (middle_square.collidePointRect(this.centerx, this.bottom) && (this.userData.speed_y > 0)) {
						this.userData.speed_y *= -1;
					} else if (middle_square.collidePointRect(this.centerx, this.top) && (this.userData.speed_y < 0)) {
						this.userData.speed_y *= -1;
					} else if (this.collideCircle(left_circle)) {
						angle = Math.atan2(this.centery - left_circle.centery, this.centerx - left_circle.centerx);
						this.userData.speed_x = G.BALL_SPEED * Math.cos(angle);
						this.userData.speed_y = G.BALL_SPEED * Math.sin(angle);
						if ((this.userData.speed_y >= 0) && (this.userData.speed_y < 1)) {
							this.userData.speed_y = 1;
						}
						if ((this.userData.speed_y <= 0) && (this.userData.speed_y > -1)) {
							this.userData.speed_y = -1;
						}
					} else if (this.collideCircle(right_circle)) {
						angle = Math.atan2(this.centery - right_circle.centery, this.centerx - right_circle.centerx);
						this.userData.speed_x = G.BALL_SPEED * Math.cos(angle);
						this.userData.speed_y = G.BALL_SPEED * Math.sin(angle);
						if ((this.userData.speed_y >= 0) && (this.userData.speed_y < 1)) {
							this.userData.speed_y = 1;
						}
						if ((this.userData.speed_y <= 0) && (this.userData.speed_y > -1)) {
							this.userData.speed_y = -1;
						}
					} else {
						$.noop();
					}

					// Check collision with bricks
					$.each(G.bricks, function (name) {
						var
							damage = true
						;

						if (this.collidePointRect(fg.s.ball.centerx, fg.s.ball.top) && (fg.s.ball.userData.speed_y < 0)) {
							fg.s.ball.userData.speed_y *= -1;
						} else if (this.collidePointRect(fg.s.ball.centerx, fg.s.ball.bottom) && (fg.s.ball.userData.speed_y > 0)) {
							fg.s.ball.userData.speed_y *= -1;
						} else if (this.collidePointRect(fg.s.ball.left, fg.s.ball.centery) && (fg.s.ball.userData.speed_x < 0)) {
							fg.s.ball.userData.speed_x *= -1;
						} else if (this.collidePointRect(fg.s.ball.right, fg.s.ball.centery) && (fg.s.ball.userData.speed_x > 0)) {
							fg.s.ball.userData.speed_x *= -1;
						} else {
							damage = false;
						}

						if (damage) {
							this.userData.energy -= 1;
							if (this.userData.energy === 1) {
								this.setAnimation({animationIndex: 1});
							}

							if (this.userData.energy === 0) {
								this.remove();
								delete G.bricks[name];
							}
						}
					});
				}
			}, G.REFRESH_RATE);
		});
	});
}(jQuery, friGame));

