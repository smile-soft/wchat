var debug = require('./debug');
var events = {},
// JsSIP = require('jssip'),
// JsSIP = require('./libs/jssip'),
JsSIP,
options,
sipClient,
sipSession,
sipCallEvents;

function isWebrtcSupported(){
	var RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
		userMeida = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia,
		ice = window.mozRTCIceCandidate || window.RTCIceCandidate;

	return !!RTC && !!userMeida && !!ice;
}

function initJsSIPEvents(){
	sipClient.on('connected', function(e){ debug.log('sip connected event: ', e); });
	sipClient.on('disconnected', function(e){ debug.log('sip disconnected event: ', e); });
	sipClient.on('newMessage', function(e){ debug.log('sip newMessage event: ', e); });
	sipClient.on('newRTCSession', function(e){
		debug.log('sip newRTCSession event: ', e);
		events.emit('webrtc/newRTCSession', e);
		// if(e.session.direction === 'outgoing')
		// 	events.emit('webrtc/outgoingCall', e);
		// else
		// 	events.emit('webrtc/incomingCall', e);
		
			sipSession = e.session;
	});
	sipClient.on('registered', function(e){ debug.log('sip registered event: ', e); });
	sipClient.on('unregistered', function(e){ debug.log('sip unregistered event: ', e); });
	sipClient.on('registrationFailed', function(e){ debug.log('sip registrationFailed event: ', e); });

	sipCallEvents = {
		progress: function(e){
			debug.log('call progress event: ', e);
			events.emit('webrtc/progress', e);
		},
		failed: function(e){
			debug.log('call failed event:', e);
			events.emit('webrtc/failed', e);
		},
		ended: function(e){
			debug.log('call ended event: ', e);
			events.emit('webrtc/ended', e);
		},
		confirmed: function(e){
			debug.log('call confirmed event: ', e);
			events.emit('webrtc/confirmed', e);
		}
		// addstream: function(e){
		// 	debug.log('call addstream event: ', e);
		// 	events.emit('webrtc/addstream', e);
		// 	var stream = e.stream;
		// 	options.audioRemote = JsSIP.rtcninja.attachMediaStream(options.audioRemote, stream);
		// }
		// sdp: function(e){
		// 	debug.log('sdp: ', e);
		// }
	};
}

function isEstablished(){
	return sipSession.isEstablished();
}

function isInProgress(){
	return sipSession.isInProgress();
}

function isEnded(){
	return sipSession.isEnded();
}

function unregister(){
	sipClient.stop();
}

function audiocall(number){
	sipSession = sipClient.call(number, {
		eventHandlers: sipCallEvents,
		mediaConstraints: { audio: true, video: false }
	});

	sipSession.connection.addEventListener('track', function(e) {
		events.emit('webrtc/addstream', e);
		if(options.audioRemote.srcObject !== e.streams[0]) options.audioRemote.srcObject = e.streams[0];
		// e.streams.forEach(function(stream) {
		// 	e.track.muted = false;
		// 	sipSession.connection.addTrack(e.track, stream)
		// } );
	})
}

function terminate(){
	sipSession.terminate({
		status_code: 200
	});
	// sipClient.terminateSessions();
}

function answer(){
	debug.log('answer: ',sipClient);
	sipSession.answer();
}

function hold(){
	debug.log('hold: ', sipSession.isOnHold());
	if(sipSession && sipSession.isOnHold().local) {
		sipSession.unhold();
	} else {
		sipSession.hold();
	}
}

function createRemoteAudio(){
	var el = document.createElement('audio');
	el.setAttribute('autoplay', 'autoplay');
	document.body.appendChild(el);
	return el;
}

function init(options){
	debug.log('Initiating WebRTC module:', options);
	JsSIP = global.JsSIP;

	debug.log('JsSIP: ', global, JsSIP);

	if(options.sip.register === undefined) options.sip.register = false;
	var socket = new JsSIP.WebSocketInterface(options.sip.ws_servers);
	options.sip.sockets = [socket];

	// !!get rid of this!!
	events.emit = options.emit;
	events.on = options.on;
	// !!get rid of this!!

	options.audioRemote = createRemoteAudio();
	sipClient = new JsSIP.UA(options.sip);
	initJsSIPEvents();
	sipClient.start();
	// return sipClient;
}

module.exports = {
	lib: JsSIP,
	init: init,
	unregister: unregister,
	audiocall: audiocall,
	terminate: terminate,
	answer: answer,
	hold: hold,
	isInProgress: isInProgress,
	isEstablished: isEstablished,
	isEnded: isEnded,
	isSupported: isWebrtcSupported
};