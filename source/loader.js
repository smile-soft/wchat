(function(win, doc) {
	var ver = win.WchatSettings.version || 'v1',
	name = ((win.WchatSettings.channels && win.WchatSettings.channels.webrtc) ? 'wchat-webrtc.min.js' : 'wchat.min.js'),
	link = (win.WchatSettings.clientPath+ver+'/'),
	tag = 'script',
	el = doc.createElement(tag),
	sib = doc.getElementsByTagName(tag)[0];
	el.src = link+name;
	el.async = 1;
	sib.parentNode.insertBefore(el, sib);
	win.WchatSettings.clientPath = link;
})(window, document);