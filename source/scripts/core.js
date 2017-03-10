
var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
// var url = require('url').parse(document.URL, true);
var url = window.location;
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
	server: ''
};

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = _.assign(defaults, options || {});

	this.options.serverUrl = this.options.server + '/ipcc/$$$';

	// // Current session state object
	// this.session = {
	// 	sid: null,
	// 	eventTimestamp: 0,
	// 	msgTimestamp: 0,
	// 	entity: undefined,
	// 	chat: null
	// };

	// this.on('session/create', function (result){
	// 	this.session.sid = result.sid;
	// });

	this.on('Error', function (err, params){
		if(err.code === 404) {
			this.sessionTimeout(params);
		}
		debug.error(err, params);
	});

	return this;

}

/**
 * Module initiation
 * Emits module/start event if module started
 */
WchatAPI.prototype.initModule = function(){
	var entity = storage.getState('entity', 'session'),
		sid = storage.getState('sid');

	debug.log('initModule: ', entity, sid);

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(url.href.indexOf('chatSessionId') !== -1) {
		sid = this.getSidFromUrl(url.href);
		storage.saveState('entity', 'agent', 'session');
		storage.saveState('sid', sid);
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
				storage.saveState('sid', sid);
				this.emit('session/continue', { entity: entity, url: url.href });
			}.bind(this));
		} else {
			storage.saveState('entity', 'user', 'session');
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
 * @param 	{String} 	url 	Current full URL
 * @return 	{String}	sid 	New session id
 */
WchatAPI.prototype.createSession = function(pageUrl){
	request.post(this.options.serverUrl, {
		method: 'createSession',
		params: {
			url: (pageUrl || url.href)
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'createSession', params: { pageUrl: pageUrl } });
			return;
		}

		body.result.url = url.href;
		storage.saveState('sid', body.result.sid);
		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(sid, url){
	this.emit('session/join', { sid: sid, url: url });
};

/** 
 * Send/obtain events to/from the server. 
 * Events could be obtained from the server by specifying a timestamp
 * as a starting point from which an events would be obtained
**/
WchatAPI.prototype.updateEvents = function(events, cb){
	var sessionId = storage.getState('sid'), params;
	if(!sessionId) return;
	
	params = {
		method: 'updateEvents',
		params: {
			sid: sessionId,
			timestamp: storage.getState('eventTimestamp', 'cache'),
			events: events
		}
	};
	request.post(this.options.serverUrl, params, function (err, body){
		if(err) {
			this.emit('Error', err, params);
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
	request.post(this.options.serverUrl, {
		method: 'getLanguages',
		params: {
			sid: storage.getState('sid')
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'getLanguages' });
			return cb(err);
		}

		cb(null, body);
	}.bind(this));
};

/**
 * Request chat session
 * 
 * @param  {Object} params - user parameters (name, phone, subject, language, etc.)
 */
WchatAPI.prototype.chatRequest = function(params, cb){
	params.sid = storage.getState('sid');

	debug.log('chatRequest params: ', params);

	request.post(this.options.serverUrl, {
		method: 'chatRequest',
		params: params
	}, function (err, body){
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
			sid: storage.getState('sid'),
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
 * Send message to the agent
 * 
 * @param  {String} text - message content in case of regular message 
 * or dataURL in case of file transfer
 * @param  {String} file - (Optional) file name
 */
WchatAPI.prototype.sendMessage = function(params, cb){
	var data = {
		sid: storage.getState('sid'),
		text: params.message
	};
	if(params.file) data.file = params.file;
	request.post(this.options.serverUrl, {
		method: 'setMessage',
		params: data
	}, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'sendMessage', params: data });
			if(cb) cb(err);
			return;
		}
		if(cb) cb();
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
			sid: storage.getState('sid')
		}
	};
	if(rating) reqParams.params.rating = rating;
	request.post(this.options.serverUrl, reqParams, function (err, body){
		if(err) {
			this.emit('Error', err, reqParams);
			return;
		}
		storage.saveState('chat', false);
		this.emit('chat/close', { rating: rating, url: url.href });
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
	params.sid = storage.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'sendMail',
		params: params
	}, function (err, body){
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
	params.sid = storage.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'requestCallback',
		params: params
	}, function(err, body){
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
	request.post(this.options.serverUrl, {
		method: 'disjoinSession',
		params: {
			sid: sid
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'disjoinSession', params: { sid: sid } });
			return;
		}

		this.emit('session/disjoin', { url: url.href });
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
			sid: storage.getState('sid'),
			url: url
		}
	}, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'switchShareState', params: { state: state } });
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
	// debug.log('user is typing!');
	request.post(this.options.serverUrl, {
		method: 'typing',
		params: {
			sid: storage.getState('sid')
		}
	}, function (err){
		if(err) {
			this.emit('Error', err, { method: 'setChatTimeout' });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.updateUrl = function(url){
	request.post(this.options.serverUrl, {
		method: 'updateUrl',
		params: {
			sid: storage.getState('sid'),
			url: url
		}
	}, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'updateUrl', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.linkFollowed = function(url){
	request.post(this.options.serverUrl, {
		method: 'linkFollowed',
		params: {
			sid: storage.getState('sid'),
			url: url
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'linkFollowed', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.sessionTimeout = function(params) {
	// debug.log('sessionTimeout params: ', params);
	params.url = url.href;
	this.emit('session/timeout', params);
};

WchatAPI.prototype.getSidFromUrl = function(url) {
	var substr = url.substring(url.indexOf('chatSessionId='));
	substr = substr.substring(substr.indexOf('=')+1);
	return substr;
};
