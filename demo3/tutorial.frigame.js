/*global $ */
/*jslint sloppy: true, white: true, browser: true */

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

		G = {};

	// Some hellper functions :

	// Function to restart the game:
	G.restartGame = function () {
		location.reload();
	};

	// Simple square to square collision detection:
	G.collision = function (left1, top1, width1, height1, left2, top2, width2, height2) {
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
	G.PrototypePlayer = {
		init: function () {
			this.parentNode = $.friGame.groups.player;
			this.node = $.friGame.sprites.playerBody;
			this.nodeBooster = $.friGame.sprites.playerBooster;
			this.nodeBoostUp = $.friGame.sprites.playerBoostUp;
			this.nodeBoostDown = $.friGame.sprites.playerBoostDown;
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
			//this.node.fadeTo(0, 0.5);
			return false;
		},

		update: function () {
			if ((this.respawnTime > 0) && (((new Date()).getTime() - this.respawnTime) > 3000)) {
				this.grace = false;
				//this.node.fadeTo(500, 1);
				this.respawnTime = -1;
			}
		},

		move: function (options) {
			var
				delta
			;

			if (options.hasOwnProperty('left')) {
				delta = options.left - this.node.left();

				this.node.move({left: options.left});
				this.nodeBooster.move({left: this.nodeBooster.left() + delta});
				this.nodeBoostUp.move({left: this.nodeBoostUp.left() + delta});
				this.nodeBoostDown.move({left: this.nodeBoostDown.left() + delta});
				if (this.hit) {
					$.friGame.sprites.explosion.move({left: options.left});
				}
			}

			if (options.hasOwnProperty('top')) {
				delta = options.top - this.node.top();

				this.node.move({top: options.top});
				this.nodeBooster.move({top: this.nodeBooster.top() + delta});
				this.nodeBoostUp.move({top: this.nodeBoostUp.top() + delta});
				this.nodeBoostDown.move({top: this.nodeBoostDown.top() + delta});
				if (this.hit) {
					$.friGame.sprites.explosion.move({top: options.top});
				}
			}
		},

		left: function () {
			return this.node.left();
		},

		top: function () {
			return this.node.top();
		},

		explode: function () {
			this.parentNode.hide();
			this.parentNode.addSprite('explosion', {animation: playerAnimation.explode});
			this.hit = true;
		},

		endExplosion: function () {
			$.friGame.sprites.explosion.remove();
			this.parentNode.show();
			this.hit = false;
		}
	};

	G.Player = function () {
		var
			player = Object.create(G.PrototypePlayer);

		player.init.apply(player, arguments);

		return player;
	};

	G.PrototypeEnemy = {
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
				newpos = this.node.left() + this.speedx;

			this.node.move({left: newpos});
		},

		updateY: function (playerNode) {
			var
				newpos = this.node.top() + this.speedy;

			this.node.move({top: newpos});
		}
	};

	G.PrototypeMinion = Object.create(G.PrototypeEnemy);
	$.extend(G.PrototypeMinion, {
		idle: $.friGame.Animation('minion_idle.png', {numberOfFrame: 5, frameHeight: 52, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation('minion_explode.png', {numberOfFrame: 11, frameHeight: 52, rate: 30, type: $.friGame.ANIMATION_VERTICAL}),

		updateY: function (playerNode) {
			var
				pos = this.node.top();

			if (pos > (PLAYGROUND_HEIGHT - 100)) {
				this.node.move({top: pos - 2});
			}
		}
	});

	G.Minion = function () {
		var
			minion = Object.create(G.PrototypeMinion);

		minion.init.apply(minion, arguments);

		return minion;
	};

	G.PrototypeBrainy = Object.create(G.PrototypeEnemy);
	$.extend(G.PrototypeBrainy, {
		init: function (node) {
			G.PrototypeEnemy.init.call(this, node);

			this.node = node;
			this.shield = 5;
			this.speedy = 1;
			this.alignmentOffset = 5;
		},

		idle: $.friGame.Animation('brainy_idle.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation('brainy_explode.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),

		updateY: function (playerNode) {
			var
				newpos;

			if ((this.node.top() + this.alignmentOffset) > playerNode.top()) {
				newpos = this.node.top() - this.speedy;
				this.node.move({top: newpos});
			} else if ((this.node.top() + this.alignmentOffset) < playerNode.top()) {
				newpos = this.node.top() + this.speedy;
				this.node.move({top: newpos});
			}
		}
	});

	G.Brainy = function () {
		var
			brainy = Object.create(G.PrototypeBrainy);

		brainy.init.apply(brainy, arguments);

		return brainy;
	};

	G.PrototypeBossy = Object.create(G.PrototypeBrainy);
	$.extend(G.PrototypeBossy, {
		init: function (node) {
			G.PrototypeBrainy.init.call(this, node);

			this.node = node;
			this.shield = 20;
			this.speedx = -1;
			this.alignmentOffset = 35;
		},

		idle: $.friGame.Animation('bossy_idle.png', {numberOfFrame: 5, frameHeight: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation('bossy_explode.png', {numberOfFrame: 9, frameHeight: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),

		updateX: function () {
			var
				pos = this.node.left();

			if (pos > (PLAYGROUND_WIDTH - 200)) {
				this.node.move({left: pos + this.speedx});
			}
		}
	});

	G.Bossy = function () {
		var
			bossy = Object.create(G.PrototypeBossy);

		bossy.init.apply(bossy, arguments);

		return bossy;
	};



	// --------------------------------------------------------------------------------------------------------------------
	// --									   the main declaration:													 --
	// --------------------------------------------------------------------------------------------------------------------
	$(function () {
		// Aniomations declaration:

		var
			// The background:
			background0 = $.friGame.Animation('background0.png'),
			background1 = $.friGame.Animation('background1.png'),
			background2 = $.friGame.Animation('background2.png'),
			background3 = $.friGame.Animation('background3.png'),
			background4 = $.friGame.Animation('background4.png'),
			background5 = $.friGame.Animation('background5.png'),
			background6 = $.friGame.Animation('background6.png');


		// Player space shipannimations:
		playerAnimation.idle = $.friGame.Animation('player_spaceship.png');
		playerAnimation.explode = $.friGame.Animation('player_explode.png', {numberOfFrame: 4, frameHeight: 26, rate: 60, type: $.friGame.ANIMATION_VERTICAL});
		playerAnimation.up = $.friGame.Animation('boosterup.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL});
		playerAnimation.down = $.friGame.Animation('boosterdown.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL});
		playerAnimation.boost = $.friGame.Animation('booster1.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL});
		playerAnimation.booster = $.friGame.Animation('booster2.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL});

		// Weapon missile:
		missile.player = $.friGame.Animation('player_missile.png', {numberOfFrame: 6, frameHeight: 10, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.enemies = $.friGame.Animation('enemy_missile.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.playerexplode = $.friGame.Animation('player_missile_explode.png', {numberOfFrame: 8, frameHeight: 23, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.enemiesexplode = $.friGame.Animation('enemy_missile_explode.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL});

		// Initialize the game:

		// Initialize the background
		$.friGame.playground()
			.addGroup('background')
				.addSprite('background0', {animation: background0})
				.addSprite('background1', {animation: background1})
				.addSprite('background2', {animation: background2, left: PLAYGROUND_WIDTH})
				.addSprite('background3', {animation: background3})
				.addSprite('background4', {animation: background4, left: PLAYGROUND_WIDTH})
				.addSprite('background5', {animation: background5})
				.addSprite('background6', {animation: background6, left: PLAYGROUND_WIDTH})
			.end()
			.addGroup('actors')
				.addGroup('player', {left: 0, top: 0})
					.addSprite('playerBoostUp', {left: (PLAYGROUND_WIDTH / 2) + 37, top: (PLAYGROUND_HEIGHT / 2) + 15})
					.addSprite('playerBody', {animation: playerAnimation.idle, left: (PLAYGROUND_WIDTH / 2), top: (PLAYGROUND_HEIGHT / 2)})
					.addSprite('playerBooster', {animation: playerAnimation.boost, left: (PLAYGROUND_WIDTH / 2) - 32, top: (PLAYGROUND_HEIGHT / 2) + 5})
					.addSprite('playerBoostDown', {left: (PLAYGROUND_WIDTH / 2) + 37, top: (PLAYGROUND_HEIGHT / 2) - 7})
				.end()
			.end()
			.addGroup('playerMissileLayer').end()
			.addGroup('enemiesMissileLayer').end();

		G.thePlayer = G.Player();
		G.enemiesMissiles = {};
		G.enemies = {};
		G.playerMissiles = {};

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
		$.friGame.loadCallback = function (percent) {
			$('#loadingBar').width(400 * percent);
		};

		//initialize the start button
		$('#startbutton').click(function () {
			$.friGame.startGame(function () {
				$('#welcomeScreen').fadeTo(1000, 0, function () {
					$(this).remove();
				});
			});
		});

		G.keyTracker = {};

		//this is where the keybinding occurs
		$(document).keydown(function (e) {
			var
				playerleft,
				playertop,
				name;

			G.keyTracker[e.keyCode] = true;

			if (!gameOver && !G.thePlayer.hit) {
				switch (e.keyCode) {
				case 75: //this is shoot (k)
					//shoot missile here
					playerleft = G.thePlayer.left();
					playertop = G.thePlayer.top();
					name = ['playerMissle_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.playerMissileLayer.addSprite(name, {animation: missile.player, left: playerleft + 90, top: playertop + 14});
					G.playerMissiles[name] = $.friGame.sprites[name];
					break;
				case 65: //this is left! (a)
					G.thePlayer.nodeBooster.setAnimation({animation: null});
					break;
				case 87: //this is up! (w)
					G.thePlayer.nodeBoostUp.setAnimation({animation: playerAnimation.up});
					break;
				case 68: //this is right (d)
					G.thePlayer.nodeBooster.setAnimation({animation: playerAnimation.booster});
					break;
				case 83: //this is down! (s)
					G.thePlayer.nodeBoostDown.setAnimation({animation: playerAnimation.down});
					break;
				}
			}
		});

		//this is where the keybinding occurs
		$(document).keyup(function (e) {

			G.keyTracker[e.keyCode] = false;

			if (!gameOver && !G.thePlayer.hit) {
				switch (e.keyCode) {
				case 65: //this is left! (a)
					G.thePlayer.nodeBooster.setAnimation({animation: playerAnimation.boost});
					break;
				case 87: //this is up! (w)
					G.thePlayer.nodeBoostUp.setAnimation({animation: null});
					break;
				case 68: //this is right (d)
					G.thePlayer.nodeBooster.setAnimation({animation: playerAnimation.boost});
					break;
				case 83: //this is down! (s)
					G.thePlayer.nodeBoostDown.setAnimation({animation: null});
					break;
				}
			}
		});

		// this is the function that control most of the game logic
		$.friGame.registerCallback(function () {
			var
				nextpos,
				top,
				left;

			if (!gameOver) {
				$('#shieldHUD').html(['shield: ', String(G.thePlayer.shield)].join(''));
				$('#lifeHUD').html(['life: ', String(G.thePlayer.replay)].join(''));
				//Update the movement of the ship:
				if (!G.thePlayer.hit) {
					G.thePlayer.update();
					if (G.keyTracker[65]) { //this is left! (a)
						nextpos = G.thePlayer.left() - 5;
						if (nextpos > 0) {
							G.thePlayer.move({left: nextpos});
						}
					}
					if (G.keyTracker[68]) { //this is right! (d)
						nextpos = G.thePlayer.left() + 5;
						if (nextpos < PLAYGROUND_WIDTH - 100) {
							G.thePlayer.move({left: nextpos});
						}
					}
					if (G.keyTracker[87]) { //this is up! (w)
						nextpos = G.thePlayer.top() - 3;
						if (nextpos > 0) {
							G.thePlayer.move({top: nextpos});
						}
					}
					if (G.keyTracker[83]) { //this is down! (s)
						nextpos = G.thePlayer.top() + 3;
						if (nextpos < PLAYGROUND_HEIGHT - 30) {
							G.thePlayer.move({top: nextpos});
						}
					}
				} else {
					top = G.thePlayer.top() + 5;
					left = G.thePlayer.left() - 5;
					if (top > PLAYGROUND_HEIGHT) {
						//Does the player did get out of the screen?
						if (G.thePlayer.respawn()) {
							gameOver = true;
							$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
							$('#restartbutton').click(G.restartGame);
							//$('#actors, #playerMissileLayer, #enemiesMissileLayer').fadeTo(1000, 0);
							//$('#background').fadeTo(5000, 0);
						} else {
							G.thePlayer.endExplosion();
							G.thePlayer.move({top: PLAYGROUND_HEIGHT / 2, left: PLAYGROUND_WIDTH / 2});
						}
					} else {
						G.thePlayer.move({top: top, left: left});
					}
				}

				//Update the movement of the enemies
				$.each(G.enemies, function (name) {
					var
						left,
						enemyleft,
						enemytop,
						missilename;

					this.update(G.thePlayer);
					left = this.node.left();
					if ((left + 100) < 0) {
						this.node.remove();
						delete G.enemies[name];
						return;
					}
					//Test for collisions
					if (G.collision(this.node.left(), this.node.top(), this.node.width(), this.node.height(), G.thePlayer.node.left(), G.thePlayer.node.top(), G.thePlayer.node.width(), G.thePlayer.node.height())) {
						this.node.setAnimation({animation: this.explode, callback: function (node) {
							node.remove();
						}});
						//The player has been hit!
						if (G.thePlayer.damage()) {
							G.thePlayer.explode();
						}
					}
					//Make the enemy fire
					if (G.PrototypeBrainy.isPrototypeOf(this)) {
						if (Math.random() < 0.05) {
							enemyleft = this.node.left();
							enemytop = this.node.top();
							missilename = ['enemiesMissile_', String(Math.ceil(Math.random() * 1000))].join('');
							$.friGame.groups.enemiesMissileLayer.addSprite(missilename, {animation: missile.enemies, left: enemyleft, top: enemytop + 20});
							G.enemiesMissiles[missilename] = $.friGame.sprites[missilename];
						}
					}
				});

				//Update the movement of the missiles
				$.each(G.playerMissiles, function (name) {
					var
						left = this.left(),
						collided,
						playermissile = this;

					if (left > PLAYGROUND_WIDTH) {
						this.remove();
						delete G.playerMissiles[name];
						return;
					}
					this.move({left: left + MISSILE_SPEED});
					//Test for collisions
					collided = {};
					$.each(G.enemies, function (enemy) {
						if (G.collision(playermissile.left(), playermissile.top(), playermissile.width(), playermissile.height(), this.node.left(), this.node.top(), this.node.width(), this.node.height())) {
							collided[enemy] = this;
						}
					});
					if (!$.isEmptyObject(collided)) {
						//An enemy has been hit!
						$.each(collided, function (enemy) {
							if (this.damage()) {
								this.node.setAnimation({animation: this.explode, callback: function (node) {
									node.remove();
								}});
								delete G.enemies[enemy];
							}
						});
						this.setAnimation({animation: missile.playerexplode, callback: function (node) {
							node.remove();
						}});
						this.move({top: this.top() - 7});
						delete G.playerMissiles[name];
					}
				});
				$.each(G.enemiesMissiles, function (name) {
					var
						left = this.left();

					if (left < 0) {
						this.remove();
						delete G.enemiesMissiles[name];
						return;
					}
					this.move({left: left - MISSILE_SPEED});
					//Test for collisions
					if (G.collision(this.left(), this.top(), this.width(), this.height(), G.thePlayer.node.left(), G.thePlayer.node.top(), G.thePlayer.node.width(), G.thePlayer.node.height())) {
						//The player has been hit!
						if (G.thePlayer.damage()) {
							G.thePlayer.explode();
						}
						//$(this).remove();
						this.setAnimation({animation: missile.enemiesexplode, callback: function (node) {
							node.remove();
						}});
						delete G.enemiesMissiles[name];
					}
				});
			}
		}, REFRESH_RATE);

		//This function manage the creation of the enemies
		$.friGame.registerCallback(function () {
			var
				name;

			if (!bossMode && !gameOver) {
				if (Math.random() < 0.4) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.actors.addSprite(name, {animation: G.PrototypeMinion.idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT});
					G.enemies[name] = G.Minion($.friGame.sprites[name]);
				} else if (Math.random() < 0.5) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.actors.addSprite(name, {animation: G.PrototypeBrainy.idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT});
					G.enemies[name] = G.Brainy($.friGame.sprites[name]);
				} else if (Math.random() > 0.8) {
					bossMode = true;
					bossName = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.actors.addSprite(bossName, {animation: G.PrototypeBossy.idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT});
					G.enemies[bossName] = G.Bossy($.friGame.sprites[bossName]);
				}
			} else {
				if (!$.friGame.sprites[bossName]) {
					bossMode = false;
				}
			}

		}, 1000); //once per seconds is enough for this


		//This is for the background animation
		$.friGame.registerCallback(function () {
			//Offset all the pane:
			var
				newPos = ($.friGame.sprites.background1.left() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;

			$.friGame.sprites.background1.move({left: newPos});

			newPos = ($.friGame.sprites.background2.left() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background2.move({left: newPos});

			newPos = ($.friGame.sprites.background3.left() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background3.move({left: newPos});

			newPos = ($.friGame.sprites.background4.left() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background4.move({left: newPos});

			newPos = ($.friGame.sprites.background5.left() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background5.move({left: newPos});

			newPos = ($.friGame.sprites.background6.left() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background6.move({left: newPos});
		}, REFRESH_RATE);
	});
}());

