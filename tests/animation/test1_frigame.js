$(function () {
	var
		simpleVerticalAnimation = $.friGame.Animation('sv.png', {
			type: $.friGame.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300
		}),

		simpleHorizontalAnimation = $.friGame.Animation('sh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300
		}),

		multiVerticalAnimation = $.friGame.Animation('mv.png', {
			type: $.friGame.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			frameWidth: 32
		}),

		multiHorizontalAnimation = $.friGame.Animation('mh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			frameHeight: 32
		}),

		simpleOffsetVerticalAnimation = $.friGame.Animation('sov.png', {
			type: $.friGame.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		}),

		simpleOffsetHorizontalAnimation = $.friGame.Animation('soh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100
		}),

		multiOffsetVerticalAnimation = $.friGame.Animation('mov.png', {
			type: $.friGame.ANIMATION_VERTICAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameWidth: 32
		}),

		multiOffsetHorizontalAnimation = $.friGame.Animation('moh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameHeight: 32
		}),

		pingpongAnimation = $.friGame.Animation('rebound.png', {
			type: $.friGame.ANIMATION_HORIZONTAL + $.friGame.ANIMATION_PINGPONG + $.friGame.ANIMATION_ONCE,
			numberOfFrame: 9,
			//rate: 60
			rate: 600
		}),

		multiPingpongAnimation = $.friGame.Animation('reboundm.png', {
			type: $.friGame.ANIMATION_HORIZONTAL + $.friGame.ANIMATION_PINGPONG,
			numberOfFrame: 9,
			rate: 60,
			frameHeight: 64
		})
	;

	$.friGame.startGame(function () {
		$.friGame.playground()
			.addSprite('simpleVertical', {animation: simpleVerticalAnimation, posx: 0})
			.addSprite('simpleHorizontal', {animation: simpleHorizontalAnimation, posx: 34})
			.addSprite('multiVertical', {animation: multiVerticalAnimation, posx: 75})
			.addSprite('multiHorizontal', {animation: multiHorizontalAnimation, posx: 109})
			.addSprite('simpleOffsetVertical', {animation: simpleOffsetVerticalAnimation, posx: 150})
			.addSprite('simpleOffsetHorizontal', {animation: simpleOffsetHorizontalAnimation, posx: 184})
			.addSprite('multiOffsetVertical', {animation: multiOffsetVerticalAnimation, animationIndex: 1, posx: 225})
			.addSprite('multiOffsetHorizontal', {animation: multiOffsetHorizontalAnimation, animationIndex: 1, posx: 259})
			.addSprite('pingpong', {animation: pingpongAnimation, posx: 286})
			.addSprite('multiPingpong', {animation: multiPingpongAnimation, posx: 350})
		;

		$.friGame.sprites.multiVertical.setAnimation({animationIndex: 1});
		$.friGame.sprites.multiHorizontal.setAnimation({animationIndex: 1});
		$.friGame.sprites.multiPingpong.setAnimation({animationIndex: 1});
		$.friGame.sprites.pingpong.setAnimation({callback: function () {
			$('<p>Done</p>').appendTo('#playground').css({position: 'absolute', top: '64px'});
		}});
	});
});

