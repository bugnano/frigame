/*global jQuery, friGame */
/*jslint sloppy: true, white: true, browser: true */

(function ($, fg) {
	var
		BRICK_WIDTH = 32,
		BRICK_HEIGHT = 32,
		REFRESH_RATE = 30,
		STATE_STUCK = 0,
		STATE_MOVING = 1,
		BALL_SPEED = 8,
		START_ANGLE = -45 * Math.PI / 180,
		G = {}
	;

	$(function () {
		fg.resourceManager
			.addGradient('top_gradient', {r: 127, g: 191, b: 255})
			.addGradient('middle_gradient', {r: 127, g: 191, b: 255}, {r: 191, g: 255, b: 255})
			.addGradient('bottom_gradient', {r: 191, g: 255, b: 255}, {r: 63, g: 255, b: 95})
			.addAnimation('blue_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 0 * BRICK_HEIGHT, frameWidth: BRICK_WIDTH, frameHeight: BRICK_HEIGHT})
			.addAnimation('green_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 1 * BRICK_HEIGHT, frameWidth: BRICK_WIDTH, frameHeight: BRICK_HEIGHT})
			.addAnimation('brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 2 * BRICK_HEIGHT, frameWidth: BRICK_WIDTH, frameHeight: BRICK_HEIGHT})
			.addAnimation('red_brick', 'bricks.png', {type: fg.ANIMATION_VERTICAL, offsety: 3 * BRICK_HEIGHT, frameWidth: BRICK_WIDTH, frameHeight: BRICK_HEIGHT})
			.addAnimation('ball', 'ball_large.png')
			.addAnimation('paddle', 'paddle_middle.png')
		;

		fg.startGame(function () {
			var
				i,
				num_bricks,
				brick_name,
				playground = fg.playground(),
				paddle,
				radius,
				ball
			;

			G.PLAYGROUND_WIDTH = playground.width;
			G.PLAYGROUND_HEIGHT = playground.height;

			playground
				.addGroup('top_background', {background: 'top_gradient', left: 0, top: (0 * G.PLAYGROUND_HEIGHT) / 3, width: G.PLAYGROUND_WIDTH, height: G.PLAYGROUND_HEIGHT / 3}).end()
				.addGroup('middle_background', {background: 'middle_gradient', left: 0, top: (1 * G.PLAYGROUND_HEIGHT) / 3, width: G.PLAYGROUND_WIDTH, height: G.PLAYGROUND_HEIGHT / 3}).end()
				.addGroup('bottom_background', {background: 'bottom_gradient', left: 0, top: (2 * G.PLAYGROUND_HEIGHT) / 3, width: G.PLAYGROUND_WIDTH, height: G.PLAYGROUND_HEIGHT / 3}).end()
			;

			G.bricks = {};
			num_bricks = G.PLAYGROUND_WIDTH / BRICK_WIDTH;
			for (i = 0; i < num_bricks; i += 1) {
				brick_name = ['red_brick', String(i)].join('');
				playground.addSprite(brick_name, {animation: 'red_brick', left: i * BRICK_WIDTH, top: 2 * BRICK_HEIGHT});
				fg.sprites[brick_name].userData = {energy: 2};
				G.bricks[brick_name] = fg.sprites[brick_name];

				brick_name = ['brick', String(i)].join('');
				playground.addSprite(brick_name, {animation: 'brick', left: i * BRICK_WIDTH, top: 3 * BRICK_HEIGHT});
				fg.sprites[brick_name].userData = {energy: 3};
				G.bricks[brick_name] = fg.sprites[brick_name];

				brick_name = ['green_brick', String(i)].join('');
				playground.addSprite(brick_name, {animation: 'green_brick', left: i * BRICK_WIDTH, top: 4 * BRICK_HEIGHT});
				fg.sprites[brick_name].userData = {energy: 3};
				G.bricks[brick_name] = fg.sprites[brick_name];

				brick_name = ['blue_brick', String(i)].join('');
				playground.addSprite(brick_name, {animation: 'blue_brick', left: i * BRICK_WIDTH, top: 5 * BRICK_HEIGHT});
				fg.sprites[brick_name].userData = {energy: 2};
				G.bricks[brick_name] = fg.sprites[brick_name];
			}

			playground.addSprite('paddle', {animation: 'paddle', centerx: playground.centerx, bottom: playground.bottom - fg.resources.paddle.height});
			paddle = fg.sprites.paddle;
			radius = paddle.halfHeight;
			paddle.userData = {
				left_circle: fg.Rect({left: paddle.left, centery: paddle.centery, radius: radius}),
				right_circle: fg.Rect({right: paddle.right, centery: paddle.centery, radius: radius}),
				middle_square: fg.Rect({centerx: paddle.centerx, centery: paddle.centery, width: paddle.width - (2 * radius), height: paddle.height})
			};

			playground.addSprite('ball', {animation: 'ball', centerx: paddle.centerx, bottom: paddle.top});
			ball = fg.sprites.ball;
			ball.userData = {
				state: STATE_STUCK,
				speed_x: 0,
				speed_y: 0
			};

			$('#playground').mousedown(function () {
				if (ball.userData.state === STATE_STUCK) {
					ball.userData.state = STATE_MOVING;
					ball.userData.speed_x = BALL_SPEED * Math.cos(START_ANGLE);
					ball.userData.speed_y = BALL_SPEED * Math.sin(START_ANGLE);
				}
			});

			playground.registerCallback(function () {
				var
					halfWidth = paddle.halfWidth
				;

				paddle.move({centerx: fg.clamp(fg.mouseTracker.x, halfWidth, G.PLAYGROUND_WIDTH - halfWidth)});
				paddle.userData.left_circle.move({left: paddle.left});
				paddle.userData.right_circle.move({right: paddle.right});
				paddle.userData.middle_square.move({centerx: paddle.centerx});
				if (ball.userData.state === STATE_STUCK) {
					ball.move({centerx: paddle.centerx});
				}
			}, REFRESH_RATE);

			playground.registerCallback(function () {
				var
					angle,
					paddle_data = paddle.userData,
					ball_data = ball.userData,
					left_circle = paddle_data.left_circle,
					right_circle = paddle_data.right_circle,
					middle_square = paddle_data.middle_square
				;

				if (ball.userData.state === STATE_MOVING) {
					ball.move({centerx: ball.centerx + ball.userData.speed_x, centery: ball.centery + ball.userData.speed_y});

					// Check collision with playground
					if	(
							((ball.left <= playground.left) && (ball_data.speed_x < 0))
						||	((ball.right >= playground.right) && (ball_data.speed_x > 0))
						) {
						ball_data.speed_x *= -1;
					}

					if	(
							((ball.top <= playground.top) && (ball_data.speed_y < 0))
						||	((ball.bottom >= playground.bottom) && (ball_data.speed_y > 0))
						) {
						ball_data.speed_y *= -1;
					}

					// Check collision with paddle
					if (middle_square.collidePointRect(ball.centerx, ball.bottom) && (ball_data.speed_y > 0)) {
						ball_data.speed_y *= -1;
					} else if (middle_square.collidePointRect(ball.centerx, ball.top) && (ball_data.speed_y < 0)) {
						ball_data.speed_y *= -1;
					} else if (ball.collideCircle(left_circle)) {
						angle = Math.atan2(ball.centery - left_circle.centery, ball.centerx - left_circle.centerx);
						ball_data.speed_x = BALL_SPEED * Math.cos(angle);
						ball_data.speed_y = BALL_SPEED * Math.sin(angle);
						if ((ball_data.speed_y >= 0) && (ball_data.speed_y < 1)) {
							ball_data.speed_y = 1;
						}
						if ((ball_data.speed_y <= 0) && (ball_data.speed_y > -1)) {
							ball_data.speed_y = -1;
						}
					} else if (ball.collideCircle(right_circle)) {
						angle = Math.atan2(ball.centery - right_circle.centery, ball.centerx - right_circle.centerx);
						ball_data.speed_x = BALL_SPEED * Math.cos(angle);
						ball_data.speed_y = BALL_SPEED * Math.sin(angle);
						if ((ball_data.speed_y >= 0) && (ball_data.speed_y < 1)) {
							ball_data.speed_y = 1;
						}
						if ((ball_data.speed_y <= 0) && (ball_data.speed_y > -1)) {
							ball_data.speed_y = -1;
						}
					} else {
						$.noop();
					}

					// Check collision with bricks
					$.each(G.bricks, function (name) {
						var
							damage = true
						;

						if (this.collidePointRect(ball.centerx, ball.top) && (ball_data.speed_y < 0)) {
							ball_data.speed_y *= -1;
						} else if (this.collidePointRect(ball.centerx, ball.bottom) && (ball_data.speed_y > 0)) {
							ball_data.speed_y *= -1;
						} else if (this.collidePointRect(ball.left, ball.centery) && (ball_data.speed_x < 0)) {
							ball_data.speed_x *= -1;
						} else if (this.collidePointRect(ball.right, ball.centery) && (ball_data.speed_x > 0)) {
							ball_data.speed_x *= -1;
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
			}, REFRESH_RATE);
		});
	});
}(jQuery, friGame));

