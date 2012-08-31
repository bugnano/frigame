$(function () {
	var
		animation = $.friGame.Animation('sh.png', {type: $.friGame.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;


	$.friGame.startGame(function () {
		$.friGame.playground()
			.addSprite('rotate', {animation: animation, left: 0, top: 16})
			.addSprite('scale', {animation: animation, left: 80, top: 16})
			.addSprite('rotateScale', {animation: animation, left: 160, top: 16})
			.addSprite('scaleRotate', {animation: animation, left: 240, top: 16})
		;

		$.friGame.sprites.rotate.rotate(Math.PI / 4);
		$.friGame.sprites.scale.scale(2);
		$.friGame.sprites.rotateScale.rotate(Math.PI / 4).scale(2);
		$.friGame.sprites.scaleRotate.scale(2).rotate(Math.PI / 4);
	});
});

