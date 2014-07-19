friGame.ready(function () {
	var
		fg = friGame
	;

	fg.resourceManager
		.addAnimation('simpleVerticalAnimation', 'sv.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300
		})

		.addAnimation('simpleHorizontalAnimation', 'sh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300
		})

		.addAnimation('multiVerticalAnimation', 'mv.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			frameWidth: 32
		})

		.addAnimation('multiHorizontalAnimation', 'mh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			frameHeight: 32
		})

		.addAnimation('simpleOffsetVerticalAnimation', 'sov.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		})

		.addAnimation('simpleOffsetHorizontalAnimation', 'soh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		})

		.addAnimation('multiOffsetVerticalAnimation', 'mov.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameWidth: 32
		})

		.addAnimation('multiOffsetHorizontalAnimation', 'moh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameHeight: 32
		})

		.addAnimation('pingpongAnimation', 'rebound.png', {
			type: fg.ANIMATION_HORIZONTAL,
			once: true,
			pingpong: true,
			numberOfFrame: 9,
			//rate: 60
			rate: 600
		})

		.addAnimation('multiPingpongAnimation', 'reboundm.png', {
			type: fg.ANIMATION_HORIZONTAL,
			pingpong: true,
			numberOfFrame: 9,
			rate: 60,
			frameHeight: 64
		})

		.addAnimation('pingpongBackwardsAnimation', 'rebound.png', {
			type: fg.ANIMATION_HORIZONTAL,
			once: true,
			pingpong: true,
			backwards: true,
			numberOfFrame: 9,
			//rate: 60
			rate: 600
		})

		.addAnimation('multiPingpongBackwardsAnimation', 'reboundm.png', {
			type: fg.ANIMATION_HORIZONTAL,
			pingpong: true,
			backwards: true,
			numberOfFrame: 9,
			rate: 60,
			frameHeight: 64
		})
	;

	fg.startGame(function () {
		fg.playground()
			.addSprite('simpleVertical', {animation: 'simpleVerticalAnimation', left: 0})
			.addSprite('simpleHorizontal', {animation: 'simpleHorizontalAnimation', backwards: true, left: 34})
			.addSprite('multiVertical', {animation: 'multiVerticalAnimation', left: 75})
			.addSprite('multiHorizontal', {animation: 'multiHorizontalAnimation', left: 109})
			.addSprite('simpleOffsetVertical', {animation: 'simpleOffsetVerticalAnimation', left: 150})
			.addSprite('simpleOffsetHorizontal', {animation: 'simpleOffsetHorizontalAnimation', left: 184})
			.addSprite('multiOffsetVertical', {animation: 'multiOffsetVerticalAnimation', animationIndex: 1, left: 225})
			.addSprite('multiOffsetHorizontal', {animation: 'multiOffsetHorizontalAnimation', animationIndex: 1, left: 259})
			.addSprite('pingpong', {animation: 'pingpongAnimation', left: 286})
			.addSprite('multiPingpong', {animation: 'multiPingpongAnimation', left: 350})
			.addSprite('backPingpong', {animation: 'pingpongBackwardsAnimation', left: 414})
			.addSprite('multiBackPingpong', {animation: 'multiPingpongBackwardsAnimation', animationIndex: 1, left: 478})
		;

		fg.sprites.multiVertical.setAnimation({animationIndex: 1});
		fg.sprites.multiHorizontal.setAnimation({animationIndex: 1});
		fg.sprites.multiPingpong.setAnimation({animationIndex: 1});
		fg.sprites.pingpong.setAnimation({callback: function () {
			if (window.$) {
				$('<p>Forwards Done</p>').appendTo('#playground').css({position: 'absolute', top: '64px'});
			}
		}});
		fg.sprites.backPingpong.setAnimation({callback: function () {
			if (window.$) {
				$('<p>Backwards Done</p>').appendTo('#playground').css({position: 'absolute', top: '88px'});
			}
		}});
	});
});

