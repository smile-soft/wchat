var url = require('url');
var http = require('http');
var cache = {};

function post(postUrl, data, cb){

	// console.log('post request: ', postUrl, data);

	var urlObj = url.parse(postUrl),
		
	json = JSON.stringify(data),

	body = '',

	options = {
		method: 'POST',
		protocol: urlObj.protocol || window.location.protocol,
		hostname: urlObj.hostname,
		port: urlObj.port,
		path: urlObj.path,
		'Content-type': 'application/json; charset=UTF-8',
		'Content-length': json.length
	},

	req = http.request(options, function (res){
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function() {
			// console.log(body);
			if(body === '{}') {
				body = JSON.parse({result: 'OK'});
			}
			
			body = JSON.parse(body);

			if(body.error) {
				cb(body.error);
			} else {
				cb(null, res, body);
			}
		});
	});

	req.on('error', function (err){
		cb(err);
	});

	req.write(json);
	req.end();
}

function get(selector, postUrl, cb){

	var body = '';

	if(selector && cache[selector]) {
		return cb(null, cache[selector]);
	}

	http.get(postUrl, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function() {
			if(selector) cache[selector] = body;
			cb(null, body);
		});
	}).on('error', function(err) {
		cb(err);
	});
}

module.exports = {
	post: post,
	get: get
};
