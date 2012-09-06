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
		G = {}
	;

	// Some hellper functions :

	// Function to restart the game:
	function restartgame() {
		location.reload();
	}

	function explodePlayer(playerNode) {
		playerNode.children().hide();
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

			this.respawnTime = (new Date()).getTime();
			$(this.node).fadeTo(0, 0.5);
			return false;
		},

		update: function () {
			if ((this.respawnTime > 0) && (((new Date()).getTime() - this.respawnTime) > 3000)) {
				this.grace = false;
				$(this.node).fadeTo(500, 1);
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
			this.node = $(node);
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
				newpos = parseInt(this.node.css('left'), 10) + this.speedx
			;

			this.node.css('left', ['', String(newpos), 'px'].join(''));
		},

		updateY: function (playerNode) {
			var
				newpos = parseInt(this.node.css('top'), 10) + this.speedy
			;

			this.node.css('top', ['', String(newpos), 'px'].join(''));
		}
	};

	G.PrototypeMinion = Object.create(G.PrototypeEnemy);
	$.extend(G.PrototypeMinion, {
		updateY: function (playerNode) {
			var
				pos = parseInt(this.node.css('top'), 10)
			;

			if (pos > (PLAYGROUND_HEIGHT - 100)) {
				this.node.css('top', ['', String(pos - 2), 'px'].join(''));
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

			if ((this.node[0].gameQuery.posy + this.alignmentOffset) > $(playerNode)[0].gameQuery.posy) {
				newpos = parseInt(this.node.css('top'), 10) - this.speedy;
				this.node.css('top', ['', String(newpos), 'px'].join(''));
			} else if ((this.node[0].gameQuery.posy + this.alignmentOffset) < $(playerNode)[0].gameQuery.posy) {
				newpos = parseInt(this.node.css('top'), 10) + this.speedy;
				this.node.css('top', ['', String(newpos), 'px'].join(''));
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
				pos = parseInt(this.node.css('left'), 10)
			;

			if (pos > (PLAYGROUND_WIDTH - 200)) {
				this.node.css('left', ['', String(pos + this.speedx), 'px'].join(''));
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
			background1 = new $.gameQuery.Animation({imageURL: 'background1.png'}),
			background2 = new $.gameQuery.Animation({imageURL: 'background2.png'}),
			background3 = new $.gameQuery.Animation({imageURL: 'background3.png'}),
			background4 = new $.gameQuery.Animation({imageURL: 'background4.png'}),
			background5 = new $.gameQuery.Animation({imageURL: 'background5.png'}),
			background6 = new $.gameQuery.Animation({imageURL: 'background6.png'})
		;


		// Player space shipannimations:
		$.extend(playerAnimation, {
			idle: new $.gameQuery.Animation({imageURL: 'player_spaceship.png'}),
			explode: new $.gameQuery.Animation({imageURL: 'player_explode.png', numberOfFrame: 4, delta: 26, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
			up: new $.gameQuery.Animation({imageURL: 'boosterup.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_HORIZONTAL}),
			down: new $.gameQuery.Animation({imageURL: 'boosterdown.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_HORIZONTAL}),
			boost: new $.gameQuery.Animation({imageURL: 'booster1.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
			booster: new $.gameQuery.Animation({imageURL: 'booster2.png', numberOfFrame: 6, delta: 14, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL})
		});

		//  List of enemies animations :
		// 1st kind of enemy:
		enemies.push({
			// enemies have two animations
			idle: new $.gameQuery.Animation({imageURL: 'minion_idle.png', numberOfFrame: 5, delta: 52, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
			explode: new $.gameQuery.Animation({imageURL: 'minion_explode.png', numberOfFrame: 11, delta: 52, rate: 30, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK})
		});

		// 2nd kind of enemy:
		enemies.push({
			idle: new $.gameQuery.Animation({imageURL: 'brainy_idle.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
			explode: new $.gameQuery.Animation({imageURL: 'brainy_explode.png', numberOfFrame: 8, delta: 42, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK})
		});

		// 3rd kind of enemy:
		enemies.push({
			idle: new $.gameQuery.Animation({imageURL: 'bossy_idle.png', numberOfFrame: 5, delta: 100, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL}),
			explode: new $.gameQuery.Animation({imageURL: 'bossy_explode.png', numberOfFrame: 9, delta: 100, rate: 60, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK})
		});

		// Weapon missile:
		$.extend(missile, {
			player: new $.gameQuery.Animation({imageURL: 'player_missile.png', numberOfFrame: 6, delta: 10, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL}),
			enemies: new $.gameQuery.Animation({imageURL: 'enemy_missile.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL}),
			playerexplode: new $.gameQuery.Animation({imageURL: 'player_missile_explode.png', numberOfFrame: 8, delta: 23, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK}),
			enemiesexplode: new $.gameQuery.Animation({imageURL: 'enemy_missile_explode.png', numberOfFrame: 6, delta: 15, rate: 90, type: $.gameQuery.ANIMATION_VERTICAL + $.gameQuery.ANIMATION_CALLBACK})
		});

		// Initialize the game:
		$('#playground').playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, keyTracker: true});

		// Initialize the background
		$.playground()
			.addGroup('background', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background1', {animation: background1, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background2', {animation: background2, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
				.addSprite('background3', {animation: background3, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background4', {animation: background4, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
				.addSprite('background5', {animation: background5, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addSprite('background6', {animation: background6, width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT, posx: PLAYGROUND_WIDTH})
			.end()
			.addGroup('actors', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
				.addGroup('player', {posx: PLAYGROUND_WIDTH / 2, posy: PLAYGROUND_HEIGHT / 2, width: 100, height: 26})
					.addSprite('playerBoostUp', {posx: 37, posy: 15, width: 14, height: 18})
					.addSprite('playerBody', {animation: playerAnimation.idle, posx: 0, posy: 0, width: 100, height: 26})
					.addSprite('playerBooster', {animation: playerAnimation.boost, posx: -32, posy: 5, width: 36, height: 14})
					.addSprite('playerBoostDown', {posx: 37, posy: -7, width: 14, height: 18})
				.end()
			.end()
			.addGroup('playerMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end()
			.addGroup('enemiesMissileLayer', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT}).end()
			.addGroup('overlay', {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT})
		;

		$('#player')[0].player = G.Player($('#player'));

		//this is the HUD for the player life and shield
		$('#overlay').append('<div id="shieldHUD"style="color: white; width: 100px; position: absolute; font-family: verdana, sans-serif;"></div><div id="lifeHUD"style="color: white; width: 100px; position: absolute; right: 0px; font-family: verdana, sans-serif;"></div>');

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

		// this is the function that control most of the game logic
		$.playground().registerCallback(function () {
			var
				nextpos,
				posy,
				posx
			;

			if (!gameOver) {
				$('#shieldHUD').html(['shield: ', String($('#player')[0].player.shield)].join(''));
				$('#lifeHUD').html(['life: ', String($('#player')[0].player.replay)].join(''));

				//Update the movement of the ship:
				if (!playerHit) {
					$('#player')[0].player.update();
					if ($.gameQuery.keyTracker[65]) { //this is left! (a)
						nextpos = parseInt($('#player').css('left'), 10) - 5;
						if (nextpos > 0) {
							$('#player').css('left', ['', String(nextpos), 'px'].join(''));
						}
					}
					if ($.gameQuery.keyTracker[68]) { //this is right! (d)
						nextpos = parseInt($('#player').css('left'), 10) + 5;
						if (nextpos < PLAYGROUND_WIDTH - 100) {
							$('#player').css('left', ['', String(nextpos), 'px'].join(''));
						}
					}
					if ($.gameQuery.keyTracker[87]) { //this is up! (w)
						nextpos = parseInt($('#player').css('top'), 10) - 3;
						if (nextpos > 0) {
							$('#player').css('top', ['', String(nextpos), 'px'].join(''));
						}
					}
					if ($.gameQuery.keyTracker[83]) { //this is down! (s)
						nextpos = parseInt($('#player').css('top'), 10) + 3;
						if (nextpos < PLAYGROUND_HEIGHT - 30) {
							$('#player').css('top', ['', String(nextpos), 'px'].join(''));
						}
					}
				} else {
					posy = parseInt($('#player').css('top'), 10) + 5;
					posx = parseInt($('#player').css('left'), 10) - 5;
					if (posy > PLAYGROUND_HEIGHT) {
						//Does the player did get out of the screen?
						if ($('#player')[0].player.respawn()) {
							gameOver = true;
							$('#playground').append('<div style="position: absolute; top: 50px; width: 700px; color: white; font-family: verdana, sans-serif;"><center><h1>Game Over</h1><br><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
							$('#restartbutton').click(restartgame);
							$('#actors,#playerMissileLayer,#enemiesMissileLayer').fadeTo(1000, 0);
							$('#background').fadeTo(5000, 0);
						} else {
							$('#explosion').remove();
							$('#player').children().show();
							$('#player').css('top', PLAYGROUND_HEIGHT / 2);
							$('#player').css('left', PLAYGROUND_WIDTH / 2);
							playerHit = false;
						}
					} else {
						$('#player').css('top', ['', String(posy), 'px'].join(''));
						$('#player').css('left', ['', String(posx), 'px'].join(''));
					}
				}

				//Update the movement of the enemies
				$('.enemy').each(function () {
					var
						posx,
						collided,
						enemyposx,
						enemyposy,
						name
					;

					this.enemy.update($('#player'));
					posx = parseInt($(this).css('left'), 10);
					if ((posx + 100) < 0) {
						$(this).remove();
						return;
					}

					//Test for collisions
					collided = $(this).collision('#playerBody,.group');
					if (collided.length > 0) {
						if (G.PrototypeBossy.isPrototypeOf(this.enemy)) {
							$(this).setAnimation(enemies[2].explode, function (node) {
								$(node).remove();
							});
							$(this).css('width', 150);
						} else if (G.PrototypeBrainy.isPrototypeOf(this.enemy)) {
							$(this).setAnimation(enemies[1].explode, function (node) {
								$(node).remove();
							});
							$(this).css('width', 150);
						} else {
							$(this).setAnimation(enemies[0].explode, function (node) {
								$(node).remove();
							});
							$(this).css('width', 200);
						}
						$(this).removeClass('enemy');

						//The player has been hit!
						if ($('#player')[0].player.damage()) {
							explodePlayer($('#player'));
						}
					}

					//Make the enemy fire
					if (G.PrototypeBrainy.isPrototypeOf(this.enemy)) {
						if (Math.random() < 0.05) {
							enemyposx = parseInt($(this).css('left'), 10);
							enemyposy = parseInt($(this).css('top'), 10);
							name = ['enemiesMissile_', String(Math.ceil(Math.random() * 1000))].join('');
							$('#enemiesMissileLayer').addSprite(name, {animation: missile.enemies, posx: enemyposx, posy: enemyposy + 20, width: 30, height: 15});
							$(['#', name].join('')).addClass('enemiesMissiles');
						}
					}
				});

				//Update the movement of the missiles
				$('.playerMissiles').each(function () {
					var
						posx = parseInt($(this).css('left'), 10),
						collided
					;

					if (posx > PLAYGROUND_WIDTH) {
						$(this).remove();
						return;
					}

					$(this).css('left', ['', String(posx + MISSILE_SPEED), 'px'].join(''));

					//Test for collisions
					collided = $(this).collision('.group,.enemy');
					if (collided.length > 0) {
						//An enemy has been hit!
						collided.each(function () {
							if ($(this)[0].enemy.damage()) {
								if (G.PrototypeBossy.isPrototypeOf(this.enemy)) {
									$(this).setAnimation(enemies[2].explode, function (node) {
										$(node).remove();
									});
									$(this).css('width', 150);
								} else if (G.PrototypeBrainy.isPrototypeOf(this.enemy)) {
									$(this).setAnimation(enemies[1].explode, function (node) {
										$(node).remove();
									});
									$(this).css('width', 150);
								} else {
									$(this).setAnimation(enemies[0].explode, function (node) {
										$(node).remove();
									});
									$(this).css('width', 200);
								}
								$(this).removeClass('enemy');
							}
						});
						$(this).setAnimation(missile.playerexplode, function (node) {
							$(node).remove();
						});
						$(this).css('width', 38);
						$(this).css('height', 23);
						$(this).css('top', parseInt($(this).css('top'), 10) - 7);
						$(this).removeClass('playerMissiles');
					}
				});

				$('.enemiesMissiles').each(function () {
					var
						posx = parseInt($(this).css('left'), 10),
						collided
					;

					if (posx < 0) {
						$(this).remove();
						return;
					}

					$(this).css('left', ['', String(posx - MISSILE_SPEED), 'px'].join(''));

					//Test for collisions
					collided = $(this).collision('.group,#playerBody');
					if (collided.length > 0) {
						//The player has been hit!
						collided.each(function () {
							if ($('#player')[0].player.damage()) {
								explodePlayer($('#player'));
							}
						});
						//$(this).remove();
						$(this).setAnimation(missile.enemiesexplode, function (node) {
							$(node).remove();
						});
						$(this).removeClass('enemiesMissiles');
					}
				});
			}
		}, REFRESH_RATE);

		//This function manage the creation of the enemies
		$.playground().registerCallback(function () {
			var
				name
			;

			if (!bossMode && !gameOver) {
				if (Math.random() < 0.4) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(name, {animation: enemies[0].idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 150, height: 52});
					$(['#', name].join('')).addClass('enemy');
					$(['#', name].join(''))[0].enemy = G.Minion($(['#', name].join('')));
				} else if (Math.random() < 0.5) {
					name = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(name, {animation: enemies[1].idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 42});
					$(['#', name].join('')).addClass('enemy');
					$(['#', name].join(''))[0].enemy = G.Brainy($(['#', name].join('')));
				} else if (Math.random() > 0.8) {
					bossMode = true;
					bossName = ['enemy1_', String(Math.ceil(Math.random() * 1000))].join('');
					$('#actors').addSprite(bossName, {animation: enemies[2].idle, posx: PLAYGROUND_WIDTH, posy: Math.random() * PLAYGROUND_HEIGHT, width: 100, height: 100});
					$(['#', bossName].join('')).addClass('enemy');
					$(['#', bossName].join(''))[0].enemy = G.Bossy($(['#', bossName].join('')));
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
				newPos
			;

			newPos = (parseInt($('#background1').css('left'), 10) - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background1').css('left', newPos);

			newPos = (parseInt($('#background2').css('left'), 10) - smallStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background2').css('left', newPos);

			newPos = (parseInt($('#background3').css('left'), 10) - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background3').css('left', newPos);

			newPos = (parseInt($('#background4').css('left'), 10) - mediumStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background4').css('left', newPos);

			newPos = (parseInt($('#background5').css('left'), 10) - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background5').css('left', newPos);

			newPos = (parseInt($('#background6').css('left'), 10) - bigStarSpeed - PLAYGROUND_WIDTH) % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
			$('#background6').css('left', newPos);
		}, REFRESH_RATE);

		//this is where the keybinding occurs
		$(document).keydown(function (e) {
			var
				playerposx,
				playerposy,
				name
			;

			if (!gameOver && !playerHit) {
				switch (e.keyCode) {
					case 75: //this is shoot (k)
						//shoot missile here
						playerposx = parseInt($('#player').css('left'), 10);
						playerposy = parseInt($('#player').css('top'), 10);
						name = ['playerMissle_', String(Math.ceil(Math.random() * 1000))].join('');
						$('#playerMissileLayer').addSprite(name, {animation: missile.player, posx: playerposx + 90, posy: playerposy + 14, width: 36, height: 10});
						$(['#', name].join('')).addClass('playerMissiles');
						break;
					case 65: //this is left! (a)
						$('#playerBooster').setAnimation();
						break;
					case 87: //this is up! (w)
						$('#playerBoostUp').setAnimation(playerAnimation.up);
						break;
					case 68: //this is right (d)
						$('#playerBooster').setAnimation(playerAnimation.booster);
						break;
					case 83: //this is down! (s)
						$('#playerBoostDown').setAnimation(playerAnimation.down);
						break;
				}
			}
		});

		//this is where the keybinding occurs
		$(document).keyup(function (e) {
			if (!gameOver && !playerHit) {
				switch (e.keyCode) {
					case 65: //this is left! (a)
						$('#playerBooster').setAnimation(playerAnimation.boost);
						break;
					case 87: //this is up! (w)
						$('#playerBoostUp').setAnimation();
						break;
					case 68: //this is right (d)
						$('#playerBooster').setAnimation(playerAnimation.boost);
						break;
					case 83: //this is down! (s)
						$('#playerBoostDown').setAnimation();
						break;
				}
			}
		});
	});
}(jQuery));

