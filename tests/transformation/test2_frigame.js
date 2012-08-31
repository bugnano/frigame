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
			.addSprite('aRotateScale', {animation: animation, left: 16, top: 16})
			.addSprite('scaleARotate', {animation: animation, left: 80, top: 16})
			.addSprite('rotateAScale', {animation: animation, left: 180, top: 16})
			.addSprite('aScaleRotate', {animation: animation, left: 240, top: 16})
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

