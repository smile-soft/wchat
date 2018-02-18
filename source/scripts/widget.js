var domify = require('domify');
var core = require('./core');
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
var _ = require('./lodash');
var frases = null;
var cobrowsing = require('./cobrowsing');
var templates = require('./templates');
var WebRTC = require('./webrtc');
var audio = require('./audio-control');
var serverUrl = {};
var forms;
var api;

// Widget initiation options
var defaults = {
	// prefix for CSS classes and ids. 
	// Change it only if the default prefix 
	// matches with existed classes or ids on the website
	prefix: 'swc',
	// whether or not to ask user 
	// to introduce him self before the chat session
	intro: false,
	// whether or not to add widget to the webpage
	widget: true,
	// enable chat feature
	chat: true,
	// enable cobrowsing feature
	cobrowsing: false,
	// DOM element that opens a widget
	reCreateSession: true,
	buttonElement: null,
	title: '',
	lang: 'en',
	langFromUrl: false,
	position: 'right',
	hideOfflineButton: false,
	offer: false,
	styles: {
		primary: {
			backgroundColor: '#555555',
			color: '#FFFFFF'
		},
		intro: {
			backgroundImage: "images/bgr-02.jpg"
		},
		sendmail: {
			backgroundImage: "images/bgr-01.jpg"
		},
		closeChat: {
			backgroundImage: "images/bgr-02.jpg"
		}
	},
	buttonStyles: {
		online: {
			backgroundColor: 'rgba(175,229,255,0.8)',
			color: ''
		},
		offline: {
			backgroundColor: 'rgba(241,241,241,0.8)',
			color: ''
		},
		timeout: {
			backgroundColor: 'rgba(241,241,241,0.8)',
			color: ''
		},
		notified: {
			backgroundColor: 'rgba(253,250,129,0.8)',
			color: ''
		},
		color: 'rgb(70,70,70)'
	},
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable',
	// absolute path to the wchat folder
	path: '/ipcc/webchat/',
	// absolute path to the clients files. If not set, files requested from defaults.server + defaults.path.
	clientPath: '',
	// absolute path to the css flie
	stylesPath: '',
	// in seconds
	checkStatusTimeout: 10,
	// in seconds
	getMessagesTimeout: 1,
	// displayed in the email template
	host: window.location.host,
	// webrtc options
	webrtc: {
		sip: {},
		hotline: '',
		fallback: false
	},
	webrtcEnabled: false,
	callback: {
		task: ''
	}
},

// Current widget state
widgetState = {
	initiated: false,
	active: false,
	state: '', // "online" | "offline" | "timeout",
	share: false,
	sounds: true
},
dialog = [],

// available dialog languages
langs = null,
currLang = '',
messagesTimeout,
noMessagesTimeout,
getLanguagesInterval,
chatTimeout,
// Container for messages
messagesCont,
// Widget dom element
widget,

// Widget in a separate window
widgetWindow,
// Widget panes elements
panes,
agentIsTypingTimeout,
userIsTypingTimeout,
timerUpdateInterval,
pollTurns = 1;
// ringTone = null,
// ringToneInterval = null;

function Widget(options){

	_.merge(defaults, options || {});
	// _.assign(defaults, options || {});

	debug.log('Widget: ', options);

	defaults.clientPath = defaults.clientPath || (defaults.server + defaults.path);

	addWidgetStyles();
	serverUrl = require('url').parse(defaults.server, true);

	// Enabling audio module
	audio.init(defaults.clientPath+'sounds/');

	api = new core(options)
	.on('session/create', onSessionSuccess)
	.on('session/continue', onSessionSuccess)
	.on('session/join', onSessionJoin)
	.on('session/init', onSessionInit);
	// .on('chat/languages', function() {
	// 	changeWgState({ state: getWidgetState() });
	// });
	
	if(defaults.widget) {
		api.on('chat/start', startChat)
		.on('chat/close', onChatClose)
		.on('chat/timeout', onChatTimeout)
		.on('message/new', clearUndelivered)
		.on('message/new', newMessage)
		.on('message/typing', onAgentTyping)

		.on('form/submit', onFormSubmit)
		.on('form/reject', closeForm)
		.on('widget/load', initWidget);
		// .on('widget/init', onWidgetInit);
		// .on('widget/statechange', changeWgState);
	}

	if(defaults.webrtc.sip.ws_servers !== undefined && WebRTC.isSupported()) {
		if(window.location.protocol === 'https:' && serverUrl.protocol === 'https:'){
			// set flag to indicate that webrtc feature is supported and enabled
			defaults.webrtcEnabled = true;

			// set webrtc event handlers
			api.on('webrtc/newRTCSession', function(){
				initCallState('newRTCSession');
			});
			api.on('webrtc/progress', function(e){
				if(e.response.status_code === 180) {
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
				sip: defaults.webrtc.sip,
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
	
	setSessionTimeoutHandler();
	getLanguages();

	// load translations
	request.get('frases', defaults.clientPath+'translations.json', function (err, result){
		if(err) return api.emit('Error', err);
		frases = JSON.parse(result);
	});
	
	// load forms
	request.get('forms_json', defaults.clientPath+'forms.json', function (err, result){
		if(err) return api.emit('Error', err);
		forms = JSON.parse(result).forms;
	});

	return publicApi;
}

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
	getEntity: function(){ return storage.getState('entity', 'session'); },
	on: function(evt, listener) {
		api.on(evt, listener);
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

function initModule(){
	api.initModule();
	return publicApi;
}

function initWebrtcModule(opts){
	debug.log('initWebrtcModule: ', opts);
	WebRTC.init(opts);
}

function initSession() {

	debug.log('initSession:', defaults.chat, defaults.webrtcEnabled, defaults.callback.task);
	
	if(!defaults.chat && !defaults.webrtcEnabled && !defaults.callback.task) return false;

	debug.log('session initiated');

	// set current user language
	currLang = currLang || detectLanguage();
	setSessionTimeoutHandler();
	
	getLanguages();
	getLanguagesInterval = setInterval(getLanguages, defaults.checkStatusTimeout*1000);

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget();
	}

	// If timeout was occured, init chat after a session is created
	if(hasWgState('timeout')) {
		removeWgState('timeout');
	}

	// if window is not a opened window
	if(!defaults.external) {
		// api.updateUrl(window.location.href);

		if(defaults.cobrowsing) {
			initCobrowsingModule({
				url: window.location.href,
				entity: storage.getState('entity', 'session'),
				widget: '#'+defaults.prefix+'-wg-cont'
			});
		}
	}

	api.emit('session/init', {options: defaults, url: global.location.href });
}

// Session is either created or continues
function onSessionSuccess(){

	// Wait while translations are loaded
	_.poll(function(){
		debug.log('poll: ', frases);
		return (frases !== null);

	}, function() {
		initSession()
		// if window is not a opened window
		if(!defaults.external) {
			api.updateUrl(window.location.href);
		}

	}, function(){
		
		if(pollTurns < 2) {
			pollTurns++;
			Widget(defaults).initModule();
		} else {
			return api.emit('Error', 'Module wasn\'t initiated due to network errors');
		}

	}, 60000);		

}

function onSessionInit(){
	storage.saveState('init', true, 'session');
	if(widgetWindow && !widgetWindow.closed) widgetWindow.sessionStorage.setItem(defaults.prefix+'.init', true);
}

// send shared event to the user's browser
function onSessionJoin(params){
	// debug.log('onSessionJoin: ', params);
	initCobrowsingModule({ url: params.url, entity: storage.getState('entity', 'session') });
}

function loadWidget(cb){
	
	compiled = compileTemplate('widget', {
		defaults: defaults,
		languages: langs,
		translations: frases,
		currLang: currLang || defaults.lang,
		credentials: storage.getState('credentials', 'session') || {},
		_: _
	});

	// Widget variable assignment
	widget = domify(compiled);
	document.body.appendChild(widget);
	api.emit('widget/load', widget);

}

function initCobrowsingModule(params){
	// init cobrowsing module only on main window
	if(defaults.external || cobrowsing.isInitiated()) return;

	api.on('cobrowsing/init', function(){
		if(storage.getState('shared', 'session') || params.entity === 'agent') cobrowsing.share();
		// cobrowsing.emitEvents();
	});
	api.on('cobrowsing/event', function(params){
		api.updateEvents(params.events, function(err, result){
			if(err) return;
			if(result) cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/shared', function(){
		if(!storage.getState('shared', 'session') && params.entity === 'user') {
			storage.saveState('shared', true, 'session');
			api.switchShareState(true, params.url);
		}
		api.updateEvents([{ entity: params.entity, url: params.url, shared: true }], function(err, result){
			// if(err) return;
			result.historyEvents = true;
			// debug.log('cobrowsing update: ', result);
			cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/unshared', function(params){
		storage.saveState('shared', false, 'session');
		api.updateEvents([{ entity: params.entity, url: params.url, shared: false }], function(err){
			// if(err) return;
			if(params.entity === 'user') api.switchShareState(false, window.location.href);
			else cobrowsing.unshareAll();
		});
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
	api.getLanguages(function (err, body){
		debug.log('getLanguages: ', err, body);
		if(err) return;
		if(body) onNewLanguages(body.result);
		// getLanguagesTimeout = setTimeout(getLanguages, defaults.checkStatusTimeout*1000);
	});
}

function onNewLanguages(languages){
	// debug.log('languages: ', languages);
	var state = languages.length ? 'online' : 'offline';

	langs = languages;

	// if(hasWgState(state)) return;
	// if(widgetState.state === state) return;

	changeWgState({ state: state });
	api.emit('chat/languages', languages);
}

function initWidget(){
	var options = '', selected;

	// debug.log('Init widget!');
	widgetState.initiated = true;

	setStyles();
	setListeners(widget);
	changeWgState({ state: getWidgetState() });

	if(defaults.hideOfflineButton) {
		addWgState('no-button');
	}

	if(defaults.offer) {
		setOffer();
	}

	// if chat started
	if(storage.getState('chat') === true) {
		requestChat(storage.getState('credentials', 'session') || {});
		showWidget();
		// initChat();
	}

	// if webrtc supported by the browser and ws_servers parameter is set - change button icon
	if(defaults.webrtcEnabled) {
		addWgState('webrtc-enabled');
	}

	if(widget && defaults.intro.length) {
		// Add languages to the template
		langs.forEach(function(lang) {
			if(frases[lang] && frases[lang].lang) {
				selected = lang === currLang ? 'selected' : '';
				options += '<option value="'+lang+'" '+selected+' >'+frases[lang].lang+'</option>';
			}
		});
		global[defaults.prefix+'IntroForm'].lang.innerHTML = options;
	}

	// Widget is initiated
	api.emit('widget/init');
}

function setOffer() {
	setTimeout(function() {
		showOffer({
			from: defaults.offer.from || frases[currLang].TOP_BAR.title,
			time: Date.now(),
			text: defaults.offer.text || frases[currLang].default_offer
		});
	}, defaults.offer.inSeconds ? defaults.offer.inSeconds*1000 : 30000);
}

function showOffer(message) {
	// Return if user already interact with the widget
	if(widgetState.state !== 'online' || isInteracted()) return;
	newMessage({ messages: [message] });
}

function setInteracted(){
	if(!storage.getState('interacted', 'session')) {
		storage.saveState('interacted', true, 'session');
	}
}

function isInteracted(){
	return storage.getState('interacted', 'session');
}

function initChat(){
	showWidget();

	// // if chat already started and widget was minimized - just show the widget
	if(storage.getState('chat', 'cache')) return;

	if(!langs.length) {
		switchPane('sendemail');
	} else if(defaults.intro.length) {
		if(storage.getState('chat')) {
			requestChat(storage.getState('credentials', 'session'));
		} else {
			switchPane('credentials');
		}
	} else {
		requestChat({ lang: currLang });
	}
}

function requestChat(credentials){
	if(!credentials.uname) credentials.uname = storage.getState('sid').split('_')[0];
	
	// Save user language based on preferable dialog language
	if(credentials.lang && credentials.lang !== currLang ) {
		storage.saveState('lang', credentials.lang);
	}
	if(!credentials.lang) {
		credentials.lang = currLang;
	}
	
	// Save credentials for current session
	// It will be removed on session timeout
	storage.saveState('credentials', credentials, 'session');

	api.chatRequest(credentials);
	switchPane('messages');
}

function startChat(params){
	storage.saveState('chat', true);
	if(params.timeout) {
		// debug.log('chat timeout: ', params.timeout);
		chatTimeout = api.setChatTimeout(params.timeout);
	}
	getMessages();
	addWgState('chat');
}

function getMessages(){
	// debug.log('get messages!');
	
	if(storage.getState('chat'))
		noMessagesTimeout = setTimeout(getMessages, 60*1000);
	
	api.getMessages(function() {
		if(storage.getState('chat')) {
			messagesTimeout = setTimeout(getMessages, defaults.getMessagesTimeout*1000);
			clearTimeout(noMessagesTimeout);
		}
	});
}

function sendMessage(params, cb){
	api.sendMessage(params, function(err) {
		if(!err && widgetState.sounds) audio.play('message_sent');
	});

	newMessage({ messages: [{
		from: storage.getState('credentials', 'session').uname,
		time: Date.now(),
		text: params.message,
		hidden: true,
		className: defaults.prefix+'-msg-undelivered'
	}] });

	if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(result){
	// debug.log('new messages arrived!', result);

	var str,
		els = [],
		text,
		compiled,
		playSound = false,
		defaultUname = false,
		credentials = storage.getState('credentials', 'session') || {},
		aname = storage.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : '';

	if(uname === storage.getState('sid').split('_')[0]) {
		defaultUname = true;
	}

	result.messages.forEach(function(message, index) {
		
		message.entity = message.from === uname ? 'user' : 'agent';
		// message.from = (message.entity === 'user' && defaultUname) ? frases[currLang].default_user_name : message.from;
		message.from = (message.entity === 'user' && defaultUname) ? '' : message.from;
		message.time = message.time ? parseTime(message.time) : parseTime(Date.now());

		text = parseMessage(message.text, message.file, message.entity);

		if(text.type === 'form') {

			compiled = compileTemplate('forms', {
				defaults: defaults,
				message: message,
				form: text.content,
				credentials: credentials,
				frases: frases[(currLang || defaults.lang)],
				_: _
			});

			if(global[text.content.name]) closeForm({ formName: text.content.name });
			messagesCont.insertAdjacentHTML('beforeend', '<li>'+compiled+'</li>');
			messagesCont.scrollTop = messagesCont.scrollHeight;
		} else {
			if(!message.text) return;
			message.text = text.content;
			compiled = compileTemplate('message', { defaults: defaults, message: message });
			debug.log('newMessage compiled: ', message, compiled);
			messagesCont.insertAdjacentHTML('beforeend', '<li '+(message.className ? 'class="'+message.className+'"' : '' )+'>'+compiled+'</li>');

			if(index === result.messages.length-1) {
				onLastMessage(compiled);
			}

			// Need for sending dialog to email
			if(!message.hidden) dialog.push(compiled);
		}

		// Save agent name
		if(message.entity === 'agent' && aname !== message.from) {
			storage.saveState('aname', message.from, 'session');
		}

		if(message.entity !== 'user') playSound = true;

	});

	messagesCont.scrollTop = messagesCont.scrollHeight;
	// if(playSound) playNewMsgTone();
}

function clearUndelivered(){
	var undelivered = [].slice.call(document.querySelectorAll('.'+defaults.prefix+'-msg-undelivered'));
	if(undelivered && undelivered.length) {
		undelivered.forEach(function(msg){
			msg.classList.add(defaults.prefix+'-hidden');
		});
	}
}

function playNewMsgTone() {
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
		setButtonStyle('notified');

	}
}

function compileEmail(content, cb) {
	var compiled = compileTemplate('email', {
		defaults: defaults,
		content: content,
		frases: frases[(currLang || defaults.lang)],
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
			from: frases[currLang].EMAIL_SUBJECTS.complain+' '+params.email,
			text: params.text,
			entity: '',
			time: ''
		}
	});

	body = body.concat(
		complain,
		'<br><p class="h1">'+frases[currLang].EMAIL_SUBJECTS.dialog+' '+defaults.host+'</p><br>',
		dialog
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
			from: frases[currLang].EMAIL_SUBJECTS.request+' '+params.uname+' ('+params.email+')',
			text: params.text,
			entity: '',
			time: ''
		}
	});

	compileEmail(msg, function(err, result) {
		if(err) return;
		params.text = result;
		api.sendEmail(params);
		if(cb) cb();
	});
}

function submitSendMailForm(form, data) {
	var params = {},
		file;

	if(!data.email) {
		alert(frases[currLang].ERRORS.email);
		return;
	}

	data.subject = frases[currLang].EMAIL_SUBJECTS.request+' '+data.email;

	if(data.file) {
		file = getFileContent(form.file, function(err, result) {
			if(!err) {
				data.filename = result.filename;
				data.filedata = result.filedata;
			} else {
				debug.warn('File wasn\'t sent');
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
			alert(frases[currLang].ERRORS.email);
			return;
		}
		// debug.log('send dialog');
		sendDialog({
			to: data.email,
			subject: frases[currLang].EMAIL_SUBJECTS.dialog+' '+defaults.host,
			text: dialog // global variable
		});
	}
	if(data && data.text) {
		if(!data.email) {
			alert(frases[currLang].ERRORS.email);
			return;
		} else {
			// debug.log('send complain!');
			sendComplain({
				email: data.email,
				subject: frases[currLang].EMAIL_SUBJECTS.complain+' '+data.email,
				text: data.text
			});
		}
	}
	if(chatTimeout) clearTimeout(chatTimeout);
	if(form) form.reset();
	
	closeChat(rating);
	closeWidget();
}

function closeChat(rating) {
	storage.saveState('chat', false);
	api.closeChat(rating);
	removeWgState('chat');
}

function onChatClose(){
	if(storage.getState('shared', 'session')) cobrowsing.unshare();
}

function onChatTimeout(){
	// debug.log('chat timeout!');
	switchPane('closechat');
	closeChat();
}

function onAgentTyping(opts){
	// debug.log('Agent is typing!');
	if(!agentIsTypingTimeout) {
		addWgState('agent-typing');
	}
	clearTimeout(agentIsTypingTimeout);
	agentIsTypingTimeout = setTimeout(function() {
		agentIsTypingTimeout = null;
		removeWgState('agent-typing');
		// debug.log('agent is not typing anymore!');
	}, 5000);
}

function setSessionTimeoutHandler(){
	if(api.listenerCount('session/timeout') >= 1) return;
	api.once('session/timeout', function (params){
		debug.log('Session timeout:', defaults);
		debug.log('Session timeout:', params);

		if(storage.getState('chat') === true) {
			closeChat();
		}
		if(widget) {
			addWgState('timeout');
			closeWidget();
		}
		changeWgState({ state: 'timeout' });
		// widgetState.state = 'timeout';
		// addWgState('timeout');
		setButtonStyle('timeout');
		storage.removeState('sid');

		// if(params && params.method === 'updateEvents') {
		clearInterval(getLanguagesInterval);
		clearTimeout(messagesTimeout);

		if(defaults.reCreateSession) {
			initModule();
		}
		// }
	});
}

function initCall(){
	switchPane('callAgent');
	WebRTC.audiocall(defaults.webrtc.hotline);
	// WebRTC.audiocall('sip:'+defaults.webrtc.hotline+'@'+serverUrl.host);
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
		cbSent = document.getElementById(defaults.prefix+'-callback-sent');
	
	formData.phone = formData.phone ? formatPhoneNumber(formData.phone) : null;

	if(!formData.phone || formData.phone.length < 10) {
		return alert(frases[currLang].ERRORS.tel);
	}

	formData.time = parseFloat(formData.time);
	
	if(formData.time <= 0) return;

	formData.time = Date.now() + (formData.time * 60 * 1000);
	formData.task = defaults.callback.task;
	debug.log('setCallback data: ', formData);

	form.classList.add(defaults.prefix+'-hidden');
	cbSpinner.classList.remove(defaults.prefix+'-hidden');

	api.requestCallback(formData, function(err, result) {
		debug.log('setCallback result: ', err, result);

		cbSpinner.classList.add(defaults.prefix+'-hidden');
		form.classList.remove(defaults.prefix+'-hidden');

		if(err) return;
		
		switchPane('callbackSent');
	});

	form.reset();
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
		textState.innerText = frases[currLang].PANELS.AUDIO_CALL.calling_agent;
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.add(defaults.prefix+'-hidden');

	} else if(state === 'ringing') {
		setTimer(timer, 'init', 0);
		timer.classList.remove(defaults.prefix+'-hidden');
		audio.play('ringout_loop', true);

	} else if(state === 'connected') {
		textState.innerText = frases[currLang].PANELS.AUDIO_CALL.connected_with_agent;
		setTimer(timer, 'start', 0);
		audio.stop();

	} else if(state === 'ended') {
		textState.innerText = frases[currLang].PANELS.AUDIO_CALL.call_ended;
		setTimer(timer, 'stop');
		initCallState('oncallend');
		
	} else if(state === 'failed' || state === 'canceled') {
		if(state === 'failed') {
			textState.innerText = frases[currLang].PANELS.AUDIO_CALL.call_failed;
		} else {
			textState.innerText = frases[currLang].PANELS.AUDIO_CALL.call_canceled;
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
		timerUpdateInterval = setInterval(function(){
			time = time+1;
			timer.textContent = convertTime(time);
		}, 1000);
	} else if(state === 'stop') {
		clearInterval(timerUpdateInterval);
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
function openWidget(){
	debug.log('open widget: ', storage.getState('sid'));
	var opts = {};
	
	if(!widgetWindow || widgetWindow.closed) {

		_.merge(opts, defaults);

		opts.widget = true;
		// set external flag to indicate that the module loads not in the main window
		opts.external = true;

		widgetWindow = window.open('', 'wchat', defaults.widgetWindowOptions);
		widgetWindow = constructWindow(widgetWindow);
		widgetWindow.sessionStorage.setItem('wchat_options', JSON.stringify(opts));

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

			widgetWindow.Module.initModule();

		}, function(){
			console.warn('Wchat module was not initiated due to network connection issues.');
		}, 120000);
		
		widgetWindow.onbeforeunload = function(){
			//close chat if user close the widget window
			//without ending a dialog
			if(storage.getState('chat', 'storage')) closeChat();
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
	currLang = currLang || detectLanguage(),
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
	title.textContent = frases[currLang].TOP_BAR.title;

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
	var fileSelect = document.getElementById(defaults.prefix+'-file-select'),
		textField = document.getElementById(defaults.prefix+'-message-text'),
		inputs = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-inputfile'));

	btn = document.getElementById(defaults.prefix+'-btn-cont');
	panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

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

	if(defaults.buttonElement) 
		defaults.buttonElement.addEventListener('click', publicApi.openWidget, false);
}

/********************************
 * Widget event handlers *
 ********************************/

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
		if(storage.getState('chat')) switchPane('closechat');
		else closeWidget();
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
		currTarg = e.currentTarget;

	// remove notification of a new message
	if(targ.id === defaults.prefix+'-unnotify-btn') {
		removeWgState('notified');
		// reset button height
		// resetStyles(btn.children[0]);
		setButtonStyle(widgetState.state);
		return;
	}

	if(currTarg.id === defaults.prefix+'-btn-cont') {
		initWidgetState();
	}
}

function initWidgetState(){
	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	setInteracted();
	// If timeout is occured, init session first
	if(hasWgState('timeout')) {
		initModule();
	} else if(storage.getState('chat', 'cache')){
		showWidget();
	} else if(!langs.length){
		switchPane('sendemail');
	} else if(defaults.webrtcEnabled){
		// if call is in progress - just show the widget
		if(storage.getState('call', 'cache')) {
			showWidget();
		} else {
			if(!defaults.chat && !defaults.callback.task) {
				initCall();
			} else {
				switchPane('chooseConnection');
			}
		}
	} else if(defaults.callback.task) {
		if(!defaults.chat && !defaults.webrtcEnabled) {
			switchPane('callback');
		} else {
			switchPane('chooseConnection');
		}
	} else {
		initChat();
	}
}

function wgSendMessage(){
	var msg,
		textarea = document.getElementById(defaults.prefix+'-message-text');

	msg = _.trim(textarea.value);
	if(msg) {
		sendMessage({ message: msg });
		textarea.value = '';
		removeWgState('type-extend');
	}
	if(!storage.getState('chat')) {
		initChat();
	}
}

function wgTypingHandler(e){
	var targ = e.target;
	if(e.keyCode === 10 || e.keyCode === 13) {
		e.preventDefault();
		wgSendMessage();
	} else {
		if(!userIsTypingTimeout) {
			userIsTypingTimeout = setTimeout(function() {
				userIsTypingTimeout = null;
				api.userIsTyping();
			}, 1000);
		}
	}

	if(targ.value.length >= 80 && !hasWgState('type-extend'))
		addWgState('type-extend');
	if(targ.value.length < 80 && hasWgState('type-extend'))
		removeWgState('type-extend');
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
		debug.log('wgSendFile: ', result);
		if(err) {
			alert('File was not sent');
		} else {
			api.sendMessage({ message: result.filedata, file: result.filename });
		}
	});
}

/********************************
 * Widget elements manipulation *
 ********************************/

function switchPane(pane){
	// var paneId = defaults.prefix+'-'+pane+'-pane';
	var attr = 'data-'+defaults.prefix+'-pane';
	// debug.log('switchPane panes:', panes, 'pane: ', pane);
	panes.forEach(function(item){
		if(item.getAttribute(attr) === pane) {
			item.classList.add('active');
		} else {
			item.classList.remove('active');
		}
	});

	if(!widgetState.active) showWidget();
}

function changeWgState(params){
	if(!widget || widgetState.state === params.state) return;
	if(params.state === 'offline') {
		removeWgState('online');
	} else if(params.state === 'online') {
		removeWgState('offline');
		
	}

	widgetState.state = params.state;
	addWgState(params.state);
	setButtonStyle(params.state);
	api.emit('widget/statechange', { state: params.state });
	
}

function getWidgetState() {
	return widgetState.state ? widgetState.state : ((langs &&langs.length) ? 'online' : 'offline');
}

function setStyles() {
	var wgBtn = widget.querySelector('.'+defaults.prefix+'-wg-btn');

	console.log('setStyles: ', wgBtn, defaults.buttonStyles);

	wgBtn.style.borderRadius = defaults.buttonStyles.borderRadius;
	wgBtn.style.boxShadow = defaults.buttonStyles.boxShadow;
}

// TODO: This is not a good solution or maybe not a good implementation
function setButtonStyle(state) {
	// debug.log('setButtonStyle: ', state);
	if(!widget || defaults.buttonStyles[state] === undefined) return;
	var wgBtn = widget.querySelector('.'+defaults.prefix+'-wg-btn'),
		btnIcon = widget.querySelector('.'+defaults.prefix+'-btn-icon');

	wgBtn.style.backgroundColor = defaults.buttonStyles[state].backgroundColor;
	btnIcon.style.color = defaults.buttonStyles[state].color || defaults.buttonStyles.color;
}

function addWgState(state){
	if(widget) widget.classList.add(state);
}

function hasWgState(state){
	if(widget) return widget.classList.contains(state);
	else return false;
}

function removeWgState(state){
	if(widget) widget.classList.remove(state);
}

function showWidget(){
	widgetState.active = true;
	addWgState('active');
	removeWgState('notified');

	// reset button height
	// resetStyles(btn.children[0]);
	setButtonStyle(widgetState.state);

	messagesCont.scrollTop = messagesCont.scrollHeight;
}

function closeWidget(){
	if(window.opener) {
		window.close();
	} else {
		widgetState.active = false;
		removeWgState('active');
	}
}

function onFormSubmit(params){
	var form = params.formElement;
	var formData = params.formData;
	// debug.log('onFormSubmit: ', form, formData);
	if(form.getAttribute('data-validate-form')) {
		var valid = validateForm(form);
		if(!valid) return;
		// debug.log('onFormSubmit valid: ', valid);
	}
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
	} else {
		closeForm({ formName: form.name }, true);
	}
}

function closeForm(params, submit){
	var form = global[params.formName];
	if(!form) return false;
	if(submit) {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-success '+defaults.prefix+'-icon-check"></i>'+
							'<span> '+frases[currLang].FORMS.submitted+'</span>'+
						'</p>';
	} else {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-danger '+defaults.prefix+'-icon-remove"></i>'+
							'<span> '+frases[currLang].FORMS.canceled+'</span>'+
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

	reader = new FileReader();
	reader.onload = function(event) {
		data = event.target.result;
		data = data.substring(data.indexOf(',')+1);
		if(cb) cb(null, { filedata: data, filename: file.name });
	};
	reader.onerror = function(event) {
		api.emit('Error', event.target.error);
		if(cb) cb(event.target.error);
	};
	reader.readAsDataURL(file);
}

function compileTemplate(template, data){
	var compiled = templates[template];
	return compiled(data);
}

/********************************
 * Helper functions *
 ********************************/

function detectLanguage(){
	var storageLang = storage.getState('lang'),
		availableLangs = [],
		lang,
		path;

	if(storageLang) {
		lang = storageLang;
	} else {

		// list available languages by translations keys
		for(var key in frases) {
			availableLangs.push(key);
		}

		if(defaults.langFromUrl) {
			global.location.pathname
			.split('/')
			.forEach(function(item) {
				if(availableLangs.indexOf(item) !== -1) {
					lang = item;
				}
			});
		}

		if(!lang) {
			lang = defaults.lang || (navigator.language || navigator.userLanguage).split('-')[0];
			if(availableLangs.indexOf(lang) === -1) lang = 'en';
		}
	}

	// debug.log('detected lang: ', lang);

	return lang;
}

function browserIsObsolete() {
	debug.warn('Your browser is obsolete!');
}

function parseTime(ts) {
	var date = new Date(ts),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		time = (hours < 10 ? '0'+hours : hours) + ':' + (minutes < 10 ? '0'+minutes : minutes);

	return time;
}

function parseMessage(text, file, entity){
	var filename, form;
	if(file) {
		filename = text.substring(text.indexOf('_')+1);
		if(isImage(file)) {
			return {
				type: 'image',
				content: '<a href="'+api.options.server+'/ipcc/'+text+'" download="'+filename+'">' +
						'<img src="'+api.options.server+'/ipcc/'+text+'" alt="file preview" />' +
					'</a>'
			};
		} else {
			return {
				type: 'file',
				content: '<a href="'+api.options.server+'/ipcc/'+text+'" download="'+filename+'">'+filename+'</a>'
			};
		}
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
		return '<a href="'+href+'" target="_blank" data-'+defaults.prefix+'-link="'+href+'">'+href+'</a>' + text.substr(text.length - leftovers);
	} else {
		return text;
	}
}

function isLink(text){
	var pattern = new RegExp('^http:\/\/|^https:\/\/');
	return pattern.test(text);
}

function isImage(filename){
	var regex = new RegExp('png|PNG|jpg|JPG|JPEG|jpeg|gif|GIF');
	var ext = filename.substring(filename.lastIndexOf('.')+1);
	return regex.test(ext);
}

function getFormData(form){
	var formData = {};
	[].slice.call(form.elements).forEach(function(el) {
		if(el.type === 'checkbox') formData[el.name] = el.checked;
		else {
			if(el.value) formData[el.name] = el.value;
		}
	});
	return formData;
}

function validateForm(form){
	var valid = true;
	[].slice.call(form.elements).every(function(el) {
		// debug.log('validateForm el:', el, el.hasAttribute('required'), el.value, el.type);
		if(el.hasAttribute('required') && (el.value === "" || el.value === null)) {
			alert(frases[currLang].ERRORS[el.type] || frases[currLang].ERRORS.required);
			valid = false;
			return false;
		} else {
			return true;
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

function convertTime(seconds){
	var minutes = Math.floor(seconds / 60),
		secsRemain = seconds % 60,
		str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (secsRemain > 9 ? secsRemain : '0' + secsRemain);
	return str;
}

function formatPhoneNumber(phone) {
	return phone.replace(/\D+/g, "");
}

function isBrowserSupported() {
	return document.body.classList !== undefined;
}

function addEvent(obj, evType, fn) {
  if (obj.addEventListener) obj.addEventListener(evType, fn, false);
  else if (obj.attachEvent) obj.attachEvent("on"+evType, fn);
}
function removeEvent(obj, evType, fn) {
  if (obj.removeEventListener) obj.removeEventListener(evType, fn, false);
  else if (obj.detachEvent) obj.detachEvent("on"+evType, fn);
}

module.exports = {
	module: Widget,
	api: publicApi
};
