$(function () {
	var
		background = $.friGame.Animation('ruler.png'),
		animation = $.friGame.Animation('sh.png', {type: $.friGame.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
	;


	$.friGame.startGame(function () {
		$.friGame.playground()
			.addGroup('background', {width: 1, height: 1})
				.addSprite('ruler', {animation: background})
			.end()
			.addGroup('group1')
				.addSprite('sprite1', {animation: animation, posx: 48, posy: 16})
			.end()
		;
	});
});

