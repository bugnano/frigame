$(function () {
	var
		fg = friGame,
		background = fg.Animation('ruler.png'),
		animation = fg.Animation('sh.png', {type: fg.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;

	fg.startGame(function () {
		fg.playground()
			.addGroup('background', {width: 1, height: 1})
				.addSprite('ruler', {animation: background})
			.end()
			.addGroup('group1')
				.addSprite('sprite1', {animation: animation, left: 48, top: 16})
			.end()
		;
	});
});

