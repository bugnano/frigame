/*global $ */
/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true */

if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}

(function () {
	var
		// Global constants:
		PLAYGROUND_WIDTH = 700,
		PLAYGROUND_HEIGHT = 250,
		REFRESH_RATE = 15,

		MISSILE_SPEED = 10, //px per frame

		/*Constants for the gameplay*/
		smallStarSpeed = 1, //pixels per frame
		mediumStarSpeed = 3, //pixels per frame
		bigStarSpeed = 4, //pixels per frame

		// Gloabl animation holder
		playerAnimation = {},
		missile = {},

		// Game state
		bossMode = false,
		bossName = null,
		gameOver = false,

		_ = {};

	// Some hellper functions :

	// Function to restart the game:
	_.restartGame = function () {
		location.reload();
	};

	// Simple square to square collision detection:
	_.collision = function (left1, top1, width1, height1, left2, top2, width2, height2) {
		var
			right1 = left1 + width1,
			bottom1 = top1 + height1,
			right2 = left2 + width2,
			bottom2 = top2 + height2;

		return (
			((left1 >= left2) && (left1 <= right2) && (top1 >= top2) && (top1 <= bottom2)) ||
			((left1 >= left2) && (left1 <= right2) && (bottom1 >= top2) && (bottom1 <= bottom2)) ||
			((right1 >= left2) && (right1 <= right2) && (top1 >= top2) && (top1 <= bottom2)) ||
			((right1 >= left2) && (right1 <= right2) && (bottom1 >= top2) && (bottom1 <= bottom2))
		);
	};

	// Game objects:
	_.PrototypePlayer = {
		init: function () {
			this.parentNode = $('#player');
			this.node = $('#playerBody');
			this.nodeBooster = $('#playerBooster');
			this.nodeBoostUp = $('#playerBoostUp');
			this.nodeBoostDown = $('#playerBoostDown');
			//this.animations = animations;

			this.grace = false;
			this.replay = 3;
			this.shield = 3;
			this.respawnTime = -1;
			this.hit = false;
		},

		// This function damage the ship and return true if this cause the ship to die
		damage: function () {
			if (!this.grace) {
				this.shield -= 1;
				if (this.shield === 0) {
					return true;
				}
				return false;
			}
			return false;
		},

		// this try to respawn the ship after a death and return true if the game is over
		respawn: function () {
			this.replay -= 1;
			if (this.replay === 0) {
				return true;
			}

			this.grace = true;
			this.shield = 3;

			this.respawnTime = (new Date()).getTime();
			this.node.fadeTo(0, 0.5);
			return false;
		},

		update: function () {
			if ((this.respawnTime > 0) && (((new Date()).getTime() - this.respawnTime) > 3000)) {
				this.grace = false;
				this.node.fadeTo(500, 1);
				this.respawnTime = -1;
			}
		},

		posx: function (nextpos) {
			var
				delta;

			if (nextpos === undefined) {
				return this.node.posx();
			} else {
				delta = nextpos - this.node.posx();

				this.node.posx(nextpos);
				this.nodeBooster.posx(this.nodeBooster.posx() + delta);
				this.nodeBoostUp.posx(this.nodeBoostUp.posx() + delta);
				this.nodeBoostDown.posx(this.nodeBoostDown.posx() + delta);
				if (this.hit) {
					$('#explosion').posx(nextpos);
				}
			}
		},

		posy: function (nextpos) {
			var
				delta;

			if (nextpos === undefined) {
				return this.node.posy();
			} else {
				delta = nextpos - this.node.posy();

				this.node.posy(nextpos);
				this.nodeBooster.posy(this.nodeBooster.posy() + delta);
				this.nodeBoostUp.posy(this.nodeBoostUp.posy() + delta);
				this.nodeBoostDown.posy(this.nodeBoostDown.posy() + delta);
				if (this.hit) {
					$('#explosion').posy(nextpos);
				}
			}
		},

		explode: function () {
			this.node.hide();
			this.nodeBooster.hide();
			this.nodeBoostUp.hide();
			this.nodeBoostDown.hide();
			this.parentNode.addSprite('explosion', {animation: playerAnimation.explode, width: 100, height: 26});
			this.hit = true;
		},

		endExplosion: function () {
			$('#explosion').remove();
			this.node.show();
			this.nodeBooster.show();
			this.nodeBoostUp.show();
			this.nodeBoostDown.show();
			this.hit = false;
		}
	};

	_.Player = function () {
		var
			args = Array.prototype.slice.call(arguments),
			player = Object.create(_.PrototypePlayer);

		player.init.apply(player, args);

		return player;
	};

	_.PrototypeEnemy = {
		init: function (node) {
			this.shield = 2;
			this.speedx = -5;
			this.speedy = 0;
			this.node = node;
		},

		// deals with damage endured by an enemy
		damage: function () {
			this.shield -= 1;
			if (this.shield === 0) {
				return true;
			}
			return false;
		},

		// updates the position of the enemy
		update: function (playerNode) {
			this.updateX(playerNode);
			this.updateY(playerNode);
		},

		updateX: function (playerNode) {
			var
				newpos = this.node.posx() + this.speedx;

			this.node.posx(newpos);
		},

		updateY: function (playerNode) {
			var
				newpos = this.node.posy() + this.speedy;

			this.node.posy(newpos);
		}
	};

	_.PrototypeMinion = Object.create(_.PrototypeEnemy);
	$.extend(_.PrototypeMinion, {
		idle: new $.gameQuery.Animation({imageURL: 'minion_idle.png', numberOfFrame: 5, delta: 52, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
		explode: new $.gameQuery.Animation({imageURL: 'minion_explode.png', numberOfFrame: 11, delta: 52, rate: 30, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK}),

		updateY: function (playerNode) {
			var
				pos = this.node.posy();

			if (pos > (PLAYGROUND_HEIGHT - 100)) {
				this.node.posy(pos - 2);
			}
		}
	});

	_.Minion = function () {
		var
			args = Array.prototype.slice.call(arguments),
			minion = Object.create(_.PrototypeMinion);

		minion.init.apply(minion, args);

		return minion;
	};

	_.PrototypeBrainy = Object.create(_.PrototypeEnemy);
	$.extend(_.PrototypeBrainy, {
		init: function (node) {
			_.PrototypeEnemy.init.call(this, node);

			this.node = node;
			this.shield = 5;
			this.speedy = 1;
			this.alignmentOffset = 5;
		},

		idle: new $.gameQuery.Animation({imageURL: 'brainy_idle.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
		explode: new $.gameQuery.Animation({imageURL: 'brainy_explode.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK}),

		updateY: function (playerNode) {
			var
				newpos;

			if ((this.node.posy() + this.alignmentOffset) > playerNode.posy()) {
				newpos = this.node.posy() - this.speedy;
				this.node.posy(newpos);
			} else if ((this.node.posy() + this.alignmentOffset) < playerNode.posy()) {
				newpos = this.node.posy() + this.speedy;
				this.node.posy(newpos);
			}
		}
	});

	_.Brainy = function () {
		var
			args = Array.prototype.slice.call(arguments),
			brainy = Object.create(_.PrototypeBrainy);

		brainy.init.apply(brainy, args);

		return brainy;
	};

	_.PrototypeBossy = Object.create(_.PrototypeBrainy);
	$.extend(_.PrototypeBossy, {
		init: function (node) {
			_.PrototypeBrainy.init.call(this, node);

			this.node = node;
			this.shield = 20;
			this.speedx = -1;
			this.alignmentOffset = 35;
		},

		idle: new $.gameQuery.Animation({imageURL: 'bossy_idle.png', numberOfFrame: 5, delta: 100, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
		explode: new $.gameQuery.Animation({imageURL: 'bossy_explode.png', numberOfFrame: 9, delta: 100, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK}),

		updateX: function () {
			var
				pos = this.node.posx();

			if (pos > (PLAYGROUND_WIDTH - 200)) {
				this.node.posx(pos + this.speedx);
			}
		}
	});

	_.Bossy = function () {
		var
			args = Array.prototype.slice.call(arguments),
			bossy = Object.create(_.PrototypeBossy);

		bossy.init.apply(bossy, args);

		return bossy;
	};



	// --------------------------------------------------------------------------------------------------------------------
	// --									   the main declaration:													 --
	// --------------------------------------------------------------------------------------------------------------------
	$(function () {
		// Aniomations declaration:

		var
			// The background:
			background1 = new $.gameQuery.Animation({imageURL: 'background1.png'}),
			background2 = new $.gameQuery.Animation({imageURL: 'background2.png'}),
			background3 = new $.gameQuery.Animation({imageURL: 'background3.png'}),
			background4 = new $.gameQuery.Animation({imageURL: 'background4.png'}),
			background5 = new $.gameQuery.Animation({imageURL: 'background5.png'}),
			background6 = new $.gameQuery.Animation({imageURL: 'background6.png'});


		// Player space shipannimations:
		playerAnimation.idle = new $.gameQuery.Animation({imageURL: 'player_spaceship.png'});
		playerAnimation.explode = new $.gameQuery.Animation({imageURL: 'player_explode.png', numberOfFrame: 4, delta: 26, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL});
		playerAnimation.up = new $.gameQuery.Animation({imageURL: 'boosterup.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_HORIZONTAL});
		playerAnimation.down = new $.gameQuery.Animation({imageURL: 'boosterdown.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_HORIZONTAL});
		playerAnimation.boost = new $.gameQuery.Animation({imageURL: 'booster1.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL});
		playerAnimation.booster = new $.gameQuery.Animation({imageURL: 'booster2.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL});

		// Weapon missile:
		missile.player = new $.gameQuery.Animation({imageURL: 'player_missile.png', numberOfFrame: 6, delta: 10, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL});
		missile.enemies = new $.gameQuery.Animation({imageURL: 'enemy_missile.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL});
		missile.playerexplode = new $.gameQuery.Animation({imageURL: 'player_missile_explode.png', numberOfFrame: 8, delta: 23, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK});
		missile.enemiesexplode = new $.gameQuery.Animation({imageURL: 'enemy_missile_explode.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK});

		// Initialize the game:
		$('#playground').playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH});

		// Initialize the background
		$.playground().addGroup('background', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background1', {animation: background1, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background2', {animation: background2, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
				.addSprite('background3', {animation: background3, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background4', {animation: background4, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
				.addSprite('background5', {animation: background5, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background6', {animation: background6, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
			.end()
			.addGroup('actors', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addGroup('player', {posx: 0, posy: 0, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
					.addSprite('playerBoostUp', {posx: (PLAYGROUND_WIDTH / 2) + 37, posy: (PLAYGROUND_HEIGHT / 2) + 15, width: 14, height: 18})
					.addSprite('playerBody', {animation: playerAnimation.idle, posx: (PLAYGROUND_WIDTH / 2), posy: (PLAYGROUND_HEIGHT / 2), width: 100, height: 26})
					.addSprite('playerBooster', {animation: playerAnimation.boost, posx: (PLAYGROUND_WIDTH / 2) - 32, posy: (PLAYGROUND_HEIGHT / 2) + 5, width: 36, height: 14})
					.addSprite('playerBoostDown', {posx: (PLAYGROUND_WIDTH / 2) + 37, posy: (PLAYGROUND_HEIGHT / 2) - 7, width: 14, height: 18})
				.end()
			.end()
			.addGroup('playerMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end()
			.addGroup('enemiesMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end();

		_.thePlayer = _.Player();
		_.enemiesMissiles = {};
		_.enemies = {};
		_.playerMissiles = {};

		//this is the HUD for the player life and shield
		$('<div id="overlay"></div>').appendTo($('#playground'));
		$('#overlay').css({
			position: 'absolute',
			left: 0,
			top: 0,
			width: [PLAYGROUND_WIDTH, 'px'].join(''),
			height: [PLAYGROUND_HEIGHT, 'px'].join('')
		});
		$('<div id="shieldHUD"></div>').appendTo($('#overlay'));
		$('#shieldHUD').css({
			color: 'white',
			width: '100px',
			position: 'absolute',
			'font-family': 'verdana, sans-serif'
		});
		$('<div id="lifeHUD"></div>').appendTo($('#overlay'));
		$('#lifeHUD').css({
			color: 'white',
			width: '100px',
			position: 'absolute',
			right: '0px',
			'font-family': 'verdana, sans-serif'
		});

		// this sets the id of the loading bar:
		$.loadCallback(function (percent) {
			$('#loadingBar').width((400 * percent) / 100);
		});

		//initialize the start button
		$('#startbutton').click(function () {
			$.playground().startGame(function () {
				$('#welcomeScreen').fadeTo(1000, 0, function () {
					$(this).remove();
				});
			});
		});

		_.keyTracker = {};

		//this is where the keybinding occurs
		$(document).keydown(function (e) {
			var
				playerposx,
				playerposy,
				name;

			_.keyTracker[e.keyCode] = true;

			if (!gameOver && !_.thePlayer.hit) {
				switch (e.keyCode) {
				case 75: //this is shoot (k)
					//shoot missile here
					playerposx = _.thePlayer.posx();
					playerposy = _.thePlayer.posy();
					name = ['playerMissle_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#playerMissileLayer').addSprite(name, {animation: missile.player, posx: playerposx + 90, posy: playerposy + 14, width: 36, height: 10});
					_.playerMissiles[name] = $(['#', name].join(''));
					break;
				case 65: //this is left! (a)
					_.thePlayer.nodeBooster.setAnimation();
					break;
				case 87: //this is up! (w)
					_.thePlayer.nodeBoostUp.setAnimation(playerAnimation.up);
					break;
				case 68: //this is right (d)
					_.thePlayer.nodeBooster.setAnimation(playerAnimation.booster);
					break;
				case 83: //this is down! (s)
					_.thePlayer.nodeBoostDown.setAnimation(playerAnimation.down);
					break;
				}
			}
		});

		//this is where the keybinding occurs
		$(document).keyup(function (e) {

			_.keyTracker[e.keyCode] = false;

			if (!gameOver && !_.thePlayer.hit) {
				switch (e.keyCode) {
				case 65: //this is left! (a)
					_.thePlayer.nodeBooster.setAnimation(playerAnimation.boost);
					break;
				case 87: //this is up! (w)
					_.thePlayer.nodeBoostUp.setAnimation();
					break;
				case 68: //this is right (d)
					_.thePlayer.nodeBooster.setAnimation(playerAnimation.boost);
					break;
				case 83: //this is down! (s)
					_.thePlayer.nodeBoostDown.setAnimation();
					break;
				}
			}
		});

		// this is the function that control most of the game logic
		$.playground().registerCallback(function () {
			var
				nextpos,
				posy,
				posx;

			if (!gameOver) {
				$('#shieldHUD').html(['shield: ', String(_.thePlayer.shield)].join(''));
				$('#lifeHUD').html(['life: ', String(_.thePlayer.replay)].join(''));
				//Update the movement of the ship:
				if (!_.thePlayer.hit) {
					_.thePlayer.update();
					if (_.keyTracker[65]) { //this is left! (a)
						nextpos = _.thePlayer.posx() - 5;
						if (nextpos > 0) {
							_.thePlayer.posx(nextpos);
						}
					}
					if (_.keyTracker[68]) { //this is right! (d)
						nextpos = _.thePlayer.posx() + 5;
						if (nextpos < PLAYGROUND_WIDTH - 100) {
							_.thePlayer.posx(nextpos);
						}
					}
					if (_.keyTracker[87]) { //this is up! (w)
						nextpos = _.thePlayer.posy() - 3;
						if (nextpos > 0) {
							_.thePlayer.posy(nextpos);
						}
					}
					if (_.keyTracker[83]) { //this is down! (s)
						nextpos = _.thePlayer.posy() + 3;
						if (nextpos < PLAYGROUND_HEIGHT - 30) {
							_.thePlayer.posy(nextpos);
						}
					}
				} else {
					posy = _.thePlayer.posy() + 5;
					posx = _.thePlayer.posx() - 5;
					if (posy > PLAYGROUND_HEIGHT) {
						//Does the player did get out of the screen?
						if (_.thePlayer.respawn()) {
							gameOver = true;
							$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
							$('#restartbutton').click(_.restartGame);
							$('#actors, #playerMissileLayer, #enemiesMissileLayer').fadeTo(1000, 0);
							$('#background').fadeTo(5000, 0);
						} else {
							_.thePlayer.endExplosion();
							_.thePlayer.posy(PLAYGROUND_HEIGHT / 2);
							_.thePlayer.posx(PLAYGROUND_WIDTH / 2);
						}
					} else {
						_.thePlayer.posy(posy);
						_.thePlayer.posx(posx);
					}
				}

				//Update the movement of the enemies
				$.each(_.enemies, function (name) {
					var
						posx,
						enemyposx,
						enemyposy,
						missilename;

					this.update(_.thePlayer);
					posx = this.node.posx();
					if ((posx + 100) < 0) {
						this.node.remove();
						delete _.enemies[name];
						return;
					}
					//Test for collisions
					if (_.collision(this.node.posx(), this.node.posy(), this.node.width(), this.node.height(), _.thePlayer.node.posx(), _.thePlayer.node.posy(), _.thePlayer.node.width(), _.thePlayer.node.height())) {
						if (_.PrototypeBossy.isPrototypeOf(this)) {
							this.node.setAnimation(this.explode, function (node) {
								$(node).remove();
							});
							this.node.css('width', 150);
						} else if (_.PrototypeBrainy.isPrototypeOf(this)) {
							this.node.setAnimation(this.explode, function (node) {
								$(node).remove();
							});
							this.node.css('width', 150);
						} else {
							this.node.setAnimation(this.explode, function (node) {
								$(node).remove();
							});
							this.node.css('width', 200);
						}
						//The player has been hit!
						if (_.thePlayer.damage()) {
							_.thePlayer.explode();
						}
					}
					//Make the enemy fire
					if (_.PrototypeBrainy.isPrototypeOf(this)) {
						if (Math.random() < 0.05) {
							enemyposx = this.node.posx();
							enemyposy = this.node.posy();
							missilename = ['enemiesMissile_', String(Math.ceil(Math.random() * 1000))].join('');
							$('#enemiesMissileLayer').addSprite(missilename, {animation: missile.enemies, posx: enemyposx, posy: enemyposy + 20, width: 30, height: 15});
							_.enemiesMissiles[missilename] = $(['#', missilename].join(''));
						}
					}
				});

				//Update the movement of the missiles
				$.each(_.playerMissiles, function (name) {
					var
						posx = this.posx(),
						collided,
						missile = this;

					if (posx > PLAYGROUND_WIDTH) {
						this.remove();
						delete _.playerMissiles[name];
						return;
					}
					this.posx(posx + MISSILE_SPEED);
					//Test for collisions
					collided = {};
					$.each(_.enemies, function (enemy) {
						if (_.collision(missile.posx(), missile.posy(), missile.width(), missile.height(), this.node.posx(), this.node.posy(), this.node.width(), this.node.height())) {
							collided[enemy] = this;
						}
					});
					if (!$.isEmptyObject(collided)) {
						//An enemy has been hit!
						$.each(collided, function (enemy) {
							if (this.damage()) {
								if (_.PrototypeBossy.isPrototypeOf(this)) {
									this.node.setAnimation(this.explode, function (node) {
										$(node).remove();
									});
									this.node.css('width', 150);
								} else if (_.PrototypeBrainy.isPrototypeOf(this)) {
									this.node.setAnimation(this.explode, function (node) {
										$(node).remove();
									});
									this.node.css('width', 150);
								} else {
									this.node.setAnimation(this.explode, function (node) {
										$(node).remove();
									});
									this.node.css('width', 200);
								}
								delete _.enemies[enemy];
							}
						});
						this.setAnimation(missile.playerexplode, function (node) {
							$(node).remove();
						});
						this.css('width', 38);
						this.css('height', 23);
						this.posy(this.posy() - 7);
						delete _.playerMissiles[name];
					}
				});
				$.each(_.enemiesMissiles, function (name) {
					var
						posx = this.posx();

					if (posx < 0) {
						this.remove();
						delete _.enemiesMissiles[name];
						return;
					}
					this.posx(posx - MISSILE_SPEED);
					//Test for collisions
					if (_.collision(this.posx(), this.posy(), this.width(), this.height(), _.thePlayer.node.posx(), _.thePlayer.node.posy(), _.thePlayer.node.width(), _.thePlayer.node.height())) {
						//The player has been hit!
						if (_.thePlayer.damage()) {
							_.thePlayer.explode();
						}
						//$(this).remove();
						this.setAnimation(missile.enemiesexplode, function (node) {
							$(node).remove();
						});
						delete _.enemiesMissiles[name];
					}
				});
			}
		}, REFRESH_RATE);

		//This function manage the creation of the enemies
		$.playground().registerCallback(function () {
			var
				name;

			if (!bossMode && !gameOver) {
				if (Math.random() < 0.4) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(name, {animation: _.PrototypeMinion.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 150, height: 52});
					_.enemies[name] = _.Minion($(['#', name].join('')));
				} else if (Math.random() < 0.5) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(name, {animation: _.PrototypeBrainy.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 42});
					_.enemies[name] = _.Brainy($(['#', name].join('')));
				} else if (Math.random() > 0.8) {
					bossMode = true;
					bossName = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(bossName, {animation: _.PrototypeBossy.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 100});
					_.enemies[bossName] = _.Bossy($(['#', bossName].join('')));
				}
			} else {
				if ($(['#', bossName].join('')).length === 0) {
					bossMode = false;
				}
			}

		}, 1000); //once per seconds is enough for this


		//This is for the background animation
		$.playground().registerCallback(function () {
			//Offset all the pane:
			var
				newPos = ($('#background1').posx() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;

			$('#background1').posx(newPos);

			newPos = ($('#background2').posx() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background2').posx(newPos);

			newPos = ($('#background3').posx() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background3').posx(newPos);

			newPos = ($('#background4').posx() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background4').posx(newPos);

			newPos = ($('#background5').posx() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background5').posx(newPos);

			newPos = ($('#background6').posx() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background6').posx(newPos);
		}, REFRESH_RATE);
	});
}());

