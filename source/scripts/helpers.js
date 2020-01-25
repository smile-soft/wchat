var debug = require('./debug');

module.exports = {
	validateByPattern: validateByPattern,
	phonePatternToRegex: phonePatternToRegex,
	interpolate: interpolate,
	formatPhoneNumber: formatPhoneNumber
};

function validateByPattern(value, pattern) {
	var regex = RegExp(pattern, 'g');
	return regex.test(value);
}

function phonePatternToRegex(pattern) {
	var regex = /x/gi;
	var regexPlus = /\+/gi;
	return ("^"+(pattern.replace(regex, "\\d").replace(regexPlus, '\\+').replace('(', '\\(').replace(')', '\\)').replace(' ', '\\s'))+"$");
}

function interpolate(string, params) {
	return string.replace(/{{(\w*)}}/g, function(match, param, offset, result) {
		if(params[param]) return params[param];
	})
}

function formatPhoneNumber(phone) {
	return phone.replace(/\D+/g, "");
}