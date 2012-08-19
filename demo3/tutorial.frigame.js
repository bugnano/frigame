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

			if (options.hasOwnProperty('posx')) {
				delta = options.posx - this.node.posx();

				this.node.move({posx: options.posx});
				this.nodeBooster.move({posx: this.nodeBooster.posx() + delta});
				this.nodeBoostUp.move({posx: this.nodeBoostUp.posx() + delta});
				this.nodeBoostDown.move({posx: this.nodeBoostDown.posx() + delta});
				if (this.hit) {
					$.friGame.sprites.explosion.move({posx: options.posx});
				}
			}

			if (options.hasOwnProperty('posy')) {
				delta = options.posy - this.node.posy();

				this.node.move({posy: options.posy});
				this.nodeBooster.move({posy: this.nodeBooster.posy() + delta});
				this.nodeBoostUp.move({posy: this.nodeBoostUp.posy() + delta});
				this.nodeBoostDown.move({posy: this.nodeBoostDown.posy() + delta});
				if (this.hit) {
					$.friGame.sprites.explosion.posy({posy: options.posy});
				}
			}
		},

		posx: function () {
			return this.node.posx();
		},

		posy: function (nextpos) {
			return this.node.posy();
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
				newpos = this.node.posx() + this.speedx;

			this.node.move({posx: newpos});
		},

		updateY: function (playerNode) {
			var
				newpos = this.node.posy() + this.speedy;

			this.node.move({posy: newpos});
		}
	};

	G.PrototypeMinion = Object.create(G.PrototypeEnemy);
	$.extend(G.PrototypeMinion, {
		idle: $.friGame.Animation({imageURL: 'minion_idle.png', numberOfFrame: 5, delta: 52, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation({imageURL: 'minion_explode.png', numberOfFrame: 11, delta: 52, rate: 30, type: $.friGame.ANIMATION_VERTICAL}),

		updateY: function (playerNode) {
			var
				pos = this.node.posy();

			if (pos > (PLAYGROUND_HEIGHT - 100)) {
				this.node.move({posy: pos - 2});
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

		idle: $.friGame.Animation({imageURL: 'brainy_idle.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation({imageURL: 'brainy_explode.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),

		updateY: function (playerNode) {
			var
				newpos;

			if ((this.node.posy() + this.alignmentOffset) > playerNode.posy()) {
				newpos = this.node.posy() - this.speedy;
				this.node.move({posy: newpos});
			} else if ((this.node.posy() + this.alignmentOffset) < playerNode.posy()) {
				newpos = this.node.posy() + this.speedy;
				this.node.move({posy: newpos});
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

		idle: $.friGame.Animation({imageURL: 'bossy_idle.png', numberOfFrame: 5, delta: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
		explode: $.friGame.Animation({imageURL: 'bossy_explode.png', numberOfFrame: 9, delta: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),

		updateX: function () {
			var
				pos = this.node.posx();

			if (pos > (PLAYGROUND_WIDTH - 200)) {
				this.node.move({posx: pos + this.speedx});
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
			background0 = $.friGame.Animation({imageURL: 'background0.png'}),
			background1 = $.friGame.Animation({imageURL: 'background1.png'}),
			background2 = $.friGame.Animation({imageURL: 'background2.png'}),
			background3 = $.friGame.Animation({imageURL: 'background3.png'}),
			background4 = $.friGame.Animation({imageURL: 'background4.png'}),
			background5 = $.friGame.Animation({imageURL: 'background5.png'}),
			background6 = $.friGame.Animation({imageURL: 'background6.png'});


		// Player space shipannimations:
		playerAnimation.idle = $.friGame.Animation({imageURL: 'player_spaceship.png'});
		playerAnimation.explode = $.friGame.Animation({imageURL: 'player_explode.png', numberOfFrame: 4, delta: 26, rate: 60, type: $.friGame.ANIMATION_VERTICAL});
		playerAnimation.up = $.friGame.Animation({imageURL: 'boosterup.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL});
		playerAnimation.down = $.friGame.Animation({imageURL: 'boosterdown.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL});
		playerAnimation.boost = $.friGame.Animation({imageURL: 'booster1.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL});
		playerAnimation.booster = $.friGame.Animation({imageURL: 'booster2.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL});

		// Weapon missile:
		missile.player = $.friGame.Animation({imageURL: 'player_missile.png', numberOfFrame: 6, delta: 10, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.enemies = $.friGame.Animation({imageURL: 'enemy_missile.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.playerexplode = $.friGame.Animation({imageURL: 'player_missile_explode.png', numberOfFrame: 8, delta: 23, rate: 90, type: $.friGame.ANIMATION_VERTICAL});
		missile.enemiesexplode = $.friGame.Animation({imageURL: 'enemy_missile_explode.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL});

		// Initialize the game:

		// Initialize the background
		$.friGame.playground()
			.addGroup('background')
				.addSprite('background0', {animation: background0})
				.addSprite('background1', {animation: background1})
				.addSprite('background2', {animation: background2, posx: PLAYGROUND_WIDTH})
				.addSprite('background3', {animation: background3})
				.addSprite('background4', {animation: background4, posx: PLAYGROUND_WIDTH})
				.addSprite('background5', {animation: background5})
				.addSprite('background6', {animation: background6, posx: PLAYGROUND_WIDTH})
			.end()
			.addGroup('actors')
				.addGroup('player', {posx: 0, posy: 0})
					.addSprite('playerBoostUp', {posx: (PLAYGROUND_WIDTH / 2) + 37, posy: (PLAYGROUND_HEIGHT / 2) + 15})
					.addSprite('playerBody', {animation: playerAnimation.idle, posx: (PLAYGROUND_WIDTH / 2), posy: (PLAYGROUND_HEIGHT / 2)})
					.addSprite('playerBooster', {animation: playerAnimation.boost, posx: (PLAYGROUND_WIDTH / 2) - 32, posy: (PLAYGROUND_HEIGHT / 2) + 5})
					.addSprite('playerBoostDown', {posx: (PLAYGROUND_WIDTH / 2) + 37, posy: (PLAYGROUND_HEIGHT / 2) - 7})
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
				playerposx,
				playerposy,
				name;

			G.keyTracker[e.keyCode] = true;

			if (!gameOver && !G.thePlayer.hit) {
				switch (e.keyCode) {
				case 75: //this is shoot (k)
					//shoot missile here
					playerposx = G.thePlayer.posx();
					playerposy = G.thePlayer.posy();
					name = ['playerMissle_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.playerMissileLayer.addSprite(name, {animation: missile.player, posx: playerposx + 90, posy: playerposy + 14});
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
				posy,
				posx;

			if (!gameOver) {
				$('#shieldHUD').html(['shield: ', String(G.thePlayer.shield)].join(''));
				$('#lifeHUD').html(['life: ', String(G.thePlayer.replay)].join(''));
				//Update the movement of the ship:
				if (!G.thePlayer.hit) {
					G.thePlayer.update();
					if (G.keyTracker[65]) { //this is left! (a)
						nextpos = G.thePlayer.posx() - 5;
						if (nextpos > 0) {
							G.thePlayer.move({posx: nextpos});
						}
					}
					if (G.keyTracker[68]) { //this is right! (d)
						nextpos = G.thePlayer.posx() + 5;
						if (nextpos < PLAYGROUND_WIDTH - 100) {
							G.thePlayer.move({posx: nextpos});
						}
					}
					if (G.keyTracker[87]) { //this is up! (w)
						nextpos = G.thePlayer.posy() - 3;
						if (nextpos > 0) {
							G.thePlayer.move({posy: nextpos});
						}
					}
					if (G.keyTracker[83]) { //this is down! (s)
						nextpos = G.thePlayer.posy() + 3;
						if (nextpos < PLAYGROUND_HEIGHT - 30) {
							G.thePlayer.move({posy: nextpos});
						}
					}
				} else {
					posy = G.thePlayer.posy() + 5;
					posx = G.thePlayer.posx() - 5;
					if (posy > PLAYGROUND_HEIGHT) {
						//Does the player did get out of the screen?
						if (G.thePlayer.respawn()) {
							gameOver = true;
							$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
							$('#restartbutton').click(G.restartGame);
							//$('#actors, #playerMissileLayer, #enemiesMissileLayer').fadeTo(1000, 0);
							//$('#background').fadeTo(5000, 0);
						} else {
							G.thePlayer.endExplosion();
							G.thePlayer.move({posy: PLAYGROUND_HEIGHT / 2, posx: PLAYGROUND_WIDTH / 2});
						}
					} else {
						G.thePlayer.move({posy: posy, posx: posx});
					}
				}

				//Update the movement of the enemies
				$.each(G.enemies, function (name) {
					var
						posx,
						enemyposx,
						enemyposy,
						missilename;

					this.update(G.thePlayer);
					posx = this.node.posx();
					if ((posx + 100) < 0) {
						this.node.remove();
						delete G.enemies[name];
						return;
					}
					//Test for collisions
					if (G.collision(this.node.posx(), this.node.posy(), this.node.width(), this.node.height(), G.thePlayer.node.posx(), G.thePlayer.node.posy(), G.thePlayer.node.width(), G.thePlayer.node.height())) {
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
							enemyposx = this.node.posx();
							enemyposy = this.node.posy();
							missilename = ['enemiesMissile_', String(Math.ceil(Math.random() * 1000))].join('');
							$.friGame.groups.enemiesMissileLayer.addSprite(missilename, {animation: missile.enemies, posx: enemyposx, posy: enemyposy + 20});
							G.enemiesMissiles[missilename] = $.friGame.sprites[missilename];
						}
					}
				});

				//Update the movement of the missiles
				$.each(G.playerMissiles, function (name) {
					var
						posx = this.posx(),
						collided,
						missile = this;

					if (posx > PLAYGROUND_WIDTH) {
						this.remove();
						delete G.playerMissiles[name];
						return;
					}
					this.move({posx: posx + MISSILE_SPEED});
					//Test for collisions
					collided = {};
					$.each(G.enemies, function (enemy) {
						if (G.collision(missile.posx(), missile.posy(), missile.width(), missile.height(), this.node.posx(), this.node.posy(), this.node.width(), this.node.height())) {
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
						this.move({posy: this.posy() - 7});
						delete G.playerMissiles[name];
					}
				});
				$.each(G.enemiesMissiles, function (name) {
					var
						posx = this.posx();

					if (posx < 0) {
						this.remove();
						delete G.enemiesMissiles[name];
						return;
					}
					this.move({posx: posx - MISSILE_SPEED});
					//Test for collisions
					if (G.collision(this.posx(), this.posy(), this.width(), this.height(), G.thePlayer.node.posx(), G.thePlayer.node.posy(), G.thePlayer.node.width(), G.thePlayer.node.height())) {
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
					$.friGame.groups.actors.addSprite(name, {animation: G.PrototypeMinion.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT});
					G.enemies[name] = G.Minion($.friGame.sprites[name]);
				} else if (Math.random() < 0.5) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.actors.addSprite(name, {animation: G.PrototypeBrainy.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT});
					G.enemies[name] = G.Brainy($.friGame.sprites[name]);
				} else if (Math.random() > 0.8) {
					bossMode = true;
					bossName = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.groups.actors.addSprite(bossName, {animation: G.PrototypeBossy.idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT});
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
				newPos = ($.friGame.sprites.background1.posx() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;

			$.friGame.sprites.background1.move({posx: newPos});

			newPos = ($.friGame.sprites.background2.posx() - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background2.move({posx: newPos});

			newPos = ($.friGame.sprites.background3.posx() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background3.move({posx: newPos});

			newPos = ($.friGame.sprites.background4.posx() - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background4.move({posx: newPos});

			newPos = ($.friGame.sprites.background5.posx() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background5.move({posx: newPos});

			newPos = ($.friGame.sprites.background6.posx() - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background6.move({posx: newPos});
		}, REFRESH_RATE);
	});
}());

