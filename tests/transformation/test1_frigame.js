$(function () {
	var
		animation = $.friGame.Animation('sh.png', {type: $.friGame.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;


	$.friGame.startGame(function () {
		$.friGame.playground()
			.addSprite('rotate', {animation: animation, posx: 0, posy: 16})
			.addSprite('scale', {animation: animation, posx: 80, posy: 16})
			.addSprite('rotateScale', {animation: animation, posx: 160, posy: 16})
			.addSprite('scaleRotate', {animation: animation, posx: 240, posy: 16})
		;

		$.friGame.sprites.rotate.rotate(Math.PI / 4);
		$.friGame.sprites.scale.scale(2);
		$.friGame.sprites.rotateScale.rotate(Math.PI / 4).scale(2);
		$.friGame.sprites.scaleRotate.scale(2).rotate(Math.PI / 4);
	});
});

