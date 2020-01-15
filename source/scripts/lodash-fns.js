var _template = require('lodash/template');
var _forEach = require('lodash/foreach');
var _merge = require('lodash/merge');
var _throttle = require('lodash/throttle');

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function findParent(elem, selector) {

    var firstChar = selector.charAt(0);

    // Get closest match
    for ( ; elem && elem !== document; elem = elem.parentNode ) {
        if ( firstChar === '.' ) {
            if ( elem.classList.contains( selector.substr(1) ) ) {
                return elem;
            }
        } else if ( firstChar === '#' ) {
            if ( elem.id === selector.substr(1) ) {
                return elem;
            }
        } else if ( firstChar === '[' ) {
            if (elem.hasAttribute( selector.substr(1, selector.length - 2))) {
                return elem;
            }
        } else {
            if(elem.nodeName === selector.toUpperCase()){
                return elem;
            }
        }
    }

    return false;

}

function poll(fn, callback, errback, timeout, interval) {
    var endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 300;

    (function p() {
        // If the condition is met, we're done! 
        if(fn()) {
            callback();
        }
        // If the condition isn't met but the timeout hasn't elapsed, go again
        else if (Number(new Date()) < endTime) {
            setTimeout(p, interval);
        }
        // Didn't match and too much time, reject!
        else {
            errback(new Error('timed out for ' + fn + ': ' + arguments));
        }
    })();
}

module.exports = {
	template: _template,
	forEach: _forEach,
	merge: _merge,
	throttle: _throttle,
	debounce: debounce,
    poll: poll,
	findParent: findParent
};