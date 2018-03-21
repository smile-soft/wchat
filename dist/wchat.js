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
var updateInterval = null;
var updateIntervalValue = 5000;
var updateStateInterval = null;
var checkEvery = _.debounce(unshareBrowser, 30000);
var cursorX = 0, cursorY = 0;
var requestAF;

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
	updateInterval = setInterval(emitEvents, updateIntervalValue);

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
    updateStateInterval = setInterval(updateState, updateIntervalValue);
    clearInterval(updateInterval);

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
    updateInterval = setInterval(emitEvents, updateIntervalValue);
    clearInterval(updateStateInterval);

	emit('cobrowsing/unshared', { entity: entity });
    debug.log('browser unshared');
}

function unshareAll(){
	// removeEvent(document, 'keyup', eventsHandler);
	// removeEvent(document, 'keydown', eventsHandler);
	// removeEvent(document, 'keypress', eventsHandler);
	// removeEvent(document, 'mouseup', eventsHandler);
	// removeEvent(document, 'click', eventsHandler);
	// removeEvent(document, 'change', eventsHandler);
	clearInterval(updateInterval);
}

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

function updateState(){
	localEvents.push({ shared: true, entity: entity });
}

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
}

function updateEvents(result){
	var mainElement = document.documentElement,
		target,
		evt = {};

	if(result.events && result.events.length) {

		// check for scrollTop/Left. 
		// IE and Firefox always return 0 from document.body.scrollTop/Left, 
		// while other browsers return 0 from document.documentElement
		mainElement = ('ActiveXObject' in window || typeof InstallTrigger !== 'undefined') ? document.documentElement : document.body;

		for(var i=0; i<result.events.length; i++) {
			evt = result.events[i];

			// if(evt.shared !== undefined) debug.log('shared events', eventTimestamp, evt, result.init);
			if(evt.timestamp < eventTimestamp) continue;
			if(evt.entity === entity) continue;
					
			if(evt.shared !== undefined){
				if(evt.shared){
					checkEvery();
					shareBrowser();
				} else {
					if(!result.historyEvents) unshareBrowser();
				}
			}
			if(evt.url) {
				if(!result.historyEvents) {
					var url = evt.url;
					var docUrl = document.URL;
					if(docUrl.indexOf('chatSessionId') !== -1) {
						docUrl = docUrl.substr(0, docUrl.indexOf('chatSessionId')-1);
					}
					if(url != docUrl) changeURL(url);
				}
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
	if(shared) emitEvents();
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

module.exports = {
	init: init,
	isInitiated: isInitiated,
	share: shareBrowser,
	unshare: unshareBrowser,
	unshareAll: unshareAll,
	emitEvents: emitEvents,
	updateEvents: updateEvents
};
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
		storage.saveState('sid', sid);
		this.joinSession(sid);
	} else if(entity === 'agent' && sid) { // In case the cobrowsing session is active
		this.joinSession(sid, url.href);
	} else {

		// In case a session is already initiated 
		// and storage containes sid parameter
		if(sid) {
			// this.updateEvents([{ entity: entity, url: url.href }], function (err, result){
			// 	if(err) {
			// 		return;
			// 	}
				
				storage.saveState('sid', sid);
				// this.emit('session/continue', { entity: entity, url: url.href });
				this.createSession({ sid: sid, url: url.href });
			// }.bind(this));
		} else {
			storage.saveState('entity', 'user', 'session');
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

		body.result.url = url.href;
		storage.saveState('sid', body.result.sid);
		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(sid, url){
	this.emit('session/join', { sid: sid, url: url });
};

/** 
 * Send/obtain events to/from the server. 
 * Events could be obtained from the server by specifying a timestamp
 * as a starting point from which an events would be obtained
**/
WchatAPI.prototype.updateEvents = function(events, cb){
	var sessionId = storage.getState('sid'), params;
	if(!sessionId) return cb();
	
	params = {
		method: 'updateEvents',
		params: {
			sid: sessionId,
			timestamp: storage.getState('eventTimestamp', 'cache'),
			events: events
		}
	};
	request.post(this.options.serverUrl, params, function (err, body){
		if(err) {
			this.emit('Error', err, params);
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
	params.sid = storage.getState('sid');

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
			sid: storage.getState('sid'),
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
			sid: storage.getState('sid')
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
			sid: storage.getState('sid'),
			content: params.message
		}
	};

	if(this.websocket) {
		if(params.file) {
			var content = publicUrl+Date.now()+"_"+this.options.pageid+"_"+params.message;
			data.params.content = content;

			request.put(content, params.file, function(err, result) {
				if(err) return console.error('sendMessage error: ', err);
				this.sendData(data);
			});

		} else {
			this.sendData(data);
		}
		
		return;
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
	params.sid = storage.getState('sid');

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
	params.sid = storage.getState('sid');

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

/**
 * Informs the server that the cobrowsing feature is turned on or off
 * @param  {Boolean} state Represents the state of cobrowsing feature
 * @param  {String} url   Url where the feature's state is changed
 * @return none
 */
WchatAPI.prototype.switchShareState = function(state, url){
	var method = state ? 'shareOpened' : 'shareClosed';
	request.post(this.options.serverUrl, {
		method: method,
		params: {
			sid: storage.getState('sid'),
			url: url
		}
	}, function(err, body){
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
			sid: storage.getState('sid')
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
			sid: storage.getState('sid'),
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
			sid: storage.getState('sid'),
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
	if(!defaults.external) {
		// api.updateUrl(window.location.href);

		if(defaults.cobrowsing) {
			initCobrowsingModule({
				url: window.location.href,
				entity: storage.getState('entity', 'session'),
				widget: '#'+defaults.prefix+'-wg-cont'
			});
		}
	}

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

function initCobrowsingModule(params){
	// init cobrowsing module only on main window
	if(defaults.external || cobrowsing.isInitiated()) return;

	api.on('cobrowsing/init', function(){
		if(storage.getState('shared', 'session') || params.entity === 'agent') cobrowsing.share();
		// cobrowsing.emitEvents();
	});
	api.on('cobrowsing/event', function(params){
		api.updateEvents(params.events, function(err, result){
			if(err) return;
			if(result) cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/shared', function(){
		if(!storage.getState('shared', 'session') && params.entity === 'user') {
			storage.saveState('shared', true, 'session');
			api.switchShareState(true, params.url);
		}
		api.updateEvents([{ entity: params.entity, url: params.url, shared: true }], function(err, result){
			// if(err) return;
			result.historyEvents = true;
			// debug.log('cobrowsing update: ', result);
			cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/unshared', function(params){
		storage.saveState('shared', false, 'session');
		api.updateEvents([{ entity: params.entity, url: params.url, shared: false }], function(err){
			// if(err) return;
			if(params.entity === 'user') api.switchShareState(false, window.location.href);
			else cobrowsing.unshareAll();
		});
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
		defaultUname = false,
		credentials = storage.getState('credentials', 'session') || {},
		aname = storage.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : ''
		messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	if(uname === storage.getState('sid').split('_')[0]) {
		defaultUname = true;
	}

	// result.messages.forEach(function(message, index) {
		
		message.entity = message.from === uname ? 'user' : 'agent';
		// message.from = (message.entity === 'user' && defaultUname) ? frases[currLang].default_user_name : message.from;
		message.from = (message.entity === 'user' && defaultUname) ? '' : message.from;
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
		storage.removeState('sid');

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
	debug.log('open widget: ', storage.getState('sid'));
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
			.forEach(function(item) {
				if(availableLangs.indexOf(item) !== -1) {
					lang = item;
				}
			});
		}

		if(!lang) {
			lang = defaults.lang || (navigator.language || navigator.userLanguage).split('-')[0];
			if(availableLangs.indexOf(lang) === -1) lang = 'en';
		}
	}

	// debug.log('detected lang: ', lang);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZG9taWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9mb3JFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kYXRlL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2Z1bmN0aW9uL3Jlc3RQYXJhbS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5Q29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheVNvbWUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Fzc2lnbk93bkRlZmF1bHRzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hc3NpZ25XaXRoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQXNzaWduLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlQ29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3JJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvck93bi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc0VxdWFsRGVlcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZU1lcmdlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWVyZ2VEZWVwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VUb1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVZhbHVlcy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmluZENhbGxiYWNrLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jaGFyc0xlZnRJbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY2hhcnNSaWdodEluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVBc3NpZ25lci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUJhc2VGb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsQXJyYXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbEJ5VGFnLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lcXVhbE9iamVjdHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VzY2FwZUh0bWxDaGFyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lc2NhcGVTdHJpbmdDaGFyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXRMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldE5hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNBcnJheUxpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSXRlcmF0ZWVDYWxsLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc1NwYWNlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9yZUVzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcmVFdmFsdWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcmVJbnRlcnBvbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvc2hpbUtleXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3RvT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90cmltbWVkTGVmdEluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90cmltbWVkUmlnaHRJbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNFcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzTmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNUeXBlZEFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL3RvUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5c0luLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3QvbWVyZ2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy9lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvc3RyaW5nL3RlbXBsYXRlU2V0dGluZ3MuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy90cmltLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC91dGlsaXR5L2F0dGVtcHQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3V0aWxpdHkvaWRlbnRpdHkuanMiLCJzb3VyY2Uvc2NyaXB0cy9hdWRpby1jb250cm9sLmpzIiwic291cmNlL3NjcmlwdHMvY29icm93c2luZy5qcyIsInNvdXJjZS9zY3JpcHRzL2NvcmUuanMiLCJzb3VyY2Uvc2NyaXB0cy9kZWJ1Zy5qcyIsInNvdXJjZS9zY3JpcHRzL2xvZGFzaC5qcyIsInNvdXJjZS9zY3JpcHRzL21haW4uanMiLCJzb3VyY2Uvc2NyaXB0cy9yZXF1ZXN0LmpzIiwic291cmNlL3NjcmlwdHMvc3RvcmFnZS5qcyIsInNvdXJjZS9zY3JpcHRzL3RlbXBsYXRlcy5qcyIsInNvdXJjZS9zY3JpcHRzL3dlYnJ0Yy5qcyIsInNvdXJjZS9zY3JpcHRzL3dpZGdldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDN25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBUZXN0cyBmb3IgYnJvd3NlciBzdXBwb3J0LlxuICovXG5cbnZhciBpbm5lckhUTUxCdWcgPSBmYWxzZTtcbnZhciBidWdUZXN0RGl2O1xuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgYnVnVGVzdERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAvLyBTZXR1cFxuICBidWdUZXN0RGl2LmlubmVySFRNTCA9ICcgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+JztcbiAgLy8gTWFrZSBzdXJlIHRoYXQgbGluayBlbGVtZW50cyBnZXQgc2VyaWFsaXplZCBjb3JyZWN0bHkgYnkgaW5uZXJIVE1MXG4gIC8vIFRoaXMgcmVxdWlyZXMgYSB3cmFwcGVyIGVsZW1lbnQgaW4gSUVcbiAgaW5uZXJIVE1MQnVnID0gIWJ1Z1Rlc3REaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpbmsnKS5sZW5ndGg7XG4gIGJ1Z1Rlc3REaXYgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogV3JhcCBtYXAgZnJvbSBqcXVlcnkuXG4gKi9cblxudmFyIG1hcCA9IHtcbiAgbGVnZW5kOiBbMSwgJzxmaWVsZHNldD4nLCAnPC9maWVsZHNldD4nXSxcbiAgdHI6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICBjb2w6IFsyLCAnPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD4nLCAnPC9jb2xncm91cD48L3RhYmxlPiddLFxuICAvLyBmb3Igc2NyaXB0L2xpbmsvc3R5bGUgdGFncyB0byB3b3JrIGluIElFNi04LCB5b3UgaGF2ZSB0byB3cmFwXG4gIC8vIGluIGEgZGl2IHdpdGggYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgaW4gZnJvbnQsIGhhIVxuICBfZGVmYXVsdDogaW5uZXJIVE1MQnVnID8gWzEsICdYPGRpdj4nLCAnPC9kaXY+J10gOiBbMCwgJycsICcnXVxufTtcblxubWFwLnRkID1cbm1hcC50aCA9IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddO1xuXG5tYXAub3B0aW9uID1cbm1hcC5vcHRncm91cCA9IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddO1xuXG5tYXAudGhlYWQgPVxubWFwLnRib2R5ID1cbm1hcC5jb2xncm91cCA9XG5tYXAuY2FwdGlvbiA9XG5tYXAudGZvb3QgPSBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXTtcblxubWFwLnBvbHlsaW5lID1cbm1hcC5lbGxpcHNlID1cbm1hcC5wb2x5Z29uID1cbm1hcC5jaXJjbGUgPVxubWFwLnRleHQgPVxubWFwLmxpbmUgPVxubWFwLnBhdGggPVxubWFwLnJlY3QgPVxubWFwLmcgPSBbMSwgJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLCc8L3N2Zz4nXTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiBhIERPTSBOb2RlIGluc3RhbmNlLCB3aGljaCBjb3VsZCBiZSBhIFRleHROb2RlLFxuICogSFRNTCBET00gTm9kZSBvZiBzb21lIGtpbmQgKDxkaXY+IGZvciBleGFtcGxlKSwgb3IgYSBEb2N1bWVudEZyYWdtZW50XG4gKiBpbnN0YW5jZSwgZGVwZW5kaW5nIG9uIHRoZSBjb250ZW50cyBvZiB0aGUgYGh0bWxgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbCAtIEhUTUwgc3RyaW5nIHRvIFwiZG9taWZ5XCJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyAtIFRoZSBgZG9jdW1lbnRgIGluc3RhbmNlIHRvIGNyZWF0ZSB0aGUgTm9kZSBmb3JcbiAqIEByZXR1cm4ge0RPTU5vZGV9IHRoZSBUZXh0Tm9kZSwgRE9NIE5vZGUsIG9yIERvY3VtZW50RnJhZ21lbnQgaW5zdGFuY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKGh0bWwsIGRvYykge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuXG4gIC8vIGRlZmF1bHQgdG8gdGhlIGdsb2JhbCBgZG9jdW1lbnRgIG9iamVjdFxuICBpZiAoIWRvYykgZG9jID0gZG9jdW1lbnQ7XG5cbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKGh0bWwpO1xuXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTsgLy8gUmVtb3ZlIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG4gIHZhciB0YWcgPSBtWzFdO1xuXG4gIC8vIGJvZHkgc3VwcG9ydFxuICBpZiAodGFnID09ICdib2R5Jykge1xuICAgIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuaW5uZXJIVE1MID0gcHJlZml4ICsgaHRtbCArIHN1ZmZpeDtcbiAgd2hpbGUgKGRlcHRoLS0pIGVsID0gZWwubGFzdENoaWxkO1xuXG4gIC8vIG9uZSBlbGVtZW50XG4gIGlmIChlbC5maXJzdENoaWxkID09IGVsLmxhc3RDaGlsZCkge1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHNldmVyYWwgZWxlbWVudHNcbiAgdmFyIGZyYWdtZW50ID0gZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKSk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnQ7XG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheUVhY2gnKSxcbiAgICBiYXNlRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VFYWNoJyksXG4gICAgY3JlYXRlRm9yRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUZvckVhY2gnKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGBjb2xsZWN0aW9uYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvciBlYWNoIGVsZW1lbnQuXG4gKiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6XG4gKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHlcbiAqIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogKipOb3RlOioqIEFzIHdpdGggb3RoZXIgXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMsIG9iamVjdHMgd2l0aCBhIFwibGVuZ3RoXCIgcHJvcGVydHlcbiAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICogbWF5IGJlIHVzZWQgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlYWNoXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8oWzEsIDJdKS5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAqICAgY29uc29sZS5sb2cobik7XG4gKiB9KS52YWx1ZSgpO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlIGZyb20gbGVmdCB0byByaWdodCBhbmQgcmV0dXJucyB0aGUgYXJyYXlcbiAqXG4gKiBfLmZvckVhY2goeyAnYSc6IDEsICdiJzogMiB9LCBmdW5jdGlvbihuLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2cobiwga2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlLWtleSBwYWlyIGFuZCByZXR1cm5zIHRoZSBvYmplY3QgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvckVhY2ggPSBjcmVhdGVGb3JFYWNoKGFycmF5RWFjaCwgYmFzZUVhY2gpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTm93ID0gZ2V0TmF0aXZlKERhdGUsICdub3cnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBVbml4IGVwb2NoXG4gKiAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IERhdGVcbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBpbnZva2VkXG4gKi9cbnZhciBub3cgPSBuYXRpdmVOb3cgfHwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4uL2RhdGUvbm93Jyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGludm9jYXRpb25zLiBQcm92aWRlIGFuIG9wdGlvbnMgb2JqZWN0IHRvIGluZGljYXRlIHRoYXQgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3RcbiAqIGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXMgaW52b2tlZFxuICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwOi8vZHJ1cGFsbW90aW9uLmNvbS9hcnRpY2xlL2RlYm91bmNlLWFuZC10aHJvdHRsZS12aXN1YWwtZXhwbGFuYXRpb24pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmVcbiAqICBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nXG4gKiAgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gYXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eFxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBpbnZva2UgYHNlbmRNYWlsYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzXG4gKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBlbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzXG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xuICogICAnbWF4V2FpdCc6IDEwMDBcbiAqIH0pKTtcbiAqXG4gKiAvLyBjYW5jZWwgYSBkZWJvdW5jZWQgY2FsbFxuICogdmFyIHRvZG9DaGFuZ2VzID0gXy5kZWJvdW5jZShiYXRjaExvZywgMTAwMCk7XG4gKiBPYmplY3Qub2JzZXJ2ZShtb2RlbHMudG9kbywgdG9kb0NoYW5nZXMpO1xuICpcbiAqIE9iamVjdC5vYnNlcnZlKG1vZGVscywgZnVuY3Rpb24oY2hhbmdlcykge1xuICogICBpZiAoXy5maW5kKGNoYW5nZXMsIHsgJ3VzZXInOiAndG9kbycsICd0eXBlJzogJ2RlbGV0ZSd9KSkge1xuICogICAgIHRvZG9DaGFuZ2VzLmNhbmNlbCgpO1xuICogICB9XG4gKiB9LCBbJ2RlbGV0ZSddKTtcbiAqXG4gKiAvLyAuLi5hdCBzb21lIHBvaW50IGBtb2RlbHMudG9kb2AgaXMgY2hhbmdlZFxuICogbW9kZWxzLnRvZG8uY29tcGxldGVkID0gdHJ1ZTtcbiAqXG4gKiAvLyAuLi5iZWZvcmUgMSBzZWNvbmQgaGFzIHBhc3NlZCBgbW9kZWxzLnRvZG9gIGlzIGRlbGV0ZWRcbiAqIC8vIHdoaWNoIGNhbmNlbHMgdGhlIGRlYm91bmNlZCBgdG9kb0NoYW5nZXNgIGNhbGxcbiAqIGRlbGV0ZSBtb2RlbHMudG9kbztcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgYXJncyxcbiAgICAgIG1heFRpbWVvdXRJZCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHN0YW1wLFxuICAgICAgdGhpc0FyZyxcbiAgICAgIHRpbWVvdXRJZCxcbiAgICAgIHRyYWlsaW5nQ2FsbCxcbiAgICAgIGxhc3RDYWxsZWQgPSAwLFxuICAgICAgbWF4V2FpdCA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB3YWl0IDwgMCA/IDAgOiAoK3dhaXQgfHwgMCk7XG4gIGlmIChvcHRpb25zID09PSB0cnVlKSB7XG4gICAgdmFyIGxlYWRpbmcgPSB0cnVlO1xuICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4V2FpdCA9ICdtYXhXYWl0JyBpbiBvcHRpb25zICYmIG5hdGl2ZU1heCgrb3B0aW9ucy5tYXhXYWl0IHx8IDAsIHdhaXQpO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgaWYgKHRpbWVvdXRJZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgIH1cbiAgICBsYXN0Q2FsbGVkID0gMDtcbiAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBjb21wbGV0ZShpc0NhbGxlZCwgaWQpIHtcbiAgICBpZiAoaWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfVxuICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGF5ZWQoKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93KCkgLSBzdGFtcCk7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgIGNvbXBsZXRlKHRyYWlsaW5nQ2FsbCwgbWF4VGltZW91dElkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1heERlbGF5ZWQoKSB7XG4gICAgY29tcGxldGUodHJhaWxpbmcsIHRpbWVvdXRJZCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICBzdGFtcCA9IG5vdygpO1xuICAgIHRoaXNBcmcgPSB0aGlzO1xuICAgIHRyYWlsaW5nQ2FsbCA9IHRyYWlsaW5nICYmICh0aW1lb3V0SWQgfHwgIWxlYWRpbmcpO1xuXG4gICAgaWYgKG1heFdhaXQgPT09IGZhbHNlKSB7XG4gICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghbWF4VGltZW91dElkICYmICFsZWFkaW5nKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgIH1cbiAgICAgIHZhciByZW1haW5pbmcgPSBtYXhXYWl0IC0gKHN0YW1wIC0gbGFzdENhbGxlZCksXG4gICAgICAgICAgaXNDYWxsZWQgPSByZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiBtYXhXYWl0O1xuXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XG4gICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xuICAgIH1cbiAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGFyZ3MgPSB0aGlzQXJnID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGVcbiAqIGNyZWF0ZWQgZnVuY3Rpb24gYW5kIGFyZ3VtZW50cyBmcm9tIGBzdGFydGAgYW5kIGJleW9uZCBwcm92aWRlZCBhcyBhbiBhcnJheS5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgYmFzZWQgb24gdGhlIFtyZXN0IHBhcmFtZXRlcl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9yZXN0X3BhcmFtZXRlcnMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IGEgcmVzdCBwYXJhbWV0ZXIgdG8uXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PWZ1bmMubGVuZ3RoLTFdIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVzdCBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHNheSA9IF8ucmVzdFBhcmFtKGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3RQYXJhbShmdW5jLCBzdGFydCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICBzdGFydCA9IG5hdGl2ZU1heChzdGFydCA9PT0gdW5kZWZpbmVkID8gKGZ1bmMubGVuZ3RoIC0gMSkgOiAoK3N0YXJ0IHx8IDApLCAwKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgoYXJncy5sZW5ndGggLSBzdGFydCwgMCksXG4gICAgICAgIHJlc3QgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3RbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIHJlc3QpO1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIGFyZ3NbMV0sIHJlc3QpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IHJlc3Q7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgb3RoZXJBcmdzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN0UGFyYW07XG4iLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB0aHJvdHRsZWQgZnVuY3Rpb24gdGhhdCBvbmx5IGludm9rZXMgYGZ1bmNgIGF0IG1vc3Qgb25jZSBwZXJcbiAqIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgXG4gKiBtZXRob2QgdG8gY2FuY2VsIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGVcbiAqIHRoYXQgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZVxuICogYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpcyBpbnZva2VkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgaW52b2NhdGlvbnMgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz10cnVlXSBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nXG4gKiAgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gaW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXNcbiAqIGpRdWVyeSgnLmludGVyYWN0aXZlJykub24oJ2NsaWNrJywgXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHtcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBjYW5jZWwgYSB0cmFpbGluZyB0aHJvdHRsZWQgY2FsbFxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgIGxlYWRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7ICdsZWFkaW5nJzogbGVhZGluZywgJ21heFdhaXQnOiArd2FpdCwgJ3RyYWlsaW5nJzogdHJhaWxpbmcgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCIvKipcbiAqIENvcGllcyB0aGUgdmFsdWVzIG9mIGBzb3VyY2VgIHRvIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IHNvdXJjZSBUaGUgYXJyYXkgdG8gY29weSB2YWx1ZXMgZnJvbS5cbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheT1bXV0gVGhlIGFycmF5IHRvIGNvcHkgdmFsdWVzIHRvLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5Q29weShzb3VyY2UsIGFycmF5KSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcblxuICBhcnJheSB8fCAoYXJyYXkgPSBBcnJheShsZW5ndGgpKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtpbmRleF0gPSBzb3VyY2VbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUNvcHk7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5mb3JFYWNoYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheUVhY2goYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlFYWNoO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uc29tZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFueSBlbGVtZW50IHBhc3NlcyB0aGUgcHJlZGljYXRlIGNoZWNrLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlTb21lKGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVNvbWU7XG4iLCIvKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLnRlbXBsYXRlYCB0byBjdXN0b21pemUgaXRzIGBfLmFzc2lnbmAgdXNlLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGxpa2UgYGFzc2lnbkRlZmF1bHRzYCBleGNlcHQgdGhhdCBpdCBpZ25vcmVzXG4gKiBpbmhlcml0ZWQgcHJvcGVydHkgdmFsdWVzIHdoZW4gY2hlY2tpbmcgaWYgYSBwcm9wZXJ0eSBpcyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSBvYmplY3RWYWx1ZSBUaGUgZGVzdGluYXRpb24gb2JqZWN0IHByb3BlcnR5IHZhbHVlLlxuICogQHBhcmFtIHsqfSBzb3VyY2VWYWx1ZSBUaGUgc291cmNlIG9iamVjdCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBhc3NvY2lhdGVkIHdpdGggdGhlIG9iamVjdCBhbmQgc291cmNlIHZhbHVlcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSB2YWx1ZSB0byBhc3NpZ24gdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gYXNzaWduT3duRGVmYXVsdHMob2JqZWN0VmFsdWUsIHNvdXJjZVZhbHVlLCBrZXksIG9iamVjdCkge1xuICByZXR1cm4gKG9iamVjdFZhbHVlID09PSB1bmRlZmluZWQgfHwgIWhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKVxuICAgID8gc291cmNlVmFsdWVcbiAgICA6IG9iamVjdFZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2lnbk93bkRlZmF1bHRzO1xuIiwidmFyIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5hc3NpZ25gIGZvciBjdXN0b21pemluZyBhc3NpZ25lZCB2YWx1ZXMgd2l0aG91dFxuICogc3VwcG9ydCBmb3IgYXJndW1lbnQganVnZ2xpbmcsIG11bHRpcGxlIHNvdXJjZXMsIGFuZCBgdGhpc2AgYmluZGluZyBgY3VzdG9taXplcmBcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgc291cmNlIG9iamVjdC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGN1c3RvbWl6ZXIgVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBhc3NpZ25lZCB2YWx1ZXMuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBhc3NpZ25XaXRoKG9iamVjdCwgc291cmNlLCBjdXN0b21pemVyKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgcHJvcHMgPSBrZXlzKHNvdXJjZSksXG4gICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdLFxuICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyKHZhbHVlLCBzb3VyY2Vba2V5XSwga2V5LCBvYmplY3QsIHNvdXJjZSk7XG5cbiAgICBpZiAoKHJlc3VsdCA9PT0gcmVzdWx0ID8gKHJlc3VsdCAhPT0gdmFsdWUpIDogKHZhbHVlID09PSB2YWx1ZSkpIHx8XG4gICAgICAgICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmICEoa2V5IGluIG9iamVjdCkpKSB7XG4gICAgICBvYmplY3Rba2V5XSA9IHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhc3NpZ25XaXRoO1xuIiwidmFyIGJhc2VDb3B5ID0gcmVxdWlyZSgnLi9iYXNlQ29weScpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmFzc2lnbmAgd2l0aG91dCBzdXBwb3J0IGZvciBhcmd1bWVudCBqdWdnbGluZyxcbiAqIG11bHRpcGxlIHNvdXJjZXMsIGFuZCBgY3VzdG9taXplcmAgZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUFzc2lnbihvYmplY3QsIHNvdXJjZSkge1xuICByZXR1cm4gc291cmNlID09IG51bGxcbiAgICA/IG9iamVjdFxuICAgIDogYmFzZUNvcHkoc291cmNlLCBrZXlzKHNvdXJjZSksIG9iamVjdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUFzc2lnbjtcbiIsIi8qKlxuICogQ29waWVzIHByb3BlcnRpZXMgb2YgYHNvdXJjZWAgdG8gYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgZnJvbS5cbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBjb3B5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3Q9e31dIFRoZSBvYmplY3QgdG8gY29weSBwcm9wZXJ0aWVzIHRvLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYmFzZUNvcHkoc291cmNlLCBwcm9wcywgb2JqZWN0KSB7XG4gIG9iamVjdCB8fCAob2JqZWN0ID0ge30pO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBvYmplY3Rba2V5XSA9IHNvdXJjZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNvcHk7XG4iLCJ2YXIgYmFzZUZvck93biA9IHJlcXVpcmUoJy4vYmFzZUZvck93bicpLFxuICAgIGNyZWF0ZUJhc2VFYWNoID0gcmVxdWlyZSgnLi9jcmVhdGVCYXNlRWFjaCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvckVhY2hgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R8c3RyaW5nfSBSZXR1cm5zIGBjb2xsZWN0aW9uYC5cbiAqL1xudmFyIGJhc2VFYWNoID0gY3JlYXRlQmFzZUVhY2goYmFzZUZvck93bik7XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUVhY2g7XG4iLCJ2YXIgY3JlYXRlQmFzZUZvciA9IHJlcXVpcmUoJy4vY3JlYXRlQmFzZUZvcicpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBiYXNlRm9ySW5gIGFuZCBgYmFzZUZvck93bmAgd2hpY2ggaXRlcmF0ZXNcbiAqIG92ZXIgYG9iamVjdGAgcHJvcGVydGllcyByZXR1cm5lZCBieSBga2V5c0Z1bmNgIGludm9raW5nIGBpdGVyYXRlZWAgZm9yXG4gKiBlYWNoIHByb3BlcnR5LiBJdGVyYXRlZSBmdW5jdGlvbnMgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHlcbiAqIHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGtleXNGdW5jIFRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIGtleXMgb2YgYG9iamVjdGAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG52YXIgYmFzZUZvciA9IGNyZWF0ZUJhc2VGb3IoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9yO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuL2Jhc2VGb3InKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9ySW5gIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGb3JJbihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBiYXNlRm9yKG9iamVjdCwgaXRlcmF0ZWUsIGtleXNJbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvckluO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuL2Jhc2VGb3InKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JPd25gIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGb3JPd24ob2JqZWN0LCBpdGVyYXRlZSkge1xuICByZXR1cm4gYmFzZUZvcihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9yT3duO1xuIiwidmFyIGJhc2VJc0VxdWFsRGVlcCA9IHJlcXVpcmUoJy4vYmFzZUlzRXF1YWxEZWVwJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0VxdWFsYCB3aXRob3V0IHN1cHBvcnQgZm9yIGB0aGlzYCBiaW5kaW5nXG4gKiBgY3VzdG9taXplcmAgZnVuY3Rpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHsqfSBvdGhlciBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0FdIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQl0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNFcXVhbCh2YWx1ZSwgb3RoZXIsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIGlmICh2YWx1ZSA9PT0gb3RoZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodmFsdWUgPT0gbnVsbCB8fCBvdGhlciA9PSBudWxsIHx8ICghaXNPYmplY3QodmFsdWUpICYmICFpc09iamVjdExpa2Uob3RoZXIpKSkge1xuICAgIHJldHVybiB2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyO1xuICB9XG4gIHJldHVybiBiYXNlSXNFcXVhbERlZXAodmFsdWUsIG90aGVyLCBiYXNlSXNFcXVhbCwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0VxdWFsO1xuIiwidmFyIGVxdWFsQXJyYXlzID0gcmVxdWlyZSgnLi9lcXVhbEFycmF5cycpLFxuICAgIGVxdWFsQnlUYWcgPSByZXF1aXJlKCcuL2VxdWFsQnlUYWcnKSxcbiAgICBlcXVhbE9iamVjdHMgPSByZXF1aXJlKCcuL2VxdWFsT2JqZWN0cycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbGAgZm9yIGFycmF5cyBhbmQgb2JqZWN0cyB3aGljaCBwZXJmb3Jtc1xuICogZGVlcCBjb21wYXJpc29ucyBhbmQgdHJhY2tzIHRyYXZlcnNlZCBvYmplY3RzIGVuYWJsaW5nIG9iamVjdHMgd2l0aCBjaXJjdWxhclxuICogcmVmZXJlbmNlcyB0byBiZSBjb21wYXJlZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIG9iamVjdHMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzRXF1YWxEZWVwKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgdmFyIG9iaklzQXJyID0gaXNBcnJheShvYmplY3QpLFxuICAgICAgb3RoSXNBcnIgPSBpc0FycmF5KG90aGVyKSxcbiAgICAgIG9ialRhZyA9IGFycmF5VGFnLFxuICAgICAgb3RoVGFnID0gYXJyYXlUYWc7XG5cbiAgaWYgKCFvYmpJc0Fycikge1xuICAgIG9ialRhZyA9IG9ialRvU3RyaW5nLmNhbGwob2JqZWN0KTtcbiAgICBpZiAob2JqVGFnID09IGFyZ3NUYWcpIHtcbiAgICAgIG9ialRhZyA9IG9iamVjdFRhZztcbiAgICB9IGVsc2UgaWYgKG9ialRhZyAhPSBvYmplY3RUYWcpIHtcbiAgICAgIG9iaklzQXJyID0gaXNUeXBlZEFycmF5KG9iamVjdCk7XG4gICAgfVxuICB9XG4gIGlmICghb3RoSXNBcnIpIHtcbiAgICBvdGhUYWcgPSBvYmpUb1N0cmluZy5jYWxsKG90aGVyKTtcbiAgICBpZiAob3RoVGFnID09IGFyZ3NUYWcpIHtcbiAgICAgIG90aFRhZyA9IG9iamVjdFRhZztcbiAgICB9IGVsc2UgaWYgKG90aFRhZyAhPSBvYmplY3RUYWcpIHtcbiAgICAgIG90aElzQXJyID0gaXNUeXBlZEFycmF5KG90aGVyKTtcbiAgICB9XG4gIH1cbiAgdmFyIG9iaklzT2JqID0gb2JqVGFnID09IG9iamVjdFRhZyxcbiAgICAgIG90aElzT2JqID0gb3RoVGFnID09IG9iamVjdFRhZyxcbiAgICAgIGlzU2FtZVRhZyA9IG9ialRhZyA9PSBvdGhUYWc7XG5cbiAgaWYgKGlzU2FtZVRhZyAmJiAhKG9iaklzQXJyIHx8IG9iaklzT2JqKSkge1xuICAgIHJldHVybiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIG9ialRhZyk7XG4gIH1cbiAgaWYgKCFpc0xvb3NlKSB7XG4gICAgdmFyIG9iaklzV3JhcHBlZCA9IG9iaklzT2JqICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnX193cmFwcGVkX18nKSxcbiAgICAgICAgb3RoSXNXcmFwcGVkID0gb3RoSXNPYmogJiYgaGFzT3duUHJvcGVydHkuY2FsbChvdGhlciwgJ19fd3JhcHBlZF9fJyk7XG5cbiAgICBpZiAob2JqSXNXcmFwcGVkIHx8IG90aElzV3JhcHBlZCkge1xuICAgICAgcmV0dXJuIGVxdWFsRnVuYyhvYmpJc1dyYXBwZWQgPyBvYmplY3QudmFsdWUoKSA6IG9iamVjdCwgb3RoSXNXcmFwcGVkID8gb3RoZXIudmFsdWUoKSA6IG90aGVyLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG4gICAgfVxuICB9XG4gIGlmICghaXNTYW1lVGFnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIEFzc3VtZSBjeWNsaWMgdmFsdWVzIGFyZSBlcXVhbC5cbiAgLy8gRm9yIG1vcmUgaW5mb3JtYXRpb24gb24gZGV0ZWN0aW5nIGNpcmN1bGFyIHJlZmVyZW5jZXMgc2VlIGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jSk8uXG4gIHN0YWNrQSB8fCAoc3RhY2tBID0gW10pO1xuICBzdGFja0IgfHwgKHN0YWNrQiA9IFtdKTtcblxuICB2YXIgbGVuZ3RoID0gc3RhY2tBLmxlbmd0aDtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgaWYgKHN0YWNrQVtsZW5ndGhdID09IG9iamVjdCkge1xuICAgICAgcmV0dXJuIHN0YWNrQltsZW5ndGhdID09IG90aGVyO1xuICAgIH1cbiAgfVxuICAvLyBBZGQgYG9iamVjdGAgYW5kIGBvdGhlcmAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICBzdGFja0EucHVzaChvYmplY3QpO1xuICBzdGFja0IucHVzaChvdGhlcik7XG5cbiAgdmFyIHJlc3VsdCA9IChvYmpJc0FyciA/IGVxdWFsQXJyYXlzIDogZXF1YWxPYmplY3RzKShvYmplY3QsIG90aGVyLCBlcXVhbEZ1bmMsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcblxuICBzdGFja0EucG9wKCk7XG4gIHN0YWNrQi5wb3AoKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0VxdWFsRGVlcDtcbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuL2FycmF5RWFjaCcpLFxuICAgIGJhc2VNZXJnZURlZXAgPSByZXF1aXJlKCcuL2Jhc2VNZXJnZURlZXAnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1lcmdlYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFyZ3VtZW50IGp1Z2dsaW5nLFxuICogbXVsdGlwbGUgc291cmNlcywgYW5kIGB0aGlzYCBiaW5kaW5nIGBjdXN0b21pemVyYCBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBtZXJnZWQgdmFsdWVzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBzb3VyY2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0I9W11dIEFzc29jaWF0ZXMgdmFsdWVzIHdpdGggc291cmNlIGNvdW50ZXJwYXJ0cy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VNZXJnZShvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplciwgc3RhY2tBLCBzdGFja0IpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICB2YXIgaXNTcmNBcnIgPSBpc0FycmF5TGlrZShzb3VyY2UpICYmIChpc0FycmF5KHNvdXJjZSkgfHwgaXNUeXBlZEFycmF5KHNvdXJjZSkpLFxuICAgICAgcHJvcHMgPSBpc1NyY0FyciA/IHVuZGVmaW5lZCA6IGtleXMoc291cmNlKTtcblxuICBhcnJheUVhY2gocHJvcHMgfHwgc291cmNlLCBmdW5jdGlvbihzcmNWYWx1ZSwga2V5KSB7XG4gICAgaWYgKHByb3BzKSB7XG4gICAgICBrZXkgPSBzcmNWYWx1ZTtcbiAgICAgIHNyY1ZhbHVlID0gc291cmNlW2tleV07XG4gICAgfVxuICAgIGlmIChpc09iamVjdExpa2Uoc3JjVmFsdWUpKSB7XG4gICAgICBzdGFja0EgfHwgKHN0YWNrQSA9IFtdKTtcbiAgICAgIHN0YWNrQiB8fCAoc3RhY2tCID0gW10pO1xuICAgICAgYmFzZU1lcmdlRGVlcChvYmplY3QsIHNvdXJjZSwga2V5LCBiYXNlTWVyZ2UsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgdmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcih2YWx1ZSwgc3JjVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGlzQ29tbW9uID0gcmVzdWx0ID09PSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbW1vbikge1xuICAgICAgICByZXN1bHQgPSBzcmNWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICgocmVzdWx0ICE9PSB1bmRlZmluZWQgfHwgKGlzU3JjQXJyICYmICEoa2V5IGluIG9iamVjdCkpKSAmJlxuICAgICAgICAgIChpc0NvbW1vbiB8fCAocmVzdWx0ID09PSByZXN1bHQgPyAocmVzdWx0ICE9PSB2YWx1ZSkgOiAodmFsdWUgPT09IHZhbHVlKSkpKSB7XG4gICAgICAgIG9iamVjdFtrZXldID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZU1lcmdlO1xuIiwidmFyIGFycmF5Q29weSA9IHJlcXVpcmUoJy4vYXJyYXlDb3B5JyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi9pc0FycmF5TGlrZScpLFxuICAgIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzUGxhaW5PYmplY3QnKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpLFxuICAgIHRvUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL3RvUGxhaW5PYmplY3QnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VNZXJnZWAgZm9yIGFycmF5cyBhbmQgb2JqZWN0cyB3aGljaCBwZXJmb3Jtc1xuICogZGVlcCBtZXJnZXMgYW5kIHRyYWNrcyB0cmF2ZXJzZWQgb2JqZWN0cyBlbmFibGluZyBvYmplY3RzIHdpdGggY2lyY3VsYXJcbiAqIHJlZmVyZW5jZXMgdG8gYmUgbWVyZ2VkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBtZXJnZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1lcmdlRnVuYyBUaGUgZnVuY3Rpb24gdG8gbWVyZ2UgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgbWVyZ2VkIHZhbHVlcy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgc291cmNlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBBc3NvY2lhdGVzIHZhbHVlcyB3aXRoIHNvdXJjZSBjb3VudGVycGFydHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZU1lcmdlRGVlcChvYmplY3QsIHNvdXJjZSwga2V5LCBtZXJnZUZ1bmMsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoLFxuICAgICAgc3JjVmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gc3JjVmFsdWUpIHtcbiAgICAgIG9iamVjdFtrZXldID0gc3RhY2tCW2xlbmd0aF07XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIodmFsdWUsIHNyY1ZhbHVlLCBrZXksIG9iamVjdCwgc291cmNlKSA6IHVuZGVmaW5lZCxcbiAgICAgIGlzQ29tbW9uID0gcmVzdWx0ID09PSB1bmRlZmluZWQ7XG5cbiAgaWYgKGlzQ29tbW9uKSB7XG4gICAgcmVzdWx0ID0gc3JjVmFsdWU7XG4gICAgaWYgKGlzQXJyYXlMaWtlKHNyY1ZhbHVlKSAmJiAoaXNBcnJheShzcmNWYWx1ZSkgfHwgaXNUeXBlZEFycmF5KHNyY1ZhbHVlKSkpIHtcbiAgICAgIHJlc3VsdCA9IGlzQXJyYXkodmFsdWUpXG4gICAgICAgID8gdmFsdWVcbiAgICAgICAgOiAoaXNBcnJheUxpa2UodmFsdWUpID8gYXJyYXlDb3B5KHZhbHVlKSA6IFtdKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNQbGFpbk9iamVjdChzcmNWYWx1ZSkgfHwgaXNBcmd1bWVudHMoc3JjVmFsdWUpKSB7XG4gICAgICByZXN1bHQgPSBpc0FyZ3VtZW50cyh2YWx1ZSlcbiAgICAgICAgPyB0b1BsYWluT2JqZWN0KHZhbHVlKVxuICAgICAgICA6IChpc1BsYWluT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDoge30pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlzQ29tbW9uID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8vIEFkZCB0aGUgc291cmNlIHZhbHVlIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cyBhbmQgYXNzb2NpYXRlXG4gIC8vIGl0IHdpdGggaXRzIG1lcmdlZCB2YWx1ZS5cbiAgc3RhY2tBLnB1c2goc3JjVmFsdWUpO1xuICBzdGFja0IucHVzaChyZXN1bHQpO1xuXG4gIGlmIChpc0NvbW1vbikge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IG1lcmdlIG9iamVjdHMgYW5kIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIG9iamVjdFtrZXldID0gbWVyZ2VGdW5jKHJlc3VsdCwgc3JjVmFsdWUsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKTtcbiAgfSBlbHNlIGlmIChyZXN1bHQgPT09IHJlc3VsdCA/IChyZXN1bHQgIT09IHZhbHVlKSA6ICh2YWx1ZSA9PT0gdmFsdWUpKSB7XG4gICAgb2JqZWN0W2tleV0gPSByZXN1bHQ7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWVyZ2VEZWVwO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlUHJvcGVydHk7XG4iLCIvKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgaWYgaXQncyBub3Qgb25lLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWRcbiAqIGZvciBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBiYXNlVG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6ICh2YWx1ZSArICcnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVG9TdHJpbmc7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnZhbHVlc2AgYW5kIGBfLnZhbHVlc0luYCB3aGljaCBjcmVhdGVzIGFuXG4gKiBhcnJheSBvZiBgb2JqZWN0YCBwcm9wZXJ0eSB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgcHJvcGVydHkgbmFtZXNcbiAqIG9mIGBwcm9wc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBnZXQgdmFsdWVzIGZvci5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gYmFzZVZhbHVlcyhvYmplY3QsIHByb3BzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBvYmplY3RbcHJvcHNbaW5kZXhdXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VWYWx1ZXM7XG4iLCJ2YXIgaWRlbnRpdHkgPSByZXF1aXJlKCcuLi91dGlsaXR5L2lkZW50aXR5Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlQ2FsbGJhY2tgIHdoaWNoIG9ubHkgc3VwcG9ydHMgYHRoaXNgIGJpbmRpbmdcbiAqIGFuZCBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICogQHBhcmFtIHsqfSB0aGlzQXJnIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY2FsbGJhY2suXG4gKi9cbmZ1bmN0aW9uIGJpbmRDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBpZGVudGl0eTtcbiAgfVxuICBpZiAodGhpc0FyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgc3dpdGNoIChhcmdDb3VudCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSkge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgb3RoZXIsIGtleSwgb2JqZWN0LCBzb3VyY2UpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZENhbGxiYWNrO1xuIiwiLyoqXG4gKiBVc2VkIGJ5IGBfLnRyaW1gIGFuZCBgXy50cmltTGVmdGAgdG8gZ2V0IHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyXG4gKiBvZiBgc3RyaW5nYCB0aGF0IGlzIG5vdCBmb3VuZCBpbiBgY2hhcnNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGFycyBUaGUgY2hhcmFjdGVycyB0byBmaW5kLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGNoYXJhY3RlciBub3QgZm91bmQgaW4gYGNoYXJzYC5cbiAqL1xuZnVuY3Rpb24gY2hhcnNMZWZ0SW5kZXgoc3RyaW5nLCBjaGFycykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGggJiYgY2hhcnMuaW5kZXhPZihzdHJpbmcuY2hhckF0KGluZGV4KSkgPiAtMSkge31cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoYXJzTGVmdEluZGV4O1xuIiwiLyoqXG4gKiBVc2VkIGJ5IGBfLnRyaW1gIGFuZCBgXy50cmltUmlnaHRgIHRvIGdldCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgY2hhcmFjdGVyXG4gKiBvZiBgc3RyaW5nYCB0aGF0IGlzIG5vdCBmb3VuZCBpbiBgY2hhcnNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGFycyBUaGUgY2hhcmFjdGVycyB0byBmaW5kLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGxhc3QgY2hhcmFjdGVyIG5vdCBmb3VuZCBpbiBgY2hhcnNgLlxuICovXG5mdW5jdGlvbiBjaGFyc1JpZ2h0SW5kZXgoc3RyaW5nLCBjaGFycykge1xuICB2YXIgaW5kZXggPSBzdHJpbmcubGVuZ3RoO1xuXG4gIHdoaWxlIChpbmRleC0tICYmIGNoYXJzLmluZGV4T2Yoc3RyaW5nLmNoYXJBdChpbmRleCkpID4gLTEpIHt9XG4gIHJldHVybiBpbmRleDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjaGFyc1JpZ2h0SW5kZXg7XG4iLCJ2YXIgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi9iaW5kQ2FsbGJhY2snKSxcbiAgICBpc0l0ZXJhdGVlQ2FsbCA9IHJlcXVpcmUoJy4vaXNJdGVyYXRlZUNhbGwnKSxcbiAgICByZXN0UGFyYW0gPSByZXF1aXJlKCcuLi9mdW5jdGlvbi9yZXN0UGFyYW0nKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYF8uYXNzaWduYCwgYF8uZGVmYXVsdHNgLCBvciBgXy5tZXJnZWAgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGFzc2lnbmVyIFRoZSBmdW5jdGlvbiB0byBhc3NpZ24gdmFsdWVzLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYXNzaWduZXIgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUFzc2lnbmVyKGFzc2lnbmVyKSB7XG4gIHJldHVybiByZXN0UGFyYW0oZnVuY3Rpb24ob2JqZWN0LCBzb3VyY2VzKSB7XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IG9iamVjdCA9PSBudWxsID8gMCA6IHNvdXJjZXMubGVuZ3RoLFxuICAgICAgICBjdXN0b21pemVyID0gbGVuZ3RoID4gMiA/IHNvdXJjZXNbbGVuZ3RoIC0gMl0gOiB1bmRlZmluZWQsXG4gICAgICAgIGd1YXJkID0gbGVuZ3RoID4gMiA/IHNvdXJjZXNbMl0gOiB1bmRlZmluZWQsXG4gICAgICAgIHRoaXNBcmcgPSBsZW5ndGggPiAxID8gc291cmNlc1tsZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgY3VzdG9taXplciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjdXN0b21pemVyID0gYmluZENhbGxiYWNrKGN1c3RvbWl6ZXIsIHRoaXNBcmcsIDUpO1xuICAgICAgbGVuZ3RoIC09IDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1c3RvbWl6ZXIgPSB0eXBlb2YgdGhpc0FyZyA9PSAnZnVuY3Rpb24nID8gdGhpc0FyZyA6IHVuZGVmaW5lZDtcbiAgICAgIGxlbmd0aCAtPSAoY3VzdG9taXplciA/IDEgOiAwKTtcbiAgICB9XG4gICAgaWYgKGd1YXJkICYmIGlzSXRlcmF0ZWVDYWxsKHNvdXJjZXNbMF0sIHNvdXJjZXNbMV0sIGd1YXJkKSkge1xuICAgICAgY3VzdG9taXplciA9IGxlbmd0aCA8IDMgPyB1bmRlZmluZWQgOiBjdXN0b21pemVyO1xuICAgICAgbGVuZ3RoID0gMTtcbiAgICB9XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2luZGV4XTtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgYXNzaWduZXIob2JqZWN0LCBzb3VyY2UsIGN1c3RvbWl6ZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVBc3NpZ25lcjtcbiIsInZhciBnZXRMZW5ndGggPSByZXF1aXJlKCcuL2dldExlbmd0aCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgYmFzZUVhY2hgIG9yIGBiYXNlRWFjaFJpZ2h0YCBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZWFjaEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VFYWNoKGVhY2hGdW5jLCBmcm9tUmlnaHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKSB7XG4gICAgdmFyIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBnZXRMZW5ndGgoY29sbGVjdGlvbikgOiAwO1xuICAgIGlmICghaXNMZW5ndGgobGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGVhY2hGdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKTtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gZnJvbVJpZ2h0ID8gbGVuZ3RoIDogLTEsXG4gICAgICAgIGl0ZXJhYmxlID0gdG9PYmplY3QoY29sbGVjdGlvbik7XG5cbiAgICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2luZGV4XSwgaW5kZXgsIGl0ZXJhYmxlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUJhc2VFYWNoO1xuIiwidmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBiYXNlIGZ1bmN0aW9uIGZvciBgXy5mb3JJbmAgb3IgYF8uZm9ySW5SaWdodGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYmFzZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmFzZUZvcihmcm9tUmlnaHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCwgaXRlcmF0ZWUsIGtleXNGdW5jKSB7XG4gICAgdmFyIGl0ZXJhYmxlID0gdG9PYmplY3Qob2JqZWN0KSxcbiAgICAgICAgcHJvcHMgPSBrZXlzRnVuYyhvYmplY3QpLFxuICAgICAgICBsZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICAgIGluZGV4ID0gZnJvbVJpZ2h0ID8gbGVuZ3RoIDogLTE7XG5cbiAgICB3aGlsZSAoKGZyb21SaWdodCA/IGluZGV4LS0gOiArK2luZGV4IDwgbGVuZ3RoKSkge1xuICAgICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICAgIGlmIChpdGVyYXRlZShpdGVyYWJsZVtrZXldLCBrZXksIGl0ZXJhYmxlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQmFzZUZvcjtcbiIsInZhciBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuL2JpbmRDYWxsYmFjaycpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gZm9yIGBfLmZvckVhY2hgIG9yIGBfLmZvckVhY2hSaWdodGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGFycmF5RnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGFuIGFycmF5LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZWFjaEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhIGNvbGxlY3Rpb24uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBlYWNoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVGb3JFYWNoKGFycmF5RnVuYywgZWFjaEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGl0ZXJhdGVlLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgaXRlcmF0ZWUgPT0gJ2Z1bmN0aW9uJyAmJiB0aGlzQXJnID09PSB1bmRlZmluZWQgJiYgaXNBcnJheShjb2xsZWN0aW9uKSlcbiAgICAgID8gYXJyYXlGdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKVxuICAgICAgOiBlYWNoRnVuYyhjb2xsZWN0aW9uLCBiaW5kQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVGb3JFYWNoO1xuIiwidmFyIGFycmF5U29tZSA9IHJlcXVpcmUoJy4vYXJyYXlTb21lJyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBhcnJheXMgd2l0aCBzdXBwb3J0IGZvclxuICogcGFydGlhbCBkZWVwIGNvbXBhcmlzb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7QXJyYXl9IG90aGVyIFRoZSBvdGhlciBhcnJheSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIGFycmF5cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXJyYXlzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsQXJyYXlzKGFycmF5LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGFyckxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIG90aExlbmd0aCA9IG90aGVyLmxlbmd0aDtcblxuICBpZiAoYXJyTGVuZ3RoICE9IG90aExlbmd0aCAmJiAhKGlzTG9vc2UgJiYgb3RoTGVuZ3RoID4gYXJyTGVuZ3RoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBJZ25vcmUgbm9uLWluZGV4IHByb3BlcnRpZXMuXG4gIHdoaWxlICgrK2luZGV4IDwgYXJyTGVuZ3RoKSB7XG4gICAgdmFyIGFyclZhbHVlID0gYXJyYXlbaW5kZXhdLFxuICAgICAgICBvdGhWYWx1ZSA9IG90aGVyW2luZGV4XSxcbiAgICAgICAgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIoaXNMb29zZSA/IG90aFZhbHVlIDogYXJyVmFsdWUsIGlzTG9vc2UgPyBhcnJWYWx1ZSA6IG90aFZhbHVlLCBpbmRleCkgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgYXJyYXlzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgaWYgKGlzTG9vc2UpIHtcbiAgICAgIGlmICghYXJyYXlTb21lKG90aGVyLCBmdW5jdGlvbihvdGhWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fCBlcXVhbEZ1bmMoYXJyVmFsdWUsIG90aFZhbHVlLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICAgICAgfSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIShhcnJWYWx1ZSA9PT0gb3RoVmFsdWUgfHwgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbEFycmF5cztcbiIsIi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3IgY29tcGFyaW5nIG9iamVjdHMgb2ZcbiAqIHRoZSBzYW1lIGB0b1N0cmluZ1RhZ2AuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gb25seSBzdXBwb3J0cyBjb21wYXJpbmcgdmFsdWVzIHdpdGggdGFncyBvZlxuICogYEJvb2xlYW5gLCBgRGF0ZWAsIGBFcnJvcmAsIGBOdW1iZXJgLCBgUmVnRXhwYCwgb3IgYFN0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGB0b1N0cmluZ1RhZ2Agb2YgdGhlIG9iamVjdHMgdG8gY29tcGFyZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIHRhZykge1xuICBzd2l0Y2ggKHRhZykge1xuICAgIGNhc2UgYm9vbFRhZzpcbiAgICBjYXNlIGRhdGVUYWc6XG4gICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmQgYm9vbGVhbnNcbiAgICAgIC8vIHRvIGAxYCBvciBgMGAgdHJlYXRpbmcgaW52YWxpZCBkYXRlcyBjb2VyY2VkIHRvIGBOYU5gIGFzIG5vdCBlcXVhbC5cbiAgICAgIHJldHVybiArb2JqZWN0ID09ICtvdGhlcjtcblxuICAgIGNhc2UgZXJyb3JUYWc6XG4gICAgICByZXR1cm4gb2JqZWN0Lm5hbWUgPT0gb3RoZXIubmFtZSAmJiBvYmplY3QubWVzc2FnZSA9PSBvdGhlci5tZXNzYWdlO1xuXG4gICAgY2FzZSBudW1iZXJUYWc6XG4gICAgICAvLyBUcmVhdCBgTmFOYCB2cy4gYE5hTmAgYXMgZXF1YWwuXG4gICAgICByZXR1cm4gKG9iamVjdCAhPSArb2JqZWN0KVxuICAgICAgICA/IG90aGVyICE9ICtvdGhlclxuICAgICAgICA6IG9iamVjdCA9PSArb3RoZXI7XG5cbiAgICBjYXNlIHJlZ2V4cFRhZzpcbiAgICBjYXNlIHN0cmluZ1RhZzpcbiAgICAgIC8vIENvZXJjZSByZWdleGVzIHRvIHN0cmluZ3MgYW5kIHRyZWF0IHN0cmluZ3MgcHJpbWl0aXZlcyBhbmQgc3RyaW5nXG4gICAgICAvLyBvYmplY3RzIGFzIGVxdWFsLiBTZWUgaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4MTUuMTAuNi40IGZvciBtb3JlIGRldGFpbHMuXG4gICAgICByZXR1cm4gb2JqZWN0ID09IChvdGhlciArICcnKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXF1YWxCeVRhZztcbiIsInZhciBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBvYmplY3RzIHdpdGggc3VwcG9ydCBmb3JcbiAqIHBhcnRpYWwgZGVlcCBjb21wYXJpc29ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbE9iamVjdHMob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgb2JqUHJvcHMgPSBrZXlzKG9iamVjdCksXG4gICAgICBvYmpMZW5ndGggPSBvYmpQcm9wcy5sZW5ndGgsXG4gICAgICBvdGhQcm9wcyA9IGtleXMob3RoZXIpLFxuICAgICAgb3RoTGVuZ3RoID0gb3RoUHJvcHMubGVuZ3RoO1xuXG4gIGlmIChvYmpMZW5ndGggIT0gb3RoTGVuZ3RoICYmICFpc0xvb3NlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBpbmRleCA9IG9iakxlbmd0aDtcbiAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICB2YXIga2V5ID0gb2JqUHJvcHNbaW5kZXhdO1xuICAgIGlmICghKGlzTG9vc2UgPyBrZXkgaW4gb3RoZXIgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG90aGVyLCBrZXkpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICB2YXIgc2tpcEN0b3IgPSBpc0xvb3NlO1xuICB3aGlsZSAoKytpbmRleCA8IG9iakxlbmd0aCkge1xuICAgIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICB2YXIgb2JqVmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltrZXldLFxuICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcihpc0xvb3NlID8gb3RoVmFsdWUgOiBvYmpWYWx1ZSwgaXNMb29zZT8gb2JqVmFsdWUgOiBvdGhWYWx1ZSwga2V5KSA6IHVuZGVmaW5lZDtcblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIGlmICghKHJlc3VsdCA9PT0gdW5kZWZpbmVkID8gZXF1YWxGdW5jKG9ialZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIDogcmVzdWx0KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBza2lwQ3RvciB8fCAoc2tpcEN0b3IgPSBrZXkgPT0gJ2NvbnN0cnVjdG9yJyk7XG4gIH1cbiAgaWYgKCFza2lwQ3Rvcikge1xuICAgIHZhciBvYmpDdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICBvdGhDdG9yID0gb3RoZXIuY29uc3RydWN0b3I7XG5cbiAgICAvLyBOb24gYE9iamVjdGAgb2JqZWN0IGluc3RhbmNlcyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVhbC5cbiAgICBpZiAob2JqQ3RvciAhPSBvdGhDdG9yICYmXG4gICAgICAgICgnY29uc3RydWN0b3InIGluIG9iamVjdCAmJiAnY29uc3RydWN0b3InIGluIG90aGVyKSAmJlxuICAgICAgICAhKHR5cGVvZiBvYmpDdG9yID09ICdmdW5jdGlvbicgJiYgb2JqQ3RvciBpbnN0YW5jZW9mIG9iakN0b3IgJiZcbiAgICAgICAgICB0eXBlb2Ygb3RoQ3RvciA9PSAnZnVuY3Rpb24nICYmIG90aEN0b3IgaW5zdGFuY2VvZiBvdGhDdG9yKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbE9iamVjdHM7XG4iLCIvKiogVXNlZCB0byBtYXAgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLiAqL1xudmFyIGh0bWxFc2NhcGVzID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICAnYCc6ICcmIzk2Oydcbn07XG5cbi8qKlxuICogVXNlZCBieSBgXy5lc2NhcGVgIHRvIGNvbnZlcnQgY2hhcmFjdGVycyB0byBIVE1MIGVudGl0aWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hyIFRoZSBtYXRjaGVkIGNoYXJhY3RlciB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAqL1xuZnVuY3Rpb24gZXNjYXBlSHRtbENoYXIoY2hyKSB7XG4gIHJldHVybiBodG1sRXNjYXBlc1tjaHJdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVzY2FwZUh0bWxDaGFyO1xuIiwiLyoqIFVzZWQgdG8gZXNjYXBlIGNoYXJhY3RlcnMgZm9yIGluY2x1c2lvbiBpbiBjb21waWxlZCBzdHJpbmcgbGl0ZXJhbHMuICovXG52YXIgc3RyaW5nRXNjYXBlcyA9IHtcbiAgJ1xcXFwnOiAnXFxcXCcsXG4gIFwiJ1wiOiBcIidcIixcbiAgJ1xcbic6ICduJyxcbiAgJ1xccic6ICdyJyxcbiAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAnXFx1MjAyOSc6ICd1MjAyOSdcbn07XG5cbi8qKlxuICogVXNlZCBieSBgXy50ZW1wbGF0ZWAgdG8gZXNjYXBlIGNoYXJhY3RlcnMgZm9yIGluY2x1c2lvbiBpbiBjb21waWxlZCBzdHJpbmcgbGl0ZXJhbHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaHIgVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmdDaGFyKGNocikge1xuICByZXR1cm4gJ1xcXFwnICsgc3RyaW5nRXNjYXBlc1tjaHJdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVzY2FwZVN0cmluZ0NoYXI7XG4iLCJ2YXIgYmFzZVByb3BlcnR5ID0gcmVxdWlyZSgnLi9iYXNlUHJvcGVydHknKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBcImxlbmd0aFwiIHByb3BlcnR5IHZhbHVlIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gYXZvaWQgYSBbSklUIGJ1Z10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE0Mjc5MilcbiAqIHRoYXQgYWZmZWN0cyBTYWZhcmkgb24gYXQgbGVhc3QgaU9TIDguMS04LjMgQVJNNjQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBcImxlbmd0aFwiIHZhbHVlLlxuICovXG52YXIgZ2V0TGVuZ3RoID0gYmFzZVByb3BlcnR5KCdsZW5ndGgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRMZW5ndGg7XG4iLCJ2YXIgaXNOYXRpdmUgPSByZXF1aXJlKCcuLi9sYW5nL2lzTmF0aXZlJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGZ1bmN0aW9uIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIG1ldGhvZCB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZnVuY3Rpb24gaWYgaXQncyBuYXRpdmUsIGVsc2UgYHVuZGVmaW5lZGAuXG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZShvYmplY3QsIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICByZXR1cm4gaXNOYXRpdmUodmFsdWUpID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TmF0aXZlO1xuIiwidmFyIGdldExlbmd0aCA9IHJlcXVpcmUoJy4vZ2V0TGVuZ3RoJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIGlzTGVuZ3RoKGdldExlbmd0aCh2YWx1ZSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXlMaWtlO1xuIiwiLyoqIFVzZWQgdG8gZGV0ZWN0IHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLiAqL1xudmFyIHJlSXNVaW50ID0gL15cXGQrJC87XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgW21heGltdW0gbGVuZ3RoXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1udW1iZXIubWF4X3NhZmVfaW50ZWdlcilcbiAqIG9mIGFuIGFycmF5LWxpa2UgdmFsdWUuXG4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgaW5kZXguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGg9TUFYX1NBRkVfSU5URUdFUl0gVGhlIHVwcGVyIGJvdW5kcyBvZiBhIHZhbGlkIGluZGV4LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBpbmRleCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0luZGV4KHZhbHVlLCBsZW5ndGgpIHtcbiAgdmFsdWUgPSAodHlwZW9mIHZhbHVlID09ICdudW1iZXInIHx8IHJlSXNVaW50LnRlc3QodmFsdWUpKSA/ICt2YWx1ZSA6IC0xO1xuICBsZW5ndGggPSBsZW5ndGggPT0gbnVsbCA/IE1BWF9TQUZFX0lOVEVHRVIgOiBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzSW5kZXg7XG4iLCJ2YXIgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4vaXNJbmRleCcpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgcHJvdmlkZWQgYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHBvdGVudGlhbCBpdGVyYXRlZSB2YWx1ZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gaW5kZXggVGhlIHBvdGVudGlhbCBpdGVyYXRlZSBpbmRleCBvciBrZXkgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IG9iamVjdCBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIG9iamVjdCBhcmd1bWVudC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXJndW1lbnRzIGFyZSBmcm9tIGFuIGl0ZXJhdGVlIGNhbGwsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNJdGVyYXRlZUNhbGwodmFsdWUsIGluZGV4LCBvYmplY3QpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciB0eXBlID0gdHlwZW9mIGluZGV4O1xuICBpZiAodHlwZSA9PSAnbnVtYmVyJ1xuICAgICAgPyAoaXNBcnJheUxpa2Uob2JqZWN0KSAmJiBpc0luZGV4KGluZGV4LCBvYmplY3QubGVuZ3RoKSlcbiAgICAgIDogKHR5cGUgPT0gJ3N0cmluZycgJiYgaW5kZXggaW4gb2JqZWN0KSkge1xuICAgIHZhciBvdGhlciA9IG9iamVjdFtpbmRleF07XG4gICAgcmV0dXJuIHZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSA9PT0gb3RoZXIpIDogKG90aGVyICE9PSBvdGhlcik7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzSXRlcmF0ZWVDYWxsO1xuIiwiLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBsZW5ndGguXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgYmFzZWQgb24gW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPD0gTUFYX1NBRkVfSU5URUdFUjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0xlbmd0aDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdExpa2U7XG4iLCIvKipcbiAqIFVzZWQgYnkgYHRyaW1tZWRMZWZ0SW5kZXhgIGFuZCBgdHJpbW1lZFJpZ2h0SW5kZXhgIHRvIGRldGVybWluZSBpZiBhXG4gKiBjaGFyYWN0ZXIgY29kZSBpcyB3aGl0ZXNwYWNlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gY2hhckNvZGUgVGhlIGNoYXJhY3RlciBjb2RlIHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYGNoYXJDb2RlYCBpcyB3aGl0ZXNwYWNlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzU3BhY2UoY2hhckNvZGUpIHtcbiAgcmV0dXJuICgoY2hhckNvZGUgPD0gMTYwICYmIChjaGFyQ29kZSA+PSA5ICYmIGNoYXJDb2RlIDw9IDEzKSB8fCBjaGFyQ29kZSA9PSAzMiB8fCBjaGFyQ29kZSA9PSAxNjApIHx8IGNoYXJDb2RlID09IDU3NjAgfHwgY2hhckNvZGUgPT0gNjE1OCB8fFxuICAgIChjaGFyQ29kZSA+PSA4MTkyICYmIChjaGFyQ29kZSA8PSA4MjAyIHx8IGNoYXJDb2RlID09IDgyMzIgfHwgY2hhckNvZGUgPT0gODIzMyB8fCBjaGFyQ29kZSA9PSA4MjM5IHx8IGNoYXJDb2RlID09IDgyODcgfHwgY2hhckNvZGUgPT0gMTIyODggfHwgY2hhckNvZGUgPT0gNjUyNzkpKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTcGFjZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVFc2NhcGUgPSAvPCUtKFtcXHNcXFNdKz8pJT4vZztcblxubW9kdWxlLmV4cG9ydHMgPSByZUVzY2FwZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVFdmFsdWF0ZSA9IC88JShbXFxzXFxTXSs/KSU+L2c7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVFdmFsdWF0ZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVJbnRlcnBvbGF0ZSA9IC88JT0oW1xcc1xcU10rPyklPi9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlSW50ZXJwb2xhdGU7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuL2lzSW5kZXgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBjcmVhdGVzIGFuIGFycmF5IG9mIHRoZVxuICogb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIHNoaW1LZXlzKG9iamVjdCkge1xuICB2YXIgcHJvcHMgPSBrZXlzSW4ob2JqZWN0KSxcbiAgICAgIHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgbGVuZ3RoID0gcHJvcHNMZW5ndGggJiYgb2JqZWN0Lmxlbmd0aDtcblxuICB2YXIgYWxsb3dJbmRleGVzID0gISFsZW5ndGggJiYgaXNMZW5ndGgobGVuZ3RoKSAmJlxuICAgIChpc0FycmF5KG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoKytpbmRleCA8IHByb3BzTGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBpZiAoKGFsbG93SW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgfHwgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpbUtleXM7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBvYmplY3QgaWYgaXQncyBub3Qgb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiB0b09iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3QodmFsdWUpID8gdmFsdWUgOiBPYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvT2JqZWN0O1xuIiwidmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuL2lzU3BhY2UnKTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLnRyaW1gIGFuZCBgXy50cmltTGVmdGAgdG8gZ2V0IHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgbm9uLXdoaXRlc3BhY2VcbiAqIGNoYXJhY3RlciBvZiBgc3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUaGUgc3RyaW5nIHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICovXG5mdW5jdGlvbiB0cmltbWVkTGVmdEluZGV4KHN0cmluZykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGggJiYgaXNTcGFjZShzdHJpbmcuY2hhckNvZGVBdChpbmRleCkpKSB7fVxuICByZXR1cm4gaW5kZXg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHJpbW1lZExlZnRJbmRleDtcbiIsInZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi9pc1NwYWNlJyk7XG5cbi8qKlxuICogVXNlZCBieSBgXy50cmltYCBhbmQgYF8udHJpbVJpZ2h0YCB0byBnZXQgdGhlIGluZGV4IG9mIHRoZSBsYXN0IG5vbi13aGl0ZXNwYWNlXG4gKiBjaGFyYWN0ZXIgb2YgYHN0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBpbnNwZWN0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGxhc3Qgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICovXG5mdW5jdGlvbiB0cmltbWVkUmlnaHRJbmRleChzdHJpbmcpIHtcbiAgdmFyIGluZGV4ID0gc3RyaW5nLmxlbmd0aDtcblxuICB3aGlsZSAoaW5kZXgtLSAmJiBpc1NwYWNlKHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KSkpIHt9XG4gIHJldHVybiBpbmRleDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0cmltbWVkUmlnaHRJbmRleDtcbiIsInZhciBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhbMSwgMiwgM10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNBcnJheUxpa2UodmFsdWUpICYmXG4gICAgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpICYmICFwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHZhbHVlLCAnY2FsbGVlJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcmd1bWVudHM7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0FycmF5ID0gZ2V0TmF0aXZlKEFycmF5LCAnaXNBcnJheScpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IGFycmF5VGFnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuIiwidmFyIGJhc2VJc0VxdWFsID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUlzRXF1YWwnKSxcbiAgICBiaW5kQ2FsbGJhY2sgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iaW5kQ2FsbGJhY2snKTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB2YWx1ZXMgdG8gZGV0ZXJtaW5lIGlmIHRoZXkgYXJlXG4gKiBlcXVpdmFsZW50LiBJZiBgY3VzdG9taXplcmAgaXMgcHJvdmlkZWQgaXQncyBpbnZva2VkIHRvIGNvbXBhcmUgdmFsdWVzLlxuICogSWYgYGN1c3RvbWl6ZXJgIHJldHVybnMgYHVuZGVmaW5lZGAgY29tcGFyaXNvbnMgYXJlIGhhbmRsZWQgYnkgdGhlIG1ldGhvZFxuICogaW5zdGVhZC4gVGhlIGBjdXN0b21pemVyYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB1cCB0b1xuICogdGhyZWUgYXJndW1lbnRzOiAodmFsdWUsIG90aGVyIFssIGluZGV4fGtleV0pLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBzdXBwb3J0cyBjb21wYXJpbmcgYXJyYXlzLCBib29sZWFucywgYERhdGVgIG9iamVjdHMsXG4gKiBudW1iZXJzLCBgT2JqZWN0YCBvYmplY3RzLCByZWdleGVzLCBhbmQgc3RyaW5ncy4gT2JqZWN0cyBhcmUgY29tcGFyZWQgYnlcbiAqIHRoZWlyIG93biwgbm90IGluaGVyaXRlZCwgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLiBGdW5jdGlvbnMgYW5kIERPTSBub2Rlc1xuICogYXJlICoqbm90Kiogc3VwcG9ydGVkLiBQcm92aWRlIGEgY3VzdG9taXplciBmdW5jdGlvbiB0byBleHRlbmQgc3VwcG9ydFxuICogZm9yIGNvbXBhcmluZyBvdGhlciB2YWx1ZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlcVxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0geyp9IG90aGVyIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgdmFsdWUgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGN1c3RvbWl6ZXJgLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAqIHZhciBvdGhlciA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAqXG4gKiBvYmplY3QgPT0gb3RoZXI7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNFcXVhbChvYmplY3QsIG90aGVyKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiAvLyB1c2luZyBhIGN1c3RvbWl6ZXIgY2FsbGJhY2tcbiAqIHZhciBhcnJheSA9IFsnaGVsbG8nLCAnZ29vZGJ5ZSddO1xuICogdmFyIG90aGVyID0gWydoaScsICdnb29kYnllJ107XG4gKlxuICogXy5pc0VxdWFsKGFycmF5LCBvdGhlciwgZnVuY3Rpb24odmFsdWUsIG90aGVyKSB7XG4gKiAgIGlmIChfLmV2ZXJ5KFt2YWx1ZSwgb3RoZXJdLCBSZWdFeHAucHJvdG90eXBlLnRlc3QsIC9eaCg/Oml8ZWxsbykkLykpIHtcbiAqICAgICByZXR1cm4gdHJ1ZTtcbiAqICAgfVxuICogfSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzRXF1YWwodmFsdWUsIG90aGVyLCBjdXN0b21pemVyLCB0aGlzQXJnKSB7XG4gIGN1c3RvbWl6ZXIgPSB0eXBlb2YgY3VzdG9taXplciA9PSAnZnVuY3Rpb24nID8gYmluZENhbGxiYWNrKGN1c3RvbWl6ZXIsIHRoaXNBcmcsIDMpIDogdW5kZWZpbmVkO1xuICB2YXIgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIodmFsdWUsIG90aGVyKSA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuICByZXN1bHQgPT09IHVuZGVmaW5lZCA/IGJhc2VJc0VxdWFsKHZhbHVlLCBvdGhlciwgY3VzdG9taXplcikgOiAhIXJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0VxdWFsO1xuIiwidmFyIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhbiBgRXJyb3JgLCBgRXZhbEVycm9yYCwgYFJhbmdlRXJyb3JgLCBgUmVmZXJlbmNlRXJyb3JgLFxuICogYFN5bnRheEVycm9yYCwgYFR5cGVFcnJvcmAsIG9yIGBVUklFcnJvcmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBlcnJvciBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Vycm9yKG5ldyBFcnJvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0Vycm9yKEVycm9yKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzRXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgdHlwZW9mIHZhbHVlLm1lc3NhZ2UgPT0gJ3N0cmluZycgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gZXJyb3JUYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNFcnJvcjtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmkgd2hpY2ggcmV0dXJuICdmdW5jdGlvbicgZm9yIHJlZ2V4ZXNcbiAgLy8gYW5kIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycy5cbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBmdW5jVGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSA+IDUpLiAqL1xudmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZuVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZSgvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOYXRpdmUoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOYXRpdmUoXyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICByZXR1cm4gcmVJc05hdGl2ZS50ZXN0KGZuVG9TdHJpbmcuY2FsbCh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIHJlSXNIb3N0Q3Rvci50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoMSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCJ2YXIgYmFzZUZvckluID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUZvckluJyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIHRoYXQgaXMsIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZVxuICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBhc3N1bWVzIG9iamVjdHMgY3JlYXRlZCBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3JcbiAqIGhhdmUgbm8gaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogfVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChuZXcgRm9vKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdCh7ICd4JzogMCwgJ3knOiAwIH0pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChPYmplY3QuY3JlYXRlKG51bGwpKTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICB2YXIgQ3RvcjtcblxuICAvLyBFeGl0IGVhcmx5IGZvciBub24gYE9iamVjdGAgb2JqZWN0cy5cbiAgaWYgKCEoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBvYmplY3RUYWcgJiYgIWlzQXJndW1lbnRzKHZhbHVlKSkgfHxcbiAgICAgICghaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NvbnN0cnVjdG9yJykgJiYgKEN0b3IgPSB2YWx1ZS5jb25zdHJ1Y3RvciwgdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiAhKEN0b3IgaW5zdGFuY2VvZiBDdG9yKSkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIElFIDwgOSBpdGVyYXRlcyBpbmhlcml0ZWQgcHJvcGVydGllcyBiZWZvcmUgb3duIHByb3BlcnRpZXMuIElmIHRoZSBmaXJzdFxuICAvLyBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3QncyBvd24gcHJvcGVydHkgdGhlbiB0aGVyZSBhcmUgbm8gaW5oZXJpdGVkXG4gIC8vIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAgdmFyIHJlc3VsdDtcbiAgLy8gSW4gbW9zdCBlbnZpcm9ubWVudHMgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMgYXJlIGl0ZXJhdGVkIGJlZm9yZVxuICAvLyBpdHMgaW5oZXJpdGVkIHByb3BlcnRpZXMuIElmIHRoZSBsYXN0IGl0ZXJhdGVkIHByb3BlcnR5IGlzIGFuIG9iamVjdCdzXG4gIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICBiYXNlRm9ySW4odmFsdWUsIGZ1bmN0aW9uKHN1YlZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHQgPSBrZXk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgfHwgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgcmVzdWx0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1BsYWluT2JqZWN0O1xuIiwidmFyIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzZXRUYWcgPSAnW29iamVjdCBTZXRdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJyxcbiAgICB3ZWFrTWFwVGFnID0gJ1tvYmplY3QgV2Vha01hcF0nO1xuXG52YXIgYXJyYXlCdWZmZXJUYWcgPSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nLFxuICAgIGZsb2F0MzJUYWcgPSAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICBmbG9hdDY0VGFnID0gJ1tvYmplY3QgRmxvYXQ2NEFycmF5XScsXG4gICAgaW50OFRhZyA9ICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgIGludDE2VGFnID0gJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgIGludDMyVGFnID0gJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgIHVpbnQ4VGFnID0gJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgIHVpbnQ4Q2xhbXBlZFRhZyA9ICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgdWludDE2VGFnID0gJ1tvYmplY3QgVWludDE2QXJyYXldJyxcbiAgICB1aW50MzJUYWcgPSAnW29iamVjdCBVaW50MzJBcnJheV0nO1xuXG4vKiogVXNlZCB0byBpZGVudGlmeSBgdG9TdHJpbmdUYWdgIHZhbHVlcyBvZiB0eXBlZCBhcnJheXMuICovXG52YXIgdHlwZWRBcnJheVRhZ3MgPSB7fTtcbnR5cGVkQXJyYXlUYWdzW2Zsb2F0MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbZmxvYXQ2NFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbaW50OFRhZ10gPSB0eXBlZEFycmF5VGFnc1tpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbaW50MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDhUYWddID1cbnR5cGVkQXJyYXlUYWdzW3VpbnQ4Q2xhbXBlZFRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50MTZUYWddID1cbnR5cGVkQXJyYXlUYWdzW3VpbnQzMlRhZ10gPSB0cnVlO1xudHlwZWRBcnJheVRhZ3NbYXJnc1RhZ10gPSB0eXBlZEFycmF5VGFnc1thcnJheVRhZ10gPVxudHlwZWRBcnJheVRhZ3NbYXJyYXlCdWZmZXJUYWddID0gdHlwZWRBcnJheVRhZ3NbYm9vbFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbZGF0ZVRhZ10gPSB0eXBlZEFycmF5VGFnc1tlcnJvclRhZ10gPVxudHlwZWRBcnJheVRhZ3NbZnVuY1RhZ10gPSB0eXBlZEFycmF5VGFnc1ttYXBUYWddID1cbnR5cGVkQXJyYXlUYWdzW251bWJlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tvYmplY3RUYWddID1cbnR5cGVkQXJyYXlUYWdzW3JlZ2V4cFRhZ10gPSB0eXBlZEFycmF5VGFnc1tzZXRUYWddID1cbnR5cGVkQXJyYXlUYWdzW3N0cmluZ1RhZ10gPSB0eXBlZEFycmF5VGFnc1t3ZWFrTWFwVGFnXSA9IGZhbHNlO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgdHlwZWQgYXJyYXkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KG5ldyBVaW50OEFycmF5KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzVHlwZWRBcnJheShbXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhIXR5cGVkQXJyYXlUYWdzW29ialRvU3RyaW5nLmNhbGwodmFsdWUpXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1R5cGVkQXJyYXk7XG4iLCJ2YXIgYmFzZUNvcHkgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlQ29weScpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzSW4nKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgcGxhaW4gb2JqZWN0IGZsYXR0ZW5pbmcgaW5oZXJpdGVkIGVudW1lcmFibGVcbiAqIHByb3BlcnRpZXMgb2YgYHZhbHVlYCB0byBvd24gcHJvcGVydGllcyBvZiB0aGUgcGxhaW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBwbGFpbiBvYmplY3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8uYXNzaWduKHsgJ2EnOiAxIH0sIG5ldyBGb28pO1xuICogLy8gPT4geyAnYSc6IDEsICdiJzogMiB9XG4gKlxuICogXy5hc3NpZ24oeyAnYSc6IDEgfSwgXy50b1BsYWluT2JqZWN0KG5ldyBGb28pKTtcbiAqIC8vID0+IHsgJ2EnOiAxLCAnYic6IDIsICdjJzogMyB9XG4gKi9cbmZ1bmN0aW9uIHRvUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGJhc2VDb3B5KHZhbHVlLCBrZXlzSW4odmFsdWUpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1BsYWluT2JqZWN0O1xuIiwidmFyIGFzc2lnbldpdGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hc3NpZ25XaXRoJyksXG4gICAgYmFzZUFzc2lnbiA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VBc3NpZ24nKSxcbiAgICBjcmVhdGVBc3NpZ25lciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUFzc2lnbmVyJyk7XG5cbi8qKlxuICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gKiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlcyBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXMgc291cmNlcy5cbiAqIElmIGBjdXN0b21pemVyYCBpcyBwcm92aWRlZCBpdCdzIGludm9rZWQgdG8gcHJvZHVjZSB0aGUgYXNzaWduZWQgdmFsdWVzLlxuICogVGhlIGBjdXN0b21pemVyYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCBmaXZlIGFyZ3VtZW50czpcbiAqIChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UpLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBtdXRhdGVzIGBvYmplY3RgIGFuZCBpcyBiYXNlZCBvblxuICogW2BPYmplY3QuYXNzaWduYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LmFzc2lnbikuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBleHRlbmRcbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlc10gVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduZWQgdmFsdWVzLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjdXN0b21pemVyYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uYXNzaWduKHsgJ3VzZXInOiAnYmFybmV5JyB9LCB7ICdhZ2UnOiA0MCB9LCB7ICd1c2VyJzogJ2ZyZWQnIH0pO1xuICogLy8gPT4geyAndXNlcic6ICdmcmVkJywgJ2FnZSc6IDQwIH1cbiAqXG4gKiAvLyB1c2luZyBhIGN1c3RvbWl6ZXIgY2FsbGJhY2tcbiAqIHZhciBkZWZhdWx0cyA9IF8ucGFydGlhbFJpZ2h0KF8uYXNzaWduLCBmdW5jdGlvbih2YWx1ZSwgb3RoZXIpIHtcbiAqICAgcmV0dXJuIF8uaXNVbmRlZmluZWQodmFsdWUpID8gb3RoZXIgOiB2YWx1ZTtcbiAqIH0pO1xuICpcbiAqIGRlZmF1bHRzKHsgJ3VzZXInOiAnYmFybmV5JyB9LCB7ICdhZ2UnOiAzNiB9LCB7ICd1c2VyJzogJ2ZyZWQnIH0pO1xuICogLy8gPT4geyAndXNlcic6ICdiYXJuZXknLCAnYWdlJzogMzYgfVxuICovXG52YXIgYXNzaWduID0gY3JlYXRlQXNzaWduZXIoZnVuY3Rpb24ob2JqZWN0LCBzb3VyY2UsIGN1c3RvbWl6ZXIpIHtcbiAgcmV0dXJuIGN1c3RvbWl6ZXJcbiAgICA/IGFzc2lnbldpdGgob2JqZWN0LCBzb3VyY2UsIGN1c3RvbWl6ZXIpXG4gICAgOiBiYXNlQXNzaWduKG9iamVjdCwgc291cmNlKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2lnbjtcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKSxcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgc2hpbUtleXMgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9zaGltS2V5cycpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUtleXMgPSBnZXROYXRpdmUoT2JqZWN0LCAna2V5cycpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLiBTZWUgdGhlXG4gKiBbRVMgc3BlY10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LmtleXMpXG4gKiBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXMobmV3IEZvbyk7XG4gKiAvLyA9PiBbJ2EnLCAnYiddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKlxuICogXy5rZXlzKCdoaScpO1xuICogLy8gPT4gWycwJywgJzEnXVxuICovXG52YXIga2V5cyA9ICFuYXRpdmVLZXlzID8gc2hpbUtleXMgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIEN0b3IgPSBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdC5jb25zdHJ1Y3RvcjtcbiAgaWYgKCh0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmIEN0b3IucHJvdG90eXBlID09PSBvYmplY3QpIHx8XG4gICAgICAodHlwZW9mIG9iamVjdCAhPSAnZnVuY3Rpb24nICYmIGlzQXJyYXlMaWtlKG9iamVjdCkpKSB7XG4gICAgcmV0dXJuIHNoaW1LZXlzKG9iamVjdCk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgPyBuYXRpdmVLZXlzKG9iamVjdCkgOiBbXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5cztcbiIsInZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzSW5kZXgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIE5vbi1vYmplY3QgdmFsdWVzIGFyZSBjb2VyY2VkIHRvIG9iamVjdHMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5c0luKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InLCAnYyddIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKi9cbmZ1bmN0aW9uIGtleXNJbihvYmplY3QpIHtcbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgIG9iamVjdCA9IE9iamVjdChvYmplY3QpO1xuICB9XG4gIHZhciBsZW5ndGggPSBvYmplY3QubGVuZ3RoO1xuICBsZW5ndGggPSAobGVuZ3RoICYmIGlzTGVuZ3RoKGxlbmd0aCkgJiZcbiAgICAoaXNBcnJheShvYmplY3QpIHx8IGlzQXJndW1lbnRzKG9iamVjdCkpICYmIGxlbmd0aCkgfHwgMDtcblxuICB2YXIgQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgIGluZGV4ID0gLTEsXG4gICAgICBpc1Byb3RvID0gdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0LFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKSxcbiAgICAgIHNraXBJbmRleGVzID0gbGVuZ3RoID4gMDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSAoaW5kZXggKyAnJyk7XG4gIH1cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgIGlmICghKHNraXBJbmRleGVzICYmIGlzSW5kZXgoa2V5LCBsZW5ndGgpKSAmJlxuICAgICAgICAhKGtleSA9PSAnY29uc3RydWN0b3InICYmIChpc1Byb3RvIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkpKSB7XG4gICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNJbjtcbiIsInZhciBiYXNlTWVyZ2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlTWVyZ2UnKSxcbiAgICBjcmVhdGVBc3NpZ25lciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUFzc2lnbmVyJyk7XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWVyZ2VzIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgdGhlIHNvdXJjZSBvYmplY3QocyksIHRoYXRcbiAqIGRvbid0IHJlc29sdmUgdG8gYHVuZGVmaW5lZGAgaW50byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LiBTdWJzZXF1ZW50IHNvdXJjZXNcbiAqIG92ZXJ3cml0ZSBwcm9wZXJ0eSBhc3NpZ25tZW50cyBvZiBwcmV2aW91cyBzb3VyY2VzLiBJZiBgY3VzdG9taXplcmAgaXNcbiAqIHByb3ZpZGVkIGl0J3MgaW52b2tlZCB0byBwcm9kdWNlIHRoZSBtZXJnZWQgdmFsdWVzIG9mIHRoZSBkZXN0aW5hdGlvbiBhbmRcbiAqIHNvdXJjZSBwcm9wZXJ0aWVzLiBJZiBgY3VzdG9taXplcmAgcmV0dXJucyBgdW5kZWZpbmVkYCBtZXJnaW5nIGlzIGhhbmRsZWRcbiAqIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGBjdXN0b21pemVyYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWRcbiAqIHdpdGggZml2ZSBhcmd1bWVudHM6IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZXNdIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGFzc2lnbmVkIHZhbHVlcy5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY3VzdG9taXplcmAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgdXNlcnMgPSB7XG4gKiAgICdkYXRhJzogW3sgJ3VzZXInOiAnYmFybmV5JyB9LCB7ICd1c2VyJzogJ2ZyZWQnIH1dXG4gKiB9O1xuICpcbiAqIHZhciBhZ2VzID0ge1xuICogICAnZGF0YSc6IFt7ICdhZ2UnOiAzNiB9LCB7ICdhZ2UnOiA0MCB9XVxuICogfTtcbiAqXG4gKiBfLm1lcmdlKHVzZXJzLCBhZ2VzKTtcbiAqIC8vID0+IHsgJ2RhdGEnOiBbeyAndXNlcic6ICdiYXJuZXknLCAnYWdlJzogMzYgfSwgeyAndXNlcic6ICdmcmVkJywgJ2FnZSc6IDQwIH1dIH1cbiAqXG4gKiAvLyB1c2luZyBhIGN1c3RvbWl6ZXIgY2FsbGJhY2tcbiAqIHZhciBvYmplY3QgPSB7XG4gKiAgICdmcnVpdHMnOiBbJ2FwcGxlJ10sXG4gKiAgICd2ZWdldGFibGVzJzogWydiZWV0J11cbiAqIH07XG4gKlxuICogdmFyIG90aGVyID0ge1xuICogICAnZnJ1aXRzJzogWydiYW5hbmEnXSxcbiAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2NhcnJvdCddXG4gKiB9O1xuICpcbiAqIF8ubWVyZ2Uob2JqZWN0LCBvdGhlciwgZnVuY3Rpb24oYSwgYikge1xuICogICBpZiAoXy5pc0FycmF5KGEpKSB7XG4gKiAgICAgcmV0dXJuIGEuY29uY2F0KGIpO1xuICogICB9XG4gKiB9KTtcbiAqIC8vID0+IHsgJ2ZydWl0cyc6IFsnYXBwbGUnLCAnYmFuYW5hJ10sICd2ZWdldGFibGVzJzogWydiZWV0JywgJ2NhcnJvdCddIH1cbiAqL1xudmFyIG1lcmdlID0gY3JlYXRlQXNzaWduZXIoYmFzZU1lcmdlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZTtcbiIsInZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlVG9TdHJpbmcnKSxcbiAgICBlc2NhcGVIdG1sQ2hhciA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2VzY2FwZUh0bWxDaGFyJyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIEhUTUwgZW50aXRpZXMgYW5kIEhUTUwgY2hhcmFjdGVycy4gKi9cbnZhciByZVVuZXNjYXBlZEh0bWwgPSAvWyY8PlwiJ2BdL2csXG4gICAgcmVIYXNVbmVzY2FwZWRIdG1sID0gUmVnRXhwKHJlVW5lc2NhcGVkSHRtbC5zb3VyY2UpO1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBjaGFyYWN0ZXJzIFwiJlwiLCBcIjxcIiwgXCI+XCIsICdcIicsIFwiJ1wiLCBhbmQgXCJcXGBcIiwgaW4gYHN0cmluZ2AgdG9cbiAqIHRoZWlyIGNvcnJlc3BvbmRpbmcgSFRNTCBlbnRpdGllcy5cbiAqXG4gKiAqKk5vdGU6KiogTm8gb3RoZXIgY2hhcmFjdGVycyBhcmUgZXNjYXBlZC4gVG8gZXNjYXBlIGFkZGl0aW9uYWwgY2hhcmFjdGVyc1xuICogdXNlIGEgdGhpcmQtcGFydHkgbGlicmFyeSBsaWtlIFtfaGVfXShodHRwczovL210aHMuYmUvaGUpLlxuICpcbiAqIFRob3VnaCB0aGUgXCI+XCIgY2hhcmFjdGVyIGlzIGVzY2FwZWQgZm9yIHN5bW1ldHJ5LCBjaGFyYWN0ZXJzIGxpa2VcbiAqIFwiPlwiIGFuZCBcIi9cIiBkb24ndCBuZWVkIGVzY2FwaW5nIGluIEhUTUwgYW5kIGhhdmUgbm8gc3BlY2lhbCBtZWFuaW5nXG4gKiB1bmxlc3MgdGhleSdyZSBwYXJ0IG9mIGEgdGFnIG9yIHVucXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZS5cbiAqIFNlZSBbTWF0aGlhcyBCeW5lbnMncyBhcnRpY2xlXShodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvYW1iaWd1b3VzLWFtcGVyc2FuZHMpXG4gKiAodW5kZXIgXCJzZW1pLXJlbGF0ZWQgZnVuIGZhY3RcIikgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBCYWNrdGlja3MgYXJlIGVzY2FwZWQgYmVjYXVzZSBpbiBJbnRlcm5ldCBFeHBsb3JlciA8IDksIHRoZXkgY2FuIGJyZWFrIG91dFxuICogb2YgYXR0cmlidXRlIHZhbHVlcyBvciBIVE1MIGNvbW1lbnRzLiBTZWUgWyM1OV0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzU5KSxcbiAqIFsjMTAyXShodHRwczovL2h0bWw1c2VjLm9yZy8jMTAyKSwgWyMxMDhdKGh0dHBzOi8vaHRtbDVzZWMub3JnLyMxMDgpLCBhbmRcbiAqIFsjMTMzXShodHRwczovL2h0bWw1c2VjLm9yZy8jMTMzKSBvZiB0aGUgW0hUTUw1IFNlY3VyaXR5IENoZWF0c2hlZXRdKGh0dHBzOi8vaHRtbDVzZWMub3JnLylcbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogV2hlbiB3b3JraW5nIHdpdGggSFRNTCB5b3Ugc2hvdWxkIGFsd2F5cyBbcXVvdGUgYXR0cmlidXRlIHZhbHVlc10oaHR0cDovL3dvbmtvLmNvbS9wb3N0L2h0bWwtZXNjYXBpbmcpXG4gKiB0byByZWR1Y2UgWFNTIHZlY3RvcnMuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgc3RyaW5nIHRvIGVzY2FwZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmVzY2FwZSgnZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnKTtcbiAqIC8vID0+ICdmcmVkLCBiYXJuZXksICZhbXA7IHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZShzdHJpbmcpIHtcbiAgLy8gUmVzZXQgYGxhc3RJbmRleGAgYmVjYXVzZSBpbiBJRSA8IDkgYFN0cmluZyNyZXBsYWNlYCBkb2VzIG5vdC5cbiAgc3RyaW5nID0gYmFzZVRvU3RyaW5nKHN0cmluZyk7XG4gIHJldHVybiAoc3RyaW5nICYmIHJlSGFzVW5lc2NhcGVkSHRtbC50ZXN0KHN0cmluZykpXG4gICAgPyBzdHJpbmcucmVwbGFjZShyZVVuZXNjYXBlZEh0bWwsIGVzY2FwZUh0bWxDaGFyKVxuICAgIDogc3RyaW5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVzY2FwZTtcbiIsInZhciBhc3NpZ25Pd25EZWZhdWx0cyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Fzc2lnbk93bkRlZmF1bHRzJyksXG4gICAgYXNzaWduV2l0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Fzc2lnbldpdGgnKSxcbiAgICBhdHRlbXB0ID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9hdHRlbXB0JyksXG4gICAgYmFzZUFzc2lnbiA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VBc3NpZ24nKSxcbiAgICBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlVG9TdHJpbmcnKSxcbiAgICBiYXNlVmFsdWVzID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZVZhbHVlcycpLFxuICAgIGVzY2FwZVN0cmluZ0NoYXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9lc2NhcGVTdHJpbmdDaGFyJyksXG4gICAgaXNFcnJvciA9IHJlcXVpcmUoJy4uL2xhbmcvaXNFcnJvcicpLFxuICAgIGlzSXRlcmF0ZWVDYWxsID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNJdGVyYXRlZUNhbGwnKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKSxcbiAgICByZUludGVycG9sYXRlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcmVJbnRlcnBvbGF0ZScpLFxuICAgIHRlbXBsYXRlU2V0dGluZ3MgPSByZXF1aXJlKCcuL3RlbXBsYXRlU2V0dGluZ3MnKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggZW1wdHkgc3RyaW5nIGxpdGVyYWxzIGluIGNvbXBpbGVkIHRlbXBsYXRlIHNvdXJjZS4gKi9cbnZhciByZUVtcHR5U3RyaW5nTGVhZGluZyA9IC9cXGJfX3AgXFwrPSAnJzsvZyxcbiAgICByZUVtcHR5U3RyaW5nTWlkZGxlID0gL1xcYihfX3AgXFwrPSkgJycgXFwrL2csXG4gICAgcmVFbXB0eVN0cmluZ1RyYWlsaW5nID0gLyhfX2VcXCguKj9cXCl8XFxiX190XFwpKSBcXCtcXG4nJzsvZztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggW0VTIHRlbXBsYXRlIGRlbGltaXRlcnNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXRlbXBsYXRlLWxpdGVyYWwtbGV4aWNhbC1jb21wb25lbnRzKS4gKi9cbnZhciByZUVzVGVtcGxhdGUgPSAvXFwkXFx7KFteXFxcXH1dKig/OlxcXFwuW15cXFxcfV0qKSopXFx9L2c7XG5cbi8qKiBVc2VkIHRvIGVuc3VyZSBjYXB0dXJpbmcgb3JkZXIgb2YgdGVtcGxhdGUgZGVsaW1pdGVycy4gKi9cbnZhciByZU5vTWF0Y2ggPSAvKCReKS87XG5cbi8qKiBVc2VkIHRvIG1hdGNoIHVuZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscy4gKi9cbnZhciByZVVuZXNjYXBlZFN0cmluZyA9IC9bJ1xcblxcclxcdTIwMjhcXHUyMDI5XFxcXF0vZztcblxuLyoqXG4gKiBDcmVhdGVzIGEgY29tcGlsZWQgdGVtcGxhdGUgZnVuY3Rpb24gdGhhdCBjYW4gaW50ZXJwb2xhdGUgZGF0YSBwcm9wZXJ0aWVzXG4gKiBpbiBcImludGVycG9sYXRlXCIgZGVsaW1pdGVycywgSFRNTC1lc2NhcGUgaW50ZXJwb2xhdGVkIGRhdGEgcHJvcGVydGllcyBpblxuICogXCJlc2NhcGVcIiBkZWxpbWl0ZXJzLCBhbmQgZXhlY3V0ZSBKYXZhU2NyaXB0IGluIFwiZXZhbHVhdGVcIiBkZWxpbWl0ZXJzLiBEYXRhXG4gKiBwcm9wZXJ0aWVzIG1heSBiZSBhY2Nlc3NlZCBhcyBmcmVlIHZhcmlhYmxlcyBpbiB0aGUgdGVtcGxhdGUuIElmIGEgc2V0dGluZ1xuICogb2JqZWN0IGlzIHByb3ZpZGVkIGl0IHRha2VzIHByZWNlZGVuY2Ugb3ZlciBgXy50ZW1wbGF0ZVNldHRpbmdzYCB2YWx1ZXMuXG4gKlxuICogKipOb3RlOioqIEluIHRoZSBkZXZlbG9wbWVudCBidWlsZCBgXy50ZW1wbGF0ZWAgdXRpbGl6ZXNcbiAqIFtzb3VyY2VVUkxzXShodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9kZXZlbG9wZXJ0b29scy9zb3VyY2VtYXBzLyN0b2Mtc291cmNldXJsKVxuICogZm9yIGVhc2llciBkZWJ1Z2dpbmcuXG4gKlxuICogRm9yIG1vcmUgaW5mb3JtYXRpb24gb24gcHJlY29tcGlsaW5nIHRlbXBsYXRlcyBzZWVcbiAqIFtsb2Rhc2gncyBjdXN0b20gYnVpbGRzIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vbG9kYXNoLmNvbS9jdXN0b20tYnVpbGRzKS5cbiAqXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBDaHJvbWUgZXh0ZW5zaW9uIHNhbmRib3hlcyBzZWVcbiAqIFtDaHJvbWUncyBleHRlbnNpb25zIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vZXh0ZW5zaW9ucy9zYW5kYm94aW5nRXZhbCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgdGVtcGxhdGUgc3RyaW5nLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuZXNjYXBlXSBUaGUgSFRNTCBcImVzY2FwZVwiIGRlbGltaXRlci5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5ldmFsdWF0ZV0gVGhlIFwiZXZhbHVhdGVcIiBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuaW1wb3J0c10gQW4gb2JqZWN0IHRvIGltcG9ydCBpbnRvIHRoZSB0ZW1wbGF0ZSBhcyBmcmVlIHZhcmlhYmxlcy5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbb3B0aW9ucy5pbnRlcnBvbGF0ZV0gVGhlIFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc291cmNlVVJMXSBUaGUgc291cmNlVVJMIG9mIHRoZSB0ZW1wbGF0ZSdzIGNvbXBpbGVkIHNvdXJjZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy52YXJpYWJsZV0gVGhlIGRhdGEgb2JqZWN0IHZhcmlhYmxlIG5hbWUuXG4gKiBAcGFyYW0tIHtPYmplY3R9IFtvdGhlck9wdGlvbnNdIEVuYWJsZXMgdGhlIGxlZ2FjeSBgb3B0aW9uc2AgcGFyYW0gc2lnbmF0dXJlLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjb21waWxlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gdXNpbmcgdGhlIFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXIgdG8gY3JlYXRlIGEgY29tcGlsZWQgdGVtcGxhdGVcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIDwlPSB1c2VyICU+IScpO1xuICogY29tcGlsZWQoeyAndXNlcic6ICdmcmVkJyB9KTtcbiAqIC8vID0+ICdoZWxsbyBmcmVkISdcbiAqXG4gKiAvLyB1c2luZyB0aGUgSFRNTCBcImVzY2FwZVwiIGRlbGltaXRlciB0byBlc2NhcGUgZGF0YSBwcm9wZXJ0eSB2YWx1ZXNcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJzxiPjwlLSB2YWx1ZSAlPjwvYj4nKTtcbiAqIGNvbXBpbGVkKHsgJ3ZhbHVlJzogJzxzY3JpcHQ+JyB9KTtcbiAqIC8vID0+ICc8Yj4mbHQ7c2NyaXB0Jmd0OzwvYj4nXG4gKlxuICogLy8gdXNpbmcgdGhlIFwiZXZhbHVhdGVcIiBkZWxpbWl0ZXIgdG8gZXhlY3V0ZSBKYXZhU2NyaXB0IGFuZCBnZW5lcmF0ZSBIVE1MXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8JSBfLmZvckVhY2godXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHsgJT48bGk+PCUtIHVzZXIgJT48L2xpPjwlIH0pOyAlPicpO1xuICogY29tcGlsZWQoeyAndXNlcnMnOiBbJ2ZyZWQnLCAnYmFybmV5J10gfSk7XG4gKiAvLyA9PiAnPGxpPmZyZWQ8L2xpPjxsaT5iYXJuZXk8L2xpPidcbiAqXG4gKiAvLyB1c2luZyB0aGUgaW50ZXJuYWwgYHByaW50YCBmdW5jdGlvbiBpbiBcImV2YWx1YXRlXCIgZGVsaW1pdGVyc1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnPCUgcHJpbnQoXCJoZWxsbyBcIiArIHVzZXIpOyAlPiEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAnYmFybmV5JyB9KTtcbiAqIC8vID0+ICdoZWxsbyBiYXJuZXkhJ1xuICpcbiAqIC8vIHVzaW5nIHRoZSBFUyBkZWxpbWl0ZXIgYXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIGRlZmF1bHQgXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlclxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGVsbG8gJHsgdXNlciB9IScpO1xuICogY29tcGlsZWQoeyAndXNlcic6ICdwZWJibGVzJyB9KTtcbiAqIC8vID0+ICdoZWxsbyBwZWJibGVzISdcbiAqXG4gKiAvLyB1c2luZyBjdXN0b20gdGVtcGxhdGUgZGVsaW1pdGVyc1xuICogXy50ZW1wbGF0ZVNldHRpbmdzLmludGVycG9sYXRlID0gL3t7KFtcXHNcXFNdKz8pfX0vZztcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIHt7IHVzZXIgfX0hJyk7XG4gKiBjb21waWxlZCh7ICd1c2VyJzogJ211c3RhY2hlJyB9KTtcbiAqIC8vID0+ICdoZWxsbyBtdXN0YWNoZSEnXG4gKlxuICogLy8gdXNpbmcgYmFja3NsYXNoZXMgdG8gdHJlYXQgZGVsaW1pdGVycyBhcyBwbGFpbiB0ZXh0XG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8JT0gXCJcXFxcPCUtIHZhbHVlICVcXFxcPlwiICU+Jyk7XG4gKiBjb21waWxlZCh7ICd2YWx1ZSc6ICdpZ25vcmVkJyB9KTtcbiAqIC8vID0+ICc8JS0gdmFsdWUgJT4nXG4gKlxuICogLy8gdXNpbmcgdGhlIGBpbXBvcnRzYCBvcHRpb24gdG8gaW1wb3J0IGBqUXVlcnlgIGFzIGBqcWBcbiAqIHZhciB0ZXh0ID0gJzwlIGpxLmVhY2godXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHsgJT48bGk+PCUtIHVzZXIgJT48L2xpPjwlIH0pOyAlPic7XG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKHRleHQsIHsgJ2ltcG9ydHMnOiB7ICdqcSc6IGpRdWVyeSB9IH0pO1xuICogY29tcGlsZWQoeyAndXNlcnMnOiBbJ2ZyZWQnLCAnYmFybmV5J10gfSk7XG4gKiAvLyA9PiAnPGxpPmZyZWQ8L2xpPjxsaT5iYXJuZXk8L2xpPidcbiAqXG4gKiAvLyB1c2luZyB0aGUgYHNvdXJjZVVSTGAgb3B0aW9uIHRvIHNwZWNpZnkgYSBjdXN0b20gc291cmNlVVJMIGZvciB0aGUgdGVtcGxhdGVcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvIDwlPSB1c2VyICU+IScsIHsgJ3NvdXJjZVVSTCc6ICcvYmFzaWMvZ3JlZXRpbmcuanN0JyB9KTtcbiAqIGNvbXBpbGVkKGRhdGEpO1xuICogLy8gPT4gZmluZCB0aGUgc291cmNlIG9mIFwiZ3JlZXRpbmcuanN0XCIgdW5kZXIgdGhlIFNvdXJjZXMgdGFiIG9yIFJlc291cmNlcyBwYW5lbCBvZiB0aGUgd2ViIGluc3BlY3RvclxuICpcbiAqIC8vIHVzaW5nIHRoZSBgdmFyaWFibGVgIG9wdGlvbiB0byBlbnN1cmUgYSB3aXRoLXN0YXRlbWVudCBpc24ndCB1c2VkIGluIHRoZSBjb21waWxlZCB0ZW1wbGF0ZVxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnaGkgPCU9IGRhdGEudXNlciAlPiEnLCB7ICd2YXJpYWJsZSc6ICdkYXRhJyB9KTtcbiAqIGNvbXBpbGVkLnNvdXJjZTtcbiAqIC8vID0+IGZ1bmN0aW9uKGRhdGEpIHtcbiAqIC8vICAgdmFyIF9fdCwgX19wID0gJyc7XG4gKiAvLyAgIF9fcCArPSAnaGkgJyArICgoX190ID0gKCBkYXRhLnVzZXIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArICchJztcbiAqIC8vICAgcmV0dXJuIF9fcDtcbiAqIC8vIH1cbiAqXG4gKiAvLyB1c2luZyB0aGUgYHNvdXJjZWAgcHJvcGVydHkgdG8gaW5saW5lIGNvbXBpbGVkIHRlbXBsYXRlcyBmb3IgbWVhbmluZ2Z1bFxuICogLy8gbGluZSBudW1iZXJzIGluIGVycm9yIG1lc3NhZ2VzIGFuZCBhIHN0YWNrIHRyYWNlXG4gKiBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihjd2QsICdqc3QuanMnKSwgJ1xcXG4gKiAgIHZhciBKU1QgPSB7XFxcbiAqICAgICBcIm1haW5cIjogJyArIF8udGVtcGxhdGUobWFpblRleHQpLnNvdXJjZSArICdcXFxuICogICB9O1xcXG4gKiAnKTtcbiAqL1xuZnVuY3Rpb24gdGVtcGxhdGUoc3RyaW5nLCBvcHRpb25zLCBvdGhlck9wdGlvbnMpIHtcbiAgLy8gQmFzZWQgb24gSm9obiBSZXNpZydzIGB0bXBsYCBpbXBsZW1lbnRhdGlvbiAoaHR0cDovL2Vqb2huLm9yZy9ibG9nL2phdmFzY3JpcHQtbWljcm8tdGVtcGxhdGluZy8pXG4gIC8vIGFuZCBMYXVyYSBEb2t0b3JvdmEncyBkb1QuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9vbGFkby9kb1QpLlxuICB2YXIgc2V0dGluZ3MgPSB0ZW1wbGF0ZVNldHRpbmdzLmltcG9ydHMuXy50ZW1wbGF0ZVNldHRpbmdzIHx8IHRlbXBsYXRlU2V0dGluZ3M7XG5cbiAgaWYgKG90aGVyT3B0aW9ucyAmJiBpc0l0ZXJhdGVlQ2FsbChzdHJpbmcsIG9wdGlvbnMsIG90aGVyT3B0aW9ucykpIHtcbiAgICBvcHRpb25zID0gb3RoZXJPcHRpb25zID0gdW5kZWZpbmVkO1xuICB9XG4gIHN0cmluZyA9IGJhc2VUb1N0cmluZyhzdHJpbmcpO1xuICBvcHRpb25zID0gYXNzaWduV2l0aChiYXNlQXNzaWduKHt9LCBvdGhlck9wdGlvbnMgfHwgb3B0aW9ucyksIHNldHRpbmdzLCBhc3NpZ25Pd25EZWZhdWx0cyk7XG5cbiAgdmFyIGltcG9ydHMgPSBhc3NpZ25XaXRoKGJhc2VBc3NpZ24oe30sIG9wdGlvbnMuaW1wb3J0cyksIHNldHRpbmdzLmltcG9ydHMsIGFzc2lnbk93bkRlZmF1bHRzKSxcbiAgICAgIGltcG9ydHNLZXlzID0ga2V5cyhpbXBvcnRzKSxcbiAgICAgIGltcG9ydHNWYWx1ZXMgPSBiYXNlVmFsdWVzKGltcG9ydHMsIGltcG9ydHNLZXlzKTtcblxuICB2YXIgaXNFc2NhcGluZyxcbiAgICAgIGlzRXZhbHVhdGluZyxcbiAgICAgIGluZGV4ID0gMCxcbiAgICAgIGludGVycG9sYXRlID0gb3B0aW9ucy5pbnRlcnBvbGF0ZSB8fCByZU5vTWF0Y2gsXG4gICAgICBzb3VyY2UgPSBcIl9fcCArPSAnXCI7XG5cbiAgLy8gQ29tcGlsZSB0aGUgcmVnZXhwIHRvIG1hdGNoIGVhY2ggZGVsaW1pdGVyLlxuICB2YXIgcmVEZWxpbWl0ZXJzID0gUmVnRXhwKFxuICAgIChvcHRpb25zLmVzY2FwZSB8fCByZU5vTWF0Y2gpLnNvdXJjZSArICd8JyArXG4gICAgaW50ZXJwb2xhdGUuc291cmNlICsgJ3wnICtcbiAgICAoaW50ZXJwb2xhdGUgPT09IHJlSW50ZXJwb2xhdGUgPyByZUVzVGVtcGxhdGUgOiByZU5vTWF0Y2gpLnNvdXJjZSArICd8JyArXG4gICAgKG9wdGlvbnMuZXZhbHVhdGUgfHwgcmVOb01hdGNoKS5zb3VyY2UgKyAnfCQnXG4gICwgJ2cnKTtcblxuICAvLyBVc2UgYSBzb3VyY2VVUkwgZm9yIGVhc2llciBkZWJ1Z2dpbmcuXG4gIHZhciBzb3VyY2VVUkwgPSAnc291cmNlVVJMJyBpbiBvcHRpb25zID8gJy8vIyBzb3VyY2VVUkw9JyArIG9wdGlvbnMuc291cmNlVVJMICsgJ1xcbicgOiAnJztcblxuICBzdHJpbmcucmVwbGFjZShyZURlbGltaXRlcnMsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGVWYWx1ZSwgaW50ZXJwb2xhdGVWYWx1ZSwgZXNUZW1wbGF0ZVZhbHVlLCBldmFsdWF0ZVZhbHVlLCBvZmZzZXQpIHtcbiAgICBpbnRlcnBvbGF0ZVZhbHVlIHx8IChpbnRlcnBvbGF0ZVZhbHVlID0gZXNUZW1wbGF0ZVZhbHVlKTtcblxuICAgIC8vIEVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgY2FuJ3QgYmUgaW5jbHVkZWQgaW4gc3RyaW5nIGxpdGVyYWxzLlxuICAgIHNvdXJjZSArPSBzdHJpbmcuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShyZVVuZXNjYXBlZFN0cmluZywgZXNjYXBlU3RyaW5nQ2hhcik7XG5cbiAgICAvLyBSZXBsYWNlIGRlbGltaXRlcnMgd2l0aCBzbmlwcGV0cy5cbiAgICBpZiAoZXNjYXBlVmFsdWUpIHtcbiAgICAgIGlzRXNjYXBpbmcgPSB0cnVlO1xuICAgICAgc291cmNlICs9IFwiJyArXFxuX19lKFwiICsgZXNjYXBlVmFsdWUgKyBcIikgK1xcbidcIjtcbiAgICB9XG4gICAgaWYgKGV2YWx1YXRlVmFsdWUpIHtcbiAgICAgIGlzRXZhbHVhdGluZyA9IHRydWU7XG4gICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGVWYWx1ZSArIFwiO1xcbl9fcCArPSAnXCI7XG4gICAgfVxuICAgIGlmIChpbnRlcnBvbGF0ZVZhbHVlKSB7XG4gICAgICBzb3VyY2UgKz0gXCInICtcXG4oKF9fdCA9IChcIiArIGludGVycG9sYXRlVmFsdWUgKyBcIikpID09IG51bGwgPyAnJyA6IF9fdCkgK1xcbidcIjtcbiAgICB9XG4gICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICAvLyBUaGUgSlMgZW5naW5lIGVtYmVkZGVkIGluIEFkb2JlIHByb2R1Y3RzIHJlcXVpcmVzIHJldHVybmluZyB0aGUgYG1hdGNoYFxuICAgIC8vIHN0cmluZyBpbiBvcmRlciB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IGBvZmZzZXRgIHZhbHVlLlxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAvLyBJZiBgdmFyaWFibGVgIGlzIG5vdCBzcGVjaWZpZWQgd3JhcCBhIHdpdGgtc3RhdGVtZW50IGFyb3VuZCB0aGUgZ2VuZXJhdGVkXG4gIC8vIGNvZGUgdG8gYWRkIHRoZSBkYXRhIG9iamVjdCB0byB0aGUgdG9wIG9mIHRoZSBzY29wZSBjaGFpbi5cbiAgdmFyIHZhcmlhYmxlID0gb3B0aW9ucy52YXJpYWJsZTtcbiAgaWYgKCF2YXJpYWJsZSkge1xuICAgIHNvdXJjZSA9ICd3aXRoIChvYmopIHtcXG4nICsgc291cmNlICsgJ1xcbn1cXG4nO1xuICB9XG4gIC8vIENsZWFudXAgY29kZSBieSBzdHJpcHBpbmcgZW1wdHkgc3RyaW5ncy5cbiAgc291cmNlID0gKGlzRXZhbHVhdGluZyA/IHNvdXJjZS5yZXBsYWNlKHJlRW1wdHlTdHJpbmdMZWFkaW5nLCAnJykgOiBzb3VyY2UpXG4gICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ01pZGRsZSwgJyQxJylcbiAgICAucmVwbGFjZShyZUVtcHR5U3RyaW5nVHJhaWxpbmcsICckMTsnKTtcblxuICAvLyBGcmFtZSBjb2RlIGFzIHRoZSBmdW5jdGlvbiBib2R5LlxuICBzb3VyY2UgPSAnZnVuY3Rpb24oJyArICh2YXJpYWJsZSB8fCAnb2JqJykgKyAnKSB7XFxuJyArXG4gICAgKHZhcmlhYmxlXG4gICAgICA/ICcnXG4gICAgICA6ICdvYmogfHwgKG9iaiA9IHt9KTtcXG4nXG4gICAgKSArXG4gICAgXCJ2YXIgX190LCBfX3AgPSAnJ1wiICtcbiAgICAoaXNFc2NhcGluZ1xuICAgICAgID8gJywgX19lID0gXy5lc2NhcGUnXG4gICAgICAgOiAnJ1xuICAgICkgK1xuICAgIChpc0V2YWx1YXRpbmdcbiAgICAgID8gJywgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XFxuJyArXG4gICAgICAgIFwiZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XFxuXCJcbiAgICAgIDogJztcXG4nXG4gICAgKSArXG4gICAgc291cmNlICtcbiAgICAncmV0dXJuIF9fcFxcbn0nO1xuXG4gIHZhciByZXN1bHQgPSBhdHRlbXB0KGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBGdW5jdGlvbihpbXBvcnRzS2V5cywgc291cmNlVVJMICsgJ3JldHVybiAnICsgc291cmNlKS5hcHBseSh1bmRlZmluZWQsIGltcG9ydHNWYWx1ZXMpO1xuICB9KTtcblxuICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbidzIHNvdXJjZSBieSBpdHMgYHRvU3RyaW5nYCBtZXRob2Qgb3JcbiAgLy8gdGhlIGBzb3VyY2VgIHByb3BlcnR5IGFzIGEgY29udmVuaWVuY2UgZm9yIGlubGluaW5nIGNvbXBpbGVkIHRlbXBsYXRlcy5cbiAgcmVzdWx0LnNvdXJjZSA9IHNvdXJjZTtcbiAgaWYgKGlzRXJyb3IocmVzdWx0KSkge1xuICAgIHRocm93IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlO1xuIiwidmFyIGVzY2FwZSA9IHJlcXVpcmUoJy4vZXNjYXBlJyksXG4gICAgcmVFc2NhcGUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9yZUVzY2FwZScpLFxuICAgIHJlRXZhbHVhdGUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9yZUV2YWx1YXRlJyksXG4gICAgcmVJbnRlcnBvbGF0ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3JlSW50ZXJwb2xhdGUnKTtcblxuLyoqXG4gKiBCeSBkZWZhdWx0LCB0aGUgdGVtcGxhdGUgZGVsaW1pdGVycyB1c2VkIGJ5IGxvZGFzaCBhcmUgbGlrZSB0aG9zZSBpblxuICogZW1iZWRkZWQgUnVieSAoRVJCKS4gQ2hhbmdlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlXG4gKiBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBPYmplY3RcbiAqL1xudmFyIHRlbXBsYXRlU2V0dGluZ3MgPSB7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZGV0ZWN0IGBkYXRhYCBwcm9wZXJ0eSB2YWx1ZXMgdG8gYmUgSFRNTC1lc2NhcGVkLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIFJlZ0V4cFxuICAgKi9cbiAgJ2VzY2FwZSc6IHJlRXNjYXBlLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGRldGVjdCBjb2RlIHRvIGJlIGV2YWx1YXRlZC5cbiAgICpcbiAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgKiBAdHlwZSBSZWdFeHBcbiAgICovXG4gICdldmFsdWF0ZSc6IHJlRXZhbHVhdGUsXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZGV0ZWN0IGBkYXRhYCBwcm9wZXJ0eSB2YWx1ZXMgdG8gaW5qZWN0LlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIFJlZ0V4cFxuICAgKi9cbiAgJ2ludGVycG9sYXRlJzogcmVJbnRlcnBvbGF0ZSxcblxuICAvKipcbiAgICogVXNlZCB0byByZWZlcmVuY2UgdGhlIGRhdGEgb2JqZWN0IGluIHRoZSB0ZW1wbGF0ZSB0ZXh0LlxuICAgKlxuICAgKiBAbWVtYmVyT2YgXy50ZW1wbGF0ZVNldHRpbmdzXG4gICAqIEB0eXBlIHN0cmluZ1xuICAgKi9cbiAgJ3ZhcmlhYmxlJzogJycsXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gaW1wb3J0IHZhcmlhYmxlcyBpbnRvIHRoZSBjb21waWxlZCB0ZW1wbGF0ZS5cbiAgICpcbiAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gICdpbXBvcnRzJzoge1xuXG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGBsb2Rhc2hgIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5ncy5pbXBvcnRzXG4gICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgKi9cbiAgICAnXyc6IHsgJ2VzY2FwZSc6IGVzY2FwZSB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGVTZXR0aW5ncztcbiIsInZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlVG9TdHJpbmcnKSxcbiAgICBjaGFyc0xlZnRJbmRleCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NoYXJzTGVmdEluZGV4JyksXG4gICAgY2hhcnNSaWdodEluZGV4ID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY2hhcnNSaWdodEluZGV4JyksXG4gICAgaXNJdGVyYXRlZUNhbGwgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0l0ZXJhdGVlQ2FsbCcpLFxuICAgIHRyaW1tZWRMZWZ0SW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC90cmltbWVkTGVmdEluZGV4JyksXG4gICAgdHJpbW1lZFJpZ2h0SW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC90cmltbWVkUmlnaHRJbmRleCcpO1xuXG4vKipcbiAqIFJlbW92ZXMgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSBvciBzcGVjaWZpZWQgY2hhcmFjdGVycyBmcm9tIGBzdHJpbmdgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW3N0cmluZz0nJ10gVGhlIHN0cmluZyB0byB0cmltLlxuICogQHBhcmFtIHtzdHJpbmd9IFtjaGFycz13aGl0ZXNwYWNlXSBUaGUgY2hhcmFjdGVycyB0byB0cmltLlxuICogQHBhcmFtLSB7T2JqZWN0fSBbZ3VhcmRdIEVuYWJsZXMgdXNlIGFzIGEgY2FsbGJhY2sgZm9yIGZ1bmN0aW9ucyBsaWtlIGBfLm1hcGAuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSB0cmltbWVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50cmltKCcgIGFiYyAgJyk7XG4gKiAvLyA9PiAnYWJjJ1xuICpcbiAqIF8udHJpbSgnLV8tYWJjLV8tJywgJ18tJyk7XG4gKiAvLyA9PiAnYWJjJ1xuICpcbiAqIF8ubWFwKFsnICBmb28gICcsICcgIGJhciAgJ10sIF8udHJpbSk7XG4gKiAvLyA9PiBbJ2ZvbycsICdiYXInXVxuICovXG5mdW5jdGlvbiB0cmltKHN0cmluZywgY2hhcnMsIGd1YXJkKSB7XG4gIHZhciB2YWx1ZSA9IHN0cmluZztcbiAgc3RyaW5nID0gYmFzZVRvU3RyaW5nKHN0cmluZyk7XG4gIGlmICghc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuICBpZiAoZ3VhcmQgPyBpc0l0ZXJhdGVlQ2FsbCh2YWx1ZSwgY2hhcnMsIGd1YXJkKSA6IGNoYXJzID09IG51bGwpIHtcbiAgICByZXR1cm4gc3RyaW5nLnNsaWNlKHRyaW1tZWRMZWZ0SW5kZXgoc3RyaW5nKSwgdHJpbW1lZFJpZ2h0SW5kZXgoc3RyaW5nKSArIDEpO1xuICB9XG4gIGNoYXJzID0gKGNoYXJzICsgJycpO1xuICByZXR1cm4gc3RyaW5nLnNsaWNlKGNoYXJzTGVmdEluZGV4KHN0cmluZywgY2hhcnMpLCBjaGFyc1JpZ2h0SW5kZXgoc3RyaW5nLCBjaGFycykgKyAxKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0cmltO1xuIiwidmFyIGlzRXJyb3IgPSByZXF1aXJlKCcuLi9sYW5nL2lzRXJyb3InKSxcbiAgICByZXN0UGFyYW0gPSByZXF1aXJlKCcuLi9mdW5jdGlvbi9yZXN0UGFyYW0nKTtcblxuLyoqXG4gKiBBdHRlbXB0cyB0byBpbnZva2UgYGZ1bmNgLCByZXR1cm5pbmcgZWl0aGVyIHRoZSByZXN1bHQgb3IgdGhlIGNhdWdodCBlcnJvclxuICogb2JqZWN0LiBBbnkgYWRkaXRpb25hbCBhcmd1bWVudHMgYXJlIHByb3ZpZGVkIHRvIGBmdW5jYCB3aGVuIGl0J3MgaW52b2tlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGF0dGVtcHQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgYGZ1bmNgIHJlc3VsdCBvciBlcnJvciBvYmplY3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIGF2b2lkIHRocm93aW5nIGVycm9ycyBmb3IgaW52YWxpZCBzZWxlY3RvcnNcbiAqIHZhciBlbGVtZW50cyA9IF8uYXR0ZW1wdChmdW5jdGlvbihzZWxlY3Rvcikge1xuICogICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gKiB9LCAnPl8+Jyk7XG4gKlxuICogaWYgKF8uaXNFcnJvcihlbGVtZW50cykpIHtcbiAqICAgZWxlbWVudHMgPSBbXTtcbiAqIH1cbiAqL1xudmFyIGF0dGVtcHQgPSByZXN0UGFyYW0oZnVuY3Rpb24oZnVuYywgYXJncykge1xuICB0cnkge1xuICAgIHJldHVybiBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybiBpc0Vycm9yKGUpID8gZSA6IG5ldyBFcnJvcihlKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXR0ZW1wdDtcbiIsIi8qKlxuICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgZmlyc3QgYXJndW1lbnQgcHJvdmlkZWQgdG8gaXQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXR5XG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICd1c2VyJzogJ2ZyZWQnIH07XG4gKlxuICogXy5pZGVudGl0eShvYmplY3QpID09PSBvYmplY3Q7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpZGVudGl0eTtcbiIsInZhciBhdWRpb0VsO1xudmFyIGRpciA9ICcnO1xudmFyIGZvcm1hdCA9ICd3YXYnO1xudmFyIHZvbHVtZSA9IDAuNTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0aW5pdDogZnVuY3Rpb24oc291bmRzRGlyKSB7XG5cdFx0YXVkaW9FbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5cdFx0YXVkaW9FbC5zZXRBdHRyaWJ1dGUoJ2F1dG9wbGF5JywgdHJ1ZSk7XG5cdFx0aWYoc291bmRzRGlyKSBkaXIgPSBzb3VuZHNEaXI7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cGxheTogZnVuY3Rpb24oZmlsZW5hbWUsIGxvb3ApIHtcblx0XHRpZihmaWxlbmFtZSkgYXVkaW9FbC5zcmMgPSAoZGlyICsgZmlsZW5hbWUgKyAnLicgKyBmb3JtYXQpO1xuXHRcdGxvb3AgPyBhdWRpb0VsLnNldEF0dHJpYnV0ZSgnbG9vcCcsIHRydWUpIDogYXVkaW9FbC5yZW1vdmVBdHRyaWJ1dGUoJ2xvb3AnKTtcblx0XHRhdWRpb0VsLnZvbHVtZSA9IHZvbHVtZTtcblx0XHRhdWRpb0VsLnBsYXkoKTtcblx0fSxcblxuXHRzdG9wOiBmdW5jdGlvbigpIHtcblx0XHRhdWRpb0VsLnBhdXNlKCk7XG5cdFx0YXVkaW9FbC5jdXJyZW50VGltZSA9IDA7XG5cdH1cblxufTsiLCJ2YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG52YXIgcmVtb3RlRXZlbnRzID0gW107XG52YXIgbG9jYWxFdmVudHMgPSBbXTtcbnZhciBpbml0aWF0ZWQgPSBmYWxzZTtcbnZhciBzaGFyZWQgPSBmYWxzZTtcbnZhciBjdXJzb3IgPSBudWxsO1xudmFyIHdpZGdldDtcbnZhciBlbnRpdHkgPSAnJztcbnZhciBlbWl0O1xudmFyIHBhdGggPSAnJztcbnZhciBldmVudFRpbWVzdGFtcCA9IDA7XG52YXIgdXBkYXRlSW50ZXJ2YWwgPSBudWxsO1xudmFyIHVwZGF0ZUludGVydmFsVmFsdWUgPSA1MDAwO1xudmFyIHVwZGF0ZVN0YXRlSW50ZXJ2YWwgPSBudWxsO1xudmFyIGNoZWNrRXZlcnkgPSBfLmRlYm91bmNlKHVuc2hhcmVCcm93c2VyLCAzMDAwMCk7XG52YXIgY3Vyc29yWCA9IDAsIGN1cnNvclkgPSAwO1xudmFyIHJlcXVlc3RBRjtcblxuZnVuY3Rpb24gaXNJbml0aWF0ZWQoKSB7XG5cdHJldHVybiBpbml0aWF0ZWQ7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0aW9ucyl7XG5cdGlmKGluaXRpYXRlZCkgcmV0dXJuIGRlYnVnLmluZm8oJ0NvYnJvd3NpbmcgYWxyZWFkeSBpbml0aWF0ZWQnKTtcblxuXHRhZGRFdmVudChkb2N1bWVudCwgJ2tleXVwJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAna2V5ZG93bicsIGV2ZW50c0hhbmRsZXIpO1xuXHRhZGRFdmVudChkb2N1bWVudCwgJ2tleXByZXNzJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAnbW91c2V1cCcsIGV2ZW50c0hhbmRsZXIpO1xuXHRhZGRFdmVudChkb2N1bWVudCwgJ2NsaWNrJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAnY2hhbmdlJywgZXZlbnRzSGFuZGxlcik7XG5cblx0d2lkZ2V0ID0gKHR5cGVvZiBvcHRpb25zLndpZGdldCA9PT0gJ3N0cmluZycpID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLndpZGdldCkgOiBvcHRpb25zLndpZGdldDtcblx0ZW50aXR5ID0gb3B0aW9ucy5lbnRpdHk7XG5cdGVtaXQgPSBvcHRpb25zLmVtaXQ7XG5cdHBhdGggPSBvcHRpb25zLnBhdGg7XG5cblx0aW5pdGlhdGVkID0gdHJ1ZTtcblx0dXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChlbWl0RXZlbnRzLCB1cGRhdGVJbnRlcnZhbFZhbHVlKTtcblxuXHRkZWJ1Zy5sb2coJ2NvYnJvd3NpbmcgbW9kdWxlIGluaXRpYXRlZCB3aXRoIHBhcmFtZXRlcnM6ICcsIG9wdGlvbnMpO1xuXHRlbWl0KCdjb2Jyb3dzaW5nL2luaXQnKTtcbn1cblxuZnVuY3Rpb24gc2hhcmVCcm93c2VyKCl7XG4gICAgaWYoc2hhcmVkKSByZXR1cm4gZGVidWcuaW5mbygnQnJvd3NlciBhbHJlYWR5IHNoYXJlZCcpO1xuICAgIGFkZEV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgZXZlbnRzSGFuZGxlcik7XG4gICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzZWxlY3QnLCBldmVudHNIYW5kbGVyKTtcbiAgICBhZGRFdmVudChkb2N1bWVudCwgJ21vdXNlbW92ZScsIGV2ZW50c0hhbmRsZXIpO1xuXG4gICAgLy8gYWRkRXZlbnQoZG9jdW1lbnQsICdtb3VzZW92ZXInLCBldmVudHNIYW5kbGVyKTtcbiAgICAvLyBhZGRFdmVudChkb2N1bWVudCwgJ21vdXNlb3V0JywgZXZlbnRzSGFuZGxlcik7XG4gICAgXG4gICAgY3JlYXRlUmVtb3RlQ3Vyc29yKCk7XG4gICAgc2hhcmVkID0gdHJ1ZTtcbiAgICB1cGRhdGVTdGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlU3RhdGUsIHVwZGF0ZUludGVydmFsVmFsdWUpO1xuICAgIGNsZWFySW50ZXJ2YWwodXBkYXRlSW50ZXJ2YWwpO1xuXG4gICAgZGVidWcubG9nKCdicm93c2VyIHNoYXJlZCcpO1xuICAgIGVtaXQoJ2NvYnJvd3Npbmcvc2hhcmVkJywgeyBlbnRpdHk6IGVudGl0eSB9KTtcbn1cblxuZnVuY3Rpb24gdW5zaGFyZUJyb3dzZXIoKXtcblx0aWYoIXNoYXJlZCkgcmV0dXJuIGRlYnVnLmluZm8oJ0Jyb3dzZXIgYWxyZWFkeSB1bnNoYXJlZCcpO1xuXG4gICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCBldmVudHNIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudChkb2N1bWVudCwgJ3NlbGVjdCcsIGV2ZW50c0hhbmRsZXIpO1xuICAgIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgZXZlbnRzSGFuZGxlcik7XG5cbiAgICAvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ21vdXNlb3ZlcicsIGV2ZW50c0hhbmRsZXIpO1xuICAgIC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2VvdXQnLCBldmVudHNIYW5kbGVyKTtcbiAgICBcbiAgICByZW1vdmVSZW1vdGVDdXJzb3IoKTtcbiAgICBzaGFyZWQgPSBmYWxzZTtcbiAgICB1cGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGVtaXRFdmVudHMsIHVwZGF0ZUludGVydmFsVmFsdWUpO1xuICAgIGNsZWFySW50ZXJ2YWwodXBkYXRlU3RhdGVJbnRlcnZhbCk7XG5cblx0ZW1pdCgnY29icm93c2luZy91bnNoYXJlZCcsIHsgZW50aXR5OiBlbnRpdHkgfSk7XG4gICAgZGVidWcubG9nKCdicm93c2VyIHVuc2hhcmVkJyk7XG59XG5cbmZ1bmN0aW9uIHVuc2hhcmVBbGwoKXtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdrZXl1cCcsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2tleWRvd24nLCBldmVudHNIYW5kbGVyKTtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdrZXlwcmVzcycsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ21vdXNldXAnLCBldmVudHNIYW5kbGVyKTtcblx0Ly8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdjbGljaycsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2NoYW5nZScsIGV2ZW50c0hhbmRsZXIpO1xuXHRjbGVhckludGVydmFsKHVwZGF0ZUludGVydmFsKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3RlQ3Vyc29yKCl7XG5cdHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcblx0aWYoIWN1cnNvcikge1xuXHRcdGN1cnNvcj0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0Y3Vyc29yLmNsYXNzTmFtZSA9ICd3Yy1ybXQtcHRyJztcblx0XHRjdXJzb3Iuc2V0QXR0cmlidXRlKCdzcmMnLCBwYXRoKydpbWFnZXMvcG9pbnRlci5wbmcnKTtcblx0XHRjdXJzb3Iuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdGlmKGJvZHkuZmlyc3RDaGlsZCkge1xuXHRcdFx0Ym9keS5pbnNlcnRCZWZvcmUoY3Vyc29yLCBib2R5LmZpcnN0Q2hpbGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRib2R5LmFwcGVuZENoaWxkKGN1cnNvcik7XG5cdFxuXHRcdH1cblx0XHRyZWRyYXdDdXJzb3IoKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWRyYXdDdXJzb3IoKXtcblx0Y3Vyc29yLnN0eWxlLmxlZnQgPSBjdXJzb3JYO1xuXHRjdXJzb3Iuc3R5bGUudG9wID0gY3Vyc29yWTtcblx0cmVxdWVzdEFGID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZWRyYXdDdXJzb3IpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZW1vdGVDdXJzb3IoKXtcblx0aWYoIWN1cnNvcikgcmV0dXJuO1xuXHRjYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QUYpO1xuXHRjdXJzb3IucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJzb3IpO1xuXHRjdXJzb3IgPSBudWxsO1xufVxuXG4vL2Zyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yODk3MTU1L2dldC1jdXJzb3ItcG9zaXRpb24taW4tY2hhcmFjdGVycy13aXRoaW4tYS10ZXh0LWlucHV0LWZpZWxkXG5mdW5jdGlvbiBnZXRDYXJldFBvc2l0aW9uIChvRmllbGQpIHtcbiAgLy8gSW5pdGlhbGl6ZVxuXHR2YXIgaUNhcmV0UG9zID0gMDtcblxuICAvLyBJRSBTdXBwb3J0XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuXG4gICAgLy8gU2V0IGZvY3VzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgIG9GaWVsZC5mb2N1cyAoKTtcblxuICAgIC8vIFRvIGdldCBjdXJzb3IgcG9zaXRpb24sIGdldCBlbXB0eSBzZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgdmFyIG9TZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UgKCk7XG5cbiAgICAvLyBNb3ZlIHNlbGVjdGlvbiBzdGFydCB0byAwIHBvc2l0aW9uXG4gICAgICAgIG9TZWwubW92ZVN0YXJ0ICgnY2hhcmFjdGVyJywgLW9GaWVsZC52YWx1ZS5sZW5ndGgpO1xuXG4gICAgLy8gVGhlIGNhcmV0IHBvc2l0aW9uIGlzIHNlbGVjdGlvbiBsZW5ndGhcbiAgICAgICAgaUNhcmV0UG9zID0gb1NlbC50ZXh0Lmxlbmd0aDtcbiAgICB9XG4gICAgZWxzZSBpZihvRmllbGQudHlwZSAmJiAob0ZpZWxkLnR5cGUgPT09ICdlbWFpbCcgfHwgb0ZpZWxkLnR5cGUgPT09ICdudW1iZXInKSl7XG4gICAgICAgIGlDYXJldFBvcyA9IG51bGw7XG4gICAgfVxuICAvLyBGaXJlZm94IHN1cHBvcnRcbiAgICBlbHNlIGlmIChvRmllbGQuc2VsZWN0aW9uU3RhcnQgfHwgb0ZpZWxkLnNlbGVjdGlvblN0YXJ0ID09ICcwJyl7XG4gICAgICAgIGlDYXJldFBvcyA9IG9GaWVsZC5zZWxlY3Rpb25TdGFydDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlDYXJldFBvcyA9IG51bGw7XG4gICAgfVxuXHQvLyBSZXR1cm4gcmVzdWx0c1xuXHRyZXR1cm4gKGlDYXJldFBvcyk7XG59XG5cbmZ1bmN0aW9uIGVtaXRFdmVudHMoKXtcblx0Ly8gaWYoIXNoYXJlZCAmJiAhbG9jYWxFdmVudHMubGVuZ3RoKSByZXR1cm47XG5cdGVtaXQoJ2NvYnJvd3NpbmcvZXZlbnQnLCB7IGVudGl0eTogZW50aXR5LCBldmVudHM6IGxvY2FsRXZlbnRzIH0pO1xuXHRsb2NhbEV2ZW50cyA9IFtdO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZSgpe1xuXHRsb2NhbEV2ZW50cy5wdXNoKHsgc2hhcmVkOiB0cnVlLCBlbnRpdHk6IGVudGl0eSB9KTtcbn1cblxuZnVuY3Rpb24gZXZlbnRzSGFuZGxlcihldnQpe1xuXHR2YXIgZSA9IGV2dCB8fCB3aW5kb3cuZXZlbnQsXG5cdFx0ZXR5cGUgPSBlLnR5cGUsXG5cdFx0dGFyZyA9IGUudGFyZ2V0LFxuXHRcdG5vZGVOYW1lID0gdGFyZy5ub2RlTmFtZSxcblx0XHRkYiA9IGRvY3VtZW50LmJvZHksXG5cdFx0cGFyYW1zID0ge30sXG5cdFx0bm9kZUluZGV4ID0gbnVsbCxcblx0XHRub2RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhcmcubm9kZU5hbWUpLFxuXHRcdHNjcm9sbFRvcCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AsXG5cdFx0c2Nyb2xsTGVmdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCxcblx0XHRpID0gMDtcblxuXHQvLyBpZiB0aGUgdGFyZ2V0IGlzIHRleHQgbm9kZSwgZ2V0IHBhcmVudCBub2RlXG5cdGlmKHRhcmcubm9kZVR5cGUgPT09IDMpIHRhcmcgPSB0YXJnLnBhcmVudE5vZGU7XG5cblx0Ly8gcmV0dXJuIGlmIHRoZSB0YXJnZXQgbm9kZSBpcyB0aGUgZGVzY2VuZGFudCBvZiB3aWRnZXQgZWxlbWVudFxuXHRpZihlbnRpdHkgPT09ICd1c2VyJyAmJiBpc0Rlc2NlbmRhbnQod2lkZ2V0LCB0YXJnKSkgcmV0dXJuO1xuXG5cdGZvcihpPTA7IGkgPCByZW1vdGVFdmVudHMubGVuZ3RoOyBpKyspe1xuXHRcdGlmKHJlbW90ZUV2ZW50c1tpXS5ldmVudCA9PSBldHlwZSl7XG5cdFx0XHRyZW1vdGVFdmVudHMuc3BsaWNlKGksIDEpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdC8vIGdldCB0aGUgaW5kZXggb2YgdGFyZ2V0IG5vZGVcblx0Zm9yKGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKyl7XG5cdFx0aWYobm9kZXNbaV0gPT0gdGFyZykgbm9kZUluZGV4ID0gaTtcblx0fVxuXG5cdC8vIGV2ZW50IHR5cGVcblx0cGFyYW1zLmV2ZW50ID0gZXR5cGU7XG5cdC8vIGVudGl0eVxuXHRwYXJhbXMuZW50aXR5ID0gZW50aXR5O1xuXHQvLyB0YXJnZXQgbm9kZVxuXHRwYXJhbXMudG4gPSBub2RlTmFtZTtcblx0Ly8gaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXG5cdHBhcmFtcy50bmkgPSBub2RlSW5kZXg7XG5cdC8vIGxheW91dCB3aWR0aCBvZiB0aGUgZG9jdW1lbnQuYm9keVxuXHRwYXJhbXMudyA9IGRiLm9mZnNldFdpZHRoO1xuXHQvLyBsYXlvdXQgaGVpZ2h0IG9mIHRoZSBkb2N1bWVudC5ib2R5XG5cdHBhcmFtcy5oID0gZGIub2Zmc2V0SGVpZ2h0O1xuXHRwYXJhbXMuc3ggPSBzY3JvbGxMZWZ0O1xuXHRwYXJhbXMuc3kgPSBzY3JvbGxUb3A7XG5cblx0aWYoZXR5cGUgPT09ICdtb3VzZW1vdmUnIHx8IGV0eXBlID09PSAnbW91c2VvdmVyJyB8fCBldHlwZSA9PT0gJ21vdXNlb3V0Jykge1xuXHRcdHZhciB4ID0gZS5wYWdlWCB8fCBlLmNsaWVudFggKyBzY3JvbGxUb3A7XG5cdFx0dmFyIHkgPSBlLnBhZ2VZIHx8IGUuY2xpZW50WSArIHNjcm9sbExlZnQ7XG5cblx0XHQvLyBjdXJzb3IgaG9yaXNvbnRhbCBwb3N0aW9uXG5cdFx0cGFyYW1zLnggPSB4O1xuXHRcdC8vIGN1cnNvciB2ZXJ0aWNhbCBwb3NpdGlvblxuXHRcdHBhcmFtcy55ID0geTtcblxuXHRcdC8vIGZvcihpPTA7IGkgPCBsb2NhbEV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdC8vIFx0aWYobG9jYWxFdmVudHNbaV0uaW5kZXhPZihldHlwZSkgIT0gLTEpIHtcblx0XHQvLyBcdFx0bG9jYWxFdmVudHMuc3BsaWNlKGksIDEpO1xuXHRcdC8vIFx0XHRicmVhaztcblx0XHQvLyBcdH1cblx0XHQvLyB9XG5cdH0gZWxzZSBpZihldHlwZSA9PT0gJ3Njcm9sbCcpIHtcblx0XHQvLyBmb3IoaT0wOyBpIDwgbG9jYWxFdmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdGlmKGxvY2FsRXZlbnRzW2ldLmluZGV4T2YoJ3Njcm9sbCcpICE9IC0xKSB7XG5cdFx0Ly8gXHRcdGxvY2FsRXZlbnRzLnNwbGljZShpLCAxKTtcblx0XHQvLyBcdFx0YnJlYWs7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gfVxuXHRcdFxuXHRcdC8vIHZhciBzdCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuXHRcdC8vIHZhciBzbCA9IHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcblxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ2tleXVwJyB8fCBldHlwZSA9PSAna2V5ZG93bicgfHwgZXR5cGUgPT0gJ2tleXByZXNzJykge1xuXHRcdHZhciBjb2RlID0gZS5jaGFyQ29kZSB8fCBlLmtleUNvZGUgfHwgZS53aGljaDtcblx0XHR2YXIgYyA9IGdldENhcmV0UG9zaXRpb24odGFyZyk7XG5cblx0XHRpZihub2RlTmFtZSA9PT0gJ0lOUFVUJyAmJiB0YXJnLnR5cGUgPT09ICdwYXNzd29yZCcpIHJldHVybjtcblxuXHRcdGlmKGV0eXBlID09ICdrZXl1cCcpIHtcblx0XHRcdGlmKChjID09PSBudWxsKSB8fCAoY29kZSA9PSA4NiAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkpKSB7XG5cdFx0XHRcdHZhciB0dmFsdWUgPSB0YXJnLnZhbHVlO1xuXHRcdFx0XHRpZih0dmFsdWUpIHtcblx0XHRcdFx0XHR0dmFsdWUgPSB0dmFsdWUucmVwbGFjZSgvXFxuL2csICc8YnI+Jyk7XG5cdFx0XHRcdFx0Ly8gdGhlIHZhbHVlIGF0dHJpYnV0ZSBvZiB0aGUgdGFyZ2V0IG5vZGUsIGlmIGV4aXN0c1xuXHRcdFx0XHRcdHBhcmFtcy52YWx1ZSA9IHR2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZihldHlwZSA9PSAna2V5ZG93bicpIHtcblx0XHRcdGlmKGMgIT09IG51bGwgJiYgKGNvZGUgPT0gOCB8fCBjb2RlID09IDQ2IHx8IGNvZGUgPT0gMTkwKSkge1xuXHRcdFx0XHRpZighdGFyZy52YWx1ZSkgcmV0dXJuO1xuXHRcdFx0XHQvLyBjYXJldCBwb3NpdGlvblxuXHRcdFx0XHRwYXJhbXMucG9zID0gYztcblx0XHRcdFx0Ly8gY2hhciBjb2RlXG5cdFx0XHRcdHBhcmFtcy5jb2RlID0gY29kZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYoZXR5cGUgPT09ICdrZXlwcmVzcycpIHtcblx0XHRcdGlmKGMgIT09IG51bGwgJiYgY29kZSAhPSA4ICYmIGNvZGUgIT0gNDYpIHtcblx0XHRcdFx0Ly8gY2FyZXQgcG9zaXRpb25cblx0XHRcdFx0cGFyYW1zLnBvcyA9IGM7XG5cdFx0XHRcdC8vIGNoYXIgY29kZVxuXHRcdFx0XHRwYXJhbXMuY29kZSA9IGNvZGU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYoZXR5cGUgPT09ICdjaGFuZ2UnKSB7XG5cdFx0aWYobm9kZU5hbWUgPT09ICdJTlBVVCcgJiYgdGFyZy50eXBlID09PSAncGFzc3dvcmQnKSByZXR1cm47XG5cdFx0cGFyYW1zLnZhbHVlID0gdGFyZy52YWx1ZTtcblxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ21vdXNldXAnIHx8IGV0eXBlID09ICdzZWxlY3QnKXtcblx0XHR2YXIgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpIHx8IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpLnRleHQsXG5cdFx0XHRzbyA9IHNlbGVjdGlvbi5hbmNob3JPZmZzZXQsXG5cdFx0XHRlbyA9IHNlbGVjdGlvbi5mb2N1c09mZnNldCxcblx0XHRcdGFuY2hvclBhcmVudE5vZGVJbmRleCA9IDAsXG5cdFx0XHRhbmNob3JQYXJlbnROb2RlTmFtZSA9ICcnLFxuXHRcdFx0YW5jaG9yTm9kZUluZGV4ID0gMCxcblx0XHRcdGFuY2hvclBhcmVudCA9ICcnLFxuXHRcdFx0Zm9jdXNQYXJlbnROb2RlSW5kZXggPSAwLFxuXHRcdFx0Zm9jdXNQYXJlbnROb2RlTmFtZSA9ICcnLFxuXHRcdFx0Zm9jdXNOb2RlSW5kZXggPSAwLFxuXHRcdFx0Zm9jdXNQYXJlbnQgPSAnJyxcblx0XHRcdHJldmVyc2UgPSBmYWxzZTtcblxuXHRcdGlmKHNlbGVjdGlvbi5hbmNob3JOb2RlICE9PSBudWxsKSB7XG5cdFx0XHRhbmNob3JQYXJlbnQgPSBzZWxlY3Rpb24uYW5jaG9yTm9kZS5wYXJlbnROb2RlO1xuXG5cdFx0XHRmb3IoaT0wOyBpPGFuY2hvclBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0aWYoYW5jaG9yUGFyZW50LmNoaWxkTm9kZXNbaV0gPT0gc2VsZWN0aW9uLmFuY2hvck5vZGUpIGFuY2hvck5vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGFuY2hvclBhcmVudE5vZGVOYW1lID0gYW5jaG9yUGFyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRub2RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGFuY2hvclBhcmVudE5vZGVOYW1lKTtcblx0XHRcdGZvcihpPTA7aTxub2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKG5vZGVzW2ldID09PSBhbmNob3JQYXJlbnQpIGFuY2hvclBhcmVudE5vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZvY3VzUGFyZW50ID0gc2VsZWN0aW9uLmZvY3VzTm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0Zm9yKGk9MDsgaTxmb2N1c1BhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0aWYoZm9jdXNQYXJlbnQuY2hpbGROb2Rlc1tpXSA9PSBzZWxlY3Rpb24uZm9jdXNOb2RlKSBmb2N1c05vZGVJbmRleCA9IGk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZvY3VzUGFyZW50Tm9kZU5hbWUgPSBmb2N1c1BhcmVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0bm9kZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShmb2N1c1BhcmVudE5vZGVOYW1lKTtcblx0XHRcdGZvcihpPTA7aTxub2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKG5vZGVzW2ldID09PSBmb2N1c1BhcmVudCkgZm9jdXNQYXJlbnROb2RlSW5kZXggPSBpO1xuXHRcdFx0fVxuXHRcdFx0XG5cblx0XHRcdGlmKGFuY2hvclBhcmVudE5vZGVOYW1lID09PSBmb2N1c1BhcmVudE5vZGVOYW1lICYmXG5cdFx0XHRcdGFuY2hvclBhcmVudE5vZGVJbmRleCA9PT0gZm9jdXNQYXJlbnROb2RlSW5kZXggJiZcblx0XHRcdFx0XHRhbmNob3JOb2RlSW5kZXggPT09IGZvY3VzTm9kZUluZGV4ICYmXG5cdFx0XHRcdFx0XHRzbyA+IGVvKVxuXHRcdFx0XHRcdFx0XHRyZXZlcnNlID0gdHJ1ZTtcblxuXHRcdFx0Ly8gbmFtZSBvZiB0aGUgdGFyZ2V0IG5vZGUgd2hlcmUgc2VsZWN0aW9uIHN0YXJ0ZWRcblx0XHRcdHBhcmFtcy5zbiA9IGFuY2hvclBhcmVudE5vZGVOYW1lO1xuXHRcdFx0cGFyYW1zLnNuaSA9IGFuY2hvclBhcmVudE5vZGVJbmRleDtcblx0XHRcdHBhcmFtcy5zY2hpID0gYW5jaG9yTm9kZUluZGV4O1xuXHRcdFx0Ly8gbmFtZSBvZiB0aGUgdGFyZ2V0IG5vZGUgd2hlcmUgc2VsZWN0aW9uIGVuZGVkXG5cdFx0XHRwYXJhbXMuZW4gPSBmb2N1c1BhcmVudE5vZGVOYW1lO1xuXHRcdFx0cGFyYW1zLmVuaSA9IGZvY3VzUGFyZW50Tm9kZUluZGV4O1xuXHRcdFx0cGFyYW1zLmVjaGkgPSBmb2N1c05vZGVJbmRleDtcblx0XHRcdHBhcmFtcy5zbyA9IHJldmVyc2UgPyBlbyA6IHNvO1xuXHRcdFx0cGFyYW1zLmVvID0gcmV2ZXJzZSA/IHNvIDogZW87XG5cdFx0fVxuXHR9IGVsc2UgaWYoZXR5cGUgPT0gJ2NsaWNrJykge1xuXHRcdHBhcmFtcy5zY3ggPSBlLnNjcmVlblg7XG5cdFx0cGFyYW1zLnNjeSA9IGUuc2NyZWVuWTtcblx0fVxuXG5cdC8vIGRlYnVnLmxvZygnZXZlbnRzSGFuZGxlcjogJywgcGFyYW1zKTtcblx0bG9jYWxFdmVudHMucHVzaChwYXJhbXMpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVFdmVudHMocmVzdWx0KXtcblx0dmFyIG1haW5FbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXHRcdHRhcmdldCxcblx0XHRldnQgPSB7fTtcblxuXHRpZihyZXN1bHQuZXZlbnRzICYmIHJlc3VsdC5ldmVudHMubGVuZ3RoKSB7XG5cblx0XHQvLyBjaGVjayBmb3Igc2Nyb2xsVG9wL0xlZnQuIFxuXHRcdC8vIElFIGFuZCBGaXJlZm94IGFsd2F5cyByZXR1cm4gMCBmcm9tIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wL0xlZnQsIFxuXHRcdC8vIHdoaWxlIG90aGVyIGJyb3dzZXJzIHJldHVybiAwIGZyb20gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XG5cdFx0bWFpbkVsZW1lbnQgPSAoJ0FjdGl2ZVhPYmplY3QnIGluIHdpbmRvdyB8fCB0eXBlb2YgSW5zdGFsbFRyaWdnZXIgIT09ICd1bmRlZmluZWQnKSA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IGRvY3VtZW50LmJvZHk7XG5cblx0XHRmb3IodmFyIGk9MDsgaTxyZXN1bHQuZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRldnQgPSByZXN1bHQuZXZlbnRzW2ldO1xuXG5cdFx0XHQvLyBpZihldnQuc2hhcmVkICE9PSB1bmRlZmluZWQpIGRlYnVnLmxvZygnc2hhcmVkIGV2ZW50cycsIGV2ZW50VGltZXN0YW1wLCBldnQsIHJlc3VsdC5pbml0KTtcblx0XHRcdGlmKGV2dC50aW1lc3RhbXAgPCBldmVudFRpbWVzdGFtcCkgY29udGludWU7XG5cdFx0XHRpZihldnQuZW50aXR5ID09PSBlbnRpdHkpIGNvbnRpbnVlO1xuXHRcdFx0XHRcdFxuXHRcdFx0aWYoZXZ0LnNoYXJlZCAhPT0gdW5kZWZpbmVkKXtcblx0XHRcdFx0aWYoZXZ0LnNoYXJlZCl7XG5cdFx0XHRcdFx0Y2hlY2tFdmVyeSgpO1xuXHRcdFx0XHRcdHNoYXJlQnJvd3NlcigpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmKCFyZXN1bHQuaGlzdG9yeUV2ZW50cykgdW5zaGFyZUJyb3dzZXIoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoZXZ0LnVybCkge1xuXHRcdFx0XHRpZighcmVzdWx0Lmhpc3RvcnlFdmVudHMpIHtcblx0XHRcdFx0XHR2YXIgdXJsID0gZXZ0LnVybDtcblx0XHRcdFx0XHR2YXIgZG9jVXJsID0gZG9jdW1lbnQuVVJMO1xuXHRcdFx0XHRcdGlmKGRvY1VybC5pbmRleE9mKCdjaGF0U2Vzc2lvbklkJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRkb2NVcmwgPSBkb2NVcmwuc3Vic3RyKDAsIGRvY1VybC5pbmRleE9mKCdjaGF0U2Vzc2lvbklkJyktMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKHVybCAhPSBkb2NVcmwpIGNoYW5nZVVSTCh1cmwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihldnQudyl7XG5cdFx0XHRcdGlmKGV2dC5lbnRpdHkgPT09ICd1c2VyJykge1xuXHRcdFx0XHRcdHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcblx0XHRcdFx0XHR2YXIgaW5uZXJXID0gYm9keS5vZmZzZXRXaWR0aDtcblx0XHRcdFx0XHRpZihpbm5lclcgIT09IGV2dC53KSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5ib2R5LnN0eWxlLndpZHRoID0gZXZ0LncgKyAncHgnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoZXZ0LmV2ZW50ID09PSAnbW91c2Vtb3ZlJykge1xuXHRcdFx0XHRpZihjdXJzb3IpIHtcblx0XHRcdFx0XHRjdXJzb3JYID0gZXZ0LnggKyAncHgnO1xuXHRcdFx0XHRcdGN1cnNvclkgPSBldnQueSArICdweCc7XG5cdFx0XHRcdFx0Ly8gY3Vyc29yLnN0eWxlLmxlZnQgPSBldnQueCArICdweCc7XG5cdFx0XHRcdFx0Ly8gY3Vyc29yLnN0eWxlLnRvcCA9IGV2dC55ICsgJ3B4Jztcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ3Njcm9sbCcpIHtcblx0XHRcdFx0aWYoZXZ0LnRuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRpZihldnQudG4gPT09ICcjZG9jdW1lbnQnKSB0YXJnZXQgPSBtYWluRWxlbWVudDtcblx0XHRcdFx0XHRlbHNlIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bilbZXZ0LnRuaV07XG5cdFx0XHRcdFx0aWYodGFyZ2V0KXtcblx0XHRcdFx0XHRcdHRhcmdldC5zY3JvbGxUb3AgPSBldnQuc3k7XG5cdFx0XHRcdFx0XHR0YXJnZXQuc2Nyb2xsTGVmdCA9IGV2dC5zeDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihldnQuZXZlbnQgPT09ICdtb3VzZXVwJyB8fCBldnQuZXZlbnQgPT09ICdzZWxlY3QnKXtcblx0XHRcdFx0aWYoZXZ0LnNuKSB7XG5cdFx0XHRcdFx0dmFyIHN0YXJ0Tm9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC5zbilbZXZ0LnNuaV07XG5cdFx0XHRcdFx0dmFyIGVuZE5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQuZW4pW2V2dC5lbmldO1xuXHRcdFx0XHRcdGlmKGRvY3VtZW50LmNyZWF0ZVJhbmdlICYmIHN0YXJ0Tm9kZSAhPT0gdW5kZWZpbmVkICYmIGVuZE5vZGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0dmFyIHJuZyA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG5cdFx0XHRcdFx0XHRybmcuc2V0U3RhcnQoc3RhcnROb2RlLmNoaWxkTm9kZXNbZXZ0LnNjaGldLCBldnQuc28pO1xuXHRcdFx0XHRcdFx0cm5nLnNldEVuZChlbmROb2RlLmNoaWxkTm9kZXNbZXZ0LmVjaGldLCBldnQuZW8pO1xuXHRcdFx0XHRcdFx0dmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcblx0XHRcdFx0XHRcdHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcblx0XHRcdFx0XHRcdHNlbC5hZGRSYW5nZShybmcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ2tleXVwJyB8fCBldnQuZXZlbnQgPT09ICdrZXlkb3duJyB8fCBldnQuZXZlbnQgPT09ICdrZXlwcmVzcycpIHtcblx0XHRcdFx0aWYoZXZ0LnRuICE9PSB1bmRlZmluZWQgJiYgZXZ0LnRuaSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuKVtldnQudG5pXTtcblx0XHRcdFx0XHRpZih0YXJnZXQpe1xuXHRcdFx0XHRcdFx0dmFyIG91dHB1dDtcblx0XHRcdFx0XHRcdHZhciBhID0gdGFyZ2V0LnZhbHVlO1xuXHRcdFx0XHRcdFx0aWYoZXZ0LmNvZGUgPT0gOCkge1xuXHRcdFx0XHRcdFx0XHRpZihldnQucG9zID09IGEubGVuZ3RoLTEpIG91dHB1dCA9IGEuc3Vic3RyKDAsIGV2dC5wb3MtMSk7XG5cdFx0XHRcdFx0XHRcdGVsc2UgaWYoZXZ0LnBvcyA9PT0gMCkgcmV0dXJuO1xuXHRcdFx0XHRcdFx0XHRlbHNlIG91dHB1dCA9IGEuc3Vic3RyKDAsIGV2dC5wb3MtMSkgKyBhLnN1YnN0cihldnQucG9zKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGV2dC5jb2RlID09IDQ2KSB7XG5cdFx0XHRcdFx0XHRcdG91dHB1dCA9IGEuc3Vic3RyKDAsIGV2dC5wb3MpICsgYS5zdWJzdHIoZXZ0LnBvcysxKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGV2dC5jb2RlID09IDE5MCkge1xuXHRcdFx0XHRcdFx0XHRvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zKSArICcuJyArIGEuc3Vic3RyKGV2dC5wb3MpO1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQudmFsdWUgPSBvdXRwdXQ7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoZXZ0LnZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHR2YWx1ZSA9IGV2dC52YWx1ZTtcblx0XHRcdFx0XHRcdFx0dHZhbHVlID0gdHZhbHVlLnJlcGxhY2UoLzxicj4vZywgJ1xcbicpO1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQudmFsdWUgPSB0dmFsdWU7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR2YXIgYyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZ0LmNvZGUpO1xuXHRcdFx0XHRcdFx0XHRpZihhKSBvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zKSArIGMgKyBhLnN1YnN0cihldnQucG9zKTtcblx0XHRcdFx0XHRcdFx0ZWxzZSBvdXRwdXQgPSBjO1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQudmFsdWUgPSBvdXRwdXQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoZXZ0LmV2ZW50ID09PSAnY2hhbmdlJykge1xuXHRcdFx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHR0YXJnZXQudmFsdWUgPSBldnQudmFsdWU7XG5cdFx0XHR9IGVsc2UgaWYoZXZ0LmV2ZW50ID09PSAnY2xpY2snKXtcblx0XHRcdFx0Ly8gdmFyIGVsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuLnRvTG93ZXJDYXNlKCkpO1xuXHRcdFx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHRpZih0YXJnZXQpIHRhcmdldC5jbGljaygpO1xuXHRcdFx0XHQvLyBlbGVtZW50c1tldnQudG5pXS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAneWVsbG93Jztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bilbZXZ0LnRuaV07XG5cdFx0XHRcdGlmKHRhcmdldCkge1xuXHRcdFx0XHRcdHZhciBldnRPcHRzID0gbW91c2VFdmVudChldnQuZXZlbnQsIGV2dC54LCBldnQueSwgZXZ0LngsIGV2dC55KTtcblx0XHRcdFx0XHRkaXNwYXRjaEV2ZW50KHRhcmdldCwgZXZ0T3B0cyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYoZXZ0LmV2ZW50ID09PSAnY2xpY2snIHx8IGV2dC5ldmVudCA9PT0gJ3Njcm9sbCcpIHJlbW90ZUV2ZW50cy5wdXNoKGV2dCk7XG5cdFx0fVxuXHR9XG5cblx0aWYocmVzdWx0LnRpbWVzdGFtcCkgZXZlbnRUaW1lc3RhbXAgPSByZXN1bHQudGltZXN0YW1wO1xuXHRpZihzaGFyZWQpIGVtaXRFdmVudHMoKTtcbn1cblxuZnVuY3Rpb24gbW91c2VFdmVudCh0eXBlLCBzeCwgc3ksIGN4LCBjeSkge1xuXHR2YXIgZXZ0O1xuXHR2YXIgZSA9IHtcblx0XHRidWJibGVzOiB0cnVlLFxuXHRcdGNhbmNlbGFibGU6ICh0eXBlICE9IFwibW91c2Vtb3ZlXCIpLFxuXHRcdHZpZXc6IHdpbmRvdyxcblx0XHRkZXRhaWw6IDAsXG5cdFx0c2NyZWVuWDogc3gsXG5cdFx0c2NyZWVuWTogc3ksXG5cdFx0Y2xpZW50WDogY3gsXG5cdFx0Y2xpZW50WTogY3ksXG5cdFx0Y3RybEtleTogZmFsc2UsXG5cdFx0YWx0S2V5OiBmYWxzZSxcblx0XHRzaGlmdEtleTogZmFsc2UsXG5cdFx0bWV0YUtleTogZmFsc2UsXG5cdFx0YnV0dG9uOiAwLFxuXHRcdHJlbGF0ZWRUYXJnZXQ6IHVuZGVmaW5lZFxuXHR9O1xuXHRpZiAodHlwZW9mKCBkb2N1bWVudC5jcmVhdGVFdmVudCApID09IFwiZnVuY3Rpb25cIikge1xuXHRcdGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiTW91c2VFdmVudHNcIik7XG5cdFx0ZXZ0LmluaXRNb3VzZUV2ZW50KFxuXHRcdFx0dHlwZSxcblx0XHRcdGUuYnViYmxlcyxcblx0XHRcdGUuY2FuY2VsYWJsZSxcblx0XHRcdGUudmlldyxcblx0XHRcdGUuZGV0YWlsLFxuXHRcdFx0ZS5zY3JlZW5YLFxuXHRcdFx0ZS5zY3JlZW5ZLFxuXHRcdFx0ZS5jbGllbnRYLFxuXHRcdFx0ZS5jbGllbnRZLFxuXHRcdFx0ZS5jdHJsS2V5LFxuXHRcdFx0ZS5hbHRLZXksXG5cdFx0XHRlLnNoaWZ0S2V5LFxuXHRcdFx0ZS5tZXRhS2V5LFxuXHRcdFx0ZS5idXR0b24sXG5cdFx0XHRkb2N1bWVudC5ib2R5LnBhcmVudE5vZGVcblx0XHQpO1xuXHR9IGVsc2UgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG5cdFx0ZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcblx0XHRmb3IgKHZhciBwcm9wIGluIGUpIHtcblx0XHRcdGV2dFtwcm9wXSA9IGVbcHJvcF07XG5cdFx0fVxuXHRcdGV2dC5idXR0b24gPSB7IDA6MSwgMTo0LCAyOjIgfVtldnQuYnV0dG9uXSB8fCBldnQuYnV0dG9uO1xuXHR9XG5cdHJldHVybiBldnQ7XG59XG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50IChlbCwgZXZ0KSB7XG5cdGlmIChlbC5kaXNwYXRjaEV2ZW50KSB7XG5cdFx0ZWwuZGlzcGF0Y2hFdmVudChldnQpO1xuXHR9IGVsc2UgaWYgKGVsLmZpcmVFdmVudCkge1xuXHRcdGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZXZ0KTtcblx0fVxuXHRyZXR1cm4gZXZ0O1xufVxuXG5mdW5jdGlvbiBjaGFuZ2VVUkwodXJsKSB7XG4gICAgdmFyIGRvY1VybCA9IGRvY3VtZW50LlVSTDtcbiAgICBpZiAoZG9jVXJsICE9PSB1cmwpIHtcblx0XHRkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNEZXNjZW5kYW50KHBhcmVudCwgY2hpbGQpIHtcbiAgICAgdmFyIG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xuICAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHJldHVybiB0cnVlO1xuICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgfVxuICAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLmFkZEV2ZW50TGlzdGVuZXIpIG9iai5hZGRFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmF0dGFjaEV2ZW50KSBvYmouYXR0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufVxuZnVuY3Rpb24gcmVtb3ZlRXZlbnQob2JqLCBldlR5cGUsIGZuKSB7XG4gIGlmIChvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcikgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZUeXBlLCBmbiwgZmFsc2UpO1xuICBlbHNlIGlmIChvYmouZGV0YWNoRXZlbnQpIG9iai5kZXRhY2hFdmVudChcIm9uXCIrZXZUeXBlLCBmbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRpbml0OiBpbml0LFxuXHRpc0luaXRpYXRlZDogaXNJbml0aWF0ZWQsXG5cdHNoYXJlOiBzaGFyZUJyb3dzZXIsXG5cdHVuc2hhcmU6IHVuc2hhcmVCcm93c2VyLFxuXHR1bnNoYXJlQWxsOiB1bnNoYXJlQWxsLFxuXHRlbWl0RXZlbnRzOiBlbWl0RXZlbnRzLFxuXHR1cGRhdGVFdmVudHM6IHVwZGF0ZUV2ZW50c1xufTsiLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcbnZhciByZXF1ZXN0ID0gcmVxdWlyZSgnLi9yZXF1ZXN0Jyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG4vLyB2YXIgd2Vic29ja2V0cyA9IHJlcXVpcmUoJy4vd2Vic29ja2V0cycpO1xuLy8gdmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKGRvY3VtZW50LlVSTCwgdHJ1ZSk7XG52YXIgdXJsID0gZ2xvYmFsLmxvY2F0aW9uO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbnZhciB3ZWJzb2NrZXRUcnkgPSAxO1xudmFyIHBvbGxUdXJucyA9IDE7XG52YXIgbWFpbkFkZHJlc3MgPSBcIm1haW4ucmluZ290ZWwubmV0L2NoYXRib3QvV2ViQ2hhdC9cIjtcbnZhciBwdWJsaWNVcmwgPSBcImh0dHBzOi8vbWFpbi5yaW5nb3RlbC5uZXQvcHVibGljL1wiO1xudmFyIHdlYnNvY2tldFVybCA9IFwiXCI7XG52YXIgbW9kdWxlSW5pdCA9IGZhbHNlO1xuXG4vKipcbiAqIENvcmUgbW9kdWxlIGltcGxlbWVudHMgbWFpbiBpbnRlcm5hbCBmdW5jdGlvbmFsaXR5XG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBJbnN0YW50aWF0aW9uIG9wdGlvbnMgdGhhdCBvdmVycmlkZXMgbW9kdWxlIGRlZmF1bHRzXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgUmV0dXJuIHB1YmxpYyBBUElcbiAqL1xuXG52YXIgZGVmYXVsdHMgPSB7XG5cdC8vIElQQ0Mgc2VydmVyIElQIGFkZHJlc3MvZG9tYWluIG5hbWUgYW5kIHBvcnQgbnVtYmVyLlxuXHQvLyBleC46IFwiaHR0cDovLzE5Mi4xNjguMS4xMDA6ODg4MFwiXG5cdHNlcnZlcjogJydcbn07XG5cbmluaGVyaXRzKFdjaGF0QVBJLCBFdmVudEVtaXR0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdjaGF0QVBJO1xuXG5mdW5jdGlvbiBXY2hhdEFQSShvcHRpb25zKXtcblxuXHQvLyBleHRlbmQgZGVmYXVsdCBvcHRpb25zXG5cdC8vIHdpdGggcHJvdmlkZWQgb2JqZWN0XG5cdHRoaXMub3B0aW9ucyA9IF8uYXNzaWduKGRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblx0dGhpcy5vcHRpb25zLnNlcnZlclVybCA9IHRoaXMub3B0aW9ucy5zZXJ2ZXIgKyAnL2lwY2MvJCQkJztcblx0dGhpcy5zZXNzaW9uID0ge307XG5cblx0aWYoIXRoaXMub3B0aW9ucy5wYWdlaWQpIHJldHVybiBjb25zb2xlLmVycm9yKCdDYW5ub3QgaW5pdGlhdGUgbW9kdWxlOiBwYWdlaWQgaXMgdW5kZWZpbmVkJyk7XG5cblx0d2Vic29ja2V0VXJsID0gbWFpbkFkZHJlc3MrdGhpcy5vcHRpb25zLnBhZ2VpZDtcblxuXHR0aGlzLmNyZWF0ZVdlYnNvY2tldCgpO1xuXG5cdHRoaXMub24oJ3Nlc3Npb24vY3JlYXRlJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdHRoaXMuc2Vzc2lvbiA9IGRhdGE7XG5cdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ3NpZCcsIGRhdGEuc2lkKTtcblx0fS5iaW5kKHRoaXMpKTtcblx0dGhpcy5vbignY2hhdC9jbG9zZScsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2hhdCcsIGZhbHNlKTtcblx0fSk7XG5cdHRoaXMub24oJ0Vycm9yJywgdGhpcy5vbkVycm9yKTtcblxuXHRyZXR1cm4gdGhpcztcblxufVxuXG5XY2hhdEFQSS5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uKGVycil7XG5cdGRlYnVnLmVycm9yKGVycik7XG5cdGlmKGVyci5jb2RlID09PSA0MDQpIHtcblx0XHR0aGlzLmVtaXQoJ3Nlc3Npb24vdGltZW91dCcpO1xuXHR9XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2VuZERhdGEgPSBmdW5jdGlvbihkYXRhKXtcblx0aWYodGhpcy53ZWJzb2NrZXQpIHRoaXMud2Vic29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufTtcblxuLyoqXG4gKiBXZWJzb2NrZXQgbWVzc2FnZXMgaGFuZGxlclxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUub25XZWJzb2NrZXRNZXNzYWdlID0gZnVuY3Rpb24oZSl7XG5cdC8vIHRoaXMuZW1pdCgnd2Vic29ja2V0L21lc3NhZ2UnLCAoZS5kYXRhID8gSlNPTi5wYXJzZShlLmRhdGEpIDoge30pKTtcblx0dmFyIGRhdGEgPSBKU09OLnBhcnNlKGUuZGF0YSksXG5cdCAgICBtZXRob2QgPSBkYXRhLm1ldGhvZDtcblxuXHRkZWJ1Zy5sb2coJ29uV2Vic29ja2V0TWVzc2FnZTogJywgZGF0YSk7XG5cdFxuXHRpZihkYXRhLm1ldGhvZCkge1xuXHRcdGlmKGRhdGEubWV0aG9kID09PSAnc2Vzc2lvbicpIHtcblx0XHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9jcmVhdGUnLCBkYXRhLnBhcmFtcyk7XG5cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdtZXNzYWdlcycpIHtcblx0XHRcdGlmKGRhdGEucGFyYW1zLmxpc3QpIHtcblx0XHRcdFx0ZGF0YS5wYXJhbXMubGlzdC5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS9uZXcnLCBpdGVtKTtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbTtcblx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdtZXNzYWdlJykge1xuXHRcdFx0aWYoZGF0YS5wYXJhbXMudHlwaW5nKSB7XG5cdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS90eXBpbmcnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS9uZXcnLCBkYXRhLnBhcmFtcyk7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIE1vZHVsZSBpbml0aWF0aW9uXG4gKiBFbWl0cyBtb2R1bGUvc3RhcnQgZXZlbnQgaWYgbW9kdWxlIHN0YXJ0ZWRcbiAqL1xuLy8gV2NoYXRBUEkucHJvdG90eXBlLmluaXRNb2R1bGUgPSBmdW5jdGlvbigpe1xuXG5cdC8vIF8ucG9sbChmdW5jdGlvbigpe1xuXHQvLyBcdHJldHVybiAod2Vic29ja2V0SW5pdCA9PT0gdHJ1ZSk7XG5cdC8vIH0sIGZ1bmN0aW9uKCkge1xuXHQvLyBcdGRlYnVnLmxvZygnSU5JVCcpO1xuXHQvLyBcdHRoaXMuaW5pdCgpO1xuXHQvLyB9LmJpbmQodGhpcyksIGZ1bmN0aW9uKCl7XG5cdC8vIFx0aWYocG9sbFR1cm5zIDwgMikge1xuXHQvLyBcdFx0cG9sbFR1cm5zKys7XG5cdC8vIFx0fSBlbHNlIHtcblx0Ly8gXHRcdHJldHVybiB0aGlzLmVtaXQoJ0Vycm9yJywgJ01vZHVsZSB3YXNuXFwndCBpbml0aWF0ZWQgZHVlIHRvIG5ldHdvcmsgZXJyb3InKTtcblx0Ly8gXHR9XG5cdC8vIH0uYmluZCh0aGlzKSwgNjAwMDApO1xuLy8gfTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpe1xuXHRtb2R1bGVJbml0ID0gdHJ1ZTtcblxuXHR2YXIgZW50aXR5ID0gc3RvcmFnZS5nZXRTdGF0ZSgnZW50aXR5JywgJ3Nlc3Npb24nKSxcblx0XHRzaWQgPSBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKTtcblxuXHRkZWJ1Zy5sb2coJ2luaXRNb2R1bGU6ICcsIGVudGl0eSwgc2lkKTtcblxuXHQvLyBBIGNoYXRTZXNzaW9uSWQgcGFyYW1ldGVyIGluIHRoZSB1cmwgcXVlcnkgXG5cdC8vIGluZGljYXRlcyB0aGF0IHRoZSB3ZWIgcGFnZSB3YXMgb3BlbmVkIGJ5IGFnZW50LlxuXHQvLyBJbiB0aGF0IGNhc2UgYWdlbnQgc2hvdWxkIGpvaW4gdGhlIHNlc3Npb24uXG5cdGlmKHVybC5ocmVmLmluZGV4T2YoJ2NoYXRTZXNzaW9uSWQnKSAhPT0gLTEpIHtcblx0XHRzaWQgPSB0aGlzLmdldFNpZEZyb21VcmwodXJsLmhyZWYpO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdlbnRpdHknLCAnYWdlbnQnLCAnc2Vzc2lvbicpO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaWQnLCBzaWQpO1xuXHRcdHRoaXMuam9pblNlc3Npb24oc2lkKTtcblx0fSBlbHNlIGlmKGVudGl0eSA9PT0gJ2FnZW50JyAmJiBzaWQpIHsgLy8gSW4gY2FzZSB0aGUgY29icm93c2luZyBzZXNzaW9uIGlzIGFjdGl2ZVxuXHRcdHRoaXMuam9pblNlc3Npb24oc2lkLCB1cmwuaHJlZik7XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBJbiBjYXNlIGEgc2Vzc2lvbiBpcyBhbHJlYWR5IGluaXRpYXRlZCBcblx0XHQvLyBhbmQgc3RvcmFnZSBjb250YWluZXMgc2lkIHBhcmFtZXRlclxuXHRcdGlmKHNpZCkge1xuXHRcdFx0Ly8gdGhpcy51cGRhdGVFdmVudHMoW3sgZW50aXR5OiBlbnRpdHksIHVybDogdXJsLmhyZWYgfV0sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCl7XG5cdFx0XHQvLyBcdGlmKGVycikge1xuXHRcdFx0Ly8gXHRcdHJldHVybjtcblx0XHRcdC8vIFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ3NpZCcsIHNpZCk7XG5cdFx0XHRcdC8vIHRoaXMuZW1pdCgnc2Vzc2lvbi9jb250aW51ZScsIHsgZW50aXR5OiBlbnRpdHksIHVybDogdXJsLmhyZWYgfSk7XG5cdFx0XHRcdHRoaXMuY3JlYXRlU2Vzc2lvbih7IHNpZDogc2lkLCB1cmw6IHVybC5ocmVmIH0pO1xuXHRcdFx0Ly8gfS5iaW5kKHRoaXMpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2VudGl0eScsICd1c2VyJywgJ3Nlc3Npb24nKTtcblx0XHRcdC8vIENyZWF0ZSBuZXcgc2Vzc2lvblxuXHRcdFx0dGhpcy5jcmVhdGVTZXNzaW9uKHsgdXJsOiB1cmwuaHJlZiB9KTtcblx0XHR9XG5cdH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHNlc3Npb25cbiAqIEVtaXRzIHNlc3Npb24vY3JlYXRlIGV2ZW50XG4gKiBpZiBpbml0aWF0aW9uIGlzIHN1Y2Nlc3NmdWxcbiAqXG4gKiBAcGFyYW0gXHR7U3RyaW5nfSBcdHVybCBcdEN1cnJlbnQgZnVsbCBVUkxcbiAqIEByZXR1cm4gXHR7U3RyaW5nfVx0c2lkIFx0TmV3IHNlc3Npb24gaWRcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLmNyZWF0ZVNlc3Npb24gPSBmdW5jdGlvbihwYXJhbXMpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdjcmVhdGVTZXNzaW9uJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHVybDogKHBhcmFtcy51cmwgfHwgdXJsLmhyZWYpXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHBhcmFtcy5zaWQpIGRhdGEucGFyYW1zLnNpZCA9IHBhcmFtcy5zaWQ7XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnY3JlYXRlU2Vzc2lvbicsIHBhcmFtczogcGFyYW1zIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGJvZHkucmVzdWx0LnVybCA9IHVybC5ocmVmO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaWQnLCBib2R5LnJlc3VsdC5zaWQpO1xuXHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9jcmVhdGUnLCBib2R5LnJlc3VsdCk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuam9pblNlc3Npb24gPSBmdW5jdGlvbihzaWQsIHVybCl7XG5cdHRoaXMuZW1pdCgnc2Vzc2lvbi9qb2luJywgeyBzaWQ6IHNpZCwgdXJsOiB1cmwgfSk7XG59O1xuXG4vKiogXG4gKiBTZW5kL29idGFpbiBldmVudHMgdG8vZnJvbSB0aGUgc2VydmVyLiBcbiAqIEV2ZW50cyBjb3VsZCBiZSBvYnRhaW5lZCBmcm9tIHRoZSBzZXJ2ZXIgYnkgc3BlY2lmeWluZyBhIHRpbWVzdGFtcFxuICogYXMgYSBzdGFydGluZyBwb2ludCBmcm9tIHdoaWNoIGFuIGV2ZW50cyB3b3VsZCBiZSBvYnRhaW5lZFxuKiovXG5XY2hhdEFQSS5wcm90b3R5cGUudXBkYXRlRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBjYil7XG5cdHZhciBzZXNzaW9uSWQgPSBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKSwgcGFyYW1zO1xuXHRpZighc2Vzc2lvbklkKSByZXR1cm4gY2IoKTtcblx0XG5cdHBhcmFtcyA9IHtcblx0XHRtZXRob2Q6ICd1cGRhdGVFdmVudHMnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiBzZXNzaW9uSWQsXG5cdFx0XHR0aW1lc3RhbXA6IHN0b3JhZ2UuZ2V0U3RhdGUoJ2V2ZW50VGltZXN0YW1wJywgJ2NhY2hlJyksXG5cdFx0XHRldmVudHM6IGV2ZW50c1xuXHRcdH1cblx0fTtcblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIHBhcmFtcywgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCBwYXJhbXMpO1xuXHRcdFx0cmV0dXJuIGNiKGVycik7IC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXHRcdH1cblxuXHRcdGlmKGJvZHkucmVzdWx0LnRpbWVzdGFtcCA+IHN0b3JhZ2UuZ2V0U3RhdGUoJ2V2ZW50VGltZXN0YW1wJywgJ2NhY2hlJykpIHtcblx0XHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdldmVudFRpbWVzdGFtcCcsIGJvZHkucmVzdWx0LnRpbWVzdGFtcCwgJ2NhY2hlJyk7XG5cdFx0XHRpZihjYikgY2IobnVsbCwgYm9keS5yZXN1bHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZihjYikgY2IobnVsbCwgeyBldmVudHM6IFtdIH0pO1xuXHRcdH1cblx0XHRcdFxuXG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCBhdmFpbGFibGUgZGlhbG9nIGxhbmd1YWdlc1xuICogSWYgbGFuZ3VhZ2VzIGFyZSBub3QgYXZhaWxhYmxlLCBcbiAqIHRoZW4gZWl0aGVyIHRoZXJlIGFyZSBubyBhdmFpbGFibGUgYWdlbnRzIG9yXG4gKiBsYW5ndWFnZXMgd2VyZW4ndCBzZXQgaW4gQWRtaW4gU3R1ZGlvXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5nZXRMYW5ndWFnZXMgPSBmdW5jdGlvbihjYil7XG5cdGRlYnVnLmxvZygndGhpcy5zZXNzaW9uOiAnLCB0aGlzLnNlc3Npb24pO1xuXHRjYihudWxsLCB0aGlzLnNlc3Npb24ubGFuZ3MpO1x0XG5cblx0Ly8gdmFyIHNlc3Npb25JZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpO1xuXHQvLyBpZighc2Vzc2lvbklkKSByZXR1cm4gY2IodHJ1ZSk7XG5cblx0Ly8gcmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIHtcblx0Ly8gXHRtZXRob2Q6ICdnZXRMYW5ndWFnZXMnLFxuXHQvLyBcdHBhcmFtczoge1xuXHQvLyBcdFx0c2lkOiBzZXNzaW9uSWRcblx0Ly8gXHR9XG5cdC8vIH0sIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHQvLyBcdGlmKGVycikge1xuXHQvLyBcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdnZXRMYW5ndWFnZXMnIH0pO1xuXHQvLyBcdFx0cmV0dXJuIGNiKGVycik7XG5cdC8vIFx0fVxuXG5cdC8vIFx0Y2IobnVsbCwgYm9keSk7XG5cdC8vIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFJlcXVlc3QgY2hhdCBzZXNzaW9uXG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gcGFyYW1zIC0gdXNlciBwYXJhbWV0ZXJzIChuYW1lLCBwaG9uZSwgc3ViamVjdCwgbGFuZ3VhZ2UsIGV0Yy4pXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5jaGF0UmVxdWVzdCA9IGZ1bmN0aW9uKHBhcmFtcywgY2Ipe1xuXHRwYXJhbXMuc2lkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyk7XG5cblx0ZGVidWcubG9nKCdjaGF0UmVxdWVzdCBwYXJhbXM6ICcsIHBhcmFtcyk7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnY2hhdFJlcXVlc3QnLFxuXHRcdHBhcmFtczogcGFyYW1zXG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnY2hhdFJlcXVlc3QnLCBwYXJhbXM6IHBhcmFtcyB9KTtcblx0XHRcdGlmKGNiKSBjYihlcnIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHBhcmFtcy51cmwgPSB1cmwuaHJlZjtcblx0XHR0aGlzLmVtaXQoJ2NoYXQvc3RhcnQnLCBfLm1lcmdlKHBhcmFtcywgYm9keS5yZXN1bHQpKTtcblx0XHRpZihjYikgY2IobnVsbCwgYm9keSk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCBkaWFsb2cgbWVzc2FnZXNcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lc3RhbXAgR2V0IG1lc3NhZ2VzIHNpbmNlIHByb3ZpZGVkIHRpbWVzdGFtcFxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbihjYil7XG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCB7XG5cdFx0bWV0aG9kOiAnZ2V0TWVzc2FnZXMnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKSxcblx0XHRcdHRpbWVzdGFtcDogc3RvcmFnZS5nZXRTdGF0ZSgnbXNnVGltZXN0YW1wJylcblx0XHR9XG5cdH0sIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdnZXRNZXNzYWdlcycgfSk7XG5cdFx0XHRyZXR1cm4gY2IoZXJyKTtcblx0XHR9XG5cblx0XHQvLyBEbyBub3Qgc2hvdyBvbGQgbWVzc2FnZXNcblx0XHRpZihib2R5LnJlc3VsdC50aW1lc3RhbXAgPiBzdG9yYWdlLmdldFN0YXRlKCdtc2dUaW1lc3RhbXAnKSkge1xuXHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ21zZ1RpbWVzdGFtcCcsIGJvZHkucmVzdWx0LnRpbWVzdGFtcCk7XG5cdFx0XHRpZihib2R5LnJlc3VsdC5tZXNzYWdlcykge1xuXHRcdFx0XHR0aGlzLmVtaXQoJ21lc3NhZ2UvbmV3JywgYm9keS5yZXN1bHQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGJvZHkucmVzdWx0LnR5cGluZykge1xuXHRcdFx0dGhpcy5lbWl0KCdtZXNzYWdlL3R5cGluZycsIGJvZHkucmVzdWx0KTtcblx0XHR9XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkucmVzdWx0KTtcblxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBDbG9zZSBjdXJyZW50IGNoYXQgc2Vzc2lvblxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHJhdGluZyBTZXJ2aWNlIHJhdGluZ1xuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuY2xvc2VDaGF0ID0gZnVuY3Rpb24ocmF0aW5nKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnY2xvc2VDaGF0Jyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJylcblx0XHR9XG5cdH07XG5cdGlmKHJhdGluZykgZGF0YS5wYXJhbXMucmF0aW5nID0gcmF0aW5nO1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCBkYXRhKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCBmYWxzZSk7XG5cdFx0dGhpcy5lbWl0KCdjaGF0L2Nsb3NlJywgeyByYXRpbmc6IHJhdGluZywgdXJsOiB1cmwuaHJlZiB9KTtcblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogU2VuZCBtZXNzYWdlIHRvIHRoZSBhZ2VudFxuICogXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHRleHQgLSBtZXNzYWdlIGNvbnRlbnQgaW4gY2FzZSBvZiByZWd1bGFyIG1lc3NhZ2UgXG4gKiBvciBkYXRhVVJMIGluIGNhc2Ugb2YgZmlsZSB0cmFuc2ZlclxuICogQHBhcmFtICB7U3RyaW5nfSBmaWxlIC0gKE9wdGlvbmFsKSBmaWxlIG5hbWVcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24ocGFyYW1zLCBjYil7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ21lc3NhZ2UnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKSxcblx0XHRcdGNvbnRlbnQ6IHBhcmFtcy5tZXNzYWdlXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0aWYocGFyYW1zLmZpbGUpIHtcblx0XHRcdHZhciBjb250ZW50ID0gcHVibGljVXJsK0RhdGUubm93KCkrXCJfXCIrdGhpcy5vcHRpb25zLnBhZ2VpZCtcIl9cIitwYXJhbXMubWVzc2FnZTtcblx0XHRcdGRhdGEucGFyYW1zLmNvbnRlbnQgPSBjb250ZW50O1xuXG5cdFx0XHRyZXF1ZXN0LnB1dChjb250ZW50LCBwYXJhbXMuZmlsZSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0aWYoZXJyKSByZXR1cm4gY29uc29sZS5lcnJvcignc2VuZE1lc3NhZ2UgZXJyb3I6ICcsIGVycik7XG5cdFx0XHRcdHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm47XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24oZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc2VuZE1lc3NhZ2UnLCBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZihjYikgY2IoZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYoY2IpIGNiKCk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBTZW5kIGRpYWxvZyBlaXRoZXIgdG8gdGhlIHNwZWNpZmllZCBlbWFpbCBhZGRyZXNzIChpZiBwYXJhbWV0ZXIgXCJ0b1wiIGhhcyBwYXNzZWQpXG4gKiBvciB0byBjYWxsIGNlbnRlciBhZG1pbmlzdHJhdG9yIChpZiBwYXJhbWV0ZXIgXCJlbWFpbFwiIGhhcyBwYXNzZWQpXG4gKlxuICogRWl0aGVyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHRvXHRcdFx0RGVzdGluYXRpb24gZW1haWwgYWRkcmVzc1xuICpcbiAqIE9yXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGVtYWlsXHRcdFNlbmRlciBlbWFpbCBhZGRyZXNzXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHVuYW1lXHRcdFNlbmRlciBuYW1lXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVuYW1lXHRBdHRhY2htZW50IGZpbGVuYW1lXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVkYXRhXHRBdHRhY2htZW50IGZpbGUgVVJMXG4gKlxuICogQm90aFxuICogQHBhcmFtICB7U3RyaW5nfSB0ZXh0XHRcdEVtYWlsIGJvZHlcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLnNlbmRFbWFpbCA9IGZ1bmN0aW9uKHBhcmFtcywgY2Ipe1xuXHRwYXJhbXMuc2lkID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyk7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnc2VuZE1haWwnLFxuXHRcdHBhcmFtczogcGFyYW1zXG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc2VuZEVtYWlsJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRpZihjYikgY2IoZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVtaXQoJ2NoYXQvc2VuZCcsIHBhcmFtcyk7XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkpO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBTZW5kIGNhbGxiYWNrIHJlcXVlc3RcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0YXNrIC0gaWQgb2YgdGhlIGNhbGxiYWNrIHRhc2sgdGhhdCBjb25maWd1cmVkIGluIHRoZSBBZG1pbiBTdHVkaW9cbiAqIEBwYXJhbSAge1N0cmluZ30gcGhvbmUgLSBVc2VyJ3MgcGhvbmUgbnVtYmVyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHRpbWUgLSBUaW1lc3RhbXAgb2YgdGhlIGNhbGwgdG8gYmUgaW5pdGlhdGVkXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5yZXF1ZXN0Q2FsbGJhY2sgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0cGFyYW1zLnNpZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpO1xuXG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ3JlcXVlc3RDYWxsYmFjaycsXG5cdFx0cGFyYW1zOiBwYXJhbXNcblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ3JlcXVlc3RDYWxsYmFjaycsIHBhcmFtczogcGFyYW1zIH0pO1xuXHRcdFx0cmV0dXJuIGNiKGVycik7XG5cdFx0fVxuXHRcdGlmKGNiKSBjYihudWxsLCBib2R5LnJlc3VsdCk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIERpc2pvaW4gY3VycmVudCBhY3RpdmUgc2Vzc2lvblxuICogRW1pdHMgc2Vzc2lvbi9kaXNqb2luIGV2ZW50XG4gKiBpZiByZXF1ZXN0IGlzIGZ1bGZpbGxlZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaWQgSUQgb2YgYWN0aXZlIHNlc3Npb25cbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLmRpc2pvaW5TZXNzaW9uID0gZnVuY3Rpb24oc2lkKXtcblxuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdkaXNqb2luU2Vzc2lvbicsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHNpZFxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdkaXNqb2luU2Vzc2lvbicsIHBhcmFtczogeyBzaWQ6IHNpZCB9IH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9kaXNqb2luJywgeyB1cmw6IHVybC5ocmVmIH0pO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBJbmZvcm1zIHRoZSBzZXJ2ZXIgdGhhdCB0aGUgY29icm93c2luZyBmZWF0dXJlIGlzIHR1cm5lZCBvbiBvciBvZmZcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHN0YXRlIFJlcHJlc2VudHMgdGhlIHN0YXRlIG9mIGNvYnJvd3NpbmcgZmVhdHVyZVxuICogQHBhcmFtICB7U3RyaW5nfSB1cmwgICBVcmwgd2hlcmUgdGhlIGZlYXR1cmUncyBzdGF0ZSBpcyBjaGFuZ2VkXG4gKiBAcmV0dXJuIG5vbmVcbiAqL1xuV2NoYXRBUEkucHJvdG90eXBlLnN3aXRjaFNoYXJlU3RhdGUgPSBmdW5jdGlvbihzdGF0ZSwgdXJsKXtcblx0dmFyIG1ldGhvZCA9IHN0YXRlID8gJ3NoYXJlT3BlbmVkJyA6ICdzaGFyZUNsb3NlZCc7XG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCB7XG5cdFx0bWV0aG9kOiBtZXRob2QsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpLFxuXHRcdFx0dXJsOiB1cmxcblx0XHR9XG5cdH0sIGZ1bmN0aW9uKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ3N3aXRjaFNoYXJlU3RhdGUnLCBwYXJhbXM6IHsgc3RhdGU6IHN0YXRlIH0gfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLnNldENoYXRUaW1lb3V0ID0gZnVuY3Rpb24odGltZW91dCl7XG5cdHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpe1xuXHRcdHRoaXMuZW1pdCgnY2hhdC90aW1lb3V0Jyk7XG5cdH0uYmluZCh0aGlzKSwgdGltZW91dCoxMDAwKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS51c2VySXNUeXBpbmcgPSBmdW5jdGlvbigpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICd0eXBpbmcnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKVxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdzZXRDaGF0VGltZW91dCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLnVwZGF0ZVVybCA9IGZ1bmN0aW9uKHVybCl7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ3VwZGF0ZVVybCcsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpLFxuXHRcdFx0dXJsOiB1cmxcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICd1cGRhdGVVcmwnLCBwYXJhbXM6IHsgdXJsOiB1cmwgfSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUubGlua0ZvbGxvd2VkID0gZnVuY3Rpb24odXJsKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnbGlua0ZvbGxvd2VkJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJyksXG5cdFx0XHR1cmw6IHVybFxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdsaW5rRm9sbG93ZWQnLCBwYXJhbXM6IHsgdXJsOiB1cmwgfSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuZ2V0U2lkRnJvbVVybCA9IGZ1bmN0aW9uKHVybCkge1xuXHR2YXIgc3Vic3RyID0gdXJsLnN1YnN0cmluZyh1cmwuaW5kZXhPZignY2hhdFNlc3Npb25JZD0nKSk7XG5cdHN1YnN0ciA9IHN1YnN0ci5zdWJzdHJpbmcoc3Vic3RyLmluZGV4T2YoJz0nKSsxKTtcblx0cmV0dXJuIHN1YnN0cjtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5jcmVhdGVXZWJzb2NrZXQgPSBmdW5jdGlvbihob3N0KXtcbiAgICAvLyB2YXIgcHJvdG9jb2wgPSAoZ2xvYmFsLmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JykgPyAnd3NzOicgOiAnd3M6JztcbiAgICB2YXIgcHJvdG9jb2wgPSAnd3NzOic7XG4gICAgdmFyIHdlYnNvY2tldCA9IG5ldyBXZWJTb2NrZXQocHJvdG9jb2wgKyAnLy8nK3dlYnNvY2tldFVybCwnanNvbi5hcGkuc21pbGUtc29mdC5jb20nKTsgLy9Jbml0IFdlYnNvY2tldCBoYW5kc2hha2VcblxuICAgIHdlYnNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbihlKXtcbiAgICAgICAgY29uc29sZS5sb2coJ1dlYlNvY2tldCBvcGVuZWQ6ICcsIGUpO1xuICAgICAgICB3ZWJzb2NrZXRUcnkgPSAxO1xuICAgICAgICBpZighbW9kdWxlSW5pdCkge1xuICAgICAgICBcdHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHdlYnNvY2tldC5vbm1lc3NhZ2UgPSB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHdlYnNvY2tldC5vbmNsb3NlID0gdGhpcy5vbldlYnNvY2tldENsb3NlLmJpbmQodGhpcyk7XG4gICAgd2Vic29ja2V0Lm9uZXJyb3IgPSB0aGlzLm9uRXJyb3I7XG5cbiAgICBnbG9iYWwub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgd2Vic29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7fTsgLy8gZGlzYWJsZSBvbmNsb3NlIGhhbmRsZXIgZmlyc3RcbiAgICAgICAgd2Vic29ja2V0LmNsb3NlKClcbiAgICB9O1xuXG4gICAgdGhpcy53ZWJzb2NrZXQgPSB3ZWJzb2NrZXQ7XG5cbn1cblxuV2NoYXRBUEkucHJvdG90eXBlLm9uV2Vic29ja2V0Q2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ1dlYlNvY2tldCBjbG9zZWQnLCBlKTtcbiAgICB2YXIgdGltZSA9IGdlbmVyYXRlSW50ZXJ2YWwod2Vic29ja2V0VHJ5KTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHdlYnNvY2tldFRyeSsrO1xuICAgICAgICB0aGlzLmNyZWF0ZVdlYnNvY2tldCgpO1xuICAgIH0uYmluZCh0aGlzKSwgdGltZSk7XG59XG5cbi8vUmVjb25uZWN0aW9uIEV4cG9uZW50aWFsIEJhY2tvZmYgQWxnb3JpdGhtIHRha2VuIGZyb20gaHR0cDovL2Jsb2cuam9obnJ5ZGluZy5jb20vcG9zdC83ODU0NDk2OTM0OS9ob3ctdG8tcmVjb25uZWN0LXdlYi1zb2NrZXRzLWluLWEtcmVhbHRpbWUtd2ViLWFwcFxuZnVuY3Rpb24gZ2VuZXJhdGVJbnRlcnZhbCAoaykge1xuICAgIHZhciBtYXhJbnRlcnZhbCA9IChNYXRoLnBvdygyLCBrKSAtIDEpICogMTAwMDtcbiAgXG4gICAgaWYgKG1heEludGVydmFsID4gMzAqMTAwMCkge1xuICAgICAgICBtYXhJbnRlcnZhbCA9IDMwKjEwMDA7IC8vIElmIHRoZSBnZW5lcmF0ZWQgaW50ZXJ2YWwgaXMgbW9yZSB0aGFuIDMwIHNlY29uZHMsIHRydW5jYXRlIGl0IGRvd24gdG8gMzAgc2Vjb25kcy5cbiAgICB9XG4gIFxuICAgIC8vIGdlbmVyYXRlIHRoZSBpbnRlcnZhbCB0byBhIHJhbmRvbSBudW1iZXIgYmV0d2VlbiAwIGFuZCB0aGUgbWF4SW50ZXJ2YWwgZGV0ZXJtaW5lZCBmcm9tIGFib3ZlXG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiBtYXhJbnRlcnZhbDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2c6IGZ1bmN0aW9uKCl7IGxvZyhhcmd1bWVudHMsICdsb2cnKTsgfSxcbiAgICBpbmZvOiBmdW5jdGlvbigpeyBsb2coYXJndW1lbnRzLCAnaW5mbycpOyB9LFxuICAgIHdhcm46IGZ1bmN0aW9uKCl7IGxvZyhhcmd1bWVudHMsICd3YXJuJyk7IH0sXG4gICAgZXJyb3I6IGZ1bmN0aW9uKCl7IGxvZyhhcmd1bWVudHMsICdlcnJvcicpOyB9XG59O1xuXG5mdW5jdGlvbiBsb2coYXJncywgbWV0aG9kKXtcbiAgICBpZihnbG9iYWwubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3N3Yy5kZWJ1ZycpKSB7XG4gICAgICAgIFtdLmZvckVhY2guY2FsbChhcmdzLCBmdW5jdGlvbihhcmcpe1xuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGVbbWV0aG9kXSA/IGdsb2JhbC5jb25zb2xlW21ldGhvZF0oYXJnKSA6IGdsb2JhbC5jb25zb2xlLmxvZyhhcmcpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbn0iLCJ2YXIgX3RlbXBsYXRlID0gcmVxdWlyZSgnbG9kYXNoL3N0cmluZy90ZW1wbGF0ZScpO1xudmFyIF9mb3JFYWNoID0gcmVxdWlyZSgnbG9kYXNoL2NvbGxlY3Rpb24vZm9yRWFjaCcpO1xudmFyIF9hc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2gvb2JqZWN0L2Fzc2lnbicpO1xudmFyIF9tZXJnZSA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvbWVyZ2UnKTtcbnZhciBfaXNFcXVhbCA9IHJlcXVpcmUoJ2xvZGFzaC9sYW5nL2lzRXF1YWwnKTtcbnZhciBfdHJpbSA9IHJlcXVpcmUoJ2xvZGFzaC9zdHJpbmcvdHJpbScpO1xudmFyIF90aHJvdHRsZSA9IHJlcXVpcmUoJ2xvZGFzaC9mdW5jdGlvbi90aHJvdHRsZScpO1xudmFyIF9kZWJvdW5jZSA9IHJlcXVpcmUoJ2xvZGFzaC9mdW5jdGlvbi9kZWJvdW5jZScpO1xuXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcblx0dmFyIHRpbWVvdXQ7XG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdH07XG5cdFx0dmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fTtcbn1cblxuZnVuY3Rpb24gZmluZFBhcmVudChlbGVtLCBzZWxlY3Rvcikge1xuXG4gICAgdmFyIGZpcnN0Q2hhciA9IHNlbGVjdG9yLmNoYXJBdCgwKTtcblxuICAgIC8vIEdldCBjbG9zZXN0IG1hdGNoXG4gICAgZm9yICggOyBlbGVtICYmIGVsZW0gIT09IGRvY3VtZW50OyBlbGVtID0gZWxlbS5wYXJlbnROb2RlICkge1xuICAgICAgICBpZiAoIGZpcnN0Q2hhciA9PT0gJy4nICkge1xuICAgICAgICAgICAgaWYgKCBlbGVtLmNsYXNzTGlzdC5jb250YWlucyggc2VsZWN0b3Iuc3Vic3RyKDEpICkgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIGZpcnN0Q2hhciA9PT0gJyMnICkge1xuICAgICAgICAgICAgaWYgKCBlbGVtLmlkID09PSBzZWxlY3Rvci5zdWJzdHIoMSkgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIGZpcnN0Q2hhciA9PT0gJ1snICkge1xuICAgICAgICAgICAgaWYgKGVsZW0uaGFzQXR0cmlidXRlKCBzZWxlY3Rvci5zdWJzdHIoMSwgc2VsZWN0b3IubGVuZ3RoIC0gMikpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZihlbGVtLm5vZGVOYW1lID09PSBzZWxlY3Rvci50b1VwcGVyQ2FzZSgpKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcblxufVxuXG5mdW5jdGlvbiBwb2xsKGZuLCBjYWxsYmFjaywgZXJyYmFjaywgdGltZW91dCwgaW50ZXJ2YWwpIHtcbiAgICB2YXIgZW5kVGltZSA9IE51bWJlcihuZXcgRGF0ZSgpKSArICh0aW1lb3V0IHx8IDIwMDApO1xuICAgIGludGVydmFsID0gaW50ZXJ2YWwgfHwgMzAwO1xuXG4gICAgKGZ1bmN0aW9uIHAoKSB7XG4gICAgICAgIC8vIElmIHRoZSBjb25kaXRpb24gaXMgbWV0LCB3ZSdyZSBkb25lISBcbiAgICAgICAgaWYoZm4oKSkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiB0aGUgY29uZGl0aW9uIGlzbid0IG1ldCBidXQgdGhlIHRpbWVvdXQgaGFzbid0IGVsYXBzZWQsIGdvIGFnYWluXG4gICAgICAgIGVsc2UgaWYgKE51bWJlcihuZXcgRGF0ZSgpKSA8IGVuZFRpbWUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQocCwgaW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgICAgIC8vIERpZG4ndCBtYXRjaCBhbmQgdG9vIG11Y2ggdGltZSwgcmVqZWN0IVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVycmJhY2sobmV3IEVycm9yKCd0aW1lZCBvdXQgZm9yICcgKyBmbiArICc6ICcgKyBhcmd1bWVudHMpKTtcbiAgICAgICAgfVxuICAgIH0pKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR0ZW1wbGF0ZTogX3RlbXBsYXRlLFxuXHRmb3JFYWNoOiBfZm9yRWFjaCxcblx0YXNzaWduOiBfYXNzaWduLFxuXHRtZXJnZTogX21lcmdlLFxuXHRpc0VxdWFsOiBfaXNFcXVhbCxcblx0dHJpbTogX3RyaW0sXG5cdHRocm90dGxlOiBfdGhyb3R0bGUsXG5cdGRlYm91bmNlOiBkZWJvdW5jZSxcbiAgICBwb2xsOiBwb2xsLFxuXHRmaW5kUGFyZW50OiBmaW5kUGFyZW50XG59OyIsInZhciB3aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldC5qcycpO1xudmFyIGFwaSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHdpZGdldC5tb2R1bGU7XG4iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG52YXIgY2FjaGUgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHBvc3Q6IHBvc3QsXG5cdGdldDogZ2V0LFxuXHRwdXQ6IHB1dFxufTtcblxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEsIGNiKXtcblxuXHQvLyBkZWJ1Zy5sb2coJ3Bvc3QgcmVxdWVzdDogJywgdXJsLCBkYXRhKTtcblxuXHR2YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXG5cdFhtbEh0dHBSZXF1ZXN0KCdQT1NUJywgdXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGRlYnVnLmxvZygncG9zdCByZXNwb3NlOiAnLCBlcnIsIHJlcyk7XG5cblx0XHRpZihlcnIpIHJldHVybiBjYihlcnIpO1xuXG5cdFx0Y2IobnVsbCwgcmVzKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldChzZWxlY3RvciwgdXJsLCBjYil7XG5cblx0aWYoc2VsZWN0b3IgJiYgY2FjaGVbc2VsZWN0b3JdKSB7XG5cdFx0cmV0dXJuIGNiKG51bGwsIGNhY2hlW3NlbGVjdG9yXSk7XG5cdH1cblxuXHRYbWxIdHRwUmVxdWVzdCgnR0VUJywgdXJsLCBudWxsLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRpZihzZWxlY3RvcikgY2FjaGVbc2VsZWN0b3JdID0gcmVzO1xuXHRcdGNiKG51bGwsIHJlcyk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwdXQodXJsLCBkYXRhLCBjYil7XG5cblx0Ly8gZGVidWcubG9nKCdwb3N0IHJlcXVlc3Q6ICcsIHVybCwgZGF0YSk7XG5cblx0Ly8gdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcblxuXHRYbWxIdHRwUmVxdWVzdCgnUFVUJywgdXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGRlYnVnLmxvZygncHV0IHJlc3Bvc2U6ICcsIGVyciwgcmVzKTtcblxuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRjYihudWxsLCByZXMpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBTZW5kIHJlcXVlc3QgdG8gdGhlIHNlcnZlciB2aWEgWE1MSHR0cFJlcXVlc3RcbiAqL1xuZnVuY3Rpb24gWG1sSHR0cFJlcXVlc3QobWV0aG9kLCB1cmwsIGRhdGEsIGNhbGxiYWNrKXtcblx0dmFyIHhociwgcmVzcG9uc2UsIHJlcXVlc3RUaW1lcjtcblxuXHR4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuXG5cdHJlcXVlc3RUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHR4aHIuYWJvcnQoKTtcblx0fSwgNjAwMDApO1xuXHRcblx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh4aHIucmVhZHlTdGF0ZT09NCl7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxdWVzdFRpbWVyKTtcblx0XHRcdGlmKHhoci5yZXNwb25zZSkge1xuXHRcdFx0XHRyZXNwb25zZSA9IG1ldGhvZCA9PT0gJ1BPU1QnID8gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpIDogeGhyLnJlc3BvbnNlO1xuXHRcdFx0XHRpZihyZXNwb25zZS5lcnJvcikge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhyZXNwb25zZS5lcnJvcik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGlmKG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG5cdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04Jyk7XG5cdH1cblxuXHRpZihkYXRhKSB7XG5cdFx0eGhyLnNlbmQoZGF0YSk7XG5cdH0gZWxzZSB7XG5cdFx0eGhyLnNlbmQoKTtcblx0fVxufVxuIiwidmFyIHN0b3JhZ2UgPSBnbG9iYWwubG9jYWxTdG9yYWdlO1xudmFyIHNlc3Npb24gPSBnbG9iYWwuc2Vzc2lvblN0b3JhZ2U7XG52YXIgcHJlZml4ID0gJ3N3Yyc7XG52YXIgZGVsaW1pdGVyID0gJy4nO1xuXG4vLyBDdXJyZW50IGNhY2hlIG9iamVjdFxudmFyIGNhY2hlID0ge1xuXHRzaWQ6IG51bGwsXG5cdGV2ZW50VGltZXN0YW1wOiAwLFxuXHRtc2dUaW1lc3RhbXA6IDAsXG5cdGVudGl0eTogdW5kZWZpbmVkLFxuXHRjaGF0OiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0OiBnZXRJdGVtLFxuXHRzZXQ6IHNldEl0ZW0sXG5cdHJlbW92ZTogcmVtb3ZlSXRlbSxcblx0Z2V0U3RhdGU6IGdldFN0YXRlLFxuXHRzYXZlU3RhdGU6IHNhdmVTdGF0ZSxcblx0cmVtb3ZlU3RhdGU6IHJlbW92ZVN0YXRlXG59O1xuXG5mdW5jdGlvbiBnZXRJdGVtKGtleSwgbG9jYXRpb24pIHtcblx0aWYobG9jYXRpb24gPT09ICdzZXNzaW9uJykge1xuXHRcdHJldHVybiBKU09OLnBhcnNlKHNlc3Npb24uZ2V0SXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSkpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBKU09OLnBhcnNlKHN0b3JhZ2UuZ2V0SXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSkpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldEl0ZW0oa2V5LCB2YWx1ZSwgbG9jYXRpb24pIHtcblx0aWYobG9jYXRpb24gPT09ICdzZXNzaW9uJykge1xuXHRcdHNlc3Npb24uc2V0SXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSwgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcblx0fSBlbHNlIHtcblx0XHRzdG9yYWdlLnNldEl0ZW0ocHJlZml4K2RlbGltaXRlcitrZXksIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XG5cdH1cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVJdGVtKGtleSwgbG9jYXRpb24pIHtcblx0aWYobG9jYXRpb24gPT09ICdzZXNzaW9uJykge1xuXHRcdHNlc3Npb24ucmVtb3ZlSXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSk7XG5cdH0gZWxzZSB7XG5cdFx0c3RvcmFnZS5yZW1vdmVJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KTtcblx0fVxufVxuXG4vKipcbiAqIEdldCBzYXZlZCBwcm9wZXJ0eSBmcm9tIGxvY2FsU3RvcmFnZSBvciBmcm9tIHNlc3Npb24gY2FjaGVcbiAqIEBwYXJhbSAge1N0cmluZ30ga2V5ICAgICAgLSBpdGVtIGtleSBpbiBzdG9yYWdlIG1lbW9yeVxuICogQHBhcmFtICB7W3R5cGVdfSBsb2NhdGlvbiAtIGZyb20gd2hlcmUgdG8gcmV0cmlldmUgaXRlbS4gXG4gKiBDb3VsZCBiZSBlaXRoZXIgXCJzdG9yYWdlXCIgLSBmcm9tIGxvY2FsU3RvcmFnZSwgb3IgXCJjYWNoZVwiIC0gZnJvbSBzZXNzaW9uIGNhY2hlXG4gKiBAcmV0dXJuIHtTdHJpbmd8T2JqZWN0fEZ1bmN0aW9ufSAgICAgICAgICAtIGl0ZW0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gZ2V0U3RhdGUoa2V5LCBsb2NhdGlvbil7XG5cdGlmKCFsb2NhdGlvbikge1xuXHRcdHJldHVybiAoY2FjaGVba2V5XSAhPT0gdW5kZWZpbmVkICYmIGNhY2hlW2tleV0gIT09IG51bGwpID8gY2FjaGVba2V5XSA6IGdldEl0ZW0oa2V5KTtcblx0fSBlbHNlIGlmKGxvY2F0aW9uID09PSAnY2FjaGUnKSB7XG5cdFx0cmV0dXJuIGNhY2hlW2tleV07XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGdldEl0ZW0oa2V5LCBsb2NhdGlvbik7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2F2ZVN0YXRlKGtleSwgdmFsdWUsIGxvY2F0aW9uKXtcblx0Y2FjaGVba2V5XSA9IHZhbHVlO1xuXHRpZihsb2NhdGlvbiAhPT0gJ2NhY2hlJykge1xuXHRcdHNldEl0ZW0oa2V5LCB2YWx1ZSwgbG9jYXRpb24pO1xuXHR9XG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU3RhdGUoa2V5LCBsb2NhdGlvbikge1xuXHRkZWxldGUgY2FjaGVba2V5XTtcblx0cmVtb3ZlSXRlbShrZXkpO1xufVxuIiwidmFyIF8gPSB7fTtcbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7J1xufTtcbnZhciBlc2NhcGVSZWdleHAgPSBuZXcgUmVnRXhwKCdbJyArIE9iamVjdC5rZXlzKGVzY2FwZU1hcCkuam9pbignJykgKyAnXScsICdnJyk7XG5fLmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGlmICghc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoZXNjYXBlUmVnZXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZXNjYXBlTWFwW21hdGNoXTtcbiAgICB9KTtcbn07XG5leHBvcnRzWydlbWFpbCddPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5cbiB2YXIgcHJlZml4ID0gZGVmYXVsdHMucHJlZml4OyA7XG5fX3AgKz0gJ1xcbjwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBUcmFuc2l0aW9uYWwvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS10cmFuc2l0aW9uYWwuZHRkXCI+XFxuPGh0bWwgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI+XFxuICAgIDxoZWFkPlxcbiAgICAgICAgPG1ldGEgaHR0cC1lcXVpdj1cIkNvbnRlbnQtVHlwZVwiIGNvbnRlbnQ9XCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9d2luZG93cy0xMjUxXCIgLz5cXG4gICAgICAgIDwhLS1baWYgIW1zb10+PCEtLT5cXG4gICAgICAgICAgICA8bWV0YSBodHRwLWVxdWl2PVwiWC1VQS1Db21wYXRpYmxlXCIgY29udGVudD1cIklFPWVkZ2VcIiAvPlxcbiAgICAgICAgPCEtLTwhW2VuZGlmXS0tPlxcbiAgICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cXG4gICAgICAgIDx0aXRsZT48L3RpdGxlPlxcbiAgICAgICAgPCEtLVtpZiAoZ3RlIG1zbyA5KXwoSUUpXT5cXG4gICAgICAgIDxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj5cXG4gICAgICAgICAgICB0YWJsZSB7Ym9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTt9XFxuICAgICAgICA8L3N0eWxlPlxcbiAgICAgICAgPCFbZW5kaWZdLS0+XFxuICAgICAgICA8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+XFxuICAgICAgICAgICAgLyogQmFzaWNzICovXFxuICAgICAgICAgICAgYm9keSB7XFxuICAgICAgICAgICAgTWFyZ2luOiAwO1xcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xcbiAgICAgICAgICAgICAgICBtaW4td2lkdGg6IDEwMCU7XFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIHRhYmxlIHtcXG4gICAgICAgICAgICAgICAgYm9yZGVyLXNwYWNpbmc6IDA7XFxuICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xcbiAgICAgICAgICAgICAgICBjb2xvcjogIzMzMzMzMztcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgdGQge1xcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICBpbWcge1xcbiAgICAgICAgICAgICAgICBib3JkZXI6IDA7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC53cmFwcGVyIHtcXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgICAgICAgICAgIHRhYmxlLWxheW91dDogZml4ZWQ7XFxuICAgICAgICAgICAgICAgIC13ZWJraXQtdGV4dC1zaXplLWFkanVzdDogMTAwJTtcXG4gICAgICAgICAgICAgICAgLW1zLXRleHQtc2l6ZS1hZGp1c3Q6IDEwMCU7XFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGMUYxRjE7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC53ZWJraXQge1xcbiAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDUwMHB4O1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAub3V0ZXIge1xcbiAgICAgICAgICAgIE1hcmdpbjogMCBhdXRvO1xcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XFxuICAgICAgICAgICAgICAgIHdpZHRoOiA5NSU7XFxuICAgICAgICAgICAgICAgIG1heC13aWR0aDogNTAwcHg7XFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIHAge1xcbiAgICAgICAgICAgICAgICBNYXJnaW46IDA7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIGEge1xcbiAgICAgICAgICAgICAgICBjb2xvcjogI2VlNmE1NjtcXG4gICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5oMSB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjFweDtcXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICAgICAgICAgICAgICAgIE1hcmdpbi1ib3R0b206IDE4cHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5oMiB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICAgICAgICAgICAgICAgIE1hcmdpbi1ib3R0b206IDEycHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICBcXG4gICAgICAgICAgICAvKiBPbmUgY29sdW1uIGxheW91dCAqL1xcbiAgICAgICAgICAgIC5vbmUtY29sdW1uIC5jb250ZW50cyB7XFxuICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiM1MDUwNTA7XFxuICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OkFyaWFsO1xcbiAgICAgICAgICAgICAgICBmb250LXNpemU6MTRweDtcXG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6MTUwJTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLm9uZS1jb2x1bW4gcCB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcXG4gICAgICAgICAgICAgICAgTWFyZ2luLWJvdHRvbTogMTBweDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2Uge1xcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcXG4gICAgICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcXG4gICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcXG4gICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogNHB4IHNvbGlkICNDQ0NDQ0M7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlIGltZyB7XFxuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDUwMHB4O1xcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGF1dG87XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlIHNwYW4ge1xcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcXG4gICAgICAgICAgICAgICAgY29sb3I6ICM5OTk5OTk7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1hZ2VudC1tc2cgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbSB7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjNTU1NTU1O1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAuJyArXG5fX2UoIHByZWZpeCApICtcbictdXNlci1tc2cgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbSB7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjRjc1QjVEO1xcbiAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZSAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZS10aW1lIHtcXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgICAgICAgICAgICAgICBmbG9hdDogcmlnaHQ7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5jb3B5cmlnaHQge1xcbiAgICAgICAgICAgICAgICBtYXJnaW4tdG9wOiA1cHg7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcXG4gICAgICAgICAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xcbiAgICAgICAgICAgICAgICBjb2xvcjogI0NDQ0NDQztcXG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XFxuICAgICAgICAgICAgfVxcblxcbiAgICAgICAgPC9zdHlsZT5cXG4gICAgPC9oZWFkPlxcbiAgICA8Ym9keT5cXG4gICAgICAgIDxjZW50ZXIgY2xhc3M9XCJ3cmFwcGVyXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlYmtpdFwiPlxcbiAgICAgICAgICAgICAgICA8IS0tW2lmIChndGUgbXNvIDkpfChJRSldPlxcbiAgICAgICAgICAgICAgICA8dGFibGUgd2lkdGg9XCI1MDBcIiBhbGlnbj1cImNlbnRlclwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIGJvcmRlcj1cIjBcIj5cXG4gICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICA8dGQ+XFxuICAgICAgICAgICAgICAgIDwhW2VuZGlmXS0tPlxcbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJvdXRlclwiIGFsaWduPVwiY2VudGVyXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm9uZS1jb2x1bW5cIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIHdpZHRoPVwiMTAwJVwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImlubmVyIGNvbnRlbnRzXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgK1xuKChfX3QgPSAoIGNvbnRlbnQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgIDwhLS1baWYgKGd0ZSBtc28gOSl8KElFKV0+XFxuICAgICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgIDwhW2VuZGlmXS0tPlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgPC9jZW50ZXI+XFxuICAgIDwvYm9keT5cXG48L2h0bWw+JztcblxufVxucmV0dXJuIF9fcFxufVxudmFyIF8gPSB7fTtcbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7J1xufTtcbnZhciBlc2NhcGVSZWdleHAgPSBuZXcgUmVnRXhwKCdbJyArIE9iamVjdC5rZXlzKGVzY2FwZU1hcCkuam9pbignJykgKyAnXScsICdnJyk7XG5fLmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGlmICghc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoZXNjYXBlUmVnZXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZXNjYXBlTWFwW21hdGNoXTtcbiAgICB9KTtcbn07XG5leHBvcnRzWydmb3JtcyddPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5fX3AgKz0gJzxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLScgK1xuX19lKCBtZXNzYWdlLmVudGl0eSApICtcbictbXNnXCI+XFxuXFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLWZyb21cIj4nICtcbl9fZSggbWVzc2FnZS5mcm9tICkgK1xuJzwvc3Bhbj5cXG5cXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS1jb250ZW50XCIgJztcbiBpZihtZXNzYWdlLmVudGl0eSA9PT0gXCJ1c2VyXCIpIHsgO1xuX19wICs9ICcgc3R5bGU9XCJib3JkZXItY29sb3I6XFwnJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbidcIiAnO1xuIH0gO1xuX19wICs9ICc+XFxuXFx0XFx0JztcbiBpZihmb3JtLmRlc2NyaXB0aW9uKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0PHA+JyArXG4oKF9fdCA9ICggZnJhc2VzLkZPUk1TLkRFU0NSSVBUSU9OU1tmb3JtLmRlc2NyaXB0aW9uXSB8fCBmb3JtLmRlc2NyaXB0aW9uICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvcD5cXG5cXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHQ8Zm9ybSBuYW1lPVwiJyArXG5fX2UoIGZvcm0ubmFtZSApICtcbidcIiAnO1xuIGlmKGZvcm0uYXV0b2NvbXBsZXRlKXsgO1xuX19wICs9ICdhdXRvY29tcGxldGU9XCJvblwiJztcbiB9IDtcbl9fcCArPSAnIGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChmb3JtLmZpZWxkcywgZnVuY3Rpb24oaXRlbSl7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLnR5cGUgIT09ICdzZWxlY3QnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCInICtcbigoX190ID0gKCBpdGVtLnR5cGUgfHwgJ3RleHQnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0cGxhY2Vob2xkZXI9XCInICtcbigoX190ID0gKCBmcmFzZXMuRk9STVMuUExBQ0VIT0xERVJTW2l0ZW0ucGxhY2Vob2xkZXJdIHx8IGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbaXRlbS5uYW1lXSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgJztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcqJztcbiB9IDtcbl9fcCArPSAnXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIiAnO1xuIGlmKGl0ZW0udmFsdWUpeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdHZhbHVlPVwiJyArXG5fX2UoIGNyZWRlbnRpYWxzW2l0ZW0udmFsdWVdICkgK1xuJ1wiICc7XG4gfSA7XG5fX3AgKz0gJyAnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJ3JlcXVpcmVkJztcbiB9IDtcbl9fcCArPSAnPlxcblxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS50eXBlID09PSAnc2VsZWN0JykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDxzZWxlY3QgbmFtZT1cIicgK1xuX19lKCBpdGVtLm5hbWUgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JztcbiBfLmZvckVhY2goaXRlbS5vcHRpb25zLCBmdW5jdGlvbihvcHRpb24pIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiJyArXG5fX2UoIG9wdGlvbi52YWx1ZSApICtcbidcIiAnO1xuIGlmKG9wdGlvbi5zZWxlY3RlZCkgeyA7XG5fX3AgKz0gJyBzZWxlY3RlZCAnO1xuIH0gO1xuX19wICs9ICcgPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBmcmFzZXMuRk9STVMuUExBQ0VIT0xERVJTW29wdGlvbi50ZXh0XSB8fCBvcHRpb24udGV4dCApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDwvc2VsZWN0PlxcblxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdCc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHR0eXBlPVwic3VibWl0XCJcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiXFxuXFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nO1wiPicgK1xuX19lKCBmcmFzZXMuRk9STVMuc2VuZCApICtcbic8L2J1dHRvbj5cXG5cXHRcXHRcXHQ8YnV0dG9uXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIlxcblxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cInJlamVjdEZvcm1cIj4nICtcbl9fZSggZnJhc2VzLkZPUk1TLmNhbmNlbCApICtcbic8L2J1dHRvbj5cXG5cXHRcXHQ8L2Zvcm0+XFxuXFx0PC9kaXY+XFxuXFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLXRpbWVcIj4gJyArXG5fX2UoIG1lc3NhZ2UudGltZSApICtcbic8L3NwYW4+XFxuPC9kaXY+JztcblxufVxucmV0dXJuIF9fcFxufVxudmFyIF8gPSB7fTtcbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7J1xufTtcbnZhciBlc2NhcGVSZWdleHAgPSBuZXcgUmVnRXhwKCdbJyArIE9iamVjdC5rZXlzKGVzY2FwZU1hcCkuam9pbignJykgKyAnXScsICdnJyk7XG5fLmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGlmICghc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoZXNjYXBlUmVnZXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZXNjYXBlTWFwW21hdGNoXTtcbiAgICB9KTtcbn07XG5leHBvcnRzWydtZXNzYWdlJ109IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGUsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XG53aXRoIChvYmopIHtcbl9fcCArPSAnPGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictJyArXG5fX2UoIG1lc3NhZ2UuZW50aXR5ICkgK1xuJy1tc2dcIj5cXG5cXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbVwiPicgK1xuX19lKCBtZXNzYWdlLmZyb20gKSArXG4nPC9zcGFuPlxcblxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLWNvbnRlbnRcIiBcXG5cXHRcXHQnO1xuIGlmKG1lc3NhZ2UuZW50aXR5ID09PSBcInVzZXJcIikgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRzdHlsZT1cImJvcmRlci1jb2xvcjonO1xuIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciA7XG5fX3AgKz0gJ1wiIFxcblxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXHRcXHQ8cD4nICtcbigoX190ID0gKCBtZXNzYWdlLmNvbnRlbnQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9wPlxcblxcdDwvZGl2PlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS10aW1lXCI+ICcgK1xuX19lKCBtZXNzYWdlLnRpbWUgKSArXG4nPC9zcGFuPlxcbjwvZGl2Pic7XG5cbn1cbnJldHVybiBfX3Bcbn1cbnZhciBfID0ge307XG52YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjeDI3Oydcbn07XG52YXIgZXNjYXBlUmVnZXhwID0gbmV3IFJlZ0V4cCgnWycgKyBPYmplY3Qua2V5cyhlc2NhcGVNYXApLmpvaW4oJycpICsgJ10nLCAnZycpO1xuXy5lc2NhcGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBpZiAoIXN0cmluZykgcmV0dXJuICcnO1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKGVzY2FwZVJlZ2V4cCwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZU1hcFttYXRjaF07XG4gICAgfSk7XG59O1xuZXhwb3J0c1snd2lkZ2V0J109IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGUsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XG53aXRoIChvYmopIHtcblxuIHZhciBmcmFzZXMgPSB0cmFuc2xhdGlvbnNbY3VyckxhbmddOyA7XG5fX3AgKz0gJ1xcbic7XG4gdmFyIHBhbmVscyA9IGZyYXNlcy5QQU5FTFM7IDtcbl9fcCArPSAnXFxuJztcbiB2YXIgY2hhbm5lbHMgPSBkZWZhdWx0cy5jaGFubmVsczsgO1xuX19wICs9ICdcXG4nO1xuIHZhciBwb3NpdGlvbkNsYXNzID0gZGVmYXVsdHMucG9zaXRpb24gPT09ICdyaWdodCcgPyAncG9zaXRpb24tcmlnaHQnIDogJ3Bvc2l0aW9uLWxlZnQnIDtcbl9fcCArPSAnXFxuPGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLWNvbnRcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLWNvbnQgJyArXG5fX2UoIHBvc2l0aW9uQ2xhc3MgKSArXG4nXCI+XFxuXFxuXFx0PCEtLSAqKioqKiBQYW5lcyBjb250YWluZXIgKioqKiogLS0+XFxuXFx0PGRpdiBcXG5cXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVzXCIgXFxuXFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lc1wiIFxcblxcdFxcdHN0eWxlPVwiJztcbiBpZihkZWZhdWx0cy5zdHlsZXMud2lkdGgpIHsgO1xuX19wICs9ICd3aWR0aDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy53aWR0aCApICtcbic7JztcbiB9IDtcbl9fcCArPSAnXCI+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBUb3AgYmFyICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10b3AtYmFyXCIgXFxuXFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0PCEtLSBNYWluIHRpdGxlIC0tPlxcblxcdFxcdFxcdDxoNCBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXRpdGxlICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVwcGVyY2FzZVwiPlxcblxcdFxcdFxcdFxcdCcgK1xuX19lKCBkZWZhdWx0cy50aXRsZSB8fCBmcmFzZXMuVE9QX0JBUi50aXRsZSApICtcbidcXG5cXHRcXHRcXHQ8L2g0PlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1zdGF0ZS1jb250XCI+XFxuXFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1zdGF0ZS1pY29uXCI+IDwvc3Bhbj5cXG5cXHRcXHRcXHRcXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXN0YXRlXCI+PC9zcGFuPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwhLS0gQWN0aW9uIGJ1dHRvbnMgKG1pbmltaXplLCBjbG9zZSkgLS0+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLW1pbmltaXplXCI+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLTxhIFxcblxcdFxcdFxcdFxcdFxcdGhyZWY9XCIjXCIgXFxuXFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHQ8c3BhbiBzdHlsZT1cImZvbnQtd2VpZ2h0OiBib2xkXCI+Xzwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8L2E+LS0+XFxuXFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0PGEgXFxuXFx0XFx0XFx0XFx0XFx0aHJlZj1cIiNcIiBcXG5cXHRcXHRcXHRcXHRcXHRzdHlsZT1cImNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nXCJcXG5cXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJjbG9zZVdpZGdldFwiXFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1pY29uLXJlbW92ZVwiPjwvc3Bhbj5cXG5cXG5cXHRcXHRcXHRcXHQ8L2E+XFxuXFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBUb3AgYmFyIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBDb25uZWN0aW9uIHR5cGVzIHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBcXG5cXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjaG9vc2VDb25uZWN0aW9uXCI+XFxuXFx0XFx0XFx0XFxuXFx0XFx0XFx0PCEtLSBQYW5lbFxcJ3MgaW1hZ2UgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWhlYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1kYXJrXCIgXFxuXFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy5zdHlsZXMuaW50cm8uYmFja2dyb3VuZEltYWdlKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgK1xuX19lKCBkZWZhdWx0cy5jbGllbnRQYXRoICkgK1xuJycgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMuaW50cm8uYmFja2dyb3VuZEltYWdlICkgK1xuJylcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICc+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBUaGUgdGV4dCBkaXNwbGF5ZWQgb24gaW1hZ2UgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJhY2tkcm9wLWNvbnQgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2hpdGVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8YnI+XFxuXFx0XFx0XFx0XFx0XFx0PHA+JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNob29zZV9jb25uX3R5cGUgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXG5cXHRcXHRcXHRcXHQ8Zm9ybSBcXG5cXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWluaXQtZm9ybVwiIFxcblxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJ0luaXRGb3JtXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0JztcbiBpZihjaGFubmVscy53ZWJydGMpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0XFx0PCEtLSBEaXNwbGF5IGNhbGwgYnV0dG9uIGlmIFdlYlJUQyBpcyBlbmFibGVkIGFuZCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIgLS0+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy53ZWJydGNFbmFibGVkKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImJ1dHRvblwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJpbml0Q2FsbFwiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jYWxsX2FnZW50X2J0biApICtcbidcXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8IS0tIElmIFdlYlJUQyBpcyBub3Qgc3VwcG9ydGVkIGFuZCBmYWxsYmFjayBpcyBzZXQgLS0+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9IGVsc2UgaWYoY2hhbm5lbHMud2VicnRjLmZhbGxiYWNrICYmIGNoYW5uZWxzLndlYnJ0Yy5mYWxsYmFjay5zaXBDYWxsKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRGYWxsYmFja0NhbGxcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2FsbF9hZ2VudF9idG4gKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBEaXNwbGF5IGNhbGxiYWNrIGJ1dHRvbiBpZiBjYWxsYmFjayB0YXNrIGlzIGNvbmZpZ3VyZWQgaW4gdGhlIHNldHRpbmdzIC0tPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoY2hhbm5lbHMuY2FsbGJhY2sgJiYgY2hhbm5lbHMuY2FsbGJhY2sudGFzaykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImJ1dHRvblwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJpbml0Q2FsbGJhY2tcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2FsbGJhY2tfYnRuICkgK1xuJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gSW5pdCBjaGF0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLmNoYXQpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImJ1dHRvblwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJpbml0Q2hhdFwiPlxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jaGF0X2FnZW50X2J0biApICtcbidcXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIENsb3NlIHdpZGdldCBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCI+JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNhbmNlbCApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQ29ubmVjdGlvbiB0eXBlcyBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBJbnRybyBwYW5lLiBEaXNwbGF5ZWQgaWYgY29uZmlndXJlZCBpbiB0aGUgc2V0dGluZ3Mgb2JqZWN0LiAqKioqKiAtLT5cXG5cXHRcXHQnO1xuIGlmKGRlZmF1bHRzLmludHJvLmxlbmd0aCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgXFxuXFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY3JlZGVudGlhbHNcIj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFBhbmVsXFwncyBpbWFnZSBjb250YWluZXIgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtaGVhZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWRhcmtcIiBcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArXG5fX2UoIGRlZmF1bHRzLmNsaWVudFBhdGggKSArXG4nJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UgKSArXG4nKVwiIFxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIFRoZSB0ZXh0IGRpc3BsYXllZCBvbiBpbWFnZSAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmFja2Ryb3AtY29udCAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13aGl0ZVwiPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxicj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8cD4nICtcbl9fZSggcGFuZWxzLklOVFJPLmludHJvX21lc3NhZ2UgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8Zm9ybSBcXG5cXHRcXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWludHJvLWZvcm1cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbidJbnRyb0Zvcm1cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLXZhbGlkYXRlLWZvcm09XCJ0cnVlXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0PCEtLSBJdGVyYXRpbmcgb3ZlciBpbnRybyBhcnJheSwgd2hpY2ggaXMgYSBsaXN0IG9mIGZpZWxkcyBhbmQgdGhlaXIgcHJvcGVydGllcyAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChkZWZhdWx0cy5pbnRybywgZnVuY3Rpb24oaXRlbSl7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLm5hbWUgIT09ICdsYW5nJykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDxpbnB1dCBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiJyArXG4oKF9fdCA9ICggaXRlbS50eXBlIHx8ICd0ZXh0JyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRwbGFjZWhvbGRlcj1cIicgK1xuKChfX3QgPSAoIGl0ZW0ucGxhY2Vob2xkZXIgfHwgcGFuZWxzLklOVFJPLlBMQUNFSE9MREVSU1tpdGVtLm5hbWVdICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyAnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJyAqICc7XG4gfSA7XG5fX3AgKz0gJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggaXRlbS5uYW1lICkgK1xuJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS5zYXZlKXsgO1xuX19wICs9ICcgdmFsdWU9XCInICtcbl9fZSggY3JlZGVudGlhbHNbaXRlbS5uYW1lXSApICtcbidcIiAnO1xuIH0gO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcgcmVxdWlyZWQgJztcbiB9IDtcbl9fcCArPSAnPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS5uYW1lID09PSAnbGFuZycpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8c2VsZWN0IG5hbWU9XCJsYW5nXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBfLmZvckVhY2gobGFuZ3VhZ2VzLCBmdW5jdGlvbihsYW5nKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR2YWx1ZT1cIicgK1xuX19lKCBsYW5nICkgK1xuJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYobGFuZyA9PT0gY3VyckxhbmcpIHsgO1xuX19wICs9ICcgc2VsZWN0ZWQgJztcbiB9IDtcbl9fcCArPSAnID5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggdHJhbnNsYXRpb25zW2xhbmddLmxhbmcgKSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9KTsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L3NlbGVjdD5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdDwhLS0gSW5pdCBjaGF0IHdpdGggaW50cm8gcHJvcGVydGllcyAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJzdWJtaXRcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuSU5UUk8uc3RhcnRfZGlhbG9nX2J1dHRvbiApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8IS0tIENsb3NlIHdpZGdldCBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCI+JyArXG5fX2UoIHBhbmVscy5JTlRSTy5jYW5jZWwgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHQ8IS0tICoqKioqIEludHJvIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIE1lc3NhZ2VzIHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiAgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwibWVzc2FnZXNcIj5cXG5cXHRcXHRcXHRcXG5cXHRcXHRcXHQ8IS0tIE1lc3NhZ2VzIGNvbnRhaW5lciAtLT5cXG5cXHRcXHRcXHQ8dWwgXFxuXFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlcy1jb250XCIgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlcy1jb250XCIgXFxuXFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy5oZWlnaHQpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRoZWlnaHQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMuaGVpZ2h0ICkgK1xuJztcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHQ8L3VsPlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13cml0ZS1jb250XCI+XFxuXFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0PCEtLSBFbmQgZGlhbG9nIGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZW5kLWRpYWxvZy1idG5cIj5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImZpbmlzaFwiPicgK1xuX19lKCBwYW5lbHMuTUVTU0FHRVMuZW5kX2RpYWxvZyApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBcIkFnZW50IGlzIHR5cGluZ1wiIGluZGljYXRvciAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbG9hZGVyXCI+XFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBcIkF0dGFjaCBmaWxlXCIgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdDxsYWJlbCBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmRmaWxlLWNvbnRcIiBcXG5cXHRcXHRcXHRcXHRcXHRmb3I9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1maWxlLXNlbGVjdFwiPlxcblxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCBcXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiZmlsZVwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZmlsZS1zZWxlY3RcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHQ8c3BhbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWljb24tdXBsb2FkXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8c3Bhbj5cXG5cXG5cXHRcXHRcXHRcXHQ8L2xhYmVsPlxcblxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLXRleHQtY2xvbmVcIiAgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tc2ctdGV4dGFyZWEtY2xvbmVcIiA+PC9kaXY+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBGaWVsZCBmb3IgdHlwaW5nIHRoZSB1c2VyIG1lc3NhZ2UgLS0+XFxuXFx0XFx0XFx0XFx0PHRleHRhcmVhIFxcblxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS10ZXh0XCIgXFxuXFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tc2ctdGV4dGFyZWFcIiBcXG5cXHRcXHRcXHRcXHRcXHRwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuTUVTU0FHRVMuUExBQ0VIT0xERVJTLm1lc3NhZ2UgKSArXG4nXCIgXFxuXFx0XFx0XFx0XFx0XFx0bWF4bGVuZ3RoPVwiMTAwMFwiPjwvdGV4dGFyZWE+XFxuXFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0PCEtLSBcIlNlbmQgYSBtZXNzYWdlXCIgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdDxhIFxcblxcdFxcdFxcdFxcdFxcdGhyZWY9XCIjXCIgXFxuXFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zZW5kbXNnLWJ0biAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b25cIiBcXG5cXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJzZW5kTWVzc2FnZVwiPlxcblxcblxcdFxcdFxcdFxcdFxcdDxzcGFuIFxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaWNvbi1wYXBlci1wbGFuZVwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0PC9zcGFuPlxcblxcdFxcdFxcdFxcdDwvYT5cXG5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIE1lc3NhZ2VzIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIE9mZmxpbmUgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIFxcblxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cInNlbmRlbWFpbFwiPlxcblxcblxcdFxcdFxcdDwhLS0gUGFuZWxcXCdzIGltYWdlIGNvbnRhaW5lciAtLT5cXG5cXHRcXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1oZWFkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZGFya1wiIFxcblxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLnNlbmRtYWlsLmJhY2tncm91bmRJbWFnZSkgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgnICtcbl9fZSggZGVmYXVsdHMuY2xpZW50UGF0aCApICtcbicnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnNlbmRtYWlsLmJhY2tncm91bmRJbWFnZSApICtcbicpXCIgXFxuXFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnPlxcblxcblxcdFxcdFxcdFxcdDwhLS0gVGhlIHRleHQgZGlzcGxheWVkIG9uIGltYWdlIC0tPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1iYWNrZHJvcC1jb250ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWRhcmtcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8cD4nICtcbl9fZSggcGFuZWxzLk9GRkxJTkUub2ZmbGluZV9tZXNzYWdlICkgK1xuJzwvcD5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1ib2R5XCI+XFxuXFx0XFx0XFx0XFx0PGg0IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdXBwZXJjYXNlXCI+JyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLnNlbmRfbWVzc2FnZV9oZWFkZXIgKSArXG4nPC9oND5cXG5cXHRcXHRcXHRcXHQ8Zm9ybSBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmRtYWlsLWZvcm1cIiBkYXRhLXZhbGlkYXRlLWZvcm09XCJ0cnVlXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInVuYW1lXCIgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuUExBQ0VIT0xERVJTLnVuYW1lICkgK1xuJ1wiPlxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwiZW1haWxcIiBuYW1lPVwiZW1haWxcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5QTEFDRUhPTERFUlMuZW1haWwgKSArXG4nICpcIiByZXF1aXJlZD5cXG5cXHRcXHRcXHRcXHRcXHQ8dGV4dGFyZWEgbmFtZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5QTEFDRUhPTERFUlMubWVzc2FnZSApICtcbidcIiBtYXhsZW5ndGg9XCIxNTAwXCI+PC90ZXh0YXJlYT5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiZmlsZVwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY29udGFjdGZpbGVcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWlucHV0ZmlsZVwiIC8+XFxuXFx0XFx0XFx0XFx0XFx0PGxhYmVsIGZvcj1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNvbnRhY3RmaWxlXCI+JyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLmNob29zZV9maWxlICkgK1xuJzwvbGFiZWw+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBcIlNlbmQgb2ZmbGluZSBtZXNzYWdlXCIgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLnNlbmRfbWVzc2FnZV9idXR0b24gKSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBDbG9zZSB3aWRnZXQgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJjbG9zZVdpZGdldFwiPicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5jbG9zZSApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogT2ZmbGluZSBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBDbG9zZSBjaGF0IHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBcXG5cXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjbG9zZWNoYXRcIj5cXG5cXG5cXHRcXHRcXHQ8IS0tIFBhbmVsXFwncyBpbWFnZSBjb250YWluZXIgLS0+XFxuXFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtaGVhZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdoaXRlXCIgXFxuXFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy5zdHlsZXMuY2xvc2VDaGF0LmJhY2tncm91bmRJbWFnZSkgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgnICtcbl9fZSggZGVmYXVsdHMuY2xpZW50UGF0aCApICtcbicnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLmNsb3NlQ2hhdC5iYWNrZ3JvdW5kSW1hZ2UgKSArXG4nKVwiIFxcblxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFRoZSB0ZXh0IGRpc3BsYXllZCBvbiBpbWFnZSAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmFja2Ryb3AtY29udCAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13aGl0ZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxicj5cXG5cXHRcXHRcXHRcXHRcXHQ8cD4nICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuY2xvc2VfY2hhdF9oZWFkZXIgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8Zm9ybSBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNsb3NlY2hhdC1mb3JtXCIgZGF0YS12YWxpZGF0ZS1mb3JtPVwidHJ1ZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxsYWJlbCBmb3I9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zZW5kLWRpYWxvZ1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwic2VuZERpYWxvZ1wiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2VuZC1kaWFsb2dcIiAvPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPicgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5zZW5kX2RpYWxvZ19sYWJlbCApICtcbic8L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PC9sYWJlbD5cXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgdHlwZT1cImVtYWlsXCIgbmFtZT1cImVtYWlsXCIgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuUExBQ0VIT0xERVJTLmVtYWlsICkgK1xuJ1wiPlxcblxcdFxcdFxcdFxcdFxcdDxzZWxlY3QgbmFtZT1cInJhdGluZ1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCJcIj4tLS0gJyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULnJhdGVfYWdlbnQgKSArXG4nIC0tLTwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCI1XCI+JyArXG5fX2UoIGZyYXNlcy5BR0VOVF9SQVRFUy5leGNlbGxlbnQgKSArXG4nPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIjRcIj4nICtcbl9fZSggZnJhc2VzLkFHRU5UX1JBVEVTLmdvb2QgKSArXG4nPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIjNcIj4nICtcbl9fZSggZnJhc2VzLkFHRU5UX1JBVEVTLmZhaXIgKSArXG4nPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIjJcIj4nICtcbl9fZSggZnJhc2VzLkFHRU5UX1JBVEVTLmJhZCApICtcbic8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHQ8L3NlbGVjdD5cXG5cXHRcXHRcXHRcXHRcXHQ8dGV4dGFyZWEgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuUExBQ0VIT0xERVJTLmNvbW1lbnQgKSArXG4nXCIgbmFtZT1cInRleHRcIiBtYXhsZW5ndGg9XCIxNTAwXCI+PC90ZXh0YXJlYT5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIEVuZCBjaGF0IGFuZCBjbG9zZSB3aWRnZXQgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULmZpbmlzaF9kaWFsb2dfYnV0dG9uICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gXCJCYWNrIHRvIHRoZSBjaGF0XCIgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjbWVzc2FnZXNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiPicgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5iYWNrICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBDbG9zZSBjaGF0IHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIEF1ZGlvIGNhbGwgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNhbGxBZ2VudFwiPlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbC1zcGlubmVyXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zcGlubmVyLXBhbmVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPicgK1xuX19lKCBwYW5lbHMuQVVESU9fQ0FMTC5jb25maXJtX2FjY2VzcyApICtcbic8L2gzPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWxvYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zaG93blwiIHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlO1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdDwvaDM+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0XFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGwtaW5mb1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGlkZGVuXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGwtc3RhdGVcIj4nICtcbl9fZSggcGFuZWxzLkFVRElPX0NBTEwuY2FsbGluZ19hZ2VudCApICtcbic8L2gzPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCIgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsLXRpbWVyXCI+MDA6MDA8L2gzPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbC1jb250cm9sXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcdFxcdFxcdFxcdFxcdDxidXR0b25cXG5cXHRcXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRyeWFnYWluLWJ0blwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImJ1dHRvblwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2sgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGlkZGVuXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgYm9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDYWxsXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5BVURJT19DQUxMLnRyeV9hZ2FpbiApICtcbidcXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXHRcXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJidXR0b25cIlxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi13YXJuICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJlbmRDYWxsXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5BVURJT19DQUxMLmVuZF9jYWxsICkgK1xuJ1xcblxcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIEF1ZGlvIGNhbGwgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogQXVkaW8gY2FsbCBmYWxsYmFjayBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY2FsbEFnZW50RmFsbGJhY2tcIj5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1ib2R5XCI+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGgzPicgK1xuX19lKCBwYW5lbHMuQVVESU9fQ0FMTF9GQUxMQkFDSy5ET1dOTE9BRF9NU0cgKSArXG4nPC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQ8YnI+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy53ZWJydGMgJiYgZGVmYXVsdHMud2VicnRjLmZhbGxiYWNrKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIicgK1xuX19lKCBkZWZhdWx0cy53ZWJydGMuZmFsbGJhY2suc2lwQ2FsbCApICtcbidcIj5jYWxsLmpubHA8L2E+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0XFx0PGZvcm0+XFxuXFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjY2hvb3NlQ29ubmVjdGlvblwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5iYWNrICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBBdWRpbyBjYWxsIGZhbGxiYWNrIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENhbGxiYWNrIHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBcXG5cXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjYWxsYmFja1wiPlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbGJhY2stc3Bpbm5lclwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGlkZGVuICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNwaW5uZXItcGFuZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5zZW5kaW5nX3JlcXVlc3QgKSArXG4nPC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sb2FkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2hvd25cIiBzdHlsZT1cInBvc2l0aW9uOiByZWxhdGl2ZTtcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHQ8L2gzPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbGJhY2stc2V0dGluZ3NcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8cCBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy50aXRsZSApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcdFxcdFxcdFxcdFxcdDxsYWJlbD4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLkxBQkVMUy5waG9uZSApICtcbic8L2xhYmVsPlxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwidGVsXCIgbmFtZT1cInBob25lXCIgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLlBMQUNFSE9MREVSUy5waG9uZSApICtcbidcIiByZXF1aXJlZD5cXG5cXHRcXHRcXHRcXHRcXHQ8bGFiZWw+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5MQUJFTFMudGltZSApICtcbic8L2xhYmVsPlxcblxcdFxcdFxcdFxcdFxcdDxzZWxlY3QgbmFtZT1cInRpbWVcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChwYW5lbHMuQ0FMTEJBQ0suVElNRV9QT0lOVFMsIGZ1bmN0aW9uKHBvaW50KSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiB2YWx1ZT1cIicgK1xuX19lKCBwb2ludC5taW51dGVzICkgK1xuJ1wiPicgK1xuX19lKCBwb2ludC5sYWJlbCApICtcbic8L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDwvc2VsZWN0PlxcblxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIlxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwic2V0Q2FsbGJhY2tcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmNvbmZpcm1fY2FsbGJhY2sgKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNjaG9vc2VDb25uZWN0aW9uXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmJhY2sgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIENhbGxiYWNrIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENhbGxiYWNrIHNlbnQgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNhbGxiYWNrU2VudFwiPlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbGJhY2stc2VudFwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWljb24tY2hlY2sgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1zdWNjZXNzXCI+PC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQ8cCBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5yZXF1ZXN0X3NlbnQgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdFxcdDxmb3JtPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI2Nob29zZUNvbm5lY3Rpb25cIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suYmFjayApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5jbG9zZSApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQ2FsbGJhY2sgc2VudCBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0PC9kaXY+XFxuXFx0PCEtLSAqKioqKiBQYW5lcyBjb250YWluZXIgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHQ8IS0tICoqKioqIEZsb2F0aW5nIGJ1dHRvbiBjb250YWluZXIgKioqKiogLS0+XFxuXFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ0bi1jb250XCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idG4tY29udFwiPlxcblxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1idG5cIj5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZy1jb250XCI+XFxuXFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy11bm5vdGlmeS1idG5cIiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVubm90aWZ5LWJ0blwiPicgK1xuX19lKCBmcmFzZXMuRkxPQVRJTkdfQlVUVE9OLmNsb3NlICkgK1xuJzwvc3Bhbj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZ1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZ1wiPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcdFxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDxhIGhyZWY9XCIjXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idG4tbGlua1wiPlxcblxcdFxcdFxcdFxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnRuLWljb25cIj48L3NwYW4+XFxuXFx0XFx0XFx0PC9hPlxcblxcdFxcdDwvZGl2PlxcblxcdDwvZGl2PlxcblxcdDwhLS0gKioqKiogRmxvYXRpbmcgYnV0dG9uIGNvbnRhaW5lciBlbmRzICoqKioqIC0tPlxcblxcbjwvZGl2Pic7XG5cbn1cbnJldHVybiBfX3Bcbn0iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG52YXIgZXZlbnRzID0ge30sXG4vLyBKc1NJUCA9IHJlcXVpcmUoJy4vanNzaXAubWluLmpzJyksXG5Kc1NJUCA9IGdsb2JhbC5Kc1NJUCxcbm9wdGlvbnMsXG5zaXBDbGllbnQsXG5zaXBTZXNzaW9uLFxuc2lwQ2FsbEV2ZW50cztcblxuZnVuY3Rpb24gaXNXZWJydGNTdXBwb3J0ZWQoKXtcblx0dmFyIFJUQyA9IHdpbmRvdy5SVENQZWVyQ29ubmVjdGlvbiB8fCB3aW5kb3cubW96UlRDUGVlckNvbm5lY3Rpb24gfHwgd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uLFxuXHRcdHVzZXJNZWlkYSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSxcblx0XHRpY2UgPSB3aW5kb3cubW96UlRDSWNlQ2FuZGlkYXRlIHx8IHdpbmRvdy5SVENJY2VDYW5kaWRhdGU7XG5cblx0cmV0dXJuICEhUlRDICYmICEhdXNlck1laWRhICYmICEhaWNlO1xufVxuXG5mdW5jdGlvbiBpbml0SnNTSVBFdmVudHMoKXtcblx0c2lwQ2xpZW50Lm9uKCdjb25uZWN0ZWQnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgY29ubmVjdGVkIGV2ZW50OiAnLCBlKTsgfSk7XG5cdHNpcENsaWVudC5vbignZGlzY29ubmVjdGVkJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIGRpc2Nvbm5lY3RlZCBldmVudDogJywgZSk7IH0pO1xuXHRzaXBDbGllbnQub24oJ25ld01lc3NhZ2UnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgbmV3TWVzc2FnZSBldmVudDogJywgZSk7IH0pO1xuXHRzaXBDbGllbnQub24oJ25ld1JUQ1Nlc3Npb24nLCBmdW5jdGlvbihlKXtcblx0XHRkZWJ1Zy5sb2coJ3NpcCBuZXdSVENTZXNzaW9uIGV2ZW50OiAnLCBlKTtcblx0XHRldmVudHMuZW1pdCgnd2VicnRjL25ld1JUQ1Nlc3Npb24nLCBlKTtcblx0XHQvLyBpZihlLnNlc3Npb24uZGlyZWN0aW9uID09PSAnb3V0Z29pbmcnKVxuXHRcdC8vIFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9vdXRnb2luZ0NhbGwnLCBlKTtcblx0XHQvLyBlbHNlXG5cdFx0Ly8gXHRldmVudHMuZW1pdCgnd2VicnRjL2luY29taW5nQ2FsbCcsIGUpO1xuXHRcdFxuXHRcdFx0c2lwU2Vzc2lvbiA9IGUuc2Vzc2lvbjtcblx0fSk7XG5cdHNpcENsaWVudC5vbigncmVnaXN0ZXJlZCcsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCByZWdpc3RlcmVkIGV2ZW50OiAnLCBlKTsgfSk7XG5cdHNpcENsaWVudC5vbigndW5yZWdpc3RlcmVkJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIHVucmVnaXN0ZXJlZCBldmVudDogJywgZSk7IH0pO1xuXHRzaXBDbGllbnQub24oJ3JlZ2lzdHJhdGlvbkZhaWxlZCcsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCByZWdpc3RyYXRpb25GYWlsZWQgZXZlbnQ6ICcsIGUpOyB9KTtcblxuXHRzaXBDYWxsRXZlbnRzID0ge1xuXHRcdHByb2dyZXNzOiBmdW5jdGlvbihlKXtcblx0XHRcdGRlYnVnLmxvZygnY2FsbCBwcm9ncmVzcyBldmVudDogJywgZSk7XG5cdFx0XHRldmVudHMuZW1pdCgnd2VicnRjL3Byb2dyZXNzJywgZSk7XG5cdFx0fSxcblx0XHRmYWlsZWQ6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZGVidWcubG9nKCdjYWxsIGZhaWxlZCBldmVudDonLCBlKTtcblx0XHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvZmFpbGVkJywgZSk7XG5cdFx0fSxcblx0XHRlbmRlZDogZnVuY3Rpb24oZSl7XG5cdFx0XHRkZWJ1Zy5sb2coJ2NhbGwgZW5kZWQgZXZlbnQ6ICcsIGUpO1xuXHRcdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9lbmRlZCcsIGUpO1xuXHRcdH0sXG5cdFx0Y29uZmlybWVkOiBmdW5jdGlvbihlKXtcblx0XHRcdGRlYnVnLmxvZygnY2FsbCBjb25maXJtZWQgZXZlbnQ6ICcsIGUpO1xuXHRcdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9jb25maXJtZWQnLCBlKTtcblx0XHR9LFxuXHRcdGFkZHN0cmVhbTogZnVuY3Rpb24oZSl7XG5cdFx0XHRkZWJ1Zy5sb2coJ2NhbGwgYWRkc3RyZWFtIGV2ZW50OiAnLCBlKTtcblx0XHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvYWRkc3RyZWFtJywgZSk7XG5cdFx0XHR2YXIgc3RyZWFtID0gZS5zdHJlYW07XG5cdFx0XHRvcHRpb25zLmF1ZGlvUmVtb3RlID0gSnNTSVAucnRjbmluamEuYXR0YWNoTWVkaWFTdHJlYW0ob3B0aW9ucy5hdWRpb1JlbW90ZSwgc3RyZWFtKTtcblx0XHR9XG5cdFx0Ly8gc2RwOiBmdW5jdGlvbihlKXtcblx0XHQvLyBcdGRlYnVnLmxvZygnc2RwOiAnLCBlKTtcblx0XHQvLyB9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGlzRXN0YWJsaXNoZWQoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNFc3RhYmxpc2hlZCgpO1xufVxuXG5mdW5jdGlvbiBpc0luUHJvZ3Jlc3MoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNJblByb2dyZXNzKCk7XG59XG5cbmZ1bmN0aW9uIGlzRW5kZWQoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNFbmRlZCgpO1xufVxuXG5mdW5jdGlvbiB1bnJlZ2lzdGVyKCl7XG5cdHNpcENsaWVudC5zdG9wKCk7XG59XG5cbmZ1bmN0aW9uIGF1ZGlvY2FsbChudW1iZXIpe1xuXHRzaXBTZXNzaW9uID0gc2lwQ2xpZW50LmNhbGwobnVtYmVyLCB7XG5cdFx0ZXZlbnRIYW5kbGVyczogc2lwQ2FsbEV2ZW50cyxcblx0XHRtZWRpYUNvbnN0cmFpbnRzOiB7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gdGVybWluYXRlKCl7XG5cdHNpcFNlc3Npb24udGVybWluYXRlKHtcblx0XHRzdGF0dXNfY29kZTogMjAwXG5cdH0pO1xuXHQvLyBzaXBDbGllbnQudGVybWluYXRlU2Vzc2lvbnMoKTtcbn1cblxuZnVuY3Rpb24gYW5zd2VyKCl7XG5cdGRlYnVnLmxvZygnYW5zd2VyOiAnLHNpcENsaWVudCk7XG5cdHNpcFNlc3Npb24uYW5zd2VyKCk7XG59XG5cbmZ1bmN0aW9uIGhvbGQoKXtcblx0ZGVidWcubG9nKCdob2xkOiAnLCBzaXBTZXNzaW9uLmlzT25Ib2xkKCkpO1xuXHRpZihzaXBTZXNzaW9uICYmIHNpcFNlc3Npb24uaXNPbkhvbGQoKS5sb2NhbCkge1xuXHRcdHNpcFNlc3Npb24udW5ob2xkKCk7XG5cdH0gZWxzZSB7XG5cdFx0c2lwU2Vzc2lvbi5ob2xkKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3RlQXVkaW8oKXtcblx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0ZWwuc2V0QXR0cmlidXRlKCdhdXRvcGxheScsICdhdXRvcGxheScpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcblx0cmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBpbml0KG9wdHMpe1xuXHRkZWJ1Zy5sb2coJ0luaXRpYXRpbmcgV2ViUlRDIG1vZHVsZTonLCBvcHRzKTtcblx0b3B0aW9ucyA9IG9wdHM7XG5cdGlmKG9wdGlvbnMuc2lwLnJlZ2lzdGVyID09PSB1bmRlZmluZWQpIG9wdGlvbnMuc2lwLnJlZ2lzdGVyID0gZmFsc2U7XG5cblx0Ly8gISFnZXQgcmlkIG9mIHRoaXMhIVxuXHRldmVudHMuZW1pdCA9IG9wdHMuZW1pdDtcblx0ZXZlbnRzLm9uID0gb3B0cy5vbjtcblx0Ly8gISFnZXQgcmlkIG9mIHRoaXMhIVxuXG5cdG9wdGlvbnMuYXVkaW9SZW1vdGUgPSBjcmVhdGVSZW1vdGVBdWRpbygpO1xuXHRzaXBDbGllbnQgPSBuZXcgSnNTSVAuVUEob3B0aW9ucy5zaXApO1xuXHRpbml0SnNTSVBFdmVudHMoKTtcblx0c2lwQ2xpZW50LnN0YXJ0KCk7XG5cdC8vIHJldHVybiBzaXBDbGllbnQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRsaWI6IEpzU0lQLFxuXHRpbml0OiBpbml0LFxuXHR1bnJlZ2lzdGVyOiB1bnJlZ2lzdGVyLFxuXHRhdWRpb2NhbGw6IGF1ZGlvY2FsbCxcblx0dGVybWluYXRlOiB0ZXJtaW5hdGUsXG5cdGFuc3dlcjogYW5zd2VyLFxuXHRob2xkOiBob2xkLFxuXHRpc0luUHJvZ3Jlc3M6IGlzSW5Qcm9ncmVzcyxcblx0aXNFc3RhYmxpc2hlZDogaXNFc3RhYmxpc2hlZCxcblx0aXNFbmRlZDogaXNFbmRlZCxcblx0aXNTdXBwb3J0ZWQ6IGlzV2VicnRjU3VwcG9ydGVkXG59OyIsInZhciBkb21pZnkgPSByZXF1aXJlKCdkb21pZnknKTtcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlJyk7XG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKTtcbnZhciBmcmFzZXMgPSBudWxsO1xudmFyIGNvYnJvd3NpbmcgPSByZXF1aXJlKCcuL2NvYnJvd3NpbmcnKTtcbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL3RlbXBsYXRlcycpO1xudmFyIFdlYlJUQyA9IHJlcXVpcmUoJy4vd2VicnRjJyk7XG52YXIgYXVkaW8gPSByZXF1aXJlKCcuL2F1ZGlvLWNvbnRyb2wnKTtcbi8vIHZhciBzZXJ2ZXJVcmwgPSB7fTtcbnZhciBmb3JtcztcbnZhciBhcGk7XG5cbi8vIFdpZGdldCBpbml0aWF0aW9uIG9wdGlvbnNcbnZhciBkZWZhdWx0cyA9IHtcblx0Ly8gcHJlZml4IGZvciBDU1MgY2xhc3NlcyBhbmQgaWRzLiBcblx0Ly8gQ2hhbmdlIGl0IG9ubHkgaWYgdGhlIGRlZmF1bHQgcHJlZml4IFxuXHQvLyBtYXRjaGVzIHdpdGggZXhpc3RlZCBjbGFzc2VzIG9yIGlkcyBvbiB0aGUgd2Vic2l0ZVxuXHRwcmVmaXg6ICdzd2MnLFxuXHQvLyBJbml0IG1vZHVsZSBvbiBwYWdlIGxvYWRcblx0YXV0b1N0YXJ0OiB0cnVlLFxuXHQvLyB3aGV0aGVyIG9yIG5vdCB0byBhc2sgdXNlciBcblx0Ly8gdG8gaW50cm9kdWNlIGhpbSBzZWxmIGJlZm9yZSB0aGUgY2hhdCBzZXNzaW9uXG5cdGludHJvOiBmYWxzZSxcblx0Ly8gd2hldGhlciBvciBub3QgdG8gYWRkIHdpZGdldCB0byB0aGUgd2VicGFnZVxuXHR3aWRnZXQ6IHRydWUsXG5cdC8vIGVuYWJsZSBjaGF0IGZlYXR1cmVcblx0Y2hhdDogdHJ1ZSxcblx0Ly8gY2hhbm5lbHMgc2V0dGluZ3Ncblx0Y2hhbm5lbHM6IHtcblx0XHR3ZWJydGM6IHt9LFxuXHRcdGNhbGxiYWNrOiB7fVxuXHR9LFxuXHQvLyBlbmFibGUgY29icm93c2luZyBmZWF0dXJlXG5cdGNvYnJvd3Npbmc6IGZhbHNlLFxuXHQvLyBET00gZWxlbWVudFtzXSBzZWxlY3RvciB0aGF0IG9wZW5zIGEgd2lkZ2V0XG5cdGJ1dHRvblNlbGVjdG9yOiBcIlwiLFxuXHRyZUNyZWF0ZVNlc3Npb246IHRydWUsXG5cdHRpdGxlOiAnJyxcblx0bGFuZzogJ2VuJyxcblx0bGFuZ0Zyb21Vcmw6IGZhbHNlLFxuXHRwb3NpdGlvbjogJ3JpZ2h0Jyxcblx0aGlkZU9mZmxpbmVCdXR0b246IGZhbHNlLFxuXHRvZmZlcjogZmFsc2UsXG5cdHN0eWxlczoge1xuXHRcdHByaW1hcnk6IHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogJyM3NGI5ZmYnLFxuXHRcdFx0Y29sb3I6ICcjRkZGRkZGJ1xuXHRcdH0sXG5cdFx0aW50cm86IHtcblx0XHRcdC8vIGJhY2tncm91bmRJbWFnZTogXCJpbWFnZXMvYmdyLTAyLmpwZ1wiXG5cdFx0fSxcblx0XHRzZW5kbWFpbDoge1xuXHRcdFx0Ly8gYmFja2dyb3VuZEltYWdlOiBcImltYWdlcy9iZ3ItMDEuanBnXCJcblx0XHR9LFxuXHRcdGNsb3NlQ2hhdDoge1xuXHRcdFx0Ly8gYmFja2dyb3VuZEltYWdlOiBcImltYWdlcy9iZ3ItMDIuanBnXCJcblx0XHR9XG5cdH0sXG5cdGJ1dHRvblN0eWxlczoge1xuXHRcdG9ubGluZToge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgxNzUsMjI5LDI1NSwwLjgpJyxcblx0XHRcdGNvbG9yOiAnJ1xuXHRcdH0sXG5cdFx0b2ZmbGluZToge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgyNDEsMjQxLDI0MSwwLjgpJyxcblx0XHRcdGNvbG9yOiAnJ1xuXHRcdH0sXG5cdFx0dGltZW91dDoge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgyNDEsMjQxLDI0MSwwLjgpJyxcblx0XHRcdGNvbG9yOiAnJ1xuXHRcdH0sXG5cdFx0bm90aWZpZWQ6IHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMjUzLDI1MCwxMjksMC44KScsXG5cdFx0XHRjb2xvcjogJydcblx0XHR9LFxuXHRcdGNvbG9yOiAncmdiKDcwLDcwLDcwKSdcblx0fSxcblx0d2lkZ2V0V2luZG93T3B0aW9uczogJ2xlZnQ9MTAsdG9wPTEwLHdpZHRoPTM1MCxoZWlnaHQ9NTUwLHJlc2l6YWJsZScsXG5cdC8vIGFic29sdXRlIHBhdGggdG8gdGhlIHdjaGF0IGZvbGRlclxuXHRwYXRoOiAnL2lwY2Mvd2ViY2hhdC8nLFxuXHQvLyBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBjbGllbnRzIGZpbGVzLiBJZiBub3Qgc2V0LCBmaWxlcyByZXF1ZXN0ZWQgZnJvbSBkZWZhdWx0cy5zZXJ2ZXIgKyBkZWZhdWx0cy5wYXRoLlxuXHRjbGllbnRQYXRoOiAnaHR0cHM6Ly9jZG4uc21pbGUtc29mdC5jb20vd2NoYXQvdjEvJyxcblx0Ly8gYWJzb2x1dGUgcGF0aCB0byB0aGUgY3NzIGZsaWVcblx0c3R5bGVzUGF0aDogJycsXG5cdC8vIGFic29sdXRlIHBhdGggdG8gdGhlIHRyYW5zbGF0aW9ucy5qc29uIGZsaWVcblx0dHJhbnNsYXRpb25zUGF0aDogJycsXG5cdC8vIGluIHNlY29uZHNcblx0Ly8gY2hlY2tTdGF0dXNUaW1lb3V0OiAxMCxcblx0Ly8gaW4gc2Vjb25kc1xuXHQvLyBnZXRNZXNzYWdlc1RpbWVvdXQ6IDEsXG5cdC8vIGRpc3BsYXllZCBpbiB0aGUgZW1haWwgdGVtcGxhdGVcblx0aG9zdDogd2luZG93LmxvY2F0aW9uLmhvc3QsXG5cdC8vIHdlYnJ0YyBvcHRpb25zXG5cdC8vIHdlYnJ0Yzoge1xuXHQvLyBcdHNpcDoge30sXG5cdC8vIFx0aG90bGluZTogJycsXG5cdC8vIFx0ZmFsbGJhY2s6IGZhbHNlXG5cdC8vIH0sXG5cdHdlYnJ0Y0VuYWJsZWQ6IGZhbHNlLFxuXHQvLyBjYWxsYmFjazoge1xuXHQvLyBcdHRhc2s6ICcnXG5cdC8vIH1cbn07XG5cbnZhciBnbG9iYWxTZXR0aW5ncyA9IFwiV2NoYXRTZXR0aW5nc1wiO1xuXG4vLyBDdXJyZW50IHdpZGdldCBzdGF0ZVxudmFyIHdpZGdldFN0YXRlID0ge1xuXHRpbml0aWF0ZWQ6IGZhbHNlLFxuXHRhY3RpdmU6IGZhbHNlLFxuXHRzdGF0ZTogJycsIC8vIFwib25saW5lXCIgfCBcIm9mZmxpbmVcIiB8IFwidGltZW91dFwiLFxuXHRzaGFyZTogZmFsc2UsXG5cdHNvdW5kczogdHJ1ZVxufTtcblxudmFyIGRpYWxvZyA9IFtdO1xuXG4vLyBhdmFpbGFibGUgZGlhbG9nIGxhbmd1YWdlc1xudmFyIGxhbmdzID0gW107XG52YXIgY3VyckxhbmcgPSAnJztcbi8vIHZhciBtZXNzYWdlc1RpbWVvdXQ7XG4vLyB2YXIgbm9NZXNzYWdlc1RpbWVvdXQ7XG4vLyB2YXIgZ2V0TGFuZ3VhZ2VzSW50ZXJ2YWw7XG52YXIgY2hhdFRpbWVvdXQ7XG52YXIgbW91c2VGb2N1c2VkID0gZmFsc2U7XG4vLyBDb250YWluZXIgZm9yIG1lc3NhZ2VzXG4vLyB2YXIgbWVzc2FnZXNDb250O1xuLy8gV2lkZ2V0IGRvbSBlbGVtZW50XG52YXIgd2lkZ2V0O1xuXG4vLyBXaWRnZXQgaW4gYSBzZXBhcmF0ZSB3aW5kb3dcbnZhciB3aWRnZXRXaW5kb3c7XG4vLyBXaWRnZXQgcGFuZXMgZWxlbWVudHNcbi8vIHZhciBwYW5lcztcbnZhciBhZ2VudElzVHlwaW5nVGltZW91dDtcbnZhciB1c2VySXNUeXBpbmdUaW1lb3V0O1xudmFyIHRpbWVyVXBkYXRlSW50ZXJ2YWw7XG52YXIgcG9sbFR1cm5zID0gMTtcbi8vIHZhciByaW5nVG9uZSA9IG51bGwsXG4vLyB2YXIgcmluZ1RvbmVJbnRlcnZhbCA9IG51bGw7XG5cbnZhciBwdWJsaWNBcGkgPSB7XG5cblx0aW5pdE1vZHVsZTogaW5pdE1vZHVsZSxcblx0aW5pdFdpZGdldFN0YXRlOiBpbml0V2lkZ2V0U3RhdGUsXG5cdG9wZW5XaWRnZXQ6IG9wZW5XaWRnZXQsXG5cdGluaXRDaGF0OiBpbml0Q2hhdCxcblx0aW5pdENhbGw6IGluaXRDYWxsLFxuXHRnZXRXaWRnZXRFbGVtZW50OiBnZXRXaWRnZXRFbGVtZW50LFxuXHRpc1dlYnJ0Y1N1cHBvcnRlZDogV2ViUlRDLmlzU3VwcG9ydGVkLFxuXHRnZXRXaWRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpZGdldFN0YXRlO1xuXHR9LFxuXHRnZXRFbnRpdHk6IGZ1bmN0aW9uKCl7IHJldHVybiBzdG9yYWdlLmdldFN0YXRlKCdlbnRpdHknLCAnc2Vzc2lvbicpOyB9LFxuXHRvbjogZnVuY3Rpb24oZXZ0LCBsaXN0ZW5lcikge1xuXHRcdGFwaS5vbihldnQsIGxpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0ZW1pdDogZnVuY3Rpb24gKGV2dCwgbGlzdGVuZXIpe1xuXHRcdGFwaS5lbWl0KGV2dCwgbGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHQvKipcblx0ICogU2V0IGRlZmF1bHQgdXNlciBjcmVkZW50aWFscy5cblx0ICogSWYgXCJpbnRyb1wiIGlzIGZhbHNlLCB0aGFuIGRpYWxvZyB3aWxsIHN0YXJ0IHdpdGggdGhlc2UgY3JlZGVudGlhbHMuXG5cdCAqIE5PVEU6IE11c3QgYmUgY2FsbGVkIGJlZm9yZSBpbml0TW9kdWxlIG1ldGhvZFxuXHQgKiBcblx0ICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFVzZXIgY3JlZGVudGlhbHMsIGkuZS4gXCJ1bmFtZVwiLCBcImxhbmdcIiwgXCJwaG9uZVwiLCBcInN1YmplY3RcIlxuXHQgKi9cblx0c2V0RGVmYXVsdENyZWRlbnRpYWxzOiBmdW5jdGlvbihwYXJhbXMpIHtcblx0XHRkZWZhdWx0cy5jcmVkZW50aWFscyA9IHBhcmFtcztcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG1vZHVsZTogV2lkZ2V0LFxuXHRhcGk6IHB1YmxpY0FwaVxufTtcblxuLy8gSW5pdGlhdGUgdGhlIG1vZHVsZSB3aXRoIHRoZSBnbG9iYWwgc2V0dGluZ3NcbmlmKGdsb2JhbFtnbG9iYWxTZXR0aW5nc10gJiYgZ2xvYmFsW2dsb2JhbFNldHRpbmdzXS5hdXRvU3RhcnQgIT09IGZhbHNlICYmIGRlZmF1bHRzLmF1dG9TdGFydCkge1xuXHRpZihkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIgfHwgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJpbnRlcmFjdGl2ZVwiKSB7XG5cdCAgICBXaWRnZXQoZ2xvYmFsW2dsb2JhbFNldHRpbmdzXSk7XG5cdH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHsgV2lkZ2V0KGdsb2JhbFtnbG9iYWxTZXR0aW5nc10pOyB9LCBmYWxzZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gV2lkZ2V0KG9wdGlvbnMpe1xuXG5cdGlmKHdpZGdldFN0YXRlLmluaXRpYXRlZCkgcmV0dXJuIHB1YmxpY0FwaTtcblxuXHRfLm1lcmdlKGRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblx0Ly8gXy5hc3NpZ24oZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pO1xuXG5cdGRlYnVnLmxvZygnV2lkZ2V0OiAnLCBvcHRpb25zKTtcblxuXHRkZWZhdWx0cy5jbGllbnRQYXRoID0gb3B0aW9ucy5jbGllbnRQYXRoID8gb3B0aW9ucy5jbGllbnRQYXRoIDogKGRlZmF1bHRzLmNsaWVudFBhdGggfHwgKGRlZmF1bHRzLnNlcnZlciArIGRlZmF1bHRzLnBhdGgpKTtcblxuXHRhZGRXaWRnZXRTdHlsZXMoKTtcblx0aWYoZGVmYXVsdHMuYnV0dG9uU2VsZWN0b3IpIFxuXHRcdHNldEhhbmRsZXJzKGRlZmF1bHRzLmJ1dHRvblNlbGVjdG9yKTtcblx0XG5cdC8vIHNlcnZlclVybCA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKGRlZmF1bHRzLnNlcnZlciwgdHJ1ZSk7XG5cblx0Ly8gRW5hYmxpbmcgYXVkaW8gbW9kdWxlXG5cdGF1ZGlvLmluaXQoZGVmYXVsdHMuY2xpZW50UGF0aCsnc291bmRzLycpO1xuXG5cdGFwaSA9IG5ldyBjb3JlKG9wdGlvbnMpXG5cdC5vbignc2Vzc2lvbi9jcmVhdGUnLCBvblNlc3Npb25TdWNjZXNzKVxuXHQub24oJ3Nlc3Npb24vY29udGludWUnLCBvblNlc3Npb25TdWNjZXNzKVxuXHQub24oJ3Nlc3Npb24vam9pbicsIG9uU2Vzc2lvbkpvaW4pXG5cdC5vbignc2Vzc2lvbi9pbml0Jywgb25TZXNzaW9uSW5pdCk7XG5cdC8vIC5vbignY2hhdC9sYW5ndWFnZXMnLCBmdW5jdGlvbigpIHtcblx0Ly8gXHRjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6IGdldFdpZGdldFN0YXRlKCkgfSk7XG5cdC8vIH0pO1x0XG5cblx0aWYoZGVmYXVsdHMud2lkZ2V0KSB7XG5cdFx0YXBpLm9uKCdjaGF0L3N0YXJ0Jywgc3RhcnRDaGF0KVxuXHRcdC5vbignY2hhdC9jbG9zZScsIG9uQ2hhdENsb3NlKVxuXHRcdC5vbignY2hhdC90aW1lb3V0Jywgb25DaGF0VGltZW91dClcblx0XHQub24oJ21lc3NhZ2UvbmV3JywgY2xlYXJVbmRlbGl2ZXJlZClcblx0XHQub24oJ21lc3NhZ2UvbmV3JywgbmV3TWVzc2FnZSlcblx0XHQub24oJ21lc3NhZ2UvdHlwaW5nJywgb25BZ2VudFR5cGluZylcblx0XHQub24oJ2NhbGxiYWNrL2NyZWF0ZScsIG9uQ2FsbGJhY2tSZXF1ZXN0ZWQpXG5cdFx0Lm9uKCdmb3JtL3N1Ym1pdCcsIG9uRm9ybVN1Ym1pdClcblx0XHQub24oJ2Zvcm0vcmVqZWN0JywgY2xvc2VGb3JtKVxuXHRcdC5vbignd2lkZ2V0L2xvYWQnLCBpbml0V2lkZ2V0KTtcblx0XHQvLyAub24oJ3dpZGdldC9pbml0Jywgb25XaWRnZXRJbml0KTtcblx0XHQvLyAub24oJ3dpZGdldC9zdGF0ZWNoYW5nZScsIGNoYW5nZVdnU3RhdGUpO1xuXHR9XG5cblx0aWYoV2ViUlRDLmlzU3VwcG9ydGVkKCkgJiYgZGVmYXVsdHMuY2hhbm5lbHMud2VicnRjICYmIGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5zaXAgJiYgZGVmYXVsdHMuY2hhbm5lbHMud2VicnRjLnNpcC53c19zZXJ2ZXJzICE9PSB1bmRlZmluZWQpIHtcblx0XHRpZih3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonKXtcblx0XHQvLyBpZih3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonICYmIHNlcnZlclVybC5wcm90b2NvbCA9PT0gJ2h0dHBzOicpe1xuXHRcdFx0Ly8gc2V0IGZsYWcgdG8gaW5kaWNhdGUgdGhhdCB3ZWJydGMgZmVhdHVyZSBpcyBzdXBwb3J0ZWQgYW5kIGVuYWJsZWRcblx0XHRcdGRlZmF1bHRzLndlYnJ0Y0VuYWJsZWQgPSB0cnVlO1xuXG5cdFx0XHQvLyBzZXQgd2VicnRjIGV2ZW50IGhhbmRsZXJzXG5cdFx0XHRhcGkub24oJ3dlYnJ0Yy9uZXdSVENTZXNzaW9uJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0aW5pdENhbGxTdGF0ZSgnbmV3UlRDU2Vzc2lvbicpO1xuXHRcdFx0fSk7XG5cdFx0XHRhcGkub24oJ3dlYnJ0Yy9wcm9ncmVzcycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRpZihlLnJlc3BvbnNlLnN0YXR1c19jb2RlID09PSAxODApIHtcblx0XHRcdFx0XHRpbml0Q2FsbFN0YXRlKCdyaW5naW5nJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5pdENhbGxTdGF0ZSgnY29uZmlybWVkJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvYWRkc3RyZWFtJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0aW5pdENhbGxTdGF0ZSgnY29ubmVjdGVkJyk7XG5cdFx0XHR9KTtcblx0XHRcdGFwaS5vbignd2VicnRjL2VuZGVkJywgZnVuY3Rpb24oKXtcblx0XHRcdFx0aW5pdENhbGxTdGF0ZSgnZW5kZWQnKTtcblx0XHRcdH0pO1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvZmFpbGVkJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdGlmKGUuY2F1c2UgPT09ICdDYW5jZWxlZCcpe1xuXHRcdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2NhbmNlbGVkJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5pdENhbGxTdGF0ZSgnZmFpbGVkJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyByaW5nVG9uZSBhdWRpbyBlbGVtZW50IHBsYXlzIHJpbmdUb25lIHNvdW5kIHdoZW4gY2FsbGluZyB0byBhZ2VudFxuXHRcdFx0Ly8gcmluZ1RvbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHRcdFx0Ly8gcmluZ1RvbmUuc3JjID0gZGVmYXVsdHMuY2xpZW50UGF0aCsnc291bmRzL3JpbmdvdXQud2F2Jztcblx0XHRcdC8vIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmluZ1RvbmUpO1xuXG5cdFx0XHQvLyBpbml0aWF0ZSB3ZWJydGMgbW9kdWxlIHdpdGggcGFyYW1ldGVyc1xuXHRcdFx0aW5pdFdlYnJ0Y01vZHVsZSh7XG5cdFx0XHRcdHNpcDogZGVmYXVsdHMuY2hhbm5lbHMud2VicnRjLnNpcCxcblx0XHRcdFx0ZW1pdDogcHVibGljQXBpLmVtaXQsXG5cdFx0XHRcdG9uOiBwdWJsaWNBcGkub25cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB3ZWJydGMgaXMgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLCBidXQgdGhlIGN1cnJlbnQgd2ViIHBhZ2Vcblx0XHRcdC8vIGlzIGxvY2F0ZWQgb24gaW5zZWN1cmUgb3JpZ2lucywgdGhlcmVmb3JlIHRoZSB3ZWJydGMgaXMgbm90IHN1cHBvcnRlZFxuXHRcdFx0ZGVidWcud2FybignV2ViUlRDIGZlYXR1cmUgaXMgZGlzYWJsZWQnKTtcblx0XHRcdGRlYnVnLndhcm4oJ2dldFVzZXJNZWRpYSgpIG5vIGxvbmdlciB3b3JrcyBvbiBpbnNlY3VyZSBvcmlnaW5zLiBUbyB1c2UgdGhpcyBmZWF0dXJlLCB5b3Ugc2hvdWxkIGNvbnNpZGVyIHN3aXRjaGluZyB5b3VyIGFwcGxpY2F0aW9uIHRvIGEgc2VjdXJlIG9yaWdpbiwgc3VjaCBhcyBIVFRQUy4gU2VlIGh0dHBzOi8vZ29vLmdsL3JTdFRHeiBmb3IgbW9yZSBkZXRhaWxzLicpO1xuXHRcdH1cblx0fVxuXHRcblx0c2V0U2Vzc2lvblRpbWVvdXRIYW5kbGVyKCk7XG5cdC8vIGdldExhbmd1YWdlcygpO1xuXG5cdC8vIGxvYWQgdHJhbnNsYXRpb25zXG5cdHJlcXVlc3QuZ2V0KCdmcmFzZXMnLCAoZGVmYXVsdHMudHJhbnNsYXRpb25zUGF0aCB8fCBkZWZhdWx0cy5jbGllbnRQYXRoKSsndHJhbnNsYXRpb25zLmpzb24nLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpe1xuXHRcdGlmKGVycikgcmV0dXJuIGFwaS5lbWl0KCdFcnJvcicsIGVycik7XG5cdFx0ZnJhc2VzID0gSlNPTi5wYXJzZShyZXN1bHQpO1xuXHR9KTtcblx0XG5cdC8vIGxvYWQgZm9ybXNcblx0cmVxdWVzdC5nZXQoJ2Zvcm1zX2pzb24nLCBkZWZhdWx0cy5jbGllbnRQYXRoKydmb3Jtcy5qc29uJywgZnVuY3Rpb24gKGVyciwgcmVzdWx0KXtcblx0XHRpZihlcnIpIHJldHVybiBhcGkuZW1pdCgnRXJyb3InLCBlcnIpO1xuXHRcdGZvcm1zID0gSlNPTi5wYXJzZShyZXN1bHQpLmZvcm1zO1xuXHR9KTtcblxuXHRyZXR1cm4gcHVibGljQXBpO1xufVxuXG5mdW5jdGlvbiBpbml0TW9kdWxlKCl7XG5cdGFwaS5pbml0KCk7XG5cdHJldHVybiBwdWJsaWNBcGk7XG59XG5cbmZ1bmN0aW9uIGluaXRXZWJydGNNb2R1bGUob3B0cyl7XG5cdGRlYnVnLmxvZygnaW5pdFdlYnJ0Y01vZHVsZTogJywgb3B0cyk7XG5cdFdlYlJUQy5pbml0KG9wdHMpO1xufVxuXG5mdW5jdGlvbiBpbml0U2Vzc2lvbigpIHtcblx0XG5cdGlmKCFkZWZhdWx0cy5jaGF0ICYmICFkZWZhdWx0cy53ZWJydGNFbmFibGVkICYmICFkZWZhdWx0cy5jaGFubmVscy5jYWxsYmFjay50YXNrKSByZXR1cm4gZmFsc2U7XG5cblx0ZGVidWcubG9nKCdzZXNzaW9uIGluaXRpYXRlZCcpO1xuXG5cdC8vIHNldCBjdXJyZW50IHVzZXIgbGFuZ3VhZ2Vcblx0Y3VyckxhbmcgPSBjdXJyTGFuZyB8fCBkZXRlY3RMYW5ndWFnZSgpO1xuXHRzZXRTZXNzaW9uVGltZW91dEhhbmRsZXIoKTtcblx0XG5cdGdldExhbmd1YWdlcygpO1xuXHQvLyBnZXRMYW5ndWFnZXNJbnRlcnZhbCA9IHNldEludGVydmFsKGdldExhbmd1YWdlcywgZGVmYXVsdHMuY2hlY2tTdGF0dXNUaW1lb3V0KjEwMDApO1xuXG5cdC8vIElmIHBhZ2UgbG9hZGVkIGFuZCBcIndpZGdldFwiIHByb3BlcnR5IGlzIHNldCAtIGxvYWQgd2lkZ2V0XG5cdGlmKGRlZmF1bHRzLndpZGdldCAmJiAhd2lkZ2V0U3RhdGUuaW5pdGlhdGVkICYmIGlzQnJvd3NlclN1cHBvcnRlZCgpKSB7XG5cdFx0bG9hZFdpZGdldCgpO1xuXHR9XG5cblx0Ly8gSWYgdGltZW91dCB3YXMgb2NjdXJlZCwgaW5pdCBjaGF0IGFmdGVyIGEgc2Vzc2lvbiBpcyBjcmVhdGVkXG5cdGlmKGhhc1dnU3RhdGUoJ3RpbWVvdXQnKSkge1xuXHRcdHJlbW92ZVdnU3RhdGUoJ3RpbWVvdXQnKTtcblx0fVxuXG5cdC8vIGlmIHdpbmRvdyBpcyBub3QgYSBvcGVuZWQgd2luZG93XG5cdGlmKCFkZWZhdWx0cy5leHRlcm5hbCkge1xuXHRcdC8vIGFwaS51cGRhdGVVcmwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXG5cdFx0aWYoZGVmYXVsdHMuY29icm93c2luZykge1xuXHRcdFx0aW5pdENvYnJvd3NpbmdNb2R1bGUoe1xuXHRcdFx0XHR1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuXHRcdFx0XHRlbnRpdHk6IHN0b3JhZ2UuZ2V0U3RhdGUoJ2VudGl0eScsICdzZXNzaW9uJyksXG5cdFx0XHRcdHdpZGdldDogJyMnK2RlZmF1bHRzLnByZWZpeCsnLXdnLWNvbnQnXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRhcGkuZW1pdCgnc2Vzc2lvbi9pbml0Jywge29wdGlvbnM6IGRlZmF1bHRzLCB1cmw6IGdsb2JhbC5sb2NhdGlvbi5ocmVmIH0pO1xufVxuXG4vLyBTZXNzaW9uIGlzIGVpdGhlciBjcmVhdGVkIG9yIGNvbnRpbnVlc1xuZnVuY3Rpb24gb25TZXNzaW9uU3VjY2Vzcygpe1x0XG5cdC8vIFdhaXQgd2hpbGUgdHJhbnNsYXRpb25zIGFyZSBsb2FkZWRcblx0Xy5wb2xsKGZ1bmN0aW9uKCl7XG5cdFx0ZGVidWcubG9nKCdwb2xsOiAnLCBmcmFzZXMpO1xuXHRcdHJldHVybiAoZnJhc2VzICE9PSBudWxsKTtcblxuXHR9LCBmdW5jdGlvbigpIHtcblx0XHRpbml0U2Vzc2lvbigpXG5cdFx0Ly8gaWYgd2luZG93IGlzIG5vdCBhIG9wZW5lZCB3aW5kb3dcblx0XHRpZighZGVmYXVsdHMuZXh0ZXJuYWwpIHtcblx0XHRcdGFwaS51cGRhdGVVcmwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRcdH1cblxuXHR9LCBmdW5jdGlvbigpe1xuXHRcdFxuXHRcdGlmKHBvbGxUdXJucyA8IDIpIHtcblx0XHRcdHBvbGxUdXJucysrO1xuXHRcdFx0V2lkZ2V0KGRlZmF1bHRzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGFwaS5lbWl0KCdFcnJvcicsICdNb2R1bGUgd2FzblxcJ3QgaW5pdGlhdGVkIGR1ZSB0byBuZXR3b3JrIGVycm9ycycpO1xuXHRcdH1cblxuXHR9LCA2MDAwMCk7XG5cbn1cblxuZnVuY3Rpb24gb25TZXNzaW9uSW5pdCgpe1xuXHRzdG9yYWdlLnNhdmVTdGF0ZSgnaW5pdCcsIHRydWUsICdzZXNzaW9uJyk7XG5cdGlmKHdpZGdldFdpbmRvdyAmJiAhd2lkZ2V0V2luZG93LmNsb3NlZCkgd2lkZ2V0V2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oZGVmYXVsdHMucHJlZml4KycuaW5pdCcsIHRydWUpO1xufVxuXG4vLyBzZW5kIHNoYXJlZCBldmVudCB0byB0aGUgdXNlcidzIGJyb3dzZXJcbmZ1bmN0aW9uIG9uU2Vzc2lvbkpvaW4ocGFyYW1zKXtcblx0Ly8gZGVidWcubG9nKCdvblNlc3Npb25Kb2luOiAnLCBwYXJhbXMpO1xuXHRpbml0Q29icm93c2luZ01vZHVsZSh7IHVybDogcGFyYW1zLnVybCwgZW50aXR5OiBzdG9yYWdlLmdldFN0YXRlKCdlbnRpdHknLCAnc2Vzc2lvbicpIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkV2lkZ2V0KGNiKXtcblx0XG5cdGNvbXBpbGVkID0gY29tcGlsZVRlbXBsYXRlKCd3aWRnZXQnLCB7XG5cdFx0ZGVmYXVsdHM6IGRlZmF1bHRzLFxuXHRcdGxhbmd1YWdlczogbGFuZ3MsXG5cdFx0dHJhbnNsYXRpb25zOiBmcmFzZXMsXG5cdFx0Y3Vyckxhbmc6IGN1cnJMYW5nIHx8IGRlZmF1bHRzLmxhbmcsXG5cdFx0Y3JlZGVudGlhbHM6IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NyZWRlbnRpYWxzJywgJ3Nlc3Npb24nKSB8fCB7fSxcblx0XHRfOiBfXG5cdH0pO1xuXG5cdC8vIFdpZGdldCB2YXJpYWJsZSBhc3NpZ25tZW50XG5cdHdpZGdldCA9IGRvbWlmeShjb21waWxlZCk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQod2lkZ2V0KTtcblx0YXBpLmVtaXQoJ3dpZGdldC9sb2FkJywgd2lkZ2V0KTtcblxufVxuXG5mdW5jdGlvbiBpbml0Q29icm93c2luZ01vZHVsZShwYXJhbXMpe1xuXHQvLyBpbml0IGNvYnJvd3NpbmcgbW9kdWxlIG9ubHkgb24gbWFpbiB3aW5kb3dcblx0aWYoZGVmYXVsdHMuZXh0ZXJuYWwgfHwgY29icm93c2luZy5pc0luaXRpYXRlZCgpKSByZXR1cm47XG5cblx0YXBpLm9uKCdjb2Jyb3dzaW5nL2luaXQnLCBmdW5jdGlvbigpe1xuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ3NoYXJlZCcsICdzZXNzaW9uJykgfHwgcGFyYW1zLmVudGl0eSA9PT0gJ2FnZW50JykgY29icm93c2luZy5zaGFyZSgpO1xuXHRcdC8vIGNvYnJvd3NpbmcuZW1pdEV2ZW50cygpO1xuXHR9KTtcblx0YXBpLm9uKCdjb2Jyb3dzaW5nL2V2ZW50JywgZnVuY3Rpb24ocGFyYW1zKXtcblx0XHRhcGkudXBkYXRlRXZlbnRzKHBhcmFtcy5ldmVudHMsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcblx0XHRcdGlmKGVycikgcmV0dXJuO1xuXHRcdFx0aWYocmVzdWx0KSBjb2Jyb3dzaW5nLnVwZGF0ZUV2ZW50cyhyZXN1bHQpO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRhcGkub24oJ2NvYnJvd3Npbmcvc2hhcmVkJywgZnVuY3Rpb24oKXtcblx0XHRpZighc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSAmJiBwYXJhbXMuZW50aXR5ID09PSAndXNlcicpIHtcblx0XHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaGFyZWQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRcdFx0YXBpLnN3aXRjaFNoYXJlU3RhdGUodHJ1ZSwgcGFyYW1zLnVybCk7XG5cdFx0fVxuXHRcdGFwaS51cGRhdGVFdmVudHMoW3sgZW50aXR5OiBwYXJhbXMuZW50aXR5LCB1cmw6IHBhcmFtcy51cmwsIHNoYXJlZDogdHJ1ZSB9XSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuXHRcdFx0Ly8gaWYoZXJyKSByZXR1cm47XG5cdFx0XHRyZXN1bHQuaGlzdG9yeUV2ZW50cyA9IHRydWU7XG5cdFx0XHQvLyBkZWJ1Zy5sb2coJ2NvYnJvd3NpbmcgdXBkYXRlOiAnLCByZXN1bHQpO1xuXHRcdFx0Y29icm93c2luZy51cGRhdGVFdmVudHMocmVzdWx0KTtcblx0XHR9KTtcblx0fSk7XG5cblx0YXBpLm9uKCdjb2Jyb3dzaW5nL3Vuc2hhcmVkJywgZnVuY3Rpb24ocGFyYW1zKXtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkJywgZmFsc2UsICdzZXNzaW9uJyk7XG5cdFx0YXBpLnVwZGF0ZUV2ZW50cyhbeyBlbnRpdHk6IHBhcmFtcy5lbnRpdHksIHVybDogcGFyYW1zLnVybCwgc2hhcmVkOiBmYWxzZSB9XSwgZnVuY3Rpb24oZXJyKXtcblx0XHRcdC8vIGlmKGVycikgcmV0dXJuO1xuXHRcdFx0aWYocGFyYW1zLmVudGl0eSA9PT0gJ3VzZXInKSBhcGkuc3dpdGNoU2hhcmVTdGF0ZShmYWxzZSwgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0ZWxzZSBjb2Jyb3dzaW5nLnVuc2hhcmVBbGwoKTtcblx0XHR9KTtcblx0fSk7XG5cdFxuXHRjb2Jyb3dzaW5nLmluaXQoe1xuXHRcdHdpZGdldDogcGFyYW1zLndpZGdldCxcblx0XHRlbnRpdHk6IHBhcmFtcy5lbnRpdHksXG5cdFx0ZW1pdDogcHVibGljQXBpLmVtaXQsXG5cdFx0cGF0aDogZGVmYXVsdHMuY2xpZW50UGF0aFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0RWxlbWVudCgpe1xuXHRyZXR1cm4gd2lkZ2V0O1xufVxuXG5mdW5jdGlvbiBnZXRMYW5ndWFnZXMoKXtcblx0YXBpLmdldExhbmd1YWdlcyhmdW5jdGlvbiAoZXJyLCBsYW5ncyl7XG5cdFx0ZGVidWcubG9nKCdnZXRMYW5ndWFnZXM6ICcsIGVyciwgbGFuZ3MpO1xuXHRcdGlmKGVycikgcmV0dXJuO1xuXHRcdGlmKGxhbmdzKSBvbk5ld0xhbmd1YWdlcyhsYW5ncyk7XG5cdFx0Ly8gZ2V0TGFuZ3VhZ2VzVGltZW91dCA9IHNldFRpbWVvdXQoZ2V0TGFuZ3VhZ2VzLCBkZWZhdWx0cy5jaGVja1N0YXR1c1RpbWVvdXQqMTAwMCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvbk5ld0xhbmd1YWdlcyhsYW5ndWFnZXMpe1xuXHQvLyBkZWJ1Zy5sb2coJ2xhbmd1YWdlczogJywgbGFuZ3VhZ2VzKTtcblx0dmFyIHN0YXRlID0gbGFuZ3VhZ2VzLmxlbmd0aCA/ICdvbmxpbmUnIDogJ29mZmxpbmUnO1xuXG5cdGxhbmdzID0gbGFuZ3VhZ2VzO1xuXG5cdC8vIGlmKGhhc1dnU3RhdGUoc3RhdGUpKSByZXR1cm47XG5cdC8vIGlmKHdpZGdldFN0YXRlLnN0YXRlID09PSBzdGF0ZSkgcmV0dXJuO1xuXG5cdGNoYW5nZVdnU3RhdGUoeyBzdGF0ZTogc3RhdGUgfSk7XG5cdGFwaS5lbWl0KCdjaGF0L2xhbmd1YWdlcycsIGxhbmd1YWdlcyk7XG59XG5cbmZ1bmN0aW9uIGluaXRXaWRnZXQoKXtcblx0dmFyIG9wdGlvbnMgPSAnJywgc2VsZWN0ZWQ7XG5cblx0Ly8gZGVidWcubG9nKCdJbml0IHdpZGdldCEnKTtcblx0d2lkZ2V0U3RhdGUuaW5pdGlhdGVkID0gdHJ1ZTtcblxuXHRzZXRTdHlsZXMoKTtcblx0c2V0TGlzdGVuZXJzKHdpZGdldCk7XG5cdGNoYW5nZVdnU3RhdGUoeyBzdGF0ZTogZ2V0V2lkZ2V0U3RhdGUoKSB9KTtcblxuXHRpZihkZWZhdWx0cy5oaWRlT2ZmbGluZUJ1dHRvbikge1xuXHRcdGFkZFdnU3RhdGUoJ25vLWJ1dHRvbicpO1xuXHR9XG5cblx0aWYoZGVmYXVsdHMub2ZmZXIpIHtcblx0XHRzZXRPZmZlcigpO1xuXHR9XG5cblx0Ly8gaWYgY2hhdCBzdGFydGVkXG5cdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnKSA9PT0gdHJ1ZSkge1xuXHRcdHJlcXVlc3RDaGF0KHN0b3JhZ2UuZ2V0U3RhdGUoJ2NyZWRlbnRpYWxzJywgJ3Nlc3Npb24nKSB8fCB7fSk7XG5cdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnb3BlbmVkJywgJ3Nlc3Npb24nKSkgc2hvd1dpZGdldCgpO1xuXHRcdC8vIGluaXRDaGF0KCk7XG5cdH1cblxuXHQvLyBpZiB3ZWJydGMgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyIGFuZCB3c19zZXJ2ZXJzIHBhcmFtZXRlciBpcyBzZXQgLSBjaGFuZ2UgYnV0dG9uIGljb25cblx0aWYoZGVmYXVsdHMud2VicnRjRW5hYmxlZCkge1xuXHRcdGFkZFdnU3RhdGUoJ3dlYnJ0Yy1lbmFibGVkJyk7XG5cdH1cblxuXHRpZih3aWRnZXQgJiYgZGVmYXVsdHMuaW50cm8ubGVuZ3RoKSB7XG5cdFx0Ly8gQWRkIGxhbmd1YWdlcyB0byB0aGUgdGVtcGxhdGVcblx0XHRsYW5ncy5mb3JFYWNoKGZ1bmN0aW9uKGxhbmcpIHtcblx0XHRcdGlmKGZyYXNlc1tsYW5nXSAmJiBmcmFzZXNbbGFuZ10ubGFuZykge1xuXHRcdFx0XHRzZWxlY3RlZCA9IGxhbmcgPT09IGN1cnJMYW5nID8gJ3NlbGVjdGVkJyA6ICcnO1xuXHRcdFx0XHRvcHRpb25zICs9ICc8b3B0aW9uIHZhbHVlPVwiJytsYW5nKydcIiAnK3NlbGVjdGVkKycgPicrZnJhc2VzW2xhbmddLmxhbmcrJzwvb3B0aW9uPic7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Z2xvYmFsW2RlZmF1bHRzLnByZWZpeCsnSW50cm9Gb3JtJ10ubGFuZy5pbm5lckhUTUwgPSBvcHRpb25zO1xuXHR9XG5cblx0Ly8gV2lkZ2V0IGlzIGluaXRpYXRlZFxuXHRhcGkuZW1pdCgnd2lkZ2V0L2luaXQnKTtcbn1cblxuZnVuY3Rpb24gc2V0T2ZmZXIoKSB7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0c2hvd09mZmVyKHtcblx0XHRcdGZyb206IGRlZmF1bHRzLm9mZmVyLmZyb20gfHwgZnJhc2VzW2N1cnJMYW5nXS5UT1BfQkFSLnRpdGxlLFxuXHRcdFx0dGltZTogRGF0ZS5ub3coKSxcblx0XHRcdGNvbnRlbnQ6IGRlZmF1bHRzLm9mZmVyLnRleHQgfHwgZnJhc2VzW2N1cnJMYW5nXS5kZWZhdWx0X29mZmVyXG5cdFx0fSk7XG5cdH0sIGRlZmF1bHRzLm9mZmVyLmluU2Vjb25kcyA/IGRlZmF1bHRzLm9mZmVyLmluU2Vjb25kcyoxMDAwIDogMzAwMDApO1xufVxuXG5mdW5jdGlvbiBzaG93T2ZmZXIobWVzc2FnZSkge1xuXHQvLyBSZXR1cm4gaWYgdXNlciBhbHJlYWR5IGludGVyYWN0IHdpdGggdGhlIHdpZGdldFxuXHRpZih3aWRnZXRTdGF0ZS5zdGF0ZSAhPT0gJ29ubGluZScgfHwgaXNJbnRlcmFjdGVkKCkpIHJldHVybjtcblx0bmV3TWVzc2FnZShtZXNzYWdlKTtcblx0Ly8gbmV3TWVzc2FnZSh7IG1lc3NhZ2VzOiBbbWVzc2FnZV0gfSk7XG59XG5cbmZ1bmN0aW9uIHNldEludGVyYWN0ZWQoKXtcblx0aWYoIXN0b3JhZ2UuZ2V0U3RhdGUoJ2ludGVyYWN0ZWQnLCAnc2Vzc2lvbicpKSB7XG5cdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2ludGVyYWN0ZWQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJhY3RlZCgpe1xuXHRyZXR1cm4gc3RvcmFnZS5nZXRTdGF0ZSgnaW50ZXJhY3RlZCcsICdzZXNzaW9uJyk7XG59XG5cbmZ1bmN0aW9uIGluaXRDaGF0KCl7XG5cdHNob3dXaWRnZXQoKTtcblxuXHQvLyAvLyBpZiBjaGF0IGFscmVhZHkgc3RhcnRlZCBhbmQgd2lkZ2V0IHdhcyBtaW5pbWl6ZWQgLSBqdXN0IHNob3cgdGhlIHdpZGdldFxuXHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JywgJ2NhY2hlJykpIHJldHVybjtcblxuXHRpZighbGFuZ3MubGVuZ3RoKSB7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdH0gZWxzZSBpZihkZWZhdWx0cy5pbnRyby5sZW5ndGgpIHtcblx0XHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JykpIHtcblx0XHRcdHJlcXVlc3RDaGF0KHN0b3JhZ2UuZ2V0U3RhdGUoJ2NyZWRlbnRpYWxzJywgJ3Nlc3Npb24nKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN3aXRjaFBhbmUoJ2NyZWRlbnRpYWxzJyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlcXVlc3RDaGF0KHsgbGFuZzogY3VyckxhbmcgfSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVxdWVzdENoYXQoY3JlZGVudGlhbHMpe1xuXHRpZighY3JlZGVudGlhbHMudW5hbWUpIGNyZWRlbnRpYWxzLnVuYW1lID0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJykuc3BsaXQoJ18nKVswXTtcblx0XG5cdC8vIFNhdmUgdXNlciBsYW5ndWFnZSBiYXNlZCBvbiBwcmVmZXJhYmxlIGRpYWxvZyBsYW5ndWFnZVxuXHRpZihjcmVkZW50aWFscy5sYW5nICYmIGNyZWRlbnRpYWxzLmxhbmcgIT09IGN1cnJMYW5nICkge1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdsYW5nJywgY3JlZGVudGlhbHMubGFuZyk7XG5cdH1cblx0aWYoIWNyZWRlbnRpYWxzLmxhbmcpIHtcblx0XHRjcmVkZW50aWFscy5sYW5nID0gY3Vyckxhbmc7XG5cdH1cblx0XG5cdC8vIFNhdmUgY3JlZGVudGlhbHMgZm9yIGN1cnJlbnQgc2Vzc2lvblxuXHQvLyBJdCB3aWxsIGJlIHJlbW92ZWQgb24gc2Vzc2lvbiB0aW1lb3V0XG5cdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjcmVkZW50aWFscycsIGNyZWRlbnRpYWxzLCAnc2Vzc2lvbicpO1xuXG5cdHN0YXJ0Q2hhdCh7fSk7XG5cdGNsZWFyV2dNZXNzYWdlcygpO1xuXHRzd2l0Y2hQYW5lKCdtZXNzYWdlcycpO1xuXG5cdGFwaS5jaGF0UmVxdWVzdChjcmVkZW50aWFscyk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0Q2hhdChwYXJhbXMpe1xuXHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2hhdCcsIHRydWUpO1xuXHRpZihwYXJhbXMudGltZW91dCkge1xuXHRcdC8vIGRlYnVnLmxvZygnY2hhdCB0aW1lb3V0OiAnLCBwYXJhbXMudGltZW91dCk7XG5cdFx0Y2hhdFRpbWVvdXQgPSBhcGkuc2V0Q2hhdFRpbWVvdXQocGFyYW1zLnRpbWVvdXQpO1xuXHR9XG5cdC8vIGdldE1lc3NhZ2VzKCk7XG5cdGFkZFdnU3RhdGUoJ2NoYXQnKTtcbn1cblxuLy8gZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKXtcbi8vIFx0Ly8gZGVidWcubG9nKCdnZXQgbWVzc2FnZXMhJyk7XG5cdFxuLy8gXHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JykpXG4vLyBcdFx0bm9NZXNzYWdlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGdldE1lc3NhZ2VzLCA2MCoxMDAwKTtcblx0XG4vLyBcdGFwaS5nZXRNZXNzYWdlcyhmdW5jdGlvbigpIHtcbi8vIFx0XHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JykpIHtcbi8vIFx0XHRcdG1lc3NhZ2VzVGltZW91dCA9IHNldFRpbWVvdXQoZ2V0TWVzc2FnZXMsIGRlZmF1bHRzLmdldE1lc3NhZ2VzVGltZW91dCoxMDAwKTtcbi8vIFx0XHRcdGNsZWFyVGltZW91dChub01lc3NhZ2VzVGltZW91dCk7XG4vLyBcdFx0fVxuLy8gXHR9KTtcbi8vIH1cblxuZnVuY3Rpb24gc2VuZE1lc3NhZ2UocGFyYW1zKXtcblx0YXBpLnNlbmRNZXNzYWdlKHBhcmFtcyk7XG5cdC8vIGFwaS5zZW5kTWVzc2FnZShwYXJhbXMsIGZ1bmN0aW9uKGVycikge1xuXHQvLyBcdGlmKCFlcnIgJiYgd2lkZ2V0U3RhdGUuc291bmRzKSBhdWRpby5wbGF5KCdtZXNzYWdlX3NlbnQnKTtcblx0Ly8gfSk7XG5cblx0bmV3TWVzc2FnZSh7XG5cdFx0ZnJvbTogc3RvcmFnZS5nZXRTdGF0ZSgnY3JlZGVudGlhbHMnLCAnc2Vzc2lvbicpLnVuYW1lLFxuXHRcdHRpbWU6IERhdGUubm93KCksXG5cdFx0Y29udGVudDogcGFyYW1zLm1lc3NhZ2Vcblx0XHQvLyBoaWRkZW46IHRydWVcblx0XHQvLyBjbGFzc05hbWU6IGRlZmF1bHRzLnByZWZpeCsnLW1zZy11bmRlbGl2ZXJlZCdcblx0fSk7XG5cblx0aWYoY2hhdFRpbWVvdXQpIGNsZWFyVGltZW91dChjaGF0VGltZW91dCk7XG59XG5cbmZ1bmN0aW9uIG5ld01lc3NhZ2UobWVzc2FnZSl7XG5cdC8vIGRlYnVnLmxvZygnbmV3IG1lc3NhZ2VzIGFycml2ZWQhJywgcmVzdWx0KTtcblxuXHR2YXIgc3RyLFxuXHRcdGVscyA9IFtdLFxuXHRcdHRleHQsXG5cdFx0Y29tcGlsZWQsXG5cdFx0cGxheVNvdW5kID0gZmFsc2UsXG5cdFx0ZGVmYXVsdFVuYW1lID0gZmFsc2UsXG5cdFx0Y3JlZGVudGlhbHMgPSBzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykgfHwge30sXG5cdFx0YW5hbWUgPSBzdG9yYWdlLmdldFN0YXRlKCdhbmFtZScsICdzZXNzaW9uJyksXG5cdFx0dW5hbWUgPSBjcmVkZW50aWFscy51bmFtZSA/IGNyZWRlbnRpYWxzLnVuYW1lIDogJydcblx0XHRtZXNzYWdlc0NvbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlcy1jb250Jyk7XG5cblx0aWYodW5hbWUgPT09IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpLnNwbGl0KCdfJylbMF0pIHtcblx0XHRkZWZhdWx0VW5hbWUgPSB0cnVlO1xuXHR9XG5cblx0Ly8gcmVzdWx0Lm1lc3NhZ2VzLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSwgaW5kZXgpIHtcblx0XHRcblx0XHRtZXNzYWdlLmVudGl0eSA9IG1lc3NhZ2UuZnJvbSA9PT0gdW5hbWUgPyAndXNlcicgOiAnYWdlbnQnO1xuXHRcdC8vIG1lc3NhZ2UuZnJvbSA9IChtZXNzYWdlLmVudGl0eSA9PT0gJ3VzZXInICYmIGRlZmF1bHRVbmFtZSkgPyBmcmFzZXNbY3VyckxhbmddLmRlZmF1bHRfdXNlcl9uYW1lIDogbWVzc2FnZS5mcm9tO1xuXHRcdG1lc3NhZ2UuZnJvbSA9IChtZXNzYWdlLmVudGl0eSA9PT0gJ3VzZXInICYmIGRlZmF1bHRVbmFtZSkgPyAnJyA6IG1lc3NhZ2UuZnJvbTtcblx0XHRtZXNzYWdlLnRpbWUgPSBtZXNzYWdlLnRpbWUgPyBwYXJzZVRpbWUobWVzc2FnZS50aW1lKSA6IHBhcnNlVGltZShEYXRlLm5vdygpKTtcblxuXHRcdHRleHQgPSBwYXJzZU1lc3NhZ2UobWVzc2FnZS5jb250ZW50LCBtZXNzYWdlLmZpbGUsIG1lc3NhZ2UuZW50aXR5KTtcblxuXHRcdGlmKHRleHQudHlwZSA9PT0gJ2Zvcm0nKSB7XG5cblx0XHRcdGNvbXBpbGVkID0gY29tcGlsZVRlbXBsYXRlKCdmb3JtcycsIHtcblx0XHRcdFx0ZGVmYXVsdHM6IGRlZmF1bHRzLFxuXHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlLFxuXHRcdFx0XHRmb3JtOiB0ZXh0LmNvbnRlbnQsXG5cdFx0XHRcdGNyZWRlbnRpYWxzOiBjcmVkZW50aWFscyxcblx0XHRcdFx0ZnJhc2VzOiBmcmFzZXNbKGN1cnJMYW5nIHx8IGRlZmF1bHRzLmxhbmcpXSxcblx0XHRcdFx0XzogX1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmKGdsb2JhbFt0ZXh0LmNvbnRlbnQubmFtZV0pIGNsb3NlRm9ybSh7IGZvcm1OYW1lOiB0ZXh0LmNvbnRlbnQubmFtZSB9KTtcblx0XHRcdG1lc3NhZ2VzQ29udC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsICc8bGk+Jytjb21waWxlZCsnPC9saT4nKTtcblx0XHRcdG1lc3NhZ2VzQ29udC5zY3JvbGxUb3AgPSBtZXNzYWdlc0NvbnQuc2Nyb2xsSGVpZ2h0O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighbWVzc2FnZS5jb250ZW50KSByZXR1cm47XG5cdFx0XHRtZXNzYWdlLmNvbnRlbnQgPSB0ZXh0LmNvbnRlbnQ7XG5cdFx0XHRjb21waWxlZCA9IGNvbXBpbGVUZW1wbGF0ZSgnbWVzc2FnZScsIHsgZGVmYXVsdHM6IGRlZmF1bHRzLCBtZXNzYWdlOiBtZXNzYWdlIH0pO1xuXHRcdFx0bWVzc2FnZXNDb250Lmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgJzxsaSAnKyhtZXNzYWdlLmNsYXNzTmFtZSA/ICdjbGFzcz1cIicrbWVzc2FnZS5jbGFzc05hbWUrJ1wiJyA6ICcnICkrJz4nK2NvbXBpbGVkKyc8L2xpPicpO1xuXG5cdFx0XHQvLyBpZihpbmRleCA9PT0gcmVzdWx0Lm1lc3NhZ2VzLmxlbmd0aC0xKSB7XG5cdFx0XHRcdG9uTGFzdE1lc3NhZ2UoY29tcGlsZWQpO1xuXHRcdFx0Ly8gfVxuXG5cdFx0XHQvLyBOZWVkIGZvciBzZW5kaW5nIGRpYWxvZyB0byBlbWFpbFxuXHRcdFx0aWYoIW1lc3NhZ2UuaGlkZGVuKSBkaWFsb2cucHVzaChjb21waWxlZCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2F2ZSBhZ2VudCBuYW1lXG5cdFx0aWYobWVzc2FnZS5lbnRpdHkgPT09ICdhZ2VudCcgJiYgYW5hbWUgIT09IG1lc3NhZ2UuZnJvbSkge1xuXHRcdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2FuYW1lJywgbWVzc2FnZS5mcm9tLCAnc2Vzc2lvbicpO1xuXHRcdH1cblxuXHRcdGlmKG1lc3NhZ2UuZW50aXR5ICE9PSAndXNlcicpIHBsYXlTb3VuZCA9IHRydWU7XG5cblx0Ly8gfSk7XG5cblx0bWVzc2FnZXNDb250LnNjcm9sbFRvcCA9IG1lc3NhZ2VzQ29udC5zY3JvbGxIZWlnaHQ7XG5cdC8vIGlmKHBsYXlTb3VuZCkgcGxheU5ld01zZ1RvbmUoKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJVbmRlbGl2ZXJlZCgpe1xuXHR2YXIgdW5kZWxpdmVyZWQgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nK2RlZmF1bHRzLnByZWZpeCsnLW1zZy11bmRlbGl2ZXJlZCcpKTtcblx0aWYodW5kZWxpdmVyZWQgJiYgdW5kZWxpdmVyZWQubGVuZ3RoKSB7XG5cdFx0dW5kZWxpdmVyZWQuZm9yRWFjaChmdW5jdGlvbihtc2cpe1xuXHRcdFx0bXNnLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcGxheU5ld01zZ1RvbmUoKSB7XG5cdGF1ZGlvLnBsYXkoJ25ld19tZXNzYWdlJyk7XG59XG5cbi8qKlxuICogVmlzdWFsIG5vdGlmaWNhdGlvbiBhYm91dCBhIG5ldyBtZXNzYWdlIGZvbXIgYWdlbnQuXG4gKiBJdCBpcyBhbHNvIHVzZWQgZm9yIG9mZmVyIG5vdGlmaWNhdGlvblxuICogXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG1lc3NhZ2UgLSBOZXcgbWVzc2FnZSBjb250ZW50IFxuICovXG5mdW5jdGlvbiBvbkxhc3RNZXNzYWdlKG1lc3NhZ2Upe1xuXHR2YXIgbGFzdE1zZztcblx0aWYoIXdpZGdldFN0YXRlLmFjdGl2ZSkge1xuXHRcdGxhc3RNc2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1sYXN0bXNnJyk7XG5cblx0XHQvLyBQcmVmaXhlZEV2ZW50KGxhc3RNc2csICdhbmltYXRpb25lbmQnLCBbXCJ3ZWJraXRcIiwgXCJtb3pcIiwgXCJNU1wiLCBcIm9cIiwgXCJcIl0sIGZ1bmN0aW9uKGUpIHtcblx0XHQvLyBcdGJ0bi5jaGlsZHJlblswXS5zdHlsZS5oZWlnaHQgPSBlLnRhcmdldC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuXHRcdC8vIH0pO1xuXG5cdFx0bGFzdE1zZy5pbm5lckhUTUwgPSBtZXNzYWdlO1xuXHRcdC8vIGNoYW5nZVdnU3RhdGUoeyBzdGF0ZTogJ25vdGlmaWVkJyB9KTtcblx0XHRhZGRXZ1N0YXRlKCdub3RpZmllZCcpO1xuXHRcdHNldEJ1dHRvblN0eWxlKCdub3RpZmllZCcpO1xuXG5cdH1cbn1cblxuZnVuY3Rpb24gY29tcGlsZUVtYWlsKGNvbnRlbnQsIGNiKSB7XG5cdHZhciBjb21waWxlZCA9IGNvbXBpbGVUZW1wbGF0ZSgnZW1haWwnLCB7XG5cdFx0ZGVmYXVsdHM6IGRlZmF1bHRzLFxuXHRcdGNvbnRlbnQ6IGNvbnRlbnQsXG5cdFx0ZnJhc2VzOiBmcmFzZXNbKGN1cnJMYW5nIHx8IGRlZmF1bHRzLmxhbmcpXSxcblx0XHRfOiBfXG5cdH0pO1xuXG5cdGlmKGNiKSByZXR1cm4gY2IobnVsbCwgY29tcGlsZWQpO1xufVxuXG5mdW5jdGlvbiBzZW5kRGlhbG9nKHBhcmFtcyl7XG5cdHZhciBkaWFsb2dTdHIgPSBwYXJhbXMudGV4dC5qb2luKCcnKTtcblx0Y29tcGlsZUVtYWlsKGRpYWxvZ1N0ciwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHRpZihlcnIpIHJldHVybjtcblx0XHRwYXJhbXMudGV4dCA9IHJlc3VsdDtcblx0XHRhcGkuc2VuZEVtYWlsKHBhcmFtcyk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kQ29tcGxhaW4ocGFyYW1zKXtcblx0dmFyIGJvZHkgPSBbXTtcblx0Ly8gVE9ETzogZXhwbGFpbi4uLlxuXHR2YXIgY29tcGxhaW4gPSBjb21waWxlVGVtcGxhdGUoJ21lc3NhZ2UnLCB7XG5cdFx0ZGVmYXVsdHM6IGRlZmF1bHRzLFxuXHRcdG1lc3NhZ2U6IHtcblx0XHRcdGZyb206IGZyYXNlc1tjdXJyTGFuZ10uRU1BSUxfU1VCSkVDVFMuY29tcGxhaW4rJyAnK3BhcmFtcy5lbWFpbCxcblx0XHRcdGNvbnRlbnQ6IHBhcmFtcy50ZXh0LFxuXHRcdFx0ZW50aXR5OiAnJyxcblx0XHRcdHRpbWU6ICcnXG5cdFx0fVxuXHR9KTtcblxuXHRib2R5ID0gYm9keS5jb25jYXQoXG5cdFx0Y29tcGxhaW4sXG5cdFx0Jzxicj48cCBjbGFzcz1cImgxXCI+JytmcmFzZXNbY3VyckxhbmddLkVNQUlMX1NVQkpFQ1RTLmRpYWxvZysnICcrZGVmYXVsdHMuaG9zdCsnPC9wPjxicj4nLFxuXHRcdGRpYWxvZ1xuXHQpLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XG5cdFx0cmV0dXJuIHByZXYuY29uY2F0KGN1cnIpO1xuXHR9KTtcblxuXHRjb21waWxlRW1haWwoYm9keSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHRpZihlcnIpIHJldHVybjtcblx0XHRwYXJhbXMudGV4dCA9IHJlc3VsdDtcblx0XHRhcGkuc2VuZEVtYWlsKHBhcmFtcyk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kUmVxdWVzdChwYXJhbXMsIGNiKSB7XG5cdC8vIFRPRE86IGV4cGxhaW4uLi5cblx0dmFyIG1zZyA9IGNvbXBpbGVUZW1wbGF0ZSgnbWVzc2FnZScsIHtcblx0XHRkZWZhdWx0czogZGVmYXVsdHMsXG5cdFx0bWVzc2FnZToge1xuXHRcdFx0ZnJvbTogZnJhc2VzW2N1cnJMYW5nXS5FTUFJTF9TVUJKRUNUUy5yZXF1ZXN0KycgJytwYXJhbXMudW5hbWUrJyAoJytwYXJhbXMuZW1haWwrJyknLFxuXHRcdFx0Y29udGVudDogcGFyYW1zLnRleHQsXG5cdFx0XHRlbnRpdHk6ICcnLFxuXHRcdFx0dGltZTogJydcblx0XHR9XG5cdH0pO1xuXG5cdGNvbXBpbGVFbWFpbChtc2csIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG5cdFx0aWYoZXJyKSByZXR1cm47XG5cdFx0cGFyYW1zLnRleHQgPSByZXN1bHQ7XG5cdFx0YXBpLnNlbmRFbWFpbChwYXJhbXMpO1xuXHRcdGlmKGNiKSBjYigpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gc3VibWl0U2VuZE1haWxGb3JtKGZvcm0sIGRhdGEpIHtcblx0dmFyIHBhcmFtcyA9IHt9LFxuXHRcdGZpbGU7XG5cblx0aWYoIWRhdGEuZW1haWwpIHtcblx0XHRhbGVydChmcmFzZXNbY3VyckxhbmddLkVSUk9SUy5lbWFpbCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZGF0YS5zdWJqZWN0ID0gZnJhc2VzW2N1cnJMYW5nXS5FTUFJTF9TVUJKRUNUUy5yZXF1ZXN0KycgJytkYXRhLmVtYWlsO1xuXG5cdGlmKGRhdGEuZmlsZSkge1xuXHRcdGZpbGUgPSBnZXRGaWxlQ29udGVudChmb3JtLmZpbGUsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRpZighZXJyKSB7XG5cdFx0XHRcdGRhdGEuZmlsZW5hbWUgPSByZXN1bHQuZmlsZW5hbWU7XG5cdFx0XHRcdGRhdGEuZmlsZWRhdGEgPSByZXN1bHQuZmlsZWRhdGE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWJ1Zy53YXJuKCdGaWxlIHdhc25cXCd0IHNlbnQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBkYXRhLmZpbGU7XG5cdFx0XHRzZW5kUmVxdWVzdChkYXRhLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0Zm9ybS5yZXNldCgpO1xuXHRcdFx0XHRjbG9zZVdpZGdldCgpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0c2VuZFJlcXVlc3QoZGF0YSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRmb3JtLnJlc2V0KCk7XG5cdFx0XHRjbG9zZVdpZGdldCgpO1xuXHRcdH0pO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHN1Ym1pdENsb3NlQ2hhdEZvcm0oZm9ybSwgZGF0YSl7XG5cdHZhciByYXRpbmcgPSAoZGF0YSAmJiBkYXRhLnJhdGluZykgPyBwYXJzZUludChkYXRhLnJhdGluZywgMTApIDogbnVsbDtcblx0aWYoZGF0YSAmJiBkYXRhLnNlbmREaWFsb2cpIHtcblx0XHRpZighZGF0YS5lbWFpbCkge1xuXHRcdFx0YWxlcnQoZnJhc2VzW2N1cnJMYW5nXS5FUlJPUlMuZW1haWwpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHQvLyBkZWJ1Zy5sb2coJ3NlbmQgZGlhbG9nJyk7XG5cdFx0c2VuZERpYWxvZyh7XG5cdFx0XHR0bzogZGF0YS5lbWFpbCxcblx0XHRcdHN1YmplY3Q6IGZyYXNlc1tjdXJyTGFuZ10uRU1BSUxfU1VCSkVDVFMuZGlhbG9nKycgJytkZWZhdWx0cy5ob3N0LFxuXHRcdFx0dGV4dDogZGlhbG9nIC8vIGdsb2JhbCB2YXJpYWJsZVxuXHRcdH0pO1xuXHR9XG5cdGlmKGRhdGEgJiYgZGF0YS50ZXh0KSB7XG5cdFx0aWYoIWRhdGEuZW1haWwpIHtcblx0XHRcdGFsZXJ0KGZyYXNlc1tjdXJyTGFuZ10uRVJST1JTLmVtYWlsKTtcblx0XHRcdHJldHVybjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gZGVidWcubG9nKCdzZW5kIGNvbXBsYWluIScpO1xuXHRcdFx0c2VuZENvbXBsYWluKHtcblx0XHRcdFx0ZW1haWw6IGRhdGEuZW1haWwsXG5cdFx0XHRcdHN1YmplY3Q6IGZyYXNlc1tjdXJyTGFuZ10uRU1BSUxfU1VCSkVDVFMuY29tcGxhaW4rJyAnK2RhdGEuZW1haWwsXG5cdFx0XHRcdHRleHQ6IGRhdGEudGV4dFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cdGlmKGNoYXRUaW1lb3V0KSBjbGVhclRpbWVvdXQoY2hhdFRpbWVvdXQpO1xuXHRpZihmb3JtKSBmb3JtLnJlc2V0KCk7XG5cdFxuXHRjbG9zZUNoYXQocmF0aW5nKTtcblx0Y2xvc2VXaWRnZXQoKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VDaGF0KHJhdGluZykge1xuXHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2hhdCcsIGZhbHNlKTtcblx0YXBpLmNsb3NlQ2hhdChyYXRpbmcpO1xuXHRyZW1vdmVXZ1N0YXRlKCdjaGF0Jyk7XG59XG5cbmZ1bmN0aW9uIG9uQ2hhdENsb3NlKCl7XG5cdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ3NoYXJlZCcsICdzZXNzaW9uJykpIGNvYnJvd3NpbmcudW5zaGFyZSgpO1xufVxuXG5mdW5jdGlvbiBvbkNoYXRUaW1lb3V0KCl7XG5cdC8vIGRlYnVnLmxvZygnY2hhdCB0aW1lb3V0IScpO1xuXHRzd2l0Y2hQYW5lKCdjbG9zZWNoYXQnKTtcblx0Y2xvc2VDaGF0KCk7XG59XG5cbmZ1bmN0aW9uIG9uQWdlbnRUeXBpbmcoKXtcblx0Ly8gZGVidWcubG9nKCdBZ2VudCBpcyB0eXBpbmchJyk7XG5cdGlmKCFhZ2VudElzVHlwaW5nVGltZW91dCkge1xuXHRcdGFkZFdnU3RhdGUoJ2FnZW50LXR5cGluZycpO1xuXHR9XG5cdGNsZWFyVGltZW91dChhZ2VudElzVHlwaW5nVGltZW91dCk7XG5cdGFnZW50SXNUeXBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRhZ2VudElzVHlwaW5nVGltZW91dCA9IG51bGw7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgnYWdlbnQtdHlwaW5nJyk7XG5cdFx0Ly8gZGVidWcubG9nKCdhZ2VudCBpcyBub3QgdHlwaW5nIGFueW1vcmUhJyk7XG5cdH0sIDUwMDApO1xufVxuXG5mdW5jdGlvbiBzZXRTZXNzaW9uVGltZW91dEhhbmRsZXIoKXtcblx0aWYoYXBpLmxpc3RlbmVyQ291bnQoJ3Nlc3Npb24vdGltZW91dCcpID49IDEpIHJldHVybjtcblx0YXBpLm9uY2UoJ3Nlc3Npb24vdGltZW91dCcsIGZ1bmN0aW9uICgpe1xuXHRcdGRlYnVnLmxvZygnU2Vzc2lvbiB0aW1lb3V0OicsIGRlZmF1bHRzKTtcblxuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0Y2xvc2VDaGF0KCk7XG5cdFx0fVxuXHRcdGlmKHdpZGdldCkge1xuXHRcdFx0YWRkV2dTdGF0ZSgndGltZW91dCcpO1xuXHRcdFx0Y2xvc2VXaWRnZXQoKTtcblx0XHR9XG5cdFx0Y2hhbmdlV2dTdGF0ZSh7IHN0YXRlOiAndGltZW91dCcgfSk7XG5cdFx0Ly8gd2lkZ2V0U3RhdGUuc3RhdGUgPSAndGltZW91dCc7XG5cdFx0Ly8gYWRkV2dTdGF0ZSgndGltZW91dCcpO1xuXHRcdHNldEJ1dHRvblN0eWxlKCd0aW1lb3V0Jyk7XG5cdFx0c3RvcmFnZS5yZW1vdmVTdGF0ZSgnc2lkJyk7XG5cblx0XHQvLyBpZihwYXJhbXMgJiYgcGFyYW1zLm1ldGhvZCA9PT0gJ3VwZGF0ZUV2ZW50cycpIHtcblx0XHRpZihnZXRMYW5ndWFnZXNJbnRlcnZhbCkgY2xlYXJJbnRlcnZhbChnZXRMYW5ndWFnZXNJbnRlcnZhbCk7XG5cdFx0aWYobWVzc2FnZXNUaW1lb3V0KSBjbGVhclRpbWVvdXQobWVzc2FnZXNUaW1lb3V0KTtcblxuXHRcdGlmKGRlZmF1bHRzLnJlQ3JlYXRlU2Vzc2lvbikge1xuXHRcdFx0aW5pdE1vZHVsZSgpO1xuXHRcdH1cblx0XHQvLyB9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q2FsbCgpe1xuXHRzd2l0Y2hQYW5lKCdjYWxsQWdlbnQnKTtcblx0V2ViUlRDLmF1ZGlvY2FsbChkZWZhdWx0cy5jaGFubmVscy53ZWJydGMuaG90bGluZSk7XG5cdC8vIFdlYlJUQy5hdWRpb2NhbGwoJ3NpcDonK2NoYW5uZWxzLndlYnJ0Yy5ob3RsaW5lKydAJytzZXJ2ZXJVcmwuaG9zdCk7XG59XG5cbmZ1bmN0aW9uIGluaXRGYWxsYmFja0NhbGwoKXtcblx0c3dpdGNoUGFuZSgnY2FsbEFnZW50RmFsbGJhY2snKTtcbn1cblxuZnVuY3Rpb24gaW5pdENhbGxiYWNrKCl7XG5cdHN3aXRjaFBhbmUoJ2NhbGxiYWNrJyk7XG59XG5cbmZ1bmN0aW9uIHNldENhbGxiYWNrKCl7XG5cdHZhciBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbGJhY2stc2V0dGluZ3MnKSxcblx0XHRmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pLFxuXHRcdGNiU3Bpbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNwaW5uZXInKSxcblx0XHRjYlNlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsYmFjay1zZW50Jyk7XG5cdFxuXHRmb3JtRGF0YS5waG9uZSA9IGZvcm1EYXRhLnBob25lID8gZm9ybWF0UGhvbmVOdW1iZXIoZm9ybURhdGEucGhvbmUpIDogbnVsbDtcblxuXHRpZighZm9ybURhdGEucGhvbmUgfHwgZm9ybURhdGEucGhvbmUubGVuZ3RoIDwgMTApIHtcblx0XHRyZXR1cm4gYWxlcnQoZnJhc2VzW2N1cnJMYW5nXS5FUlJPUlMudGVsKTtcblx0fVxuXG5cdGZvcm1EYXRhLnRpbWUgPSBwYXJzZUZsb2F0KGZvcm1EYXRhLnRpbWUpO1xuXHRcblx0aWYoZm9ybURhdGEudGltZSA8PSAwKSByZXR1cm47XG5cblx0Zm9ybURhdGEudGltZSA9IERhdGUubm93KCkgKyAoZm9ybURhdGEudGltZSAqIDYwICogMTAwMCk7XG5cdGZvcm1EYXRhLnRhc2sgPSBkZWZhdWx0cy5jaGFubmVscy5jYWxsYmFjay50YXNrO1xuXHRkZWJ1Zy5sb2coJ3NldENhbGxiYWNrIGRhdGE6ICcsIGZvcm1EYXRhKTtcblxuXHRmb3JtLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdGNiU3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXG5cdGFwaS5yZXF1ZXN0Q2FsbGJhY2soZm9ybURhdGEpO1xuXHQvLyBhcGkucmVxdWVzdENhbGxiYWNrKGZvcm1EYXRhLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHQvLyBcdGRlYnVnLmxvZygnc2V0Q2FsbGJhY2sgcmVzdWx0OiAnLCBlcnIsIHJlc3VsdCk7XG5cblx0Ly8gXHRjYlNwaW5uZXIuY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0Ly8gXHRmb3JtLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0Ly8gXHRpZihlcnIpIHJldHVybjtcblx0XHRcblx0Ly8gXHRzd2l0Y2hQYW5lKCdjYWxsYmFja1NlbnQnKTtcblx0Ly8gfSk7XG5cblx0Zm9ybS5yZXNldCgpO1xufVxuXG5mdW5jdGlvbiBvbkNhbGxiYWNrUmVxdWVzdGVkKCkge1xuXHR2YXIgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNldHRpbmdzJyksXG5cdFx0Y2JTcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbGJhY2stc3Bpbm5lcicpO1xuXG5cdGNiU3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRmb3JtLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0aWYoZXJyKSByZXR1cm47XG5cdFxuXHRzd2l0Y2hQYW5lKCdjYWxsYmFja1NlbnQnKTtcbn1cblxuZnVuY3Rpb24gaW5pdENhbGxTdGF0ZShzdGF0ZSl7XG5cdGRlYnVnLmxvZygnaW5pdENhbGxTdGF0ZTogJywgc3RhdGUpO1xuXG5cdHZhciBzcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbC1zcGlubmVyJyksXG5cdFx0aW5mbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtaW5mbycpLFxuXHRcdHRleHRTdGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtc3RhdGUnKSxcblx0XHR0aW1lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtdGltZXInKSxcblx0XHR0cnlBZ2FpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLXRyeWFnYWluLWJ0bicpO1xuXG5cdGlmKHN0YXRlID09PSAnbmV3UlRDU2Vzc2lvbicpIHtcblx0XHRpbml0Q2FsbFN0YXRlKCdvbmNhbGwnKTtcblxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdjb25maXJtZWQnKSB7XG5cdFx0dGV4dFN0YXRlLmlubmVyVGV4dCA9IGZyYXNlc1tjdXJyTGFuZ10uUEFORUxTLkFVRElPX0NBTEwuY2FsbGluZ19hZ2VudDtcblx0XHRpbmZvLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRyeUFnYWluLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAncmluZ2luZycpIHtcblx0XHRzZXRUaW1lcih0aW1lciwgJ2luaXQnLCAwKTtcblx0XHR0aW1lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdGF1ZGlvLnBsYXkoJ3JpbmdvdXRfbG9vcCcsIHRydWUpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2Nvbm5lY3RlZCcpIHtcblx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzW2N1cnJMYW5nXS5QQU5FTFMuQVVESU9fQ0FMTC5jb25uZWN0ZWRfd2l0aF9hZ2VudDtcblx0XHRzZXRUaW1lcih0aW1lciwgJ3N0YXJ0JywgMCk7XG5cdFx0YXVkaW8uc3RvcCgpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2VuZGVkJykge1xuXHRcdHRleHRTdGF0ZS5pbm5lclRleHQgPSBmcmFzZXNbY3VyckxhbmddLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfZW5kZWQ7XG5cdFx0c2V0VGltZXIodGltZXIsICdzdG9wJyk7XG5cdFx0aW5pdENhbGxTdGF0ZSgnb25jYWxsZW5kJyk7XG5cdFx0XG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2ZhaWxlZCcgfHwgc3RhdGUgPT09ICdjYW5jZWxlZCcpIHtcblx0XHRpZihzdGF0ZSA9PT0gJ2ZhaWxlZCcpIHtcblx0XHRcdHRleHRTdGF0ZS5pbm5lclRleHQgPSBmcmFzZXNbY3VyckxhbmddLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfZmFpbGVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzW2N1cnJMYW5nXS5QQU5FTFMuQVVESU9fQ0FMTC5jYWxsX2NhbmNlbGVkO1xuXHRcdH1cblx0XHRpbmZvLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRpbWVyLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0dHJ5QWdhaW4uY2xhc3NMaXN0LnJlbW92ZShkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0XHRpbml0Q2FsbFN0YXRlKCdvbmNhbGxlbmQnKTtcblx0XHRhdWRpby5wbGF5KCdidXN5Jyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAnb25jYWxsJykge1xuXHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gJ1lvdXIgY29ubmVjdGlvbiBpcyBpbiBwcm9ncmVzcy4gRG8geW91IHJlYWx5IHdhbnQgdG8gY2xvc2UgaXQ/Jztcblx0XHR9O1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjYWxsJywgdHJ1ZSwgJ2NhY2hlJyk7XG5cdFx0YWRkV2dTdGF0ZSgnd2VicnRjLWNhbGwnKTtcblxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdvbmNhbGxlbmQnKSB7XG5cdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gbnVsbDtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnY2FsbCcsIGZhbHNlLCAnY2FjaGUnKTtcblx0XHRyZW1vdmVXZ1N0YXRlKCd3ZWJydGMtY2FsbCcpO1xuXHRcdC8vIHN0b3BSaW5nVG9uZSgpO1xuXG5cdH0gZWxzZSBpZignaW5pdCcpIHtcblx0XHRpbmZvLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRyeUFnYWluLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0VGltZXIodGltZXIsIHN0YXRlLCBzZWNvbmRzKXtcblx0dmFyIHRpbWUgPSBzZWNvbmRzO1xuXHRpZihzdGF0ZSA9PT0gJ3N0YXJ0Jykge1xuXHRcdHRpbWVyVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuXHRcdFx0dGltZSA9IHRpbWUrMTtcblx0XHRcdHRpbWVyLnRleHRDb250ZW50ID0gY29udmVydFRpbWUodGltZSk7XG5cdFx0fSwgMTAwMCk7XG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ3N0b3AnKSB7XG5cdFx0Y2xlYXJJbnRlcnZhbCh0aW1lclVwZGF0ZUludGVydmFsKTtcblx0fSBlbHNlIGlmKHN0YXRlID09PSAnaW5pdCcpIHtcblx0XHR0aW1lci50ZXh0Q29udGVudCA9IGNvbnZlcnRUaW1lKDApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGVuZENhbGwoKXtcblx0aWYoV2ViUlRDLmlzRXN0YWJsaXNoZWQoKSB8fCBXZWJSVEMuaXNJblByb2dyZXNzKCkpIHtcblx0XHRXZWJSVEMudGVybWluYXRlKCk7XG5cdH0gZWxzZSB7XG5cdFx0Y2xvc2VXaWRnZXQoKTtcblx0XHRpbml0Q2FsbFN0YXRlKCdpbml0Jyk7XG5cdH1cbn1cblxuLy8gZnVuY3Rpb24gcGxheVJpbmdUb25lKCl7XG4vLyBcdGlmKHJpbmdUb25lSW50ZXJ2YWwpIHJldHVybjtcbi8vIFx0cmluZ1RvbmVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4vLyBcdFx0cmluZ1RvbmUucGxheSgpO1xuLy8gXHR9LCAzMDAwKTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gc3RvcFJpbmdUb25lKCl7XG4vLyBcdGNsZWFySW50ZXJ2YWwocmluZ1RvbmVJbnRlcnZhbCk7XG4vLyB9XG5cbi8qKlxuICogT3BlbiB3ZWIgY2hhdCB3aWRnZXQgaW4gYSBuZXcgd2luZG93XG4gKi9cbmZ1bmN0aW9uIG9wZW5XaWRnZXQoKXtcblx0ZGVidWcubG9nKCdvcGVuIHdpZGdldDogJywgc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJykpO1xuXHR2YXIgb3B0cyA9IHt9O1xuXHRcblx0aWYoIXdpZGdldFdpbmRvdyB8fCB3aWRnZXRXaW5kb3cuY2xvc2VkKSB7XG5cblx0XHRfLm1lcmdlKG9wdHMsIGRlZmF1bHRzKTtcblxuXHRcdG9wdHMud2lkZ2V0ID0gdHJ1ZTtcblx0XHQvLyBzZXQgZXh0ZXJuYWwgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IHRoZSBtb2R1bGUgbG9hZHMgbm90IGluIHRoZSBtYWluIHdpbmRvd1xuXHRcdG9wdHMuZXh0ZXJuYWwgPSB0cnVlO1xuXG5cdFx0d2lkZ2V0V2luZG93ID0gd2luZG93Lm9wZW4oJycsICd3Y2hhdCcsIGRlZmF1bHRzLndpZGdldFdpbmRvd09wdGlvbnMpO1xuXHRcdHdpZGdldFdpbmRvdyA9IGNvbnN0cnVjdFdpbmRvdyh3aWRnZXRXaW5kb3cpO1xuXHRcdC8vIHdpZGdldFdpbmRvd1tnbG9iYWxTZXR0aW5nc10gPSBvcHRzO1xuXHRcdFxuXHRcdC8vIHdpZGdldFdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCd3Y2hhdF9vcHRpb25zJywgSlNPTi5zdHJpbmdpZnkob3B0cykpO1xuXG5cdFx0Ly8gV2FpdCB3aGlsZSB0aGUgc2NyaXB0IGlzIGxvYWRlZCwgXG5cdFx0Ly8gdGhlbiBpbml0IG1vZHVsZSBpbiB0aGUgY2hpbGQgd2luZG93XG5cdFx0Xy5wb2xsKGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gd2lkZ2V0V2luZG93LldjaGF0ICE9PSB1bmRlZmluZWQ7XG5cdFx0fSwgZnVuY3Rpb24oKXtcblx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUgPSB3aWRnZXRXaW5kb3cuV2NoYXQob3B0cyk7XG5cdFx0XHR3aWRnZXRXaW5kb3cuTW9kdWxlLm9uKCd3aWRnZXQvaW5pdCcsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUuaW5pdFdpZGdldFN0YXRlKCk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0LyogXG5cdFx0XHQqIFByb3h5IGFsbCBldmVudHMgdGhhdCBpcyBlbWl0dGVkIGluIHRoZSBjaGlsZCB3aW5kb3dcblx0XHRcdCogdG8gdGhlIG1haW4gd2luZG93LCBidXQgd2l0aCB0aGUgJ3dpbmRvdy8nIHByZWZpeCBiZWZvcmUgdGhlIGV2ZW50IG5hbWUuXG5cdFx0XHQqIFNvLCBmb3IgZXhhbXBsZSwgJ2NoYXQvc3RhcnQnIGV2ZW50IGluIHRoZSBjaGlsZCB3aW5kb3csXG5cdFx0XHQqIHdvdWxkIGJlICd3aW5kb3cvY2hhdC9zdGFydCcgaW4gdGhlIG1haW4gd2luZG93IFxuXHRcdFx0Ki9cblx0XHRcdF8uZm9yRWFjaChhcGkuX2V2ZW50cywgZnVuY3Rpb24odmFsdWUsIGtleSwgY29sbCl7XG5cdFx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUub24oa2V5LCBmdW5jdGlvbihwYXJhbXMpe1xuXHRcdFx0XHRcdHBhcmFtcy51cmwgPSBnbG9iYWwubG9jYXRpb24uaHJlZjtcblx0XHRcdFx0XHRhcGkuZW1pdCgnd2luZG93Lycra2V5LCBwYXJhbXMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3aWRnZXRXaW5kb3cuTW9kdWxlLmluaXRNb2R1bGUoKTtcblxuXHRcdH0sIGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zb2xlLndhcm4oJ1djaGF0IG1vZHVsZSB3YXMgbm90IGluaXRpYXRlZCBkdWUgdG8gbmV0d29yayBjb25uZWN0aW9uIGlzc3Vlcy4nKTtcblx0XHR9LCAxMjAwMDApO1xuXHRcdFxuXHRcdHdpZGdldFdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL2Nsb3NlIGNoYXQgaWYgdXNlciBjbG9zZSB0aGUgd2lkZ2V0IHdpbmRvd1xuXHRcdFx0Ly93aXRob3V0IGVuZGluZyBhIGRpYWxvZ1xuXHRcdFx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcsICdzdG9yYWdlJykpIGNsb3NlQ2hhdCgpO1xuXHRcdH07XG5cdH1cblx0aWYod2lkZ2V0V2luZG93LmZvY3VzKSB3aWRnZXRXaW5kb3cuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0V2luZG93KHdpbmRvd09iamVjdCl7XG5cdHZhciBsb2FkZXIsXG5cdHNjcmlwdCxcblx0bGluayxcblx0Y2hhcnNldCxcblx0dmlld3BvcnQsXG5cdHRpdGxlLFxuXHRjdXJyTGFuZyA9IGN1cnJMYW5nIHx8IGRldGVjdExhbmd1YWdlKCksXG5cdGxvYWRlckVsZW1lbnRzID0gd2luZG93T2JqZWN0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRsb2FkZXJTdHlsZXMgPSBjcmVhdGVTdHlsZXNoZWV0KHdpbmRvd09iamVjdCwgJ3N3Yy1sb2FkZXItc3R5bGVzJyksXG5cdGhlYWQgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcblx0Ym9keSA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXG5cdGxvYWRlckVsZW1lbnRzLmNsYXNzTmFtZSA9IFwic3djLXdpZGdldC1sb2FkZXJcIjtcblx0bG9hZGVyRWxlbWVudHMuaW5uZXJIVE1MID0gXCI8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cIjtcblxuXHR2aWV3cG9ydCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdHZpZXdwb3J0Lm5hbWUgPSAndmlld3BvcnQnO1xuXHR2aWV3cG9ydC5jb250ZW50ID0gJ3dpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIHVzZXItc2NhbGFibGU9MCc7XG5cblx0Y2hhcnNldCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdGNoYXJzZXQuc2V0QXR0cmlidXRlKCdjaGFyc2V0JywgJ3V0Zi04Jyk7XG5cblx0dGl0bGUgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGl0bGUnKTtcblx0dGl0bGUudGV4dENvbnRlbnQgPSBmcmFzZXNbY3VyckxhbmddLlRPUF9CQVIudGl0bGU7XG5cblx0Ly8gbG9hZGVyID0gd2luZG93T2JqZWN0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHQvLyBsb2FkZXIuc3JjID0gZGVmYXVsdHMuY2xpZW50UGF0aCsnbG9hZGVyLmpzJztcblxuXHRzY3JpcHQgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdHNjcmlwdC5zcmMgPSBkZWZhdWx0cy5jbGllbnRQYXRoKyd3Y2hhdC5taW4uanMnO1xuXHRzY3JpcHQuY2hhcnNldCA9ICdVVEYtOCc7XG5cblx0aGVhZC5hcHBlbmRDaGlsZCh2aWV3cG9ydCk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQoY2hhcnNldCk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXHRoZWFkLmFwcGVuZENoaWxkKGxvYWRlclN0eWxlcyk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuXHRib2R5LmlkID0gJ3N3Yy13Zy13aW5kb3cnO1xuXHRib2R5LmFwcGVuZENoaWxkKGxvYWRlckVsZW1lbnRzKTtcblx0Ly8gYm9keS5hcHBlbmRDaGlsZChsb2FkZXIpO1xuXG5cdGFkZExvYWRlclJ1bGVzKGhlYWQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N0eWxlJylbMF0pO1xuXG5cdHJldHVybiB3aW5kb3dPYmplY3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0eWxlc2hlZXQod2luZG93T2JqZWN0LCBpZCl7XG5cdC8vIENyZWF0ZSB0aGUgPHN0eWxlPiB0YWdcblx0XHR2YXIgc3R5bGUgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXHRcdHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuXHRcdGlmKGlkKSBzdHlsZS5pZCA9IGlkO1xuXG5cdFx0Ly8gV2ViS2l0IGhhY2sgOihcblx0XHRzdHlsZS5hcHBlbmRDaGlsZCh3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIikpO1xuXG5cdFx0cmV0dXJuIHN0eWxlO1xufVxuXG5mdW5jdGlvbiBhZGRMb2FkZXJSdWxlcyhzdHlsZSl7XG5cdHZhciB0aGVSdWxlcyA9IFtcblx0XHRcImJvZHkgeyBtYXJnaW46MDsgYmFja2dyb3VuZC1jb2xvcjogI2VlZTsgfVwiLFxuXHRcdFwiQGtleWZyYW1lcyBwcmVsb2FkaW5nIHtcIixcblx0XHRcdFwiMCB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFx0XCI1MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IH1cIixcblx0XHRcdFwiMTAwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFwifVwiLFxuXHRcdFwiQC13ZWJraXQta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCJALW1vei1rZXlmcmFtZXMgcHJlbG9hZGluZyB7XCIsXG5cdFx0XHRcIjAgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcdFwiNTAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyB9XCIsXG5cdFx0XHRcIjEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcIn1cIixcblx0XHRcIkAtbXMta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCJALW8ta2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCIuc3djLXdpZGdldC1sb2FkZXIge1wiLFxuXHRcdFx0XCJwb3NpdGlvbjogYWJzb2x1dGU7XCIsXG5cdFx0XHRcIndpZHRoOiAxMDAlO1wiLFxuXHRcdFx0XCJ0b3A6IDUwJTtcIixcblx0XHRcdFwibWFyZ2luLXRvcDogLTE4cHg7XCIsXG5cdFx0XHRcInRleHQtYWxpZ246IGNlbnRlcjtcIixcblx0XHRcIn1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciBzcGFuIHtcIixcblx0XHRcdFwiZGlzcGxheTogaW5saW5lLWJsb2NrO1wiLFxuXHRcdFx0XCJ3aWR0aDogMThweDtcIixcblx0XHRcdFwiaGVpZ2h0OiAxOHB4O1wiLFxuXHRcdFx0XCJib3JkZXItcmFkaXVzOiA1MCU7XCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3I6ICNmZmY7XCIsXG5cdFx0XHRcIm1hcmdpbjogM3B4O1wiLFxuXHRcdFwifVwiLFxuXHRcdFwiLnN3Yy13aWRnZXQtbG9hZGVyIHNwYW46bnRoLWxhc3QtY2hpbGQoMSkgeyAtd2Via2l0LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgLW1vei1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4xcyBsaW5lYXIgaW5maW5pdGU7IC1tcy1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4xcyBsaW5lYXIgaW5maW5pdGU7IC1vLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuMXMgbGluZWFyIGluZmluaXRlOyB9XCIsXG5cdFx0XCIuc3djLXdpZGdldC1sb2FkZXIgc3BhbjpudGgtbGFzdC1jaGlsZCgyKSB7IC13ZWJraXQtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyAtbW96LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjNzIGxpbmVhciBpbmZpbml0ZTsgLW1zLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjNzIGxpbmVhciBpbmZpbml0ZTsgLW8tYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyBhbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4zcyBsaW5lYXIgaW5maW5pdGU7IH1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciBzcGFuOm50aC1sYXN0LWNoaWxkKDMpIHsgLXdlYmtpdC1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IC1tb3otYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuNXMgbGluZWFyIGluZmluaXRlOyAtbXMtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuNXMgbGluZWFyIGluZmluaXRlOyAtby1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IGFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjVzIGxpbmVhciBpbmZpbml0ZTsgfVwiLFxuXHRdLmpvaW4oXCIgXCIpO1xuXG5cdHN0eWxlLmlubmVySFRNTCA9IHRoZVJ1bGVzO1xufVxuXG4vKipcbiAqIFNldCBXaWRnZXQgZXZlbnQgbGlzdGVuZXJzXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHdpZGdldCAtIFdpZGdldCBIVE1MIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gc2V0TGlzdGVuZXJzKHdpZGdldCl7XG5cdC8vIHZhciBzZW5kTXNnQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4Kyctc2VuZC1tZXNzYWdlJyksXG5cdHZhciBmaWxlU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctZmlsZS1zZWxlY3QnKTtcblx0dmFyIHRleHRGaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2UtdGV4dCcpO1xuXHR2YXIgaW5wdXRzID0gW10uc2xpY2UuY2FsbCh3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLicrZGVmYXVsdHMucHJlZml4KyctaW5wdXRmaWxlJykpO1xuXHR2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctYnRuLWNvbnQnKTtcblx0dmFyIHBhbmVzID0gW10uc2xpY2UuY2FsbCh3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLicrZGVmYXVsdHMucHJlZml4Kyctd2ctcGFuZScpKTtcblx0dmFyIG1lc3NhZ2VzQ29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblxuXHRpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihpbnB1dCl7XG5cdFx0dmFyIGxhYmVsID0gaW5wdXQubmV4dEVsZW1lbnRTaWJsaW5nLFxuXHRcdFx0bGFiZWxWYWwgPSBsYWJlbC50ZXh0Q29udGVudDtcblxuXHRcdGFkZEV2ZW50KGlucHV0LCAnY2hhbmdlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgZmlsZU5hbWUgPSBlLnRhcmdldC52YWx1ZS5zcGxpdCggJ1xcXFwnICkucG9wKCk7XG5cdFx0XHRpZihmaWxlTmFtZSlcblx0XHRcdFx0bGFiZWwudGV4dENvbnRlbnQgPSBmaWxlTmFtZTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0bGFiZWwudGV4dENvbnRlbnQgPSBsYWJlbFZhbDtcblx0XHR9KTtcblx0fSk7XG5cblx0YWRkRXZlbnQoYnRuLCAnY2xpY2snLCBidG5DbGlja0hhbmRsZXIpO1xuXHRhZGRFdmVudCh3aWRnZXQsICdjbGljaycsIHdnQ2xpY2tIYW5kbGVyKTtcblx0YWRkRXZlbnQod2lkZ2V0LCAnc3VibWl0Jywgd2dTdWJtaXRIYW5kbGVyKTtcblx0Ly8gYWRkRXZlbnQoc2VuZE1zZ0J0biwgJ2NsaWNrJywgd2dTZW5kTWVzc2FnZSk7XG5cdGFkZEV2ZW50KGZpbGVTZWxlY3QsICdjaGFuZ2UnLCB3Z1NlbmRGaWxlKTtcblx0YWRkRXZlbnQodGV4dEZpZWxkLCAna2V5cHJlc3MnLCB3Z1R5cGluZ0hhbmRsZXIpO1xuXHRhZGRFdmVudCh0ZXh0RmllbGQsICdmb2N1cycsIHdnVGV4dGFyZWFGb2N1c0hhbmRsZXIpO1xuXHRhZGRFdmVudCh0ZXh0RmllbGQsICdibHVyJywgd2dUZXh0YXJlYUJsdXJIYW5kbGVyKTtcblxuXHRhZGRFdmVudChnbG9iYWwsICdET01Nb3VzZVNjcm9sbCcsIHdnR2xvYmFsU2Nyb2xsSGFuZGxlcik7XG5cdGFkZEV2ZW50KGdsb2JhbCwgJ3doZWVsJywgd2dHbG9iYWxTY3JvbGxIYW5kbGVyKTtcblx0Ly8gd2luZG93Lm9udG91Y2htb3ZlICA9IHdnR2xvYmFsU2Nyb2xsSGFuZGxlcjsgLy8gbW9iaWxlXG5cblx0YWRkRXZlbnQod2lkZ2V0LCAnbW91c2VlbnRlcicsIG9uTW91c2VFbnRlcik7XG5cdGFkZEV2ZW50KHdpZGdldCwgJ21vdXNlbGVhdmUnLCBvbk1vdXNlTGVhdmUpO1xuXG5cdC8vIGlmKGRlZmF1bHRzLmJ1dHRvbkVsZW1lbnQpIFxuXHQvLyBcdGRlZmF1bHRzLmJ1dHRvbkVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwdWJsaWNBcGkub3BlbldpZGdldCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBzZXRIYW5kbGVycyhzZWxlY3Rvcikge1xuXHR2YXIgZm4gPSBkZWZhdWx0cy53aWRnZXQgPyBpbml0V2lkZ2V0U3RhdGUgOiBvcGVuV2lkZ2V0O1xuXHR2YXIgZWxzID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG5cdGVscy5tYXAoZnVuY3Rpb24oZWwpIHsgYWRkRXZlbnQoZWwsICdjbGljaycsIGZuKTsgcmV0dXJuIGVsOyB9KTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBXaWRnZXQgZXZlbnQgaGFuZGxlcnMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5mdW5jdGlvbiBvbk1vdXNlRW50ZXIoKSB7XG5cdG1vdXNlRm9jdXNlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIG9uTW91c2VMZWF2ZSgpIHtcblx0bW91c2VGb2N1c2VkID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHdnQ2xpY2tIYW5kbGVyKGUpe1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0LFxuXHRcdGhhbmRsZXIsXG5cdFx0cGFuZSxcblx0XHRocmVmLFxuXHRcdGRhdGFIcmVmO1xuXG5cdGlmKHRhcmcucGFyZW50Tm9kZS50YWdOYW1lID09PSAnQScgfHwgdGFyZy5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdCVVRUT04nKVxuXHRcdHRhcmcgPSB0YXJnLnBhcmVudE5vZGU7XG5cdFxuXHRoYW5kbGVyID0gdGFyZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtJytkZWZhdWx0cy5wcmVmaXgrJy1oYW5kbGVyJyk7XG5cdGRhdGFIcmVmID0gdGFyZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtJytkZWZhdWx0cy5wcmVmaXgrJy1saW5rJyk7XG5cblx0aWYoaGFuZGxlciA9PT0gJ2Nsb3NlV2lkZ2V0Jykge1xuXHRcdGNsb3NlV2lkZ2V0KCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnZmluaXNoJykge1xuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnKSkgc3dpdGNoUGFuZSgnY2xvc2VjaGF0Jyk7XG5cdFx0ZWxzZSBjbG9zZVdpZGdldCgpO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ3NlbmRNZXNzYWdlJykge1xuXHRcdHdnU2VuZE1lc3NhZ2UoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdvcGVuV2luZG93Jykge1xuXHRcdG9wZW5XaWRnZXQoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdyZWplY3RGb3JtJykge1xuXHRcdGFwaS5lbWl0KCdmb3JtL3JlamVjdCcsIHsgZm9ybU5hbWU6IF8uZmluZFBhcmVudCh0YXJnLCAnZm9ybScpLm5hbWUgfSk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnaW5pdENhbGwnKSB7XG5cdFx0aW5pdENhbGwoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0RmFsbGJhY2tDYWxsJykge1xuXHRcdGluaXRGYWxsYmFja0NhbGwoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0Q2FsbGJhY2snKSB7XG5cdFx0aW5pdENhbGxiYWNrKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnc2V0Q2FsbGJhY2snKSB7XG5cdFx0c2V0Q2FsbGJhY2soKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdpbml0Q2hhdCcpIHtcblx0XHRpbml0Q2hhdCgpO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ2VuZENhbGwnKSB7XG5cdFx0ZW5kQ2FsbCgpO1xuXHR9XG5cblx0aWYodGFyZy50YWdOYW1lID09PSAnQScpIHtcblx0XHRocmVmID0gdGFyZy5ocmVmO1xuXG5cdFx0aWYoZGF0YUhyZWYpIHtcblx0XHRcdGFwaS5saW5rRm9sbG93ZWQoZGF0YUhyZWYpO1xuXHRcdH0gZWxzZSBpZihocmVmLmluZGV4T2YoJyMnKSAhPT0gLTEpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHBhbmUgPSBocmVmLnN1YnN0cmluZyh0YXJnLmhyZWYuaW5kZXhPZignIycpKzEpO1xuXHRcdFx0aWYocGFuZSkgc3dpdGNoUGFuZShwYW5lKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gYnRuQ2xpY2tIYW5kbGVyKGUpe1xuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdHZhciB0YXJnID0gZS50YXJnZXQsXG5cdFx0Y3VyclRhcmcgPSBlLmN1cnJlbnRUYXJnZXQ7XG5cblx0Ly8gcmVtb3ZlIG5vdGlmaWNhdGlvbiBvZiBhIG5ldyBtZXNzYWdlXG5cdGlmKHRhcmcuaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLXVubm90aWZ5LWJ0bicpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdub3RpZmllZCcpO1xuXHRcdC8vIHJlc2V0IGJ1dHRvbiBoZWlnaHRcblx0XHQvLyByZXNldFN0eWxlcyhidG4uY2hpbGRyZW5bMF0pO1xuXHRcdHNldEJ1dHRvblN0eWxlKHdpZGdldFN0YXRlLnN0YXRlKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZihjdXJyVGFyZy5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctYnRuLWNvbnQnKSB7XG5cdFx0aW5pdFdpZGdldFN0YXRlKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gd2dHbG9iYWxTY3JvbGxIYW5kbGVyKGUpIHtcblx0dmFyIHRhcmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlcy1jb250Jyk7XG5cdHZhciBkaXIgPSBnZXRTY3JvbGxEaXJlY3Rpb24oZSk7XG5cdGlmKG1vdXNlRm9jdXNlZCkge1xuXHRcdGlmKHRhcmcuc2Nyb2xsVG9wID09PSAwICYmIGRpciA9PT0gJ3VwJykge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9IGVsc2UgaWYgKHRhcmcuc2Nyb2xsVG9wID49ICh0YXJnLnNjcm9sbEhlaWdodC10YXJnLmNsaWVudEhlaWdodCkgJiYgZGlyID09PSAnZG93bicpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbERpcmVjdGlvbihldmVudCkge1xuXHR2YXIgZGVsdGE7XG5cbiAgICBpZihldmVudC53aGVlbERlbHRhKSB7XG4gICAgICAgIGRlbHRhID0gZXZlbnQud2hlZWxEZWx0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YSA9IC0xICogZXZlbnQuZGVsdGFZO1xuICAgIH1cblxuICAgIGlmKGRlbHRhIDwgMCkge1xuICAgICAgICByZXR1cm4gXCJkb3duXCI7XG4gICAgfSBlbHNlIGlmKGRlbHRhID4gMCkge1xuICAgICAgICByZXR1cm4gXCJ1cFwiO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdFdpZGdldFN0YXRlKCl7XG5cdHZhciBjaGF0SW5Qcm9ncmVzcyA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnY2FjaGUnKTtcblx0dmFyIHdhc09wZW5lZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ29wZW5lZCcsICdzZXNzaW9uJyk7XG5cdHZhciBjYWxsSW5Qcm9ncmVzcyA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NhbGwnLCAnY2FjaGUnKTtcblx0Ly8gSWYgZWxlbWVudCBpcyBpbnRlcmFjdGVkLCB0aGVuIG5vIG5vdGlmaWNhdGlvbnMgb2YgYSBuZXcgbWVzc2FnZSBcblx0Ly8gd2lsbCBvY2N1ciBkdXJpbmcgY3VycmVudCBicm93c2VyIHNlc3Npb25cblx0c2V0SW50ZXJhY3RlZCgpO1xuXHQvLyBJZiB0aW1lb3V0IGlzIG9jY3VyZWQsIGluaXQgc2Vzc2lvbiBmaXJzdFxuXHRpZihoYXNXZ1N0YXRlKCd0aW1lb3V0JykpIHtcblx0XHRpbml0TW9kdWxlKCk7XG5cdH0gZWxzZSBpZihjaGF0SW5Qcm9ncmVzcyl7XG5cdFx0c2hvd1dpZGdldCgpO1xuXHR9IGVsc2UgaWYoIWxhbmdzLmxlbmd0aCl7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdFx0c2hvd1dpZGdldCgpO1xuXHR9IGVsc2UgaWYoZGVmYXVsdHMud2VicnRjRW5hYmxlZCl7XG5cdFx0Ly8gaWYgY2FsbCBpcyBpbiBwcm9ncmVzcyAtIGp1c3Qgc2hvdyB0aGUgd2lkZ2V0XG5cdFx0aWYoY2FsbEluUHJvZ3Jlc3MpIHtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIWRlZmF1bHRzLmNoYXQgJiYgIWRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2spIHtcblx0XHRcdFx0aW5pdENhbGwoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN3aXRjaFBhbmUoJ2Nob29zZUNvbm5lY3Rpb24nKTtcblx0XHRcdFx0c2hvd1dpZGdldCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmKGRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2spIHtcblx0XHRpZighZGVmYXVsdHMuY2hhdCAmJiAhZGVmYXVsdHMud2VicnRjRW5hYmxlZCkge1xuXHRcdFx0c3dpdGNoUGFuZSgnY2FsbGJhY2snKTtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3dpdGNoUGFuZSgnY2hvb3NlQ29ubmVjdGlvbicpO1xuXHRcdFx0c2hvd1dpZGdldCgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpbml0Q2hhdCgpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHdnU2VuZE1lc3NhZ2UoKXtcblx0dmFyIG1zZyxcblx0XHR0ZXh0YXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2UtdGV4dCcpO1xuXG5cdG1zZyA9IF8udHJpbSh0ZXh0YXJlYS52YWx1ZSk7XG5cdGlmKG1zZykge1xuXHRcdHNlbmRNZXNzYWdlKHsgbWVzc2FnZTogbXNnIH0pO1xuXHRcdHRleHRhcmVhLnZhbHVlID0gJyc7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0fVxuXHRpZighc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcpKSB7XG5cdFx0aW5pdENoYXQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3Z1R5cGluZ0hhbmRsZXIoZSl7XG5cdHZhciB0YXJnID0gZS50YXJnZXQ7XG5cdHZhciBjbG9uZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3djLW1lc3NhZ2UtdGV4dC1jbG9uZVwiKTtcblxuXHRpZihlLmtleUNvZGUgPT09IDEwIHx8IGUua2V5Q29kZSA9PT0gMTMpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0d2dTZW5kTWVzc2FnZSgpO1xuXHR9IGVsc2Uge1xuXHRcdGlmKCF1c2VySXNUeXBpbmdUaW1lb3V0KSB7XG5cdFx0XHR1c2VySXNUeXBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0dXNlcklzVHlwaW5nVGltZW91dCA9IG51bGw7XG5cdFx0XHRcdGFwaS51c2VySXNUeXBpbmcoKTtcblx0XHRcdH0sIDEwMDApO1xuXHRcdH1cblx0fVxuXG5cdGNsb25lLmlubmVyVGV4dCA9IHRhcmcudmFsdWU7XG5cdHRhcmcuc3R5bGUuaGVpZ2h0ID0gY2xvbmUuY2xpZW50SGVpZ2h0KydweCc7XG5cblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPj0gODAgJiYgIWhhc1dnU3RhdGUoJ3R5cGUtZXh0ZW5kJykpXG5cdC8vIFx0YWRkV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPCA4MCAmJiBoYXNXZ1N0YXRlKCd0eXBlLWV4dGVuZCcpKVxuXHQvLyBcdHJlbW92ZVdnU3RhdGUoJ3R5cGUtZXh0ZW5kJyk7XG59XG5cbmZ1bmN0aW9uIHdnVGV4dGFyZWFGb2N1c0hhbmRsZXIoZSkge1xuXHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cdHRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvcjtcbn1cblxuZnVuY3Rpb24gd2dUZXh0YXJlYUJsdXJIYW5kbGVyKGUpIHtcblx0dmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXHR0YXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIiNmZmZcIjtcbn1cblxuZnVuY3Rpb24gd2dTdWJtaXRIYW5kbGVyKGUpe1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0O1xuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdGlmKHRhcmcudGFnTmFtZSA9PT0gJ0ZPUk0nKVxuXHRcdGFwaS5lbWl0KCdmb3JtL3N1Ym1pdCcsIHsgZm9ybUVsZW1lbnQ6IHRhcmcsIGZvcm1EYXRhOiBnZXRGb3JtRGF0YSh0YXJnKSB9KTtcbn1cblxuZnVuY3Rpb24gd2dTZW5kRmlsZShlKXtcblx0dmFyIHRhcmcgPSBlLnRhcmdldDtcblx0dmFyIGZpbGUgPSBnZXRGaWxlQ29udGVudCh0YXJnLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdGRlYnVnLmxvZygnd2dTZW5kRmlsZTogJywgcmVzdWx0KTtcblx0XHRpZihlcnIpIHtcblx0XHRcdGFsZXJ0KCdGaWxlIHdhcyBub3Qgc2VudCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZW5kTWVzc2FnZSh7IG1lc3NhZ2U6IHJlc3VsdC5maWxlbmFtZSwgZmlsZTogcmVzdWx0LmZpbGVkYXRhIH0pO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogV2lkZ2V0IGVsZW1lbnRzIG1hbmlwdWxhdGlvbiAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIHN3aXRjaFBhbmUocGFuZSl7XG5cdC8vIHZhciBwYW5lSWQgPSBkZWZhdWx0cy5wcmVmaXgrJy0nK3BhbmUrJy1wYW5lJztcblx0dmFyIGF0dHIgPSAnZGF0YS0nK2RlZmF1bHRzLnByZWZpeCsnLXBhbmUnO1xuXHR2YXIgcGFuZXMgPSBbXS5zbGljZS5jYWxsKHdpZGdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1wYW5lJykpO1xuXHQvLyBkZWJ1Zy5sb2coJ3N3aXRjaFBhbmUgcGFuZXM6JywgcGFuZXMsICdwYW5lOiAnLCBwYW5lKTtcblx0cGFuZXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcblx0XHRpZihpdGVtLmdldEF0dHJpYnV0ZShhdHRyKSA9PT0gcGFuZSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGlmKCF3aWRnZXRTdGF0ZS5hY3RpdmUpIHNob3dXaWRnZXQoKTtcbn1cblxuZnVuY3Rpb24gY2hhbmdlV2dTdGF0ZShwYXJhbXMpe1xuXHRpZighd2lkZ2V0IHx8IHdpZGdldFN0YXRlLnN0YXRlID09PSBwYXJhbXMuc3RhdGUpIHJldHVybjtcblx0aWYocGFyYW1zLnN0YXRlID09PSAnb2ZmbGluZScpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdvbmxpbmUnKTtcblx0fSBlbHNlIGlmKHBhcmFtcy5zdGF0ZSA9PT0gJ29ubGluZScpIHtcblx0XHRyZW1vdmVXZ1N0YXRlKCdvZmZsaW5lJyk7XG5cdFx0XG5cdH1cblxuXHR2YXIgc3RhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1zdGF0ZScpO1xuXHRpZihzdGF0ZSkgc3RhdGUudGV4dENvbnRlbnQgPSBmcmFzZXNbY3VyckxhbmddLlRPUF9CQVIuU1RBVFVTW3BhcmFtcy5zdGF0ZV07XG5cblx0d2lkZ2V0U3RhdGUuc3RhdGUgPSBwYXJhbXMuc3RhdGU7XG5cdGFkZFdnU3RhdGUocGFyYW1zLnN0YXRlKTtcblx0c2V0QnV0dG9uU3R5bGUocGFyYW1zLnN0YXRlKTtcblx0YXBpLmVtaXQoJ3dpZGdldC9zdGF0ZWNoYW5nZScsIHsgc3RhdGU6IHBhcmFtcy5zdGF0ZSB9KTtcblx0XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldFN0YXRlKCkge1xuXHRyZXR1cm4gd2lkZ2V0U3RhdGUuc3RhdGUgPyB3aWRnZXRTdGF0ZS5zdGF0ZSA6ICgobGFuZ3MgJiZsYW5ncy5sZW5ndGgpID8gJ29ubGluZScgOiAnb2ZmbGluZScpO1xufVxuXG5mdW5jdGlvbiBzZXRTdHlsZXMoKSB7XG5cdHZhciB3Z0J0biA9IHdpZGdldC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1idG4nKTtcblxuXHRjb25zb2xlLmxvZygnc2V0U3R5bGVzOiAnLCB3Z0J0biwgZGVmYXVsdHMuYnV0dG9uU3R5bGVzKTtcblxuXHR3Z0J0bi5zdHlsZS5ib3JkZXJSYWRpdXMgPSBkZWZhdWx0cy5idXR0b25TdHlsZXMuYm9yZGVyUmFkaXVzO1xuXHR3Z0J0bi5zdHlsZS5ib3hTaGFkb3cgPSBkZWZhdWx0cy5idXR0b25TdHlsZXMuYm94U2hhZG93O1xufVxuXG4vLyBUT0RPOiBUaGlzIGlzIG5vdCBhIGdvb2Qgc29sdXRpb24gb3IgbWF5YmUgbm90IGEgZ29vZCBpbXBsZW1lbnRhdGlvblxuZnVuY3Rpb24gc2V0QnV0dG9uU3R5bGUoc3RhdGUpIHtcblx0Ly8gZGVidWcubG9nKCdzZXRCdXR0b25TdHlsZTogJywgc3RhdGUpO1xuXHRpZighd2lkZ2V0IHx8IGRlZmF1bHRzLmJ1dHRvblN0eWxlc1tzdGF0ZV0gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXHR2YXIgd2dCdG4gPSB3aWRnZXQucXVlcnlTZWxlY3RvcignLicrZGVmYXVsdHMucHJlZml4Kyctd2ctYnRuJyksXG5cdFx0YnRuSWNvbiA9IHdpZGdldC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy1idG4taWNvbicpO1xuXG5cdHdnQnRuLnN0eWxlLmJhY2tncm91bmQgPSBkZWZhdWx0cy5idXR0b25TdHlsZXNbc3RhdGVdLmJhY2tncm91bmRDb2xvcjtcblx0YnRuSWNvbi5zdHlsZS5jb2xvciA9IGRlZmF1bHRzLmJ1dHRvblN0eWxlc1tzdGF0ZV0uY29sb3IgfHwgZGVmYXVsdHMuYnV0dG9uU3R5bGVzLmNvbG9yO1xufVxuXG5mdW5jdGlvbiBhZGRXZ1N0YXRlKHN0YXRlKXtcblx0aWYod2lkZ2V0KSB3aWRnZXQuY2xhc3NMaXN0LmFkZChzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGhhc1dnU3RhdGUoc3RhdGUpe1xuXHRpZih3aWRnZXQpIHJldHVybiB3aWRnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKHN0YXRlKTtcblx0ZWxzZSByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVdnU3RhdGUoc3RhdGUpe1xuXHRpZih3aWRnZXQpIHdpZGdldC5jbGFzc0xpc3QucmVtb3ZlKHN0YXRlKTtcbn1cblxuZnVuY3Rpb24gc2hvd1dpZGdldCgpe1xuXHR2YXIgbWVzc2FnZXNDb250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbWVzc2FnZXMtY29udCcpO1xuXG5cdHdpZGdldFN0YXRlLmFjdGl2ZSA9IHRydWU7XG5cdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdvcGVuZWQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRhZGRXZ1N0YXRlKCdhY3RpdmUnKTtcblx0cmVtb3ZlV2dTdGF0ZSgnbm90aWZpZWQnKTtcblxuXHQvLyByZXNldCBidXR0b24gaGVpZ2h0XG5cdC8vIHJlc2V0U3R5bGVzKGJ0bi5jaGlsZHJlblswXSk7XG5cdHNldEJ1dHRvblN0eWxlKHdpZGdldFN0YXRlLnN0YXRlKTtcblxuXHRtZXNzYWdlc0NvbnQuc2Nyb2xsVG9wID0gbWVzc2FnZXNDb250LnNjcm9sbEhlaWdodDtcbn1cblxuZnVuY3Rpb24gY2xvc2VXaWRnZXQoKXtcblx0aWYod2luZG93Lm9wZW5lcikge1xuXHRcdHdpbmRvdy5jbG9zZSgpO1xuXHR9IGVsc2Uge1xuXHRcdHdpZGdldFN0YXRlLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdvcGVuZWQnLCBmYWxzZSwgJ3Nlc3Npb24nKTtcblx0XHRyZW1vdmVXZ1N0YXRlKCdhY3RpdmUnKTtcblx0fVxufVxuXG5mdW5jdGlvbiBvbkZvcm1TdWJtaXQocGFyYW1zKXtcblx0dmFyIGZvcm0gPSBwYXJhbXMuZm9ybUVsZW1lbnQ7XG5cdHZhciBmb3JtRGF0YSA9IHBhcmFtcy5mb3JtRGF0YTtcblx0Ly8gZGVidWcubG9nKCdvbkZvcm1TdWJtaXQ6ICcsIGZvcm0sIGZvcm1EYXRhKTtcblx0aWYoZm9ybS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsaWRhdGUtZm9ybScpKSB7XG5cdFx0dmFyIHZhbGlkID0gdmFsaWRhdGVGb3JtKGZvcm0pO1xuXHRcdGlmKCF2YWxpZCkgcmV0dXJuO1xuXHRcdC8vIGRlYnVnLmxvZygnb25Gb3JtU3VibWl0IHZhbGlkOiAnLCB2YWxpZCk7XG5cdH1cblx0aWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctY2xvc2VjaGF0LWZvcm0nKSB7XG5cdFx0c3VibWl0Q2xvc2VDaGF0Rm9ybShmb3JtLCBmb3JtRGF0YSk7XG5cdH0gZWxzZSBpZihmb3JtLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1zZW5kbWFpbC1mb3JtJykge1xuXHRcdHN1Ym1pdFNlbmRNYWlsRm9ybShmb3JtLCBmb3JtRGF0YSk7XG5cdH0gZWxzZSBpZihmb3JtLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1pbnRyby1mb3JtJykge1xuXHRcdHJlcXVlc3RDaGF0KGZvcm1EYXRhKTtcblx0fSBlbHNlIGlmKGZvcm0uaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtYnRuLWZvcm0nKXtcblx0XHRpbml0Q2FsbCgpO1xuXHR9IGVsc2UgaWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctY2hhdC1idG4tZm9ybScpe1xuXHRcdGluaXRDaGF0KCk7XG5cdH0gZWxzZSB7XG5cdFx0Y2xvc2VGb3JtKHsgZm9ybU5hbWU6IGZvcm0ubmFtZSB9LCB0cnVlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjbG9zZUZvcm0ocGFyYW1zLCBzdWJtaXQpe1xuXHR2YXIgZm9ybSA9IGdsb2JhbFtwYXJhbXMuZm9ybU5hbWVdO1xuXHRpZighZm9ybSkgcmV0dXJuIGZhbHNlO1xuXHRpZihzdWJtaXQpIHtcblx0XHRmb3JtLm91dGVySFRNTCA9ICc8cCBjbGFzcz1cIicrZGVmYXVsdHMucHJlZml4KyctdGV4dC1jZW50ZXJcIj4nK1xuXHRcdFx0XHRcdFx0XHQnPGkgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtc3VjY2VzcyAnK2RlZmF1bHRzLnByZWZpeCsnLWljb24tY2hlY2tcIj48L2k+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPiAnK2ZyYXNlc1tjdXJyTGFuZ10uRk9STVMuc3VibWl0dGVkKyc8L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L3A+Jztcblx0fSBlbHNlIHtcblx0XHRmb3JtLm91dGVySFRNTCA9ICc8cCBjbGFzcz1cIicrZGVmYXVsdHMucHJlZml4KyctdGV4dC1jZW50ZXJcIj4nK1xuXHRcdFx0XHRcdFx0XHQnPGkgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtZGFuZ2VyICcrZGVmYXVsdHMucHJlZml4KyctaWNvbi1yZW1vdmVcIj48L2k+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPiAnK2ZyYXNlc1tjdXJyTGFuZ10uRk9STVMuY2FuY2VsZWQrJzwvc3Bhbj4nK1xuXHRcdFx0XHRcdFx0JzwvcD4nO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVDb250ZW50KGVsZW1lbnQsIGNiKXtcblx0dmFyIGZpbGVzID0gZWxlbWVudC5maWxlcyxcblx0XHRmaWxlLFxuXHRcdGRhdGEsXG5cdFx0cmVhZGVyO1xuXG5cdGlmKCFmaWxlcy5sZW5ndGgpIHJldHVybjtcblx0aWYoIWdsb2JhbC5GaWxlUmVhZGVyKSB7XG5cdFx0aWYoY2IpIGNiKCdPQlNPTEVURV9CUk9XU0VSJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZmlsZSA9IGZpbGVzWzBdO1xuXG5cdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGRhdGEgPSBldmVudC50YXJnZXQucmVzdWx0O1xuXHRcdGRhdGEgPSBkYXRhLnN1YnN0cmluZyhkYXRhLmluZGV4T2YoJywnKSsxKTtcblx0XHRpZihjYikgY2IobnVsbCwgeyBmaWxlZGF0YTogZGF0YSwgZmlsZW5hbWU6IGZpbGUubmFtZSB9KTtcblx0fTtcblx0cmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGFwaS5lbWl0KCdFcnJvcicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdFx0aWYoY2IpIGNiKGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdH07XG5cdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xufVxuXG5mdW5jdGlvbiBjb21waWxlVGVtcGxhdGUodGVtcGxhdGUsIGRhdGEpe1xuXHR2YXIgY29tcGlsZWQgPSB0ZW1wbGF0ZXNbdGVtcGxhdGVdO1xuXHRyZXR1cm4gY29tcGlsZWQoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyV2dNZXNzYWdlcygpIHtcblx0dmFyIGNvbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlcy1jb250Jyk7XG5cdHZhciBjbG9uZSA9IGNvbnQuY2xvbmVOb2RlKCk7XG5cdGNvbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY2xvbmUsIGNvbnQpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIEhlbHBlciBmdW5jdGlvbnMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5mdW5jdGlvbiBkZXRlY3RMYW5ndWFnZSgpe1xuXHR2YXIgc3RvcmFnZUxhbmcgPSBzdG9yYWdlLmdldFN0YXRlKCdsYW5nJyksXG5cdFx0YXZhaWxhYmxlTGFuZ3MgPSBbXSxcblx0XHRsYW5nLFxuXHRcdHBhdGg7XG5cblx0aWYoc3RvcmFnZUxhbmcpIHtcblx0XHRsYW5nID0gc3RvcmFnZUxhbmc7XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBsaXN0IGF2YWlsYWJsZSBsYW5ndWFnZXMgYnkgdHJhbnNsYXRpb25zIGtleXNcblx0XHRmb3IodmFyIGtleSBpbiBmcmFzZXMpIHtcblx0XHRcdGF2YWlsYWJsZUxhbmdzLnB1c2goa2V5KTtcblx0XHR9XG5cblx0XHRpZihkZWZhdWx0cy5sYW5nRnJvbVVybCkge1xuXHRcdFx0Z2xvYmFsLmxvY2F0aW9uLnBhdGhuYW1lXG5cdFx0XHQuc3BsaXQoJy8nKVxuXHRcdFx0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRpZihhdmFpbGFibGVMYW5ncy5pbmRleE9mKGl0ZW0pICE9PSAtMSkge1xuXHRcdFx0XHRcdGxhbmcgPSBpdGVtO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZighbGFuZykge1xuXHRcdFx0bGFuZyA9IGRlZmF1bHRzLmxhbmcgfHwgKG5hdmlnYXRvci5sYW5ndWFnZSB8fCBuYXZpZ2F0b3IudXNlckxhbmd1YWdlKS5zcGxpdCgnLScpWzBdO1xuXHRcdFx0aWYoYXZhaWxhYmxlTGFuZ3MuaW5kZXhPZihsYW5nKSA9PT0gLTEpIGxhbmcgPSAnZW4nO1xuXHRcdH1cblx0fVxuXG5cdC8vIGRlYnVnLmxvZygnZGV0ZWN0ZWQgbGFuZzogJywgbGFuZyk7XG5cblx0cmV0dXJuIGxhbmc7XG59XG5cbmZ1bmN0aW9uIGJyb3dzZXJJc09ic29sZXRlKCkge1xuXHRkZWJ1Zy53YXJuKCdZb3VyIGJyb3dzZXIgaXMgb2Jzb2xldGUhJyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGltZSh0cykge1xuXHR2YXIgZGF0ZSA9IG5ldyBEYXRlKHRzKSxcblx0XHRob3VycyA9IGRhdGUuZ2V0SG91cnMoKSxcblx0XHRtaW51dGVzID0gZGF0ZS5nZXRNaW51dGVzKCksXG5cdFx0dGltZSA9IChob3VycyA8IDEwID8gJzAnK2hvdXJzIDogaG91cnMpICsgJzonICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyttaW51dGVzIDogbWludXRlcyk7XG5cblx0cmV0dXJuIHRpbWU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTWVzc2FnZSh0ZXh0LCBmaWxlLCBlbnRpdHkpe1xuXHR2YXIgZmlsZW5hbWUsIGZvcm07XG5cdGlmKGZpbGUpIHtcblx0XHRmaWxlbmFtZSA9IHRleHQuc3Vic3RyaW5nKHRleHQuaW5kZXhPZignXycpKzEpO1xuXHRcdGlmKGlzSW1hZ2UoZmlsZSkpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRcdGNvbnRlbnQ6ICc8YSBocmVmPVwiJythcGkub3B0aW9ucy5zZXJ2ZXIrJy9pcGNjLycrdGV4dCsnXCIgZG93bmxvYWQ9XCInK2ZpbGVuYW1lKydcIj4nICtcblx0XHRcdFx0XHRcdCc8aW1nIHNyYz1cIicrYXBpLm9wdGlvbnMuc2VydmVyKycvaXBjYy8nK3RleHQrJ1wiIGFsdD1cImZpbGUgcHJldmlld1wiIC8+JyArXG5cdFx0XHRcdFx0JzwvYT4nXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlOiAnZmlsZScsXG5cdFx0XHRcdGNvbnRlbnQ6ICc8YSBocmVmPVwiJythcGkub3B0aW9ucy5zZXJ2ZXIrJy9pcGNjLycrdGV4dCsnXCIgZG93bmxvYWQ9XCInK2ZpbGVuYW1lKydcIj4nK2ZpbGVuYW1lKyc8L2E+J1xuXHRcdFx0fTtcblx0XHR9XG5cdH0gZWxzZSBpZihlbnRpdHkgPT09ICdhZ2VudCcgJiYgbmV3IFJlZ0V4cCgnXnsuK30kJykudGVzdCh0ZXh0KSkge1xuXHRcdGZvcm1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0aWYoaXRlbS5uYW1lID09PSB0ZXh0LnN1YnN0cmluZygxLCB0ZXh0Lmxlbmd0aC0xKSkge1xuXHRcdFx0XHRmb3JtID0gaXRlbTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBmb3JtID8gJ2Zvcm0nIDogJ3RleHQnLFxuXHRcdFx0Y29udGVudDogZm9ybSA/IGZvcm0gOiB0ZXh0XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0Y29udGVudDogdGV4dC5yZXBsYWNlKC9cXG4vZywgJyA8YnI+ICcpLnNwbGl0KFwiIFwiKS5tYXAoY29udmVydExpbmtzKS5qb2luKFwiIFwiKS5yZXBsYWNlKCcgPGJyPiAnLCAnPGJyPicpXG5cdFx0fTtcblx0fVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGlua3ModGV4dCl7XG5cdHZhciBsZWZ0b3ZlcnMgPSAwO1xuXHR2YXIgaHJlZiA9IHRleHQ7XG5cdGlmKGlzTGluayh0ZXh0KSl7XG5cblx0XHR3aGlsZSghKGhyZWYuY2hhckF0KGhyZWYubGVuZ3RoLTEpLm1hdGNoKC9bYS16MC05XFwvXS9pKSkpe1xuXHRcdFx0aHJlZiA9IGhyZWYuc2xpY2UoMCwtMSk7XG5cdFx0XHRsZWZ0b3ZlcnMgKz0gMTtcblx0XHR9XG5cdFx0cmV0dXJuICc8YSBocmVmPVwiJytocmVmKydcIiB0YXJnZXQ9XCJfYmxhbmtcIiBkYXRhLScrZGVmYXVsdHMucHJlZml4KyctbGluaz1cIicraHJlZisnXCI+JytocmVmKyc8L2E+JyArIHRleHQuc3Vic3RyKHRleHQubGVuZ3RoIC0gbGVmdG92ZXJzKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxufVxuXG5mdW5jdGlvbiBpc0xpbmsodGV4dCl7XG5cdHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXmh0dHA6XFwvXFwvfF5odHRwczpcXC9cXC8nKTtcblx0cmV0dXJuIHBhdHRlcm4udGVzdCh0ZXh0KTtcbn1cblxuZnVuY3Rpb24gaXNJbWFnZShmaWxlbmFtZSl7XG5cdHZhciByZWdleCA9IG5ldyBSZWdFeHAoJ3BuZ3xQTkd8anBnfEpQR3xKUEVHfGpwZWd8Z2lmfEdJRicpO1xuXHR2YXIgZXh0ID0gZmlsZW5hbWUuc3Vic3RyaW5nKGZpbGVuYW1lLmxhc3RJbmRleE9mKCcuJykrMSk7XG5cdHJldHVybiByZWdleC50ZXN0KGV4dCk7XG59XG5cbmZ1bmN0aW9uIGdldEZvcm1EYXRhKGZvcm0pe1xuXHR2YXIgZm9ybURhdGEgPSB7fTtcblx0W10uc2xpY2UuY2FsbChmb3JtLmVsZW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG5cdFx0aWYoZWwudHlwZSA9PT0gJ2NoZWNrYm94JykgZm9ybURhdGFbZWwubmFtZV0gPSBlbC5jaGVja2VkO1xuXHRcdGVsc2Uge1xuXHRcdFx0aWYoZWwudmFsdWUpIGZvcm1EYXRhW2VsLm5hbWVdID0gZWwudmFsdWU7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIGZvcm1EYXRhO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm0oZm9ybSl7XG5cdHZhciB2YWxpZCA9IHRydWU7XG5cdFtdLnNsaWNlLmNhbGwoZm9ybS5lbGVtZW50cykuZXZlcnkoZnVuY3Rpb24oZWwpIHtcblx0XHQvLyBkZWJ1Zy5sb2coJ3ZhbGlkYXRlRm9ybSBlbDonLCBlbCwgZWwuaGFzQXR0cmlidXRlKCdyZXF1aXJlZCcpLCBlbC52YWx1ZSwgZWwudHlwZSk7XG5cdFx0aWYoZWwuaGFzQXR0cmlidXRlKCdyZXF1aXJlZCcpICYmIChlbC52YWx1ZSA9PT0gXCJcIiB8fCBlbC52YWx1ZSA9PT0gbnVsbCkpIHtcblx0XHRcdGFsZXJ0KGZyYXNlc1tjdXJyTGFuZ10uRVJST1JTW2VsLnR5cGVdIHx8IGZyYXNlc1tjdXJyTGFuZ10uRVJST1JTLnJlcXVpcmVkKTtcblx0XHRcdHZhbGlkID0gZmFsc2U7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSk7XG5cdC8vIGRlYnVnLmxvZygndmFsaWRhdGVGb3JtIHZhbGlkOiAnLCB2YWxpZCk7XG5cdHJldHVybiB2YWxpZDtcbn1cblxuLy8gZnVuY3Rpb24gcmVzZXRTdHlsZXMoZWxlbWVudCl7XG4vLyBcdGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuLy8gfVxuXG5mdW5jdGlvbiBhZGRXaWRnZXRTdHlsZXMoKXtcblx0XG5cdHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuXHRcdGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuXHRcdGxpbmsuaHJlZiA9IGRlZmF1bHRzLnN0eWxlc1BhdGggfHwgZGVmYXVsdHMuY2xpZW50UGF0aCsnbWFpbi5jc3MnO1xuXG5cdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG59XG5cbmZ1bmN0aW9uIFByZWZpeGVkRXZlbnQoZWxlbWVudCwgdHlwZSwgcGZ4LCBjYWxsYmFjaykge1xuXHRmb3IgKHZhciBwID0gMDsgcCA8IHBmeC5sZW5ndGg7IHArKykge1xuXHRcdGlmICghcGZ4W3BdKSB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihwZnhbcF0rdHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGltZShzZWNvbmRzKXtcblx0dmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCksXG5cdFx0c2Vjc1JlbWFpbiA9IHNlY29uZHMgJSA2MCxcblx0XHRzdHIgPSAobWludXRlcyA+IDkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcykgKyAnOicgKyAoc2Vjc1JlbWFpbiA+IDkgPyBzZWNzUmVtYWluIDogJzAnICsgc2Vjc1JlbWFpbik7XG5cdHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFBob25lTnVtYmVyKHBob25lKSB7XG5cdHJldHVybiBwaG9uZS5yZXBsYWNlKC9cXEQrL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJTdXBwb3J0ZWQoKSB7XG5cdHJldHVybiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdCAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudChvYmosIGV2VHlwZSwgZm4pIHtcbiAgaWYgKG9iai5hZGRFdmVudExpc3RlbmVyKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihldlR5cGUsIGZuLCBmYWxzZSk7XG4gIGVsc2UgaWYgKG9iai5hdHRhY2hFdmVudCkgb2JqLmF0dGFjaEV2ZW50KFwib25cIitldlR5cGUsIGZuKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmRldGFjaEV2ZW50KSBvYmouZGV0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufVxuIl19
