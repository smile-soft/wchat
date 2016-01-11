var url = require('url');
var http = require('http');

function post(postUrl, data, cb){

	console.log('post request: ', postUrl, data);

	var urlObj = url.parse(postUrl);

	var json = JSON.stringify(data);

	var body = '';

	var options = {
		hostname: urlObj.hostname,
		method: 'POST',
		port: urlObj.port,
		path: urlObj.path,
		'Content-type': 'application/json; charset=UTF-8',
		'Content-length': json.length
	};

	var req = http.request(options, function (res){
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function() {
			console.log(body);
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

function get(postUrl, cb){

	var body = '';

	http.get(postUrl, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function() {
			cb(null, res, body);
		});
	}).on('error', function(err) {
		cb(err);
	});
}

module.exports = {
	post: post,
	get: get
};
