(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Wchat = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var innerHTMLBug = false;
var bugTestDiv;
if (typeof document !== 'undefined') {
  bugTestDiv = document.createElement('div');
  // Setup
  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
  // Make sure that link elements get serialized correctly by innerHTML
  // This requires a wrapper element in IE
  innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
  bugTestDiv = undefined;
}

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":10,"../internal/baseEach":16,"../internal/createForEach":33}],5:[function(require,module,exports){
var getNative = require('../internal/getNative');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeNow = getNative(Date, 'now');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Date
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => logs the number of milliseconds it took for the deferred function to be invoked
 */
var now = nativeNow || function() {
  return new Date().getTime();
};

module.exports = now;

},{"../internal/getNative":40}],6:[function(require,module,exports){
var isObject = require('../lang/isObject'),
    now = require('../date/now');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed invocations. Provide an options object to indicate that `func`
 * should be invoked on the leading and/or trailing edge of the `wait` timeout.
 * Subsequent calls to the debounced function return the result of the last
 * `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify invoking on the leading
 *  edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be
 *  delayed before it's invoked.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // ensure `batchLog` is invoked once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }));
 *
 * // cancel a debounced call
 * var todoChanges = _.debounce(batchLog, 1000);
 * Object.observe(models.todo, todoChanges);
 *
 * Object.observe(models, function(changes) {
 *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
 *     todoChanges.cancel();
 *   }
 * }, ['delete']);
 *
 * // ...at some point `models.todo` is changed
 * models.todo.completed = true;
 *
 * // ...before 1 second has passed `models.todo` is deleted
 * // which cancels the debounced `todoChanges` call
 * delete models.todo;
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = wait < 0 ? 0 : (+wait || 0);
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = !!options.leading;
    maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }
    lastCalled = 0;
    maxTimeoutId = timeoutId = trailingCall = undefined;
  }

  function complete(isCalled, id) {
    if (id) {
      clearTimeout(id);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (isCalled) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
    }
  }

  function delayed() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0 || remaining > wait) {
      complete(trailingCall, maxTimeoutId);
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  }

  function maxDelayed() {
    complete(trailing, timeoutId);
  }

  function debounced() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0 || remaining > maxWait;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = undefined;
    }
    return result;
  }
  debounced.cancel = cancel;
  return debounced;
}

module.exports = debounce;

},{"../date/now":5,"../lang/isObject":60}],7:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],8:[function(require,module,exports){
var debounce = require('./debounce'),
    isObject = require('../lang/isObject');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed invocations. Provide an options object to indicate
 * that `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. Subsequent calls to the throttled function return the
 * result of the last `func` call.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify invoking on the leading
 *  edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 *
 * // cancel a trailing throttled call
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (options === false) {
    leading = false;
  } else if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
}

module.exports = throttle;

},{"../lang/isObject":60,"./debounce":6}],9:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],10:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],11:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],12:[function(require,module,exports){
/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used by `_.template` to customize its `_.assign` use.
 *
 * **Note:** This function is like `assignDefaults` except that it ignores
 * inherited property values when checking if a property is `undefined`.
 *
 * @private
 * @param {*} objectValue The destination object property value.
 * @param {*} sourceValue The source object property value.
 * @param {string} key The key associated with the object and source values.
 * @param {Object} object The destination object.
 * @returns {*} Returns the value to assign to the destination object.
 */
function assignOwnDefaults(objectValue, sourceValue, key, object) {
  return (objectValue === undefined || !hasOwnProperty.call(object, key))
    ? sourceValue
    : objectValue;
}

module.exports = assignOwnDefaults;

},{}],13:[function(require,module,exports){
var keys = require('../object/keys');

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"../object/keys":65}],14:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"../object/keys":65,"./baseCopy":15}],15:[function(require,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],16:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":19,"./createBaseEach":31}],17:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":32}],18:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":66,"./baseFor":17}],19:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":65,"./baseFor":17}],20:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":60,"./baseIsEqualDeep":21,"./isObjectLike":45}],21:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":55,"../lang/isTypedArray":62,"./equalArrays":34,"./equalByTag":35,"./equalObjects":36}],22:[function(require,module,exports){
var arrayEach = require('./arrayEach'),
    baseMergeDeep = require('./baseMergeDeep'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike'),
    isTypedArray = require('../lang/isTypedArray'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.merge` without support for argument juggling,
 * multiple sources, and `this` binding `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {Object} Returns `object`.
 */
function baseMerge(object, source, customizer, stackA, stackB) {
  if (!isObject(object)) {
    return object;
  }
  var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
      props = isSrcArr ? undefined : keys(source);

  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObjectLike(srcValue)) {
      stackA || (stackA = []);
      stackB || (stackB = []);
      baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
    }
    else {
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
      }
      if ((result !== undefined || (isSrcArr && !(key in object))) &&
          (isCommon || (result === result ? (result !== value) : (value === value)))) {
        object[key] = result;
      }
    }
  });
  return object;
}

module.exports = baseMerge;

},{"../lang/isArray":55,"../lang/isObject":60,"../lang/isTypedArray":62,"../object/keys":65,"./arrayEach":10,"./baseMergeDeep":23,"./isArrayLike":41,"./isObjectLike":45}],23:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isPlainObject = require('../lang/isPlainObject'),
    isTypedArray = require('../lang/isTypedArray'),
    toPlainObject = require('../lang/toPlainObject');

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
  var length = stackA.length,
      srcValue = source[key];

  while (length--) {
    if (stackA[length] == srcValue) {
      object[key] = stackB[length];
      return;
    }
  }
  var value = object[key],
      result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
      isCommon = result === undefined;

  if (isCommon) {
    result = srcValue;
    if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
      result = isArray(value)
        ? value
        : (isArrayLike(value) ? arrayCopy(value) : []);
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      result = isArguments(value)
        ? toPlainObject(value)
        : (isPlainObject(value) ? value : {});
    }
    else {
      isCommon = false;
    }
  }
  // Add the source value to the stack of traversed objects and associate
  // it with its merged value.
  stackA.push(srcValue);
  stackB.push(result);

  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
  } else if (result === result ? (result !== value) : (value === value)) {
    object[key] = result;
  }
}

module.exports = baseMergeDeep;

},{"../lang/isArguments":54,"../lang/isArray":55,"../lang/isPlainObject":61,"../lang/isTypedArray":62,"../lang/toPlainObject":63,"./arrayCopy":9,"./isArrayLike":41}],24:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],25:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],26:[function(require,module,exports){
/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  var index = -1,
      length = props.length,
      result = Array(length);

  while (++index < length) {
    result[index] = object[props[index]];
  }
  return result;
}

module.exports = baseValues;

},{}],27:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":73}],28:[function(require,module,exports){
/**
 * Used by `_.trim` and `_.trimLeft` to get the index of the first character
 * of `string` that is not found in `chars`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @param {string} chars The characters to find.
 * @returns {number} Returns the index of the first character not found in `chars`.
 */
function charsLeftIndex(string, chars) {
  var index = -1,
      length = string.length;

  while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
  return index;
}

module.exports = charsLeftIndex;

},{}],29:[function(require,module,exports){
/**
 * Used by `_.trim` and `_.trimRight` to get the index of the last character
 * of `string` that is not found in `chars`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @param {string} chars The characters to find.
 * @returns {number} Returns the index of the last character not found in `chars`.
 */
function charsRightIndex(string, chars) {
  var index = string.length;

  while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
  return index;
}

module.exports = charsRightIndex;

},{}],30:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isIterateeCall = require('./isIterateeCall'),
    restParam = require('../function/restParam');

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"../function/restParam":7,"./bindCallback":27,"./isIterateeCall":43}],31:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":39,"./isLength":44,"./toObject":51}],32:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":51}],33:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":55,"./bindCallback":27}],34:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":11}],35:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],36:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":65}],37:[function(require,module,exports){
/** Used to map characters to HTML entities. */
var htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/**
 * Used by `_.escape` to convert characters to HTML entities.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */
function escapeHtmlChar(chr) {
  return htmlEscapes[chr];
}

module.exports = escapeHtmlChar;

},{}],38:[function(require,module,exports){
/** Used to escape characters for inclusion in compiled string literals. */
var stringEscapes = {
  '\\': '\\',
  "'": "'",
  '\n': 'n',
  '\r': 'r',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

/**
 * Used by `_.template` to escape characters for inclusion in compiled string literals.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */
function escapeStringChar(chr) {
  return '\\' + stringEscapes[chr];
}

module.exports = escapeStringChar;

},{}],39:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":24}],40:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":59}],41:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":39,"./isLength":44}],42:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],43:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isIndex = require('./isIndex'),
    isObject = require('../lang/isObject');

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"../lang/isObject":60,"./isArrayLike":41,"./isIndex":42}],44:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],45:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],46:[function(require,module,exports){
/**
 * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
 * character code is whitespace.
 *
 * @private
 * @param {number} charCode The character code to inspect.
 * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
 */
function isSpace(charCode) {
  return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
    (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
}

module.exports = isSpace;

},{}],47:[function(require,module,exports){
/** Used to match template delimiters. */
var reEscape = /<%-([\s\S]+?)%>/g;

module.exports = reEscape;

},{}],48:[function(require,module,exports){
/** Used to match template delimiters. */
var reEvaluate = /<%([\s\S]+?)%>/g;

module.exports = reEvaluate;

},{}],49:[function(require,module,exports){
/** Used to match template delimiters. */
var reInterpolate = /<%=([\s\S]+?)%>/g;

module.exports = reInterpolate;

},{}],50:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":54,"../lang/isArray":55,"../object/keysIn":66,"./isIndex":42,"./isLength":44}],51:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":60}],52:[function(require,module,exports){
var isSpace = require('./isSpace');

/**
 * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the first non-whitespace character.
 */
function trimmedLeftIndex(string) {
  var index = -1,
      length = string.length;

  while (++index < length && isSpace(string.charCodeAt(index))) {}
  return index;
}

module.exports = trimmedLeftIndex;

},{"./isSpace":46}],53:[function(require,module,exports){
var isSpace = require('./isSpace');

/**
 * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedRightIndex(string) {
  var index = string.length;

  while (index-- && isSpace(string.charCodeAt(index))) {}
  return index;
}

module.exports = trimmedRightIndex;

},{"./isSpace":46}],54:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":41,"../internal/isObjectLike":45}],55:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":40,"../internal/isLength":44,"../internal/isObjectLike":45}],56:[function(require,module,exports){
var baseIsEqual = require('../internal/baseIsEqual'),
    bindCallback = require('../internal/bindCallback');

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent. If `customizer` is provided it's invoked to compare values.
 * If `customizer` returns `undefined` comparisons are handled by the method
 * instead. The `customizer` is bound to `thisArg` and invoked with up to
 * three arguments: (value, other [, index|key]).
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. Functions and DOM nodes
 * are **not** supported. Provide a customizer function to extend support
 * for comparing other values.
 *
 * @static
 * @memberOf _
 * @alias eq
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize value comparisons.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * object == other;
 * // => false
 *
 * _.isEqual(object, other);
 * // => true
 *
 * // using a customizer callback
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqual(array, other, function(value, other) {
 *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
 *     return true;
 *   }
 * });
 * // => true
 */
function isEqual(value, other, customizer, thisArg) {
  customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqual;

},{"../internal/baseIsEqual":20,"../internal/bindCallback":27}],57:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var errorTag = '[object Error]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
 * `SyntaxError`, `TypeError`, or `URIError` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
 * @example
 *
 * _.isError(new Error);
 * // => true
 *
 * _.isError(Error);
 * // => false
 */
function isError(value) {
  return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
}

module.exports = isError;

},{"../internal/isObjectLike":45}],58:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":60}],59:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":45,"./isFunction":58}],60:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],61:[function(require,module,exports){
var baseForIn = require('../internal/baseForIn'),
    isArguments = require('./isArguments'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"../internal/baseForIn":18,"../internal/isObjectLike":45,"./isArguments":54}],62:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":44,"../internal/isObjectLike":45}],63:[function(require,module,exports){
var baseCopy = require('../internal/baseCopy'),
    keysIn = require('../object/keysIn');

/**
 * Converts `value` to a plain object flattening inherited enumerable
 * properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return baseCopy(value, keysIn(value));
}

module.exports = toPlainObject;

},{"../internal/baseCopy":15,"../object/keysIn":66}],64:[function(require,module,exports){
var assignWith = require('../internal/assignWith'),
    baseAssign = require('../internal/baseAssign'),
    createAssigner = require('../internal/createAssigner');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it's invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"../internal/assignWith":13,"../internal/baseAssign":14,"../internal/createAssigner":30}],65:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":40,"../internal/isArrayLike":41,"../internal/shimKeys":50,"../lang/isObject":60}],66:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":42,"../internal/isLength":44,"../lang/isArguments":54,"../lang/isArray":55,"../lang/isObject":60}],67:[function(require,module,exports){
var baseMerge = require('../internal/baseMerge'),
    createAssigner = require('../internal/createAssigner');

/**
 * Recursively merges own enumerable properties of the source object(s), that
 * don't resolve to `undefined` into the destination object. Subsequent sources
 * overwrite property assignments of previous sources. If `customizer` is
 * provided it's invoked to produce the merged values of the destination and
 * source properties. If `customizer` returns `undefined` merging is handled
 * by the method instead. The `customizer` is bound to `thisArg` and invoked
 * with five arguments: (objectValue, sourceValue, key, object, source).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var users = {
 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
 * };
 *
 * var ages = {
 *   'data': [{ 'age': 36 }, { 'age': 40 }]
 * };
 *
 * _.merge(users, ages);
 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
 *
 * // using a customizer callback
 * var object = {
 *   'fruits': ['apple'],
 *   'vegetables': ['beet']
 * };
 *
 * var other = {
 *   'fruits': ['banana'],
 *   'vegetables': ['carrot']
 * };
 *
 * _.merge(object, other, function(a, b) {
 *   if (_.isArray(a)) {
 *     return a.concat(b);
 *   }
 * });
 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
 */
var merge = createAssigner(baseMerge);

module.exports = merge;

},{"../internal/baseMerge":22,"../internal/createAssigner":30}],68:[function(require,module,exports){
var baseToString = require('../internal/baseToString'),
    escapeHtmlChar = require('../internal/escapeHtmlChar');

/** Used to match HTML entities and HTML characters. */
var reUnescapedHtml = /[&<>"'`]/g,
    reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
 * their corresponding HTML entities.
 *
 * **Note:** No other characters are escaped. To escape additional characters
 * use a third-party library like [_he_](https://mths.be/he).
 *
 * Though the ">" character is escaped for symmetry, characters like
 * ">" and "/" don't need escaping in HTML and have no special meaning
 * unless they're part of a tag or unquoted attribute value.
 * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
 * (under "semi-related fun fact") for more details.
 *
 * Backticks are escaped because in Internet Explorer < 9, they can break out
 * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
 * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
 * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
 * for more details.
 *
 * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
 * to reduce XSS vectors.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escape('fred, barney, & pebbles');
 * // => 'fred, barney, &amp; pebbles'
 */
function escape(string) {
  // Reset `lastIndex` because in IE < 9 `String#replace` does not.
  string = baseToString(string);
  return (string && reHasUnescapedHtml.test(string))
    ? string.replace(reUnescapedHtml, escapeHtmlChar)
    : string;
}

module.exports = escape;

},{"../internal/baseToString":25,"../internal/escapeHtmlChar":37}],69:[function(require,module,exports){
var assignOwnDefaults = require('../internal/assignOwnDefaults'),
    assignWith = require('../internal/assignWith'),
    attempt = require('../utility/attempt'),
    baseAssign = require('../internal/baseAssign'),
    baseToString = require('../internal/baseToString'),
    baseValues = require('../internal/baseValues'),
    escapeStringChar = require('../internal/escapeStringChar'),
    isError = require('../lang/isError'),
    isIterateeCall = require('../internal/isIterateeCall'),
    keys = require('../object/keys'),
    reInterpolate = require('../internal/reInterpolate'),
    templateSettings = require('./templateSettings');

/** Used to match empty string literals in compiled template source. */
var reEmptyStringLeading = /\b__p \+= '';/g,
    reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

/** Used to ensure capturing order of template delimiters. */
var reNoMatch = /($^)/;

/** Used to match unescaped characters in compiled string literals. */
var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

/**
 * Creates a compiled template function that can interpolate data properties
 * in "interpolate" delimiters, HTML-escape interpolated data properties in
 * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
 * properties may be accessed as free variables in the template. If a setting
 * object is provided it takes precedence over `_.templateSettings` values.
 *
 * **Note:** In the development build `_.template` utilizes
 * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
 * for easier debugging.
 *
 * For more information on precompiling templates see
 * [lodash's custom builds documentation](https://lodash.com/custom-builds).
 *
 * For more information on Chrome extension sandboxes see
 * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The template string.
 * @param {Object} [options] The options object.
 * @param {RegExp} [options.escape] The HTML "escape" delimiter.
 * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
 * @param {Object} [options.imports] An object to import into the template as free variables.
 * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
 * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
 * @param {string} [options.variable] The data object variable name.
 * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
 * @returns {Function} Returns the compiled template function.
 * @example
 *
 * // using the "interpolate" delimiter to create a compiled template
 * var compiled = _.template('hello <%= user %>!');
 * compiled({ 'user': 'fred' });
 * // => 'hello fred!'
 *
 * // using the HTML "escape" delimiter to escape data property values
 * var compiled = _.template('<b><%- value %></b>');
 * compiled({ 'value': '<script>' });
 * // => '<b>&lt;script&gt;</b>'
 *
 * // using the "evaluate" delimiter to execute JavaScript and generate HTML
 * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
 * compiled({ 'users': ['fred', 'barney'] });
 * // => '<li>fred</li><li>barney</li>'
 *
 * // using the internal `print` function in "evaluate" delimiters
 * var compiled = _.template('<% print("hello " + user); %>!');
 * compiled({ 'user': 'barney' });
 * // => 'hello barney!'
 *
 * // using the ES delimiter as an alternative to the default "interpolate" delimiter
 * var compiled = _.template('hello ${ user }!');
 * compiled({ 'user': 'pebbles' });
 * // => 'hello pebbles!'
 *
 * // using custom template delimiters
 * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
 * var compiled = _.template('hello {{ user }}!');
 * compiled({ 'user': 'mustache' });
 * // => 'hello mustache!'
 *
 * // using backslashes to treat delimiters as plain text
 * var compiled = _.template('<%= "\\<%- value %\\>" %>');
 * compiled({ 'value': 'ignored' });
 * // => '<%- value %>'
 *
 * // using the `imports` option to import `jQuery` as `jq`
 * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
 * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
 * compiled({ 'users': ['fred', 'barney'] });
 * // => '<li>fred</li><li>barney</li>'
 *
 * // using the `sourceURL` option to specify a custom sourceURL for the template
 * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
 * compiled(data);
 * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
 *
 * // using the `variable` option to ensure a with-statement isn't used in the compiled template
 * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
 * compiled.source;
 * // => function(data) {
 * //   var __t, __p = '';
 * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
 * //   return __p;
 * // }
 *
 * // using the `source` property to inline compiled templates for meaningful
 * // line numbers in error messages and a stack trace
 * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
 *   var JST = {\
 *     "main": ' + _.template(mainText).source + '\
 *   };\
 * ');
 */
function template(string, options, otherOptions) {
  // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
  // and Laura Doktorova's doT.js (https://github.com/olado/doT).
  var settings = templateSettings.imports._.templateSettings || templateSettings;

  if (otherOptions && isIterateeCall(string, options, otherOptions)) {
    options = otherOptions = undefined;
  }
  string = baseToString(string);
  options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

  var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
      importsKeys = keys(imports),
      importsValues = baseValues(imports, importsKeys);

  var isEscaping,
      isEvaluating,
      index = 0,
      interpolate = options.interpolate || reNoMatch,
      source = "__p += '";

  // Compile the regexp to match each delimiter.
  var reDelimiters = RegExp(
    (options.escape || reNoMatch).source + '|' +
    interpolate.source + '|' +
    (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
    (options.evaluate || reNoMatch).source + '|$'
  , 'g');

  // Use a sourceURL for easier debugging.
  var sourceURL = 'sourceURL' in options ? '//# sourceURL=' + options.sourceURL + '\n' : '';

  string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
    interpolateValue || (interpolateValue = esTemplateValue);

    // Escape characters that can't be included in string literals.
    source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

    // Replace delimiters with snippets.
    if (escapeValue) {
      isEscaping = true;
      source += "' +\n__e(" + escapeValue + ") +\n'";
    }
    if (evaluateValue) {
      isEvaluating = true;
      source += "';\n" + evaluateValue + ";\n__p += '";
    }
    if (interpolateValue) {
      source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
    }
    index = offset + match.length;

    // The JS engine embedded in Adobe products requires returning the `match`
    // string in order to produce the correct `offset` value.
    return match;
  });

  source += "';\n";

  // If `variable` is not specified wrap a with-statement around the generated
  // code to add the data object to the top of the scope chain.
  var variable = options.variable;
  if (!variable) {
    source = 'with (obj) {\n' + source + '\n}\n';
  }
  // Cleanup code by stripping empty strings.
  source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
    .replace(reEmptyStringMiddle, '$1')
    .replace(reEmptyStringTrailing, '$1;');

  // Frame code as the function body.
  source = 'function(' + (variable || 'obj') + ') {\n' +
    (variable
      ? ''
      : 'obj || (obj = {});\n'
    ) +
    "var __t, __p = ''" +
    (isEscaping
       ? ', __e = _.escape'
       : ''
    ) +
    (isEvaluating
      ? ', __j = Array.prototype.join;\n' +
        "function print() { __p += __j.call(arguments, '') }\n"
      : ';\n'
    ) +
    source +
    'return __p\n}';

  var result = attempt(function() {
    return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
  });

  // Provide the compiled function's source by its `toString` method or
  // the `source` property as a convenience for inlining compiled templates.
  result.source = source;
  if (isError(result)) {
    throw result;
  }
  return result;
}

module.exports = template;

},{"../internal/assignOwnDefaults":12,"../internal/assignWith":13,"../internal/baseAssign":14,"../internal/baseToString":25,"../internal/baseValues":26,"../internal/escapeStringChar":38,"../internal/isIterateeCall":43,"../internal/reInterpolate":49,"../lang/isError":57,"../object/keys":65,"../utility/attempt":72,"./templateSettings":70}],70:[function(require,module,exports){
var escape = require('./escape'),
    reEscape = require('../internal/reEscape'),
    reEvaluate = require('../internal/reEvaluate'),
    reInterpolate = require('../internal/reInterpolate');

/**
 * By default, the template delimiters used by lodash are like those in
 * embedded Ruby (ERB). Change the following template settings to use
 * alternative delimiters.
 *
 * @static
 * @memberOf _
 * @type Object
 */
var templateSettings = {

  /**
   * Used to detect `data` property values to be HTML-escaped.
   *
   * @memberOf _.templateSettings
   * @type RegExp
   */
  'escape': reEscape,

  /**
   * Used to detect code to be evaluated.
   *
   * @memberOf _.templateSettings
   * @type RegExp
   */
  'evaluate': reEvaluate,

  /**
   * Used to detect `data` property values to inject.
   *
   * @memberOf _.templateSettings
   * @type RegExp
   */
  'interpolate': reInterpolate,

  /**
   * Used to reference the data object in the template text.
   *
   * @memberOf _.templateSettings
   * @type string
   */
  'variable': '',

  /**
   * Used to import variables into the compiled template.
   *
   * @memberOf _.templateSettings
   * @type Object
   */
  'imports': {

    /**
     * A reference to the `lodash` function.
     *
     * @memberOf _.templateSettings.imports
     * @type Function
     */
    '_': { 'escape': escape }
  }
};

module.exports = templateSettings;

},{"../internal/reEscape":47,"../internal/reEvaluate":48,"../internal/reInterpolate":49,"./escape":68}],71:[function(require,module,exports){
var baseToString = require('../internal/baseToString'),
    charsLeftIndex = require('../internal/charsLeftIndex'),
    charsRightIndex = require('../internal/charsRightIndex'),
    isIterateeCall = require('../internal/isIterateeCall'),
    trimmedLeftIndex = require('../internal/trimmedLeftIndex'),
    trimmedRightIndex = require('../internal/trimmedRightIndex');

/**
 * Removes leading and trailing whitespace or specified characters from `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to trim.
 * @param {string} [chars=whitespace] The characters to trim.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {string} Returns the trimmed string.
 * @example
 *
 * _.trim('  abc  ');
 * // => 'abc'
 *
 * _.trim('-_-abc-_-', '_-');
 * // => 'abc'
 *
 * _.map(['  foo  ', '  bar  '], _.trim);
 * // => ['foo', 'bar']
 */
function trim(string, chars, guard) {
  var value = string;
  string = baseToString(string);
  if (!string) {
    return string;
  }
  if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
    return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
  }
  chars = (chars + '');
  return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
}

module.exports = trim;

},{"../internal/baseToString":25,"../internal/charsLeftIndex":28,"../internal/charsRightIndex":29,"../internal/isIterateeCall":43,"../internal/trimmedLeftIndex":52,"../internal/trimmedRightIndex":53}],72:[function(require,module,exports){
var isError = require('../lang/isError'),
    restParam = require('../function/restParam');

/**
 * Attempts to invoke `func`, returning either the result or the caught error
 * object. Any additional arguments are provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Function} func The function to attempt.
 * @returns {*} Returns the `func` result or error object.
 * @example
 *
 * // avoid throwing errors for invalid selectors
 * var elements = _.attempt(function(selector) {
 *   return document.querySelectorAll(selector);
 * }, '>_>');
 *
 * if (_.isError(elements)) {
 *   elements = [];
 * }
 */
var attempt = restParam(function(func, args) {
  try {
    return func.apply(undefined, args);
  } catch(e) {
    return isError(e) ? e : new Error(e);
  }
});

module.exports = attempt;

},{"../function/restParam":7,"../lang/isError":57}],73:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],74:[function(require,module,exports){
var audioEl;
var dir = '';
var format = 'wav';
var volume = 0.5;

module.exports = {

	init: function(soundsDir) {
		audioEl = document.createElement('audio');
		audioEl.setAttribute('autoplay', true);
		if(soundsDir) dir = soundsDir;
		return this;
	},

	play: function(filename, loop) {
		if(filename) audioEl.src = (dir + filename + '.' + format);
		loop ? audioEl.setAttribute('loop', true) : audioEl.removeAttribute('loop');
		audioEl.volume = volume;
		audioEl.play();
	},

	stop: function() {
		audioEl.pause();
		audioEl.currentTime = 0;
	}

};
},{}],75:[function(require,module,exports){
var _ = require('./lodash');
var debug = require('./debug');
var remoteEvents = [];
var localEvents = [];
var initiated = false;
var shared = false;
var cursor = null;
var widget;
var entity = '';
var emit;
var path = '';
var eventTimestamp = 0;
// var updateInterval = null;
// var updateIntervalValue = 5000;
// var updateStateInterval = null;
// var checkEvery = _.debounce(unshareBrowser, 30000);
var checkEvery = _.debounce(emitEvents, 300);
var cursorX = 0, cursorY = 0;
var requestAF;

module.exports = {
	init: init,
	isInitiated: isInitiated,
	share: shareBrowser,
	unshare: unshareBrowser,
	// unshareAll: unshareAll,
	emitEvents: emitEvents,
	updateEvents: updateEvents
};

function isInitiated() {
	return initiated;
}

function init(options){
	if(initiated) return debug.info('Cobrowsing already initiated');

	addEvent(document, 'keyup', eventsHandler);
	addEvent(document, 'keydown', eventsHandler);
	addEvent(document, 'keypress', eventsHandler);
	addEvent(document, 'mouseup', eventsHandler);
	addEvent(document, 'click', eventsHandler);
	addEvent(document, 'change', eventsHandler);

	widget = (typeof options.widget === 'string') ? document.querySelector(options.widget) : options.widget;
	entity = options.entity;
	emit = options.emit;
	path = options.path;

	initiated = true;
	// updateInterval = setInterval(emitEvents, updateIntervalValue);

	debug.log('cobrowsing module initiated with parameters: ', options);
	emit('cobrowsing/init');
}

function shareBrowser(){
    if(shared) return debug.info('Browser already shared');
    addEvent(document, 'scroll', eventsHandler);
    addEvent(document, 'select', eventsHandler);
    addEvent(document, 'mousemove', eventsHandler);

    // addEvent(document, 'mouseover', eventsHandler);
    // addEvent(document, 'mouseout', eventsHandler);
    
    createRemoteCursor();
    
    shared = true;
    // updateStateInterval = setInterval(updateState, updateIntervalValue);
    // clearInterval(updateInterval);

    debug.log('browser shared');
    emit('cobrowsing/shared', { entity: entity });
}

function unshareBrowser(){
	if(!shared) return debug.info('Browser already unshared');

    removeEvent(document, 'scroll', eventsHandler);
    removeEvent(document, 'select', eventsHandler);
    removeEvent(document, 'mousemove', eventsHandler);

    // removeEvent(document, 'mouseover', eventsHandler);
    // removeEvent(document, 'mouseout', eventsHandler);
    
    removeRemoteCursor();
    shared = false;
    // updateInterval = setInterval(emitEvents, updateIntervalValue);
    // clearInterval(updateStateInterval);

	emit('cobrowsing/unshared', { entity: entity });
    debug.log('browser unshared');
}

// function unshareAll(){
	// removeEvent(document, 'keyup', eventsHandler);
	// removeEvent(document, 'keydown', eventsHandler);
	// removeEvent(document, 'keypress', eventsHandler);
	// removeEvent(document, 'mouseup', eventsHandler);
	// removeEvent(document, 'click', eventsHandler);
	// removeEvent(document, 'change', eventsHandler);
	// clearInterval(updateInterval);
// }

function createRemoteCursor(){
	var body = document.body;
	if(!cursor) {
		cursor= document.createElement('img');
		cursor.className = 'wc-rmt-ptr';
		cursor.setAttribute('src', path+'images/pointer.png');
		cursor.style.position = 'absolute';
		if(body.firstChild) {
			body.insertBefore(cursor, body.firstChild);
		} else {
			body.appendChild(cursor);
	
		}
		redrawCursor();
	}
}

function redrawCursor(){
	cursor.style.left = cursorX;
	cursor.style.top = cursorY;
	requestAF = window.requestAnimationFrame(redrawCursor);
}

function removeRemoteCursor(){
	if(!cursor) return;
	cancelAnimationFrame(requestAF);
	cursor.parentNode.removeChild(cursor);
	cursor = null;
}

//from http://stackoverflow.com/questions/2897155/get-cursor-position-in-characters-within-a-text-input-field
function getCaretPosition (oField) {
  // Initialize
	var iCaretPos = 0;

  // IE Support
    if (document.selection) {

    // Set focus on the element
        oField.focus ();

    // To get cursor position, get empty selection range
        var oSel = document.selection.createRange ();

    // Move selection start to 0 position
        oSel.moveStart ('character', -oField.value.length);

    // The caret position is selection length
        iCaretPos = oSel.text.length;
    }
    else if(oField.type && (oField.type === 'email' || oField.type === 'number')){
        iCaretPos = null;
    }
  // Firefox support
    else if (oField.selectionStart || oField.selectionStart == '0'){
        iCaretPos = oField.selectionStart;
    }
    else {
        iCaretPos = null;
    }
	// Return results
	return (iCaretPos);
}

function emitEvents(){
	// if(!shared && !localEvents.length) return;
	emit('cobrowsing/event', { entity: entity, events: localEvents });
	localEvents = [];
}

// function updateState(){
// 	localEvents.push({ shared: true, entity: entity });
// }

function eventsHandler(evt){
	var e = evt || window.event,
		etype = e.type,
		targ = e.target,
		nodeName = targ.nodeName,
		db = document.body,
		params = {},
		nodeIndex = null,
		nodes = document.getElementsByTagName(targ.nodeName),
		scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
		scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft,
		i = 0;

	// if the target is text node, get parent node
	if(targ.nodeType === 3) targ = targ.parentNode;

	// return if the target node is the descendant of widget element
	if(entity === 'user' && isDescendant(widget, targ)) return;

	for(i=0; i < remoteEvents.length; i++){
		if(remoteEvents[i].event == etype){
			remoteEvents.splice(i, 1);
			return;
		}
	}

	// get the index of target node
	for(i=0; i<nodes.length; i++){
		if(nodes[i] == targ) nodeIndex = i;
	}

	// event type
	params.event = etype;
	// entity
	params.entity = entity;
	// target node
	params.tn = nodeName;
	// index of the target node
	params.tni = nodeIndex;
	// layout width of the document.body
	params.w = db.offsetWidth;
	// layout height of the document.body
	params.h = db.offsetHeight;
	params.sx = scrollLeft;
	params.sy = scrollTop;

	if(etype === 'mousemove' || etype === 'mouseover' || etype === 'mouseout') {
		var x = e.pageX || e.clientX + scrollTop;
		var y = e.pageY || e.clientY + scrollLeft;

		// cursor horisontal postion
		params.x = x;
		// cursor vertical position
		params.y = y;

		// for(i=0; i < localEvents.length; i++) {
		// 	if(localEvents[i].indexOf(etype) != -1) {
		// 		localEvents.splice(i, 1);
		// 		break;
		// 	}
		// }
	} else if(etype === 'scroll') {
		// for(i=0; i < localEvents.length; i++) {
		// 	if(localEvents[i].indexOf('scroll') != -1) {
		// 		localEvents.splice(i, 1);
		// 		break;
		// 	}
		// }
		
		// var st = window.pageYOffset || document.documentElement.scrollTop;
		// var sl = window.pageXOffset || document.documentElement.scrollLeft;

	} else if(etype == 'keyup' || etype == 'keydown' || etype == 'keypress') {
		var code = e.charCode || e.keyCode || e.which;
		var c = getCaretPosition(targ);

		if(nodeName === 'INPUT' && targ.type === 'password') return;

		if(etype == 'keyup') {
			if((c === null) || (code == 86 && (e.metaKey || e.ctrlKey))) {
				var tvalue = targ.value;
				if(tvalue) {
					tvalue = tvalue.replace(/\n/g, '<br>');
					// the value attribute of the target node, if exists
					params.value = tvalue;
				}
			} else {
				return;
			}
		} else if(etype == 'keydown') {
			if(c !== null && (code == 8 || code == 46 || code == 190)) {
				if(!targ.value) return;
				// caret position
				params.pos = c;
				// char code
				params.code = code;
			} else {
				return;
			}
		} else if(etype === 'keypress') {
			if(c !== null && code != 8 && code != 46) {
				// caret position
				params.pos = c;
				// char code
				params.code = code;
			} else {
				return;
			}
		}
	} else if(etype === 'change') {
		if(nodeName === 'INPUT' && targ.type === 'password') return;
		params.value = targ.value;

	} else if(etype == 'mouseup' || etype == 'select'){
		var selection = window.getSelection() || document.selection.createRange().text,
			so = selection.anchorOffset,
			eo = selection.focusOffset,
			anchorParentNodeIndex = 0,
			anchorParentNodeName = '',
			anchorNodeIndex = 0,
			anchorParent = '',
			focusParentNodeIndex = 0,
			focusParentNodeName = '',
			focusNodeIndex = 0,
			focusParent = '',
			reverse = false;

		if(selection.anchorNode !== null) {
			anchorParent = selection.anchorNode.parentNode;

			for(i=0; i<anchorParent.childNodes.length;i++) {
				if(anchorParent.childNodes[i] == selection.anchorNode) anchorNodeIndex = i;
			}
			
			anchorParentNodeName = anchorParent.nodeName.toLowerCase();
			nodes = document.getElementsByTagName(anchorParentNodeName);
			for(i=0;i<nodes.length;i++) {
				if(nodes[i] === anchorParent) anchorParentNodeIndex = i;
			}
			
			focusParent = selection.focusNode.parentNode;
			for(i=0; i<focusParent.childNodes.length;i++) {
				if(focusParent.childNodes[i] == selection.focusNode) focusNodeIndex = i;
			}
			
			focusParentNodeName = focusParent.nodeName.toLowerCase();
			nodes = document.getElementsByTagName(focusParentNodeName);
			for(i=0;i<nodes.length;i++) {
				if(nodes[i] === focusParent) focusParentNodeIndex = i;
			}
			

			if(anchorParentNodeName === focusParentNodeName &&
				anchorParentNodeIndex === focusParentNodeIndex &&
					anchorNodeIndex === focusNodeIndex &&
						so > eo)
							reverse = true;

			// name of the target node where selection started
			params.sn = anchorParentNodeName;
			params.sni = anchorParentNodeIndex;
			params.schi = anchorNodeIndex;
			// name of the target node where selection ended
			params.en = focusParentNodeName;
			params.eni = focusParentNodeIndex;
			params.echi = focusNodeIndex;
			params.so = reverse ? eo : so;
			params.eo = reverse ? so : eo;
		}
	} else if(etype == 'click') {
		params.scx = e.screenX;
		params.scy = e.screenY;
	}

	// debug.log('eventsHandler: ', params);
	localEvents.push(params);
	emitEvents();
	// checkEvery();
}

function updateEvents(result){
	var mainElement = document.documentElement,
		target,
		evt = {};

	if(result.events && result.events.length) {

		// check for scrollTop/Left. 
		// IE and Firefox always return 0 from document.body.scrollTop/Left, 
		// while other browsers return 0 from document.documentElement
		// mainElement = ('ActiveXObject' in window || typeof InstallTrigger !== 'undefined') ? document.documentElement : document.body;

		for(var i=0; i<result.events.length; i++) {
			evt = result.events[i];

			// if(evt.shared !== undefined) debug.log('shared events', eventTimestamp, evt, result.init);
			if(evt.timestamp < eventTimestamp) continue;
			if(evt.entity === entity) continue;
					
			// if(evt.shared !== undefined){
			// 	if(evt.shared){
			// 		checkEvery();
			// 		shareBrowser();
			// 	} else {
			// 		if(!result.historyEvents) unshareBrowser();
			// 	}
			// }
			if(evt.url) {
				// if(!result.historyEvents) {
					var url = evt.url;
					var docUrl = document.URL;
					if(docUrl.indexOf('chatSessionId') !== -1) {
						docUrl = docUrl.substr(0, docUrl.indexOf('chatSessionId')-1);
					}
					if(url != docUrl) changeURL(url);
				// }
			}
			if(evt.w){
				if(evt.entity === 'user') {
					var body = document.body;
					var innerW = body.offsetWidth;
					if(innerW !== evt.w) {
						document.body.style.width = evt.w + 'px';
					}
				}
			}
			if(evt.event === 'mousemove') {
				if(cursor) {
					cursorX = evt.x + 'px';
					cursorY = evt.y + 'px';
					// cursor.style.left = evt.x + 'px';
					// cursor.style.top = evt.y + 'px';
				}
			} else if(evt.event === 'scroll') {
				if(evt.tn !== undefined) {
					if(evt.tn === '#document') target = mainElement;
					else target = document.getElementsByTagName(evt.tn)[evt.tni];
					if(target){
						target.scrollTop = evt.sy;
						target.scrollLeft = evt.sx;
					}

					console.log('scroll event: ', target, evt.sy);
				}
			} else if(evt.event === 'mouseup' || evt.event === 'select'){
				if(evt.sn) {
					var startNode = document.getElementsByTagName(evt.sn)[evt.sni];
					var endNode = document.getElementsByTagName(evt.en)[evt.eni];
					if(document.createRange && startNode !== undefined && endNode !== undefined) {
						var rng = document.createRange();
						rng.setStart(startNode.childNodes[evt.schi], evt.so);
						rng.setEnd(endNode.childNodes[evt.echi], evt.eo);
						var sel = window.getSelection();
						sel.removeAllRanges();
						sel.addRange(rng);
					}
				}
			} else if(evt.event === 'keyup' || evt.event === 'keydown' || evt.event === 'keypress') {
				if(evt.tn !== undefined && evt.tni !== undefined) {
					target = document.getElementsByTagName(evt.tn)[evt.tni];
					if(target){
						var output;
						var a = target.value;
						if(evt.code == 8) {
							if(evt.pos == a.length-1) output = a.substr(0, evt.pos-1);
							else if(evt.pos === 0) return;
							else output = a.substr(0, evt.pos-1) + a.substr(evt.pos);
							target.value = output;
						} else if(evt.code == 46) {
							output = a.substr(0, evt.pos) + a.substr(evt.pos+1);
							target.value = output;
						} else if(evt.code == 190) {
							output = a.substr(0, evt.pos) + '.' + a.substr(evt.pos);
							target.value = output;
						} else if(evt.value !== undefined) {
							var tvalue = evt.value;
							tvalue = tvalue.replace(/<br>/g, '\n');
							target.value = tvalue;
						} else {
							var c = String.fromCharCode(evt.code);
							if(a) output = a.substr(0, evt.pos) + c + a.substr(evt.pos);
							else output = c;
							target.value = output;
						}
					}
				}
			} else if(evt.event === 'change') {
				target = document.getElementsByTagName(evt.tn)[evt.tni];
				target.value = evt.value;
			} else if(evt.event === 'click'){
				// var elements = document.getElementsByTagName(evt.tn.toLowerCase());
				target = document.getElementsByTagName(evt.tn)[evt.tni];
				if(target) target.click();
				// elements[evt.tni].style.backgroundColor = 'yellow';
			} else {
				target = document.getElementsByTagName(evt.tn)[evt.tni];
				if(target) {
					var evtOpts = mouseEvent(evt.event, evt.x, evt.y, evt.x, evt.y);
					dispatchEvent(target, evtOpts);
				}
			}

			if(evt.event === 'click' || evt.event === 'scroll') remoteEvents.push(evt);
		}
	}

	if(result.timestamp) eventTimestamp = result.timestamp;
	// if(shared) emitEvents();
}

function mouseEvent(type, sx, sy, cx, cy) {
	var evt;
	var e = {
		bubbles: true,
		cancelable: (type != "mousemove"),
		view: window,
		detail: 0,
		screenX: sx,
		screenY: sy,
		clientX: cx,
		clientY: cy,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		metaKey: false,
		button: 0,
		relatedTarget: undefined
	};
	if (typeof( document.createEvent ) == "function") {
		evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(
			type,
			e.bubbles,
			e.cancelable,
			e.view,
			e.detail,
			e.screenX,
			e.screenY,
			e.clientX,
			e.clientY,
			e.ctrlKey,
			e.altKey,
			e.shiftKey,
			e.metaKey,
			e.button,
			document.body.parentNode
		);
	} else if (document.createEventObject) {
		evt = document.createEventObject();
		for (var prop in e) {
			evt[prop] = e[prop];
		}
		evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
	}
	return evt;
}
function dispatchEvent (el, evt) {
	if (el.dispatchEvent) {
		el.dispatchEvent(evt);
	} else if (el.fireEvent) {
		el.fireEvent('on' + type, evt);
	}
	return evt;
}

function changeURL(url) {
    var docUrl = document.URL;
    if (docUrl !== url) {
		document.location.href = url;
    }
}

function isDescendant(parent, child) {
     var node = child.parentNode;
     while (node != null) {
         if (node == parent) return true;
         node = node.parentNode;
     }
     return false;
}

function addEvent(obj, evType, fn) {
  if (obj.addEventListener) obj.addEventListener(evType, fn, false);
  else if (obj.attachEvent) obj.attachEvent("on"+evType, fn);
}
function removeEvent(obj, evType, fn) {
  if (obj.removeEventListener) obj.removeEventListener(evType, fn, false);
  else if (obj.detachEvent) obj.detachEvent("on"+evType, fn);
}
},{"./debug":77,"./lodash":78}],76:[function(require,module,exports){
(function (global){
var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
// var websockets = require('./websockets');
// var url = require('url').parse(document.URL, true);
var url = global.location;
var _ = require('./lodash');
var inherits = require('inherits');
var websocketTry = 1;
var pollTurns = 1;
var mainAddress = "main.ringotel.net/chatbot/WebChat/";
var publicUrl = "https://main.ringotel.net/public/";
var websocketUrl = "";
var moduleInit = false;

/**
 * Core module implements main internal functionality
 * 
 * @param  {Object} options Instantiation options that overrides module defaults
 * @return {Object}         Return public API
 */

var defaults = {
	// IPCC server IP address/domain name and port number.
	// ex.: "http://192.168.1.100:8880"
	server: ''
};

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = _.assign(defaults, options || {});
	this.options.serverUrl = this.options.server + '/ipcc/$$$';
	this.session = {};

	if(!this.options.pageid) return console.error('Cannot initiate module: pageid is undefined');

	websocketUrl = mainAddress+this.options.pageid;

	this.createWebsocket();

	this.on('session/create', function(data) {
		this.session = data;
		storage.saveState('sid', data.sid);
	}.bind(this));
	this.on('chat/close', function(data) {
		storage.saveState('chat', false);
	});
	this.on('Error', this.onError);

	return this;

}

WchatAPI.prototype.onError = function(err){
	debug.error(err);
	if(err.code === 404) {
		this.emit('session/timeout');
	}
};

WchatAPI.prototype.sendData = function(data){
	if(this.websocket) this.websocket.send(JSON.stringify(data));
};

/**
 * Websocket messages handler
 */
WchatAPI.prototype.onWebsocketMessage = function(e){
	// this.emit('websocket/message', (e.data ? JSON.parse(e.data) : {}));
	var data = JSON.parse(e.data),
	    method = data.method;

	debug.log('onWebsocketMessage: ', data);
	
	if(data.method) {
		if(data.method === 'session') {
			this.emit('session/create', data.params);

		} else if(data.method === 'messages') {
			if(data.params.list) {
				data.params.list.map(function(item) {
					this.emit('message/new', item);
					return item;
				}.bind(this));
			}
		} else if(data.method === 'message') {
			if(data.params.typing) {
				this.emit('message/typing');
			} else {
				this.emit('message/new', data.params);
			}		
		} else if(data.method === 'openShare') { // init users share state
			if(data.params.id) {
				storage.saveState('sharedId', data.params.id, 'cache');
				this.emit('session/join', { url: url.href });
				this.shareOpened(data.params.id, url.href); // send confirmation to agent
			}
		} else if(data.method === 'shareOpened') { // init agent share state
			if(data.params.id) {
				clearInterval(this.openShareInteval);
				storage.saveState('sharedId', data.params.id, 'cache');
				this.emit('session/join', { url: url.href });
			}
		} else if(data.method === 'shareClosed') { // init agent share state
			this.emit('session/disjoin');

		} else if(data.method === 'events') {
			this.emit('cobrowsing/update', { events: data.params.events });
		}
	}
};

/**
 * Module initiation
 * Emits module/start event if module started
 */
// WchatAPI.prototype.initModule = function(){

	// _.poll(function(){
	// 	return (websocketInit === true);
	// }, function() {
	// 	debug.log('INIT');
	// 	this.init();
	// }.bind(this), function(){
	// 	if(pollTurns < 2) {
	// 		pollTurns++;
	// 	} else {
	// 		return this.emit('Error', 'Module wasn\'t initiated due to network error');
	// 	}
	// }.bind(this), 60000);
// };

WchatAPI.prototype.init = function(){
	moduleInit = true;

	var entity = storage.getState('entity', 'session'),
		sid = storage.getState('sid');

	debug.log('initModule: ', entity, sid);

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(url.href.indexOf('chatSessionId') !== -1) {
		sid = this.getSidFromUrl(url.href);
		storage.saveState('entity', 'agent', 'session');
		storage.saveState('sid', sid, 'session');
		this.session.sid = sid;
		this.joinSession(url.href);

	} else if(entity === 'agent') { // In case the cobrowsing session is active
		sid = storage.getState('sid', 'session');
		this.session.sid = sid;
		this.joinSession(url.href);

	} else {
		storage.saveState('entity', 'user', 'session');
		this.session.sid = sid;
		// In case a session is already initiated 
		// and storage containes sid parameter
		if(sid) {
			storage.saveState('sid', sid);
			this.createSession({ sid: sid, url: url.href });
		} else {
			// Create new session
			this.createSession({ url: url.href });
		}
	}
};

/**
 * Create session
 * Emits session/create event
 * if initiation is successful
 *
 * @param 	{String} 	url 	Current full URL
 * @return 	{String}	sid 	New session id
 */
WchatAPI.prototype.createSession = function(params){
	var data = {
		method: 'createSession',
		params: {
			url: (params.url || url.href)
		}
	};

	if(params.sid) data.params.sid = params.sid;

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'createSession', params: params });
			return;
		}

		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(url){
	this.openShareInteval = setInterval(function() {
		this.switchShareState('openShare', url);
	}.bind(this), 500);

	global.onclose = function() {
		this.switchShareState('shareClosed', url);
	}.bind(this);
};

/** 
 * Send/obtain events to/from the server. 
 * Events could be obtained from the server by specifying a timestamp
 * as a starting point from which an events would be obtained
**/
WchatAPI.prototype.updateEvents = function(events, cb){
	// var sessionId = storage.getState('sid'), data;
	// if(!sessionId) return cb();
	
	data = {
		method: 'events',
		params: {
			sid: this.session.sid,
			id: storage.getState('sharedId', 'cache'),
			timestamp: storage.getState('eventTimestamp', 'cache'),
			events: events
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, data);
			return cb(err); // TODO: handle error
		}

		if(body.result.timestamp > storage.getState('eventTimestamp', 'cache')) {
			storage.saveState('eventTimestamp', body.result.timestamp, 'cache');
			if(cb) cb(null, body.result);
		} else {
			if(cb) cb(null, { events: [] });
		}
			

	}.bind(this));
};

/**
 * Get available dialog languages
 * If languages are not available, 
 * then either there are no available agents or
 * languages weren't set in Admin Studio
 */
WchatAPI.prototype.getLanguages = function(cb){
	debug.log('this.session: ', this.session);
	cb(null, this.session.langs);	

	// var sessionId = storage.getState('sid');
	// if(!sessionId) return cb(true);

	// request.post(this.options.serverUrl, {
	// 	method: 'getLanguages',
	// 	params: {
	// 		sid: sessionId
	// 	}
	// }, function (err, body){
	// 	if(err) {
	// 		this.emit('Error', err, { method: 'getLanguages' });
	// 		return cb(err);
	// 	}

	// 	cb(null, body);
	// }.bind(this));
};

/**
 * Request chat session
 * 
 * @param  {Object} params - user parameters (name, phone, subject, language, etc.)
 */
WchatAPI.prototype.chatRequest = function(params, cb){
	params.sid = this.session.sid;

	debug.log('chatRequest params: ', params);

	var data = {
		method: 'chatRequest',
		params: params
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'chatRequest', params: params });
			if(cb) cb(err);
			return;
		}

		params.url = url.href;
		this.emit('chat/start', _.merge(params, body.result));
		if(cb) cb(null, body);
	}.bind(this));
};

/**
 * Get dialog messages
 * 
 * @param  {Number} timestamp Get messages since provided timestamp
 */
WchatAPI.prototype.getMessages = function(cb){
	request.post(this.options.serverUrl, {
		method: 'getMessages',
		params: {
			sid: this.session.sid,
			timestamp: storage.getState('msgTimestamp')
		}
	}, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'getMessages' });
			return cb(err);
		}

		// Do not show old messages
		if(body.result.timestamp > storage.getState('msgTimestamp')) {
			storage.saveState('msgTimestamp', body.result.timestamp);
			if(body.result.messages) {
				this.emit('message/new', body.result);
			}
		}

		if(body.result.typing) {
			this.emit('message/typing', body.result);
		}
		if(cb) cb(null, body.result);

	}.bind(this));
};

/**
 * Close current chat session
 * 
 * @param  {Number} rating Service rating
 */
WchatAPI.prototype.closeChat = function(rating){
	var data = {
		method: 'closeChat',
		params: {
			sid: this.session.sid
		}
	};
	if(rating) data.params.rating = rating;

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, data);
			return;
		}
		storage.saveState('chat', false);
		this.emit('chat/close', { rating: rating, url: url.href });
	}.bind(this));
};

/**
 * Send message to the agent
 * 
 * @param  {String} text - message content in case of regular message 
 * or dataURL in case of file transfer
 * @param  {String} file - (Optional) file name
 */
WchatAPI.prototype.sendMessage = function(params, cb){
	var data = {
		method: 'message',
		params: {
			sid: this.session.sid,
			content: params.message
		}
	};

	if(this.websocket) {
		if(params.file) {
		// 	// var content = publicUrl+Date.now()+"_"+this.options.pageid+"_"+params.message;
			data.params.content = params.file;
			data.params.file = params.message;

		// 	request.put(content, params.file, function(err, result) {
		// 		if(err) return console.error('sendMessage error: ', err);
		// 		this.sendData(data);
		// 	});

		}
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'sendMessage', params: data });
			if(cb) cb(err);
			return;
		}
		if(cb) cb();
	});
};

/**
 * Send dialog either to the specified email address (if parameter "to" has passed)
 * or to call center administrator (if parameter "email" has passed)
 *
 * Either
 * @param  {String} to			Destination email address
 *
 * Or
 * @param  {String} email		Sender email address
 * @param  {String} uname		Sender name
 * @param  {String} filename	Attachment filename
 * @param  {String} filedata	Attachment file URL
 *
 * Both
 * @param  {String} text		Email body
 */
WchatAPI.prototype.sendEmail = function(params, cb){
	params.sid = this.session.sid;

	var data = {
		method: 'sendMail',
		params: params
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'sendEmail', params: params });
			if(cb) cb(err);
			return;
		}

		this.emit('chat/send', params);
		if(cb) cb(null, body);
	}.bind(this));
};

/**
 * Send callback request
 * 
 * @param  {String} task - id of the callback task that configured in the Admin Studio
 * @param  {String} phone - User's phone number
 * @param  {Number} time - Timestamp of the call to be initiated
 */
WchatAPI.prototype.requestCallback = function(params, cb){
	params.sid = this.session.sid;

	var data = {
		method: 'requestCallback',
		params: params
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'requestCallback', params: params });
			return cb(err);
		}
		if(cb) cb(null, body.result);
	}.bind(this));
};

/**
 * Disjoin current active session
 * Emits session/disjoin event
 * if request is fulfilled
 *
 * @param {String} sid ID of active session
 */
WchatAPI.prototype.disjoinSession = function(sid){

	var data = {
		method: 'disjoinSession',
		params: {
			sid: sid
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'disjoinSession', params: { sid: sid } });
			return;
		}

		this.emit('session/disjoin', { url: url.href });
	}.bind(this));
};

WchatAPI.prototype.shareOpened = function(sharedId, url){
	var data = {
		method: 'shareOpened',
		params: {
			id: sharedId,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}
};

/**
 * Informs the server that the cobrowsing feature is turned on or off
 * @param  {Boolean} state Represents the state of cobrowsing feature
 * @param  {String} url   Url where the feature's state is changed
 * @return none
 */
WchatAPI.prototype.switchShareState = function(state, url){
	var method = state;
	var data = {
		method: method,
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'switchShareState', params: { state: state } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.setChatTimeout = function(timeout){
	return setTimeout(function (){
		this.emit('chat/timeout');
	}.bind(this), timeout*1000);
};

WchatAPI.prototype.userIsTyping = function(){
	var data = {
		method: 'typing',
		params: {
			sid: this.session.sid
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err){
		if(err) {
			this.emit('Error', err, { method: 'setChatTimeout' });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.updateUrl = function(url){
	var data = {
		method: 'updateUrl',
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function(err, body){
		if(err) {
			this.emit('Error', err, { method: 'updateUrl', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.linkFollowed = function(url){
	var data = {
		method: 'linkFollowed',
		params: {
			sid: this.session.sid,
			url: url
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}

	request.post(this.options.serverUrl, data, function (err, body){
		if(err) {
			this.emit('Error', err, { method: 'linkFollowed', params: { url: url } });
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.getSidFromUrl = function(url) {
	var substr = url.substring(url.indexOf('chatSessionId='));
	substr = substr.substring(substr.indexOf('=')+1);
	return substr;
};

WchatAPI.prototype.createWebsocket = function(host){
    // var protocol = (global.location.protocol === 'https:') ? 'wss:' : 'ws:';
    var protocol = 'wss:';
    var websocket = new WebSocket(protocol + '//'+websocketUrl,'json.api.smile-soft.com'); //Init Websocket handshake

    websocket.onopen = function(e){
        console.log('WebSocket opened: ', e);
        websocketTry = 1;
        if(!moduleInit) {
        	this.init();
        }
    }.bind(this);
    websocket.onmessage = this.onWebsocketMessage.bind(this);
    websocket.onclose = this.onWebsocketClose.bind(this);
    websocket.onerror = this.onError;

    global.onbeforeunload = function() {
        websocket.onclose = function () {}; // disable onclose handler first
        websocket.close()
    };

    this.websocket = websocket;

}

WchatAPI.prototype.onWebsocketClose = function(e) {
    console.log('WebSocket closed', e);
    var time = generateInterval(websocketTry);
    setTimeout(function(){
        websocketTry++;
        this.createWebsocket();
    }.bind(this), time);
}

//Reconnection Exponential Backoff Algorithm taken from http://blog.johnryding.com/post/78544969349/how-to-reconnect-web-sockets-in-a-realtime-web-app
function generateInterval (k) {
    var maxInterval = (Math.pow(2, k) - 1) * 1000;
  
    if (maxInterval > 30*1000) {
        maxInterval = 30*1000; // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.
    }
  
    // generate the interval to a random number between 0 and the maxInterval determined from above
    return Math.random() * maxInterval;
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./debug":77,"./lodash":78,"./request":80,"./storage":81,"events":2,"inherits":3}],77:[function(require,module,exports){
(function (global){
module.exports = {
    log: function(){ log(arguments, 'log'); },
    info: function(){ log(arguments, 'info'); },
    warn: function(){ log(arguments, 'warn'); },
    error: function(){ log(arguments, 'error'); }
};

function log(args, method){
    if(global.localStorage.getItem('swc.debug')) {
        [].forEach.call(args, function(arg){
            global.console[method] ? global.console[method](arg) : global.console.log(arg);
        });
        return;
    }
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],78:[function(require,module,exports){
var _template = require('lodash/string/template');
var _forEach = require('lodash/collection/forEach');
var _assign = require('lodash/object/assign');
var _merge = require('lodash/object/merge');
var _isEqual = require('lodash/lang/isEqual');
var _trim = require('lodash/string/trim');
var _throttle = require('lodash/function/throttle');
var _debounce = require('lodash/function/debounce');

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
	assign: _assign,
	merge: _merge,
	isEqual: _isEqual,
	trim: _trim,
	throttle: _throttle,
	debounce: debounce,
    poll: poll,
	findParent: findParent
};
},{"lodash/collection/forEach":4,"lodash/function/debounce":6,"lodash/function/throttle":8,"lodash/lang/isEqual":56,"lodash/object/assign":64,"lodash/object/merge":67,"lodash/string/template":69,"lodash/string/trim":71}],79:[function(require,module,exports){
var widget = require('./widget.js');
var api = require('./core.js');

module.exports = widget.module;

},{"./core.js":76,"./widget.js":84}],80:[function(require,module,exports){
var debug = require('./debug');
var cache = {};

module.exports = {
	post: post,
	get: get,
	put: put
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

function put(url, data, cb){

	// debug.log('post request: ', url, data);

	// var data = JSON.stringify(data);

	XmlHttpRequest('PUT', url, data, function(err, res) {
		debug.log('put respose: ', err, res);

		if(err) return cb(err);

		cb(null, res);
	});
}

/**
 * Send request to the server via XMLHttpRequest
 */
function XmlHttpRequest(method, url, data, callback){
	var xhr, response, requestTimer;

	xhr = new XMLHttpRequest();
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
					return callback(response.error);
				}

				callback(null, response);
			}
		}
	};

	if(method === 'POST') {
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	}

	if(data) {
		xhr.send(data);
	} else {
		xhr.send();
	}
}

},{"./debug":77}],81:[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],82:[function(require,module,exports){
var _ = {};
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};
var escapeRegexp = new RegExp('[' + Object.keys(escapeMap).join('') + ']', 'g');
_.escape = function(string) {
    if (!string) return '';
    return String(string).replace(escapeRegexp, function(match) {
        return escapeMap[match];
    });
};
exports['email']= function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 var prefix = defaults.prefix; ;
__p += '\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml">\n    <head>\n        <meta http-equiv="Content-Type" content="text/html; charset=windows-1251" />\n        <!--[if !mso]><!-->\n            <meta http-equiv="X-UA-Compatible" content="IE=edge" />\n        <!--<![endif]-->\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title></title>\n        <!--[if (gte mso 9)|(IE)]>\n        <style type="text/css">\n            table {border-collapse: collapse;}\n        </style>\n        <![endif]-->\n        <style type="text/css">\n            /* Basics */\n            body {\n            Margin: 0;\n                padding: 0;\n                min-width: 100%;\n                background-color: #ffffff;\n            }\n            table {\n                border-spacing: 0;\n                font-family: sans-serif;\n                color: #333333;\n            }\n            td {\n                padding: 0;\n            }\n            img {\n                border: 0;\n            }\n            .wrapper {\n                width: 100%;\n                table-layout: fixed;\n                -webkit-text-size-adjust: 100%;\n                -ms-text-size-adjust: 100%;\n                background-color: #F1F1F1;\n            }\n            .webkit {\n                max-width: 500px;\n            }\n            .outer {\n            Margin: 0 auto;\n                height: 100%;\n                width: 95%;\n                max-width: 500px;\n                padding: 10px;\n            }\n            p {\n                Margin: 0;\n            }\n            a {\n                color: #ee6a56;\n                text-decoration: underline;\n            }\n            .h1 {\n                font-size: 21px;\n                font-weight: bold;\n                Margin-bottom: 18px;\n            }\n            .h2 {\n                font-size: 18px;\n                font-weight: bold;\n                Margin-bottom: 12px;\n            }\n             \n            /* One column layout */\n            .one-column .contents {\n                text-align: left;\n                color:#505050;\n                font-family:Arial;\n                font-size:14px;\n                line-height:150%;\n            }\n            .one-column p {\n                font-size: 14px;\n                Margin-bottom: 10px;\n            }\n            .' +
__e( prefix ) +
'-message {\n                display: block;\n                margin-bottom: 10px;\n                padding: 10px;\n                background-color: #FFFFFF;\n                border-bottom: 4px solid #CCCCCC;\n            }\n            .' +
__e( prefix ) +
'-message img {\n                width: 100%;\n                max-width: 500px;\n                height: auto;\n            }\n            .' +
__e( prefix ) +
'-message span {\n                font-weight: bold;\n                color: #999999;\n            }\n            .' +
__e( prefix ) +
'-agent-msg .' +
__e( prefix ) +
'-message-from {\n                color: #555555;\n            }\n            .' +
__e( prefix ) +
'-user-msg .' +
__e( prefix ) +
'-message-from {\n                color: #F75B5D;\n            }\n\n            .' +
__e( prefix ) +
'-message .' +
__e( prefix ) +
'-message-time {\n                position: relative;\n                float: right;\n            }\n            .copyright {\n                margin-top: 5px;\n                font-size: 12px;\n                font-style: italic;\n                color: #CCCCCC;\n                text-align: right;\n            }\n\n        </style>\n    </head>\n    <body>\n        <center class="wrapper">\n            <div class="webkit">\n                <!--[if (gte mso 9)|(IE)]>\n                <table width="500" align="center" cellpadding="0" cellspacing="0" border="0">\n                <tr>\n                <td>\n                <![endif]-->\n                <table class="outer" align="center" cellpadding="0" cellspacing="0" border="0">\n                    <tr>\n                        <td class="one-column">\n                            <table width="100%">\n                                <tr>\n                                    <td class="inner contents">\n                                        ' +
((__t = ( content )) == null ? '' : __t) +
'\n                                    </td>\n                                </tr>\n                            </table>\n                        </td>\n                    </tr>\n                </table>\n                <!--[if (gte mso 9)|(IE)]>\n                </td>\n                </tr>\n                </table>\n                <![endif]-->\n            </div>\n        </center>\n    </body>\n</html>';

}
return __p
}
var _ = {};
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};
var escapeRegexp = new RegExp('[' + Object.keys(escapeMap).join('') + ']', 'g');
_.escape = function(string) {
    if (!string) return '';
    return String(string).replace(escapeRegexp, function(match) {
        return escapeMap[match];
    });
};
exports['forms']= function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class="' +
__e( defaults.prefix ) +
'-message ' +
__e( defaults.prefix ) +
'-' +
__e( message.entity ) +
'-msg">\n\t<span class="' +
__e( defaults.prefix ) +
'-message-from">' +
__e( message.from ) +
'</span>\n\t<div class="' +
__e( defaults.prefix ) +
'-message-content" ';
 if(message.entity === "user") { ;
__p += ' style="border-color:\'' +
__e( defaults.styles.primary.backgroundColor ) +
'" ';
 } ;
__p += '>\n\t\t';
 if(form.description) { ;
__p += '\n\t\t\t<p>' +
((__t = ( frases.FORMS.DESCRIPTIONS[form.description] || form.description )) == null ? '' : __t) +
'</p>\n\t\t';
 } ;
__p += '\n\t\t<form name="' +
__e( form.name ) +
'" ';
 if(form.autocomplete){ ;
__p += 'autocomplete="on"';
 } ;
__p += ' data-validate-form="true">\n\t\t\t';
 _.forEach(form.fields, function(item){ ;
__p += '\n\t\t\t\t';
 if(item.type !== 'select') { ;
__p += '\n\t\t\t\t\t<input \n\t\t\t\t\t\ttype="' +
((__t = ( item.type || 'text' )) == null ? '' : __t) +
'"\n\t\t\t\t\t\tplaceholder="' +
((__t = ( frases.FORMS.PLACEHOLDERS[item.placeholder] || frases.FORMS.PLACEHOLDERS[item.name] )) == null ? '' : __t) +
' ';
 if(item.required){ ;
__p += '*';
 } ;
__p += '"\n\t\t\t\t\t\tname="' +
__e( item.name ) +
'" ';
 if(item.value){ ;
__p += '\n\t\t\t\t\t\tvalue="' +
__e( credentials[item.value] ) +
'" ';
 } ;
__p += ' ';
 if(item.required){ ;
__p += 'required';
 } ;
__p += '>\n\t\t\t\t';
 } ;
__p += '\n\t\t\t\t';
 if(item.type === 'select') { ;
__p += '\n\t\t\t\t\t<select name="' +
__e( item.name ) +
'">\n\t\t\t\t\t\t';
 _.forEach(item.options, function(option) { ;
__p += '\n\t\t\t\t\t\t\t<option value="' +
__e( option.value ) +
'" ';
 if(option.selected) { ;
__p += ' selected ';
 } ;
__p += ' >\n\t\t\t\t\t\t\t\t' +
__e( frases.FORMS.PLACEHOLDERS[option.text] || option.text ) +
'\n\t\t\t\t\t\t\t</option>\n\t\t\t\t\t\t';
 }); ;
__p += '\n\t\t\t\t\t</select>\n\t\t\t\t';
 } ;
__p += '\n\t\t\t';
 }); ;
__p += '\n\t\t\t<button \n\t\t\t\ttype="submit"\n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block"\n\t\t\t\tstyle="background-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
'; border: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
';">' +
__e( frases.FORMS.send ) +
'</button>\n\t\t\t<button\n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block"\n\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="rejectForm">' +
__e( frases.FORMS.cancel ) +
'</button>\n\t\t</form>\n\t</div>\n\t<span class="' +
__e( defaults.prefix ) +
'-message-time"> ' +
__e( message.time ) +
'</span>\n</div>';

}
return __p
}
var _ = {};
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};
var escapeRegexp = new RegExp('[' + Object.keys(escapeMap).join('') + ']', 'g');
_.escape = function(string) {
    if (!string) return '';
    return String(string).replace(escapeRegexp, function(match) {
        return escapeMap[match];
    });
};
exports['message']= function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class="' +
__e( defaults.prefix ) +
'-message ' +
__e( defaults.prefix ) +
'-' +
__e( message.entity ) +
'-msg">\n\t<span class="' +
__e( defaults.prefix ) +
'-message-from">' +
__e( message.from ) +
'</span>\n\t<div class="' +
__e( defaults.prefix ) +
'-message-content" \n\t\t';
 if(message.entity === "user") { ;
__p += ' \n\t\t\tstyle="border-color:';
 defaults.styles.primary.backgroundColor ;
__p += '" \n\t\t';
 } ;
__p += '>\n\t\t<p>' +
((__t = ( message.content )) == null ? '' : __t) +
'</p>\n\t</div>\n\t<span class="' +
__e( defaults.prefix ) +
'-message-time"> ' +
__e( message.time ) +
'</span>\n</div>';

}
return __p
}
var _ = {};
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};
var escapeRegexp = new RegExp('[' + Object.keys(escapeMap).join('') + ']', 'g');
_.escape = function(string) {
    if (!string) return '';
    return String(string).replace(escapeRegexp, function(match) {
        return escapeMap[match];
    });
};
exports['widget']= function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 var frases = translations[currLang]; ;
__p += '\n';
 var panels = frases.PANELS; ;
__p += '\n';
 var channels = defaults.channels; ;
__p += '\n';
 var positionClass = defaults.position === 'right' ? 'position-right' : 'position-left' ;
__p += '\n<div id="' +
__e( defaults.prefix ) +
'-wg-cont" class="' +
__e( defaults.prefix ) +
'-wg-cont ' +
__e( positionClass ) +
'">\n\n\t<!-- ***** Panes container ***** -->\n\t<div \n\t\tid="' +
__e( defaults.prefix ) +
'-wg-panes" \n\t\tclass="' +
__e( defaults.prefix ) +
'-wg-panes" \n\t\tstyle="';
 if(defaults.styles.width) { ;
__p += 'width: ' +
__e( defaults.styles.width ) +
';';
 } ;
__p += '">\n\n\t\t<!-- ***** Top bar ***** -->\n\t\t<div \n\t\t\tclass="' +
__e( defaults.prefix ) +
'-top-bar" \n\t\t\tstyle="background: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
';">\n\n\t\t\t<!-- Main title -->\n\t\t\t<h4 class="' +
__e( defaults.prefix ) +
'-wg-title ' +
__e( defaults.prefix ) +
'-uppercase">\n\t\t\t\t' +
__e( defaults.title || frases.TOP_BAR.title ) +
'\n\t\t\t</h4>\n\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-state-cont">\n\t\t\t\t<span class="' +
__e( defaults.prefix ) +
'-wg-state-icon"> </span>\n\t\t\t\t<span class="' +
__e( defaults.prefix ) +
'-wg-state"></span>\n\t\t\t</div>\n\n\t\t\t<!-- Action buttons (minimize, close) -->\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-minimize">\n\n\t\t\t\t<!--<a \n\t\t\t\t\thref="#" \n\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="closeWidget">\n\t\t\t\t\t\n\t\t\t\t\t<span style="font-weight: bold">_</span>\n\t\t\t\t\n\t\t\t\t</a>-->\n\t\t\t\t\n\t\t\t\t<a \n\t\t\t\t\thref="#" \n\t\t\t\t\tstyle="color: ' +
__e( defaults.styles.primary.color ) +
'"\n\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="closeWidget"\n\t\t\t\t\t<span class="' +
__e( defaults.prefix ) +
'-icon-remove"></span>\n\n\t\t\t\t</a>\n\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Top bar ends ***** -->\n\n\t\t<!-- ***** Connection types pane ***** -->\n\t\t<div \n\t\t\tclass="' +
__e( defaults.prefix ) +
'-wg-pane" \n\t\t\tdata-' +
__e( defaults.prefix ) +
'-pane="chooseConnection">\n\t\t\t\n\t\t\t<!-- Panel\'s image container -->\n\t\t\t<div \n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-pane-header ' +
__e( defaults.prefix ) +
'-dark" \n\t\t\t\t';
 if(defaults.styles.intro.backgroundImage) { ;
__p += ' \n\t\t\t\t\tstyle="background-image: url(' +
__e( defaults.clientPath ) +
'' +
__e( defaults.styles.intro.backgroundImage ) +
')" \n\t\t\t\t';
 } ;
__p += '>\n\n\t\t\t\t<!-- The text displayed on image -->\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-backdrop-cont ' +
__e( defaults.prefix ) +
'-white">\n\t\t\t\t\t<br>\n\t\t\t\t\t<p>' +
__e( panels.CONNECTION_TYPES.choose_conn_type ) +
'</p>\n\t\t\t\t</div>\n\n\t\t\t</div>\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\n\t\t\t\t<form \n\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-init-form" \n\t\t\t\t\tname="' +
__e( defaults.prefix ) +
'InitForm">\n\n\t\t\t\t\t';
 if(channels.webrtc) { ;
__p += ' \n\t\t\t\t\t\t<!-- Display call button if WebRTC is enabled and supported by the browser -->\n\t\t\t\t\t\t';
 if(defaults.webrtcEnabled) { ;
__p += ' \n\t\t\t\t\t\t\t<button \n\t\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initCall">\n\n\t\t\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.call_agent_btn ) +
'\n\n\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t\t<!-- If WebRTC is not supported and fallback is set -->\n\t\t\t\t\t\t';
 } else if(channels.webrtc.fallback && channels.webrtc.fallback.sipCall) { ;
__p += '\n\t\t\t\t\t\t\t<button \n\t\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initFallbackCall">\n\n\t\t\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.call_agent_btn ) +
'\n\n\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t<!-- Display callback button if callback task is configured in the settings -->\n\t\t\t\t\t';
 if(channels.callback && channels.callback.task) { ;
__p += '\n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initCallback">\n\n\t\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.callback_btn ) +
'\n\n\t\t\t\t\t\t</button>\n\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t<!-- Init chat button -->\n\t\t\t\t\t';
 if(defaults.chat) { ;
__p += '\n\t\t\t\t\t<button\n\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\tstyle="background: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
'; border: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initChat">\n\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.chat_agent_btn ) +
'\n\t\t\t\t\t</button>\n\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t<!-- Close widget button -->\n\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block" data-' +
__e( defaults.prefix ) +
'-handler="closeWidget">' +
__e( panels.CONNECTION_TYPES.cancel ) +
'</a>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Connection types pane ends ***** -->\n\n\t\t<!-- ***** Intro pane. Displayed if configured in the settings object. ***** -->\n\t\t';
 if(defaults.intro.length) { ;
__p += '\n\t\t\t<div \n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-wg-pane" \n\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-pane="credentials">\n\n\t\t\t\t<!-- Panel\'s image container -->\n\t\t\t\t<div \n\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-pane-header ' +
__e( defaults.prefix ) +
'-dark" \n\t\t\t\t\t';
 if(defaults.styles.intro.backgroundImage) { ;
__p += ' \n\t\t\t\t\t\tstyle="background-image: url(' +
__e( defaults.clientPath ) +
'' +
__e( defaults.styles.intro.backgroundImage ) +
')" \n\t\t\t\t\t';
 } ;
__p += '>\n\n\t\t\t\t\t<!-- The text displayed on image -->\n\t\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-backdrop-cont ' +
__e( defaults.prefix ) +
'-white">\n\t\t\t\t\t\t<br>\n\t\t\t\t\t\t<p>' +
__e( panels.INTRO.intro_message ) +
'</p>\n\t\t\t\t\t</div>\n\n\t\t\t\t</div>\n\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t\t<form \n\t\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-intro-form" \n\t\t\t\t\t\tname="' +
__e( defaults.prefix ) +
'IntroForm" \n\t\t\t\t\t\tdata-validate-form="true">\n\n\t\t\t\t\t\t<!-- Iterating over intro array, which is a list of fields and their properties -->\n\t\t\t\t\t\t';
 _.forEach(defaults.intro, function(item){ ;
__p += '\n\t\t\t\t\t\t\t';
 if(item.name !== 'lang') { ;
__p += '\n\t\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\t\ttype="' +
((__t = ( item.type || 'text' )) == null ? '' : __t) +
'" \n\t\t\t\t\t\t\t\t\tplaceholder="' +
((__t = ( item.placeholder || panels.INTRO.PLACEHOLDERS[item.name] )) == null ? '' : __t) +
' ';
 if(item.required){ ;
__p += ' * ';
 } ;
__p += '" \n\t\t\t\t\t\t\t\t\tname="' +
__e( item.name ) +
'" \n\t\t\t\t\t\t\t\t\t';
 if(item.save){ ;
__p += ' value="' +
__e( credentials[item.name] ) +
'" ';
 } ;
__p += ' \n\t\t\t\t\t\t\t\t\t';
 if(item.required){ ;
__p += ' required ';
 } ;
__p += '>\n\t\t\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t\t\t';
 if(item.name === 'lang') { ;
__p += '\n\t\t\t\t\t\t\t\t<select name="lang">\n\t\t\t\t\t\t\t\t\t';
 _.forEach(languages, function(lang) { ;
__p += '\n\t\t\t\t\t\t\t\t\t\t<option \n\t\t\t\t\t\t\t\t\t\t\tvalue="' +
__e( lang ) +
'" \n\t\t\t\t\t\t\t\t\t\t\t';
 if(lang === currLang) { ;
__p += ' selected ';
 } ;
__p += ' >\n\t\t\t\t\t\t\t\t\t\t\t' +
__e( translations[lang].lang ) +
'\n\t\t\t\t\t\t\t\t\t\t</option>\n\t\t\t\t\t\t\t\t\t';
 }); ;
__p += '\n\t\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t\t';
 }); ;
__p += '\n\n\t\t\t\t\t\t<!-- Init chat with intro properties -->\n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="submit" \n\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';">\n\n\t\t\t\t\t\t\t' +
__e( panels.INTRO.start_dialog_button ) +
'\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t</button>\n\n\t\t\t\t\t\t<!-- Close widget button -->\n\t\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block" data-' +
__e( defaults.prefix ) +
'-handler="closeWidget">' +
__e( panels.INTRO.cancel ) +
'</a>\n\t\t\t\t\t</form>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t';
 } ;
__p += '\n\t\t<!-- ***** Intro pane ends ***** -->\n\n\t\t<!-- ***** Messages pane ***** -->\n\t\t<div  class="' +
__e( defaults.prefix ) +
'-wg-pane" data-' +
__e( defaults.prefix ) +
'-pane="messages">\n\t\t\t\n\t\t\t<!-- Messages container -->\n\t\t\t<ul \n\t\t\t\tid="' +
__e( defaults.prefix ) +
'-messages-cont" \n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-messages-cont" \n\t\t\t\tstyle="\n\t\t\t\t\t';
 if(defaults.styles.height) { ;
__p += '\n\t\t\t\t\t\theight: ' +
__e( defaults.styles.height ) +
';\n\t\t\t\t\t';
 } ;
__p += '">\n\t\t\t\t\t\n\t\t\t</ul>\n\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-write-cont">\n\t\t\t\t\n\t\t\t\t<!-- End dialog button -->\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-end-dialog-btn">\n\t\t\t\t\t<a href="#" data-' +
__e( defaults.prefix ) +
'-handler="finish">' +
__e( panels.MESSAGES.end_dialog ) +
'</a>\n\t\t\t\t</div>\n\n\t\t\t\t<!-- "Agent is typing" indicator -->\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-loader">\n\t\t\t\t\t<span></span>\n\t\t\t\t\t<span></span>\n\t\t\t\t\t<span></span>\n\t\t\t\t</div>\n\n\t\t\t\t<!-- "Attach file" button -->\n\t\t\t\t<label \n\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-sendfile-cont" \n\t\t\t\t\tfor="' +
__e( defaults.prefix ) +
'-file-select">\n\n\t\t\t\t\t<input \n\t\t\t\t\t\ttype="file" \n\t\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-file-select">\n\t\t\t\t\t\n\t\t\t\t\t<span \n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-icon-upload" \n\t\t\t\t\t\tstyle="color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'">\n\t\t\t\t\t<span>\n\n\t\t\t\t</label>\n\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-message-text-clone"  class="' +
__e( defaults.prefix ) +
'-msg-textarea-clone" ></div>\n\n\t\t\t\t<!-- Field for typing the user message -->\n\t\t\t\t<textarea \n\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-message-text" \n\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-msg-textarea" \n\t\t\t\t\tplaceholder="' +
__e( panels.MESSAGES.PLACEHOLDERS.message ) +
'" \n\t\t\t\t\tmaxlength="1000"></textarea>\n\t\t\t\t\n\t\t\t\t<!-- "Send a message" button -->\n\t\t\t\t<a \n\t\t\t\t\thref="#" \n\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-sendmsg-btn ' +
__e( defaults.prefix ) +
'-button" \n\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="sendMessage">\n\n\t\t\t\t\t<span \n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-icon-paper-plane" \n\t\t\t\t\t\tstyle="color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'">\n\t\t\t\t\t</span>\n\t\t\t\t</a>\n\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Messages pane ends ***** -->\n\n\t\t<!-- ***** Offline pane ***** -->\n\t\t<div \n\t\t\tclass="' +
__e( defaults.prefix ) +
'-wg-pane" \n\t\t\tdata-' +
__e( defaults.prefix ) +
'-pane="sendemail">\n\n\t\t\t<!-- Panel\'s image container -->\n\t\t\t<div \n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-pane-header ' +
__e( defaults.prefix ) +
'-dark" \n\t\t\t\t';
 if(defaults.styles.sendmail.backgroundImage) { ;
__p += ' \n\t\t\t\t\tstyle="background-image: url(' +
__e( defaults.clientPath ) +
'' +
__e( defaults.styles.sendmail.backgroundImage ) +
')" \n\t\t\t\t';
 } ;
__p += '>\n\n\t\t\t\t<!-- The text displayed on image -->\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-backdrop-cont ' +
__e( defaults.prefix ) +
'-dark">\n\t\t\t\t\t<p>' +
__e( panels.OFFLINE.offline_message ) +
'</p>\n\t\t\t\t</div>\n\n\t\t\t</div>\n\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<h4 class="' +
__e( defaults.prefix ) +
'-uppercase">' +
__e( panels.OFFLINE.send_message_header ) +
'</h4>\n\t\t\t\t<form id="' +
__e( defaults.prefix ) +
'-sendmail-form" data-validate-form="true">\n\t\t\t\t\t<input type="text" name="uname" placeholder="' +
__e( panels.OFFLINE.PLACEHOLDERS.uname ) +
'">\n\t\t\t\t\t<input type="email" name="email" placeholder="' +
__e( panels.OFFLINE.PLACEHOLDERS.email ) +
' *" required>\n\t\t\t\t\t<textarea name="text" placeholder="' +
__e( panels.OFFLINE.PLACEHOLDERS.message ) +
'" maxlength="1500"></textarea>\n\n\t\t\t\t\t<input type="file" name="file" id="' +
__e( defaults.prefix ) +
'-contactfile" class="' +
__e( defaults.prefix ) +
'-inputfile" />\n\t\t\t\t\t<label for="' +
__e( defaults.prefix ) +
'-contactfile">' +
__e( panels.OFFLINE.choose_file ) +
'</label>\n\n\t\t\t\t\t<!-- "Send offline message" button -->\n\t\t\t\t\t<button \n\t\t\t\t\t\ttype="submit" \n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';">\n\n\t\t\t\t\t\t' +
__e( panels.OFFLINE.send_message_button ) +
'\n\t\t\t\t\t\t\t\n\t\t\t\t\t</button>\n\n\t\t\t\t\t<!-- Close widget button -->\n\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block" data-' +
__e( defaults.prefix ) +
'-handler="closeWidget">' +
__e( panels.OFFLINE.close ) +
'</a>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Offline pane ends ***** -->\n\n\t\t<!-- ***** Close chat pane ***** -->\n\t\t<div \n\t\t\tclass="' +
__e( defaults.prefix ) +
'-wg-pane" \n\t\t\tdata-' +
__e( defaults.prefix ) +
'-pane="closechat">\n\n\t\t\t<!-- Panel\'s image container -->\n\t\t\t<div \n\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-pane-header ' +
__e( defaults.prefix ) +
'-white" \n\t\t\t\t';
 if(defaults.styles.closeChat.backgroundImage) { ;
__p += ' \n\t\t\t\t\tstyle="background-image: url(' +
__e( defaults.clientPath ) +
'' +
__e( defaults.styles.closeChat.backgroundImage ) +
')" \n\t\t\t\t';
 } ;
__p += '>\n\n\t\t\t\t<!-- The text displayed on image -->\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-backdrop-cont ' +
__e( defaults.prefix ) +
'-white">\n\t\t\t\t\t<br>\n\t\t\t\t\t<p>' +
__e( panels.CLOSE_CHAT.close_chat_header ) +
'</p>\n\t\t\t\t</div>\n\n\t\t\t</div>\n\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<form id="' +
__e( defaults.prefix ) +
'-closechat-form" data-validate-form="true">\n\t\t\t\t\t<label for="' +
__e( defaults.prefix ) +
'-send-dialog">\n\t\t\t\t\t\t<input type="checkbox" name="sendDialog" id="' +
__e( defaults.prefix ) +
'-send-dialog" />\n\t\t\t\t\t\t<span>' +
__e( panels.CLOSE_CHAT.send_dialog_label ) +
'</span>\n\t\t\t\t\t</label>\n\t\t\t\t\t<input type="email" name="email" placeholder="' +
__e( panels.CLOSE_CHAT.PLACEHOLDERS.email ) +
'">\n\t\t\t\t\t<select name="rating">\n\t\t\t\t\t\t<option value="">--- ' +
__e( panels.CLOSE_CHAT.rate_agent ) +
' ---</option>\n\t\t\t\t\t\t<option value="5">' +
__e( frases.AGENT_RATES.excellent ) +
'</option>\n\t\t\t\t\t\t<option value="4">' +
__e( frases.AGENT_RATES.good ) +
'</option>\n\t\t\t\t\t\t<option value="3">' +
__e( frases.AGENT_RATES.fair ) +
'</option>\n\t\t\t\t\t\t<option value="2">' +
__e( frases.AGENT_RATES.bad ) +
'</option>\n\t\t\t\t\t</select>\n\t\t\t\t\t<textarea placeholder="' +
__e( panels.CLOSE_CHAT.PLACEHOLDERS.comment ) +
'" name="text" maxlength="1500"></textarea>\n\n\t\t\t\t\t<!-- End chat and close widget button -->\n\t\t\t\t\t<button \n\t\t\t\t\t\ttype="submit" \n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';">\n\n\t\t\t\t\t\t' +
__e( panels.CLOSE_CHAT.finish_dialog_button ) +
'\n\t\t\t\t\t\t\t\n\t\t\t\t\t</button>\n\n\t\t\t\t\t<!-- "Back to the chat" button -->\n\t\t\t\t\t<a href="#messages" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block">' +
__e( panels.CLOSE_CHAT.back ) +
'</a>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Close chat pane ends ***** -->\n\n\t\t<!-- ***** Audio call pane ***** -->\n\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-pane" data-' +
__e( defaults.prefix ) +
'-pane="callAgent">\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-call-spinner" class="' +
__e( defaults.prefix ) +
'-spinner-pane">\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.AUDIO_CALL.confirm_access ) +
'</h3>\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center ' +
__e( defaults.prefix ) +
'-loader ' +
__e( defaults.prefix ) +
'-shown" style="position: relative;">\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t</h3>\n\t\t\t\t</div>\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-call-info" class="' +
__e( defaults.prefix ) +
'-hidden">\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center" id="' +
__e( defaults.prefix ) +
'-call-state">' +
__e( panels.AUDIO_CALL.calling_agent ) +
'</h3>\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center" id="' +
__e( defaults.prefix ) +
'-call-timer">00:00</h3>\n\t\t\t\t</div>\n\t\t\t\t<form id="' +
__e( defaults.prefix ) +
'-call-control">\n\t\t\t\t\t<hr>\n\t\t\t\t\t<button\n\t\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-tryagain-btn"\n\t\t\t\t\t\ttype="button"\n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block ' +
__e( defaults.prefix ) +
'-hidden"\n\t\t\t\t\t\tstyle="background: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
'; border: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initCall">\n\t\t\t\t\t\t' +
__e( panels.AUDIO_CALL.try_again ) +
'\n\t\t\t\t\t</button>\t\n\t\t\t\t\t<button \n\t\t\t\t\t\ttype="button"\n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-warn ' +
__e( defaults.prefix ) +
'-block"\n\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="endCall">\n\n\t\t\t\t\t\t' +
__e( panels.AUDIO_CALL.end_call ) +
'\n\n\t\t\t\t\t</button>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Audio call pane ends ***** -->\n\n\t\t<!-- ***** Audio call fallback pane ***** -->\n\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-pane" data-' +
__e( defaults.prefix ) +
'-pane="callAgentFallback">\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-text-center">\n\t\t\t\t\t<h3>' +
__e( panels.AUDIO_CALL_FALLBACK.DOWNLOAD_MSG ) +
'</h3>\n\t\t\t\t\t<br>\n\t\t\t\t\t';
 if(defaults.webrtc && defaults.webrtc.fallback) { ;
__p += '\n\t\t\t\t\t\t<a href="' +
__e( defaults.webrtc.fallback.sipCall ) +
'">call.jnlp</a>\n\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t</div>\n\t\t\t\t<form>\n\t\t\t\t\t<hr>\n\t\t\t\t\t<a href="#chooseConnection" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block">' +
__e( panels.CALLBACK.back ) +
'</a>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Audio call fallback pane ends ***** -->\n\n\t\t<!-- ***** Callback pane ***** -->\n\t\t<div \n\t\t\tclass="' +
__e( defaults.prefix ) +
'-wg-pane" \n\t\t\tdata-' +
__e( defaults.prefix ) +
'-pane="callback">\n\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-callback-spinner" class="' +
__e( defaults.prefix ) +
'-hidden ' +
__e( defaults.prefix ) +
'-spinner-pane">\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.sending_request ) +
'</h3>\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center ' +
__e( defaults.prefix ) +
'-loader ' +
__e( defaults.prefix ) +
'-shown" style="position: relative;">\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t\t<span></span>\n\t\t\t\t\t</h3>\n\t\t\t\t</div>\n\t\t\t\t<form id="' +
__e( defaults.prefix ) +
'-callback-settings">\n\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.title ) +
'</p>\n\t\t\t\t\t<hr>\n\t\t\t\t\t<label>' +
__e( panels.CALLBACK.LABELS.phone ) +
'</label>\n\t\t\t\t\t<input type="tel" name="phone" placeholder="' +
__e( panels.CALLBACK.PLACEHOLDERS.phone ) +
'" required>\n\t\t\t\t\t<label>' +
__e( panels.CALLBACK.LABELS.time ) +
'</label>\n\t\t\t\t\t<select name="time">\n\t\t\t\t\t\t';
 _.forEach(panels.CALLBACK.TIME_POINTS, function(point) { ;
__p += '\n\t\t\t\t\t\t\t<option value="' +
__e( point.minutes ) +
'">' +
__e( point.label ) +
'</option>\n\t\t\t\t\t\t';
 }); ;
__p += '\n\t\t\t\t\t</select>\n\t\t\t\t\t<hr>\n\n\t\t\t\t\t<button\n\t\t\t\t\t\ttype="submit"\n\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block"\n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.color ) +
';"\n\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="setCallback">\n\n\t\t\t\t\t\t' +
__e( panels.CALLBACK.confirm_callback ) +
'\n\n\t\t\t\t\t</button>\n\n\t\t\t\t\t<a href="#chooseConnection" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block">' +
__e( panels.CALLBACK.back ) +
'</a>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Callback pane ends ***** -->\n\n\t\t<!-- ***** Callback sent pane ***** -->\n\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-pane" data-' +
__e( defaults.prefix ) +
'-pane="callbackSent">\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-callback-sent">\n\t\t\t\t\t<h3 class="' +
__e( defaults.prefix ) +
'-text-center ' +
__e( defaults.prefix ) +
'-icon-check ' +
__e( defaults.prefix ) +
'-text-success"></h3>\n\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.request_sent ) +
'</p>\n\t\t\t\t\t<form>\n\t\t\t\t\t\t<hr>\n\t\t\t\t\t\t<a href="#chooseConnection" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block">' +
__e( panels.CALLBACK.back ) +
'</a>\n\t\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-block" data-' +
__e( defaults.prefix ) +
'-handler="closeWidget">' +
__e( panels.CALLBACK.close ) +
'</a>\n\t\t\t\t\t</form>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Callback sent pane ends ***** -->\n\n\t</div>\n\t<!-- ***** Panes container ends ***** -->\n\n\t<!-- ***** Floating button container ***** -->\n\t<div id="' +
__e( defaults.prefix ) +
'-btn-cont" class="' +
__e( defaults.prefix ) +
'-btn-cont">\n\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-btn">\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-lastmsg-cont">\n\t\t\t\t<span class="' +
__e( defaults.prefix ) +
'-unnotify-btn" id="' +
__e( defaults.prefix ) +
'-unnotify-btn">' +
__e( frases.FLOATING_BUTTON.close ) +
'</span>\n\t\t\t\t<div id="' +
__e( defaults.prefix ) +
'-lastmsg" class="' +
__e( defaults.prefix ) +
'-lastmsg">\n\t\t\t\t</div>\t\n\t\t\t</div>\n\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-btn-link">\n\t\t\t\t<span class="' +
__e( defaults.prefix ) +
'-btn-icon"></span>\n\t\t\t</a>\n\t\t</div>\n\t</div>\n\t<!-- ***** Floating button container ends ***** -->\n\n</div>';

}
return __p
}
},{}],83:[function(require,module,exports){
(function (global){
var debug = require('./debug');
var events = {},
// JsSIP = require('./jssip.min.js'),
JsSIP = global.JsSIP,
options,
sipClient,
sipSession,
sipCallEvents;

function isWebrtcSupported(){
	var RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
		userMeida = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || navigator.mozGetUserMedia,
		ice = window.mozRTCIceCandidate || window.RTCIceCandidate;

	return !!RTC && !!userMeida && !!ice;
}

function initJsSIPEvents(){
	sipClient.on('connected', function(e){ debug.log('sip connected event: ', e); });
	sipClient.on('disconnected', function(e){ debug.log('sip disconnected event: ', e); });
	sipClient.on('newMessage', function(e){ debug.log('sip newMessage event: ', e); });
	sipClient.on('newRTCSession', function(e){
		debug.log('sip newRTCSession event: ', e);
		events.emit('webrtc/newRTCSession', e);
		// if(e.session.direction === 'outgoing')
		// 	events.emit('webrtc/outgoingCall', e);
		// else
		// 	events.emit('webrtc/incomingCall', e);
		
			sipSession = e.session;
	});
	sipClient.on('registered', function(e){ debug.log('sip registered event: ', e); });
	sipClient.on('unregistered', function(e){ debug.log('sip unregistered event: ', e); });
	sipClient.on('registrationFailed', function(e){ debug.log('sip registrationFailed event: ', e); });

	sipCallEvents = {
		progress: function(e){
			debug.log('call progress event: ', e);
			events.emit('webrtc/progress', e);
		},
		failed: function(e){
			debug.log('call failed event:', e);
			events.emit('webrtc/failed', e);
		},
		ended: function(e){
			debug.log('call ended event: ', e);
			events.emit('webrtc/ended', e);
		},
		confirmed: function(e){
			debug.log('call confirmed event: ', e);
			events.emit('webrtc/confirmed', e);
		},
		addstream: function(e){
			debug.log('call addstream event: ', e);
			events.emit('webrtc/addstream', e);
			var stream = e.stream;
			options.audioRemote = JsSIP.rtcninja.attachMediaStream(options.audioRemote, stream);
		}
		// sdp: function(e){
		// 	debug.log('sdp: ', e);
		// }
	};
}

function isEstablished(){
	return sipSession.isEstablished();
}

function isInProgress(){
	return sipSession.isInProgress();
}

function isEnded(){
	return sipSession.isEnded();
}

function unregister(){
	sipClient.stop();
}

function audiocall(number){
	sipSession = sipClient.call(number, {
		eventHandlers: sipCallEvents,
		mediaConstraints: { audio: true, video: false }
	});
}

function terminate(){
	sipSession.terminate({
		status_code: 200
	});
	// sipClient.terminateSessions();
}

function answer(){
	debug.log('answer: ',sipClient);
	sipSession.answer();
}

function hold(){
	debug.log('hold: ', sipSession.isOnHold());
	if(sipSession && sipSession.isOnHold().local) {
		sipSession.unhold();
	} else {
		sipSession.hold();
	}
}

function createRemoteAudio(){
	var el = document.createElement('audio');
	el.setAttribute('autoplay', 'autoplay');
	document.body.appendChild(el);
	return el;
}

function init(opts){
	debug.log('Initiating WebRTC module:', opts);
	options = opts;
	if(options.sip.register === undefined) options.sip.register = false;

	// !!get rid of this!!
	events.emit = opts.emit;
	events.on = opts.on;
	// !!get rid of this!!

	options.audioRemote = createRemoteAudio();
	sipClient = new JsSIP.UA(options.sip);
	initJsSIPEvents();
	sipClient.start();
	// return sipClient;
}

module.exports = {
	lib: JsSIP,
	init: init,
	unregister: unregister,
	audiocall: audiocall,
	terminate: terminate,
	answer: answer,
	hold: hold,
	isInProgress: isInProgress,
	isEstablished: isEstablished,
	isEnded: isEnded,
	isSupported: isWebrtcSupported
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./debug":77}],84:[function(require,module,exports){
(function (global){
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
// var serverUrl = {};
var forms;
var api;

// Widget initiation options
var defaults = {
	// prefix for CSS classes and ids. 
	// Change it only if the default prefix 
	// matches with existed classes or ids on the website
	prefix: 'swc',
	// Init module on page load
	autoStart: true,
	// whether or not to ask user 
	// to introduce him self before the chat session
	intro: false,
	// whether or not to add widget to the webpage
	widget: true,
	// enable chat feature
	chat: true,
	// channels settings
	channels: {
		webrtc: {},
		callback: {}
	},
	// enable cobrowsing feature
	cobrowsing: false,
	// DOM element[s] selector that opens a widget
	buttonSelector: "",
	reCreateSession: true,
	title: '',
	lang: 'en',
	langFromUrl: false,
	position: 'right',
	hideOfflineButton: false,
	offer: false,
	styles: {
		primary: {
			backgroundColor: '#74b9ff',
			color: '#FFFFFF'
		},
		intro: {
			// backgroundImage: "images/bgr-02.jpg"
		},
		sendmail: {
			// backgroundImage: "images/bgr-01.jpg"
		},
		closeChat: {
			// backgroundImage: "images/bgr-02.jpg"
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
	clientPath: 'https://cdn.smile-soft.com/wchat/v1/',
	// absolute path to the css flie
	stylesPath: '',
	// absolute path to the translations.json flie
	translationsPath: '',
	// in seconds
	// checkStatusTimeout: 10,
	// in seconds
	// getMessagesTimeout: 1,
	// displayed in the email template
	host: window.location.host,
	// webrtc options
	// webrtc: {
	// 	sip: {},
	// 	hotline: '',
	// 	fallback: false
	// },
	webrtcEnabled: false,
	// callback: {
	// 	task: ''
	// }
};

var globalSettings = "WchatSettings";

// Current widget state
var widgetState = {
	initiated: false,
	active: false,
	state: '', // "online" | "offline" | "timeout",
	share: false,
	sounds: true
};

var dialog = [];

// available dialog languages
var langs = [];
var currLang = '';
// var messagesTimeout;
// var noMessagesTimeout;
// var getLanguagesInterval;
var chatTimeout;
var mouseFocused = false;
// Container for messages
// var messagesCont;
// Widget dom element
var widget;

// Widget in a separate window
var widgetWindow;
// Widget panes elements
// var panes;
var agentIsTypingTimeout;
var userIsTypingTimeout;
var timerUpdateInterval;
var pollTurns = 1;
// var ringTone = null,
// var ringToneInterval = null;

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

module.exports = {
	module: Widget,
	api: publicApi
};

// Initiate the module with the global settings
if(global[globalSettings] && global[globalSettings].autoStart !== false && defaults.autoStart) {
	if(document.readyState === "complete" || document.readyState === "interactive") {
	    Widget(global[globalSettings]);
	} else {
        document.addEventListener('DOMContentLoaded', function() { Widget(global[globalSettings]); }, false);
	}
}

function Widget(options){

	if(widgetState.initiated) return publicApi;

	_.merge(defaults, options || {});
	// _.assign(defaults, options || {});

	debug.log('Widget: ', options);

	defaults.clientPath = options.clientPath ? options.clientPath : (defaults.clientPath || (defaults.server + defaults.path));

	addWidgetStyles();
	if(defaults.buttonSelector) 
		setHandlers(defaults.buttonSelector);
	
	// serverUrl = require('url').parse(defaults.server, true);

	// Enabling audio module
	audio.init(defaults.clientPath+'sounds/');

	api = new core(options)
	.on('session/create', onSessionSuccess)
	.on('session/continue', onSessionSuccess)
	.on('session/join', onSessionJoin)
	.on('session/disjoin', onSessionDisjoin)
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
		.on('callback/create', onCallbackRequested)
		.on('form/submit', onFormSubmit)
		.on('form/reject', closeForm)
		.on('widget/load', initWidget);
		// .on('widget/init', onWidgetInit);
		// .on('widget/statechange', changeWgState);
	}

	if(WebRTC.isSupported() && defaults.channels.webrtc && defaults.channels.webrtc.sip && defaults.channels.webrtc.sip.ws_servers !== undefined) {
		if(window.location.protocol === 'https:'){
		// if(window.location.protocol === 'https:' && serverUrl.protocol === 'https:'){
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
				sip: defaults.channels.webrtc.sip,
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
	// getLanguages();

	// load translations
	request.get('frases', (defaults.translationsPath || defaults.clientPath)+'translations.json', function (err, result){
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

function initModule(){
	api.init();
	return publicApi;
}

function initWebrtcModule(opts){
	debug.log('initWebrtcModule: ', opts);
	WebRTC.init(opts);
}

function initSession() {
	
	if(!defaults.chat && !defaults.webrtcEnabled && !defaults.channels.callback.task) return false;

	debug.log('session initiated');

	// set current user language
	currLang = currLang || detectLanguage();
	setSessionTimeoutHandler();
	
	getLanguages();
	// getLanguagesInterval = setInterval(getLanguages, defaults.checkStatusTimeout*1000);

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget();
	}

	// If timeout was occured, init chat after a session is created
	if(hasWgState('timeout')) {
		removeWgState('timeout');
	}

	// if window is not a opened window
	// if(!defaults.external) {
		// api.updateUrl(window.location.href);

	// 	if(defaults.cobrowsing) {
	// 		initCobrowsingModule({
	// 			url: window.location.href,
	// 			entity: storage.getState('entity', 'session'),
	// 			widget: '#'+defaults.prefix+'-wg-cont'
	// 		});
	// 	}
	// }

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
			Widget(defaults);
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

function onSessionDisjoin() {
	cobrowsing.unshare();
}

function initCobrowsingModule(params){
	// init cobrowsing module only on main window
	if(defaults.external || cobrowsing.isInitiated()) return;

	api.on('cobrowsing/init', function(){
		cobrowsing.share();
		// cobrowsing.emitEvents();
	});

	api.on('cobrowsing/update', function(params){
		cobrowsing.updateEvents(params);
	});

	api.on('cobrowsing/event', function(params){
		if(params.events && params.events.length) api.updateEvents(params.events)
		// , function(err, result){
		// 	if(err) return;
		// 	if(result) cobrowsing.updateEvents(result);
		// });
	});

	api.on('cobrowsing/shared', function(){
		storage.saveState('shared', true, 'session');
		// if(!storage.getState('shared', 'session') && params.entity === 'user') {
			// storage.saveState('shared', true, 'session');
			// api.switchShareState(true, params.url);
		// }
		// api.updateEvents([{ entity: params.entity, url: params.url, shared: true }], function(err, result){
		// 	// if(err) return;
		// 	result.historyEvents = true;
		// 	// debug.log('cobrowsing update: ', result);
		// 	cobrowsing.updateEvents(result);
		// });
	});

	api.on('cobrowsing/unshared', function(params){
		storage.saveState('shared', false, 'session');
		// cobrowsing.unshare();
		// api.updateEvents([{ entity: params.entity, url: params.url, shared: false }], function(err){
		// 	// if(err) return;
		// 	if(params.entity === 'user') api.switchShareState(false, window.location.href);
		// 	else cobrowsing.unshareBrowser();
		// });
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
	api.getLanguages(function (err, langs){
		debug.log('getLanguages: ', err, langs);
		if(err) return;
		if(langs) onNewLanguages(langs);
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
		if(storage.getState('opened', 'session')) showWidget();
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

function setOffer() {
	setTimeout(function() {
		showOffer({
			from: defaults.offer.from || frases[currLang].TOP_BAR.title,
			time: Date.now(),
			content: defaults.offer.text || frases[currLang].default_offer
		});
	}, defaults.offer.inSeconds ? defaults.offer.inSeconds*1000 : 30000);
}

function showOffer(message) {
	// Return if user already interact with the widget
	if(widgetState.state !== 'online' || isInteracted()) return;
	newMessage(message);
	// newMessage({ messages: [message] });
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

	startChat({});
	clearWgMessages();
	switchPane('messages');

	api.chatRequest(credentials);
}

function startChat(params){
	storage.saveState('chat', true);
	if(params.timeout) {
		// debug.log('chat timeout: ', params.timeout);
		chatTimeout = api.setChatTimeout(params.timeout);
	}
	// getMessages();
	addWgState('chat');
}

// function getMessages(){
// 	// debug.log('get messages!');
	
// 	if(storage.getState('chat'))
// 		noMessagesTimeout = setTimeout(getMessages, 60*1000);
	
// 	api.getMessages(function() {
// 		if(storage.getState('chat')) {
// 			messagesTimeout = setTimeout(getMessages, defaults.getMessagesTimeout*1000);
// 			clearTimeout(noMessagesTimeout);
// 		}
// 	});
// }

function sendMessage(params){
	api.sendMessage(params);
	// api.sendMessage(params, function(err) {
	// 	if(!err && widgetState.sounds) audio.play('message_sent');
	// });

	newMessage({
		from: storage.getState('credentials', 'session').uname,
		time: Date.now(),
		content: params.message
		// hidden: true
		// className: defaults.prefix+'-msg-undelivered'
	});

	if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(message){
	// debug.log('new messages arrived!', result);

	var str,
		els = [],
		text,
		compiled,
		playSound = false,
		// defaultUname = false,
		credentials = storage.getState('credentials', 'session') || {},
		aname = storage.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : ''
		messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	// if(uname === storage.getState('sid').split('_')[0]) {
	// 	defaultUname = true;
	// }

	// result.messages.forEach(function(message, index) {
		
		message.entity = message.from === uname ? 'user' : 'agent';
		// message.from = (message.entity === 'user' && defaultUname) ? frases[currLang].default_user_name : message.from;
		message.from = message.entity === 'user' ? '' : message.from;
		message.time = message.time ? parseTime(message.time) : parseTime(Date.now());

		text = parseMessage(message.content, message.file, message.entity);

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
			if(!message.content) return;
			message.content = text.content;
			compiled = compileTemplate('message', { defaults: defaults, message: message });
			messagesCont.insertAdjacentHTML('beforeend', '<li '+(message.className ? 'class="'+message.className+'"' : '' )+'>'+compiled+'</li>');

			// if(index === result.messages.length-1) {
				onLastMessage(compiled);
			// }

			// Need for sending dialog to email
			if(!message.hidden) dialog.push(compiled);
		}

		// Save agent name
		if(message.entity === 'agent' && aname !== message.from) {
			storage.saveState('aname', message.from, 'session');
		}

		if(message.entity !== 'user') playSound = true;

	// });

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
			content: params.text,
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
			content: params.text,
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

	if(storage.getState('shared', 'session')) {
		api.switchShareState('shareClosed', global.location.href);
		cobrowsing.unshare();
	}
}

function onChatClose(){
	if(storage.getState('shared', 'session')) cobrowsing.unshare();
}

function onChatTimeout(){
	// debug.log('chat timeout!');
	switchPane('closechat');
	closeChat();
}

function onAgentTyping(){
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
	api.once('session/timeout', function (){
		debug.log('Session timeout:', defaults);

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
		// storage.removeState('sid');

		// if(params && params.method === 'updateEvents') {
		if(getLanguagesInterval) clearInterval(getLanguagesInterval);
		if(messagesTimeout) clearTimeout(messagesTimeout);

		if(defaults.reCreateSession) {
			initModule();
		}
		// }
	});
}

function initCall(){
	switchPane('callAgent');
	WebRTC.audiocall(defaults.channels.webrtc.hotline);
	// WebRTC.audiocall('sip:'+channels.webrtc.hotline+'@'+serverUrl.host);
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
	formData.task = defaults.channels.callback.task;
	debug.log('setCallback data: ', formData);

	form.classList.add(defaults.prefix+'-hidden');
	cbSpinner.classList.remove(defaults.prefix+'-hidden');

	api.requestCallback(formData);
	switchPane('callbackSent');
	// api.requestCallback(formData, function(err, result) {
	// 	debug.log('setCallback result: ', err, result);

	// 	cbSpinner.classList.add(defaults.prefix+'-hidden');
	// 	form.classList.remove(defaults.prefix+'-hidden');

	// 	if(err) return;
		
	// 	switchPane('callbackSent');
	// });

	form.reset();
}

function onCallbackRequested() {
	var form = document.getElementById(defaults.prefix+'-callback-settings'),
		cbSpinner = document.getElementById(defaults.prefix+'-callback-spinner');

	cbSpinner.classList.add(defaults.prefix+'-hidden');
	form.classList.remove(defaults.prefix+'-hidden');

	if(err) return;
	
	switchPane('callbackSent');
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
	var opts = {};
	
	if(!widgetWindow || widgetWindow.closed) {

		_.merge(opts, defaults);

		opts.widget = true;
		// set external flag to indicate that the module loads not in the main window
		opts.external = true;

		widgetWindow = window.open('', 'wchat', defaults.widgetWindowOptions);
		widgetWindow = constructWindow(widgetWindow);
		// widgetWindow[globalSettings] = opts;

		// widgetWindow.sessionStorage.setItem('wchat_options', JSON.stringify(opts));

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

			// widgetWindow.Module.initModule();

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
	var fileSelect = document.getElementById(defaults.prefix+'-file-select');
	var textField = document.getElementById(defaults.prefix+'-message-text');
	var inputs = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-inputfile'));
	var btn = document.getElementById(defaults.prefix+'-btn-cont');
	var panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	var messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

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
	addEvent(textField, 'focus', wgTextareaFocusHandler);
	addEvent(textField, 'blur', wgTextareaBlurHandler);

	addEvent(global, 'DOMMouseScroll', wgGlobalScrollHandler);
	addEvent(global, 'wheel', wgGlobalScrollHandler);
	// window.ontouchmove  = wgGlobalScrollHandler; // mobile

	addEvent(widget, 'mouseenter', onMouseEnter);
	addEvent(widget, 'mouseleave', onMouseLeave);

	// if(defaults.buttonElement) 
	// 	defaults.buttonElement.addEventListener('click', publicApi.openWidget, false);
}

function setHandlers(selector) {
	var fn = defaults.widget ? initWidgetState : openWidget;
	var els = [].slice.call(document.querySelectorAll(selector));
	els.map(function(el) { addEvent(el, 'click', fn); return el; });
}

/********************************
 * Widget event handlers *
 ********************************/

function onMouseEnter() {
	mouseFocused = true;
}

function onMouseLeave() {
	mouseFocused = false;
}

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

function wgGlobalScrollHandler(e) {
	var targ = document.getElementById(defaults.prefix+'-messages-cont');
	var dir = getScrollDirection(e);
	if(mouseFocused) {
		if(targ.scrollTop === 0 && dir === 'up') {
			e.stopPropagation();
			e.preventDefault();
		} else if (targ.scrollTop >= (targ.scrollHeight-targ.clientHeight) && dir === 'down') {
			e.stopPropagation();
			e.preventDefault();
		}
	}
}

function getScrollDirection(event) {
	var delta;

    if(event.wheelDelta) {
        delta = event.wheelDelta;
    } else {
        delta = -1 * event.deltaY;
    }

    if(delta < 0) {
        return "down";
    } else if(delta > 0) {
        return "up";
    }
}

function initWidgetState(){
	var chatInProgress = storage.getState('chat', 'cache');
	var wasOpened = storage.getState('opened', 'session');
	var callInProgress = storage.getState('call', 'cache');
	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	setInteracted();
	// If timeout is occured, init session first
	if(hasWgState('timeout')) {
		initModule();
	} else if(chatInProgress){
		showWidget();
	} else if(!langs.length){
		switchPane('sendemail');
		showWidget();
	} else if(defaults.webrtcEnabled){
		// if call is in progress - just show the widget
		if(callInProgress) {
			showWidget();
		} else {
			if(!defaults.chat && !defaults.channels.callback.task) {
				initCall();
			} else {
				switchPane('chooseConnection');
				showWidget();
			}
		}
	} else if(defaults.channels.callback.task) {
		if(!defaults.chat && !defaults.webrtcEnabled) {
			switchPane('callback');
			showWidget();
		} else {
			switchPane('chooseConnection');
			showWidget();
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
	var clone = document.getElementById("swc-message-text-clone");

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

	clone.innerText = targ.value;
	targ.style.height = clone.clientHeight+'px';

	// if(targ.value.length >= 80 && !hasWgState('type-extend'))
	// 	addWgState('type-extend');
	// if(targ.value.length < 80 && hasWgState('type-extend'))
	// 	removeWgState('type-extend');
}

function wgTextareaFocusHandler(e) {
	var target = e.target;
	target.style.borderColor = defaults.styles.primary.backgroundColor;
}

function wgTextareaBlurHandler(e) {
	var target = e.target;
	target.style.borderColor = "#fff";
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
			sendMessage({ message: result.filename, file: result.filedata });
		}
	});
}

/********************************
 * Widget elements manipulation *
 ********************************/

function switchPane(pane){
	// var paneId = defaults.prefix+'-'+pane+'-pane';
	var attr = 'data-'+defaults.prefix+'-pane';
	var panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	// debug.log('switchPane panes:', panes, 'pane: ', pane);
	panes.forEach(function(item){
		if(item.getAttribute(attr) === pane) {
			item.classList.add('active');
		} else {
			item.classList.remove('active');
		}
	});

	// if(!widgetState.active) showWidget();
}

function changeWgState(params){
	if(!widget || widgetState.state === params.state) return;
	if(params.state === 'offline') {
		removeWgState('online');
	} else if(params.state === 'online') {
		removeWgState('offline');
		
	}

	var state = document.querySelector('.'+defaults.prefix+'-wg-state');
	if(state) state.textContent = frases[currLang].TOP_BAR.STATUS[params.state];

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

	wgBtn.style.background = defaults.buttonStyles[state].backgroundColor;
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
	var messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	widgetState.active = true;
	storage.saveState('opened', true, 'session');
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
		storage.saveState('opened', false, 'session');
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

function clearWgMessages() {
	var cont = document.getElementById(defaults.prefix+'-messages-cont');
	var clone = cont.cloneNode();
	cont.parentNode.replaceChild(clone, cont);
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
			.map(function(item) {
				item = handleAliases(item);
				if(availableLangs.indexOf(item) !== -1) {
					lang = item;
				}

				return item;
			});
		}

		if(!lang) {
			lang = defaults.lang || (navigator.language || navigator.userLanguage).split('-')[0];
			if(availableLangs.indexOf(lang) === -1) lang = 'en';
		}
	}

	debug.log('detected lang: ', lang);

	return lang;
}

function handleAliases(alias) {
	var lang = alias;
	if(alias === 'ua') lang = 'uk';
	if(alias === 'us' || alias === 'gb') lang = 'en';
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
	} else if(entity === 'agent' && isLink(text) && isImage(text)) {
		filename = text.substring(text.indexOf('_')+1)
		return {
			type: 'image',
			content: '<a href="'+text+'" target="_blank">' +
					'<img src="'+text+'" alt="'+filename+'" />' +
				'</a>'
		};
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./audio-control":74,"./cobrowsing":75,"./core":76,"./debug":77,"./lodash":78,"./request":80,"./storage":81,"./templates":82,"./webrtc":83,"domify":1}]},{},[79])(79)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZG9taWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9mb3JFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kYXRlL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2Z1bmN0aW9uL3Jlc3RQYXJhbS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5Q29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheVNvbWUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Fzc2lnbk93bkRlZmF1bHRzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hc3NpZ25XaXRoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQXNzaWduLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQ29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3JJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvck93bi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc0VxdWFsRGVlcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZU1lcmdlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWVyZ2VEZWVwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VUb1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVZhbHVlcy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmluZENhbGxiYWNrLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jaGFyc0xlZnRJbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY2hhcnNSaWdodEluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVBc3NpZ25lci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUJhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsQXJyYXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbEJ5VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbE9iamVjdHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VzY2FwZUh0bWxDaGFyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lc2NhcGVTdHJpbmdDaGFyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXRMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldE5hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNBcnJheUxpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSXRlcmF0ZWVDYWxsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc1NwYWNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9yZUVzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcmVFdmFsdWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcmVJbnRlcnBvbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvc2hpbUtleXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3RvT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90cmltbWVkTGVmdEluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90cmltbWVkUmlnaHRJbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNFcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzTmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNUeXBlZEFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL3RvUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5c0luLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3QvbWVyZ2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy9lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvc3RyaW5nL3RlbXBsYXRlU2V0dGluZ3MuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy90cmltLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC91dGlsaXR5L2F0dGVtcHQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3V0aWxpdHkvaWRlbnRpdHkuanMiLCJzb3VyY2Uvc2NyaXB0cy9hdWRpby1jb250cm9sLmpzIiwic291cmNlL3NjcmlwdHMvY29icm93c2luZy5qcyIsInNvdXJjZS9zY3JpcHRzL2NvcmUuanMiLCJzb3VyY2Uvc2NyaXB0cy9kZWJ1Zy5qcyIsInNvdXJjZS9zY3JpcHRzL2xvZGFzaC5qcyIsInNvdXJjZS9zY3JpcHRzL21haW4uanMiLCJzb3VyY2Uvc2NyaXB0cy9yZXF1ZXN0LmpzIiwic291cmNlL3NjcmlwdHMvc3RvcmFnZS5qcyIsInNvdXJjZS9zY3JpcHRzL3RlbXBsYXRlcy5qcyIsInNvdXJjZS9zY3JpcHRzL3dlYnJ0Yy5qcyIsInNvdXJjZS9zY3JpcHRzL3dpZGdldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN4cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzM0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBFeHBvc2UgYHBhcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG4vKipcbiAqIFRlc3RzIGZvciBicm93c2VyIHN1cHBvcnQuXG4gKi9cblxudmFyIGlubmVySFRNTEJ1ZyA9IGZhbHNlO1xudmFyIGJ1Z1Rlc3REaXY7XG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICBidWdUZXN0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIC8vIFNldHVwXG4gIGJ1Z1Rlc3REaXYuaW5uZXJIVE1MID0gJyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nO1xuICAvLyBNYWtlIHN1cmUgdGhhdCBsaW5rIGVsZW1lbnRzIGdldCBzZXJpYWxpemVkIGNvcnJlY3RseSBieSBpbm5lckhUTUxcbiAgLy8gVGhpcyByZXF1aXJlcyBhIHdyYXBwZXIgZWxlbWVudCBpbiBJRVxuICBpbm5lckhUTUxCdWcgPSAhYnVnVGVzdERpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpLmxlbmd0aDtcbiAgYnVnVGVzdERpdiA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBXcmFwIG1hcCBmcm9tIGpxdWVyeS5cbiAqL1xuXG52YXIgbWFwID0ge1xuICBsZWdlbmQ6IFsxLCAnPGZpZWxkc2V0PicsICc8L2ZpZWxkc2V0PiddLFxuICB0cjogWzIsICc8dGFibGU+PHRib2R5PicsICc8L3Rib2R5PjwvdGFibGU+J10sXG4gIGNvbDogWzIsICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsICc8L2NvbGdyb3VwPjwvdGFibGU+J10sXG4gIC8vIGZvciBzY3JpcHQvbGluay9zdHlsZSB0YWdzIHRvIHdvcmsgaW4gSUU2LTgsIHlvdSBoYXZlIHRvIHdyYXBcbiAgLy8gaW4gYSBkaXYgd2l0aCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBpbiBmcm9udCwgaGEhXG4gIF9kZWZhdWx0OiBpbm5lckhUTUxCdWcgPyBbMSwgJ1g8ZGl2PicsICc8L2Rpdj4nXSA6IFswLCAnJywgJyddXG59O1xuXG5tYXAudGQgPVxubWFwLnRoID0gWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J107XG5cbm1hcC5vcHRpb24gPVxubWFwLm9wdGdyb3VwID0gWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J107XG5cbm1hcC50aGVhZCA9XG5tYXAudGJvZHkgPVxubWFwLmNvbGdyb3VwID1cbm1hcC5jYXB0aW9uID1cbm1hcC50Zm9vdCA9IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddO1xuXG5tYXAucG9seWxpbmUgPVxubWFwLmVsbGlwc2UgPVxubWFwLnBvbHlnb24gPVxubWFwLmNpcmNsZSA9XG5tYXAudGV4dCA9XG5tYXAubGluZSA9XG5tYXAucGF0aCA9XG5tYXAucmVjdCA9XG5tYXAuZyA9IFsxLCAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsJzwvc3ZnPiddO1xuXG4vKipcbiAqIFBhcnNlIGBodG1sYCBhbmQgcmV0dXJuIGEgRE9NIE5vZGUgaW5zdGFuY2UsIHdoaWNoIGNvdWxkIGJlIGEgVGV4dE5vZGUsXG4gKiBIVE1MIERPTSBOb2RlIG9mIHNvbWUga2luZCAoPGRpdj4gZm9yIGV4YW1wbGUpLCBvciBhIERvY3VtZW50RnJhZ21lbnRcbiAqIGluc3RhbmNlLCBkZXBlbmRpbmcgb24gdGhlIGNvbnRlbnRzIG9mIHRoZSBgaHRtbGAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIC0gSFRNTCBzdHJpbmcgdG8gXCJkb21pZnlcIlxuICogQHBhcmFtIHtEb2N1bWVudH0gZG9jIC0gVGhlIGBkb2N1bWVudGAgaW5zdGFuY2UgdG8gY3JlYXRlIHRoZSBOb2RlIGZvclxuICogQHJldHVybiB7RE9NTm9kZX0gdGhlIFRleHROb2RlLCBET00gTm9kZSwgb3IgRG9jdW1lbnRGcmFnbWVudCBpbnN0YW5jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2UoaHRtbCwgZG9jKSB7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgaHRtbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RyaW5nIGV4cGVjdGVkJyk7XG5cbiAgLy8gZGVmYXVsdCB0byB0aGUgZ2xvYmFsIGBkb2N1bWVudGAgb2JqZWN0XG4gIGlmICghZG9jKSBkb2MgPSBkb2N1bWVudDtcblxuICAvLyB0YWcgbmFtZVxuICB2YXIgbSA9IC88KFtcXHc6XSspLy5leGVjKGh0bWwpO1xuICBpZiAoIW0pIHJldHVybiBkb2MuY3JlYXRlVGV4dE5vZGUoaHRtbCk7XG5cbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpOyAvLyBSZW1vdmUgbGVhZGluZy90cmFpbGluZyB3aGl0ZXNwYWNlXG5cbiAgdmFyIHRhZyA9IG1bMV07XG5cbiAgLy8gYm9keSBzdXBwb3J0XG4gIGlmICh0YWcgPT0gJ2JvZHknKSB7XG4gICAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2h0bWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sO1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5sYXN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gd3JhcCBtYXBcbiAgdmFyIHdyYXAgPSBtYXBbdGFnXSB8fCBtYXAuX2RlZmF1bHQ7XG4gIHZhciBkZXB0aCA9IHdyYXBbMF07XG4gIHZhciBwcmVmaXggPSB3cmFwWzFdO1xuICB2YXIgc3VmZml4ID0gd3JhcFsyXTtcbiAgdmFyIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5pbm5lckhUTUwgPSBwcmVmaXggKyBodG1sICsgc3VmZml4O1xuICB3aGlsZSAoZGVwdGgtLSkgZWwgPSBlbC5sYXN0Q2hpbGQ7XG5cbiAgLy8gb25lIGVsZW1lbnRcbiAgaWYgKGVsLmZpcnN0Q2hpbGQgPT0gZWwubGFzdENoaWxkKSB7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpO1xuICB9XG5cbiAgLy8gc2V2ZXJhbCBlbGVtZW50c1xuICB2YXIgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGVsLnJlbW92ZUNoaWxkKGVsLmZpcnN0Q2hpbGQpKTtcbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudDtcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwidmFyIGFycmF5RWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2FycmF5RWFjaCcpLFxuICAgIGJhc2VFYWNoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUVhY2gnKSxcbiAgICBjcmVhdGVGb3JFYWNoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY3JlYXRlRm9yRWFjaCcpO1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgYGNvbGxlY3Rpb25gIGludm9raW5nIGBpdGVyYXRlZWAgZm9yIGVhY2ggZWxlbWVudC5cbiAqIFRoZSBgaXRlcmF0ZWVgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czpcbiAqICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS4gSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseVxuICogYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiAqKk5vdGU6KiogQXMgd2l0aCBvdGhlciBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcywgb2JqZWN0cyB3aXRoIGEgXCJsZW5ndGhcIiBwcm9wZXJ0eVxuICogYXJlIGl0ZXJhdGVkIGxpa2UgYXJyYXlzLiBUbyBhdm9pZCB0aGlzIGJlaGF2aW9yIGBfLmZvckluYCBvciBgXy5mb3JPd25gXG4gKiBtYXkgYmUgdXNlZCBmb3Igb2JqZWN0IGl0ZXJhdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGFsaWFzIGVhY2hcbiAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2l0ZXJhdGVlPV8uaWRlbnRpdHldIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGl0ZXJhdGVlYC5cbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXyhbMSwgMl0pLmZvckVhY2goZnVuY3Rpb24obikge1xuICogICBjb25zb2xlLmxvZyhuKTtcbiAqIH0pLnZhbHVlKCk7XG4gKiAvLyA9PiBsb2dzIGVhY2ggdmFsdWUgZnJvbSBsZWZ0IHRvIHJpZ2h0IGFuZCByZXR1cm5zIHRoZSBhcnJheVxuICpcbiAqIF8uZm9yRWFjaCh7ICdhJzogMSwgJ2InOiAyIH0sIGZ1bmN0aW9uKG4sIGtleSkge1xuICogICBjb25zb2xlLmxvZyhuLCBrZXkpO1xuICogfSk7XG4gKiAvLyA9PiBsb2dzIGVhY2ggdmFsdWUta2V5IHBhaXIgYW5kIHJldHVybnMgdGhlIG9iamVjdCAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG52YXIgZm9yRWFjaCA9IGNyZWF0ZUZvckVhY2goYXJyYXlFYWNoLCBiYXNlRWFjaCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZm9yRWFjaDtcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVOb3cgPSBnZXROYXRpdmUoRGF0ZSwgJ25vdycpO1xuXG4vKipcbiAqIEdldHMgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIFVuaXggZXBvY2hcbiAqICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IGxvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGZ1bmN0aW9uIHRvIGJlIGludm9rZWRcbiAqL1xudmFyIG5vdyA9IG5hdGl2ZU5vdyB8fCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBub3c7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgbm93ID0gcmVxdWlyZSgnLi4vZGF0ZS9ub3cnKTtcblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXg7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgdGhhdCBgZnVuY2BcbiAqIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdFxuICogYGZ1bmNgIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpcyBpbnZva2VkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZ1xuICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF0gVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZVxuICogIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIGludm9rZSBgc2VuZE1haWxgIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHNcbiAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHNcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7XG4gKiAgICdtYXhXYWl0JzogMTAwMFxuICogfSkpO1xuICpcbiAqIC8vIGNhbmNlbCBhIGRlYm91bmNlZCBjYWxsXG4gKiB2YXIgdG9kb0NoYW5nZXMgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAxMDAwKTtcbiAqIE9iamVjdC5vYnNlcnZlKG1vZGVscy50b2RvLCB0b2RvQ2hhbmdlcyk7XG4gKlxuICogT2JqZWN0Lm9ic2VydmUobW9kZWxzLCBmdW5jdGlvbihjaGFuZ2VzKSB7XG4gKiAgIGlmIChfLmZpbmQoY2hhbmdlcywgeyAndXNlcic6ICd0b2RvJywgJ3R5cGUnOiAnZGVsZXRlJ30pKSB7XG4gKiAgICAgdG9kb0NoYW5nZXMuY2FuY2VsKCk7XG4gKiAgIH1cbiAqIH0sIFsnZGVsZXRlJ10pO1xuICpcbiAqIC8vIC4uLmF0IHNvbWUgcG9pbnQgYG1vZGVscy50b2RvYCBpcyBjaGFuZ2VkXG4gKiBtb2RlbHMudG9kby5jb21wbGV0ZWQgPSB0cnVlO1xuICpcbiAqIC8vIC4uLmJlZm9yZSAxIHNlY29uZCBoYXMgcGFzc2VkIGBtb2RlbHMudG9kb2AgaXMgZGVsZXRlZFxuICogLy8gd2hpY2ggY2FuY2VscyB0aGUgZGVib3VuY2VkIGB0b2RvQ2hhbmdlc2AgY2FsbFxuICogZGVsZXRlIG1vZGVscy50b2RvO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBhcmdzLFxuICAgICAgbWF4VGltZW91dElkLFxuICAgICAgcmVzdWx0LFxuICAgICAgc3RhbXAsXG4gICAgICB0aGlzQXJnLFxuICAgICAgdGltZW91dElkLFxuICAgICAgdHJhaWxpbmdDYWxsLFxuICAgICAgbGFzdENhbGxlZCA9IDAsXG4gICAgICBtYXhXYWl0ID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHdhaXQgPCAwID8gMCA6ICgrd2FpdCB8fCAwKTtcbiAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICB2YXIgbGVhZGluZyA9IHRydWU7XG4gICAgdHJhaWxpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgbmF0aXZlTWF4KCtvcHRpb25zLm1heFdhaXQgfHwgMCwgd2FpdCk7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICBpZiAodGltZW91dElkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgfVxuICAgIGxhc3RDYWxsZWQgPSAwO1xuICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlKGlzQ2FsbGVkLCBpZCkge1xuICAgIGlmIChpZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9XG4gICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgIGlmIChpc0NhbGxlZCkge1xuICAgICAgbGFzdENhbGxlZCA9IG5vdygpO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIGlmICghdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgYXJncyA9IHRoaXNBcmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVsYXllZCgpIHtcbiAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3coKSAtIHN0YW1wKTtcbiAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgY29tcGxldGUodHJhaWxpbmdDYWxsLCBtYXhUaW1lb3V0SWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcbiAgICBjb21wbGV0ZSh0cmFpbGluZywgdGltZW91dElkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHN0YW1wID0gbm93KCk7XG4gICAgdGhpc0FyZyA9IHRoaXM7XG4gICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XG5cbiAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBsZWFkaW5nQ2FsbCA9IGxlYWRpbmcgJiYgIXRpbWVvdXRJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcbiAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgICAgfVxuICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcbiAgICAgICAgICBpc0NhbGxlZCA9IHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IG1heFdhaXQ7XG5cbiAgICAgIGlmIChpc0NhbGxlZCkge1xuICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XG4gICAgICAgICAgbWF4VGltZW91dElkID0gY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xuICAgICAgICBtYXhUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KG1heERlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiB0aW1lb3V0SWQpIHtcbiAgICAgIHRpbWVvdXRJZCA9IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH1cbiAgICBlbHNlIGlmICghdGltZW91dElkICYmIHdhaXQgIT09IG1heFdhaXQpIHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZGVsYXllZCwgd2FpdCk7XG4gICAgfVxuICAgIGlmIChsZWFkaW5nQ2FsbCkge1xuICAgICAgaXNDYWxsZWQgPSB0cnVlO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICB9XG4gICAgaWYgKGlzQ2FsbGVkICYmICF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgYXJncyA9IHRoaXNBcmcgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsIi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggdGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZVxuICogY3JlYXRlZCBmdW5jdGlvbiBhbmQgYXJndW1lbnRzIGZyb20gYHN0YXJ0YCBhbmQgYmV5b25kIHByb3ZpZGVkIGFzIGFuIGFycmF5LlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBpcyBiYXNlZCBvbiB0aGUgW3Jlc3QgcGFyYW1ldGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvRnVuY3Rpb25zL3Jlc3RfcGFyYW1ldGVycykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgYSByZXN0IHBhcmFtZXRlciB0by5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9ZnVuYy5sZW5ndGgtMV0gVGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSByZXN0IHBhcmFtZXRlci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc2F5ID0gXy5yZXN0UGFyYW0oZnVuY3Rpb24od2hhdCwgbmFtZXMpIHtcbiAqICAgcmV0dXJuIHdoYXQgKyAnICcgKyBfLmluaXRpYWwobmFtZXMpLmpvaW4oJywgJykgK1xuICogICAgIChfLnNpemUobmFtZXMpID4gMSA/ICcsICYgJyA6ICcnKSArIF8ubGFzdChuYW1lcyk7XG4gKiB9KTtcbiAqXG4gKiBzYXkoJ2hlbGxvJywgJ2ZyZWQnLCAnYmFybmV5JywgJ3BlYmJsZXMnKTtcbiAqIC8vID0+ICdoZWxsbyBmcmVkLCBiYXJuZXksICYgcGViYmxlcydcbiAqL1xuZnVuY3Rpb24gcmVzdFBhcmFtKGZ1bmMsIHN0YXJ0KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHN0YXJ0ID0gbmF0aXZlTWF4KHN0YXJ0ID09PSB1bmRlZmluZWQgPyAoZnVuYy5sZW5ndGggLSAxKSA6ICgrc3RhcnQgfHwgMCksIDApO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IG5hdGl2ZU1heChhcmdzLmxlbmd0aCAtIHN0YXJ0LCAwKSxcbiAgICAgICAgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgcmVzdFtpbmRleF0gPSBhcmdzW3N0YXJ0ICsgaW5kZXhdO1xuICAgIH1cbiAgICBzd2l0Y2ggKHN0YXJ0KSB7XG4gICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgcmVzdCk7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgcmVzdCk7XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJnc1swXSwgYXJnc1sxXSwgcmVzdCk7XG4gICAgfVxuICAgIHZhciBvdGhlckFyZ3MgPSBBcnJheShzdGFydCArIDEpO1xuICAgIGluZGV4ID0gLTE7XG4gICAgd2hpbGUgKCsraW5kZXggPCBzdGFydCkge1xuICAgICAgb3RoZXJBcmdzW2luZGV4XSA9IGFyZ3NbaW5kZXhdO1xuICAgIH1cbiAgICBvdGhlckFyZ3Nbc3RhcnRdID0gcmVzdDtcbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBvdGhlckFyZ3MpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc3RQYXJhbTtcbiIsInZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRocm90dGxlZCBmdW5jdGlvbiB0aGF0IG9ubHkgaW52b2tlcyBgZnVuY2AgYXQgbW9zdCBvbmNlIHBlclxuICogZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gVGhlIHRocm90dGxlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGBcbiAqIG1ldGhvZCB0byBjYW5jZWwgZGVsYXllZCBpbnZvY2F0aW9ucy4gUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZVxuICogdGhhdCBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlXG4gKiBgd2FpdGAgdGltZW91dC4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHJldHVybiB0aGVcbiAqIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgY2FsbC5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzIGludm9rZWRcbiAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cDovL2RydXBhbG1vdGlvbi5jb20vYXJ0aWNsZS9kZWJvdW5jZS1hbmQtdGhyb3R0bGUtdmlzdWFsLWV4cGxhbmF0aW9uKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy50aHJvdHRsZWAgYW5kIGBfLmRlYm91bmNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBpbnZvY2F0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXSBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZ1xuICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIGF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmdcbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdzY3JvbGwnLCBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApKTtcbiAqXG4gKiAvLyBpbnZva2UgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlc1xuICogalF1ZXJ5KCcuaW50ZXJhY3RpdmUnKS5vbignY2xpY2snLCBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwge1xuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIGNhbmNlbCBhIHRyYWlsaW5nIHRocm90dGxlZCBjYWxsXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCB0aHJvdHRsZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgaWYgKG9wdGlvbnMgPT09IGZhbHNlKSB7XG4gICAgbGVhZGluZyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICdsZWFkaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLmxlYWRpbmcgOiBsZWFkaW5nO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgcmV0dXJuIGRlYm91bmNlKGZ1bmMsIHdhaXQsIHsgJ2xlYWRpbmcnOiBsZWFkaW5nLCAnbWF4V2FpdCc6ICt3YWl0LCAndHJhaWxpbmcnOiB0cmFpbGluZyB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsIi8qKlxuICogQ29waWVzIHRoZSB2YWx1ZXMgb2YgYHNvdXJjZWAgdG8gYGFycmF5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gc291cmNlIFRoZSBhcnJheSB0byBjb3B5IHZhbHVlcyBmcm9tLlxuICogQHBhcmFtIHtBcnJheX0gW2FycmF5PVtdXSBUaGUgYXJyYXkgdG8gY29weSB2YWx1ZXMgdG8uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYGFycmF5YC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlDb3B5KHNvdXJjZSwgYXJyYXkpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xuXG4gIGFycmF5IHx8IChhcnJheSA9IEFycmF5KGxlbmd0aCkpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W2luZGV4XSA9IHNvdXJjZVtpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5Q29weTtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmZvckVhY2hgIGZvciBhcnJheXMgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5RWFjaChhcnJheSwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUVhY2g7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5zb21lYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGVsZW1lbnQgcGFzc2VzIHRoZSBwcmVkaWNhdGUgY2hlY2ssXG4gKiAgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBhcnJheVNvbWUoYXJyYXksIHByZWRpY2F0ZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5U29tZTtcbiIsIi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgYnkgYF8udGVtcGxhdGVgIHRvIGN1c3RvbWl6ZSBpdHMgYF8uYXNzaWduYCB1c2UuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgbGlrZSBgYXNzaWduRGVmYXVsdHNgIGV4Y2VwdCB0aGF0IGl0IGlnbm9yZXNcbiAqIGluaGVyaXRlZCBwcm9wZXJ0eSB2YWx1ZXMgd2hlbiBjaGVja2luZyBpZiBhIHByb3BlcnR5IGlzIGB1bmRlZmluZWRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IG9iamVjdFZhbHVlIFRoZSBkZXN0aW5hdGlvbiBvYmplY3QgcHJvcGVydHkgdmFsdWUuXG4gKiBAcGFyYW0geyp9IHNvdXJjZVZhbHVlIFRoZSBzb3VyY2Ugb2JqZWN0IHByb3BlcnR5IHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IGFzc29jaWF0ZWQgd2l0aCB0aGUgb2JqZWN0IGFuZCBzb3VyY2UgdmFsdWVzLlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHZhbHVlIHRvIGFzc2lnbiB0byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICovXG5mdW5jdGlvbiBhc3NpZ25Pd25EZWZhdWx0cyhvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUsIGtleSwgb2JqZWN0KSB7XG4gIHJldHVybiAob2JqZWN0VmFsdWUgPT09IHVuZGVmaW5lZCB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpXG4gICAgPyBzb3VyY2VWYWx1ZVxuICAgIDogb2JqZWN0VmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzaWduT3duRGVmYXVsdHM7XG4iLCJ2YXIga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmFzc2lnbmAgZm9yIGN1c3RvbWl6aW5nIGFzc2lnbmVkIHZhbHVlcyB3aXRob3V0XG4gKiBzdXBwb3J0IGZvciBhcmd1bWVudCBqdWdnbGluZywgbXVsdGlwbGUgc291cmNlcywgYW5kIGB0aGlzYCBiaW5kaW5nIGBjdXN0b21pemVyYFxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY3VzdG9taXplciBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGFzc2lnbmVkIHZhbHVlcy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGFzc2lnbldpdGgob2JqZWN0LCBzb3VyY2UsIGN1c3RvbWl6ZXIpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBwcm9wcyA9IGtleXMoc291cmNlKSxcbiAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF0sXG4gICAgICAgIHZhbHVlID0gb2JqZWN0W2tleV0sXG4gICAgICAgIHJlc3VsdCA9IGN1c3RvbWl6ZXIodmFsdWUsIHNvdXJjZVtrZXldLCBrZXksIG9iamVjdCwgc291cmNlKTtcblxuICAgIGlmICgocmVzdWx0ID09PSByZXN1bHQgPyAocmVzdWx0ICE9PSB2YWx1ZSkgOiAodmFsdWUgPT09IHZhbHVlKSkgfHxcbiAgICAgICAgKHZhbHVlID09PSB1bmRlZmluZWQgJiYgIShrZXkgaW4gb2JqZWN0KSkpIHtcbiAgICAgIG9iamVjdFtrZXldID0gcmVzdWx0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2lnbldpdGg7XG4iLCJ2YXIgYmFzZUNvcHkgPSByZXF1aXJlKCcuL2Jhc2VDb3B5JyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uYXNzaWduYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFyZ3VtZW50IGp1Z2dsaW5nLFxuICogbXVsdGlwbGUgc291cmNlcywgYW5kIGBjdXN0b21pemVyYCBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlQXNzaWduKG9iamVjdCwgc291cmNlKSB7XG4gIHJldHVybiBzb3VyY2UgPT0gbnVsbFxuICAgID8gb2JqZWN0XG4gICAgOiBiYXNlQ29weShzb3VyY2UsIGtleXMoc291cmNlKSwgb2JqZWN0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQXNzaWduO1xuIiwiLyoqXG4gKiBDb3BpZXMgcHJvcGVydGllcyBvZiBgc291cmNlYCB0byBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmcm9tLlxuICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGNvcHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdD17fV0gVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgdG8uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlQ29weShzb3VyY2UsIHByb3BzLCBvYmplY3QpIHtcbiAgb2JqZWN0IHx8IChvYmplY3QgPSB7fSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIG9iamVjdFtrZXldID0gc291cmNlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ29weTtcbiIsInZhciBiYXNlRm9yT3duID0gcmVxdWlyZSgnLi9iYXNlRm9yT3duJyksXG4gICAgY3JlYXRlQmFzZUVhY2ggPSByZXF1aXJlKCcuL2NyZWF0ZUJhc2VFYWNoJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yRWFjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICovXG52YXIgYmFzZUVhY2ggPSBjcmVhdGVCYXNlRWFjaChiYXNlRm9yT3duKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRWFjaDtcbiIsInZhciBjcmVhdGVCYXNlRm9yID0gcmVxdWlyZSgnLi9jcmVhdGVCYXNlRm9yJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGJhc2VGb3JJbmAgYW5kIGBiYXNlRm9yT3duYCB3aGljaCBpdGVyYXRlc1xuICogb3ZlciBgb2JqZWN0YCBwcm9wZXJ0aWVzIHJldHVybmVkIGJ5IGBrZXlzRnVuY2AgaW52b2tpbmcgYGl0ZXJhdGVlYCBmb3JcbiAqIGVhY2ggcHJvcGVydHkuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnkgZXhwbGljaXRseVxuICogcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHtGdW5jdGlvbn0ga2V5c0Z1bmMgVGhlIGZ1bmN0aW9uIHRvIGdldCB0aGUga2V5cyBvZiBgb2JqZWN0YC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbnZhciBiYXNlRm9yID0gY3JlYXRlQmFzZUZvcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3I7XG4iLCJ2YXIgYmFzZUZvciA9IHJlcXVpcmUoJy4vYmFzZUZvcicpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzSW4nKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JJbmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvckluKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgcmV0dXJuIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5c0luKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9ySW47XG4iLCJ2YXIgYmFzZUZvciA9IHJlcXVpcmUoJy4vYmFzZUZvcicpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvck93bmAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUZvck93bihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBiYXNlRm9yKG9iamVjdCwgaXRlcmF0ZWUsIGtleXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3JPd247XG4iLCJ2YXIgYmFzZUlzRXF1YWxEZWVwID0gcmVxdWlyZSgnLi9iYXNlSXNFcXVhbERlZXAnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRXF1YWxgIHdpdGhvdXQgc3VwcG9ydCBmb3IgYHRoaXNgIGJpbmRpbmdcbiAqIGBjdXN0b21pemVyYCBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0geyp9IG90aGVyIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0VxdWFsKHZhbHVlLCBvdGhlciwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgaWYgKHZhbHVlID09PSBvdGhlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IG90aGVyID09IG51bGwgfHwgKCFpc09iamVjdCh2YWx1ZSkgJiYgIWlzT2JqZWN0TGlrZShvdGhlcikpKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9PSB2YWx1ZSAmJiBvdGhlciAhPT0gb3RoZXI7XG4gIH1cbiAgcmV0dXJuIGJhc2VJc0VxdWFsRGVlcCh2YWx1ZSwgb3RoZXIsIGJhc2VJc0VxdWFsLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzRXF1YWw7XG4iLCJ2YXIgZXF1YWxBcnJheXMgPSByZXF1aXJlKCcuL2VxdWFsQXJyYXlzJyksXG4gICAgZXF1YWxCeVRhZyA9IHJlcXVpcmUoJy4vZXF1YWxCeVRhZycpLFxuICAgIGVxdWFsT2JqZWN0cyA9IHJlcXVpcmUoJy4vZXF1YWxPYmplY3RzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNUeXBlZEFycmF5Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nLFxuICAgIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsYCBmb3IgYXJyYXlzIGFuZCBvYmplY3RzIHdoaWNoIHBlcmZvcm1zXG4gKiBkZWVwIGNvbXBhcmlzb25zIGFuZCB0cmFja3MgdHJhdmVyc2VkIG9iamVjdHMgZW5hYmxpbmcgb2JqZWN0cyB3aXRoIGNpcmN1bGFyXG4gKiByZWZlcmVuY2VzIHRvIGJlIGNvbXBhcmVkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgb2JqZWN0cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNFcXVhbERlZXAob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgb2JqSXNBcnIgPSBpc0FycmF5KG9iamVjdCksXG4gICAgICBvdGhJc0FyciA9IGlzQXJyYXkob3RoZXIpLFxuICAgICAgb2JqVGFnID0gYXJyYXlUYWcsXG4gICAgICBvdGhUYWcgPSBhcnJheVRhZztcblxuICBpZiAoIW9iaklzQXJyKSB7XG4gICAgb2JqVGFnID0gb2JqVG9TdHJpbmcuY2FsbChvYmplY3QpO1xuICAgIGlmIChvYmpUYWcgPT0gYXJnc1RhZykge1xuICAgICAgb2JqVGFnID0gb2JqZWN0VGFnO1xuICAgIH0gZWxzZSBpZiAob2JqVGFnICE9IG9iamVjdFRhZykge1xuICAgICAgb2JqSXNBcnIgPSBpc1R5cGVkQXJyYXkob2JqZWN0KTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdGhJc0Fycikge1xuICAgIG90aFRhZyA9IG9ialRvU3RyaW5nLmNhbGwob3RoZXIpO1xuICAgIGlmIChvdGhUYWcgPT0gYXJnc1RhZykge1xuICAgICAgb3RoVGFnID0gb2JqZWN0VGFnO1xuICAgIH0gZWxzZSBpZiAob3RoVGFnICE9IG9iamVjdFRhZykge1xuICAgICAgb3RoSXNBcnIgPSBpc1R5cGVkQXJyYXkob3RoZXIpO1xuICAgIH1cbiAgfVxuICB2YXIgb2JqSXNPYmogPSBvYmpUYWcgPT0gb2JqZWN0VGFnLFxuICAgICAgb3RoSXNPYmogPSBvdGhUYWcgPT0gb2JqZWN0VGFnLFxuICAgICAgaXNTYW1lVGFnID0gb2JqVGFnID09IG90aFRhZztcblxuICBpZiAoaXNTYW1lVGFnICYmICEob2JqSXNBcnIgfHwgb2JqSXNPYmopKSB7XG4gICAgcmV0dXJuIGVxdWFsQnlUYWcob2JqZWN0LCBvdGhlciwgb2JqVGFnKTtcbiAgfVxuICBpZiAoIWlzTG9vc2UpIHtcbiAgICB2YXIgb2JqSXNXcmFwcGVkID0gb2JqSXNPYmogJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdfX3dyYXBwZWRfXycpLFxuICAgICAgICBvdGhJc1dyYXBwZWQgPSBvdGhJc09iaiAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG90aGVyLCAnX193cmFwcGVkX18nKTtcblxuICAgIGlmIChvYmpJc1dyYXBwZWQgfHwgb3RoSXNXcmFwcGVkKSB7XG4gICAgICByZXR1cm4gZXF1YWxGdW5jKG9iaklzV3JhcHBlZCA/IG9iamVjdC52YWx1ZSgpIDogb2JqZWN0LCBvdGhJc1dyYXBwZWQgPyBvdGhlci52YWx1ZSgpIDogb3RoZXIsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFpc1NhbWVUYWcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gQXNzdW1lIGN5Y2xpYyB2YWx1ZXMgYXJlIGVxdWFsLlxuICAvLyBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBkZXRlY3RpbmcgY2lyY3VsYXIgcmVmZXJlbmNlcyBzZWUgaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyNKTy5cbiAgc3RhY2tBIHx8IChzdGFja0EgPSBbXSk7XG4gIHN0YWNrQiB8fCAoc3RhY2tCID0gW10pO1xuXG4gIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gb2JqZWN0KSB7XG4gICAgICByZXR1cm4gc3RhY2tCW2xlbmd0aF0gPT0gb3RoZXI7XG4gICAgfVxuICB9XG4gIC8vIEFkZCBgb2JqZWN0YCBhbmQgYG90aGVyYCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gIHN0YWNrQS5wdXNoKG9iamVjdCk7XG4gIHN0YWNrQi5wdXNoKG90aGVyKTtcblxuICB2YXIgcmVzdWx0ID0gKG9iaklzQXJyID8gZXF1YWxBcnJheXMgOiBlcXVhbE9iamVjdHMpKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xuXG4gIHN0YWNrQS5wb3AoKTtcbiAgc3RhY2tCLnBvcCgpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzRXF1YWxEZWVwO1xuIiwidmFyIGFycmF5RWFjaCA9IHJlcXVpcmUoJy4vYXJyYXlFYWNoJyksXG4gICAgYmFzZU1lcmdlRGVlcCA9IHJlcXVpcmUoJy4vYmFzZU1lcmdlRGVlcCcpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpLFxuICAgIGlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNUeXBlZEFycmF5JyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWVyZ2VgIHdpdGhvdXQgc3VwcG9ydCBmb3IgYXJndW1lbnQganVnZ2xpbmcsXG4gKiBtdWx0aXBsZSBzb3VyY2VzLCBhbmQgYHRoaXNgIGJpbmRpbmcgYGN1c3RvbWl6ZXJgIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgc291cmNlIG9iamVjdC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIG1lcmdlZCB2YWx1ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyB2YWx1ZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZU1lcmdlKG9iamVjdCwgc291cmNlLCBjdXN0b21pemVyLCBzdGFja0EsIHN0YWNrQikge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIHZhciBpc1NyY0FyciA9IGlzQXJyYXlMaWtlKHNvdXJjZSkgJiYgKGlzQXJyYXkoc291cmNlKSB8fCBpc1R5cGVkQXJyYXkoc291cmNlKSksXG4gICAgICBwcm9wcyA9IGlzU3JjQXJyID8gdW5kZWZpbmVkIDoga2V5cyhzb3VyY2UpO1xuXG4gIGFycmF5RWFjaChwcm9wcyB8fCBzb3VyY2UsIGZ1bmN0aW9uKHNyY1ZhbHVlLCBrZXkpIHtcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgIGtleSA9IHNyY1ZhbHVlO1xuICAgICAgc3JjVmFsdWUgPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gICAgaWYgKGlzT2JqZWN0TGlrZShzcmNWYWx1ZSkpIHtcbiAgICAgIHN0YWNrQSB8fCAoc3RhY2tBID0gW10pO1xuICAgICAgc3RhY2tCIHx8IChzdGFja0IgPSBbXSk7XG4gICAgICBiYXNlTWVyZ2VEZWVwKG9iamVjdCwgc291cmNlLCBrZXksIGJhc2VNZXJnZSwgY3VzdG9taXplciwgc3RhY2tBLCBzdGFja0IpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICAgIHJlc3VsdCA9IGN1c3RvbWl6ZXIgPyBjdXN0b21pemVyKHZhbHVlLCBzcmNWYWx1ZSwga2V5LCBvYmplY3QsIHNvdXJjZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgaXNDb21tb24gPSByZXN1bHQgPT09IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKGlzQ29tbW9uKSB7XG4gICAgICAgIHJlc3VsdCA9IHNyY1ZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKChyZXN1bHQgIT09IHVuZGVmaW5lZCB8fCAoaXNTcmNBcnIgJiYgIShrZXkgaW4gb2JqZWN0KSkpICYmXG4gICAgICAgICAgKGlzQ29tbW9uIHx8IChyZXN1bHQgPT09IHJlc3VsdCA/IChyZXN1bHQgIT09IHZhbHVlKSA6ICh2YWx1ZSA9PT0gdmFsdWUpKSkpIHtcbiAgICAgICAgb2JqZWN0W2tleV0gPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWVyZ2U7XG4iLCJ2YXIgYXJyYXlDb3B5ID0gcmVxdWlyZSgnLi9hcnJheUNvcHknKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyksXG4gICAgaXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNQbGFpbk9iamVjdCcpLFxuICAgIGlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNUeXBlZEFycmF5JyksXG4gICAgdG9QbGFpbk9iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvdG9QbGFpbk9iamVjdCcpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZU1lcmdlYCBmb3IgYXJyYXlzIGFuZCBvYmplY3RzIHdoaWNoIHBlcmZvcm1zXG4gKiBkZWVwIG1lcmdlcyBhbmQgdHJhY2tzIHRyYXZlcnNlZCBvYmplY3RzIGVuYWJsaW5nIG9iamVjdHMgd2l0aCBjaXJjdWxhclxuICogcmVmZXJlbmNlcyB0byBiZSBtZXJnZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIG1lcmdlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWVyZ2VGdW5jIFRoZSBmdW5jdGlvbiB0byBtZXJnZSB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBtZXJnZWQgdmFsdWVzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBzb3VyY2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0I9W11dIEFzc29jaWF0ZXMgdmFsdWVzIHdpdGggc291cmNlIGNvdW50ZXJwYXJ0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlTWVyZ2VEZWVwKG9iamVjdCwgc291cmNlLCBrZXksIG1lcmdlRnVuYywgY3VzdG9taXplciwgc3RhY2tBLCBzdGFja0IpIHtcbiAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGgsXG4gICAgICBzcmNWYWx1ZSA9IHNvdXJjZVtrZXldO1xuXG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIGlmIChzdGFja0FbbGVuZ3RoXSA9PSBzcmNWYWx1ZSkge1xuICAgICAgb2JqZWN0W2tleV0gPSBzdGFja0JbbGVuZ3RoXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgdmFyIHZhbHVlID0gb2JqZWN0W2tleV0sXG4gICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcih2YWx1ZSwgc3JjVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UpIDogdW5kZWZpbmVkLFxuICAgICAgaXNDb21tb24gPSByZXN1bHQgPT09IHVuZGVmaW5lZDtcblxuICBpZiAoaXNDb21tb24pIHtcbiAgICByZXN1bHQgPSBzcmNWYWx1ZTtcbiAgICBpZiAoaXNBcnJheUxpa2Uoc3JjVmFsdWUpICYmIChpc0FycmF5KHNyY1ZhbHVlKSB8fCBpc1R5cGVkQXJyYXkoc3JjVmFsdWUpKSkge1xuICAgICAgcmVzdWx0ID0gaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgPyB2YWx1ZVxuICAgICAgICA6IChpc0FycmF5TGlrZSh2YWx1ZSkgPyBhcnJheUNvcHkodmFsdWUpIDogW10pO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc1BsYWluT2JqZWN0KHNyY1ZhbHVlKSB8fCBpc0FyZ3VtZW50cyhzcmNWYWx1ZSkpIHtcbiAgICAgIHJlc3VsdCA9IGlzQXJndW1lbnRzKHZhbHVlKVxuICAgICAgICA/IHRvUGxhaW5PYmplY3QodmFsdWUpXG4gICAgICAgIDogKGlzUGxhaW5PYmplY3QodmFsdWUpID8gdmFsdWUgOiB7fSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaXNDb21tb24gPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgLy8gQWRkIHRoZSBzb3VyY2UgdmFsdWUgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzIGFuZCBhc3NvY2lhdGVcbiAgLy8gaXQgd2l0aCBpdHMgbWVyZ2VkIHZhbHVlLlxuICBzdGFja0EucHVzaChzcmNWYWx1ZSk7XG4gIHN0YWNrQi5wdXNoKHJlc3VsdCk7XG5cbiAgaWYgKGlzQ29tbW9uKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgbWVyZ2Ugb2JqZWN0cyBhbmQgYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgb2JqZWN0W2tleV0gPSBtZXJnZUZ1bmMocmVzdWx0LCBzcmNWYWx1ZSwgY3VzdG9taXplciwgc3RhY2tBLCBzdGFja0IpO1xuICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gcmVzdWx0ID8gKHJlc3VsdCAhPT0gdmFsdWUpIDogKHZhbHVlID09PSB2YWx1ZSkpIHtcbiAgICBvYmplY3Rba2V5XSA9IHJlc3VsdDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNZXJnZURlZXA7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnByb3BlcnR5YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eShrZXkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VQcm9wZXJ0eTtcbiIsIi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyBpZiBpdCdzIG5vdCBvbmUuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZFxuICogZm9yIGBudWxsYCBvciBgdW5kZWZpbmVkYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogKHZhbHVlICsgJycpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udmFsdWVzYCBhbmQgYF8udmFsdWVzSW5gIHdoaWNoIGNyZWF0ZXMgYW5cbiAqIGFycmF5IG9mIGBvYmplY3RgIHByb3BlcnR5IHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcm9wZXJ0eSBuYW1lc1xuICogb2YgYHByb3BzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGdldCB2YWx1ZXMgZm9yLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBiYXNlVmFsdWVzKG9iamVjdCwgcHJvcHMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IG9iamVjdFtwcm9wc1tpbmRleF1dO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVZhbHVlcztcbiIsInZhciBpZGVudGl0eSA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvaWRlbnRpdHknKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VDYWxsYmFja2Agd2hpY2ggb25seSBzdXBwb3J0cyBgdGhpc2AgYmluZGluZ1xuICogYW5kIHNwZWNpZnlpbmcgdGhlIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGJpbmQuXG4gKiBAcGFyYW0geyp9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbYXJnQ291bnRdIFRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjYWxsYmFjay5cbiAqL1xuZnVuY3Rpb24gYmluZENhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIGlmICh0aGlzQXJnID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZnVuYztcbiAgfVxuICBzd2l0Y2ggKGFyZ0NvdW50KSB7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgICBjYXNlIDQ6IHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA1OiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyLCBrZXksIG9iamVjdCwgc291cmNlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiaW5kQ2FsbGJhY2s7XG4iLCIvKipcbiAqIFVzZWQgYnkgYF8udHJpbWAgYW5kIGBfLnRyaW1MZWZ0YCB0byBnZXQgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXJcbiAqIG9mIGBzdHJpbmdgIHRoYXQgaXMgbm90IGZvdW5kIGluIGBjaGFyc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IGNoYXJzIFRoZSBjaGFyYWN0ZXJzIHRvIGZpbmQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyIG5vdCBmb3VuZCBpbiBgY2hhcnNgLlxuICovXG5mdW5jdGlvbiBjaGFyc0xlZnRJbmRleChzdHJpbmcsIGNoYXJzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCAmJiBjaGFycy5pbmRleE9mKHN0cmluZy5jaGFyQXQoaW5kZXgpKSA+IC0xKSB7fVxuICByZXR1cm4gaW5kZXg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2hhcnNMZWZ0SW5kZXg7XG4iLCIvKipcbiAqIFVzZWQgYnkgYF8udHJpbWAgYW5kIGBfLnRyaW1SaWdodGAgdG8gZ2V0IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGFyYWN0ZXJcbiAqIG9mIGBzdHJpbmdgIHRoYXQgaXMgbm90IGZvdW5kIGluIGBjaGFyc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IGNoYXJzIFRoZSBjaGFyYWN0ZXJzIHRvIGZpbmQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGFyYWN0ZXIgbm90IGZvdW5kIGluIGBjaGFyc2AuXG4gKi9cbmZ1bmN0aW9uIGNoYXJzUmlnaHRJbmRleChzdHJpbmcsIGNoYXJzKSB7XG4gIHZhciBpbmRleCA9IHN0cmluZy5sZW5ndGg7XG5cbiAgd2hpbGUgKGluZGV4LS0gJiYgY2hhcnMuaW5kZXhPZihzdHJpbmcuY2hhckF0KGluZGV4KSkgPiAtMSkge31cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoYXJzUmlnaHRJbmRleDtcbiIsInZhciBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuL2JpbmRDYWxsYmFjaycpLFxuICAgIGlzSXRlcmF0ZWVDYWxsID0gcmVxdWlyZSgnLi9pc0l0ZXJhdGVlQ2FsbCcpLFxuICAgIHJlc3RQYXJhbSA9IHJlcXVpcmUoJy4uL2Z1bmN0aW9uL3Jlc3RQYXJhbScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgXy5hc3NpZ25gLCBgXy5kZWZhdWx0c2AsIG9yIGBfLm1lcmdlYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gYXNzaWduZXIgVGhlIGZ1bmN0aW9uIHRvIGFzc2lnbiB2YWx1ZXMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBhc3NpZ25lciBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQXNzaWduZXIoYXNzaWduZXIpIHtcbiAgcmV0dXJuIHJlc3RQYXJhbShmdW5jdGlvbihvYmplY3QsIHNvdXJjZXMpIHtcbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gb2JqZWN0ID09IG51bGwgPyAwIDogc291cmNlcy5sZW5ndGgsXG4gICAgICAgIGN1c3RvbWl6ZXIgPSBsZW5ndGggPiAyID8gc291cmNlc1tsZW5ndGggLSAyXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZ3VhcmQgPSBsZW5ndGggPiAyID8gc291cmNlc1syXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGhpc0FyZyA9IGxlbmd0aCA+IDEgPyBzb3VyY2VzW2xlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBjdXN0b21pemVyID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGN1c3RvbWl6ZXIgPSBiaW5kQ2FsbGJhY2soY3VzdG9taXplciwgdGhpc0FyZywgNSk7XG4gICAgICBsZW5ndGggLT0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VzdG9taXplciA9IHR5cGVvZiB0aGlzQXJnID09ICdmdW5jdGlvbicgPyB0aGlzQXJnIDogdW5kZWZpbmVkO1xuICAgICAgbGVuZ3RoIC09IChjdXN0b21pemVyID8gMSA6IDApO1xuICAgIH1cbiAgICBpZiAoZ3VhcmQgJiYgaXNJdGVyYXRlZUNhbGwoc291cmNlc1swXSwgc291cmNlc1sxXSwgZ3VhcmQpKSB7XG4gICAgICBjdXN0b21pemVyID0gbGVuZ3RoIDwgMyA/IHVuZGVmaW5lZCA6IGN1c3RvbWl6ZXI7XG4gICAgICBsZW5ndGggPSAxO1xuICAgIH1cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbaW5kZXhdO1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBhc3NpZ25lcihvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUFzc2lnbmVyO1xuIiwidmFyIGdldExlbmd0aCA9IHJlcXVpcmUoJy4vZ2V0TGVuZ3RoJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBiYXNlRWFjaGAgb3IgYGJhc2VFYWNoUmlnaHRgIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYmFzZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmFzZUVhY2goZWFjaEZ1bmMsIGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUpIHtcbiAgICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGdldExlbmd0aChjb2xsZWN0aW9uKSA6IDA7XG4gICAgaWYgKCFpc0xlbmd0aChsZW5ndGgpKSB7XG4gICAgICByZXR1cm4gZWFjaEZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpO1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMSxcbiAgICAgICAgaXRlcmFibGUgPSB0b09iamVjdChjb2xsZWN0aW9uKTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQmFzZUVhY2g7XG4iLCJ2YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJhc2UgZnVuY3Rpb24gZm9yIGBfLmZvckluYCBvciBgXy5mb3JJblJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRm9yKGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBpdGVyYXRlZSwga2V5c0Z1bmMpIHtcbiAgICB2YXIgaXRlcmFibGUgPSB0b09iamVjdChvYmplY3QpLFxuICAgICAgICBwcm9wcyA9IGtleXNGdW5jKG9iamVjdCksXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2tleV0sIGtleSwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRm9yO1xuIiwidmFyIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiBmb3IgYF8uZm9yRWFjaGAgb3IgYF8uZm9yRWFjaFJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gYXJyYXlGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYW4gYXJyYXkuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGVhY2ggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZvckVhY2goYXJyYXlGdW5jLCBlYWNoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUsIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBpdGVyYXRlZSA9PSAnZnVuY3Rpb24nICYmIHRoaXNBcmcgPT09IHVuZGVmaW5lZCAmJiBpc0FycmF5KGNvbGxlY3Rpb24pKVxuICAgICAgPyBhcnJheUZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpXG4gICAgICA6IGVhY2hGdW5jKGNvbGxlY3Rpb24sIGJpbmRDYWxsYmFjayhpdGVyYXRlZSwgdGhpc0FyZywgMykpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZvckVhY2g7XG4iLCJ2YXIgYXJyYXlTb21lID0gcmVxdWlyZSgnLi9hcnJheVNvbWUnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsRGVlcGAgZm9yIGFycmF5cyB3aXRoIHN1cHBvcnQgZm9yXG4gKiBwYXJ0aWFsIGRlZXAgY29tcGFyaXNvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtBcnJheX0gb3RoZXIgVGhlIG90aGVyIGFycmF5IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgYXJyYXlzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0JdIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBhcnJheXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gZXF1YWxBcnJheXMoYXJyYXksIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgYXJyTGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgICAgb3RoTGVuZ3RoID0gb3RoZXIubGVuZ3RoO1xuXG4gIGlmIChhcnJMZW5ndGggIT0gb3RoTGVuZ3RoICYmICEoaXNMb29zZSAmJiBvdGhMZW5ndGggPiBhcnJMZW5ndGgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIElnbm9yZSBub24taW5kZXggcHJvcGVydGllcy5cbiAgd2hpbGUgKCsraW5kZXggPCBhcnJMZW5ndGgpIHtcbiAgICB2YXIgYXJyVmFsdWUgPSBhcnJheVtpbmRleF0sXG4gICAgICAgIG90aFZhbHVlID0gb3RoZXJbaW5kZXhdLFxuICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcihpc0xvb3NlID8gb3RoVmFsdWUgOiBhcnJWYWx1ZSwgaXNMb29zZSA/IGFyclZhbHVlIDogb3RoVmFsdWUsIGluZGV4KSA6IHVuZGVmaW5lZDtcblxuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICBpZiAoaXNMb29zZSkge1xuICAgICAgaWYgKCFhcnJheVNvbWUob3RoZXIsIGZ1bmN0aW9uKG90aFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyVmFsdWUgPT09IG90aFZhbHVlIHx8IGVxdWFsRnVuYyhhcnJWYWx1ZSwgb3RoVmFsdWUsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICAgICAgICB9KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghKGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fCBlcXVhbEZ1bmMoYXJyVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsQXJyYXlzO1xuIiwiLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGJvb2xUYWcgPSAnW29iamVjdCBCb29sZWFuXScsXG4gICAgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXScsXG4gICAgbnVtYmVyVGFnID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgcmVnZXhwVGFnID0gJ1tvYmplY3QgUmVnRXhwXScsXG4gICAgc3RyaW5nVGFnID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBjb21wYXJpbmcgb2JqZWN0cyBvZlxuICogdGhlIHNhbWUgYHRvU3RyaW5nVGFnYC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBvbmx5IHN1cHBvcnRzIGNvbXBhcmluZyB2YWx1ZXMgd2l0aCB0YWdzIG9mXG4gKiBgQm9vbGVhbmAsIGBEYXRlYCwgYEVycm9yYCwgYE51bWJlcmAsIGBSZWdFeHBgLCBvciBgU3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgYHRvU3RyaW5nVGFnYCBvZiB0aGUgb2JqZWN0cyB0byBjb21wYXJlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsQnlUYWcob2JqZWN0LCBvdGhlciwgdGFnKSB7XG4gIHN3aXRjaCAodGFnKSB7XG4gICAgY2FzZSBib29sVGFnOlxuICAgIGNhc2UgZGF0ZVRhZzpcbiAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtYmVycywgZGF0ZXMgdG8gbWlsbGlzZWNvbmRzIGFuZCBib29sZWFuc1xuICAgICAgLy8gdG8gYDFgIG9yIGAwYCB0cmVhdGluZyBpbnZhbGlkIGRhdGVzIGNvZXJjZWQgdG8gYE5hTmAgYXMgbm90IGVxdWFsLlxuICAgICAgcmV0dXJuICtvYmplY3QgPT0gK290aGVyO1xuXG4gICAgY2FzZSBlcnJvclRhZzpcbiAgICAgIHJldHVybiBvYmplY3QubmFtZSA9PSBvdGhlci5uYW1lICYmIG9iamVjdC5tZXNzYWdlID09IG90aGVyLm1lc3NhZ2U7XG5cbiAgICBjYXNlIG51bWJlclRhZzpcbiAgICAgIC8vIFRyZWF0IGBOYU5gIHZzLiBgTmFOYCBhcyBlcXVhbC5cbiAgICAgIHJldHVybiAob2JqZWN0ICE9ICtvYmplY3QpXG4gICAgICAgID8gb3RoZXIgIT0gK290aGVyXG4gICAgICAgIDogb2JqZWN0ID09ICtvdGhlcjtcblxuICAgIGNhc2UgcmVnZXhwVGFnOlxuICAgIGNhc2Ugc3RyaW5nVGFnOlxuICAgICAgLy8gQ29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyBhbmQgdHJlYXQgc3RyaW5ncyBwcmltaXRpdmVzIGFuZCBzdHJpbmdcbiAgICAgIC8vIG9iamVjdHMgYXMgZXF1YWwuIFNlZSBodHRwczovL2VzNS5naXRodWIuaW8vI3gxNS4xMC42LjQgZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgIHJldHVybiBvYmplY3QgPT0gKG90aGVyICsgJycpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbEJ5VGFnO1xuIiwidmFyIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsRGVlcGAgZm9yIG9iamVjdHMgd2l0aCBzdXBwb3J0IGZvclxuICogcGFydGlhbCBkZWVwIGNvbXBhcmlzb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgdmFsdWVzLlxuICogQHBhcmFtIHtib29sZWFufSBbaXNMb29zZV0gU3BlY2lmeSBwZXJmb3JtaW5nIHBhcnRpYWwgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0JdIFRyYWNrcyB0cmF2ZXJzZWQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsT2JqZWN0cyhvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBvYmpQcm9wcyA9IGtleXMob2JqZWN0KSxcbiAgICAgIG9iakxlbmd0aCA9IG9ialByb3BzLmxlbmd0aCxcbiAgICAgIG90aFByb3BzID0ga2V5cyhvdGhlciksXG4gICAgICBvdGhMZW5ndGggPSBvdGhQcm9wcy5sZW5ndGg7XG5cbiAgaWYgKG9iakxlbmd0aCAhPSBvdGhMZW5ndGggJiYgIWlzTG9vc2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGluZGV4ID0gb2JqTGVuZ3RoO1xuICB3aGlsZSAoaW5kZXgtLSkge1xuICAgIHZhciBrZXkgPSBvYmpQcm9wc1tpbmRleF07XG4gICAgaWYgKCEoaXNMb29zZSA/IGtleSBpbiBvdGhlciA6IGhhc093blByb3BlcnR5LmNhbGwob3RoZXIsIGtleSkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHZhciBza2lwQ3RvciA9IGlzTG9vc2U7XG4gIHdoaWxlICgrK2luZGV4IDwgb2JqTGVuZ3RoKSB7XG4gICAga2V5ID0gb2JqUHJvcHNbaW5kZXhdO1xuICAgIHZhciBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICBvdGhWYWx1ZSA9IG90aGVyW2tleV0sXG4gICAgICAgIHJlc3VsdCA9IGN1c3RvbWl6ZXIgPyBjdXN0b21pemVyKGlzTG9vc2UgPyBvdGhWYWx1ZSA6IG9ialZhbHVlLCBpc0xvb3NlPyBvYmpWYWx1ZSA6IG90aFZhbHVlLCBrZXkpIDogdW5kZWZpbmVkO1xuXG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgaWYgKCEocmVzdWx0ID09PSB1bmRlZmluZWQgPyBlcXVhbEZ1bmMob2JqVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikgOiByZXN1bHQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHNraXBDdG9yIHx8IChza2lwQ3RvciA9IGtleSA9PSAnY29uc3RydWN0b3InKTtcbiAgfVxuICBpZiAoIXNraXBDdG9yKSB7XG4gICAgdmFyIG9iakN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgIG90aEN0b3IgPSBvdGhlci5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIE5vbiBgT2JqZWN0YCBvYmplY3QgaW5zdGFuY2VzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWFsLlxuICAgIGlmIChvYmpDdG9yICE9IG90aEN0b3IgJiZcbiAgICAgICAgKCdjb25zdHJ1Y3RvcicgaW4gb2JqZWN0ICYmICdjb25zdHJ1Y3RvcicgaW4gb3RoZXIpICYmXG4gICAgICAgICEodHlwZW9mIG9iakN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBvYmpDdG9yIGluc3RhbmNlb2Ygb2JqQ3RvciAmJlxuICAgICAgICAgIHR5cGVvZiBvdGhDdG9yID09ICdmdW5jdGlvbicgJiYgb3RoQ3RvciBpbnN0YW5jZW9mIG90aEN0b3IpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsT2JqZWN0cztcbiIsIi8qKiBVc2VkIHRvIG1hcCBjaGFyYWN0ZXJzIHRvIEhUTUwgZW50aXRpZXMuICovXG52YXIgaHRtbEVzY2FwZXMgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmIzM5OycsXG4gICdgJzogJyYjOTY7J1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLmVzY2FwZWAgdG8gY29udmVydCBjaGFyYWN0ZXJzIHRvIEhUTUwgZW50aXRpZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaHIgVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICovXG5mdW5jdGlvbiBlc2NhcGVIdG1sQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGh0bWxFc2NhcGVzW2Nocl07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlSHRtbENoYXI7XG4iLCIvKiogVXNlZCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscy4gKi9cbnZhciBzdHJpbmdFc2NhcGVzID0ge1xuICAnXFxcXCc6ICdcXFxcJyxcbiAgXCInXCI6IFwiJ1wiLFxuICAnXFxuJzogJ24nLFxuICAnXFxyJzogJ3InLFxuICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICdcXHUyMDI5JzogJ3UyMDI5J1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLnRlbXBsYXRlYCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGNociBUaGUgbWF0Y2hlZCBjaGFyYWN0ZXIgdG8gZXNjYXBlLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0NoYXIoY2hyKSB7XG4gIHJldHVybiAnXFxcXCcgKyBzdHJpbmdFc2NhcGVzW2Nocl07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlU3RyaW5nQ2hhcjtcbiIsInZhciBiYXNlUHJvcGVydHkgPSByZXF1aXJlKCcuL2Jhc2VQcm9wZXJ0eScpO1xuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldExlbmd0aDtcbiIsInZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNOYXRpdmUnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIHJldHVybiBpc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYXRpdmU7XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCIvKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXlxcZCskLztcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YWx1ZSA9ICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHwgcmVJc1VpbnQudGVzdCh2YWx1ZSkpID8gK3ZhbHVlIDogLTE7XG4gIGxlbmd0aCA9IGxlbmd0aCA9PSBudWxsID8gTUFYX1NBRkVfSU5URUdFUiA6IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPCBsZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJbmRleDtcbiIsInZhciBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi9pc0luZGV4JyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBwcm92aWRlZCBhcmd1bWVudHMgYXJlIGZyb20gYW4gaXRlcmF0ZWUgY2FsbC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIHZhbHVlIGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfSBpbmRleCBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIGluZGV4IG9yIGtleSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gb2JqZWN0IFRoZSBwb3RlbnRpYWwgaXRlcmF0ZWUgb2JqZWN0IGFyZ3VtZW50LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBhcmd1bWVudHMgYXJlIGZyb20gYW4gaXRlcmF0ZWUgY2FsbCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0l0ZXJhdGVlQ2FsbCh2YWx1ZSwgaW5kZXgsIG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHR5cGUgPSB0eXBlb2YgaW5kZXg7XG4gIGlmICh0eXBlID09ICdudW1iZXInXG4gICAgICA/IChpc0FycmF5TGlrZShvYmplY3QpICYmIGlzSW5kZXgoaW5kZXgsIG9iamVjdC5sZW5ndGgpKVxuICAgICAgOiAodHlwZSA9PSAnc3RyaW5nJyAmJiBpbmRleCBpbiBvYmplY3QpKSB7XG4gICAgdmFyIG90aGVyID0gb2JqZWN0W2luZGV4XTtcbiAgICByZXR1cm4gdmFsdWUgPT09IHZhbHVlID8gKHZhbHVlID09PSBvdGhlcikgOiAob3RoZXIgIT09IG90aGVyKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJdGVyYXRlZUNhbGw7XG4iLCIvKipcbiAqIFVzZWQgYXMgdGhlIFttYXhpbXVtIGxlbmd0aF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtbnVtYmVyLm1heF9zYWZlX2ludGVnZXIpXG4gKiBvZiBhbiBhcnJheS1saWtlIHZhbHVlLlxuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsIi8qKlxuICogVXNlZCBieSBgdHJpbW1lZExlZnRJbmRleGAgYW5kIGB0cmltbWVkUmlnaHRJbmRleGAgdG8gZGV0ZXJtaW5lIGlmIGFcbiAqIGNoYXJhY3RlciBjb2RlIGlzIHdoaXRlc3BhY2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBjaGFyQ29kZSBUaGUgY2hhcmFjdGVyIGNvZGUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgY2hhckNvZGVgIGlzIHdoaXRlc3BhY2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNTcGFjZShjaGFyQ29kZSkge1xuICByZXR1cm4gKChjaGFyQ29kZSA8PSAxNjAgJiYgKGNoYXJDb2RlID49IDkgJiYgY2hhckNvZGUgPD0gMTMpIHx8IGNoYXJDb2RlID09IDMyIHx8IGNoYXJDb2RlID09IDE2MCkgfHwgY2hhckNvZGUgPT0gNTc2MCB8fCBjaGFyQ29kZSA9PSA2MTU4IHx8XG4gICAgKGNoYXJDb2RlID49IDgxOTIgJiYgKGNoYXJDb2RlIDw9IDgyMDIgfHwgY2hhckNvZGUgPT0gODIzMiB8fCBjaGFyQ29kZSA9PSA4MjMzIHx8IGNoYXJDb2RlID09IDgyMzkgfHwgY2hhckNvZGUgPT0gODI4NyB8fCBjaGFyQ29kZSA9PSAxMjI4OCB8fCBjaGFyQ29kZSA9PSA2NTI3OSkpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1NwYWNlO1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZUVzY2FwZSA9IC88JS0oW1xcc1xcU10rPyklPi9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlRXNjYXBlO1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZUV2YWx1YXRlID0gLzwlKFtcXHNcXFNdKz8pJT4vZztcblxubW9kdWxlLmV4cG9ydHMgPSByZUV2YWx1YXRlO1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZUludGVycG9sYXRlID0gLzwlPShbXFxzXFxTXSs/KSU+L2c7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVJbnRlcnBvbGF0ZTtcbiIsInZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4vaXNJbmRleCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzSW4nKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgT2JqZWN0LmtleXNgIHdoaWNoIGNyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlXG4gKiBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gc2hpbUtleXMob2JqZWN0KSB7XG4gIHZhciBwcm9wcyA9IGtleXNJbihvYmplY3QpLFxuICAgICAgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICBsZW5ndGggPSBwcm9wc0xlbmd0aCAmJiBvYmplY3QubGVuZ3RoO1xuXG4gIHZhciBhbGxvd0luZGV4ZXMgPSAhIWxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgcHJvcHNMZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIGlmICgoYWxsb3dJbmRleGVzICYmIGlzSW5kZXgoa2V5LCBsZW5ndGgpKSB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaGltS2V5cztcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGFuIG9iamVjdCBpZiBpdCdzIG5vdCBvbmUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdCh2YWx1ZSkgPyB2YWx1ZSA6IE9iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9PYmplY3Q7XG4iLCJ2YXIgaXNTcGFjZSA9IHJlcXVpcmUoJy4vaXNTcGFjZScpO1xuXG4vKipcbiAqIFVzZWQgYnkgYF8udHJpbWAgYW5kIGBfLnRyaW1MZWZ0YCB0byBnZXQgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBub24td2hpdGVzcGFjZVxuICogY2hhcmFjdGVyIG9mIGBzdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gKi9cbmZ1bmN0aW9uIHRyaW1tZWRMZWZ0SW5kZXgoc3RyaW5nKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCAmJiBpc1NwYWNlKHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KSkpIHt9XG4gIHJldHVybiBpbmRleDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0cmltbWVkTGVmdEluZGV4O1xuIiwidmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuL2lzU3BhY2UnKTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLnRyaW1gIGFuZCBgXy50cmltUmlnaHRgIHRvIGdldCB0aGUgaW5kZXggb2YgdGhlIGxhc3Qgbm9uLXdoaXRlc3BhY2VcbiAqIGNoYXJhY3RlciBvZiBgc3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUaGUgc3RyaW5nIHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gKi9cbmZ1bmN0aW9uIHRyaW1tZWRSaWdodEluZGV4KHN0cmluZykge1xuICB2YXIgaW5kZXggPSBzdHJpbmcubGVuZ3RoO1xuXG4gIHdoaWxlIChpbmRleC0tICYmIGlzU3BhY2Uoc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXgpKSkge31cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRyaW1tZWRSaWdodEluZGV4O1xuIiwidmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSkgJiZcbiAgICBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiYgIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FyZ3VtZW50cztcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUlzQXJyYXkgPSBnZXROYXRpdmUoQXJyYXksICdpc0FycmF5Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJyYXlUYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXk7XG4iLCJ2YXIgYmFzZUlzRXF1YWwgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlSXNFcXVhbCcpLFxuICAgIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2JpbmRDYWxsYmFjaycpO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmVcbiAqIGVxdWl2YWxlbnQuIElmIGBjdXN0b21pemVyYCBpcyBwcm92aWRlZCBpdCdzIGludm9rZWQgdG8gY29tcGFyZSB2YWx1ZXMuXG4gKiBJZiBgY3VzdG9taXplcmAgcmV0dXJucyBgdW5kZWZpbmVkYCBjb21wYXJpc29ucyBhcmUgaGFuZGxlZCBieSB0aGUgbWV0aG9kXG4gKiBpbnN0ZWFkLiBUaGUgYGN1c3RvbWl6ZXJgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHVwIHRvXG4gKiB0aHJlZSBhcmd1bWVudHM6ICh2YWx1ZSwgb3RoZXIgWywgaW5kZXh8a2V5XSkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIHN1cHBvcnRzIGNvbXBhcmluZyBhcnJheXMsIGJvb2xlYW5zLCBgRGF0ZWAgb2JqZWN0cyxcbiAqIG51bWJlcnMsIGBPYmplY3RgIG9iamVjdHMsIHJlZ2V4ZXMsIGFuZCBzdHJpbmdzLiBPYmplY3RzIGFyZSBjb21wYXJlZCBieVxuICogdGhlaXIgb3duLCBub3QgaW5oZXJpdGVkLCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuIEZ1bmN0aW9ucyBhbmQgRE9NIG5vZGVzXG4gKiBhcmUgKipub3QqKiBzdXBwb3J0ZWQuIFByb3ZpZGUgYSBjdXN0b21pemVyIGZ1bmN0aW9uIHRvIGV4dGVuZCBzdXBwb3J0XG4gKiBmb3IgY29tcGFyaW5nIG90aGVyIHZhbHVlcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGFsaWFzIGVxXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSB2YWx1ZSBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY3VzdG9taXplcmAuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICogdmFyIG90aGVyID0geyAndXNlcic6ICdmcmVkJyB9O1xuICpcbiAqIG9iamVjdCA9PSBvdGhlcjtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0VxdWFsKG9iamVjdCwgb3RoZXIpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIC8vIHVzaW5nIGEgY3VzdG9taXplciBjYWxsYmFja1xuICogdmFyIGFycmF5ID0gWydoZWxsbycsICdnb29kYnllJ107XG4gKiB2YXIgb3RoZXIgPSBbJ2hpJywgJ2dvb2RieWUnXTtcbiAqXG4gKiBfLmlzRXF1YWwoYXJyYXksIG90aGVyLCBmdW5jdGlvbih2YWx1ZSwgb3RoZXIpIHtcbiAqICAgaWYgKF8uZXZlcnkoW3ZhbHVlLCBvdGhlcl0sIFJlZ0V4cC5wcm90b3R5cGUudGVzdCwgL15oKD86aXxlbGxvKSQvKSkge1xuICogICAgIHJldHVybiB0cnVlO1xuICogICB9XG4gKiB9KTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNFcXVhbCh2YWx1ZSwgb3RoZXIsIGN1c3RvbWl6ZXIsIHRoaXNBcmcpIHtcbiAgY3VzdG9taXplciA9IHR5cGVvZiBjdXN0b21pemVyID09ICdmdW5jdGlvbicgPyBiaW5kQ2FsbGJhY2soY3VzdG9taXplciwgdGhpc0FyZywgMykgOiB1bmRlZmluZWQ7XG4gIHZhciByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcih2YWx1ZSwgb3RoZXIpIDogdW5kZWZpbmVkO1xuICByZXR1cm4gIHJlc3VsdCA9PT0gdW5kZWZpbmVkID8gYmFzZUlzRXF1YWwodmFsdWUsIG90aGVyLCBjdXN0b21pemVyKSA6ICEhcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRXF1YWw7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFuIGBFcnJvcmAsIGBFdmFsRXJyb3JgLCBgUmFuZ2VFcnJvcmAsIGBSZWZlcmVuY2VFcnJvcmAsXG4gKiBgU3ludGF4RXJyb3JgLCBgVHlwZUVycm9yYCwgb3IgYFVSSUVycm9yYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGVycm9yIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRXJyb3IobmV3IEVycm9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRXJyb3IoRXJyb3IpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUubWVzc2FnZSA9PSAnc3RyaW5nJyAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBlcnJvclRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Vycm9yO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaSB3aGljaCByZXR1cm4gJ2Z1bmN0aW9uJyBmb3IgcmVnZXhlc1xuICAvLyBhbmQgU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLlxuICByZXR1cm4gaXNPYmplY3QodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IGZ1bmNUYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBob3N0IGNvbnN0cnVjdG9ycyAoU2FmYXJpID4gNSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xudmFyIHJlSXNOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgZm5Ub1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZywgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc05hdGl2ZShBcnJheS5wcm90b3R5cGUucHVzaCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05hdGl2ZShfKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHJldHVybiByZUlzTmF0aXZlLnRlc3QoZm5Ub1N0cmluZy5jYWxsKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgcmVJc0hvc3RDdG9yLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsInZhciBiYXNlRm9ySW4gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRm9ySW4nKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgdGhhdCBpcywgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlXG4gKiBgT2JqZWN0YCBjb25zdHJ1Y3RvciBvciBvbmUgd2l0aCBhIGBbW1Byb3RvdHlwZV1dYCBvZiBgbnVsbGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGFzc3VtZXMgb2JqZWN0cyBjcmVhdGVkIGJ5IHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3RvclxuICogaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiB9XG4gKlxuICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHZhciBDdG9yO1xuXG4gIC8vIEV4aXQgZWFybHkgZm9yIG5vbiBgT2JqZWN0YCBvYmplY3RzLlxuICBpZiAoIShpc09iamVjdExpa2UodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdFRhZyAmJiAhaXNBcmd1bWVudHModmFsdWUpKSB8fFxuICAgICAgKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY29uc3RydWN0b3InKSAmJiAoQ3RvciA9IHZhbHVlLmNvbnN0cnVjdG9yLCB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmICEoQ3RvciBpbnN0YW5jZW9mIEN0b3IpKSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gSUUgPCA5IGl0ZXJhdGVzIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGJlZm9yZSBvd24gcHJvcGVydGllcy4gSWYgdGhlIGZpcnN0XG4gIC8vIGl0ZXJhdGVkIHByb3BlcnR5IGlzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWRcbiAgLy8gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICB2YXIgcmVzdWx0O1xuICAvLyBJbiBtb3N0IGVudmlyb25tZW50cyBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcyBhcmUgaXRlcmF0ZWQgYmVmb3JlXG4gIC8vIGl0cyBpbmhlcml0ZWQgcHJvcGVydGllcy4gSWYgdGhlIGxhc3QgaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3NcbiAgLy8gb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gIGJhc2VGb3JJbih2YWx1ZSwgZnVuY3Rpb24oc3ViVmFsdWUsIGtleSkge1xuICAgIHJlc3VsdCA9IGtleTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQgPT09IHVuZGVmaW5lZCB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCByZXN1bHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUGxhaW5PYmplY3Q7XG4iLCJ2YXIgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIG1hcFRhZyA9ICdbb2JqZWN0IE1hcF0nLFxuICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHNldFRhZyA9ICdbb2JqZWN0IFNldF0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nLFxuICAgIHdlYWtNYXBUYWcgPSAnW29iamVjdCBXZWFrTWFwXSc7XG5cbnZhciBhcnJheUJ1ZmZlclRhZyA9ICdbb2JqZWN0IEFycmF5QnVmZmVyXScsXG4gICAgZmxvYXQzMlRhZyA9ICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICBpbnQ4VGFnID0gJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgaW50MTZUYWcgPSAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgdWludDhUYWcgPSAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgdWludDhDbGFtcGVkVGFnID0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgIHVpbnQzMlRhZyA9ICdbb2JqZWN0IFVpbnQzMkFycmF5XSc7XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbnZhciB0eXBlZEFycmF5VGFncyA9IHt9O1xudHlwZWRBcnJheVRhZ3NbZmxvYXQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1tmbG9hdDY0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50OFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDhDbGFtcGVkVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG50eXBlZEFycmF5VGFnc1thcmdzVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2FycmF5VGFnXSA9XG50eXBlZEFycmF5VGFnc1thcnJheUJ1ZmZlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tib29sVGFnXSA9XG50eXBlZEFycmF5VGFnc1tkYXRlVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Vycm9yVGFnXSA9XG50eXBlZEFycmF5VGFnc1tmdW5jVGFnXSA9IHR5cGVkQXJyYXlUYWdzW21hcFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbbnVtYmVyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW29iamVjdFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbcmVnZXhwVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3NldFRhZ10gPVxudHlwZWRBcnJheVRhZ3Nbc3RyaW5nVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3dlYWtNYXBUYWddID0gZmFsc2U7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSB0eXBlZCBhcnJheS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkobmV3IFVpbnQ4QXJyYXkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KFtdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICEhdHlwZWRBcnJheVRhZ3Nbb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZWRBcnJheTtcbiIsInZhciBiYXNlQ29weSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VDb3B5JyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBwbGFpbiBvYmplY3QgZmxhdHRlbmluZyBpbmhlcml0ZWQgZW51bWVyYWJsZVxuICogcHJvcGVydGllcyBvZiBgdmFsdWVgIHRvIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBwbGFpbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY29udmVydGVkIHBsYWluIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5hc3NpZ24oeyAnYSc6IDEgfSwgbmV3IEZvbyk7XG4gKiAvLyA9PiB7ICdhJzogMSwgJ2InOiAyIH1cbiAqXG4gKiBfLmFzc2lnbih7ICdhJzogMSB9LCBfLnRvUGxhaW5PYmplY3QobmV3IEZvbykpO1xuICogLy8gPT4geyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzIH1cbiAqL1xuZnVuY3Rpb24gdG9QbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gYmFzZUNvcHkodmFsdWUsIGtleXNJbih2YWx1ZSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvUGxhaW5PYmplY3Q7XG4iLCJ2YXIgYXNzaWduV2l0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Fzc2lnbldpdGgnKSxcbiAgICBiYXNlQXNzaWduID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUFzc2lnbicpLFxuICAgIGNyZWF0ZUFzc2lnbmVyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY3JlYXRlQXNzaWduZXInKTtcblxuLyoqXG4gKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAqIG9iamVjdC4gU3Vic2VxdWVudCBzb3VyY2VzIG92ZXJ3cml0ZSBwcm9wZXJ0eSBhc3NpZ25tZW50cyBvZiBwcmV2aW91cyBzb3VyY2VzLlxuICogSWYgYGN1c3RvbWl6ZXJgIGlzIHByb3ZpZGVkIGl0J3MgaW52b2tlZCB0byBwcm9kdWNlIHRoZSBhc3NpZ25lZCB2YWx1ZXMuXG4gKiBUaGUgYGN1c3RvbWl6ZXJgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIGZpdmUgYXJndW1lbnRzOlxuICogKG9iamVjdFZhbHVlLCBzb3VyY2VWYWx1ZSwga2V5LCBvYmplY3QsIHNvdXJjZSkuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIG11dGF0ZXMgYG9iamVjdGAgYW5kIGlzIGJhc2VkIG9uXG4gKiBbYE9iamVjdC5hc3NpZ25gXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QuYXNzaWduKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGFsaWFzIGV4dGVuZFxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHsuLi5PYmplY3R9IFtzb3VyY2VzXSBUaGUgc291cmNlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBhc3NpZ25lZCB2YWx1ZXMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGN1c3RvbWl6ZXJgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5hc3NpZ24oeyAndXNlcic6ICdiYXJuZXknIH0sIHsgJ2FnZSc6IDQwIH0sIHsgJ3VzZXInOiAnZnJlZCcgfSk7XG4gKiAvLyA9PiB7ICd1c2VyJzogJ2ZyZWQnLCAnYWdlJzogNDAgfVxuICpcbiAqIC8vIHVzaW5nIGEgY3VzdG9taXplciBjYWxsYmFja1xuICogdmFyIGRlZmF1bHRzID0gXy5wYXJ0aWFsUmlnaHQoXy5hc3NpZ24sIGZ1bmN0aW9uKHZhbHVlLCBvdGhlcikge1xuICogICByZXR1cm4gXy5pc1VuZGVmaW5lZCh2YWx1ZSkgPyBvdGhlciA6IHZhbHVlO1xuICogfSk7XG4gKlxuICogZGVmYXVsdHMoeyAndXNlcic6ICdiYXJuZXknIH0sIHsgJ2FnZSc6IDM2IH0sIHsgJ3VzZXInOiAnZnJlZCcgfSk7XG4gKiAvLyA9PiB7ICd1c2VyJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9XG4gKi9cbnZhciBhc3NpZ24gPSBjcmVhdGVBc3NpZ25lcihmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplcikge1xuICByZXR1cm4gY3VzdG9taXplclxuICAgID8gYXNzaWduV2l0aChvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplcilcbiAgICA6IGJhc2VBc3NpZ24ob2JqZWN0LCBzb3VyY2UpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzaWduO1xuIiwidmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2dldE5hdGl2ZScpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKSxcbiAgICBzaGltS2V5cyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3NoaW1LZXlzJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlS2V5cyA9IGdldE5hdGl2ZShPYmplY3QsICdrZXlzJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuIFNlZSB0aGVcbiAqIFtFUyBzcGVjXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3Qua2V5cylcbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5cyhuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqXG4gKiBfLmtleXMoJ2hpJyk7XG4gKiAvLyA9PiBbJzAnLCAnMSddXG4gKi9cbnZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgQ3RvciA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0LmNvbnN0cnVjdG9yO1xuICBpZiAoKHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUgPT09IG9iamVjdCkgfHxcbiAgICAgICh0eXBlb2Ygb2JqZWN0ICE9ICdmdW5jdGlvbicgJiYgaXNBcnJheUxpa2Uob2JqZWN0KSkpIHtcbiAgICByZXR1cm4gc2hpbUtleXMob2JqZWN0KTtcbiAgfVxuICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSA/IG5hdGl2ZUtleXMob2JqZWN0KSA6IFtdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzO1xuIiwidmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FyZ3VtZW50cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNJbmRleCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzSW4obmV3IEZvbyk7XG4gKiAvLyA9PiBbJ2EnLCAnYicsICdjJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xuZnVuY3Rpb24ga2V5c0luKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG4gIH1cbiAgdmFyIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7XG4gIGxlbmd0aCA9IChsZW5ndGggJiYgaXNMZW5ndGgobGVuZ3RoKSAmJlxuICAgIChpc0FycmF5KG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSkgJiYgbGVuZ3RoKSB8fCAwO1xuXG4gIHZhciBDdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgaW5kZXggPSAtMSxcbiAgICAgIGlzUHJvdG8gPSB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlID09PSBvYmplY3QsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpLFxuICAgICAgc2tpcEluZGV4ZXMgPSBsZW5ndGggPiAwO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IChpbmRleCArICcnKTtcbiAgfVxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgaWYgKCEoc2tpcEluZGV4ZXMgJiYgaXNJbmRleChrZXksIGxlbmd0aCkpICYmXG4gICAgICAgICEoa2V5ID09ICdjb25zdHJ1Y3RvcicgJiYgKGlzUHJvdG8gfHwgIWhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5c0luO1xuIiwidmFyIGJhc2VNZXJnZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VNZXJnZScpLFxuICAgIGNyZWF0ZUFzc2lnbmVyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY3JlYXRlQXNzaWduZXInKTtcblxuLyoqXG4gKiBSZWN1cnNpdmVseSBtZXJnZXMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGUgc291cmNlIG9iamVjdChzKSwgdGhhdFxuICogZG9uJ3QgcmVzb2x2ZSB0byBgdW5kZWZpbmVkYCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlc1xuICogb3ZlcndyaXRlIHByb3BlcnR5IGFzc2lnbm1lbnRzIG9mIHByZXZpb3VzIHNvdXJjZXMuIElmIGBjdXN0b21pemVyYCBpc1xuICogcHJvdmlkZWQgaXQncyBpbnZva2VkIHRvIHByb2R1Y2UgdGhlIG1lcmdlZCB2YWx1ZXMgb2YgdGhlIGRlc3RpbmF0aW9uIGFuZFxuICogc291cmNlIHByb3BlcnRpZXMuIElmIGBjdXN0b21pemVyYCByZXR1cm5zIGB1bmRlZmluZWRgIG1lcmdpbmcgaXMgaGFuZGxlZFxuICogYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLiBUaGUgYGN1c3RvbWl6ZXJgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZFxuICogd2l0aCBmaXZlIGFyZ3VtZW50czogKG9iamVjdFZhbHVlLCBzb3VyY2VWYWx1ZSwga2V5LCBvYmplY3QsIHNvdXJjZSkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlc10gVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduZWQgdmFsdWVzLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjdXN0b21pemVyYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciB1c2VycyA9IHtcbiAqICAgJ2RhdGEnOiBbeyAndXNlcic6ICdiYXJuZXknIH0sIHsgJ3VzZXInOiAnZnJlZCcgfV1cbiAqIH07XG4gKlxuICogdmFyIGFnZXMgPSB7XG4gKiAgICdkYXRhJzogW3sgJ2FnZSc6IDM2IH0sIHsgJ2FnZSc6IDQwIH1dXG4gKiB9O1xuICpcbiAqIF8ubWVyZ2UodXNlcnMsIGFnZXMpO1xuICogLy8gPT4geyAnZGF0YSc6IFt7ICd1c2VyJzogJ2Jhcm5leScsICdhZ2UnOiAzNiB9LCB7ICd1c2VyJzogJ2ZyZWQnLCAnYWdlJzogNDAgfV0gfVxuICpcbiAqIC8vIHVzaW5nIGEgY3VzdG9taXplciBjYWxsYmFja1xuICogdmFyIG9iamVjdCA9IHtcbiAqICAgJ2ZydWl0cyc6IFsnYXBwbGUnXSxcbiAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnXVxuICogfTtcbiAqXG4gKiB2YXIgb3RoZXIgPSB7XG4gKiAgICdmcnVpdHMnOiBbJ2JhbmFuYSddLFxuICogICAndmVnZXRhYmxlcyc6IFsnY2Fycm90J11cbiAqIH07XG4gKlxuICogXy5tZXJnZShvYmplY3QsIG90aGVyLCBmdW5jdGlvbihhLCBiKSB7XG4gKiAgIGlmIChfLmlzQXJyYXkoYSkpIHtcbiAqICAgICByZXR1cm4gYS5jb25jYXQoYik7XG4gKiAgIH1cbiAqIH0pO1xuICogLy8gPT4geyAnZnJ1aXRzJzogWydhcHBsZScsICdiYW5hbmEnXSwgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnLCAnY2Fycm90J10gfVxuICovXG52YXIgbWVyZ2UgPSBjcmVhdGVBc3NpZ25lcihiYXNlTWVyZ2UpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lcmdlO1xuIiwidmFyIGJhc2VUb1N0cmluZyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VUb1N0cmluZycpLFxuICAgIGVzY2FwZUh0bWxDaGFyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZXNjYXBlSHRtbENoYXInKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggSFRNTCBlbnRpdGllcyBhbmQgSFRNTCBjaGFyYWN0ZXJzLiAqL1xudmFyIHJlVW5lc2NhcGVkSHRtbCA9IC9bJjw+XCInYF0vZyxcbiAgICByZUhhc1VuZXNjYXBlZEh0bWwgPSBSZWdFeHAocmVVbmVzY2FwZWRIdG1sLnNvdXJjZSk7XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGNoYXJhY3RlcnMgXCImXCIsIFwiPFwiLCBcIj5cIiwgJ1wiJywgXCInXCIsIGFuZCBcIlxcYFwiLCBpbiBgc3RyaW5nYCB0b1xuICogdGhlaXIgY29ycmVzcG9uZGluZyBIVE1MIGVudGl0aWVzLlxuICpcbiAqICoqTm90ZToqKiBObyBvdGhlciBjaGFyYWN0ZXJzIGFyZSBlc2NhcGVkLiBUbyBlc2NhcGUgYWRkaXRpb25hbCBjaGFyYWN0ZXJzXG4gKiB1c2UgYSB0aGlyZC1wYXJ0eSBsaWJyYXJ5IGxpa2UgW19oZV9dKGh0dHBzOi8vbXRocy5iZS9oZSkuXG4gKlxuICogVGhvdWdoIHRoZSBcIj5cIiBjaGFyYWN0ZXIgaXMgZXNjYXBlZCBmb3Igc3ltbWV0cnksIGNoYXJhY3RlcnMgbGlrZVxuICogXCI+XCIgYW5kIFwiL1wiIGRvbid0IG5lZWQgZXNjYXBpbmcgaW4gSFRNTCBhbmQgaGF2ZSBubyBzcGVjaWFsIG1lYW5pbmdcbiAqIHVubGVzcyB0aGV5J3JlIHBhcnQgb2YgYSB0YWcgb3IgdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlLlxuICogU2VlIFtNYXRoaWFzIEJ5bmVucydzIGFydGljbGVdKGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9hbWJpZ3VvdXMtYW1wZXJzYW5kcylcbiAqICh1bmRlciBcInNlbWktcmVsYXRlZCBmdW4gZmFjdFwiKSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEJhY2t0aWNrcyBhcmUgZXNjYXBlZCBiZWNhdXNlIGluIEludGVybmV0IEV4cGxvcmVyIDwgOSwgdGhleSBjYW4gYnJlYWsgb3V0XG4gKiBvZiBhdHRyaWJ1dGUgdmFsdWVzIG9yIEhUTUwgY29tbWVudHMuIFNlZSBbIzU5XShodHRwczovL2h0bWw1c2VjLm9yZy8jNTkpLFxuICogWyMxMDJdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMDIpLCBbIzEwOF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzEwOCksIGFuZFxuICogWyMxMzNdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMzMpIG9mIHRoZSBbSFRNTDUgU2VjdXJpdHkgQ2hlYXRzaGVldF0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBXaGVuIHdvcmtpbmcgd2l0aCBIVE1MIHlvdSBzaG91bGQgYWx3YXlzIFtxdW90ZSBhdHRyaWJ1dGUgdmFsdWVzXShodHRwOi8vd29ua28uY29tL3Bvc3QvaHRtbC1lc2NhcGluZylcbiAqIHRvIHJlZHVjZSBYU1MgdmVjdG9ycy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSBzdHJpbmcgdG8gZXNjYXBlLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZXNjYXBlKCdmcmVkLCBiYXJuZXksICYgcGViYmxlcycpO1xuICogLy8gPT4gJ2ZyZWQsIGJhcm5leSwgJmFtcDsgcGViYmxlcydcbiAqL1xuZnVuY3Rpb24gZXNjYXBlKHN0cmluZykge1xuICAvLyBSZXNldCBgbGFzdEluZGV4YCBiZWNhdXNlIGluIElFIDwgOSBgU3RyaW5nI3JlcGxhY2VgIGRvZXMgbm90LlxuICBzdHJpbmcgPSBiYXNlVG9TdHJpbmcoc3RyaW5nKTtcbiAgcmV0dXJuIChzdHJpbmcgJiYgcmVIYXNVbmVzY2FwZWRIdG1sLnRlc3Qoc3RyaW5nKSlcbiAgICA/IHN0cmluZy5yZXBsYWNlKHJlVW5lc2NhcGVkSHRtbCwgZXNjYXBlSHRtbENoYXIpXG4gICAgOiBzdHJpbmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlO1xuIiwidmFyIGFzc2lnbk93bkRlZmF1bHRzID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXNzaWduT3duRGVmYXVsdHMnKSxcbiAgICBhc3NpZ25XaXRoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXNzaWduV2l0aCcpLFxuICAgIGF0dGVtcHQgPSByZXF1aXJlKCcuLi91dGlsaXR5L2F0dGVtcHQnKSxcbiAgICBiYXNlQXNzaWduID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUFzc2lnbicpLFxuICAgIGJhc2VUb1N0cmluZyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VUb1N0cmluZycpLFxuICAgIGJhc2VWYWx1ZXMgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlVmFsdWVzJyksXG4gICAgZXNjYXBlU3RyaW5nQ2hhciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2VzY2FwZVN0cmluZ0NoYXInKSxcbiAgICBpc0Vycm9yID0gcmVxdWlyZSgnLi4vbGFuZy9pc0Vycm9yJyksXG4gICAgaXNJdGVyYXRlZUNhbGwgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0l0ZXJhdGVlQ2FsbCcpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpLFxuICAgIHJlSW50ZXJwb2xhdGUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9yZUludGVycG9sYXRlJyksXG4gICAgdGVtcGxhdGVTZXR0aW5ncyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVTZXR0aW5ncycpO1xuXG4vKiogVXNlZCB0byBtYXRjaCBlbXB0eSBzdHJpbmcgbGl0ZXJhbHMgaW4gY29tcGlsZWQgdGVtcGxhdGUgc291cmNlLiAqL1xudmFyIHJlRW1wdHlTdHJpbmdMZWFkaW5nID0gL1xcYl9fcCBcXCs9ICcnOy9nLFxuICAgIHJlRW1wdHlTdHJpbmdNaWRkbGUgPSAvXFxiKF9fcCBcXCs9KSAnJyBcXCsvZyxcbiAgICByZUVtcHR5U3RyaW5nVHJhaWxpbmcgPSAvKF9fZVxcKC4qP1xcKXxcXGJfX3RcXCkpIFxcK1xcbicnOy9nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBbRVMgdGVtcGxhdGUgZGVsaW1pdGVyc10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdGVtcGxhdGUtbGl0ZXJhbC1sZXhpY2FsLWNvbXBvbmVudHMpLiAqL1xudmFyIHJlRXNUZW1wbGF0ZSA9IC9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZztcblxuLyoqIFVzZWQgdG8gZW5zdXJlIGNhcHR1cmluZyBvcmRlciBvZiB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLiAqL1xudmFyIHJlTm9NYXRjaCA9IC8oJF4pLztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggdW5lc2NhcGVkIGNoYXJhY3RlcnMgaW4gY29tcGlsZWQgc3RyaW5nIGxpdGVyYWxzLiAqL1xudmFyIHJlVW5lc2NhcGVkU3RyaW5nID0gL1snXFxuXFxyXFx1MjAyOFxcdTIwMjlcXFxcXS9nO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBjb21waWxlZCB0ZW1wbGF0ZSBmdW5jdGlvbiB0aGF0IGNhbiBpbnRlcnBvbGF0ZSBkYXRhIHByb3BlcnRpZXNcbiAqIGluIFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXJzLCBIVE1MLWVzY2FwZSBpbnRlcnBvbGF0ZWQgZGF0YSBwcm9wZXJ0aWVzIGluXG4gKiBcImVzY2FwZVwiIGRlbGltaXRlcnMsIGFuZCBleGVjdXRlIEphdmFTY3JpcHQgaW4gXCJldmFsdWF0ZVwiIGRlbGltaXRlcnMuIERhdGFcbiAqIHByb3BlcnRpZXMgbWF5IGJlIGFjY2Vzc2VkIGFzIGZyZWUgdmFyaWFibGVzIGluIHRoZSB0ZW1wbGF0ZS4gSWYgYSBzZXR0aW5nXG4gKiBvYmplY3QgaXMgcHJvdmlkZWQgaXQgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGBfLnRlbXBsYXRlU2V0dGluZ3NgIHZhbHVlcy5cbiAqXG4gKiAqKk5vdGU6KiogSW4gdGhlIGRldmVsb3BtZW50IGJ1aWxkIGBfLnRlbXBsYXRlYCB1dGlsaXplc1xuICogW3NvdXJjZVVSTHNdKGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2RldmVsb3BlcnRvb2xzL3NvdXJjZW1hcHMvI3RvYy1zb3VyY2V1cmwpXG4gKiBmb3IgZWFzaWVyIGRlYnVnZ2luZy5cbiAqXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBwcmVjb21waWxpbmcgdGVtcGxhdGVzIHNlZVxuICogW2xvZGFzaCdzIGN1c3RvbSBidWlsZHMgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9sb2Rhc2guY29tL2N1c3RvbS1idWlsZHMpLlxuICpcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIENocm9tZSBleHRlbnNpb24gc2FuZGJveGVzIHNlZVxuICogW0Nocm9tZSdzIGV4dGVuc2lvbnMgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kZXZlbG9wZXIuY2hyb21lLmNvbS9leHRlbnNpb25zL3NhbmRib3hpbmdFdmFsKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSB0ZW1wbGF0ZSBzdHJpbmcuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5lc2NhcGVdIFRoZSBIVE1MIFwiZXNjYXBlXCIgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmV2YWx1YXRlXSBUaGUgXCJldmFsdWF0ZVwiIGRlbGltaXRlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5pbXBvcnRzXSBBbiBvYmplY3QgdG8gaW1wb3J0IGludG8gdGhlIHRlbXBsYXRlIGFzIGZyZWUgdmFyaWFibGVzLlxuICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmludGVycG9sYXRlXSBUaGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zb3VyY2VVUkxdIFRoZSBzb3VyY2VVUkwgb2YgdGhlIHRlbXBsYXRlJ3MgY29tcGlsZWQgc291cmNlLlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnZhcmlhYmxlXSBUaGUgZGF0YSBvYmplY3QgdmFyaWFibGUgbmFtZS5cbiAqIEBwYXJhbS0ge09iamVjdH0gW290aGVyT3B0aW9uc10gRW5hYmxlcyB0aGUgbGVnYWN5IGBvcHRpb25zYCBwYXJhbSBzaWduYXR1cmUuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIGNvbXBpbGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyB1c2luZyB0aGUgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlciB0byBjcmVhdGUgYSBjb21waWxlZCB0ZW1wbGF0ZVxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8gPCU9IHVzZXIgJT4hJyk7XG4gKiBjb21waWxlZCh7ICd1c2VyJzogJ2ZyZWQnIH0pO1xuICogLy8gPT4gJ2hlbGxvIGZyZWQhJ1xuICpcbiAqIC8vIHVzaW5nIHRoZSBIVE1MIFwiZXNjYXBlXCIgZGVsaW1pdGVyIHRvIGVzY2FwZSBkYXRhIHByb3BlcnR5IHZhbHVlc1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnPGI+PCUtIHZhbHVlICU+PC9iPicpO1xuICogY29tcGlsZWQoeyAndmFsdWUnOiAnPHNjcmlwdD4nIH0pO1xuICogLy8gPT4gJzxiPiZsdDtzY3JpcHQmZ3Q7PC9iPidcbiAqXG4gKiAvLyB1c2luZyB0aGUgXCJldmFsdWF0ZVwiIGRlbGltaXRlciB0byBleGVjdXRlIEphdmFTY3JpcHQgYW5kIGdlbmVyYXRlIEhUTUxcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJzwlIF8uZm9yRWFjaCh1c2VycywgZnVuY3Rpb24odXNlcikgeyAlPjxsaT48JS0gdXNlciAlPjwvbGk+PCUgfSk7ICU+Jyk7XG4gKiBjb21waWxlZCh7ICd1c2Vycyc6IFsnZnJlZCcsICdiYXJuZXknXSB9KTtcbiAqIC8vID0+ICc8bGk+ZnJlZDwvbGk+PGxpPmJhcm5leTwvbGk+J1xuICpcbiAqIC8vIHVzaW5nIHRoZSBpbnRlcm5hbCBgcHJpbnRgIGZ1bmN0aW9uIGluIFwiZXZhbHVhdGVcIiBkZWxpbWl0ZXJzXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8JSBwcmludChcImhlbGxvIFwiICsgdXNlcik7ICU+IScpO1xuICogY29tcGlsZWQoeyAndXNlcic6ICdiYXJuZXknIH0pO1xuICogLy8gPT4gJ2hlbGxvIGJhcm5leSEnXG4gKlxuICogLy8gdXNpbmcgdGhlIEVTIGRlbGltaXRlciBhcyBhbiBhbHRlcm5hdGl2ZSB0byB0aGUgZGVmYXVsdCBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoZWxsbyAkeyB1c2VyIH0hJyk7XG4gKiBjb21waWxlZCh7ICd1c2VyJzogJ3BlYmJsZXMnIH0pO1xuICogLy8gPT4gJ2hlbGxvIHBlYmJsZXMhJ1xuICpcbiAqIC8vIHVzaW5nIGN1c3RvbSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzXG4gKiBfLnRlbXBsYXRlU2V0dGluZ3MuaW50ZXJwb2xhdGUgPSAve3soW1xcc1xcU10rPyl9fS9nO1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8ge3sgdXNlciB9fSEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAnbXVzdGFjaGUnIH0pO1xuICogLy8gPT4gJ2hlbGxvIG11c3RhY2hlISdcbiAqXG4gKiAvLyB1c2luZyBiYWNrc2xhc2hlcyB0byB0cmVhdCBkZWxpbWl0ZXJzIGFzIHBsYWluIHRleHRcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJzwlPSBcIlxcXFw8JS0gdmFsdWUgJVxcXFw+XCIgJT4nKTtcbiAqIGNvbXBpbGVkKHsgJ3ZhbHVlJzogJ2lnbm9yZWQnIH0pO1xuICogLy8gPT4gJzwlLSB2YWx1ZSAlPidcbiAqXG4gKiAvLyB1c2luZyB0aGUgYGltcG9ydHNgIG9wdGlvbiB0byBpbXBvcnQgYGpRdWVyeWAgYXMgYGpxYFxuICogdmFyIHRleHQgPSAnPCUganEuZWFjaCh1c2VycywgZnVuY3Rpb24odXNlcikgeyAlPjxsaT48JS0gdXNlciAlPjwvbGk+PCUgfSk7ICU+JztcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUodGV4dCwgeyAnaW1wb3J0cyc6IHsgJ2pxJzogalF1ZXJ5IH0gfSk7XG4gKiBjb21waWxlZCh7ICd1c2Vycyc6IFsnZnJlZCcsICdiYXJuZXknXSB9KTtcbiAqIC8vID0+ICc8bGk+ZnJlZDwvbGk+PGxpPmJhcm5leTwvbGk+J1xuICpcbiAqIC8vIHVzaW5nIHRoZSBgc291cmNlVVJMYCBvcHRpb24gdG8gc3BlY2lmeSBhIGN1c3RvbSBzb3VyY2VVUkwgZm9yIHRoZSB0ZW1wbGF0ZVxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8gPCU9IHVzZXIgJT4hJywgeyAnc291cmNlVVJMJzogJy9iYXNpYy9ncmVldGluZy5qc3QnIH0pO1xuICogY29tcGlsZWQoZGF0YSk7XG4gKiAvLyA9PiBmaW5kIHRoZSBzb3VyY2Ugb2YgXCJncmVldGluZy5qc3RcIiB1bmRlciB0aGUgU291cmNlcyB0YWIgb3IgUmVzb3VyY2VzIHBhbmVsIG9mIHRoZSB3ZWIgaW5zcGVjdG9yXG4gKlxuICogLy8gdXNpbmcgdGhlIGB2YXJpYWJsZWAgb3B0aW9uIHRvIGVuc3VyZSBhIHdpdGgtc3RhdGVtZW50IGlzbid0IHVzZWQgaW4gdGhlIGNvbXBpbGVkIHRlbXBsYXRlXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoaSA8JT0gZGF0YS51c2VyICU+IScsIHsgJ3ZhcmlhYmxlJzogJ2RhdGEnIH0pO1xuICogY29tcGlsZWQuc291cmNlO1xuICogLy8gPT4gZnVuY3Rpb24oZGF0YSkge1xuICogLy8gICB2YXIgX190LCBfX3AgPSAnJztcbiAqIC8vICAgX19wICs9ICdoaSAnICsgKChfX3QgPSAoIGRhdGEudXNlciApKSA9PSBudWxsID8gJycgOiBfX3QpICsgJyEnO1xuICogLy8gICByZXR1cm4gX19wO1xuICogLy8gfVxuICpcbiAqIC8vIHVzaW5nIHRoZSBgc291cmNlYCBwcm9wZXJ0eSB0byBpbmxpbmUgY29tcGlsZWQgdGVtcGxhdGVzIGZvciBtZWFuaW5nZnVsXG4gKiAvLyBsaW5lIG51bWJlcnMgaW4gZXJyb3IgbWVzc2FnZXMgYW5kIGEgc3RhY2sgdHJhY2VcbiAqIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKGN3ZCwgJ2pzdC5qcycpLCAnXFxcbiAqICAgdmFyIEpTVCA9IHtcXFxuICogICAgIFwibWFpblwiOiAnICsgXy50ZW1wbGF0ZShtYWluVGV4dCkuc291cmNlICsgJ1xcXG4gKiAgIH07XFxcbiAqICcpO1xuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZShzdHJpbmcsIG9wdGlvbnMsIG90aGVyT3B0aW9ucykge1xuICAvLyBCYXNlZCBvbiBKb2huIFJlc2lnJ3MgYHRtcGxgIGltcGxlbWVudGF0aW9uIChodHRwOi8vZWpvaG4ub3JnL2Jsb2cvamF2YXNjcmlwdC1taWNyby10ZW1wbGF0aW5nLylcbiAgLy8gYW5kIExhdXJhIERva3Rvcm92YSdzIGRvVC5qcyAoaHR0cHM6Ly9naXRodWIuY29tL29sYWRvL2RvVCkuXG4gIHZhciBzZXR0aW5ncyA9IHRlbXBsYXRlU2V0dGluZ3MuaW1wb3J0cy5fLnRlbXBsYXRlU2V0dGluZ3MgfHwgdGVtcGxhdGVTZXR0aW5ncztcblxuICBpZiAob3RoZXJPcHRpb25zICYmIGlzSXRlcmF0ZWVDYWxsKHN0cmluZywgb3B0aW9ucywgb3RoZXJPcHRpb25zKSkge1xuICAgIG9wdGlvbnMgPSBvdGhlck9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gIH1cbiAgc3RyaW5nID0gYmFzZVRvU3RyaW5nKHN0cmluZyk7XG4gIG9wdGlvbnMgPSBhc3NpZ25XaXRoKGJhc2VBc3NpZ24oe30sIG90aGVyT3B0aW9ucyB8fCBvcHRpb25zKSwgc2V0dGluZ3MsIGFzc2lnbk93bkRlZmF1bHRzKTtcblxuICB2YXIgaW1wb3J0cyA9IGFzc2lnbldpdGgoYmFzZUFzc2lnbih7fSwgb3B0aW9ucy5pbXBvcnRzKSwgc2V0dGluZ3MuaW1wb3J0cywgYXNzaWduT3duRGVmYXVsdHMpLFxuICAgICAgaW1wb3J0c0tleXMgPSBrZXlzKGltcG9ydHMpLFxuICAgICAgaW1wb3J0c1ZhbHVlcyA9IGJhc2VWYWx1ZXMoaW1wb3J0cywgaW1wb3J0c0tleXMpO1xuXG4gIHZhciBpc0VzY2FwaW5nLFxuICAgICAgaXNFdmFsdWF0aW5nLFxuICAgICAgaW5kZXggPSAwLFxuICAgICAgaW50ZXJwb2xhdGUgPSBvcHRpb25zLmludGVycG9sYXRlIHx8IHJlTm9NYXRjaCxcbiAgICAgIHNvdXJjZSA9IFwiX19wICs9ICdcIjtcblxuICAvLyBDb21waWxlIHRoZSByZWdleHAgdG8gbWF0Y2ggZWFjaCBkZWxpbWl0ZXIuXG4gIHZhciByZURlbGltaXRlcnMgPSBSZWdFeHAoXG4gICAgKG9wdGlvbnMuZXNjYXBlIHx8IHJlTm9NYXRjaCkuc291cmNlICsgJ3wnICtcbiAgICBpbnRlcnBvbGF0ZS5zb3VyY2UgKyAnfCcgK1xuICAgIChpbnRlcnBvbGF0ZSA9PT0gcmVJbnRlcnBvbGF0ZSA/IHJlRXNUZW1wbGF0ZSA6IHJlTm9NYXRjaCkuc291cmNlICsgJ3wnICtcbiAgICAob3B0aW9ucy5ldmFsdWF0ZSB8fCByZU5vTWF0Y2gpLnNvdXJjZSArICd8JCdcbiAgLCAnZycpO1xuXG4gIC8vIFVzZSBhIHNvdXJjZVVSTCBmb3IgZWFzaWVyIGRlYnVnZ2luZy5cbiAgdmFyIHNvdXJjZVVSTCA9ICdzb3VyY2VVUkwnIGluIG9wdGlvbnMgPyAnLy8jIHNvdXJjZVVSTD0nICsgb3B0aW9ucy5zb3VyY2VVUkwgKyAnXFxuJyA6ICcnO1xuXG4gIHN0cmluZy5yZXBsYWNlKHJlRGVsaW1pdGVycywgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZVZhbHVlLCBpbnRlcnBvbGF0ZVZhbHVlLCBlc1RlbXBsYXRlVmFsdWUsIGV2YWx1YXRlVmFsdWUsIG9mZnNldCkge1xuICAgIGludGVycG9sYXRlVmFsdWUgfHwgKGludGVycG9sYXRlVmFsdWUgPSBlc1RlbXBsYXRlVmFsdWUpO1xuXG4gICAgLy8gRXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBjYW4ndCBiZSBpbmNsdWRlZCBpbiBzdHJpbmcgbGl0ZXJhbHMuXG4gICAgc291cmNlICs9IHN0cmluZy5zbGljZShpbmRleCwgb2Zmc2V0KS5yZXBsYWNlKHJlVW5lc2NhcGVkU3RyaW5nLCBlc2NhcGVTdHJpbmdDaGFyKTtcblxuICAgIC8vIFJlcGxhY2UgZGVsaW1pdGVycyB3aXRoIHNuaXBwZXRzLlxuICAgIGlmIChlc2NhcGVWYWx1ZSkge1xuICAgICAgaXNFc2NhcGluZyA9IHRydWU7XG4gICAgICBzb3VyY2UgKz0gXCInICtcXG5fX2UoXCIgKyBlc2NhcGVWYWx1ZSArIFwiKSArXFxuJ1wiO1xuICAgIH1cbiAgICBpZiAoZXZhbHVhdGVWYWx1ZSkge1xuICAgICAgaXNFdmFsdWF0aW5nID0gdHJ1ZTtcbiAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZVZhbHVlICsgXCI7XFxuX19wICs9ICdcIjtcbiAgICB9XG4gICAgaWYgKGludGVycG9sYXRlVmFsdWUpIHtcbiAgICAgIHNvdXJjZSArPSBcIicgK1xcbigoX190ID0gKFwiICsgaW50ZXJwb2xhdGVWYWx1ZSArIFwiKSkgPT0gbnVsbCA/ICcnIDogX190KSArXFxuJ1wiO1xuICAgIH1cbiAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgIC8vIFRoZSBKUyBlbmdpbmUgZW1iZWRkZWQgaW4gQWRvYmUgcHJvZHVjdHMgcmVxdWlyZXMgcmV0dXJuaW5nIHRoZSBgbWF0Y2hgXG4gICAgLy8gc3RyaW5nIGluIG9yZGVyIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3QgYG9mZnNldGAgdmFsdWUuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9KTtcblxuICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gIC8vIElmIGB2YXJpYWJsZWAgaXMgbm90IHNwZWNpZmllZCB3cmFwIGEgd2l0aC1zdGF0ZW1lbnQgYXJvdW5kIHRoZSBnZW5lcmF0ZWRcbiAgLy8gY29kZSB0byBhZGQgdGhlIGRhdGEgb2JqZWN0IHRvIHRoZSB0b3Agb2YgdGhlIHNjb3BlIGNoYWluLlxuICB2YXIgdmFyaWFibGUgPSBvcHRpb25zLnZhcmlhYmxlO1xuICBpZiAoIXZhcmlhYmxlKSB7XG4gICAgc291cmNlID0gJ3dpdGggKG9iaikge1xcbicgKyBzb3VyY2UgKyAnXFxufVxcbic7XG4gIH1cbiAgLy8gQ2xlYW51cCBjb2RlIGJ5IHN0cmlwcGluZyBlbXB0eSBzdHJpbmdzLlxuICBzb3VyY2UgPSAoaXNFdmFsdWF0aW5nID8gc291cmNlLnJlcGxhY2UocmVFbXB0eVN0cmluZ0xlYWRpbmcsICcnKSA6IHNvdXJjZSlcbiAgICAucmVwbGFjZShyZUVtcHR5U3RyaW5nTWlkZGxlLCAnJDEnKVxuICAgIC5yZXBsYWNlKHJlRW1wdHlTdHJpbmdUcmFpbGluZywgJyQxOycpO1xuXG4gIC8vIEZyYW1lIGNvZGUgYXMgdGhlIGZ1bmN0aW9uIGJvZHkuXG4gIHNvdXJjZSA9ICdmdW5jdGlvbignICsgKHZhcmlhYmxlIHx8ICdvYmonKSArICcpIHtcXG4nICtcbiAgICAodmFyaWFibGVcbiAgICAgID8gJydcbiAgICAgIDogJ29iaiB8fCAob2JqID0ge30pO1xcbidcbiAgICApICtcbiAgICBcInZhciBfX3QsIF9fcCA9ICcnXCIgK1xuICAgIChpc0VzY2FwaW5nXG4gICAgICAgPyAnLCBfX2UgPSBfLmVzY2FwZSdcbiAgICAgICA6ICcnXG4gICAgKSArXG4gICAgKGlzRXZhbHVhdGluZ1xuICAgICAgPyAnLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcXG4nICtcbiAgICAgICAgXCJmdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cXG5cIlxuICAgICAgOiAnO1xcbidcbiAgICApICtcbiAgICBzb3VyY2UgK1xuICAgICdyZXR1cm4gX19wXFxufSc7XG5cbiAgdmFyIHJlc3VsdCA9IGF0dGVtcHQoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKGltcG9ydHNLZXlzLCBzb3VyY2VVUkwgKyAncmV0dXJuICcgKyBzb3VyY2UpLmFwcGx5KHVuZGVmaW5lZCwgaW1wb3J0c1ZhbHVlcyk7XG4gIH0pO1xuXG4gIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uJ3Mgc291cmNlIGJ5IGl0cyBgdG9TdHJpbmdgIG1ldGhvZCBvclxuICAvLyB0aGUgYHNvdXJjZWAgcHJvcGVydHkgYXMgYSBjb252ZW5pZW5jZSBmb3IgaW5saW5pbmcgY29tcGlsZWQgdGVtcGxhdGVzLlxuICByZXN1bHQuc291cmNlID0gc291cmNlO1xuICBpZiAoaXNFcnJvcihyZXN1bHQpKSB7XG4gICAgdGhyb3cgcmVzdWx0O1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7XG4iLCJ2YXIgZXNjYXBlID0gcmVxdWlyZSgnLi9lc2NhcGUnKSxcbiAgICByZUVzY2FwZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3JlRXNjYXBlJyksXG4gICAgcmVFdmFsdWF0ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3JlRXZhbHVhdGUnKSxcbiAgICByZUludGVycG9sYXRlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcmVJbnRlcnBvbGF0ZScpO1xuXG4vKipcbiAqIEJ5IGRlZmF1bHQsIHRoZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzIHVzZWQgYnkgbG9kYXNoIGFyZSBsaWtlIHRob3NlIGluXG4gKiBlbWJlZGRlZCBSdWJ5IChFUkIpLiBDaGFuZ2UgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2VcbiAqIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEB0eXBlIE9iamVjdFxuICovXG52YXIgdGVtcGxhdGVTZXR0aW5ncyA9IHtcblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgYGRhdGFgIHByb3BlcnR5IHZhbHVlcyB0byBiZSBIVE1MLWVzY2FwZWQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUgUmVnRXhwXG4gICAqL1xuICAnZXNjYXBlJzogcmVFc2NhcGUsXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZGV0ZWN0IGNvZGUgdG8gYmUgZXZhbHVhdGVkLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIFJlZ0V4cFxuICAgKi9cbiAgJ2V2YWx1YXRlJzogcmVFdmFsdWF0ZSxcblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgYGRhdGFgIHByb3BlcnR5IHZhbHVlcyB0byBpbmplY3QuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUgUmVnRXhwXG4gICAqL1xuICAnaW50ZXJwb2xhdGUnOiByZUludGVycG9sYXRlLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHJlZmVyZW5jZSB0aGUgZGF0YSBvYmplY3QgaW4gdGhlIHRlbXBsYXRlIHRleHQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUgc3RyaW5nXG4gICAqL1xuICAndmFyaWFibGUnOiAnJyxcblxuICAvKipcbiAgICogVXNlZCB0byBpbXBvcnQgdmFyaWFibGVzIGludG8gdGhlIGNvbXBpbGVkIHRlbXBsYXRlLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cbiAgJ2ltcG9ydHMnOiB7XG5cbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgYGxvZGFzaGAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzLmltcG9ydHNcbiAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAqL1xuICAgICdfJzogeyAnZXNjYXBlJzogZXNjYXBlIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZVNldHRpbmdzO1xuIiwidmFyIGJhc2VUb1N0cmluZyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VUb1N0cmluZycpLFxuICAgIGNoYXJzTGVmdEluZGV4ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY2hhcnNMZWZ0SW5kZXgnKSxcbiAgICBjaGFyc1JpZ2h0SW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jaGFyc1JpZ2h0SW5kZXgnKSxcbiAgICBpc0l0ZXJhdGVlQ2FsbCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzSXRlcmF0ZWVDYWxsJyksXG4gICAgdHJpbW1lZExlZnRJbmRleCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3RyaW1tZWRMZWZ0SW5kZXgnKSxcbiAgICB0cmltbWVkUmlnaHRJbmRleCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3RyaW1tZWRSaWdodEluZGV4Jyk7XG5cbi8qKlxuICogUmVtb3ZlcyBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlIG9yIHNwZWNpZmllZCBjaGFyYWN0ZXJzIGZyb20gYHN0cmluZ2AuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgc3RyaW5nIHRvIHRyaW0uXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NoYXJzPXdoaXRlc3BhY2VdIFRoZSBjaGFyYWN0ZXJzIHRvIHRyaW0uXG4gKiBAcGFyYW0tIHtPYmplY3R9IFtndWFyZF0gRW5hYmxlcyB1c2UgYXMgYSBjYWxsYmFjayBmb3IgZnVuY3Rpb25zIGxpa2UgYF8ubWFwYC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHRyaW1tZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRyaW0oJyAgYWJjICAnKTtcbiAqIC8vID0+ICdhYmMnXG4gKlxuICogXy50cmltKCctXy1hYmMtXy0nLCAnXy0nKTtcbiAqIC8vID0+ICdhYmMnXG4gKlxuICogXy5tYXAoWycgIGZvbyAgJywgJyAgYmFyICAnXSwgXy50cmltKTtcbiAqIC8vID0+IFsnZm9vJywgJ2JhciddXG4gKi9cbmZ1bmN0aW9uIHRyaW0oc3RyaW5nLCBjaGFycywgZ3VhcmQpIHtcbiAgdmFyIHZhbHVlID0gc3RyaW5nO1xuICBzdHJpbmcgPSBiYXNlVG9TdHJpbmcoc3RyaW5nKTtcbiAgaWYgKCFzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG4gIGlmIChndWFyZCA/IGlzSXRlcmF0ZWVDYWxsKHZhbHVlLCBjaGFycywgZ3VhcmQpIDogY2hhcnMgPT0gbnVsbCkge1xuICAgIHJldHVybiBzdHJpbmcuc2xpY2UodHJpbW1lZExlZnRJbmRleChzdHJpbmcpLCB0cmltbWVkUmlnaHRJbmRleChzdHJpbmcpICsgMSk7XG4gIH1cbiAgY2hhcnMgPSAoY2hhcnMgKyAnJyk7XG4gIHJldHVybiBzdHJpbmcuc2xpY2UoY2hhcnNMZWZ0SW5kZXgoc3RyaW5nLCBjaGFycyksIGNoYXJzUmlnaHRJbmRleChzdHJpbmcsIGNoYXJzKSArIDEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRyaW07XG4iLCJ2YXIgaXNFcnJvciA9IHJlcXVpcmUoJy4uL2xhbmcvaXNFcnJvcicpLFxuICAgIHJlc3RQYXJhbSA9IHJlcXVpcmUoJy4uL2Z1bmN0aW9uL3Jlc3RQYXJhbScpO1xuXG4vKipcbiAqIEF0dGVtcHRzIHRvIGludm9rZSBgZnVuY2AsIHJldHVybmluZyBlaXRoZXIgdGhlIHJlc3VsdCBvciB0aGUgY2F1Z2h0IGVycm9yXG4gKiBvYmplY3QuIEFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQgdG8gYGZ1bmNgIHdoZW4gaXQncyBpbnZva2VkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0eVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXR0ZW1wdC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBgZnVuY2AgcmVzdWx0IG9yIGVycm9yIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gYXZvaWQgdGhyb3dpbmcgZXJyb3JzIGZvciBpbnZhbGlkIHNlbGVjdG9yc1xuICogdmFyIGVsZW1lbnRzID0gXy5hdHRlbXB0KGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gKiAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAqIH0sICc+Xz4nKTtcbiAqXG4gKiBpZiAoXy5pc0Vycm9yKGVsZW1lbnRzKSkge1xuICogICBlbGVtZW50cyA9IFtdO1xuICogfVxuICovXG52YXIgYXR0ZW1wdCA9IHJlc3RQYXJhbShmdW5jdGlvbihmdW5jLCBhcmdzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcbiAgfSBjYXRjaChlKSB7XG4gICAgcmV0dXJuIGlzRXJyb3IoZSkgPyBlIDogbmV3IEVycm9yKGUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhdHRlbXB0O1xuIiwiLyoqXG4gKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byBpdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdHlcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgQW55IHZhbHVlLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgYHZhbHVlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAqXG4gKiBfLmlkZW50aXR5KG9iamVjdCkgPT09IG9iamVjdDtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5O1xuIiwidmFyIGF1ZGlvRWw7XG52YXIgZGlyID0gJyc7XG52YXIgZm9ybWF0ID0gJ3dhdic7XG52YXIgdm9sdW1lID0gMC41O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRpbml0OiBmdW5jdGlvbihzb3VuZHNEaXIpIHtcblx0XHRhdWRpb0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRhdWRpb0VsLnNldEF0dHJpYnV0ZSgnYXV0b3BsYXknLCB0cnVlKTtcblx0XHRpZihzb3VuZHNEaXIpIGRpciA9IHNvdW5kc0Rpcjtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRwbGF5OiBmdW5jdGlvbihmaWxlbmFtZSwgbG9vcCkge1xuXHRcdGlmKGZpbGVuYW1lKSBhdWRpb0VsLnNyYyA9IChkaXIgKyBmaWxlbmFtZSArICcuJyArIGZvcm1hdCk7XG5cdFx0bG9vcCA/IGF1ZGlvRWwuc2V0QXR0cmlidXRlKCdsb29wJywgdHJ1ZSkgOiBhdWRpb0VsLnJlbW92ZUF0dHJpYnV0ZSgnbG9vcCcpO1xuXHRcdGF1ZGlvRWwudm9sdW1lID0gdm9sdW1lO1xuXHRcdGF1ZGlvRWwucGxheSgpO1xuXHR9LFxuXG5cdHN0b3A6IGZ1bmN0aW9uKCkge1xuXHRcdGF1ZGlvRWwucGF1c2UoKTtcblx0XHRhdWRpb0VsLmN1cnJlbnRUaW1lID0gMDtcblx0fVxuXG59OyIsInZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciByZW1vdGVFdmVudHMgPSBbXTtcbnZhciBsb2NhbEV2ZW50cyA9IFtdO1xudmFyIGluaXRpYXRlZCA9IGZhbHNlO1xudmFyIHNoYXJlZCA9IGZhbHNlO1xudmFyIGN1cnNvciA9IG51bGw7XG52YXIgd2lkZ2V0O1xudmFyIGVudGl0eSA9ICcnO1xudmFyIGVtaXQ7XG52YXIgcGF0aCA9ICcnO1xudmFyIGV2ZW50VGltZXN0YW1wID0gMDtcbi8vIHZhciB1cGRhdGVJbnRlcnZhbCA9IG51bGw7XG4vLyB2YXIgdXBkYXRlSW50ZXJ2YWxWYWx1ZSA9IDUwMDA7XG4vLyB2YXIgdXBkYXRlU3RhdGVJbnRlcnZhbCA9IG51bGw7XG4vLyB2YXIgY2hlY2tFdmVyeSA9IF8uZGVib3VuY2UodW5zaGFyZUJyb3dzZXIsIDMwMDAwKTtcbnZhciBjaGVja0V2ZXJ5ID0gXy5kZWJvdW5jZShlbWl0RXZlbnRzLCAzMDApO1xudmFyIGN1cnNvclggPSAwLCBjdXJzb3JZID0gMDtcbnZhciByZXF1ZXN0QUY7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBpbml0LFxuXHRpc0luaXRpYXRlZDogaXNJbml0aWF0ZWQsXG5cdHNoYXJlOiBzaGFyZUJyb3dzZXIsXG5cdHVuc2hhcmU6IHVuc2hhcmVCcm93c2VyLFxuXHQvLyB1bnNoYXJlQWxsOiB1bnNoYXJlQWxsLFxuXHRlbWl0RXZlbnRzOiBlbWl0RXZlbnRzLFxuXHR1cGRhdGVFdmVudHM6IHVwZGF0ZUV2ZW50c1xufTtcblxuZnVuY3Rpb24gaXNJbml0aWF0ZWQoKSB7XG5cdHJldHVybiBpbml0aWF0ZWQ7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0aW9ucyl7XG5cdGlmKGluaXRpYXRlZCkgcmV0dXJuIGRlYnVnLmluZm8oJ0NvYnJvd3NpbmcgYWxyZWFkeSBpbml0aWF0ZWQnKTtcblxuXHRhZGRFdmVudChkb2N1bWVudCwgJ2tleXVwJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAna2V5ZG93bicsIGV2ZW50c0hhbmRsZXIpO1xuXHRhZGRFdmVudChkb2N1bWVudCwgJ2tleXByZXNzJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAnbW91c2V1cCcsIGV2ZW50c0hhbmRsZXIpO1xuXHRhZGRFdmVudChkb2N1bWVudCwgJ2NsaWNrJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAnY2hhbmdlJywgZXZlbnRzSGFuZGxlcik7XG5cblx0d2lkZ2V0ID0gKHR5cGVvZiBvcHRpb25zLndpZGdldCA9PT0gJ3N0cmluZycpID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLndpZGdldCkgOiBvcHRpb25zLndpZGdldDtcblx0ZW50aXR5ID0gb3B0aW9ucy5lbnRpdHk7XG5cdGVtaXQgPSBvcHRpb25zLmVtaXQ7XG5cdHBhdGggPSBvcHRpb25zLnBhdGg7XG5cblx0aW5pdGlhdGVkID0gdHJ1ZTtcblx0Ly8gdXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChlbWl0RXZlbnRzLCB1cGRhdGVJbnRlcnZhbFZhbHVlKTtcblxuXHRkZWJ1Zy5sb2coJ2NvYnJvd3NpbmcgbW9kdWxlIGluaXRpYXRlZCB3aXRoIHBhcmFtZXRlcnM6ICcsIG9wdGlvbnMpO1xuXHRlbWl0KCdjb2Jyb3dzaW5nL2luaXQnKTtcbn1cblxuZnVuY3Rpb24gc2hhcmVCcm93c2VyKCl7XG4gICAgaWYoc2hhcmVkKSByZXR1cm4gZGVidWcuaW5mbygnQnJvd3NlciBhbHJlYWR5IHNoYXJlZCcpO1xuICAgIGFkZEV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgZXZlbnRzSGFuZGxlcik7XG4gICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzZWxlY3QnLCBldmVudHNIYW5kbGVyKTtcbiAgICBhZGRFdmVudChkb2N1bWVudCwgJ21vdXNlbW92ZScsIGV2ZW50c0hhbmRsZXIpO1xuXG4gICAgLy8gYWRkRXZlbnQoZG9jdW1lbnQsICdtb3VzZW92ZXInLCBldmVudHNIYW5kbGVyKTtcbiAgICAvLyBhZGRFdmVudChkb2N1bWVudCwgJ21vdXNlb3V0JywgZXZlbnRzSGFuZGxlcik7XG4gICAgXG4gICAgY3JlYXRlUmVtb3RlQ3Vyc29yKCk7XG4gICAgXG4gICAgc2hhcmVkID0gdHJ1ZTtcbiAgICAvLyB1cGRhdGVTdGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlU3RhdGUsIHVwZGF0ZUludGVydmFsVmFsdWUpO1xuICAgIC8vIGNsZWFySW50ZXJ2YWwodXBkYXRlSW50ZXJ2YWwpO1xuXG4gICAgZGVidWcubG9nKCdicm93c2VyIHNoYXJlZCcpO1xuICAgIGVtaXQoJ2NvYnJvd3Npbmcvc2hhcmVkJywgeyBlbnRpdHk6IGVudGl0eSB9KTtcbn1cblxuZnVuY3Rpb24gdW5zaGFyZUJyb3dzZXIoKXtcblx0aWYoIXNoYXJlZCkgcmV0dXJuIGRlYnVnLmluZm8oJ0Jyb3dzZXIgYWxyZWFkeSB1bnNoYXJlZCcpO1xuXG4gICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCBldmVudHNIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudChkb2N1bWVudCwgJ3NlbGVjdCcsIGV2ZW50c0hhbmRsZXIpO1xuICAgIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgZXZlbnRzSGFuZGxlcik7XG5cbiAgICAvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ21vdXNlb3ZlcicsIGV2ZW50c0hhbmRsZXIpO1xuICAgIC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2VvdXQnLCBldmVudHNIYW5kbGVyKTtcbiAgICBcbiAgICByZW1vdmVSZW1vdGVDdXJzb3IoKTtcbiAgICBzaGFyZWQgPSBmYWxzZTtcbiAgICAvLyB1cGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGVtaXRFdmVudHMsIHVwZGF0ZUludGVydmFsVmFsdWUpO1xuICAgIC8vIGNsZWFySW50ZXJ2YWwodXBkYXRlU3RhdGVJbnRlcnZhbCk7XG5cblx0ZW1pdCgnY29icm93c2luZy91bnNoYXJlZCcsIHsgZW50aXR5OiBlbnRpdHkgfSk7XG4gICAgZGVidWcubG9nKCdicm93c2VyIHVuc2hhcmVkJyk7XG59XG5cbi8vIGZ1bmN0aW9uIHVuc2hhcmVBbGwoKXtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdrZXl1cCcsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2tleWRvd24nLCBldmVudHNIYW5kbGVyKTtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdrZXlwcmVzcycsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ21vdXNldXAnLCBldmVudHNIYW5kbGVyKTtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdjbGljaycsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2NoYW5nZScsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyBjbGVhckludGVydmFsKHVwZGF0ZUludGVydmFsKTtcbi8vIH1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3RlQ3Vyc29yKCl7XG5cdHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcblx0aWYoIWN1cnNvcikge1xuXHRcdGN1cnNvcj0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0Y3Vyc29yLmNsYXNzTmFtZSA9ICd3Yy1ybXQtcHRyJztcblx0XHRjdXJzb3Iuc2V0QXR0cmlidXRlKCdzcmMnLCBwYXRoKydpbWFnZXMvcG9pbnRlci5wbmcnKTtcblx0XHRjdXJzb3Iuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdGlmKGJvZHkuZmlyc3RDaGlsZCkge1xuXHRcdFx0Ym9keS5pbnNlcnRCZWZvcmUoY3Vyc29yLCBib2R5LmZpcnN0Q2hpbGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRib2R5LmFwcGVuZENoaWxkKGN1cnNvcik7XG5cdFxuXHRcdH1cblx0XHRyZWRyYXdDdXJzb3IoKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWRyYXdDdXJzb3IoKXtcblx0Y3Vyc29yLnN0eWxlLmxlZnQgPSBjdXJzb3JYO1xuXHRjdXJzb3Iuc3R5bGUudG9wID0gY3Vyc29yWTtcblx0cmVxdWVzdEFGID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZWRyYXdDdXJzb3IpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZW1vdGVDdXJzb3IoKXtcblx0aWYoIWN1cnNvcikgcmV0dXJuO1xuXHRjYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QUYpO1xuXHRjdXJzb3IucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJzb3IpO1xuXHRjdXJzb3IgPSBudWxsO1xufVxuXG4vL2Zyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODk3MTU1L2dldC1jdXJzb3ItcG9zaXRpb24taW4tY2hhcmFjdGVycy13aXRoaW4tYS10ZXh0LWlucHV0LWZpZWxkXG5mdW5jdGlvbiBnZXRDYXJldFBvc2l0aW9uIChvRmllbGQpIHtcbiAgLy8gSW5pdGlhbGl6ZVxuXHR2YXIgaUNhcmV0UG9zID0gMDtcblxuICAvLyBJRSBTdXBwb3J0XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuXG4gICAgLy8gU2V0IGZvY3VzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgIG9GaWVsZC5mb2N1cyAoKTtcblxuICAgIC8vIFRvIGdldCBjdXJzb3IgcG9zaXRpb24sIGdldCBlbXB0eSBzZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgdmFyIG9TZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UgKCk7XG5cbiAgICAvLyBNb3ZlIHNlbGVjdGlvbiBzdGFydCB0byAwIHBvc2l0aW9uXG4gICAgICAgIG9TZWwubW92ZVN0YXJ0ICgnY2hhcmFjdGVyJywgLW9GaWVsZC52YWx1ZS5sZW5ndGgpO1xuXG4gICAgLy8gVGhlIGNhcmV0IHBvc2l0aW9uIGlzIHNlbGVjdGlvbiBsZW5ndGhcbiAgICAgICAgaUNhcmV0UG9zID0gb1NlbC50ZXh0Lmxlbmd0aDtcbiAgICB9XG4gICAgZWxzZSBpZihvRmllbGQudHlwZSAmJiAob0ZpZWxkLnR5cGUgPT09ICdlbWFpbCcgfHwgb0ZpZWxkLnR5cGUgPT09ICdudW1iZXInKSl7XG4gICAgICAgIGlDYXJldFBvcyA9IG51bGw7XG4gICAgfVxuICAvLyBGaXJlZm94IHN1cHBvcnRcbiAgICBlbHNlIGlmIChvRmllbGQuc2VsZWN0aW9uU3RhcnQgfHwgb0ZpZWxkLnNlbGVjdGlvblN0YXJ0ID09ICcwJyl7XG4gICAgICAgIGlDYXJldFBvcyA9IG9GaWVsZC5zZWxlY3Rpb25TdGFydDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlDYXJldFBvcyA9IG51bGw7XG4gICAgfVxuXHQvLyBSZXR1cm4gcmVzdWx0c1xuXHRyZXR1cm4gKGlDYXJldFBvcyk7XG59XG5cbmZ1bmN0aW9uIGVtaXRFdmVudHMoKXtcblx0Ly8gaWYoIXNoYXJlZCAmJiAhbG9jYWxFdmVudHMubGVuZ3RoKSByZXR1cm47XG5cdGVtaXQoJ2NvYnJvd3NpbmcvZXZlbnQnLCB7IGVudGl0eTogZW50aXR5LCBldmVudHM6IGxvY2FsRXZlbnRzIH0pO1xuXHRsb2NhbEV2ZW50cyA9IFtdO1xufVxuXG4vLyBmdW5jdGlvbiB1cGRhdGVTdGF0ZSgpe1xuLy8gXHRsb2NhbEV2ZW50cy5wdXNoKHsgc2hhcmVkOiB0cnVlLCBlbnRpdHk6IGVudGl0eSB9KTtcbi8vIH1cblxuZnVuY3Rpb24gZXZlbnRzSGFuZGxlcihldnQpe1xuXHR2YXIgZSA9IGV2dCB8fCB3aW5kb3cuZXZlbnQsXG5cdFx0ZXR5cGUgPSBlLnR5cGUsXG5cdFx0dGFyZyA9IGUudGFyZ2V0LFxuXHRcdG5vZGVOYW1lID0gdGFyZy5ub2RlTmFtZSxcblx0XHRkYiA9IGRvY3VtZW50LmJvZHksXG5cdFx0cGFyYW1zID0ge30sXG5cdFx0bm9kZUluZGV4ID0gbnVsbCxcblx0XHRub2RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhcmcubm9kZU5hbWUpLFxuXHRcdHNjcm9sbFRvcCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AsXG5cdFx0c2Nyb2xsTGVmdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCxcblx0XHRpID0gMDtcblxuXHQvLyBpZiB0aGUgdGFyZ2V0IGlzIHRleHQgbm9kZSwgZ2V0IHBhcmVudCBub2RlXG5cdGlmKHRhcmcubm9kZVR5cGUgPT09IDMpIHRhcmcgPSB0YXJnLnBhcmVudE5vZGU7XG5cblx0Ly8gcmV0dXJuIGlmIHRoZSB0YXJnZXQgbm9kZSBpcyB0aGUgZGVzY2VuZGFudCBvZiB3aWRnZXQgZWxlbWVudFxuXHRpZihlbnRpdHkgPT09ICd1c2VyJyAmJiBpc0Rlc2NlbmRhbnQod2lkZ2V0LCB0YXJnKSkgcmV0dXJuO1xuXG5cdGZvcihpPTA7IGkgPCByZW1vdGVFdmVudHMubGVuZ3RoOyBpKyspe1xuXHRcdGlmKHJlbW90ZUV2ZW50c1tpXS5ldmVudCA9PSBldHlwZSl7XG5cdFx0XHRyZW1vdGVFdmVudHMuc3BsaWNlKGksIDEpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdC8vIGdldCB0aGUgaW5kZXggb2YgdGFyZ2V0IG5vZGVcblx0Zm9yKGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKyl7XG5cdFx0aWYobm9kZXNbaV0gPT0gdGFyZykgbm9kZUluZGV4ID0gaTtcblx0fVxuXG5cdC8vIGV2ZW50IHR5cGVcblx0cGFyYW1zLmV2ZW50ID0gZXR5cGU7XG5cdC8vIGVudGl0eVxuXHRwYXJhbXMuZW50aXR5ID0gZW50aXR5O1xuXHQvLyB0YXJnZXQgbm9kZVxuXHRwYXJhbXMudG4gPSBub2RlTmFtZTtcblx0Ly8gaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXG5cdHBhcmFtcy50bmkgPSBub2RlSW5kZXg7XG5cdC8vIGxheW91dCB3aWR0aCBvZiB0aGUgZG9jdW1lbnQuYm9keVxuXHRwYXJhbXMudyA9IGRiLm9mZnNldFdpZHRoO1xuXHQvLyBsYXlvdXQgaGVpZ2h0IG9mIHRoZSBkb2N1bWVudC5ib2R5XG5cdHBhcmFtcy5oID0gZGIub2Zmc2V0SGVpZ2h0O1xuXHRwYXJhbXMuc3ggPSBzY3JvbGxMZWZ0O1xuXHRwYXJhbXMuc3kgPSBzY3JvbGxUb3A7XG5cblx0aWYoZXR5cGUgPT09ICdtb3VzZW1vdmUnIHx8IGV0eXBlID09PSAnbW91c2VvdmVyJyB8fCBldHlwZSA9PT0gJ21vdXNlb3V0Jykge1xuXHRcdHZhciB4ID0gZS5wYWdlWCB8fCBlLmNsaWVudFggKyBzY3JvbGxUb3A7XG5cdFx0dmFyIHkgPSBlLnBhZ2VZIHx8IGUuY2xpZW50WSArIHNjcm9sbExlZnQ7XG5cblx0XHQvLyBjdXJzb3IgaG9yaXNvbnRhbCBwb3N0aW9uXG5cdFx0cGFyYW1zLnggPSB4O1xuXHRcdC8vIGN1cnNvciB2ZXJ0aWNhbCBwb3NpdGlvblxuXHRcdHBhcmFtcy55ID0geTtcblxuXHRcdC8vIGZvcihpPTA7IGkgPCBsb2NhbEV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdC8vIFx0aWYobG9jYWxFdmVudHNbaV0uaW5kZXhPZihldHlwZSkgIT0gLTEpIHtcblx0XHQvLyBcdFx0bG9jYWxFdmVudHMuc3BsaWNlKGksIDEpO1xuXHRcdC8vIFx0XHRicmVhaztcblx0XHQvLyBcdH1cblx0XHQvLyB9XG5cdH0gZWxzZSBpZihldHlwZSA9PT0gJ3Njcm9sbCcpIHtcblx0XHQvLyBmb3IoaT0wOyBpIDwgbG9jYWxFdmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdGlmKGxvY2FsRXZlbnRzW2ldLmluZGV4T2YoJ3Njcm9sbCcpICE9IC0xKSB7XG5cdFx0Ly8gXHRcdGxvY2FsRXZlbnRzLnNwbGljZShpLCAxKTtcblx0XHQvLyBcdFx0YnJlYWs7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gfVxuXHRcdFxuXHRcdC8vIHZhciBzdCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuXHRcdC8vIHZhciBzbCA9IHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ2tleXVwJyB8fCBldHlwZSA9PSAna2V5ZG93bicgfHwgZXR5cGUgPT0gJ2tleXByZXNzJykge1xuXHRcdHZhciBjb2RlID0gZS5jaGFyQ29kZSB8fCBlLmtleUNvZGUgfHwgZS53aGljaDtcblx0XHR2YXIgYyA9IGdldENhcmV0UG9zaXRpb24odGFyZyk7XG5cblx0XHRpZihub2RlTmFtZSA9PT0gJ0lOUFVUJyAmJiB0YXJnLnR5cGUgPT09ICdwYXNzd29yZCcpIHJldHVybjtcblxuXHRcdGlmKGV0eXBlID09ICdrZXl1cCcpIHtcblx0XHRcdGlmKChjID09PSBudWxsKSB8fCAoY29kZSA9PSA4NiAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkpKSB7XG5cdFx0XHRcdHZhciB0dmFsdWUgPSB0YXJnLnZhbHVlO1xuXHRcdFx0XHRpZih0dmFsdWUpIHtcblx0XHRcdFx0XHR0dmFsdWUgPSB0dmFsdWUucmVwbGFjZSgvXFxuL2csICc8YnI+Jyk7XG5cdFx0XHRcdFx0Ly8gdGhlIHZhbHVlIGF0dHJpYnV0ZSBvZiB0aGUgdGFyZ2V0IG5vZGUsIGlmIGV4aXN0c1xuXHRcdFx0XHRcdHBhcmFtcy52YWx1ZSA9IHR2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZihldHlwZSA9PSAna2V5ZG93bicpIHtcblx0XHRcdGlmKGMgIT09IG51bGwgJiYgKGNvZGUgPT0gOCB8fCBjb2RlID09IDQ2IHx8IGNvZGUgPT0gMTkwKSkge1xuXHRcdFx0XHRpZighdGFyZy52YWx1ZSkgcmV0dXJuO1xuXHRcdFx0XHQvLyBjYXJldCBwb3NpdGlvblxuXHRcdFx0XHRwYXJhbXMucG9zID0gYztcblx0XHRcdFx0Ly8gY2hhciBjb2RlXG5cdFx0XHRcdHBhcmFtcy5jb2RlID0gY29kZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYoZXR5cGUgPT09ICdrZXlwcmVzcycpIHtcblx0XHRcdGlmKGMgIT09IG51bGwgJiYgY29kZSAhPSA4ICYmIGNvZGUgIT0gNDYpIHtcblx0XHRcdFx0Ly8gY2FyZXQgcG9zaXRpb25cblx0XHRcdFx0cGFyYW1zLnBvcyA9IGM7XG5cdFx0XHRcdC8vIGNoYXIgY29kZVxuXHRcdFx0XHRwYXJhbXMuY29kZSA9IGNvZGU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYoZXR5cGUgPT09ICdjaGFuZ2UnKSB7XG5cdFx0aWYobm9kZU5hbWUgPT09ICdJTlBVVCcgJiYgdGFyZy50eXBlID09PSAncGFzc3dvcmQnKSByZXR1cm47XG5cdFx0cGFyYW1zLnZhbHVlID0gdGFyZy52YWx1ZTtcblxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ21vdXNldXAnIHx8IGV0eXBlID09ICdzZWxlY3QnKXtcblx0XHR2YXIgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpIHx8IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpLnRleHQsXG5cdFx0XHRzbyA9IHNlbGVjdGlvbi5hbmNob3JPZmZzZXQsXG5cdFx0XHRlbyA9IHNlbGVjdGlvbi5mb2N1c09mZnNldCxcblx0XHRcdGFuY2hvclBhcmVudE5vZGVJbmRleCA9IDAsXG5cdFx0XHRhbmNob3JQYXJlbnROb2RlTmFtZSA9ICcnLFxuXHRcdFx0YW5jaG9yTm9kZUluZGV4ID0gMCxcblx0XHRcdGFuY2hvclBhcmVudCA9ICcnLFxuXHRcdFx0Zm9jdXNQYXJlbnROb2RlSW5kZXggPSAwLFxuXHRcdFx0Zm9jdXNQYXJlbnROb2RlTmFtZSA9ICcnLFxuXHRcdFx0Zm9jdXNOb2RlSW5kZXggPSAwLFxuXHRcdFx0Zm9jdXNQYXJlbnQgPSAnJyxcblx0XHRcdHJldmVyc2UgPSBmYWxzZTtcblxuXHRcdGlmKHNlbGVjdGlvbi5hbmNob3JOb2RlICE9PSBudWxsKSB7XG5cdFx0XHRhbmNob3JQYXJlbnQgPSBzZWxlY3Rpb24uYW5jaG9yTm9kZS5wYXJlbnROb2RlO1xuXG5cdFx0XHRmb3IoaT0wOyBpPGFuY2hvclBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0aWYoYW5jaG9yUGFyZW50LmNoaWxkTm9kZXNbaV0gPT0gc2VsZWN0aW9uLmFuY2hvck5vZGUpIGFuY2hvck5vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGFuY2hvclBhcmVudE5vZGVOYW1lID0gYW5jaG9yUGFyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRub2RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGFuY2hvclBhcmVudE5vZGVOYW1lKTtcblx0XHRcdGZvcihpPTA7aTxub2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKG5vZGVzW2ldID09PSBhbmNob3JQYXJlbnQpIGFuY2hvclBhcmVudE5vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZvY3VzUGFyZW50ID0gc2VsZWN0aW9uLmZvY3VzTm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0Zm9yKGk9MDsgaTxmb2N1c1BhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0aWYoZm9jdXNQYXJlbnQuY2hpbGROb2Rlc1tpXSA9PSBzZWxlY3Rpb24uZm9jdXNOb2RlKSBmb2N1c05vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZvY3VzUGFyZW50Tm9kZU5hbWUgPSBmb2N1c1BhcmVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0bm9kZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShmb2N1c1BhcmVudE5vZGVOYW1lKTtcblx0XHRcdGZvcihpPTA7aTxub2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKG5vZGVzW2ldID09PSBmb2N1c1BhcmVudCkgZm9jdXNQYXJlbnROb2RlSW5kZXggPSBpO1xuXHRcdFx0fVxuXHRcdFx0XG5cblx0XHRcdGlmKGFuY2hvclBhcmVudE5vZGVOYW1lID09PSBmb2N1c1BhcmVudE5vZGVOYW1lICYmXG5cdFx0XHRcdGFuY2hvclBhcmVudE5vZGVJbmRleCA9PT0gZm9jdXNQYXJlbnROb2RlSW5kZXggJiZcblx0XHRcdFx0XHRhbmNob3JOb2RlSW5kZXggPT09IGZvY3VzTm9kZUluZGV4ICYmXG5cdFx0XHRcdFx0XHRzbyA+IGVvKVxuXHRcdFx0XHRcdFx0XHRyZXZlcnNlID0gdHJ1ZTtcblxuXHRcdFx0Ly8gbmFtZSBvZiB0aGUgdGFyZ2V0IG5vZGUgd2hlcmUgc2VsZWN0aW9uIHN0YXJ0ZWRcblx0XHRcdHBhcmFtcy5zbiA9IGFuY2hvclBhcmVudE5vZGVOYW1lO1xuXHRcdFx0cGFyYW1zLnNuaSA9IGFuY2hvclBhcmVudE5vZGVJbmRleDtcblx0XHRcdHBhcmFtcy5zY2hpID0gYW5jaG9yTm9kZUluZGV4O1xuXHRcdFx0Ly8gbmFtZSBvZiB0aGUgdGFyZ2V0IG5vZGUgd2hlcmUgc2VsZWN0aW9uIGVuZGVkXG5cdFx0XHRwYXJhbXMuZW4gPSBmb2N1c1BhcmVudE5vZGVOYW1lO1xuXHRcdFx0cGFyYW1zLmVuaSA9IGZvY3VzUGFyZW50Tm9kZUluZGV4O1xuXHRcdFx0cGFyYW1zLmVjaGkgPSBmb2N1c05vZGVJbmRleDtcblx0XHRcdHBhcmFtcy5zbyA9IHJldmVyc2UgPyBlbyA6IHNvO1xuXHRcdFx0cGFyYW1zLmVvID0gcmV2ZXJzZSA/IHNvIDogZW87XG5cdFx0fVxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ2NsaWNrJykge1xuXHRcdHBhcmFtcy5zY3ggPSBlLnNjcmVlblg7XG5cdFx0cGFyYW1zLnNjeSA9IGUuc2NyZWVuWTtcblx0fVxuXG5cdC8vIGRlYnVnLmxvZygnZXZlbnRzSGFuZGxlcjogJywgcGFyYW1zKTtcblx0bG9jYWxFdmVudHMucHVzaChwYXJhbXMpO1xuXHRlbWl0RXZlbnRzKCk7XG5cdC8vIGNoZWNrRXZlcnkoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRXZlbnRzKHJlc3VsdCl7XG5cdHZhciBtYWluRWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblx0XHR0YXJnZXQsXG5cdFx0ZXZ0ID0ge307XG5cblx0aWYocmVzdWx0LmV2ZW50cyAmJiByZXN1bHQuZXZlbnRzLmxlbmd0aCkge1xuXG5cdFx0Ly8gY2hlY2sgZm9yIHNjcm9sbFRvcC9MZWZ0LiBcblx0XHQvLyBJRSBhbmQgRmlyZWZveCBhbHdheXMgcmV0dXJuIDAgZnJvbSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcC9MZWZ0LCBcblx0XHQvLyB3aGlsZSBvdGhlciBicm93c2VycyByZXR1cm4gMCBmcm9tIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuXHRcdC8vIG1haW5FbGVtZW50ID0gKCdBY3RpdmVYT2JqZWN0JyBpbiB3aW5kb3cgfHwgdHlwZW9mIEluc3RhbGxUcmlnZ2VyICE9PSAndW5kZWZpbmVkJykgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBkb2N1bWVudC5ib2R5O1xuXG5cdFx0Zm9yKHZhciBpPTA7IGk8cmVzdWx0LmV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZXZ0ID0gcmVzdWx0LmV2ZW50c1tpXTtcblxuXHRcdFx0Ly8gaWYoZXZ0LnNoYXJlZCAhPT0gdW5kZWZpbmVkKSBkZWJ1Zy5sb2coJ3NoYXJlZCBldmVudHMnLCBldmVudFRpbWVzdGFtcCwgZXZ0LCByZXN1bHQuaW5pdCk7XG5cdFx0XHRpZihldnQudGltZXN0YW1wIDwgZXZlbnRUaW1lc3RhbXApIGNvbnRpbnVlO1xuXHRcdFx0aWYoZXZ0LmVudGl0eSA9PT0gZW50aXR5KSBjb250aW51ZTtcblx0XHRcdFx0XHRcblx0XHRcdC8vIGlmKGV2dC5zaGFyZWQgIT09IHVuZGVmaW5lZCl7XG5cdFx0XHQvLyBcdGlmKGV2dC5zaGFyZWQpe1xuXHRcdFx0Ly8gXHRcdGNoZWNrRXZlcnkoKTtcblx0XHRcdC8vIFx0XHRzaGFyZUJyb3dzZXIoKTtcblx0XHRcdC8vIFx0fSBlbHNlIHtcblx0XHRcdC8vIFx0XHRpZighcmVzdWx0Lmhpc3RvcnlFdmVudHMpIHVuc2hhcmVCcm93c2VyKCk7XG5cdFx0XHQvLyBcdH1cblx0XHRcdC8vIH1cblx0XHRcdGlmKGV2dC51cmwpIHtcblx0XHRcdFx0Ly8gaWYoIXJlc3VsdC5oaXN0b3J5RXZlbnRzKSB7XG5cdFx0XHRcdFx0dmFyIHVybCA9IGV2dC51cmw7XG5cdFx0XHRcdFx0dmFyIGRvY1VybCA9IGRvY3VtZW50LlVSTDtcblx0XHRcdFx0XHRpZihkb2NVcmwuaW5kZXhPZignY2hhdFNlc3Npb25JZCcpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0ZG9jVXJsID0gZG9jVXJsLnN1YnN0cigwLCBkb2NVcmwuaW5kZXhPZignY2hhdFNlc3Npb25JZCcpLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZih1cmwgIT0gZG9jVXJsKSBjaGFuZ2VVUkwodXJsKTtcblx0XHRcdFx0Ly8gfVxuXHRcdFx0fVxuXHRcdFx0aWYoZXZ0Lncpe1xuXHRcdFx0XHRpZihldnQuZW50aXR5ID09PSAndXNlcicpIHtcblx0XHRcdFx0XHR2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cdFx0XHRcdFx0dmFyIGlubmVyVyA9IGJvZHkub2Zmc2V0V2lkdGg7XG5cdFx0XHRcdFx0aWYoaW5uZXJXICE9PSBldnQudykge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IGV2dC53ICsgJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGV2dC5ldmVudCA9PT0gJ21vdXNlbW92ZScpIHtcblx0XHRcdFx0aWYoY3Vyc29yKSB7XG5cdFx0XHRcdFx0Y3Vyc29yWCA9IGV2dC54ICsgJ3B4Jztcblx0XHRcdFx0XHRjdXJzb3JZID0gZXZ0LnkgKyAncHgnO1xuXHRcdFx0XHRcdC8vIGN1cnNvci5zdHlsZS5sZWZ0ID0gZXZ0LnggKyAncHgnO1xuXHRcdFx0XHRcdC8vIGN1cnNvci5zdHlsZS50b3AgPSBldnQueSArICdweCc7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihldnQuZXZlbnQgPT09ICdzY3JvbGwnKSB7XG5cdFx0XHRcdGlmKGV2dC50biAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0aWYoZXZ0LnRuID09PSAnI2RvY3VtZW50JykgdGFyZ2V0ID0gbWFpbkVsZW1lbnQ7XG5cdFx0XHRcdFx0ZWxzZSB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHRcdGlmKHRhcmdldCl7XG5cdFx0XHRcdFx0XHR0YXJnZXQuc2Nyb2xsVG9wID0gZXZ0LnN5O1xuXHRcdFx0XHRcdFx0dGFyZ2V0LnNjcm9sbExlZnQgPSBldnQuc3g7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Njcm9sbCBldmVudDogJywgdGFyZ2V0LCBldnQuc3kpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoZXZ0LmV2ZW50ID09PSAnbW91c2V1cCcgfHwgZXZ0LmV2ZW50ID09PSAnc2VsZWN0Jyl7XG5cdFx0XHRcdGlmKGV2dC5zbikge1xuXHRcdFx0XHRcdHZhciBzdGFydE5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQuc24pW2V2dC5zbmldO1xuXHRcdFx0XHRcdHZhciBlbmROb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LmVuKVtldnQuZW5pXTtcblx0XHRcdFx0XHRpZihkb2N1bWVudC5jcmVhdGVSYW5nZSAmJiBzdGFydE5vZGUgIT09IHVuZGVmaW5lZCAmJiBlbmROb2RlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdHZhciBybmcgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuXHRcdFx0XHRcdFx0cm5nLnNldFN0YXJ0KHN0YXJ0Tm9kZS5jaGlsZE5vZGVzW2V2dC5zY2hpXSwgZXZ0LnNvKTtcblx0XHRcdFx0XHRcdHJuZy5zZXRFbmQoZW5kTm9kZS5jaGlsZE5vZGVzW2V2dC5lY2hpXSwgZXZ0LmVvKTtcblx0XHRcdFx0XHRcdHZhciBzZWwgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRcdFx0XHRzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cdFx0XHRcdFx0XHRzZWwuYWRkUmFuZ2Uocm5nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihldnQuZXZlbnQgPT09ICdrZXl1cCcgfHwgZXZ0LmV2ZW50ID09PSAna2V5ZG93bicgfHwgZXZ0LmV2ZW50ID09PSAna2V5cHJlc3MnKSB7XG5cdFx0XHRcdGlmKGV2dC50biAhPT0gdW5kZWZpbmVkICYmIGV2dC50bmkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bilbZXZ0LnRuaV07XG5cdFx0XHRcdFx0aWYodGFyZ2V0KXtcblx0XHRcdFx0XHRcdHZhciBvdXRwdXQ7XG5cdFx0XHRcdFx0XHR2YXIgYSA9IHRhcmdldC52YWx1ZTtcblx0XHRcdFx0XHRcdGlmKGV2dC5jb2RlID09IDgpIHtcblx0XHRcdFx0XHRcdFx0aWYoZXZ0LnBvcyA9PSBhLmxlbmd0aC0xKSBvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zLTEpO1xuXHRcdFx0XHRcdFx0XHRlbHNlIGlmKGV2dC5wb3MgPT09IDApIHJldHVybjtcblx0XHRcdFx0XHRcdFx0ZWxzZSBvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zLTEpICsgYS5zdWJzdHIoZXZ0LnBvcyk7XG5cdFx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IG91dHB1dDtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihldnQuY29kZSA9PSA0Nikge1xuXHRcdFx0XHRcdFx0XHRvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zKSArIGEuc3Vic3RyKGV2dC5wb3MrMSk7XG5cdFx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IG91dHB1dDtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihldnQuY29kZSA9PSAxOTApIHtcblx0XHRcdFx0XHRcdFx0b3V0cHV0ID0gYS5zdWJzdHIoMCwgZXZ0LnBvcykgKyAnLicgKyBhLnN1YnN0cihldnQucG9zKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGV2dC52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdHZhciB0dmFsdWUgPSBldnQudmFsdWU7XG5cdFx0XHRcdFx0XHRcdHR2YWx1ZSA9IHR2YWx1ZS5yZXBsYWNlKC88YnI+L2csICdcXG4nKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gdHZhbHVlO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dmFyIGMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2dC5jb2RlKTtcblx0XHRcdFx0XHRcdFx0aWYoYSkgb3V0cHV0ID0gYS5zdWJzdHIoMCwgZXZ0LnBvcykgKyBjICsgYS5zdWJzdHIoZXZ0LnBvcyk7XG5cdFx0XHRcdFx0XHRcdGVsc2Ugb3V0cHV0ID0gYztcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ2NoYW5nZScpIHtcblx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuKVtldnQudG5pXTtcblx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gZXZ0LnZhbHVlO1xuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ2NsaWNrJyl7XG5cdFx0XHRcdC8vIHZhciBlbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bi50b0xvd2VyQ2FzZSgpKTtcblx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuKVtldnQudG5pXTtcblx0XHRcdFx0aWYodGFyZ2V0KSB0YXJnZXQuY2xpY2soKTtcblx0XHRcdFx0Ly8gZWxlbWVudHNbZXZ0LnRuaV0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3llbGxvdyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHRpZih0YXJnZXQpIHtcblx0XHRcdFx0XHR2YXIgZXZ0T3B0cyA9IG1vdXNlRXZlbnQoZXZ0LmV2ZW50LCBldnQueCwgZXZ0LnksIGV2dC54LCBldnQueSk7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hFdmVudCh0YXJnZXQsIGV2dE9wdHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKGV2dC5ldmVudCA9PT0gJ2NsaWNrJyB8fCBldnQuZXZlbnQgPT09ICdzY3JvbGwnKSByZW1vdGVFdmVudHMucHVzaChldnQpO1xuXHRcdH1cblx0fVxuXG5cdGlmKHJlc3VsdC50aW1lc3RhbXApIGV2ZW50VGltZXN0YW1wID0gcmVzdWx0LnRpbWVzdGFtcDtcblx0Ly8gaWYoc2hhcmVkKSBlbWl0RXZlbnRzKCk7XG59XG5cbmZ1bmN0aW9uIG1vdXNlRXZlbnQodHlwZSwgc3gsIHN5LCBjeCwgY3kpIHtcblx0dmFyIGV2dDtcblx0dmFyIGUgPSB7XG5cdFx0YnViYmxlczogdHJ1ZSxcblx0XHRjYW5jZWxhYmxlOiAodHlwZSAhPSBcIm1vdXNlbW92ZVwiKSxcblx0XHR2aWV3OiB3aW5kb3csXG5cdFx0ZGV0YWlsOiAwLFxuXHRcdHNjcmVlblg6IHN4LFxuXHRcdHNjcmVlblk6IHN5LFxuXHRcdGNsaWVudFg6IGN4LFxuXHRcdGNsaWVudFk6IGN5LFxuXHRcdGN0cmxLZXk6IGZhbHNlLFxuXHRcdGFsdEtleTogZmFsc2UsXG5cdFx0c2hpZnRLZXk6IGZhbHNlLFxuXHRcdG1ldGFLZXk6IGZhbHNlLFxuXHRcdGJ1dHRvbjogMCxcblx0XHRyZWxhdGVkVGFyZ2V0OiB1bmRlZmluZWRcblx0fTtcblx0aWYgKHR5cGVvZiggZG9jdW1lbnQuY3JlYXRlRXZlbnQgKSA9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuXHRcdGV2dC5pbml0TW91c2VFdmVudChcblx0XHRcdHR5cGUsXG5cdFx0XHRlLmJ1YmJsZXMsXG5cdFx0XHRlLmNhbmNlbGFibGUsXG5cdFx0XHRlLnZpZXcsXG5cdFx0XHRlLmRldGFpbCxcblx0XHRcdGUuc2NyZWVuWCxcblx0XHRcdGUuc2NyZWVuWSxcblx0XHRcdGUuY2xpZW50WCxcblx0XHRcdGUuY2xpZW50WSxcblx0XHRcdGUuY3RybEtleSxcblx0XHRcdGUuYWx0S2V5LFxuXHRcdFx0ZS5zaGlmdEtleSxcblx0XHRcdGUubWV0YUtleSxcblx0XHRcdGUuYnV0dG9uLFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlXG5cdFx0KTtcblx0fSBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuXHRcdGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBlKSB7XG5cdFx0XHRldnRbcHJvcF0gPSBlW3Byb3BdO1xuXHRcdH1cblx0XHRldnQuYnV0dG9uID0geyAwOjEsIDE6NCwgMjoyIH1bZXZ0LmJ1dHRvbl0gfHwgZXZ0LmJ1dHRvbjtcblx0fVxuXHRyZXR1cm4gZXZ0O1xufVxuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudCAoZWwsIGV2dCkge1xuXHRpZiAoZWwuZGlzcGF0Y2hFdmVudCkge1xuXHRcdGVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblx0fSBlbHNlIGlmIChlbC5maXJlRXZlbnQpIHtcblx0XHRlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGV2dCk7XG5cdH1cblx0cmV0dXJuIGV2dDtcbn1cblxuZnVuY3Rpb24gY2hhbmdlVVJMKHVybCkge1xuICAgIHZhciBkb2NVcmwgPSBkb2N1bWVudC5VUkw7XG4gICAgaWYgKGRvY1VybCAhPT0gdXJsKSB7XG5cdFx0ZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRGVzY2VuZGFudChwYXJlbnQsIGNoaWxkKSB7XG4gICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgIH1cbiAgICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudChvYmosIGV2VHlwZSwgZm4pIHtcbiAgaWYgKG9iai5hZGRFdmVudExpc3RlbmVyKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihldlR5cGUsIGZuLCBmYWxzZSk7XG4gIGVsc2UgaWYgKG9iai5hdHRhY2hFdmVudCkgb2JqLmF0dGFjaEV2ZW50KFwib25cIitldlR5cGUsIGZuKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmRldGFjaEV2ZW50KSBvYmouZGV0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufSIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbi8vIHZhciB3ZWJzb2NrZXRzID0gcmVxdWlyZSgnLi93ZWJzb2NrZXRzJyk7XG4vLyB2YXIgdXJsID0gcmVxdWlyZSgndXJsJykucGFyc2UoZG9jdW1lbnQuVVJMLCB0cnVlKTtcbnZhciB1cmwgPSBnbG9iYWwubG9jYXRpb247XG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xudmFyIHdlYnNvY2tldFRyeSA9IDE7XG52YXIgcG9sbFR1cm5zID0gMTtcbnZhciBtYWluQWRkcmVzcyA9IFwibWFpbi5yaW5nb3RlbC5uZXQvY2hhdGJvdC9XZWJDaGF0L1wiO1xudmFyIHB1YmxpY1VybCA9IFwiaHR0cHM6Ly9tYWluLnJpbmdvdGVsLm5ldC9wdWJsaWMvXCI7XG52YXIgd2Vic29ja2V0VXJsID0gXCJcIjtcbnZhciBtb2R1bGVJbml0ID0gZmFsc2U7XG5cbi8qKlxuICogQ29yZSBtb2R1bGUgaW1wbGVtZW50cyBtYWluIGludGVybmFsIGZ1bmN0aW9uYWxpdHlcbiAqIFxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEluc3RhbnRpYXRpb24gb3B0aW9ucyB0aGF0IG92ZXJyaWRlcyBtb2R1bGUgZGVmYXVsdHNcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICBSZXR1cm4gcHVibGljIEFQSVxuICovXG5cbnZhciBkZWZhdWx0cyA9IHtcblx0Ly8gSVBDQyBzZXJ2ZXIgSVAgYWRkcmVzcy9kb21haW4gbmFtZSBhbmQgcG9ydCBudW1iZXIuXG5cdC8vIGV4LjogXCJodHRwOi8vMTkyLjE2OC4xLjEwMDo4ODgwXCJcblx0c2VydmVyOiAnJ1xufTtcblxuaW5oZXJpdHMoV2NoYXRBUEksIEV2ZW50RW1pdHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gV2NoYXRBUEk7XG5cbmZ1bmN0aW9uIFdjaGF0QVBJKG9wdGlvbnMpe1xuXG5cdC8vIGV4dGVuZCBkZWZhdWx0IG9wdGlvbnNcblx0Ly8gd2l0aCBwcm92aWRlZCBvYmplY3Rcblx0dGhpcy5vcHRpb25zID0gXy5hc3NpZ24oZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXHR0aGlzLm9wdGlvbnMuc2VydmVyVXJsID0gdGhpcy5vcHRpb25zLnNlcnZlciArICcvaXBjYy8kJCQnO1xuXHR0aGlzLnNlc3Npb24gPSB7fTtcblxuXHRpZighdGhpcy5vcHRpb25zLnBhZ2VpZCkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0Nhbm5vdCBpbml0aWF0ZSBtb2R1bGU6IHBhZ2VpZCBpcyB1bmRlZmluZWQnKTtcblxuXHR3ZWJzb2NrZXRVcmwgPSBtYWluQWRkcmVzcyt0aGlzLm9wdGlvbnMucGFnZWlkO1xuXG5cdHRoaXMuY3JlYXRlV2Vic29ja2V0KCk7XG5cblx0dGhpcy5vbignc2Vzc2lvbi9jcmVhdGUnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dGhpcy5zZXNzaW9uID0gZGF0YTtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2lkJywgZGF0YS5zaWQpO1xuXHR9LmJpbmQodGhpcykpO1xuXHR0aGlzLm9uKCdjaGF0L2Nsb3NlJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjaGF0JywgZmFsc2UpO1xuXHR9KTtcblx0dGhpcy5vbignRXJyb3InLCB0aGlzLm9uRXJyb3IpO1xuXG5cdHJldHVybiB0aGlzO1xuXG59XG5cbldjaGF0QVBJLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24oZXJyKXtcblx0ZGVidWcuZXJyb3IoZXJyKTtcblx0aWYoZXJyLmNvZGUgPT09IDQwNCkge1xuXHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi90aW1lb3V0Jyk7XG5cdH1cbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5zZW5kRGF0YSA9IGZ1bmN0aW9uKGRhdGEpe1xuXHRpZih0aGlzLndlYnNvY2tldCkgdGhpcy53ZWJzb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59O1xuXG4vKipcbiAqIFdlYnNvY2tldCBtZXNzYWdlcyBoYW5kbGVyXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5vbldlYnNvY2tldE1lc3NhZ2UgPSBmdW5jdGlvbihlKXtcblx0Ly8gdGhpcy5lbWl0KCd3ZWJzb2NrZXQvbWVzc2FnZScsIChlLmRhdGEgPyBKU09OLnBhcnNlKGUuZGF0YSkgOiB7fSkpO1xuXHR2YXIgZGF0YSA9IEpTT04ucGFyc2UoZS5kYXRhKSxcblx0ICAgIG1ldGhvZCA9IGRhdGEubWV0aG9kO1xuXG5cdGRlYnVnLmxvZygnb25XZWJzb2NrZXRNZXNzYWdlOiAnLCBkYXRhKTtcblx0XG5cdGlmKGRhdGEubWV0aG9kKSB7XG5cdFx0aWYoZGF0YS5tZXRob2QgPT09ICdzZXNzaW9uJykge1xuXHRcdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2NyZWF0ZScsIGRhdGEucGFyYW1zKTtcblxuXHRcdH0gZWxzZSBpZihkYXRhLm1ldGhvZCA9PT0gJ21lc3NhZ2VzJykge1xuXHRcdFx0aWYoZGF0YS5wYXJhbXMubGlzdCkge1xuXHRcdFx0XHRkYXRhLnBhcmFtcy5saXN0Lm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdFx0dGhpcy5lbWl0KCdtZXNzYWdlL25ldycsIGl0ZW0pO1xuXHRcdFx0XHRcdHJldHVybiBpdGVtO1xuXHRcdFx0XHR9LmJpbmQodGhpcykpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZihkYXRhLm1ldGhvZCA9PT0gJ21lc3NhZ2UnKSB7XG5cdFx0XHRpZihkYXRhLnBhcmFtcy50eXBpbmcpIHtcblx0XHRcdFx0dGhpcy5lbWl0KCdtZXNzYWdlL3R5cGluZycpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5lbWl0KCdtZXNzYWdlL25ldycsIGRhdGEucGFyYW1zKTtcblx0XHRcdH1cdFx0XG5cdFx0fSBlbHNlIGlmKGRhdGEubWV0aG9kID09PSAnb3BlblNoYXJlJykgeyAvLyBpbml0IHVzZXJzIHNoYXJlIHN0YXRlXG5cdFx0XHRpZihkYXRhLnBhcmFtcy5pZCkge1xuXHRcdFx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkSWQnLCBkYXRhLnBhcmFtcy5pZCwgJ2NhY2hlJyk7XG5cdFx0XHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9qb2luJywgeyB1cmw6IHVybC5ocmVmIH0pO1xuXHRcdFx0XHR0aGlzLnNoYXJlT3BlbmVkKGRhdGEucGFyYW1zLmlkLCB1cmwuaHJlZik7IC8vIHNlbmQgY29uZmlybWF0aW9uIHRvIGFnZW50XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmKGRhdGEubWV0aG9kID09PSAnc2hhcmVPcGVuZWQnKSB7IC8vIGluaXQgYWdlbnQgc2hhcmUgc3RhdGVcblx0XHRcdGlmKGRhdGEucGFyYW1zLmlkKSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwodGhpcy5vcGVuU2hhcmVJbnRldmFsKTtcblx0XHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ3NoYXJlZElkJywgZGF0YS5wYXJhbXMuaWQsICdjYWNoZScpO1xuXHRcdFx0XHR0aGlzLmVtaXQoJ3Nlc3Npb24vam9pbicsIHsgdXJsOiB1cmwuaHJlZiB9KTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdzaGFyZUNsb3NlZCcpIHsgLy8gaW5pdCBhZ2VudCBzaGFyZSBzdGF0ZVxuXHRcdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2Rpc2pvaW4nKTtcblxuXHRcdH0gZWxzZSBpZihkYXRhLm1ldGhvZCA9PT0gJ2V2ZW50cycpIHtcblx0XHRcdHRoaXMuZW1pdCgnY29icm93c2luZy91cGRhdGUnLCB7IGV2ZW50czogZGF0YS5wYXJhbXMuZXZlbnRzIH0pO1xuXHRcdH1cblx0fVxufTtcblxuLyoqXG4gKiBNb2R1bGUgaW5pdGlhdGlvblxuICogRW1pdHMgbW9kdWxlL3N0YXJ0IGV2ZW50IGlmIG1vZHVsZSBzdGFydGVkXG4gKi9cbi8vIFdjaGF0QVBJLnByb3RvdHlwZS5pbml0TW9kdWxlID0gZnVuY3Rpb24oKXtcblxuXHQvLyBfLnBvbGwoZnVuY3Rpb24oKXtcblx0Ly8gXHRyZXR1cm4gKHdlYnNvY2tldEluaXQgPT09IHRydWUpO1xuXHQvLyB9LCBmdW5jdGlvbigpIHtcblx0Ly8gXHRkZWJ1Zy5sb2coJ0lOSVQnKTtcblx0Ly8gXHR0aGlzLmluaXQoKTtcblx0Ly8gfS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpe1xuXHQvLyBcdGlmKHBvbGxUdXJucyA8IDIpIHtcblx0Ly8gXHRcdHBvbGxUdXJucysrO1xuXHQvLyBcdH0gZWxzZSB7XG5cdC8vIFx0XHRyZXR1cm4gdGhpcy5lbWl0KCdFcnJvcicsICdNb2R1bGUgd2FzblxcJ3QgaW5pdGlhdGVkIGR1ZSB0byBuZXR3b3JrIGVycm9yJyk7XG5cdC8vIFx0fVxuXHQvLyB9LmJpbmQodGhpcyksIDYwMDAwKTtcbi8vIH07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKXtcblx0bW9kdWxlSW5pdCA9IHRydWU7XG5cblx0dmFyIGVudGl0eSA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2VudGl0eScsICdzZXNzaW9uJyksXG5cdFx0c2lkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyk7XG5cblx0ZGVidWcubG9nKCdpbml0TW9kdWxlOiAnLCBlbnRpdHksIHNpZCk7XG5cblx0Ly8gQSBjaGF0U2Vzc2lvbklkIHBhcmFtZXRlciBpbiB0aGUgdXJsIHF1ZXJ5IFxuXHQvLyBpbmRpY2F0ZXMgdGhhdCB0aGUgd2ViIHBhZ2Ugd2FzIG9wZW5lZCBieSBhZ2VudC5cblx0Ly8gSW4gdGhhdCBjYXNlIGFnZW50IHNob3VsZCBqb2luIHRoZSBzZXNzaW9uLlxuXHRpZih1cmwuaHJlZi5pbmRleE9mKCdjaGF0U2Vzc2lvbklkJykgIT09IC0xKSB7XG5cdFx0c2lkID0gdGhpcy5nZXRTaWRGcm9tVXJsKHVybC5ocmVmKTtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnZW50aXR5JywgJ2FnZW50JywgJ3Nlc3Npb24nKTtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2lkJywgc2lkLCAnc2Vzc2lvbicpO1xuXHRcdHRoaXMuc2Vzc2lvbi5zaWQgPSBzaWQ7XG5cdFx0dGhpcy5qb2luU2Vzc2lvbih1cmwuaHJlZik7XG5cblx0fSBlbHNlIGlmKGVudGl0eSA9PT0gJ2FnZW50JykgeyAvLyBJbiBjYXNlIHRoZSBjb2Jyb3dzaW5nIHNlc3Npb24gaXMgYWN0aXZlXG5cdFx0c2lkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJywgJ3Nlc3Npb24nKTtcblx0XHR0aGlzLnNlc3Npb24uc2lkID0gc2lkO1xuXHRcdHRoaXMuam9pblNlc3Npb24odXJsLmhyZWYpO1xuXG5cdH0gZWxzZSB7XG5cdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2VudGl0eScsICd1c2VyJywgJ3Nlc3Npb24nKTtcblx0XHR0aGlzLnNlc3Npb24uc2lkID0gc2lkO1xuXHRcdC8vIEluIGNhc2UgYSBzZXNzaW9uIGlzIGFscmVhZHkgaW5pdGlhdGVkIFxuXHRcdC8vIGFuZCBzdG9yYWdlIGNvbnRhaW5lcyBzaWQgcGFyYW1ldGVyXG5cdFx0aWYoc2lkKSB7XG5cdFx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2lkJywgc2lkKTtcblx0XHRcdHRoaXMuY3JlYXRlU2Vzc2lvbih7IHNpZDogc2lkLCB1cmw6IHVybC5ocmVmIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBDcmVhdGUgbmV3IHNlc3Npb25cblx0XHRcdHRoaXMuY3JlYXRlU2Vzc2lvbih7IHVybDogdXJsLmhyZWYgfSk7XG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBzZXNzaW9uXG4gKiBFbWl0cyBzZXNzaW9uL2NyZWF0ZSBldmVudFxuICogaWYgaW5pdGlhdGlvbiBpcyBzdWNjZXNzZnVsXG4gKlxuICogQHBhcmFtIFx0e1N0cmluZ30gXHR1cmwgXHRDdXJyZW50IGZ1bGwgVVJMXG4gKiBAcmV0dXJuIFx0e1N0cmluZ31cdHNpZCBcdE5ldyBzZXNzaW9uIGlkXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5jcmVhdGVTZXNzaW9uID0gZnVuY3Rpb24ocGFyYW1zKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnY3JlYXRlU2Vzc2lvbicsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHR1cmw6IChwYXJhbXMudXJsIHx8IHVybC5ocmVmKVxuXHRcdH1cblx0fTtcblxuXHRpZihwYXJhbXMuc2lkKSBkYXRhLnBhcmFtcy5zaWQgPSBwYXJhbXMuc2lkO1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2NyZWF0ZVNlc3Npb24nLCBwYXJhbXM6IHBhcmFtcyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVtaXQoJ3Nlc3Npb24vY3JlYXRlJywgYm9keS5yZXN1bHQpO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmpvaW5TZXNzaW9uID0gZnVuY3Rpb24odXJsKXtcblx0dGhpcy5vcGVuU2hhcmVJbnRldmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zd2l0Y2hTaGFyZVN0YXRlKCdvcGVuU2hhcmUnLCB1cmwpO1xuXHR9LmJpbmQodGhpcyksIDUwMCk7XG5cblx0Z2xvYmFsLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnN3aXRjaFNoYXJlU3RhdGUoJ3NoYXJlQ2xvc2VkJywgdXJsKTtcblx0fS5iaW5kKHRoaXMpO1xufTtcblxuLyoqIFxuICogU2VuZC9vYnRhaW4gZXZlbnRzIHRvL2Zyb20gdGhlIHNlcnZlci4gXG4gKiBFdmVudHMgY291bGQgYmUgb2J0YWluZWQgZnJvbSB0aGUgc2VydmVyIGJ5IHNwZWNpZnlpbmcgYSB0aW1lc3RhbXBcbiAqIGFzIGEgc3RhcnRpbmcgcG9pbnQgZnJvbSB3aGljaCBhbiBldmVudHMgd291bGQgYmUgb2J0YWluZWRcbioqL1xuV2NoYXRBUEkucHJvdG90eXBlLnVwZGF0ZUV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgY2Ipe1xuXHQvLyB2YXIgc2Vzc2lvbklkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyksIGRhdGE7XG5cdC8vIGlmKCFzZXNzaW9uSWQpIHJldHVybiBjYigpO1xuXHRcblx0ZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdldmVudHMnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiB0aGlzLnNlc3Npb24uc2lkLFxuXHRcdFx0aWQ6IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NoYXJlZElkJywgJ2NhY2hlJyksXG5cdFx0XHR0aW1lc3RhbXA6IHN0b3JhZ2UuZ2V0U3RhdGUoJ2V2ZW50VGltZXN0YW1wJywgJ2NhY2hlJyksXG5cdFx0XHRldmVudHM6IGV2ZW50c1xuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgZGF0YSk7XG5cdFx0XHRyZXR1cm4gY2IoZXJyKTsgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cdFx0fVxuXG5cdFx0aWYoYm9keS5yZXN1bHQudGltZXN0YW1wID4gc3RvcmFnZS5nZXRTdGF0ZSgnZXZlbnRUaW1lc3RhbXAnLCAnY2FjaGUnKSkge1xuXHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2V2ZW50VGltZXN0YW1wJywgYm9keS5yZXN1bHQudGltZXN0YW1wLCAnY2FjaGUnKTtcblx0XHRcdGlmKGNiKSBjYihudWxsLCBib2R5LnJlc3VsdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKGNiKSBjYihudWxsLCB7IGV2ZW50czogW10gfSk7XG5cdFx0fVxuXHRcdFx0XG5cblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogR2V0IGF2YWlsYWJsZSBkaWFsb2cgbGFuZ3VhZ2VzXG4gKiBJZiBsYW5ndWFnZXMgYXJlIG5vdCBhdmFpbGFibGUsIFxuICogdGhlbiBlaXRoZXIgdGhlcmUgYXJlIG5vIGF2YWlsYWJsZSBhZ2VudHMgb3JcbiAqIGxhbmd1YWdlcyB3ZXJlbid0IHNldCBpbiBBZG1pbiBTdHVkaW9cbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLmdldExhbmd1YWdlcyA9IGZ1bmN0aW9uKGNiKXtcblx0ZGVidWcubG9nKCd0aGlzLnNlc3Npb246ICcsIHRoaXMuc2Vzc2lvbik7XG5cdGNiKG51bGwsIHRoaXMuc2Vzc2lvbi5sYW5ncyk7XHRcblxuXHQvLyB2YXIgc2Vzc2lvbklkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyk7XG5cdC8vIGlmKCFzZXNzaW9uSWQpIHJldHVybiBjYih0cnVlKTtcblxuXHQvLyByZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwge1xuXHQvLyBcdG1ldGhvZDogJ2dldExhbmd1YWdlcycsXG5cdC8vIFx0cGFyYW1zOiB7XG5cdC8vIFx0XHRzaWQ6IHNlc3Npb25JZFxuXHQvLyBcdH1cblx0Ly8gfSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdC8vIFx0aWYoZXJyKSB7XG5cdC8vIFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2dldExhbmd1YWdlcycgfSk7XG5cdC8vIFx0XHRyZXR1cm4gY2IoZXJyKTtcblx0Ly8gXHR9XG5cblx0Ly8gXHRjYihudWxsLCBib2R5KTtcblx0Ly8gfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogUmVxdWVzdCBjaGF0IHNlc3Npb25cbiAqIFxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJhbXMgLSB1c2VyIHBhcmFtZXRlcnMgKG5hbWUsIHBob25lLCBzdWJqZWN0LCBsYW5ndWFnZSwgZXRjLilcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLmNoYXRSZXF1ZXN0ID0gZnVuY3Rpb24ocGFyYW1zLCBjYil7XG5cdHBhcmFtcy5zaWQgPSB0aGlzLnNlc3Npb24uc2lkO1xuXG5cdGRlYnVnLmxvZygnY2hhdFJlcXVlc3QgcGFyYW1zOiAnLCBwYXJhbXMpO1xuXG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ2NoYXRSZXF1ZXN0Jyxcblx0XHRwYXJhbXM6IHBhcmFtc1xuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2NoYXRSZXF1ZXN0JywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRpZihjYikgY2IoZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRwYXJhbXMudXJsID0gdXJsLmhyZWY7XG5cdFx0dGhpcy5lbWl0KCdjaGF0L3N0YXJ0JywgXy5tZXJnZShwYXJhbXMsIGJvZHkucmVzdWx0KSk7XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkpO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBHZXQgZGlhbG9nIG1lc3NhZ2VzXG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0gdGltZXN0YW1wIEdldCBtZXNzYWdlcyBzaW5jZSBwcm92aWRlZCB0aW1lc3RhbXBcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLmdldE1lc3NhZ2VzID0gZnVuY3Rpb24oY2Ipe1xuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwge1xuXHRcdG1ldGhvZDogJ2dldE1lc3NhZ2VzJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZCxcblx0XHRcdHRpbWVzdGFtcDogc3RvcmFnZS5nZXRTdGF0ZSgnbXNnVGltZXN0YW1wJylcblx0XHR9XG5cdH0sIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdnZXRNZXNzYWdlcycgfSk7XG5cdFx0XHRyZXR1cm4gY2IoZXJyKTtcblx0XHR9XG5cblx0XHQvLyBEbyBub3Qgc2hvdyBvbGQgbWVzc2FnZXNcblx0XHRpZihib2R5LnJlc3VsdC50aW1lc3RhbXAgPiBzdG9yYWdlLmdldFN0YXRlKCdtc2dUaW1lc3RhbXAnKSkge1xuXHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ21zZ1RpbWVzdGFtcCcsIGJvZHkucmVzdWx0LnRpbWVzdGFtcCk7XG5cdFx0XHRpZihib2R5LnJlc3VsdC5tZXNzYWdlcykge1xuXHRcdFx0XHR0aGlzLmVtaXQoJ21lc3NhZ2UvbmV3JywgYm9keS5yZXN1bHQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGJvZHkucmVzdWx0LnR5cGluZykge1xuXHRcdFx0dGhpcy5lbWl0KCdtZXNzYWdlL3R5cGluZycsIGJvZHkucmVzdWx0KTtcblx0XHR9XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkucmVzdWx0KTtcblxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBDbG9zZSBjdXJyZW50IGNoYXQgc2Vzc2lvblxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHJhdGluZyBTZXJ2aWNlIHJhdGluZ1xuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuY2xvc2VDaGF0ID0gZnVuY3Rpb24ocmF0aW5nKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnY2xvc2VDaGF0Jyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZFxuXHRcdH1cblx0fTtcblx0aWYocmF0aW5nKSBkYXRhLnBhcmFtcy5yYXRpbmcgPSByYXRpbmc7XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIGRhdGEpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2hhdCcsIGZhbHNlKTtcblx0XHR0aGlzLmVtaXQoJ2NoYXQvY2xvc2UnLCB7IHJhdGluZzogcmF0aW5nLCB1cmw6IHVybC5ocmVmIH0pO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBTZW5kIG1lc3NhZ2UgdG8gdGhlIGFnZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdGV4dCAtIG1lc3NhZ2UgY29udGVudCBpbiBjYXNlIG9mIHJlZ3VsYXIgbWVzc2FnZSBcbiAqIG9yIGRhdGFVUkwgaW4gY2FzZSBvZiBmaWxlIHRyYW5zZmVyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGUgLSAoT3B0aW9uYWwpIGZpbGUgbmFtZVxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnbWVzc2FnZScsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHRoaXMuc2Vzc2lvbi5zaWQsXG5cdFx0XHRjb250ZW50OiBwYXJhbXMubWVzc2FnZVxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdGlmKHBhcmFtcy5maWxlKSB7XG5cdFx0Ly8gXHQvLyB2YXIgY29udGVudCA9IHB1YmxpY1VybCtEYXRlLm5vdygpK1wiX1wiK3RoaXMub3B0aW9ucy5wYWdlaWQrXCJfXCIrcGFyYW1zLm1lc3NhZ2U7XG5cdFx0XHRkYXRhLnBhcmFtcy5jb250ZW50ID0gcGFyYW1zLmZpbGU7XG5cdFx0XHRkYXRhLnBhcmFtcy5maWxlID0gcGFyYW1zLm1lc3NhZ2U7XG5cblx0XHQvLyBcdHJlcXVlc3QucHV0KGNvbnRlbnQsIHBhcmFtcy5maWxlLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdC8vIFx0XHRpZihlcnIpIHJldHVybiBjb25zb2xlLmVycm9yKCdzZW5kTWVzc2FnZSBlcnJvcjogJywgZXJyKTtcblx0XHQvLyBcdFx0dGhpcy5zZW5kRGF0YShkYXRhKTtcblx0XHQvLyBcdH0pO1xuXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ3NlbmRNZXNzYWdlJywgcGFyYW1zOiBkYXRhIH0pO1xuXHRcdFx0aWYoY2IpIGNiKGVycik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmKGNiKSBjYigpO1xuXHR9KTtcbn07XG5cbi8qKlxuICogU2VuZCBkaWFsb2cgZWl0aGVyIHRvIHRoZSBzcGVjaWZpZWQgZW1haWwgYWRkcmVzcyAoaWYgcGFyYW1ldGVyIFwidG9cIiBoYXMgcGFzc2VkKVxuICogb3IgdG8gY2FsbCBjZW50ZXIgYWRtaW5pc3RyYXRvciAoaWYgcGFyYW1ldGVyIFwiZW1haWxcIiBoYXMgcGFzc2VkKVxuICpcbiAqIEVpdGhlclxuICogQHBhcmFtICB7U3RyaW5nfSB0b1x0XHRcdERlc3RpbmF0aW9uIGVtYWlsIGFkZHJlc3NcbiAqXG4gKiBPclxuICogQHBhcmFtICB7U3RyaW5nfSBlbWFpbFx0XHRTZW5kZXIgZW1haWwgYWRkcmVzc1xuICogQHBhcmFtICB7U3RyaW5nfSB1bmFtZVx0XHRTZW5kZXIgbmFtZVxuICogQHBhcmFtICB7U3RyaW5nfSBmaWxlbmFtZVx0QXR0YWNobWVudCBmaWxlbmFtZVxuICogQHBhcmFtICB7U3RyaW5nfSBmaWxlZGF0YVx0QXR0YWNobWVudCBmaWxlIFVSTFxuICpcbiAqIEJvdGhcbiAqIEBwYXJhbSAge1N0cmluZ30gdGV4dFx0XHRFbWFpbCBib2R5XG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5zZW5kRW1haWwgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0cGFyYW1zLnNpZCA9IHRoaXMuc2Vzc2lvbi5zaWQ7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnc2VuZE1haWwnLFxuXHRcdHBhcmFtczogcGFyYW1zXG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc2VuZEVtYWlsJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRpZihjYikgY2IoZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVtaXQoJ2NoYXQvc2VuZCcsIHBhcmFtcyk7XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkpO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBTZW5kIGNhbGxiYWNrIHJlcXVlc3RcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0YXNrIC0gaWQgb2YgdGhlIGNhbGxiYWNrIHRhc2sgdGhhdCBjb25maWd1cmVkIGluIHRoZSBBZG1pbiBTdHVkaW9cbiAqIEBwYXJhbSAge1N0cmluZ30gcGhvbmUgLSBVc2VyJ3MgcGhvbmUgbnVtYmVyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHRpbWUgLSBUaW1lc3RhbXAgb2YgdGhlIGNhbGwgdG8gYmUgaW5pdGlhdGVkXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5yZXF1ZXN0Q2FsbGJhY2sgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0cGFyYW1zLnNpZCA9IHRoaXMuc2Vzc2lvbi5zaWQ7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAncmVxdWVzdENhbGxiYWNrJyxcblx0XHRwYXJhbXM6IHBhcmFtc1xuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24oZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAncmVxdWVzdENhbGxiYWNrJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRyZXR1cm4gY2IoZXJyKTtcblx0XHR9XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkucmVzdWx0KTtcblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRGlzam9pbiBjdXJyZW50IGFjdGl2ZSBzZXNzaW9uXG4gKiBFbWl0cyBzZXNzaW9uL2Rpc2pvaW4gZXZlbnRcbiAqIGlmIHJlcXVlc3QgaXMgZnVsZmlsbGVkXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNpZCBJRCBvZiBhY3RpdmUgc2Vzc2lvblxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuZGlzam9pblNlc3Npb24gPSBmdW5jdGlvbihzaWQpe1xuXG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ2Rpc2pvaW5TZXNzaW9uJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogc2lkXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2Rpc2pvaW5TZXNzaW9uJywgcGFyYW1zOiB7IHNpZDogc2lkIH0gfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2Rpc2pvaW4nLCB7IHVybDogdXJsLmhyZWYgfSk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2hhcmVPcGVuZWQgPSBmdW5jdGlvbihzaGFyZWRJZCwgdXJsKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnc2hhcmVPcGVuZWQnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0aWQ6IHNoYXJlZElkLFxuXHRcdFx0dXJsOiB1cmxcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxufTtcblxuLyoqXG4gKiBJbmZvcm1zIHRoZSBzZXJ2ZXIgdGhhdCB0aGUgY29icm93c2luZyBmZWF0dXJlIGlzIHR1cm5lZCBvbiBvciBvZmZcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHN0YXRlIFJlcHJlc2VudHMgdGhlIHN0YXRlIG9mIGNvYnJvd3NpbmcgZmVhdHVyZVxuICogQHBhcmFtICB7U3RyaW5nfSB1cmwgICBVcmwgd2hlcmUgdGhlIGZlYXR1cmUncyBzdGF0ZSBpcyBjaGFuZ2VkXG4gKiBAcmV0dXJuIG5vbmVcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLnN3aXRjaFNoYXJlU3RhdGUgPSBmdW5jdGlvbihzdGF0ZSwgdXJsKXtcblx0dmFyIG1ldGhvZCA9IHN0YXRlO1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6IG1ldGhvZCxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZCxcblx0XHRcdHVybDogdXJsXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24oZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc3dpdGNoU2hhcmVTdGF0ZScsIHBhcmFtczogeyBzdGF0ZTogc3RhdGUgfSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2V0Q2hhdFRpbWVvdXQgPSBmdW5jdGlvbih0aW1lb3V0KXtcblx0cmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCl7XG5cdFx0dGhpcy5lbWl0KCdjaGF0L3RpbWVvdXQnKTtcblx0fS5iaW5kKHRoaXMpLCB0aW1lb3V0KjEwMDApO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLnVzZXJJc1R5cGluZyA9IGZ1bmN0aW9uKCl7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ3R5cGluZycsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHRoaXMuc2Vzc2lvbi5zaWRcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyKXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc2V0Q2hhdFRpbWVvdXQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS51cGRhdGVVcmwgPSBmdW5jdGlvbih1cmwpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICd1cGRhdGVVcmwnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiB0aGlzLnNlc3Npb24uc2lkLFxuXHRcdFx0dXJsOiB1cmxcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICd1cGRhdGVVcmwnLCBwYXJhbXM6IHsgdXJsOiB1cmwgfSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUubGlua0ZvbGxvd2VkID0gZnVuY3Rpb24odXJsKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnbGlua0ZvbGxvd2VkJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZCxcblx0XHRcdHVybDogdXJsXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2xpbmtGb2xsb3dlZCcsIHBhcmFtczogeyB1cmw6IHVybCB9IH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5nZXRTaWRGcm9tVXJsID0gZnVuY3Rpb24odXJsKSB7XG5cdHZhciBzdWJzdHIgPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKCdjaGF0U2Vzc2lvbklkPScpKTtcblx0c3Vic3RyID0gc3Vic3RyLnN1YnN0cmluZyhzdWJzdHIuaW5kZXhPZignPScpKzEpO1xuXHRyZXR1cm4gc3Vic3RyO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmNyZWF0ZVdlYnNvY2tldCA9IGZ1bmN0aW9uKGhvc3Qpe1xuICAgIC8vIHZhciBwcm90b2NvbCA9IChnbG9iYWwubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonKSA/ICd3c3M6JyA6ICd3czonO1xuICAgIHZhciBwcm90b2NvbCA9ICd3c3M6JztcbiAgICB2YXIgd2Vic29ja2V0ID0gbmV3IFdlYlNvY2tldChwcm90b2NvbCArICcvLycrd2Vic29ja2V0VXJsLCdqc29uLmFwaS5zbWlsZS1zb2Z0LmNvbScpOyAvL0luaXQgV2Vic29ja2V0IGhhbmRzaGFrZVxuXG4gICAgd2Vic29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICBjb25zb2xlLmxvZygnV2ViU29ja2V0IG9wZW5lZDogJywgZSk7XG4gICAgICAgIHdlYnNvY2tldFRyeSA9IDE7XG4gICAgICAgIGlmKCFtb2R1bGVJbml0KSB7XG4gICAgICAgIFx0dGhpcy5pbml0KCk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG4gICAgd2Vic29ja2V0Lm9ubWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgd2Vic29ja2V0Lm9uY2xvc2UgPSB0aGlzLm9uV2Vic29ja2V0Q2xvc2UuYmluZCh0aGlzKTtcbiAgICB3ZWJzb2NrZXQub25lcnJvciA9IHRoaXMub25FcnJvcjtcblxuICAgIGdsb2JhbC5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB3ZWJzb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uICgpIHt9OyAvLyBkaXNhYmxlIG9uY2xvc2UgaGFuZGxlciBmaXJzdFxuICAgICAgICB3ZWJzb2NrZXQuY2xvc2UoKVxuICAgIH07XG5cbiAgICB0aGlzLndlYnNvY2tldCA9IHdlYnNvY2tldDtcblxufVxuXG5XY2hhdEFQSS5wcm90b3R5cGUub25XZWJzb2NrZXRDbG9zZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zb2xlLmxvZygnV2ViU29ja2V0IGNsb3NlZCcsIGUpO1xuICAgIHZhciB0aW1lID0gZ2VuZXJhdGVJbnRlcnZhbCh3ZWJzb2NrZXRUcnkpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgd2Vic29ja2V0VHJ5Kys7XG4gICAgICAgIHRoaXMuY3JlYXRlV2Vic29ja2V0KCk7XG4gICAgfS5iaW5kKHRoaXMpLCB0aW1lKTtcbn1cblxuLy9SZWNvbm5lY3Rpb24gRXhwb25lbnRpYWwgQmFja29mZiBBbGdvcml0aG0gdGFrZW4gZnJvbSBodHRwOi8vYmxvZy5qb2hucnlkaW5nLmNvbS9wb3N0Lzc4NTQ0OTY5MzQ5L2hvdy10by1yZWNvbm5lY3Qtd2ViLXNvY2tldHMtaW4tYS1yZWFsdGltZS13ZWItYXBwXG5mdW5jdGlvbiBnZW5lcmF0ZUludGVydmFsIChrKSB7XG4gICAgdmFyIG1heEludGVydmFsID0gKE1hdGgucG93KDIsIGspIC0gMSkgKiAxMDAwO1xuICBcbiAgICBpZiAobWF4SW50ZXJ2YWwgPiAzMCoxMDAwKSB7XG4gICAgICAgIG1heEludGVydmFsID0gMzAqMTAwMDsgLy8gSWYgdGhlIGdlbmVyYXRlZCBpbnRlcnZhbCBpcyBtb3JlIHRoYW4gMzAgc2Vjb25kcywgdHJ1bmNhdGUgaXQgZG93biB0byAzMCBzZWNvbmRzLlxuICAgIH1cbiAgXG4gICAgLy8gZ2VuZXJhdGUgdGhlIGludGVydmFsIHRvIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIDAgYW5kIHRoZSBtYXhJbnRlcnZhbCBkZXRlcm1pbmVkIGZyb20gYWJvdmVcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIG1heEludGVydmFsO1xufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ2xvZycpOyB9LFxuICAgIGluZm86IGZ1bmN0aW9uKCl7IGxvZyhhcmd1bWVudHMsICdpbmZvJyk7IH0sXG4gICAgd2FybjogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ3dhcm4nKTsgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ2Vycm9yJyk7IH1cbn07XG5cbmZ1bmN0aW9uIGxvZyhhcmdzLCBtZXRob2Qpe1xuICAgIGlmKGdsb2JhbC5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc3djLmRlYnVnJykpIHtcbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKGFyZ3MsIGZ1bmN0aW9uKGFyZyl7XG4gICAgICAgICAgICBnbG9iYWwuY29uc29sZVttZXRob2RdID8gZ2xvYmFsLmNvbnNvbGVbbWV0aG9kXShhcmcpIDogZ2xvYmFsLmNvbnNvbGUubG9nKGFyZyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxufSIsInZhciBfdGVtcGxhdGUgPSByZXF1aXJlKCdsb2Rhc2gvc3RyaW5nL3RlbXBsYXRlJyk7XG52YXIgX2ZvckVhY2ggPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9mb3JFYWNoJyk7XG52YXIgX2Fzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvYXNzaWduJyk7XG52YXIgX21lcmdlID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9tZXJnZScpO1xudmFyIF9pc0VxdWFsID0gcmVxdWlyZSgnbG9kYXNoL2xhbmcvaXNFcXVhbCcpO1xudmFyIF90cmltID0gcmVxdWlyZSgnbG9kYXNoL3N0cmluZy90cmltJyk7XG52YXIgX3Rocm90dGxlID0gcmVxdWlyZSgnbG9kYXNoL2Z1bmN0aW9uL3Rocm90dGxlJyk7XG52YXIgX2RlYm91bmNlID0gcmVxdWlyZSgnbG9kYXNoL2Z1bmN0aW9uL2RlYm91bmNlJyk7XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBmaW5kUGFyZW50KGVsZW0sIHNlbGVjdG9yKSB7XG5cbiAgICB2YXIgZmlyc3RDaGFyID0gc2VsZWN0b3IuY2hhckF0KDApO1xuXG4gICAgLy8gR2V0IGNsb3Nlc3QgbWF0Y2hcbiAgICBmb3IgKCA7IGVsZW0gJiYgZWxlbSAhPT0gZG9jdW1lbnQ7IGVsZW0gPSBlbGVtLnBhcmVudE5vZGUgKSB7XG4gICAgICAgIGlmICggZmlyc3RDaGFyID09PSAnLicgKSB7XG4gICAgICAgICAgICBpZiAoIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCBzZWxlY3Rvci5zdWJzdHIoMSkgKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZmlyc3RDaGFyID09PSAnIycgKSB7XG4gICAgICAgICAgICBpZiAoIGVsZW0uaWQgPT09IHNlbGVjdG9yLnN1YnN0cigxKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZmlyc3RDaGFyID09PSAnWycgKSB7XG4gICAgICAgICAgICBpZiAoZWxlbS5oYXNBdHRyaWJ1dGUoIHNlbGVjdG9yLnN1YnN0cigxLCBzZWxlY3Rvci5sZW5ndGggLSAyKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKGVsZW0ubm9kZU5hbWUgPT09IHNlbGVjdG9yLnRvVXBwZXJDYXNlKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG59XG5cbmZ1bmN0aW9uIHBvbGwoZm4sIGNhbGxiYWNrLCBlcnJiYWNrLCB0aW1lb3V0LCBpbnRlcnZhbCkge1xuICAgIHZhciBlbmRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpICsgKHRpbWVvdXQgfHwgMjAwMCk7XG4gICAgaW50ZXJ2YWwgPSBpbnRlcnZhbCB8fCAzMDA7XG5cbiAgICAoZnVuY3Rpb24gcCgpIHtcbiAgICAgICAgLy8gSWYgdGhlIGNvbmRpdGlvbiBpcyBtZXQsIHdlJ3JlIGRvbmUhIFxuICAgICAgICBpZihmbigpKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHRoZSBjb25kaXRpb24gaXNuJ3QgbWV0IGJ1dCB0aGUgdGltZW91dCBoYXNuJ3QgZWxhcHNlZCwgZ28gYWdhaW5cbiAgICAgICAgZWxzZSBpZiAoTnVtYmVyKG5ldyBEYXRlKCkpIDwgZW5kVGltZSkge1xuICAgICAgICAgICAgc2V0VGltZW91dChwLCBpbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRGlkbid0IG1hdGNoIGFuZCB0b28gbXVjaCB0aW1lLCByZWplY3QhXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXJyYmFjayhuZXcgRXJyb3IoJ3RpbWVkIG91dCBmb3IgJyArIGZuICsgJzogJyArIGFyZ3VtZW50cykpO1xuICAgICAgICB9XG4gICAgfSkoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHRlbXBsYXRlOiBfdGVtcGxhdGUsXG5cdGZvckVhY2g6IF9mb3JFYWNoLFxuXHRhc3NpZ246IF9hc3NpZ24sXG5cdG1lcmdlOiBfbWVyZ2UsXG5cdGlzRXF1YWw6IF9pc0VxdWFsLFxuXHR0cmltOiBfdHJpbSxcblx0dGhyb3R0bGU6IF90aHJvdHRsZSxcblx0ZGVib3VuY2U6IGRlYm91bmNlLFxuICAgIHBvbGw6IHBvbGwsXG5cdGZpbmRQYXJlbnQ6IGZpbmRQYXJlbnRcbn07IiwidmFyIHdpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LmpzJyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gd2lkZ2V0Lm1vZHVsZTtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciBjYWNoZSA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cG9zdDogcG9zdCxcblx0Z2V0OiBnZXQsXG5cdHB1dDogcHV0XG59O1xuXG5mdW5jdGlvbiBwb3N0KHVybCwgZGF0YSwgY2Ipe1xuXG5cdC8vIGRlYnVnLmxvZygncG9zdCByZXF1ZXN0OiAnLCB1cmwsIGRhdGEpO1xuXG5cdHZhciBkYXRhID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG5cblx0WG1sSHR0cFJlcXVlc3QoJ1BPU1QnLCB1cmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdFx0ZGVidWcubG9nKCdwb3N0IHJlc3Bvc2U6ICcsIGVyciwgcmVzKTtcblxuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRjYihudWxsLCByZXMpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0KHNlbGVjdG9yLCB1cmwsIGNiKXtcblxuXHRpZihzZWxlY3RvciAmJiBjYWNoZVtzZWxlY3Rvcl0pIHtcblx0XHRyZXR1cm4gY2IobnVsbCwgY2FjaGVbc2VsZWN0b3JdKTtcblx0fVxuXG5cdFhtbEh0dHBSZXF1ZXN0KCdHRVQnLCB1cmwsIG51bGwsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdFx0aWYoZXJyKSByZXR1cm4gY2IoZXJyKTtcblxuXHRcdGlmKHNlbGVjdG9yKSBjYWNoZVtzZWxlY3Rvcl0gPSByZXM7XG5cdFx0Y2IobnVsbCwgcmVzKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHB1dCh1cmwsIGRhdGEsIGNiKXtcblxuXHQvLyBkZWJ1Zy5sb2coJ3Bvc3QgcmVxdWVzdDogJywgdXJsLCBkYXRhKTtcblxuXHQvLyB2YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXG5cdFhtbEh0dHBSZXF1ZXN0KCdQVVQnLCB1cmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdFx0ZGVidWcubG9nKCdwdXQgcmVzcG9zZTogJywgZXJyLCByZXMpO1xuXG5cdFx0aWYoZXJyKSByZXR1cm4gY2IoZXJyKTtcblxuXHRcdGNiKG51bGwsIHJlcyk7XG5cdH0pO1xufVxuXG4vKipcbiAqIFNlbmQgcmVxdWVzdCB0byB0aGUgc2VydmVyIHZpYSBYTUxIdHRwUmVxdWVzdFxuICovXG5mdW5jdGlvbiBYbWxIdHRwUmVxdWVzdChtZXRob2QsIHVybCwgZGF0YSwgY2FsbGJhY2spe1xuXHR2YXIgeGhyLCByZXNwb25zZSwgcmVxdWVzdFRpbWVyO1xuXG5cdHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHR4aHIub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG5cblx0cmVxdWVzdFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdHhoci5hYm9ydCgpO1xuXHR9LCA2MDAwMCk7XG5cdFxuXHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHhoci5yZWFkeVN0YXRlPT00KXtcblx0XHRcdGNsZWFyVGltZW91dChyZXF1ZXN0VGltZXIpO1xuXHRcdFx0aWYoeGhyLnJlc3BvbnNlKSB7XG5cdFx0XHRcdHJlc3BvbnNlID0gbWV0aG9kID09PSAnUE9TVCcgPyBKU09OLnBhcnNlKHhoci5yZXNwb25zZSkgOiB4aHIucmVzcG9uc2U7XG5cdFx0XHRcdGlmKHJlc3BvbnNlLmVycm9yKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKHJlc3BvbnNlLmVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0aWYobWV0aG9kID09PSAnUE9TVCcpIHtcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9VVRGLTgnKTtcblx0fVxuXG5cdGlmKGRhdGEpIHtcblx0XHR4aHIuc2VuZChkYXRhKTtcblx0fSBlbHNlIHtcblx0XHR4aHIuc2VuZCgpO1xuXHR9XG59XG4iLCJ2YXIgc3RvcmFnZSA9IGdsb2JhbC5sb2NhbFN0b3JhZ2U7XG52YXIgc2Vzc2lvbiA9IGdsb2JhbC5zZXNzaW9uU3RvcmFnZTtcbnZhciBwcmVmaXggPSAnc3djJztcbnZhciBkZWxpbWl0ZXIgPSAnLic7XG5cbi8vIEN1cnJlbnQgY2FjaGUgb2JqZWN0XG52YXIgY2FjaGUgPSB7XG5cdHNpZDogbnVsbCxcblx0ZXZlbnRUaW1lc3RhbXA6IDAsXG5cdG1zZ1RpbWVzdGFtcDogMCxcblx0ZW50aXR5OiB1bmRlZmluZWQsXG5cdGNoYXQ6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXQ6IGdldEl0ZW0sXG5cdHNldDogc2V0SXRlbSxcblx0cmVtb3ZlOiByZW1vdmVJdGVtLFxuXHRnZXRTdGF0ZTogZ2V0U3RhdGUsXG5cdHNhdmVTdGF0ZTogc2F2ZVN0YXRlLFxuXHRyZW1vdmVTdGF0ZTogcmVtb3ZlU3RhdGVcbn07XG5cbmZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0cmV0dXJuIEpTT04ucGFyc2Uoc2Vzc2lvbi5nZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KSk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIEpTT04ucGFyc2Uoc3RvcmFnZS5nZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0SXRlbShrZXksIHZhbHVlLCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0c2Vzc2lvbi5zZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5LCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuXHR9IGVsc2Uge1xuXHRcdHN0b3JhZ2Uuc2V0SXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSwgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcblx0fVxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUl0ZW0oa2V5LCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0c2Vzc2lvbi5yZW1vdmVJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KTtcblx0fSBlbHNlIHtcblx0XHRzdG9yYWdlLnJlbW92ZUl0ZW0ocHJlZml4K2RlbGltaXRlcitrZXkpO1xuXHR9XG59XG5cbi8qKlxuICogR2V0IHNhdmVkIHByb3BlcnR5IGZyb20gbG9jYWxTdG9yYWdlIG9yIGZyb20gc2Vzc2lvbiBjYWNoZVxuICogQHBhcmFtICB7U3RyaW5nfSBrZXkgICAgICAtIGl0ZW0ga2V5IGluIHN0b3JhZ2UgbWVtb3J5XG4gKiBAcGFyYW0gIHtbdHlwZV19IGxvY2F0aW9uIC0gZnJvbSB3aGVyZSB0byByZXRyaWV2ZSBpdGVtLiBcbiAqIENvdWxkIGJlIGVpdGhlciBcInN0b3JhZ2VcIiAtIGZyb20gbG9jYWxTdG9yYWdlLCBvciBcImNhY2hlXCIgLSBmcm9tIHNlc3Npb24gY2FjaGVcbiAqIEByZXR1cm4ge1N0cmluZ3xPYmplY3R8RnVuY3Rpb259ICAgICAgICAgIC0gaXRlbSB2YWx1ZVxuICovXG5mdW5jdGlvbiBnZXRTdGF0ZShrZXksIGxvY2F0aW9uKXtcblx0aWYoIWxvY2F0aW9uKSB7XG5cdFx0cmV0dXJuIChjYWNoZVtrZXldICE9PSB1bmRlZmluZWQgJiYgY2FjaGVba2V5XSAhPT0gbnVsbCkgPyBjYWNoZVtrZXldIDogZ2V0SXRlbShrZXkpO1xuXHR9IGVsc2UgaWYobG9jYXRpb24gPT09ICdjYWNoZScpIHtcblx0XHRyZXR1cm4gY2FjaGVba2V5XTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gZ2V0SXRlbShrZXksIGxvY2F0aW9uKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzYXZlU3RhdGUoa2V5LCB2YWx1ZSwgbG9jYXRpb24pe1xuXHRjYWNoZVtrZXldID0gdmFsdWU7XG5cdGlmKGxvY2F0aW9uICE9PSAnY2FjaGUnKSB7XG5cdFx0c2V0SXRlbShrZXksIHZhbHVlLCBsb2NhdGlvbik7XG5cdH1cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVTdGF0ZShrZXksIGxvY2F0aW9uKSB7XG5cdGRlbGV0ZSBjYWNoZVtrZXldO1xuXHRyZW1vdmVJdGVtKGtleSk7XG59XG4iLCJ2YXIgXyA9IHt9O1xudmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnXG59O1xudmFyIGVzY2FwZVJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1snICsgT2JqZWN0LmtleXMoZXNjYXBlTWFwKS5qb2luKCcnKSArICddJywgJ2cnKTtcbl8uZXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgaWYgKCFzdHJpbmcpIHJldHVybiAnJztcbiAgICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZShlc2NhcGVSZWdleHAsIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVNYXBbbWF0Y2hdO1xuICAgIH0pO1xufTtcbmV4cG9ydHNbJ2VtYWlsJ109IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGUsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XG53aXRoIChvYmopIHtcblxuIHZhciBwcmVmaXggPSBkZWZhdWx0cy5wcmVmaXg7IDtcbl9fcCArPSAnXFxuPCFET0NUWVBFIGh0bWwgUFVCTElDIFwiLS8vVzNDLy9EVEQgWEhUTUwgMS4wIFRyYW5zaXRpb25hbC8vRU5cIiBcImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXRyYW5zaXRpb25hbC5kdGRcIj5cXG48aHRtbCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIj5cXG4gICAgPGhlYWQ+XFxuICAgICAgICA8bWV0YSBodHRwLWVxdWl2PVwiQ29udGVudC1UeXBlXCIgY29udGVudD1cInRleHQvaHRtbDsgY2hhcnNldD13aW5kb3dzLTEyNTFcIiAvPlxcbiAgICAgICAgPCEtLVtpZiAhbXNvXT48IS0tPlxcbiAgICAgICAgICAgIDxtZXRhIGh0dHAtZXF1aXY9XCJYLVVBLUNvbXBhdGlibGVcIiBjb250ZW50PVwiSUU9ZWRnZVwiIC8+XFxuICAgICAgICA8IS0tPCFbZW5kaWZdLS0+XFxuICAgICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxcbiAgICAgICAgPHRpdGxlPjwvdGl0bGU+XFxuICAgICAgICA8IS0tW2lmIChndGUgbXNvIDkpfChJRSldPlxcbiAgICAgICAgPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPlxcbiAgICAgICAgICAgIHRhYmxlIHtib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO31cXG4gICAgICAgIDwvc3R5bGU+XFxuICAgICAgICA8IVtlbmRpZl0tLT5cXG4gICAgICAgIDxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj5cXG4gICAgICAgICAgICAvKiBCYXNpY3MgKi9cXG4gICAgICAgICAgICBib2R5IHtcXG4gICAgICAgICAgICBNYXJnaW46IDA7XFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XFxuICAgICAgICAgICAgICAgIG1pbi13aWR0aDogMTAwJTtcXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgdGFibGUge1xcbiAgICAgICAgICAgICAgICBib3JkZXItc3BhY2luZzogMDtcXG4gICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjMzMzMzMzO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICB0ZCB7XFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDA7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIGltZyB7XFxuICAgICAgICAgICAgICAgIGJvcmRlcjogMDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLndyYXBwZXIge1xcbiAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcXG4gICAgICAgICAgICAgICAgdGFibGUtbGF5b3V0OiBmaXhlZDtcXG4gICAgICAgICAgICAgICAgLXdlYmtpdC10ZXh0LXNpemUtYWRqdXN0OiAxMDAlO1xcbiAgICAgICAgICAgICAgICAtbXMtdGV4dC1zaXplLWFkanVzdDogMTAwJTtcXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0YxRjFGMTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLndlYmtpdCB7XFxuICAgICAgICAgICAgICAgIG1heC13aWR0aDogNTAwcHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5vdXRlciB7XFxuICAgICAgICAgICAgTWFyZ2luOiAwIGF1dG87XFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTAwJTtcXG4gICAgICAgICAgICAgICAgd2lkdGg6IDk1JTtcXG4gICAgICAgICAgICAgICAgbWF4LXdpZHRoOiA1MDBweDtcXG4gICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgcCB7XFxuICAgICAgICAgICAgICAgIE1hcmdpbjogMDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgYSB7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjZWU2YTU2O1xcbiAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLmgxIHtcXG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAyMXB4O1xcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcXG4gICAgICAgICAgICAgICAgTWFyZ2luLWJvdHRvbTogMThweDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLmgyIHtcXG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxOHB4O1xcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcXG4gICAgICAgICAgICAgICAgTWFyZ2luLWJvdHRvbTogMTJweDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgIFxcbiAgICAgICAgICAgIC8qIE9uZSBjb2x1bW4gbGF5b3V0ICovXFxuICAgICAgICAgICAgLm9uZS1jb2x1bW4gLmNvbnRlbnRzIHtcXG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDtcXG4gICAgICAgICAgICAgICAgY29sb3I6IzUwNTA1MDtcXG4gICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6QXJpYWw7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZToxNHB4O1xcbiAgICAgICAgICAgICAgICBsaW5lLWhlaWdodDoxNTAlO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAub25lLWNvbHVtbiBwIHtcXG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xcbiAgICAgICAgICAgICAgICBNYXJnaW4tYm90dG9tOiAxMHB4O1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZSB7XFxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xcbiAgICAgICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMHB4O1xcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjRkZGRkZGO1xcbiAgICAgICAgICAgICAgICBib3JkZXItYm90dG9tOiA0cHggc29saWQgI0NDQ0NDQztcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2UgaW1nIHtcXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgICAgICAgICAgIG1heC13aWR0aDogNTAwcHg7XFxuICAgICAgICAgICAgICAgIGhlaWdodDogYXV0bztcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2Ugc3BhbiB7XFxuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgICAgICAgICAgICAgICBjb2xvcjogIzk5OTk5OTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLWFnZW50LW1zZyAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZS1mcm9tIHtcXG4gICAgICAgICAgICAgICAgY29sb3I6ICM1NTU1NTU7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy11c2VyLW1zZyAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZS1mcm9tIHtcXG4gICAgICAgICAgICAgICAgY29sb3I6ICNGNzVCNUQ7XFxuICAgICAgICAgICAgfVxcblxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlLXRpbWUge1xcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICAgICAgICAgICAgICAgIGZsb2F0OiByaWdodDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLmNvcHlyaWdodCB7XFxuICAgICAgICAgICAgICAgIG1hcmdpbi10b3A6IDVweDtcXG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xcbiAgICAgICAgICAgICAgICBmb250LXN0eWxlOiBpdGFsaWM7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjQ0NDQ0NDO1xcbiAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcXG4gICAgICAgICAgICB9XFxuXFxuICAgICAgICA8L3N0eWxlPlxcbiAgICA8L2hlYWQ+XFxuICAgIDxib2R5PlxcbiAgICAgICAgPGNlbnRlciBjbGFzcz1cIndyYXBwZXJcIj5cXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2Via2l0XCI+XFxuICAgICAgICAgICAgICAgIDwhLS1baWYgKGd0ZSBtc28gOSl8KElFKV0+XFxuICAgICAgICAgICAgICAgIDx0YWJsZSB3aWR0aD1cIjUwMFwiIGFsaWduPVwiY2VudGVyXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPlxcbiAgICAgICAgICAgICAgICA8dHI+XFxuICAgICAgICAgICAgICAgIDx0ZD5cXG4gICAgICAgICAgICAgICAgPCFbZW5kaWZdLS0+XFxuICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cIm91dGVyXCIgYWxpZ249XCJjZW50ZXJcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBib3JkZXI9XCIwXCI+XFxuICAgICAgICAgICAgICAgICAgICA8dHI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwib25lLWNvbHVtblwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgd2lkdGg9XCIxMDAlXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiaW5uZXIgY29udGVudHNcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyArXG4oKF9fdCA9ICggY29udGVudCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxcbiAgICAgICAgICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgICAgICAgPC90YWJsZT5cXG4gICAgICAgICAgICAgICAgPCEtLVtpZiAoZ3RlIG1zbyA5KXwoSUUpXT5cXG4gICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgICAgICAgPC90YWJsZT5cXG4gICAgICAgICAgICAgICAgPCFbZW5kaWZdLS0+XFxuICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICA8L2NlbnRlcj5cXG4gICAgPC9ib2R5PlxcbjwvaHRtbD4nO1xuXG59XG5yZXR1cm4gX19wXG59XG52YXIgXyA9IHt9O1xudmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnXG59O1xudmFyIGVzY2FwZVJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1snICsgT2JqZWN0LmtleXMoZXNjYXBlTWFwKS5qb2luKCcnKSArICddJywgJ2cnKTtcbl8uZXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgaWYgKCFzdHJpbmcpIHJldHVybiAnJztcbiAgICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZShlc2NhcGVSZWdleHAsIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVNYXBbbWF0Y2hdO1xuICAgIH0pO1xufTtcbmV4cG9ydHNbJ2Zvcm1zJ109IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGUsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XG53aXRoIChvYmopIHtcbl9fcCArPSAnPGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictJyArXG5fX2UoIG1lc3NhZ2UuZW50aXR5ICkgK1xuJy1tc2dcIj5cXG5cXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbVwiPicgK1xuX19lKCBtZXNzYWdlLmZyb20gKSArXG4nPC9zcGFuPlxcblxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLWNvbnRlbnRcIiAnO1xuIGlmKG1lc3NhZ2UuZW50aXR5ID09PSBcInVzZXJcIikgeyA7XG5fX3AgKz0gJyBzdHlsZT1cImJvcmRlci1jb2xvcjpcXCcnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJ1wiICc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXHRcXHQnO1xuIGlmKGZvcm0uZGVzY3JpcHRpb24pIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHQ8cD4nICtcbigoX190ID0gKCBmcmFzZXMuRk9STVMuREVTQ1JJUFRJT05TW2Zvcm0uZGVzY3JpcHRpb25dIHx8IGZvcm0uZGVzY3JpcHRpb24gKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9wPlxcblxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdDxmb3JtIG5hbWU9XCInICtcbl9fZSggZm9ybS5uYW1lICkgK1xuJ1wiICc7XG4gaWYoZm9ybS5hdXRvY29tcGxldGUpeyA7XG5fX3AgKz0gJ2F1dG9jb21wbGV0ZT1cIm9uXCInO1xuIH0gO1xuX19wICs9ICcgZGF0YS12YWxpZGF0ZS1mb3JtPVwidHJ1ZVwiPlxcblxcdFxcdFxcdCc7XG4gXy5mb3JFYWNoKGZvcm0uZmllbGRzLCBmdW5jdGlvbihpdGVtKXsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHQnO1xuIGlmKGl0ZW0udHlwZSAhPT0gJ3NlbGVjdCcpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cIicgK1xuKChfX3QgPSAoIGl0ZW0udHlwZSB8fCAndGV4dCcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRwbGFjZWhvbGRlcj1cIicgK1xuKChfX3QgPSAoIGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbaXRlbS5wbGFjZWhvbGRlcl0gfHwgZnJhc2VzLkZPUk1TLlBMQUNFSE9MREVSU1tpdGVtLm5hbWVdICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyAnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJyonO1xuIH0gO1xuX19wICs9ICdcIlxcblxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggaXRlbS5uYW1lICkgK1xuJ1wiICc7XG4gaWYoaXRlbS52YWx1ZSl7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0dmFsdWU9XCInICtcbl9fZSggY3JlZGVudGlhbHNbaXRlbS52YWx1ZV0gKSArXG4nXCIgJztcbiB9IDtcbl9fcCArPSAnICc7XG4gaWYoaXRlbS5yZXF1aXJlZCl7IDtcbl9fcCArPSAncmVxdWlyZWQnO1xuIH0gO1xuX19wICs9ICc+XFxuXFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLnR5cGUgPT09ICdzZWxlY3QnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PHNlbGVjdCBuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChpdGVtLm9wdGlvbnMsIGZ1bmN0aW9uKG9wdGlvbikgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCInICtcbl9fZSggb3B0aW9uLnZhbHVlICkgK1xuJ1wiICc7XG4gaWYob3B0aW9uLnNlbGVjdGVkKSB7IDtcbl9fcCArPSAnIHNlbGVjdGVkICc7XG4gfSA7XG5fX3AgKz0gJyA+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbb3B0aW9uLnRleHRdIHx8IG9wdGlvbi50ZXh0ICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PC9zZWxlY3Q+XFxuXFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0JztcbiB9KTsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdHR5cGU9XCJzdWJtaXRcIlxcblxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCJcXG5cXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgYm9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7XCI+JyArXG5fX2UoIGZyYXNlcy5GT1JNUy5zZW5kICkgK1xuJzwvYnV0dG9uPlxcblxcdFxcdFxcdDxidXR0b25cXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiXFxuXFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwicmVqZWN0Rm9ybVwiPicgK1xuX19lKCBmcmFzZXMuRk9STVMuY2FuY2VsICkgK1xuJzwvYnV0dG9uPlxcblxcdFxcdDwvZm9ybT5cXG5cXHQ8L2Rpdj5cXG5cXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtdGltZVwiPiAnICtcbl9fZSggbWVzc2FnZS50aW1lICkgK1xuJzwvc3Bhbj5cXG48L2Rpdj4nO1xuXG59XG5yZXR1cm4gX19wXG59XG52YXIgXyA9IHt9O1xudmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnXG59O1xudmFyIGVzY2FwZVJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1snICsgT2JqZWN0LmtleXMoZXNjYXBlTWFwKS5qb2luKCcnKSArICddJywgJ2cnKTtcbl8uZXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgaWYgKCFzdHJpbmcpIHJldHVybiAnJztcbiAgICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZShlc2NhcGVSZWdleHAsIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVNYXBbbWF0Y2hdO1xuICAgIH0pO1xufTtcbmV4cG9ydHNbJ21lc3NhZ2UnXT0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuX19wICs9ICc8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy0nICtcbl9fZSggbWVzc2FnZS5lbnRpdHkgKSArXG4nLW1zZ1wiPlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS1mcm9tXCI+JyArXG5fX2UoIG1lc3NhZ2UuZnJvbSApICtcbic8L3NwYW4+XFxuXFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtY29udGVudFwiIFxcblxcdFxcdCc7XG4gaWYobWVzc2FnZS5lbnRpdHkgPT09IFwidXNlclwiKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdHN0eWxlPVwiYm9yZGVyLWNvbG9yOic7XG4gZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yIDtcbl9fcCArPSAnXCIgXFxuXFx0XFx0JztcbiB9IDtcbl9fcCArPSAnPlxcblxcdFxcdDxwPicgK1xuKChfX3QgPSAoIG1lc3NhZ2UuY29udGVudCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3A+XFxuXFx0PC9kaXY+XFxuXFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLXRpbWVcIj4gJyArXG5fX2UoIG1lc3NhZ2UudGltZSApICtcbic8L3NwYW4+XFxuPC9kaXY+JztcblxufVxucmV0dXJuIF9fcFxufVxudmFyIF8gPSB7fTtcbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7J1xufTtcbnZhciBlc2NhcGVSZWdleHAgPSBuZXcgUmVnRXhwKCdbJyArIE9iamVjdC5rZXlzKGVzY2FwZU1hcCkuam9pbignJykgKyAnXScsICdnJyk7XG5fLmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGlmICghc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoZXNjYXBlUmVnZXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZXNjYXBlTWFwW21hdGNoXTtcbiAgICB9KTtcbn07XG5leHBvcnRzWyd3aWRnZXQnXT0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuXG4gdmFyIGZyYXNlcyA9IHRyYW5zbGF0aW9uc1tjdXJyTGFuZ107IDtcbl9fcCArPSAnXFxuJztcbiB2YXIgcGFuZWxzID0gZnJhc2VzLlBBTkVMUzsgO1xuX19wICs9ICdcXG4nO1xuIHZhciBjaGFubmVscyA9IGRlZmF1bHRzLmNoYW5uZWxzOyA7XG5fX3AgKz0gJ1xcbic7XG4gdmFyIHBvc2l0aW9uQ2xhc3MgPSBkZWZhdWx0cy5wb3NpdGlvbiA9PT0gJ3JpZ2h0JyA/ICdwb3NpdGlvbi1yaWdodCcgOiAncG9zaXRpb24tbGVmdCcgO1xuX19wICs9ICdcXG48ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctY29udFwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctY29udCAnICtcbl9fZSggcG9zaXRpb25DbGFzcyApICtcbidcIj5cXG5cXG5cXHQ8IS0tICoqKioqIFBhbmVzIGNvbnRhaW5lciAqKioqKiAtLT5cXG5cXHQ8ZGl2IFxcblxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZXNcIiBcXG5cXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVzXCIgXFxuXFx0XFx0c3R5bGU9XCInO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy53aWR0aCkgeyA7XG5fX3AgKz0gJ3dpZHRoOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLndpZHRoICkgK1xuJzsnO1xuIH0gO1xuX19wICs9ICdcIj5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIFRvcCBiYXIgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRvcC1iYXJcIiBcXG5cXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIj5cXG5cXG5cXHRcXHRcXHQ8IS0tIE1haW4gdGl0bGUgLS0+XFxuXFx0XFx0XFx0PGg0IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctdGl0bGUgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdXBwZXJjYXNlXCI+XFxuXFx0XFx0XFx0XFx0JyArXG5fX2UoIGRlZmF1bHRzLnRpdGxlIHx8IGZyYXNlcy5UT1BfQkFSLnRpdGxlICkgK1xuJ1xcblxcdFxcdFxcdDwvaDQ+XFxuXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXN0YXRlLWNvbnRcIj5cXG5cXHRcXHRcXHRcXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXN0YXRlLWljb25cIj4gPC9zcGFuPlxcblxcdFxcdFxcdFxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctc3RhdGVcIj48L3NwYW4+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0PCEtLSBBY3Rpb24gYnV0dG9ucyAobWluaW1pemUsIGNsb3NlKSAtLT5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctbWluaW1pemVcIj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tPGEgXFxuXFx0XFx0XFx0XFx0XFx0aHJlZj1cIiNcIiBcXG5cXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJjbG9zZVdpZGdldFwiPlxcblxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdDxzcGFuIHN0eWxlPVwiZm9udC13ZWlnaHQ6IGJvbGRcIj5fPC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdDwvYT4tLT5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8YSBcXG5cXHRcXHRcXHRcXHRcXHRocmVmPVwiI1wiIFxcblxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbidcIlxcblxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCJcXG5cXHRcXHRcXHRcXHRcXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWljb24tcmVtb3ZlXCI+PC9zcGFuPlxcblxcblxcdFxcdFxcdFxcdDwvYT5cXG5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIFRvcCBiYXIgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENvbm5lY3Rpb24gdHlwZXMgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIFxcblxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNob29zZUNvbm5lY3Rpb25cIj5cXG5cXHRcXHRcXHRcXG5cXHRcXHRcXHQ8IS0tIFBhbmVsXFwncyBpbWFnZSBjb250YWluZXIgLS0+XFxuXFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtaGVhZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWRhcmtcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArXG5fX2UoIGRlZmF1bHRzLmNsaWVudFBhdGggKSArXG4nJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UgKSArXG4nKVwiIFxcblxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFRoZSB0ZXh0IGRpc3BsYXllZCBvbiBpbWFnZSAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmFja2Ryb3AtY29udCAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13aGl0ZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxicj5cXG5cXHRcXHRcXHRcXHRcXHQ8cD4nICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2hvb3NlX2Nvbm5fdHlwZSApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcblxcdFxcdFxcdFxcdDxmb3JtIFxcblxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaW5pdC1mb3JtXCIgXFxuXFx0XFx0XFx0XFx0XFx0bmFtZT1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nSW5pdEZvcm1cIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGNoYW5uZWxzLndlYnJ0YykgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRcXHQ8IS0tIERpc3BsYXkgY2FsbCBidXR0b24gaWYgV2ViUlRDIGlzIGVuYWJsZWQgYW5kIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLndlYnJ0Y0VuYWJsZWQpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDYWxsXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNhbGxfYWdlbnRfYnRuICkgK1xuJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwhLS0gSWYgV2ViUlRDIGlzIG5vdCBzdXBwb3J0ZWQgYW5kIGZhbGxiYWNrIGlzIHNldCAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSBpZihjaGFubmVscy53ZWJydGMuZmFsbGJhY2sgJiYgY2hhbm5lbHMud2VicnRjLmZhbGxiYWNrLnNpcENhbGwpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJidXR0b25cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiaW5pdEZhbGxiYWNrQ2FsbFwiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jYWxsX2FnZW50X2J0biApICtcbidcXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIERpc3BsYXkgY2FsbGJhY2sgYnV0dG9uIGlmIGNhbGxiYWNrIHRhc2sgaXMgY29uZmlndXJlZCBpbiB0aGUgc2V0dGluZ3MgLS0+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiBpZihjaGFubmVscy5jYWxsYmFjayAmJiBjaGFubmVscy5jYWxsYmFjay50YXNrKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDYWxsYmFja1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jYWxsYmFja19idG4gKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBJbml0IGNoYXQgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuY2hhdCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDxidXR0b25cXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgYm9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDaGF0XCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNoYXRfYWdlbnRfYnRuICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gQ2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2FuY2VsICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBDb25uZWN0aW9uIHR5cGVzIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIEludHJvIHBhbmUuIERpc3BsYXllZCBpZiBjb25maWd1cmVkIGluIHRoZSBzZXR0aW5ncyBvYmplY3QuICoqKioqIC0tPlxcblxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuaW50cm8ubGVuZ3RoKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBcXG5cXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjcmVkZW50aWFsc1wiPlxcblxcblxcdFxcdFxcdFxcdDwhLS0gUGFuZWxcXCdzIGltYWdlIGNvbnRhaW5lciAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1oZWFkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZGFya1wiIFxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLmludHJvLmJhY2tncm91bmRJbWFnZSkgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgnICtcbl9fZSggZGVmYXVsdHMuY2xpZW50UGF0aCApICtcbicnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLmludHJvLmJhY2tncm91bmRJbWFnZSApICtcbicpXCIgXFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gVGhlIHRleHQgZGlzcGxheWVkIG9uIGltYWdlIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1iYWNrZHJvcC1jb250ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdoaXRlXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGJyPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxwPicgK1xuX19lKCBwYW5lbHMuSU5UUk8uaW50cm9fbWVzc2FnZSApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdFxcdDxmb3JtIFxcblxcdFxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaW50cm8tZm9ybVwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJ0ludHJvRm9ybVwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8IS0tIEl0ZXJhdGluZyBvdmVyIGludHJvIGFycmF5LCB3aGljaCBpcyBhIGxpc3Qgb2YgZmllbGRzIGFuZCB0aGVpciBwcm9wZXJ0aWVzIC0tPlxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gXy5mb3JFYWNoKGRlZmF1bHRzLmludHJvLCBmdW5jdGlvbihpdGVtKXsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGl0ZW0ubmFtZSAhPT0gJ2xhbmcnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PGlucHV0IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCInICtcbigoX190ID0gKCBpdGVtLnR5cGUgfHwgJ3RleHQnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHBsYWNlaG9sZGVyPVwiJyArXG4oKF9fdCA9ICggaXRlbS5wbGFjZWhvbGRlciB8fCBwYW5lbHMuSU5UUk8uUExBQ0VIT0xERVJTW2l0ZW0ubmFtZV0gKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nICc7XG4gaWYoaXRlbS5yZXF1aXJlZCl7IDtcbl9fcCArPSAnICogJztcbiB9IDtcbl9fcCArPSAnXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0bmFtZT1cIicgK1xuX19lKCBpdGVtLm5hbWUgKSArXG4nXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLnNhdmUpeyA7XG5fX3AgKz0gJyB2YWx1ZT1cIicgK1xuX19lKCBjcmVkZW50aWFsc1tpdGVtLm5hbWVdICkgK1xuJ1wiICc7XG4gfSA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJyByZXF1aXJlZCAnO1xuIH0gO1xuX19wICs9ICc+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLm5hbWUgPT09ICdsYW5nJykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDxzZWxlY3QgbmFtZT1cImxhbmdcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChsYW5ndWFnZXMsIGZ1bmN0aW9uKGxhbmcpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHZhbHVlPVwiJyArXG5fX2UoIGxhbmcgKSArXG4nXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihsYW5nID09PSBjdXJyTGFuZykgeyA7XG5fX3AgKz0gJyBzZWxlY3RlZCAnO1xuIH0gO1xuX19wICs9ICcgPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCB0cmFuc2xhdGlvbnNbbGFuZ10ubGFuZyApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDwvc2VsZWN0PlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0PCEtLSBJbml0IGNoYXQgd2l0aCBpbnRybyBwcm9wZXJ0aWVzIC0tPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5JTlRSTy5zdGFydF9kaWFsb2dfYnV0dG9uICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdDwhLS0gQ2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLklOVFJPLmNhbmNlbCApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdDwhLS0gKioqKiogSW50cm8gcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogTWVzc2FnZXMgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2ICBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJtZXNzYWdlc1wiPlxcblxcdFxcdFxcdFxcblxcdFxcdFxcdDwhLS0gTWVzc2FnZXMgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDx1bCBcXG5cXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2VzLWNvbnRcIiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2VzLWNvbnRcIiBcXG5cXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLmhlaWdodCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdGhlaWdodDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5oZWlnaHQgKSArXG4nO1xcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdDwvdWw+XFxuXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdyaXRlLWNvbnRcIj5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8IS0tIEVuZCBkaWFsb2cgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1lbmQtZGlhbG9nLWJ0blwiPlxcblxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiZmluaXNoXCI+JyArXG5fX2UoIHBhbmVscy5NRVNTQUdFUy5lbmRfZGlhbG9nICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFwiQWdlbnQgaXMgdHlwaW5nXCIgaW5kaWNhdG9yIC0tPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sb2FkZXJcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFwiQXR0YWNoIGZpbGVcIiBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0PGxhYmVsIFxcblxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2VuZGZpbGUtY29udFwiIFxcblxcdFxcdFxcdFxcdFxcdGZvcj1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWZpbGUtc2VsZWN0XCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJmaWxlXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1maWxlLXNlbGVjdFwiPlxcblxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdDxzcGFuIFxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaWNvbi11cGxvYWRcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJ1wiPlxcblxcdFxcdFxcdFxcdFxcdDxzcGFuPlxcblxcblxcdFxcdFxcdFxcdDwvbGFiZWw+XFxuXFxuXFx0XFx0XFx0XFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtdGV4dC1jbG9uZVwiICBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1zZy10ZXh0YXJlYS1jbG9uZVwiID48L2Rpdj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIEZpZWxkIGZvciB0eXBpbmcgdGhlIHVzZXIgbWVzc2FnZSAtLT5cXG5cXHRcXHRcXHRcXHQ8dGV4dGFyZWEgXFxuXFx0XFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLXRleHRcIiBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1zZy10ZXh0YXJlYVwiIFxcblxcdFxcdFxcdFxcdFxcdHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5NRVNTQUdFUy5QTEFDRUhPTERFUlMubWVzc2FnZSApICtcbidcIiBcXG5cXHRcXHRcXHRcXHRcXHRtYXhsZW5ndGg9XCIxMDAwXCI+PC90ZXh0YXJlYT5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8IS0tIFwiU2VuZCBhIG1lc3NhZ2VcIiBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0PGEgXFxuXFx0XFx0XFx0XFx0XFx0aHJlZj1cIiNcIiBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmRtc2ctYnRuICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvblwiIFxcblxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cInNlbmRNZXNzYWdlXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4gXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1pY29uLXBhcGVyLXBsYW5lXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8L3NwYW4+XFxuXFx0XFx0XFx0XFx0PC9hPlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogTWVzc2FnZXMgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogT2ZmbGluZSBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgXFxuXFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwic2VuZGVtYWlsXCI+XFxuXFxuXFx0XFx0XFx0PCEtLSBQYW5lbFxcJ3MgaW1hZ2UgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWhlYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1kYXJrXCIgXFxuXFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy5zdHlsZXMuc2VuZG1haWwuYmFja2dyb3VuZEltYWdlKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgK1xuX19lKCBkZWZhdWx0cy5jbGllbnRQYXRoICkgK1xuJycgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMuc2VuZG1haWwuYmFja2dyb3VuZEltYWdlICkgK1xuJylcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICc+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBUaGUgdGV4dCBkaXNwbGF5ZWQgb24gaW1hZ2UgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJhY2tkcm9wLWNvbnQgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZGFya1wiPlxcblxcdFxcdFxcdFxcdFxcdDxwPicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5vZmZsaW5lX21lc3NhZ2UgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8aDQgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy11cHBlcmNhc2VcIj4nICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuc2VuZF9tZXNzYWdlX2hlYWRlciApICtcbic8L2g0PlxcblxcdFxcdFxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2VuZG1haWwtZm9ybVwiIGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwidW5hbWVcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5QTEFDRUhPTERFUlMudW5hbWUgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJlbWFpbFwiIG5hbWU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLlBMQUNFSE9MREVSUy5lbWFpbCApICtcbicgKlwiIHJlcXVpcmVkPlxcblxcdFxcdFxcdFxcdFxcdDx0ZXh0YXJlYSBuYW1lPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLlBMQUNFSE9MREVSUy5tZXNzYWdlICkgK1xuJ1wiIG1heGxlbmd0aD1cIjE1MDBcIj48L3RleHRhcmVhPlxcblxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJmaWxlXCIgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jb250YWN0ZmlsZVwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaW5wdXRmaWxlXCIgLz5cXG5cXHRcXHRcXHRcXHRcXHQ8bGFiZWwgZm9yPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY29udGFjdGZpbGVcIj4nICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuY2hvb3NlX2ZpbGUgKSArXG4nPC9sYWJlbD5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIFwiU2VuZCBvZmZsaW5lIG1lc3NhZ2VcIiBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwic3VibWl0XCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuc2VuZF9tZXNzYWdlX2J1dHRvbiApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIENsb3NlIHdpZGdldCBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCI+JyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLmNsb3NlICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBPZmZsaW5lIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENsb3NlIGNoYXQgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIFxcblxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNsb3NlY2hhdFwiPlxcblxcblxcdFxcdFxcdDwhLS0gUGFuZWxcXCdzIGltYWdlIGNvbnRhaW5lciAtLT5cXG5cXHRcXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1oZWFkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2hpdGVcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy5jbG9zZUNoYXQuYmFja2dyb3VuZEltYWdlKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgK1xuX19lKCBkZWZhdWx0cy5jbGllbnRQYXRoICkgK1xuJycgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMuY2xvc2VDaGF0LmJhY2tncm91bmRJbWFnZSApICtcbicpXCIgXFxuXFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnPlxcblxcblxcdFxcdFxcdFxcdDwhLS0gVGhlIHRleHQgZGlzcGxheWVkIG9uIGltYWdlIC0tPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1iYWNrZHJvcC1jb250ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdoaXRlXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGJyPlxcblxcdFxcdFxcdFxcdFxcdDxwPicgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5jbG9zZV9jaGF0X2hlYWRlciApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2xvc2VjaGF0LWZvcm1cIiBkYXRhLXZhbGlkYXRlLWZvcm09XCJ0cnVlXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGxhYmVsIGZvcj1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmQtZGlhbG9nXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJzZW5kRGlhbG9nXCIgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zZW5kLWRpYWxvZ1wiIC8+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+JyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULnNlbmRfZGlhbG9nX2xhYmVsICkgK1xuJzwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHQ8L2xhYmVsPlxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwiZW1haWxcIiBuYW1lPVwiZW1haWxcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5QTEFDRUhPTERFUlMuZW1haWwgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0PHNlbGVjdCBuYW1lPVwicmF0aW5nXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIlwiPi0tLSAnICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQucmF0ZV9hZ2VudCApICtcbicgLS0tPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIjVcIj4nICtcbl9fZSggZnJhc2VzLkFHRU5UX1JBVEVTLmV4Y2VsbGVudCApICtcbic8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiNFwiPicgK1xuX19lKCBmcmFzZXMuQUdFTlRfUkFURVMuZ29vZCApICtcbic8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiM1wiPicgK1xuX19lKCBmcmFzZXMuQUdFTlRfUkFURVMuZmFpciApICtcbic8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiMlwiPicgK1xuX19lKCBmcmFzZXMuQUdFTlRfUkFURVMuYmFkICkgK1xuJzwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdDwvc2VsZWN0PlxcblxcdFxcdFxcdFxcdFxcdDx0ZXh0YXJlYSBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5QTEFDRUhPTERFUlMuY29tbWVudCApICtcbidcIiBuYW1lPVwidGV4dFwiIG1heGxlbmd0aD1cIjE1MDBcIj48L3RleHRhcmVhPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gRW5kIGNoYXQgYW5kIGNsb3NlIHdpZGdldCBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwic3VibWl0XCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuZmluaXNoX2RpYWxvZ19idXR0b24gKSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBcIkJhY2sgdG8gdGhlIGNoYXRcIiBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNtZXNzYWdlc1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCI+JyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULmJhY2sgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIENsb3NlIGNoYXQgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogQXVkaW8gY2FsbCBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY2FsbEFnZW50XCI+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsLXNwaW5uZXJcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNwaW5uZXItcGFuZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCI+JyArXG5fX2UoIHBhbmVscy5BVURJT19DQUxMLmNvbmZpcm1fYWNjZXNzICkgK1xuJzwvaDM+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbG9hZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNob3duXCIgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmU7XCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PC9oMz5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbC1pbmZvXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oaWRkZW5cIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbC1zdGF0ZVwiPicgK1xuX19lKCBwYW5lbHMuQVVESU9fQ0FMTC5jYWxsaW5nX2FnZW50ICkgK1xuJzwvaDM+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGwtdGltZXJcIj4wMDowMDwvaDM+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0XFx0PGZvcm0gaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsLWNvbnRyb2xcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aHI+XFxuXFx0XFx0XFx0XFx0XFx0PGJ1dHRvblxcblxcdFxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdHJ5YWdhaW4tYnRuXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9jayAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oaWRkZW5cIlxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiaW5pdENhbGxcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkFVRElPX0NBTEwudHJ5X2FnYWluICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcdFxcblxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImJ1dHRvblwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXdhcm4gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIlxcblxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImVuZENhbGxcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkFVRElPX0NBTEwuZW5kX2NhbGwgKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQXVkaW8gY2FsbCBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBBdWRpbyBjYWxsIGZhbGxiYWNrIHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjYWxsQWdlbnRGYWxsYmFja1wiPlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aDM+JyArXG5fX2UoIHBhbmVscy5BVURJT19DQUxMX0ZBTExCQUNLLkRPV05MT0FEX01TRyApICtcbic8L2gzPlxcblxcdFxcdFxcdFxcdFxcdDxicj5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLndlYnJ0YyAmJiBkZWZhdWx0cy53ZWJydGMuZmFsbGJhY2spIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiJyArXG5fX2UoIGRlZmF1bHRzLndlYnJ0Yy5mYWxsYmFjay5zaXBDYWxsICkgK1xuJ1wiPmNhbGwuam5scDwvYT5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHRcXHRcXHQ8Zm9ybT5cXG5cXHRcXHRcXHRcXHRcXHQ8aHI+XFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNjaG9vc2VDb25uZWN0aW9uXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmJhY2sgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIEF1ZGlvIGNhbGwgZmFsbGJhY2sgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogQ2FsbGJhY2sgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIFxcblxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNhbGxiYWNrXCI+XFxuXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsYmFjay1zcGlubmVyXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oaWRkZW4gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc3Bpbm5lci1wYW5lXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLnNlbmRpbmdfcmVxdWVzdCApICtcbic8L2gzPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWxvYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zaG93blwiIHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlO1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdDwvaDM+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0XFx0PGZvcm0gaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsYmFjay1zZXR0aW5nc1wiPlxcblxcdFxcdFxcdFxcdFxcdDxwIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLnRpdGxlICkgK1xuJzwvcD5cXG5cXHRcXHRcXHRcXHRcXHQ8aHI+XFxuXFx0XFx0XFx0XFx0XFx0PGxhYmVsPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suTEFCRUxTLnBob25lICkgK1xuJzwvbGFiZWw+XFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJ0ZWxcIiBuYW1lPVwicGhvbmVcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suUExBQ0VIT0xERVJTLnBob25lICkgK1xuJ1wiIHJlcXVpcmVkPlxcblxcdFxcdFxcdFxcdFxcdDxsYWJlbD4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLkxBQkVMUy50aW1lICkgK1xuJzwvbGFiZWw+XFxuXFx0XFx0XFx0XFx0XFx0PHNlbGVjdCBuYW1lPVwidGltZVwiPlxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gXy5mb3JFYWNoKHBhbmVscy5DQUxMQkFDSy5USU1FX1BPSU5UUywgZnVuY3Rpb24ocG9pbnQpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiJyArXG5fX2UoIHBvaW50Lm1pbnV0ZXMgKSArXG4nXCI+JyArXG5fX2UoIHBvaW50LmxhYmVsICkgK1xuJzwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PC9zZWxlY3Q+XFxuXFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcblxcdFxcdFxcdFxcdFxcdDxidXR0b25cXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwic3VibWl0XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJzZXRDYWxsYmFja1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suY29uZmlybV9jYWxsYmFjayApICtcbidcXG5cXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI2Nob29zZUNvbm5lY3Rpb25cIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suYmFjayApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQ2FsbGJhY2sgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogQ2FsbGJhY2sgc2VudCBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY2FsbGJhY2tTZW50XCI+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsYmFjay1zZW50XCI+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaWNvbi1jaGVjayAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LXN1Y2Nlc3NcIj48L2gzPlxcblxcdFxcdFxcdFxcdFxcdDxwIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLnJlcXVlc3Rfc2VudCApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0XFx0PGZvcm0+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjY2hvb3NlQ29ubmVjdGlvblwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5iYWNrICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmNsb3NlICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBDYWxsYmFjayBzZW50IHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHQ8L2Rpdj5cXG5cXHQ8IS0tICoqKioqIFBhbmVzIGNvbnRhaW5lciBlbmRzICoqKioqIC0tPlxcblxcblxcdDwhLS0gKioqKiogRmxvYXRpbmcgYnV0dG9uIGNvbnRhaW5lciAqKioqKiAtLT5cXG5cXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnRuLWNvbnRcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ0bi1jb250XCI+XFxuXFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLWJ0blwiPlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sYXN0bXNnLWNvbnRcIj5cXG5cXHRcXHRcXHRcXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVubm90aWZ5LWJ0blwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdW5ub3RpZnktYnRuXCI+JyArXG5fX2UoIGZyYXNlcy5GTE9BVElOR19CVVRUT04uY2xvc2UgKSArXG4nPC9zcGFuPlxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sYXN0bXNnXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sYXN0bXNnXCI+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFx0XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ0bi1saW5rXCI+XFxuXFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idG4taWNvblwiPjwvc3Bhbj5cXG5cXHRcXHRcXHQ8L2E+XFxuXFx0XFx0PC9kaXY+XFxuXFx0PC9kaXY+XFxuXFx0PCEtLSAqKioqKiBGbG9hdGluZyBidXR0b24gY29udGFpbmVyIGVuZHMgKioqKiogLS0+XFxuXFxuPC9kaXY+JztcblxufVxucmV0dXJuIF9fcFxufSIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciBldmVudHMgPSB7fSxcbi8vIEpzU0lQID0gcmVxdWlyZSgnLi9qc3NpcC5taW4uanMnKSxcbkpzU0lQID0gZ2xvYmFsLkpzU0lQLFxub3B0aW9ucyxcbnNpcENsaWVudCxcbnNpcFNlc3Npb24sXG5zaXBDYWxsRXZlbnRzO1xuXG5mdW5jdGlvbiBpc1dlYnJ0Y1N1cHBvcnRlZCgpe1xuXHR2YXIgUlRDID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8IHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fCB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb24sXG5cdFx0dXNlck1laWRhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhLFxuXHRcdGljZSA9IHdpbmRvdy5tb3pSVENJY2VDYW5kaWRhdGUgfHwgd2luZG93LlJUQ0ljZUNhbmRpZGF0ZTtcblxuXHRyZXR1cm4gISFSVEMgJiYgISF1c2VyTWVpZGEgJiYgISFpY2U7XG59XG5cbmZ1bmN0aW9uIGluaXRKc1NJUEV2ZW50cygpe1xuXHRzaXBDbGllbnQub24oJ2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCBjb25uZWN0ZWQgZXZlbnQ6ICcsIGUpOyB9KTtcblx0c2lwQ2xpZW50Lm9uKCdkaXNjb25uZWN0ZWQnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgZGlzY29ubmVjdGVkIGV2ZW50OiAnLCBlKTsgfSk7XG5cdHNpcENsaWVudC5vbignbmV3TWVzc2FnZScsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCBuZXdNZXNzYWdlIGV2ZW50OiAnLCBlKTsgfSk7XG5cdHNpcENsaWVudC5vbignbmV3UlRDU2Vzc2lvbicsIGZ1bmN0aW9uKGUpe1xuXHRcdGRlYnVnLmxvZygnc2lwIG5ld1JUQ1Nlc3Npb24gZXZlbnQ6ICcsIGUpO1xuXHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvbmV3UlRDU2Vzc2lvbicsIGUpO1xuXHRcdC8vIGlmKGUuc2Vzc2lvbi5kaXJlY3Rpb24gPT09ICdvdXRnb2luZycpXG5cdFx0Ly8gXHRldmVudHMuZW1pdCgnd2VicnRjL291dGdvaW5nQ2FsbCcsIGUpO1xuXHRcdC8vIGVsc2Vcblx0XHQvLyBcdGV2ZW50cy5lbWl0KCd3ZWJydGMvaW5jb21pbmdDYWxsJywgZSk7XG5cdFx0XG5cdFx0XHRzaXBTZXNzaW9uID0gZS5zZXNzaW9uO1xuXHR9KTtcblx0c2lwQ2xpZW50Lm9uKCdyZWdpc3RlcmVkJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIHJlZ2lzdGVyZWQgZXZlbnQ6ICcsIGUpOyB9KTtcblx0c2lwQ2xpZW50Lm9uKCd1bnJlZ2lzdGVyZWQnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgdW5yZWdpc3RlcmVkIGV2ZW50OiAnLCBlKTsgfSk7XG5cdHNpcENsaWVudC5vbigncmVnaXN0cmF0aW9uRmFpbGVkJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIHJlZ2lzdHJhdGlvbkZhaWxlZCBldmVudDogJywgZSk7IH0pO1xuXG5cdHNpcENhbGxFdmVudHMgPSB7XG5cdFx0cHJvZ3Jlc3M6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZGVidWcubG9nKCdjYWxsIHByb2dyZXNzIGV2ZW50OiAnLCBlKTtcblx0XHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvcHJvZ3Jlc3MnLCBlKTtcblx0XHR9LFxuXHRcdGZhaWxlZDogZnVuY3Rpb24oZSl7XG5cdFx0XHRkZWJ1Zy5sb2coJ2NhbGwgZmFpbGVkIGV2ZW50OicsIGUpO1xuXHRcdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9mYWlsZWQnLCBlKTtcblx0XHR9LFxuXHRcdGVuZGVkOiBmdW5jdGlvbihlKXtcblx0XHRcdGRlYnVnLmxvZygnY2FsbCBlbmRlZCBldmVudDogJywgZSk7XG5cdFx0XHRldmVudHMuZW1pdCgnd2VicnRjL2VuZGVkJywgZSk7XG5cdFx0fSxcblx0XHRjb25maXJtZWQ6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZGVidWcubG9nKCdjYWxsIGNvbmZpcm1lZCBldmVudDogJywgZSk7XG5cdFx0XHRldmVudHMuZW1pdCgnd2VicnRjL2NvbmZpcm1lZCcsIGUpO1xuXHRcdH0sXG5cdFx0YWRkc3RyZWFtOiBmdW5jdGlvbihlKXtcblx0XHRcdGRlYnVnLmxvZygnY2FsbCBhZGRzdHJlYW0gZXZlbnQ6ICcsIGUpO1xuXHRcdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9hZGRzdHJlYW0nLCBlKTtcblx0XHRcdHZhciBzdHJlYW0gPSBlLnN0cmVhbTtcblx0XHRcdG9wdGlvbnMuYXVkaW9SZW1vdGUgPSBKc1NJUC5ydGNuaW5qYS5hdHRhY2hNZWRpYVN0cmVhbShvcHRpb25zLmF1ZGlvUmVtb3RlLCBzdHJlYW0pO1xuXHRcdH1cblx0XHQvLyBzZHA6IGZ1bmN0aW9uKGUpe1xuXHRcdC8vIFx0ZGVidWcubG9nKCdzZHA6ICcsIGUpO1xuXHRcdC8vIH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaXNFc3RhYmxpc2hlZCgpe1xuXHRyZXR1cm4gc2lwU2Vzc2lvbi5pc0VzdGFibGlzaGVkKCk7XG59XG5cbmZ1bmN0aW9uIGlzSW5Qcm9ncmVzcygpe1xuXHRyZXR1cm4gc2lwU2Vzc2lvbi5pc0luUHJvZ3Jlc3MoKTtcbn1cblxuZnVuY3Rpb24gaXNFbmRlZCgpe1xuXHRyZXR1cm4gc2lwU2Vzc2lvbi5pc0VuZGVkKCk7XG59XG5cbmZ1bmN0aW9uIHVucmVnaXN0ZXIoKXtcblx0c2lwQ2xpZW50LnN0b3AoKTtcbn1cblxuZnVuY3Rpb24gYXVkaW9jYWxsKG51bWJlcil7XG5cdHNpcFNlc3Npb24gPSBzaXBDbGllbnQuY2FsbChudW1iZXIsIHtcblx0XHRldmVudEhhbmRsZXJzOiBzaXBDYWxsRXZlbnRzLFxuXHRcdG1lZGlhQ29uc3RyYWludHM6IHsgYXVkaW86IHRydWUsIHZpZGVvOiBmYWxzZSB9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiB0ZXJtaW5hdGUoKXtcblx0c2lwU2Vzc2lvbi50ZXJtaW5hdGUoe1xuXHRcdHN0YXR1c19jb2RlOiAyMDBcblx0fSk7XG5cdC8vIHNpcENsaWVudC50ZXJtaW5hdGVTZXNzaW9ucygpO1xufVxuXG5mdW5jdGlvbiBhbnN3ZXIoKXtcblx0ZGVidWcubG9nKCdhbnN3ZXI6ICcsc2lwQ2xpZW50KTtcblx0c2lwU2Vzc2lvbi5hbnN3ZXIoKTtcbn1cblxuZnVuY3Rpb24gaG9sZCgpe1xuXHRkZWJ1Zy5sb2coJ2hvbGQ6ICcsIHNpcFNlc3Npb24uaXNPbkhvbGQoKSk7XG5cdGlmKHNpcFNlc3Npb24gJiYgc2lwU2Vzc2lvbi5pc09uSG9sZCgpLmxvY2FsKSB7XG5cdFx0c2lwU2Vzc2lvbi51bmhvbGQoKTtcblx0fSBlbHNlIHtcblx0XHRzaXBTZXNzaW9uLmhvbGQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZW1vdGVBdWRpbygpe1xuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHRlbC5zZXRBdHRyaWJ1dGUoJ2F1dG9wbGF5JywgJ2F1dG9wbGF5Jyk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuXHRyZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0cyl7XG5cdGRlYnVnLmxvZygnSW5pdGlhdGluZyBXZWJSVEMgbW9kdWxlOicsIG9wdHMpO1xuXHRvcHRpb25zID0gb3B0cztcblx0aWYob3B0aW9ucy5zaXAucmVnaXN0ZXIgPT09IHVuZGVmaW5lZCkgb3B0aW9ucy5zaXAucmVnaXN0ZXIgPSBmYWxzZTtcblxuXHQvLyAhIWdldCByaWQgb2YgdGhpcyEhXG5cdGV2ZW50cy5lbWl0ID0gb3B0cy5lbWl0O1xuXHRldmVudHMub24gPSBvcHRzLm9uO1xuXHQvLyAhIWdldCByaWQgb2YgdGhpcyEhXG5cblx0b3B0aW9ucy5hdWRpb1JlbW90ZSA9IGNyZWF0ZVJlbW90ZUF1ZGlvKCk7XG5cdHNpcENsaWVudCA9IG5ldyBKc1NJUC5VQShvcHRpb25zLnNpcCk7XG5cdGluaXRKc1NJUEV2ZW50cygpO1xuXHRzaXBDbGllbnQuc3RhcnQoKTtcblx0Ly8gcmV0dXJuIHNpcENsaWVudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGxpYjogSnNTSVAsXG5cdGluaXQ6IGluaXQsXG5cdHVucmVnaXN0ZXI6IHVucmVnaXN0ZXIsXG5cdGF1ZGlvY2FsbDogYXVkaW9jYWxsLFxuXHR0ZXJtaW5hdGU6IHRlcm1pbmF0ZSxcblx0YW5zd2VyOiBhbnN3ZXIsXG5cdGhvbGQ6IGhvbGQsXG5cdGlzSW5Qcm9ncmVzczogaXNJblByb2dyZXNzLFxuXHRpc0VzdGFibGlzaGVkOiBpc0VzdGFibGlzaGVkLFxuXHRpc0VuZGVkOiBpc0VuZGVkLFxuXHRpc1N1cHBvcnRlZDogaXNXZWJydGNTdXBwb3J0ZWRcbn07IiwidmFyIGRvbWlmeSA9IHJlcXVpcmUoJ2RvbWlmeScpO1xudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUnKTtcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpO1xudmFyIGZyYXNlcyA9IG51bGw7XG52YXIgY29icm93c2luZyA9IHJlcXVpcmUoJy4vY29icm93c2luZycpO1xudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG52YXIgV2ViUlRDID0gcmVxdWlyZSgnLi93ZWJydGMnKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoJy4vYXVkaW8tY29udHJvbCcpO1xuLy8gdmFyIHNlcnZlclVybCA9IHt9O1xudmFyIGZvcm1zO1xudmFyIGFwaTtcblxuLy8gV2lkZ2V0IGluaXRpYXRpb24gb3B0aW9uc1xudmFyIGRlZmF1bHRzID0ge1xuXHQvLyBwcmVmaXggZm9yIENTUyBjbGFzc2VzIGFuZCBpZHMuIFxuXHQvLyBDaGFuZ2UgaXQgb25seSBpZiB0aGUgZGVmYXVsdCBwcmVmaXggXG5cdC8vIG1hdGNoZXMgd2l0aCBleGlzdGVkIGNsYXNzZXMgb3IgaWRzIG9uIHRoZSB3ZWJzaXRlXG5cdHByZWZpeDogJ3N3YycsXG5cdC8vIEluaXQgbW9kdWxlIG9uIHBhZ2UgbG9hZFxuXHRhdXRvU3RhcnQ6IHRydWUsXG5cdC8vIHdoZXRoZXIgb3Igbm90IHRvIGFzayB1c2VyIFxuXHQvLyB0byBpbnRyb2R1Y2UgaGltIHNlbGYgYmVmb3JlIHRoZSBjaGF0IHNlc3Npb25cblx0aW50cm86IGZhbHNlLFxuXHQvLyB3aGV0aGVyIG9yIG5vdCB0byBhZGQgd2lkZ2V0IHRvIHRoZSB3ZWJwYWdlXG5cdHdpZGdldDogdHJ1ZSxcblx0Ly8gZW5hYmxlIGNoYXQgZmVhdHVyZVxuXHRjaGF0OiB0cnVlLFxuXHQvLyBjaGFubmVscyBzZXR0aW5nc1xuXHRjaGFubmVsczoge1xuXHRcdHdlYnJ0Yzoge30sXG5cdFx0Y2FsbGJhY2s6IHt9XG5cdH0sXG5cdC8vIGVuYWJsZSBjb2Jyb3dzaW5nIGZlYXR1cmVcblx0Y29icm93c2luZzogZmFsc2UsXG5cdC8vIERPTSBlbGVtZW50W3NdIHNlbGVjdG9yIHRoYXQgb3BlbnMgYSB3aWRnZXRcblx0YnV0dG9uU2VsZWN0b3I6IFwiXCIsXG5cdHJlQ3JlYXRlU2Vzc2lvbjogdHJ1ZSxcblx0dGl0bGU6ICcnLFxuXHRsYW5nOiAnZW4nLFxuXHRsYW5nRnJvbVVybDogZmFsc2UsXG5cdHBvc2l0aW9uOiAncmlnaHQnLFxuXHRoaWRlT2ZmbGluZUJ1dHRvbjogZmFsc2UsXG5cdG9mZmVyOiBmYWxzZSxcblx0c3R5bGVzOiB7XG5cdFx0cHJpbWFyeToge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAnIzc0YjlmZicsXG5cdFx0XHRjb2xvcjogJyNGRkZGRkYnXG5cdFx0fSxcblx0XHRpbnRybzoge1xuXHRcdFx0Ly8gYmFja2dyb3VuZEltYWdlOiBcImltYWdlcy9iZ3ItMDIuanBnXCJcblx0XHR9LFxuXHRcdHNlbmRtYWlsOiB7XG5cdFx0XHQvLyBiYWNrZ3JvdW5kSW1hZ2U6IFwiaW1hZ2VzL2Jnci0wMS5qcGdcIlxuXHRcdH0sXG5cdFx0Y2xvc2VDaGF0OiB7XG5cdFx0XHQvLyBiYWNrZ3JvdW5kSW1hZ2U6IFwiaW1hZ2VzL2Jnci0wMi5qcGdcIlxuXHRcdH1cblx0fSxcblx0YnV0dG9uU3R5bGVzOiB7XG5cdFx0b25saW5lOiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDE3NSwyMjksMjU1LDAuOCknLFxuXHRcdFx0Y29sb3I6ICcnXG5cdFx0fSxcblx0XHRvZmZsaW5lOiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI0MSwyNDEsMjQxLDAuOCknLFxuXHRcdFx0Y29sb3I6ICcnXG5cdFx0fSxcblx0XHR0aW1lb3V0OiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI0MSwyNDEsMjQxLDAuOCknLFxuXHRcdFx0Y29sb3I6ICcnXG5cdFx0fSxcblx0XHRub3RpZmllZDoge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgyNTMsMjUwLDEyOSwwLjgpJyxcblx0XHRcdGNvbG9yOiAnJ1xuXHRcdH0sXG5cdFx0Y29sb3I6ICdyZ2IoNzAsNzAsNzApJ1xuXHR9LFxuXHR3aWRnZXRXaW5kb3dPcHRpb25zOiAnbGVmdD0xMCx0b3A9MTAsd2lkdGg9MzUwLGhlaWdodD01NTAscmVzaXphYmxlJyxcblx0Ly8gYWJzb2x1dGUgcGF0aCB0byB0aGUgd2NoYXQgZm9sZGVyXG5cdHBhdGg6ICcvaXBjYy93ZWJjaGF0LycsXG5cdC8vIGFic29sdXRlIHBhdGggdG8gdGhlIGNsaWVudHMgZmlsZXMuIElmIG5vdCBzZXQsIGZpbGVzIHJlcXVlc3RlZCBmcm9tIGRlZmF1bHRzLnNlcnZlciArIGRlZmF1bHRzLnBhdGguXG5cdGNsaWVudFBhdGg6ICdodHRwczovL2Nkbi5zbWlsZS1zb2Z0LmNvbS93Y2hhdC92MS8nLFxuXHQvLyBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBjc3MgZmxpZVxuXHRzdHlsZXNQYXRoOiAnJyxcblx0Ly8gYWJzb2x1dGUgcGF0aCB0byB0aGUgdHJhbnNsYXRpb25zLmpzb24gZmxpZVxuXHR0cmFuc2xhdGlvbnNQYXRoOiAnJyxcblx0Ly8gaW4gc2Vjb25kc1xuXHQvLyBjaGVja1N0YXR1c1RpbWVvdXQ6IDEwLFxuXHQvLyBpbiBzZWNvbmRzXG5cdC8vIGdldE1lc3NhZ2VzVGltZW91dDogMSxcblx0Ly8gZGlzcGxheWVkIGluIHRoZSBlbWFpbCB0ZW1wbGF0ZVxuXHRob3N0OiB3aW5kb3cubG9jYXRpb24uaG9zdCxcblx0Ly8gd2VicnRjIG9wdGlvbnNcblx0Ly8gd2VicnRjOiB7XG5cdC8vIFx0c2lwOiB7fSxcblx0Ly8gXHRob3RsaW5lOiAnJyxcblx0Ly8gXHRmYWxsYmFjazogZmFsc2Vcblx0Ly8gfSxcblx0d2VicnRjRW5hYmxlZDogZmFsc2UsXG5cdC8vIGNhbGxiYWNrOiB7XG5cdC8vIFx0dGFzazogJydcblx0Ly8gfVxufTtcblxudmFyIGdsb2JhbFNldHRpbmdzID0gXCJXY2hhdFNldHRpbmdzXCI7XG5cbi8vIEN1cnJlbnQgd2lkZ2V0IHN0YXRlXG52YXIgd2lkZ2V0U3RhdGUgPSB7XG5cdGluaXRpYXRlZDogZmFsc2UsXG5cdGFjdGl2ZTogZmFsc2UsXG5cdHN0YXRlOiAnJywgLy8gXCJvbmxpbmVcIiB8IFwib2ZmbGluZVwiIHwgXCJ0aW1lb3V0XCIsXG5cdHNoYXJlOiBmYWxzZSxcblx0c291bmRzOiB0cnVlXG59O1xuXG52YXIgZGlhbG9nID0gW107XG5cbi8vIGF2YWlsYWJsZSBkaWFsb2cgbGFuZ3VhZ2VzXG52YXIgbGFuZ3MgPSBbXTtcbnZhciBjdXJyTGFuZyA9ICcnO1xuLy8gdmFyIG1lc3NhZ2VzVGltZW91dDtcbi8vIHZhciBub01lc3NhZ2VzVGltZW91dDtcbi8vIHZhciBnZXRMYW5ndWFnZXNJbnRlcnZhbDtcbnZhciBjaGF0VGltZW91dDtcbnZhciBtb3VzZUZvY3VzZWQgPSBmYWxzZTtcbi8vIENvbnRhaW5lciBmb3IgbWVzc2FnZXNcbi8vIHZhciBtZXNzYWdlc0NvbnQ7XG4vLyBXaWRnZXQgZG9tIGVsZW1lbnRcbnZhciB3aWRnZXQ7XG5cbi8vIFdpZGdldCBpbiBhIHNlcGFyYXRlIHdpbmRvd1xudmFyIHdpZGdldFdpbmRvdztcbi8vIFdpZGdldCBwYW5lcyBlbGVtZW50c1xuLy8gdmFyIHBhbmVzO1xudmFyIGFnZW50SXNUeXBpbmdUaW1lb3V0O1xudmFyIHVzZXJJc1R5cGluZ1RpbWVvdXQ7XG52YXIgdGltZXJVcGRhdGVJbnRlcnZhbDtcbnZhciBwb2xsVHVybnMgPSAxO1xuLy8gdmFyIHJpbmdUb25lID0gbnVsbCxcbi8vIHZhciByaW5nVG9uZUludGVydmFsID0gbnVsbDtcblxudmFyIHB1YmxpY0FwaSA9IHtcblxuXHRpbml0TW9kdWxlOiBpbml0TW9kdWxlLFxuXHRpbml0V2lkZ2V0U3RhdGU6IGluaXRXaWRnZXRTdGF0ZSxcblx0b3BlbldpZGdldDogb3BlbldpZGdldCxcblx0aW5pdENoYXQ6IGluaXRDaGF0LFxuXHRpbml0Q2FsbDogaW5pdENhbGwsXG5cdGdldFdpZGdldEVsZW1lbnQ6IGdldFdpZGdldEVsZW1lbnQsXG5cdGlzV2VicnRjU3VwcG9ydGVkOiBXZWJSVEMuaXNTdXBwb3J0ZWQsXG5cdGdldFdpZGdldFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2lkZ2V0U3RhdGU7XG5cdH0sXG5cdGdldEVudGl0eTogZnVuY3Rpb24oKXsgcmV0dXJuIHN0b3JhZ2UuZ2V0U3RhdGUoJ2VudGl0eScsICdzZXNzaW9uJyk7IH0sXG5cdG9uOiBmdW5jdGlvbihldnQsIGxpc3RlbmVyKSB7XG5cdFx0YXBpLm9uKGV2dCwgbGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRlbWl0OiBmdW5jdGlvbiAoZXZ0LCBsaXN0ZW5lcil7XG5cdFx0YXBpLmVtaXQoZXZ0LCBsaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdC8qKlxuXHQgKiBTZXQgZGVmYXVsdCB1c2VyIGNyZWRlbnRpYWxzLlxuXHQgKiBJZiBcImludHJvXCIgaXMgZmFsc2UsIHRoYW4gZGlhbG9nIHdpbGwgc3RhcnQgd2l0aCB0aGVzZSBjcmVkZW50aWFscy5cblx0ICogTk9URTogTXVzdCBiZSBjYWxsZWQgYmVmb3JlIGluaXRNb2R1bGUgbWV0aG9kXG5cdCAqIFxuXHQgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gVXNlciBjcmVkZW50aWFscywgaS5lLiBcInVuYW1lXCIsIFwibGFuZ1wiLCBcInBob25lXCIsIFwic3ViamVjdFwiXG5cdCAqL1xuXHRzZXREZWZhdWx0Q3JlZGVudGlhbHM6IGZ1bmN0aW9uKHBhcmFtcykge1xuXHRcdGRlZmF1bHRzLmNyZWRlbnRpYWxzID0gcGFyYW1zO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bW9kdWxlOiBXaWRnZXQsXG5cdGFwaTogcHVibGljQXBpXG59O1xuXG4vLyBJbml0aWF0ZSB0aGUgbW9kdWxlIHdpdGggdGhlIGdsb2JhbCBzZXR0aW5nc1xuaWYoZ2xvYmFsW2dsb2JhbFNldHRpbmdzXSAmJiBnbG9iYWxbZ2xvYmFsU2V0dGluZ3NdLmF1dG9TdGFydCAhPT0gZmFsc2UgJiYgZGVmYXVsdHMuYXV0b1N0YXJ0KSB7XG5cdGlmKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIiB8fCBkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImludGVyYWN0aXZlXCIpIHtcblx0ICAgIFdpZGdldChnbG9iYWxbZ2xvYmFsU2V0dGluZ3NdKTtcblx0fSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkgeyBXaWRnZXQoZ2xvYmFsW2dsb2JhbFNldHRpbmdzXSk7IH0sIGZhbHNlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBXaWRnZXQob3B0aW9ucyl7XG5cblx0aWYod2lkZ2V0U3RhdGUuaW5pdGlhdGVkKSByZXR1cm4gcHVibGljQXBpO1xuXG5cdF8ubWVyZ2UoZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXHQvLyBfLmFzc2lnbihkZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cblx0ZGVidWcubG9nKCdXaWRnZXQ6ICcsIG9wdGlvbnMpO1xuXG5cdGRlZmF1bHRzLmNsaWVudFBhdGggPSBvcHRpb25zLmNsaWVudFBhdGggPyBvcHRpb25zLmNsaWVudFBhdGggOiAoZGVmYXVsdHMuY2xpZW50UGF0aCB8fCAoZGVmYXVsdHMuc2VydmVyICsgZGVmYXVsdHMucGF0aCkpO1xuXG5cdGFkZFdpZGdldFN0eWxlcygpO1xuXHRpZihkZWZhdWx0cy5idXR0b25TZWxlY3RvcikgXG5cdFx0c2V0SGFuZGxlcnMoZGVmYXVsdHMuYnV0dG9uU2VsZWN0b3IpO1xuXHRcblx0Ly8gc2VydmVyVXJsID0gcmVxdWlyZSgndXJsJykucGFyc2UoZGVmYXVsdHMuc2VydmVyLCB0cnVlKTtcblxuXHQvLyBFbmFibGluZyBhdWRpbyBtb2R1bGVcblx0YXVkaW8uaW5pdChkZWZhdWx0cy5jbGllbnRQYXRoKydzb3VuZHMvJyk7XG5cblx0YXBpID0gbmV3IGNvcmUob3B0aW9ucylcblx0Lm9uKCdzZXNzaW9uL2NyZWF0ZScsIG9uU2Vzc2lvblN1Y2Nlc3MpXG5cdC5vbignc2Vzc2lvbi9jb250aW51ZScsIG9uU2Vzc2lvblN1Y2Nlc3MpXG5cdC5vbignc2Vzc2lvbi9qb2luJywgb25TZXNzaW9uSm9pbilcblx0Lm9uKCdzZXNzaW9uL2Rpc2pvaW4nLCBvblNlc3Npb25EaXNqb2luKVxuXHQub24oJ3Nlc3Npb24vaW5pdCcsIG9uU2Vzc2lvbkluaXQpO1xuXHQvLyAub24oJ2NoYXQvbGFuZ3VhZ2VzJywgZnVuY3Rpb24oKSB7XG5cdC8vIFx0Y2hhbmdlV2dTdGF0ZSh7IHN0YXRlOiBnZXRXaWRnZXRTdGF0ZSgpIH0pO1xuXHQvLyB9KTtcdFxuXG5cdGlmKGRlZmF1bHRzLndpZGdldCkge1xuXHRcdGFwaS5vbignY2hhdC9zdGFydCcsIHN0YXJ0Q2hhdClcblx0XHQub24oJ2NoYXQvY2xvc2UnLCBvbkNoYXRDbG9zZSlcblx0XHQub24oJ2NoYXQvdGltZW91dCcsIG9uQ2hhdFRpbWVvdXQpXG5cdFx0Lm9uKCdtZXNzYWdlL25ldycsIGNsZWFyVW5kZWxpdmVyZWQpXG5cdFx0Lm9uKCdtZXNzYWdlL25ldycsIG5ld01lc3NhZ2UpXG5cdFx0Lm9uKCdtZXNzYWdlL3R5cGluZycsIG9uQWdlbnRUeXBpbmcpXG5cdFx0Lm9uKCdjYWxsYmFjay9jcmVhdGUnLCBvbkNhbGxiYWNrUmVxdWVzdGVkKVxuXHRcdC5vbignZm9ybS9zdWJtaXQnLCBvbkZvcm1TdWJtaXQpXG5cdFx0Lm9uKCdmb3JtL3JlamVjdCcsIGNsb3NlRm9ybSlcblx0XHQub24oJ3dpZGdldC9sb2FkJywgaW5pdFdpZGdldCk7XG5cdFx0Ly8gLm9uKCd3aWRnZXQvaW5pdCcsIG9uV2lkZ2V0SW5pdCk7XG5cdFx0Ly8gLm9uKCd3aWRnZXQvc3RhdGVjaGFuZ2UnLCBjaGFuZ2VXZ1N0YXRlKTtcblx0fVxuXG5cdGlmKFdlYlJUQy5pc1N1cHBvcnRlZCgpICYmIGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0YyAmJiBkZWZhdWx0cy5jaGFubmVscy53ZWJydGMuc2lwICYmIGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5zaXAud3Nfc2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6Jyl7XG5cdFx0Ly8gaWYod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyAmJiBzZXJ2ZXJVcmwucHJvdG9jb2wgPT09ICdodHRwczonKXtcblx0XHRcdC8vIHNldCBmbGFnIHRvIGluZGljYXRlIHRoYXQgd2VicnRjIGZlYXR1cmUgaXMgc3VwcG9ydGVkIGFuZCBlbmFibGVkXG5cdFx0XHRkZWZhdWx0cy53ZWJydGNFbmFibGVkID0gdHJ1ZTtcblxuXHRcdFx0Ly8gc2V0IHdlYnJ0YyBldmVudCBoYW5kbGVyc1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvbmV3UlRDU2Vzc2lvbicsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ25ld1JUQ1Nlc3Npb24nKTtcblx0XHRcdH0pO1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvcHJvZ3Jlc3MnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0aWYoZS5yZXNwb25zZS5zdGF0dXNfY29kZSA9PT0gMTgwKSB7XG5cdFx0XHRcdFx0aW5pdENhbGxTdGF0ZSgncmluZ2luZycpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2NvbmZpcm1lZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGFwaS5vbignd2VicnRjL2FkZHN0cmVhbScsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuXHRcdFx0fSk7XG5cdFx0XHRhcGkub24oJ3dlYnJ0Yy9lbmRlZCcsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2VuZGVkJyk7XG5cdFx0XHR9KTtcblx0XHRcdGFwaS5vbignd2VicnRjL2ZhaWxlZCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRpZihlLmNhdXNlID09PSAnQ2FuY2VsZWQnKXtcblx0XHRcdFx0XHRpbml0Q2FsbFN0YXRlKCdjYW5jZWxlZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2ZhaWxlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gcmluZ1RvbmUgYXVkaW8gZWxlbWVudCBwbGF5cyByaW5nVG9uZSBzb3VuZCB3aGVuIGNhbGxpbmcgdG8gYWdlbnRcblx0XHRcdC8vIHJpbmdUb25lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRcdC8vIHJpbmdUb25lLnNyYyA9IGRlZmF1bHRzLmNsaWVudFBhdGgrJ3NvdW5kcy9yaW5nb3V0Lndhdic7XG5cdFx0XHQvLyBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJpbmdUb25lKTtcblxuXHRcdFx0Ly8gaW5pdGlhdGUgd2VicnRjIG1vZHVsZSB3aXRoIHBhcmFtZXRlcnNcblx0XHRcdGluaXRXZWJydGNNb2R1bGUoe1xuXHRcdFx0XHRzaXA6IGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5zaXAsXG5cdFx0XHRcdGVtaXQ6IHB1YmxpY0FwaS5lbWl0LFxuXHRcdFx0XHRvbjogcHVibGljQXBpLm9uXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2VicnRjIGlzIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciwgYnV0IHRoZSBjdXJyZW50IHdlYiBwYWdlXG5cdFx0XHQvLyBpcyBsb2NhdGVkIG9uIGluc2VjdXJlIG9yaWdpbnMsIHRoZXJlZm9yZSB0aGUgd2VicnRjIGlzIG5vdCBzdXBwb3J0ZWRcblx0XHRcdGRlYnVnLndhcm4oJ1dlYlJUQyBmZWF0dXJlIGlzIGRpc2FibGVkJyk7XG5cdFx0XHRkZWJ1Zy53YXJuKCdnZXRVc2VyTWVkaWEoKSBubyBsb25nZXIgd29ya3Mgb24gaW5zZWN1cmUgb3JpZ2lucy4gVG8gdXNlIHRoaXMgZmVhdHVyZSwgeW91IHNob3VsZCBjb25zaWRlciBzd2l0Y2hpbmcgeW91ciBhcHBsaWNhdGlvbiB0byBhIHNlY3VyZSBvcmlnaW4sIHN1Y2ggYXMgSFRUUFMuIFNlZSBodHRwczovL2dvby5nbC9yU3RUR3ogZm9yIG1vcmUgZGV0YWlscy4nKTtcblx0XHR9XG5cdH1cblx0XG5cdHNldFNlc3Npb25UaW1lb3V0SGFuZGxlcigpO1xuXHQvLyBnZXRMYW5ndWFnZXMoKTtcblxuXHQvLyBsb2FkIHRyYW5zbGF0aW9uc1xuXHRyZXF1ZXN0LmdldCgnZnJhc2VzJywgKGRlZmF1bHRzLnRyYW5zbGF0aW9uc1BhdGggfHwgZGVmYXVsdHMuY2xpZW50UGF0aCkrJ3RyYW5zbGF0aW9ucy5qc29uJywgZnVuY3Rpb24gKGVyciwgcmVzdWx0KXtcblx0XHRpZihlcnIpIHJldHVybiBhcGkuZW1pdCgnRXJyb3InLCBlcnIpO1xuXHRcdGZyYXNlcyA9IEpTT04ucGFyc2UocmVzdWx0KTtcblx0fSk7XG5cdFxuXHQvLyBsb2FkIGZvcm1zXG5cdHJlcXVlc3QuZ2V0KCdmb3Jtc19qc29uJywgZGVmYXVsdHMuY2xpZW50UGF0aCsnZm9ybXMuanNvbicsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCl7XG5cdFx0aWYoZXJyKSByZXR1cm4gYXBpLmVtaXQoJ0Vycm9yJywgZXJyKTtcblx0XHRmb3JtcyA9IEpTT04ucGFyc2UocmVzdWx0KS5mb3Jtcztcblx0fSk7XG5cblx0cmV0dXJuIHB1YmxpY0FwaTtcbn1cblxuZnVuY3Rpb24gaW5pdE1vZHVsZSgpe1xuXHRhcGkuaW5pdCgpO1xuXHRyZXR1cm4gcHVibGljQXBpO1xufVxuXG5mdW5jdGlvbiBpbml0V2VicnRjTW9kdWxlKG9wdHMpe1xuXHRkZWJ1Zy5sb2coJ2luaXRXZWJydGNNb2R1bGU6ICcsIG9wdHMpO1xuXHRXZWJSVEMuaW5pdChvcHRzKTtcbn1cblxuZnVuY3Rpb24gaW5pdFNlc3Npb24oKSB7XG5cdFxuXHRpZighZGVmYXVsdHMuY2hhdCAmJiAhZGVmYXVsdHMud2VicnRjRW5hYmxlZCAmJiAhZGVmYXVsdHMuY2hhbm5lbHMuY2FsbGJhY2sudGFzaykgcmV0dXJuIGZhbHNlO1xuXG5cdGRlYnVnLmxvZygnc2Vzc2lvbiBpbml0aWF0ZWQnKTtcblxuXHQvLyBzZXQgY3VycmVudCB1c2VyIGxhbmd1YWdlXG5cdGN1cnJMYW5nID0gY3VyckxhbmcgfHwgZGV0ZWN0TGFuZ3VhZ2UoKTtcblx0c2V0U2Vzc2lvblRpbWVvdXRIYW5kbGVyKCk7XG5cdFxuXHRnZXRMYW5ndWFnZXMoKTtcblx0Ly8gZ2V0TGFuZ3VhZ2VzSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChnZXRMYW5ndWFnZXMsIGRlZmF1bHRzLmNoZWNrU3RhdHVzVGltZW91dCoxMDAwKTtcblxuXHQvLyBJZiBwYWdlIGxvYWRlZCBhbmQgXCJ3aWRnZXRcIiBwcm9wZXJ0eSBpcyBzZXQgLSBsb2FkIHdpZGdldFxuXHRpZihkZWZhdWx0cy53aWRnZXQgJiYgIXdpZGdldFN0YXRlLmluaXRpYXRlZCAmJiBpc0Jyb3dzZXJTdXBwb3J0ZWQoKSkge1xuXHRcdGxvYWRXaWRnZXQoKTtcblx0fVxuXG5cdC8vIElmIHRpbWVvdXQgd2FzIG9jY3VyZWQsIGluaXQgY2hhdCBhZnRlciBhIHNlc3Npb24gaXMgY3JlYXRlZFxuXHRpZihoYXNXZ1N0YXRlKCd0aW1lb3V0JykpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCd0aW1lb3V0Jyk7XG5cdH1cblxuXHQvLyBpZiB3aW5kb3cgaXMgbm90IGEgb3BlbmVkIHdpbmRvd1xuXHQvLyBpZighZGVmYXVsdHMuZXh0ZXJuYWwpIHtcblx0XHQvLyBhcGkudXBkYXRlVXJsKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblxuXHQvLyBcdGlmKGRlZmF1bHRzLmNvYnJvd3NpbmcpIHtcblx0Ly8gXHRcdGluaXRDb2Jyb3dzaW5nTW9kdWxlKHtcblx0Ly8gXHRcdFx0dXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcblx0Ly8gXHRcdFx0ZW50aXR5OiBzdG9yYWdlLmdldFN0YXRlKCdlbnRpdHknLCAnc2Vzc2lvbicpLFxuXHQvLyBcdFx0XHR3aWRnZXQ6ICcjJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1jb250J1xuXHQvLyBcdFx0fSk7XG5cdC8vIFx0fVxuXHQvLyB9XG5cblx0YXBpLmVtaXQoJ3Nlc3Npb24vaW5pdCcsIHtvcHRpb25zOiBkZWZhdWx0cywgdXJsOiBnbG9iYWwubG9jYXRpb24uaHJlZiB9KTtcbn1cblxuLy8gU2Vzc2lvbiBpcyBlaXRoZXIgY3JlYXRlZCBvciBjb250aW51ZXNcbmZ1bmN0aW9uIG9uU2Vzc2lvblN1Y2Nlc3MoKXtcdFxuXHQvLyBXYWl0IHdoaWxlIHRyYW5zbGF0aW9ucyBhcmUgbG9hZGVkXG5cdF8ucG9sbChmdW5jdGlvbigpe1xuXHRcdGRlYnVnLmxvZygncG9sbDogJywgZnJhc2VzKTtcblx0XHRyZXR1cm4gKGZyYXNlcyAhPT0gbnVsbCk7XG5cblx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0aW5pdFNlc3Npb24oKVxuXHRcdC8vIGlmIHdpbmRvdyBpcyBub3QgYSBvcGVuZWQgd2luZG93XG5cdFx0aWYoIWRlZmF1bHRzLmV4dGVybmFsKSB7XG5cdFx0XHRhcGkudXBkYXRlVXJsKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcblx0XHR9XG5cblx0fSwgZnVuY3Rpb24oKXtcblx0XHRcblx0XHRpZihwb2xsVHVybnMgPCAyKSB7XG5cdFx0XHRwb2xsVHVybnMrKztcblx0XHRcdFdpZGdldChkZWZhdWx0cyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBhcGkuZW1pdCgnRXJyb3InLCAnTW9kdWxlIHdhc25cXCd0IGluaXRpYXRlZCBkdWUgdG8gbmV0d29yayBlcnJvcnMnKTtcblx0XHR9XG5cblx0fSwgNjAwMDApO1xuXG59XG5cbmZ1bmN0aW9uIG9uU2Vzc2lvbkluaXQoKXtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2luaXQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRpZih3aWRnZXRXaW5kb3cgJiYgIXdpZGdldFdpbmRvdy5jbG9zZWQpIHdpZGdldFdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGRlZmF1bHRzLnByZWZpeCsnLmluaXQnLCB0cnVlKTtcbn1cblxuLy8gc2VuZCBzaGFyZWQgZXZlbnQgdG8gdGhlIHVzZXIncyBicm93c2VyXG5mdW5jdGlvbiBvblNlc3Npb25Kb2luKHBhcmFtcyl7XG5cdC8vIGRlYnVnLmxvZygnb25TZXNzaW9uSm9pbjogJywgcGFyYW1zKTtcblx0aW5pdENvYnJvd3NpbmdNb2R1bGUoeyB1cmw6IHBhcmFtcy51cmwsIGVudGl0eTogc3RvcmFnZS5nZXRTdGF0ZSgnZW50aXR5JywgJ3Nlc3Npb24nKSB9KTtcbn1cblxuZnVuY3Rpb24gb25TZXNzaW9uRGlzam9pbigpIHtcblx0Y29icm93c2luZy51bnNoYXJlKCk7XG59XG5cbmZ1bmN0aW9uIGluaXRDb2Jyb3dzaW5nTW9kdWxlKHBhcmFtcyl7XG5cdC8vIGluaXQgY29icm93c2luZyBtb2R1bGUgb25seSBvbiBtYWluIHdpbmRvd1xuXHRpZihkZWZhdWx0cy5leHRlcm5hbCB8fCBjb2Jyb3dzaW5nLmlzSW5pdGlhdGVkKCkpIHJldHVybjtcblxuXHRhcGkub24oJ2NvYnJvd3NpbmcvaW5pdCcsIGZ1bmN0aW9uKCl7XG5cdFx0Y29icm93c2luZy5zaGFyZSgpO1xuXHRcdC8vIGNvYnJvd3NpbmcuZW1pdEV2ZW50cygpO1xuXHR9KTtcblxuXHRhcGkub24oJ2NvYnJvd3NpbmcvdXBkYXRlJywgZnVuY3Rpb24ocGFyYW1zKXtcblx0XHRjb2Jyb3dzaW5nLnVwZGF0ZUV2ZW50cyhwYXJhbXMpO1xuXHR9KTtcblxuXHRhcGkub24oJ2NvYnJvd3NpbmcvZXZlbnQnLCBmdW5jdGlvbihwYXJhbXMpe1xuXHRcdGlmKHBhcmFtcy5ldmVudHMgJiYgcGFyYW1zLmV2ZW50cy5sZW5ndGgpIGFwaS51cGRhdGVFdmVudHMocGFyYW1zLmV2ZW50cylcblx0XHQvLyAsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcblx0XHQvLyBcdGlmKGVycikgcmV0dXJuO1xuXHRcdC8vIFx0aWYocmVzdWx0KSBjb2Jyb3dzaW5nLnVwZGF0ZUV2ZW50cyhyZXN1bHQpO1xuXHRcdC8vIH0pO1xuXHR9KTtcblxuXHRhcGkub24oJ2NvYnJvd3Npbmcvc2hhcmVkJywgZnVuY3Rpb24oKXtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkJywgdHJ1ZSwgJ3Nlc3Npb24nKTtcblx0XHQvLyBpZighc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSAmJiBwYXJhbXMuZW50aXR5ID09PSAndXNlcicpIHtcblx0XHRcdC8vIHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaGFyZWQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRcdFx0Ly8gYXBpLnN3aXRjaFNoYXJlU3RhdGUodHJ1ZSwgcGFyYW1zLnVybCk7XG5cdFx0Ly8gfVxuXHRcdC8vIGFwaS51cGRhdGVFdmVudHMoW3sgZW50aXR5OiBwYXJhbXMuZW50aXR5LCB1cmw6IHBhcmFtcy51cmwsIHNoYXJlZDogdHJ1ZSB9XSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuXHRcdC8vIFx0Ly8gaWYoZXJyKSByZXR1cm47XG5cdFx0Ly8gXHRyZXN1bHQuaGlzdG9yeUV2ZW50cyA9IHRydWU7XG5cdFx0Ly8gXHQvLyBkZWJ1Zy5sb2coJ2NvYnJvd3NpbmcgdXBkYXRlOiAnLCByZXN1bHQpO1xuXHRcdC8vIFx0Y29icm93c2luZy51cGRhdGVFdmVudHMocmVzdWx0KTtcblx0XHQvLyB9KTtcblx0fSk7XG5cblx0YXBpLm9uKCdjb2Jyb3dzaW5nL3Vuc2hhcmVkJywgZnVuY3Rpb24ocGFyYW1zKXtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkJywgZmFsc2UsICdzZXNzaW9uJyk7XG5cdFx0Ly8gY29icm93c2luZy51bnNoYXJlKCk7XG5cdFx0Ly8gYXBpLnVwZGF0ZUV2ZW50cyhbeyBlbnRpdHk6IHBhcmFtcy5lbnRpdHksIHVybDogcGFyYW1zLnVybCwgc2hhcmVkOiBmYWxzZSB9XSwgZnVuY3Rpb24oZXJyKXtcblx0XHQvLyBcdC8vIGlmKGVycikgcmV0dXJuO1xuXHRcdC8vIFx0aWYocGFyYW1zLmVudGl0eSA9PT0gJ3VzZXInKSBhcGkuc3dpdGNoU2hhcmVTdGF0ZShmYWxzZSwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRcdC8vIFx0ZWxzZSBjb2Jyb3dzaW5nLnVuc2hhcmVCcm93c2VyKCk7XG5cdFx0Ly8gfSk7XG5cdH0pO1xuXHRcblx0Y29icm93c2luZy5pbml0KHtcblx0XHR3aWRnZXQ6IHBhcmFtcy53aWRnZXQsXG5cdFx0ZW50aXR5OiBwYXJhbXMuZW50aXR5LFxuXHRcdGVtaXQ6IHB1YmxpY0FwaS5lbWl0LFxuXHRcdHBhdGg6IGRlZmF1bHRzLmNsaWVudFBhdGhcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldEVsZW1lbnQoKXtcblx0cmV0dXJuIHdpZGdldDtcbn1cblxuZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCl7XG5cdGFwaS5nZXRMYW5ndWFnZXMoZnVuY3Rpb24gKGVyciwgbGFuZ3Mpe1xuXHRcdGRlYnVnLmxvZygnZ2V0TGFuZ3VhZ2VzOiAnLCBlcnIsIGxhbmdzKTtcblx0XHRpZihlcnIpIHJldHVybjtcblx0XHRpZihsYW5ncykgb25OZXdMYW5ndWFnZXMobGFuZ3MpO1xuXHRcdC8vIGdldExhbmd1YWdlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGdldExhbmd1YWdlcywgZGVmYXVsdHMuY2hlY2tTdGF0dXNUaW1lb3V0KjEwMDApO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25OZXdMYW5ndWFnZXMobGFuZ3VhZ2VzKXtcblx0Ly8gZGVidWcubG9nKCdsYW5ndWFnZXM6ICcsIGxhbmd1YWdlcyk7XG5cdHZhciBzdGF0ZSA9IGxhbmd1YWdlcy5sZW5ndGggPyAnb25saW5lJyA6ICdvZmZsaW5lJztcblxuXHRsYW5ncyA9IGxhbmd1YWdlcztcblxuXHQvLyBpZihoYXNXZ1N0YXRlKHN0YXRlKSkgcmV0dXJuO1xuXHQvLyBpZih3aWRnZXRTdGF0ZS5zdGF0ZSA9PT0gc3RhdGUpIHJldHVybjtcblxuXHRjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6IHN0YXRlIH0pO1xuXHRhcGkuZW1pdCgnY2hhdC9sYW5ndWFnZXMnLCBsYW5ndWFnZXMpO1xufVxuXG5mdW5jdGlvbiBpbml0V2lkZ2V0KCl7XG5cdHZhciBvcHRpb25zID0gJycsIHNlbGVjdGVkO1xuXG5cdC8vIGRlYnVnLmxvZygnSW5pdCB3aWRnZXQhJyk7XG5cdHdpZGdldFN0YXRlLmluaXRpYXRlZCA9IHRydWU7XG5cblx0c2V0U3R5bGVzKCk7XG5cdHNldExpc3RlbmVycyh3aWRnZXQpO1xuXHRjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6IGdldFdpZGdldFN0YXRlKCkgfSk7XG5cblx0aWYoZGVmYXVsdHMuaGlkZU9mZmxpbmVCdXR0b24pIHtcblx0XHRhZGRXZ1N0YXRlKCduby1idXR0b24nKTtcblx0fVxuXG5cdGlmKGRlZmF1bHRzLm9mZmVyKSB7XG5cdFx0c2V0T2ZmZXIoKTtcblx0fVxuXG5cdC8vIGlmIGNoYXQgc3RhcnRlZFxuXHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JykgPT09IHRydWUpIHtcblx0XHRyZXF1ZXN0Q2hhdChzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykgfHwge30pO1xuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ29wZW5lZCcsICdzZXNzaW9uJykpIHNob3dXaWRnZXQoKTtcblx0XHQvLyBpbml0Q2hhdCgpO1xuXHR9XG5cblx0Ly8gaWYgd2VicnRjIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciBhbmQgd3Nfc2VydmVycyBwYXJhbWV0ZXIgaXMgc2V0IC0gY2hhbmdlIGJ1dHRvbiBpY29uXG5cdGlmKGRlZmF1bHRzLndlYnJ0Y0VuYWJsZWQpIHtcblx0XHRhZGRXZ1N0YXRlKCd3ZWJydGMtZW5hYmxlZCcpO1xuXHR9XG5cblx0aWYod2lkZ2V0ICYmIGRlZmF1bHRzLmludHJvLmxlbmd0aCkge1xuXHRcdC8vIEFkZCBsYW5ndWFnZXMgdG8gdGhlIHRlbXBsYXRlXG5cdFx0bGFuZ3MuZm9yRWFjaChmdW5jdGlvbihsYW5nKSB7XG5cdFx0XHRpZihmcmFzZXNbbGFuZ10gJiYgZnJhc2VzW2xhbmddLmxhbmcpIHtcblx0XHRcdFx0c2VsZWN0ZWQgPSBsYW5nID09PSBjdXJyTGFuZyA/ICdzZWxlY3RlZCcgOiAnJztcblx0XHRcdFx0b3B0aW9ucyArPSAnPG9wdGlvbiB2YWx1ZT1cIicrbGFuZysnXCIgJytzZWxlY3RlZCsnID4nK2ZyYXNlc1tsYW5nXS5sYW5nKyc8L29wdGlvbj4nO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGdsb2JhbFtkZWZhdWx0cy5wcmVmaXgrJ0ludHJvRm9ybSddLmxhbmcuaW5uZXJIVE1MID0gb3B0aW9ucztcblx0fVxuXG5cdC8vIFdpZGdldCBpcyBpbml0aWF0ZWRcblx0YXBpLmVtaXQoJ3dpZGdldC9pbml0Jyk7XG59XG5cbmZ1bmN0aW9uIGxvYWRXaWRnZXQoY2Ipe1xuXHRcblx0Y29tcGlsZWQgPSBjb21waWxlVGVtcGxhdGUoJ3dpZGdldCcsIHtcblx0XHRkZWZhdWx0czogZGVmYXVsdHMsXG5cdFx0bGFuZ3VhZ2VzOiBsYW5ncyxcblx0XHR0cmFuc2xhdGlvbnM6IGZyYXNlcyxcblx0XHRjdXJyTGFuZzogY3VyckxhbmcgfHwgZGVmYXVsdHMubGFuZyxcblx0XHRjcmVkZW50aWFsczogc3RvcmFnZS5nZXRTdGF0ZSgnY3JlZGVudGlhbHMnLCAnc2Vzc2lvbicpIHx8IHt9LFxuXHRcdF86IF9cblx0fSk7XG5cblx0Ly8gV2lkZ2V0IHZhcmlhYmxlIGFzc2lnbm1lbnRcblx0d2lkZ2V0ID0gZG9taWZ5KGNvbXBpbGVkKTtcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh3aWRnZXQpO1xuXHRhcGkuZW1pdCgnd2lkZ2V0L2xvYWQnLCB3aWRnZXQpO1xuXG59XG5cbmZ1bmN0aW9uIHNldE9mZmVyKCkge1xuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdHNob3dPZmZlcih7XG5cdFx0XHRmcm9tOiBkZWZhdWx0cy5vZmZlci5mcm9tIHx8IGZyYXNlc1tjdXJyTGFuZ10uVE9QX0JBUi50aXRsZSxcblx0XHRcdHRpbWU6IERhdGUubm93KCksXG5cdFx0XHRjb250ZW50OiBkZWZhdWx0cy5vZmZlci50ZXh0IHx8IGZyYXNlc1tjdXJyTGFuZ10uZGVmYXVsdF9vZmZlclxuXHRcdH0pO1xuXHR9LCBkZWZhdWx0cy5vZmZlci5pblNlY29uZHMgPyBkZWZhdWx0cy5vZmZlci5pblNlY29uZHMqMTAwMCA6IDMwMDAwKTtcbn1cblxuZnVuY3Rpb24gc2hvd09mZmVyKG1lc3NhZ2UpIHtcblx0Ly8gUmV0dXJuIGlmIHVzZXIgYWxyZWFkeSBpbnRlcmFjdCB3aXRoIHRoZSB3aWRnZXRcblx0aWYod2lkZ2V0U3RhdGUuc3RhdGUgIT09ICdvbmxpbmUnIHx8IGlzSW50ZXJhY3RlZCgpKSByZXR1cm47XG5cdG5ld01lc3NhZ2UobWVzc2FnZSk7XG5cdC8vIG5ld01lc3NhZ2UoeyBtZXNzYWdlczogW21lc3NhZ2VdIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRJbnRlcmFjdGVkKCl7XG5cdGlmKCFzdG9yYWdlLmdldFN0YXRlKCdpbnRlcmFjdGVkJywgJ3Nlc3Npb24nKSkge1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdpbnRlcmFjdGVkJywgdHJ1ZSwgJ3Nlc3Npb24nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBpc0ludGVyYWN0ZWQoKXtcblx0cmV0dXJuIHN0b3JhZ2UuZ2V0U3RhdGUoJ2ludGVyYWN0ZWQnLCAnc2Vzc2lvbicpO1xufVxuXG5mdW5jdGlvbiBpbml0Q2hhdCgpe1xuXHRzaG93V2lkZ2V0KCk7XG5cblx0Ly8gLy8gaWYgY2hhdCBhbHJlYWR5IHN0YXJ0ZWQgYW5kIHdpZGdldCB3YXMgbWluaW1pemVkIC0ganVzdCBzaG93IHRoZSB3aWRnZXRcblx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcsICdjYWNoZScpKSByZXR1cm47XG5cblx0aWYoIWxhbmdzLmxlbmd0aCkge1xuXHRcdHN3aXRjaFBhbmUoJ3NlbmRlbWFpbCcpO1xuXHR9IGVsc2UgaWYoZGVmYXVsdHMuaW50cm8ubGVuZ3RoKSB7XG5cdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpKSB7XG5cdFx0XHRyZXF1ZXN0Q2hhdChzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzd2l0Y2hQYW5lKCdjcmVkZW50aWFscycpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXF1ZXN0Q2hhdCh7IGxhbmc6IGN1cnJMYW5nIH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RDaGF0KGNyZWRlbnRpYWxzKXtcblx0aWYoIWNyZWRlbnRpYWxzLnVuYW1lKSBjcmVkZW50aWFscy51bmFtZSA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpLnNwbGl0KCdfJylbMF07XG5cdFxuXHQvLyBTYXZlIHVzZXIgbGFuZ3VhZ2UgYmFzZWQgb24gcHJlZmVyYWJsZSBkaWFsb2cgbGFuZ3VhZ2Vcblx0aWYoY3JlZGVudGlhbHMubGFuZyAmJiBjcmVkZW50aWFscy5sYW5nICE9PSBjdXJyTGFuZyApIHtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnbGFuZycsIGNyZWRlbnRpYWxzLmxhbmcpO1xuXHR9XG5cdGlmKCFjcmVkZW50aWFscy5sYW5nKSB7XG5cdFx0Y3JlZGVudGlhbHMubGFuZyA9IGN1cnJMYW5nO1xuXHR9XG5cdFxuXHQvLyBTYXZlIGNyZWRlbnRpYWxzIGZvciBjdXJyZW50IHNlc3Npb25cblx0Ly8gSXQgd2lsbCBiZSByZW1vdmVkIG9uIHNlc3Npb24gdGltZW91dFxuXHRzdG9yYWdlLnNhdmVTdGF0ZSgnY3JlZGVudGlhbHMnLCBjcmVkZW50aWFscywgJ3Nlc3Npb24nKTtcblxuXHRzdGFydENoYXQoe30pO1xuXHRjbGVhcldnTWVzc2FnZXMoKTtcblx0c3dpdGNoUGFuZSgnbWVzc2FnZXMnKTtcblxuXHRhcGkuY2hhdFJlcXVlc3QoY3JlZGVudGlhbHMpO1xufVxuXG5mdW5jdGlvbiBzdGFydENoYXQocGFyYW1zKXtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCB0cnVlKTtcblx0aWYocGFyYW1zLnRpbWVvdXQpIHtcblx0XHQvLyBkZWJ1Zy5sb2coJ2NoYXQgdGltZW91dDogJywgcGFyYW1zLnRpbWVvdXQpO1xuXHRcdGNoYXRUaW1lb3V0ID0gYXBpLnNldENoYXRUaW1lb3V0KHBhcmFtcy50aW1lb3V0KTtcblx0fVxuXHQvLyBnZXRNZXNzYWdlcygpO1xuXHRhZGRXZ1N0YXRlKCdjaGF0Jyk7XG59XG5cbi8vIGZ1bmN0aW9uIGdldE1lc3NhZ2VzKCl7XG4vLyBcdC8vIGRlYnVnLmxvZygnZ2V0IG1lc3NhZ2VzIScpO1xuXHRcbi8vIFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpKVxuLy8gXHRcdG5vTWVzc2FnZXNUaW1lb3V0ID0gc2V0VGltZW91dChnZXRNZXNzYWdlcywgNjAqMTAwMCk7XG5cdFxuLy8gXHRhcGkuZ2V0TWVzc2FnZXMoZnVuY3Rpb24oKSB7XG4vLyBcdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpKSB7XG4vLyBcdFx0XHRtZXNzYWdlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGdldE1lc3NhZ2VzLCBkZWZhdWx0cy5nZXRNZXNzYWdlc1RpbWVvdXQqMTAwMCk7XG4vLyBcdFx0XHRjbGVhclRpbWVvdXQobm9NZXNzYWdlc1RpbWVvdXQpO1xuLy8gXHRcdH1cbi8vIFx0fSk7XG4vLyB9XG5cbmZ1bmN0aW9uIHNlbmRNZXNzYWdlKHBhcmFtcyl7XG5cdGFwaS5zZW5kTWVzc2FnZShwYXJhbXMpO1xuXHQvLyBhcGkuc2VuZE1lc3NhZ2UocGFyYW1zLCBmdW5jdGlvbihlcnIpIHtcblx0Ly8gXHRpZighZXJyICYmIHdpZGdldFN0YXRlLnNvdW5kcykgYXVkaW8ucGxheSgnbWVzc2FnZV9zZW50Jyk7XG5cdC8vIH0pO1xuXG5cdG5ld01lc3NhZ2Uoe1xuXHRcdGZyb206IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NyZWRlbnRpYWxzJywgJ3Nlc3Npb24nKS51bmFtZSxcblx0XHR0aW1lOiBEYXRlLm5vdygpLFxuXHRcdGNvbnRlbnQ6IHBhcmFtcy5tZXNzYWdlXG5cdFx0Ly8gaGlkZGVuOiB0cnVlXG5cdFx0Ly8gY2xhc3NOYW1lOiBkZWZhdWx0cy5wcmVmaXgrJy1tc2ctdW5kZWxpdmVyZWQnXG5cdH0pO1xuXG5cdGlmKGNoYXRUaW1lb3V0KSBjbGVhclRpbWVvdXQoY2hhdFRpbWVvdXQpO1xufVxuXG5mdW5jdGlvbiBuZXdNZXNzYWdlKG1lc3NhZ2Upe1xuXHQvLyBkZWJ1Zy5sb2coJ25ldyBtZXNzYWdlcyBhcnJpdmVkIScsIHJlc3VsdCk7XG5cblx0dmFyIHN0cixcblx0XHRlbHMgPSBbXSxcblx0XHR0ZXh0LFxuXHRcdGNvbXBpbGVkLFxuXHRcdHBsYXlTb3VuZCA9IGZhbHNlLFxuXHRcdC8vIGRlZmF1bHRVbmFtZSA9IGZhbHNlLFxuXHRcdGNyZWRlbnRpYWxzID0gc3RvcmFnZS5nZXRTdGF0ZSgnY3JlZGVudGlhbHMnLCAnc2Vzc2lvbicpIHx8IHt9LFxuXHRcdGFuYW1lID0gc3RvcmFnZS5nZXRTdGF0ZSgnYW5hbWUnLCAnc2Vzc2lvbicpLFxuXHRcdHVuYW1lID0gY3JlZGVudGlhbHMudW5hbWUgPyBjcmVkZW50aWFscy51bmFtZSA6ICcnXG5cdFx0bWVzc2FnZXNDb250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbWVzc2FnZXMtY29udCcpO1xuXG5cdC8vIGlmKHVuYW1lID09PSBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKS5zcGxpdCgnXycpWzBdKSB7XG5cdC8vIFx0ZGVmYXVsdFVuYW1lID0gdHJ1ZTtcblx0Ly8gfVxuXG5cdC8vIHJlc3VsdC5tZXNzYWdlcy5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UsIGluZGV4KSB7XG5cdFx0XG5cdFx0bWVzc2FnZS5lbnRpdHkgPSBtZXNzYWdlLmZyb20gPT09IHVuYW1lID8gJ3VzZXInIDogJ2FnZW50Jztcblx0XHQvLyBtZXNzYWdlLmZyb20gPSAobWVzc2FnZS5lbnRpdHkgPT09ICd1c2VyJyAmJiBkZWZhdWx0VW5hbWUpID8gZnJhc2VzW2N1cnJMYW5nXS5kZWZhdWx0X3VzZXJfbmFtZSA6IG1lc3NhZ2UuZnJvbTtcblx0XHRtZXNzYWdlLmZyb20gPSBtZXNzYWdlLmVudGl0eSA9PT0gJ3VzZXInID8gJycgOiBtZXNzYWdlLmZyb207XG5cdFx0bWVzc2FnZS50aW1lID0gbWVzc2FnZS50aW1lID8gcGFyc2VUaW1lKG1lc3NhZ2UudGltZSkgOiBwYXJzZVRpbWUoRGF0ZS5ub3coKSk7XG5cblx0XHR0ZXh0ID0gcGFyc2VNZXNzYWdlKG1lc3NhZ2UuY29udGVudCwgbWVzc2FnZS5maWxlLCBtZXNzYWdlLmVudGl0eSk7XG5cblx0XHRpZih0ZXh0LnR5cGUgPT09ICdmb3JtJykge1xuXG5cdFx0XHRjb21waWxlZCA9IGNvbXBpbGVUZW1wbGF0ZSgnZm9ybXMnLCB7XG5cdFx0XHRcdGRlZmF1bHRzOiBkZWZhdWx0cyxcblx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdFx0Zm9ybTogdGV4dC5jb250ZW50LFxuXHRcdFx0XHRjcmVkZW50aWFsczogY3JlZGVudGlhbHMsXG5cdFx0XHRcdGZyYXNlczogZnJhc2VzWyhjdXJyTGFuZyB8fCBkZWZhdWx0cy5sYW5nKV0sXG5cdFx0XHRcdF86IF9cblx0XHRcdH0pO1xuXG5cdFx0XHRpZihnbG9iYWxbdGV4dC5jb250ZW50Lm5hbWVdKSBjbG9zZUZvcm0oeyBmb3JtTmFtZTogdGV4dC5jb250ZW50Lm5hbWUgfSk7XG5cdFx0XHRtZXNzYWdlc0NvbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCAnPGxpPicrY29tcGlsZWQrJzwvbGk+Jyk7XG5cdFx0XHRtZXNzYWdlc0NvbnQuc2Nyb2xsVG9wID0gbWVzc2FnZXNDb250LnNjcm9sbEhlaWdodDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIW1lc3NhZ2UuY29udGVudCkgcmV0dXJuO1xuXHRcdFx0bWVzc2FnZS5jb250ZW50ID0gdGV4dC5jb250ZW50O1xuXHRcdFx0Y29tcGlsZWQgPSBjb21waWxlVGVtcGxhdGUoJ21lc3NhZ2UnLCB7IGRlZmF1bHRzOiBkZWZhdWx0cywgbWVzc2FnZTogbWVzc2FnZSB9KTtcblx0XHRcdG1lc3NhZ2VzQ29udC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsICc8bGkgJysobWVzc2FnZS5jbGFzc05hbWUgPyAnY2xhc3M9XCInK21lc3NhZ2UuY2xhc3NOYW1lKydcIicgOiAnJyApKyc+Jytjb21waWxlZCsnPC9saT4nKTtcblxuXHRcdFx0Ly8gaWYoaW5kZXggPT09IHJlc3VsdC5tZXNzYWdlcy5sZW5ndGgtMSkge1xuXHRcdFx0XHRvbkxhc3RNZXNzYWdlKGNvbXBpbGVkKTtcblx0XHRcdC8vIH1cblxuXHRcdFx0Ly8gTmVlZCBmb3Igc2VuZGluZyBkaWFsb2cgdG8gZW1haWxcblx0XHRcdGlmKCFtZXNzYWdlLmhpZGRlbikgZGlhbG9nLnB1c2goY29tcGlsZWQpO1xuXHRcdH1cblxuXHRcdC8vIFNhdmUgYWdlbnQgbmFtZVxuXHRcdGlmKG1lc3NhZ2UuZW50aXR5ID09PSAnYWdlbnQnICYmIGFuYW1lICE9PSBtZXNzYWdlLmZyb20pIHtcblx0XHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdhbmFtZScsIG1lc3NhZ2UuZnJvbSwgJ3Nlc3Npb24nKTtcblx0XHR9XG5cblx0XHRpZihtZXNzYWdlLmVudGl0eSAhPT0gJ3VzZXInKSBwbGF5U291bmQgPSB0cnVlO1xuXG5cdC8vIH0pO1xuXG5cdG1lc3NhZ2VzQ29udC5zY3JvbGxUb3AgPSBtZXNzYWdlc0NvbnQuc2Nyb2xsSGVpZ2h0O1xuXHQvLyBpZihwbGF5U291bmQpIHBsYXlOZXdNc2dUb25lKCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyVW5kZWxpdmVyZWQoKXtcblx0dmFyIHVuZGVsaXZlcmVkID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuJytkZWZhdWx0cy5wcmVmaXgrJy1tc2ctdW5kZWxpdmVyZWQnKSk7XG5cdGlmKHVuZGVsaXZlcmVkICYmIHVuZGVsaXZlcmVkLmxlbmd0aCkge1xuXHRcdHVuZGVsaXZlcmVkLmZvckVhY2goZnVuY3Rpb24obXNnKXtcblx0XHRcdG1zZy5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHBsYXlOZXdNc2dUb25lKCkge1xuXHRhdWRpby5wbGF5KCduZXdfbWVzc2FnZScpO1xufVxuXG4vKipcbiAqIFZpc3VhbCBub3RpZmljYXRpb24gYWJvdXQgYSBuZXcgbWVzc2FnZSBmb21yIGFnZW50LlxuICogSXQgaXMgYWxzbyB1c2VkIGZvciBvZmZlciBub3RpZmljYXRpb25cbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSBtZXNzYWdlIC0gTmV3IG1lc3NhZ2UgY29udGVudCBcbiAqL1xuZnVuY3Rpb24gb25MYXN0TWVzc2FnZShtZXNzYWdlKXtcblx0dmFyIGxhc3RNc2c7XG5cdGlmKCF3aWRnZXRTdGF0ZS5hY3RpdmUpIHtcblx0XHRsYXN0TXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbGFzdG1zZycpO1xuXG5cdFx0Ly8gUHJlZml4ZWRFdmVudChsYXN0TXNnLCAnYW5pbWF0aW9uZW5kJywgW1wid2Via2l0XCIsIFwibW96XCIsIFwiTVNcIiwgXCJvXCIsIFwiXCJdLCBmdW5jdGlvbihlKSB7XG5cdFx0Ly8gXHRidG4uY2hpbGRyZW5bMF0uc3R5bGUuaGVpZ2h0ID0gZS50YXJnZXQuc2Nyb2xsSGVpZ2h0ICsgJ3B4Jztcblx0XHQvLyB9KTtcblxuXHRcdGxhc3RNc2cuaW5uZXJIVE1MID0gbWVzc2FnZTtcblx0XHQvLyBjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6ICdub3RpZmllZCcgfSk7XG5cdFx0YWRkV2dTdGF0ZSgnbm90aWZpZWQnKTtcblx0XHRzZXRCdXR0b25TdHlsZSgnbm90aWZpZWQnKTtcblxuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVFbWFpbChjb250ZW50LCBjYikge1xuXHR2YXIgY29tcGlsZWQgPSBjb21waWxlVGVtcGxhdGUoJ2VtYWlsJywge1xuXHRcdGRlZmF1bHRzOiBkZWZhdWx0cyxcblx0XHRjb250ZW50OiBjb250ZW50LFxuXHRcdGZyYXNlczogZnJhc2VzWyhjdXJyTGFuZyB8fCBkZWZhdWx0cy5sYW5nKV0sXG5cdFx0XzogX1xuXHR9KTtcblxuXHRpZihjYikgcmV0dXJuIGNiKG51bGwsIGNvbXBpbGVkKTtcbn1cblxuZnVuY3Rpb24gc2VuZERpYWxvZyhwYXJhbXMpe1xuXHR2YXIgZGlhbG9nU3RyID0gcGFyYW1zLnRleHQuam9pbignJyk7XG5cdGNvbXBpbGVFbWFpbChkaWFsb2dTdHIsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG5cdFx0aWYoZXJyKSByZXR1cm47XG5cdFx0cGFyYW1zLnRleHQgPSByZXN1bHQ7XG5cdFx0YXBpLnNlbmRFbWFpbChwYXJhbXMpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gc2VuZENvbXBsYWluKHBhcmFtcyl7XG5cdHZhciBib2R5ID0gW107XG5cdC8vIFRPRE86IGV4cGxhaW4uLi5cblx0dmFyIGNvbXBsYWluID0gY29tcGlsZVRlbXBsYXRlKCdtZXNzYWdlJywge1xuXHRcdGRlZmF1bHRzOiBkZWZhdWx0cyxcblx0XHRtZXNzYWdlOiB7XG5cdFx0XHRmcm9tOiBmcmFzZXNbY3VyckxhbmddLkVNQUlMX1NVQkpFQ1RTLmNvbXBsYWluKycgJytwYXJhbXMuZW1haWwsXG5cdFx0XHRjb250ZW50OiBwYXJhbXMudGV4dCxcblx0XHRcdGVudGl0eTogJycsXG5cdFx0XHR0aW1lOiAnJ1xuXHRcdH1cblx0fSk7XG5cblx0Ym9keSA9IGJvZHkuY29uY2F0KFxuXHRcdGNvbXBsYWluLFxuXHRcdCc8YnI+PHAgY2xhc3M9XCJoMVwiPicrZnJhc2VzW2N1cnJMYW5nXS5FTUFJTF9TVUJKRUNUUy5kaWFsb2crJyAnK2RlZmF1bHRzLmhvc3QrJzwvcD48YnI+Jyxcblx0XHRkaWFsb2dcblx0KS5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xuXHRcdHJldHVybiBwcmV2LmNvbmNhdChjdXJyKTtcblx0fSk7XG5cblx0Y29tcGlsZUVtYWlsKGJvZHksIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG5cdFx0aWYoZXJyKSByZXR1cm47XG5cdFx0cGFyYW1zLnRleHQgPSByZXN1bHQ7XG5cdFx0YXBpLnNlbmRFbWFpbChwYXJhbXMpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gc2VuZFJlcXVlc3QocGFyYW1zLCBjYikge1xuXHQvLyBUT0RPOiBleHBsYWluLi4uXG5cdHZhciBtc2cgPSBjb21waWxlVGVtcGxhdGUoJ21lc3NhZ2UnLCB7XG5cdFx0ZGVmYXVsdHM6IGRlZmF1bHRzLFxuXHRcdG1lc3NhZ2U6IHtcblx0XHRcdGZyb206IGZyYXNlc1tjdXJyTGFuZ10uRU1BSUxfU1VCSkVDVFMucmVxdWVzdCsnICcrcGFyYW1zLnVuYW1lKycgKCcrcGFyYW1zLmVtYWlsKycpJyxcblx0XHRcdGNvbnRlbnQ6IHBhcmFtcy50ZXh0LFxuXHRcdFx0ZW50aXR5OiAnJyxcblx0XHRcdHRpbWU6ICcnXG5cdFx0fVxuXHR9KTtcblxuXHRjb21waWxlRW1haWwobXNnLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdGlmKGVycikgcmV0dXJuO1xuXHRcdHBhcmFtcy50ZXh0ID0gcmVzdWx0O1xuXHRcdGFwaS5zZW5kRW1haWwocGFyYW1zKTtcblx0XHRpZihjYikgY2IoKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHN1Ym1pdFNlbmRNYWlsRm9ybShmb3JtLCBkYXRhKSB7XG5cdHZhciBwYXJhbXMgPSB7fSxcblx0XHRmaWxlO1xuXG5cdGlmKCFkYXRhLmVtYWlsKSB7XG5cdFx0YWxlcnQoZnJhc2VzW2N1cnJMYW5nXS5FUlJPUlMuZW1haWwpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGRhdGEuc3ViamVjdCA9IGZyYXNlc1tjdXJyTGFuZ10uRU1BSUxfU1VCSkVDVFMucmVxdWVzdCsnICcrZGF0YS5lbWFpbDtcblxuXHRpZihkYXRhLmZpbGUpIHtcblx0XHRmaWxlID0gZ2V0RmlsZUNvbnRlbnQoZm9ybS5maWxlLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdFx0aWYoIWVycikge1xuXHRcdFx0XHRkYXRhLmZpbGVuYW1lID0gcmVzdWx0LmZpbGVuYW1lO1xuXHRcdFx0XHRkYXRhLmZpbGVkYXRhID0gcmVzdWx0LmZpbGVkYXRhO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVidWcud2FybignRmlsZSB3YXNuXFwndCBzZW50Jyk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUgZGF0YS5maWxlO1xuXHRcdFx0c2VuZFJlcXVlc3QoZGF0YSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGZvcm0ucmVzZXQoKTtcblx0XHRcdFx0Y2xvc2VXaWRnZXQoKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHNlbmRSZXF1ZXN0KGRhdGEsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Zm9ybS5yZXNldCgpO1xuXHRcdFx0Y2xvc2VXaWRnZXQoKTtcblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiBzdWJtaXRDbG9zZUNoYXRGb3JtKGZvcm0sIGRhdGEpe1xuXHR2YXIgcmF0aW5nID0gKGRhdGEgJiYgZGF0YS5yYXRpbmcpID8gcGFyc2VJbnQoZGF0YS5yYXRpbmcsIDEwKSA6IG51bGw7XG5cdGlmKGRhdGEgJiYgZGF0YS5zZW5kRGlhbG9nKSB7XG5cdFx0aWYoIWRhdGEuZW1haWwpIHtcblx0XHRcdGFsZXJ0KGZyYXNlc1tjdXJyTGFuZ10uRVJST1JTLmVtYWlsKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gZGVidWcubG9nKCdzZW5kIGRpYWxvZycpO1xuXHRcdHNlbmREaWFsb2coe1xuXHRcdFx0dG86IGRhdGEuZW1haWwsXG5cdFx0XHRzdWJqZWN0OiBmcmFzZXNbY3VyckxhbmddLkVNQUlMX1NVQkpFQ1RTLmRpYWxvZysnICcrZGVmYXVsdHMuaG9zdCxcblx0XHRcdHRleHQ6IGRpYWxvZyAvLyBnbG9iYWwgdmFyaWFibGVcblx0XHR9KTtcblx0fVxuXHRpZihkYXRhICYmIGRhdGEudGV4dCkge1xuXHRcdGlmKCFkYXRhLmVtYWlsKSB7XG5cdFx0XHRhbGVydChmcmFzZXNbY3VyckxhbmddLkVSUk9SUy5lbWFpbCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGRlYnVnLmxvZygnc2VuZCBjb21wbGFpbiEnKTtcblx0XHRcdHNlbmRDb21wbGFpbih7XG5cdFx0XHRcdGVtYWlsOiBkYXRhLmVtYWlsLFxuXHRcdFx0XHRzdWJqZWN0OiBmcmFzZXNbY3VyckxhbmddLkVNQUlMX1NVQkpFQ1RTLmNvbXBsYWluKycgJytkYXRhLmVtYWlsLFxuXHRcdFx0XHR0ZXh0OiBkYXRhLnRleHRcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRpZihjaGF0VGltZW91dCkgY2xlYXJUaW1lb3V0KGNoYXRUaW1lb3V0KTtcblx0aWYoZm9ybSkgZm9ybS5yZXNldCgpO1xuXHRcblx0Y2xvc2VDaGF0KHJhdGluZyk7XG5cdGNsb3NlV2lkZ2V0KCk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQ2hhdChyYXRpbmcpIHtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCBmYWxzZSk7XG5cdGFwaS5jbG9zZUNoYXQocmF0aW5nKTtcblx0cmVtb3ZlV2dTdGF0ZSgnY2hhdCcpO1xuXG5cdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ3NoYXJlZCcsICdzZXNzaW9uJykpIHtcblx0XHRhcGkuc3dpdGNoU2hhcmVTdGF0ZSgnc2hhcmVDbG9zZWQnLCBnbG9iYWwubG9jYXRpb24uaHJlZik7XG5cdFx0Y29icm93c2luZy51bnNoYXJlKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DaGF0Q2xvc2UoKXtcblx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSkgY29icm93c2luZy51bnNoYXJlKCk7XG59XG5cbmZ1bmN0aW9uIG9uQ2hhdFRpbWVvdXQoKXtcblx0Ly8gZGVidWcubG9nKCdjaGF0IHRpbWVvdXQhJyk7XG5cdHN3aXRjaFBhbmUoJ2Nsb3NlY2hhdCcpO1xuXHRjbG9zZUNoYXQoKTtcbn1cblxuZnVuY3Rpb24gb25BZ2VudFR5cGluZygpe1xuXHQvLyBkZWJ1Zy5sb2coJ0FnZW50IGlzIHR5cGluZyEnKTtcblx0aWYoIWFnZW50SXNUeXBpbmdUaW1lb3V0KSB7XG5cdFx0YWRkV2dTdGF0ZSgnYWdlbnQtdHlwaW5nJyk7XG5cdH1cblx0Y2xlYXJUaW1lb3V0KGFnZW50SXNUeXBpbmdUaW1lb3V0KTtcblx0YWdlbnRJc1R5cGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGFnZW50SXNUeXBpbmdUaW1lb3V0ID0gbnVsbDtcblx0XHRyZW1vdmVXZ1N0YXRlKCdhZ2VudC10eXBpbmcnKTtcblx0XHQvLyBkZWJ1Zy5sb2coJ2FnZW50IGlzIG5vdCB0eXBpbmcgYW55bW9yZSEnKTtcblx0fSwgNTAwMCk7XG59XG5cbmZ1bmN0aW9uIHNldFNlc3Npb25UaW1lb3V0SGFuZGxlcigpe1xuXHRpZihhcGkubGlzdGVuZXJDb3VudCgnc2Vzc2lvbi90aW1lb3V0JykgPj0gMSkgcmV0dXJuO1xuXHRhcGkub25jZSgnc2Vzc2lvbi90aW1lb3V0JywgZnVuY3Rpb24gKCl7XG5cdFx0ZGVidWcubG9nKCdTZXNzaW9uIHRpbWVvdXQ6JywgZGVmYXVsdHMpO1xuXG5cdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpID09PSB0cnVlKSB7XG5cdFx0XHRjbG9zZUNoYXQoKTtcblx0XHR9XG5cdFx0aWYod2lkZ2V0KSB7XG5cdFx0XHRhZGRXZ1N0YXRlKCd0aW1lb3V0Jyk7XG5cdFx0XHRjbG9zZVdpZGdldCgpO1xuXHRcdH1cblx0XHRjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6ICd0aW1lb3V0JyB9KTtcblx0XHQvLyB3aWRnZXRTdGF0ZS5zdGF0ZSA9ICd0aW1lb3V0Jztcblx0XHQvLyBhZGRXZ1N0YXRlKCd0aW1lb3V0Jyk7XG5cdFx0c2V0QnV0dG9uU3R5bGUoJ3RpbWVvdXQnKTtcblx0XHQvLyBzdG9yYWdlLnJlbW92ZVN0YXRlKCdzaWQnKTtcblxuXHRcdC8vIGlmKHBhcmFtcyAmJiBwYXJhbXMubWV0aG9kID09PSAndXBkYXRlRXZlbnRzJykge1xuXHRcdGlmKGdldExhbmd1YWdlc0ludGVydmFsKSBjbGVhckludGVydmFsKGdldExhbmd1YWdlc0ludGVydmFsKTtcblx0XHRpZihtZXNzYWdlc1RpbWVvdXQpIGNsZWFyVGltZW91dChtZXNzYWdlc1RpbWVvdXQpO1xuXG5cdFx0aWYoZGVmYXVsdHMucmVDcmVhdGVTZXNzaW9uKSB7XG5cdFx0XHRpbml0TW9kdWxlKCk7XG5cdFx0fVxuXHRcdC8vIH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIGluaXRDYWxsKCl7XG5cdHN3aXRjaFBhbmUoJ2NhbGxBZ2VudCcpO1xuXHRXZWJSVEMuYXVkaW9jYWxsKGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5ob3RsaW5lKTtcblx0Ly8gV2ViUlRDLmF1ZGlvY2FsbCgnc2lwOicrY2hhbm5lbHMud2VicnRjLmhvdGxpbmUrJ0AnK3NlcnZlclVybC5ob3N0KTtcbn1cblxuZnVuY3Rpb24gaW5pdEZhbGxiYWNrQ2FsbCgpe1xuXHRzd2l0Y2hQYW5lKCdjYWxsQWdlbnRGYWxsYmFjaycpO1xufVxuXG5mdW5jdGlvbiBpbml0Q2FsbGJhY2soKXtcblx0c3dpdGNoUGFuZSgnY2FsbGJhY2snKTtcbn1cblxuZnVuY3Rpb24gc2V0Q2FsbGJhY2soKXtcblx0dmFyIGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsYmFjay1zZXR0aW5ncycpLFxuXHRcdGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSksXG5cdFx0Y2JTcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbGJhY2stc3Bpbm5lcicpLFxuXHRcdGNiU2VudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNlbnQnKTtcblx0XG5cdGZvcm1EYXRhLnBob25lID0gZm9ybURhdGEucGhvbmUgPyBmb3JtYXRQaG9uZU51bWJlcihmb3JtRGF0YS5waG9uZSkgOiBudWxsO1xuXG5cdGlmKCFmb3JtRGF0YS5waG9uZSB8fCBmb3JtRGF0YS5waG9uZS5sZW5ndGggPCAxMCkge1xuXHRcdHJldHVybiBhbGVydChmcmFzZXNbY3VyckxhbmddLkVSUk9SUy50ZWwpO1xuXHR9XG5cblx0Zm9ybURhdGEudGltZSA9IHBhcnNlRmxvYXQoZm9ybURhdGEudGltZSk7XG5cdFxuXHRpZihmb3JtRGF0YS50aW1lIDw9IDApIHJldHVybjtcblxuXHRmb3JtRGF0YS50aW1lID0gRGF0ZS5ub3coKSArIChmb3JtRGF0YS50aW1lICogNjAgKiAxMDAwKTtcblx0Zm9ybURhdGEudGFzayA9IGRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2s7XG5cdGRlYnVnLmxvZygnc2V0Q2FsbGJhY2sgZGF0YTogJywgZm9ybURhdGEpO1xuXG5cdGZvcm0uY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0Y2JTcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0YXBpLnJlcXVlc3RDYWxsYmFjayhmb3JtRGF0YSk7XG5cdHN3aXRjaFBhbmUoJ2NhbGxiYWNrU2VudCcpO1xuXHQvLyBhcGkucmVxdWVzdENhbGxiYWNrKGZvcm1EYXRhLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHQvLyBcdGRlYnVnLmxvZygnc2V0Q2FsbGJhY2sgcmVzdWx0OiAnLCBlcnIsIHJlc3VsdCk7XG5cblx0Ly8gXHRjYlNwaW5uZXIuY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0Ly8gXHRmb3JtLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0Ly8gXHRpZihlcnIpIHJldHVybjtcblx0XHRcblx0Ly8gXHRzd2l0Y2hQYW5lKCdjYWxsYmFja1NlbnQnKTtcblx0Ly8gfSk7XG5cblx0Zm9ybS5yZXNldCgpO1xufVxuXG5mdW5jdGlvbiBvbkNhbGxiYWNrUmVxdWVzdGVkKCkge1xuXHR2YXIgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNldHRpbmdzJyksXG5cdFx0Y2JTcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbGJhY2stc3Bpbm5lcicpO1xuXG5cdGNiU3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRmb3JtLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0aWYoZXJyKSByZXR1cm47XG5cdFxuXHRzd2l0Y2hQYW5lKCdjYWxsYmFja1NlbnQnKTtcbn1cblxuZnVuY3Rpb24gaW5pdENhbGxTdGF0ZShzdGF0ZSl7XG5cdGRlYnVnLmxvZygnaW5pdENhbGxTdGF0ZTogJywgc3RhdGUpO1xuXG5cdHZhciBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbC1zcGlubmVyJyksXG5cdFx0aW5mbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtaW5mbycpLFxuXHRcdHRleHRTdGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtc3RhdGUnKSxcblx0XHR0aW1lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtdGltZXInKSxcblx0XHR0cnlBZ2FpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLXRyeWFnYWluLWJ0bicpO1xuXG5cdGlmKHN0YXRlID09PSAnbmV3UlRDU2Vzc2lvbicpIHtcblx0XHRpbml0Q2FsbFN0YXRlKCdvbmNhbGwnKTtcblxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdjb25maXJtZWQnKSB7XG5cdFx0dGV4dFN0YXRlLmlubmVyVGV4dCA9IGZyYXNlc1tjdXJyTGFuZ10uUEFORUxTLkFVRElPX0NBTEwuY2FsbGluZ19hZ2VudDtcblx0XHRpbmZvLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRyeUFnYWluLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAncmluZ2luZycpIHtcblx0XHRzZXRUaW1lcih0aW1lciwgJ2luaXQnLCAwKTtcblx0XHR0aW1lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdGF1ZGlvLnBsYXkoJ3JpbmdvdXRfbG9vcCcsIHRydWUpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2Nvbm5lY3RlZCcpIHtcblx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzW2N1cnJMYW5nXS5QQU5FTFMuQVVESU9fQ0FMTC5jb25uZWN0ZWRfd2l0aF9hZ2VudDtcblx0XHRzZXRUaW1lcih0aW1lciwgJ3N0YXJ0JywgMCk7XG5cdFx0YXVkaW8uc3RvcCgpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2VuZGVkJykge1xuXHRcdHRleHRTdGF0ZS5pbm5lclRleHQgPSBmcmFzZXNbY3VyckxhbmddLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfZW5kZWQ7XG5cdFx0c2V0VGltZXIodGltZXIsICdzdG9wJyk7XG5cdFx0aW5pdENhbGxTdGF0ZSgnb25jYWxsZW5kJyk7XG5cdFx0XG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2ZhaWxlZCcgfHwgc3RhdGUgPT09ICdjYW5jZWxlZCcpIHtcblx0XHRpZihzdGF0ZSA9PT0gJ2ZhaWxlZCcpIHtcblx0XHRcdHRleHRTdGF0ZS5pbm5lclRleHQgPSBmcmFzZXNbY3VyckxhbmddLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfZmFpbGVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzW2N1cnJMYW5nXS5QQU5FTFMuQVVESU9fQ0FMTC5jYWxsX2NhbmNlbGVkO1xuXHRcdH1cblx0XHRpbmZvLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRpbWVyLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0dHJ5QWdhaW4uY2xhc3NMaXN0LnJlbW92ZShkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0XHRpbml0Q2FsbFN0YXRlKCdvbmNhbGxlbmQnKTtcblx0XHRhdWRpby5wbGF5KCdidXN5Jyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAnb25jYWxsJykge1xuXHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gJ1lvdXIgY29ubmVjdGlvbiBpcyBpbiBwcm9ncmVzcy4gRG8geW91IHJlYWx5IHdhbnQgdG8gY2xvc2UgaXQ/Jztcblx0XHR9O1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjYWxsJywgdHJ1ZSwgJ2NhY2hlJyk7XG5cdFx0YWRkV2dTdGF0ZSgnd2VicnRjLWNhbGwnKTtcblxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdvbmNhbGxlbmQnKSB7XG5cdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gbnVsbDtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2FsbCcsIGZhbHNlLCAnY2FjaGUnKTtcblx0XHRyZW1vdmVXZ1N0YXRlKCd3ZWJydGMtY2FsbCcpO1xuXHRcdC8vIHN0b3BSaW5nVG9uZSgpO1xuXG5cdH0gZWxzZSBpZignaW5pdCcpIHtcblx0XHRpbmZvLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRyeUFnYWluLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0VGltZXIodGltZXIsIHN0YXRlLCBzZWNvbmRzKXtcblx0dmFyIHRpbWUgPSBzZWNvbmRzO1xuXHRpZihzdGF0ZSA9PT0gJ3N0YXJ0Jykge1xuXHRcdHRpbWVyVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuXHRcdFx0dGltZSA9IHRpbWUrMTtcblx0XHRcdHRpbWVyLnRleHRDb250ZW50ID0gY29udmVydFRpbWUodGltZSk7XG5cdFx0fSwgMTAwMCk7XG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ3N0b3AnKSB7XG5cdFx0Y2xlYXJJbnRlcnZhbCh0aW1lclVwZGF0ZUludGVydmFsKTtcblx0fSBlbHNlIGlmKHN0YXRlID09PSAnaW5pdCcpIHtcblx0XHR0aW1lci50ZXh0Q29udGVudCA9IGNvbnZlcnRUaW1lKDApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGVuZENhbGwoKXtcblx0aWYoV2ViUlRDLmlzRXN0YWJsaXNoZWQoKSB8fCBXZWJSVEMuaXNJblByb2dyZXNzKCkpIHtcblx0XHRXZWJSVEMudGVybWluYXRlKCk7XG5cdH0gZWxzZSB7XG5cdFx0Y2xvc2VXaWRnZXQoKTtcblx0XHRpbml0Q2FsbFN0YXRlKCdpbml0Jyk7XG5cdH1cbn1cblxuLy8gZnVuY3Rpb24gcGxheVJpbmdUb25lKCl7XG4vLyBcdGlmKHJpbmdUb25lSW50ZXJ2YWwpIHJldHVybjtcbi8vIFx0cmluZ1RvbmVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4vLyBcdFx0cmluZ1RvbmUucGxheSgpO1xuLy8gXHR9LCAzMDAwKTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gc3RvcFJpbmdUb25lKCl7XG4vLyBcdGNsZWFySW50ZXJ2YWwocmluZ1RvbmVJbnRlcnZhbCk7XG4vLyB9XG5cbi8qKlxuICogT3BlbiB3ZWIgY2hhdCB3aWRnZXQgaW4gYSBuZXcgd2luZG93XG4gKi9cbmZ1bmN0aW9uIG9wZW5XaWRnZXQoKXtcblx0dmFyIG9wdHMgPSB7fTtcblx0XG5cdGlmKCF3aWRnZXRXaW5kb3cgfHwgd2lkZ2V0V2luZG93LmNsb3NlZCkge1xuXG5cdFx0Xy5tZXJnZShvcHRzLCBkZWZhdWx0cyk7XG5cblx0XHRvcHRzLndpZGdldCA9IHRydWU7XG5cdFx0Ly8gc2V0IGV4dGVybmFsIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCB0aGUgbW9kdWxlIGxvYWRzIG5vdCBpbiB0aGUgbWFpbiB3aW5kb3dcblx0XHRvcHRzLmV4dGVybmFsID0gdHJ1ZTtcblxuXHRcdHdpZGdldFdpbmRvdyA9IHdpbmRvdy5vcGVuKCcnLCAnd2NoYXQnLCBkZWZhdWx0cy53aWRnZXRXaW5kb3dPcHRpb25zKTtcblx0XHR3aWRnZXRXaW5kb3cgPSBjb25zdHJ1Y3RXaW5kb3cod2lkZ2V0V2luZG93KTtcblx0XHQvLyB3aWRnZXRXaW5kb3dbZ2xvYmFsU2V0dGluZ3NdID0gb3B0cztcblxuXHRcdC8vIHdpZGdldFdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCd3Y2hhdF9vcHRpb25zJywgSlNPTi5zdHJpbmdpZnkob3B0cykpO1xuXG5cdFx0Ly8gV2FpdCB3aGlsZSB0aGUgc2NyaXB0IGlzIGxvYWRlZCwgXG5cdFx0Ly8gdGhlbiBpbml0IG1vZHVsZSBpbiB0aGUgY2hpbGQgd2luZG93XG5cdFx0Xy5wb2xsKGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gd2lkZ2V0V2luZG93LldjaGF0ICE9PSB1bmRlZmluZWQ7XG5cdFx0fSwgZnVuY3Rpb24oKXtcblx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUgPSB3aWRnZXRXaW5kb3cuV2NoYXQob3B0cyk7XG5cdFx0XHR3aWRnZXRXaW5kb3cuTW9kdWxlLm9uKCd3aWRnZXQvaW5pdCcsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUuaW5pdFdpZGdldFN0YXRlKCk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0LyogXG5cdFx0XHQqIFByb3h5IGFsbCBldmVudHMgdGhhdCBpcyBlbWl0dGVkIGluIHRoZSBjaGlsZCB3aW5kb3dcblx0XHRcdCogdG8gdGhlIG1haW4gd2luZG93LCBidXQgd2l0aCB0aGUgJ3dpbmRvdy8nIHByZWZpeCBiZWZvcmUgdGhlIGV2ZW50IG5hbWUuXG5cdFx0XHQqIFNvLCBmb3IgZXhhbXBsZSwgJ2NoYXQvc3RhcnQnIGV2ZW50IGluIHRoZSBjaGlsZCB3aW5kb3csXG5cdFx0XHQqIHdvdWxkIGJlICd3aW5kb3cvY2hhdC9zdGFydCcgaW4gdGhlIG1haW4gd2luZG93IFxuXHRcdFx0Ki9cblx0XHRcdF8uZm9yRWFjaChhcGkuX2V2ZW50cywgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbCl7XG5cdFx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUub24oa2V5LCBmdW5jdGlvbihwYXJhbXMpe1xuXHRcdFx0XHRcdHBhcmFtcy51cmwgPSBnbG9iYWwubG9jYXRpb24uaHJlZjtcblx0XHRcdFx0XHRhcGkuZW1pdCgnd2luZG93Lycra2V5LCBwYXJhbXMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3aWRnZXRXaW5kb3cuTW9kdWxlLmluaXRNb2R1bGUoKTtcblxuXHRcdH0sIGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zb2xlLndhcm4oJ1djaGF0IG1vZHVsZSB3YXMgbm90IGluaXRpYXRlZCBkdWUgdG8gbmV0d29yayBjb25uZWN0aW9uIGlzc3Vlcy4nKTtcblx0XHR9LCAxMjAwMDApO1xuXHRcdFxuXHRcdHdpZGdldFdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL2Nsb3NlIGNoYXQgaWYgdXNlciBjbG9zZSB0aGUgd2lkZ2V0IHdpbmRvd1xuXHRcdFx0Ly93aXRob3V0IGVuZGluZyBhIGRpYWxvZ1xuXHRcdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcsICdzdG9yYWdlJykpIGNsb3NlQ2hhdCgpO1xuXHRcdH07XG5cdH1cblx0aWYod2lkZ2V0V2luZG93LmZvY3VzKSB3aWRnZXRXaW5kb3cuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0V2luZG93KHdpbmRvd09iamVjdCl7XG5cdHZhciBsb2FkZXIsXG5cdHNjcmlwdCxcblx0bGluayxcblx0Y2hhcnNldCxcblx0dmlld3BvcnQsXG5cdHRpdGxlLFxuXHRjdXJyTGFuZyA9IGN1cnJMYW5nIHx8IGRldGVjdExhbmd1YWdlKCksXG5cdGxvYWRlckVsZW1lbnRzID0gd2luZG93T2JqZWN0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRsb2FkZXJTdHlsZXMgPSBjcmVhdGVTdHlsZXNoZWV0KHdpbmRvd09iamVjdCwgJ3N3Yy1sb2FkZXItc3R5bGVzJyksXG5cdGhlYWQgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcblx0Ym9keSA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXG5cdGxvYWRlckVsZW1lbnRzLmNsYXNzTmFtZSA9IFwic3djLXdpZGdldC1sb2FkZXJcIjtcblx0bG9hZGVyRWxlbWVudHMuaW5uZXJIVE1MID0gXCI8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cIjtcblxuXHR2aWV3cG9ydCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdHZpZXdwb3J0Lm5hbWUgPSAndmlld3BvcnQnO1xuXHR2aWV3cG9ydC5jb250ZW50ID0gJ3dpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIHVzZXItc2NhbGFibGU9MCc7XG5cblx0Y2hhcnNldCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdGNoYXJzZXQuc2V0QXR0cmlidXRlKCdjaGFyc2V0JywgJ3V0Zi04Jyk7XG5cblx0dGl0bGUgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGl0bGUnKTtcblx0dGl0bGUudGV4dENvbnRlbnQgPSBmcmFzZXNbY3VyckxhbmddLlRPUF9CQVIudGl0bGU7XG5cblx0Ly8gbG9hZGVyID0gd2luZG93T2JqZWN0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHQvLyBsb2FkZXIuc3JjID0gZGVmYXVsdHMuY2xpZW50UGF0aCsnbG9hZGVyLmpzJztcblxuXHRzY3JpcHQgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdHNjcmlwdC5zcmMgPSBkZWZhdWx0cy5jbGllbnRQYXRoKyd3Y2hhdC5taW4uanMnO1xuXHRzY3JpcHQuY2hhcnNldCA9ICdVVEYtOCc7XG5cblx0aGVhZC5hcHBlbmRDaGlsZCh2aWV3cG9ydCk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQoY2hhcnNldCk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXHRoZWFkLmFwcGVuZENoaWxkKGxvYWRlclN0eWxlcyk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuXHRib2R5LmlkID0gJ3N3Yy13Zy13aW5kb3cnO1xuXHRib2R5LmFwcGVuZENoaWxkKGxvYWRlckVsZW1lbnRzKTtcblx0Ly8gYm9keS5hcHBlbmRDaGlsZChsb2FkZXIpO1xuXG5cdGFkZExvYWRlclJ1bGVzKGhlYWQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N0eWxlJylbMF0pO1xuXG5cdHJldHVybiB3aW5kb3dPYmplY3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0eWxlc2hlZXQod2luZG93T2JqZWN0LCBpZCl7XG5cdC8vIENyZWF0ZSB0aGUgPHN0eWxlPiB0YWdcblx0XHR2YXIgc3R5bGUgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXHRcdHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuXHRcdGlmKGlkKSBzdHlsZS5pZCA9IGlkO1xuXG5cdFx0Ly8gV2ViS2l0IGhhY2sgOihcblx0XHRzdHlsZS5hcHBlbmRDaGlsZCh3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIikpO1xuXG5cdFx0cmV0dXJuIHN0eWxlO1xufVxuXG5mdW5jdGlvbiBhZGRMb2FkZXJSdWxlcyhzdHlsZSl7XG5cdHZhciB0aGVSdWxlcyA9IFtcblx0XHRcImJvZHkgeyBtYXJnaW46MDsgYmFja2dyb3VuZC1jb2xvcjogI2VlZTsgfVwiLFxuXHRcdFwiQGtleWZyYW1lcyBwcmVsb2FkaW5nIHtcIixcblx0XHRcdFwiMCB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFx0XCI1MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IH1cIixcblx0XHRcdFwiMTAwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFwifVwiLFxuXHRcdFwiQC13ZWJraXQta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCJALW1vei1rZXlmcmFtZXMgcHJlbG9hZGluZyB7XCIsXG5cdFx0XHRcIjAgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcdFwiNTAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyB9XCIsXG5cdFx0XHRcIjEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcIn1cIixcblx0XHRcIkAtbXMta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCJALW8ta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCIuc3djLXdpZGdldC1sb2FkZXIge1wiLFxuXHRcdFx0XCJwb3NpdGlvbjogYWJzb2x1dGU7XCIsXG5cdFx0XHRcIndpZHRoOiAxMDAlO1wiLFxuXHRcdFx0XCJ0b3A6IDUwJTtcIixcblx0XHRcdFwibWFyZ2luLXRvcDogLTE4cHg7XCIsXG5cdFx0XHRcInRleHQtYWxpZ246IGNlbnRlcjtcIixcblx0XHRcIn1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciBzcGFuIHtcIixcblx0XHRcdFwiZGlzcGxheTogaW5saW5lLWJsb2NrO1wiLFxuXHRcdFx0XCJ3aWR0aDogMThweDtcIixcblx0XHRcdFwiaGVpZ2h0OiAxOHB4O1wiLFxuXHRcdFx0XCJib3JkZXItcmFkaXVzOiA1MCU7XCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3I6ICNmZmY7XCIsXG5cdFx0XHRcIm1hcmdpbjogM3B4O1wiLFxuXHRcdFwifVwiLFxuXHRcdFwiLnN3Yy13aWRnZXQtbG9hZGVyIHNwYW46bnRoLWxhc3QtY2hpbGQoMSkgeyAtd2Via2l0LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgLW1vei1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4xcyBsaW5lYXIgaW5maW5pdGU7IC1tcy1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4xcyBsaW5lYXIgaW5maW5pdGU7IC1vLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuMXMgbGluZWFyIGluZmluaXRlOyB9XCIsXG5cdFx0XCIuc3djLXdpZGdldC1sb2FkZXIgc3BhbjpudGgtbGFzdC1jaGlsZCgyKSB7IC13ZWJraXQtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyAtbW96LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjNzIGxpbmVhciBpbmZpbml0ZTsgLW1zLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjNzIGxpbmVhciBpbmZpbml0ZTsgLW8tYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyBhbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4zcyBsaW5lYXIgaW5maW5pdGU7IH1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciBzcGFuOm50aC1sYXN0LWNoaWxkKDMpIHsgLXdlYmtpdC1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IC1tb3otYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuNXMgbGluZWFyIGluZmluaXRlOyAtbXMtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuNXMgbGluZWFyIGluZmluaXRlOyAtby1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IGFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjVzIGxpbmVhciBpbmZpbml0ZTsgfVwiLFxuXHRdLmpvaW4oXCIgXCIpO1xuXG5cdHN0eWxlLmlubmVySFRNTCA9IHRoZVJ1bGVzO1xufVxuXG4vKipcbiAqIFNldCBXaWRnZXQgZXZlbnQgbGlzdGVuZXJzXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHdpZGdldCAtIFdpZGdldCBIVE1MIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gc2V0TGlzdGVuZXJzKHdpZGdldCl7XG5cdC8vIHZhciBzZW5kTXNnQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4Kyctc2VuZC1tZXNzYWdlJyksXG5cdHZhciBmaWxlU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctZmlsZS1zZWxlY3QnKTtcblx0dmFyIHRleHRGaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2UtdGV4dCcpO1xuXHR2YXIgaW5wdXRzID0gW10uc2xpY2UuY2FsbCh3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLicrZGVmYXVsdHMucHJlZml4KyctaW5wdXRmaWxlJykpO1xuXHR2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctYnRuLWNvbnQnKTtcblx0dmFyIHBhbmVzID0gW10uc2xpY2UuY2FsbCh3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLicrZGVmYXVsdHMucHJlZml4Kyctd2ctcGFuZScpKTtcblx0dmFyIG1lc3NhZ2VzQ29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblxuXHRpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihpbnB1dCl7XG5cdFx0dmFyIGxhYmVsID0gaW5wdXQubmV4dEVsZW1lbnRTaWJsaW5nLFxuXHRcdFx0bGFiZWxWYWwgPSBsYWJlbC50ZXh0Q29udGVudDtcblxuXHRcdGFkZEV2ZW50KGlucHV0LCAnY2hhbmdlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgZmlsZU5hbWUgPSBlLnRhcmdldC52YWx1ZS5zcGxpdCggJ1xcXFwnICkucG9wKCk7XG5cdFx0XHRpZihmaWxlTmFtZSlcblx0XHRcdFx0bGFiZWwudGV4dENvbnRlbnQgPSBmaWxlTmFtZTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0bGFiZWwudGV4dENvbnRlbnQgPSBsYWJlbFZhbDtcblx0XHR9KTtcblx0fSk7XG5cblx0YWRkRXZlbnQoYnRuLCAnY2xpY2snLCBidG5DbGlja0hhbmRsZXIpO1xuXHRhZGRFdmVudCh3aWRnZXQsICdjbGljaycsIHdnQ2xpY2tIYW5kbGVyKTtcblx0YWRkRXZlbnQod2lkZ2V0LCAnc3VibWl0Jywgd2dTdWJtaXRIYW5kbGVyKTtcblx0Ly8gYWRkRXZlbnQoc2VuZE1zZ0J0biwgJ2NsaWNrJywgd2dTZW5kTWVzc2FnZSk7XG5cdGFkZEV2ZW50KGZpbGVTZWxlY3QsICdjaGFuZ2UnLCB3Z1NlbmRGaWxlKTtcblx0YWRkRXZlbnQodGV4dEZpZWxkLCAna2V5cHJlc3MnLCB3Z1R5cGluZ0hhbmRsZXIpO1xuXHRhZGRFdmVudCh0ZXh0RmllbGQsICdmb2N1cycsIHdnVGV4dGFyZWFGb2N1c0hhbmRsZXIpO1xuXHRhZGRFdmVudCh0ZXh0RmllbGQsICdibHVyJywgd2dUZXh0YXJlYUJsdXJIYW5kbGVyKTtcblxuXHRhZGRFdmVudChnbG9iYWwsICdET01Nb3VzZVNjcm9sbCcsIHdnR2xvYmFsU2Nyb2xsSGFuZGxlcik7XG5cdGFkZEV2ZW50KGdsb2JhbCwgJ3doZWVsJywgd2dHbG9iYWxTY3JvbGxIYW5kbGVyKTtcblx0Ly8gd2luZG93Lm9udG91Y2htb3ZlICA9IHdnR2xvYmFsU2Nyb2xsSGFuZGxlcjsgLy8gbW9iaWxlXG5cblx0YWRkRXZlbnQod2lkZ2V0LCAnbW91c2VlbnRlcicsIG9uTW91c2VFbnRlcik7XG5cdGFkZEV2ZW50KHdpZGdldCwgJ21vdXNlbGVhdmUnLCBvbk1vdXNlTGVhdmUpO1xuXG5cdC8vIGlmKGRlZmF1bHRzLmJ1dHRvbkVsZW1lbnQpIFxuXHQvLyBcdGRlZmF1bHRzLmJ1dHRvbkVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwdWJsaWNBcGkub3BlbldpZGdldCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBzZXRIYW5kbGVycyhzZWxlY3Rvcikge1xuXHR2YXIgZm4gPSBkZWZhdWx0cy53aWRnZXQgPyBpbml0V2lkZ2V0U3RhdGUgOiBvcGVuV2lkZ2V0O1xuXHR2YXIgZWxzID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG5cdGVscy5tYXAoZnVuY3Rpb24oZWwpIHsgYWRkRXZlbnQoZWwsICdjbGljaycsIGZuKTsgcmV0dXJuIGVsOyB9KTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBXaWRnZXQgZXZlbnQgaGFuZGxlcnMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5mdW5jdGlvbiBvbk1vdXNlRW50ZXIoKSB7XG5cdG1vdXNlRm9jdXNlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIG9uTW91c2VMZWF2ZSgpIHtcblx0bW91c2VGb2N1c2VkID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHdnQ2xpY2tIYW5kbGVyKGUpe1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0LFxuXHRcdGhhbmRsZXIsXG5cdFx0cGFuZSxcblx0XHRocmVmLFxuXHRcdGRhdGFIcmVmO1xuXG5cdGlmKHRhcmcucGFyZW50Tm9kZS50YWdOYW1lID09PSAnQScgfHwgdGFyZy5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdCVVRUT04nKVxuXHRcdHRhcmcgPSB0YXJnLnBhcmVudE5vZGU7XG5cdFxuXHRoYW5kbGVyID0gdGFyZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtJytkZWZhdWx0cy5wcmVmaXgrJy1oYW5kbGVyJyk7XG5cdGRhdGFIcmVmID0gdGFyZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtJytkZWZhdWx0cy5wcmVmaXgrJy1saW5rJyk7XG5cblx0aWYoaGFuZGxlciA9PT0gJ2Nsb3NlV2lkZ2V0Jykge1xuXHRcdGNsb3NlV2lkZ2V0KCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnZmluaXNoJykge1xuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnKSkgc3dpdGNoUGFuZSgnY2xvc2VjaGF0Jyk7XG5cdFx0ZWxzZSBjbG9zZVdpZGdldCgpO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ3NlbmRNZXNzYWdlJykge1xuXHRcdHdnU2VuZE1lc3NhZ2UoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdvcGVuV2luZG93Jykge1xuXHRcdG9wZW5XaWRnZXQoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdyZWplY3RGb3JtJykge1xuXHRcdGFwaS5lbWl0KCdmb3JtL3JlamVjdCcsIHsgZm9ybU5hbWU6IF8uZmluZFBhcmVudCh0YXJnLCAnZm9ybScpLm5hbWUgfSk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnaW5pdENhbGwnKSB7XG5cdFx0aW5pdENhbGwoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0RmFsbGJhY2tDYWxsJykge1xuXHRcdGluaXRGYWxsYmFja0NhbGwoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0Q2FsbGJhY2snKSB7XG5cdFx0aW5pdENhbGxiYWNrKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnc2V0Q2FsbGJhY2snKSB7XG5cdFx0c2V0Q2FsbGJhY2soKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0Q2hhdCcpIHtcblx0XHRpbml0Q2hhdCgpO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ2VuZENhbGwnKSB7XG5cdFx0ZW5kQ2FsbCgpO1xuXHR9XG5cblx0aWYodGFyZy50YWdOYW1lID09PSAnQScpIHtcblx0XHRocmVmID0gdGFyZy5ocmVmO1xuXG5cdFx0aWYoZGF0YUhyZWYpIHtcblx0XHRcdGFwaS5saW5rRm9sbG93ZWQoZGF0YUhyZWYpO1xuXHRcdH0gZWxzZSBpZihocmVmLmluZGV4T2YoJyMnKSAhPT0gLTEpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHBhbmUgPSBocmVmLnN1YnN0cmluZyh0YXJnLmhyZWYuaW5kZXhPZignIycpKzEpO1xuXHRcdFx0aWYocGFuZSkgc3dpdGNoUGFuZShwYW5lKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gYnRuQ2xpY2tIYW5kbGVyKGUpe1xuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdHZhciB0YXJnID0gZS50YXJnZXQsXG5cdFx0Y3VyclRhcmcgPSBlLmN1cnJlbnRUYXJnZXQ7XG5cblx0Ly8gcmVtb3ZlIG5vdGlmaWNhdGlvbiBvZiBhIG5ldyBtZXNzYWdlXG5cdGlmKHRhcmcuaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLXVubm90aWZ5LWJ0bicpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdub3RpZmllZCcpO1xuXHRcdC8vIHJlc2V0IGJ1dHRvbiBoZWlnaHRcblx0XHQvLyByZXNldFN0eWxlcyhidG4uY2hpbGRyZW5bMF0pO1xuXHRcdHNldEJ1dHRvblN0eWxlKHdpZGdldFN0YXRlLnN0YXRlKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZihjdXJyVGFyZy5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctYnRuLWNvbnQnKSB7XG5cdFx0aW5pdFdpZGdldFN0YXRlKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gd2dHbG9iYWxTY3JvbGxIYW5kbGVyKGUpIHtcblx0dmFyIHRhcmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlcy1jb250Jyk7XG5cdHZhciBkaXIgPSBnZXRTY3JvbGxEaXJlY3Rpb24oZSk7XG5cdGlmKG1vdXNlRm9jdXNlZCkge1xuXHRcdGlmKHRhcmcuc2Nyb2xsVG9wID09PSAwICYmIGRpciA9PT0gJ3VwJykge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9IGVsc2UgaWYgKHRhcmcuc2Nyb2xsVG9wID49ICh0YXJnLnNjcm9sbEhlaWdodC10YXJnLmNsaWVudEhlaWdodCkgJiYgZGlyID09PSAnZG93bicpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbERpcmVjdGlvbihldmVudCkge1xuXHR2YXIgZGVsdGE7XG5cbiAgICBpZihldmVudC53aGVlbERlbHRhKSB7XG4gICAgICAgIGRlbHRhID0gZXZlbnQud2hlZWxEZWx0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YSA9IC0xICogZXZlbnQuZGVsdGFZO1xuICAgIH1cblxuICAgIGlmKGRlbHRhIDwgMCkge1xuICAgICAgICByZXR1cm4gXCJkb3duXCI7XG4gICAgfSBlbHNlIGlmKGRlbHRhID4gMCkge1xuICAgICAgICByZXR1cm4gXCJ1cFwiO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdFdpZGdldFN0YXRlKCl7XG5cdHZhciBjaGF0SW5Qcm9ncmVzcyA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnY2FjaGUnKTtcblx0dmFyIHdhc09wZW5lZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ29wZW5lZCcsICdzZXNzaW9uJyk7XG5cdHZhciBjYWxsSW5Qcm9ncmVzcyA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NhbGwnLCAnY2FjaGUnKTtcblx0Ly8gSWYgZWxlbWVudCBpcyBpbnRlcmFjdGVkLCB0aGVuIG5vIG5vdGlmaWNhdGlvbnMgb2YgYSBuZXcgbWVzc2FnZSBcblx0Ly8gd2lsbCBvY2N1ciBkdXJpbmcgY3VycmVudCBicm93c2VyIHNlc3Npb25cblx0c2V0SW50ZXJhY3RlZCgpO1xuXHQvLyBJZiB0aW1lb3V0IGlzIG9jY3VyZWQsIGluaXQgc2Vzc2lvbiBmaXJzdFxuXHRpZihoYXNXZ1N0YXRlKCd0aW1lb3V0JykpIHtcblx0XHRpbml0TW9kdWxlKCk7XG5cdH0gZWxzZSBpZihjaGF0SW5Qcm9ncmVzcyl7XG5cdFx0c2hvd1dpZGdldCgpO1xuXHR9IGVsc2UgaWYoIWxhbmdzLmxlbmd0aCl7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdFx0c2hvd1dpZGdldCgpO1xuXHR9IGVsc2UgaWYoZGVmYXVsdHMud2VicnRjRW5hYmxlZCl7XG5cdFx0Ly8gaWYgY2FsbCBpcyBpbiBwcm9ncmVzcyAtIGp1c3Qgc2hvdyB0aGUgd2lkZ2V0XG5cdFx0aWYoY2FsbEluUHJvZ3Jlc3MpIHtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIWRlZmF1bHRzLmNoYXQgJiYgIWRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2spIHtcblx0XHRcdFx0aW5pdENhbGwoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN3aXRjaFBhbmUoJ2Nob29zZUNvbm5lY3Rpb24nKTtcblx0XHRcdFx0c2hvd1dpZGdldCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmKGRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2spIHtcblx0XHRpZighZGVmYXVsdHMuY2hhdCAmJiAhZGVmYXVsdHMud2VicnRjRW5hYmxlZCkge1xuXHRcdFx0c3dpdGNoUGFuZSgnY2FsbGJhY2snKTtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3dpdGNoUGFuZSgnY2hvb3NlQ29ubmVjdGlvbicpO1xuXHRcdFx0c2hvd1dpZGdldCgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpbml0Q2hhdCgpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHdnU2VuZE1lc3NhZ2UoKXtcblx0dmFyIG1zZyxcblx0XHR0ZXh0YXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2UtdGV4dCcpO1xuXG5cdG1zZyA9IF8udHJpbSh0ZXh0YXJlYS52YWx1ZSk7XG5cdGlmKG1zZykge1xuXHRcdHNlbmRNZXNzYWdlKHsgbWVzc2FnZTogbXNnIH0pO1xuXHRcdHRleHRhcmVhLnZhbHVlID0gJyc7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0fVxuXHRpZighc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpKSB7XG5cdFx0aW5pdENoYXQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3Z1R5cGluZ0hhbmRsZXIoZSl7XG5cdHZhciB0YXJnID0gZS50YXJnZXQ7XG5cdHZhciBjbG9uZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3djLW1lc3NhZ2UtdGV4dC1jbG9uZVwiKTtcblxuXHRpZihlLmtleUNvZGUgPT09IDEwIHx8IGUua2V5Q29kZSA9PT0gMTMpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0d2dTZW5kTWVzc2FnZSgpO1xuXHR9IGVsc2Uge1xuXHRcdGlmKCF1c2VySXNUeXBpbmdUaW1lb3V0KSB7XG5cdFx0XHR1c2VySXNUeXBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0dXNlcklzVHlwaW5nVGltZW91dCA9IG51bGw7XG5cdFx0XHRcdGFwaS51c2VySXNUeXBpbmcoKTtcblx0XHRcdH0sIDEwMDApO1xuXHRcdH1cblx0fVxuXG5cdGNsb25lLmlubmVyVGV4dCA9IHRhcmcudmFsdWU7XG5cdHRhcmcuc3R5bGUuaGVpZ2h0ID0gY2xvbmUuY2xpZW50SGVpZ2h0KydweCc7XG5cblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPj0gODAgJiYgIWhhc1dnU3RhdGUoJ3R5cGUtZXh0ZW5kJykpXG5cdC8vIFx0YWRkV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPCA4MCAmJiBoYXNXZ1N0YXRlKCd0eXBlLWV4dGVuZCcpKVxuXHQvLyBcdHJlbW92ZVdnU3RhdGUoJ3R5cGUtZXh0ZW5kJyk7XG59XG5cbmZ1bmN0aW9uIHdnVGV4dGFyZWFGb2N1c0hhbmRsZXIoZSkge1xuXHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cdHRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvcjtcbn1cblxuZnVuY3Rpb24gd2dUZXh0YXJlYUJsdXJIYW5kbGVyKGUpIHtcblx0dmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXHR0YXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIiNmZmZcIjtcbn1cblxuZnVuY3Rpb24gd2dTdWJtaXRIYW5kbGVyKGUpe1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0O1xuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdGlmKHRhcmcudGFnTmFtZSA9PT0gJ0ZPUk0nKVxuXHRcdGFwaS5lbWl0KCdmb3JtL3N1Ym1pdCcsIHsgZm9ybUVsZW1lbnQ6IHRhcmcsIGZvcm1EYXRhOiBnZXRGb3JtRGF0YSh0YXJnKSB9KTtcbn1cblxuZnVuY3Rpb24gd2dTZW5kRmlsZShlKXtcblx0dmFyIHRhcmcgPSBlLnRhcmdldDtcblx0dmFyIGZpbGUgPSBnZXRGaWxlQ29udGVudCh0YXJnLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdGRlYnVnLmxvZygnd2dTZW5kRmlsZTogJywgcmVzdWx0KTtcblx0XHRpZihlcnIpIHtcblx0XHRcdGFsZXJ0KCdGaWxlIHdhcyBub3Qgc2VudCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZW5kTWVzc2FnZSh7IG1lc3NhZ2U6IHJlc3VsdC5maWxlbmFtZSwgZmlsZTogcmVzdWx0LmZpbGVkYXRhIH0pO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogV2lkZ2V0IGVsZW1lbnRzIG1hbmlwdWxhdGlvbiAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIHN3aXRjaFBhbmUocGFuZSl7XG5cdC8vIHZhciBwYW5lSWQgPSBkZWZhdWx0cy5wcmVmaXgrJy0nK3BhbmUrJy1wYW5lJztcblx0dmFyIGF0dHIgPSAnZGF0YS0nK2RlZmF1bHRzLnByZWZpeCsnLXBhbmUnO1xuXHR2YXIgcGFuZXMgPSBbXS5zbGljZS5jYWxsKHdpZGdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1wYW5lJykpO1xuXHQvLyBkZWJ1Zy5sb2coJ3N3aXRjaFBhbmUgcGFuZXM6JywgcGFuZXMsICdwYW5lOiAnLCBwYW5lKTtcblx0cGFuZXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcblx0XHRpZihpdGVtLmdldEF0dHJpYnV0ZShhdHRyKSA9PT0gcGFuZSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGlmKCF3aWRnZXRTdGF0ZS5hY3RpdmUpIHNob3dXaWRnZXQoKTtcbn1cblxuZnVuY3Rpb24gY2hhbmdlV2dTdGF0ZShwYXJhbXMpe1xuXHRpZighd2lkZ2V0IHx8IHdpZGdldFN0YXRlLnN0YXRlID09PSBwYXJhbXMuc3RhdGUpIHJldHVybjtcblx0aWYocGFyYW1zLnN0YXRlID09PSAnb2ZmbGluZScpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdvbmxpbmUnKTtcblx0fSBlbHNlIGlmKHBhcmFtcy5zdGF0ZSA9PT0gJ29ubGluZScpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdvZmZsaW5lJyk7XG5cdFx0XG5cdH1cblxuXHR2YXIgc3RhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1zdGF0ZScpO1xuXHRpZihzdGF0ZSkgc3RhdGUudGV4dENvbnRlbnQgPSBmcmFzZXNbY3VyckxhbmddLlRPUF9CQVIuU1RBVFVTW3BhcmFtcy5zdGF0ZV07XG5cblx0d2lkZ2V0U3RhdGUuc3RhdGUgPSBwYXJhbXMuc3RhdGU7XG5cdGFkZFdnU3RhdGUocGFyYW1zLnN0YXRlKTtcblx0c2V0QnV0dG9uU3R5bGUocGFyYW1zLnN0YXRlKTtcblx0YXBpLmVtaXQoJ3dpZGdldC9zdGF0ZWNoYW5nZScsIHsgc3RhdGU6IHBhcmFtcy5zdGF0ZSB9KTtcblx0XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldFN0YXRlKCkge1xuXHRyZXR1cm4gd2lkZ2V0U3RhdGUuc3RhdGUgPyB3aWRnZXRTdGF0ZS5zdGF0ZSA6ICgobGFuZ3MgJiZsYW5ncy5sZW5ndGgpID8gJ29ubGluZScgOiAnb2ZmbGluZScpO1xufVxuXG5mdW5jdGlvbiBzZXRTdHlsZXMoKSB7XG5cdHZhciB3Z0J0biA9IHdpZGdldC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1idG4nKTtcblxuXHRjb25zb2xlLmxvZygnc2V0U3R5bGVzOiAnLCB3Z0J0biwgZGVmYXVsdHMuYnV0dG9uU3R5bGVzKTtcblxuXHR3Z0J0bi5zdHlsZS5ib3JkZXJSYWRpdXMgPSBkZWZhdWx0cy5idXR0b25TdHlsZXMuYm9yZGVyUmFkaXVzO1xuXHR3Z0J0bi5zdHlsZS5ib3hTaGFkb3cgPSBkZWZhdWx0cy5idXR0b25TdHlsZXMuYm94U2hhZG93O1xufVxuXG4vLyBUT0RPOiBUaGlzIGlzIG5vdCBhIGdvb2Qgc29sdXRpb24gb3IgbWF5YmUgbm90IGEgZ29vZCBpbXBsZW1lbnRhdGlvblxuZnVuY3Rpb24gc2V0QnV0dG9uU3R5bGUoc3RhdGUpIHtcblx0Ly8gZGVidWcubG9nKCdzZXRCdXR0b25TdHlsZTogJywgc3RhdGUpO1xuXHRpZighd2lkZ2V0IHx8IGRlZmF1bHRzLmJ1dHRvblN0eWxlc1tzdGF0ZV0gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXHR2YXIgd2dCdG4gPSB3aWRnZXQucXVlcnlTZWxlY3RvcignLicrZGVmYXVsdHMucHJlZml4Kyctd2ctYnRuJyksXG5cdFx0YnRuSWNvbiA9IHdpZGdldC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy1idG4taWNvbicpO1xuXG5cdHdnQnRuLnN0eWxlLmJhY2tncm91bmQgPSBkZWZhdWx0cy5idXR0b25TdHlsZXNbc3RhdGVdLmJhY2tncm91bmRDb2xvcjtcblx0YnRuSWNvbi5zdHlsZS5jb2xvciA9IGRlZmF1bHRzLmJ1dHRvblN0eWxlc1tzdGF0ZV0uY29sb3IgfHwgZGVmYXVsdHMuYnV0dG9uU3R5bGVzLmNvbG9yO1xufVxuXG5mdW5jdGlvbiBhZGRXZ1N0YXRlKHN0YXRlKXtcblx0aWYod2lkZ2V0KSB3aWRnZXQuY2xhc3NMaXN0LmFkZChzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGhhc1dnU3RhdGUoc3RhdGUpe1xuXHRpZih3aWRnZXQpIHJldHVybiB3aWRnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKHN0YXRlKTtcblx0ZWxzZSByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVdnU3RhdGUoc3RhdGUpe1xuXHRpZih3aWRnZXQpIHdpZGdldC5jbGFzc0xpc3QucmVtb3ZlKHN0YXRlKTtcbn1cblxuZnVuY3Rpb24gc2hvd1dpZGdldCgpe1xuXHR2YXIgbWVzc2FnZXNDb250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbWVzc2FnZXMtY29udCcpO1xuXG5cdHdpZGdldFN0YXRlLmFjdGl2ZSA9IHRydWU7XG5cdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdvcGVuZWQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRhZGRXZ1N0YXRlKCdhY3RpdmUnKTtcblx0cmVtb3ZlV2dTdGF0ZSgnbm90aWZpZWQnKTtcblxuXHQvLyByZXNldCBidXR0b24gaGVpZ2h0XG5cdC8vIHJlc2V0U3R5bGVzKGJ0bi5jaGlsZHJlblswXSk7XG5cdHNldEJ1dHRvblN0eWxlKHdpZGdldFN0YXRlLnN0YXRlKTtcblxuXHRtZXNzYWdlc0NvbnQuc2Nyb2xsVG9wID0gbWVzc2FnZXNDb250LnNjcm9sbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gY2xvc2VXaWRnZXQoKXtcblx0aWYod2luZG93Lm9wZW5lcikge1xuXHRcdHdpbmRvdy5jbG9zZSgpO1xuXHR9IGVsc2Uge1xuXHRcdHdpZGdldFN0YXRlLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdvcGVuZWQnLCBmYWxzZSwgJ3Nlc3Npb24nKTtcblx0XHRyZW1vdmVXZ1N0YXRlKCdhY3RpdmUnKTtcblx0fVxufVxuXG5mdW5jdGlvbiBvbkZvcm1TdWJtaXQocGFyYW1zKXtcblx0dmFyIGZvcm0gPSBwYXJhbXMuZm9ybUVsZW1lbnQ7XG5cdHZhciBmb3JtRGF0YSA9IHBhcmFtcy5mb3JtRGF0YTtcblx0Ly8gZGVidWcubG9nKCdvbkZvcm1TdWJtaXQ6ICcsIGZvcm0sIGZvcm1EYXRhKTtcblx0aWYoZm9ybS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsaWRhdGUtZm9ybScpKSB7XG5cdFx0dmFyIHZhbGlkID0gdmFsaWRhdGVGb3JtKGZvcm0pO1xuXHRcdGlmKCF2YWxpZCkgcmV0dXJuO1xuXHRcdC8vIGRlYnVnLmxvZygnb25Gb3JtU3VibWl0IHZhbGlkOiAnLCB2YWxpZCk7XG5cdH1cblx0aWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctY2xvc2VjaGF0LWZvcm0nKSB7XG5cdFx0c3VibWl0Q2xvc2VDaGF0Rm9ybShmb3JtLCBmb3JtRGF0YSk7XG5cdH0gZWxzZSBpZihmb3JtLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1zZW5kbWFpbC1mb3JtJykge1xuXHRcdHN1Ym1pdFNlbmRNYWlsRm9ybShmb3JtLCBmb3JtRGF0YSk7XG5cdH0gZWxzZSBpZihmb3JtLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1pbnRyby1mb3JtJykge1xuXHRcdHJlcXVlc3RDaGF0KGZvcm1EYXRhKTtcblx0fSBlbHNlIGlmKGZvcm0uaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtYnRuLWZvcm0nKXtcblx0XHRpbml0Q2FsbCgpO1xuXHR9IGVsc2UgaWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctY2hhdC1idG4tZm9ybScpe1xuXHRcdGluaXRDaGF0KCk7XG5cdH0gZWxzZSB7XG5cdFx0Y2xvc2VGb3JtKHsgZm9ybU5hbWU6IGZvcm0ubmFtZSB9LCB0cnVlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjbG9zZUZvcm0ocGFyYW1zLCBzdWJtaXQpe1xuXHR2YXIgZm9ybSA9IGdsb2JhbFtwYXJhbXMuZm9ybU5hbWVdO1xuXHRpZighZm9ybSkgcmV0dXJuIGZhbHNlO1xuXHRpZihzdWJtaXQpIHtcblx0XHRmb3JtLm91dGVySFRNTCA9ICc8cCBjbGFzcz1cIicrZGVmYXVsdHMucHJlZml4KyctdGV4dC1jZW50ZXJcIj4nK1xuXHRcdFx0XHRcdFx0XHQnPGkgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtc3VjY2VzcyAnK2RlZmF1bHRzLnByZWZpeCsnLWljb24tY2hlY2tcIj48L2k+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPiAnK2ZyYXNlc1tjdXJyTGFuZ10uRk9STVMuc3VibWl0dGVkKyc8L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L3A+Jztcblx0fSBlbHNlIHtcblx0XHRmb3JtLm91dGVySFRNTCA9ICc8cCBjbGFzcz1cIicrZGVmYXVsdHMucHJlZml4KyctdGV4dC1jZW50ZXJcIj4nK1xuXHRcdFx0XHRcdFx0XHQnPGkgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtZGFuZ2VyICcrZGVmYXVsdHMucHJlZml4KyctaWNvbi1yZW1vdmVcIj48L2k+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPiAnK2ZyYXNlc1tjdXJyTGFuZ10uRk9STVMuY2FuY2VsZWQrJzwvc3Bhbj4nK1xuXHRcdFx0XHRcdFx0JzwvcD4nO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVDb250ZW50KGVsZW1lbnQsIGNiKXtcblx0dmFyIGZpbGVzID0gZWxlbWVudC5maWxlcyxcblx0XHRmaWxlLFxuXHRcdGRhdGEsXG5cdFx0cmVhZGVyO1xuXG5cdGlmKCFmaWxlcy5sZW5ndGgpIHJldHVybjtcblx0aWYoIWdsb2JhbC5GaWxlUmVhZGVyKSB7XG5cdFx0aWYoY2IpIGNiKCdPQlNPTEVURV9CUk9XU0VSJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZmlsZSA9IGZpbGVzWzBdO1xuXG5cdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGRhdGEgPSBldmVudC50YXJnZXQucmVzdWx0O1xuXHRcdGRhdGEgPSBkYXRhLnN1YnN0cmluZyhkYXRhLmluZGV4T2YoJywnKSsxKTtcblx0XHRpZihjYikgY2IobnVsbCwgeyBmaWxlZGF0YTogZGF0YSwgZmlsZW5hbWU6IGZpbGUubmFtZSB9KTtcblx0fTtcblx0cmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGFwaS5lbWl0KCdFcnJvcicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdFx0aWYoY2IpIGNiKGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdH07XG5cdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xufVxuXG5mdW5jdGlvbiBjb21waWxlVGVtcGxhdGUodGVtcGxhdGUsIGRhdGEpe1xuXHR2YXIgY29tcGlsZWQgPSB0ZW1wbGF0ZXNbdGVtcGxhdGVdO1xuXHRyZXR1cm4gY29tcGlsZWQoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyV2dNZXNzYWdlcygpIHtcblx0dmFyIGNvbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlcy1jb250Jyk7XG5cdHZhciBjbG9uZSA9IGNvbnQuY2xvbmVOb2RlKCk7XG5cdGNvbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY2xvbmUsIGNvbnQpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIEhlbHBlciBmdW5jdGlvbnMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5mdW5jdGlvbiBkZXRlY3RMYW5ndWFnZSgpe1xuXHR2YXIgc3RvcmFnZUxhbmcgPSBzdG9yYWdlLmdldFN0YXRlKCdsYW5nJyksXG5cdFx0YXZhaWxhYmxlTGFuZ3MgPSBbXSxcblx0XHRsYW5nLFxuXHRcdHBhdGg7XG5cblx0aWYoc3RvcmFnZUxhbmcpIHtcblx0XHRsYW5nID0gc3RvcmFnZUxhbmc7XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBsaXN0IGF2YWlsYWJsZSBsYW5ndWFnZXMgYnkgdHJhbnNsYXRpb25zIGtleXNcblx0XHRmb3IodmFyIGtleSBpbiBmcmFzZXMpIHtcblx0XHRcdGF2YWlsYWJsZUxhbmdzLnB1c2goa2V5KTtcblx0XHR9XG5cblx0XHRpZihkZWZhdWx0cy5sYW5nRnJvbVVybCkge1xuXHRcdFx0Z2xvYmFsLmxvY2F0aW9uLnBhdGhuYW1lXG5cdFx0XHQuc3BsaXQoJy8nKVxuXHRcdFx0Lm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdGl0ZW0gPSBoYW5kbGVBbGlhc2VzKGl0ZW0pO1xuXHRcdFx0XHRpZihhdmFpbGFibGVMYW5ncy5pbmRleE9mKGl0ZW0pICE9PSAtMSkge1xuXHRcdFx0XHRcdGxhbmcgPSBpdGVtO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGl0ZW07XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZighbGFuZykge1xuXHRcdFx0bGFuZyA9IGRlZmF1bHRzLmxhbmcgfHwgKG5hdmlnYXRvci5sYW5ndWFnZSB8fCBuYXZpZ2F0b3IudXNlckxhbmd1YWdlKS5zcGxpdCgnLScpWzBdO1xuXHRcdFx0aWYoYXZhaWxhYmxlTGFuZ3MuaW5kZXhPZihsYW5nKSA9PT0gLTEpIGxhbmcgPSAnZW4nO1xuXHRcdH1cblx0fVxuXG5cdGRlYnVnLmxvZygnZGV0ZWN0ZWQgbGFuZzogJywgbGFuZyk7XG5cblx0cmV0dXJuIGxhbmc7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFsaWFzZXMoYWxpYXMpIHtcblx0dmFyIGxhbmcgPSBhbGlhcztcblx0aWYoYWxpYXMgPT09ICd1YScpIGxhbmcgPSAndWsnO1xuXHRpZihhbGlhcyA9PT0gJ3VzJyB8fCBhbGlhcyA9PT0gJ2diJykgbGFuZyA9ICdlbic7XG5cdHJldHVybiBsYW5nO1xufVxuXG5mdW5jdGlvbiBicm93c2VySXNPYnNvbGV0ZSgpIHtcblx0ZGVidWcud2FybignWW91ciBicm93c2VyIGlzIG9ic29sZXRlIScpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRpbWUodHMpIHtcblx0dmFyIGRhdGUgPSBuZXcgRGF0ZSh0cyksXG5cdFx0aG91cnMgPSBkYXRlLmdldEhvdXJzKCksXG5cdFx0bWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpLFxuXHRcdHRpbWUgPSAoaG91cnMgPCAxMCA/ICcwJytob3VycyA6IGhvdXJzKSArICc6JyArIChtaW51dGVzIDwgMTAgPyAnMCcrbWludXRlcyA6IG1pbnV0ZXMpO1xuXG5cdHJldHVybiB0aW1lO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1lc3NhZ2UodGV4dCwgZmlsZSwgZW50aXR5KXtcblx0dmFyIGZpbGVuYW1lLCBmb3JtO1xuXHRpZihmaWxlKSB7XG5cdFx0ZmlsZW5hbWUgPSB0ZXh0LnN1YnN0cmluZyh0ZXh0LmluZGV4T2YoJ18nKSsxKTtcblx0XHRpZihpc0ltYWdlKGZpbGUpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0XHRjb250ZW50OiAnPGEgaHJlZj1cIicrYXBpLm9wdGlvbnMuc2VydmVyKycvaXBjYy8nK3RleHQrJ1wiIGRvd25sb2FkPVwiJytmaWxlbmFtZSsnXCI+JyArXG5cdFx0XHRcdFx0XHQnPGltZyBzcmM9XCInK2FwaS5vcHRpb25zLnNlcnZlcisnL2lwY2MvJyt0ZXh0KydcIiBhbHQ9XCJmaWxlIHByZXZpZXdcIiAvPicgK1xuXHRcdFx0XHRcdCc8L2E+J1xuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZTogJ2ZpbGUnLFxuXHRcdFx0XHRjb250ZW50OiAnPGEgaHJlZj1cIicrYXBpLm9wdGlvbnMuc2VydmVyKycvaXBjYy8nK3RleHQrJ1wiIGRvd25sb2FkPVwiJytmaWxlbmFtZSsnXCI+JytmaWxlbmFtZSsnPC9hPidcblx0XHRcdH07XG5cdFx0fVxuXHR9IGVsc2UgaWYoZW50aXR5ID09PSAnYWdlbnQnICYmIGlzTGluayh0ZXh0KSAmJiBpc0ltYWdlKHRleHQpKSB7XG5cdFx0ZmlsZW5hbWUgPSB0ZXh0LnN1YnN0cmluZyh0ZXh0LmluZGV4T2YoJ18nKSsxKVxuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0Y29udGVudDogJzxhIGhyZWY9XCInK3RleHQrJ1wiIHRhcmdldD1cIl9ibGFua1wiPicgK1xuXHRcdFx0XHRcdCc8aW1nIHNyYz1cIicrdGV4dCsnXCIgYWx0PVwiJytmaWxlbmFtZSsnXCIgLz4nICtcblx0XHRcdFx0JzwvYT4nXG5cdFx0fTtcblx0fSBlbHNlIGlmKGVudGl0eSA9PT0gJ2FnZW50JyAmJiBuZXcgUmVnRXhwKCdeey4rfSQnKS50ZXN0KHRleHQpKSB7XG5cdFx0Zm9ybXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRpZihpdGVtLm5hbWUgPT09IHRleHQuc3Vic3RyaW5nKDEsIHRleHQubGVuZ3RoLTEpKSB7XG5cdFx0XHRcdGZvcm0gPSBpdGVtO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IGZvcm0gPyAnZm9ybScgOiAndGV4dCcsXG5cdFx0XHRjb250ZW50OiBmb3JtID8gZm9ybSA6IHRleHRcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRjb250ZW50OiB0ZXh0LnJlcGxhY2UoL1xcbi9nLCAnIDxicj4gJykuc3BsaXQoXCIgXCIpLm1hcChjb252ZXJ0TGlua3MpLmpvaW4oXCIgXCIpLnJlcGxhY2UoJyA8YnI+ICcsICc8YnI+Jylcblx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaW5rcyh0ZXh0KXtcblx0dmFyIGxlZnRvdmVycyA9IDA7XG5cdHZhciBocmVmID0gdGV4dDtcblx0aWYoaXNMaW5rKHRleHQpKXtcblxuXHRcdHdoaWxlKCEoaHJlZi5jaGFyQXQoaHJlZi5sZW5ndGgtMSkubWF0Y2goL1thLXowLTlcXC9dL2kpKSl7XG5cdFx0XHRocmVmID0gaHJlZi5zbGljZSgwLC0xKTtcblx0XHRcdGxlZnRvdmVycyArPSAxO1xuXHRcdH1cblx0XHRyZXR1cm4gJzxhIGhyZWY9XCInK2hyZWYrJ1wiIHRhcmdldD1cIl9ibGFua1wiIGRhdGEtJytkZWZhdWx0cy5wcmVmaXgrJy1saW5rPVwiJytocmVmKydcIj4nK2hyZWYrJzwvYT4nICsgdGV4dC5zdWJzdHIodGV4dC5sZW5ndGggLSBsZWZ0b3ZlcnMpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB0ZXh0O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGlzTGluayh0ZXh0KXtcblx0dmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeaHR0cDpcXC9cXC98Xmh0dHBzOlxcL1xcLycpO1xuXHRyZXR1cm4gcGF0dGVybi50ZXN0KHRleHQpO1xufVxuXG5mdW5jdGlvbiBpc0ltYWdlKGZpbGVuYW1lKXtcblx0dmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgncG5nfFBOR3xqcGd8SlBHfEpQRUd8anBlZ3xnaWZ8R0lGJyk7XG5cdHZhciBleHQgPSBmaWxlbmFtZS5zdWJzdHJpbmcoZmlsZW5hbWUubGFzdEluZGV4T2YoJy4nKSsxKTtcblx0cmV0dXJuIHJlZ2V4LnRlc3QoZXh0KTtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybURhdGEoZm9ybSl7XG5cdHZhciBmb3JtRGF0YSA9IHt9O1xuXHRbXS5zbGljZS5jYWxsKGZvcm0uZWxlbWVudHMpLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcblx0XHRpZihlbC50eXBlID09PSAnY2hlY2tib3gnKSBmb3JtRGF0YVtlbC5uYW1lXSA9IGVsLmNoZWNrZWQ7XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZihlbC52YWx1ZSkgZm9ybURhdGFbZWwubmFtZV0gPSBlbC52YWx1ZTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gZm9ybURhdGE7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShmb3JtKXtcblx0dmFyIHZhbGlkID0gdHJ1ZTtcblx0W10uc2xpY2UuY2FsbChmb3JtLmVsZW1lbnRzKS5ldmVyeShmdW5jdGlvbihlbCkge1xuXHRcdC8vIGRlYnVnLmxvZygndmFsaWRhdGVGb3JtIGVsOicsIGVsLCBlbC5oYXNBdHRyaWJ1dGUoJ3JlcXVpcmVkJyksIGVsLnZhbHVlLCBlbC50eXBlKTtcblx0XHRpZihlbC5oYXNBdHRyaWJ1dGUoJ3JlcXVpcmVkJykgJiYgKGVsLnZhbHVlID09PSBcIlwiIHx8IGVsLnZhbHVlID09PSBudWxsKSkge1xuXHRcdFx0YWxlcnQoZnJhc2VzW2N1cnJMYW5nXS5FUlJPUlNbZWwudHlwZV0gfHwgZnJhc2VzW2N1cnJMYW5nXS5FUlJPUlMucmVxdWlyZWQpO1xuXHRcdFx0dmFsaWQgPSBmYWxzZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9KTtcblx0Ly8gZGVidWcubG9nKCd2YWxpZGF0ZUZvcm0gdmFsaWQ6ICcsIHZhbGlkKTtcblx0cmV0dXJuIHZhbGlkO1xufVxuXG4vLyBmdW5jdGlvbiByZXNldFN0eWxlcyhlbGVtZW50KXtcbi8vIFx0ZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4vLyB9XG5cbmZ1bmN0aW9uIGFkZFdpZGdldFN0eWxlcygpe1xuXHRcblx0dmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG5cdFx0bGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG5cdFx0bGluay5ocmVmID0gZGVmYXVsdHMuc3R5bGVzUGF0aCB8fCBkZWZhdWx0cy5jbGllbnRQYXRoKydtYWluLmNzcyc7XG5cblx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbn1cblxuZnVuY3Rpb24gUHJlZml4ZWRFdmVudChlbGVtZW50LCB0eXBlLCBwZngsIGNhbGxiYWNrKSB7XG5cdGZvciAodmFyIHAgPSAwOyBwIDwgcGZ4Lmxlbmd0aDsgcCsrKSB7XG5cdFx0aWYgKCFwZnhbcF0pIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXSt0eXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lKHNlY29uZHMpe1xuXHR2YXIgbWludXRlcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDYwKSxcblx0XHRzZWNzUmVtYWluID0gc2Vjb25kcyAlIDYwLFxuXHRcdHN0ciA9IChtaW51dGVzID4gOSA/IG1pbnV0ZXMgOiAnMCcgKyBtaW51dGVzKSArICc6JyArIChzZWNzUmVtYWluID4gOSA/IHNlY3NSZW1haW4gOiAnMCcgKyBzZWNzUmVtYWluKTtcblx0cmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UGhvbmVOdW1iZXIocGhvbmUpIHtcblx0cmV0dXJuIHBob25lLnJlcGxhY2UoL1xcRCsvZywgXCJcIik7XG59XG5cbmZ1bmN0aW9uIGlzQnJvd3NlclN1cHBvcnRlZCgpIHtcblx0cmV0dXJuIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLmFkZEV2ZW50TGlzdGVuZXIpIG9iai5hZGRFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmF0dGFjaEV2ZW50KSBvYmouYXR0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufVxuZnVuY3Rpb24gcmVtb3ZlRXZlbnQob2JqLCBldlR5cGUsIGZuKSB7XG4gIGlmIChvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcikgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZUeXBlLCBmbiwgZmFsc2UpO1xuICBlbHNlIGlmIChvYmouZGV0YWNoRXZlbnQpIG9iai5kZXRhY2hFdmVudChcIm9uXCIrZXZUeXBlLCBmbik7XG59XG4iXX0=
