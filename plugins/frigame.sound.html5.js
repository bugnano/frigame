/*global jQuery, friGame, Audio */
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

	(function () {
		var
			a = new Audio()
		;

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
	}());

	fg.PSound = {
		init: function (soundURLs) {
			var
				i,
				canPlay = fg.canPlay,
				sound_url,
				len_sound_urls,
				format
			;

			// Step 1: Determine the sound URL
			if (typeof soundURLs === 'string') {
				// A single sound URL is given
				sound_url = soundURLs;
			} else if (soundURLs instanceof Array) {
				// Check which sound can be played
				len_sound_urls = soundURLs.length;
				for (i = 0; i < len_sound_urls; i += 1) {
					// Determine the file type by the extension (last 3 characters)
					if (canPlay[soundURLs[i].slice(-3).toLowerCase()]) {
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

			// Step 2: Create the Audio element
			if (sound_url) {
				this.audio = new Audio(sound_url);
				this.audio.load();
			}
		},

		// Public functions

		remove: function () {
		},

		play: function (options) {
			// options:
			// volume: From 0.0 to 1.0
			// loop: true or false
			// callback: when done playing
			var
				new_options = options || {},
				audio = this.audio,
				fg_audio = this
			;

			if (audio) {
				// Make sure the audio is paused before changing its options
				audio.pause();

				if (new_options.volume !== undefined) {
					audio.volume = fg.clamp(new_options.volume, 0, 1);
				} else {
					audio.volume = 1;
				}

				if (new_options.loop) {
					audio.loop = true;
				} else {
					audio.loop = false;
				}

				if (new_options.callback) {
					audio.onended = function () {
						new_options.callback.call(fg_audio);
					};
				} else {
					audio.onended = null;
				}

				audio.currentTime = 0;
				audio.play();
			}

			return this;
		},

		pause: function () {
			if (this.audio) {
				this.audio.pause();
			}
		},

		resume: function () {
			if (this.audio) {
				this.audio.play();
			}
		},

		// Implementation details

		complete: function () {
			var
				audio = this.audio,
				completed = true
			;

			if (audio && (audio.readyState < audio.HAVE_ENOUGH_DATA)) {
				completed = false;
			}

			return completed;
		},

		onLoad: function () {
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
			args = Array.prototype.slice.call(arguments, 1),
			sound = fg.Sound.apply(this, args)
		;

		sound.name = name;

		return fg.resourceManager.addResource(name, sound);
	};
}(jQuery, friGame));

