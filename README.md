# friGame

friGame is a game development library in JavaScript written by Franco Bugnano. It allows creating 2D games that run in any modern web browser
without having to rely on external plugins such as [Flash](http://www.adobe.com/go/getflashplayer).

It started as a porting of the excellent [gameQuery](http://gamequeryjs.com/) library by Selim Arsever in order to use the HTML5 &lt;canvas&gt; element, but
it has developed since then its own set of unique features.

[gameQuery](http://gamequeryjs.com/) Copyright (c) 2008-2013 Selim Arsever, licensed under the MIT

[friGame](http://www.frigame.org/) Copyright (c) 2011-2019 Franco Bugnano, licensed under the MIT

## Documentation

The official documentation is available on http://www.frigame.org/

There are also some example games in the `arkanoid/`, `breakout/`, and `tutorial/` directories.

## Goals and Features

### Goals

- **Fast:** friGame has been developed in order to be fast while maintaining an easy to use API
- **Modular:** Add features to your game by simply including the modules you need
- **Canvas or DOM rendering:** The same feature set is available in either the HTML5 &lt;canvas&gt; or DOM backend, and selecting a backend is only a matter of including the appropriate file
- **Compatible:** By using only standard web technologies friGame is compatible with any modern mobile or desktop browser, including IE6 (No PNG alpha support) or IE7, without requiring any external plugin

### Features

- Sprites with animations, movement, collision detection, callbacks, transforms
- Sprite layers (grouping) with optional background image or gradient
- Extensible resource manager
- Sound support using Web Audio API and HTML5 Audio where available, with optional fallback to Flash
- Extensible tweening for sprite and sound properties
- Optional keyboard and mouse state polling

