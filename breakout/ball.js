/*global jQuery, friGame, G */
/*jslint white: true, browser: true */

(function ($, fg) {
	'use strict';

	var
		ballCounter = 0,
		ballSpeed = 0.3 * fg.REFRESH_RATE
	;

	G.addBall = function (active) {
		var
			ball_name = ['ball', String(ballCounter)].join('_')
		;

		ballCounter += 1;
		ballCounter %= 100000;

		fg.s.playground
			.addSprite(ball_name, {
				animation: 'ball',
				centerx: 50,
				centery: fg.s.playground.halfHeight
			})
		;

		fg.s[ball_name].userData = G.Ball(ball_name, active);

		G.balls[ball_name] = fg.s[ball_name];

		fg.s[ball_name].registerCallback(function () {
			this.userData.update();
		});
	};

	G.PBall = {
		init: function (name, active) {
			this.node = fg.s[name];
			this.active = active;

			this.vel = {};
			fg.Vec2.fromMagAngle(this.vel, ballSpeed, Math.PI / 4);

			this.x = this.node.centerx;
			this.y = this.node.centery;

			this.prevX = this.x;
			this.prevY = this.y;
		},

		update: function () {
			if (!this.active) {
				return;
			}

			this.prevX = this.x;
			this.prevY = this.y;

			this.x += this.vel.x;
			this.y += this.vel.y;

			this.node.move({
				centerx: this.x,
				centery: this.y
			});

			// did the ball get past the paddle?
			if (this.node.top >= fg.s.playground.height) {
				delete G.balls[this.node.name];
				this.node.remove();
				this.node = null;
				if ($.isEmptyObject(G.balls)) {
					G.lives -= 1;
					$('#lives').html(String(G.lives));
					if (G.lives <= 0) {
						G.Scene.gameOver();
					} else {
						G.addBall(false);
						G.addCountdown();
					}

				}
				return;
			}

			this.checkWallCollision();
			this.checkBlockCollision();
			if (fg.s.paddle) {
				this.checkPaddleCollision();
			}
		},

		checkWallCollision: function () {
			// hit a vertical wall?
			if ((this.node.left < 16) || (this.node.right >= (fg.s.playground.width - 16))) {
				this.x = this.prevX;
				this.node.move({
					centerx: this.x
				});
				this.vel.x *= - 1;
				return;
			}

			// or the top horizontal wall?
			if (this.node.top < 16) {
				this.y = this.prevY;
				this.node.move({
					centery: this.y
				});
				this.vel.y *= - 1;
				return;
			}
		},

		checkBlockCollision: function () {
			var
				ball = this.node,
				ball_data = this
			;

			$.each(G.blocks, function (name, block) {
				if (block.collidePointRect(ball.centerx, ball.top) && (ball_data.vel.y < 0)) {
					G.onBlockDeath(block);
					ball_data.y = ball_data.prevY;
					ball.move({
						centery: ball_data.y
					});
					ball_data.vel.y *= -1;
				} else if (block.collidePointRect(ball.centerx, ball.bottom) && (ball_data.vel.y > 0)) {
					G.onBlockDeath(block);
					ball_data.y = ball_data.prevY;
					ball.move({
						centery: ball_data.y
					});
					ball_data.vel.y *= -1;
				} else if (block.collidePointRect(ball.left, ball.centery) && (ball_data.vel.x < 0)) {
					G.onBlockDeath(block);
					ball_data.x = ball_data.prevX;
					ball.move({
						centerx: ball_data.x
					});
					ball_data.vel.x *= -1;
				} else if (block.collidePointRect(ball.right, ball.centery) && (ball_data.vel.x > 0)) {
					G.onBlockDeath(block);
					ball_data.x = ball_data.prevX;
					ball.move({
						centerx: ball_data.x
					});
					ball_data.vel.x *= -1;
				}
			});
		},

		checkPaddleCollision: function () {
			if (this.vel.y > 0) {
				if (fg.s.paddle.collidePointRect(this.node.centerx, this.node.bottom) && (this.vel.y > 0)) {
					this.x = this.prevX;
					this.y = this.prevY;
					this.node.move({
						centerx: this.x,
						centery: this.y
					});
					this.determineBounceVelocity();
				} else if (fg.s.paddle.collidePointRect(this.node.left, this.node.centery) && (this.vel.x < 0)) {
					this.x = this.prevX;
					this.node.move({
						centerx: this.x
					});
					this.vel.x *= -1;
				} else if (fg.s.paddle.collidePointRect(this.node.right, this.node.centery) && (this.vel.x > 0)) {
					this.x = this.prevX;
					this.node.move({
						centerx: this.x
					});
					this.vel.x *= -1;
				}
			}
		},

		determineBounceVelocity: function () {
			var
				delta = {
					x: this.prevX - fg.s.paddle.centerx,
					y: this.prevY - fg.s.paddle.centery
				}
			;

			fg.Vec2.fromMagAngle(this.vel, ballSpeed, fg.Vec2.azimuth(delta));
		}
	};

	G.Ball = fg.Maker(G.PBall);
}(jQuery, friGame));

