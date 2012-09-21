$(function () {
	var
		fg = friGame
	;

	fg.resourceManager
		.addAnimation('background', 'ruler.png')
		.addAnimation('animation', 'sh.png', {type: fg.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
		.addGradient('gradient', {r: 128}, {b: 255, a: 0.3}, fg.GRADIENT_HORIZONTAL)
		.addAnimation('grassblock', 'grassblock.png')
		.addAnimation('boy', 'boy.png')
		.addAnimation('catgirl', 'catgirl.png')
		.addAnimation('horngirl', 'horngirl.png')
		.addAnimation('pinkgirl', 'pinkgirl.png')
	;

	fg.startGame(function () {
		fg.playground()
			.addGroup('group1', {background: 'gradient'})
				.addSprite('sprite1', {animation: 'animation', left: 16, top: 32})
				.addSprite('sprite2', {animation: 'animation', centerx: 0, top: 192})
			.end()
			.addGroup('group2', {left: 100, top: 150, width: 300, height: 200, background: 'grassblock'})
				.addSprite('catgirl', {animation: 'catgirl', left: 32, top: 32})
				.addSprite('horngirl', {animation: 'horngirl', left: 48, top: 32})
				.addSprite('pinkgirl', {animation: 'pinkgirl', left: 64, top: 32})
				.insertSprite('boy', {animation: 'boy', left: 16, top: 32})
			.end()
			.insertGroup('background', {width: 1, height: 1})
				.addSprite('ruler', {animation: 'background'})
			.end()
		;

		fg.sprites.group1.move({left: 64, top: 128});
		fg.sprites.group1.resize({width: fg.sprites.group1.width - 64, height: fg.sprites.group1.height - 128});
		fg.sprites.sprite1.rotate((45 * Math.PI) / 180);
		fg.sprites.sprite2.scale(2);
	});
});

