var api = require('./core');
var EventEmitter = require('events').EventEmitter;
var request = require('./request');
var _ = require('./lodash');
var domify = require('domify');
var Promise = require('promise');
var frases = require('../translations.json');

// Widget initiation options
var defaults = {
	// prefix for CSS classes and ids. 
	// Change it only if the default prefix 
	// matches with existed classes or ids on the website
	prefix: 'swc',
	// whether or not to ask user 
	// to introduce him self before the chat session
	intro: ['name', 'phone', 'subject', 'language'],
	// whether or not to add widget to the webpage
	widget: true,
	title: 'Live Chat',
	lang: 'en',
	button: {
		position: 'right'
	},
	hideOfflineButton: false,
	offer: {
		inMinutes: 0.10,
		from: 'Live Chat'
	},
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable=yes',
	styles: {
		primary: {
			backgroundColor: '#555555',
			color: '#FFFFFF'
		},
		intro: {
			background: "images/bgr-02.jpg"
		},
		sendmail: {
			background: "images/bgr-01.jpg"
		}
	},
	// absolute path to the wchat folder
	path: '',
	// in seconds
	checkStatusTimeout: 30,
	// in seconds
	getMessagesTimeout: 1,
	// displayed in the email template
	host: window.location.host
},

// Current widget state
widgetState = {
	initiated: false,
	active: false,
	state: '' // "online" | "offline" | "timeout"
},
dialog = [],

// available dialog languages
langs = [],
currLang = '',
messagesTimeout,
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
userIsTypingTimeout;

module.exports = Widget;

function Widget(options){

	_.assign(defaults, options || {});

	api = new api(options)
	.on('session/create', onSessionSuccess)
	.on('session/continue', onSessionSuccess)
	.on('chat/languages', onNewLanguages);
	
	if(defaults.widget) {
		api.on('chat/start', startChat)
		.on('chat/timeout', onChatTimeout)
		.on('message/new', newMessage)
		.on('message/typing', onAgentTyping)
		.on('form/submit', onFormSubmit)
		.on('widget/load', onWidgetLoad)
		.on('widget/init', onWidgetInit)
		.on('widget/statechange', changeWgState);
	}

	setSessionTimeoutHandler();

	return publicApi;
}

var publicApi = {

	initModule: initModule,
	openWidget: openWidget,
	initChat: initChat,
	on: on,
	emit: emit,
	/**
	 * Set default user credentials.
	 * If "intro" is false, than dialog will start with these credentials.
	 * NOTE: Must be called before initModule method
	 * 
	 * @param {Object} params - User credentials, i.e. "uname", "lang", "phone", "subject"
	 */
	setDefaultCredentials: function(params) {
		defaults.credentials = params;
		return;
	}
};

function initModule(){
	api.initModule();
}

// Session is either created or continues
function onSessionSuccess(){
	console.log('Session success!');

	// set current user language
	currLang = detectLanguage();

	setSessionTimeoutHandler();

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget();
	}

	getLanguages();

	// If timeout was occured, init chat after a session is created
	if(widget && widgetState.state === 'timeout') {
		removeWgState('timeout');
	}
}

function loadWidget(cb){
	console.log('load widget!');
	var compiled;
	request.get(defaults.path+'widget.html', function (err, res, body){
		if(err) return;
		compiled = compileTemplate(body, {
			defaults: defaults,
			languages: langs,
			translations: frases,
			lang: currLang || defaults.lang,
			// frases: frases[currLang] || defaults.lang,
			credentials: api.getState('credentials') || {},
			_: _
		});

		// Widget variable assignment
		widget = domify(compiled);
		document.body.insertBefore(widget, document.body.firstChild);
		api.emit('widget/load', widget);
	});
}

function onWidgetLoad(widget){
	console.log('widget loaded!');

	setListeners(widget);
	changeWgState({ state: widgetState.state });
	initWidget();

}

function getLanguages(){
	api.getLanguages(function (err, body){
		if(err) return;
		if(body) api.emit('chat/languages', body.result);
		setTimeout(getLanguages, defaults.checkStatusTimeout*1000);
	});
}

function onNewLanguages(languages){
	console.log('languages: ', languages);
	var state = languages.length ? 'online' : 'offline';
	var options = '', selected;

	if(widgetState.state === state) return;
	
	langs = languages;

	if(defaults.intro) {
		// Add languages to the template
		langs.forEach(function(lang) {
			selected = lang === currLang ? currLang : '';
			options += '<option value="'+lang+'" '+selected+' >'+frases[lang].lang+'</option>';
		});
		global[defaults.prefix+'IntroForm'].lang.innerHTML = options;
	}

	api.emit('widget/statechange', { state: state });
	
}

function initWidget(){
	console.log('Init widget!');
	widgetState.initiated = true;

	// if chat started
	if(api.getState('chat') === true) {
		requestChat(api.getState('credentials'));
		showWidget();
		// initChat();
	}

	// Widget is initiated
	api.emit('widget/init');
}

function onWidgetInit() {
	if(defaults.offer) {
		setTimeout(function() {
			showOffer({
				from: defaults.offer.from,
				time: Date.now(),
				text: frases[currLang].offer
			});
		}, defaults.offer.inMinutes*60*1000);
	}
}

function showOffer(message) {
	// Return if user already interact with the widget
	if(widgetState.state !== 'online' || api.getState('interacted', 'session')) return;
	newMessage({ messages: [message] });
}

function initChat(){
	console.log('initChat!');

	showWidget();

	// if chat already started and widget was minimized - just show the widget
	if(api.getState('chat', 'cache')) return;

	if(!langs.length) {
		switchPane('sendemail');
	} else if(defaults.intro) {
		if(api.getState('credentials') && api.getState('chat')) {
			requestChat(api.getState('credentials'));
		} else {
			switchPane('credentials');
		}
	} else {
		requestChat({ uname: 'User', lang: currLang });
	}
}

function requestChat(credentials){
	api.chatRequest(credentials);

	// Save credentials for current session
	// It will be removed on session timeout
	api.saveState('credentials', credentials);

	// Save user language based on preferable dialog language
	if(credentials.lang && credentials.lang !== currLang ) {
		api.saveState('lang', credentials.lang);
	}
}

function startChat(params){
	switchPane('messages');
	api.saveState('chat', true);
	if(params.timeout) {
		chatTimeout = api.setChatTimeout(params.timeout);
	}
	getMessages();
	addWgState('chat');
}

function getMessages(){
	console.log('get messages!');
	api.getMessages(function() {
		if(api.getState('chat')) {
			messagesTimeout = setTimeout(getMessages, defaults.getMessagesTimeout*1000);
		}
	});
}

function sendMessage(message){
	api.sendMessage(message);
	if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(result){
	console.log('new messages arrived!', result);
	compileMessages(result.messages, messageTemplate()).forEach(function(message, index) {
		messagesCont.insertAdjacentHTML('beforeend', '<li>'+message+'</li>');
		
		if(index === result.messages.length-1) {
			onLastMessage(message);
		}

		// Need for sending dialog to email
		dialog.push(message);
	});
	messagesCont.scrollTop = messagesCont.scrollHeight;
}

function compileMessages(messages, template){
	var str,
		els = [],
		aname = api.getState('aname', 'session'),
		uname = api.getState('credentials') ? api.getState('credentials').uname : null;

	_.forEach(messages, function (message){
		message.entity = message.from === uname ? 'user' : 'agent';
		message.time = message.time ? parseTime(message.time) : '';
		message.text = parseMessage(message.text, message.file);
		els.push(compileTemplate(template, message));

		// Save agent name
		if(message.entity === 'agent' && aname !== message.from) {
			api.saveState('aname', message.from, 'session');
		}
	});
	return els;
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

		PrefixedEvent(lastMsg, 'animationend', ["webkit", "moz", "MS", "o", ""], function(e) {
			btn.children[0].style.height = e.target.scrollHeight + 'px';
		});

		lastMsg.innerHTML = message;
		addWgState('notified');
	}
}

function compileEmail(content, cb) {
	var compiled;
	request.get(defaults.path+'partials/email.html', function (err, res, body){
		if(err) return cb(err);

		compiled = compileTemplate(body, {
			defaults: defaults,
			content: content,
			frases: frases[(currLang || defaults.lang)],
			_: _
		});

		if(cb) return cb(null, compiled);
	});
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
	var complain = compileTemplate(messageTemplate(), {
		from: frases[currLang].email_subjects.complain+' '+params.email,
		text: params.text,
		entity: '',
		time: ''
	});

	body = body.concat(
		complain,
		'<br><p class="h1">'+frases[currLang].email_subjects.dialog+' '+defaults.host+'</p><br>',
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
	var msg = compileTemplate(messageTemplate(), {
		from: frases[currLang].email_subjects.request+' '+params.uname+' ('+params.email+')',
		text: params.text,
		entity: '',
		time: ''
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
		alert(frases[currLang].required_error.email);
		return;
	}

	data.subject = frases[currLang].email_subjects.request+' '+data.email;

	if(data.file) {
		file = getFileContent(form.file, function(err, result) {
			if(!err) {
				data.filename = result.filename;
				data.filedata = result.filedata;
			} else {
				console.log('File was not sent');
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
			alert(frases[currLang].required_error.email);
			return;
		}
		console.log('send dialog');
		sendDialog({
			to: data.email,
			subject: frases[currLang].email_subjects.dialog+' '+defaults.host,
			text: dialog // global variable
		});
	}
	if(data && data.text) {
		if(!data.email) {
			alert(frases[currLang].required_error.email);
			return;
		} else {
			console.log('send complain!');
			sendComplain({
				email: data.email,
				subject: frases[currLang].email_subjects.complain+' '+data.email,
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
	api.saveState('chat', false);
	api.closeChat(rating);
	removeWgState('chat');
}

function onChatTimeout(){
	console.log('chat timeout!');
	switchPane('closechat');
	closeChat();
}

function onAgentTyping(opts){
	console.log('Agent is typing!');
	if(!agentIsTypingTimeout) {
		addWgState('agent-typing');
	}
	clearTimeout(agentIsTypingTimeout);
	agentIsTypingTimeout = setTimeout(function() {
		agentIsTypingTimeout = null;
		removeWgState('agent-typing');
		console.log('agent is not typing anymore!');
	}, 5000);
}

function setSessionTimeoutHandler(){
	if(api.listenerCount('session/timeout') >= 1) return;
	api.once('session/timeout', function (params){
		console.log('Session timeout!', params);

		if(api.getState('chat') === true) {
			closeChat();
		}
		if(widget) {
			addWgState('timeout');
			closeWidget();
		}
		widgetState.state = 'timeout';
		api.removeState('sid');

		if(params && params.method === 'updateEvents') {
			initModule();
		}
	});
}

function refreshSession() {
	api.removeState('sid');
	initModule();
}

/**
 * Open web chat widget in a new window
 */
function openWidget(){
	console.log('open widget!');
	var url = defaults.path+'window.html';
	if(!widgetWindow || widgetWindow.closed) {
		widgetWindow = window.open(url, 'webchat', defaults.widgetWindowOptions);
		widgetWindow.onbeforeunload = function(){
			// close chat if user close the widget window
			// without ending chat
			if(api.getState('chat', 'storage')) closeChat();
		};
		widgetWindow.onload = function(){
			var wchat = this.Wchat({ server: defaults.server });
			wchat.on('widget/init', wchat.initChat);
			wchat.initModule();
		};
	}
	if(widgetWindow.focus) widgetWindow.focus();
}

/**
 * Set Widget event listeners
 * @param {DOMElement} widget - Widget HTML element
 */
function setListeners(widget){
	// var sendMsgBtn = document.getElementById(defaults.prefix+'-send-message'),
	var fileSelect = document.getElementById(defaults.prefix+'-file-select'),
		textField = document.getElementById(defaults.prefix+'-message-text');

	btn = document.getElementById(defaults.prefix+'-btn-cont');
	panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	addEvent(btn, 'click', btnClickHandler);
	addEvent(widget, 'click', wgClickHandler);
	addEvent(widget, 'submit', wgSubmitHandler);
	// addEvent(sendMsgBtn, 'click', wgSendMessage);
	addEvent(fileSelect, 'change', wgSendFile);
	addEvent(textField, 'keypress', wgTypingHandler);
}

function on(evt, listener){
	api.on(evt, listener);
}
function emit(evt, listener){
	api.emit(evt, listener);
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

	if(handler === 'close') {
		closeWidget();
	} else if(handler === 'finish') {
		if(api.getState('chat')) switchPane('closechat');
		else closeWidget();
	} else if(handler === 'sendMessage') {
		wgSendMessage();
	} else if(handler === 'openWindow') {
		openWidget();
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

	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	if(!api.getState('interacted', 'session')) {
		api.saveState('interacted', true, 'session');
	}

	// remove notification of a new message
	if(targ.id === defaults.prefix+'-unnotify-btn') {
		removeWgState('notified');

		// reset button height
		resetStyles(btn.children[0]);
		return;
	}

	if(currTarg.id === defaults.prefix+'-btn-cont') {
		// If timeout is occured, init session first
		if(widgetState.state === 'timeout') initModule();
		else initChat();
	}
}

function wgSendMessage(){
	var msg,
		textarea = document.getElementById(defaults.prefix+'-message-text');

	msg = _.trim(textarea.value);
	if(msg) {
		sendMessage(msg);
		textarea.value = '';
		removeWgState('type-extend');
	}
	if(!api.getState('chat')) {
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
		api.emit('form/submit', targ);
}

function wgSendFile(e){
	var targ = e.target;
	var file = getFileContent(targ, function(err, result) {
		if(err) {
			alert('File was not sent');
		} else {
			api.sendMessage(result.filedata, result.filename);
		}
	});
}

/********************************
 * Widget elements manipulation *
 ********************************/

function switchPane(pane){
	// var paneId = defaults.prefix+'-'+pane+'-pane';
	var attr = 'data-'+defaults.prefix+'-pane';
	console.log('switchPane panes:', panes, 'pane: ', pane);
	panes.forEach(function(item){
		if(item.getAttribute(attr) === pane) {
			item.classList.add('active');
		} else {
			item.classList.remove('active');
		}
	});
}

function changeWgState(params){
	widgetState.state = params.state;
	if(!widget) return;
	if(params.state === 'online') {
		addWgState('online');
		removeWgState('no-button');
	} else {
		removeWgState('online');
		if(defaults.hideOfflineButton) {
			addWgState('no-button');
		}
	}
}

function addWgState(state){
	if(widget) widget.classList.add(state);
}

function hasWgState(state){
	if(widget) return widget.classList.contains(state);
}

function removeWgState(state){
	if(widget) widget.classList.remove(state);
}

function showWidget(){
	widgetState.active = true;
	addWgState('active');
	removeWgState('notified');

	// reset button height
	resetStyles(btn.children[0]);

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

function onFormSubmit(form){
	console.log('onFormSubmit: ', form);
	var formData = getFormData(form);
	if(form.getAttribute('data-validate-form')) {
		var valid = validateForm(form);
		if(!valid) return;
		console.log('onFormSubmit valid: ', valid);
	}
	if(form.id === defaults.prefix+'-closechat-form') {
		submitCloseChatForm(form, formData);
	} else if(form.id === defaults.prefix+'-sendmail-form') {
		submitSendMailForm(form, formData);
	} else if(form.id === defaults.prefix+'-intro-form') {
		requestChat(formData);
	}

}

function getFileContent(element, cb){
	var files = element.files,
		file,
		reader;

	if(!files.length) return;
	if(!global.FileReader) {
		if(cb) cb('OBSOLETE_BROWSER');
		return;
	}

	file = files[0];

	reader = new FileReader();
	reader.onload = function(event) {
		if(cb) cb(null, { filedata: event.target.result, filename: file.name });
	};
	reader.onerror = function(event) {
		api.emit('Error', event.target.error);
		if(cb) cb(event.target.error);
	};
	reader.readAsDataURL(file);
}

function messageTemplate(){
	var str = '<div class="'+defaults.prefix+'-message '+defaults.prefix+'-<%=entity %>-msg">' +
					'<span class="'+defaults.prefix+'-message-from"><%=from %></span>' +
					'<span class="'+defaults.prefix+'-message-time"> <%= time %></span>' +
					'<br>' +
					'<p class="'+defaults.prefix+'-message-content" <% if(entity === "user") { %> style="border-color:'+defaults.styles.primary.backgroundColor+'" <% } %>><%=text %></p>' +
				'</div>';
				// '</li>';
	return str;
}

// function agentIsTypingTemplate(){
// 	var str = '<div id="'+defaults.prefix+'-agent-typing" class="'+defaults.prefix+'-agent-typing">' +
// 					'<span><%=aname %></span>' +
// 					'<span> <%= text %></span>' +
// 				'</div>';
// 	return str;
// }

function compileTemplate(template, data){
	var compiled = _.template(template);
	return compiled(data);
}

/********************************
 * Helper functions *
 ********************************/

function detectLanguage(){
	var storageLang = api.getState('lang');
	if(storageLang) {
		return storageLang;
	} else {
		return (navigator.language || navigator.userLanguage).split('-')[0];
	}
}

function browserIsObsolete() {
	console.log('Your browser is obsolete!');
}

function parseTime(ts) {
	var date = new Date(ts),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		time = (hours < 10 ? '0'+hours : hours) + ':' + (minutes < 10 ? '0'+minutes : minutes);

	return time;
}

function parseMessage(text, file){
	var filename;
	if(file) {
		filename = text.substring(text.indexOf('_')+1);
		if(isImage(file)) {
			return '<a href="'+api.options.server+'/ipcc/'+text+'" download="'+filename+'">' +
						'<img src="'+api.options.server+'/ipcc/'+text+'" alt="file preview" />' +
					'</a>';
		} else {
			return '<a href="'+api.options.server+'/ipcc/'+text+'" download="'+filename+'">'+filename+'</a>';
		}
	} else {
		return text.split(" ").map(convertLinks).join(" ");
	}
}

function convertLinks(text){
	var leftovers = 0;
	var href = text;
	if(isLink(text)){

		while(!(href.charAt(href.length-1).match(/[a-z]/i))){
			href = href.slice(0,-1);
			leftovers += 1;
		}
		return '<a href="'+href+'" target="_blank" data-'+defaults.prefix+'-link="'+href+'">'+href+'</a>' + text.substr(text.length - leftovers);
	} else {
		return text;
	}
}

function isLink(text){
	var pattern = new RegExp('http:\/\/|https:\/\/|www');
	return pattern.test(text);
}

function isImage(filename){
	var regex = new RegExp('png|jpg|jpeg|gif');
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
		console.log('validateForm el:', el, el.hasAttribute('required'), el.value, el.type);
		if(el.hasAttribute('required') && (el.value === "" || el.value === null)) {
			alert(frases[currLang].required_error[el.type] || frases[currLang].required_error.fields);
			valid = false;
			return false;
		} else {
			return true;
		}
	});
	console.log('validateForm valid: ', valid);
	return valid;
}

function resetStyles(element){
	element.removeAttribute('style');
}

function PrefixedEvent(element, type, pfx, callback) {
	for (var p = 0; p < pfx.length; p++) {
		if (!pfx[p]) type = type.toLowerCase();
		element.addEventListener(pfx[p]+type, callback, false);
	}
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
