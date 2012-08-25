$(function () {
	var
		animation = $.friGame.Animation('sh.png', {type: $.friGame.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;

	$.friGame.startGame(function () {
		var
			angle = 45,
			angle_rad = (angle * Math.PI) / 180
		;

		$.friGame.playground()
			.addSprite('aRotateScale', {animation: animation, posx: 16, posy: 16})
			.addSprite('scaleARotate', {animation: animation, posx: 80, posy: 16})
			.addSprite('rotateAScale', {animation: animation, posx: 180, posy: 16})
			.addSprite('aScaleRotate', {animation: animation, posx: 240, posy: 16})
		;

		$.friGame.registerCallback(function () {
			$.friGame.sprites.aRotateScale.rotate(angle_rad).scale(2);
			$.friGame.sprites.scaleARotate.scale(2).rotate(-angle_rad);
			$.friGame.sprites.rotateAScale.rotate(Math.PI / 4).scale(Math.cos(angle_rad) * 2);
			$.friGame.sprites.aScaleRotate.scale(-Math.cos(angle_rad) * 2).rotate(Math.PI / 4);
			angle -= 1;
			if (angle < -180) {
				angle = 180;
			}
			angle_rad = (angle * Math.PI) / 180;
		}, 30);
	});
});

