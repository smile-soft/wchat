
var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var url = require('url').parse(document.URL, true);
var _ = require('./lodash');
var inherits = require('inherits');

/**
 * Core module implements main internal functionality
 * 
 * @param  {Object} options Instantiation options that overrides module defaults
 * @return {Object}         Return public API
 */

var defaults = {
	// IPCC server IP address/domain name and port number.
	// ex.: "http://192.168.1.100:8880"
	server: '',
	// Absolute path to the webchat folder on the web server
	// where the website is located
	path: '/wchat/'
};

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = _.assign(defaults, options || {});

	this.options.serverUrl = this.options.server + '/ipcc/$$$';

	// Current session state object
	this.session = {
		sid: null,
		eventTimestamp: 0,
		msgTimestamp: 0,
		entity: undefined,
		chat: null
	};

	this.on('session/create', function (result){
		this.session.sid = result.sid;
		// this.updateUrl(url.href);
	});
	this.on('session/continue', function (result){
		// this.updateUrl(url.href);
	});

	this.on('Error', function (err, params){
		console.log('ERROR: ', err, params);
		if(err.code === 404) {
			this.sessionTimeout(params);
		}
		console.error(err, params);
	});

	return this;

}

/**
 * Module initiation
 * Emits module/start event if module started
 */
WchatAPI.prototype.initModule = function(){
	var entity = this.getState('entity', 'session'),
		sid = this.getState('sid');

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(url.href.indexOf('chatSessionId') !== -1) {
		sid = getSidFromUrl(url.href);
		this.saveState('entity', 'agent', 'session');
		this.saveState('sid', sid);
		this.joinSession(sid);
	} else if(entity === 'agent' && sid) { // In case the cobrowsing session is active
		this.joinSession(sid, url.href);
	} else {

		// In case a session is already initiated 
		// and storage containes sid parameter
		if(sid) {
			this.updateEvents([{ entity: entity, url: url.href }], function (err, result){
				if(err) {
					return;
				}
				this.saveState('sid', sid);
				this.emit('session/continue', { entity: entity });
			}.bind(this));
		} else {
			this.saveState('entity', 'user', 'session');
			// Create new session
			this.createSession(url.href);
		}
	}
};

/**
 * Create session
 * Emits session/create event
 * if initiation is successful
 *
 * @param {String} url Current full URL
 */
WchatAPI.prototype.createSession = function(pageUrl){
	// console.log('createSession, '+this.options.serverUrl);
	request.post(this.options.serverUrl, {
		method: 'createSession',
		params: {
			url: (pageUrl || url.href)
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}

		this.saveState('sid', body.result.sid);
		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(sid, url){
	// this.saveState('shared', true, 'session');
	this.emit('session/join', { sid: sid, url: url });
};

WchatAPI.prototype.updateEvents = function(events, cb){
	var params = {
		method: 'updateEvents',
		params: {
			sid: this.getState('sid'),
			timestamp: this.getState('eventTimestamp', 'cache'),
			events: events
		}
	};
	request.post(this.options.serverUrl, params, function (err, res, body){
		if(err) {
			this.emit('Error', err, params);
			return cb(err); // TODO: handle error
		}

		if(body.result.timestamp > this.getState('eventTimestamp', 'cache')) {
			this.saveState('eventTimestamp', body.result.timestamp, 'cache');
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
 * languages weren't set by administrator
 */
WchatAPI.prototype.getLanguages = function(cb){
	request.post(this.options.serverUrl, {
		method: 'getLanguages',
		params: {
			sid: this.getState('sid')
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}

		cb(null, body);
	}.bind(this));
};

/**
 * Request chat session
 * 
 * @param  {Object} params - user parameters (name, phone, etc.)
 */
WchatAPI.prototype.chatRequest = function(params, cb){
	params.sid = this.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'chatRequest',
		params: params
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			if(cb) cb(err);
			return;
		}

		this.emit('chat/start', body.result);
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
			sid: this.getState('sid'),
			timestamp: this.getState('msgTimestamp')
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}

		if(body.result.messages) {
			this.emit('message/new', body.result);
		} else if(body.result.typing) {
			this.emit('message/typing', body.result);
		}
		this.saveState('msgTimestamp', body.result.timestamp);
		if(cb) cb(null, body.result);
	}.bind(this));
};

/**
 * Send message to the agent
 * 
 * @param  {String} text - message content in case of regular message 
 * or dataURL in case of file transfer
 * @param  {String} file - (Optional) file name
 */
WchatAPI.prototype.sendMessage = function(text, file){
	var params = {
		sid: this.getState('sid'),
		text: text
	};
	if(file) params.file = file;
	request.post(this.options.serverUrl, {
		method: 'setMessage',
		params: params
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}
	});
};

/**
 * Close current chat session
 * 
 * @param  {Number} rating Service rating
 */
WchatAPI.prototype.closeChat = function(rating){
	var reqParams = {
		method: 'closeChat',
		params: {
			sid: this.getState('sid')
		}
	};
	if(rating) reqParams.params.rating = rating;
	request.post(this.options.serverUrl, reqParams, function (err, res, body){
		if(err) {
			this.emit('Error', err, reqParams);
			return;
		}
		this.saveState('chat', false);
		this.emit('chat/close', { rating: rating });
	}.bind(this));
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
	params.sid = this.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'sendMail',
		params: params
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			if(cb) cb(err);
			return;
		}

		this.emit('chat/send', params);
		if(cb) cb(null, body);
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
	request.post(this.options.serverUrl, {
		method: 'disjoinSession',
		params: {
			sid: sid
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}

		this.emit('session/disjoin');
	}.bind(this));
};

/**
 * Informs the server that the cobrowsing feature is turned on or off
 * @param  {Boolean} state Represents the state of cobrowsing feature
 * @param  {String} url   Url where the feature's state is changed
 * @return none
 */
WchatAPI.prototype.switchShareState = function(state, url){
	var method = state ? 'shareOpened' : 'shareClosed';
	request.post(this.options.serverUrl, {
		method: method,
		params: {
			sid: this.getState('sid'),
			url: url
		}
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
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
	// console.log('user is typing!');
	request.post(this.options.serverUrl, {
		method: 'typing',
		params: {
			sid: this.getState('sid')
		}
	}, function (err){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.updateUrl = function(url){
	request.post(this.options.serverUrl, {
		method: 'updateUrl',
		params: {
			sid: this.getState('sid'),
			url: url
		}
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.linkFollowed = function(url){
	request.post(this.options.serverUrl, {
		method: 'linkFollowed',
		params: {
			sid: this.getState('sid'),
			url: url
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.saveState = function(key, value, location){
	this.session[key] = value;
	if(location !== 'cache') {
		storage.set(key, value, location);
	}
	return value;
};

/**
 * Get saved property from localStorage or from session cache
 * @param  {String} key      - item key in storage memory
 * @param  {[type]} location - from where to retrieve item. 
 * Could be either "storage" - from localStorage, or "cache" - from session cache
 * @return {String|Object|Function}          - item value
 */
WchatAPI.prototype.getState = function(key, location){
	if(!location) {
		return (this.session[key] !== undefined && this.session[key] !== null) ? this.session[key] : storage.get(key);
	} else if(location === 'cache') {
		return this.session[key];
	} else {
		return storage.get(key, location);
	}
};

WchatAPI.prototype.removeState = function(key, location) {
	delete this.session[key];
	storage.remove(key);
};

WchatAPI.prototype.sessionTimeout = function(params){
	// console.log('sessionTimeout params: ', params);
	this.emit('session/timeout', params);
};

function getSidFromUrl(url){
	var substr = url.substring(url.indexOf('chatSessionId='));
	substr = substr.substring(substr.indexOf('=')+1);
	return substr;
}
