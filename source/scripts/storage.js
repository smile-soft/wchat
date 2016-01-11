var storage = global.localStorage;
var session = global.sessionStorage;
var prefix = 'swc';
var delimiter = '.';

module.exports = {

	get: function(key, location) {
		if(location === 'session') {
			return JSON.parse(session.getItem(prefix+delimiter+key));
		} else {
			return JSON.parse(storage.getItem(prefix+delimiter+key));
		}
	},

	set: function(key, value, location) {
		if(location === 'session') {
			session.setItem(prefix+delimiter+key, JSON.stringify(value));
		} else {
			storage.setItem(prefix+delimiter+key, JSON.stringify(value));
		}
		return value;
	},

	remove: function(key, location) {
		if(location === 'session') {
			session.removeItem(prefix+delimiter+key);
		} else {
			storage.removeItem(prefix+delimiter+key);
		}
	}

};