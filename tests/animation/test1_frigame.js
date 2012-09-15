$(function () {
	var
		fg = friGame,

		simpleVerticalAnimation = fg.Animation('sv.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300
		}),

		simpleHorizontalAnimation = fg.Animation('sh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300
		}),

		multiVerticalAnimation = fg.Animation('mv.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			frameWidth: 32
		}),

		multiHorizontalAnimation = fg.Animation('mh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			frameHeight: 32
		}),

		simpleOffsetVerticalAnimation = fg.Animation('sov.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		}),

		simpleOffsetHorizontalAnimation = fg.Animation('soh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		}),

		multiOffsetVerticalAnimation = fg.Animation('mov.png', {
			type: fg.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameWidth: 32
		}),

		multiOffsetHorizontalAnimation = fg.Animation('moh.png', {
			type: fg.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameHeight: 32
		}),

		pingpongAnimation = fg.Animation('rebound.png', {
			type: fg.ANIMATION_HORIZONTAL + fg.ANIMATION_PINGPONG + fg.ANIMATION_ONCE,
			numberOfFrame: 9,
			//rate: 60
			rate: 600
		}),

		multiPingpongAnimation = fg.Animation('reboundm.png', {
			type: fg.ANIMATION_HORIZONTAL + fg.ANIMATION_PINGPONG,
			numberOfFrame: 9,
			rate: 60,
			frameHeight: 64
		}),

		pingpongBackwardsAnimation = fg.Animation('rebound.png', {
			type: fg.ANIMATION_HORIZONTAL + fg.ANIMATION_PINGPONG + fg.ANIMATION_ONCE + fg.ANIMATION_BACKWARDS,
			numberOfFrame: 9,
			//rate: 60
			rate: 600
		}),

		multiPingpongBackwardsAnimation = fg.Animation('reboundm.png', {
			type: fg.ANIMATION_HORIZONTAL + fg.ANIMATION_PINGPONG + fg.ANIMATION_BACKWARDS,
			numberOfFrame: 9,
			rate: 60,
			frameHeight: 64
		})
	;

	fg.startGame(function () {
		fg.playground()
			.addSprite('simpleVertical', {animation: simpleVerticalAnimation, left: 0})
			.addSprite('simpleHorizontal', {animation: simpleHorizontalAnimation, backwards: true, left: 34})
			.addSprite('multiVertical', {animation: multiVerticalAnimation, left: 75})
			.addSprite('multiHorizontal', {animation: multiHorizontalAnimation, left: 109})
			.addSprite('simpleOffsetVertical', {animation: simpleOffsetVerticalAnimation, left: 150})
			.addSprite('simpleOffsetHorizontal', {animation: simpleOffsetHorizontalAnimation, left: 184})
			.addSprite('multiOffsetVertical', {animation: multiOffsetVerticalAnimation, animationIndex: 1, left: 225})
			.addSprite('multiOffsetHorizontal', {animation: multiOffsetHorizontalAnimation, animationIndex: 1, left: 259})
			.addSprite('pingpong', {animation: pingpongAnimation, left: 286})
			.addSprite('multiPingpong', {animation: multiPingpongAnimation, left: 350})
			.addSprite('backPingpong', {animation: pingpongBackwardsAnimation, left: 414})
			.addSprite('multiBackPingpong', {animation: multiPingpongBackwardsAnimation, animationIndex: 1, left: 478})
		;

		fg.sprites.multiVertical.setAnimation({animationIndex: 1});
		fg.sprites.multiHorizontal.setAnimation({animationIndex: 1});
		fg.sprites.multiPingpong.setAnimation({animationIndex: 1});
		fg.sprites.pingpong.setAnimation({callback: function () {
			$('<p>Forwards Done</p>').appendTo('#playground').css({position: 'absolute', top: '64px'});
		}});
		fg.sprites.backPingpong.setAnimation({callback: function () {
			$('<p>Backwards Done</p>').appendTo('#playground').css({position: 'absolute', top: '88px'});
		}});
	});
});

