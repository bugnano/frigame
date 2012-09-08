$(function () {
	var
		fg = friGame,
		background = fg.Animation('ruler.png'),
		animation = fg.Animation('sh.png', {type: fg.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300}),
		gradient = fg.Gradient({r: 128}, {b: 255, a: 0.3}, fg.GRADIENT_HORIZONTAL)
	;

	fg.startGame(function () {
		fg.playground()
			.addGroup('background', {width: 1, height: 1})
				.addSprite('ruler', {animation: background})
			.end()
			.addGroup('group1', {background: gradient})
				.addSprite('sprite1', {animation: animation, left: 16, top: 32})
				.addSprite('sprite2', {animation: animation, left: 112, top: 64})
			.end()
		;

		fg.sprites.group1.move({left: 64, top: 128});
		fg.sprites.group1.resize({width: fg.sprites.group1.width - 64, height: fg.sprites.group1.height - 128});
		fg.sprites.sprite1.rotate((45 * Math.PI) / 180);
		fg.sprites.sprite2.scale(2);
	});
});

