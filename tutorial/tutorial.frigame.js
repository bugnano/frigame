/*global jQuery, friGame */
/*jslint white: true, browser: true */

(function ($, fg) {
	'use strict';

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
		counter = 0,
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
	G.PPlayer = {
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
			this.node.fadeTo(0, 0.5);
			return false;
		},

		update: function () {
			if ((this.respawnTime > 0) && ((Date.now() - this.respawnTime) > 3000)) {
				this.grace = false;
				this.node.fadeTo(500, 1);
				this.respawnTime = -1;
			}
		}
	};

	G.Player = function () {
		var
			player = Object.create(G.PPlayer);

		player.init.apply(player, arguments);

		return player;
	};

	G.PEnemy = {
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

	G.PMinion = Object.create(G.PEnemy);
	$.extend(G.PMinion, {
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
			minion = Object.create(G.PMinion);

		minion.init.apply(minion, arguments);

		return minion;
	};

	G.PBrainy = Object.create(G.PEnemy);
	$.extend(G.PBrainy, {
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
			brainy = Object.create(G.PBrainy);

		brainy.init.apply(brainy, arguments);

		return brainy;
	};

	G.PBossy = Object.create(G.PBrainy);
	$.extend(G.PBossy, {
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
			bossy = Object.create(G.PBossy);

		bossy.init.apply(bossy, arguments);

		return bossy;
	};



	// --------------------------------------------------------------------------------------------------------------------
	// --                                      the main declaration:                                                     --
	// --------------------------------------------------------------------------------------------------------------------
	$(function () {
		// Animations declaration:
		fg.resourceManager
			// The background:
			.addAnimation('background1', 'background1.png')
			.addAnimation('background2', 'background2.png')
			.addAnimation('background3', 'background3.png')
			.addAnimation('background4', 'background4.png')
			.addAnimation('background5', 'background5.png')
			.addAnimation('background6', 'background6.png')

			.addAnimation('playerAnimation.idle', 'player_spaceship.png')
			.addAnimation('playerAnimation.explode', 'player_explode.png', {numberOfFrame: 4, frameHeight: 26, rate: 60, type: fg.ANIMATION_VERTICAL})
			.addAnimation('playerAnimation.up', 'boosterup.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: fg.ANIMATION_HORIZONTAL})
			.addAnimation('playerAnimation.down', 'boosterdown.png', {numberOfFrame: 6, frameWidth: 14, rate: 60, type: fg.ANIMATION_HORIZONTAL})
			.addAnimation('playerAnimation.boost', 'booster1.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: fg.ANIMATION_VERTICAL})
			.addAnimation('playerAnimation.booster', 'booster2.png', {numberOfFrame: 6, frameHeight: 14, rate: 60, type: fg.ANIMATION_VERTICAL})

			.addAnimation('enemies[0].idle', 'minion_idle.png', {numberOfFrame: 5, frameHeight: 52, rate: 60, type: fg.ANIMATION_VERTICAL})
			.addAnimation('enemies[0].explode', 'minion_explode.png', {numberOfFrame: 11, frameHeight: 52, rate: 30, type: fg.ANIMATION_VERTICAL})

			.addAnimation('enemies[1].idle', 'brainy_idle.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: fg.ANIMATION_VERTICAL})
			.addAnimation('enemies[1].explode', 'brainy_explode.png', {numberOfFrame: 8, frameHeight: 42, rate: 60, type: fg.ANIMATION_VERTICAL})

			.addAnimation('enemies[2].idle', 'bossy_idle.png', {numberOfFrame: 5, frameHeight: 100, rate: 60, type: fg.ANIMATION_VERTICAL})
			.addAnimation('enemies[2].explode', 'bossy_explode.png', {numberOfFrame: 9, frameHeight: 100, rate: 60, type: fg.ANIMATION_VERTICAL})

			.addAnimation('missile.player', 'player_missile.png', {numberOfFrame: 6, frameHeight: 10, rate: 90, type: fg.ANIMATION_VERTICAL})
			.addAnimation('missile.enemies', 'enemy_missile.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: fg.ANIMATION_VERTICAL})
			.addAnimation('missile.playerexplode', 'player_missile_explode.png', {numberOfFrame: 8, frameHeight: 23, rate: 90, type: fg.ANIMATION_VERTICAL})
			.addAnimation('missile.enemiesexplode', 'enemy_missile_explode.png', {numberOfFrame: 6, frameHeight: 15, rate: 90, type: fg.ANIMATION_VERTICAL})
		;

		// Player space shipannimations:
		$.extend(playerAnimation, {
			idle: 'playerAnimation.idle',
			explode: 'playerAnimation.explode',
			up: 'playerAnimation.up',
			down: 'playerAnimation.down',
			boost: 'playerAnimation.boost',
			booster: 'playerAnimation.booster'
		});

		//  List of enemies animations :
		// 1st kind of enemy:
		enemies.push({
			// enemies have two animations
			idle: 'enemies[0].idle',
			explode: 'enemies[0].explode'
		});

		// 2nd kind of enemy:
		enemies.push({
			idle: 'enemies[1].idle',
			explode: 'enemies[1].explode'
		});

		// 3rd kind of enemy:
		enemies.push({
			idle: 'enemies[2].idle',
			explode: 'enemies[2].explode'
		});

		// Weapon missile:
		$.extend(missile, {
			player: 'missile.player',
			enemies: 'missile.enemies',
			playerexplode: 'missile.playerexplode',
			enemiesexplode: 'missile.enemiesexplode'
		});

		// this sets the id of the loading bar:
		fg.loadCallback(function (percent) {
			$('#loadingBar').width(400 * percent);
		});

		//initialize the start button
		$('#startbutton').click(function () {
			fg.startGame(function () {
				$('#welcomeScreen').fadeTo(1000, 0, function () {
					$(this).remove();
				});

				// Initialize the game:

				// Initialize the background
				fg.playground($('#playground'))
					.addGroup('background', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
						.addSprite('background1', {animation: 'background1', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
						.addSprite('background2', {animation: 'background2', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
						.addSprite('background3', {animation: 'background3', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
						.addSprite('background4', {animation: 'background4', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
						.addSprite('background5', {animation: 'background5', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
						.addSprite('background6', {animation: 'background6', width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, left: PLAYGROUND_WIDTH})
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

				fg.sprites.player.userData = G.Player(fg.sprites.player);

				//this is the HUD for the player life and shield
				$(['<div id="overlay" style="position: absolute; left: 0px; top: 0px; width:', String(PLAYGROUND_WIDTH), 'px; height=', String(PLAYGROUND_HEIGHT), 'px"></div>'].join('')).appendTo($('#playground'));
				$('#overlay').append('<div id="shieldHUD"style="color: white; width: 100px; position: absolute; font-family: verdana, sans-serif;"></div><div id="lifeHUD"style="color: white; width: 100px; position: absolute; right: 0px; font-family: verdana, sans-serif;"></div>');

				// this is the function that control most of the game logic
				fg.playground().registerCallback(function () {
					var
						nextpos,
						posy,
						posx
					;

					if (!gameOver) {
						$('#shieldHUD').html(['shield: ', String(fg.sprites.player.userData.shield)].join(''));
						$('#lifeHUD').html(['life: ', String(fg.sprites.player.userData.replay)].join(''));

						//Update the movement of the ship:
						if (!playerHit) {
							fg.sprites.player.userData.update();
							if (fg.keyTracker.A) { //this is left! (a)
								nextpos = fg.sprites.player.left - 5;
								if (nextpos > 0) {
									fg.sprites.player.move({left: nextpos});
								}
							}
							if (fg.keyTracker.D) { //this is right! (d)
								nextpos = fg.sprites.player.left + 5;
								if (nextpos < PLAYGROUND_WIDTH - 100) {
									fg.sprites.player.move({left: nextpos});
								}
							}
							if (fg.keyTracker.W) { //this is up! (w)
								nextpos = fg.sprites.player.top - 3;
								if (nextpos > 0) {
									fg.sprites.player.move({top: nextpos});
								}
							}
							if (fg.keyTracker.S) { //this is down! (s)
								nextpos = fg.sprites.player.top + 3;
								if (nextpos < PLAYGROUND_HEIGHT - 30) {
									fg.sprites.player.move({top: nextpos});
								}
							}
						} else {
							posy = fg.sprites.player.top + 5;
							posx = fg.sprites.player.left - 5;
							if (posy > PLAYGROUND_HEIGHT) {
								//Does the player did get out of the screen?
								if (fg.sprites.player.userData.respawn()) {
									gameOver = true;
									$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
									$('#restartbutton').click(restartgame);
									$.each(['actors', 'playerMissileLayer', 'enemiesMissileLayer'], function(index, value) {
										fg.sprites[value].fadeTo(1000, 0);
									});
									fg.sprites.background.fadeTo(5000, 0);
								} else {
									fg.sprites.explosion.remove();
									fg.sprites.player.children(function () {
										this.show();
									});
									fg.sprites.player.move({top: (PLAYGROUND_HEIGHT / 2), left: (PLAYGROUND_WIDTH / 2)});
									playerHit = false;
								}
							} else {
								fg.sprites.player.move({top: posy, left: posx});
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

							this.userData.update(fg.sprites.player);
							posx = this.left;
							if ((posx + 100) < 0) {
								if (G.enemy[enemyname]) {
									delete G.enemy[enemyname];
								}
								this.remove();
								return;
							}

							//Test for collisions
							if (this.collideRect(fg.sprites.player)) {
								if (G.PBossy.isPrototypeOf(this.userData)) {
									this.setAnimation({animation: enemies[2].explode, callback: function (node) {
										node.remove();
									}});
								} else if (G.PBrainy.isPrototypeOf(this.userData)) {
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
								if (fg.sprites.player.userData.damage()) {
									explodePlayer(fg.sprites.player);
								}
							}

							//Make the enemy fire
							if (G.PBrainy.isPrototypeOf(this.userData)) {
								if (Math.random() < 0.05) {
									enemyposx = this.left;
									enemyposy = this.top;
									counter = (counter + 1) % 100000;
									name = ['enemiesMissile_', String(counter)].join('');
									fg.sprites.enemiesMissileLayer.addSprite(name, {animation: missile.enemies, left: enemyposx, top: enemyposy + 20, width: 30, height: 15});
									G.enemiesMissiles[name] = fg.sprites[name];
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
										if (G.PBossy.isPrototypeOf(this.userData)) {
											this.setAnimation({animation: enemies[2].explode, callback: function (node) {
												node.remove();
											}});
										} else if (G.PBrainy.isPrototypeOf(this.userData)) {
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
							if (this.collideRect(fg.sprites.player)) {
								//The player has been hit!
								if (fg.sprites.player.userData.damage()) {
									explodePlayer(fg.sprites.player);
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
				fg.playground().registerCallback(function () {
					var
						name
					;

					if (!bossMode && !gameOver) {
						if (Math.random() < 0.4) {
							counter = (counter + 1) % 100000;
							name = ['enemy1_', String(counter)].join('');
							fg.sprites.actors.addSprite(name, {animation: enemies[0].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 150, height: 52});
							G.enemy[name] = fg.sprites[name];
							fg.sprites[name].userData = G.Minion(fg.sprites[name]);
						} else if (Math.random() < 0.5) {
							counter = (counter + 1) % 100000;
							name = ['enemy1_', String(counter)].join('');
							fg.sprites.actors.addSprite(name, {animation: enemies[1].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 42});
							G.enemy[name] = fg.sprites[name];
							fg.sprites[name].userData = G.Brainy(fg.sprites[name]);
						} else if (Math.random() > 0.8) {
							counter = (counter + 1) % 100000;
							bossMode = true;
							bossName = ['enemy1_', String(counter)].join('');
							fg.sprites.actors.addSprite(bossName, {animation: enemies[2].idle, left: PLAYGROUND_WIDTH, top: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 100});
							G.enemy[bossName] = fg.sprites[bossName];
							fg.sprites[bossName].userData = G.Bossy(fg.sprites[bossName]);
						}
					} else {
						if (!fg.sprites[bossName]) {
							bossMode = false;
						}
					}
				}, 1000); //once per seconds is enough for this

				//This is for the background animation
				fg.playground().registerCallback(function () {
					//Offset all the pane:
					var
						newPos
					;

					newPos = (fg.sprites.background1.left - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background1.move({left: newPos});

					newPos = (fg.sprites.background2.left - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background2.move({left: newPos});

					newPos = (fg.sprites.background3.left - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background3.move({left: newPos});

					newPos = (fg.sprites.background4.left - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background4.move({left: newPos});

					newPos = (fg.sprites.background5.left - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background5.move({left: newPos});

					newPos = (fg.sprites.background6.left - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
					fg.sprites.background6.move({left: newPos});
				}, REFRESH_RATE);

				//this is where the keybinding occurs
				$(document).keydown(function (e) {
					var
						playerposx,
						playerposy,
						name,
						keycode
					;

					if (!gameOver && !playerHit) {
						keycode = fg.keyCodes[e.keyCode];
						switch (keycode) {
							case 'K': //this is shoot (k)
								//shoot missile here
								playerposx = fg.sprites.player.left;
								playerposy = fg.sprites.player.top;
								counter = (counter + 1) % 100000;
								name = ['playerMissle_', String(counter)].join('');
								fg.sprites.playerMissileLayer.addSprite(name, {animation: missile.player, left: playerposx + 90, top: playerposy + 14, width: 36, height: 10});
								G.playerMissiles[name] = fg.sprites[name];
								break;
							case 'A': //this is left! (a)
								fg.sprites.playerBooster.setAnimation({animation: null});
								break;
							case 'W': //this is up! (w)
								fg.sprites.playerBoostUp.setAnimation({animation: playerAnimation.up});
								break;
							case 'D': //this is right (d)
								fg.sprites.playerBooster.setAnimation({animation: playerAnimation.booster});
								break;
							case 'S': //this is down! (s)
								fg.sprites.playerBoostDown.setAnimation({animation: playerAnimation.down});
								break;
						}
					}
				});

				//this is where the keybinding occurs
				$(document).keyup(function (e) {
					var
						keycode
					;

					if (!gameOver && !playerHit) {
						keycode = fg.keyCodes[e.keyCode];
						switch (keycode) {
							case 'A': //this is left! (a)
								fg.sprites.playerBooster.setAnimation({animation: playerAnimation.boost});
								break;
							case 'W': //this is up! (w)
								fg.sprites.playerBoostUp.setAnimation({animation: null});
								break;
							case 'D': //this is right (d)
								fg.sprites.playerBooster.setAnimation({animation: playerAnimation.boost});
								break;
							case 'S': //this is down! (s)
								fg.sprites.playerBoostDown.setAnimation({animation: null});
								break;
						}
					}
				});
			});
		});
	});
}(jQuery, friGame));

