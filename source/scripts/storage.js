var storage = global.localStorage;
var session = global.sessionStorage;
var prefix = 'swc';
var delimiter = '.';

// Current cache object
var cache = {
	sid: null,
	eventTimestamp: 0,
	msgTimestamp: 0,
	entity: undefined,
	chat: null
};

module.exports = {
	get: getItem,
	set: setItem,
	remove: removeItem,
	getState: getState,
	saveState: saveState,
	removeState: removeState
};

function getItem(key, location) {
	if(location === 'session') {
		return JSON.parse(session.getItem(prefix+delimiter+key));
	} else {
		return JSON.parse(storage.getItem(prefix+delimiter+key));
	}
}

function setItem(key, value, location) {
	if(location === 'session') {
		session.setItem(prefix+delimiter+key, JSON.stringify(value));
	} else {
		storage.setItem(prefix+delimiter+key, JSON.stringify(value));
	}
	return value;
}

function removeItem(key, location) {
	if(location === 'session') {
		session.removeItem(prefix+delimiter+key);
	} else {
		storage.removeItem(prefix+delimiter+key);
	}
}

/**
 * Get saved property from localStorage or from session cache
 * @param  {String} key      - item key in storage memory
 * @param  {[type]} location - from where to retrieve item. 
 * Could be either "storage" - from localStorage, or "cache" - from session cache
 * @return {String|Object|Function}          - item value
 */
function getState(key, location){
	if(!location) {
		return (cache[key] !== undefined && cache[key] !== null) ? cache[key] : getItem(key);
	} else if(location === 'cache') {
		return cache[key];
	} else {
		return getItem(key, location);
	}
}

function saveState(key, value, location){
	cache[key] = value;
	if(location !== 'cache') {
		setItem(key, value, location);
	}
	return value;
}

function removeState(key, location) {
	delete cache[key];
	removeItem(key);
}
