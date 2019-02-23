var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
// var websockets = require('./websockets');
// var url = require('url').parse(document.URL, true);
var url = global.location;
var _ = require('./lodash-fns');
var inherits = require('inherits');
var websocketTry = 1;
var pollTurns = 1;
var mainAddress = "main.ringotel.net/chatbot/WebChat/";
// var publicUrl = "https://main.ringotel.net/public/";
var websocketUrl = "";
var moduleInit = false;
var sessionTimeout = null;
var chatTimeout = null;

/**
 * Core module implements main internal functionality
 * 
 * @param  {Object} options Instantiation options that overrides module defaults
 * @return {Object}         Return public API
 */

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = options || {};
	this.options.serverUrl = this.options.server + '/ipcc/$$$';
	this.session = {};

	if(!this.options.wsServer && !this.options.pageid) return console.error('Cannot initiate module: pageid is undefined');

	websocketUrl = (this.options.wsServer ? this.options.wsServer : mainAddress);
	websocketUrl += (websocketUrl[websocketUrl.length-1] !== '/' ? '/' : '') + this.options.pageid; // add forward slash at the end if necessary

	this.createWebsocket();

	this.on('session/create', this.onSessionCreate.bind(this));
	// this.on('chat/close', function(data) {
	// 	storage.saveState('chat', false, 'session');
	// });
	this.on('Error', this.onError);


	return this;

}

WchatAPI.prototype.onError = function(err){
	debug.log('Error: ', err);
}

WchatAPI.prototype.onSessionCreate = function(data){
	this.session = _.merge(this.session, data);
	storage.saveState('sid', data.sid);
	// this.setSessionTimeout();
}

WchatAPI.prototype.setSessionTimeout = function(){
	var timeout = this.session.sessionTimeout;
	clearTimeout(sessionTimeout);
	if(timeout)
		sessionTimeout = setTimeout(this.onSessionTimeout.bind(this), timeout*1000);
}

WchatAPI.prototype.onSessionTimeout = function(){
	this.emit('session/timeout');
};

WchatAPI.prototype.sendData = function(data){
	if(this.websocket) this.websocket.send(JSON.stringify(data));
};

/**
 * Websocket messages handler
 */
WchatAPI.prototype.onWebsocketMessage = function(e){
	// this.emit('websocket/message', (e.data ? JSON.parse(e.data) : {}));
	var data = JSON.parse(e.data),
	    method = data.method;

	// debug.log('onWebsocketMessage: ', data);
	
	if(data.method) {
		if(data.method === 'session') {
			this.emit('session/create', data.params);

		} else if(data.method === 'messages') {
			if(data.params.list) {
				data.params.list.map(function(item, index, array) {
					item.sequence = (index+1) + '/' + array.length;
					this.emit('message/new', item);
					return item;
				}.bind(this));
			}

		} else if(data.method === 'message') {
			if(data.params.typing) {
				this.emit('message/typing');
			} else {
				this.emit('message/new', data.params);
				this.setSessionTimeout();
			}

		} else if(data.method === 'openShare') { // Agent ---> User
			if(this.session.sharedId === data.params.id) return;
			if(data.params.url && (url.href !== data.params.url)) return window.location = data.params.url;
			if(data.params.id) {
				this.session.sharedId = data.params.id;
				this.emit('session/joined', { url: url.href });
				this.shareOpened(data.params.id, url.href); // User ---> Agent
			}

		} else if(data.method === 'shareOpened') { // User ---> Agent
			if(data.params.id) {
				this.session.sharedId = data.params.id;
				this.emit('session/joined', { url: url.href });
			}

		} else if(data.method === 'shareClosed') {
			clearInterval(this.openShareInteval);
			this.session.sharedId = "";
			this.emit('session/disjoin');

		} else if(data.method === 'events') {
			this.emit('cobrowsing/update', data.params);

		}
	}
};

/**
 * Module initiation
 * Emits module/start event if module started
 */
// WchatAPI.prototype.initModule = function(){

	// _.poll(function(){
	// 	return (websocketInit === true);
	// }, function() {
	// 	debug.log('INIT');
	// 	this.init();
	// }.bind(this), function(){
	// 	if(pollTurns < 2) {
	// 		pollTurns++;
	// 	} else {
	// 		return this.emit('Error', 'Module wasn\'t initiated due to network error');
	// 	}
	// }.bind(this), 60000);
// };

WchatAPI.prototype.init = function(){
	moduleInit = true;

	var entity = storage.getState('entity', 'session'),
		sid = storage.getState('sid');
		strIndex = url.href.indexOf('chatSessionId');

	debug.log('initModule: ', this.session, entity, sid);

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(strIndex !== -1) {
		sid = this.getSidFromUrl(url.href);
		entity = 'agent';
		var cleanUrl = url.href.substr(0, strIndex);
		cleanUrl = cleanUrl[cleanUrl.length-1] === '?' ? cleanUrl.substr(0, cleanUrl.length-1) : cleanUrl;

		storage.saveState('sid', sid);
		this.joinSession(cleanUrl);

	} else if(entity === 'agent') { // In case the cobrowsing session is active
		sid = storage.getState('sid');
		this.joinSession(url.href);

	} else {
		entity = 'user';
		this.createSession({ sid: sid, url: url.href });
	}

	this.session.sid = sid;
	this.session.entity = entity;
	storage.saveState('entity', entity, 'session');

};

/**
 * Create session
 * Emits session/create event
 * if initiation is successful
 *
 * @param 	{String} 	url 	Current full URL
 * @return 	{String}	sid 	New session id
 */
WchatAPI.prototype.createSession = function(params){
	var data = {
		method: 'createSession',
		params: {
			url: (params.url || url.href),
			lang: this.detectLanguage()
		}
	};

	if(params.sid) data.params.sid = params.sid;

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'createSession', params: params });
			return;
		}

		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(url){
	this.openShareInteval = setInterval(function() {
		this.openShare(url);
	}.bind(this), 3000);

	global.onclose = function() {
		this.shareClosed();
	}.bind(this);
};

/** 
 * Send/obtain events to/from the server. 
 * Events could be obtained from the server by specifying a timestamp
 * as a starting point from which an events would be obtained
**/
WchatAPI.prototype.updateEvents = function(events, cb){
	// var sessionId = storage.getState('sid'), data;
	// if(!sessionId) return cb();
	
	if(!this.session.sharedId) return;

	data = {
		method: 'events',
		params: {
			sid: this.session.sid,
			id: this.session.sharedId,
			timestamp: storage.getState('eventTimestamp', 'cache'),
			events: events
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, data);
			return cb(err); // TODO: handle error
		}

		if(body.result.timestamp > storage.getState('eventTimestamp', 'cache')) {
			storage.saveState('eventTimestamp', body.result.timestamp, 'cache');
			if(cb) cb(null, body.result);
		} else {
			if(cb) cb(null, { events: [] });
		}
			

	}.bind(this));
};

/**
 * Get available dialog languages
 * If languages are not available, 
 * then either there are no available agents or
 * languages weren't set in Admin Studio
 */
WchatAPI.prototype.getLanguages = function(cb){
	debug.log('this.session: ', this.session);
	cb(null, this.session.langs);	

	// var sessionId = storage.getState('sid');
	// if(!sessionId) return cb(true);

	// request.post(this.options.serverUrl, {
	// 	method: 'getLanguages',
	// 	params: {
	// 		sid: sessionId
	// 	}
	// }, function (err, body){
	// 	if(err) {
	// 		this.emit('Error', err, { method: 'getLanguages' });
	// 		return cb(err);
	// 	}

	// 	cb(null, body);
	// }.bind(this));
};

/**
 * Request chat session
 * 
 * @param  {Object} params - user parameters (name, phone, subject, language, etc.)
 */
WchatAPI.prototype.chatRequest = function(params, cb){
	params.sid = this.session.sid;

	debug.log('chatRequest params: ', params);

	var data = {
		method: 'chatRequest',
		params: params
	};

	this.setSessionTimeout();

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'chatRequest', params: params });
			if(cb) cb(err);
			return;
		}

		params.url = url.href;
		this.emit('chat/start', _.merge(params, body.result));
		if(cb) cb(null, body);
	}.bind(this));
};

/**
 * Get dialog messages
 * 
 * @param  {Number} timestamp Get messages since provided timestamp
 */
WchatAPI.prototype.getMessages = function(cb){
	request.post(this.options.serverUrl, {
		method: 'getMessages',
		params: {
			sid: this.session.sid,
			timestamp: storage.getState('msgTimestamp')
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'getMessages' });
			return cb(err);
		}

		// Do not show old messages
		if(body.result.timestamp > storage.getState('msgTimestamp')) {
			storage.saveState('msgTimestamp', body.result.timestamp);
			if(body.result.messages) {
				this.emit('message/new', body.result);
			}
		}

		if(body.result.typing) {
			this.emit('message/typing', body.result);
		}
		if(cb) cb(null, body.result);

	}.bind(this));
};

/**
 * Close current chat session
 * 
 * @param  {Number} rating Service rating
 */
WchatAPI.prototype.closeChat = function(rating){
	var data = {
		method: 'closeChat',
		params: {
			sid: this.session.sid
		}
	};
	if(rating) data.params.rating = rating;

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, data);
			return;
		}
		storage.saveState('chat', false);
		this.emit('chat/close', { rating: rating, url: url.href });
	}.bind(this));
};

/**
 * Send message to the agent
 * 
 * @param  {String} text - message content in case of regular message 
 * or dataURL in case of file transfer
 * @param  {String} file - (Optional) file name
 */
WchatAPI.prototype.sendMessage = function(params, cb){
	var data = {
		method: 'message',
		params: {
			sid: this.session.sid,
			content: params.message
		}
	};

	// reset session timeout
	this.setSessionTimeout();

	if(this.websocket) {
		if(params.file) {
		// 	// var content = publicUrl+Date.now()+"_"+this.options.pageid+"_"+params.message;
			// data.params.content = params.file;
			// data.params.file = params.file;
			data = toFormData({ file: params.file, filename: params.message, sid: this.session.sid });

			request.upload('https://'+websocketUrl, data, function(err, result) {
				console.error('sendMessage: ', err, result);
				// this.sendData(data);
			});

		} else {
			data.params.content = params.message;
			this.sendData(data);
		}
		return;
	}

	// request.post(this.options.serverUrl, data, function(err, body){
	// 	if(err) {
	// 		this.emit('Error', err, { method: 'sendMessage', params: data });
	// 		if(cb) cb(err);
	// 		return;
	// 	}
	// 	if(cb) cb();
	// });
};

/**
 * Send dialog either to the specified email address (if parameter "to" has passed)
 * or to call center administrator (if parameter "email" has passed)
 *
 * Either
 * @param  {String} to			Destination email address
 *
 * Or
 * @param  {String} email		Sender email address
 * @param  {String} uname		Sender name
 * @param  {String} filename	Attachment filename
 * @param  {String} filedata	Attachment file URL
 *
 * Both
 * @param  {String} text		Email body
 */
WchatAPI.prototype.sendEmail = function(params, cb){
	params.sid = this.session.sid;

	var data = {
		method: 'sendMail',
		params: params
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'sendEmail', params: params });
			if(cb) cb(err);
			return;
		}

		this.emit('chat/send', params);
		if(cb) cb(null, body);
	}.bind(this));
};

/**
 * Send callback request
 * 
 * @param  {String} task - id of the callback task that configured in the Admin Studio
 * @param  {String} phone - User's phone number
 * @param  {Number} time - Timestamp of the call to be initiated
 */
WchatAPI.prototype.requestCallback = function(params, cb){
	params.sid = this.session.sid;

	var data = {
		method: 'requestCallback',
		params: params
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'requestCallback', params: params });
			return cb(err);
		}
		if(cb) cb(null, body.result);
	}.bind(this));
};

/**
 * Disjoin current active session
 * Emits session/disjoin event
 * if request is fulfilled
 *
 * @param {String} sid ID of active session
 */
WchatAPI.prototype.disjoinSession = function(sid){

	var data = {
		method: 'disjoinSession',
		params: {
			sid: sid
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'disjoinSession', params: { sid: sid } });
			return;
		}

		this.emit('session/disjoin', { url: url.href });
	}.bind(this));
};

WchatAPI.prototype.shareOpened = function(){
	var data = {
		method: 'shareOpened',
		params: {
			id: this.session.sharedId,
			url: url.href
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}
};

WchatAPI.prototype.shareClosed = function(){
	var data = {
		method: 'shareClosed',
		params: {
			id: this.session.sharedId,
			url: url.href
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}
};

/**
 * Informs the server that the cobrowsing feature is turned on or off
 * @param  {Boolean} state Represents the state of cobrowsing feature
 * @param  {String} url   Url where the feature's state is changed
 * @return none
 */
WchatAPI.prototype.openShare = function(url){
	var data = {
		method: 'openShare',
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'openShare', params: { state: state } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.setChatTimeout = function(timeout){
	return setTimeout(function (){
		this.emit('chat/timeout');
	}.bind(this), timeout*1000);
};

WchatAPI.prototype.userIsTyping = function(){
	var data = {
		method: 'typing',
		params: {
			sid: this.session.sid
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err){
		if(err) {
			this.emit('Error', err, { method: 'setChatTimeout' });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.updateUrl = function(url){
	var data = {
		method: 'updateUrl',
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'updateUrl', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.linkFollowed = function(url){
	var data = {
		method: 'linkFollowed',
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'linkFollowed', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.detectLanguage = function(frases){
	var storageLang = storage.getState('lang', 'session'),
		availableLangs = [], lang, path;

	// list available languages by translations keys
	for(var key in frases) {
		availableLangs.push(key);
	}

	if(storageLang) {
		lang = storageLang;
	} else if(this.session.lang) {
		lang = this.session.lang;
	} else if(this.session.properties && this.session.properties.lang) {
		lang = this.session.properties.lang;
	} else if(this.session.langFromUrl || (this.session.properties && this.session.properties.langFromUrl)) {

		url.pathname
		.split('/')
		.map(function(item) {
			item = handleAliases(item);
			if(availableLangs.indexOf(item) !== -1) {
				lang = item;
			}

			return item;
		});
	}

	if(!lang) lang = (navigator.language || navigator.userLanguage).split('-')[0];
	if(availableLangs.indexOf(lang) === -1) lang = 'en';

	debug.log('detected lang: ', availableLangs, storageLang, this.session.lang, this.session.langFromUrl, lang);
	this.session.lang = lang;
	return lang;
};

WchatAPI.prototype.getSidFromUrl = function(url) {
	var substr = url.substring(url.indexOf('chatSessionId='));
	substr = substr.substring(substr.indexOf('=')+1);
	return substr;
};

WchatAPI.prototype.createWebsocket = function(host){
    // var protocol = (global.location.protocol === 'https:') ? 'wss:' : 'ws:';
    var protocol = 'wss:';
    var websocket = new WebSocket(protocol + '//'+websocketUrl,'json.api.smile-soft.com'); //Init Websocket handshake

    websocket.onopen = function(e){
        debug.log('WebSocket opened: ', e);
        websocketTry = 1;
        if(!moduleInit) {
        	this.init();
        }
    }.bind(this);
    websocket.onmessage = this.onWebsocketMessage.bind(this);
    websocket.onclose = this.onWebsocketClose.bind(this);
    websocket.onerror = this.onError;

    global.onbeforeunload = function() {
        websocket.onclose = function () {}; // disable onclose handler first
        websocket.close()
    };

    this.websocket = websocket;

}

WchatAPI.prototype.onWebsocketClose = function(e) {
    debug.log('WebSocket closed', e);
    var time = generateInterval(websocketTry);
    setTimeout(function(){
        websocketTry++;
        this.createWebsocket();
    }.bind(this), time);
}

//Reconnection Exponential Backoff Algorithm taken from http://blog.johnryding.com/post/78544969349/how-to-reconnect-web-sockets-in-a-realtime-web-app
function generateInterval (k) {
    var maxInterval = (Math.pow(2, k) - 1) * 1000;
  
    if (maxInterval > 30*1000) {
        maxInterval = 30*1000; // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.
    }
  
    // generate the interval to a random number between 0 and the maxInterval determined from above
    return Math.random() * maxInterval;
}

function handleAliases(alias) {
	var lang = alias;
	if(alias === 'ua') lang = 'uk';
	else if(alias === 'us' || alias === 'gb') lang = 'en';
	return lang;
}

function toFormData(obj) {
	var formData = new FormData();
	Object.keys(obj).map(function(key) {
		if(key === 'file') formData.append(key, obj[key], obj.filename || '');
		else if(key === 'filename') return key;
		else formData.append(key, obj[key]);
		return key;
	});

	debug.log('toFormData: ', obj, formData.get('filename'));

	return formData;
}