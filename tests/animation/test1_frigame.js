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
			type: $.friGame.ANIMATION_VERTICAL + $.friGame.ANIMATION_MULTI,
			numberOfFrame: 4,
			rate: 300,
			frameWidth: 32
		}),

		multiHorizontalAnimation = $.friGame.Animation('mh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL + $.friGame.ANIMATION_MULTI,
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
			type: $.friGame.ANIMATION_VERTICAL + $.friGame.ANIMATION_MULTI,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameWidth: 32
		}),

		multiOffsetHorizontalAnimation = $.friGame.Animation('moh.png', {
			type: $.friGame.ANIMATION_HORIZONTAL + $.friGame.ANIMATION_MULTI,
			numberOfFrame: 4,
			rate: 300,
			offsetx: 100,
			offsety: 100,
			frameHeight: 32
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
		;

		$.friGame.sprites.multiVertical.setAnimation({animationIndex: 1});
		$.friGame.sprites.multiHorizontal.setAnimation({animationIndex: 1});
	});
});

