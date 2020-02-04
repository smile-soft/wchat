var domify = require('domify');
var Core = require('./core');
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
var _ = require('./lodash-fns');
var frases = null;
var cobrowsing = require('./cobrowsing');
var templates = require('./templates');
var WebRTC = require('./webrtc');
var audio = require('./audio-control');
var helpers = require('./helpers');
// var serverUrl = {};
var forms;
var api;
var globalSettings = "WchatSettings";
// Widget dom element
var widget;
var widgetWindow;
var mouseFocused = false;
var windowFocused = false;
var pollTurns = 1;

// Widget initiation options
var defaults = {
	agentRates: 5,
	allowedFileExtensions: [], // Allowed file types for uploading. No restriction if empty array provided. Ex: ['txt', 'gif', 'png', 'jpeg', 'pdf']
	autoStart: true, // Init module on page load
	buttonSelector: "", // DOM element[s] selector that opens a widget
	buttonStyles: {
		backgroundColor: 'rgba(255,255,255)',
		color: 'rgb(70,70,70)'
	},
	channels: [], // list of channels and their settings
	chat: true, // enable chat feature
	clientPath: 'https://cdn.smile-soft.com/wchat/v1/', // absolute path to the clients files. If not set, files requested from defaults.server + defaults.path.
	cobrowsing: false, // [deprecated] enable cobrowsing feature
	concentText: "", // message that contains the text of concent that user should accept in order to start a chat
	emailPattern: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
	hideOfflineButton: false, // hide chat button if widget is offline
	host: window.location.host, // displayed in the email template
	intro: false, // whether or not to ask user to introduce him self before the chat session
	introMessage: "", // message that asks user for introduction
	lang: '', // widget language
	langFromUrl: true, // detect widget language from current url
	listeners: [], // list the events to subscribe for
	maxFileSize: 100, // maximum filesize to upload (MB), if 0 - no restrictions
	offer: false, // greet users on the web page
	path: '/ipcc/webchat/', // absolute path to the wchat folder
	phonePattern: /^\+?\d{9,15}/,
	position: 'right', // button position on the page
	prefix: 'swc', // prefix for CSS classes and ids. 
					// Change it only if the default prefix 
					// matches with existed classes or ids on the website
	reCreateSession: true,
	sounds: true,
	styles: {
		backgroundColor: '#74b9ff',
		color: '#FFFFFF'
	},
	stylesPath: '', // absolute path to the css flie
	themeColor: "",
	title: '',
	translationsPath: '', // absolute path to the translations.json flie
	webrtcEnabled: false,
	widget: true, // whether or not to add widget to the webpage
	widgetWindowName: 'wchat',
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable',
	wsServer: "main.ringotel.net/chatbot/WebChat/"
};

// Current widget state
var widgetState = {
	initiated: false,
	active: false,
	activePane: '',
	state: '', // "online" | "offline" | "timeout",
	share: false,
	sounds: true,
	dialog: [],
	messages: [],
	unreadMessages: false,
	langs: [], // available dialog languages
	timeoutSession: false,
	chatTimeout: null,
	agentIsTypingTimeout: null,
	userIsTypingTimeout: null,
	timerUpdateInterval: null
};

// var dialog = [];
// var messages = [];

// available dialog languages
// var langs = [];
// var currLang = '';
// var sessionTimeout;
// var chatTimeout;


// Widget in a separate window
// Widget panes elements
// var agentIsTypingTimeout;
// var userIsTypingTimeout;
// var timerUpdateInterval;
// var cobrowsingPermissionGiven = false;


var publicApi = {

	initModule: initModule,
	initWidgetState: initWidgetState,
	openWidget: openWidget,
	initChat: initChat,
	initCall: initCall,
	getWidgetElement: getWidgetElement,
	isWebrtcSupported: WebRTC.isSupported,
	getWidgetState: function() {
		return widgetState;
	},
	getEntity: function(){ return api.session.entity; },
	on: function(evt, listener) {
		api.on(evt, listener);
		return this;
	},
	off: function(evt, listener) {
		api.removeListener(evt, listener);
		return this;
	},
	emit: function (evt, listener){
		api.emit(evt, listener);
		return this;
	},
	/**
	 * Set default user credentials.
	 * If "intro" is false, than dialog will start with these credentials.
	 * NOTE: Must be called before initModule method
	 * 
	 * @param {Object} params - User credentials, i.e. "uname", "lang", "phone", "subject"
	 */
	setDefaultCredentials: function(params) {
		defaults.credentials = params;
		return this;
	}
};

module.exports = {
	module: Widget,
	api: publicApi
};

// Initiate the module with the global settings
if(global[globalSettings] && global[globalSettings].autoStart !== false && defaults.autoStart) {
	if(document.readyState === "complete" || document.readyState === "interactive") {
	    Widget(global[globalSettings]);
	} else {
        document.addEventListener('DOMContentLoaded', function() { Widget(global[globalSettings]); }, false);
	}
}

function Widget(options){

	if(widgetState.initiated) return publicApi;

	_.merge(defaults, options || {});

	// _.assign(defaults, options || {});

	// defaults.clientPath = options.clientPath ? options.clientPath : (defaults.clientPath || (defaults.server + defaults.path));
	
	// serverUrl = require('url').parse(defaults.server, true);
	defaults.channels = Array.isArray(defaults.channels) ? defaults.channels : Object.keys(defaults.channels).map(function(key) { var cParams = defaults.channels[key]; cParams.type = key; return cParams; });

	defaults.webcallOnly = (!defaults.chat && !getChannelParams('callback').task && getChannelParams('webcall').hotline);

	debug.log('Widget defaults', defaults, getChannelParams('webcall'));

	api = new Core(defaults, { sid: storage.getState('sid') })
	.on('session/create', onSessionSuccess);

	if(!defaults.webcallOnly) {
		api
		.on('session/timeout', onSessionTimeout)
		.on('session/queue_timeout', onQueueTimeout)
		.on('session/join', onSessionJoinRequest)
		.on('session/joined', onSessionJoin)
		.on('session/disjoin', onSessionDisjoin)
		.on('session/init', onSessionInit);
	}
		
	// .on('chat/languages', function() {
	// 	changeWgState({ state: getWidgetState() });
	// });
	
	// setSessionTimeoutHandler();
	
	// load forms
	request.get('forms_json', defaults.clientPath+'forms.json', function (err, result){
		if(err) return api.emit('Error', err);
		forms = JSON.parse(result).forms;
	});

	addWidgetStyles();
	if(defaults.listeners) setUserListeners(api, defaults.listeners);

	api.emit('module/init');

	return publicApi;
}

function initModule(){
	api.init();
	return publicApi;
}

function initWebrtcModule(opts){
	debug.log('initWebrtcModule: ', opts);
	WebRTC.init(opts);
}

// Session is either created or continues
function onSessionSuccess(){	
	// Wait while translations are loaded
	
	getFrases();

	_.poll(function(){
		debug.log('poll: ', frases);
		return (frases !== null);

	}, function() {
		initSession();

	}, function(){
		
		if(pollTurns < 2) {
			pollTurns++;
			Widget(defaults);
		} else {
			return api.emit('Error', 'Module wasn\'t initiated due to network errors');
		}

	}, 60000);
}

function initSession() {
	
	// if(!defaults.chat && !defaults.webrtcEnabled && !defaults.channels.callback.task) return false;

	var webcallParams = getChannelParams('webcall');
	var lang = defaults.lang || storage.getState('lang', 'session') || detectLanguage(frases);
	var el = null;

	storage.saveState('sid', api.session.sid);
	setStyles();

	api.session.lang = lang
	frases = frases[lang];
	defaults.isIpcc = (api.session.langs !== undefined || api.session.categories !== undefined);
	defaults.sounds = storage.getState('sounds') !== undefined ? storage.getState('sounds', 'session') : defaults.sounds;

	if(widgetState.timeoutSession) {
		el = widget.querySelector('.'+defaults.prefix+'-wg-pane[data-swc-pane="closechat"] a[href="#messages"]');
		if(el) el.innerText = frases.PANELS.CLOSE_CHAT.back;
	}

	widgetState.timeoutSession = false;
	removeWgState('timeout');

	if(api.session.properties) {
		if(api.session.properties.channels && !Array.isArray(api.session.properties.channels)) {
			api.session.properties.channels = Object.keys(api.session.properties.channels).map(function(key){ api.session.properties.channels[key].type = key; return api.session.properties.channels[key]; });
		}
		_.merge(defaults, api.session.properties);
	}

	if(getChannelParams('callback').task) {
		api.on('callback/create', onCallbackRequested);
	}

	if(defaults.widget) {
		api.on('widget/load', initWidget);
	}

	if(defaults.isIpcc) getLanguages();

	debug.log('initSession: ', api, defaults, frases, widgetState.initiated);

	if(widgetState.initiated) return api.emit('session/init', {session: api.session, options: defaults, url: global.location.href });

	if(defaults.chat) {
		api
		.on('chat/close', onChatClose)
		.on('chat/timeout', onChatTimeout)
		.on('message/new', clearUndelivered)
		.on('message/new', newMessage)
		.on('message/typing', onAgentTyping)
		.on('form/submit', onFormSubmit)
		.on('form/reject', closeForm);	
	}

	// if window is not a opened window
	if(defaults.chat && !defaults.external) {
		api.updateUrl(window.location.href);
	}

	if(WebRTC.isSupported() && webcallParams.hotline) {
		if(window.location.protocol === 'https:'){
		// if(window.location.protocol === 'https:' && serverUrl.protocol === 'https:'){
			// set flag to indicate that webrtc feature is supported and enabled
			defaults.webrtcEnabled = true;
			
			webcallParams.sip = webcallParams.sip || { ws_servers: "wss://main.ringotel.net", uri: "sip:0@main.ringotel.net" };

			// set uri with custom caller ID (if defined)
			if(webcallParams.callerid) 
				webcallParams.sip.uri = setCallerId(webcallParams.callerid, webcallParams.sip.uri);

			// set webrtc event handlers
			api.on('webrtc/newRTCSession', function(){
				initCallState('newRTCSession');
			});
			api.on('webrtc/progress', function(e){
				if(e.response.status_code === 180) {
					initCallState('confirmed');
					initCallState('ringing');
				} else {
					initCallState('confirmed');
				}
			});
			api.on('webrtc/addstream', function(){
				initCallState('connected');
			});
			api.on('webrtc/ended', function(){
				initCallState('ended');
			});
			api.on('webrtc/failed', function(e){
				if(e.cause === 'Canceled'){
					initCallState('canceled');
				} else {
					initCallState('failed');
				}
			});

			// ringTone audio element plays ringTone sound when calling to agent
			// ringTone = document.createElement('audio');
			// ringTone.src = defaults.clientPath+'sounds/ringout.wav';
			// document.body.appendChild(ringTone);

			// initiate webrtc module with parameters
			initWebrtcModule({
				sip: webcallParams.sip,
				emit: publicApi.emit,
				on: publicApi.on
			});
		} else {
			// webrtc is supported by the browser, but the current web page
			// is located on insecure origins, therefore the webrtc is not supported
			debug.warn('WebRTC feature is disabled');
			debug.warn('getUserMedia() no longer works on insecure origins. To use this feature, you should consider switching your application to a secure origin, such as HTTPS. See https://goo.gl/rStTGz for more details.');
		}
	}

	if(defaults.webcallOnly && !defaults.webrtcEnabled) return;
	
	if(defaults.buttonSelector) setHandlers(defaults.buttonSelector);

	defaults.channels = addChannelsParams(defaults.channels);
	defaults.channelsObject = defaults.channels.reduce(function(result, item) { result[item.type] = item; return result; }, {});

	debug.log('initSession 1: ', api.session, defaults.widget, widgetState.initiated, isBrowserSupported());

	// Enabling audio module
	audio.init(defaults.clientPath+'sounds/');

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget(defaults);
	}

	// If timeout was occured, init chat after a session is created
	if(hasWgState('timeout')) {
		removeWgState('timeout');
	}

	api.emit('session/init', {session: api.session, options: defaults, url: global.location.href });
}

function onSessionInit(params){
	debug.log('session/init', params);

	storage.saveState('init', true, 'session');
	removeWgState('timeout');
	
	if(widgetWindow && !widgetWindow.closed) widgetWindow.sessionStorage.setItem(defaults.prefix+'.init', true);
}

function requestBrowserAccess() {
	newMessage({
		from: storage.getState('aname', 'session'),
		time: Date.now(),
		content: "{request_browser_access}"
	});
}

function onSessionJoinRequest(params){
	debug.log('onSessionJoinRequest', storage.getState('shared', 'session'));
	if(!storage.getState('shared', 'session')) {
		requestBrowserAccess();
	} else {
		joinSession(params);
	}
}

function joinSession(params) {
	api.shareOpened(); // send confirmation to agent
	onSessionJoin(params);
}

// send shared event to the user's browser
function onSessionJoin(params){
	initCobrowsingModule({ url: params.url, entity: api.session.entity });
}

function onSessionDisjoin() {
	cobrowsing.unshare();
}

function initCobrowsingModule(params){
	// init cobrowsing module only on main window
	if(defaults.external || cobrowsing.isInitiated()) return;

	api.on('cobrowsing/init', function(){
		cobrowsing.share();
		// cobrowsing.emitEvents();
	});

	api.on('cobrowsing/update', function(params){
		cobrowsing.updateEvents(params);
	});

	api.on('cobrowsing/event', function(params){
		api.updateEvents(params.events)
	});

	api.on('cobrowsing/shared', function(){
		storage.saveState('shared', true, 'session');
	});

	api.on('cobrowsing/unshared', function(params){
		storage.saveState('shared', false, 'session');
	});
	
	cobrowsing.init({
		widget: params.widget,
		entity: params.entity,
		emit: publicApi.emit,
		path: defaults.clientPath
	});
}

function getWidgetElement(){
	return widget;
}

function getLanguages(){
	api.getLanguages(function (err, langs){
		debug.log('getLanguages: ', err, langs);
		if(err) return;
		if(langs) onNewLanguages(langs);
		// getLanguagesTimeout = setTimeout(getLanguages, defaults.checkStatusTimeout*1000);
	});
}

function getFrases() {
	// load translations
	request.get('frases', (defaults.translationsPath || defaults.clientPath)+'translations.json', function (err, result){
		if(err) return api.emit('Error', err);
		frases = JSON.parse(result);
	});
}

function onNewLanguages(languages){
	// debug.log('languages: ', languages);
	var state = languages.length ? 'online' : 'offline';

	widgetState.langs = languages;

	// if(hasWgState(state)) return;
	// if(widgetState.state === state) return;

	// changeWgState({ state: state });
	// api.emit('chat/languages', languages);
}

function initWidget(){
	var options = '',
		wgState = (defaults.webcallOnly ? 'online' : getWidgetState()),
		introForm = global[defaults.prefix+'IntroForm'],
		selected;

	// debug.log('Init widget!');
	widgetState.initiated = true;

	setListeners(widget);
	changeWgState({ state: wgState });

	if(defaults.hideOfflineButton) {
		addWgState('no-button');
	}

	if(defaults.offer) {
		setOffer();
	}

	// if chat started
	if(storage.getState('chat', 'session') === true) {
		requestChat(storage.getState('credentials', 'session') || {});
		if(storage.getState('opened', 'session')) showWidget();
		// initChat();
	}

	// if webrtc supported by the browser and webcall parameters is set - change button icon
	if(defaults.webrtcEnabled) {
		addWgState('webrtc-enabled');
	}

	if(defaults.buttonStyles.view === 'box') {
		addWgState('button-view-box');
	}

	if(widget && defaults.intro && defaults.intro.length) {
		// Add languages to the template
		widgetState.langs.forEach(function(lang) {
			if(frases && frases.lang) {
				selected = lang === api.session.lang ? 'selected' : '';
				options += '<option value="'+lang+'" '+selected+' >'+frases.lang+'</option>';
			}
		});
		
		if(introForm.lang) introForm.lang.innerHTML = options;
	}

	// Widget is initiated
	api.emit('widget/init');
}

function loadWidget(params){
	
	compiled = compileTemplate('widget', {
		defaults: params,
		languages: widgetState.langs,
		translations: frases,
		credentials: storage.getState('credentials', 'session') || {},
		_: _
	});

	// Widget variable assignment
	widget = domify(compiled);
	document.body.appendChild(widget);
	api.emit('widget/load', widget);
	debug.log('loadWidget', params);
}

function setOffer() {
	setTimeout(function() {
		showOffer({
			from: defaults.offer.from || frases.TOP_BAR.title,
			time: Date.now(),
			content: defaults.offer.text || frases.default_offer
		});
	}, defaults.offer.inSeconds ? defaults.offer.inSeconds*1000 : 30000);
}

function showOffer(message) {
	// Return if user already interact with the widget
	if(!hasWgState('online') || isInteracted()) return;
	newMessage(message);
	// newMessage({ messages: [message] });
}

function setInteracted(){
	if(!storage.getState('interacted', 'session')) {
		storage.saveState('interacted', true, 'session');
	}
}

function isInteracted(){
	return storage.getState('interacted', 'session');
}

function initChat(params){
	showWidget();

	debug.log('initChat', params, storage.getState('chat', 'cache'));

	// // if chat already started and widget was minimized - just show the widget
	if(storage.getState('chat', 'cache')) return;

	if(isOffline()) {
		switchPane('sendemail');
	} else if(widgetState.timeoutSession) {
		api.createSession()
		api.once('session/init', function() {
			if(api.session.langs.length) {
				initChat(params);
			}
		})
	} else if(defaults.intro && defaults.intro.length) {
		if(storage.getState('chat', 'session') || storage.getState('credentials', 'session')) {
			requestChat(storage.getState('credentials', 'session') || {});
		} else {
			switchPane('credentials');
		}
	} else if(defaults.credentials) {
		requestChat(defaults.credentials);
	} else {
		requestChat({ lang: api.session.lang, message: (params ? params.message : null) });
	}
}

function requestChat(credentials){
	var chatStarted = storage.getState('chat', 'session');
	var agentid = storage.getState('aid', 'session');
	var message = credentials.message;
	var saveParams = {};

	if(credentials.phone) credentials.phone = helpers.formatPhoneNumber(credentials.phone);
	if(agentid) credentials.agentid = agentid;

	// Save user language based on preferable dialog language
	// if(credentials.lang && credentials.lang !== currLang ) {
	// 	storage.saveState('lang', credentials.lang, 'session');
	// }
	if(!credentials.lang) {
		credentials.lang = api.session.lang;
	}
	
	saveParams = extend({}, credentials);
	delete saveParams.message;

	// Save credentials for current session
	// It will be removed on session timeout
	storage.saveState('credentials', saveParams, 'session');

	api.chatRequest(credentials);

	setTimeout(function() {
		debug.log('requestChat: ', credentials.message, chatStarted);

		if(message && !chatStarted) {
			sendMessage({
				message: credentials.message
			});
		}
	}, 500);

	startChat(api.session);
	clearWgMessages();
	switchPane('messages');
}

function startChat(params){
	var timeout = params.answerTimeout;

	storage.saveState('chat', true, 'session');
	
	debug.log('startChat timeout: ', timeout);

	if(timeout) {
		widgetState.chatTimeout = setTimeout(onChatTimeout, timeout*1000);
	}

	addWgState('chat');
	setTimeout(function() {focusOnElement(document.getElementById("swc-message-text"))}, 1000);
}

function sendMessage(params){
	api.sendMessage(params);

	newMessage({
		from: (storage.getState('credentials', 'session').uname || api.session.sid),
		time: Date.now(),
		content: params.message,
		fileData: params.file
		// hidden: true
		// className: defaults.prefix+'-msg-undelivered'
	});

	// if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(message){
	debug.log('new messages arrived!', message);

	var str,
		els = [],
		text,
		compiled,
		playSound = false,
		lastmsg = null;
		sequence = message.sequence ? message.sequence.split('/') : [1,1],
		// defaultUname = false,
		credentials = storage.getState('credentials', 'session') || {},
		aname = storage.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : api.session.sid,
		messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	// if(uname === storage.getState('sid').split('_')[0]) {
	// 	defaultUname = true;
	// }

	// result.messages.forEach(function(message, index) {
		
		message.entity = message.entity || ((message.from === uname || message.from === undefined) ? 'user' : 'agent');
		// message.from = (message.entity === 'user' && defaultUname) ? frases.default_user_name : message.from;
		message.from = message.entity === 'user' ? '' : message.from;
		message.time = message.time ? parseTime(message.time) : parseTime(Date.now());

		// text = parseMessage(message.content, message.file, message.entity);
		text = parseMessage(message);

		if(text.type === 'form') {

			compiled = compileTemplate('forms', {
				defaults: defaults,
				message: message,
				form: text.content,
				credentials: credentials,
				frases: frases,
				_: _
			});

			if(global[text.content.name]) closeForm({ formName: text.content.name });
			messagesCont.insertAdjacentHTML('beforeend', '<li>'+compiled+'</li>');
			messagesCont.scrollTop = messagesCont.scrollHeight;
		} else {
			if(!message.content) return;
			message.content = text.content;
			compiled = compileTemplate('message', { defaults: defaults, message: message });
			messagesCont.insertAdjacentHTML('beforeend', '<li '+(message.className ? 'class="'+message.className+'"' : '' )+'>'+compiled+'</li>');

			lastmsg = compiled;

			// Need for sending dialog to email
			if(!message.hidden) {
				widgetState.dialog.push(compiled);
				widgetState.messages.push(message);
			}
		}

		// Save agent name
		if(message.entity === 'agent') {
			if(aname !== message.from) storage.saveState('aname', message.from, 'session');
			if(message.agentid) storage.saveState('aid', message.agentid, 'session');
			if(message.from) clearTimeout(widgetState.chatTimeout);
		}

		if(message.entity !== 'user') playSound = true;

	// });

	if(sequence && (sequence[0] == sequence[1])) {
		if(lastmsg) onLastMessage(lastmsg);
		messagesCont.scrollTop = messagesCont.scrollHeight;
		if(playSound) playNewMsgTone();
	}

	if(!windowFocused) widgetState.unreadMessages = true;

}

function onReadMessages() {
	if(widgetState.unreadMessages) {
		api.userReadMessages();
		widgetState.unreadMessages = false;
	}
}

function clearUndelivered(){
	var undelivered = [].slice.call(document.querySelectorAll('.'+defaults.prefix+'-msg-undelivered'));
	if(undelivered && undelivered.length) {
		undelivered.forEach(function(msg){
			msg.classList.add(defaults.prefix+'-hidden');
		});
	}
}

function triggerSounds() {
	var icon = document.querySelector('.'+defaults.prefix+'-trigger-sounds-btn span');
	defaults.sounds = !defaults.sounds;
	icon.className = defaults.sounds ? (defaults.prefix+'-icon-notifications') : (defaults.prefix+'-icon-notifications_off');
	storage.saveState('sounds', defaults.sounds, 'session');
}

function playNewMsgTone() {
	if(defaults.sounds)
		audio.play('new_message');
}

/**
 * Visual notification about a new message fomr agent.
 * It is also used for offer notification
 * 
 * @param  {String} message - New message content 
 */
function onLastMessage(message){
	var lastMsg;
	if(!widgetState.active) {
		lastMsg = document.getElementById(defaults.prefix+'-lastmsg');

		// PrefixedEvent(lastMsg, 'animationend', ["webkit", "moz", "MS", "o", ""], function(e) {
		// 	btn.children[0].style.height = e.target.scrollHeight + 'px';
		// });

		lastMsg.innerHTML = message;
		// changeWgState({ state: 'notified' });
		addWgState('notified');
		// setButtonStyle('notified');

	}
}

function compileEmail(content, cb) {
	var compiled = compileTemplate('email', {
		defaults: defaults,
		content: content,
		frases: frases,
		_: _
	});

	if(cb) return cb(null, compiled);
}

function sendDialog(params){
	var dialogStr = params.text.join('');
	compileEmail(dialogStr, function(err, result) {
		if(err) return;
		params.text = result;
		api.sendEmail(params);
	});
}

function sendComplain(params){
	var body = [];
	// TODO: explain...
	var complain = compileTemplate('message', {
		defaults: defaults,
		message: {
			from: frases.EMAIL_SUBJECTS.complain+' '+params.email,
			content: params.text,
			entity: '',
			time: ''
		}
	});

	body = body.concat(
		complain,
		'<br><p class="h1">'+frases.EMAIL_SUBJECTS.dialog+' '+defaults.host+'</p><br>',
		widgetState.dialog
	).reduce(function(prev, curr) {
		return prev.concat(curr);
	});

	compileEmail(body, function(err, result) {
		if(err) return;
		params.text = result;
		api.sendEmail(params);
	});
}

function sendRequest(params, cb) {
	// TODO: explain...
	var msg = compileTemplate('message', {
		defaults: defaults,
		message: {
			from: frases.EMAIL_SUBJECTS.request+' '+params.uname+' ('+params.email+')',
			content: params.text,
			entity: '',
			time: ''
		}
	});

	// compileEmail(msg, function(err, result) {
		// if(err) return;
		// params.text = result;
		api.sendEmail(params);
		if(cb) cb();
	// });
}

function submitSendMailForm(form, data) {
	var params = {},
		file;

	if(!data.email) {
		alert(frases.ERRORS.email);
		return;
	}

	data.subject = frases.EMAIL_SUBJECTS.request+' '+data.email;

	if(data.file) {
		file = getFileContent(form.file, function(err, result) {
			if(!err) {
				data.filename = result.filename;
				data.filedata = result.filedata;
			} else {
				if(frases.ERRORS[err]) alert(frases.ERRORS[err])
				return debug.warn('File wasn\'t sent');
			}
			delete data.file;
			sendRequest(data, function() {
				form.reset();
				closeWidget();
			});
		});
	} else {
		sendRequest(data, function() {
			form.reset();
			closeWidget();
		});
	}
}

function submitCloseChatForm(form, data){
	var rating = (data && data.rating) ? parseInt(data.rating, 10) : null;
	if(data && data.sendDialog) {
		if(!data.email) {
			alert(frases.ERRORS.email);
			return;
		}
		
		sendDialog({
			to: data.email,
			subject: frases.EMAIL_SUBJECTS.dialog+' '+defaults.host,
			text: widgetState.dialog
		});
	}
	if(data && data.text) {
		if(!data.email) {
			alert(frases.ERRORS.email);
			return;
		} else {
			
			sendComplain({
				email: data.email,
				subject: frases.EMAIL_SUBJECTS.complain+' '+data.email,
				text: data.text
			});
		}
	}
	// if(chatTimeout) clearTimeout(chatTimeout);
	if(form) {
		form.reset();
	}
	
	debug.log('submitCloseChatForm', data);
	closeChat(rating);
	closeWidget();
}

function closeChat(rating) {
	storage.saveState('chat', false, 'session');
	api.closeChat(rating);
	removeWgState('chat');

	if(storage.getState('shared', 'session')) {
		api.shareClosed(global.location.href);
		cobrowsing.unshare();
	}
}

function onChatClose(){
	if(storage.getState('shared', 'session')) cobrowsing.unshare();
}

function onCloseChatFormChange(e) {
	var form = e.currentTarget;
	var el = e.target;
	// if(el.name === 'rating') {
	// 	_.forEach(form.rating, function(rateEl) {
	// 		if(parseInt(rateEl.value, 10) < parseInt(el.value, 10)) rateEl.parentNode.classList.add('active');
	// 		else rateEl.parentNode.classList.remove('active');
	// 	})
	// }

}

function onChatTimeout(){
	debug.log('chat timeout!');
	// switchPane('closechat');
	// storage.saveState('chat', false, 'session');

	newMessage({
		from: "",
		time: Date.now(),
		content: "{queue_overload}"
	});

	var form = global['queue_overload'];
	if(form) form.text.value = widgetState.messages.reduce(function(str, item){ if(item.entity === 'user') {str += (item.content+"\n")} return str; }, "");
}

function onAgentTyping(){
	// debug.log('Agent is typing!');
	if(!widgetState.agentIsTypingTimeout) {
		addWgState('agent-typing');
	}
	clearTimeout(widgetState.agentIsTypingTimeout);
	widgetState.agentIsTypingTimeout = setTimeout(function() {
		widgetState.agentIsTypingTimeout = null;
		removeWgState('agent-typing');
		// debug.log('agent is not typing anymore!');
	}, 5000);
}

function onQueueTimeout() {
	storage.saveState('chat', false, 'session');
	widgetState.timeoutSession = true;
	changeWgState({ state: 'timeout' });
}

function onSessionTimeout(){
	debug.log('Session timeout:');
	var el = widget.querySelector('.'+defaults.prefix+'-wg-pane[data-swc-pane="closechat"] a[href="#messages"]');
	if(el) el.innerText = frases.PANELS.CLOSE_CHAT.new_chat;

	if(storage.getState('chat', 'session') === true) {
		storage.saveState('chat', false, 'session');
		switchPane('closechat');
	}

	widgetState.timeoutSession = true;
	changeWgState({ state: 'timeout' });

}

function initCall(){
	switchPane('callAgent');
	WebRTC.audiocall(getChannelParams('webcall').hotline);
	// WebRTC.audiocall('sip:'+channels.webcall.hotline+'@'+serverUrl.host);
}

function initFallbackCall(){
	switchPane('callAgentFallback');
}

function initCallback(){
	switchPane('callback');
}

function setCallback(){
	var form = document.getElementById(defaults.prefix+'-callback-settings'),
		formData = getFormData(form),
		cbSpinner = document.getElementById(defaults.prefix+'-callback-spinner'),
		cbSent = document.getElementById(defaults.prefix+'-callback-sent'),
		valid = validateForm(form);
	
	if(!valid) return false;

	formData.phone = formData.phone ? helpers.formatPhoneNumber(formData.phone) : null;

	// if(!formData.phone || formData.phone.length < 10) {
	// 	return alert(frases.ERRORS.tel);
	// }

	if(formData.time) {
		formData.time = parseFloat(formData.time);
		if(formData.time <= 0) return;
		formData.time = Date.now() + (formData.time * 60 * 1000);
	}
	formData.task = getChannelParams('callback').task;
	debug.log('setCallback data: ', formData);

	// form.classList.add(defaults.prefix+'-hidden');
	// cbSpinner.classList.remove(defaults.prefix+'-hidden');

	api.requestCallback(formData);
	switchPane('callbackSent');

	form.reset();
}

function onCallbackRequested() {
	var form = document.getElementById(defaults.prefix+'-callback-settings'),
		cbSpinner = document.getElementById(defaults.prefix+'-callback-spinner');

	cbSpinner.classList.add(defaults.prefix+'-hidden');
	form.classList.remove(defaults.prefix+'-hidden');

	if(err) return;
	
	switchPane('callbackSent');
}

function initCallState(state){
	debug.log('initCallState: ', state);

	var spinner = document.getElementById(defaults.prefix+'-call-spinner'),
		info = document.getElementById(defaults.prefix+'-call-info'),
		textState = document.getElementById(defaults.prefix+'-call-state'),
		timer = document.getElementById(defaults.prefix+'-call-timer'),
		tryAgain = document.getElementById(defaults.prefix+'-tryagain-btn');

	if(state === 'newRTCSession') {
		initCallState('oncall');

	} else if(state === 'confirmed') {
		textState.innerText = frases.PANELS.AUDIO_CALL.calling_agent;
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.add(defaults.prefix+'-hidden');

	} else if(state === 'ringing') {
		setTimer(timer, 'init', 0);
		timer.classList.remove(defaults.prefix+'-hidden');
		// audio.play('ringout_loop', true);

	} else if(state === 'connected') {
		textState.innerText = frases.PANELS.AUDIO_CALL.connected_with_agent;
		setTimer(timer, 'start', 0);
		audio.stop();

	} else if(state === 'ended') {
		textState.innerText = frases.PANELS.AUDIO_CALL.call_ended;
		setTimer(timer, 'stop');
		initCallState('oncallend');
		
	} else if(state === 'failed' || state === 'canceled') {
		if(state === 'failed') {
			textState.innerText = frases.PANELS.AUDIO_CALL.call_failed;
		} else {
			textState.innerText = frases.PANELS.AUDIO_CALL.call_canceled;
		}
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		timer.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.remove(defaults.prefix+'-hidden');
		initCallState('oncallend');
		audio.play('busy');

	} else if(state === 'oncall') {
		window.onbeforeunload = function(){
			return 'Your connection is in progress. Do you realy want to close it?';
		};
		storage.saveState('call', true, 'cache');
		addWgState('webrtc-call');

	} else if(state === 'oncallend') {
		window.onbeforeunload = null;
		storage.saveState('call', false, 'cache');
		removeWgState('webrtc-call');
		// stopRingTone();

	} else if('init') {
		info.classList.add(defaults.prefix+'-hidden');
		spinner.classList.remove(defaults.prefix+'-hidden');
		tryAgain.classList.add(defaults.prefix+'-hidden');
	}
}

function setTimer(timer, state, seconds){
	var time = seconds;
	if(state === 'start') {
		widgetState.timerUpdateInterval = setInterval(function(){
			time = time+1;
			timer.textContent = convertTime(time);
		}, 1000);
	} else if(state === 'stop') {
		clearInterval(widgetState.timerUpdateInterval);
	} else if(state === 'init') {
		timer.textContent = convertTime(0);
	}
}

function endCall(){
	if(WebRTC.isEstablished() || WebRTC.isInProgress()) {
		WebRTC.terminate();
	} else {
		closeWidget();
		initCallState('init');
	}
}

// function playRingTone(){
// 	if(ringToneInterval) return;
// 	ringToneInterval = setInterval(function(){
// 		ringTone.play();
// 	}, 3000);
// }

// function stopRingTone(){
// 	clearInterval(ringToneInterval);
// }

/**
 * Open web chat widget in a new window
 */
function openWidget(e){
	if(e) e.preventDefault();

	var opts = {};
	
	if(!widgetWindow || widgetWindow.closed) {

		opts = _.merge(opts, defaults);

		opts.widget = true;
		// set external flag to indicate that the module loads not in the main window
		opts.external = true;

		widgetWindow = window.open('', defaults.widgetWindowName, defaults.widgetWindowOptions);
		widgetWindow = constructWindow(widgetWindow);
		// widgetWindow[globalSettings] = opts;

		// widgetWindow.sessionStorage.setItem('wchat_options', JSON.stringify(opts));

		// Wait while the script is loaded, 
		// then init module in the child window
		_.poll(function(){
			return widgetWindow.Wchat !== undefined;
		}, function(){
			widgetWindow.Module = widgetWindow.Wchat(opts);
			widgetWindow.Module.on('widget/init', function(){
				widgetWindow.Module.initWidgetState();
			});
			
			/* 
			* Proxy all events that is emitted in the child window
			* to the main window, but with the 'window/' prefix before the event name.
			* So, for example, 'chat/start' event in the child window,
			* would be 'window/chat/start' in the main window 
			*/
			_.forEach(api._events, function(value, key, coll){
				widgetWindow.Module.on(key, function(params){
					params.url = global.location.href;
					api.emit('window/'+key, params);
				});
			});

			// widgetWindow.Module.initModule();

		}, function(){
			console.warn('Wchat module was not initiated due to network connection issues.');
		}, 120000);
		
		widgetWindow.onbeforeunload = function(){
			//close chat if user close the widget window
			//without ending a dialog
			if(storage.getState('chat', 'session')) closeChat();
		};
	}
	if(widgetWindow.focus) widgetWindow.focus();
}

function constructWindow(windowObject){
	var loader,
	script,
	link,
	charset,
	viewport,
	title,
	loaderElements = windowObject.document.createElement('div'),
	loaderStyles = createStylesheet(windowObject, 'swc-loader-styles'),
	head = windowObject.document.getElementsByTagName('head')[0],
	body = windowObject.document.getElementsByTagName('body')[0];

	loaderElements.className = "swc-widget-loader";
	loaderElements.innerHTML = "<span></span><span></span><span></span>";

	viewport = windowObject.document.createElement('meta');
	viewport.name = 'viewport';
	viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';

	charset = windowObject.document.createElement('meta');
	charset.setAttribute('charset', 'utf-8');

	title = windowObject.document.createElement('title');
	title.textContent = frases.TOP_BAR.title;

	// loader = windowObject.document.createElement('script');
	// loader.src = defaults.clientPath+'loader.js';

	script = windowObject.document.createElement('script');
	script.src = defaults.clientPath+'wchat.min.js';
	script.charset = 'UTF-8';

	head.appendChild(viewport);
	head.appendChild(charset);
	head.appendChild(title);
	head.appendChild(loaderStyles);
	head.appendChild(script);

	body.id = 'swc-wg-window';
	body.appendChild(loaderElements);
	// body.appendChild(loader);

	addLoaderRules(head.getElementsByTagName('style')[0]);

	return windowObject;
}

function createStylesheet(windowObject, id){
	// Create the <style> tag
		var style = windowObject.document.createElement("style");
		style.type = 'text/css';
		if(id) style.id = id;

		// WebKit hack :(
		style.appendChild(windowObject.document.createTextNode(""));

		return style;
}

function addLoaderRules(style){
	var theRules = [
		"body { margin:0; background-color: #eee; }",
		"@keyframes preloading {",
			"0 { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
			"50% { transform: translate(0,15px); -webkit-transform: translate(0,15px); -moz-transform: translate(0,15px); -ms-transform: translate(0,15px); -o-transform: translate(0,15px); }",
			"100% { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
		"}",
		"@-webkit-keyframes preloading {",
			"0 { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
			"50% { transform: translate(0,15px); -webkit-transform: translate(0,15px); -moz-transform: translate(0,15px); -ms-transform: translate(0,15px); -o-transform: translate(0,15px); }",
			"100% { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
		"}",
		"@-moz-keyframes preloading {",
			"0 { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
			"50% { transform: translate(0,15px); -webkit-transform: translate(0,15px); -moz-transform: translate(0,15px); -ms-transform: translate(0,15px); -o-transform: translate(0,15px); }",
			"100% { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
		"}",
		"@-ms-keyframes preloading {",
			"0 { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
			"50% { transform: translate(0,15px); -webkit-transform: translate(0,15px); -moz-transform: translate(0,15px); -ms-transform: translate(0,15px); -o-transform: translate(0,15px); }",
			"100% { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
		"}",
		"@-o-keyframes preloading {",
			"0 { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
			"50% { transform: translate(0,15px); -webkit-transform: translate(0,15px); -moz-transform: translate(0,15px); -ms-transform: translate(0,15px); -o-transform: translate(0,15px); }",
			"100% { transform: translate(0,0); -webkit-transform: translate(0,0); -moz-transform: translate(0,0); -ms-transform: translate(0,0); -o-transform: translate(0,0); }",
		"}",
		".swc-widget-loader {",
			"position: absolute;",
			"width: 100%;",
			"top: 50%;",
			"margin-top: -18px;",
			"text-align: center;",
		"}",
		".swc-widget-loader span {",
			"display: inline-block;",
			"width: 18px;",
			"height: 18px;",
			"border-radius: 50%;",
			"background-color: #fff;",
			"margin: 3px;",
		"}",
		".swc-widget-loader span:nth-last-child(1) { -webkit-animation: preloading .8s .1s linear infinite; -moz-animation: preloading .8s .1s linear infinite; -ms-animation: preloading .8s .1s linear infinite; -o-animation: preloading .8s .1s linear infinite; animation: preloading .8s .1s linear infinite; }",
		".swc-widget-loader span:nth-last-child(2) { -webkit-animation: preloading .8s .3s linear infinite; -moz-animation: preloading .8s .3s linear infinite; -ms-animation: preloading .8s .3s linear infinite; -o-animation: preloading .8s .3s linear infinite; animation: preloading .8s .3s linear infinite; }",
		".swc-widget-loader span:nth-last-child(3) { -webkit-animation: preloading .8s .5s linear infinite; -moz-animation: preloading .8s .5s linear infinite; -ms-animation: preloading .8s .5s linear infinite; -o-animation: preloading .8s .5s linear infinite; animation: preloading .8s .5s linear infinite; }",
	].join(" ");

	style.innerHTML = theRules;
}

/**
 * Set Widget event listeners
 * @param {DOMElement} widget - Widget HTML element
 */
function setListeners(widget){
	// var sendMsgBtn = document.getElementById(defaults.prefix+'-send-message'),
	var fileSelect = document.getElementById(defaults.prefix+'-file-select');
	var textField = document.getElementById(defaults.prefix+'-message-text');
	var inputs = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-inputfile'));
	var btn = document.getElementById(defaults.prefix+'-btn-cont');
	var panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	var messagesCont = document.getElementById(defaults.prefix+'-messages-cont');
	var closeChatForm = document.getElementById(defaults.prefix+'-closechat-form');

	inputs.forEach(function(input){
		var label = input.nextElementSibling,
			labelVal = label.textContent;

		addEvent(input, 'change', function(e){
			var fileName = e.target.value.split( '\\' ).pop();
			if(fileName)
				label.textContent = fileName;
			else
				label.textContent = labelVal;
		});
	});

	addEvent(btn, 'click', btnClickHandler);
	addEvent(widget, 'click', wgClickHandler);
	addEvent(widget, 'submit', wgSubmitHandler);
	// addEvent(sendMsgBtn, 'click', wgSendMessage);
	addEvent(fileSelect, 'change', wgSendFile);
	addEvent(textField, 'keypress', wgTypingHandler);
	addEvent(textField, 'focus', wgTextareaFocusHandler);
	addEvent(textField, 'blur', wgTextareaBlurHandler);

	addEvent(global, 'DOMMouseScroll', wgGlobalScrollHandler, { passive: false });
	addEvent(global, 'wheel', wgGlobalScrollHandler, { passive: false });
	// window.ontouchmove  = wgGlobalScrollHandler; // mobile

	addEvent(widget, 'mouseenter', onMouseEnter);
	addEvent(widget, 'mouseleave', onMouseLeave);
	
	addEvent(window, 'focus', onWindowFocus);
	addEvent(window, 'blur', onWindowBlur);

	addEvent(closeChatForm, 'change', onCloseChatFormChange);

	// if(defaults.buttonElement) 
	// 	defaults.buttonElement.addEventListener('click', publicApi.openWidget, false);
}

function setHandlers(selector) {
	var fn = defaults.widget ? initWidgetState : openWidget;
	var els = [].slice.call(document.querySelectorAll(selector));
	els.map(function(el) { addEvent(el, 'click', fn); return el; });
}

function setUserListeners(api, array) {
	var apiObj = { options: defaults, session: api.session };
	apiObj = extend(apiObj, publicApi);
	array.forEach(function(item) { api.on(item.name, function(params){ item.handler(params, apiObj); }); });
}

/********************************
 * Widget event handlers *
 ********************************/

function onMouseEnter() {
	mouseFocused = true;
}

function onMouseLeave() {
	mouseFocused = false;
}

function onWindowFocus() {
	windowFocused = true;
	onReadMessages();
}

function onWindowBlur() {
	windowFocused = false;
}

function wgClickHandler(e){
	var targ = e.target,
		handler,
		pane,
		href,
		dataHref;

	if(targ.parentNode.tagName === 'A' || targ.parentNode.tagName === 'BUTTON')
		targ = targ.parentNode;
	
	handler = targ.getAttribute('data-'+defaults.prefix+'-handler');
	dataHref = targ.getAttribute('data-'+defaults.prefix+'-link');

	if(handler === 'closeWidget') {
		closeWidget();
	} else if(handler === 'finish') {
		if(defaults.isIpcc && storage.getState('chat', 'session')) {
			switchPane('closechat');
		} else {
			closeChat();
			closeWidget();
		}
		
	} else if(handler === 'triggerSounds') {
		triggerSounds();
	} else if(handler === 'sendMessage') {
		wgSendMessage();
	} else if(handler === 'openWindow') {
		openWidget();
	} else if(handler === 'rejectForm') {
		api.emit('form/reject', { formName: _.findParent(targ, 'form').name });
	} else if(handler === 'initCall') {
		initCall();
	} else if(handler === 'initFallbackCall') {
		initFallbackCall();
	} else if(handler === 'initCallback') {
		initCallback();
	} else if(handler === 'setCallback') {
		setCallback();
	} else if(handler === 'initChat') {
		initChat();
	} else if(handler === 'endCall') {
		endCall();
	}

	if(targ.tagName === 'A') {
		href = targ.href;

		if(dataHref) {
			api.linkFollowed(dataHref);
		} else if(href.indexOf('#') !== -1) {
			e.preventDefault();
			pane = href.substring(targ.href.indexOf('#')+1);
			if(pane) switchPane(pane);
		}
	}
}

function btnClickHandler(e){
	e.preventDefault();
	var targ = e.target,
		closeBtnId = defaults.prefix+'-unnotify-btn';
		currTarg = e.currentTarget;

	// remove notification of a new message
	if(targ.id === closeBtnId || targ.parentNode.id === closeBtnId) {
		removeWgState('notified');
		// reset button height
		// resetStyles(btn.children[0]);
		// setButtonStyle(widgetState.state);
		return;
	}

	if(currTarg.id === defaults.prefix+'-btn-cont') {
		initWidgetState();
	}
}

function wgGlobalScrollHandler(e) {
	var targ = document.getElementById(defaults.prefix+'-messages-cont');
	var dir = getScrollDirection(e);
	if(mouseFocused && widgetState.activePane === 'messages') {
		if(targ.scrollTop === 0 && dir === 'up') {
			e.stopPropagation();
			e.preventDefault();
		} else if (targ.scrollTop >= (targ.scrollHeight-targ.clientHeight) && dir === 'down') {
			e.stopPropagation();
			e.preventDefault();
		}
	}
}

function getScrollDirection(event) {
	var delta;

    if(event.wheelDelta) {
        delta = event.wheelDelta;
    } else {
        delta = -1 * event.deltaY;
    }

    if(delta < 0) {
        return "down";
    } else if(delta > 0) {
        return "up";
    }
}

function isOffline() {
	var state = getWidgetState();
	return state === 'offline';
}

function initWidgetState(e){
	if(e) e.preventDefault();
	var chatInProgress = storage.getState('chat', 'session');
	var wasOpened = storage.getState('opened', 'session');
	var callInProgress = storage.getState('call', 'cache');

	debug.log('initWidgetState');

	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	setInteracted();
	// If timeout is occured, init session first
	// if(hasWgState('timeout')) {
	// 	initModule();
	// } else 
	if(chatInProgress || callInProgress){
		showWidget();
	} else if(isOffline()){
		switchPane('sendemail');
		showWidget();
	} else if(defaults.webrtcEnabled){
		// if call is in progress - just show the widget
		if(!defaults.chat && !getChannelParams('callback').task) {
			initCall();
		} else {
			switchPane('chooseConnection');
		}
		showWidget();
	} else if(getChannelParams('callback').task) {
		if(!defaults.chat && !defaults.webrtcEnabled) {
			switchPane('callback');
			showWidget();
		} else {
			switchPane('chooseConnection');
			showWidget();
		}
	} else if(defaults.channels.length) {
		switchPane('chooseConnection');
		showWidget();
	} else {
		initChat();
	}
}

function wgSendMessage(){
	var msg,
		textarea = document.getElementById(defaults.prefix+'-message-text');

	msg = textarea.value.trim();
	if(msg) {

		if(!storage.getState('chat', 'session')) {
			initChat({ message: msg });
		} else {
			sendMessage({ message: msg });
		}

		textarea.value = '';
		removeWgState('type-extend');
	}
}

function wgTypingHandler(e){
	var targ = e.target;
	var clone = document.getElementById("swc-message-text-clone");

	if(e.keyCode === 10 || e.keyCode === 13) {
		e.preventDefault();
		wgSendMessage();
	} else {
		if(!widgetState.userIsTypingTimeout) {
			widgetState.userIsTypingTimeout = setTimeout(function() {
				widgetState.userIsTypingTimeout = null;
				api.userIsTyping();
			}, 1000);
		}
	}

	// clone.innerText = targ.value;
	// targ.style.height = clone.clientHeight+'px';

	if(targ.value.length >= 80 && !hasWgState('type-extend'))
		addWgState('type-extend');
	if(targ.value.length < 80 && hasWgState('type-extend'))
		removeWgState('type-extend');
}

function wgTextareaFocusHandler(e) {
	var target = e.target;
	target.style.borderColor = defaults.styles.backgroundColor;
}

function wgTextareaBlurHandler(e) {
	var target = e.target;
	target.style.borderColor = "#fff";
}

function wgSubmitHandler(e){
	var targ = e.target;
	e.preventDefault();
	if(targ.tagName === 'FORM')
		api.emit('form/submit', { formElement: targ, formData: getFormData(targ) });
}

function wgSendFile(e){
	var targ = e.target;
	var file = getFileContent(targ, function(err, result) {
		debug.log('wgSendFile: ', err, result);
		if(err) {
			if(frases.ERRORS[err]) alert(frases.ERRORS[err])
			return debug.warn('File wasn\'t sent');
		} else {
			sendMessage({ message: result.filename, file: result.filedata });
		}
	});
}

/********************************
 * Widget elements manipulation *
 ********************************/

function switchPane(pane){
	// var paneId = defaults.prefix+'-'+pane+'-pane';
	var attr = 'data-'+defaults.prefix+'-pane';
	var panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	// debug.log('switchPane panes:', panes, 'pane: ', pane);
	panes.forEach(function(item){
		if(item.getAttribute(attr) === pane) {
			item.classList.add('active');
		} else {
			item.classList.remove('active');
		}
	});

	widgetState.activePane = pane;

	// if(!widgetState.active) showWidget();
}

function changeWgState(params){
	debug.log('changeWgState: ', params);
	if(!widget || hasWgState(params.state)) return;
	if(params.state === 'offline') {
		closeChat();
		removeWgState('online');
		switchPane('sendemail');
	} else if(params.state === 'online') {
		removeWgState('offline');
		
	}

	var state = document.querySelector('.'+defaults.prefix+'-wg-state');
	if(state) state.textContent = frases.TOP_BAR.STATUS[params.state];

	// widgetState.state = params.state;
	addWgState(params.state);
	// setButtonStyle(params.state);
	api.emit('widget/statechange', { state: params.state });
	
}

function getWidgetState() {
	var state = ''; 
	if(defaults.isIpcc)
		state = widgetState.langs.length ? 'online' : 'offline';
	else
		state = api.session.state ? 'online' : 'offline';
	
	return state;
}

function setStyles() {

	var bgr = defaults.styles.primary ? defaults.styles.primary.backgroundColor : defaults.styles.backgroundColor;
	var color = defaults.styles.primary ? defaults.styles.primary.color : defaults.styles.color;
	var border = "1px solid ";

	if(defaults.themeColor) {
		bgr = defaults.themeColor;
		color = getThemeTextColor(defaults.themeColor);
		// border += color;
	}

	defaults.styles.backgroundColor = bgr;
	defaults.styles.color = color;

	if(defaults.buttonStyles.view === 'box') {
		defaults.buttonStyles.color = color;
		defaults.buttonStyles.backgroundColor = bgr;
		defaults.buttonStyles.border = border + (defaults.buttonStyles.border || color);
	} else {
		defaults.buttonStyles.color = bgr;
		defaults.buttonStyles.backgroundColor = color;
		defaults.buttonStyles.border = border + (defaults.buttonStyles.border || bgr);
	}

	// defaults.buttonStyles.boxShadow = defaults.buttonStyles.boxShadow || ("0px 0px 10px 0px " + defaults.buttonStyles.backgroundColor);
}

// TODO: This is not a good solution or maybe not a good implementation
// function setButtonStyle(state) {
// 	// debug.log('setButtonStyle: ', state);
// 	var wgBtn = widget.querySelector('.'+defaults.prefix+'-wg-btn'),

	
// }

function addWgState(state){
	if(widget && !widget.classList.contains(state)) widget.classList.add(state);
}

function hasWgState(state){
	if(widget) return widget.classList.contains(state);
	else return false;
}

function removeWgState(state){
	if(widget) widget.classList.remove(state);
}

function showWidget(){
	var messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	widgetState.active = true;
	storage.saveState('opened', true, 'session');
	addWgState('active');
	removeWgState('notified');

	api.emit('widget/opened');
	// reset button height
	// resetStyles(btn.children[0]);
	// setButtonStyle(widgetState.state);

	messagesCont.scrollTop = messagesCont.scrollHeight;
}

function closeWidget(){
	if(window.opener && window.name === defaults.widgetWindowName) {
		window.close();
	} else {
		widgetState.active = false;
		storage.saveState('opened', false, 'session');
		removeWgState('active');
	}
	api.emit('widget/closed');
}

function onFormSubmit(params){
	var form = params.formElement;
	var formData = params.formData;
	debug.log('onFormSubmit: ', form, formData);
	
	if(form.getAttribute('data-validate-form') && !validateForm(form)) return false;

	debug.log('onFormSubmit', form.getAttribute('data-validate-form'), validateForm(form));

	if(form.id === defaults.prefix+'-closechat-form') {
		submitCloseChatForm(form, formData);
	} else if(form.id === defaults.prefix+'-sendmail-form') {
		submitSendMailForm(form, formData);
	} else if(form.id === defaults.prefix+'-intro-form') {
		requestChat(formData);
	} else if(form.id === defaults.prefix+'-call-btn-form'){
		initCall();
	} else if(form.id === defaults.prefix+'-chat-btn-form'){
		initChat();
	} else if(form.id === defaults.prefix+'-queue_overload'){
		sendRequest(formData);
		closeForm({ formName: form.name }, true);
	} else if(form.id === defaults.prefix+'-request_browser_access'){
		joinSession({ url: global.location.href });
		closeForm({ formName: form.name }, true);
		closeWidget();
	} else {
		closeForm({ formName: form.name }, true);
	}
}

function closeForm(params, submitted){
	var form = global[params.formName];
	if(!form) return false;
	if(submitted) {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-success '+defaults.prefix+'-icon-check"></i>'+
							'<span> '+frases.FORMS.submitted+'</span>'+
						'</p>';
	} else {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-danger '+defaults.prefix+'-icon-close"></i>'+
							'<span> '+frases.FORMS.canceled+'</span>'+
						'</p>';
	}
}

function getFileContent(element, cb){
	var files = element.files,
		file,
		data,
		reader;

	if(!files.length) return;
	if(!global.FileReader) {
		if(cb) cb('OBSOLETE_BROWSER');
		return;
	}

	file = files[0];

	var errors = checkFileParams(file);

	if(errors.length) return cb(errors[0]);

	var blob = new Blob([file], { type: file.type });
	return cb(null, { filedata: blob, filename: file.name });

	// reader = new FileReader();
	// reader.onload = function(event) {
	// 	data = event.target.result;
	// 	// data = data.substring(data.indexOf(',')+1);
	// 	if(cb) cb(null, { filedata: data, filename: file.name });
	// };
	// reader.onerror = function(event) {
	// 	api.emit('Error', event.target.error);
	// 	if(cb) cb(event.target.error);
	// };
	// reader.readAsDataURL(file);
}

function checkFileParams(file) {
	var errors = [];
	var fileExt = file.name.split('.')[file.name.split('.').length-1];
	if(fileExt && defaults.allowedFileExtensions && defaults.allowedFileExtensions.length && defaults.allowedFileExtensions.indexOf(fileExt.toLowerCase()) === -1) errors.push('file_type_error');
	if(defaults.maxFileSize && (defaults.maxFileSize*1000*1000) < file.size) errors.push('file_size_error');


	debug.log('checkFileParams errors: ', errors);	

	return errors;
}

function compileTemplate(template, data){
	var compiled = templates[template];
	return compiled(data);
}

function clearWgMessages() {
	var cont = document.getElementById(defaults.prefix+'-messages-cont');
	var clone = cont.cloneNode();
	cont.parentNode.replaceChild(clone, cont);
}

function getChannelParams(type) {
	if(defaults.channels && defaults.channels.length) 
		return defaults.channels.filter(function(item) { return item.type === type })[0] || {};
	else
		return {};
}

function addChannelsParams(channels) {
	var channelParams = {
		webcall: {
			iconClass: "call",
			iconColor: "#222",
			btnText: frases.PANELS.CONNECTION_TYPES.call_agent_btn,
			callback: "initCall"
		},
		callback: {
			iconClass: "phone_callback",
			iconColor: "#222",
			btnText: frases.PANELS.CONNECTION_TYPES.callback_btn,
			callback: "initCallback"
		},
		viber: {
			iconClass: "viber",
			iconColor: "#665CAC",
			btnText: "Viber"
		},
		telegram: {
			iconClass: "telegram",
			iconColor: "#0088CC",
			btnText: "Telegram"
		},
		messenger: {
			iconClass: "messenger",
			iconColor: "#00C6FF",
			btnText: "Messenger"
		},
		facebook: {
			iconClass: "facebook",
			iconColor: "#1778F2",
			btnText: "Facebook"
		},
		skype: {
			iconClass: "facebook",
			iconColor: "#00AFF0",
			btnText: "Facebook"
		}
	};

	var channelsArray = Array.isArray(channels) ? channels : Object.keys(channels).map(function(key) { var cParams = channels[key]; cParams.type = key; return cParams; });

	return channelsArray.map(function(item, index){
		if(item.type === 'webcall' && !defaults.webrtcEnabled) return null;
		else if(item.type === 'callback' && !item.task) return null;
		else return extend(item, channelParams[item.type]);
	}).filter(Boolean);

}

/********************************
 * Helper functions *
 ********************************/


 function detectLanguage(frases){
	// var storageLang = storage.getState('lang', 'session'),
	var availableLangs = ['uk', 'ru', 'en'], lang, path;

	// list available languages by translations keys
	if(frases) {
		availableLangs = [];
		for(var key in frases) {
			availableLangs.push(key);
		}
	}

	if(defaults.langFromUrl) {

		global.location.pathname
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

	debug.log('detected lang: ', availableLangs, defaults.lang, api.session.lang, api.session.langFromUrl, lang);
	// this.session.lang = lang;
	return lang;
};

function handleAliases(alias) {
	var lang = alias;
	if(alias === 'ua') lang = 'uk';
	else if(alias === 'us' || alias === 'gb') lang = 'en';
	return lang;
}

function browserIsObsolete() {
	debug.warn('Your browser is obsolete!');
}

function parseTime(ts) {
	var date = new Date((typeof ts === 'string' ? parseInt(ts, 10) : ts)),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		time = (hours < 10 ? '0'+hours : hours) + ':' + (minutes < 10 ? '0'+minutes : minutes);

	return time;
}

function parseMessage(params){
// function parseMessage(text, file, entity){
	var text = params.content;
	var fileData = params.fileData;
	var entity = params.entity;
	var filename, form, imgUrl;
	if(fileData || isLinkToFile(text)) {
		filename = isLinkToFile(text) ? text.substring(text.lastIndexOf('/')+1) : text.substring(text.indexOf('_')+1);
		imgUrl = fileData ? toBlobUrl(fileData) : text;
		if(isImage(filename)) {
			return {
				type: 'image',
				content: '<a href="'+imgUrl+'" target="_blank"><img src="'+imgUrl+'" alt="'+filename+'" /></a>'
			};
		} else {
			return {
				type: 'file',
				content: '<a href="'+imgUrl+'" download="'+filename+'">'+filename+'</a>'
			};
		}
	} else if(isLink(text) && isImage(text)) {
		filename = text.substring(text.indexOf('_')+1)
		return {
			type: 'image',
			content: '<a href="'+text+'" target="_blank">' +
						'<img src="'+text+'" alt="'+filename+'" />' +
					 '</a>'
		};
	} else if(entity === 'agent' && new RegExp('^{.+}$').test(text)) {
		forms.forEach(function(item) {
			if(item.name === text.substring(1, text.length-1)) {
				form = item;
			}
		});

		return {
			type: form ? 'form' : 'text',
			content: form ? form : text
		};
	} else {
		return {
			type: 'text',
			content: text.replace(/\n/g, ' <br> ').split(" ").map(convertLinks).join(" ").replace(' <br> ', '<br>')
		};
	}
}

function convertLinks(text){
	var leftovers = 0;
	var href = text;
	if(isLink(text)){

		while(!(href.charAt(href.length-1).match(/[a-z0-9\/]/i))){
			href = href.slice(0,-1);
			leftovers += 1;
		}

		debug.log('convertLinks: ', href);

		return '<a href="'+(href.indexOf('www.') !== -1 ? ('http://'+href) : href)+'" target="_blank" data-'+defaults.prefix+'-link="'+href+'">'+href+'</a>' + text.substr(text.length - leftovers);
	} else {
		return text;
	}
}

function isLink(text){
	var pattern = new RegExp('^http:\/\/|^https:\/\/|^www\.[a-zA-z0-9-]*.[a-zA-Z0-9]');
	return pattern.test(text);
}

function isImage(filename){
	var regex = new RegExp('png|PNG|jpg|JPG|JPEG|jpeg|gif|GIF');
	var ext = filename.substring(filename.lastIndexOf('.')+1);
	return regex.test(ext);
}

function isLinkToFile(string) {
	var regex = new RegExp('pdf|PDF|txt|TXT');
	var ext = string.substring(string.lastIndexOf('.')+1);
	return regex.test(ext);
}

function toBlobUrl(blob) {
	var urlCreator = window.URL || window.webkitURL;
	return urlCreator.createObjectURL(blob);
}

function getFormData(form){
	var formData = {};
	[].slice.call(form.elements).forEach(function(el) {
		if(el.type === 'checkbox') formData[el.name] = el.checked;
		else {
			if(el.name) formData[el.name] = form[el.name].value;
			else if(el.value) formData[el.name] = el.value;
		}
	});
	return formData;
}

function validateForm(form){
	var valid = true;
	[].slice.call(form.elements).forEach(function(el) {
		// debug.log('validateForm el:', el, el.hasAttribute('required'), el.value, el.type);
		if(el.hasAttribute('required') && (el.value === "" || el.value === null)) {
			alert(frases.ERRORS[el.type] || frases.ERRORS.required);
			valid = false;
		} else if(el.type === 'tel' && el.value && defaults.phonePattern && helpers.validateByPattern(helpers.formatPhoneNumber(el.value), defaults.phonePattern) !== true) {
			alert(helpers.interpolate(frases.ERRORS[el.type], { phonePattern: defaults.phonePattern }) || frases.ERRORS.required);
			valid = false;
		} else if(el.type === 'email' && el.value && defaults.emailPattern && helpers.validateByPattern(el.value, defaults.emailPattern) !== true) {
			alert(frases.ERRORS[el.type] || frases.ERRORS.required);
			valid = false;
		}
	});
	// debug.log('validateForm valid: ', valid);
	return valid;
}

// function resetStyles(element){
// 	element.removeAttribute('style');
// }

function addWidgetStyles(){
	
	var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = defaults.stylesPath || defaults.clientPath+'main.css';

	document.head.appendChild(link);
}

function PrefixedEvent(element, type, pfx, callback) {
	for (var p = 0; p < pfx.length; p++) {
		if (!pfx[p]) type = type.toLowerCase();
		element.addEventListener(pfx[p]+type, callback, false);
	}
}

function getThemeTextColor(themeColor) {
	var rgbObj = hexToRgb(defaults.themeColor);
	// return (relativeLuminanceW3C(rgbObj.r, rgbObj.g, rgbObj.b) > 0.5 ? '#333' : '#f1f1f1');
	return (relativeLuminanceW3C(rgbObj.r, rgbObj.g, rgbObj.b) > 0.5 ? '#333' : '#fff');
}

// from http://www.w3.org/TR/WCAG20/#relativeluminancedef
function relativeLuminanceW3C(R8bit, G8bit, B8bit) {

    var RsRGB = R8bit/255;
    var GsRGB = G8bit/255;
    var BsRGB = B8bit/255;

    var R = (RsRGB <= 0.03928) ? RsRGB/12.92 : Math.pow((RsRGB+0.055)/1.055, 2.4);
    var G = (GsRGB <= 0.03928) ? GsRGB/12.92 : Math.pow((GsRGB+0.055)/1.055, 2.4);
    var B = (BsRGB <= 0.03928) ? BsRGB/12.92 : Math.pow((BsRGB+0.055)/1.055, 2.4);

    // For the sRGB colorspace, the relative luminance of a color is defined as: 
    var L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    return L;
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function extend( a, b ) {
    for( var key in b ) {
        if( b.hasOwnProperty( key ) ) {
            a[key] = b[key];
        }
    }
    return a;
}

function convertTime(seconds){
	var minutes = Math.floor(seconds / 60),
		secsRemain = seconds % 60,
		str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (secsRemain > 9 ? secsRemain : '0' + secsRemain);
	return str;
}

function isBrowserSupported() {
	return document.body.classList !== undefined;
}

function setCallerId(callerid, uri) {
	return ('sip:'+callerid+'@'+uri.split('@')[1]);
}

function addEvent(obj, evType, fn, opts) {
	var options = opts ? extend({ capture: false}, opts) : { capture: false};
	if (obj.addEventListener) obj.addEventListener(evType, fn, options);
	else if (obj.attachEvent) obj.attachEvent("on"+evType, fn);
}
function removeEvent(obj, evType, fn, opts) {
	var options = opts ? extend({ capture: false}, opts) : { capture: false};
	if (obj.removeEventListener) obj.removeEventListener(evType, fn, options);
	else if (obj.detachEvent) obj.detachEvent("on"+evType, fn);
}

function focusOnElement(el) {
	return el.focus();
}