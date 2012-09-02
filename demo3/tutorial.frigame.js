/*global jQuery */
/*jslint sloppy: true, white: true, browser: true */

(function ($) {
	var
		// Global constants:
		PLAYGROUND_WIDTH = 700,
		PLAYGROUND_HEIGHT = 250,
		REFRESH_RATE = 15,

		GRACE = 2000,
		MISSILE_SPEED = 10, //px per frame

		/*Constants for the gameplay*/
		smallStarSpeed = 1, //pixels per frame
		mediumStarSpeed = 3, //pixels per frame
		bigStarSpeed = 4, //pixels per frame

		// Gloabl animation holder
		playerAnimation = {},
		missile = {},
		enemies = [], // There are three kind of enemies in the game

		// Game state
		bossMode = false,
		bossName = null,
		playerHit = false,
		timeOfRespawn = 0,
		gameOver = false,
		G = {
			enemiesMissiles: {},
			enemy: {},
			playerMissiles: {}
		}
	;

	// Some hellper functions :

	// Function to restart the game:
	function restartgame() {
		location.reload();
	}

	function explodePlayer(playerNode) {
		playerNode.children(function () {
			this.hide();
		});
		playerNode.addSprite('explosion', {animation: playerAnimation.explode, width: 100, height: 26});
		playerHit = true;
	}


	// Game objects:
	G.PrototypePlayer = {
		grace: false,
		replay: 3,
		shield: 3,
		respawnTime: -1,

		init: function (node) {
			this.node = node;
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

			this.respawnTime = Date.now();
			//$(this.node).fadeTo(0, 0.5);	// TO DO -- Fading has not been implemented yet
			return false;
		},

		update: function () {
			if ((this.respawnTime > 0) && ((Date.now() - this.respawnTime) > 3000)) {
				this.grace = false;
				//$(this.node).fadeTo(500, 1);	// TO DO -- Fading has not been implemented yet
				this.respawnTime = -1;
			}
		}
	};

	G.Player = function () {
		var
			player = Object.create(G.PrototypePlayer);

		player.init.apply(player, arguments);

		return player;
	};

	G.PrototypeEnemy = {
		shield: 2,
		speedx: -5,
		speedy: 0,

		init: function (node) {
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
				newpos = this.node.left + this.speedx
			;

			this.node.move({left: newpos});
		},

		updateY: function (playerNode) {
			var
				newpos = this.node.top + this.speedy
			;

			this.node.move({top: newpos});
		}
	};

	G.PrototypeMinion = Object.create(G.PrototypeEnemy);
	$.extend(G.PrototypeMinion, {
		updateY: function (playerNode) {
			var
				pos = this.node.top
			;

			if (pos > (PLAYGROUND_HEIGHT - 100)) {
				this.node.move({top: (pos - 2)});
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
		shield: 5,
		speedy: 1,
		alignmentOffset: 5,

		updateY: function (playerNode) {
			var
				newpos
			;

			if ((this.node.top + this.alignmentOffset) > playerNode.top) {
				newpos = this.node.top - this.speedy;
				this.node.move({top: newpos});
			} else if ((this.node.top + this.alignmentOffset) < playerNode.top) {
				newpos = this.node.top + this.speedy;
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
		shield: 20,
		speedx: -1,
		alignmentOffset: 35,

		updateX: function () {
			var
				pos = this.node.left
			;

			if (pos > (PLAYGROUND_WIDTH - 200)) {
				this.node.move({left: (pos + this.speedx)});
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
	// --                                      the main declaration:                                                     --
	// --------------------------------------------------------------------------------------------------------------------
	$(function () {
		var
			// Aniomations declaration:

			// The background:
			background1 = $.friGame.Animation('background1.png'),
			background2 = $.friGame.Animation('background2.png'),
			background3 = $.friGame.Animation('background3.png'),
			background4 = $.friGame.Animation('background4.png'),
			background5 = $.friGame.Animation('background5.png'),
			background6 = $.friGame.Animation('background6.png')
		;


		// Player space shipannimations:
		$.extend(playerAnimation, {
			idle: $.friGame.Animation('player_spaceship.png'),
			explode: $.friGame.Animation('player_explode.png', {numberOfFrame: 4, frameHeight: 26, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
			up: $.friGame.Animation('boosterup.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL}),
			down: $.friGame.Animation('boosterdown.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: $.friGame.ANIMATION_HORIZONTAL}),
			boost: $.friGame.Animation('booster1.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
			booster: $.friGame.Animation('booster2.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: $.friGame.ANIMATION_VERTICAL})
		});

		//  List of enemies animations :
		// 1st kind of enemy:
		enemies.push({
			// enemies have two animations
			idle: $.friGame.Animation('minion_idle.png', {numberOfFrame: 5, frameHeight: 52, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
			explode: $.friGame.Animation('minion_explode.png', {numberOfFrame: 11, frameHeight: 52, rate: 30, type: $.friGame.ANIMATION_VERTICAL})
		});

		// 2nd kind of enemy:
		enemies.push({
			idle: $.friGame.Animation('brainy_idle.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
			explode: $.friGame.Animation('brainy_explode.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: $.friGame.ANIMATION_VERTICAL})
		});

		// 3rd kind of enemy:
		enemies.push({
			idle: $.friGame.Animation('bossy_idle.png', {numberOfFrame: 5, frameHeight: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL}),
			explode: $.friGame.Animation('bossy_explode.png', {numberOfFrame: 9, frameHeight: 100, rate: 60, type: $.friGame.ANIMATION_VERTICAL})
		});

		// Weapon missile:
		$.extend(missile, {
			player: $.friGame.Animation('player_missile.png', {numberOfFrame: 6, frameHeight: 10, rate: 90, type: $.friGame.ANIMATION_VERTICAL}),
			enemies: $.friGame.Animation('enemy_missile.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL}),
			playerexplode: $.friGame.Animation('player_missile_explode.png', {numberOfFrame: 8, frameHeight: 23, rate: 90, type: $.friGame.ANIMATION_VERTICAL}),
			enemiesexplode: $.friGame.Animation('enemy_missile_explode.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: $.friGame.ANIMATION_VERTICAL})
		});

		// Initialize the game:

		// Initialize the background
		$.friGame.playground($('#playground'))
			.addGroup('background', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background1', {animation: background1, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background2', {animation: background2, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
				.addSprite('background3', {animation: background3, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background4', {animation: background4, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
				.addSprite('background5', {animation: background5, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background6', {animation: background6, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
			.end()
			.addGroup('actors', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addGroup('player', {left: PLAYGROUND_WIDTH / 2, top: PLAYGROUND_HEIGHT / 2, width: 100, height: 26})
					.addSprite('playerBoostUp', {left: 37, top: 15, width: 14, height: 18})
					.addSprite('playerBody', {animation: playerAnimation.idle, left: 0, top: 0, width: 100, height: 26})
					.addSprite('playerBooster', {animation: playerAnimation.boost, left: -32, top: 5, width: 36, height: 14})
					.addSprite('playerBoostDown', {left: 37, top: -7, width: 14, height: 18})
				.end()
			.end()
			.addGroup('playerMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end()
			.addGroup('enemiesMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end()
		;

		$.friGame.sprites.player.userData = G.Player($.friGame.sprites.player);

		//this is the HUD for the player life and shield
		$(['<div id="overlay" style="position: absolute; left: 0px; top: 0px; width:', String(PLAYGROUND_WIDTH), 'px; height=', String(PLAYGROUND_HEIGHT), 'px"></div>'].join('')).appendTo($('#playground'));
		$('#overlay').append('<div id="shieldHUD"style="color: white; width: 100px; position: absolute; font-family: verdana, sans-serif;"></div><div id="lifeHUD"style="color: white; width: 100px; position: absolute; right: 0px; font-family: verdana, sans-serif;"></div>');

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

		// this is the function that control most of the game logic
		$.friGame.registerCallback(function () {
			var
				nextpos,
				posy,
				posx
			;

			if (!gameOver) {
				$('#shieldHUD').html(['shield: ', String($.friGame.sprites.player.userData.shield)].join(''));
				$('#lifeHUD').html(['life: ', String($.friGame.sprites.player.userData.replay)].join(''));

				//Update the movement of the ship:
				if (!playerHit) {
					$.friGame.sprites.player.userData.update();
					if ($.friGame.keyTracker[65]) { //this is left! (a)
						nextpos = $.friGame.sprites.player.left - 5;
						if (nextpos > 0) {
							$.friGame.sprites.player.move({left: nextpos});
						}
					}
					if ($.friGame.keyTracker[68]) { //this is right! (d)
						nextpos = $.friGame.sprites.player.left + 5;
						if (nextpos < PLAYGROUND_WIDTH - 100) {
							$.friGame.sprites.player.move({left: nextpos});
						}
					}
					if ($.friGame.keyTracker[87]) { //this is up! (w)
						nextpos = $.friGame.sprites.player.top - 3;
						if (nextpos > 0) {
							$.friGame.sprites.player.move({top: nextpos});
						}
					}
					if ($.friGame.keyTracker[83]) { //this is down! (s)
						nextpos = $.friGame.sprites.player.top + 3;
						if (nextpos < PLAYGROUND_HEIGHT - 30) {
							$.friGame.sprites.player.move({top: nextpos});
						}
					}
				} else {
					posy = $.friGame.sprites.player.top + 5;
					posx = $.friGame.sprites.player.left - 5;
					if (posy > PLAYGROUND_HEIGHT) {
						//Does the player did get out of the screen?
						if ($.friGame.sprites.player.userData.respawn()) {
							gameOver = true;
							$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
							$('#restartbutton').click(restartgame);
							//$('#actors,#playerMissileLayer,#enemiesMissileLayer').fadeTo(1000, 0);	// TO DO -- Fading has not been implemented yet
							//$('#background').fadeTo(5000, 0);	// TO DO -- Fading has not been implemented yet
						} else {
							$.friGame.sprites.explosion.remove();
							$.friGame.sprites.player.children(function () {
								this.show();
							});
							$.friGame.sprites.player.move({top: (PLAYGROUND_HEIGHT / 2), left: (PLAYGROUND_WIDTH / 2)});
							playerHit = false;
						}
					} else {
						$.friGame.sprites.player.move({top: posy, left: posx});
					}
				}

				//Update the movement of the enemies
				$.each(G.enemy, function (enemyname) {
					var
						posx,
						enemyposx,
						enemyposy,
						name
					;

					this.userData.update($.friGame.sprites.player);
					posx = this.left;
					if ((posx + 100) < 0) {
						if (G.enemy[enemyname]) {
							delete G.enemy[enemyname];
						}
						this.remove();
						return;
					}

					//Test for collisions
					if (this.collideRect($.friGame.sprites.playerBody)) {
						if (G.PrototypeBossy.isPrototypeOf(this.userData)) {
							this.setAnimation({animation: enemies[2].explode, callback: function (node) {
								node.remove();
							}});
						} else if (G.PrototypeBrainy.isPrototypeOf(this.userData)) {
							this.setAnimation({animation: enemies[1].explode, callback: function (node) {
								node.remove();
							}});
						} else {
							this.setAnimation({animation: enemies[0].explode, callback: function (node) {
								node.remove();
							}});
						}
						delete G.enemy[enemyname];

						//The player has been hit!
						if ($.friGame.sprites.player.userData.damage()) {
							explodePlayer($.friGame.sprites.player);
						}
					}

					//Make the enemy fire
					if (G.PrototypeBrainy.isPrototypeOf(this.enemy)) {
						if (Math.random() < 0.05) {
							enemyposx = this.left;
							enemyposy = this.top;
							name = ['enemiesMissile_', String(Math.ceil(Math.random() * 1000))].join('');
							$.friGame.sprites.enemiesMissileLayer.addSprite(name, {animation: missile.enemies, left: enemyposx, top: enemyposy + 20, width: 30, height: 15});
							G.enemiesMissiles[name] = $.friGame.sprites[name];
						}
					}
				});

				//Update the movement of the missiles
				$.each(G.playerMissiles, function (missilename, missilenode) {
					var
						posx = this.left
					;

					if (posx > PLAYGROUND_WIDTH) {
						if (G.playerMissiles[missilename]) {
							delete G.playerMissiles[missilename];
						}
						this.remove();
						return;
					}

					this.move({left: (posx + MISSILE_SPEED)});

					//Test for collisions
					$.each(G.enemy, function (enemyname) {
						//An enemy has been hit!
						if (this.collideRect(missilenode)) {
							if (this.userData.damage()) {
								if (G.PrototypeBossy.isPrototypeOf(this.userData)) {
									this.setAnimation({animation: enemies[2].explode, callback: function (node) {
										node.remove();
									}});
								} else if (G.PrototypeBrainy.isPrototypeOf(this.userData)) {
									this.setAnimation({animation: enemies[1].explode, callback: function (node) {
										node.remove();
									}});
								} else {
									this.setAnimation({animation: enemies[0].explode, callback: function (node) {
										node.remove();
									}});
								}
								delete G.enemy[enemyname];
							}

							missilenode.setAnimation({animation: missile.playerexplode, callback: function (node) {
								node.remove();
							}});
							missilenode.move({top: (missilenode.top - 7)});
							delete G.playerMissiles[missilename];

							// return false in order to stop iteration
							return false;
						}
					});
				});

				$.each(G.enemiesMissiles, function (missilename, missilenode) {
					var
						posx = this.left
					;

					if (posx < 0) {
						if (G.enemiesMissiles[missilename]) {
							delete G.enemiesMissiles[missilename];
						}
						this.remove();
						return;
					}

					this.move({left: (posx - MISSILE_SPEED)});

					//Test for collisions
					if (this.collideRect($.friGame.sprites.playerBody)) {
						//The player has been hit!
						if ($.friGame.sprites.player.userData.damage()) {
							explodePlayer($.friGame.sprites.player);
						}
						this.setAnimation({animation: missile.enemiesexplode, callback: function (node) {
							node.remove();
						}});
						delete G.enemiesMissiles[missilename];
					}
				});
			}
		}, REFRESH_RATE);

		//This function manage the creation of the enemies
		$.friGame.registerCallback(function () {
			var
				name
			;

			if (!bossMode && !gameOver) {
				if (Math.random() < 0.4) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.sprites.actors.addSprite(name, {animation: enemies[0].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 150, height: 52});
					G.enemy[name] = $.friGame.sprites[name];
					$.friGame.sprites[name].userData = G.Minion($.friGame.sprites[name]);
				} else if (Math.random() < 0.5) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.sprites.actors.addSprite(name, {animation: enemies[1].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 42});
					G.enemy[name] = $.friGame.sprites[name];
					$.friGame.sprites[name].userData = G.Brainy($.friGame.sprites[name]);
				} else if (Math.random() > 0.8) {
					bossMode = true;
					bossName = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$.friGame.sprites.actors.addSprite(bossName, {animation: enemies[2].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 100});
					G.enemy[bossName] = $.friGame.sprites[bossName];
					$.friGame.sprites[bossName].userData = G.Bossy($.friGame.sprites[bossName]);
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
				newPos
			;

			newPos = ($.friGame.sprites.background1.left - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background1.move({left: newPos});

			newPos = ($.friGame.sprites.background2.left - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background2.move({left: newPos});

			newPos = ($.friGame.sprites.background3.left - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background3.move({left: newPos});

			newPos = ($.friGame.sprites.background4.left - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background4.move({left: newPos});

			newPos = ($.friGame.sprites.background5.left - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background5.move({left: newPos});

			newPos = ($.friGame.sprites.background6.left - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$.friGame.sprites.background6.move({left: newPos});
		}, REFRESH_RATE);

		//this is where the keybinding occurs
		$(document).keydown(function (e) {
			var
				playerposx,
				playerposy,
				name
			;

			if (!gameOver && !playerHit) {
				switch (e.which) {
					case 75: //this is shoot (k)
						//shoot missile here
						playerposx = $.friGame.sprites.player.left;
						playerposy = $.friGame.sprites.player.top;
						name = ['playerMissle_', String(Math.ceil(Math.random() * 1000))].join('');
						$.friGame.sprites.playerMissileLayer.addSprite(name, {animation: missile.player, left: playerposx + 90, top: playerposy + 14, width: 36, height: 10});
						G.playerMissiles[name] = $.friGame.sprites[name];
						break;
					case 65: //this is left! (a)
						$.friGame.sprites.playerBooster.setAnimation({animation: null});
						break;
					case 87: //this is up! (w)
						$.friGame.sprites.playerBoostUp.setAnimation({animation: playerAnimation.up});
						break;
					case 68: //this is right (d)
						$.friGame.sprites.playerBooster.setAnimation({animation: playerAnimation.booster});
						break;
					case 83: //this is down! (s)
						$.friGame.sprites.playerBoostDown.setAnimation({animation: playerAnimation.down});
						break;
				}
			}
		});

		//this is where the keybinding occurs
		$(document).keyup(function (e) {
			if (!gameOver && !playerHit) {
				switch (e.which) {
					case 65: //this is left! (a)
						$.friGame.sprites.playerBooster.setAnimation({animation: playerAnimation.boost});
						break;
					case 87: //this is up! (w)
						$.friGame.sprites.playerBoostUp.setAnimation({animation: null});
						break;
					case 68: //this is right (d)
						$.friGame.sprites.playerBooster.setAnimation({animation: playerAnimation.boost});
						break;
					case 83: //this is down! (s)
						$.friGame.sprites.playerBoostDown.setAnimation({animation: null});
						break;
				}
			}
		});
	});
}(jQuery));

