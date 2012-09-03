$(function () {
	var
		fg = friGame,
		animation = fg.Animation('sh.png', {type: fg.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;


	fg.startGame(function () {
		fg.playground()
			.addSprite('rotate', {animation: animation, left: 0, top: 16})
			.addSprite('scale', {animation: animation, left: 80, top: 16})
			.addSprite('rotateScale', {animation: animation, left: 160, top: 16})
			.addSprite('scaleRotate', {animation: animation, left: 240, top: 16})
		;

		fg.sprites.rotate.rotate(Math.PI / 4);
		fg.sprites.scale.scale(2);
		fg.sprites.rotateScale.rotate(Math.PI / 4).scale(2);
		fg.sprites.scaleRotate.scale(2).rotate(Math.PI / 4);
	});
});

