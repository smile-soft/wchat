var audioEl;
var dir = '';
var format = 'wav';
var volume = 0.5;
var debug = require('./debug');
var currFilename = '';

module.exports = {

	init: function(soundsDir) {
		audioEl = document.createElement('audio');
		audioEl.setAttribute('autoplay', true);
		audioEl.volume = volume;
		document.body.appendChild(audioEl);
		if(soundsDir) dir = soundsDir;
		return this;
	},

	play: function(filename, loop) {
		if(!audioEl) return;
		if(filename && filename !== currFilename) {
			audioEl.src = (dir + filename + '.' + format);
			if(loop) audioEl.setAttribute('loop', true);
			else audioEl.removeAttribute('loop');
		}
		
		audioEl.play();
	},

	stop: function() {
		audioEl.pause();
		audioEl.currentTime = 0;
	}

};