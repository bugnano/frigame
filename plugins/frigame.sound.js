/*global jQuery, friGame, soundManager, Audio */
/*jslint sloppy: true, white: true, browser: true */

// Copyright (c) 2011-2012 Franco Bugnano

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Uses ideas and APIs inspired by:
// gameQuery Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org), licensed under the MIT

(function ($, fg) {
	fg.canPlay = {};
	fg.sm2Loaded = false;

	// Setup HTML5 Audio
	(function () {
		var
			a
		;

		if (window.Audio) {
			a = new Audio();
			if (a.canPlayType('audio/wav; codecs="1"') === 'probably') {
				fg.canPlay.wav = true;
			}

			if (a.canPlayType('audio/ogg; codecs="vorbis"') === 'probably') {
				fg.canPlay.ogg = true;
				fg.canPlay.oga = true;
			}

			if (a.canPlayType('audio/mpeg; codecs="mp3"') === 'probably') {
				fg.canPlay.mp3 = true;
			}
		}
	}());

	if (window.soundManager) {
		// Setup soundManager2
		soundManager.onready(function() {
			// mp3 is the only supported format for the Flash 8 version of soundManager2
			fg.canPlay.mp3 = 'sm2';

			fg.sm2Loaded = true;
		});

		soundManager.ontimeout(function() {
			fg.sm2Loaded = true;
		});

		soundManager.setup({
			url: './',
			flashVersion: 8,
			debugMode: false,
			useFlashBlock: false,

			useHTML5Audio: false,

			useHighPerformance: true,
			wmode: 'transparent',

			defaultOptions: {
				stream: false
			}
		});
	} else {
		fg.sm2Loaded = true;
	}

	fg.PSound = {
		init: function (name, soundURLs) {
			this.name = name;
			this.soundURLs = soundURLs;
			this.initialized = false;
			this.options = {
				paused: true,
				muted: false,
				volume: 1
			};
		},

		// Public functions

		remove: function () {
			if (this.sound) {
				this.sound.destruct();
			}
		},

		setOptions: function (options) {
			var
				my_options = this.options,
				new_options = options || {},
				sound = this.sound,
				audio = this.audio,
				muted_redefined = new_options.muted !== undefined,
				volume_redefined = new_options.volume !== undefined
			;

			if (sound) {
				if (new_options.paused !== undefined) {
					if (new_options.paused) {
						sound.pause();
					} else {
						sound.resume();
					}
				}

				if (muted_redefined) {
					my_options.muted = new_options.muted;
				}

				if (volume_redefined) {
					my_options.volume = fg.clamp(new_options.volume, 0, 1);
				}

				if ((muted_redefined) || (volume_redefined)) {
					if (my_options.muted) {
						sound.setVolume(0);
					} else {
						sound.setVolume(Math.round(my_options.volume * 100));
					}
				}
			}

			if (audio) {
				if (new_options.paused !== undefined) {
					if (new_options.paused) {
						audio.pause();
					} else {
						audio.play();
					}
				}

				if (muted_redefined) {
					my_options.muted = new_options.muted;
					audio.muted = my_options.muted;
				}

				if (volume_redefined) {
					my_options.volume = fg.clamp(new_options.volume, 0, 1);
					audio.volume = my_options.volume;
				}
			}

			return this;
		},

		play: function (options) {
			// options:
			// volume: From 0.0 to 1.0
			// loop: true or false
			// callback: when done playing
			var
				my_options = this.options,
				new_options = options || {},
				sound_options = {},
				sound = this.sound,
				audio = this.audio,
				sound_object = this
			;

			if (sound) {
				// Make sure the audio is paused before changing its options
				sound.stop();

				if (new_options.muted !== undefined) {
					my_options.muted = new_options.muted;
				}

				if (new_options.volume !== undefined) {
					my_options.volume = fg.clamp(new_options.volume, 0, 1);
				}

				if (my_options.muted) {
					sound_options.volume = 0;
				} else {
					sound_options.volume = Math.round(my_options.volume * 100);
				}

				if (new_options.loop) {
					sound_options.onfinish = function () {
						sound_object.replay();
					};
				} else if (new_options.callback) {
					sound_options.onfinish = function () {
						new_options.callback.call(sound_object);
					};
				} else {
					sound_options.onfinish = null;
				}

				sound.play(sound_options);
				if (new_options.paused) {
					sound.pause();
				}

			}

			if (audio) {
				// Make sure the audio is paused before changing its options
				audio.pause();

				if (new_options.muted !== undefined) {
					my_options.muted = new_options.muted;
					audio.muted = my_options.muted;
				}

				if (new_options.volume !== undefined) {
					my_options.volume = fg.clamp(new_options.volume, 0, 1);
					audio.volume = my_options.volume;
				}

				if (new_options.loop) {
					audio.loop = true;
					audio.onended = null;
				} else if (new_options.callback) {
					audio.loop = false;
					audio.onended = function () {
						new_options.callback.call(sound_object);
					};
				} else {
					audio.loop = false;
					audio.onended = null;
				}

				audio.currentTime = 0;
				if (!new_options.paused) {
					audio.play();
				}
			}

			return this;
		},

		stop: function () {
			if (this.sound) {
				this.sound.stop();
			}

			if (this.audio) {
				this.audio.pause();
				this.audio.currentTime = 0;
			}

			return this;
		},

		// Implementation details

		complete: function () {
			var
				sound = this.sound,
				audio = this.audio,
				soundURLs = this.soundURLs,
				i,
				canPlay = fg.canPlay,
				sound_url,
				len_sound_urls,
				format,
				completed = true
			;

			if (!fg.sm2Loaded) {
				return false;
			}

			if (!this.initialized) {
				// Step 1: Determine the sound URL
				if (typeof soundURLs === 'string') {
					// A single sound URL is given
					// Determine the file type by the extension (last 3 characters)
					format = soundURLs.slice(-3).toLowerCase();
					if (!canPlay[format]) {
						// Cannot determine file format by extension.
						// Assume it is an mp3 (the only format recognized by the Flash 8 version of soundManager2)
						format = 'mp3';
					}
					sound_url = soundURLs;
				} else if (soundURLs instanceof Array) {
					// Check which sound can be played
					len_sound_urls = soundURLs.length;
					for (i = 0; i < len_sound_urls; i += 1) {
						// Determine the file type by the extension (last 3 characters)
						format = soundURLs[i].slice(-3).toLowerCase();
						if (canPlay[format]) {
							sound_url = soundURLs[i];
							break;
						}
					}
				} else {
					// soundURLs is an object literal
					for (format in canPlay) {
						if (canPlay.hasOwnProperty(format)) {
							if (soundURLs[format]) {
								sound_url = soundURLs[format];
								break;
							}
						}
					}
				}

				// Step 2: Create the sound or the Audio element
				if (sound_url) {
					if (canPlay[format] === 'sm2') {
						// Sound supported through soundManager2
						this.sound = soundManager.createSound({
							id: this.name,
							url: sound_url
						});
						this.sound.load();
						sound = this.sound;
					} else if (canPlay[format]) {
						// Sound supported through HTML5 Audio
						this.audio = new Audio(sound_url);
						this.audio.load();
						audio = this.audio;
					} else {
						// Sound type not supported -- It is not a fatal error
						$.noop();
					}
				}

				this.initialized = true;
			}

			if (sound && (sound.readyState < 3)) {
				completed = false;
			} else if (audio && (audio.readyState < audio.HAVE_ENOUGH_DATA)) {
				completed = false;
			} else {
				completed = true;
			}

			return completed;
		},

		onLoad: function () {
		},

		replay: function () {
			var
				my_options = this.options,
				sound_options = {},
				sound_object = this
			;

			if (my_options.muted) {
				sound_options.volume = 0;
			} else {
				sound_options.volume = Math.round(my_options.volume * 100);
			}

			sound_options.onfinish = function () {
				sound_object.replay();
			};

			this.sound.play(sound_options);
		}
	};

	fg.Sound = function () {
		var
			sound = Object.create(fg.PSound)
		;

		sound.init.apply(sound, arguments);

		return sound;
	};

	fg.resourceManager.addSound = function (name) {
		var
			sound = fg.Sound.apply(this, arguments)
		;

		return fg.resourceManager.addResource(name, sound);
	};
}(jQuery, friGame));

