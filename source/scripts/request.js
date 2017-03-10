var debug = require('./debug');
var cache = {};

module.exports = {
	post: post,
	get: get
};

function post(url, data, cb){

	// debug.log('post request: ', url, data);

	var data = JSON.stringify(data);

	XmlHttpRequest('POST', url, data, function(err, res) {
		debug.log('post respose: ', err, res);

		if(err) return cb(err);

		cb(null, res);
	});
}

function get(selector, url, cb){

	if(selector && cache[selector]) {
		return cb(null, cache[selector]);
	}

	XmlHttpRequest('GET', url, null, function(err, res) {
		if(err) return cb(err);

		if(selector) cache[selector] = res;
		cb(null, res);
	});
}

/**
 * Send request to the server via XMLHttpRequest
 */
function XmlHttpRequest(method, url, data, callback){
	var xhr, response, requestTimer, err;

	xhr = getXmlHttp();
	xhr.open(method, url, true);

	requestTimer = setTimeout(function(){
		xhr.abort();
	}, 60000);
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState==4){
			clearTimeout(requestTimer);
			if(xhr.response) {
				response = method === 'POST' ? JSON.parse(xhr.response) : xhr.response;
				if(response.error) {
					err = response.error;
					callback(err);
				}
				if(callback) {
					callback(null, response);
				}
			}
		}
	};

	if(data !== null) {
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(data);
	} else {
		xhr.send();
	}
}

function getXmlHttp(){
	if(window.XMLHttpRequest){
		return new XMLHttpRequest();
	} else{
		return new ActiveXObject("Microsoft.XMLHTTP");
	}
}
