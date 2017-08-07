friGame.ready(function () {
	var
		fg = friGame
	;

	fg.resourceManager
		.addAnimation('background', 'ruler.png')
		.addAnimation('animation', 'sh.png', {type: fg.ANIMATION_HORIZONTAL, numberOfFrame: 4, rate: 300})
		.addGradient('gradient', {r: 128}, {b: 255, a: 0.3}, fg.GRADIENT_HORIZONTAL)
		.addGradient('red', {r: 128})
		.addGradient('blue', {b: 255, a: 0.6})
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
			.addGroup('rect1', {background: 'red', borderColor: 'blue', borderRadius: [17, 5, 23, 11], borderWidth: 12, left: 48, top: 48, width: 64, height: 64})
				.addSprite('catgirl2', {animation: 'catgirl', left: 32, top: 32})
			.end()
			.addGroup('group3', {left: 100, top: 370, width: 300, height: 100, background: 'grassblock', borderRadius: 20, borderColor: 'blue', borderWidth: 12, mask: 'catgirl', maskType: fg.MASK_STRETCHED})
				.addSprite('catgirl3', {animation: 'catgirl', left: 32, top: 32})
			.end()
			.addSprite('sprite3', {animation: 'animation', centerx: 304, centery: 48})
		;

		fg.sprites.group1.move({left: 64, top: 128});
		fg.sprites.group1.resize({width: fg.sprites.group1.width - 64, height: fg.sprites.group1.height - 128});
		fg.sprites.sprite1.rotate((45 * Math.PI) / 180);
		fg.sprites.sprite2.scale(2);
		fg.s.rect1.crop(true);

		fg.sprites.sprite3.transformOrigin(12, 'height');
		fg.sprites.sprite3.scale(3, 2);
		fg.sprites.sprite3.rotate((27 * Math.PI) / 180);

		if (window.$) {
			fg.playground().registerCallback(function () {
				$('#tracker_output').html([
					'<p>x: ', String(fg.mouseTracker.x), '</p>',
					'<p>y: ', String(fg.mouseTracker.y), '</p>',
					'<p>1: ', String(fg.mouseTracker['1']), '</p>',
					'<p>2: ', String(fg.mouseTracker['2']), '</p>',
					'<p>3: ', String(fg.mouseTracker['3']), '</p>'
				].join(''));
			}, 100);
		}
	});
});

