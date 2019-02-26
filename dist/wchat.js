(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Wchat = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
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

},{"../internal/arrayEach":10,"../internal/baseEach":15,"../internal/createForEach":28}],5:[function(require,module,exports){
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

},{"../internal/getNative":32}],6:[function(require,module,exports){
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

},{"../date/now":5,"../lang/isObject":48}],7:[function(require,module,exports){
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

},{"../lang/isObject":48,"./debounce":6}],9:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"../object/keys":52}],13:[function(require,module,exports){
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

},{"../object/keys":52,"./baseCopy":14}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{"./baseForOwn":18,"./createBaseEach":26}],16:[function(require,module,exports){
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

},{"./createBaseFor":27}],17:[function(require,module,exports){
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

},{"../object/keysIn":53,"./baseFor":16}],18:[function(require,module,exports){
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

},{"../object/keys":52,"./baseFor":16}],19:[function(require,module,exports){
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

},{"../lang/isArray":44,"../lang/isObject":48,"../lang/isTypedArray":50,"../object/keys":52,"./arrayEach":10,"./baseMergeDeep":20,"./isArrayLike":33,"./isObjectLike":37}],20:[function(require,module,exports){
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

},{"../lang/isArguments":43,"../lang/isArray":44,"../lang/isPlainObject":49,"../lang/isTypedArray":50,"../lang/toPlainObject":51,"./arrayCopy":9,"./isArrayLike":33}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{"../utility/identity":59}],25:[function(require,module,exports){
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

},{"../function/restParam":7,"./bindCallback":24,"./isIterateeCall":35}],26:[function(require,module,exports){
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

},{"./getLength":31,"./isLength":36,"./toObject":42}],27:[function(require,module,exports){
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

},{"./toObject":42}],28:[function(require,module,exports){
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

},{"../lang/isArray":44,"./bindCallback":24}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"./baseProperty":21}],32:[function(require,module,exports){
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

},{"../lang/isNative":47}],33:[function(require,module,exports){
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

},{"./getLength":31,"./isLength":36}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{"../lang/isObject":48,"./isArrayLike":33,"./isIndex":34}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
/** Used to match template delimiters. */
var reEscape = /<%-([\s\S]+?)%>/g;

module.exports = reEscape;

},{}],39:[function(require,module,exports){
/** Used to match template delimiters. */
var reEvaluate = /<%([\s\S]+?)%>/g;

module.exports = reEvaluate;

},{}],40:[function(require,module,exports){
/** Used to match template delimiters. */
var reInterpolate = /<%=([\s\S]+?)%>/g;

module.exports = reInterpolate;

},{}],41:[function(require,module,exports){
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

},{"../lang/isArguments":43,"../lang/isArray":44,"../object/keysIn":53,"./isIndex":34,"./isLength":36}],42:[function(require,module,exports){
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

},{"../lang/isObject":48}],43:[function(require,module,exports){
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

},{"../internal/isArrayLike":33,"../internal/isObjectLike":37}],44:[function(require,module,exports){
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

},{"../internal/getNative":32,"../internal/isLength":36,"../internal/isObjectLike":37}],45:[function(require,module,exports){
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

},{"../internal/isObjectLike":37}],46:[function(require,module,exports){
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

},{"./isObject":48}],47:[function(require,module,exports){
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

},{"../internal/isObjectLike":37,"./isFunction":46}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{"../internal/baseForIn":17,"../internal/isObjectLike":37,"./isArguments":43}],50:[function(require,module,exports){
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

},{"../internal/isLength":36,"../internal/isObjectLike":37}],51:[function(require,module,exports){
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

},{"../internal/baseCopy":14,"../object/keysIn":53}],52:[function(require,module,exports){
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

},{"../internal/getNative":32,"../internal/isArrayLike":33,"../internal/shimKeys":41,"../lang/isObject":48}],53:[function(require,module,exports){
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

},{"../internal/isIndex":34,"../internal/isLength":36,"../lang/isArguments":43,"../lang/isArray":44,"../lang/isObject":48}],54:[function(require,module,exports){
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

},{"../internal/baseMerge":19,"../internal/createAssigner":25}],55:[function(require,module,exports){
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

},{"../internal/baseToString":22,"../internal/escapeHtmlChar":29}],56:[function(require,module,exports){
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

},{"../internal/assignOwnDefaults":11,"../internal/assignWith":12,"../internal/baseAssign":13,"../internal/baseToString":22,"../internal/baseValues":23,"../internal/escapeStringChar":30,"../internal/isIterateeCall":35,"../internal/reInterpolate":40,"../lang/isError":45,"../object/keys":52,"../utility/attempt":58,"./templateSettings":57}],57:[function(require,module,exports){
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

},{"../internal/reEscape":38,"../internal/reEvaluate":39,"../internal/reInterpolate":40,"./escape":55}],58:[function(require,module,exports){
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

},{"../function/restParam":7,"../lang/isError":45}],59:[function(require,module,exports){
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

},{}],60:[function(require,module,exports){
var audioEl;
var dir = '';
var format = 'wav';
var volume = 0.5;
var debug = require('./debug');
var currFilename = '';

module.exports = {

	init: function(soundsDir) {
		audioEl = document.createElement('audio');
		audioEl.setAttribute('autoplay', true);
		audioEl.volume = volume;
		document.body.appendChild(audioEl);
		if(soundsDir) dir = soundsDir;
		return this;
	},

	play: function(filename, loop) {
		if(!audioEl) return;
		if(filename && filename !== currFilename) {
			audioEl.src = (dir + filename + '.' + format);
			if(loop) audioEl.setAttribute('loop', true);
			else audioEl.removeAttribute('loop');
		}
		
		audioEl.play();
	},

	stop: function() {
		audioEl.pause();
		audioEl.currentTime = 0;
	}

};
},{"./debug":63}],61:[function(require,module,exports){
var _ = require('./lodash-fns');
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
// var checkEvery = _.debounce(emitEvents, 100);
// var addEventsEvery = _.debounce(emitEvents, 100);
var addEventsEvery = _.throttle(emitEvents, 100, { 'trailing': true, 'leading': true });
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

function emitEvents(events){
	// if(localEvents.length) {
	emit('cobrowsing/event', { entity: entity, events: events });
		// localEvents = [];
	// }
}

// function addEvents(events) {
// 	localEvents.push(events);
// 	emitEvents();
// }

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
	// localEvents.push(params);
	// emitEvents();
	// addEvents(params);
	addEventsEvery(params);
}

function updateEvents(result){
	var mainElement = document.documentElement,
		target,
		evt = {};

	if(result.events) {

		// check for scrollTop/Left. 
		// IE and Firefox always return 0 from document.body.scrollTop/Left, 
		// while other browsers return 0 from document.documentElement
		// mainElement = ('ActiveXObject' in window || typeof InstallTrigger !== 'undefined') ? document.documentElement : document.body;

		// for(var i=0; i<result.events.length; i++) {
			// evt = result.events[i];
			evt = result.events;

			// if(evt.shared !== undefined) debug.log('shared events', eventTimestamp, evt, result.init);
			if(evt.timestamp < eventTimestamp) return;
			if(evt.entity === entity) return;
					
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
		// }
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
},{"./debug":63,"./lodash-fns":64}],62:[function(require,module,exports){
(function (global){
var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
// var websockets = require('./websockets');
// var url = require('url').parse(document.URL, true);
var url = global.location;
var _ = require('./lodash-fns');
var inherits = require('inherits');
var websocketTry = 1;
var pollTurns = 1;
var mainAddress = "main.ringotel.net/chatbot/WebChat/";
// var publicUrl = "https://main.ringotel.net/public/";
var websocketUrl = "";
var moduleInit = false;
var sessionTimeout = null;
var chatTimeout = null;

/**
 * Core module implements main internal functionality
 * 
 * @param  {Object} options Instantiation options that overrides module defaults
 * @return {Object}         Return public API
 */

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = options || {};
	this.options.serverUrl = this.options.server + '/ipcc/$$$';
	this.session = {};

	if(!this.options.wsServer && !this.options.pageid) return console.error('Cannot initiate module: pageid is undefined');

	websocketUrl = (this.options.wsServer ? this.options.wsServer : mainAddress);
	websocketUrl += (websocketUrl[websocketUrl.length-1] !== '/' ? '/' : '') + this.options.pageid; // add forward slash at the end if necessary

	this.createWebsocket();

	this.on('session/create', this.onSessionCreate.bind(this));
	// this.on('chat/close', function(data) {
	// 	storage.saveState('chat', false, 'session');
	// });
	this.on('Error', this.onError);


	return this;

}

WchatAPI.prototype.onError = function(err){
	debug.log('Error: ', err);
}

WchatAPI.prototype.onSessionCreate = function(data){
	this.session = _.merge(this.session, data);
	storage.saveState('sid', data.sid);
	// this.setSessionTimeout();
}

WchatAPI.prototype.setSessionTimeout = function(){
	var timeout = this.session.sessionTimeout;
	clearTimeout(sessionTimeout);
	if(timeout)
		sessionTimeout = setTimeout(this.onSessionTimeout.bind(this), timeout*1000);
}

WchatAPI.prototype.onSessionTimeout = function(){
	this.emit('session/timeout');
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

	// debug.log('onWebsocketMessage: ', data);
	
	if(data.method) {
		if(data.method === 'session') {
			this.emit('session/create', data.params);

		} else if(data.method === 'messages') {
			if(data.params.list) {
				data.params.list.map(function(item, index, array) {
					item.sequence = (index+1) + '/' + array.length;
					this.emit('message/new', item);
					return item;
				}.bind(this));
			}

		} else if(data.method === 'message') {
			if(data.params.typing) {
				this.emit('message/typing');
			} else {
				this.emit('message/new', data.params);
				this.setSessionTimeout();
			}

		} else if(data.method === 'openShare') { // Agent ---> User
			if(this.session.sharedId === data.params.id) return;
			if(data.params.url && (url.href !== data.params.url)) return window.location = data.params.url;
			if(data.params.id) {
				this.session.sharedId = data.params.id;
				this.emit('session/joined', { url: url.href });
				this.shareOpened(data.params.id, url.href); // User ---> Agent
			}

		} else if(data.method === 'shareOpened') { // User ---> Agent
			if(data.params.id) {
				this.session.sharedId = data.params.id;
				this.emit('session/joined', { url: url.href });
			}

		} else if(data.method === 'shareClosed') {
			clearInterval(this.openShareInteval);
			this.session.sharedId = "";
			this.emit('session/disjoin');

		} else if(data.method === 'events') {
			this.emit('cobrowsing/update', data.params);

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
		strIndex = url.href.indexOf('chatSessionId');

	debug.log('initModule: ', this.session, entity, sid);

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(strIndex !== -1) {
		sid = this.getSidFromUrl(url.href);
		entity = 'agent';
		var cleanUrl = url.href.substr(0, strIndex);
		cleanUrl = cleanUrl[cleanUrl.length-1] === '?' ? cleanUrl.substr(0, cleanUrl.length-1) : cleanUrl;

		storage.saveState('sid', sid);
		this.joinSession(cleanUrl);

	} else if(entity === 'agent') { // In case the cobrowsing session is active
		sid = storage.getState('sid');
		this.joinSession(url.href);

	} else {
		entity = 'user';
		this.createSession({ sid: sid, url: url.href });
	}

	this.session.sid = sid;
	this.session.entity = entity;
	storage.saveState('entity', entity, 'session');

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
			url: (params.url || url.href),
			lang: this.detectLanguage()
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
		this.openShare(url);
	}.bind(this), 3000);

	global.onclose = function() {
		this.shareClosed();
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
	
	if(!this.session.sharedId) return;

	data = {
		method: 'events',
		params: {
			sid: this.session.sid,
			id: this.session.sharedId,
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

	this.setSessionTimeout();

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

	// reset session timeout
	this.setSessionTimeout();

	if(this.websocket) {
		if(params.file) {
		// 	// var content = publicUrl+Date.now()+"_"+this.options.pageid+"_"+params.message;
			// data.params.content = params.file;
			// data.params.file = params.file;
			data = toFormData({ file: params.file, filename: params.message, sid: this.session.sid });

			request.upload('https://'+websocketUrl, data, function(err, result) {
				console.error('sendMessage: ', err, result);
				// this.sendData(data);
			});

		} else {
			data.params.content = params.message;
			this.sendData(data);
		}
		return;
	}

	// request.post(this.options.serverUrl, data, function(err, body){
	// 	if(err) {
	// 		this.emit('Error', err, { method: 'sendMessage', params: data });
	// 		if(cb) cb(err);
	// 		return;
	// 	}
	// 	if(cb) cb();
	// });
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

WchatAPI.prototype.shareOpened = function(){
	var data = {
		method: 'shareOpened',
		params: {
			id: this.session.sharedId,
			url: url.href
		}
	};

	if(this.websocket) {
		return this.sendData(data);
	}
};

WchatAPI.prototype.shareClosed = function(){
	var data = {
		method: 'shareClosed',
		params: {
			id: this.session.sharedId,
			url: url.href
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
WchatAPI.prototype.openShare = function(url){
	var data = {
		method: 'openShare',
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
			this.emit('Error', err, { method: 'openShare', params: { state: state } });
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

WchatAPI.prototype.detectLanguage = function(frases){
	var storageLang = storage.getState('lang', 'session'),
		availableLangs = [], lang, path;

	// list available languages by translations keys
	for(var key in frases) {
		availableLangs.push(key);
	}

	if(storageLang) {
		lang = storageLang;
	} else if(this.session.lang) {
		lang = this.session.lang;
	} else if(this.session.properties && this.session.properties.lang) {
		lang = this.session.properties.lang;
	} else if(this.session.langFromUrl || (this.session.properties && this.session.properties.langFromUrl)) {

		url.pathname
		.split('/')
		.map(function(item) {
			item = handleAliases(item);
			if(availableLangs.indexOf(item) !== -1) {
				lang = item;
			}

			return item;
		});
	}

	if(!lang) lang = (navigator.language || navigator.userLanguage).split('-')[0];
	if(availableLangs.indexOf(lang) === -1) lang = 'en';

	debug.log('detected lang: ', availableLangs, storageLang, this.session.lang, this.session.langFromUrl, lang);
	this.session.lang = lang;
	return lang;
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
        debug.log('WebSocket opened: ', e);
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
    debug.log('WebSocket closed', e);
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

function handleAliases(alias) {
	var lang = alias;
	if(alias === 'ua') lang = 'uk';
	else if(alias === 'us' || alias === 'gb') lang = 'en';
	return lang;
}

function toFormData(obj) {
	var formData = new FormData();
	Object.keys(obj).map(function(key) {
		if(key === 'file') formData.append(key, obj[key], obj.filename || '');
		else if(key === 'filename') return key;
		else formData.append(key, obj[key]);
		return key;
	});

	debug.log('toFormData: ', obj, formData.get('filename'));

	return formData;
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./debug":63,"./lodash-fns":64,"./request":66,"./storage":67,"events":2,"inherits":3}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
var _template = require('lodash/string/template');
var _forEach = require('lodash/collection/foreach');
// var _assign = require('lodash/object/assign');
var _merge = require('lodash/object/merge');
// var _isEqual = require('lodash/lang/isEqual');
// var _trim = require('lodash/string/trim');
var _throttle = require('lodash/function/throttle');
// var _debounce = require('lodash/function/debounce');

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
	// assign: _assign,
	merge: _merge,
	// isEqual: _isEqual,
	// trim: _trim,
	throttle: _throttle,
	debounce: debounce,
    poll: poll,
	findParent: findParent
};
},{"lodash/collection/foreach":4,"lodash/function/throttle":8,"lodash/object/merge":54,"lodash/string/template":56}],65:[function(require,module,exports){
var widget = require('./widget.js');
var api = require('./core.js');

module.exports = widget.module;

},{"./core.js":62,"./widget.js":70}],66:[function(require,module,exports){
var debug = require('./debug');
var cache = {};

module.exports = {
	post: post,
	get: get,
	put: put,
	upload: upload
};

function post(url, data, cb){

	// debug.log('post request: ', url, data);

	// var data = JSON.stringify(data);

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

function upload(url, data, cb) {
	XmlHttpRequest('POST', url, data, function(err, res) {
		debug.log('post respose: ', err, res);

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

	debug.log('XmlHttpRequest: ', data);

	if(method === 'POST') {
		if(typeof data === 'object' && !(data instanceof FormData)) {
			data = JSON.stringify(data);
			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		}
		
	}

	if(data) {
		xhr.send(data);
	} else {
		xhr.send();
	}
}

},{"./debug":63}],67:[function(require,module,exports){
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
	entity: null,
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

},{}],68:[function(require,module,exports){
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
exports.email = function(obj) {
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
exports.forms = function(obj) {
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
__p += '>\n\t\t<form id="' +
__e( defaults.prefix ) +
'-' +
__e( form.name ) +
'" name="' +
__e( form.name ) +
'" ';
 if(form.autocomplete){ ;
__p += 'autocomplete="on"';
 } ;
__p += ' data-validate-form="true">\n\t\t\t';
 if(form.description) { ;
__p += '\n\t\t\t\t<p style="margin: 10px 0">' +
((__t = ( frases.FORMS.DESCRIPTIONS[form.description] || form.description )) == null ? '' : __t) +
'</p>\n\t\t\t';
 } ;
__p += '\n\t\t\t';
 _.forEach(form.fields, function(item){ ;
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
 } else if(item.type === 'textarea') { ;
__p += '\n\t\t\t\t\t<textarea \n\t\t\t\t\t\tname="' +
__e( item.name ) +
'"\n\t\t\t\t\t\tplaceholder="' +
((__t = ( frases.FORMS.PLACEHOLDERS[item.placeholder] || frases.FORMS.PLACEHOLDERS[item.name] )) == null ? '' : __t) +
' ';
 if(item.required){ ;
__p += '*';
 } ;
__p += '"\n\t\t\t\t\t></textarea>\n\t\t\t\t';
 } else { ;
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
__p += '\n\t\t\t\t\t/>\n\t\t\t\t';
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
exports.message = function(obj) {
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
'-message-content"\n\t\t';
 if(message.entity !== "user") { ;
__p += ' \n\t\t\tstyle="border-color:' +
((__t = ( defaults.styles.primary.backgroundColor )) == null ? '' : __t) +
'" \n\t\t';
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
exports.widget = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 var frases = translations; ;
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
'-wg-state-cont">\n\t\t\t\t<!-- <span class="' +
__e( defaults.prefix ) +
'-wg-state-icon"> </span> -->\n\t\t\t\t<span class="' +
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
'-icon-close"></span>\n\n\t\t\t\t</a>\n\n\t\t\t</div>\n\t\t</div>\n\t\t<!-- ***** Top bar ends ***** -->\n\n\t\t<!-- ***** Connection types pane ***** -->\n\t\t<div \n\t\t\tclass="' +
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
 if(defaults.intro && defaults.intro.length) { ;
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
__e( defaults.introMessage || panels.INTRO.intro_message ) +
'</p>\n\t\t\t\t\t</div>\n\n\t\t\t\t</div>\n\n\t\t\t\t<div class="' +
__e( defaults.prefix ) +
'-pane-body">\n\t\t\t\t\t<form \n\t\t\t\t\t\tid="' +
__e( defaults.prefix ) +
'-intro-form" \n\t\t\t\t\t\tname="' +
__e( defaults.prefix ) +
'IntroForm" \n\t\t\t\t\t\tdata-validate-form="true">\n\n\t\t\t\t\t\t<!-- Iterating over intro array, which is a list of objects -->\n\t\t\t\t\t\t';
 _.forEach(defaults.intro, function(item){ ;
__p += '\n\t\t\t\t\t\t\t';
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
 } else if(item.name === 'message') { ;
__p += '\n\t\t\t\t\t\t\t\t<textarea\n\t\t\t\t\t\t\t\t\tname="message"\n\t\t\t\t\t\t\t\t\tplaceholder="' +
((__t = ( panels.INTRO.PLACEHOLDERS[item.name] )) == null ? '' : __t) +
' ';
 if(item.required){ ;
__p += ' * ';
 } ;
__p += '"\n\t\t\t\t\t\t\t\t></textarea>\n\t\t\t\t\t\t\t';
 } else if(item.name === 'consent') { ;
__p += '\n\t\t\t\t\t\t\t\t<label for="' +
__e(defaults.sid ) +
'-' +
__e( item.name ) +
'">\n\t\t\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\t\ttype="checkbox" \n\t\t\t\t\t\t\t\t\tid="' +
__e(defaults.sid ) +
'-' +
__e( item.name ) +
'"\n\t\t\t\t\t\t\t\t\tname="' +
__e( item.name ) +
'" \n\t\t\t\t\t\t\t\t\t';
 if(item.required){ ;
__p += ' required ';
 } ;
__p += '>\n\t\t\t\t\t\t\t\t\t' +
((__t = ( defaults.consentText )) == null ? '' : __t) +
'\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t';
 } else if(item.type === 'checkbox') { ;
__p += '\n\t\t\t\t\t\t\t\t<label for="' +
__e(defaults.sid ) +
'-' +
__e( item.name ) +
'">\n\t\t\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\t\ttype="checkbox" \n\t\t\t\t\t\t\t\t\tid="' +
__e(defaults.sid ) +
'-' +
__e( item.name ) +
'"\n\t\t\t\t\t\t\t\t\tname="' +
__e( item.name ) +
'" \n\t\t\t\t\t\t\t\t\t';
 if(item.required){ ;
__p += ' required ';
 } ;
__p += '>\n\t\t\t\t\t\t\t\t\t' +
__e( item.placeholder ) +
'\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t';
 } else { ;
__p += '\n\t\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\t\ttype="' +
((__t = ( item.type || 'text' )) == null ? '' : __t) +
'"\n\t\t\t\t\t\t\t\t\tplaceholder="' +
((__t = ( panels.INTRO.PLACEHOLDERS[item.name] )) == null ? '' : __t) +
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
__p += '\n\n\t\t\t\t\t\t';
 }); ;
__p += '\n\t\t\t\t\t\t<br><br>\n\t\t\t\t\t\t<!-- Init chat with intro properties -->\n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="submit" \n\t\t\t\t\t\t\tclass="' +
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
'-action-btns">\n\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-end-dialog-btn" data-' +
__e( defaults.prefix ) +
'-handler="finish">' +
__e( panels.MESSAGES.end_dialog ) +
'</a>\n\t\t\t\t\t<a href="#" class="' +
__e( defaults.prefix ) +
'-trigger-sounds-btn" data-' +
__e( defaults.prefix ) +
'-handler="triggerSounds">\n\t\t\t\t\t\t<span \n\t\t\t\t\t\t\tclass="';
 if(defaults.sounds) { ;
__p +=
__e( defaults.prefix ) +
'-icon-bell';
 } else { ;
__p +=
__e( defaults.prefix) +
'-icon-bell-slash';
 } ;
__p += '">\n\t\t\t\t\t\t</span>\n\t\t\t\t\t</a>\n\t\t\t\t</div>\n\n\t\t\t\t<!-- "Agent is typing" indicator -->\n\t\t\t\t<div class="' +
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
'">\n\t\t\t\t\t</span>\n\n\t\t\t\t</label>\n\n\t\t\t\t<div id="' +
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
'" maxlength="1500"></textarea>\n\n\t\t\t\t\t<!--<input type="file" name="file" id="' +
__e( defaults.prefix ) +
'-contactfile" class="' +
__e( defaults.prefix ) +
'-inputfile" />\n\t\t\t\t\t<label for="' +
__e( defaults.prefix ) +
'-contactfile">' +
__e( panels.OFFLINE.choose_file ) +
'</label> -->\n\n\t\t\t\t\t<!-- "Send offline message" button -->\n\t\t\t\t\t<button \n\t\t\t\t\t\ttype="submit" \n\t\t\t\t\t\tclass="' +
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
 if(channels.webrtc && channels.webrtc.fallback) { ;
__p += '\n\t\t\t\t\t\t<a href="' +
__e( channels.webrtc.fallback.sipCall ) +
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
'-callback-settings">\n\t\t\t\t\t';
 if(channels.callback && channels.callback.time !== false) { ;
__p += '\n\t\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.title ) +
'</p>\n\t\t\t\t\t';
 } else { ;
__p += '\n\t\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.title_asap ) +
'</p>\n\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t\t<hr>\n\t\t\t\t\t<label>' +
__e( panels.CALLBACK.LABELS.phone ) +
'</label>\n\t\t\t\t\t<input type="tel" name="phone" placeholder="' +
__e( panels.CALLBACK.PLACEHOLDERS.phone ) +
'" required>\n\t\t\t\t\t';
 if(channels.callback && channels.callback.time !== false) { ;
__p += '\n\t\t\t\t\t\t<label>' +
__e( panels.CALLBACK.LABELS.time ) +
'</label>\n\t\t\t\t\t\t<select name="time">\n\t\t\t\t\t\t\t';
 _.forEach(panels.CALLBACK.TIME_POINTS, function(point) { ;
__p += '\n\t\t\t\t\t\t\t\t<option value="' +
__e( point.minutes ) +
'">' +
__e( point.label ) +
'</option>\n\t\t\t\t\t\t\t';
 }); ;
__p += '\n\t\t\t\t\t\t</select>\n\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t\t';
 if(channels.callback && channels.callback.message !== undefined) { ;
__p += '\n\t\t\t\t\t\t<label>' +
__e( panels.CALLBACK.LABELS.message ) +
'</label>\n\t\t\t\t\t\t<textarea name="message" placeholder="' +
__e( panels.CALLBACK.PLACEHOLDERS.message ) +
'" maxlength="1500"></textarea>\n\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t\t<hr>\n\n\t\t\t\t\t<button\n\t\t\t\t\t\ttype="submit"\n\t\t\t\t\t\tclass="' +
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
'-text-success"></h3>\n\t\t\t\t\t';
 if(channels.callback && channels.callback.time !== false) { ;
__p += '\n\t\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.request_sent ) +
'</p>\n\t\t\t\t\t';
 } else { ;
__p += '\n\t\t\t\t\t\t<p class="' +
__e( defaults.prefix ) +
'-text-center">' +
__e( panels.CALLBACK.request_sent_asap ) +
'</p>\n\t\t\t\t\t';
 } ;
__p += '\n\t\t\t\t\t<form>\n\t\t\t\t\t\t<hr>\n\t\t\t\t\t\t<a href="#chooseConnection" class="' +
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
'-unnotify-btn"><span class="' +
__e( defaults.prefix ) +
'-icon-close"></span></span>\n\t\t\t\t<!-- <span class="' +
__e( defaults.prefix ) +
'-unnotify-btn" id="' +
__e( defaults.prefix ) +
'-unnotify-btn">' +
__e( frases.FLOATING_BUTTON.close ) +
'</span> -->\n\t\t\t\t<div id="' +
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
},{}],69:[function(require,module,exports){
(function (global){
var debug = require('./debug');
var events = {},
// JsSIP = require('jssip'),
// JsSIP = require('./libs/jssip'),
JsSIP,
options,
sipClient,
sipSession,
sipCallEvents;

function isWebrtcSupported(){
	var RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
		userMeida = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia,
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
		}
		// addstream: function(e){
		// 	debug.log('call addstream event: ', e);
		// 	events.emit('webrtc/addstream', e);
		// 	var stream = e.stream;
		// 	options.audioRemote = JsSIP.rtcninja.attachMediaStream(options.audioRemote, stream);
		// }
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

	sipSession.connection.addEventListener('track', function(e) {
		events.emit('webrtc/addstream', e);
		if(options.audioRemote.srcObject !== e.streams[0]) options.audioRemote.srcObject = e.streams[0];
		// e.streams.forEach(function(stream) {
		// 	e.track.muted = false;
		// 	sipSession.connection.addTrack(e.track, stream)
		// } );
	})
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
	JsSIP = global.JsSIP;
	options = opts;

	debug.log('JsSIP: ', global, JsSIP);

	if(options.sip.register === undefined) options.sip.register = false;
	var socket = new JsSIP.WebSocketInterface(options.sip.ws_servers);
	options.sip.sockets = [socket];

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

},{"./debug":63}],70:[function(require,module,exports){
(function (global){
var domify = require('domify');
var Core = require('./core');
var storage = require('./storage');
var request = require('./request');
var debug = require('./debug');
var _ = require('./lodash-fns');
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
	prefix: 'swc', // prefix for CSS classes and ids. 
				// Change it only if the default prefix 
				// matches with existed classes or ids on the website
	autoStart: true, // Init module on page load
	intro: false, // whether or not to ask user 
				// to introduce him self before the chat session
	introMessage: "", // message that asks user for introduction
	concentText: "", // message that contains the text of concent that user should accept in order to start a chat
	widget: true, // whether or not to add widget to the webpage
	chat: true, // enable chat feature
	sounds: true,
	channels: { // channels settings
		webrtc: {},
		callback: {}
	},
	cobrowsing: false, // enable cobrowsing feature
	buttonSelector: "", // DOM element[s] selector that opens a widget
	reCreateSession: true,
	title: '',
	lang: '',
	langFromUrl: true,
	position: 'right',
	hideOfflineButton: false,
	offer: false,
	themeColor: "",
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
			backgroundColor: 'rgba(175,229,255)',
			color: ''
		},
		offline: {
			backgroundColor: 'rgba(241,241,241)',
			color: ''
		},
		timeout: {
			backgroundColor: 'rgba(241,241,241)',
			color: ''
		},
		notified: {
			backgroundColor: 'rgba(253,250,129)',
			color: ''
		},
		color: 'rgb(70,70,70)'
	},
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable',
	path: '/ipcc/webchat/', // absolute path to the wchat folder
	clientPath: 'https://cdn.smile-soft.com/wchat/v1/', // absolute path to the clients files. If not set, files requested from defaults.server + defaults.path.
	stylesPath: '', // absolute path to the css flie
	translationsPath: '', // absolute path to the translations.json flie
	host: window.location.host, // displayed in the email template
	webrtcEnabled: false,
	maxFileSize: 100, // in MB, if 0 - no restrictions
	allowedFileExtensions: [] // Allowed file types for uploading. If empty array - no restriction. Ex: ['txt', 'gif', 'png', 'jpeg', 'pdf']
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
var messages = [];

// available dialog languages
var langs = [];
// var currLang = '';
var sessionTimeout;
var chatTimeout;
var mouseFocused = false;
// Widget dom element
var widget;

// Widget in a separate window
var widgetWindow;
// Widget panes elements
var agentIsTypingTimeout;
var userIsTypingTimeout;
var timerUpdateInterval;
var pollTurns = 1;
var cobrowsingPermissionGiven = false;

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

	// defaults.clientPath = options.clientPath ? options.clientPath : (defaults.clientPath || (defaults.server + defaults.path));
	
	// serverUrl = require('url').parse(defaults.server, true);

	api = new Core(defaults)
	.on('session/create', onSessionSuccess)
	.on('session/timeout', onSessionTimeout)
	.on('session/join', onSessionJoinRequest)
	.on('session/joined', onSessionJoin)
	.on('session/disjoin', onSessionDisjoin)
	.on('session/init', onSessionInit);
	// .on('chat/languages', function() {
	// 	changeWgState({ state: getWidgetState() });
	// });
	
	// setSessionTimeoutHandler();
	
	// load forms
	request.get('forms_json', defaults.clientPath+'forms.json', function (err, result){
		if(err) return api.emit('Error', err);
		forms = JSON.parse(result).forms;
	});

	addWidgetStyles();

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

// Session is either created or continues
function onSessionSuccess(){	
	// Wait while translations are loaded
	
	getFrases();

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

function initSession() {
	
	if(!defaults.chat && !defaults.webrtcEnabled && !defaults.channels.callback.task) return false;

	if(api.session.properties) _.merge(defaults, api.session.properties);

	defaults.sid = api.session.sid;
	defaults.isIpcc = (api.session.langs !== undefined || api.session.categories !== undefined);

	debug.log('initSession: ', api, defaults, frases);

	frases = (defaults.lang && frases[defaults.lang]) ? frases[defaults.lang] : frases[api.detectLanguage(frases)];

	if(defaults.widget) {
		api
		// .on('chat/start', startChat)
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

	
	if(defaults.isIpcc) getLanguages();
	if(defaults.buttonSelector) setHandlers(defaults.buttonSelector);
	if(defaults.themeColor) {
		defaults.styles.primary.backgroundColor = defaults.themeColor;
		defaults.styles.primary.color = getThemeTextColor(defaults.themeColor);
		
	}

	debug.log('initSession: ', defaults.widget, widgetState.initiated, isBrowserSupported());

	defaults.sounds = storage.getState('sounds') !== undefined ? storage.getState('sounds', 'session') : defaults.sounds;

	// Enabling audio module
	audio.init(defaults.clientPath+'sounds/');

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget(defaults);
	}

	// If timeout was occured, init chat after a session is created
	if(hasWgState('timeout')) {
		removeWgState('timeout');
	}

	api.emit('session/init', {session: api.session, options: defaults, url: global.location.href });
}

function onSessionInit(params){
	storage.saveState('init', true, 'session');
	
	if(widgetWindow && !widgetWindow.closed) widgetWindow.sessionStorage.setItem(defaults.prefix+'.init', true);
}

function requestBrowserAccess() {
	newMessage({
		from: storage.getState('aname', 'session'),
		time: Date.now(),
		content: "{request_browser_access}"
	});
}

function onSessionJoinRequest(params){
	debug.log('onSessionJoinRequest', storage.getState('shared', 'session'));
	if(!storage.getState('shared', 'session')) {
		requestBrowserAccess();
	} else {
		joinSession(params);
	}
}

function joinSession(params) {
	api.shareOpened(); // send confirmation to agent
	onSessionJoin(params);
}

// send shared event to the user's browser
function onSessionJoin(params){
	initCobrowsingModule({ url: params.url, entity: api.session.entity });
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
		api.updateEvents(params.events)
	});

	api.on('cobrowsing/shared', function(){
		storage.saveState('shared', true, 'session');
	});

	api.on('cobrowsing/unshared', function(params){
		storage.saveState('shared', false, 'session');
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

function getFrases() {
	// load translations
	request.get('frases', (defaults.translationsPath || defaults.clientPath)+'translations.json', function (err, result){
		if(err) return api.emit('Error', err);
		frases = JSON.parse(result);
		// frases = frases[api.detectLanguage(frases)]
	});
}

function onNewLanguages(languages){
	// debug.log('languages: ', languages);
	var state = languages.length ? 'online' : 'offline';

	langs = languages;

	// if(hasWgState(state)) return;
	// if(widgetState.state === state) return;

	// changeWgState({ state: state });
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
	if(storage.getState('chat', 'session') === true) {
		requestChat(storage.getState('credentials', 'session') || {});
		if(storage.getState('opened', 'session')) showWidget();
		// initChat();
	}

	// if webrtc supported by the browser and ws_servers parameter is set - change button icon
	if(defaults.webrtcEnabled) {
		addWgState('webrtc-enabled');
	}

	if(widget && defaults.intro && defaults.intro.length) {
		// Add languages to the template
		langs.forEach(function(lang) {
			if(frases && frases.lang) {
				selected = lang === api.session.lang ? 'selected' : '';
				options += '<option value="'+lang+'" '+selected+' >'+frases.lang+'</option>';
			}
		});
		global[defaults.prefix+'IntroForm'].lang.innerHTML = options;
	}

	// Widget is initiated
	api.emit('widget/init');
}

function loadWidget(params){
	
	compiled = compileTemplate('widget', {
		defaults: params,
		languages: langs,
		translations: frases,
		credentials: storage.getState('credentials', 'session') || {},
		_: _
	});

	// Widget variable assignment
	widget = domify(compiled);
	document.body.appendChild(widget);
	api.emit('widget/load', widget);
	debug.log('loadWidget', params);
}

function setOffer() {
	setTimeout(function() {
		showOffer({
			from: defaults.offer.from || frases.TOP_BAR.title,
			time: Date.now(),
			content: defaults.offer.text || frases.default_offer
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

	if(isOffline()) {
		switchPane('sendemail');
	} else if(defaults.intro && defaults.intro.length) {
		if(storage.getState('chat', 'session') || storage.getState('credentials', 'session')) {
			requestChat(storage.getState('credentials', 'session') || {});
		} else {
			switchPane('credentials');
		}
	} else {
		requestChat({ lang: api.session.lang });
	}
}

function requestChat(credentials){
	var chatStarted = storage.getState('chat', 'session');
	var agentid = storage.getState('aid', 'session');
	var message = credentials.message;
	var saveParams = {};

	// if(!credentials.uname) credentials.uname = api.session.sid;
	if(agentid) credentials.agentid = agentid;

	// Save user language based on preferable dialog language
	// if(credentials.lang && credentials.lang !== currLang ) {
	// 	storage.saveState('lang', credentials.lang, 'session');
	// }
	if(!credentials.lang) {
		credentials.lang = api.session.lang;
	}
	
	saveParams = extend({}, credentials);
	delete saveParams.message;

	// Save credentials for current session
	// It will be removed on session timeout
	storage.saveState('credentials', saveParams, 'session');

	api.chatRequest(credentials);

	setTimeout(function() {
		debug.log('requestChat: ', credentials.message, chatStarted);

		if(message && !chatStarted) {
			sendMessage({
				message: credentials.message
			});
		}
	}, 500);

	startChat(api.session);
	clearWgMessages();
	switchPane('messages');
}

function startChat(params){
	var timeout = params.answerTimeout;

	storage.saveState('chat', true, 'session');
	
	debug.log('startChat timeout: ', timeout);

	if(timeout) {
		chatTimeout = setTimeout(onChatTimeout, timeout*1000);
	}

	addWgState('chat');
}

function sendMessage(params){
	api.sendMessage(params);

	newMessage({
		from: (storage.getState('credentials', 'session').uname || api.session.sid),
		time: Date.now(),
		content: params.message
		// hidden: true
		// className: defaults.prefix+'-msg-undelivered'
	});

	// if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(message){
	debug.log('new messages arrived!', message);

	var str,
		els = [],
		text,
		compiled,
		playSound = false,
		lastmsg = null;
		sequence = message.sequence ? message.sequence.split('/') : [1,1],
		// defaultUname = false,
		credentials = storage.getState('credentials', 'session') || {},
		aname = storage.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : api.session.sid,
		messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	// if(uname === storage.getState('sid').split('_')[0]) {
	// 	defaultUname = true;
	// }

	// result.messages.forEach(function(message, index) {
		
		message.entity = message.entity || ((message.from === uname || message.from === undefined) ? 'user' : 'agent');
		// message.from = (message.entity === 'user' && defaultUname) ? frases.default_user_name : message.from;
		message.from = message.entity === 'user' ? '' : message.from;
		message.time = message.time ? parseTime(message.time) : parseTime(Date.now());

		text = parseMessage(message.content, message.file, message.entity);

		if(text.type === 'form') {

			compiled = compileTemplate('forms', {
				defaults: defaults,
				message: message,
				form: text.content,
				credentials: credentials,
				frases: frases,
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

			lastmsg = compiled;

			// Need for sending dialog to email
			if(!message.hidden) {
				dialog.push(compiled);
				messages.push(message);
			}
		}

		// Save agent name
		if(message.entity === 'agent') {
			if(aname !== message.from) storage.saveState('aname', message.from, 'session');
			if(message.agentid) storage.saveState('aid', message.agentid, 'session');
			if(message.from) clearTimeout(chatTimeout);
		}

		if(message.entity !== 'user') playSound = true;

	// });

	if(sequence && (sequence[0] == sequence[1])) {
		if(lastmsg) onLastMessage(lastmsg);
		messagesCont.scrollTop = messagesCont.scrollHeight;
		if(playSound) playNewMsgTone();
	}
		
}

function clearUndelivered(){
	var undelivered = [].slice.call(document.querySelectorAll('.'+defaults.prefix+'-msg-undelivered'));
	if(undelivered && undelivered.length) {
		undelivered.forEach(function(msg){
			msg.classList.add(defaults.prefix+'-hidden');
		});
	}
}

function triggerSounds() {
	var icon = document.querySelector('.'+defaults.prefix+'-trigger-sounds-btn span');
	defaults.sounds = !defaults.sounds;
	icon.className = defaults.sounds ? (defaults.prefix+'-icon-bell') : (defaults.prefix+'-icon-bell-slash');
	storage.saveState('sounds', defaults.sounds, 'session');
}

function playNewMsgTone() {
	if(defaults.sounds)
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
		frases: frases,
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
			from: frases.EMAIL_SUBJECTS.complain+' '+params.email,
			content: params.text,
			entity: '',
			time: ''
		}
	});

	body = body.concat(
		complain,
		'<br><p class="h1">'+frases.EMAIL_SUBJECTS.dialog+' '+defaults.host+'</p><br>',
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
			from: frases.EMAIL_SUBJECTS.request+' '+params.uname+' ('+params.email+')',
			content: params.text,
			entity: '',
			time: ''
		}
	});

	// compileEmail(msg, function(err, result) {
		// if(err) return;
		// params.text = result;
		api.sendEmail(params);
		if(cb) cb();
	// });
}

function submitSendMailForm(form, data) {
	var params = {},
		file;

	if(!data.email) {
		alert(frases.ERRORS.email);
		return;
	}

	data.subject = frases.EMAIL_SUBJECTS.request+' '+data.email;

	if(data.file) {
		file = getFileContent(form.file, function(err, result) {
			if(!err) {
				data.filename = result.filename;
				data.filedata = result.filedata;
			} else {
				if(frases.ERRORS[err]) alert(frases.ERRORS[err])
				return debug.warn('File wasn\'t sent');
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
			alert(frases.ERRORS.email);
			return;
		}
		// debug.log('send dialog');
		sendDialog({
			to: data.email,
			subject: frases.EMAIL_SUBJECTS.dialog+' '+defaults.host,
			text: dialog // global variable
		});
	}
	if(data && data.text) {
		if(!data.email) {
			alert(frases.ERRORS.email);
			return;
		} else {
			// debug.log('send complain!');
			sendComplain({
				email: data.email,
				subject: frases.EMAIL_SUBJECTS.complain+' '+data.email,
				text: data.text
			});
		}
	}
	// if(chatTimeout) clearTimeout(chatTimeout);
	if(form) form.reset();
	
	closeChat(rating);
	closeWidget();
}

function closeChat(rating) {
	storage.saveState('chat', false, 'session');
	api.closeChat(rating);
	removeWgState('chat');

	if(storage.getState('shared', 'session')) {
		api.shareClosed(global.location.href);
		cobrowsing.unshare();
	}
}

function onChatClose(){
	if(storage.getState('shared', 'session')) cobrowsing.unshare();
}

function onChatTimeout(){
	debug.log('chat timeout!');
	// switchPane('closechat');
	// storage.saveState('chat', false, 'session');

	newMessage({
		from: "",
		time: Date.now(),
		content: "{queue_overload}"
	});

	var form = global['queue_overload'];
	if(form) form.text.value = messages.reduce(function(str, item){ if(item.entity === 'user') {str += (item.content+"\n")} return str; }, "");
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

function onSessionTimeout(){
	// if(api.listenerCount('session/timeout') >= 1) return;
	// api.once('session/timeout', function (){
		debug.log('Session timeout:');

		if(storage.getState('chat', 'session') === true) {
			closeChat();
		}

		switchPane('closechat');

		// if(widget) {
			// addWgState('timeout');
			// closeWidget();
		// }

		// changeWgState({ state: 'timeout' });
		// widgetState.state = 'timeout';
		// addWgState('timeout');
		// setButtonStyle('timeout');
		// storage.removeState('sid');

		// if(params && params.method === 'updateEvents') {
		// if(getLanguagesInterval) clearInterval(getLanguagesInterval);
		// if(messagesTimeout) clearTimeout(messagesTimeout);

		// if(defaults.reCreateSession) {
		// 	initModule();
		// }
		// }
	// });
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
		return alert(frases.ERRORS.tel);
	}

	if(formData.time) {
		formData.time = parseFloat(formData.time);
		if(formData.time <= 0) return;
		formData.time = Date.now() + (formData.time * 60 * 1000);
	}
	formData.task = defaults.channels.callback.task;
	debug.log('setCallback data: ', formData);

	// form.classList.add(defaults.prefix+'-hidden');
	// cbSpinner.classList.remove(defaults.prefix+'-hidden');

	api.requestCallback(formData);
	switchPane('callbackSent');

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
		textState.innerText = frases.PANELS.AUDIO_CALL.calling_agent;
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.add(defaults.prefix+'-hidden');

	} else if(state === 'ringing') {
		setTimer(timer, 'init', 0);
		timer.classList.remove(defaults.prefix+'-hidden');
		// audio.play('ringout_loop', true);

	} else if(state === 'connected') {
		textState.innerText = frases.PANELS.AUDIO_CALL.connected_with_agent;
		setTimer(timer, 'start', 0);
		audio.stop();

	} else if(state === 'ended') {
		textState.innerText = frases.PANELS.AUDIO_CALL.call_ended;
		setTimer(timer, 'stop');
		initCallState('oncallend');
		
	} else if(state === 'failed' || state === 'canceled') {
		if(state === 'failed') {
			textState.innerText = frases.PANELS.AUDIO_CALL.call_failed;
		} else {
			textState.innerText = frases.PANELS.AUDIO_CALL.call_canceled;
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
function openWidget(e){
	if(e) e.preventDefault();

	var opts = {};
	
	if(!widgetWindow || widgetWindow.closed) {

		opts = _.merge(opts, defaults);

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
			if(storage.getState('chat', 'session')) closeChat();
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
	title.textContent = frases.TOP_BAR.title;

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
		if(defaults.isIpcc && storage.getState('chat', 'session')) {
			switchPane('closechat');
		} else {
			closeChat();
			closeWidget();
		}
		
	} else if(handler === 'triggerSounds') {
		triggerSounds();
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
		closeBtnId = defaults.prefix+'-unnotify-btn';
		currTarg = e.currentTarget;

	// remove notification of a new message
	if(targ.id === closeBtnId || targ.parentNode.id === closeBtnId) {
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

function isOffline() {
	var state = getWidgetState();
	return state === 'offline';
}

function initWidgetState(e){
	if(e) e.preventDefault();
	var chatInProgress = storage.getState('chat', 'session');
	var wasOpened = storage.getState('opened', 'session');
	var callInProgress = storage.getState('call', 'cache');

	debug.log('initWidgetState');

	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	setInteracted();
	// If timeout is occured, init session first
	if(hasWgState('timeout')) {
		initModule();
	} else if(chatInProgress){
		showWidget();
	} else if(isOffline()){
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
			}
			showWidget();
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

	msg = textarea.value.trim();
	if(msg) {

		if(!storage.getState('chat', 'session')) {
			initChat();
		}

		sendMessage({ message: msg });
		textarea.value = '';
		removeWgState('type-extend');
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
		debug.log('wgSendFile: ', err, result);
		if(err) {
			if(frases.ERRORS[err]) alert(frases.ERRORS[err])
			return debug.warn('File wasn\'t sent');
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
	debug.log('changeWgState: ', params);
	if(!widget || widgetState.state === params.state) return;
	if(params.state === 'offline') {
		closeChat();
		removeWgState('online');
		switchPane('sendemail');
	} else if(params.state === 'online') {
		removeWgState('offline');
		
	}

	var state = document.querySelector('.'+defaults.prefix+'-wg-state');
	if(state) state.textContent = frases.TOP_BAR.STATUS[params.state];

	widgetState.state = params.state;
	addWgState(params.state);
	setButtonStyle(params.state);
	api.emit('widget/statechange', { state: params.state });
	
}

function getWidgetState() {
	var state = ''; 
	if(defaults.isIpcc)
		state = widgetState.state ? widgetState.state : (langs.length ? 'online' : 'offline');
	else
		state = widgetState.state ? widgetState.state : (api.session.state ? 'online' : 'offline');
	
	return state;
}

function setStyles() {
	var wgBtn = widget.querySelector('.'+defaults.prefix+'-wg-btn');

	debug.log('setStyles: ', wgBtn, defaults.buttonStyles);

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
	debug.log('onFormSubmit: ', form, formData);
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
	} else if(form.id === defaults.prefix+'-queue_overload'){
		sendRequest(formData);
		closeForm({ formName: form.name }, true);
	} else if(form.id === defaults.prefix+'-request_browser_access'){
		joinSession({ url: global.location.href });
		closeForm({ formName: form.name }, true);
		closeWidget();
	} else {
		closeForm({ formName: form.name }, true);
	}
}

function closeForm(params, submitted){
	var form = global[params.formName];
	if(!form) return false;
	if(submitted) {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-success '+defaults.prefix+'-icon-check"></i>'+
							'<span> '+frases.FORMS.submitted+'</span>'+
						'</p>';
	} else {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-danger '+defaults.prefix+'-icon-remove"></i>'+
							'<span> '+frases.FORMS.canceled+'</span>'+
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

	var errors = checkFileParams(file);

	if(errors.length) return cb(errors[0]);

	var blob = new Blob([file], { type: file.type });
	return cb(null, { filedata: blob, filename: file.name });

	// reader = new FileReader();
	// reader.onload = function(event) {
	// 	data = event.target.result;
	// 	// data = data.substring(data.indexOf(',')+1);
	// 	if(cb) cb(null, { filedata: data, filename: file.name });
	// };
	// reader.onerror = function(event) {
	// 	api.emit('Error', event.target.error);
	// 	if(cb) cb(event.target.error);
	// };
	// reader.readAsDataURL(file);
}

function checkFileParams(file) {
	debug.log('checkFileParams: ', file, file.size, file.name, defaults.allowedFileExtensions, (defaults.maxFileSize*1000*1000));	
	var errors = [];
	var fileExt = file.name.split('.')[file.name.split('.').length-1];
	if(fileExt && defaults.allowedFileExtensions && defaults.allowedFileExtensions.length && defaults.allowedFileExtensions.indexOf(fileExt.toLowerCase()) === -1) errors.push('file_type_error');
	if(defaults.maxFileSize && (defaults.maxFileSize*1000*1000) < file.size) errors.push('file_size_error');


	debug.log('checkFileParams errors: ', errors);	

	return errors;
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

function browserIsObsolete() {
	debug.warn('Your browser is obsolete!');
}

function parseTime(ts) {
	var date = new Date((typeof ts === 'string' ? parseInt(ts, 10) : ts)),
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

		debug.log('convertLinks: ', href);

		return '<a href="'+(href.indexOf('www.') !== -1 ? ('http://'+href) : href)+'" target="_blank" data-'+defaults.prefix+'-link="'+href+'">'+href+'</a>' + text.substr(text.length - leftovers);
	} else {
		return text;
	}
}

function isLink(text){
	var pattern = new RegExp('^http:\/\/|^https:\/\/|^www\.[a-zA-z0-9-]*.[a-zA-Z0-9]');
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
			alert(frases.ERRORS[el.type] || frases.ERRORS.required);
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

function getThemeTextColor(themeColor) {
	var rgbObj = hexToRgb(defaults.themeColor);
	debug.log('getThemeTextColor: ', rgbObj, relativeLuminanceW3C(rgbObj.r, rgbObj.g, rgbObj.b));
	return (relativeLuminanceW3C(rgbObj.r, rgbObj.g, rgbObj.b) > 0.5 ? '#333' : '#f1f1f1');
}

// from http://www.w3.org/TR/WCAG20/#relativeluminancedef
function relativeLuminanceW3C(R8bit, G8bit, B8bit) {

    var RsRGB = R8bit/255;
    var GsRGB = G8bit/255;
    var BsRGB = B8bit/255;

    var R = (RsRGB <= 0.03928) ? RsRGB/12.92 : Math.pow((RsRGB+0.055)/1.055, 2.4);
    var G = (GsRGB <= 0.03928) ? GsRGB/12.92 : Math.pow((GsRGB+0.055)/1.055, 2.4);
    var B = (BsRGB <= 0.03928) ? BsRGB/12.92 : Math.pow((BsRGB+0.055)/1.055, 2.4);

    // For the sRGB colorspace, the relative luminance of a color is defined as: 
    var L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    return L;
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function extend( a, b ) {
    for( var key in b ) {
        if( b.hasOwnProperty( key ) ) {
            a[key] = b[key];
        }
    }
    return a;
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

},{"./audio-control":60,"./cobrowsing":61,"./core":62,"./debug":63,"./lodash-fns":64,"./request":66,"./storage":67,"./templates":68,"./webrtc":69,"domify":1}]},{},[65])(65)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZG9taWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9mb3JlYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9kYXRlL25vdy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vZGVib3VuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2Z1bmN0aW9uL3Jlc3RQYXJhbS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvZnVuY3Rpb24vdGhyb3R0bGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5Q29weS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hc3NpZ25Pd25EZWZhdWx0cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXNzaWduV2l0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUNvcHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRm9yLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRm9ySW4uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VGb3JPd24uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VNZXJnZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZU1lcmdlRGVlcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlVG9TdHJpbmcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VWYWx1ZXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2JpbmRDYWxsYmFjay5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQXNzaWduZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUJhc2VFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVCYXNlRm9yLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVGb3JFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9lc2NhcGVIdG1sQ2hhci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZXNjYXBlU3RyaW5nQ2hhci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZ2V0TGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXROYXRpdmUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzQXJyYXlMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0l0ZXJhdGVlQ2FsbC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNMZW5ndGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzT2JqZWN0TGlrZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvcmVFc2NhcGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3JlRXZhbHVhdGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3JlSW50ZXJwb2xhdGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3NoaW1LZXlzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90b09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzRXJyb3IuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNGdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc05hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc09iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzVHlwZWRBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy90b1BsYWluT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L2tleXNJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L21lcmdlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9zdHJpbmcvZXNjYXBlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9zdHJpbmcvdGVtcGxhdGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3N0cmluZy90ZW1wbGF0ZVNldHRpbmdzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC91dGlsaXR5L2F0dGVtcHQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL3V0aWxpdHkvaWRlbnRpdHkuanMiLCJzb3VyY2Uvc2NyaXB0cy9hdWRpby1jb250cm9sLmpzIiwic291cmNlL3NjcmlwdHMvY29icm93c2luZy5qcyIsInNvdXJjZS9zY3JpcHRzL2NvcmUuanMiLCJzb3VyY2Uvc2NyaXB0cy9kZWJ1Zy5qcyIsInNvdXJjZS9zY3JpcHRzL2xvZGFzaC1mbnMuanMiLCJzb3VyY2Uvc2NyaXB0cy9tYWluLmpzIiwic291cmNlL3NjcmlwdHMvcmVxdWVzdC5qcyIsInNvdXJjZS9zY3JpcHRzL3N0b3JhZ2UuanMiLCJzb3VyY2Uvc2NyaXB0cy90ZW1wbGF0ZXMuanMiLCJzb3VyY2Uvc2NyaXB0cy93ZWJydGMuanMiLCJzb3VyY2Uvc2NyaXB0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzV3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3YvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBUZXN0cyBmb3IgYnJvd3NlciBzdXBwb3J0LlxuICovXG5cbnZhciBpbm5lckhUTUxCdWcgPSBmYWxzZTtcbnZhciBidWdUZXN0RGl2O1xuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgYnVnVGVzdERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAvLyBTZXR1cFxuICBidWdUZXN0RGl2LmlubmVySFRNTCA9ICcgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+JztcbiAgLy8gTWFrZSBzdXJlIHRoYXQgbGluayBlbGVtZW50cyBnZXQgc2VyaWFsaXplZCBjb3JyZWN0bHkgYnkgaW5uZXJIVE1MXG4gIC8vIFRoaXMgcmVxdWlyZXMgYSB3cmFwcGVyIGVsZW1lbnQgaW4gSUVcbiAgaW5uZXJIVE1MQnVnID0gIWJ1Z1Rlc3REaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpbmsnKS5sZW5ndGg7XG4gIGJ1Z1Rlc3REaXYgPSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogV3JhcCBtYXAgZnJvbSBqcXVlcnkuXG4gKi9cblxudmFyIG1hcCA9IHtcbiAgbGVnZW5kOiBbMSwgJzxmaWVsZHNldD4nLCAnPC9maWVsZHNldD4nXSxcbiAgdHI6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICBjb2w6IFsyLCAnPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD4nLCAnPC9jb2xncm91cD48L3RhYmxlPiddLFxuICAvLyBmb3Igc2NyaXB0L2xpbmsvc3R5bGUgdGFncyB0byB3b3JrIGluIElFNi04LCB5b3UgaGF2ZSB0byB3cmFwXG4gIC8vIGluIGEgZGl2IHdpdGggYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgaW4gZnJvbnQsIGhhIVxuICBfZGVmYXVsdDogaW5uZXJIVE1MQnVnID8gWzEsICdYPGRpdj4nLCAnPC9kaXY+J10gOiBbMCwgJycsICcnXVxufTtcblxubWFwLnRkID1cbm1hcC50aCA9IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddO1xuXG5tYXAub3B0aW9uID1cbm1hcC5vcHRncm91cCA9IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddO1xuXG5tYXAudGhlYWQgPVxubWFwLnRib2R5ID1cbm1hcC5jb2xncm91cCA9XG5tYXAuY2FwdGlvbiA9XG5tYXAudGZvb3QgPSBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXTtcblxubWFwLnBvbHlsaW5lID1cbm1hcC5lbGxpcHNlID1cbm1hcC5wb2x5Z29uID1cbm1hcC5jaXJjbGUgPVxubWFwLnRleHQgPVxubWFwLmxpbmUgPVxubWFwLnBhdGggPVxubWFwLnJlY3QgPVxubWFwLmcgPSBbMSwgJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLCc8L3N2Zz4nXTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiBhIERPTSBOb2RlIGluc3RhbmNlLCB3aGljaCBjb3VsZCBiZSBhIFRleHROb2RlLFxuICogSFRNTCBET00gTm9kZSBvZiBzb21lIGtpbmQgKDxkaXY+IGZvciBleGFtcGxlKSwgb3IgYSBEb2N1bWVudEZyYWdtZW50XG4gKiBpbnN0YW5jZSwgZGVwZW5kaW5nIG9uIHRoZSBjb250ZW50cyBvZiB0aGUgYGh0bWxgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbCAtIEhUTUwgc3RyaW5nIHRvIFwiZG9taWZ5XCJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvYyAtIFRoZSBgZG9jdW1lbnRgIGluc3RhbmNlIHRvIGNyZWF0ZSB0aGUgTm9kZSBmb3JcbiAqIEByZXR1cm4ge0RPTU5vZGV9IHRoZSBUZXh0Tm9kZSwgRE9NIE5vZGUsIG9yIERvY3VtZW50RnJhZ21lbnQgaW5zdGFuY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKGh0bWwsIGRvYykge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuXG4gIC8vIGRlZmF1bHQgdG8gdGhlIGdsb2JhbCBgZG9jdW1lbnRgIG9iamVjdFxuICBpZiAoIWRvYykgZG9jID0gZG9jdW1lbnQ7XG5cbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSByZXR1cm4gZG9jLmNyZWF0ZVRleHROb2RlKGh0bWwpO1xuXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTsgLy8gUmVtb3ZlIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG4gIHZhciB0YWcgPSBtWzFdO1xuXG4gIC8vIGJvZHkgc3VwcG9ydFxuICBpZiAodGFnID09ICdib2R5Jykge1xuICAgIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuaW5uZXJIVE1MID0gcHJlZml4ICsgaHRtbCArIHN1ZmZpeDtcbiAgd2hpbGUgKGRlcHRoLS0pIGVsID0gZWwubGFzdENoaWxkO1xuXG4gIC8vIG9uZSBlbGVtZW50XG4gIGlmIChlbC5maXJzdENoaWxkID09IGVsLmxhc3RDaGlsZCkge1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHNldmVyYWwgZWxlbWVudHNcbiAgdmFyIGZyYWdtZW50ID0gZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKSk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnQ7XG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheUVhY2gnKSxcbiAgICBiYXNlRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VFYWNoJyksXG4gICAgY3JlYXRlRm9yRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUZvckVhY2gnKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGBjb2xsZWN0aW9uYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvciBlYWNoIGVsZW1lbnQuXG4gKiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6XG4gKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHlcbiAqIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogKipOb3RlOioqIEFzIHdpdGggb3RoZXIgXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMsIG9iamVjdHMgd2l0aCBhIFwibGVuZ3RoXCIgcHJvcGVydHlcbiAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICogbWF5IGJlIHVzZWQgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlYWNoXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8oWzEsIDJdKS5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAqICAgY29uc29sZS5sb2cobik7XG4gKiB9KS52YWx1ZSgpO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlIGZyb20gbGVmdCB0byByaWdodCBhbmQgcmV0dXJucyB0aGUgYXJyYXlcbiAqXG4gKiBfLmZvckVhY2goeyAnYSc6IDEsICdiJzogMiB9LCBmdW5jdGlvbihuLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2cobiwga2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlLWtleSBwYWlyIGFuZCByZXR1cm5zIHRoZSBvYmplY3QgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvckVhY2ggPSBjcmVhdGVGb3JFYWNoKGFycmF5RWFjaCwgYmFzZUVhY2gpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTm93ID0gZ2V0TmF0aXZlKERhdGUsICdub3cnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBVbml4IGVwb2NoXG4gKiAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IERhdGVcbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBpbnZva2VkXG4gKi9cbnZhciBub3cgPSBuYXRpdmVOb3cgfHwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJy4uL2RhdGUvbm93Jyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGludm9jYXRpb25zLiBQcm92aWRlIGFuIG9wdGlvbnMgb2JqZWN0IHRvIGluZGljYXRlIHRoYXQgYGZ1bmNgXG4gKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3RcbiAqIGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXMgaW52b2tlZFxuICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwOi8vZHJ1cGFsbW90aW9uLmNvbS9hcnRpY2xlL2RlYm91bmNlLWFuZC10aHJvdHRsZS12aXN1YWwtZXhwbGFuYXRpb24pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmVcbiAqICBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nXG4gKiAgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gYXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eFxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBpbnZva2UgYHNlbmRNYWlsYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzXG4gKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBlbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzXG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xuICogICAnbWF4V2FpdCc6IDEwMDBcbiAqIH0pKTtcbiAqXG4gKiAvLyBjYW5jZWwgYSBkZWJvdW5jZWQgY2FsbFxuICogdmFyIHRvZG9DaGFuZ2VzID0gXy5kZWJvdW5jZShiYXRjaExvZywgMTAwMCk7XG4gKiBPYmplY3Qub2JzZXJ2ZShtb2RlbHMudG9kbywgdG9kb0NoYW5nZXMpO1xuICpcbiAqIE9iamVjdC5vYnNlcnZlKG1vZGVscywgZnVuY3Rpb24oY2hhbmdlcykge1xuICogICBpZiAoXy5maW5kKGNoYW5nZXMsIHsgJ3VzZXInOiAndG9kbycsICd0eXBlJzogJ2RlbGV0ZSd9KSkge1xuICogICAgIHRvZG9DaGFuZ2VzLmNhbmNlbCgpO1xuICogICB9XG4gKiB9LCBbJ2RlbGV0ZSddKTtcbiAqXG4gKiAvLyAuLi5hdCBzb21lIHBvaW50IGBtb2RlbHMudG9kb2AgaXMgY2hhbmdlZFxuICogbW9kZWxzLnRvZG8uY29tcGxldGVkID0gdHJ1ZTtcbiAqXG4gKiAvLyAuLi5iZWZvcmUgMSBzZWNvbmQgaGFzIHBhc3NlZCBgbW9kZWxzLnRvZG9gIGlzIGRlbGV0ZWRcbiAqIC8vIHdoaWNoIGNhbmNlbHMgdGhlIGRlYm91bmNlZCBgdG9kb0NoYW5nZXNgIGNhbGxcbiAqIGRlbGV0ZSBtb2RlbHMudG9kbztcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgYXJncyxcbiAgICAgIG1heFRpbWVvdXRJZCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHN0YW1wLFxuICAgICAgdGhpc0FyZyxcbiAgICAgIHRpbWVvdXRJZCxcbiAgICAgIHRyYWlsaW5nQ2FsbCxcbiAgICAgIGxhc3RDYWxsZWQgPSAwLFxuICAgICAgbWF4V2FpdCA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB3YWl0IDwgMCA/IDAgOiAoK3dhaXQgfHwgMCk7XG4gIGlmIChvcHRpb25zID09PSB0cnVlKSB7XG4gICAgdmFyIGxlYWRpbmcgPSB0cnVlO1xuICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4V2FpdCA9ICdtYXhXYWl0JyBpbiBvcHRpb25zICYmIG5hdGl2ZU1heCgrb3B0aW9ucy5tYXhXYWl0IHx8IDAsIHdhaXQpO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgaWYgKHRpbWVvdXRJZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgIH1cbiAgICBsYXN0Q2FsbGVkID0gMDtcbiAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBjb21wbGV0ZShpc0NhbGxlZCwgaWQpIHtcbiAgICBpZiAoaWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfVxuICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGF5ZWQoKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93KCkgLSBzdGFtcCk7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgIGNvbXBsZXRlKHRyYWlsaW5nQ2FsbCwgbWF4VGltZW91dElkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1heERlbGF5ZWQoKSB7XG4gICAgY29tcGxldGUodHJhaWxpbmcsIHRpbWVvdXRJZCk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICBzdGFtcCA9IG5vdygpO1xuICAgIHRoaXNBcmcgPSB0aGlzO1xuICAgIHRyYWlsaW5nQ2FsbCA9IHRyYWlsaW5nICYmICh0aW1lb3V0SWQgfHwgIWxlYWRpbmcpO1xuXG4gICAgaWYgKG1heFdhaXQgPT09IGZhbHNlKSB7XG4gICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghbWF4VGltZW91dElkICYmICFsZWFkaW5nKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgIH1cbiAgICAgIHZhciByZW1haW5pbmcgPSBtYXhXYWl0IC0gKHN0YW1wIC0gbGFzdENhbGxlZCksXG4gICAgICAgICAgaXNDYWxsZWQgPSByZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiBtYXhXYWl0O1xuXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XG4gICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xuICAgIH1cbiAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGFyZ3MgPSB0aGlzQXJnID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGVcbiAqIGNyZWF0ZWQgZnVuY3Rpb24gYW5kIGFyZ3VtZW50cyBmcm9tIGBzdGFydGAgYW5kIGJleW9uZCBwcm92aWRlZCBhcyBhbiBhcnJheS5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgYmFzZWQgb24gdGhlIFtyZXN0IHBhcmFtZXRlcl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9yZXN0X3BhcmFtZXRlcnMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IGEgcmVzdCBwYXJhbWV0ZXIgdG8uXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PWZ1bmMubGVuZ3RoLTFdIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVzdCBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHNheSA9IF8ucmVzdFBhcmFtKGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3RQYXJhbShmdW5jLCBzdGFydCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICBzdGFydCA9IG5hdGl2ZU1heChzdGFydCA9PT0gdW5kZWZpbmVkID8gKGZ1bmMubGVuZ3RoIC0gMSkgOiAoK3N0YXJ0IHx8IDApLCAwKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgoYXJncy5sZW5ndGggLSBzdGFydCwgMCksXG4gICAgICAgIHJlc3QgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3RbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIHJlc3QpO1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIGFyZ3NbMV0sIHJlc3QpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IHJlc3Q7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgb3RoZXJBcmdzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN0UGFyYW07XG4iLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB0aHJvdHRsZWQgZnVuY3Rpb24gdGhhdCBvbmx5IGludm9rZXMgYGZ1bmNgIGF0IG1vc3Qgb25jZSBwZXJcbiAqIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgXG4gKiBtZXRob2QgdG8gY2FuY2VsIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGVcbiAqIHRoYXQgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZVxuICogYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiByZXR1cm4gdGhlXG4gKiByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpcyBpbnZva2VkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8udGhyb3R0bGVgIGFuZCBgXy5kZWJvdW5jZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgaW52b2NhdGlvbnMgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz10cnVlXSBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nXG4gKiAgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmdcbiAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nXG4gKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKSk7XG4gKlxuICogLy8gaW52b2tlIGByZW5ld1Rva2VuYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgYnV0IG5vdCBtb3JlIHRoYW4gb25jZSBldmVyeSA1IG1pbnV0ZXNcbiAqIGpRdWVyeSgnLmludGVyYWN0aXZlJykub24oJ2NsaWNrJywgXy50aHJvdHRsZShyZW5ld1Rva2VuLCAzMDAwMDAsIHtcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBjYW5jZWwgYSB0cmFpbGluZyB0aHJvdHRsZWQgY2FsbFxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgdGhyb3R0bGVkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgIGxlYWRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCB7ICdsZWFkaW5nJzogbGVhZGluZywgJ21heFdhaXQnOiArd2FpdCwgJ3RyYWlsaW5nJzogdHJhaWxpbmcgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCIvKipcbiAqIENvcGllcyB0aGUgdmFsdWVzIG9mIGBzb3VyY2VgIHRvIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IHNvdXJjZSBUaGUgYXJyYXkgdG8gY29weSB2YWx1ZXMgZnJvbS5cbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheT1bXV0gVGhlIGFycmF5IHRvIGNvcHkgdmFsdWVzIHRvLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5Q29weShzb3VyY2UsIGFycmF5KSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcblxuICBhcnJheSB8fCAoYXJyYXkgPSBBcnJheShsZW5ndGgpKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhcnJheVtpbmRleF0gPSBzb3VyY2VbaW5kZXhdO1xuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUNvcHk7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5mb3JFYWNoYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheUVhY2goYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlFYWNoO1xuIiwiLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCBieSBgXy50ZW1wbGF0ZWAgdG8gY3VzdG9taXplIGl0cyBgXy5hc3NpZ25gIHVzZS5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBsaWtlIGBhc3NpZ25EZWZhdWx0c2AgZXhjZXB0IHRoYXQgaXQgaWdub3Jlc1xuICogaW5oZXJpdGVkIHByb3BlcnR5IHZhbHVlcyB3aGVuIGNoZWNraW5nIGlmIGEgcHJvcGVydHkgaXMgYHVuZGVmaW5lZGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gb2JqZWN0VmFsdWUgVGhlIGRlc3RpbmF0aW9uIG9iamVjdCBwcm9wZXJ0eSB2YWx1ZS5cbiAqIEBwYXJhbSB7Kn0gc291cmNlVmFsdWUgVGhlIHNvdXJjZSBvYmplY3QgcHJvcGVydHkgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBvYmplY3QgYW5kIHNvdXJjZSB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgdmFsdWUgdG8gYXNzaWduIHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGFzc2lnbk93bkRlZmF1bHRzKG9iamVjdFZhbHVlLCBzb3VyY2VWYWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgcmV0dXJuIChvYmplY3RWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSlcbiAgICA/IHNvdXJjZVZhbHVlXG4gICAgOiBvYmplY3RWYWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhc3NpZ25Pd25EZWZhdWx0cztcbiIsInZhciBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uYXNzaWduYCBmb3IgY3VzdG9taXppbmcgYXNzaWduZWQgdmFsdWVzIHdpdGhvdXRcbiAqIHN1cHBvcnQgZm9yIGFyZ3VtZW50IGp1Z2dsaW5nLCBtdWx0aXBsZSBzb3VyY2VzLCBhbmQgYHRoaXNgIGJpbmRpbmcgYGN1c3RvbWl6ZXJgXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjdXN0b21pemVyIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduZWQgdmFsdWVzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xuZnVuY3Rpb24gYXNzaWduV2l0aChvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplcikge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHByb3BzID0ga2V5cyhzb3VyY2UpLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XSxcbiAgICAgICAgdmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgcmVzdWx0ID0gY3VzdG9taXplcih2YWx1ZSwgc291cmNlW2tleV0sIGtleSwgb2JqZWN0LCBzb3VyY2UpO1xuXG4gICAgaWYgKChyZXN1bHQgPT09IHJlc3VsdCA/IChyZXN1bHQgIT09IHZhbHVlKSA6ICh2YWx1ZSA9PT0gdmFsdWUpKSB8fFxuICAgICAgICAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiAhKGtleSBpbiBvYmplY3QpKSkge1xuICAgICAgb2JqZWN0W2tleV0gPSByZXN1bHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzaWduV2l0aDtcbiIsInZhciBiYXNlQ29weSA9IHJlcXVpcmUoJy4vYmFzZUNvcHknKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5hc3NpZ25gIHdpdGhvdXQgc3VwcG9ydCBmb3IgYXJndW1lbnQganVnZ2xpbmcsXG4gKiBtdWx0aXBsZSBzb3VyY2VzLCBhbmQgYGN1c3RvbWl6ZXJgIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgc291cmNlIG9iamVjdC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VBc3NpZ24ob2JqZWN0LCBzb3VyY2UpIHtcbiAgcmV0dXJuIHNvdXJjZSA9PSBudWxsXG4gICAgPyBvYmplY3RcbiAgICA6IGJhc2VDb3B5KHNvdXJjZSwga2V5cyhzb3VyY2UpLCBvYmplY3QpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VBc3NpZ247XG4iLCIvKipcbiAqIENvcGllcyBwcm9wZXJ0aWVzIG9mIGBzb3VyY2VgIHRvIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBvYmplY3QgdG8gY29weSBwcm9wZXJ0aWVzIGZyb20uXG4gKiBAcGFyYW0ge0FycmF5fSBwcm9wcyBUaGUgcHJvcGVydHkgbmFtZXMgdG8gY29weS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0PXt9XSBUaGUgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyB0by5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VDb3B5KHNvdXJjZSwgcHJvcHMsIG9iamVjdCkge1xuICBvYmplY3QgfHwgKG9iamVjdCA9IHt9KTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgb2JqZWN0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDb3B5O1xuIiwidmFyIGJhc2VGb3JPd24gPSByZXF1aXJlKCcuL2Jhc2VGb3JPd24nKSxcbiAgICBjcmVhdGVCYXNlRWFjaCA9IHJlcXVpcmUoJy4vY3JlYXRlQmFzZUVhY2gnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JFYWNoYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKi9cbnZhciBiYXNlRWFjaCA9IGNyZWF0ZUJhc2VFYWNoKGJhc2VGb3JPd24pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VFYWNoO1xuIiwidmFyIGNyZWF0ZUJhc2VGb3IgPSByZXF1aXJlKCcuL2NyZWF0ZUJhc2VGb3InKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgYmFzZUZvckluYCBhbmQgYGJhc2VGb3JPd25gIHdoaWNoIGl0ZXJhdGVzXG4gKiBvdmVyIGBvYmplY3RgIHByb3BlcnRpZXMgcmV0dXJuZWQgYnkgYGtleXNGdW5jYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvclxuICogZWFjaCBwcm9wZXJ0eS4gSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5XG4gKiByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBrZXlzRnVuYyBUaGUgZnVuY3Rpb24gdG8gZ2V0IHRoZSBrZXlzIG9mIGBvYmplY3RgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqL1xudmFyIGJhc2VGb3IgPSBjcmVhdGVCYXNlRm9yKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvcjtcbiIsInZhciBiYXNlRm9yID0gcmVxdWlyZSgnLi9iYXNlRm9yJyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvckluYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlRm9ySW4ob2JqZWN0LCBpdGVyYXRlZSkge1xuICByZXR1cm4gYmFzZUZvcihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzSW4pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGb3JJbjtcbiIsInZhciBiYXNlRm9yID0gcmVxdWlyZSgnLi9iYXNlRm9yJyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yT3duYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBiYXNlRm9yT3duKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgcmV0dXJuIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5cyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvck93bjtcbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuL2FycmF5RWFjaCcpLFxuICAgIGJhc2VNZXJnZURlZXAgPSByZXF1aXJlKCcuL2Jhc2VNZXJnZURlZXAnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0JyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1lcmdlYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFyZ3VtZW50IGp1Z2dsaW5nLFxuICogbXVsdGlwbGUgc291cmNlcywgYW5kIGB0aGlzYCBiaW5kaW5nIGBjdXN0b21pemVyYCBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBtZXJnZWQgdmFsdWVzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBzb3VyY2Ugb2JqZWN0cy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0I9W11dIEFzc29jaWF0ZXMgdmFsdWVzIHdpdGggc291cmNlIGNvdW50ZXJwYXJ0cy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VNZXJnZShvYmplY3QsIHNvdXJjZSwgY3VzdG9taXplciwgc3RhY2tBLCBzdGFja0IpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICB2YXIgaXNTcmNBcnIgPSBpc0FycmF5TGlrZShzb3VyY2UpICYmIChpc0FycmF5KHNvdXJjZSkgfHwgaXNUeXBlZEFycmF5KHNvdXJjZSkpLFxuICAgICAgcHJvcHMgPSBpc1NyY0FyciA/IHVuZGVmaW5lZCA6IGtleXMoc291cmNlKTtcblxuICBhcnJheUVhY2gocHJvcHMgfHwgc291cmNlLCBmdW5jdGlvbihzcmNWYWx1ZSwga2V5KSB7XG4gICAgaWYgKHByb3BzKSB7XG4gICAgICBrZXkgPSBzcmNWYWx1ZTtcbiAgICAgIHNyY1ZhbHVlID0gc291cmNlW2tleV07XG4gICAgfVxuICAgIGlmIChpc09iamVjdExpa2Uoc3JjVmFsdWUpKSB7XG4gICAgICBzdGFja0EgfHwgKHN0YWNrQSA9IFtdKTtcbiAgICAgIHN0YWNrQiB8fCAoc3RhY2tCID0gW10pO1xuICAgICAgYmFzZU1lcmdlRGVlcChvYmplY3QsIHNvdXJjZSwga2V5LCBiYXNlTWVyZ2UsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgdmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgICByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcih2YWx1ZSwgc3JjVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGlzQ29tbW9uID0gcmVzdWx0ID09PSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChpc0NvbW1vbikge1xuICAgICAgICByZXN1bHQgPSBzcmNWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICgocmVzdWx0ICE9PSB1bmRlZmluZWQgfHwgKGlzU3JjQXJyICYmICEoa2V5IGluIG9iamVjdCkpKSAmJlxuICAgICAgICAgIChpc0NvbW1vbiB8fCAocmVzdWx0ID09PSByZXN1bHQgPyAocmVzdWx0ICE9PSB2YWx1ZSkgOiAodmFsdWUgPT09IHZhbHVlKSkpKSB7XG4gICAgICAgIG9iamVjdFtrZXldID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmplY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZU1lcmdlO1xuIiwidmFyIGFycmF5Q29weSA9IHJlcXVpcmUoJy4vYXJyYXlDb3B5JyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi9pc0FycmF5TGlrZScpLFxuICAgIGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzUGxhaW5PYmplY3QnKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzVHlwZWRBcnJheScpLFxuICAgIHRvUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL3RvUGxhaW5PYmplY3QnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VNZXJnZWAgZm9yIGFycmF5cyBhbmQgb2JqZWN0cyB3aGljaCBwZXJmb3Jtc1xuICogZGVlcCBtZXJnZXMgYW5kIHRyYWNrcyB0cmF2ZXJzZWQgb2JqZWN0cyBlbmFibGluZyBvYmplY3RzIHdpdGggY2lyY3VsYXJcbiAqIHJlZmVyZW5jZXMgdG8gYmUgbWVyZ2VkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBtZXJnZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1lcmdlRnVuYyBUaGUgZnVuY3Rpb24gdG8gbWVyZ2UgdmFsdWVzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgbWVyZ2VkIHZhbHVlcy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgc291cmNlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBBc3NvY2lhdGVzIHZhbHVlcyB3aXRoIHNvdXJjZSBjb3VudGVycGFydHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZU1lcmdlRGVlcChvYmplY3QsIHNvdXJjZSwga2V5LCBtZXJnZUZ1bmMsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoLFxuICAgICAgc3JjVmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gc3JjVmFsdWUpIHtcbiAgICAgIG9iamVjdFtrZXldID0gc3RhY2tCW2xlbmd0aF07XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIodmFsdWUsIHNyY1ZhbHVlLCBrZXksIG9iamVjdCwgc291cmNlKSA6IHVuZGVmaW5lZCxcbiAgICAgIGlzQ29tbW9uID0gcmVzdWx0ID09PSB1bmRlZmluZWQ7XG5cbiAgaWYgKGlzQ29tbW9uKSB7XG4gICAgcmVzdWx0ID0gc3JjVmFsdWU7XG4gICAgaWYgKGlzQXJyYXlMaWtlKHNyY1ZhbHVlKSAmJiAoaXNBcnJheShzcmNWYWx1ZSkgfHwgaXNUeXBlZEFycmF5KHNyY1ZhbHVlKSkpIHtcbiAgICAgIHJlc3VsdCA9IGlzQXJyYXkodmFsdWUpXG4gICAgICAgID8gdmFsdWVcbiAgICAgICAgOiAoaXNBcnJheUxpa2UodmFsdWUpID8gYXJyYXlDb3B5KHZhbHVlKSA6IFtdKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNQbGFpbk9iamVjdChzcmNWYWx1ZSkgfHwgaXNBcmd1bWVudHMoc3JjVmFsdWUpKSB7XG4gICAgICByZXN1bHQgPSBpc0FyZ3VtZW50cyh2YWx1ZSlcbiAgICAgICAgPyB0b1BsYWluT2JqZWN0KHZhbHVlKVxuICAgICAgICA6IChpc1BsYWluT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDoge30pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlzQ29tbW9uID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8vIEFkZCB0aGUgc291cmNlIHZhbHVlIHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cyBhbmQgYXNzb2NpYXRlXG4gIC8vIGl0IHdpdGggaXRzIG1lcmdlZCB2YWx1ZS5cbiAgc3RhY2tBLnB1c2goc3JjVmFsdWUpO1xuICBzdGFja0IucHVzaChyZXN1bHQpO1xuXG4gIGlmIChpc0NvbW1vbikge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IG1lcmdlIG9iamVjdHMgYW5kIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIG9iamVjdFtrZXldID0gbWVyZ2VGdW5jKHJlc3VsdCwgc3JjVmFsdWUsIGN1c3RvbWl6ZXIsIHN0YWNrQSwgc3RhY2tCKTtcbiAgfSBlbHNlIGlmIChyZXN1bHQgPT09IHJlc3VsdCA/IChyZXN1bHQgIT09IHZhbHVlKSA6ICh2YWx1ZSA9PT0gdmFsdWUpKSB7XG4gICAgb2JqZWN0W2tleV0gPSByZXN1bHQ7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlTWVyZ2VEZWVwO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlUHJvcGVydHk7XG4iLCIvKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgaWYgaXQncyBub3Qgb25lLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWRcbiAqIGZvciBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBiYXNlVG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6ICh2YWx1ZSArICcnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVG9TdHJpbmc7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnZhbHVlc2AgYW5kIGBfLnZhbHVlc0luYCB3aGljaCBjcmVhdGVzIGFuXG4gKiBhcnJheSBvZiBgb2JqZWN0YCBwcm9wZXJ0eSB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgcHJvcGVydHkgbmFtZXNcbiAqIG9mIGBwcm9wc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBnZXQgdmFsdWVzIGZvci5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gYmFzZVZhbHVlcyhvYmplY3QsIHByb3BzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBvYmplY3RbcHJvcHNbaW5kZXhdXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VWYWx1ZXM7XG4iLCJ2YXIgaWRlbnRpdHkgPSByZXF1aXJlKCcuLi91dGlsaXR5L2lkZW50aXR5Jyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlQ2FsbGJhY2tgIHdoaWNoIG9ubHkgc3VwcG9ydHMgYHRoaXNgIGJpbmRpbmdcbiAqIGFuZCBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICogQHBhcmFtIHsqfSB0aGlzQXJnIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gKiBAcGFyYW0ge251bWJlcn0gW2FyZ0NvdW50XSBUaGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY2FsbGJhY2suXG4gKi9cbmZ1bmN0aW9uIGJpbmRDYWxsYmFjayhmdW5jLCB0aGlzQXJnLCBhcmdDb3VudCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBpZGVudGl0eTtcbiAgfVxuICBpZiAodGhpc0FyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgc3dpdGNoIChhcmdDb3VudCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBvdGhlciwga2V5LCBvYmplY3QsIHNvdXJjZSkge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgb3RoZXIsIGtleSwgb2JqZWN0LCBzb3VyY2UpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZENhbGxiYWNrO1xuIiwidmFyIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyksXG4gICAgaXNJdGVyYXRlZUNhbGwgPSByZXF1aXJlKCcuL2lzSXRlcmF0ZWVDYWxsJyksXG4gICAgcmVzdFBhcmFtID0gcmVxdWlyZSgnLi4vZnVuY3Rpb24vcmVzdFBhcmFtJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBfLmFzc2lnbmAsIGBfLmRlZmF1bHRzYCwgb3IgYF8ubWVyZ2VgIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBhc3NpZ25lciBUaGUgZnVuY3Rpb24gdG8gYXNzaWduIHZhbHVlcy5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGFzc2lnbmVyIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVBc3NpZ25lcihhc3NpZ25lcikge1xuICByZXR1cm4gcmVzdFBhcmFtKGZ1bmN0aW9uKG9iamVjdCwgc291cmNlcykge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBvYmplY3QgPT0gbnVsbCA/IDAgOiBzb3VyY2VzLmxlbmd0aCxcbiAgICAgICAgY3VzdG9taXplciA9IGxlbmd0aCA+IDIgPyBzb3VyY2VzW2xlbmd0aCAtIDJdIDogdW5kZWZpbmVkLFxuICAgICAgICBndWFyZCA9IGxlbmd0aCA+IDIgPyBzb3VyY2VzWzJdIDogdW5kZWZpbmVkLFxuICAgICAgICB0aGlzQXJnID0gbGVuZ3RoID4gMSA/IHNvdXJjZXNbbGVuZ3RoIC0gMV0gOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGN1c3RvbWl6ZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY3VzdG9taXplciA9IGJpbmRDYWxsYmFjayhjdXN0b21pemVyLCB0aGlzQXJnLCA1KTtcbiAgICAgIGxlbmd0aCAtPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXN0b21pemVyID0gdHlwZW9mIHRoaXNBcmcgPT0gJ2Z1bmN0aW9uJyA/IHRoaXNBcmcgOiB1bmRlZmluZWQ7XG4gICAgICBsZW5ndGggLT0gKGN1c3RvbWl6ZXIgPyAxIDogMCk7XG4gICAgfVxuICAgIGlmIChndWFyZCAmJiBpc0l0ZXJhdGVlQ2FsbChzb3VyY2VzWzBdLCBzb3VyY2VzWzFdLCBndWFyZCkpIHtcbiAgICAgIGN1c3RvbWl6ZXIgPSBsZW5ndGggPCAzID8gdW5kZWZpbmVkIDogY3VzdG9taXplcjtcbiAgICAgIGxlbmd0aCA9IDE7XG4gICAgfVxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICB2YXIgc291cmNlID0gc291cmNlc1tpbmRleF07XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGFzc2lnbmVyKG9iamVjdCwgc291cmNlLCBjdXN0b21pemVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQXNzaWduZXI7XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYGJhc2VFYWNoYCBvciBgYmFzZUVhY2hSaWdodGAgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRWFjaChlYWNoRnVuYywgZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBpdGVyYXRlZSkge1xuICAgIHZhciBsZW5ndGggPSBjb2xsZWN0aW9uID8gZ2V0TGVuZ3RoKGNvbGxlY3Rpb24pIDogMDtcbiAgICBpZiAoIWlzTGVuZ3RoKGxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBlYWNoRnVuYyhjb2xsZWN0aW9uLCBpdGVyYXRlZSk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IGZyb21SaWdodCA/IGxlbmd0aCA6IC0xLFxuICAgICAgICBpdGVyYWJsZSA9IHRvT2JqZWN0KGNvbGxlY3Rpb24pO1xuXG4gICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgIGlmIChpdGVyYXRlZShpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRWFjaDtcbiIsInZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYmFzZSBmdW5jdGlvbiBmb3IgYF8uZm9ySW5gIG9yIGBfLmZvckluUmlnaHRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VGb3IoZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzRnVuYykge1xuICAgIHZhciBpdGVyYWJsZSA9IHRvT2JqZWN0KG9iamVjdCksXG4gICAgICAgIHByb3BzID0ga2V5c0Z1bmMob2JqZWN0KSxcbiAgICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgICBpbmRleCA9IGZyb21SaWdodCA/IGxlbmd0aCA6IC0xO1xuXG4gICAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVba2V5XSwga2V5LCBpdGVyYWJsZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUJhc2VGb3I7XG4iLCJ2YXIgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi9iaW5kQ2FsbGJhY2snKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGZvciBgXy5mb3JFYWNoYCBvciBgXy5mb3JFYWNoUmlnaHRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBhcnJheUZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhbiBhcnJheS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZWFjaCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRm9yRWFjaChhcnJheUZ1bmMsIGVhY2hGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBpdGVyYXRlZSwgdGhpc0FyZykge1xuICAgIHJldHVybiAodHlwZW9mIGl0ZXJhdGVlID09ICdmdW5jdGlvbicgJiYgdGhpc0FyZyA9PT0gdW5kZWZpbmVkICYmIGlzQXJyYXkoY29sbGVjdGlvbikpXG4gICAgICA/IGFycmF5RnVuYyhjb2xsZWN0aW9uLCBpdGVyYXRlZSlcbiAgICAgIDogZWFjaEZ1bmMoY29sbGVjdGlvbiwgYmluZENhbGxiYWNrKGl0ZXJhdGVlLCB0aGlzQXJnLCAzKSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRm9yRWFjaDtcbiIsIi8qKiBVc2VkIHRvIG1hcCBjaGFyYWN0ZXJzIHRvIEhUTUwgZW50aXRpZXMuICovXG52YXIgaHRtbEVzY2FwZXMgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmIzM5OycsXG4gICdgJzogJyYjOTY7J1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLmVzY2FwZWAgdG8gY29udmVydCBjaGFyYWN0ZXJzIHRvIEhUTUwgZW50aXRpZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaHIgVGhlIG1hdGNoZWQgY2hhcmFjdGVyIHRvIGVzY2FwZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICovXG5mdW5jdGlvbiBlc2NhcGVIdG1sQ2hhcihjaHIpIHtcbiAgcmV0dXJuIGh0bWxFc2NhcGVzW2Nocl07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlSHRtbENoYXI7XG4iLCIvKiogVXNlZCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscy4gKi9cbnZhciBzdHJpbmdFc2NhcGVzID0ge1xuICAnXFxcXCc6ICdcXFxcJyxcbiAgXCInXCI6IFwiJ1wiLFxuICAnXFxuJzogJ24nLFxuICAnXFxyJzogJ3InLFxuICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICdcXHUyMDI5JzogJ3UyMDI5J1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLnRlbXBsYXRlYCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGNociBUaGUgbWF0Y2hlZCBjaGFyYWN0ZXIgdG8gZXNjYXBlLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0NoYXIoY2hyKSB7XG4gIHJldHVybiAnXFxcXCcgKyBzdHJpbmdFc2NhcGVzW2Nocl07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlU3RyaW5nQ2hhcjtcbiIsInZhciBiYXNlUHJvcGVydHkgPSByZXF1aXJlKCcuL2Jhc2VQcm9wZXJ0eScpO1xuXG4vKipcbiAqIEdldHMgdGhlIFwibGVuZ3RoXCIgcHJvcGVydHkgdmFsdWUgb2YgYG9iamVjdGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBhdm9pZCBhIFtKSVQgYnVnXShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQyNzkyKVxuICogdGhhdCBhZmZlY3RzIFNhZmFyaSBvbiBhdCBsZWFzdCBpT1MgOC4xLTguMyBBUk02NC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIFwibGVuZ3RoXCIgdmFsdWUuXG4gKi9cbnZhciBnZXRMZW5ndGggPSBiYXNlUHJvcGVydHkoJ2xlbmd0aCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldExlbmd0aDtcbiIsInZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNOYXRpdmUnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIHJldHVybiBpc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYXRpdmU7XG4iLCJ2YXIgZ2V0TGVuZ3RoID0gcmVxdWlyZSgnLi9nZXRMZW5ndGgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNBcnJheUxpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgaXNMZW5ndGgoZ2V0TGVuZ3RoKHZhbHVlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheUxpa2U7XG4iLCIvKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXlxcZCskLztcblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBbbWF4aW11bSBsZW5ndGhdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW51bWJlci5tYXhfc2FmZV9pbnRlZ2VyKVxuICogb2YgYW4gYXJyYXktbGlrZSB2YWx1ZS5cbiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YWx1ZSA9ICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgfHwgcmVJc1VpbnQudGVzdCh2YWx1ZSkpID8gK3ZhbHVlIDogLTE7XG4gIGxlbmd0aCA9IGxlbmd0aCA9PSBudWxsID8gTUFYX1NBRkVfSU5URUdFUiA6IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlID4gLTEgJiYgdmFsdWUgJSAxID09IDAgJiYgdmFsdWUgPCBsZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJbmRleDtcbiIsInZhciBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4vaXNBcnJheUxpa2UnKSxcbiAgICBpc0luZGV4ID0gcmVxdWlyZSgnLi9pc0luZGV4JyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBwcm92aWRlZCBhcmd1bWVudHMgYXJlIGZyb20gYW4gaXRlcmF0ZWUgY2FsbC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIHZhbHVlIGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfSBpbmRleCBUaGUgcG90ZW50aWFsIGl0ZXJhdGVlIGluZGV4IG9yIGtleSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gb2JqZWN0IFRoZSBwb3RlbnRpYWwgaXRlcmF0ZWUgb2JqZWN0IGFyZ3VtZW50LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBhcmd1bWVudHMgYXJlIGZyb20gYW4gaXRlcmF0ZWUgY2FsbCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0l0ZXJhdGVlQ2FsbCh2YWx1ZSwgaW5kZXgsIG9iamVjdCkge1xuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHR5cGUgPSB0eXBlb2YgaW5kZXg7XG4gIGlmICh0eXBlID09ICdudW1iZXInXG4gICAgICA/IChpc0FycmF5TGlrZShvYmplY3QpICYmIGlzSW5kZXgoaW5kZXgsIG9iamVjdC5sZW5ndGgpKVxuICAgICAgOiAodHlwZSA9PSAnc3RyaW5nJyAmJiBpbmRleCBpbiBvYmplY3QpKSB7XG4gICAgdmFyIG90aGVyID0gb2JqZWN0W2luZGV4XTtcbiAgICByZXR1cm4gdmFsdWUgPT09IHZhbHVlID8gKHZhbHVlID09PSBvdGhlcikgOiAob3RoZXIgIT09IG90aGVyKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNJdGVyYXRlZUNhbGw7XG4iLCIvKipcbiAqIFVzZWQgYXMgdGhlIFttYXhpbXVtIGxlbmd0aF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtbnVtYmVyLm1heF9zYWZlX2ludGVnZXIpXG4gKiBvZiBhbiBhcnJheS1saWtlIHZhbHVlLlxuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyBiYXNlZCBvbiBbYFRvTGVuZ3RoYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9sZW5ndGgpLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgbGVuZ3RoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTGVuZ3RoKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVFc2NhcGUgPSAvPCUtKFtcXHNcXFNdKz8pJT4vZztcblxubW9kdWxlLmV4cG9ydHMgPSByZUVzY2FwZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVFdmFsdWF0ZSA9IC88JShbXFxzXFxTXSs/KSU+L2c7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVFdmFsdWF0ZTtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVJbnRlcnBvbGF0ZSA9IC88JT0oW1xcc1xcU10rPyklPi9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlSW50ZXJwb2xhdGU7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuL2lzSW5kZXgnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4vaXNMZW5ndGgnKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBjcmVhdGVzIGFuIGFycmF5IG9mIHRoZVxuICogb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIHNoaW1LZXlzKG9iamVjdCkge1xuICB2YXIgcHJvcHMgPSBrZXlzSW4ob2JqZWN0KSxcbiAgICAgIHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgbGVuZ3RoID0gcHJvcHNMZW5ndGggJiYgb2JqZWN0Lmxlbmd0aDtcblxuICB2YXIgYWxsb3dJbmRleGVzID0gISFsZW5ndGggJiYgaXNMZW5ndGgobGVuZ3RoKSAmJlxuICAgIChpc0FycmF5KG9iamVjdCkgfHwgaXNBcmd1bWVudHMob2JqZWN0KSk7XG5cbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoKytpbmRleCA8IHByb3BzTGVuZ3RoKSB7XG4gICAgdmFyIGtleSA9IHByb3BzW2luZGV4XTtcbiAgICBpZiAoKGFsbG93SW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgfHwgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hpbUtleXM7XG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLi9sYW5nL2lzT2JqZWN0Jyk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhbiBvYmplY3QgaWYgaXQncyBub3Qgb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiB0b09iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3QodmFsdWUpID8gdmFsdWUgOiBPYmplY3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvT2JqZWN0O1xuIiwidmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNBcnJheUxpa2UnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgcHJvcGVydHlJc0VudW1lcmFibGUgPSBvYmplY3RQcm90by5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBhcmd1bWVudHNgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0FycmF5TGlrZSh2YWx1ZSkgJiZcbiAgICBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiYgIXByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwodmFsdWUsICdjYWxsZWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FyZ3VtZW50cztcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9nZXROYXRpdmUnKSxcbiAgICBpc0xlbmd0aCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUlzQXJyYXkgPSBnZXROYXRpdmUoQXJyYXksICdpc0FycmF5Jyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0FycmF5KGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gYXJyYXlUYWc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXk7XG4iLCJ2YXIgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBlcnJvclRhZyA9ICdbb2JqZWN0IEVycm9yXSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFuIGBFcnJvcmAsIGBFdmFsRXJyb3JgLCBgUmFuZ2VFcnJvcmAsIGBSZWZlcmVuY2VFcnJvcmAsXG4gKiBgU3ludGF4RXJyb3JgLCBgVHlwZUVycm9yYCwgb3IgYFVSSUVycm9yYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGVycm9yIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRXJyb3IobmV3IEVycm9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRXJyb3IoRXJyb3IpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiB0eXBlb2YgdmFsdWUubWVzc2FnZSA9PSAnc3RyaW5nJyAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBlcnJvclRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Vycm9yO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZnVuY1RhZyA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaSB3aGljaCByZXR1cm4gJ2Z1bmN0aW9uJyBmb3IgcmVnZXhlc1xuICAvLyBhbmQgU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzLlxuICByZXR1cm4gaXNPYmplY3QodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IGZ1bmNUYWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBob3N0IGNvbnN0cnVjdG9ycyAoU2FmYXJpID4gNSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xudmFyIHJlSXNOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgZm5Ub1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZywgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc05hdGl2ZShBcnJheS5wcm90b3R5cGUucHVzaCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05hdGl2ZShfKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHJldHVybiByZUlzTmF0aXZlLnRlc3QoZm5Ub1N0cmluZy5jYWxsKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgcmVJc0hvc3RDdG9yLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgW2xhbmd1YWdlIHR5cGVdKGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDgpIG9mIGBPYmplY3RgLlxuICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXG4gIC8vIFNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MSBmb3IgbW9yZSBkZXRhaWxzLlxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsInZhciBiYXNlRm9ySW4gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRm9ySW4nKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgdGhhdCBpcywgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlXG4gKiBgT2JqZWN0YCBjb25zdHJ1Y3RvciBvciBvbmUgd2l0aCBhIGBbW1Byb3RvdHlwZV1dYCBvZiBgbnVsbGAuXG4gKlxuICogKipOb3RlOioqIFRoaXMgbWV0aG9kIGFzc3VtZXMgb2JqZWN0cyBjcmVhdGVkIGJ5IHRoZSBgT2JqZWN0YCBjb25zdHJ1Y3RvclxuICogaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiB9XG4gKlxuICogXy5pc1BsYWluT2JqZWN0KG5ldyBGb28pO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KHsgJ3gnOiAwLCAneSc6IDAgfSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHZhciBDdG9yO1xuXG4gIC8vIEV4aXQgZWFybHkgZm9yIG5vbiBgT2JqZWN0YCBvYmplY3RzLlxuICBpZiAoIShpc09iamVjdExpa2UodmFsdWUpICYmIG9ialRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdFRhZyAmJiAhaXNBcmd1bWVudHModmFsdWUpKSB8fFxuICAgICAgKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY29uc3RydWN0b3InKSAmJiAoQ3RvciA9IHZhbHVlLmNvbnN0cnVjdG9yLCB0eXBlb2YgQ3RvciA9PSAnZnVuY3Rpb24nICYmICEoQ3RvciBpbnN0YW5jZW9mIEN0b3IpKSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gSUUgPCA5IGl0ZXJhdGVzIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGJlZm9yZSBvd24gcHJvcGVydGllcy4gSWYgdGhlIGZpcnN0XG4gIC8vIGl0ZXJhdGVkIHByb3BlcnR5IGlzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWRcbiAgLy8gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICB2YXIgcmVzdWx0O1xuICAvLyBJbiBtb3N0IGVudmlyb25tZW50cyBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcyBhcmUgaXRlcmF0ZWQgYmVmb3JlXG4gIC8vIGl0cyBpbmhlcml0ZWQgcHJvcGVydGllcy4gSWYgdGhlIGxhc3QgaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3NcbiAgLy8gb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMuXG4gIGJhc2VGb3JJbih2YWx1ZSwgZnVuY3Rpb24oc3ViVmFsdWUsIGtleSkge1xuICAgIHJlc3VsdCA9IGtleTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQgPT09IHVuZGVmaW5lZCB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCByZXN1bHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUGxhaW5PYmplY3Q7XG4iLCJ2YXIgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBib29sVGFnID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXScsXG4gICAgZXJyb3JUYWcgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIG1hcFRhZyA9ICdbb2JqZWN0IE1hcF0nLFxuICAgIG51bWJlclRhZyA9ICdbb2JqZWN0IE51bWJlcl0nLFxuICAgIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgIHJlZ2V4cFRhZyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHNldFRhZyA9ICdbb2JqZWN0IFNldF0nLFxuICAgIHN0cmluZ1RhZyA9ICdbb2JqZWN0IFN0cmluZ10nLFxuICAgIHdlYWtNYXBUYWcgPSAnW29iamVjdCBXZWFrTWFwXSc7XG5cbnZhciBhcnJheUJ1ZmZlclRhZyA9ICdbb2JqZWN0IEFycmF5QnVmZmVyXScsXG4gICAgZmxvYXQzMlRhZyA9ICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgIGZsb2F0NjRUYWcgPSAnW29iamVjdCBGbG9hdDY0QXJyYXldJyxcbiAgICBpbnQ4VGFnID0gJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgaW50MTZUYWcgPSAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgaW50MzJUYWcgPSAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgdWludDhUYWcgPSAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgdWludDhDbGFtcGVkVGFnID0gJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICB1aW50MTZUYWcgPSAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgIHVpbnQzMlRhZyA9ICdbb2JqZWN0IFVpbnQzMkFycmF5XSc7XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IGB0b1N0cmluZ1RhZ2AgdmFsdWVzIG9mIHR5cGVkIGFycmF5cy4gKi9cbnZhciB0eXBlZEFycmF5VGFncyA9IHt9O1xudHlwZWRBcnJheVRhZ3NbZmxvYXQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1tmbG9hdDY0VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQ4VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2ludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1tpbnQzMlRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50OFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDhDbGFtcGVkVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbdWludDMyVGFnXSA9IHRydWU7XG50eXBlZEFycmF5VGFnc1thcmdzVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2FycmF5VGFnXSA9XG50eXBlZEFycmF5VGFnc1thcnJheUJ1ZmZlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tib29sVGFnXSA9XG50eXBlZEFycmF5VGFnc1tkYXRlVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Vycm9yVGFnXSA9XG50eXBlZEFycmF5VGFnc1tmdW5jVGFnXSA9IHR5cGVkQXJyYXlUYWdzW21hcFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbbnVtYmVyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW29iamVjdFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbcmVnZXhwVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3NldFRhZ10gPVxudHlwZWRBcnJheVRhZ3Nbc3RyaW5nVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3dlYWtNYXBUYWddID0gZmFsc2U7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmpUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSB0eXBlZCBhcnJheS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkobmV3IFVpbnQ4QXJyYXkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KFtdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICEhdHlwZWRBcnJheVRhZ3Nbb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZWRBcnJheTtcbiIsInZhciBiYXNlQ29weSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VDb3B5JyksXG4gICAga2V5c0luID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXNJbicpO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBwbGFpbiBvYmplY3QgZmxhdHRlbmluZyBpbmhlcml0ZWQgZW51bWVyYWJsZVxuICogcHJvcGVydGllcyBvZiBgdmFsdWVgIHRvIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBwbGFpbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY29udmVydGVkIHBsYWluIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5hc3NpZ24oeyAnYSc6IDEgfSwgbmV3IEZvbyk7XG4gKiAvLyA9PiB7ICdhJzogMSwgJ2InOiAyIH1cbiAqXG4gKiBfLmFzc2lnbih7ICdhJzogMSB9LCBfLnRvUGxhaW5PYmplY3QobmV3IEZvbykpO1xuICogLy8gPT4geyAnYSc6IDEsICdiJzogMiwgJ2MnOiAzIH1cbiAqL1xuZnVuY3Rpb24gdG9QbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gYmFzZUNvcHkodmFsdWUsIGtleXNJbih2YWx1ZSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvUGxhaW5PYmplY3Q7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIHNoaW1LZXlzID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvc2hpbUtleXMnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVLZXlzID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2tleXMnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy4gU2VlIHRoZVxuICogW0VTIHNwZWNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5rZXlzKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIF8ua2V5cygnaGknKTtcbiAqIC8vID0+IFsnMCcsICcxJ11cbiAqL1xudmFyIGtleXMgPSAhbmF0aXZlS2V5cyA/IHNoaW1LZXlzIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBDdG9yID0gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3QuY29uc3RydWN0b3I7XG4gIGlmICgodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0KSB8fFxuICAgICAgKHR5cGVvZiBvYmplY3QgIT0gJ2Z1bmN0aW9uJyAmJiBpc0FycmF5TGlrZShvYmplY3QpKSkge1xuICAgIHJldHVybiBzaGltS2V5cyhvYmplY3QpO1xuICB9XG4gIHJldHVybiBpc09iamVjdChvYmplY3QpID8gbmF0aXZlS2V5cyhvYmplY3QpIDogW107XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXM7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXNJbihuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJywgJ2MnXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBrZXlzSW4ob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgfVxuICB2YXIgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDtcbiAgbGVuZ3RoID0gKGxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKSAmJiBsZW5ndGgpIHx8IDA7XG5cbiAgdmFyIEN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICBpbmRleCA9IC0xLFxuICAgICAgaXNQcm90byA9IHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUgPT09IG9iamVjdCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCksXG4gICAgICBza2lwSW5kZXhlcyA9IGxlbmd0aCA+IDA7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gKGluZGV4ICsgJycpO1xuICB9XG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICBpZiAoIShza2lwSW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgJiZcbiAgICAgICAgIShrZXkgPT0gJ2NvbnN0cnVjdG9yJyAmJiAoaXNQcm90byB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzSW47XG4iLCJ2YXIgYmFzZU1lcmdlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZU1lcmdlJyksXG4gICAgY3JlYXRlQXNzaWduZXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9jcmVhdGVBc3NpZ25lcicpO1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IG1lcmdlcyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoZSBzb3VyY2Ugb2JqZWN0KHMpLCB0aGF0XG4gKiBkb24ndCByZXNvbHZlIHRvIGB1bmRlZmluZWRgIGludG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC4gU3Vic2VxdWVudCBzb3VyY2VzXG4gKiBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXMgc291cmNlcy4gSWYgYGN1c3RvbWl6ZXJgIGlzXG4gKiBwcm92aWRlZCBpdCdzIGludm9rZWQgdG8gcHJvZHVjZSB0aGUgbWVyZ2VkIHZhbHVlcyBvZiB0aGUgZGVzdGluYXRpb24gYW5kXG4gKiBzb3VyY2UgcHJvcGVydGllcy4gSWYgYGN1c3RvbWl6ZXJgIHJldHVybnMgYHVuZGVmaW5lZGAgbWVyZ2luZyBpcyBoYW5kbGVkXG4gKiBieSB0aGUgbWV0aG9kIGluc3RlYWQuIFRoZSBgY3VzdG9taXplcmAgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZCBpbnZva2VkXG4gKiB3aXRoIGZpdmUgYXJndW1lbnRzOiAob2JqZWN0VmFsdWUsIHNvdXJjZVZhbHVlLCBrZXksIG9iamVjdCwgc291cmNlKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHsuLi5PYmplY3R9IFtzb3VyY2VzXSBUaGUgc291cmNlIG9iamVjdHMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBhc3NpZ25lZCB2YWx1ZXMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGN1c3RvbWl6ZXJgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHVzZXJzID0ge1xuICogICAnZGF0YSc6IFt7ICd1c2VyJzogJ2Jhcm5leScgfSwgeyAndXNlcic6ICdmcmVkJyB9XVxuICogfTtcbiAqXG4gKiB2YXIgYWdlcyA9IHtcbiAqICAgJ2RhdGEnOiBbeyAnYWdlJzogMzYgfSwgeyAnYWdlJzogNDAgfV1cbiAqIH07XG4gKlxuICogXy5tZXJnZSh1c2VycywgYWdlcyk7XG4gKiAvLyA9PiB7ICdkYXRhJzogW3sgJ3VzZXInOiAnYmFybmV5JywgJ2FnZSc6IDM2IH0sIHsgJ3VzZXInOiAnZnJlZCcsICdhZ2UnOiA0MCB9XSB9XG4gKlxuICogLy8gdXNpbmcgYSBjdXN0b21pemVyIGNhbGxiYWNrXG4gKiB2YXIgb2JqZWN0ID0ge1xuICogICAnZnJ1aXRzJzogWydhcHBsZSddLFxuICogICAndmVnZXRhYmxlcyc6IFsnYmVldCddXG4gKiB9O1xuICpcbiAqIHZhciBvdGhlciA9IHtcbiAqICAgJ2ZydWl0cyc6IFsnYmFuYW5hJ10sXG4gKiAgICd2ZWdldGFibGVzJzogWydjYXJyb3QnXVxuICogfTtcbiAqXG4gKiBfLm1lcmdlKG9iamVjdCwgb3RoZXIsIGZ1bmN0aW9uKGEsIGIpIHtcbiAqICAgaWYgKF8uaXNBcnJheShhKSkge1xuICogICAgIHJldHVybiBhLmNvbmNhdChiKTtcbiAqICAgfVxuICogfSk7XG4gKiAvLyA9PiB7ICdmcnVpdHMnOiBbJ2FwcGxlJywgJ2JhbmFuYSddLCAndmVnZXRhYmxlcyc6IFsnYmVldCcsICdjYXJyb3QnXSB9XG4gKi9cbnZhciBtZXJnZSA9IGNyZWF0ZUFzc2lnbmVyKGJhc2VNZXJnZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2U7XG4iLCJ2YXIgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZVRvU3RyaW5nJyksXG4gICAgZXNjYXBlSHRtbENoYXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9lc2NhcGVIdG1sQ2hhcicpO1xuXG4vKiogVXNlZCB0byBtYXRjaCBIVE1MIGVudGl0aWVzIGFuZCBIVE1MIGNoYXJhY3RlcnMuICovXG52YXIgcmVVbmVzY2FwZWRIdG1sID0gL1smPD5cIidgXS9nLFxuICAgIHJlSGFzVW5lc2NhcGVkSHRtbCA9IFJlZ0V4cChyZVVuZXNjYXBlZEh0bWwuc291cmNlKTtcblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgY2hhcmFjdGVycyBcIiZcIiwgXCI8XCIsIFwiPlwiLCAnXCInLCBcIidcIiwgYW5kIFwiXFxgXCIsIGluIGBzdHJpbmdgIHRvXG4gKiB0aGVpciBjb3JyZXNwb25kaW5nIEhUTUwgZW50aXRpZXMuXG4gKlxuICogKipOb3RlOioqIE5vIG90aGVyIGNoYXJhY3RlcnMgYXJlIGVzY2FwZWQuIFRvIGVzY2FwZSBhZGRpdGlvbmFsIGNoYXJhY3RlcnNcbiAqIHVzZSBhIHRoaXJkLXBhcnR5IGxpYnJhcnkgbGlrZSBbX2hlX10oaHR0cHM6Ly9tdGhzLmJlL2hlKS5cbiAqXG4gKiBUaG91Z2ggdGhlIFwiPlwiIGNoYXJhY3RlciBpcyBlc2NhcGVkIGZvciBzeW1tZXRyeSwgY2hhcmFjdGVycyBsaWtlXG4gKiBcIj5cIiBhbmQgXCIvXCIgZG9uJ3QgbmVlZCBlc2NhcGluZyBpbiBIVE1MIGFuZCBoYXZlIG5vIHNwZWNpYWwgbWVhbmluZ1xuICogdW5sZXNzIHRoZXkncmUgcGFydCBvZiBhIHRhZyBvciB1bnF1b3RlZCBhdHRyaWJ1dGUgdmFsdWUuXG4gKiBTZWUgW01hdGhpYXMgQnluZW5zJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2FtYmlndW91cy1hbXBlcnNhbmRzKVxuICogKHVuZGVyIFwic2VtaS1yZWxhdGVkIGZ1biBmYWN0XCIpIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQmFja3RpY2tzIGFyZSBlc2NhcGVkIGJlY2F1c2UgaW4gSW50ZXJuZXQgRXhwbG9yZXIgPCA5LCB0aGV5IGNhbiBicmVhayBvdXRcbiAqIG9mIGF0dHJpYnV0ZSB2YWx1ZXMgb3IgSFRNTCBjb21tZW50cy4gU2VlIFsjNTldKGh0dHBzOi8vaHRtbDVzZWMub3JnLyM1OSksXG4gKiBbIzEwMl0oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzEwMiksIFsjMTA4XShodHRwczovL2h0bWw1c2VjLm9yZy8jMTA4KSwgYW5kXG4gKiBbIzEzM10oaHR0cHM6Ly9odG1sNXNlYy5vcmcvIzEzMykgb2YgdGhlIFtIVE1MNSBTZWN1cml0eSBDaGVhdHNoZWV0XShodHRwczovL2h0bWw1c2VjLm9yZy8pXG4gKiBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFdoZW4gd29ya2luZyB3aXRoIEhUTUwgeW91IHNob3VsZCBhbHdheXMgW3F1b3RlIGF0dHJpYnV0ZSB2YWx1ZXNdKGh0dHA6Ly93b25rby5jb20vcG9zdC9odG1sLWVzY2FwaW5nKVxuICogdG8gcmVkdWNlIFhTUyB2ZWN0b3JzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW3N0cmluZz0nJ10gVGhlIHN0cmluZyB0byBlc2NhcGUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBlc2NhcGVkIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5lc2NhcGUoJ2ZyZWQsIGJhcm5leSwgJiBwZWJibGVzJyk7XG4gKiAvLyA9PiAnZnJlZCwgYmFybmV5LCAmYW1wOyBwZWJibGVzJ1xuICovXG5mdW5jdGlvbiBlc2NhcGUoc3RyaW5nKSB7XG4gIC8vIFJlc2V0IGBsYXN0SW5kZXhgIGJlY2F1c2UgaW4gSUUgPCA5IGBTdHJpbmcjcmVwbGFjZWAgZG9lcyBub3QuXG4gIHN0cmluZyA9IGJhc2VUb1N0cmluZyhzdHJpbmcpO1xuICByZXR1cm4gKHN0cmluZyAmJiByZUhhc1VuZXNjYXBlZEh0bWwudGVzdChzdHJpbmcpKVxuICAgID8gc3RyaW5nLnJlcGxhY2UocmVVbmVzY2FwZWRIdG1sLCBlc2NhcGVIdG1sQ2hhcilcbiAgICA6IHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGU7XG4iLCJ2YXIgYXNzaWduT3duRGVmYXVsdHMgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hc3NpZ25Pd25EZWZhdWx0cycpLFxuICAgIGFzc2lnbldpdGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hc3NpZ25XaXRoJyksXG4gICAgYXR0ZW1wdCA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvYXR0ZW1wdCcpLFxuICAgIGJhc2VBc3NpZ24gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlQXNzaWduJyksXG4gICAgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZVRvU3RyaW5nJyksXG4gICAgYmFzZVZhbHVlcyA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VWYWx1ZXMnKSxcbiAgICBlc2NhcGVTdHJpbmdDaGFyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZXNjYXBlU3RyaW5nQ2hhcicpLFxuICAgIGlzRXJyb3IgPSByZXF1aXJlKCcuLi9sYW5nL2lzRXJyb3InKSxcbiAgICBpc0l0ZXJhdGVlQ2FsbCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzSXRlcmF0ZWVDYWxsJyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyksXG4gICAgcmVJbnRlcnBvbGF0ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL3JlSW50ZXJwb2xhdGUnKSxcbiAgICB0ZW1wbGF0ZVNldHRpbmdzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZVNldHRpbmdzJyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGVtcHR5IHN0cmluZyBsaXRlcmFscyBpbiBjb21waWxlZCB0ZW1wbGF0ZSBzb3VyY2UuICovXG52YXIgcmVFbXB0eVN0cmluZ0xlYWRpbmcgPSAvXFxiX19wIFxcKz0gJyc7L2csXG4gICAgcmVFbXB0eVN0cmluZ01pZGRsZSA9IC9cXGIoX19wIFxcKz0pICcnIFxcKy9nLFxuICAgIHJlRW1wdHlTdHJpbmdUcmFpbGluZyA9IC8oX19lXFwoLio/XFwpfFxcYl9fdFxcKSkgXFwrXFxuJyc7L2c7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIFtFUyB0ZW1wbGF0ZSBkZWxpbWl0ZXJzXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10ZW1wbGF0ZS1saXRlcmFsLWxleGljYWwtY29tcG9uZW50cykuICovXG52YXIgcmVFc1RlbXBsYXRlID0gL1xcJFxceyhbXlxcXFx9XSooPzpcXFxcLlteXFxcXH1dKikqKVxcfS9nO1xuXG4vKiogVXNlZCB0byBlbnN1cmUgY2FwdHVyaW5nIG9yZGVyIG9mIHRlbXBsYXRlIGRlbGltaXRlcnMuICovXG52YXIgcmVOb01hdGNoID0gLygkXikvO1xuXG4vKiogVXNlZCB0byBtYXRjaCB1bmVzY2FwZWQgY2hhcmFjdGVycyBpbiBjb21waWxlZCBzdHJpbmcgbGl0ZXJhbHMuICovXG52YXIgcmVVbmVzY2FwZWRTdHJpbmcgPSAvWydcXG5cXHJcXHUyMDI4XFx1MjAyOVxcXFxdL2c7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNvbXBpbGVkIHRlbXBsYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIGludGVycG9sYXRlIGRhdGEgcHJvcGVydGllc1xuICogaW4gXCJpbnRlcnBvbGF0ZVwiIGRlbGltaXRlcnMsIEhUTUwtZXNjYXBlIGludGVycG9sYXRlZCBkYXRhIHByb3BlcnRpZXMgaW5cbiAqIFwiZXNjYXBlXCIgZGVsaW1pdGVycywgYW5kIGV4ZWN1dGUgSmF2YVNjcmlwdCBpbiBcImV2YWx1YXRlXCIgZGVsaW1pdGVycy4gRGF0YVxuICogcHJvcGVydGllcyBtYXkgYmUgYWNjZXNzZWQgYXMgZnJlZSB2YXJpYWJsZXMgaW4gdGhlIHRlbXBsYXRlLiBJZiBhIHNldHRpbmdcbiAqIG9iamVjdCBpcyBwcm92aWRlZCBpdCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYF8udGVtcGxhdGVTZXR0aW5nc2AgdmFsdWVzLlxuICpcbiAqICoqTm90ZToqKiBJbiB0aGUgZGV2ZWxvcG1lbnQgYnVpbGQgYF8udGVtcGxhdGVgIHV0aWxpemVzXG4gKiBbc291cmNlVVJMc10oaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvZGV2ZWxvcGVydG9vbHMvc291cmNlbWFwcy8jdG9jLXNvdXJjZXVybClcbiAqIGZvciBlYXNpZXIgZGVidWdnaW5nLlxuICpcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHByZWNvbXBpbGluZyB0ZW1wbGF0ZXMgc2VlXG4gKiBbbG9kYXNoJ3MgY3VzdG9tIGJ1aWxkcyBkb2N1bWVudGF0aW9uXShodHRwczovL2xvZGFzaC5jb20vY3VzdG9tLWJ1aWxkcykuXG4gKlxuICogRm9yIG1vcmUgaW5mb3JtYXRpb24gb24gQ2hyb21lIGV4dGVuc2lvbiBzYW5kYm94ZXMgc2VlXG4gKiBbQ2hyb21lJ3MgZXh0ZW5zaW9ucyBkb2N1bWVudGF0aW9uXShodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2V4dGVuc2lvbnMvc2FuZGJveGluZ0V2YWwpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW3N0cmluZz0nJ10gVGhlIHRlbXBsYXRlIHN0cmluZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLmVzY2FwZV0gVGhlIEhUTUwgXCJlc2NhcGVcIiBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuZXZhbHVhdGVdIFRoZSBcImV2YWx1YXRlXCIgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmltcG9ydHNdIEFuIG9iamVjdCB0byBpbXBvcnQgaW50byB0aGUgdGVtcGxhdGUgYXMgZnJlZSB2YXJpYWJsZXMuXG4gKiBAcGFyYW0ge1JlZ0V4cH0gW29wdGlvbnMuaW50ZXJwb2xhdGVdIFRoZSBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNvdXJjZVVSTF0gVGhlIHNvdXJjZVVSTCBvZiB0aGUgdGVtcGxhdGUncyBjb21waWxlZCBzb3VyY2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudmFyaWFibGVdIFRoZSBkYXRhIG9iamVjdCB2YXJpYWJsZSBuYW1lLlxuICogQHBhcmFtLSB7T2JqZWN0fSBbb3RoZXJPcHRpb25zXSBFbmFibGVzIHRoZSBsZWdhY3kgYG9wdGlvbnNgIHBhcmFtIHNpZ25hdHVyZS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY29tcGlsZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIHVzaW5nIHRoZSBcImludGVycG9sYXRlXCIgZGVsaW1pdGVyIHRvIGNyZWF0ZSBhIGNvbXBpbGVkIHRlbXBsYXRlXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoZWxsbyA8JT0gdXNlciAlPiEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAnZnJlZCcgfSk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCEnXG4gKlxuICogLy8gdXNpbmcgdGhlIEhUTUwgXCJlc2NhcGVcIiBkZWxpbWl0ZXIgdG8gZXNjYXBlIGRhdGEgcHJvcGVydHkgdmFsdWVzXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCc8Yj48JS0gdmFsdWUgJT48L2I+Jyk7XG4gKiBjb21waWxlZCh7ICd2YWx1ZSc6ICc8c2NyaXB0PicgfSk7XG4gKiAvLyA9PiAnPGI+Jmx0O3NjcmlwdCZndDs8L2I+J1xuICpcbiAqIC8vIHVzaW5nIHRoZSBcImV2YWx1YXRlXCIgZGVsaW1pdGVyIHRvIGV4ZWN1dGUgSmF2YVNjcmlwdCBhbmQgZ2VuZXJhdGUgSFRNTFxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnPCUgXy5mb3JFYWNoKHVzZXJzLCBmdW5jdGlvbih1c2VyKSB7ICU+PGxpPjwlLSB1c2VyICU+PC9saT48JSB9KTsgJT4nKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXJzJzogWydmcmVkJywgJ2Jhcm5leSddIH0pO1xuICogLy8gPT4gJzxsaT5mcmVkPC9saT48bGk+YmFybmV5PC9saT4nXG4gKlxuICogLy8gdXNpbmcgdGhlIGludGVybmFsIGBwcmludGAgZnVuY3Rpb24gaW4gXCJldmFsdWF0ZVwiIGRlbGltaXRlcnNcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJzwlIHByaW50KFwiaGVsbG8gXCIgKyB1c2VyKTsgJT4hJyk7XG4gKiBjb21waWxlZCh7ICd1c2VyJzogJ2Jhcm5leScgfSk7XG4gKiAvLyA9PiAnaGVsbG8gYmFybmV5ISdcbiAqXG4gKiAvLyB1c2luZyB0aGUgRVMgZGVsaW1pdGVyIGFzIGFuIGFsdGVybmF0aXZlIHRvIHRoZSBkZWZhdWx0IFwiaW50ZXJwb2xhdGVcIiBkZWxpbWl0ZXJcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hlbGxvICR7IHVzZXIgfSEnKTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXInOiAncGViYmxlcycgfSk7XG4gKiAvLyA9PiAnaGVsbG8gcGViYmxlcyEnXG4gKlxuICogLy8gdXNpbmcgY3VzdG9tIHRlbXBsYXRlIGRlbGltaXRlcnNcbiAqIF8udGVtcGxhdGVTZXR0aW5ncy5pbnRlcnBvbGF0ZSA9IC97eyhbXFxzXFxTXSs/KX19L2c7XG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoZWxsbyB7eyB1c2VyIH19IScpO1xuICogY29tcGlsZWQoeyAndXNlcic6ICdtdXN0YWNoZScgfSk7XG4gKiAvLyA9PiAnaGVsbG8gbXVzdGFjaGUhJ1xuICpcbiAqIC8vIHVzaW5nIGJhY2tzbGFzaGVzIHRvIHRyZWF0IGRlbGltaXRlcnMgYXMgcGxhaW4gdGV4dFxuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSgnPCU9IFwiXFxcXDwlLSB2YWx1ZSAlXFxcXD5cIiAlPicpO1xuICogY29tcGlsZWQoeyAndmFsdWUnOiAnaWdub3JlZCcgfSk7XG4gKiAvLyA9PiAnPCUtIHZhbHVlICU+J1xuICpcbiAqIC8vIHVzaW5nIHRoZSBgaW1wb3J0c2Agb3B0aW9uIHRvIGltcG9ydCBgalF1ZXJ5YCBhcyBganFgXG4gKiB2YXIgdGV4dCA9ICc8JSBqcS5lYWNoKHVzZXJzLCBmdW5jdGlvbih1c2VyKSB7ICU+PGxpPjwlLSB1c2VyICU+PC9saT48JSB9KTsgJT4nO1xuICogdmFyIGNvbXBpbGVkID0gXy50ZW1wbGF0ZSh0ZXh0LCB7ICdpbXBvcnRzJzogeyAnanEnOiBqUXVlcnkgfSB9KTtcbiAqIGNvbXBpbGVkKHsgJ3VzZXJzJzogWydmcmVkJywgJ2Jhcm5leSddIH0pO1xuICogLy8gPT4gJzxsaT5mcmVkPC9saT48bGk+YmFybmV5PC9saT4nXG4gKlxuICogLy8gdXNpbmcgdGhlIGBzb3VyY2VVUkxgIG9wdGlvbiB0byBzcGVjaWZ5IGEgY3VzdG9tIHNvdXJjZVVSTCBmb3IgdGhlIHRlbXBsYXRlXG4gKiB2YXIgY29tcGlsZWQgPSBfLnRlbXBsYXRlKCdoZWxsbyA8JT0gdXNlciAlPiEnLCB7ICdzb3VyY2VVUkwnOiAnL2Jhc2ljL2dyZWV0aW5nLmpzdCcgfSk7XG4gKiBjb21waWxlZChkYXRhKTtcbiAqIC8vID0+IGZpbmQgdGhlIHNvdXJjZSBvZiBcImdyZWV0aW5nLmpzdFwiIHVuZGVyIHRoZSBTb3VyY2VzIHRhYiBvciBSZXNvdXJjZXMgcGFuZWwgb2YgdGhlIHdlYiBpbnNwZWN0b3JcbiAqXG4gKiAvLyB1c2luZyB0aGUgYHZhcmlhYmxlYCBvcHRpb24gdG8gZW5zdXJlIGEgd2l0aC1zdGF0ZW1lbnQgaXNuJ3QgdXNlZCBpbiB0aGUgY29tcGlsZWQgdGVtcGxhdGVcbiAqIHZhciBjb21waWxlZCA9IF8udGVtcGxhdGUoJ2hpIDwlPSBkYXRhLnVzZXIgJT4hJywgeyAndmFyaWFibGUnOiAnZGF0YScgfSk7XG4gKiBjb21waWxlZC5zb3VyY2U7XG4gKiAvLyA9PiBmdW5jdGlvbihkYXRhKSB7XG4gKiAvLyAgIHZhciBfX3QsIF9fcCA9ICcnO1xuICogLy8gICBfX3AgKz0gJ2hpICcgKyAoKF9fdCA9ICggZGF0YS51c2VyICkpID09IG51bGwgPyAnJyA6IF9fdCkgKyAnISc7XG4gKiAvLyAgIHJldHVybiBfX3A7XG4gKiAvLyB9XG4gKlxuICogLy8gdXNpbmcgdGhlIGBzb3VyY2VgIHByb3BlcnR5IHRvIGlubGluZSBjb21waWxlZCB0ZW1wbGF0ZXMgZm9yIG1lYW5pbmdmdWxcbiAqIC8vIGxpbmUgbnVtYmVycyBpbiBlcnJvciBtZXNzYWdlcyBhbmQgYSBzdGFjayB0cmFjZVxuICogZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4oY3dkLCAnanN0LmpzJyksICdcXFxuICogICB2YXIgSlNUID0ge1xcXG4gKiAgICAgXCJtYWluXCI6ICcgKyBfLnRlbXBsYXRlKG1haW5UZXh0KS5zb3VyY2UgKyAnXFxcbiAqICAgfTtcXFxuICogJyk7XG4gKi9cbmZ1bmN0aW9uIHRlbXBsYXRlKHN0cmluZywgb3B0aW9ucywgb3RoZXJPcHRpb25zKSB7XG4gIC8vIEJhc2VkIG9uIEpvaG4gUmVzaWcncyBgdG1wbGAgaW1wbGVtZW50YXRpb24gKGh0dHA6Ly9lam9obi5vcmcvYmxvZy9qYXZhc2NyaXB0LW1pY3JvLXRlbXBsYXRpbmcvKVxuICAvLyBhbmQgTGF1cmEgRG9rdG9yb3ZhJ3MgZG9ULmpzIChodHRwczovL2dpdGh1Yi5jb20vb2xhZG8vZG9UKS5cbiAgdmFyIHNldHRpbmdzID0gdGVtcGxhdGVTZXR0aW5ncy5pbXBvcnRzLl8udGVtcGxhdGVTZXR0aW5ncyB8fCB0ZW1wbGF0ZVNldHRpbmdzO1xuXG4gIGlmIChvdGhlck9wdGlvbnMgJiYgaXNJdGVyYXRlZUNhbGwoc3RyaW5nLCBvcHRpb25zLCBvdGhlck9wdGlvbnMpKSB7XG4gICAgb3B0aW9ucyA9IG90aGVyT3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgfVxuICBzdHJpbmcgPSBiYXNlVG9TdHJpbmcoc3RyaW5nKTtcbiAgb3B0aW9ucyA9IGFzc2lnbldpdGgoYmFzZUFzc2lnbih7fSwgb3RoZXJPcHRpb25zIHx8IG9wdGlvbnMpLCBzZXR0aW5ncywgYXNzaWduT3duRGVmYXVsdHMpO1xuXG4gIHZhciBpbXBvcnRzID0gYXNzaWduV2l0aChiYXNlQXNzaWduKHt9LCBvcHRpb25zLmltcG9ydHMpLCBzZXR0aW5ncy5pbXBvcnRzLCBhc3NpZ25Pd25EZWZhdWx0cyksXG4gICAgICBpbXBvcnRzS2V5cyA9IGtleXMoaW1wb3J0cyksXG4gICAgICBpbXBvcnRzVmFsdWVzID0gYmFzZVZhbHVlcyhpbXBvcnRzLCBpbXBvcnRzS2V5cyk7XG5cbiAgdmFyIGlzRXNjYXBpbmcsXG4gICAgICBpc0V2YWx1YXRpbmcsXG4gICAgICBpbmRleCA9IDAsXG4gICAgICBpbnRlcnBvbGF0ZSA9IG9wdGlvbnMuaW50ZXJwb2xhdGUgfHwgcmVOb01hdGNoLFxuICAgICAgc291cmNlID0gXCJfX3AgKz0gJ1wiO1xuXG4gIC8vIENvbXBpbGUgdGhlIHJlZ2V4cCB0byBtYXRjaCBlYWNoIGRlbGltaXRlci5cbiAgdmFyIHJlRGVsaW1pdGVycyA9IFJlZ0V4cChcbiAgICAob3B0aW9ucy5lc2NhcGUgfHwgcmVOb01hdGNoKS5zb3VyY2UgKyAnfCcgK1xuICAgIGludGVycG9sYXRlLnNvdXJjZSArICd8JyArXG4gICAgKGludGVycG9sYXRlID09PSByZUludGVycG9sYXRlID8gcmVFc1RlbXBsYXRlIDogcmVOb01hdGNoKS5zb3VyY2UgKyAnfCcgK1xuICAgIChvcHRpb25zLmV2YWx1YXRlIHx8IHJlTm9NYXRjaCkuc291cmNlICsgJ3wkJ1xuICAsICdnJyk7XG5cbiAgLy8gVXNlIGEgc291cmNlVVJMIGZvciBlYXNpZXIgZGVidWdnaW5nLlxuICB2YXIgc291cmNlVVJMID0gJ3NvdXJjZVVSTCcgaW4gb3B0aW9ucyA/ICcvLyMgc291cmNlVVJMPScgKyBvcHRpb25zLnNvdXJjZVVSTCArICdcXG4nIDogJyc7XG5cbiAgc3RyaW5nLnJlcGxhY2UocmVEZWxpbWl0ZXJzLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlVmFsdWUsIGludGVycG9sYXRlVmFsdWUsIGVzVGVtcGxhdGVWYWx1ZSwgZXZhbHVhdGVWYWx1ZSwgb2Zmc2V0KSB7XG4gICAgaW50ZXJwb2xhdGVWYWx1ZSB8fCAoaW50ZXJwb2xhdGVWYWx1ZSA9IGVzVGVtcGxhdGVWYWx1ZSk7XG5cbiAgICAvLyBFc2NhcGUgY2hhcmFjdGVycyB0aGF0IGNhbid0IGJlIGluY2x1ZGVkIGluIHN0cmluZyBsaXRlcmFscy5cbiAgICBzb3VyY2UgKz0gc3RyaW5nLnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UocmVVbmVzY2FwZWRTdHJpbmcsIGVzY2FwZVN0cmluZ0NoYXIpO1xuXG4gICAgLy8gUmVwbGFjZSBkZWxpbWl0ZXJzIHdpdGggc25pcHBldHMuXG4gICAgaWYgKGVzY2FwZVZhbHVlKSB7XG4gICAgICBpc0VzY2FwaW5nID0gdHJ1ZTtcbiAgICAgIHNvdXJjZSArPSBcIicgK1xcbl9fZShcIiArIGVzY2FwZVZhbHVlICsgXCIpICtcXG4nXCI7XG4gICAgfVxuICAgIGlmIChldmFsdWF0ZVZhbHVlKSB7XG4gICAgICBpc0V2YWx1YXRpbmcgPSB0cnVlO1xuICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlVmFsdWUgKyBcIjtcXG5fX3AgKz0gJ1wiO1xuICAgIH1cbiAgICBpZiAoaW50ZXJwb2xhdGVWYWx1ZSkge1xuICAgICAgc291cmNlICs9IFwiJyArXFxuKChfX3QgPSAoXCIgKyBpbnRlcnBvbGF0ZVZhbHVlICsgXCIpKSA9PSBudWxsID8gJycgOiBfX3QpICtcXG4nXCI7XG4gICAgfVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG4gICAgLy8gVGhlIEpTIGVuZ2luZSBlbWJlZGRlZCBpbiBBZG9iZSBwcm9kdWN0cyByZXF1aXJlcyByZXR1cm5pbmcgdGhlIGBtYXRjaGBcbiAgICAvLyBzdHJpbmcgaW4gb3JkZXIgdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBgb2Zmc2V0YCB2YWx1ZS5cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgLy8gSWYgYHZhcmlhYmxlYCBpcyBub3Qgc3BlY2lmaWVkIHdyYXAgYSB3aXRoLXN0YXRlbWVudCBhcm91bmQgdGhlIGdlbmVyYXRlZFxuICAvLyBjb2RlIHRvIGFkZCB0aGUgZGF0YSBvYmplY3QgdG8gdGhlIHRvcCBvZiB0aGUgc2NvcGUgY2hhaW4uXG4gIHZhciB2YXJpYWJsZSA9IG9wdGlvbnMudmFyaWFibGU7XG4gIGlmICghdmFyaWFibGUpIHtcbiAgICBzb3VyY2UgPSAnd2l0aCAob2JqKSB7XFxuJyArIHNvdXJjZSArICdcXG59XFxuJztcbiAgfVxuICAvLyBDbGVhbnVwIGNvZGUgYnkgc3RyaXBwaW5nIGVtcHR5IHN0cmluZ3MuXG4gIHNvdXJjZSA9IChpc0V2YWx1YXRpbmcgPyBzb3VyY2UucmVwbGFjZShyZUVtcHR5U3RyaW5nTGVhZGluZywgJycpIDogc291cmNlKVxuICAgIC5yZXBsYWNlKHJlRW1wdHlTdHJpbmdNaWRkbGUsICckMScpXG4gICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ1RyYWlsaW5nLCAnJDE7Jyk7XG5cbiAgLy8gRnJhbWUgY29kZSBhcyB0aGUgZnVuY3Rpb24gYm9keS5cbiAgc291cmNlID0gJ2Z1bmN0aW9uKCcgKyAodmFyaWFibGUgfHwgJ29iaicpICsgJykge1xcbicgK1xuICAgICh2YXJpYWJsZVxuICAgICAgPyAnJ1xuICAgICAgOiAnb2JqIHx8IChvYmogPSB7fSk7XFxuJ1xuICAgICkgK1xuICAgIFwidmFyIF9fdCwgX19wID0gJydcIiArXG4gICAgKGlzRXNjYXBpbmdcbiAgICAgICA/ICcsIF9fZSA9IF8uZXNjYXBlJ1xuICAgICAgIDogJydcbiAgICApICtcbiAgICAoaXNFdmFsdWF0aW5nXG4gICAgICA/ICcsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xcbicgK1xuICAgICAgICBcImZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxcblwiXG4gICAgICA6ICc7XFxuJ1xuICAgICkgK1xuICAgIHNvdXJjZSArXG4gICAgJ3JldHVybiBfX3BcXG59JztcblxuICB2YXIgcmVzdWx0ID0gYXR0ZW1wdChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oaW1wb3J0c0tleXMsIHNvdXJjZVVSTCArICdyZXR1cm4gJyArIHNvdXJjZSkuYXBwbHkodW5kZWZpbmVkLCBpbXBvcnRzVmFsdWVzKTtcbiAgfSk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24ncyBzb3VyY2UgYnkgaXRzIGB0b1N0cmluZ2AgbWV0aG9kIG9yXG4gIC8vIHRoZSBgc291cmNlYCBwcm9wZXJ0eSBhcyBhIGNvbnZlbmllbmNlIGZvciBpbmxpbmluZyBjb21waWxlZCB0ZW1wbGF0ZXMuXG4gIHJlc3VsdC5zb3VyY2UgPSBzb3VyY2U7XG4gIGlmIChpc0Vycm9yKHJlc3VsdCkpIHtcbiAgICB0aHJvdyByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTtcbiIsInZhciBlc2NhcGUgPSByZXF1aXJlKCcuL2VzY2FwZScpLFxuICAgIHJlRXNjYXBlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcmVFc2NhcGUnKSxcbiAgICByZUV2YWx1YXRlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcmVFdmFsdWF0ZScpLFxuICAgIHJlSW50ZXJwb2xhdGUgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9yZUludGVycG9sYXRlJyk7XG5cbi8qKlxuICogQnkgZGVmYXVsdCwgdGhlIHRlbXBsYXRlIGRlbGltaXRlcnMgdXNlZCBieSBsb2Rhc2ggYXJlIGxpa2UgdGhvc2UgaW5cbiAqIGVtYmVkZGVkIFJ1YnkgKEVSQikuIENoYW5nZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZVxuICogYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgT2JqZWN0XG4gKi9cbnZhciB0ZW1wbGF0ZVNldHRpbmdzID0ge1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGRldGVjdCBgZGF0YWAgcHJvcGVydHkgdmFsdWVzIHRvIGJlIEhUTUwtZXNjYXBlZC5cbiAgICpcbiAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgKiBAdHlwZSBSZWdFeHBcbiAgICovXG4gICdlc2NhcGUnOiByZUVzY2FwZSxcblxuICAvKipcbiAgICogVXNlZCB0byBkZXRlY3QgY29kZSB0byBiZSBldmFsdWF0ZWQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUgUmVnRXhwXG4gICAqL1xuICAnZXZhbHVhdGUnOiByZUV2YWx1YXRlLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGRldGVjdCBgZGF0YWAgcHJvcGVydHkgdmFsdWVzIHRvIGluamVjdC5cbiAgICpcbiAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgKiBAdHlwZSBSZWdFeHBcbiAgICovXG4gICdpbnRlcnBvbGF0ZSc6IHJlSW50ZXJwb2xhdGUsXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gcmVmZXJlbmNlIHRoZSBkYXRhIG9iamVjdCBpbiB0aGUgdGVtcGxhdGUgdGV4dC5cbiAgICpcbiAgICogQG1lbWJlck9mIF8udGVtcGxhdGVTZXR0aW5nc1xuICAgKiBAdHlwZSBzdHJpbmdcbiAgICovXG4gICd2YXJpYWJsZSc6ICcnLFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGltcG9ydCB2YXJpYWJsZXMgaW50byB0aGUgY29tcGlsZWQgdGVtcGxhdGUuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3NcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICAnaW1wb3J0cyc6IHtcblxuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBgbG9kYXNoYCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBfLnRlbXBsYXRlU2V0dGluZ3MuaW1wb3J0c1xuICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICovXG4gICAgJ18nOiB7ICdlc2NhcGUnOiBlc2NhcGUgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlU2V0dGluZ3M7XG4iLCJ2YXIgaXNFcnJvciA9IHJlcXVpcmUoJy4uL2xhbmcvaXNFcnJvcicpLFxuICAgIHJlc3RQYXJhbSA9IHJlcXVpcmUoJy4uL2Z1bmN0aW9uL3Jlc3RQYXJhbScpO1xuXG4vKipcbiAqIEF0dGVtcHRzIHRvIGludm9rZSBgZnVuY2AsIHJldHVybmluZyBlaXRoZXIgdGhlIHJlc3VsdCBvciB0aGUgY2F1Z2h0IGVycm9yXG4gKiBvYmplY3QuIEFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQgdG8gYGZ1bmNgIHdoZW4gaXQncyBpbnZva2VkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0eVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYXR0ZW1wdC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBgZnVuY2AgcmVzdWx0IG9yIGVycm9yIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gYXZvaWQgdGhyb3dpbmcgZXJyb3JzIGZvciBpbnZhbGlkIHNlbGVjdG9yc1xuICogdmFyIGVsZW1lbnRzID0gXy5hdHRlbXB0KGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gKiAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAqIH0sICc+Xz4nKTtcbiAqXG4gKiBpZiAoXy5pc0Vycm9yKGVsZW1lbnRzKSkge1xuICogICBlbGVtZW50cyA9IFtdO1xuICogfVxuICovXG52YXIgYXR0ZW1wdCA9IHJlc3RQYXJhbShmdW5jdGlvbihmdW5jLCBhcmdzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcbiAgfSBjYXRjaChlKSB7XG4gICAgcmV0dXJuIGlzRXJyb3IoZSkgPyBlIDogbmV3IEVycm9yKGUpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhdHRlbXB0O1xuIiwiLyoqXG4gKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byBpdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdHlcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgQW55IHZhbHVlLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgYHZhbHVlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAqXG4gKiBfLmlkZW50aXR5KG9iamVjdCkgPT09IG9iamVjdDtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5O1xuIiwidmFyIGF1ZGlvRWw7XG52YXIgZGlyID0gJyc7XG52YXIgZm9ybWF0ID0gJ3dhdic7XG52YXIgdm9sdW1lID0gMC41O1xudmFyIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xudmFyIGN1cnJGaWxlbmFtZSA9ICcnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRpbml0OiBmdW5jdGlvbihzb3VuZHNEaXIpIHtcblx0XHRhdWRpb0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRhdWRpb0VsLnNldEF0dHJpYnV0ZSgnYXV0b3BsYXknLCB0cnVlKTtcblx0XHRhdWRpb0VsLnZvbHVtZSA9IHZvbHVtZTtcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF1ZGlvRWwpO1xuXHRcdGlmKHNvdW5kc0RpcikgZGlyID0gc291bmRzRGlyO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHBsYXk6IGZ1bmN0aW9uKGZpbGVuYW1lLCBsb29wKSB7XG5cdFx0aWYoIWF1ZGlvRWwpIHJldHVybjtcblx0XHRpZihmaWxlbmFtZSAmJiBmaWxlbmFtZSAhPT0gY3VyckZpbGVuYW1lKSB7XG5cdFx0XHRhdWRpb0VsLnNyYyA9IChkaXIgKyBmaWxlbmFtZSArICcuJyArIGZvcm1hdCk7XG5cdFx0XHRpZihsb29wKSBhdWRpb0VsLnNldEF0dHJpYnV0ZSgnbG9vcCcsIHRydWUpO1xuXHRcdFx0ZWxzZSBhdWRpb0VsLnJlbW92ZUF0dHJpYnV0ZSgnbG9vcCcpO1xuXHRcdH1cblx0XHRcblx0XHRhdWRpb0VsLnBsYXkoKTtcblx0fSxcblxuXHRzdG9wOiBmdW5jdGlvbigpIHtcblx0XHRhdWRpb0VsLnBhdXNlKCk7XG5cdFx0YXVkaW9FbC5jdXJyZW50VGltZSA9IDA7XG5cdH1cblxufTsiLCJ2YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoLWZucycpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xudmFyIHJlbW90ZUV2ZW50cyA9IFtdO1xudmFyIGxvY2FsRXZlbnRzID0gW107XG52YXIgaW5pdGlhdGVkID0gZmFsc2U7XG52YXIgc2hhcmVkID0gZmFsc2U7XG52YXIgY3Vyc29yID0gbnVsbDtcbnZhciB3aWRnZXQ7XG52YXIgZW50aXR5ID0gJyc7XG52YXIgZW1pdDtcbnZhciBwYXRoID0gJyc7XG52YXIgZXZlbnRUaW1lc3RhbXAgPSAwO1xuLy8gdmFyIHVwZGF0ZUludGVydmFsID0gbnVsbDtcbi8vIHZhciB1cGRhdGVJbnRlcnZhbFZhbHVlID0gNTAwMDtcbi8vIHZhciB1cGRhdGVTdGF0ZUludGVydmFsID0gbnVsbDtcbi8vIHZhciBjaGVja0V2ZXJ5ID0gXy5kZWJvdW5jZSh1bnNoYXJlQnJvd3NlciwgMzAwMDApO1xuLy8gdmFyIGNoZWNrRXZlcnkgPSBfLmRlYm91bmNlKGVtaXRFdmVudHMsIDEwMCk7XG4vLyB2YXIgYWRkRXZlbnRzRXZlcnkgPSBfLmRlYm91bmNlKGVtaXRFdmVudHMsIDEwMCk7XG52YXIgYWRkRXZlbnRzRXZlcnkgPSBfLnRocm90dGxlKGVtaXRFdmVudHMsIDEwMCwgeyAndHJhaWxpbmcnOiB0cnVlLCAnbGVhZGluZyc6IHRydWUgfSk7XG52YXIgY3Vyc29yWCA9IDAsIGN1cnNvclkgPSAwO1xudmFyIHJlcXVlc3RBRjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGluaXQ6IGluaXQsXG5cdGlzSW5pdGlhdGVkOiBpc0luaXRpYXRlZCxcblx0c2hhcmU6IHNoYXJlQnJvd3Nlcixcblx0dW5zaGFyZTogdW5zaGFyZUJyb3dzZXIsXG5cdC8vIHVuc2hhcmVBbGw6IHVuc2hhcmVBbGwsXG5cdGVtaXRFdmVudHM6IGVtaXRFdmVudHMsXG5cdHVwZGF0ZUV2ZW50czogdXBkYXRlRXZlbnRzXG59O1xuXG5mdW5jdGlvbiBpc0luaXRpYXRlZCgpIHtcblx0cmV0dXJuIGluaXRpYXRlZDtcbn1cblxuZnVuY3Rpb24gaW5pdChvcHRpb25zKXtcblx0aWYoaW5pdGlhdGVkKSByZXR1cm4gZGVidWcuaW5mbygnQ29icm93c2luZyBhbHJlYWR5IGluaXRpYXRlZCcpO1xuXG5cdGFkZEV2ZW50KGRvY3VtZW50LCAna2V5dXAnLCBldmVudHNIYW5kbGVyKTtcblx0YWRkRXZlbnQoZG9jdW1lbnQsICdrZXlkb3duJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAna2V5cHJlc3MnLCBldmVudHNIYW5kbGVyKTtcblx0YWRkRXZlbnQoZG9jdW1lbnQsICdtb3VzZXVwJywgZXZlbnRzSGFuZGxlcik7XG5cdGFkZEV2ZW50KGRvY3VtZW50LCAnY2xpY2snLCBldmVudHNIYW5kbGVyKTtcblx0YWRkRXZlbnQoZG9jdW1lbnQsICdjaGFuZ2UnLCBldmVudHNIYW5kbGVyKTtcblxuXHR3aWRnZXQgPSAodHlwZW9mIG9wdGlvbnMud2lkZ2V0ID09PSAnc3RyaW5nJykgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMud2lkZ2V0KSA6IG9wdGlvbnMud2lkZ2V0O1xuXHRlbnRpdHkgPSBvcHRpb25zLmVudGl0eTtcblx0ZW1pdCA9IG9wdGlvbnMuZW1pdDtcblx0cGF0aCA9IG9wdGlvbnMucGF0aDtcblxuXHRpbml0aWF0ZWQgPSB0cnVlO1xuXHQvLyB1cGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGVtaXRFdmVudHMsIHVwZGF0ZUludGVydmFsVmFsdWUpO1xuXG5cdGRlYnVnLmxvZygnY29icm93c2luZyBtb2R1bGUgaW5pdGlhdGVkIHdpdGggcGFyYW1ldGVyczogJywgb3B0aW9ucyk7XG5cdGVtaXQoJ2NvYnJvd3NpbmcvaW5pdCcpO1xufVxuXG5mdW5jdGlvbiBzaGFyZUJyb3dzZXIoKXtcbiAgICBpZihzaGFyZWQpIHJldHVybiBkZWJ1Zy5pbmZvKCdCcm93c2VyIGFscmVhZHkgc2hhcmVkJyk7XG4gICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCBldmVudHNIYW5kbGVyKTtcbiAgICBhZGRFdmVudChkb2N1bWVudCwgJ3NlbGVjdCcsIGV2ZW50c0hhbmRsZXIpO1xuICAgIGFkZEV2ZW50KGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgZXZlbnRzSGFuZGxlcik7XG5cbiAgICAvLyBhZGRFdmVudChkb2N1bWVudCwgJ21vdXNlb3ZlcicsIGV2ZW50c0hhbmRsZXIpO1xuICAgIC8vIGFkZEV2ZW50KGRvY3VtZW50LCAnbW91c2VvdXQnLCBldmVudHNIYW5kbGVyKTtcbiAgICBcbiAgICBjcmVhdGVSZW1vdGVDdXJzb3IoKTtcbiAgICBcbiAgICBzaGFyZWQgPSB0cnVlO1xuICAgIC8vIHVwZGF0ZVN0YXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh1cGRhdGVTdGF0ZSwgdXBkYXRlSW50ZXJ2YWxWYWx1ZSk7XG4gICAgLy8gY2xlYXJJbnRlcnZhbCh1cGRhdGVJbnRlcnZhbCk7XG5cbiAgICBkZWJ1Zy5sb2coJ2Jyb3dzZXIgc2hhcmVkJyk7XG4gICAgZW1pdCgnY29icm93c2luZy9zaGFyZWQnLCB7IGVudGl0eTogZW50aXR5IH0pO1xufVxuXG5mdW5jdGlvbiB1bnNoYXJlQnJvd3Nlcigpe1xuXHRpZighc2hhcmVkKSByZXR1cm4gZGVidWcuaW5mbygnQnJvd3NlciBhbHJlYWR5IHVuc2hhcmVkJyk7XG5cbiAgICByZW1vdmVFdmVudChkb2N1bWVudCwgJ3Njcm9sbCcsIGV2ZW50c0hhbmRsZXIpO1xuICAgIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnc2VsZWN0JywgZXZlbnRzSGFuZGxlcik7XG4gICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBldmVudHNIYW5kbGVyKTtcblxuICAgIC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2VvdmVyJywgZXZlbnRzSGFuZGxlcik7XG4gICAgLy8gcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdtb3VzZW91dCcsIGV2ZW50c0hhbmRsZXIpO1xuICAgIFxuICAgIHJlbW92ZVJlbW90ZUN1cnNvcigpO1xuICAgIHNoYXJlZCA9IGZhbHNlO1xuICAgIC8vIHVwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZW1pdEV2ZW50cywgdXBkYXRlSW50ZXJ2YWxWYWx1ZSk7XG4gICAgLy8gY2xlYXJJbnRlcnZhbCh1cGRhdGVTdGF0ZUludGVydmFsKTtcblxuXHRlbWl0KCdjb2Jyb3dzaW5nL3Vuc2hhcmVkJywgeyBlbnRpdHk6IGVudGl0eSB9KTtcbiAgICBkZWJ1Zy5sb2coJ2Jyb3dzZXIgdW5zaGFyZWQnKTtcbn1cblxuLy8gZnVuY3Rpb24gdW5zaGFyZUFsbCgpe1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2tleXVwJywgZXZlbnRzSGFuZGxlcik7XG5cdC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAna2V5ZG93bicsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2tleXByZXNzJywgZXZlbnRzSGFuZGxlcik7XG5cdC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnbW91c2V1cCcsIGV2ZW50c0hhbmRsZXIpO1xuXHQvLyByZW1vdmVFdmVudChkb2N1bWVudCwgJ2NsaWNrJywgZXZlbnRzSGFuZGxlcik7XG5cdC8vIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnY2hhbmdlJywgZXZlbnRzSGFuZGxlcik7XG5cdC8vIGNsZWFySW50ZXJ2YWwodXBkYXRlSW50ZXJ2YWwpO1xuLy8gfVxuXG5mdW5jdGlvbiBjcmVhdGVSZW1vdGVDdXJzb3IoKXtcblx0dmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXHRpZighY3Vyc29yKSB7XG5cdFx0Y3Vyc29yPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRjdXJzb3IuY2xhc3NOYW1lID0gJ3djLXJtdC1wdHInO1xuXHRcdGN1cnNvci5zZXRBdHRyaWJ1dGUoJ3NyYycsIHBhdGgrJ2ltYWdlcy9wb2ludGVyLnBuZycpO1xuXHRcdGN1cnNvci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0aWYoYm9keS5maXJzdENoaWxkKSB7XG5cdFx0XHRib2R5Lmluc2VydEJlZm9yZShjdXJzb3IsIGJvZHkuZmlyc3RDaGlsZCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGJvZHkuYXBwZW5kQ2hpbGQoY3Vyc29yKTtcblx0XG5cdFx0fVxuXHRcdHJlZHJhd0N1cnNvcigpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlZHJhd0N1cnNvcigpe1xuXHRjdXJzb3Iuc3R5bGUubGVmdCA9IGN1cnNvclg7XG5cdGN1cnNvci5zdHlsZS50b3AgPSBjdXJzb3JZO1xuXHRyZXF1ZXN0QUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlZHJhd0N1cnNvcik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJlbW90ZUN1cnNvcigpe1xuXHRpZighY3Vyc29yKSByZXR1cm47XG5cdGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBRik7XG5cdGN1cnNvci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGN1cnNvcik7XG5cdGN1cnNvciA9IG51bGw7XG59XG5cbi8vZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI4OTcxNTUvZ2V0LWN1cnNvci1wb3NpdGlvbi1pbi1jaGFyYWN0ZXJzLXdpdGhpbi1hLXRleHQtaW5wdXQtZmllbGRcbmZ1bmN0aW9uIGdldENhcmV0UG9zaXRpb24gKG9GaWVsZCkge1xuICAvLyBJbml0aWFsaXplXG5cdHZhciBpQ2FyZXRQb3MgPSAwO1xuXG4gIC8vIElFIFN1cHBvcnRcbiAgICBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG5cbiAgICAvLyBTZXQgZm9jdXMgb24gdGhlIGVsZW1lbnRcbiAgICAgICAgb0ZpZWxkLmZvY3VzICgpO1xuXG4gICAgLy8gVG8gZ2V0IGN1cnNvciBwb3NpdGlvbiwgZ2V0IGVtcHR5IHNlbGVjdGlvbiByYW5nZVxuICAgICAgICB2YXIgb1NlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSAoKTtcblxuICAgIC8vIE1vdmUgc2VsZWN0aW9uIHN0YXJ0IHRvIDAgcG9zaXRpb25cbiAgICAgICAgb1NlbC5tb3ZlU3RhcnQgKCdjaGFyYWN0ZXInLCAtb0ZpZWxkLnZhbHVlLmxlbmd0aCk7XG5cbiAgICAvLyBUaGUgY2FyZXQgcG9zaXRpb24gaXMgc2VsZWN0aW9uIGxlbmd0aFxuICAgICAgICBpQ2FyZXRQb3MgPSBvU2VsLnRleHQubGVuZ3RoO1xuICAgIH1cbiAgICBlbHNlIGlmKG9GaWVsZC50eXBlICYmIChvRmllbGQudHlwZSA9PT0gJ2VtYWlsJyB8fCBvRmllbGQudHlwZSA9PT0gJ251bWJlcicpKXtcbiAgICAgICAgaUNhcmV0UG9zID0gbnVsbDtcbiAgICB9XG4gIC8vIEZpcmVmb3ggc3VwcG9ydFxuICAgIGVsc2UgaWYgKG9GaWVsZC5zZWxlY3Rpb25TdGFydCB8fCBvRmllbGQuc2VsZWN0aW9uU3RhcnQgPT0gJzAnKXtcbiAgICAgICAgaUNhcmV0UG9zID0gb0ZpZWxkLnNlbGVjdGlvblN0YXJ0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaUNhcmV0UG9zID0gbnVsbDtcbiAgICB9XG5cdC8vIFJldHVybiByZXN1bHRzXG5cdHJldHVybiAoaUNhcmV0UG9zKTtcbn1cblxuZnVuY3Rpb24gZW1pdEV2ZW50cyhldmVudHMpe1xuXHQvLyBpZihsb2NhbEV2ZW50cy5sZW5ndGgpIHtcblx0ZW1pdCgnY29icm93c2luZy9ldmVudCcsIHsgZW50aXR5OiBlbnRpdHksIGV2ZW50czogZXZlbnRzIH0pO1xuXHRcdC8vIGxvY2FsRXZlbnRzID0gW107XG5cdC8vIH1cbn1cblxuLy8gZnVuY3Rpb24gYWRkRXZlbnRzKGV2ZW50cykge1xuLy8gXHRsb2NhbEV2ZW50cy5wdXNoKGV2ZW50cyk7XG4vLyBcdGVtaXRFdmVudHMoKTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gdXBkYXRlU3RhdGUoKXtcbi8vIFx0bG9jYWxFdmVudHMucHVzaCh7IHNoYXJlZDogdHJ1ZSwgZW50aXR5OiBlbnRpdHkgfSk7XG4vLyB9XG5cbmZ1bmN0aW9uIGV2ZW50c0hhbmRsZXIoZXZ0KXtcblx0dmFyIGUgPSBldnQgfHwgd2luZG93LmV2ZW50LFxuXHRcdGV0eXBlID0gZS50eXBlLFxuXHRcdHRhcmcgPSBlLnRhcmdldCxcblx0XHRub2RlTmFtZSA9IHRhcmcubm9kZU5hbWUsXG5cdFx0ZGIgPSBkb2N1bWVudC5ib2R5LFxuXHRcdHBhcmFtcyA9IHt9LFxuXHRcdG5vZGVJbmRleCA9IG51bGwsXG5cdFx0bm9kZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YXJnLm5vZGVOYW1lKSxcblx0XHRzY3JvbGxUb3AgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wLFxuXHRcdHNjcm9sbExlZnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQsXG5cdFx0aSA9IDA7XG5cblx0Ly8gaWYgdGhlIHRhcmdldCBpcyB0ZXh0IG5vZGUsIGdldCBwYXJlbnQgbm9kZVxuXHRpZih0YXJnLm5vZGVUeXBlID09PSAzKSB0YXJnID0gdGFyZy5wYXJlbnROb2RlO1xuXG5cdC8vIHJldHVybiBpZiB0aGUgdGFyZ2V0IG5vZGUgaXMgdGhlIGRlc2NlbmRhbnQgb2Ygd2lkZ2V0IGVsZW1lbnRcblx0aWYoZW50aXR5ID09PSAndXNlcicgJiYgaXNEZXNjZW5kYW50KHdpZGdldCwgdGFyZykpIHJldHVybjtcblxuXHRmb3IoaT0wOyBpIDwgcmVtb3RlRXZlbnRzLmxlbmd0aDsgaSsrKXtcblx0XHRpZihyZW1vdGVFdmVudHNbaV0uZXZlbnQgPT0gZXR5cGUpe1xuXHRcdFx0cmVtb3RlRXZlbnRzLnNwbGljZShpLCAxKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblxuXHQvLyBnZXQgdGhlIGluZGV4IG9mIHRhcmdldCBub2RlXG5cdGZvcihpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspe1xuXHRcdGlmKG5vZGVzW2ldID09IHRhcmcpIG5vZGVJbmRleCA9IGk7XG5cdH1cblxuXHQvLyBldmVudCB0eXBlXG5cdHBhcmFtcy5ldmVudCA9IGV0eXBlO1xuXHQvLyBlbnRpdHlcblx0cGFyYW1zLmVudGl0eSA9IGVudGl0eTtcblx0Ly8gdGFyZ2V0IG5vZGVcblx0cGFyYW1zLnRuID0gbm9kZU5hbWU7XG5cdC8vIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuXHRwYXJhbXMudG5pID0gbm9kZUluZGV4O1xuXHQvLyBsYXlvdXQgd2lkdGggb2YgdGhlIGRvY3VtZW50LmJvZHlcblx0cGFyYW1zLncgPSBkYi5vZmZzZXRXaWR0aDtcblx0Ly8gbGF5b3V0IGhlaWdodCBvZiB0aGUgZG9jdW1lbnQuYm9keVxuXHRwYXJhbXMuaCA9IGRiLm9mZnNldEhlaWdodDtcblx0cGFyYW1zLnN4ID0gc2Nyb2xsTGVmdDtcblx0cGFyYW1zLnN5ID0gc2Nyb2xsVG9wO1xuXG5cdGlmKGV0eXBlID09PSAnbW91c2Vtb3ZlJyB8fCBldHlwZSA9PT0gJ21vdXNlb3ZlcicgfHwgZXR5cGUgPT09ICdtb3VzZW91dCcpIHtcblx0XHR2YXIgeCA9IGUucGFnZVggfHwgZS5jbGllbnRYICsgc2Nyb2xsVG9wO1xuXHRcdHZhciB5ID0gZS5wYWdlWSB8fCBlLmNsaWVudFkgKyBzY3JvbGxMZWZ0O1xuXG5cdFx0Ly8gY3Vyc29yIGhvcmlzb250YWwgcG9zdGlvblxuXHRcdHBhcmFtcy54ID0geDtcblx0XHQvLyBjdXJzb3IgdmVydGljYWwgcG9zaXRpb25cblx0XHRwYXJhbXMueSA9IHk7XG5cblx0XHQvLyBmb3IoaT0wOyBpIDwgbG9jYWxFdmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHQvLyBcdGlmKGxvY2FsRXZlbnRzW2ldLmluZGV4T2YoZXR5cGUpICE9IC0xKSB7XG5cdFx0Ly8gXHRcdGxvY2FsRXZlbnRzLnNwbGljZShpLCAxKTtcblx0XHQvLyBcdFx0YnJlYWs7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gfVxuXHR9IGVsc2UgaWYoZXR5cGUgPT09ICdzY3JvbGwnKSB7XG5cdFx0Ly8gZm9yKGk9MDsgaSA8IGxvY2FsRXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Ly8gXHRpZihsb2NhbEV2ZW50c1tpXS5pbmRleE9mKCdzY3JvbGwnKSAhPSAtMSkge1xuXHRcdC8vIFx0XHRsb2NhbEV2ZW50cy5zcGxpY2UoaSwgMSk7XG5cdFx0Ly8gXHRcdGJyZWFrO1xuXHRcdC8vIFx0fVxuXHRcdC8vIH1cblx0XHRcblx0XHQvLyB2YXIgc3QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDtcblx0XHQvLyB2YXIgc2wgPSB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQ7XG5cblx0fSBlbHNlIGlmKGV0eXBlID09ICdrZXl1cCcgfHwgZXR5cGUgPT0gJ2tleWRvd24nIHx8IGV0eXBlID09ICdrZXlwcmVzcycpIHtcblx0XHR2YXIgY29kZSA9IGUuY2hhckNvZGUgfHwgZS5rZXlDb2RlIHx8IGUud2hpY2g7XG5cdFx0dmFyIGMgPSBnZXRDYXJldFBvc2l0aW9uKHRhcmcpO1xuXG5cdFx0aWYobm9kZU5hbWUgPT09ICdJTlBVVCcgJiYgdGFyZy50eXBlID09PSAncGFzc3dvcmQnKSByZXR1cm47XG5cblx0XHRpZihldHlwZSA9PSAna2V5dXAnKSB7XG5cdFx0XHRpZigoYyA9PT0gbnVsbCkgfHwgKGNvZGUgPT0gODYgJiYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpKSkge1xuXHRcdFx0XHR2YXIgdHZhbHVlID0gdGFyZy52YWx1ZTtcblx0XHRcdFx0aWYodHZhbHVlKSB7XG5cdFx0XHRcdFx0dHZhbHVlID0gdHZhbHVlLnJlcGxhY2UoL1xcbi9nLCAnPGJyPicpO1xuXHRcdFx0XHRcdC8vIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgb2YgdGhlIHRhcmdldCBub2RlLCBpZiBleGlzdHNcblx0XHRcdFx0XHRwYXJhbXMudmFsdWUgPSB0dmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYoZXR5cGUgPT0gJ2tleWRvd24nKSB7XG5cdFx0XHRpZihjICE9PSBudWxsICYmIChjb2RlID09IDggfHwgY29kZSA9PSA0NiB8fCBjb2RlID09IDE5MCkpIHtcblx0XHRcdFx0aWYoIXRhcmcudmFsdWUpIHJldHVybjtcblx0XHRcdFx0Ly8gY2FyZXQgcG9zaXRpb25cblx0XHRcdFx0cGFyYW1zLnBvcyA9IGM7XG5cdFx0XHRcdC8vIGNoYXIgY29kZVxuXHRcdFx0XHRwYXJhbXMuY29kZSA9IGNvZGU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmKGV0eXBlID09PSAna2V5cHJlc3MnKSB7XG5cdFx0XHRpZihjICE9PSBudWxsICYmIGNvZGUgIT0gOCAmJiBjb2RlICE9IDQ2KSB7XG5cdFx0XHRcdC8vIGNhcmV0IHBvc2l0aW9uXG5cdFx0XHRcdHBhcmFtcy5wb3MgPSBjO1xuXHRcdFx0XHQvLyBjaGFyIGNvZGVcblx0XHRcdFx0cGFyYW1zLmNvZGUgPSBjb2RlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmKGV0eXBlID09PSAnY2hhbmdlJykge1xuXHRcdGlmKG5vZGVOYW1lID09PSAnSU5QVVQnICYmIHRhcmcudHlwZSA9PT0gJ3Bhc3N3b3JkJykgcmV0dXJuO1xuXHRcdHBhcmFtcy52YWx1ZSA9IHRhcmcudmFsdWU7XG5cblx0fSBlbHNlIGlmKGV0eXBlID09ICdtb3VzZXVwJyB8fCBldHlwZSA9PSAnc2VsZWN0Jyl7XG5cdFx0dmFyIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKSB8fCBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKS50ZXh0LFxuXHRcdFx0c28gPSBzZWxlY3Rpb24uYW5jaG9yT2Zmc2V0LFxuXHRcdFx0ZW8gPSBzZWxlY3Rpb24uZm9jdXNPZmZzZXQsXG5cdFx0XHRhbmNob3JQYXJlbnROb2RlSW5kZXggPSAwLFxuXHRcdFx0YW5jaG9yUGFyZW50Tm9kZU5hbWUgPSAnJyxcblx0XHRcdGFuY2hvck5vZGVJbmRleCA9IDAsXG5cdFx0XHRhbmNob3JQYXJlbnQgPSAnJyxcblx0XHRcdGZvY3VzUGFyZW50Tm9kZUluZGV4ID0gMCxcblx0XHRcdGZvY3VzUGFyZW50Tm9kZU5hbWUgPSAnJyxcblx0XHRcdGZvY3VzTm9kZUluZGV4ID0gMCxcblx0XHRcdGZvY3VzUGFyZW50ID0gJycsXG5cdFx0XHRyZXZlcnNlID0gZmFsc2U7XG5cblx0XHRpZihzZWxlY3Rpb24uYW5jaG9yTm9kZSAhPT0gbnVsbCkge1xuXHRcdFx0YW5jaG9yUGFyZW50ID0gc2VsZWN0aW9uLmFuY2hvck5vZGUucGFyZW50Tm9kZTtcblxuXHRcdFx0Zm9yKGk9MDsgaTxhbmNob3JQYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKGFuY2hvclBhcmVudC5jaGlsZE5vZGVzW2ldID09IHNlbGVjdGlvbi5hbmNob3JOb2RlKSBhbmNob3JOb2RlSW5kZXggPSBpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRhbmNob3JQYXJlbnROb2RlTmFtZSA9IGFuY2hvclBhcmVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0bm9kZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShhbmNob3JQYXJlbnROb2RlTmFtZSk7XG5cdFx0XHRmb3IoaT0wO2k8bm9kZXMubGVuZ3RoO2krKykge1xuXHRcdFx0XHRpZihub2Rlc1tpXSA9PT0gYW5jaG9yUGFyZW50KSBhbmNob3JQYXJlbnROb2RlSW5kZXggPSBpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRmb2N1c1BhcmVudCA9IHNlbGVjdGlvbi5mb2N1c05vZGUucGFyZW50Tm9kZTtcblx0XHRcdGZvcihpPTA7IGk8Zm9jdXNQYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGlmKGZvY3VzUGFyZW50LmNoaWxkTm9kZXNbaV0gPT0gc2VsZWN0aW9uLmZvY3VzTm9kZSkgZm9jdXNOb2RlSW5kZXggPSBpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRmb2N1c1BhcmVudE5vZGVOYW1lID0gZm9jdXNQYXJlbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdG5vZGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZm9jdXNQYXJlbnROb2RlTmFtZSk7XG5cdFx0XHRmb3IoaT0wO2k8bm9kZXMubGVuZ3RoO2krKykge1xuXHRcdFx0XHRpZihub2Rlc1tpXSA9PT0gZm9jdXNQYXJlbnQpIGZvY3VzUGFyZW50Tm9kZUluZGV4ID0gaTtcblx0XHRcdH1cblx0XHRcdFxuXG5cdFx0XHRpZihhbmNob3JQYXJlbnROb2RlTmFtZSA9PT0gZm9jdXNQYXJlbnROb2RlTmFtZSAmJlxuXHRcdFx0XHRhbmNob3JQYXJlbnROb2RlSW5kZXggPT09IGZvY3VzUGFyZW50Tm9kZUluZGV4ICYmXG5cdFx0XHRcdFx0YW5jaG9yTm9kZUluZGV4ID09PSBmb2N1c05vZGVJbmRleCAmJlxuXHRcdFx0XHRcdFx0c28gPiBlbylcblx0XHRcdFx0XHRcdFx0cmV2ZXJzZSA9IHRydWU7XG5cblx0XHRcdC8vIG5hbWUgb2YgdGhlIHRhcmdldCBub2RlIHdoZXJlIHNlbGVjdGlvbiBzdGFydGVkXG5cdFx0XHRwYXJhbXMuc24gPSBhbmNob3JQYXJlbnROb2RlTmFtZTtcblx0XHRcdHBhcmFtcy5zbmkgPSBhbmNob3JQYXJlbnROb2RlSW5kZXg7XG5cdFx0XHRwYXJhbXMuc2NoaSA9IGFuY2hvck5vZGVJbmRleDtcblx0XHRcdC8vIG5hbWUgb2YgdGhlIHRhcmdldCBub2RlIHdoZXJlIHNlbGVjdGlvbiBlbmRlZFxuXHRcdFx0cGFyYW1zLmVuID0gZm9jdXNQYXJlbnROb2RlTmFtZTtcblx0XHRcdHBhcmFtcy5lbmkgPSBmb2N1c1BhcmVudE5vZGVJbmRleDtcblx0XHRcdHBhcmFtcy5lY2hpID0gZm9jdXNOb2RlSW5kZXg7XG5cdFx0XHRwYXJhbXMuc28gPSByZXZlcnNlID8gZW8gOiBzbztcblx0XHRcdHBhcmFtcy5lbyA9IHJldmVyc2UgPyBzbyA6IGVvO1xuXHRcdH1cblx0fSBlbHNlIGlmKGV0eXBlID09ICdjbGljaycpIHtcblx0XHRwYXJhbXMuc2N4ID0gZS5zY3JlZW5YO1xuXHRcdHBhcmFtcy5zY3kgPSBlLnNjcmVlblk7XG5cdH1cblxuXHQvLyBkZWJ1Zy5sb2coJ2V2ZW50c0hhbmRsZXI6ICcsIHBhcmFtcyk7XG5cdC8vIGxvY2FsRXZlbnRzLnB1c2gocGFyYW1zKTtcblx0Ly8gZW1pdEV2ZW50cygpO1xuXHQvLyBhZGRFdmVudHMocGFyYW1zKTtcblx0YWRkRXZlbnRzRXZlcnkocGFyYW1zKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRXZlbnRzKHJlc3VsdCl7XG5cdHZhciBtYWluRWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblx0XHR0YXJnZXQsXG5cdFx0ZXZ0ID0ge307XG5cblx0aWYocmVzdWx0LmV2ZW50cykge1xuXG5cdFx0Ly8gY2hlY2sgZm9yIHNjcm9sbFRvcC9MZWZ0LiBcblx0XHQvLyBJRSBhbmQgRmlyZWZveCBhbHdheXMgcmV0dXJuIDAgZnJvbSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcC9MZWZ0LCBcblx0XHQvLyB3aGlsZSBvdGhlciBicm93c2VycyByZXR1cm4gMCBmcm9tIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuXHRcdC8vIG1haW5FbGVtZW50ID0gKCdBY3RpdmVYT2JqZWN0JyBpbiB3aW5kb3cgfHwgdHlwZW9mIEluc3RhbGxUcmlnZ2VyICE9PSAndW5kZWZpbmVkJykgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBkb2N1bWVudC5ib2R5O1xuXG5cdFx0Ly8gZm9yKHZhciBpPTA7IGk8cmVzdWx0LmV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Ly8gZXZ0ID0gcmVzdWx0LmV2ZW50c1tpXTtcblx0XHRcdGV2dCA9IHJlc3VsdC5ldmVudHM7XG5cblx0XHRcdC8vIGlmKGV2dC5zaGFyZWQgIT09IHVuZGVmaW5lZCkgZGVidWcubG9nKCdzaGFyZWQgZXZlbnRzJywgZXZlbnRUaW1lc3RhbXAsIGV2dCwgcmVzdWx0LmluaXQpO1xuXHRcdFx0aWYoZXZ0LnRpbWVzdGFtcCA8IGV2ZW50VGltZXN0YW1wKSByZXR1cm47XG5cdFx0XHRpZihldnQuZW50aXR5ID09PSBlbnRpdHkpIHJldHVybjtcblx0XHRcdFx0XHRcblx0XHRcdC8vIGlmKGV2dC5zaGFyZWQgIT09IHVuZGVmaW5lZCl7XG5cdFx0XHQvLyBcdGlmKGV2dC5zaGFyZWQpe1xuXHRcdFx0Ly8gXHRcdGNoZWNrRXZlcnkoKTtcblx0XHRcdC8vIFx0XHRzaGFyZUJyb3dzZXIoKTtcblx0XHRcdC8vIFx0fSBlbHNlIHtcblx0XHRcdC8vIFx0XHRpZighcmVzdWx0Lmhpc3RvcnlFdmVudHMpIHVuc2hhcmVCcm93c2VyKCk7XG5cdFx0XHQvLyBcdH1cblx0XHRcdC8vIH1cblx0XHRcdGlmKGV2dC51cmwpIHtcblx0XHRcdFx0Ly8gaWYoIXJlc3VsdC5oaXN0b3J5RXZlbnRzKSB7XG5cdFx0XHRcdFx0dmFyIHVybCA9IGV2dC51cmw7XG5cdFx0XHRcdFx0dmFyIGRvY1VybCA9IGRvY3VtZW50LlVSTDtcblx0XHRcdFx0XHRpZihkb2NVcmwuaW5kZXhPZignY2hhdFNlc3Npb25JZCcpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0ZG9jVXJsID0gZG9jVXJsLnN1YnN0cigwLCBkb2NVcmwuaW5kZXhPZignY2hhdFNlc3Npb25JZCcpLTEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZih1cmwgIT0gZG9jVXJsKSBjaGFuZ2VVUkwodXJsKTtcblx0XHRcdFx0Ly8gfVxuXHRcdFx0fVxuXHRcdFx0aWYoZXZ0Lncpe1xuXHRcdFx0XHRpZihldnQuZW50aXR5ID09PSAndXNlcicpIHtcblx0XHRcdFx0XHR2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cdFx0XHRcdFx0dmFyIGlubmVyVyA9IGJvZHkub2Zmc2V0V2lkdGg7XG5cdFx0XHRcdFx0aWYoaW5uZXJXICE9PSBldnQudykge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IGV2dC53ICsgJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmKGV2dC5ldmVudCA9PT0gJ21vdXNlbW92ZScpIHtcblx0XHRcdFx0aWYoY3Vyc29yKSB7XG5cdFx0XHRcdFx0Y3Vyc29yWCA9IGV2dC54ICsgJ3B4Jztcblx0XHRcdFx0XHRjdXJzb3JZID0gZXZ0LnkgKyAncHgnO1xuXHRcdFx0XHRcdC8vIGN1cnNvci5zdHlsZS5sZWZ0ID0gZXZ0LnggKyAncHgnO1xuXHRcdFx0XHRcdC8vIGN1cnNvci5zdHlsZS50b3AgPSBldnQueSArICdweCc7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihldnQuZXZlbnQgPT09ICdzY3JvbGwnKSB7XG5cdFx0XHRcdGlmKGV2dC50biAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0aWYoZXZ0LnRuID09PSAnI2RvY3VtZW50JykgdGFyZ2V0ID0gbWFpbkVsZW1lbnQ7XG5cdFx0XHRcdFx0ZWxzZSB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHRcdGlmKHRhcmdldCl7XG5cdFx0XHRcdFx0XHR0YXJnZXQuc2Nyb2xsVG9wID0gZXZ0LnN5O1xuXHRcdFx0XHRcdFx0dGFyZ2V0LnNjcm9sbExlZnQgPSBldnQuc3g7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Njcm9sbCBldmVudDogJywgdGFyZ2V0LCBldnQuc3kpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoZXZ0LmV2ZW50ID09PSAnbW91c2V1cCcgfHwgZXZ0LmV2ZW50ID09PSAnc2VsZWN0Jyl7XG5cdFx0XHRcdGlmKGV2dC5zbikge1xuXHRcdFx0XHRcdHZhciBzdGFydE5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQuc24pW2V2dC5zbmldO1xuXHRcdFx0XHRcdHZhciBlbmROb2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LmVuKVtldnQuZW5pXTtcblx0XHRcdFx0XHRpZihkb2N1bWVudC5jcmVhdGVSYW5nZSAmJiBzdGFydE5vZGUgIT09IHVuZGVmaW5lZCAmJiBlbmROb2RlICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdHZhciBybmcgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuXHRcdFx0XHRcdFx0cm5nLnNldFN0YXJ0KHN0YXJ0Tm9kZS5jaGlsZE5vZGVzW2V2dC5zY2hpXSwgZXZ0LnNvKTtcblx0XHRcdFx0XHRcdHJuZy5zZXRFbmQoZW5kTm9kZS5jaGlsZE5vZGVzW2V2dC5lY2hpXSwgZXZ0LmVvKTtcblx0XHRcdFx0XHRcdHZhciBzZWwgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRcdFx0XHRzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cdFx0XHRcdFx0XHRzZWwuYWRkUmFuZ2Uocm5nKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihldnQuZXZlbnQgPT09ICdrZXl1cCcgfHwgZXZ0LmV2ZW50ID09PSAna2V5ZG93bicgfHwgZXZ0LmV2ZW50ID09PSAna2V5cHJlc3MnKSB7XG5cdFx0XHRcdGlmKGV2dC50biAhPT0gdW5kZWZpbmVkICYmIGV2dC50bmkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bilbZXZ0LnRuaV07XG5cdFx0XHRcdFx0aWYodGFyZ2V0KXtcblx0XHRcdFx0XHRcdHZhciBvdXRwdXQ7XG5cdFx0XHRcdFx0XHR2YXIgYSA9IHRhcmdldC52YWx1ZTtcblx0XHRcdFx0XHRcdGlmKGV2dC5jb2RlID09IDgpIHtcblx0XHRcdFx0XHRcdFx0aWYoZXZ0LnBvcyA9PSBhLmxlbmd0aC0xKSBvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zLTEpO1xuXHRcdFx0XHRcdFx0XHRlbHNlIGlmKGV2dC5wb3MgPT09IDApIHJldHVybjtcblx0XHRcdFx0XHRcdFx0ZWxzZSBvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zLTEpICsgYS5zdWJzdHIoZXZ0LnBvcyk7XG5cdFx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IG91dHB1dDtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihldnQuY29kZSA9PSA0Nikge1xuXHRcdFx0XHRcdFx0XHRvdXRwdXQgPSBhLnN1YnN0cigwLCBldnQucG9zKSArIGEuc3Vic3RyKGV2dC5wb3MrMSk7XG5cdFx0XHRcdFx0XHRcdHRhcmdldC52YWx1ZSA9IG91dHB1dDtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihldnQuY29kZSA9PSAxOTApIHtcblx0XHRcdFx0XHRcdFx0b3V0cHV0ID0gYS5zdWJzdHIoMCwgZXZ0LnBvcykgKyAnLicgKyBhLnN1YnN0cihldnQucG9zKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGV2dC52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdHZhciB0dmFsdWUgPSBldnQudmFsdWU7XG5cdFx0XHRcdFx0XHRcdHR2YWx1ZSA9IHR2YWx1ZS5yZXBsYWNlKC88YnI+L2csICdcXG4nKTtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gdHZhbHVlO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dmFyIGMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2dC5jb2RlKTtcblx0XHRcdFx0XHRcdFx0aWYoYSkgb3V0cHV0ID0gYS5zdWJzdHIoMCwgZXZ0LnBvcykgKyBjICsgYS5zdWJzdHIoZXZ0LnBvcyk7XG5cdFx0XHRcdFx0XHRcdGVsc2Ugb3V0cHV0ID0gYztcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gb3V0cHV0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ2NoYW5nZScpIHtcblx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuKVtldnQudG5pXTtcblx0XHRcdFx0dGFyZ2V0LnZhbHVlID0gZXZ0LnZhbHVlO1xuXHRcdFx0fSBlbHNlIGlmKGV2dC5ldmVudCA9PT0gJ2NsaWNrJyl7XG5cdFx0XHRcdC8vIHZhciBlbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKGV2dC50bi50b0xvd2VyQ2FzZSgpKTtcblx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZXZ0LnRuKVtldnQudG5pXTtcblx0XHRcdFx0aWYodGFyZ2V0KSB0YXJnZXQuY2xpY2soKTtcblx0XHRcdFx0Ly8gZWxlbWVudHNbZXZ0LnRuaV0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3llbGxvdyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShldnQudG4pW2V2dC50bmldO1xuXHRcdFx0XHRpZih0YXJnZXQpIHtcblx0XHRcdFx0XHR2YXIgZXZ0T3B0cyA9IG1vdXNlRXZlbnQoZXZ0LmV2ZW50LCBldnQueCwgZXZ0LnksIGV2dC54LCBldnQueSk7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hFdmVudCh0YXJnZXQsIGV2dE9wdHMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKGV2dC5ldmVudCA9PT0gJ2NsaWNrJyB8fCBldnQuZXZlbnQgPT09ICdzY3JvbGwnKSByZW1vdGVFdmVudHMucHVzaChldnQpO1xuXHRcdC8vIH1cblx0fVxuXG5cdGlmKHJlc3VsdC50aW1lc3RhbXApIGV2ZW50VGltZXN0YW1wID0gcmVzdWx0LnRpbWVzdGFtcDtcblx0Ly8gaWYoc2hhcmVkKSBlbWl0RXZlbnRzKCk7XG59XG5cbmZ1bmN0aW9uIG1vdXNlRXZlbnQodHlwZSwgc3gsIHN5LCBjeCwgY3kpIHtcblx0dmFyIGV2dDtcblx0dmFyIGUgPSB7XG5cdFx0YnViYmxlczogdHJ1ZSxcblx0XHRjYW5jZWxhYmxlOiAodHlwZSAhPSBcIm1vdXNlbW92ZVwiKSxcblx0XHR2aWV3OiB3aW5kb3csXG5cdFx0ZGV0YWlsOiAwLFxuXHRcdHNjcmVlblg6IHN4LFxuXHRcdHNjcmVlblk6IHN5LFxuXHRcdGNsaWVudFg6IGN4LFxuXHRcdGNsaWVudFk6IGN5LFxuXHRcdGN0cmxLZXk6IGZhbHNlLFxuXHRcdGFsdEtleTogZmFsc2UsXG5cdFx0c2hpZnRLZXk6IGZhbHNlLFxuXHRcdG1ldGFLZXk6IGZhbHNlLFxuXHRcdGJ1dHRvbjogMCxcblx0XHRyZWxhdGVkVGFyZ2V0OiB1bmRlZmluZWRcblx0fTtcblx0aWYgKHR5cGVvZiggZG9jdW1lbnQuY3JlYXRlRXZlbnQgKSA9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuXHRcdGV2dC5pbml0TW91c2VFdmVudChcblx0XHRcdHR5cGUsXG5cdFx0XHRlLmJ1YmJsZXMsXG5cdFx0XHRlLmNhbmNlbGFibGUsXG5cdFx0XHRlLnZpZXcsXG5cdFx0XHRlLmRldGFpbCxcblx0XHRcdGUuc2NyZWVuWCxcblx0XHRcdGUuc2NyZWVuWSxcblx0XHRcdGUuY2xpZW50WCxcblx0XHRcdGUuY2xpZW50WSxcblx0XHRcdGUuY3RybEtleSxcblx0XHRcdGUuYWx0S2V5LFxuXHRcdFx0ZS5zaGlmdEtleSxcblx0XHRcdGUubWV0YUtleSxcblx0XHRcdGUuYnV0dG9uLFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlXG5cdFx0KTtcblx0fSBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuXHRcdGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBlKSB7XG5cdFx0XHRldnRbcHJvcF0gPSBlW3Byb3BdO1xuXHRcdH1cblx0XHRldnQuYnV0dG9uID0geyAwOjEsIDE6NCwgMjoyIH1bZXZ0LmJ1dHRvbl0gfHwgZXZ0LmJ1dHRvbjtcblx0fVxuXHRyZXR1cm4gZXZ0O1xufVxuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudCAoZWwsIGV2dCkge1xuXHRpZiAoZWwuZGlzcGF0Y2hFdmVudCkge1xuXHRcdGVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblx0fSBlbHNlIGlmIChlbC5maXJlRXZlbnQpIHtcblx0XHRlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGV2dCk7XG5cdH1cblx0cmV0dXJuIGV2dDtcbn1cblxuZnVuY3Rpb24gY2hhbmdlVVJMKHVybCkge1xuICAgIHZhciBkb2NVcmwgPSBkb2N1bWVudC5VUkw7XG4gICAgaWYgKGRvY1VybCAhPT0gdXJsKSB7XG5cdFx0ZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRGVzY2VuZGFudChwYXJlbnQsIGNoaWxkKSB7XG4gICAgIHZhciBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcbiAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgaWYgKG5vZGUgPT0gcGFyZW50KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgIH1cbiAgICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudChvYmosIGV2VHlwZSwgZm4pIHtcbiAgaWYgKG9iai5hZGRFdmVudExpc3RlbmVyKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihldlR5cGUsIGZuLCBmYWxzZSk7XG4gIGVsc2UgaWYgKG9iai5hdHRhY2hFdmVudCkgb2JqLmF0dGFjaEV2ZW50KFwib25cIitldlR5cGUsIGZuKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmRldGFjaEV2ZW50KSBvYmouZGV0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufSIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbi8vIHZhciB3ZWJzb2NrZXRzID0gcmVxdWlyZSgnLi93ZWJzb2NrZXRzJyk7XG4vLyB2YXIgdXJsID0gcmVxdWlyZSgndXJsJykucGFyc2UoZG9jdW1lbnQuVVJMLCB0cnVlKTtcbnZhciB1cmwgPSBnbG9iYWwubG9jYXRpb247XG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoLWZucycpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbnZhciB3ZWJzb2NrZXRUcnkgPSAxO1xudmFyIHBvbGxUdXJucyA9IDE7XG52YXIgbWFpbkFkZHJlc3MgPSBcIm1haW4ucmluZ290ZWwubmV0L2NoYXRib3QvV2ViQ2hhdC9cIjtcbi8vIHZhciBwdWJsaWNVcmwgPSBcImh0dHBzOi8vbWFpbi5yaW5nb3RlbC5uZXQvcHVibGljL1wiO1xudmFyIHdlYnNvY2tldFVybCA9IFwiXCI7XG52YXIgbW9kdWxlSW5pdCA9IGZhbHNlO1xudmFyIHNlc3Npb25UaW1lb3V0ID0gbnVsbDtcbnZhciBjaGF0VGltZW91dCA9IG51bGw7XG5cbi8qKlxuICogQ29yZSBtb2R1bGUgaW1wbGVtZW50cyBtYWluIGludGVybmFsIGZ1bmN0aW9uYWxpdHlcbiAqIFxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEluc3RhbnRpYXRpb24gb3B0aW9ucyB0aGF0IG92ZXJyaWRlcyBtb2R1bGUgZGVmYXVsdHNcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICBSZXR1cm4gcHVibGljIEFQSVxuICovXG5cbmluaGVyaXRzKFdjaGF0QVBJLCBFdmVudEVtaXR0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdjaGF0QVBJO1xuXG5mdW5jdGlvbiBXY2hhdEFQSShvcHRpb25zKXtcblxuXHQvLyBleHRlbmQgZGVmYXVsdCBvcHRpb25zXG5cdC8vIHdpdGggcHJvdmlkZWQgb2JqZWN0XG5cdHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwgPSB0aGlzLm9wdGlvbnMuc2VydmVyICsgJy9pcGNjLyQkJCc7XG5cdHRoaXMuc2Vzc2lvbiA9IHt9O1xuXG5cdGlmKCF0aGlzLm9wdGlvbnMud3NTZXJ2ZXIgJiYgIXRoaXMub3B0aW9ucy5wYWdlaWQpIHJldHVybiBjb25zb2xlLmVycm9yKCdDYW5ub3QgaW5pdGlhdGUgbW9kdWxlOiBwYWdlaWQgaXMgdW5kZWZpbmVkJyk7XG5cblx0d2Vic29ja2V0VXJsID0gKHRoaXMub3B0aW9ucy53c1NlcnZlciA/IHRoaXMub3B0aW9ucy53c1NlcnZlciA6IG1haW5BZGRyZXNzKTtcblx0d2Vic29ja2V0VXJsICs9ICh3ZWJzb2NrZXRVcmxbd2Vic29ja2V0VXJsLmxlbmd0aC0xXSAhPT0gJy8nID8gJy8nIDogJycpICsgdGhpcy5vcHRpb25zLnBhZ2VpZDsgLy8gYWRkIGZvcndhcmQgc2xhc2ggYXQgdGhlIGVuZCBpZiBuZWNlc3NhcnlcblxuXHR0aGlzLmNyZWF0ZVdlYnNvY2tldCgpO1xuXG5cdHRoaXMub24oJ3Nlc3Npb24vY3JlYXRlJywgdGhpcy5vblNlc3Npb25DcmVhdGUuYmluZCh0aGlzKSk7XG5cdC8vIHRoaXMub24oJ2NoYXQvY2xvc2UnLCBmdW5jdGlvbihkYXRhKSB7XG5cdC8vIFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCBmYWxzZSwgJ3Nlc3Npb24nKTtcblx0Ly8gfSk7XG5cdHRoaXMub24oJ0Vycm9yJywgdGhpcy5vbkVycm9yKTtcblxuXG5cdHJldHVybiB0aGlzO1xuXG59XG5cbldjaGF0QVBJLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24oZXJyKXtcblx0ZGVidWcubG9nKCdFcnJvcjogJywgZXJyKTtcbn1cblxuV2NoYXRBUEkucHJvdG90eXBlLm9uU2Vzc2lvbkNyZWF0ZSA9IGZ1bmN0aW9uKGRhdGEpe1xuXHR0aGlzLnNlc3Npb24gPSBfLm1lcmdlKHRoaXMuc2Vzc2lvbiwgZGF0YSk7XG5cdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaWQnLCBkYXRhLnNpZCk7XG5cdC8vIHRoaXMuc2V0U2Vzc2lvblRpbWVvdXQoKTtcbn1cblxuV2NoYXRBUEkucHJvdG90eXBlLnNldFNlc3Npb25UaW1lb3V0ID0gZnVuY3Rpb24oKXtcblx0dmFyIHRpbWVvdXQgPSB0aGlzLnNlc3Npb24uc2Vzc2lvblRpbWVvdXQ7XG5cdGNsZWFyVGltZW91dChzZXNzaW9uVGltZW91dCk7XG5cdGlmKHRpbWVvdXQpXG5cdFx0c2Vzc2lvblRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMub25TZXNzaW9uVGltZW91dC5iaW5kKHRoaXMpLCB0aW1lb3V0KjEwMDApO1xufVxuXG5XY2hhdEFQSS5wcm90b3R5cGUub25TZXNzaW9uVGltZW91dCA9IGZ1bmN0aW9uKCl7XG5cdHRoaXMuZW1pdCgnc2Vzc2lvbi90aW1lb3V0Jyk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2VuZERhdGEgPSBmdW5jdGlvbihkYXRhKXtcblx0aWYodGhpcy53ZWJzb2NrZXQpIHRoaXMud2Vic29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufTtcblxuLyoqXG4gKiBXZWJzb2NrZXQgbWVzc2FnZXMgaGFuZGxlclxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUub25XZWJzb2NrZXRNZXNzYWdlID0gZnVuY3Rpb24oZSl7XG5cdC8vIHRoaXMuZW1pdCgnd2Vic29ja2V0L21lc3NhZ2UnLCAoZS5kYXRhID8gSlNPTi5wYXJzZShlLmRhdGEpIDoge30pKTtcblx0dmFyIGRhdGEgPSBKU09OLnBhcnNlKGUuZGF0YSksXG5cdCAgICBtZXRob2QgPSBkYXRhLm1ldGhvZDtcblxuXHQvLyBkZWJ1Zy5sb2coJ29uV2Vic29ja2V0TWVzc2FnZTogJywgZGF0YSk7XG5cdFxuXHRpZihkYXRhLm1ldGhvZCkge1xuXHRcdGlmKGRhdGEubWV0aG9kID09PSAnc2Vzc2lvbicpIHtcblx0XHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9jcmVhdGUnLCBkYXRhLnBhcmFtcyk7XG5cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdtZXNzYWdlcycpIHtcblx0XHRcdGlmKGRhdGEucGFyYW1zLmxpc3QpIHtcblx0XHRcdFx0ZGF0YS5wYXJhbXMubGlzdC5tYXAoZnVuY3Rpb24oaXRlbSwgaW5kZXgsIGFycmF5KSB7XG5cdFx0XHRcdFx0aXRlbS5zZXF1ZW5jZSA9IChpbmRleCsxKSArICcvJyArIGFycmF5Lmxlbmd0aDtcblx0XHRcdFx0XHR0aGlzLmVtaXQoJ21lc3NhZ2UvbmV3JywgaXRlbSk7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW07XG5cdFx0XHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0XHR9XG5cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdtZXNzYWdlJykge1xuXHRcdFx0aWYoZGF0YS5wYXJhbXMudHlwaW5nKSB7XG5cdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS90eXBpbmcnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS9uZXcnLCBkYXRhLnBhcmFtcyk7XG5cdFx0XHRcdHRoaXMuc2V0U2Vzc2lvblRpbWVvdXQoKTtcblx0XHRcdH1cblxuXHRcdH0gZWxzZSBpZihkYXRhLm1ldGhvZCA9PT0gJ29wZW5TaGFyZScpIHsgLy8gQWdlbnQgLS0tPiBVc2VyXG5cdFx0XHRpZih0aGlzLnNlc3Npb24uc2hhcmVkSWQgPT09IGRhdGEucGFyYW1zLmlkKSByZXR1cm47XG5cdFx0XHRpZihkYXRhLnBhcmFtcy51cmwgJiYgKHVybC5ocmVmICE9PSBkYXRhLnBhcmFtcy51cmwpKSByZXR1cm4gd2luZG93LmxvY2F0aW9uID0gZGF0YS5wYXJhbXMudXJsO1xuXHRcdFx0aWYoZGF0YS5wYXJhbXMuaWQpIHtcblx0XHRcdFx0dGhpcy5zZXNzaW9uLnNoYXJlZElkID0gZGF0YS5wYXJhbXMuaWQ7XG5cdFx0XHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9qb2luZWQnLCB7IHVybDogdXJsLmhyZWYgfSk7XG5cdFx0XHRcdHRoaXMuc2hhcmVPcGVuZWQoZGF0YS5wYXJhbXMuaWQsIHVybC5ocmVmKTsgLy8gVXNlciAtLS0+IEFnZW50XG5cdFx0XHR9XG5cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdzaGFyZU9wZW5lZCcpIHsgLy8gVXNlciAtLS0+IEFnZW50XG5cdFx0XHRpZihkYXRhLnBhcmFtcy5pZCkge1xuXHRcdFx0XHR0aGlzLnNlc3Npb24uc2hhcmVkSWQgPSBkYXRhLnBhcmFtcy5pZDtcblx0XHRcdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2pvaW5lZCcsIHsgdXJsOiB1cmwuaHJlZiB9KTtcblx0XHRcdH1cblxuXHRcdH0gZWxzZSBpZihkYXRhLm1ldGhvZCA9PT0gJ3NoYXJlQ2xvc2VkJykge1xuXHRcdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLm9wZW5TaGFyZUludGV2YWwpO1xuXHRcdFx0dGhpcy5zZXNzaW9uLnNoYXJlZElkID0gXCJcIjtcblx0XHRcdHRoaXMuZW1pdCgnc2Vzc2lvbi9kaXNqb2luJyk7XG5cblx0XHR9IGVsc2UgaWYoZGF0YS5tZXRob2QgPT09ICdldmVudHMnKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ2NvYnJvd3NpbmcvdXBkYXRlJywgZGF0YS5wYXJhbXMpO1xuXG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIE1vZHVsZSBpbml0aWF0aW9uXG4gKiBFbWl0cyBtb2R1bGUvc3RhcnQgZXZlbnQgaWYgbW9kdWxlIHN0YXJ0ZWRcbiAqL1xuLy8gV2NoYXRBUEkucHJvdG90eXBlLmluaXRNb2R1bGUgPSBmdW5jdGlvbigpe1xuXG5cdC8vIF8ucG9sbChmdW5jdGlvbigpe1xuXHQvLyBcdHJldHVybiAod2Vic29ja2V0SW5pdCA9PT0gdHJ1ZSk7XG5cdC8vIH0sIGZ1bmN0aW9uKCkge1xuXHQvLyBcdGRlYnVnLmxvZygnSU5JVCcpO1xuXHQvLyBcdHRoaXMuaW5pdCgpO1xuXHQvLyB9LmJpbmQodGhpcyksIGZ1bmN0aW9uKCl7XG5cdC8vIFx0aWYocG9sbFR1cm5zIDwgMikge1xuXHQvLyBcdFx0cG9sbFR1cm5zKys7XG5cdC8vIFx0fSBlbHNlIHtcblx0Ly8gXHRcdHJldHVybiB0aGlzLmVtaXQoJ0Vycm9yJywgJ01vZHVsZSB3YXNuXFwndCBpbml0aWF0ZWQgZHVlIHRvIG5ldHdvcmsgZXJyb3InKTtcblx0Ly8gXHR9XG5cdC8vIH0uYmluZCh0aGlzKSwgNjAwMDApO1xuLy8gfTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpe1xuXHRtb2R1bGVJbml0ID0gdHJ1ZTtcblxuXHR2YXIgZW50aXR5ID0gc3RvcmFnZS5nZXRTdGF0ZSgnZW50aXR5JywgJ3Nlc3Npb24nKSxcblx0XHRzaWQgPSBzdG9yYWdlLmdldFN0YXRlKCdzaWQnKTtcblx0XHRzdHJJbmRleCA9IHVybC5ocmVmLmluZGV4T2YoJ2NoYXRTZXNzaW9uSWQnKTtcblxuXHRkZWJ1Zy5sb2coJ2luaXRNb2R1bGU6ICcsIHRoaXMuc2Vzc2lvbiwgZW50aXR5LCBzaWQpO1xuXG5cdC8vIEEgY2hhdFNlc3Npb25JZCBwYXJhbWV0ZXIgaW4gdGhlIHVybCBxdWVyeSBcblx0Ly8gaW5kaWNhdGVzIHRoYXQgdGhlIHdlYiBwYWdlIHdhcyBvcGVuZWQgYnkgYWdlbnQuXG5cdC8vIEluIHRoYXQgY2FzZSBhZ2VudCBzaG91bGQgam9pbiB0aGUgc2Vzc2lvbi5cblx0aWYoc3RySW5kZXggIT09IC0xKSB7XG5cdFx0c2lkID0gdGhpcy5nZXRTaWRGcm9tVXJsKHVybC5ocmVmKTtcblx0XHRlbnRpdHkgPSAnYWdlbnQnO1xuXHRcdHZhciBjbGVhblVybCA9IHVybC5ocmVmLnN1YnN0cigwLCBzdHJJbmRleCk7XG5cdFx0Y2xlYW5VcmwgPSBjbGVhblVybFtjbGVhblVybC5sZW5ndGgtMV0gPT09ICc/JyA/IGNsZWFuVXJsLnN1YnN0cigwLCBjbGVhblVybC5sZW5ndGgtMSkgOiBjbGVhblVybDtcblxuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdzaWQnLCBzaWQpO1xuXHRcdHRoaXMuam9pblNlc3Npb24oY2xlYW5VcmwpO1xuXG5cdH0gZWxzZSBpZihlbnRpdHkgPT09ICdhZ2VudCcpIHsgLy8gSW4gY2FzZSB0aGUgY29icm93c2luZyBzZXNzaW9uIGlzIGFjdGl2ZVxuXHRcdHNpZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpO1xuXHRcdHRoaXMuam9pblNlc3Npb24odXJsLmhyZWYpO1xuXG5cdH0gZWxzZSB7XG5cdFx0ZW50aXR5ID0gJ3VzZXInO1xuXHRcdHRoaXMuY3JlYXRlU2Vzc2lvbih7IHNpZDogc2lkLCB1cmw6IHVybC5ocmVmIH0pO1xuXHR9XG5cblx0dGhpcy5zZXNzaW9uLnNpZCA9IHNpZDtcblx0dGhpcy5zZXNzaW9uLmVudGl0eSA9IGVudGl0eTtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2VudGl0eScsIGVudGl0eSwgJ3Nlc3Npb24nKTtcblxufTtcblxuLyoqXG4gKiBDcmVhdGUgc2Vzc2lvblxuICogRW1pdHMgc2Vzc2lvbi9jcmVhdGUgZXZlbnRcbiAqIGlmIGluaXRpYXRpb24gaXMgc3VjY2Vzc2Z1bFxuICpcbiAqIEBwYXJhbSBcdHtTdHJpbmd9IFx0dXJsIFx0Q3VycmVudCBmdWxsIFVSTFxuICogQHJldHVybiBcdHtTdHJpbmd9XHRzaWQgXHROZXcgc2Vzc2lvbiBpZFxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuY3JlYXRlU2Vzc2lvbiA9IGZ1bmN0aW9uKHBhcmFtcyl7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ2NyZWF0ZVNlc3Npb24nLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0dXJsOiAocGFyYW1zLnVybCB8fCB1cmwuaHJlZiksXG5cdFx0XHRsYW5nOiB0aGlzLmRldGVjdExhbmd1YWdlKClcblx0XHR9XG5cdH07XG5cblx0aWYocGFyYW1zLnNpZCkgZGF0YS5wYXJhbXMuc2lkID0gcGFyYW1zLnNpZDtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdjcmVhdGVTZXNzaW9uJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2NyZWF0ZScsIGJvZHkucmVzdWx0KTtcblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5qb2luU2Vzc2lvbiA9IGZ1bmN0aW9uKHVybCl7XG5cdHRoaXMub3BlblNoYXJlSW50ZXZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3BlblNoYXJlKHVybCk7XG5cdH0uYmluZCh0aGlzKSwgMzAwMCk7XG5cblx0Z2xvYmFsLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNoYXJlQ2xvc2VkKCk7XG5cdH0uYmluZCh0aGlzKTtcbn07XG5cbi8qKiBcbiAqIFNlbmQvb2J0YWluIGV2ZW50cyB0by9mcm9tIHRoZSBzZXJ2ZXIuIFxuICogRXZlbnRzIGNvdWxkIGJlIG9idGFpbmVkIGZyb20gdGhlIHNlcnZlciBieSBzcGVjaWZ5aW5nIGEgdGltZXN0YW1wXG4gKiBhcyBhIHN0YXJ0aW5nIHBvaW50IGZyb20gd2hpY2ggYW4gZXZlbnRzIHdvdWxkIGJlIG9idGFpbmVkXG4qKi9cbldjaGF0QVBJLnByb3RvdHlwZS51cGRhdGVFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGNiKXtcblx0Ly8gdmFyIHNlc3Npb25JZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpLCBkYXRhO1xuXHQvLyBpZighc2Vzc2lvbklkKSByZXR1cm4gY2IoKTtcblx0XG5cdGlmKCF0aGlzLnNlc3Npb24uc2hhcmVkSWQpIHJldHVybjtcblxuXHRkYXRhID0ge1xuXHRcdG1ldGhvZDogJ2V2ZW50cycsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHRoaXMuc2Vzc2lvbi5zaWQsXG5cdFx0XHRpZDogdGhpcy5zZXNzaW9uLnNoYXJlZElkLFxuXHRcdFx0dGltZXN0YW1wOiBzdG9yYWdlLmdldFN0YXRlKCdldmVudFRpbWVzdGFtcCcsICdjYWNoZScpLFxuXHRcdFx0ZXZlbnRzOiBldmVudHNcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIGRhdGEpO1xuXHRcdFx0cmV0dXJuIGNiKGVycik7IC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXHRcdH1cblxuXHRcdGlmKGJvZHkucmVzdWx0LnRpbWVzdGFtcCA+IHN0b3JhZ2UuZ2V0U3RhdGUoJ2V2ZW50VGltZXN0YW1wJywgJ2NhY2hlJykpIHtcblx0XHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdldmVudFRpbWVzdGFtcCcsIGJvZHkucmVzdWx0LnRpbWVzdGFtcCwgJ2NhY2hlJyk7XG5cdFx0XHRpZihjYikgY2IobnVsbCwgYm9keS5yZXN1bHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZihjYikgY2IobnVsbCwgeyBldmVudHM6IFtdIH0pO1xuXHRcdH1cblx0XHRcdFxuXG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCBhdmFpbGFibGUgZGlhbG9nIGxhbmd1YWdlc1xuICogSWYgbGFuZ3VhZ2VzIGFyZSBub3QgYXZhaWxhYmxlLCBcbiAqIHRoZW4gZWl0aGVyIHRoZXJlIGFyZSBubyBhdmFpbGFibGUgYWdlbnRzIG9yXG4gKiBsYW5ndWFnZXMgd2VyZW4ndCBzZXQgaW4gQWRtaW4gU3R1ZGlvXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5nZXRMYW5ndWFnZXMgPSBmdW5jdGlvbihjYil7XG5cdGRlYnVnLmxvZygndGhpcy5zZXNzaW9uOiAnLCB0aGlzLnNlc3Npb24pO1xuXHRjYihudWxsLCB0aGlzLnNlc3Npb24ubGFuZ3MpO1x0XG5cblx0Ly8gdmFyIHNlc3Npb25JZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NpZCcpO1xuXHQvLyBpZighc2Vzc2lvbklkKSByZXR1cm4gY2IodHJ1ZSk7XG5cblx0Ly8gcmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIHtcblx0Ly8gXHRtZXRob2Q6ICdnZXRMYW5ndWFnZXMnLFxuXHQvLyBcdHBhcmFtczoge1xuXHQvLyBcdFx0c2lkOiBzZXNzaW9uSWRcblx0Ly8gXHR9XG5cdC8vIH0sIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHQvLyBcdGlmKGVycikge1xuXHQvLyBcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdnZXRMYW5ndWFnZXMnIH0pO1xuXHQvLyBcdFx0cmV0dXJuIGNiKGVycik7XG5cdC8vIFx0fVxuXG5cdC8vIFx0Y2IobnVsbCwgYm9keSk7XG5cdC8vIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFJlcXVlc3QgY2hhdCBzZXNzaW9uXG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gcGFyYW1zIC0gdXNlciBwYXJhbWV0ZXJzIChuYW1lLCBwaG9uZSwgc3ViamVjdCwgbGFuZ3VhZ2UsIGV0Yy4pXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5jaGF0UmVxdWVzdCA9IGZ1bmN0aW9uKHBhcmFtcywgY2Ipe1xuXHRwYXJhbXMuc2lkID0gdGhpcy5zZXNzaW9uLnNpZDtcblxuXHRkZWJ1Zy5sb2coJ2NoYXRSZXF1ZXN0IHBhcmFtczogJywgcGFyYW1zKTtcblxuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdjaGF0UmVxdWVzdCcsXG5cdFx0cGFyYW1zOiBwYXJhbXNcblx0fTtcblxuXHR0aGlzLnNldFNlc3Npb25UaW1lb3V0KCk7XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnY2hhdFJlcXVlc3QnLCBwYXJhbXM6IHBhcmFtcyB9KTtcblx0XHRcdGlmKGNiKSBjYihlcnIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHBhcmFtcy51cmwgPSB1cmwuaHJlZjtcblx0XHR0aGlzLmVtaXQoJ2NoYXQvc3RhcnQnLCBfLm1lcmdlKHBhcmFtcywgYm9keS5yZXN1bHQpKTtcblx0XHRpZihjYikgY2IobnVsbCwgYm9keSk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCBkaWFsb2cgbWVzc2FnZXNcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lc3RhbXAgR2V0IG1lc3NhZ2VzIHNpbmNlIHByb3ZpZGVkIHRpbWVzdGFtcFxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbihjYil7XG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCB7XG5cdFx0bWV0aG9kOiAnZ2V0TWVzc2FnZXMnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiB0aGlzLnNlc3Npb24uc2lkLFxuXHRcdFx0dGltZXN0YW1wOiBzdG9yYWdlLmdldFN0YXRlKCdtc2dUaW1lc3RhbXAnKVxuXHRcdH1cblx0fSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2dldE1lc3NhZ2VzJyB9KTtcblx0XHRcdHJldHVybiBjYihlcnIpO1xuXHRcdH1cblxuXHRcdC8vIERvIG5vdCBzaG93IG9sZCBtZXNzYWdlc1xuXHRcdGlmKGJvZHkucmVzdWx0LnRpbWVzdGFtcCA+IHN0b3JhZ2UuZ2V0U3RhdGUoJ21zZ1RpbWVzdGFtcCcpKSB7XG5cdFx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnbXNnVGltZXN0YW1wJywgYm9keS5yZXN1bHQudGltZXN0YW1wKTtcblx0XHRcdGlmKGJvZHkucmVzdWx0Lm1lc3NhZ2VzKSB7XG5cdFx0XHRcdHRoaXMuZW1pdCgnbWVzc2FnZS9uZXcnLCBib2R5LnJlc3VsdCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoYm9keS5yZXN1bHQudHlwaW5nKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ21lc3NhZ2UvdHlwaW5nJywgYm9keS5yZXN1bHQpO1xuXHRcdH1cblx0XHRpZihjYikgY2IobnVsbCwgYm9keS5yZXN1bHQpO1xuXG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIENsb3NlIGN1cnJlbnQgY2hhdCBzZXNzaW9uXG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0gcmF0aW5nIFNlcnZpY2UgcmF0aW5nXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5jbG9zZUNoYXQgPSBmdW5jdGlvbihyYXRpbmcpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdjbG9zZUNoYXQnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiB0aGlzLnNlc3Npb24uc2lkXG5cdFx0fVxuXHR9O1xuXHRpZihyYXRpbmcpIGRhdGEucGFyYW1zLnJhdGluZyA9IHJhdGluZztcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIsIGJvZHkpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgZGF0YSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjaGF0JywgZmFsc2UpO1xuXHRcdHRoaXMuZW1pdCgnY2hhdC9jbG9zZScsIHsgcmF0aW5nOiByYXRpbmcsIHVybDogdXJsLmhyZWYgfSk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFNlbmQgbWVzc2FnZSB0byB0aGUgYWdlbnRcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0ZXh0IC0gbWVzc2FnZSBjb250ZW50IGluIGNhc2Ugb2YgcmVndWxhciBtZXNzYWdlIFxuICogb3IgZGF0YVVSTCBpbiBjYXNlIG9mIGZpbGUgdHJhbnNmZXJcbiAqIEBwYXJhbSAge1N0cmluZ30gZmlsZSAtIChPcHRpb25hbCkgZmlsZSBuYW1lXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKHBhcmFtcywgY2Ipe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdtZXNzYWdlJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZCxcblx0XHRcdGNvbnRlbnQ6IHBhcmFtcy5tZXNzYWdlXG5cdFx0fVxuXHR9O1xuXG5cdC8vIHJlc2V0IHNlc3Npb24gdGltZW91dFxuXHR0aGlzLnNldFNlc3Npb25UaW1lb3V0KCk7XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRpZihwYXJhbXMuZmlsZSkge1xuXHRcdC8vIFx0Ly8gdmFyIGNvbnRlbnQgPSBwdWJsaWNVcmwrRGF0ZS5ub3coKStcIl9cIit0aGlzLm9wdGlvbnMucGFnZWlkK1wiX1wiK3BhcmFtcy5tZXNzYWdlO1xuXHRcdFx0Ly8gZGF0YS5wYXJhbXMuY29udGVudCA9IHBhcmFtcy5maWxlO1xuXHRcdFx0Ly8gZGF0YS5wYXJhbXMuZmlsZSA9IHBhcmFtcy5maWxlO1xuXHRcdFx0ZGF0YSA9IHRvRm9ybURhdGEoeyBmaWxlOiBwYXJhbXMuZmlsZSwgZmlsZW5hbWU6IHBhcmFtcy5tZXNzYWdlLCBzaWQ6IHRoaXMuc2Vzc2lvbi5zaWQgfSk7XG5cblx0XHRcdHJlcXVlc3QudXBsb2FkKCdodHRwczovLycrd2Vic29ja2V0VXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdzZW5kTWVzc2FnZTogJywgZXJyLCByZXN1bHQpO1xuXHRcdFx0XHQvLyB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGF0YS5wYXJhbXMuY29udGVudCA9IHBhcmFtcy5tZXNzYWdlO1xuXHRcdFx0dGhpcy5zZW5kRGF0YShkYXRhKTtcblx0XHR9XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gcmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgYm9keSl7XG5cdC8vIFx0aWYoZXJyKSB7XG5cdC8vIFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ3NlbmRNZXNzYWdlJywgcGFyYW1zOiBkYXRhIH0pO1xuXHQvLyBcdFx0aWYoY2IpIGNiKGVycik7XG5cdC8vIFx0XHRyZXR1cm47XG5cdC8vIFx0fVxuXHQvLyBcdGlmKGNiKSBjYigpO1xuXHQvLyB9KTtcbn07XG5cbi8qKlxuICogU2VuZCBkaWFsb2cgZWl0aGVyIHRvIHRoZSBzcGVjaWZpZWQgZW1haWwgYWRkcmVzcyAoaWYgcGFyYW1ldGVyIFwidG9cIiBoYXMgcGFzc2VkKVxuICogb3IgdG8gY2FsbCBjZW50ZXIgYWRtaW5pc3RyYXRvciAoaWYgcGFyYW1ldGVyIFwiZW1haWxcIiBoYXMgcGFzc2VkKVxuICpcbiAqIEVpdGhlclxuICogQHBhcmFtICB7U3RyaW5nfSB0b1x0XHRcdERlc3RpbmF0aW9uIGVtYWlsIGFkZHJlc3NcbiAqXG4gKiBPclxuICogQHBhcmFtICB7U3RyaW5nfSBlbWFpbFx0XHRTZW5kZXIgZW1haWwgYWRkcmVzc1xuICogQHBhcmFtICB7U3RyaW5nfSB1bmFtZVx0XHRTZW5kZXIgbmFtZVxuICogQHBhcmFtICB7U3RyaW5nfSBmaWxlbmFtZVx0QXR0YWNobWVudCBmaWxlbmFtZVxuICogQHBhcmFtICB7U3RyaW5nfSBmaWxlZGF0YVx0QXR0YWNobWVudCBmaWxlIFVSTFxuICpcbiAqIEJvdGhcbiAqIEBwYXJhbSAge1N0cmluZ30gdGV4dFx0XHRFbWFpbCBib2R5XG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5zZW5kRW1haWwgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0cGFyYW1zLnNpZCA9IHRoaXMuc2Vzc2lvbi5zaWQ7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnc2VuZE1haWwnLFxuXHRcdHBhcmFtczogcGFyYW1zXG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnc2VuZEVtYWlsJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRpZihjYikgY2IoZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVtaXQoJ2NoYXQvc2VuZCcsIHBhcmFtcyk7XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkpO1xuXHR9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBTZW5kIGNhbGxiYWNrIHJlcXVlc3RcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0YXNrIC0gaWQgb2YgdGhlIGNhbGxiYWNrIHRhc2sgdGhhdCBjb25maWd1cmVkIGluIHRoZSBBZG1pbiBTdHVkaW9cbiAqIEBwYXJhbSAge1N0cmluZ30gcGhvbmUgLSBVc2VyJ3MgcGhvbmUgbnVtYmVyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHRpbWUgLSBUaW1lc3RhbXAgb2YgdGhlIGNhbGwgdG8gYmUgaW5pdGlhdGVkXG4gKi9cbldjaGF0QVBJLnByb3RvdHlwZS5yZXF1ZXN0Q2FsbGJhY2sgPSBmdW5jdGlvbihwYXJhbXMsIGNiKXtcblx0cGFyYW1zLnNpZCA9IHRoaXMuc2Vzc2lvbi5zaWQ7XG5cblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAncmVxdWVzdENhbGxiYWNrJyxcblx0XHRwYXJhbXM6IHBhcmFtc1xuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24oZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAncmVxdWVzdENhbGxiYWNrJywgcGFyYW1zOiBwYXJhbXMgfSk7XG5cdFx0XHRyZXR1cm4gY2IoZXJyKTtcblx0XHR9XG5cdFx0aWYoY2IpIGNiKG51bGwsIGJvZHkucmVzdWx0KTtcblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRGlzam9pbiBjdXJyZW50IGFjdGl2ZSBzZXNzaW9uXG4gKiBFbWl0cyBzZXNzaW9uL2Rpc2pvaW4gZXZlbnRcbiAqIGlmIHJlcXVlc3QgaXMgZnVsZmlsbGVkXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNpZCBJRCBvZiBhY3RpdmUgc2Vzc2lvblxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUuZGlzam9pblNlc3Npb24gPSBmdW5jdGlvbihzaWQpe1xuXG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ2Rpc2pvaW5TZXNzaW9uJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogc2lkXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24gKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ2Rpc2pvaW5TZXNzaW9uJywgcGFyYW1zOiB7IHNpZDogc2lkIH0gfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbWl0KCdzZXNzaW9uL2Rpc2pvaW4nLCB7IHVybDogdXJsLmhyZWYgfSk7XG5cdH0uYmluZCh0aGlzKSk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2hhcmVPcGVuZWQgPSBmdW5jdGlvbigpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdzaGFyZU9wZW5lZCcsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRpZDogdGhpcy5zZXNzaW9uLnNoYXJlZElkLFxuXHRcdFx0dXJsOiB1cmwuaHJlZlxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUuc2hhcmVDbG9zZWQgPSBmdW5jdGlvbigpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdzaGFyZUNsb3NlZCcsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRpZDogdGhpcy5zZXNzaW9uLnNoYXJlZElkLFxuXHRcdFx0dXJsOiB1cmwuaHJlZlxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG59O1xuXG4vKipcbiAqIEluZm9ybXMgdGhlIHNlcnZlciB0aGF0IHRoZSBjb2Jyb3dzaW5nIGZlYXR1cmUgaXMgdHVybmVkIG9uIG9yIG9mZlxuICogQHBhcmFtICB7Qm9vbGVhbn0gc3RhdGUgUmVwcmVzZW50cyB0aGUgc3RhdGUgb2YgY29icm93c2luZyBmZWF0dXJlXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHVybCAgIFVybCB3aGVyZSB0aGUgZmVhdHVyZSdzIHN0YXRlIGlzIGNoYW5nZWRcbiAqIEByZXR1cm4gbm9uZVxuICovXG5XY2hhdEFQSS5wcm90b3R5cGUub3BlblNoYXJlID0gZnVuY3Rpb24odXJsKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAnb3BlblNoYXJlJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZCxcblx0XHRcdHVybDogdXJsXG5cdFx0fVxuXHR9O1xuXG5cdGlmKHRoaXMud2Vic29ja2V0KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2VuZERhdGEoZGF0YSk7XG5cdH1cblxuXHRyZXF1ZXN0LnBvc3QodGhpcy5vcHRpb25zLnNlcnZlclVybCwgZGF0YSwgZnVuY3Rpb24oZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnb3BlblNoYXJlJywgcGFyYW1zOiB7IHN0YXRlOiBzdGF0ZSB9IH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5zZXRDaGF0VGltZW91dCA9IGZ1bmN0aW9uKHRpbWVvdXQpe1xuXHRyZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKXtcblx0XHR0aGlzLmVtaXQoJ2NoYXQvdGltZW91dCcpO1xuXHR9LmJpbmQodGhpcyksIHRpbWVvdXQqMTAwMCk7XG59O1xuXG5XY2hhdEFQSS5wcm90b3R5cGUudXNlcklzVHlwaW5nID0gZnVuY3Rpb24oKXtcblx0dmFyIGRhdGEgPSB7XG5cdFx0bWV0aG9kOiAndHlwaW5nJyxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHNpZDogdGhpcy5zZXNzaW9uLnNpZFxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uIChlcnIpe1xuXHRcdGlmKGVycikge1xuXHRcdFx0dGhpcy5lbWl0KCdFcnJvcicsIGVyciwgeyBtZXRob2Q6ICdzZXRDaGF0VGltZW91dCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLnVwZGF0ZVVybCA9IGZ1bmN0aW9uKHVybCl7XG5cdHZhciBkYXRhID0ge1xuXHRcdG1ldGhvZDogJ3VwZGF0ZVVybCcsXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRzaWQ6IHRoaXMuc2Vzc2lvbi5zaWQsXG5cdFx0XHR1cmw6IHVybFxuXHRcdH1cblx0fTtcblxuXHRpZih0aGlzLndlYnNvY2tldCkge1xuXHRcdHJldHVybiB0aGlzLnNlbmREYXRhKGRhdGEpO1xuXHR9XG5cblx0cmVxdWVzdC5wb3N0KHRoaXMub3B0aW9ucy5zZXJ2ZXJVcmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgYm9keSl7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHR0aGlzLmVtaXQoJ0Vycm9yJywgZXJyLCB7IG1ldGhvZDogJ3VwZGF0ZVVybCcsIHBhcmFtczogeyB1cmw6IHVybCB9IH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fS5iaW5kKHRoaXMpKTtcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5saW5rRm9sbG93ZWQgPSBmdW5jdGlvbih1cmwpe1xuXHR2YXIgZGF0YSA9IHtcblx0XHRtZXRob2Q6ICdsaW5rRm9sbG93ZWQnLFxuXHRcdHBhcmFtczoge1xuXHRcdFx0c2lkOiB0aGlzLnNlc3Npb24uc2lkLFxuXHRcdFx0dXJsOiB1cmxcblx0XHR9XG5cdH07XG5cblx0aWYodGhpcy53ZWJzb2NrZXQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kRGF0YShkYXRhKTtcblx0fVxuXG5cdHJlcXVlc3QucG9zdCh0aGlzLm9wdGlvbnMuc2VydmVyVXJsLCBkYXRhLCBmdW5jdGlvbiAoZXJyLCBib2R5KXtcblx0XHRpZihlcnIpIHtcblx0XHRcdHRoaXMuZW1pdCgnRXJyb3InLCBlcnIsIHsgbWV0aG9kOiAnbGlua0ZvbGxvd2VkJywgcGFyYW1zOiB7IHVybDogdXJsIH0gfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9LmJpbmQodGhpcykpO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmRldGVjdExhbmd1YWdlID0gZnVuY3Rpb24oZnJhc2VzKXtcblx0dmFyIHN0b3JhZ2VMYW5nID0gc3RvcmFnZS5nZXRTdGF0ZSgnbGFuZycsICdzZXNzaW9uJyksXG5cdFx0YXZhaWxhYmxlTGFuZ3MgPSBbXSwgbGFuZywgcGF0aDtcblxuXHQvLyBsaXN0IGF2YWlsYWJsZSBsYW5ndWFnZXMgYnkgdHJhbnNsYXRpb25zIGtleXNcblx0Zm9yKHZhciBrZXkgaW4gZnJhc2VzKSB7XG5cdFx0YXZhaWxhYmxlTGFuZ3MucHVzaChrZXkpO1xuXHR9XG5cblx0aWYoc3RvcmFnZUxhbmcpIHtcblx0XHRsYW5nID0gc3RvcmFnZUxhbmc7XG5cdH0gZWxzZSBpZih0aGlzLnNlc3Npb24ubGFuZykge1xuXHRcdGxhbmcgPSB0aGlzLnNlc3Npb24ubGFuZztcblx0fSBlbHNlIGlmKHRoaXMuc2Vzc2lvbi5wcm9wZXJ0aWVzICYmIHRoaXMuc2Vzc2lvbi5wcm9wZXJ0aWVzLmxhbmcpIHtcblx0XHRsYW5nID0gdGhpcy5zZXNzaW9uLnByb3BlcnRpZXMubGFuZztcblx0fSBlbHNlIGlmKHRoaXMuc2Vzc2lvbi5sYW5nRnJvbVVybCB8fCAodGhpcy5zZXNzaW9uLnByb3BlcnRpZXMgJiYgdGhpcy5zZXNzaW9uLnByb3BlcnRpZXMubGFuZ0Zyb21VcmwpKSB7XG5cblx0XHR1cmwucGF0aG5hbWVcblx0XHQuc3BsaXQoJy8nKVxuXHRcdC5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0aXRlbSA9IGhhbmRsZUFsaWFzZXMoaXRlbSk7XG5cdFx0XHRpZihhdmFpbGFibGVMYW5ncy5pbmRleE9mKGl0ZW0pICE9PSAtMSkge1xuXHRcdFx0XHRsYW5nID0gaXRlbTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGl0ZW07XG5cdFx0fSk7XG5cdH1cblxuXHRpZighbGFuZykgbGFuZyA9IChuYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgbmF2aWdhdG9yLnVzZXJMYW5ndWFnZSkuc3BsaXQoJy0nKVswXTtcblx0aWYoYXZhaWxhYmxlTGFuZ3MuaW5kZXhPZihsYW5nKSA9PT0gLTEpIGxhbmcgPSAnZW4nO1xuXG5cdGRlYnVnLmxvZygnZGV0ZWN0ZWQgbGFuZzogJywgYXZhaWxhYmxlTGFuZ3MsIHN0b3JhZ2VMYW5nLCB0aGlzLnNlc3Npb24ubGFuZywgdGhpcy5zZXNzaW9uLmxhbmdGcm9tVXJsLCBsYW5nKTtcblx0dGhpcy5zZXNzaW9uLmxhbmcgPSBsYW5nO1xuXHRyZXR1cm4gbGFuZztcbn07XG5cbldjaGF0QVBJLnByb3RvdHlwZS5nZXRTaWRGcm9tVXJsID0gZnVuY3Rpb24odXJsKSB7XG5cdHZhciBzdWJzdHIgPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKCdjaGF0U2Vzc2lvbklkPScpKTtcblx0c3Vic3RyID0gc3Vic3RyLnN1YnN0cmluZyhzdWJzdHIuaW5kZXhPZignPScpKzEpO1xuXHRyZXR1cm4gc3Vic3RyO1xufTtcblxuV2NoYXRBUEkucHJvdG90eXBlLmNyZWF0ZVdlYnNvY2tldCA9IGZ1bmN0aW9uKGhvc3Qpe1xuICAgIC8vIHZhciBwcm90b2NvbCA9IChnbG9iYWwubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonKSA/ICd3c3M6JyA6ICd3czonO1xuICAgIHZhciBwcm90b2NvbCA9ICd3c3M6JztcbiAgICB2YXIgd2Vic29ja2V0ID0gbmV3IFdlYlNvY2tldChwcm90b2NvbCArICcvLycrd2Vic29ja2V0VXJsLCdqc29uLmFwaS5zbWlsZS1zb2Z0LmNvbScpOyAvL0luaXQgV2Vic29ja2V0IGhhbmRzaGFrZVxuXG4gICAgd2Vic29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICBkZWJ1Zy5sb2coJ1dlYlNvY2tldCBvcGVuZWQ6ICcsIGUpO1xuICAgICAgICB3ZWJzb2NrZXRUcnkgPSAxO1xuICAgICAgICBpZighbW9kdWxlSW5pdCkge1xuICAgICAgICBcdHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHdlYnNvY2tldC5vbm1lc3NhZ2UgPSB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHdlYnNvY2tldC5vbmNsb3NlID0gdGhpcy5vbldlYnNvY2tldENsb3NlLmJpbmQodGhpcyk7XG4gICAgd2Vic29ja2V0Lm9uZXJyb3IgPSB0aGlzLm9uRXJyb3I7XG5cbiAgICBnbG9iYWwub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgd2Vic29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7fTsgLy8gZGlzYWJsZSBvbmNsb3NlIGhhbmRsZXIgZmlyc3RcbiAgICAgICAgd2Vic29ja2V0LmNsb3NlKClcbiAgICB9O1xuXG4gICAgdGhpcy53ZWJzb2NrZXQgPSB3ZWJzb2NrZXQ7XG5cbn1cblxuV2NoYXRBUEkucHJvdG90eXBlLm9uV2Vic29ja2V0Q2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgZGVidWcubG9nKCdXZWJTb2NrZXQgY2xvc2VkJywgZSk7XG4gICAgdmFyIHRpbWUgPSBnZW5lcmF0ZUludGVydmFsKHdlYnNvY2tldFRyeSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICB3ZWJzb2NrZXRUcnkrKztcbiAgICAgICAgdGhpcy5jcmVhdGVXZWJzb2NrZXQoKTtcbiAgICB9LmJpbmQodGhpcyksIHRpbWUpO1xufVxuXG4vL1JlY29ubmVjdGlvbiBFeHBvbmVudGlhbCBCYWNrb2ZmIEFsZ29yaXRobSB0YWtlbiBmcm9tIGh0dHA6Ly9ibG9nLmpvaG5yeWRpbmcuY29tL3Bvc3QvNzg1NDQ5NjkzNDkvaG93LXRvLXJlY29ubmVjdC13ZWItc29ja2V0cy1pbi1hLXJlYWx0aW1lLXdlYi1hcHBcbmZ1bmN0aW9uIGdlbmVyYXRlSW50ZXJ2YWwgKGspIHtcbiAgICB2YXIgbWF4SW50ZXJ2YWwgPSAoTWF0aC5wb3coMiwgaykgLSAxKSAqIDEwMDA7XG4gIFxuICAgIGlmIChtYXhJbnRlcnZhbCA+IDMwKjEwMDApIHtcbiAgICAgICAgbWF4SW50ZXJ2YWwgPSAzMCoxMDAwOyAvLyBJZiB0aGUgZ2VuZXJhdGVkIGludGVydmFsIGlzIG1vcmUgdGhhbiAzMCBzZWNvbmRzLCB0cnVuY2F0ZSBpdCBkb3duIHRvIDMwIHNlY29uZHMuXG4gICAgfVxuICBcbiAgICAvLyBnZW5lcmF0ZSB0aGUgaW50ZXJ2YWwgdG8gYSByYW5kb20gbnVtYmVyIGJldHdlZW4gMCBhbmQgdGhlIG1heEludGVydmFsIGRldGVybWluZWQgZnJvbSBhYm92ZVxuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogbWF4SW50ZXJ2YWw7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFsaWFzZXMoYWxpYXMpIHtcblx0dmFyIGxhbmcgPSBhbGlhcztcblx0aWYoYWxpYXMgPT09ICd1YScpIGxhbmcgPSAndWsnO1xuXHRlbHNlIGlmKGFsaWFzID09PSAndXMnIHx8IGFsaWFzID09PSAnZ2InKSBsYW5nID0gJ2VuJztcblx0cmV0dXJuIGxhbmc7XG59XG5cbmZ1bmN0aW9uIHRvRm9ybURhdGEob2JqKSB7XG5cdHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXHRPYmplY3Qua2V5cyhvYmopLm1hcChmdW5jdGlvbihrZXkpIHtcblx0XHRpZihrZXkgPT09ICdmaWxlJykgZm9ybURhdGEuYXBwZW5kKGtleSwgb2JqW2tleV0sIG9iai5maWxlbmFtZSB8fCAnJyk7XG5cdFx0ZWxzZSBpZihrZXkgPT09ICdmaWxlbmFtZScpIHJldHVybiBrZXk7XG5cdFx0ZWxzZSBmb3JtRGF0YS5hcHBlbmQoa2V5LCBvYmpba2V5XSk7XG5cdFx0cmV0dXJuIGtleTtcblx0fSk7XG5cblx0ZGVidWcubG9nKCd0b0Zvcm1EYXRhOiAnLCBvYmosIGZvcm1EYXRhLmdldCgnZmlsZW5hbWUnKSk7XG5cblx0cmV0dXJuIGZvcm1EYXRhO1xufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ2xvZycpOyB9LFxuICAgIGluZm86IGZ1bmN0aW9uKCl7IGxvZyhhcmd1bWVudHMsICdpbmZvJyk7IH0sXG4gICAgd2FybjogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ3dhcm4nKTsgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24oKXsgbG9nKGFyZ3VtZW50cywgJ2Vycm9yJyk7IH1cbn07XG5cbmZ1bmN0aW9uIGxvZyhhcmdzLCBtZXRob2Qpe1xuICAgIGlmKGdsb2JhbC5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc3djLmRlYnVnJykpIHtcbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKGFyZ3MsIGZ1bmN0aW9uKGFyZyl7XG4gICAgICAgICAgICBnbG9iYWwuY29uc29sZVttZXRob2RdID8gZ2xvYmFsLmNvbnNvbGVbbWV0aG9kXShhcmcpIDogZ2xvYmFsLmNvbnNvbGUubG9nKGFyZyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxufSIsInZhciBfdGVtcGxhdGUgPSByZXF1aXJlKCdsb2Rhc2gvc3RyaW5nL3RlbXBsYXRlJyk7XG52YXIgX2ZvckVhY2ggPSByZXF1aXJlKCdsb2Rhc2gvY29sbGVjdGlvbi9mb3JlYWNoJyk7XG4vLyB2YXIgX2Fzc2lnbiA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvYXNzaWduJyk7XG52YXIgX21lcmdlID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9tZXJnZScpO1xuLy8gdmFyIF9pc0VxdWFsID0gcmVxdWlyZSgnbG9kYXNoL2xhbmcvaXNFcXVhbCcpO1xuLy8gdmFyIF90cmltID0gcmVxdWlyZSgnbG9kYXNoL3N0cmluZy90cmltJyk7XG52YXIgX3Rocm90dGxlID0gcmVxdWlyZSgnbG9kYXNoL2Z1bmN0aW9uL3Rocm90dGxlJyk7XG4vLyB2YXIgX2RlYm91bmNlID0gcmVxdWlyZSgnbG9kYXNoL2Z1bmN0aW9uL2RlYm91bmNlJyk7XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBmaW5kUGFyZW50KGVsZW0sIHNlbGVjdG9yKSB7XG5cbiAgICB2YXIgZmlyc3RDaGFyID0gc2VsZWN0b3IuY2hhckF0KDApO1xuXG4gICAgLy8gR2V0IGNsb3Nlc3QgbWF0Y2hcbiAgICBmb3IgKCA7IGVsZW0gJiYgZWxlbSAhPT0gZG9jdW1lbnQ7IGVsZW0gPSBlbGVtLnBhcmVudE5vZGUgKSB7XG4gICAgICAgIGlmICggZmlyc3RDaGFyID09PSAnLicgKSB7XG4gICAgICAgICAgICBpZiAoIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCBzZWxlY3Rvci5zdWJzdHIoMSkgKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZmlyc3RDaGFyID09PSAnIycgKSB7XG4gICAgICAgICAgICBpZiAoIGVsZW0uaWQgPT09IHNlbGVjdG9yLnN1YnN0cigxKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZmlyc3RDaGFyID09PSAnWycgKSB7XG4gICAgICAgICAgICBpZiAoZWxlbS5oYXNBdHRyaWJ1dGUoIHNlbGVjdG9yLnN1YnN0cigxLCBzZWxlY3Rvci5sZW5ndGggLSAyKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKGVsZW0ubm9kZU5hbWUgPT09IHNlbGVjdG9yLnRvVXBwZXJDYXNlKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG59XG5cbmZ1bmN0aW9uIHBvbGwoZm4sIGNhbGxiYWNrLCBlcnJiYWNrLCB0aW1lb3V0LCBpbnRlcnZhbCkge1xuICAgIHZhciBlbmRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpICsgKHRpbWVvdXQgfHwgMjAwMCk7XG4gICAgaW50ZXJ2YWwgPSBpbnRlcnZhbCB8fCAzMDA7XG5cbiAgICAoZnVuY3Rpb24gcCgpIHtcbiAgICAgICAgLy8gSWYgdGhlIGNvbmRpdGlvbiBpcyBtZXQsIHdlJ3JlIGRvbmUhIFxuICAgICAgICBpZihmbigpKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHRoZSBjb25kaXRpb24gaXNuJ3QgbWV0IGJ1dCB0aGUgdGltZW91dCBoYXNuJ3QgZWxhcHNlZCwgZ28gYWdhaW5cbiAgICAgICAgZWxzZSBpZiAoTnVtYmVyKG5ldyBEYXRlKCkpIDwgZW5kVGltZSkge1xuICAgICAgICAgICAgc2V0VGltZW91dChwLCBpbnRlcnZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRGlkbid0IG1hdGNoIGFuZCB0b28gbXVjaCB0aW1lLCByZWplY3QhXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXJyYmFjayhuZXcgRXJyb3IoJ3RpbWVkIG91dCBmb3IgJyArIGZuICsgJzogJyArIGFyZ3VtZW50cykpO1xuICAgICAgICB9XG4gICAgfSkoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHRlbXBsYXRlOiBfdGVtcGxhdGUsXG5cdGZvckVhY2g6IF9mb3JFYWNoLFxuXHQvLyBhc3NpZ246IF9hc3NpZ24sXG5cdG1lcmdlOiBfbWVyZ2UsXG5cdC8vIGlzRXF1YWw6IF9pc0VxdWFsLFxuXHQvLyB0cmltOiBfdHJpbSxcblx0dGhyb3R0bGU6IF90aHJvdHRsZSxcblx0ZGVib3VuY2U6IGRlYm91bmNlLFxuICAgIHBvbGw6IHBvbGwsXG5cdGZpbmRQYXJlbnQ6IGZpbmRQYXJlbnRcbn07IiwidmFyIHdpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LmpzJyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gd2lkZ2V0Lm1vZHVsZTtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciBjYWNoZSA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cG9zdDogcG9zdCxcblx0Z2V0OiBnZXQsXG5cdHB1dDogcHV0LFxuXHR1cGxvYWQ6IHVwbG9hZFxufTtcblxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEsIGNiKXtcblxuXHQvLyBkZWJ1Zy5sb2coJ3Bvc3QgcmVxdWVzdDogJywgdXJsLCBkYXRhKTtcblxuXHQvLyB2YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXG5cdFhtbEh0dHBSZXF1ZXN0KCdQT1NUJywgdXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGRlYnVnLmxvZygncG9zdCByZXNwb3NlOiAnLCBlcnIsIHJlcyk7XG5cblx0XHRpZihlcnIpIHJldHVybiBjYihlcnIpO1xuXG5cdFx0Y2IobnVsbCwgcmVzKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldChzZWxlY3RvciwgdXJsLCBjYil7XG5cblx0aWYoc2VsZWN0b3IgJiYgY2FjaGVbc2VsZWN0b3JdKSB7XG5cdFx0cmV0dXJuIGNiKG51bGwsIGNhY2hlW3NlbGVjdG9yXSk7XG5cdH1cblxuXHRYbWxIdHRwUmVxdWVzdCgnR0VUJywgdXJsLCBudWxsLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRpZihzZWxlY3RvcikgY2FjaGVbc2VsZWN0b3JdID0gcmVzO1xuXHRcdGNiKG51bGwsIHJlcyk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwdXQodXJsLCBkYXRhLCBjYil7XG5cblx0Ly8gZGVidWcubG9nKCdwb3N0IHJlcXVlc3Q6ICcsIHVybCwgZGF0YSk7XG5cblx0Ly8gdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcblxuXHRYbWxIdHRwUmVxdWVzdCgnUFVUJywgdXJsLCBkYXRhLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGRlYnVnLmxvZygncHV0IHJlc3Bvc2U6ICcsIGVyciwgcmVzKTtcblxuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRjYihudWxsLCByZXMpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gdXBsb2FkKHVybCwgZGF0YSwgY2IpIHtcblx0WG1sSHR0cFJlcXVlc3QoJ1BPU1QnLCB1cmwsIGRhdGEsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdFx0ZGVidWcubG9nKCdwb3N0IHJlc3Bvc2U6ICcsIGVyciwgcmVzKTtcblxuXHRcdGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cblx0XHRjYihudWxsLCByZXMpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBTZW5kIHJlcXVlc3QgdG8gdGhlIHNlcnZlciB2aWEgWE1MSHR0cFJlcXVlc3RcbiAqL1xuZnVuY3Rpb24gWG1sSHR0cFJlcXVlc3QobWV0aG9kLCB1cmwsIGRhdGEsIGNhbGxiYWNrKXtcblx0dmFyIHhociwgcmVzcG9uc2UsIHJlcXVlc3RUaW1lcjtcblxuXHR4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xuXG5cdHJlcXVlc3RUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHR4aHIuYWJvcnQoKTtcblx0fSwgNjAwMDApO1xuXHRcblx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh4aHIucmVhZHlTdGF0ZT09NCl7XG5cdFx0XHRjbGVhclRpbWVvdXQocmVxdWVzdFRpbWVyKTtcblx0XHRcdGlmKHhoci5yZXNwb25zZSkge1xuXHRcdFx0XHRyZXNwb25zZSA9IG1ldGhvZCA9PT0gJ1BPU1QnID8gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpIDogeGhyLnJlc3BvbnNlO1xuXHRcdFx0XHRpZihyZXNwb25zZS5lcnJvcikge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhyZXNwb25zZS5lcnJvcik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGRlYnVnLmxvZygnWG1sSHR0cFJlcXVlc3Q6ICcsIGRhdGEpO1xuXG5cdGlmKG1ldGhvZCA9PT0gJ1BPU1QnKSB7XG5cdFx0aWYodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnICYmICEoZGF0YSBpbnN0YW5jZW9mIEZvcm1EYXRhKSkge1xuXHRcdFx0ZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04Jyk7XG5cdFx0fVxuXHRcdFxuXHR9XG5cblx0aWYoZGF0YSkge1xuXHRcdHhoci5zZW5kKGRhdGEpO1xuXHR9IGVsc2Uge1xuXHRcdHhoci5zZW5kKCk7XG5cdH1cbn1cbiIsInZhciBzdG9yYWdlID0gZ2xvYmFsLmxvY2FsU3RvcmFnZTtcbnZhciBzZXNzaW9uID0gZ2xvYmFsLnNlc3Npb25TdG9yYWdlO1xudmFyIHByZWZpeCA9ICdzd2MnO1xudmFyIGRlbGltaXRlciA9ICcuJztcblxuLy8gQ3VycmVudCBjYWNoZSBvYmplY3RcbnZhciBjYWNoZSA9IHtcblx0c2lkOiBudWxsLFxuXHRldmVudFRpbWVzdGFtcDogMCxcblx0bXNnVGltZXN0YW1wOiAwLFxuXHRlbnRpdHk6IG51bGwsXG5cdGNoYXQ6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXQ6IGdldEl0ZW0sXG5cdHNldDogc2V0SXRlbSxcblx0cmVtb3ZlOiByZW1vdmVJdGVtLFxuXHRnZXRTdGF0ZTogZ2V0U3RhdGUsXG5cdHNhdmVTdGF0ZTogc2F2ZVN0YXRlLFxuXHRyZW1vdmVTdGF0ZTogcmVtb3ZlU3RhdGVcbn07XG5cbmZ1bmN0aW9uIGdldEl0ZW0oa2V5LCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0cmV0dXJuIEpTT04ucGFyc2Uoc2Vzc2lvbi5nZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KSk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIEpTT04ucGFyc2Uoc3RvcmFnZS5nZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0SXRlbShrZXksIHZhbHVlLCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0c2Vzc2lvbi5zZXRJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5LCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuXHR9IGVsc2Uge1xuXHRcdHN0b3JhZ2Uuc2V0SXRlbShwcmVmaXgrZGVsaW1pdGVyK2tleSwgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcblx0fVxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUl0ZW0oa2V5LCBsb2NhdGlvbikge1xuXHRpZihsb2NhdGlvbiA9PT0gJ3Nlc3Npb24nKSB7XG5cdFx0c2Vzc2lvbi5yZW1vdmVJdGVtKHByZWZpeCtkZWxpbWl0ZXIra2V5KTtcblx0fSBlbHNlIHtcblx0XHRzdG9yYWdlLnJlbW92ZUl0ZW0ocHJlZml4K2RlbGltaXRlcitrZXkpO1xuXHR9XG59XG5cbi8qKlxuICogR2V0IHNhdmVkIHByb3BlcnR5IGZyb20gbG9jYWxTdG9yYWdlIG9yIGZyb20gc2Vzc2lvbiBjYWNoZVxuICogQHBhcmFtICB7U3RyaW5nfSBrZXkgICAgICAtIGl0ZW0ga2V5IGluIHN0b3JhZ2UgbWVtb3J5XG4gKiBAcGFyYW0gIHtbdHlwZV19IGxvY2F0aW9uIC0gZnJvbSB3aGVyZSB0byByZXRyaWV2ZSBpdGVtLiBcbiAqIENvdWxkIGJlIGVpdGhlciBcInN0b3JhZ2VcIiAtIGZyb20gbG9jYWxTdG9yYWdlLCBvciBcImNhY2hlXCIgLSBmcm9tIHNlc3Npb24gY2FjaGVcbiAqIEByZXR1cm4ge1N0cmluZ3xPYmplY3R8RnVuY3Rpb259ICAgICAgICAgIC0gaXRlbSB2YWx1ZVxuICovXG5mdW5jdGlvbiBnZXRTdGF0ZShrZXksIGxvY2F0aW9uKXtcblx0aWYoIWxvY2F0aW9uKSB7XG5cdFx0cmV0dXJuIChjYWNoZVtrZXldICE9PSB1bmRlZmluZWQgJiYgY2FjaGVba2V5XSAhPT0gbnVsbCkgPyBjYWNoZVtrZXldIDogZ2V0SXRlbShrZXkpO1xuXHR9IGVsc2UgaWYobG9jYXRpb24gPT09ICdjYWNoZScpIHtcblx0XHRyZXR1cm4gY2FjaGVba2V5XTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gZ2V0SXRlbShrZXksIGxvY2F0aW9uKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzYXZlU3RhdGUoa2V5LCB2YWx1ZSwgbG9jYXRpb24pe1xuXHRjYWNoZVtrZXldID0gdmFsdWU7XG5cdGlmKGxvY2F0aW9uICE9PSAnY2FjaGUnKSB7XG5cdFx0c2V0SXRlbShrZXksIHZhbHVlLCBsb2NhdGlvbik7XG5cdH1cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVTdGF0ZShrZXksIGxvY2F0aW9uKSB7XG5cdGRlbGV0ZSBjYWNoZVtrZXldO1xuXHRyZW1vdmVJdGVtKGtleSk7XG59XG4iLCJ2YXIgXyA9IHt9O1xudmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnXG59O1xudmFyIGVzY2FwZVJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1snICsgT2JqZWN0LmtleXMoZXNjYXBlTWFwKS5qb2luKCcnKSArICddJywgJ2cnKTtcbl8uZXNjYXBlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgaWYgKCFzdHJpbmcpIHJldHVybiAnJztcbiAgICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZShlc2NhcGVSZWdleHAsIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVNYXBbbWF0Y2hdO1xuICAgIH0pO1xufTtcbmV4cG9ydHMuZW1haWwgPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5cbiB2YXIgcHJlZml4ID0gZGVmYXVsdHMucHJlZml4OyA7XG5fX3AgKz0gJ1xcbjwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBUcmFuc2l0aW9uYWwvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS10cmFuc2l0aW9uYWwuZHRkXCI+XFxuPGh0bWwgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI+XFxuICAgIDxoZWFkPlxcbiAgICAgICAgPG1ldGEgaHR0cC1lcXVpdj1cIkNvbnRlbnQtVHlwZVwiIGNvbnRlbnQ9XCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9d2luZG93cy0xMjUxXCIgLz5cXG4gICAgICAgIDwhLS1baWYgIW1zb10+PCEtLT5cXG4gICAgICAgICAgICA8bWV0YSBodHRwLWVxdWl2PVwiWC1VQS1Db21wYXRpYmxlXCIgY29udGVudD1cIklFPWVkZ2VcIiAvPlxcbiAgICAgICAgPCEtLTwhW2VuZGlmXS0tPlxcbiAgICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIj5cXG4gICAgICAgIDx0aXRsZT48L3RpdGxlPlxcbiAgICAgICAgPCEtLVtpZiAoZ3RlIG1zbyA5KXwoSUUpXT5cXG4gICAgICAgIDxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj5cXG4gICAgICAgICAgICB0YWJsZSB7Ym9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTt9XFxuICAgICAgICA8L3N0eWxlPlxcbiAgICAgICAgPCFbZW5kaWZdLS0+XFxuICAgICAgICA8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+XFxuICAgICAgICAgICAgLyogQmFzaWNzICovXFxuICAgICAgICAgICAgYm9keSB7XFxuICAgICAgICAgICAgTWFyZ2luOiAwO1xcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xcbiAgICAgICAgICAgICAgICBtaW4td2lkdGg6IDEwMCU7XFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIHRhYmxlIHtcXG4gICAgICAgICAgICAgICAgYm9yZGVyLXNwYWNpbmc6IDA7XFxuICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xcbiAgICAgICAgICAgICAgICBjb2xvcjogIzMzMzMzMztcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgdGQge1xcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICBpbWcge1xcbiAgICAgICAgICAgICAgICBib3JkZXI6IDA7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC53cmFwcGVyIHtcXG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwMCU7XFxuICAgICAgICAgICAgICAgIHRhYmxlLWxheW91dDogZml4ZWQ7XFxuICAgICAgICAgICAgICAgIC13ZWJraXQtdGV4dC1zaXplLWFkanVzdDogMTAwJTtcXG4gICAgICAgICAgICAgICAgLW1zLXRleHQtc2l6ZS1hZGp1c3Q6IDEwMCU7XFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNGMUYxRjE7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC53ZWJraXQge1xcbiAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDUwMHB4O1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAub3V0ZXIge1xcbiAgICAgICAgICAgIE1hcmdpbjogMCBhdXRvO1xcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XFxuICAgICAgICAgICAgICAgIHdpZHRoOiA5NSU7XFxuICAgICAgICAgICAgICAgIG1heC13aWR0aDogNTAwcHg7XFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEwcHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIHAge1xcbiAgICAgICAgICAgICAgICBNYXJnaW46IDA7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIGEge1xcbiAgICAgICAgICAgICAgICBjb2xvcjogI2VlNmE1NjtcXG4gICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5oMSB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjFweDtcXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICAgICAgICAgICAgICAgIE1hcmdpbi1ib3R0b206IDE4cHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5oMiB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcXG4gICAgICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICAgICAgICAgICAgICAgIE1hcmdpbi1ib3R0b206IDEycHg7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICBcXG4gICAgICAgICAgICAvKiBPbmUgY29sdW1uIGxheW91dCAqL1xcbiAgICAgICAgICAgIC5vbmUtY29sdW1uIC5jb250ZW50cyB7XFxuICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiM1MDUwNTA7XFxuICAgICAgICAgICAgICAgIGZvbnQtZmFtaWx5OkFyaWFsO1xcbiAgICAgICAgICAgICAgICBmb250LXNpemU6MTRweDtcXG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6MTUwJTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLm9uZS1jb2x1bW4gcCB7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcXG4gICAgICAgICAgICAgICAgTWFyZ2luLWJvdHRvbTogMTBweDtcXG4gICAgICAgICAgICB9XFxuICAgICAgICAgICAgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2Uge1xcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcXG4gICAgICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcXG4gICAgICAgICAgICAgICAgcGFkZGluZzogMTBweDtcXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI0ZGRkZGRjtcXG4gICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogNHB4IHNvbGlkICNDQ0NDQ0M7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlIGltZyB7XFxuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xcbiAgICAgICAgICAgICAgICBtYXgtd2lkdGg6IDUwMHB4O1xcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGF1dG87XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1tZXNzYWdlIHNwYW4ge1xcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogYm9sZDtcXG4gICAgICAgICAgICAgICAgY29sb3I6ICM5OTk5OTk7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC4nICtcbl9fZSggcHJlZml4ICkgK1xuJy1hZ2VudC1tc2cgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbSB7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjNTU1NTU1O1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAuJyArXG5fX2UoIHByZWZpeCApICtcbictdXNlci1tc2cgLicgK1xuX19lKCBwcmVmaXggKSArXG4nLW1lc3NhZ2UtZnJvbSB7XFxuICAgICAgICAgICAgICAgIGNvbG9yOiAjRjc1QjVEO1xcbiAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZSAuJyArXG5fX2UoIHByZWZpeCApICtcbictbWVzc2FnZS10aW1lIHtcXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgICAgICAgICAgICAgICBmbG9hdDogcmlnaHQ7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgICAgIC5jb3B5cmlnaHQge1xcbiAgICAgICAgICAgICAgICBtYXJnaW4tdG9wOiA1cHg7XFxuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcXG4gICAgICAgICAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xcbiAgICAgICAgICAgICAgICBjb2xvcjogI0NDQ0NDQztcXG4gICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XFxuICAgICAgICAgICAgfVxcblxcbiAgICAgICAgPC9zdHlsZT5cXG4gICAgPC9oZWFkPlxcbiAgICA8Ym9keT5cXG4gICAgICAgIDxjZW50ZXIgY2xhc3M9XCJ3cmFwcGVyXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIndlYmtpdFwiPlxcbiAgICAgICAgICAgICAgICA8IS0tW2lmIChndGUgbXNvIDkpfChJRSldPlxcbiAgICAgICAgICAgICAgICA8dGFibGUgd2lkdGg9XCI1MDBcIiBhbGlnbj1cImNlbnRlclwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIGJvcmRlcj1cIjBcIj5cXG4gICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICA8dGQ+XFxuICAgICAgICAgICAgICAgIDwhW2VuZGlmXS0tPlxcbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJvdXRlclwiIGFsaWduPVwiY2VudGVyXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgYm9yZGVyPVwiMFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm9uZS1jb2x1bW5cIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIHdpZHRoPVwiMTAwJVwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImlubmVyIGNvbnRlbnRzXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgK1xuKChfX3QgPSAoIGNvbnRlbnQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgIDwhLS1baWYgKGd0ZSBtc28gOSl8KElFKV0+XFxuICAgICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgIDwhW2VuZGlmXS0tPlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgPC9jZW50ZXI+XFxuICAgIDwvYm9keT5cXG48L2h0bWw+JztcblxufVxucmV0dXJuIF9fcFxufVxudmFyIF8gPSB7fTtcbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7J1xufTtcbnZhciBlc2NhcGVSZWdleHAgPSBuZXcgUmVnRXhwKCdbJyArIE9iamVjdC5rZXlzKGVzY2FwZU1hcCkuam9pbignJykgKyAnXScsICdnJyk7XG5fLmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGlmICghc3RyaW5nKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoZXNjYXBlUmVnZXhwLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZXNjYXBlTWFwW21hdGNoXTtcbiAgICB9KTtcbn07XG5leHBvcnRzLmZvcm1zID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuX19wICs9ICc8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy0nICtcbl9fZSggbWVzc2FnZS5lbnRpdHkgKSArXG4nLW1zZ1wiPlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS1mcm9tXCI+JyArXG5fX2UoIG1lc3NhZ2UuZnJvbSApICtcbic8L3NwYW4+XFxuXFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtY29udGVudFwiICc7XG4gaWYobWVzc2FnZS5lbnRpdHkgPT09IFwidXNlclwiKSB7IDtcbl9fcCArPSAnIHN0eWxlPVwiYm9yZGVyLWNvbG9yOlxcJycgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nXCIgJztcbiB9IDtcbl9fcCArPSAnPlxcblxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictJyArXG5fX2UoIGZvcm0ubmFtZSApICtcbidcIiBuYW1lPVwiJyArXG5fX2UoIGZvcm0ubmFtZSApICtcbidcIiAnO1xuIGlmKGZvcm0uYXV0b2NvbXBsZXRlKXsgO1xuX19wICs9ICdhdXRvY29tcGxldGU9XCJvblwiJztcbiB9IDtcbl9fcCArPSAnIGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXHRcXHRcXHQnO1xuIGlmKGZvcm0uZGVzY3JpcHRpb24pIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHQ8cCBzdHlsZT1cIm1hcmdpbjogMTBweCAwXCI+JyArXG4oKF9fdCA9ICggZnJhc2VzLkZPUk1TLkRFU0NSSVBUSU9OU1tmb3JtLmRlc2NyaXB0aW9uXSB8fCBmb3JtLmRlc2NyaXB0aW9uICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvcD5cXG5cXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChmb3JtLmZpZWxkcywgZnVuY3Rpb24oaXRlbSl7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0JztcbiBpZihpdGVtLnR5cGUgPT09ICdzZWxlY3QnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PHNlbGVjdCBuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIF8uZm9yRWFjaChpdGVtLm9wdGlvbnMsIGZ1bmN0aW9uKG9wdGlvbikgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCInICtcbl9fZSggb3B0aW9uLnZhbHVlICkgK1xuJ1wiICc7XG4gaWYob3B0aW9uLnNlbGVjdGVkKSB7IDtcbl9fcCArPSAnIHNlbGVjdGVkICc7XG4gfSA7XG5fX3AgKz0gJyA+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbb3B0aW9uLnRleHRdIHx8IG9wdGlvbi50ZXh0ICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PC9zZWxlY3Q+XFxuXFx0XFx0XFx0XFx0JztcbiB9IGVsc2UgaWYoaXRlbS50eXBlID09PSAndGV4dGFyZWEnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PHRleHRhcmVhIFxcblxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggaXRlbS5uYW1lICkgK1xuJ1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0cGxhY2Vob2xkZXI9XCInICtcbigoX190ID0gKCBmcmFzZXMuRk9STVMuUExBQ0VIT0xERVJTW2l0ZW0ucGxhY2Vob2xkZXJdIHx8IGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbaXRlbS5uYW1lXSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgJztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcqJztcbiB9IDtcbl9fcCArPSAnXCJcXG5cXHRcXHRcXHRcXHRcXHQ+PC90ZXh0YXJlYT5cXG5cXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCInICtcbigoX190ID0gKCBpdGVtLnR5cGUgfHwgJ3RleHQnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0cGxhY2Vob2xkZXI9XCInICtcbigoX190ID0gKCBmcmFzZXMuRk9STVMuUExBQ0VIT0xERVJTW2l0ZW0ucGxhY2Vob2xkZXJdIHx8IGZyYXNlcy5GT1JNUy5QTEFDRUhPTERFUlNbaXRlbS5uYW1lXSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgJztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcqJztcbiB9IDtcbl9fcCArPSAnXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIiAnO1xuIGlmKGl0ZW0udmFsdWUpeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdHZhbHVlPVwiJyArXG5fX2UoIGNyZWRlbnRpYWxzW2l0ZW0udmFsdWVdICkgK1xuJ1wiICc7XG4gfSA7XG5fX3AgKz0gJyAnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJ3JlcXVpcmVkJztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0Lz5cXG5cXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIlxcblxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJztcIj4nICtcbl9fZSggZnJhc2VzLkZPUk1TLnNlbmQgKSArXG4nPC9idXR0b24+XFxuXFx0XFx0XFx0PGJ1dHRvblxcblxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCJcXG5cXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJyZWplY3RGb3JtXCI+JyArXG5fX2UoIGZyYXNlcy5GT1JNUy5jYW5jZWwgKSArXG4nPC9idXR0b24+XFxuXFx0XFx0PC9mb3JtPlxcblxcdDwvZGl2PlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS10aW1lXCI+ICcgK1xuX19lKCBtZXNzYWdlLnRpbWUgKSArXG4nPC9zcGFuPlxcbjwvZGl2Pic7XG5cbn1cbnJldHVybiBfX3Bcbn1cbnZhciBfID0ge307XG52YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjeDI3Oydcbn07XG52YXIgZXNjYXBlUmVnZXhwID0gbmV3IFJlZ0V4cCgnWycgKyBPYmplY3Qua2V5cyhlc2NhcGVNYXApLmpvaW4oJycpICsgJ10nLCAnZycpO1xuXy5lc2NhcGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBpZiAoIXN0cmluZykgcmV0dXJuICcnO1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKGVzY2FwZVJlZ2V4cCwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZU1hcFttYXRjaF07XG4gICAgfSk7XG59O1xuZXhwb3J0cy5tZXNzYWdlID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuX19wICs9ICc8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy0nICtcbl9fZSggbWVzc2FnZS5lbnRpdHkgKSArXG4nLW1zZ1wiPlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS1mcm9tXCI+JyArXG5fX2UoIG1lc3NhZ2UuZnJvbSApICtcbic8L3NwYW4+XFxuXFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtY29udGVudFwiXFxuXFx0XFx0JztcbiBpZihtZXNzYWdlLmVudGl0eSAhPT0gXCJ1c2VyXCIpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0c3R5bGU9XCJib3JkZXItY29sb3I6JyArXG4oKF9fdCA9ICggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiIFxcblxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXHRcXHQ8cD4nICtcbigoX190ID0gKCBtZXNzYWdlLmNvbnRlbnQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9wPlxcblxcdDwvZGl2PlxcblxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbWVzc2FnZS10aW1lXCI+ICcgK1xuX19lKCBtZXNzYWdlLnRpbWUgKSArXG4nPC9zcGFuPlxcbjwvZGl2Pic7XG5cbn1cbnJldHVybiBfX3Bcbn1cbnZhciBfID0ge307XG52YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjeDI3Oydcbn07XG52YXIgZXNjYXBlUmVnZXhwID0gbmV3IFJlZ0V4cCgnWycgKyBPYmplY3Qua2V5cyhlc2NhcGVNYXApLmpvaW4oJycpICsgJ10nLCAnZycpO1xuXy5lc2NhcGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBpZiAoIXN0cmluZykgcmV0dXJuICcnO1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKGVzY2FwZVJlZ2V4cCwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZU1hcFttYXRjaF07XG4gICAgfSk7XG59O1xuZXhwb3J0cy53aWRnZXQgPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5cbiB2YXIgZnJhc2VzID0gdHJhbnNsYXRpb25zOyA7XG5fX3AgKz0gJ1xcbic7XG4gdmFyIHBhbmVscyA9IGZyYXNlcy5QQU5FTFM7IDtcbl9fcCArPSAnXFxuJztcbiB2YXIgY2hhbm5lbHMgPSBkZWZhdWx0cy5jaGFubmVsczsgO1xuX19wICs9ICdcXG4nO1xuIHZhciBwb3NpdGlvbkNsYXNzID0gZGVmYXVsdHMucG9zaXRpb24gPT09ICdyaWdodCcgPyAncG9zaXRpb24tcmlnaHQnIDogJ3Bvc2l0aW9uLWxlZnQnIDtcbl9fcCArPSAnXFxuPGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLWNvbnRcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLWNvbnQgJyArXG5fX2UoIHBvc2l0aW9uQ2xhc3MgKSArXG4nXCI+XFxuXFxuXFx0PCEtLSAqKioqKiBQYW5lcyBjb250YWluZXIgKioqKiogLS0+XFxuXFx0PGRpdiBcXG5cXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVzXCIgXFxuXFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lc1wiIFxcblxcdFxcdHN0eWxlPVwiJztcbiBpZihkZWZhdWx0cy5zdHlsZXMud2lkdGgpIHsgO1xuX19wICs9ICd3aWR0aDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy53aWR0aCApICtcbic7JztcbiB9IDtcbl9fcCArPSAnXCI+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBUb3AgYmFyICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10b3AtYmFyXCIgXFxuXFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0PCEtLSBNYWluIHRpdGxlIC0tPlxcblxcdFxcdFxcdDxoNCBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXRpdGxlICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVwcGVyY2FzZVwiPlxcblxcdFxcdFxcdFxcdCcgK1xuX19lKCBkZWZhdWx0cy50aXRsZSB8fCBmcmFzZXMuVE9QX0JBUi50aXRsZSApICtcbidcXG5cXHRcXHRcXHQ8L2g0PlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1zdGF0ZS1jb250XCI+XFxuXFx0XFx0XFx0XFx0PCEtLSA8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXN0YXRlLWljb25cIj4gPC9zcGFuPiAtLT5cXG5cXHRcXHRcXHRcXHQ8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXN0YXRlXCI+PC9zcGFuPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwhLS0gQWN0aW9uIGJ1dHRvbnMgKG1pbmltaXplLCBjbG9zZSkgLS0+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLW1pbmltaXplXCI+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLTxhIFxcblxcdFxcdFxcdFxcdFxcdGhyZWY9XCIjXCIgXFxuXFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHQ8c3BhbiBzdHlsZT1cImZvbnQtd2VpZ2h0OiBib2xkXCI+Xzwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8L2E+LS0+XFxuXFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0PGEgXFxuXFx0XFx0XFx0XFx0XFx0aHJlZj1cIiNcIiBcXG5cXHRcXHRcXHRcXHRcXHRzdHlsZT1cImNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nXCJcXG5cXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJjbG9zZVdpZGdldFwiXFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1pY29uLWNsb3NlXCI+PC9zcGFuPlxcblxcblxcdFxcdFxcdFxcdDwvYT5cXG5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIFRvcCBiYXIgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENvbm5lY3Rpb24gdHlwZXMgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIFxcblxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNob29zZUNvbm5lY3Rpb25cIj5cXG5cXHRcXHRcXHRcXG5cXHRcXHRcXHQ8IS0tIFBhbmVsXFwncyBpbWFnZSBjb250YWluZXIgLS0+XFxuXFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtaGVhZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWRhcmtcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArXG5fX2UoIGRlZmF1bHRzLmNsaWVudFBhdGggKSArXG4nJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5pbnRyby5iYWNrZ3JvdW5kSW1hZ2UgKSArXG4nKVwiIFxcblxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIFRoZSB0ZXh0IGRpc3BsYXllZCBvbiBpbWFnZSAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmFja2Ryb3AtY29udCAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13aGl0ZVwiPlxcblxcdFxcdFxcdFxcdFxcdDxicj5cXG5cXHRcXHRcXHRcXHRcXHQ8cD4nICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2hvb3NlX2Nvbm5fdHlwZSApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0PC9kaXY+XFxuXFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcblxcdFxcdFxcdFxcdDxmb3JtIFxcblxcdFxcdFxcdFxcdFxcdGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaW5pdC1mb3JtXCIgXFxuXFx0XFx0XFx0XFx0XFx0bmFtZT1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nSW5pdEZvcm1cIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGNoYW5uZWxzLndlYnJ0YykgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRcXHQ8IS0tIERpc3BsYXkgY2FsbCBidXR0b24gaWYgV2ViUlRDIGlzIGVuYWJsZWQgYW5kIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGRlZmF1bHRzLndlYnJ0Y0VuYWJsZWQpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDYWxsXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNhbGxfYWdlbnRfYnRuICkgK1xuJ1xcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdDwhLS0gSWYgV2ViUlRDIGlzIG5vdCBzdXBwb3J0ZWQgYW5kIGZhbGxiYWNrIGlzIHNldCAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSBpZihjaGFubmVscy53ZWJydGMuZmFsbGJhY2sgJiYgY2hhbm5lbHMud2VicnRjLmZhbGxiYWNrLnNpcENhbGwpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJidXR0b25cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiaW5pdEZhbGxiYWNrQ2FsbFwiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jYWxsX2FnZW50X2J0biApICtcbidcXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIERpc3BsYXkgY2FsbGJhY2sgYnV0dG9uIGlmIGNhbGxiYWNrIHRhc2sgaXMgY29uZmlndXJlZCBpbiB0aGUgc2V0dGluZ3MgLS0+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiBpZihjaGFubmVscy5jYWxsYmFjayAmJiBjaGFubmVscy5jYWxsYmFjay50YXNrKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Ym9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDYWxsYmFja1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ09OTkVDVElPTl9UWVBFUy5jYWxsYmFja19idG4gKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBJbml0IGNoYXQgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuY2hhdCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDxidXR0b25cXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQ6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nOyBjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJzsgYm9yZGVyOiAxcHggc29saWQgJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmNvbG9yICkgK1xuJztcIlxcblxcdFxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImluaXRDaGF0XCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5DT05ORUNUSU9OX1RZUEVTLmNoYXRfYWdlbnRfYnRuICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gQ2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLkNPTk5FQ1RJT05fVFlQRVMuY2FuY2VsICkgK1xuJzwvYT5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBDb25uZWN0aW9uIHR5cGVzIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIEludHJvIHBhbmUuIERpc3BsYXllZCBpZiBjb25maWd1cmVkIGluIHRoZSBzZXR0aW5ncyBvYmplY3QuICoqKioqIC0tPlxcblxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuaW50cm8gJiYgZGVmYXVsdHMuaW50cm8ubGVuZ3RoKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0PGRpdiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBcXG5cXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjcmVkZW50aWFsc1wiPlxcblxcblxcdFxcdFxcdFxcdDwhLS0gUGFuZWxcXCdzIGltYWdlIGNvbnRhaW5lciAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IFxcblxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1oZWFkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZGFya1wiIFxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLmludHJvLmJhY2tncm91bmRJbWFnZSkgeyA7XG5fX3AgKz0gJyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgnICtcbl9fZSggZGVmYXVsdHMuY2xpZW50UGF0aCApICtcbicnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLmludHJvLmJhY2tncm91bmRJbWFnZSApICtcbicpXCIgXFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gVGhlIHRleHQgZGlzcGxheWVkIG9uIGltYWdlIC0tPlxcblxcdFxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1iYWNrZHJvcC1jb250ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdoaXRlXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGJyPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxwPicgK1xuX19lKCBkZWZhdWx0cy5pbnRyb01lc3NhZ2UgfHwgcGFuZWxzLklOVFJPLmludHJvX21lc3NhZ2UgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8Zm9ybSBcXG5cXHRcXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWludHJvLWZvcm1cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbidJbnRyb0Zvcm1cIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLXZhbGlkYXRlLWZvcm09XCJ0cnVlXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0PCEtLSBJdGVyYXRpbmcgb3ZlciBpbnRybyBhcnJheSwgd2hpY2ggaXMgYSBsaXN0IG9mIG9iamVjdHMgLS0+XFxuXFx0XFx0XFx0XFx0XFx0XFx0JztcbiBfLmZvckVhY2goZGVmYXVsdHMuaW50cm8sIGZ1bmN0aW9uKGl0ZW0peyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS5uYW1lID09PSAnbGFuZycpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8c2VsZWN0IG5hbWU9XCJsYW5nXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBfLmZvckVhY2gobGFuZ3VhZ2VzLCBmdW5jdGlvbihsYW5nKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PG9wdGlvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR2YWx1ZT1cIicgK1xuX19lKCBsYW5nICkgK1xuJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYobGFuZyA9PT0gY3VyckxhbmcpIHsgO1xuX19wICs9ICcgc2VsZWN0ZWQgJztcbiB9IDtcbl9fcCArPSAnID5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggdHJhbnNsYXRpb25zW2xhbmddLmxhbmcgKSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9KTsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L3NlbGVjdD5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSBpZihpdGVtLm5hbWUgPT09ICdtZXNzYWdlJykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDx0ZXh0YXJlYVxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCJtZXNzYWdlXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRwbGFjZWhvbGRlcj1cIicgK1xuKChfX3QgPSAoIHBhbmVscy5JTlRSTy5QTEFDRUhPTERFUlNbaXRlbS5uYW1lXSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgJztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcgKiAnO1xuIH0gO1xuX19wICs9ICdcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdD48L3RleHRhcmVhPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSBlbHNlIGlmKGl0ZW0ubmFtZSA9PT0gJ2NvbnNlbnQnKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PGxhYmVsIGZvcj1cIicgK1xuX19lKGRlZmF1bHRzLnNpZCApICtcbictJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8aW5wdXQgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImNoZWNrYm94XCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZShkZWZhdWx0cy5zaWQgKSArXG4nLScgK1xuX19lKCBpdGVtLm5hbWUgKSArXG4nXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGl0ZW0ucmVxdWlyZWQpeyA7XG5fX3AgKz0gJyByZXF1aXJlZCAnO1xuIH0gO1xuX19wICs9ICc+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG4oKF9fdCA9ICggZGVmYXVsdHMuY29uc2VudFRleHQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0PC9sYWJlbD5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSBpZihpdGVtLnR5cGUgPT09ICdjaGVja2JveCcpIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8bGFiZWwgZm9yPVwiJyArXG5fX2UoZGVmYXVsdHMuc2lkICkgK1xuJy0nICtcbl9fZSggaXRlbS5uYW1lICkgK1xuJ1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDxpbnB1dCBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiY2hlY2tib3hcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKGRlZmF1bHRzLnNpZCApICtcbictJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdG5hbWU9XCInICtcbl9fZSggaXRlbS5uYW1lICkgK1xuJ1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS5yZXF1aXJlZCl7IDtcbl9fcCArPSAnIHJlcXVpcmVkICc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggaXRlbS5wbGFjZWhvbGRlciApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8L2xhYmVsPlxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gfSBlbHNlIHsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQ8aW5wdXQgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cIicgK1xuKChfX3QgPSAoIGl0ZW0udHlwZSB8fCAndGV4dCcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRwbGFjZWhvbGRlcj1cIicgK1xuKChfX3QgPSAoIHBhbmVscy5JTlRSTy5QTEFDRUhPTERFUlNbaXRlbS5uYW1lXSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgJztcbiBpZihpdGVtLnJlcXVpcmVkKXsgO1xuX19wICs9ICcgKiAnO1xuIH0gO1xuX19wICs9ICdcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRuYW1lPVwiJyArXG5fX2UoIGl0ZW0ubmFtZSApICtcbidcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGl0ZW0uc2F2ZSl7IDtcbl9fcCArPSAnIHZhbHVlPVwiJyArXG5fX2UoIGNyZWRlbnRpYWxzW2l0ZW0ubmFtZV0gKSArXG4nXCIgJztcbiB9IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoaXRlbS5yZXF1aXJlZCl7IDtcbl9fcCArPSAnIHJlcXVpcmVkICc7XG4gfSA7XG5fX3AgKz0gJz5cXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdDxicj48YnI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PCEtLSBJbml0IGNoYXQgd2l0aCBpbnRybyBwcm9wZXJ0aWVzIC0tPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxidXR0b24gXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0Y29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JyArXG5fX2UoIHBhbmVscy5JTlRSTy5zdGFydF9kaWFsb2dfYnV0dG9uICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdDwhLS0gQ2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLklOVFJPLmNhbmNlbCApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdDwhLS0gKioqKiogSW50cm8gcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogTWVzc2FnZXMgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2ICBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJtZXNzYWdlc1wiPlxcblxcdFxcdFxcdFxcblxcdFxcdFxcdDwhLS0gTWVzc2FnZXMgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDx1bCBcXG5cXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2VzLWNvbnRcIiBcXG5cXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2VzLWNvbnRcIiBcXG5cXHRcXHRcXHRcXHRzdHlsZT1cIlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLmhlaWdodCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdGhlaWdodDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5oZWlnaHQgKSArXG4nO1xcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1wiPlxcblxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdDwvdWw+XFxuXFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdyaXRlLWNvbnRcIj5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8IS0tIEVuZCBkaWFsb2cgYnV0dG9uIC0tPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1hY3Rpb24tYnRuc1wiPlxcblxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCIjXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1lbmQtZGlhbG9nLWJ0blwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImZpbmlzaFwiPicgK1xuX19lKCBwYW5lbHMuTUVTU0FHRVMuZW5kX2RpYWxvZyApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRyaWdnZXItc291bmRzLWJ0blwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cInRyaWdnZXJTb3VuZHNcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3BhbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIic7XG4gaWYoZGVmYXVsdHMuc291bmRzKSB7IDtcbl9fcCArPVxuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWljb24tYmVsbCc7XG4gfSBlbHNlIHsgO1xuX19wICs9XG5fX2UoIGRlZmF1bHRzLnByZWZpeCkgK1xuJy1pY29uLWJlbGwtc2xhc2gnO1xuIH0gO1xuX19wICs9ICdcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PC9hPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDwhLS0gXCJBZ2VudCBpcyB0eXBpbmdcIiBpbmRpY2F0b3IgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWxvYWRlclwiPlxcblxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdFxcdDwhLS0gXCJBdHRhY2ggZmlsZVwiIGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHQ8bGFiZWwgXFxuXFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zZW5kZmlsZS1jb250XCIgXFxuXFx0XFx0XFx0XFx0XFx0Zm9yPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZmlsZS1zZWxlY3RcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cImZpbGVcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWZpbGUtc2VsZWN0XCI+XFxuXFx0XFx0XFx0XFx0XFx0XFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4gXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1pY29uLXVwbG9hZFwiIFxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5iYWNrZ3JvdW5kQ29sb3IgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0PC9zcGFuPlxcblxcblxcdFxcdFxcdFxcdDwvbGFiZWw+XFxuXFxuXFx0XFx0XFx0XFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1lc3NhZ2UtdGV4dC1jbG9uZVwiICBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1zZy10ZXh0YXJlYS1jbG9uZVwiID48L2Rpdj5cXG5cXG5cXHRcXHRcXHRcXHQ8IS0tIEZpZWxkIGZvciB0eXBpbmcgdGhlIHVzZXIgbWVzc2FnZSAtLT5cXG5cXHRcXHRcXHRcXHQ8dGV4dGFyZWEgXFxuXFx0XFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1tZXNzYWdlLXRleHRcIiBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLW1zZy10ZXh0YXJlYVwiIFxcblxcdFxcdFxcdFxcdFxcdHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5NRVNTQUdFUy5QTEFDRUhPTERFUlMubWVzc2FnZSApICtcbidcIiBcXG5cXHRcXHRcXHRcXHRcXHRtYXhsZW5ndGg9XCIxMDAwXCI+PC90ZXh0YXJlYT5cXG5cXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHQ8IS0tIFwiU2VuZCBhIG1lc3NhZ2VcIiBidXR0b24gLS0+XFxuXFx0XFx0XFx0XFx0PGEgXFxuXFx0XFx0XFx0XFx0XFx0aHJlZj1cIiNcIiBcXG5cXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmRtc2ctYnRuICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvblwiIFxcblxcdFxcdFxcdFxcdFxcdGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cInNlbmRNZXNzYWdlXCI+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PHNwYW4gXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1pY29uLXBhcGVyLXBsYW5lXCIgXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJjb2xvcjogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8L3NwYW4+XFxuXFx0XFx0XFx0XFx0PC9hPlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogTWVzc2FnZXMgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogT2ZmbGluZSBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgXFxuXFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwic2VuZGVtYWlsXCI+XFxuXFxuXFx0XFx0XFx0PCEtLSBQYW5lbFxcJ3MgaW1hZ2UgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWhlYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1kYXJrXCIgXFxuXFx0XFx0XFx0XFx0JztcbiBpZihkZWZhdWx0cy5zdHlsZXMuc2VuZG1haWwuYmFja2dyb3VuZEltYWdlKSB7IDtcbl9fcCArPSAnIFxcblxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgK1xuX19lKCBkZWZhdWx0cy5jbGllbnRQYXRoICkgK1xuJycgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMuc2VuZG1haWwuYmFja2dyb3VuZEltYWdlICkgK1xuJylcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICc+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBUaGUgdGV4dCBkaXNwbGF5ZWQgb24gaW1hZ2UgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJhY2tkcm9wLWNvbnQgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictZGFya1wiPlxcblxcdFxcdFxcdFxcdFxcdDxwPicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5vZmZsaW5lX21lc3NhZ2UgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDwvZGl2PlxcblxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8aDQgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy11cHBlcmNhc2VcIj4nICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuc2VuZF9tZXNzYWdlX2hlYWRlciApICtcbic8L2g0PlxcblxcdFxcdFxcdFxcdDxmb3JtIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2VuZG1haWwtZm9ybVwiIGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwidW5hbWVcIiBwbGFjZWhvbGRlcj1cIicgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5QTEFDRUhPTERFUlMudW5hbWUgKSArXG4nXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJlbWFpbFwiIG5hbWU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLlBMQUNFSE9MREVSUy5lbWFpbCApICtcbicgKlwiIHJlcXVpcmVkPlxcblxcdFxcdFxcdFxcdFxcdDx0ZXh0YXJlYSBuYW1lPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLlBMQUNFSE9MREVSUy5tZXNzYWdlICkgK1xuJ1wiIG1heGxlbmd0aD1cIjE1MDBcIj48L3RleHRhcmVhPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS08aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiZmlsZVwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY29udGFjdGZpbGVcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWlucHV0ZmlsZVwiIC8+XFxuXFx0XFx0XFx0XFx0XFx0PGxhYmVsIGZvcj1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNvbnRhY3RmaWxlXCI+JyArXG5fX2UoIHBhbmVscy5PRkZMSU5FLmNob29zZV9maWxlICkgK1xuJzwvbGFiZWw+IC0tPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gXCJTZW5kIG9mZmxpbmUgbWVzc2FnZVwiIGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJzdWJtaXRcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuT0ZGTElORS5zZW5kX21lc3NhZ2VfYnV0dG9uICkgK1xuJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcblxcdFxcdFxcdFxcdFxcdDwvYnV0dG9uPlxcblxcblxcdFxcdFxcdFxcdFxcdDwhLS0gQ2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrXCIgZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiY2xvc2VXaWRnZXRcIj4nICtcbl9fZSggcGFuZWxzLk9GRkxJTkUuY2xvc2UgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIE9mZmxpbmUgcGFuZSBlbmRzICoqKioqIC0tPlxcblxcblxcdFxcdDwhLS0gKioqKiogQ2xvc2UgY2hhdCBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgXFxuXFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY2xvc2VjaGF0XCI+XFxuXFxuXFx0XFx0XFx0PCEtLSBQYW5lbFxcJ3MgaW1hZ2UgY29udGFpbmVyIC0tPlxcblxcdFxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWhlYWRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13aGl0ZVwiIFxcblxcdFxcdFxcdFxcdCc7XG4gaWYoZGVmYXVsdHMuc3R5bGVzLmNsb3NlQ2hhdC5iYWNrZ3JvdW5kSW1hZ2UpIHsgO1xuX19wICs9ICcgXFxuXFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArXG5fX2UoIGRlZmF1bHRzLmNsaWVudFBhdGggKSArXG4nJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5jbG9zZUNoYXQuYmFja2dyb3VuZEltYWdlICkgK1xuJylcIiBcXG5cXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICc+XFxuXFxuXFx0XFx0XFx0XFx0PCEtLSBUaGUgdGV4dCBkaXNwbGF5ZWQgb24gaW1hZ2UgLS0+XFxuXFx0XFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJhY2tkcm9wLWNvbnQgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2hpdGVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8YnI+XFxuXFx0XFx0XFx0XFx0XFx0PHA+JyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULmNsb3NlX2NoYXRfaGVhZGVyICkgK1xuJzwvcD5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1ib2R5XCI+XFxuXFx0XFx0XFx0XFx0PGZvcm0gaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jbG9zZWNoYXQtZm9ybVwiIGRhdGEtdmFsaWRhdGUtZm9ybT1cInRydWVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8bGFiZWwgZm9yPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2VuZC1kaWFsb2dcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cInNlbmREaWFsb2dcIiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNlbmQtZGlhbG9nXCIgLz5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj4nICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuc2VuZF9kaWFsb2dfbGFiZWwgKSArXG4nPC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdDwvbGFiZWw+XFxuXFx0XFx0XFx0XFx0XFx0PGlucHV0IHR5cGU9XCJlbWFpbFwiIG5hbWU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULlBMQUNFSE9MREVSUy5lbWFpbCApICtcbidcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8c2VsZWN0IG5hbWU9XCJyYXRpbmdcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiXCI+LS0tICcgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5yYXRlX2FnZW50ICkgK1xuJyAtLS08L29wdGlvbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8b3B0aW9uIHZhbHVlPVwiNVwiPicgK1xuX19lKCBmcmFzZXMuQUdFTlRfUkFURVMuZXhjZWxsZW50ICkgK1xuJzwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCI0XCI+JyArXG5fX2UoIGZyYXNlcy5BR0VOVF9SQVRFUy5nb29kICkgK1xuJzwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCIzXCI+JyArXG5fX2UoIGZyYXNlcy5BR0VOVF9SQVRFUy5mYWlyICkgK1xuJzwvb3B0aW9uPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCIyXCI+JyArXG5fX2UoIGZyYXNlcy5BR0VOVF9SQVRFUy5iYWQgKSArXG4nPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0PC9zZWxlY3Q+XFxuXFx0XFx0XFx0XFx0XFx0PHRleHRhcmVhIHBsYWNlaG9sZGVyPVwiJyArXG5fX2UoIHBhbmVscy5DTE9TRV9DSEFULlBMQUNFSE9MREVSUy5jb21tZW50ICkgK1xuJ1wiIG5hbWU9XCJ0ZXh0XCIgbWF4bGVuZ3RoPVwiMTUwMFwiPjwvdGV4dGFyZWE+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PCEtLSBFbmQgY2hhdCBhbmQgY2xvc2Ugd2lkZ2V0IGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uIFxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJzdWJtaXRcIiBcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24tcHJpbWFyeSAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIFxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQ0xPU0VfQ0hBVC5maW5pc2hfZGlhbG9nX2J1dHRvbiApICtcbidcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8IS0tIFwiQmFjayB0byB0aGUgY2hhdFwiIGJ1dHRvbiAtLT5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI21lc3NhZ2VzXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIj4nICtcbl9fZSggcGFuZWxzLkNMT1NFX0NIQVQuYmFjayApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQ2xvc2UgY2hhdCBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBBdWRpbyBjYWxsIHBhbmUgKioqKiogLS0+XFxuXFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXdnLXBhbmVcIiBkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmU9XCJjYWxsQWdlbnRcIj5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1ib2R5XCI+XFxuXFx0XFx0XFx0XFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGwtc3Bpbm5lclwiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc3Bpbm5lci1wYW5lXCI+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj4nICtcbl9fZSggcGFuZWxzLkFVRElPX0NBTEwuY29uZmlybV9hY2Nlc3MgKSArXG4nPC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlciAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1sb2FkZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictc2hvd25cIiBzdHlsZT1cInBvc2l0aW9uOiByZWxhdGl2ZTtcIj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHQ8L2gzPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdFxcdDxkaXYgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsLWluZm9cIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhpZGRlblwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyXCIgaWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1jYWxsLXN0YXRlXCI+JyArXG5fX2UoIHBhbmVscy5BVURJT19DQUxMLmNhbGxpbmdfYWdlbnQgKSArXG4nPC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbC10aW1lclwiPjAwOjAwPC9oMz5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHRcXHRcXHQ8Zm9ybSBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGwtY29udHJvbFwiPlxcblxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uXFxuXFx0XFx0XFx0XFx0XFx0XFx0aWQ9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10cnlhZ2Fpbi1idG5cIlxcblxcdFxcdFxcdFxcdFxcdFxcdHR5cGU9XCJidXR0b25cIlxcblxcdFxcdFxcdFxcdFxcdFxcdGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbi1wcmltYXJ5ICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJsb2NrICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhpZGRlblwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0c3R5bGU9XCJiYWNrZ3JvdW5kOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuYmFja2dyb3VuZENvbG9yICkgK1xuJzsgY29sb3I6ICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7IGJvcmRlcjogMXB4IHNvbGlkICcgK1xuX19lKCBkZWZhdWx0cy5zdHlsZXMucHJpbWFyeS5jb2xvciApICtcbic7XCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRkYXRhLScgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhhbmRsZXI9XCJpbml0Q2FsbFwiPlxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQVVESU9fQ0FMTC50cnlfYWdhaW4gKSArXG4nXFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFx0XFxuXFx0XFx0XFx0XFx0XFx0PGJ1dHRvbiBcXG5cXHRcXHRcXHRcXHRcXHRcXHR0eXBlPVwiYnV0dG9uXCJcXG5cXHRcXHRcXHRcXHRcXHRcXHRjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24td2FybiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwiZW5kQ2FsbFwiPlxcblxcblxcdFxcdFxcdFxcdFxcdFxcdCcgK1xuX19lKCBwYW5lbHMuQVVESU9fQ0FMTC5lbmRfY2FsbCApICtcbidcXG5cXG5cXHRcXHRcXHRcXHRcXHQ8L2J1dHRvbj5cXG5cXHRcXHRcXHRcXHQ8L2Zvcm0+XFxuXFx0XFx0XFx0PC9kaXY+XFxuXFx0XFx0PC9kaXY+XFxuXFx0XFx0PCEtLSAqKioqKiBBdWRpbyBjYWxsIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIEF1ZGlvIGNhbGwgZmFsbGJhY2sgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNhbGxBZ2VudEZhbGxiYWNrXCI+XFxuXFx0XFx0XFx0PGRpdiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXBhbmUtYm9keVwiPlxcblxcdFxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMz4nICtcbl9fZSggcGFuZWxzLkFVRElPX0NBTExfRkFMTEJBQ0suRE9XTkxPQURfTVNHICkgK1xuJzwvaDM+XFxuXFx0XFx0XFx0XFx0XFx0PGJyPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gaWYoY2hhbm5lbHMud2VicnRjICYmIGNoYW5uZWxzLndlYnJ0Yy5mYWxsYmFjaykgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdDxhIGhyZWY9XCInICtcbl9fZSggY2hhbm5lbHMud2VicnRjLmZhbGxiYWNrLnNpcENhbGwgKSArXG4nXCI+Y2FsbC5qbmxwPC9hPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdFxcdDxmb3JtPlxcblxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI2Nob29zZUNvbm5lY3Rpb25cIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suYmFjayApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQXVkaW8gY2FsbCBmYWxsYmFjayBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0XFx0PCEtLSAqKioqKiBDYWxsYmFjayBwYW5lICoqKioqIC0tPlxcblxcdFxcdDxkaXYgXFxuXFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1wYW5lXCIgXFxuXFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lPVwiY2FsbGJhY2tcIj5cXG5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZS1ib2R5XCI+XFxuXFx0XFx0XFx0XFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGxiYWNrLXNwaW5uZXJcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWhpZGRlbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1zcGlubmVyLXBhbmVcIj5cXG5cXHRcXHRcXHRcXHRcXHQ8aDMgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suc2VuZGluZ19yZXF1ZXN0ICkgK1xuJzwvaDM+XFxuXFx0XFx0XFx0XFx0XFx0PGgzIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXIgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbG9hZGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXNob3duXCIgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmU7XCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHNwYW4+PC9zcGFuPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxzcGFuPjwvc3Bhbj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0XFx0PC9oMz5cXG5cXHRcXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHRcXHRcXHQ8Zm9ybSBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWNhbGxiYWNrLXNldHRpbmdzXCI+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiBpZihjaGFubmVscy5jYWxsYmFjayAmJiBjaGFubmVscy5jYWxsYmFjay50aW1lICE9PSBmYWxzZSkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdDxwIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1jZW50ZXJcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLnRpdGxlICkgK1xuJzwvcD5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PHAgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0sudGl0bGVfYXNhcCApICtcbic8L3A+XFxuXFx0XFx0XFx0XFx0XFx0JztcbiB9IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0PGhyPlxcblxcdFxcdFxcdFxcdFxcdDxsYWJlbD4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLkxBQkVMUy5waG9uZSApICtcbic8L2xhYmVsPlxcblxcdFxcdFxcdFxcdFxcdDxpbnB1dCB0eXBlPVwidGVsXCIgbmFtZT1cInBob25lXCIgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLlBMQUNFSE9MREVSUy5waG9uZSApICtcbidcIiByZXF1aXJlZD5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGNoYW5uZWxzLmNhbGxiYWNrICYmIGNoYW5uZWxzLmNhbGxiYWNrLnRpbWUgIT09IGZhbHNlKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PGxhYmVsPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suTEFCRUxTLnRpbWUgKSArXG4nPC9sYWJlbD5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8c2VsZWN0IG5hbWU9XCJ0aW1lXCI+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiBfLmZvckVhY2gocGFuZWxzLkNBTExCQUNLLlRJTUVfUE9JTlRTLCBmdW5jdGlvbihwb2ludCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdDxvcHRpb24gdmFsdWU9XCInICtcbl9fZSggcG9pbnQubWludXRlcyApICtcbidcIj4nICtcbl9fZSggcG9pbnQubGFiZWwgKSArXG4nPC9vcHRpb24+XFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0JztcbiB9KTsgO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHRcXHQ8L3NlbGVjdD5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gO1xuX19wICs9ICdcXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGNoYW5uZWxzLmNhbGxiYWNrICYmIGNoYW5uZWxzLmNhbGxiYWNrLm1lc3NhZ2UgIT09IHVuZGVmaW5lZCkgeyA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdFxcdDxsYWJlbD4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLkxBQkVMUy5tZXNzYWdlICkgK1xuJzwvbGFiZWw+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PHRleHRhcmVhIG5hbWU9XCJtZXNzYWdlXCIgcGxhY2Vob2xkZXI9XCInICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLlBMQUNFSE9MREVSUy5tZXNzYWdlICkgK1xuJ1wiIG1heGxlbmd0aD1cIjE1MDBcIj48L3RleHRhcmVhPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXG5cXHRcXHRcXHRcXHRcXHQ8YnV0dG9uXFxuXFx0XFx0XFx0XFx0XFx0XFx0dHlwZT1cInN1Ym1pdFwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0Y2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnV0dG9uLXByaW1hcnkgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIlxcblxcdFxcdFxcdFxcdFxcdFxcdHN0eWxlPVwiXFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0YmFja2dyb3VuZDogJyArXG5fX2UoIGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciApICtcbic7IFxcblxcdFxcdFxcdFxcdFxcdFxcdFxcdGNvbG9yOiAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nOyBcXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRib3JkZXI6IDFweCBzb2xpZCAnICtcbl9fZSggZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgKSArXG4nO1wiXFxuXFx0XFx0XFx0XFx0XFx0XFx0ZGF0YS0nICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1oYW5kbGVyPVwic2V0Q2FsbGJhY2tcIj5cXG5cXG5cXHRcXHRcXHRcXHRcXHRcXHQnICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmNvbmZpcm1fY2FsbGJhY2sgKSArXG4nXFxuXFxuXFx0XFx0XFx0XFx0XFx0PC9idXR0b24+XFxuXFxuXFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNjaG9vc2VDb25uZWN0aW9uXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idXR0b24gJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYmxvY2tcIj4nICtcbl9fZSggcGFuZWxzLkNBTExCQUNLLmJhY2sgKSArXG4nPC9hPlxcblxcdFxcdFxcdFxcdDwvZm9ybT5cXG5cXHRcXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8L2Rpdj5cXG5cXHRcXHQ8IS0tICoqKioqIENhbGxiYWNrIHBhbmUgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHRcXHQ8IS0tICoqKioqIENhbGxiYWNrIHNlbnQgcGFuZSAqKioqKiAtLT5cXG5cXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictd2ctcGFuZVwiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictcGFuZT1cImNhbGxiYWNrU2VudFwiPlxcblxcdFxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1wYW5lLWJvZHlcIj5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictY2FsbGJhY2stc2VudFwiPlxcblxcdFxcdFxcdFxcdFxcdDxoMyBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXRleHQtY2VudGVyICcgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWljb24tY2hlY2sgJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdGV4dC1zdWNjZXNzXCI+PC9oMz5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIGlmKGNoYW5uZWxzLmNhbGxiYWNrICYmIGNoYW5uZWxzLmNhbGxiYWNrLnRpbWUgIT09IGZhbHNlKSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PHAgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0sucmVxdWVzdF9zZW50ICkgK1xuJzwvcD5cXG5cXHRcXHRcXHRcXHRcXHQnO1xuIH0gZWxzZSB7IDtcbl9fcCArPSAnXFxuXFx0XFx0XFx0XFx0XFx0XFx0PHAgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy10ZXh0LWNlbnRlclwiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0sucmVxdWVzdF9zZW50X2FzYXAgKSArXG4nPC9wPlxcblxcdFxcdFxcdFxcdFxcdCc7XG4gfSA7XG5fX3AgKz0gJ1xcblxcdFxcdFxcdFxcdFxcdDxmb3JtPlxcblxcdFxcdFxcdFxcdFxcdFxcdDxocj5cXG5cXHRcXHRcXHRcXHRcXHRcXHQ8YSBocmVmPVwiI2Nob29zZUNvbm5lY3Rpb25cIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiPicgK1xuX19lKCBwYW5lbHMuQ0FMTEJBQ0suYmFjayApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0XFx0PGEgaHJlZj1cIiNcIiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ1dHRvbiAnICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1ibG9ja1wiIGRhdGEtJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaGFuZGxlcj1cImNsb3NlV2lkZ2V0XCI+JyArXG5fX2UoIHBhbmVscy5DQUxMQkFDSy5jbG9zZSApICtcbic8L2E+XFxuXFx0XFx0XFx0XFx0XFx0PC9mb3JtPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdDwvZGl2PlxcblxcdFxcdDwhLS0gKioqKiogQ2FsbGJhY2sgc2VudCBwYW5lIGVuZHMgKioqKiogLS0+XFxuXFxuXFx0PC9kaXY+XFxuXFx0PCEtLSAqKioqKiBQYW5lcyBjb250YWluZXIgZW5kcyAqKioqKiAtLT5cXG5cXG5cXHQ8IS0tICoqKioqIEZsb2F0aW5nIGJ1dHRvbiBjb250YWluZXIgKioqKiogLS0+XFxuXFx0PGRpdiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLWJ0bi1jb250XCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idG4tY29udFwiPlxcblxcdFxcdDxkaXYgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy13Zy1idG5cIj5cXG5cXHRcXHRcXHQ8ZGl2IGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZy1jb250XCI+XFxuXFx0XFx0XFx0XFx0PHNwYW4gY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy11bm5vdGlmeS1idG5cIiBpZD1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVubm90aWZ5LWJ0blwiPjxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictaWNvbi1jbG9zZVwiPjwvc3Bhbj48L3NwYW4+XFxuXFx0XFx0XFx0XFx0PCEtLSA8c3BhbiBjbGFzcz1cIicgK1xuX19lKCBkZWZhdWx0cy5wcmVmaXggKSArXG4nLXVubm90aWZ5LWJ0blwiIGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictdW5ub3RpZnktYnRuXCI+JyArXG5fX2UoIGZyYXNlcy5GTE9BVElOR19CVVRUT04uY2xvc2UgKSArXG4nPC9zcGFuPiAtLT5cXG5cXHRcXHRcXHRcXHQ8ZGl2IGlkPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZ1wiIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictbGFzdG1zZ1wiPlxcblxcdFxcdFxcdFxcdDwvZGl2PlxcdFxcblxcdFxcdFxcdDwvZGl2PlxcblxcdFxcdFxcdDxhIGhyZWY9XCIjXCIgY2xhc3M9XCInICtcbl9fZSggZGVmYXVsdHMucHJlZml4ICkgK1xuJy1idG4tbGlua1wiPlxcblxcdFxcdFxcdFxcdDxzcGFuIGNsYXNzPVwiJyArXG5fX2UoIGRlZmF1bHRzLnByZWZpeCApICtcbictYnRuLWljb25cIj48L3NwYW4+XFxuXFx0XFx0XFx0PC9hPlxcblxcdFxcdDwvZGl2PlxcblxcdDwvZGl2PlxcblxcdDwhLS0gKioqKiogRmxvYXRpbmcgYnV0dG9uIGNvbnRhaW5lciBlbmRzICoqKioqIC0tPlxcblxcbjwvZGl2Pic7XG5cbn1cbnJldHVybiBfX3Bcbn0iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG52YXIgZXZlbnRzID0ge30sXG4vLyBKc1NJUCA9IHJlcXVpcmUoJ2pzc2lwJyksXG4vLyBKc1NJUCA9IHJlcXVpcmUoJy4vbGlicy9qc3NpcCcpLFxuSnNTSVAsXG5vcHRpb25zLFxuc2lwQ2xpZW50LFxuc2lwU2Vzc2lvbixcbnNpcENhbGxFdmVudHM7XG5cbmZ1bmN0aW9uIGlzV2VicnRjU3VwcG9ydGVkKCl7XG5cdHZhciBSVEMgPSB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24gfHwgd2luZG93Lm1velJUQ1BlZXJDb25uZWN0aW9uIHx8IHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbixcblx0XHR1c2VyTWVpZGEgPSBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEsXG5cdFx0aWNlID0gd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZSB8fCB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlO1xuXG5cdHJldHVybiAhIVJUQyAmJiAhIXVzZXJNZWlkYSAmJiAhIWljZTtcbn1cblxuZnVuY3Rpb24gaW5pdEpzU0lQRXZlbnRzKCl7XG5cdHNpcENsaWVudC5vbignY29ubmVjdGVkJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIGNvbm5lY3RlZCBldmVudDogJywgZSk7IH0pO1xuXHRzaXBDbGllbnQub24oJ2Rpc2Nvbm5lY3RlZCcsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCBkaXNjb25uZWN0ZWQgZXZlbnQ6ICcsIGUpOyB9KTtcblx0c2lwQ2xpZW50Lm9uKCduZXdNZXNzYWdlJywgZnVuY3Rpb24oZSl7IGRlYnVnLmxvZygnc2lwIG5ld01lc3NhZ2UgZXZlbnQ6ICcsIGUpOyB9KTtcblx0c2lwQ2xpZW50Lm9uKCduZXdSVENTZXNzaW9uJywgZnVuY3Rpb24oZSl7XG5cdFx0ZGVidWcubG9nKCdzaXAgbmV3UlRDU2Vzc2lvbiBldmVudDogJywgZSk7XG5cdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9uZXdSVENTZXNzaW9uJywgZSk7XG5cdFx0Ly8gaWYoZS5zZXNzaW9uLmRpcmVjdGlvbiA9PT0gJ291dGdvaW5nJylcblx0XHQvLyBcdGV2ZW50cy5lbWl0KCd3ZWJydGMvb3V0Z29pbmdDYWxsJywgZSk7XG5cdFx0Ly8gZWxzZVxuXHRcdC8vIFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9pbmNvbWluZ0NhbGwnLCBlKTtcblx0XHRcblx0XHRcdHNpcFNlc3Npb24gPSBlLnNlc3Npb247XG5cdH0pO1xuXHRzaXBDbGllbnQub24oJ3JlZ2lzdGVyZWQnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgcmVnaXN0ZXJlZCBldmVudDogJywgZSk7IH0pO1xuXHRzaXBDbGllbnQub24oJ3VucmVnaXN0ZXJlZCcsIGZ1bmN0aW9uKGUpeyBkZWJ1Zy5sb2coJ3NpcCB1bnJlZ2lzdGVyZWQgZXZlbnQ6ICcsIGUpOyB9KTtcblx0c2lwQ2xpZW50Lm9uKCdyZWdpc3RyYXRpb25GYWlsZWQnLCBmdW5jdGlvbihlKXsgZGVidWcubG9nKCdzaXAgcmVnaXN0cmF0aW9uRmFpbGVkIGV2ZW50OiAnLCBlKTsgfSk7XG5cblx0c2lwQ2FsbEV2ZW50cyA9IHtcblx0XHRwcm9ncmVzczogZnVuY3Rpb24oZSl7XG5cdFx0XHRkZWJ1Zy5sb2coJ2NhbGwgcHJvZ3Jlc3MgZXZlbnQ6ICcsIGUpO1xuXHRcdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9wcm9ncmVzcycsIGUpO1xuXHRcdH0sXG5cdFx0ZmFpbGVkOiBmdW5jdGlvbihlKXtcblx0XHRcdGRlYnVnLmxvZygnY2FsbCBmYWlsZWQgZXZlbnQ6JywgZSk7XG5cdFx0XHRldmVudHMuZW1pdCgnd2VicnRjL2ZhaWxlZCcsIGUpO1xuXHRcdH0sXG5cdFx0ZW5kZWQ6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZGVidWcubG9nKCdjYWxsIGVuZGVkIGV2ZW50OiAnLCBlKTtcblx0XHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvZW5kZWQnLCBlKTtcblx0XHR9LFxuXHRcdGNvbmZpcm1lZDogZnVuY3Rpb24oZSl7XG5cdFx0XHRkZWJ1Zy5sb2coJ2NhbGwgY29uZmlybWVkIGV2ZW50OiAnLCBlKTtcblx0XHRcdGV2ZW50cy5lbWl0KCd3ZWJydGMvY29uZmlybWVkJywgZSk7XG5cdFx0fVxuXHRcdC8vIGFkZHN0cmVhbTogZnVuY3Rpb24oZSl7XG5cdFx0Ly8gXHRkZWJ1Zy5sb2coJ2NhbGwgYWRkc3RyZWFtIGV2ZW50OiAnLCBlKTtcblx0XHQvLyBcdGV2ZW50cy5lbWl0KCd3ZWJydGMvYWRkc3RyZWFtJywgZSk7XG5cdFx0Ly8gXHR2YXIgc3RyZWFtID0gZS5zdHJlYW07XG5cdFx0Ly8gXHRvcHRpb25zLmF1ZGlvUmVtb3RlID0gSnNTSVAucnRjbmluamEuYXR0YWNoTWVkaWFTdHJlYW0ob3B0aW9ucy5hdWRpb1JlbW90ZSwgc3RyZWFtKTtcblx0XHQvLyB9XG5cdFx0Ly8gc2RwOiBmdW5jdGlvbihlKXtcblx0XHQvLyBcdGRlYnVnLmxvZygnc2RwOiAnLCBlKTtcblx0XHQvLyB9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGlzRXN0YWJsaXNoZWQoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNFc3RhYmxpc2hlZCgpO1xufVxuXG5mdW5jdGlvbiBpc0luUHJvZ3Jlc3MoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNJblByb2dyZXNzKCk7XG59XG5cbmZ1bmN0aW9uIGlzRW5kZWQoKXtcblx0cmV0dXJuIHNpcFNlc3Npb24uaXNFbmRlZCgpO1xufVxuXG5mdW5jdGlvbiB1bnJlZ2lzdGVyKCl7XG5cdHNpcENsaWVudC5zdG9wKCk7XG59XG5cbmZ1bmN0aW9uIGF1ZGlvY2FsbChudW1iZXIpe1xuXHRzaXBTZXNzaW9uID0gc2lwQ2xpZW50LmNhbGwobnVtYmVyLCB7XG5cdFx0ZXZlbnRIYW5kbGVyczogc2lwQ2FsbEV2ZW50cyxcblx0XHRtZWRpYUNvbnN0cmFpbnRzOiB7IGF1ZGlvOiB0cnVlLCB2aWRlbzogZmFsc2UgfVxuXHR9KTtcblxuXHRzaXBTZXNzaW9uLmNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcigndHJhY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0ZXZlbnRzLmVtaXQoJ3dlYnJ0Yy9hZGRzdHJlYW0nLCBlKTtcblx0XHRpZihvcHRpb25zLmF1ZGlvUmVtb3RlLnNyY09iamVjdCAhPT0gZS5zdHJlYW1zWzBdKSBvcHRpb25zLmF1ZGlvUmVtb3RlLnNyY09iamVjdCA9IGUuc3RyZWFtc1swXTtcblx0XHQvLyBlLnN0cmVhbXMuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcblx0XHQvLyBcdGUudHJhY2subXV0ZWQgPSBmYWxzZTtcblx0XHQvLyBcdHNpcFNlc3Npb24uY29ubmVjdGlvbi5hZGRUcmFjayhlLnRyYWNrLCBzdHJlYW0pXG5cdFx0Ly8gfSApO1xuXHR9KVxufVxuXG5mdW5jdGlvbiB0ZXJtaW5hdGUoKXtcblx0c2lwU2Vzc2lvbi50ZXJtaW5hdGUoe1xuXHRcdHN0YXR1c19jb2RlOiAyMDBcblx0fSk7XG5cdC8vIHNpcENsaWVudC50ZXJtaW5hdGVTZXNzaW9ucygpO1xufVxuXG5mdW5jdGlvbiBhbnN3ZXIoKXtcblx0ZGVidWcubG9nKCdhbnN3ZXI6ICcsc2lwQ2xpZW50KTtcblx0c2lwU2Vzc2lvbi5hbnN3ZXIoKTtcbn1cblxuZnVuY3Rpb24gaG9sZCgpe1xuXHRkZWJ1Zy5sb2coJ2hvbGQ6ICcsIHNpcFNlc3Npb24uaXNPbkhvbGQoKSk7XG5cdGlmKHNpcFNlc3Npb24gJiYgc2lwU2Vzc2lvbi5pc09uSG9sZCgpLmxvY2FsKSB7XG5cdFx0c2lwU2Vzc2lvbi51bmhvbGQoKTtcblx0fSBlbHNlIHtcblx0XHRzaXBTZXNzaW9uLmhvbGQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZW1vdGVBdWRpbygpe1xuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHRlbC5zZXRBdHRyaWJ1dGUoJ2F1dG9wbGF5JywgJ2F1dG9wbGF5Jyk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuXHRyZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0cyl7XG5cdGRlYnVnLmxvZygnSW5pdGlhdGluZyBXZWJSVEMgbW9kdWxlOicsIG9wdHMpO1xuXHRKc1NJUCA9IGdsb2JhbC5Kc1NJUDtcblx0b3B0aW9ucyA9IG9wdHM7XG5cblx0ZGVidWcubG9nKCdKc1NJUDogJywgZ2xvYmFsLCBKc1NJUCk7XG5cblx0aWYob3B0aW9ucy5zaXAucmVnaXN0ZXIgPT09IHVuZGVmaW5lZCkgb3B0aW9ucy5zaXAucmVnaXN0ZXIgPSBmYWxzZTtcblx0dmFyIHNvY2tldCA9IG5ldyBKc1NJUC5XZWJTb2NrZXRJbnRlcmZhY2Uob3B0aW9ucy5zaXAud3Nfc2VydmVycyk7XG5cdG9wdGlvbnMuc2lwLnNvY2tldHMgPSBbc29ja2V0XTtcblxuXHQvLyAhIWdldCByaWQgb2YgdGhpcyEhXG5cdGV2ZW50cy5lbWl0ID0gb3B0cy5lbWl0O1xuXHRldmVudHMub24gPSBvcHRzLm9uO1xuXHQvLyAhIWdldCByaWQgb2YgdGhpcyEhXG5cblx0b3B0aW9ucy5hdWRpb1JlbW90ZSA9IGNyZWF0ZVJlbW90ZUF1ZGlvKCk7XG5cdHNpcENsaWVudCA9IG5ldyBKc1NJUC5VQShvcHRpb25zLnNpcCk7XG5cdGluaXRKc1NJUEV2ZW50cygpO1xuXHRzaXBDbGllbnQuc3RhcnQoKTtcblx0Ly8gcmV0dXJuIHNpcENsaWVudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGxpYjogSnNTSVAsXG5cdGluaXQ6IGluaXQsXG5cdHVucmVnaXN0ZXI6IHVucmVnaXN0ZXIsXG5cdGF1ZGlvY2FsbDogYXVkaW9jYWxsLFxuXHR0ZXJtaW5hdGU6IHRlcm1pbmF0ZSxcblx0YW5zd2VyOiBhbnN3ZXIsXG5cdGhvbGQ6IGhvbGQsXG5cdGlzSW5Qcm9ncmVzczogaXNJblByb2dyZXNzLFxuXHRpc0VzdGFibGlzaGVkOiBpc0VzdGFibGlzaGVkLFxuXHRpc0VuZGVkOiBpc0VuZGVkLFxuXHRpc1N1cHBvcnRlZDogaXNXZWJydGNTdXBwb3J0ZWRcbn07IiwidmFyIGRvbWlmeSA9IHJlcXVpcmUoJ2RvbWlmeScpO1xudmFyIENvcmUgPSByZXF1aXJlKCcuL2NvcmUnKTtcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaC1mbnMnKTtcbnZhciBmcmFzZXMgPSBudWxsO1xudmFyIGNvYnJvd3NpbmcgPSByZXF1aXJlKCcuL2NvYnJvd3NpbmcnKTtcbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL3RlbXBsYXRlcycpO1xudmFyIFdlYlJUQyA9IHJlcXVpcmUoJy4vd2VicnRjJyk7XG52YXIgYXVkaW8gPSByZXF1aXJlKCcuL2F1ZGlvLWNvbnRyb2wnKTtcbi8vIHZhciBzZXJ2ZXJVcmwgPSB7fTtcbnZhciBmb3JtcztcbnZhciBhcGk7XG5cbi8vIFdpZGdldCBpbml0aWF0aW9uIG9wdGlvbnNcbnZhciBkZWZhdWx0cyA9IHtcblx0cHJlZml4OiAnc3djJywgLy8gcHJlZml4IGZvciBDU1MgY2xhc3NlcyBhbmQgaWRzLiBcblx0XHRcdFx0Ly8gQ2hhbmdlIGl0IG9ubHkgaWYgdGhlIGRlZmF1bHQgcHJlZml4IFxuXHRcdFx0XHQvLyBtYXRjaGVzIHdpdGggZXhpc3RlZCBjbGFzc2VzIG9yIGlkcyBvbiB0aGUgd2Vic2l0ZVxuXHRhdXRvU3RhcnQ6IHRydWUsIC8vIEluaXQgbW9kdWxlIG9uIHBhZ2UgbG9hZFxuXHRpbnRybzogZmFsc2UsIC8vIHdoZXRoZXIgb3Igbm90IHRvIGFzayB1c2VyIFxuXHRcdFx0XHQvLyB0byBpbnRyb2R1Y2UgaGltIHNlbGYgYmVmb3JlIHRoZSBjaGF0IHNlc3Npb25cblx0aW50cm9NZXNzYWdlOiBcIlwiLCAvLyBtZXNzYWdlIHRoYXQgYXNrcyB1c2VyIGZvciBpbnRyb2R1Y3Rpb25cblx0Y29uY2VudFRleHQ6IFwiXCIsIC8vIG1lc3NhZ2UgdGhhdCBjb250YWlucyB0aGUgdGV4dCBvZiBjb25jZW50IHRoYXQgdXNlciBzaG91bGQgYWNjZXB0IGluIG9yZGVyIHRvIHN0YXJ0IGEgY2hhdFxuXHR3aWRnZXQ6IHRydWUsIC8vIHdoZXRoZXIgb3Igbm90IHRvIGFkZCB3aWRnZXQgdG8gdGhlIHdlYnBhZ2Vcblx0Y2hhdDogdHJ1ZSwgLy8gZW5hYmxlIGNoYXQgZmVhdHVyZVxuXHRzb3VuZHM6IHRydWUsXG5cdGNoYW5uZWxzOiB7IC8vIGNoYW5uZWxzIHNldHRpbmdzXG5cdFx0d2VicnRjOiB7fSxcblx0XHRjYWxsYmFjazoge31cblx0fSxcblx0Y29icm93c2luZzogZmFsc2UsIC8vIGVuYWJsZSBjb2Jyb3dzaW5nIGZlYXR1cmVcblx0YnV0dG9uU2VsZWN0b3I6IFwiXCIsIC8vIERPTSBlbGVtZW50W3NdIHNlbGVjdG9yIHRoYXQgb3BlbnMgYSB3aWRnZXRcblx0cmVDcmVhdGVTZXNzaW9uOiB0cnVlLFxuXHR0aXRsZTogJycsXG5cdGxhbmc6ICcnLFxuXHRsYW5nRnJvbVVybDogdHJ1ZSxcblx0cG9zaXRpb246ICdyaWdodCcsXG5cdGhpZGVPZmZsaW5lQnV0dG9uOiBmYWxzZSxcblx0b2ZmZXI6IGZhbHNlLFxuXHR0aGVtZUNvbG9yOiBcIlwiLFxuXHRzdHlsZXM6IHtcblx0XHRwcmltYXJ5OiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICcjNzRiOWZmJyxcblx0XHRcdGNvbG9yOiAnI0ZGRkZGRidcblx0XHR9LFxuXHRcdGludHJvOiB7XG5cdFx0XHQvLyBiYWNrZ3JvdW5kSW1hZ2U6IFwiaW1hZ2VzL2Jnci0wMi5qcGdcIlxuXHRcdH0sXG5cdFx0c2VuZG1haWw6IHtcblx0XHRcdC8vIGJhY2tncm91bmRJbWFnZTogXCJpbWFnZXMvYmdyLTAxLmpwZ1wiXG5cdFx0fSxcblx0XHRjbG9zZUNoYXQ6IHtcblx0XHRcdC8vIGJhY2tncm91bmRJbWFnZTogXCJpbWFnZXMvYmdyLTAyLmpwZ1wiXG5cdFx0fVxuXHR9LFxuXHRidXR0b25TdHlsZXM6IHtcblx0XHRvbmxpbmU6IHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMTc1LDIyOSwyNTUpJyxcblx0XHRcdGNvbG9yOiAnJ1xuXHRcdH0sXG5cdFx0b2ZmbGluZToge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiAncmdiYSgyNDEsMjQxLDI0MSknLFxuXHRcdFx0Y29sb3I6ICcnXG5cdFx0fSxcblx0XHR0aW1lb3V0OiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI0MSwyNDEsMjQxKScsXG5cdFx0XHRjb2xvcjogJydcblx0XHR9LFxuXHRcdG5vdGlmaWVkOiB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI1MywyNTAsMTI5KScsXG5cdFx0XHRjb2xvcjogJydcblx0XHR9LFxuXHRcdGNvbG9yOiAncmdiKDcwLDcwLDcwKSdcblx0fSxcblx0d2lkZ2V0V2luZG93T3B0aW9uczogJ2xlZnQ9MTAsdG9wPTEwLHdpZHRoPTM1MCxoZWlnaHQ9NTUwLHJlc2l6YWJsZScsXG5cdHBhdGg6ICcvaXBjYy93ZWJjaGF0LycsIC8vIGFic29sdXRlIHBhdGggdG8gdGhlIHdjaGF0IGZvbGRlclxuXHRjbGllbnRQYXRoOiAnaHR0cHM6Ly9jZG4uc21pbGUtc29mdC5jb20vd2NoYXQvdjEvJywgLy8gYWJzb2x1dGUgcGF0aCB0byB0aGUgY2xpZW50cyBmaWxlcy4gSWYgbm90IHNldCwgZmlsZXMgcmVxdWVzdGVkIGZyb20gZGVmYXVsdHMuc2VydmVyICsgZGVmYXVsdHMucGF0aC5cblx0c3R5bGVzUGF0aDogJycsIC8vIGFic29sdXRlIHBhdGggdG8gdGhlIGNzcyBmbGllXG5cdHRyYW5zbGF0aW9uc1BhdGg6ICcnLCAvLyBhYnNvbHV0ZSBwYXRoIHRvIHRoZSB0cmFuc2xhdGlvbnMuanNvbiBmbGllXG5cdGhvc3Q6IHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAvLyBkaXNwbGF5ZWQgaW4gdGhlIGVtYWlsIHRlbXBsYXRlXG5cdHdlYnJ0Y0VuYWJsZWQ6IGZhbHNlLFxuXHRtYXhGaWxlU2l6ZTogMTAwLCAvLyBpbiBNQiwgaWYgMCAtIG5vIHJlc3RyaWN0aW9uc1xuXHRhbGxvd2VkRmlsZUV4dGVuc2lvbnM6IFtdIC8vIEFsbG93ZWQgZmlsZSB0eXBlcyBmb3IgdXBsb2FkaW5nLiBJZiBlbXB0eSBhcnJheSAtIG5vIHJlc3RyaWN0aW9uLiBFeDogWyd0eHQnLCAnZ2lmJywgJ3BuZycsICdqcGVnJywgJ3BkZiddXG59O1xuXG52YXIgZ2xvYmFsU2V0dGluZ3MgPSBcIldjaGF0U2V0dGluZ3NcIjtcblxuLy8gQ3VycmVudCB3aWRnZXQgc3RhdGVcbnZhciB3aWRnZXRTdGF0ZSA9IHtcblx0aW5pdGlhdGVkOiBmYWxzZSxcblx0YWN0aXZlOiBmYWxzZSxcblx0c3RhdGU6ICcnLCAvLyBcIm9ubGluZVwiIHwgXCJvZmZsaW5lXCIgfCBcInRpbWVvdXRcIixcblx0c2hhcmU6IGZhbHNlLFxuXHRzb3VuZHM6IHRydWVcbn07XG5cbnZhciBkaWFsb2cgPSBbXTtcbnZhciBtZXNzYWdlcyA9IFtdO1xuXG4vLyBhdmFpbGFibGUgZGlhbG9nIGxhbmd1YWdlc1xudmFyIGxhbmdzID0gW107XG4vLyB2YXIgY3VyckxhbmcgPSAnJztcbnZhciBzZXNzaW9uVGltZW91dDtcbnZhciBjaGF0VGltZW91dDtcbnZhciBtb3VzZUZvY3VzZWQgPSBmYWxzZTtcbi8vIFdpZGdldCBkb20gZWxlbWVudFxudmFyIHdpZGdldDtcblxuLy8gV2lkZ2V0IGluIGEgc2VwYXJhdGUgd2luZG93XG52YXIgd2lkZ2V0V2luZG93O1xuLy8gV2lkZ2V0IHBhbmVzIGVsZW1lbnRzXG52YXIgYWdlbnRJc1R5cGluZ1RpbWVvdXQ7XG52YXIgdXNlcklzVHlwaW5nVGltZW91dDtcbnZhciB0aW1lclVwZGF0ZUludGVydmFsO1xudmFyIHBvbGxUdXJucyA9IDE7XG52YXIgY29icm93c2luZ1Blcm1pc3Npb25HaXZlbiA9IGZhbHNlO1xuXG52YXIgcHVibGljQXBpID0ge1xuXG5cdGluaXRNb2R1bGU6IGluaXRNb2R1bGUsXG5cdGluaXRXaWRnZXRTdGF0ZTogaW5pdFdpZGdldFN0YXRlLFxuXHRvcGVuV2lkZ2V0OiBvcGVuV2lkZ2V0LFxuXHRpbml0Q2hhdDogaW5pdENoYXQsXG5cdGluaXRDYWxsOiBpbml0Q2FsbCxcblx0Z2V0V2lkZ2V0RWxlbWVudDogZ2V0V2lkZ2V0RWxlbWVudCxcblx0aXNXZWJydGNTdXBwb3J0ZWQ6IFdlYlJUQy5pc1N1cHBvcnRlZCxcblx0Z2V0V2lkZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB3aWRnZXRTdGF0ZTtcblx0fSxcblx0Z2V0RW50aXR5OiBmdW5jdGlvbigpeyByZXR1cm4gc3RvcmFnZS5nZXRTdGF0ZSgnZW50aXR5JywgJ3Nlc3Npb24nKTsgfSxcblx0b246IGZ1bmN0aW9uKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRhcGkub24oZXZ0LCBsaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdGVtaXQ6IGZ1bmN0aW9uIChldnQsIGxpc3RlbmVyKXtcblx0XHRhcGkuZW1pdChldnQsIGxpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblx0LyoqXG5cdCAqIFNldCBkZWZhdWx0IHVzZXIgY3JlZGVudGlhbHMuXG5cdCAqIElmIFwiaW50cm9cIiBpcyBmYWxzZSwgdGhhbiBkaWFsb2cgd2lsbCBzdGFydCB3aXRoIHRoZXNlIGNyZWRlbnRpYWxzLlxuXHQgKiBOT1RFOiBNdXN0IGJlIGNhbGxlZCBiZWZvcmUgaW5pdE1vZHVsZSBtZXRob2Rcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBVc2VyIGNyZWRlbnRpYWxzLCBpLmUuIFwidW5hbWVcIiwgXCJsYW5nXCIsIFwicGhvbmVcIiwgXCJzdWJqZWN0XCJcblx0ICovXG5cdHNldERlZmF1bHRDcmVkZW50aWFsczogZnVuY3Rpb24ocGFyYW1zKSB7XG5cdFx0ZGVmYXVsdHMuY3JlZGVudGlhbHMgPSBwYXJhbXM7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRtb2R1bGU6IFdpZGdldCxcblx0YXBpOiBwdWJsaWNBcGlcbn07XG5cbi8vIEluaXRpYXRlIHRoZSBtb2R1bGUgd2l0aCB0aGUgZ2xvYmFsIHNldHRpbmdzXG5pZihnbG9iYWxbZ2xvYmFsU2V0dGluZ3NdICYmIGdsb2JhbFtnbG9iYWxTZXR0aW5nc10uYXV0b1N0YXJ0ICE9PSBmYWxzZSAmJiBkZWZhdWx0cy5hdXRvU3RhcnQpIHtcblx0aWYoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJjb21wbGV0ZVwiIHx8IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiaW50ZXJhY3RpdmVcIikge1xuXHQgICAgV2lkZ2V0KGdsb2JhbFtnbG9iYWxTZXR0aW5nc10pO1xuXHR9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7IFdpZGdldChnbG9iYWxbZ2xvYmFsU2V0dGluZ3NdKTsgfSwgZmFsc2UpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIFdpZGdldChvcHRpb25zKXtcblxuXHRpZih3aWRnZXRTdGF0ZS5pbml0aWF0ZWQpIHJldHVybiBwdWJsaWNBcGk7XG5cblx0Xy5tZXJnZShkZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cdC8vIF8uYXNzaWduKGRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblxuXHQvLyBkZWZhdWx0cy5jbGllbnRQYXRoID0gb3B0aW9ucy5jbGllbnRQYXRoID8gb3B0aW9ucy5jbGllbnRQYXRoIDogKGRlZmF1bHRzLmNsaWVudFBhdGggfHwgKGRlZmF1bHRzLnNlcnZlciArIGRlZmF1bHRzLnBhdGgpKTtcblx0XG5cdC8vIHNlcnZlclVybCA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKGRlZmF1bHRzLnNlcnZlciwgdHJ1ZSk7XG5cblx0YXBpID0gbmV3IENvcmUoZGVmYXVsdHMpXG5cdC5vbignc2Vzc2lvbi9jcmVhdGUnLCBvblNlc3Npb25TdWNjZXNzKVxuXHQub24oJ3Nlc3Npb24vdGltZW91dCcsIG9uU2Vzc2lvblRpbWVvdXQpXG5cdC5vbignc2Vzc2lvbi9qb2luJywgb25TZXNzaW9uSm9pblJlcXVlc3QpXG5cdC5vbignc2Vzc2lvbi9qb2luZWQnLCBvblNlc3Npb25Kb2luKVxuXHQub24oJ3Nlc3Npb24vZGlzam9pbicsIG9uU2Vzc2lvbkRpc2pvaW4pXG5cdC5vbignc2Vzc2lvbi9pbml0Jywgb25TZXNzaW9uSW5pdCk7XG5cdC8vIC5vbignY2hhdC9sYW5ndWFnZXMnLCBmdW5jdGlvbigpIHtcblx0Ly8gXHRjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6IGdldFdpZGdldFN0YXRlKCkgfSk7XG5cdC8vIH0pO1xuXHRcblx0Ly8gc2V0U2Vzc2lvblRpbWVvdXRIYW5kbGVyKCk7XG5cdFxuXHQvLyBsb2FkIGZvcm1zXG5cdHJlcXVlc3QuZ2V0KCdmb3Jtc19qc29uJywgZGVmYXVsdHMuY2xpZW50UGF0aCsnZm9ybXMuanNvbicsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCl7XG5cdFx0aWYoZXJyKSByZXR1cm4gYXBpLmVtaXQoJ0Vycm9yJywgZXJyKTtcblx0XHRmb3JtcyA9IEpTT04ucGFyc2UocmVzdWx0KS5mb3Jtcztcblx0fSk7XG5cblx0YWRkV2lkZ2V0U3R5bGVzKCk7XG5cblx0cmV0dXJuIHB1YmxpY0FwaTtcbn1cblxuZnVuY3Rpb24gaW5pdE1vZHVsZSgpe1xuXHRhcGkuaW5pdCgpO1xuXHRyZXR1cm4gcHVibGljQXBpO1xufVxuXG5mdW5jdGlvbiBpbml0V2VicnRjTW9kdWxlKG9wdHMpe1xuXHRkZWJ1Zy5sb2coJ2luaXRXZWJydGNNb2R1bGU6ICcsIG9wdHMpO1xuXHRXZWJSVEMuaW5pdChvcHRzKTtcbn1cblxuLy8gU2Vzc2lvbiBpcyBlaXRoZXIgY3JlYXRlZCBvciBjb250aW51ZXNcbmZ1bmN0aW9uIG9uU2Vzc2lvblN1Y2Nlc3MoKXtcdFxuXHQvLyBXYWl0IHdoaWxlIHRyYW5zbGF0aW9ucyBhcmUgbG9hZGVkXG5cdFxuXHRnZXRGcmFzZXMoKTtcblxuXHRfLnBvbGwoZnVuY3Rpb24oKXtcblx0XHRkZWJ1Zy5sb2coJ3BvbGw6ICcsIGZyYXNlcyk7XG5cdFx0cmV0dXJuIChmcmFzZXMgIT09IG51bGwpO1xuXG5cdH0sIGZ1bmN0aW9uKCkge1xuXHRcdGluaXRTZXNzaW9uKClcblx0XHQvLyBpZiB3aW5kb3cgaXMgbm90IGEgb3BlbmVkIHdpbmRvd1xuXHRcdGlmKCFkZWZhdWx0cy5leHRlcm5hbCkge1xuXHRcdFx0YXBpLnVwZGF0ZVVybCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cdFx0fVxuXG5cdH0sIGZ1bmN0aW9uKCl7XG5cdFx0XG5cdFx0aWYocG9sbFR1cm5zIDwgMikge1xuXHRcdFx0cG9sbFR1cm5zKys7XG5cdFx0XHRXaWRnZXQoZGVmYXVsdHMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gYXBpLmVtaXQoJ0Vycm9yJywgJ01vZHVsZSB3YXNuXFwndCBpbml0aWF0ZWQgZHVlIHRvIG5ldHdvcmsgZXJyb3JzJyk7XG5cdFx0fVxuXG5cdH0sIDYwMDAwKTtcbn1cblxuZnVuY3Rpb24gaW5pdFNlc3Npb24oKSB7XG5cdFxuXHRpZighZGVmYXVsdHMuY2hhdCAmJiAhZGVmYXVsdHMud2VicnRjRW5hYmxlZCAmJiAhZGVmYXVsdHMuY2hhbm5lbHMuY2FsbGJhY2sudGFzaykgcmV0dXJuIGZhbHNlO1xuXG5cdGlmKGFwaS5zZXNzaW9uLnByb3BlcnRpZXMpIF8ubWVyZ2UoZGVmYXVsdHMsIGFwaS5zZXNzaW9uLnByb3BlcnRpZXMpO1xuXG5cdGRlZmF1bHRzLnNpZCA9IGFwaS5zZXNzaW9uLnNpZDtcblx0ZGVmYXVsdHMuaXNJcGNjID0gKGFwaS5zZXNzaW9uLmxhbmdzICE9PSB1bmRlZmluZWQgfHwgYXBpLnNlc3Npb24uY2F0ZWdvcmllcyAhPT0gdW5kZWZpbmVkKTtcblxuXHRkZWJ1Zy5sb2coJ2luaXRTZXNzaW9uOiAnLCBhcGksIGRlZmF1bHRzLCBmcmFzZXMpO1xuXG5cdGZyYXNlcyA9IChkZWZhdWx0cy5sYW5nICYmIGZyYXNlc1tkZWZhdWx0cy5sYW5nXSkgPyBmcmFzZXNbZGVmYXVsdHMubGFuZ10gOiBmcmFzZXNbYXBpLmRldGVjdExhbmd1YWdlKGZyYXNlcyldO1xuXG5cdGlmKGRlZmF1bHRzLndpZGdldCkge1xuXHRcdGFwaVxuXHRcdC8vIC5vbignY2hhdC9zdGFydCcsIHN0YXJ0Q2hhdClcblx0XHQub24oJ2NoYXQvY2xvc2UnLCBvbkNoYXRDbG9zZSlcblx0XHQub24oJ2NoYXQvdGltZW91dCcsIG9uQ2hhdFRpbWVvdXQpXG5cdFx0Lm9uKCdtZXNzYWdlL25ldycsIGNsZWFyVW5kZWxpdmVyZWQpXG5cdFx0Lm9uKCdtZXNzYWdlL25ldycsIG5ld01lc3NhZ2UpXG5cdFx0Lm9uKCdtZXNzYWdlL3R5cGluZycsIG9uQWdlbnRUeXBpbmcpXG5cdFx0Lm9uKCdjYWxsYmFjay9jcmVhdGUnLCBvbkNhbGxiYWNrUmVxdWVzdGVkKVxuXHRcdC5vbignZm9ybS9zdWJtaXQnLCBvbkZvcm1TdWJtaXQpXG5cdFx0Lm9uKCdmb3JtL3JlamVjdCcsIGNsb3NlRm9ybSlcblx0XHQub24oJ3dpZGdldC9sb2FkJywgaW5pdFdpZGdldCk7XG5cdFx0Ly8gLm9uKCd3aWRnZXQvaW5pdCcsIG9uV2lkZ2V0SW5pdCk7XG5cdFx0Ly8gLm9uKCd3aWRnZXQvc3RhdGVjaGFuZ2UnLCBjaGFuZ2VXZ1N0YXRlKTtcblx0fVxuXG5cdGlmKFdlYlJUQy5pc1N1cHBvcnRlZCgpICYmIGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0YyAmJiBkZWZhdWx0cy5jaGFubmVscy53ZWJydGMuc2lwICYmIGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5zaXAud3Nfc2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6Jyl7XG5cdFx0Ly8gaWYod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyAmJiBzZXJ2ZXJVcmwucHJvdG9jb2wgPT09ICdodHRwczonKXtcblx0XHRcdC8vIHNldCBmbGFnIHRvIGluZGljYXRlIHRoYXQgd2VicnRjIGZlYXR1cmUgaXMgc3VwcG9ydGVkIGFuZCBlbmFibGVkXG5cdFx0XHRkZWZhdWx0cy53ZWJydGNFbmFibGVkID0gdHJ1ZTtcblxuXHRcdFx0Ly8gc2V0IHdlYnJ0YyBldmVudCBoYW5kbGVyc1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvbmV3UlRDU2Vzc2lvbicsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ25ld1JUQ1Nlc3Npb24nKTtcblx0XHRcdH0pO1xuXHRcdFx0YXBpLm9uKCd3ZWJydGMvcHJvZ3Jlc3MnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0aWYoZS5yZXNwb25zZS5zdGF0dXNfY29kZSA9PT0gMTgwKSB7XG5cdFx0XHRcdFx0aW5pdENhbGxTdGF0ZSgncmluZ2luZycpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2NvbmZpcm1lZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGFwaS5vbignd2VicnRjL2FkZHN0cmVhbScsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2Nvbm5lY3RlZCcpO1xuXHRcdFx0fSk7XG5cdFx0XHRhcGkub24oJ3dlYnJ0Yy9lbmRlZCcsIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2VuZGVkJyk7XG5cdFx0XHR9KTtcblx0XHRcdGFwaS5vbignd2VicnRjL2ZhaWxlZCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRpZihlLmNhdXNlID09PSAnQ2FuY2VsZWQnKXtcblx0XHRcdFx0XHRpbml0Q2FsbFN0YXRlKCdjYW5jZWxlZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluaXRDYWxsU3RhdGUoJ2ZhaWxlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gcmluZ1RvbmUgYXVkaW8gZWxlbWVudCBwbGF5cyByaW5nVG9uZSBzb3VuZCB3aGVuIGNhbGxpbmcgdG8gYWdlbnRcblx0XHRcdC8vIHJpbmdUb25lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRcdC8vIHJpbmdUb25lLnNyYyA9IGRlZmF1bHRzLmNsaWVudFBhdGgrJ3NvdW5kcy9yaW5nb3V0Lndhdic7XG5cdFx0XHQvLyBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJpbmdUb25lKTtcblxuXHRcdFx0Ly8gaW5pdGlhdGUgd2VicnRjIG1vZHVsZSB3aXRoIHBhcmFtZXRlcnNcblx0XHRcdGluaXRXZWJydGNNb2R1bGUoe1xuXHRcdFx0XHRzaXA6IGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5zaXAsXG5cdFx0XHRcdGVtaXQ6IHB1YmxpY0FwaS5lbWl0LFxuXHRcdFx0XHRvbjogcHVibGljQXBpLm9uXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2VicnRjIGlzIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciwgYnV0IHRoZSBjdXJyZW50IHdlYiBwYWdlXG5cdFx0XHQvLyBpcyBsb2NhdGVkIG9uIGluc2VjdXJlIG9yaWdpbnMsIHRoZXJlZm9yZSB0aGUgd2VicnRjIGlzIG5vdCBzdXBwb3J0ZWRcblx0XHRcdGRlYnVnLndhcm4oJ1dlYlJUQyBmZWF0dXJlIGlzIGRpc2FibGVkJyk7XG5cdFx0XHRkZWJ1Zy53YXJuKCdnZXRVc2VyTWVkaWEoKSBubyBsb25nZXIgd29ya3Mgb24gaW5zZWN1cmUgb3JpZ2lucy4gVG8gdXNlIHRoaXMgZmVhdHVyZSwgeW91IHNob3VsZCBjb25zaWRlciBzd2l0Y2hpbmcgeW91ciBhcHBsaWNhdGlvbiB0byBhIHNlY3VyZSBvcmlnaW4sIHN1Y2ggYXMgSFRUUFMuIFNlZSBodHRwczovL2dvby5nbC9yU3RUR3ogZm9yIG1vcmUgZGV0YWlscy4nKTtcblx0XHR9XG5cdH1cblxuXHRcblx0aWYoZGVmYXVsdHMuaXNJcGNjKSBnZXRMYW5ndWFnZXMoKTtcblx0aWYoZGVmYXVsdHMuYnV0dG9uU2VsZWN0b3IpIHNldEhhbmRsZXJzKGRlZmF1bHRzLmJ1dHRvblNlbGVjdG9yKTtcblx0aWYoZGVmYXVsdHMudGhlbWVDb2xvcikge1xuXHRcdGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvciA9IGRlZmF1bHRzLnRoZW1lQ29sb3I7XG5cdFx0ZGVmYXVsdHMuc3R5bGVzLnByaW1hcnkuY29sb3IgPSBnZXRUaGVtZVRleHRDb2xvcihkZWZhdWx0cy50aGVtZUNvbG9yKTtcblx0XHRcblx0fVxuXG5cdGRlYnVnLmxvZygnaW5pdFNlc3Npb246ICcsIGRlZmF1bHRzLndpZGdldCwgd2lkZ2V0U3RhdGUuaW5pdGlhdGVkLCBpc0Jyb3dzZXJTdXBwb3J0ZWQoKSk7XG5cblx0ZGVmYXVsdHMuc291bmRzID0gc3RvcmFnZS5nZXRTdGF0ZSgnc291bmRzJykgIT09IHVuZGVmaW5lZCA/IHN0b3JhZ2UuZ2V0U3RhdGUoJ3NvdW5kcycsICdzZXNzaW9uJykgOiBkZWZhdWx0cy5zb3VuZHM7XG5cblx0Ly8gRW5hYmxpbmcgYXVkaW8gbW9kdWxlXG5cdGF1ZGlvLmluaXQoZGVmYXVsdHMuY2xpZW50UGF0aCsnc291bmRzLycpO1xuXG5cdC8vIElmIHBhZ2UgbG9hZGVkIGFuZCBcIndpZGdldFwiIHByb3BlcnR5IGlzIHNldCAtIGxvYWQgd2lkZ2V0XG5cdGlmKGRlZmF1bHRzLndpZGdldCAmJiAhd2lkZ2V0U3RhdGUuaW5pdGlhdGVkICYmIGlzQnJvd3NlclN1cHBvcnRlZCgpKSB7XG5cdFx0bG9hZFdpZGdldChkZWZhdWx0cyk7XG5cdH1cblxuXHQvLyBJZiB0aW1lb3V0IHdhcyBvY2N1cmVkLCBpbml0IGNoYXQgYWZ0ZXIgYSBzZXNzaW9uIGlzIGNyZWF0ZWRcblx0aWYoaGFzV2dTdGF0ZSgndGltZW91dCcpKSB7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgndGltZW91dCcpO1xuXHR9XG5cblx0YXBpLmVtaXQoJ3Nlc3Npb24vaW5pdCcsIHtzZXNzaW9uOiBhcGkuc2Vzc2lvbiwgb3B0aW9uczogZGVmYXVsdHMsIHVybDogZ2xvYmFsLmxvY2F0aW9uLmhyZWYgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU2Vzc2lvbkluaXQocGFyYW1zKXtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2luaXQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRcblx0aWYod2lkZ2V0V2luZG93ICYmICF3aWRnZXRXaW5kb3cuY2xvc2VkKSB3aWRnZXRXaW5kb3cuc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShkZWZhdWx0cy5wcmVmaXgrJy5pbml0JywgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RCcm93c2VyQWNjZXNzKCkge1xuXHRuZXdNZXNzYWdlKHtcblx0XHRmcm9tOiBzdG9yYWdlLmdldFN0YXRlKCdhbmFtZScsICdzZXNzaW9uJyksXG5cdFx0dGltZTogRGF0ZS5ub3coKSxcblx0XHRjb250ZW50OiBcIntyZXF1ZXN0X2Jyb3dzZXJfYWNjZXNzfVwiXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvblNlc3Npb25Kb2luUmVxdWVzdChwYXJhbXMpe1xuXHRkZWJ1Zy5sb2coJ29uU2Vzc2lvbkpvaW5SZXF1ZXN0Jywgc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSk7XG5cdGlmKCFzdG9yYWdlLmdldFN0YXRlKCdzaGFyZWQnLCAnc2Vzc2lvbicpKSB7XG5cdFx0cmVxdWVzdEJyb3dzZXJBY2Nlc3MoKTtcblx0fSBlbHNlIHtcblx0XHRqb2luU2Vzc2lvbihwYXJhbXMpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGpvaW5TZXNzaW9uKHBhcmFtcykge1xuXHRhcGkuc2hhcmVPcGVuZWQoKTsgLy8gc2VuZCBjb25maXJtYXRpb24gdG8gYWdlbnRcblx0b25TZXNzaW9uSm9pbihwYXJhbXMpO1xufVxuXG4vLyBzZW5kIHNoYXJlZCBldmVudCB0byB0aGUgdXNlcidzIGJyb3dzZXJcbmZ1bmN0aW9uIG9uU2Vzc2lvbkpvaW4ocGFyYW1zKXtcblx0aW5pdENvYnJvd3NpbmdNb2R1bGUoeyB1cmw6IHBhcmFtcy51cmwsIGVudGl0eTogYXBpLnNlc3Npb24uZW50aXR5IH0pO1xufVxuXG5mdW5jdGlvbiBvblNlc3Npb25EaXNqb2luKCkge1xuXHRjb2Jyb3dzaW5nLnVuc2hhcmUoKTtcbn1cblxuZnVuY3Rpb24gaW5pdENvYnJvd3NpbmdNb2R1bGUocGFyYW1zKXtcblx0Ly8gaW5pdCBjb2Jyb3dzaW5nIG1vZHVsZSBvbmx5IG9uIG1haW4gd2luZG93XG5cdGlmKGRlZmF1bHRzLmV4dGVybmFsIHx8IGNvYnJvd3NpbmcuaXNJbml0aWF0ZWQoKSkgcmV0dXJuO1xuXG5cdGFwaS5vbignY29icm93c2luZy9pbml0JywgZnVuY3Rpb24oKXtcblx0XHRjb2Jyb3dzaW5nLnNoYXJlKCk7XG5cdFx0Ly8gY29icm93c2luZy5lbWl0RXZlbnRzKCk7XG5cdH0pO1xuXG5cdGFwaS5vbignY29icm93c2luZy91cGRhdGUnLCBmdW5jdGlvbihwYXJhbXMpe1xuXHRcdGNvYnJvd3NpbmcudXBkYXRlRXZlbnRzKHBhcmFtcyk7XG5cdH0pO1xuXG5cdGFwaS5vbignY29icm93c2luZy9ldmVudCcsIGZ1bmN0aW9uKHBhcmFtcyl7XG5cdFx0YXBpLnVwZGF0ZUV2ZW50cyhwYXJhbXMuZXZlbnRzKVxuXHR9KTtcblxuXHRhcGkub24oJ2NvYnJvd3Npbmcvc2hhcmVkJywgZnVuY3Rpb24oKXtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkJywgdHJ1ZSwgJ3Nlc3Npb24nKTtcblx0fSk7XG5cblx0YXBpLm9uKCdjb2Jyb3dzaW5nL3Vuc2hhcmVkJywgZnVuY3Rpb24ocGFyYW1zKXtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnc2hhcmVkJywgZmFsc2UsICdzZXNzaW9uJyk7XG5cdH0pO1xuXHRcblx0Y29icm93c2luZy5pbml0KHtcblx0XHR3aWRnZXQ6IHBhcmFtcy53aWRnZXQsXG5cdFx0ZW50aXR5OiBwYXJhbXMuZW50aXR5LFxuXHRcdGVtaXQ6IHB1YmxpY0FwaS5lbWl0LFxuXHRcdHBhdGg6IGRlZmF1bHRzLmNsaWVudFBhdGhcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldEVsZW1lbnQoKXtcblx0cmV0dXJuIHdpZGdldDtcbn1cblxuZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCl7XG5cdGFwaS5nZXRMYW5ndWFnZXMoZnVuY3Rpb24gKGVyciwgbGFuZ3Mpe1xuXHRcdGRlYnVnLmxvZygnZ2V0TGFuZ3VhZ2VzOiAnLCBlcnIsIGxhbmdzKTtcblx0XHRpZihlcnIpIHJldHVybjtcblx0XHRpZihsYW5ncykgb25OZXdMYW5ndWFnZXMobGFuZ3MpO1xuXHRcdC8vIGdldExhbmd1YWdlc1RpbWVvdXQgPSBzZXRUaW1lb3V0KGdldExhbmd1YWdlcywgZGVmYXVsdHMuY2hlY2tTdGF0dXNUaW1lb3V0KjEwMDApO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0RnJhc2VzKCkge1xuXHQvLyBsb2FkIHRyYW5zbGF0aW9uc1xuXHRyZXF1ZXN0LmdldCgnZnJhc2VzJywgKGRlZmF1bHRzLnRyYW5zbGF0aW9uc1BhdGggfHwgZGVmYXVsdHMuY2xpZW50UGF0aCkrJ3RyYW5zbGF0aW9ucy5qc29uJywgZnVuY3Rpb24gKGVyciwgcmVzdWx0KXtcblx0XHRpZihlcnIpIHJldHVybiBhcGkuZW1pdCgnRXJyb3InLCBlcnIpO1xuXHRcdGZyYXNlcyA9IEpTT04ucGFyc2UocmVzdWx0KTtcblx0XHQvLyBmcmFzZXMgPSBmcmFzZXNbYXBpLmRldGVjdExhbmd1YWdlKGZyYXNlcyldXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvbk5ld0xhbmd1YWdlcyhsYW5ndWFnZXMpe1xuXHQvLyBkZWJ1Zy5sb2coJ2xhbmd1YWdlczogJywgbGFuZ3VhZ2VzKTtcblx0dmFyIHN0YXRlID0gbGFuZ3VhZ2VzLmxlbmd0aCA/ICdvbmxpbmUnIDogJ29mZmxpbmUnO1xuXG5cdGxhbmdzID0gbGFuZ3VhZ2VzO1xuXG5cdC8vIGlmKGhhc1dnU3RhdGUoc3RhdGUpKSByZXR1cm47XG5cdC8vIGlmKHdpZGdldFN0YXRlLnN0YXRlID09PSBzdGF0ZSkgcmV0dXJuO1xuXG5cdC8vIGNoYW5nZVdnU3RhdGUoeyBzdGF0ZTogc3RhdGUgfSk7XG5cdGFwaS5lbWl0KCdjaGF0L2xhbmd1YWdlcycsIGxhbmd1YWdlcyk7XG59XG5cbmZ1bmN0aW9uIGluaXRXaWRnZXQoKXtcblx0dmFyIG9wdGlvbnMgPSAnJywgc2VsZWN0ZWQ7XG5cblx0Ly8gZGVidWcubG9nKCdJbml0IHdpZGdldCEnKTtcblx0d2lkZ2V0U3RhdGUuaW5pdGlhdGVkID0gdHJ1ZTtcblxuXHRzZXRTdHlsZXMoKTtcblx0c2V0TGlzdGVuZXJzKHdpZGdldCk7XG5cdGNoYW5nZVdnU3RhdGUoeyBzdGF0ZTogZ2V0V2lkZ2V0U3RhdGUoKSB9KTtcblxuXHRpZihkZWZhdWx0cy5oaWRlT2ZmbGluZUJ1dHRvbikge1xuXHRcdGFkZFdnU3RhdGUoJ25vLWJ1dHRvbicpO1xuXHR9XG5cblx0aWYoZGVmYXVsdHMub2ZmZXIpIHtcblx0XHRzZXRPZmZlcigpO1xuXHR9XG5cblx0Ly8gaWYgY2hhdCBzdGFydGVkXG5cdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnc2Vzc2lvbicpID09PSB0cnVlKSB7XG5cdFx0cmVxdWVzdENoYXQoc3RvcmFnZS5nZXRTdGF0ZSgnY3JlZGVudGlhbHMnLCAnc2Vzc2lvbicpIHx8IHt9KTtcblx0XHRpZihzdG9yYWdlLmdldFN0YXRlKCdvcGVuZWQnLCAnc2Vzc2lvbicpKSBzaG93V2lkZ2V0KCk7XG5cdFx0Ly8gaW5pdENoYXQoKTtcblx0fVxuXG5cdC8vIGlmIHdlYnJ0YyBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIgYW5kIHdzX3NlcnZlcnMgcGFyYW1ldGVyIGlzIHNldCAtIGNoYW5nZSBidXR0b24gaWNvblxuXHRpZihkZWZhdWx0cy53ZWJydGNFbmFibGVkKSB7XG5cdFx0YWRkV2dTdGF0ZSgnd2VicnRjLWVuYWJsZWQnKTtcblx0fVxuXG5cdGlmKHdpZGdldCAmJiBkZWZhdWx0cy5pbnRybyAmJiBkZWZhdWx0cy5pbnRyby5sZW5ndGgpIHtcblx0XHQvLyBBZGQgbGFuZ3VhZ2VzIHRvIHRoZSB0ZW1wbGF0ZVxuXHRcdGxhbmdzLmZvckVhY2goZnVuY3Rpb24obGFuZykge1xuXHRcdFx0aWYoZnJhc2VzICYmIGZyYXNlcy5sYW5nKSB7XG5cdFx0XHRcdHNlbGVjdGVkID0gbGFuZyA9PT0gYXBpLnNlc3Npb24ubGFuZyA/ICdzZWxlY3RlZCcgOiAnJztcblx0XHRcdFx0b3B0aW9ucyArPSAnPG9wdGlvbiB2YWx1ZT1cIicrbGFuZysnXCIgJytzZWxlY3RlZCsnID4nK2ZyYXNlcy5sYW5nKyc8L29wdGlvbj4nO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGdsb2JhbFtkZWZhdWx0cy5wcmVmaXgrJ0ludHJvRm9ybSddLmxhbmcuaW5uZXJIVE1MID0gb3B0aW9ucztcblx0fVxuXG5cdC8vIFdpZGdldCBpcyBpbml0aWF0ZWRcblx0YXBpLmVtaXQoJ3dpZGdldC9pbml0Jyk7XG59XG5cbmZ1bmN0aW9uIGxvYWRXaWRnZXQocGFyYW1zKXtcblx0XG5cdGNvbXBpbGVkID0gY29tcGlsZVRlbXBsYXRlKCd3aWRnZXQnLCB7XG5cdFx0ZGVmYXVsdHM6IHBhcmFtcyxcblx0XHRsYW5ndWFnZXM6IGxhbmdzLFxuXHRcdHRyYW5zbGF0aW9uczogZnJhc2VzLFxuXHRcdGNyZWRlbnRpYWxzOiBzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykgfHwge30sXG5cdFx0XzogX1xuXHR9KTtcblxuXHQvLyBXaWRnZXQgdmFyaWFibGUgYXNzaWdubWVudFxuXHR3aWRnZXQgPSBkb21pZnkoY29tcGlsZWQpO1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHdpZGdldCk7XG5cdGFwaS5lbWl0KCd3aWRnZXQvbG9hZCcsIHdpZGdldCk7XG5cdGRlYnVnLmxvZygnbG9hZFdpZGdldCcsIHBhcmFtcyk7XG59XG5cbmZ1bmN0aW9uIHNldE9mZmVyKCkge1xuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdHNob3dPZmZlcih7XG5cdFx0XHRmcm9tOiBkZWZhdWx0cy5vZmZlci5mcm9tIHx8IGZyYXNlcy5UT1BfQkFSLnRpdGxlLFxuXHRcdFx0dGltZTogRGF0ZS5ub3coKSxcblx0XHRcdGNvbnRlbnQ6IGRlZmF1bHRzLm9mZmVyLnRleHQgfHwgZnJhc2VzLmRlZmF1bHRfb2ZmZXJcblx0XHR9KTtcblx0fSwgZGVmYXVsdHMub2ZmZXIuaW5TZWNvbmRzID8gZGVmYXVsdHMub2ZmZXIuaW5TZWNvbmRzKjEwMDAgOiAzMDAwMCk7XG59XG5cbmZ1bmN0aW9uIHNob3dPZmZlcihtZXNzYWdlKSB7XG5cdC8vIFJldHVybiBpZiB1c2VyIGFscmVhZHkgaW50ZXJhY3Qgd2l0aCB0aGUgd2lkZ2V0XG5cdGlmKHdpZGdldFN0YXRlLnN0YXRlICE9PSAnb25saW5lJyB8fCBpc0ludGVyYWN0ZWQoKSkgcmV0dXJuO1xuXHRuZXdNZXNzYWdlKG1lc3NhZ2UpO1xuXHQvLyBuZXdNZXNzYWdlKHsgbWVzc2FnZXM6IFttZXNzYWdlXSB9KTtcbn1cblxuZnVuY3Rpb24gc2V0SW50ZXJhY3RlZCgpe1xuXHRpZighc3RvcmFnZS5nZXRTdGF0ZSgnaW50ZXJhY3RlZCcsICdzZXNzaW9uJykpIHtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnaW50ZXJhY3RlZCcsIHRydWUsICdzZXNzaW9uJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcmFjdGVkKCl7XG5cdHJldHVybiBzdG9yYWdlLmdldFN0YXRlKCdpbnRlcmFjdGVkJywgJ3Nlc3Npb24nKTtcbn1cblxuZnVuY3Rpb24gaW5pdENoYXQoKXtcblx0c2hvd1dpZGdldCgpO1xuXG5cdC8vIC8vIGlmIGNoYXQgYWxyZWFkeSBzdGFydGVkIGFuZCB3aWRnZXQgd2FzIG1pbmltaXplZCAtIGp1c3Qgc2hvdyB0aGUgd2lkZ2V0XG5cdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnY2FjaGUnKSkgcmV0dXJuO1xuXG5cdGlmKGlzT2ZmbGluZSgpKSB7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdH0gZWxzZSBpZihkZWZhdWx0cy5pbnRybyAmJiBkZWZhdWx0cy5pbnRyby5sZW5ndGgpIHtcblx0XHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JywgJ3Nlc3Npb24nKSB8fCBzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykpIHtcblx0XHRcdHJlcXVlc3RDaGF0KHN0b3JhZ2UuZ2V0U3RhdGUoJ2NyZWRlbnRpYWxzJywgJ3Nlc3Npb24nKSB8fCB7fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN3aXRjaFBhbmUoJ2NyZWRlbnRpYWxzJyk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlcXVlc3RDaGF0KHsgbGFuZzogYXBpLnNlc3Npb24ubGFuZyB9KTtcblx0fVxufVxuXG5mdW5jdGlvbiByZXF1ZXN0Q2hhdChjcmVkZW50aWFscyl7XG5cdHZhciBjaGF0U3RhcnRlZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnc2Vzc2lvbicpO1xuXHR2YXIgYWdlbnRpZCA9IHN0b3JhZ2UuZ2V0U3RhdGUoJ2FpZCcsICdzZXNzaW9uJyk7XG5cdHZhciBtZXNzYWdlID0gY3JlZGVudGlhbHMubWVzc2FnZTtcblx0dmFyIHNhdmVQYXJhbXMgPSB7fTtcblxuXHQvLyBpZighY3JlZGVudGlhbHMudW5hbWUpIGNyZWRlbnRpYWxzLnVuYW1lID0gYXBpLnNlc3Npb24uc2lkO1xuXHRpZihhZ2VudGlkKSBjcmVkZW50aWFscy5hZ2VudGlkID0gYWdlbnRpZDtcblxuXHQvLyBTYXZlIHVzZXIgbGFuZ3VhZ2UgYmFzZWQgb24gcHJlZmVyYWJsZSBkaWFsb2cgbGFuZ3VhZ2Vcblx0Ly8gaWYoY3JlZGVudGlhbHMubGFuZyAmJiBjcmVkZW50aWFscy5sYW5nICE9PSBjdXJyTGFuZyApIHtcblx0Ly8gXHRzdG9yYWdlLnNhdmVTdGF0ZSgnbGFuZycsIGNyZWRlbnRpYWxzLmxhbmcsICdzZXNzaW9uJyk7XG5cdC8vIH1cblx0aWYoIWNyZWRlbnRpYWxzLmxhbmcpIHtcblx0XHRjcmVkZW50aWFscy5sYW5nID0gYXBpLnNlc3Npb24ubGFuZztcblx0fVxuXHRcblx0c2F2ZVBhcmFtcyA9IGV4dGVuZCh7fSwgY3JlZGVudGlhbHMpO1xuXHRkZWxldGUgc2F2ZVBhcmFtcy5tZXNzYWdlO1xuXG5cdC8vIFNhdmUgY3JlZGVudGlhbHMgZm9yIGN1cnJlbnQgc2Vzc2lvblxuXHQvLyBJdCB3aWxsIGJlIHJlbW92ZWQgb24gc2Vzc2lvbiB0aW1lb3V0XG5cdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjcmVkZW50aWFscycsIHNhdmVQYXJhbXMsICdzZXNzaW9uJyk7XG5cblx0YXBpLmNoYXRSZXF1ZXN0KGNyZWRlbnRpYWxzKTtcblxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGRlYnVnLmxvZygncmVxdWVzdENoYXQ6ICcsIGNyZWRlbnRpYWxzLm1lc3NhZ2UsIGNoYXRTdGFydGVkKTtcblxuXHRcdGlmKG1lc3NhZ2UgJiYgIWNoYXRTdGFydGVkKSB7XG5cdFx0XHRzZW5kTWVzc2FnZSh7XG5cdFx0XHRcdG1lc3NhZ2U6IGNyZWRlbnRpYWxzLm1lc3NhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0fSwgNTAwKTtcblxuXHRzdGFydENoYXQoYXBpLnNlc3Npb24pO1xuXHRjbGVhcldnTWVzc2FnZXMoKTtcblx0c3dpdGNoUGFuZSgnbWVzc2FnZXMnKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRDaGF0KHBhcmFtcyl7XG5cdHZhciB0aW1lb3V0ID0gcGFyYW1zLmFuc3dlclRpbWVvdXQ7XG5cblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCB0cnVlLCAnc2Vzc2lvbicpO1xuXHRcblx0ZGVidWcubG9nKCdzdGFydENoYXQgdGltZW91dDogJywgdGltZW91dCk7XG5cblx0aWYodGltZW91dCkge1xuXHRcdGNoYXRUaW1lb3V0ID0gc2V0VGltZW91dChvbkNoYXRUaW1lb3V0LCB0aW1lb3V0KjEwMDApO1xuXHR9XG5cblx0YWRkV2dTdGF0ZSgnY2hhdCcpO1xufVxuXG5mdW5jdGlvbiBzZW5kTWVzc2FnZShwYXJhbXMpe1xuXHRhcGkuc2VuZE1lc3NhZ2UocGFyYW1zKTtcblxuXHRuZXdNZXNzYWdlKHtcblx0XHRmcm9tOiAoc3RvcmFnZS5nZXRTdGF0ZSgnY3JlZGVudGlhbHMnLCAnc2Vzc2lvbicpLnVuYW1lIHx8IGFwaS5zZXNzaW9uLnNpZCksXG5cdFx0dGltZTogRGF0ZS5ub3coKSxcblx0XHRjb250ZW50OiBwYXJhbXMubWVzc2FnZVxuXHRcdC8vIGhpZGRlbjogdHJ1ZVxuXHRcdC8vIGNsYXNzTmFtZTogZGVmYXVsdHMucHJlZml4KyctbXNnLXVuZGVsaXZlcmVkJ1xuXHR9KTtcblxuXHQvLyBpZihjaGF0VGltZW91dCkgY2xlYXJUaW1lb3V0KGNoYXRUaW1lb3V0KTtcbn1cblxuZnVuY3Rpb24gbmV3TWVzc2FnZShtZXNzYWdlKXtcblx0ZGVidWcubG9nKCduZXcgbWVzc2FnZXMgYXJyaXZlZCEnLCBtZXNzYWdlKTtcblxuXHR2YXIgc3RyLFxuXHRcdGVscyA9IFtdLFxuXHRcdHRleHQsXG5cdFx0Y29tcGlsZWQsXG5cdFx0cGxheVNvdW5kID0gZmFsc2UsXG5cdFx0bGFzdG1zZyA9IG51bGw7XG5cdFx0c2VxdWVuY2UgPSBtZXNzYWdlLnNlcXVlbmNlID8gbWVzc2FnZS5zZXF1ZW5jZS5zcGxpdCgnLycpIDogWzEsMV0sXG5cdFx0Ly8gZGVmYXVsdFVuYW1lID0gZmFsc2UsXG5cdFx0Y3JlZGVudGlhbHMgPSBzdG9yYWdlLmdldFN0YXRlKCdjcmVkZW50aWFscycsICdzZXNzaW9uJykgfHwge30sXG5cdFx0YW5hbWUgPSBzdG9yYWdlLmdldFN0YXRlKCdhbmFtZScsICdzZXNzaW9uJyksXG5cdFx0dW5hbWUgPSBjcmVkZW50aWFscy51bmFtZSA/IGNyZWRlbnRpYWxzLnVuYW1lIDogYXBpLnNlc3Npb24uc2lkLFxuXHRcdG1lc3NhZ2VzQ29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblxuXHQvLyBpZih1bmFtZSA9PT0gc3RvcmFnZS5nZXRTdGF0ZSgnc2lkJykuc3BsaXQoJ18nKVswXSkge1xuXHQvLyBcdGRlZmF1bHRVbmFtZSA9IHRydWU7XG5cdC8vIH1cblxuXHQvLyByZXN1bHQubWVzc2FnZXMuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlLCBpbmRleCkge1xuXHRcdFxuXHRcdG1lc3NhZ2UuZW50aXR5ID0gbWVzc2FnZS5lbnRpdHkgfHwgKChtZXNzYWdlLmZyb20gPT09IHVuYW1lIHx8IG1lc3NhZ2UuZnJvbSA9PT0gdW5kZWZpbmVkKSA/ICd1c2VyJyA6ICdhZ2VudCcpO1xuXHRcdC8vIG1lc3NhZ2UuZnJvbSA9IChtZXNzYWdlLmVudGl0eSA9PT0gJ3VzZXInICYmIGRlZmF1bHRVbmFtZSkgPyBmcmFzZXMuZGVmYXVsdF91c2VyX25hbWUgOiBtZXNzYWdlLmZyb207XG5cdFx0bWVzc2FnZS5mcm9tID0gbWVzc2FnZS5lbnRpdHkgPT09ICd1c2VyJyA/ICcnIDogbWVzc2FnZS5mcm9tO1xuXHRcdG1lc3NhZ2UudGltZSA9IG1lc3NhZ2UudGltZSA/IHBhcnNlVGltZShtZXNzYWdlLnRpbWUpIDogcGFyc2VUaW1lKERhdGUubm93KCkpO1xuXG5cdFx0dGV4dCA9IHBhcnNlTWVzc2FnZShtZXNzYWdlLmNvbnRlbnQsIG1lc3NhZ2UuZmlsZSwgbWVzc2FnZS5lbnRpdHkpO1xuXG5cdFx0aWYodGV4dC50eXBlID09PSAnZm9ybScpIHtcblxuXHRcdFx0Y29tcGlsZWQgPSBjb21waWxlVGVtcGxhdGUoJ2Zvcm1zJywge1xuXHRcdFx0XHRkZWZhdWx0czogZGVmYXVsdHMsXG5cdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdGZvcm06IHRleHQuY29udGVudCxcblx0XHRcdFx0Y3JlZGVudGlhbHM6IGNyZWRlbnRpYWxzLFxuXHRcdFx0XHRmcmFzZXM6IGZyYXNlcyxcblx0XHRcdFx0XzogX1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmKGdsb2JhbFt0ZXh0LmNvbnRlbnQubmFtZV0pIGNsb3NlRm9ybSh7IGZvcm1OYW1lOiB0ZXh0LmNvbnRlbnQubmFtZSB9KTtcblx0XHRcdG1lc3NhZ2VzQ29udC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsICc8bGk+Jytjb21waWxlZCsnPC9saT4nKTtcblx0XHRcdG1lc3NhZ2VzQ29udC5zY3JvbGxUb3AgPSBtZXNzYWdlc0NvbnQuc2Nyb2xsSGVpZ2h0O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighbWVzc2FnZS5jb250ZW50KSByZXR1cm47XG5cdFx0XHRtZXNzYWdlLmNvbnRlbnQgPSB0ZXh0LmNvbnRlbnQ7XG5cdFx0XHRjb21waWxlZCA9IGNvbXBpbGVUZW1wbGF0ZSgnbWVzc2FnZScsIHsgZGVmYXVsdHM6IGRlZmF1bHRzLCBtZXNzYWdlOiBtZXNzYWdlIH0pO1xuXHRcdFx0bWVzc2FnZXNDb250Lmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgJzxsaSAnKyhtZXNzYWdlLmNsYXNzTmFtZSA/ICdjbGFzcz1cIicrbWVzc2FnZS5jbGFzc05hbWUrJ1wiJyA6ICcnICkrJz4nK2NvbXBpbGVkKyc8L2xpPicpO1xuXG5cdFx0XHRsYXN0bXNnID0gY29tcGlsZWQ7XG5cblx0XHRcdC8vIE5lZWQgZm9yIHNlbmRpbmcgZGlhbG9nIHRvIGVtYWlsXG5cdFx0XHRpZighbWVzc2FnZS5oaWRkZW4pIHtcblx0XHRcdFx0ZGlhbG9nLnB1c2goY29tcGlsZWQpO1xuXHRcdFx0XHRtZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFNhdmUgYWdlbnQgbmFtZVxuXHRcdGlmKG1lc3NhZ2UuZW50aXR5ID09PSAnYWdlbnQnKSB7XG5cdFx0XHRpZihhbmFtZSAhPT0gbWVzc2FnZS5mcm9tKSBzdG9yYWdlLnNhdmVTdGF0ZSgnYW5hbWUnLCBtZXNzYWdlLmZyb20sICdzZXNzaW9uJyk7XG5cdFx0XHRpZihtZXNzYWdlLmFnZW50aWQpIHN0b3JhZ2Uuc2F2ZVN0YXRlKCdhaWQnLCBtZXNzYWdlLmFnZW50aWQsICdzZXNzaW9uJyk7XG5cdFx0XHRpZihtZXNzYWdlLmZyb20pIGNsZWFyVGltZW91dChjaGF0VGltZW91dCk7XG5cdFx0fVxuXG5cdFx0aWYobWVzc2FnZS5lbnRpdHkgIT09ICd1c2VyJykgcGxheVNvdW5kID0gdHJ1ZTtcblxuXHQvLyB9KTtcblxuXHRpZihzZXF1ZW5jZSAmJiAoc2VxdWVuY2VbMF0gPT0gc2VxdWVuY2VbMV0pKSB7XG5cdFx0aWYobGFzdG1zZykgb25MYXN0TWVzc2FnZShsYXN0bXNnKTtcblx0XHRtZXNzYWdlc0NvbnQuc2Nyb2xsVG9wID0gbWVzc2FnZXNDb250LnNjcm9sbEhlaWdodDtcblx0XHRpZihwbGF5U291bmQpIHBsYXlOZXdNc2dUb25lKCk7XG5cdH1cblx0XHRcbn1cblxuZnVuY3Rpb24gY2xlYXJVbmRlbGl2ZXJlZCgpe1xuXHR2YXIgdW5kZWxpdmVyZWQgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nK2RlZmF1bHRzLnByZWZpeCsnLW1zZy11bmRlbGl2ZXJlZCcpKTtcblx0aWYodW5kZWxpdmVyZWQgJiYgdW5kZWxpdmVyZWQubGVuZ3RoKSB7XG5cdFx0dW5kZWxpdmVyZWQuZm9yRWFjaChmdW5jdGlvbihtc2cpe1xuXHRcdFx0bXNnLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdHJpZ2dlclNvdW5kcygpIHtcblx0dmFyIGljb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy10cmlnZ2VyLXNvdW5kcy1idG4gc3BhbicpO1xuXHRkZWZhdWx0cy5zb3VuZHMgPSAhZGVmYXVsdHMuc291bmRzO1xuXHRpY29uLmNsYXNzTmFtZSA9IGRlZmF1bHRzLnNvdW5kcyA/IChkZWZhdWx0cy5wcmVmaXgrJy1pY29uLWJlbGwnKSA6IChkZWZhdWx0cy5wcmVmaXgrJy1pY29uLWJlbGwtc2xhc2gnKTtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ3NvdW5kcycsIGRlZmF1bHRzLnNvdW5kcywgJ3Nlc3Npb24nKTtcbn1cblxuZnVuY3Rpb24gcGxheU5ld01zZ1RvbmUoKSB7XG5cdGlmKGRlZmF1bHRzLnNvdW5kcylcblx0XHRhdWRpby5wbGF5KCduZXdfbWVzc2FnZScpO1xufVxuXG4vKipcbiAqIFZpc3VhbCBub3RpZmljYXRpb24gYWJvdXQgYSBuZXcgbWVzc2FnZSBmb21yIGFnZW50LlxuICogSXQgaXMgYWxzbyB1c2VkIGZvciBvZmZlciBub3RpZmljYXRpb25cbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSBtZXNzYWdlIC0gTmV3IG1lc3NhZ2UgY29udGVudCBcbiAqL1xuZnVuY3Rpb24gb25MYXN0TWVzc2FnZShtZXNzYWdlKXtcblx0dmFyIGxhc3RNc2c7XG5cdGlmKCF3aWRnZXRTdGF0ZS5hY3RpdmUpIHtcblx0XHRsYXN0TXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbGFzdG1zZycpO1xuXG5cdFx0Ly8gUHJlZml4ZWRFdmVudChsYXN0TXNnLCAnYW5pbWF0aW9uZW5kJywgW1wid2Via2l0XCIsIFwibW96XCIsIFwiTVNcIiwgXCJvXCIsIFwiXCJdLCBmdW5jdGlvbihlKSB7XG5cdFx0Ly8gXHRidG4uY2hpbGRyZW5bMF0uc3R5bGUuaGVpZ2h0ID0gZS50YXJnZXQuc2Nyb2xsSGVpZ2h0ICsgJ3B4Jztcblx0XHQvLyB9KTtcblxuXHRcdGxhc3RNc2cuaW5uZXJIVE1MID0gbWVzc2FnZTtcblx0XHQvLyBjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6ICdub3RpZmllZCcgfSk7XG5cdFx0YWRkV2dTdGF0ZSgnbm90aWZpZWQnKTtcblx0XHRzZXRCdXR0b25TdHlsZSgnbm90aWZpZWQnKTtcblxuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVFbWFpbChjb250ZW50LCBjYikge1xuXHR2YXIgY29tcGlsZWQgPSBjb21waWxlVGVtcGxhdGUoJ2VtYWlsJywge1xuXHRcdGRlZmF1bHRzOiBkZWZhdWx0cyxcblx0XHRjb250ZW50OiBjb250ZW50LFxuXHRcdGZyYXNlczogZnJhc2VzLFxuXHRcdF86IF9cblx0fSk7XG5cblx0aWYoY2IpIHJldHVybiBjYihudWxsLCBjb21waWxlZCk7XG59XG5cbmZ1bmN0aW9uIHNlbmREaWFsb2cocGFyYW1zKXtcblx0dmFyIGRpYWxvZ1N0ciA9IHBhcmFtcy50ZXh0LmpvaW4oJycpO1xuXHRjb21waWxlRW1haWwoZGlhbG9nU3RyLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdGlmKGVycikgcmV0dXJuO1xuXHRcdHBhcmFtcy50ZXh0ID0gcmVzdWx0O1xuXHRcdGFwaS5zZW5kRW1haWwocGFyYW1zKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDb21wbGFpbihwYXJhbXMpe1xuXHR2YXIgYm9keSA9IFtdO1xuXHQvLyBUT0RPOiBleHBsYWluLi4uXG5cdHZhciBjb21wbGFpbiA9IGNvbXBpbGVUZW1wbGF0ZSgnbWVzc2FnZScsIHtcblx0XHRkZWZhdWx0czogZGVmYXVsdHMsXG5cdFx0bWVzc2FnZToge1xuXHRcdFx0ZnJvbTogZnJhc2VzLkVNQUlMX1NVQkpFQ1RTLmNvbXBsYWluKycgJytwYXJhbXMuZW1haWwsXG5cdFx0XHRjb250ZW50OiBwYXJhbXMudGV4dCxcblx0XHRcdGVudGl0eTogJycsXG5cdFx0XHR0aW1lOiAnJ1xuXHRcdH1cblx0fSk7XG5cblx0Ym9keSA9IGJvZHkuY29uY2F0KFxuXHRcdGNvbXBsYWluLFxuXHRcdCc8YnI+PHAgY2xhc3M9XCJoMVwiPicrZnJhc2VzLkVNQUlMX1NVQkpFQ1RTLmRpYWxvZysnICcrZGVmYXVsdHMuaG9zdCsnPC9wPjxicj4nLFxuXHRcdGRpYWxvZ1xuXHQpLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XG5cdFx0cmV0dXJuIHByZXYuY29uY2F0KGN1cnIpO1xuXHR9KTtcblxuXHRjb21waWxlRW1haWwoYm9keSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHRpZihlcnIpIHJldHVybjtcblx0XHRwYXJhbXMudGV4dCA9IHJlc3VsdDtcblx0XHRhcGkuc2VuZEVtYWlsKHBhcmFtcyk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kUmVxdWVzdChwYXJhbXMsIGNiKSB7XG5cdC8vIFRPRE86IGV4cGxhaW4uLi5cblx0dmFyIG1zZyA9IGNvbXBpbGVUZW1wbGF0ZSgnbWVzc2FnZScsIHtcblx0XHRkZWZhdWx0czogZGVmYXVsdHMsXG5cdFx0bWVzc2FnZToge1xuXHRcdFx0ZnJvbTogZnJhc2VzLkVNQUlMX1NVQkpFQ1RTLnJlcXVlc3QrJyAnK3BhcmFtcy51bmFtZSsnICgnK3BhcmFtcy5lbWFpbCsnKScsXG5cdFx0XHRjb250ZW50OiBwYXJhbXMudGV4dCxcblx0XHRcdGVudGl0eTogJycsXG5cdFx0XHR0aW1lOiAnJ1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gY29tcGlsZUVtYWlsKG1zZywgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcblx0XHQvLyBpZihlcnIpIHJldHVybjtcblx0XHQvLyBwYXJhbXMudGV4dCA9IHJlc3VsdDtcblx0XHRhcGkuc2VuZEVtYWlsKHBhcmFtcyk7XG5cdFx0aWYoY2IpIGNiKCk7XG5cdC8vIH0pO1xufVxuXG5mdW5jdGlvbiBzdWJtaXRTZW5kTWFpbEZvcm0oZm9ybSwgZGF0YSkge1xuXHR2YXIgcGFyYW1zID0ge30sXG5cdFx0ZmlsZTtcblxuXHRpZighZGF0YS5lbWFpbCkge1xuXHRcdGFsZXJ0KGZyYXNlcy5FUlJPUlMuZW1haWwpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGRhdGEuc3ViamVjdCA9IGZyYXNlcy5FTUFJTF9TVUJKRUNUUy5yZXF1ZXN0KycgJytkYXRhLmVtYWlsO1xuXG5cdGlmKGRhdGEuZmlsZSkge1xuXHRcdGZpbGUgPSBnZXRGaWxlQ29udGVudChmb3JtLmZpbGUsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRpZighZXJyKSB7XG5cdFx0XHRcdGRhdGEuZmlsZW5hbWUgPSByZXN1bHQuZmlsZW5hbWU7XG5cdFx0XHRcdGRhdGEuZmlsZWRhdGEgPSByZXN1bHQuZmlsZWRhdGE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZihmcmFzZXMuRVJST1JTW2Vycl0pIGFsZXJ0KGZyYXNlcy5FUlJPUlNbZXJyXSlcblx0XHRcdFx0cmV0dXJuIGRlYnVnLndhcm4oJ0ZpbGUgd2FzblxcJ3Qgc2VudCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGRhdGEuZmlsZTtcblx0XHRcdHNlbmRSZXF1ZXN0KGRhdGEsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRmb3JtLnJlc2V0KCk7XG5cdFx0XHRcdGNsb3NlV2lkZ2V0KCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZW5kUmVxdWVzdChkYXRhLCBmdW5jdGlvbigpIHtcblx0XHRcdGZvcm0ucmVzZXQoKTtcblx0XHRcdGNsb3NlV2lkZ2V0KCk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc3VibWl0Q2xvc2VDaGF0Rm9ybShmb3JtLCBkYXRhKXtcblx0dmFyIHJhdGluZyA9IChkYXRhICYmIGRhdGEucmF0aW5nKSA/IHBhcnNlSW50KGRhdGEucmF0aW5nLCAxMCkgOiBudWxsO1xuXHRpZihkYXRhICYmIGRhdGEuc2VuZERpYWxvZykge1xuXHRcdGlmKCFkYXRhLmVtYWlsKSB7XG5cdFx0XHRhbGVydChmcmFzZXMuRVJST1JTLmVtYWlsKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gZGVidWcubG9nKCdzZW5kIGRpYWxvZycpO1xuXHRcdHNlbmREaWFsb2coe1xuXHRcdFx0dG86IGRhdGEuZW1haWwsXG5cdFx0XHRzdWJqZWN0OiBmcmFzZXMuRU1BSUxfU1VCSkVDVFMuZGlhbG9nKycgJytkZWZhdWx0cy5ob3N0LFxuXHRcdFx0dGV4dDogZGlhbG9nIC8vIGdsb2JhbCB2YXJpYWJsZVxuXHRcdH0pO1xuXHR9XG5cdGlmKGRhdGEgJiYgZGF0YS50ZXh0KSB7XG5cdFx0aWYoIWRhdGEuZW1haWwpIHtcblx0XHRcdGFsZXJ0KGZyYXNlcy5FUlJPUlMuZW1haWwpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBkZWJ1Zy5sb2coJ3NlbmQgY29tcGxhaW4hJyk7XG5cdFx0XHRzZW5kQ29tcGxhaW4oe1xuXHRcdFx0XHRlbWFpbDogZGF0YS5lbWFpbCxcblx0XHRcdFx0c3ViamVjdDogZnJhc2VzLkVNQUlMX1NVQkpFQ1RTLmNvbXBsYWluKycgJytkYXRhLmVtYWlsLFxuXHRcdFx0XHR0ZXh0OiBkYXRhLnRleHRcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHQvLyBpZihjaGF0VGltZW91dCkgY2xlYXJUaW1lb3V0KGNoYXRUaW1lb3V0KTtcblx0aWYoZm9ybSkgZm9ybS5yZXNldCgpO1xuXHRcblx0Y2xvc2VDaGF0KHJhdGluZyk7XG5cdGNsb3NlV2lkZ2V0KCk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQ2hhdChyYXRpbmcpIHtcblx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NoYXQnLCBmYWxzZSwgJ3Nlc3Npb24nKTtcblx0YXBpLmNsb3NlQ2hhdChyYXRpbmcpO1xuXHRyZW1vdmVXZ1N0YXRlKCdjaGF0Jyk7XG5cblx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSkge1xuXHRcdGFwaS5zaGFyZUNsb3NlZChnbG9iYWwubG9jYXRpb24uaHJlZik7XG5cdFx0Y29icm93c2luZy51bnNoYXJlKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25DaGF0Q2xvc2UoKXtcblx0aWYoc3RvcmFnZS5nZXRTdGF0ZSgnc2hhcmVkJywgJ3Nlc3Npb24nKSkgY29icm93c2luZy51bnNoYXJlKCk7XG59XG5cbmZ1bmN0aW9uIG9uQ2hhdFRpbWVvdXQoKXtcblx0ZGVidWcubG9nKCdjaGF0IHRpbWVvdXQhJyk7XG5cdC8vIHN3aXRjaFBhbmUoJ2Nsb3NlY2hhdCcpO1xuXHQvLyBzdG9yYWdlLnNhdmVTdGF0ZSgnY2hhdCcsIGZhbHNlLCAnc2Vzc2lvbicpO1xuXG5cdG5ld01lc3NhZ2Uoe1xuXHRcdGZyb206IFwiXCIsXG5cdFx0dGltZTogRGF0ZS5ub3coKSxcblx0XHRjb250ZW50OiBcIntxdWV1ZV9vdmVybG9hZH1cIlxuXHR9KTtcblxuXHR2YXIgZm9ybSA9IGdsb2JhbFsncXVldWVfb3ZlcmxvYWQnXTtcblx0aWYoZm9ybSkgZm9ybS50ZXh0LnZhbHVlID0gbWVzc2FnZXMucmVkdWNlKGZ1bmN0aW9uKHN0ciwgaXRlbSl7IGlmKGl0ZW0uZW50aXR5ID09PSAndXNlcicpIHtzdHIgKz0gKGl0ZW0uY29udGVudCtcIlxcblwiKX0gcmV0dXJuIHN0cjsgfSwgXCJcIik7XG59XG5cbmZ1bmN0aW9uIG9uQWdlbnRUeXBpbmcoKXtcblx0Ly8gZGVidWcubG9nKCdBZ2VudCBpcyB0eXBpbmchJyk7XG5cdGlmKCFhZ2VudElzVHlwaW5nVGltZW91dCkge1xuXHRcdGFkZFdnU3RhdGUoJ2FnZW50LXR5cGluZycpO1xuXHR9XG5cdGNsZWFyVGltZW91dChhZ2VudElzVHlwaW5nVGltZW91dCk7XG5cdGFnZW50SXNUeXBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRhZ2VudElzVHlwaW5nVGltZW91dCA9IG51bGw7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgnYWdlbnQtdHlwaW5nJyk7XG5cdFx0Ly8gZGVidWcubG9nKCdhZ2VudCBpcyBub3QgdHlwaW5nIGFueW1vcmUhJyk7XG5cdH0sIDUwMDApO1xufVxuXG5mdW5jdGlvbiBvblNlc3Npb25UaW1lb3V0KCl7XG5cdC8vIGlmKGFwaS5saXN0ZW5lckNvdW50KCdzZXNzaW9uL3RpbWVvdXQnKSA+PSAxKSByZXR1cm47XG5cdC8vIGFwaS5vbmNlKCdzZXNzaW9uL3RpbWVvdXQnLCBmdW5jdGlvbiAoKXtcblx0XHRkZWJ1Zy5sb2coJ1Nlc3Npb24gdGltZW91dDonKTtcblxuXHRcdGlmKHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnc2Vzc2lvbicpID09PSB0cnVlKSB7XG5cdFx0XHRjbG9zZUNoYXQoKTtcblx0XHR9XG5cblx0XHRzd2l0Y2hQYW5lKCdjbG9zZWNoYXQnKTtcblxuXHRcdC8vIGlmKHdpZGdldCkge1xuXHRcdFx0Ly8gYWRkV2dTdGF0ZSgndGltZW91dCcpO1xuXHRcdFx0Ly8gY2xvc2VXaWRnZXQoKTtcblx0XHQvLyB9XG5cblx0XHQvLyBjaGFuZ2VXZ1N0YXRlKHsgc3RhdGU6ICd0aW1lb3V0JyB9KTtcblx0XHQvLyB3aWRnZXRTdGF0ZS5zdGF0ZSA9ICd0aW1lb3V0Jztcblx0XHQvLyBhZGRXZ1N0YXRlKCd0aW1lb3V0Jyk7XG5cdFx0Ly8gc2V0QnV0dG9uU3R5bGUoJ3RpbWVvdXQnKTtcblx0XHQvLyBzdG9yYWdlLnJlbW92ZVN0YXRlKCdzaWQnKTtcblxuXHRcdC8vIGlmKHBhcmFtcyAmJiBwYXJhbXMubWV0aG9kID09PSAndXBkYXRlRXZlbnRzJykge1xuXHRcdC8vIGlmKGdldExhbmd1YWdlc0ludGVydmFsKSBjbGVhckludGVydmFsKGdldExhbmd1YWdlc0ludGVydmFsKTtcblx0XHQvLyBpZihtZXNzYWdlc1RpbWVvdXQpIGNsZWFyVGltZW91dChtZXNzYWdlc1RpbWVvdXQpO1xuXG5cdFx0Ly8gaWYoZGVmYXVsdHMucmVDcmVhdGVTZXNzaW9uKSB7XG5cdFx0Ly8gXHRpbml0TW9kdWxlKCk7XG5cdFx0Ly8gfVxuXHRcdC8vIH1cblx0Ly8gfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRDYWxsKCl7XG5cdHN3aXRjaFBhbmUoJ2NhbGxBZ2VudCcpO1xuXHRXZWJSVEMuYXVkaW9jYWxsKGRlZmF1bHRzLmNoYW5uZWxzLndlYnJ0Yy5ob3RsaW5lKTtcblx0Ly8gV2ViUlRDLmF1ZGlvY2FsbCgnc2lwOicrY2hhbm5lbHMud2VicnRjLmhvdGxpbmUrJ0AnK3NlcnZlclVybC5ob3N0KTtcbn1cblxuZnVuY3Rpb24gaW5pdEZhbGxiYWNrQ2FsbCgpe1xuXHRzd2l0Y2hQYW5lKCdjYWxsQWdlbnRGYWxsYmFjaycpO1xufVxuXG5mdW5jdGlvbiBpbml0Q2FsbGJhY2soKXtcblx0c3dpdGNoUGFuZSgnY2FsbGJhY2snKTtcbn1cblxuZnVuY3Rpb24gc2V0Q2FsbGJhY2soKXtcblx0dmFyIGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsYmFjay1zZXR0aW5ncycpLFxuXHRcdGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSksXG5cdFx0Y2JTcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctY2FsbGJhY2stc3Bpbm5lcicpLFxuXHRcdGNiU2VudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNlbnQnKTtcblx0XG5cdGZvcm1EYXRhLnBob25lID0gZm9ybURhdGEucGhvbmUgPyBmb3JtYXRQaG9uZU51bWJlcihmb3JtRGF0YS5waG9uZSkgOiBudWxsO1xuXG5cdGlmKCFmb3JtRGF0YS5waG9uZSB8fCBmb3JtRGF0YS5waG9uZS5sZW5ndGggPCAxMCkge1xuXHRcdHJldHVybiBhbGVydChmcmFzZXMuRVJST1JTLnRlbCk7XG5cdH1cblxuXHRpZihmb3JtRGF0YS50aW1lKSB7XG5cdFx0Zm9ybURhdGEudGltZSA9IHBhcnNlRmxvYXQoZm9ybURhdGEudGltZSk7XG5cdFx0aWYoZm9ybURhdGEudGltZSA8PSAwKSByZXR1cm47XG5cdFx0Zm9ybURhdGEudGltZSA9IERhdGUubm93KCkgKyAoZm9ybURhdGEudGltZSAqIDYwICogMTAwMCk7XG5cdH1cblx0Zm9ybURhdGEudGFzayA9IGRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2s7XG5cdGRlYnVnLmxvZygnc2V0Q2FsbGJhY2sgZGF0YTogJywgZm9ybURhdGEpO1xuXG5cdC8vIGZvcm0uY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0Ly8gY2JTcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0YXBpLnJlcXVlc3RDYWxsYmFjayhmb3JtRGF0YSk7XG5cdHN3aXRjaFBhbmUoJ2NhbGxiYWNrU2VudCcpO1xuXG5cdGZvcm0ucmVzZXQoKTtcbn1cblxuZnVuY3Rpb24gb25DYWxsYmFja1JlcXVlc3RlZCgpIHtcblx0dmFyIGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsYmFjay1zZXR0aW5ncycpLFxuXHRcdGNiU3Bpbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGxiYWNrLXNwaW5uZXInKTtcblxuXHRjYlNwaW5uZXIuY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0Zm9ybS5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXG5cdGlmKGVycikgcmV0dXJuO1xuXHRcblx0c3dpdGNoUGFuZSgnY2FsbGJhY2tTZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGluaXRDYWxsU3RhdGUoc3RhdGUpe1xuXHRkZWJ1Zy5sb2coJ2luaXRDYWxsU3RhdGU6ICcsIHN0YXRlKTtcblxuXHR2YXIgc3Bpbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLWNhbGwtc3Bpbm5lcicpLFxuXHRcdGluZm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsLWluZm8nKSxcblx0XHR0ZXh0U3RhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsLXN0YXRlJyksXG5cdFx0dGltZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1jYWxsLXRpbWVyJyksXG5cdFx0dHJ5QWdhaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy10cnlhZ2Fpbi1idG4nKTtcblxuXHRpZihzdGF0ZSA9PT0gJ25ld1JUQ1Nlc3Npb24nKSB7XG5cdFx0aW5pdENhbGxTdGF0ZSgnb25jYWxsJyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAnY29uZmlybWVkJykge1xuXHRcdHRleHRTdGF0ZS5pbm5lclRleHQgPSBmcmFzZXMuUEFORUxTLkFVRElPX0NBTEwuY2FsbGluZ19hZ2VudDtcblx0XHRpbmZvLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0c3Bpbm5lci5jbGFzc0xpc3QuYWRkKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdHRyeUFnYWluLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAncmluZ2luZycpIHtcblx0XHRzZXRUaW1lcih0aW1lciwgJ2luaXQnLCAwKTtcblx0XHR0aW1lci5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdC8vIGF1ZGlvLnBsYXkoJ3JpbmdvdXRfbG9vcCcsIHRydWUpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ2Nvbm5lY3RlZCcpIHtcblx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzLlBBTkVMUy5BVURJT19DQUxMLmNvbm5lY3RlZF93aXRoX2FnZW50O1xuXHRcdHNldFRpbWVyKHRpbWVyLCAnc3RhcnQnLCAwKTtcblx0XHRhdWRpby5zdG9wKCk7XG5cblx0fSBlbHNlIGlmKHN0YXRlID09PSAnZW5kZWQnKSB7XG5cdFx0dGV4dFN0YXRlLmlubmVyVGV4dCA9IGZyYXNlcy5QQU5FTFMuQVVESU9fQ0FMTC5jYWxsX2VuZGVkO1xuXHRcdHNldFRpbWVyKHRpbWVyLCAnc3RvcCcpO1xuXHRcdGluaXRDYWxsU3RhdGUoJ29uY2FsbGVuZCcpO1xuXHRcdFxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdmYWlsZWQnIHx8IHN0YXRlID09PSAnY2FuY2VsZWQnKSB7XG5cdFx0aWYoc3RhdGUgPT09ICdmYWlsZWQnKSB7XG5cdFx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfZmFpbGVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0ZXh0U3RhdGUuaW5uZXJUZXh0ID0gZnJhc2VzLlBBTkVMUy5BVURJT19DQUxMLmNhbGxfY2FuY2VsZWQ7XG5cdFx0fVxuXHRcdGluZm8uY2xhc3NMaXN0LnJlbW92ZShkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0XHRzcGlubmVyLmNsYXNzTGlzdC5hZGQoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0dGltZXIuY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0XHR0cnlBZ2Fpbi5jbGFzc0xpc3QucmVtb3ZlKGRlZmF1bHRzLnByZWZpeCsnLWhpZGRlbicpO1xuXHRcdGluaXRDYWxsU3RhdGUoJ29uY2FsbGVuZCcpO1xuXHRcdGF1ZGlvLnBsYXkoJ2J1c3knKTtcblxuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdvbmNhbGwnKSB7XG5cdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAnWW91ciBjb25uZWN0aW9uIGlzIGluIHByb2dyZXNzLiBEbyB5b3UgcmVhbHkgd2FudCB0byBjbG9zZSBpdD8nO1xuXHRcdH07XG5cdFx0c3RvcmFnZS5zYXZlU3RhdGUoJ2NhbGwnLCB0cnVlLCAnY2FjaGUnKTtcblx0XHRhZGRXZ1N0YXRlKCd3ZWJydGMtY2FsbCcpO1xuXG5cdH0gZWxzZSBpZihzdGF0ZSA9PT0gJ29uY2FsbGVuZCcpIHtcblx0XHR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBudWxsO1xuXHRcdHN0b3JhZ2Uuc2F2ZVN0YXRlKCdjYWxsJywgZmFsc2UsICdjYWNoZScpO1xuXHRcdHJlbW92ZVdnU3RhdGUoJ3dlYnJ0Yy1jYWxsJyk7XG5cdFx0Ly8gc3RvcFJpbmdUb25lKCk7XG5cblx0fSBlbHNlIGlmKCdpbml0Jykge1xuXHRcdGluZm8uY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0XHRzcGlubmVyLmNsYXNzTGlzdC5yZW1vdmUoZGVmYXVsdHMucHJlZml4KyctaGlkZGVuJyk7XG5cdFx0dHJ5QWdhaW4uY2xhc3NMaXN0LmFkZChkZWZhdWx0cy5wcmVmaXgrJy1oaWRkZW4nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRUaW1lcih0aW1lciwgc3RhdGUsIHNlY29uZHMpe1xuXHR2YXIgdGltZSA9IHNlY29uZHM7XG5cdGlmKHN0YXRlID09PSAnc3RhcnQnKSB7XG5cdFx0dGltZXJVcGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG5cdFx0XHR0aW1lID0gdGltZSsxO1xuXHRcdFx0dGltZXIudGV4dENvbnRlbnQgPSBjb252ZXJ0VGltZSh0aW1lKTtcblx0XHR9LCAxMDAwKTtcblx0fSBlbHNlIGlmKHN0YXRlID09PSAnc3RvcCcpIHtcblx0XHRjbGVhckludGVydmFsKHRpbWVyVXBkYXRlSW50ZXJ2YWwpO1xuXHR9IGVsc2UgaWYoc3RhdGUgPT09ICdpbml0Jykge1xuXHRcdHRpbWVyLnRleHRDb250ZW50ID0gY29udmVydFRpbWUoMCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZW5kQ2FsbCgpe1xuXHRpZihXZWJSVEMuaXNFc3RhYmxpc2hlZCgpIHx8IFdlYlJUQy5pc0luUHJvZ3Jlc3MoKSkge1xuXHRcdFdlYlJUQy50ZXJtaW5hdGUoKTtcblx0fSBlbHNlIHtcblx0XHRjbG9zZVdpZGdldCgpO1xuXHRcdGluaXRDYWxsU3RhdGUoJ2luaXQnKTtcblx0fVxufVxuXG4vLyBmdW5jdGlvbiBwbGF5UmluZ1RvbmUoKXtcbi8vIFx0aWYocmluZ1RvbmVJbnRlcnZhbCkgcmV0dXJuO1xuLy8gXHRyaW5nVG9uZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbi8vIFx0XHRyaW5nVG9uZS5wbGF5KCk7XG4vLyBcdH0sIDMwMDApO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBzdG9wUmluZ1RvbmUoKXtcbi8vIFx0Y2xlYXJJbnRlcnZhbChyaW5nVG9uZUludGVydmFsKTtcbi8vIH1cblxuLyoqXG4gKiBPcGVuIHdlYiBjaGF0IHdpZGdldCBpbiBhIG5ldyB3aW5kb3dcbiAqL1xuZnVuY3Rpb24gb3BlbldpZGdldChlKXtcblx0aWYoZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdHZhciBvcHRzID0ge307XG5cdFxuXHRpZighd2lkZ2V0V2luZG93IHx8IHdpZGdldFdpbmRvdy5jbG9zZWQpIHtcblxuXHRcdG9wdHMgPSBfLm1lcmdlKG9wdHMsIGRlZmF1bHRzKTtcblxuXHRcdG9wdHMud2lkZ2V0ID0gdHJ1ZTtcblx0XHQvLyBzZXQgZXh0ZXJuYWwgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IHRoZSBtb2R1bGUgbG9hZHMgbm90IGluIHRoZSBtYWluIHdpbmRvd1xuXHRcdG9wdHMuZXh0ZXJuYWwgPSB0cnVlO1xuXG5cdFx0d2lkZ2V0V2luZG93ID0gd2luZG93Lm9wZW4oJycsICd3Y2hhdCcsIGRlZmF1bHRzLndpZGdldFdpbmRvd09wdGlvbnMpO1xuXHRcdHdpZGdldFdpbmRvdyA9IGNvbnN0cnVjdFdpbmRvdyh3aWRnZXRXaW5kb3cpO1xuXHRcdC8vIHdpZGdldFdpbmRvd1tnbG9iYWxTZXR0aW5nc10gPSBvcHRzO1xuXG5cdFx0Ly8gd2lkZ2V0V2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3djaGF0X29wdGlvbnMnLCBKU09OLnN0cmluZ2lmeShvcHRzKSk7XG5cblx0XHQvLyBXYWl0IHdoaWxlIHRoZSBzY3JpcHQgaXMgbG9hZGVkLCBcblx0XHQvLyB0aGVuIGluaXQgbW9kdWxlIGluIHRoZSBjaGlsZCB3aW5kb3dcblx0XHRfLnBvbGwoZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB3aWRnZXRXaW5kb3cuV2NoYXQgIT09IHVuZGVmaW5lZDtcblx0XHR9LCBmdW5jdGlvbigpe1xuXHRcdFx0d2lkZ2V0V2luZG93Lk1vZHVsZSA9IHdpZGdldFdpbmRvdy5XY2hhdChvcHRzKTtcblx0XHRcdHdpZGdldFdpbmRvdy5Nb2R1bGUub24oJ3dpZGdldC9pbml0JywgZnVuY3Rpb24oKXtcblx0XHRcdFx0d2lkZ2V0V2luZG93Lk1vZHVsZS5pbml0V2lkZ2V0U3RhdGUoKTtcblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHQvKiBcblx0XHRcdCogUHJveHkgYWxsIGV2ZW50cyB0aGF0IGlzIGVtaXR0ZWQgaW4gdGhlIGNoaWxkIHdpbmRvd1xuXHRcdFx0KiB0byB0aGUgbWFpbiB3aW5kb3csIGJ1dCB3aXRoIHRoZSAnd2luZG93LycgcHJlZml4IGJlZm9yZSB0aGUgZXZlbnQgbmFtZS5cblx0XHRcdCogU28sIGZvciBleGFtcGxlLCAnY2hhdC9zdGFydCcgZXZlbnQgaW4gdGhlIGNoaWxkIHdpbmRvdyxcblx0XHRcdCogd291bGQgYmUgJ3dpbmRvdy9jaGF0L3N0YXJ0JyBpbiB0aGUgbWFpbiB3aW5kb3cgXG5cdFx0XHQqL1xuXHRcdFx0Xy5mb3JFYWNoKGFwaS5fZXZlbnRzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBjb2xsKXtcblx0XHRcdFx0d2lkZ2V0V2luZG93Lk1vZHVsZS5vbihrZXksIGZ1bmN0aW9uKHBhcmFtcyl7XG5cdFx0XHRcdFx0cGFyYW1zLnVybCA9IGdsb2JhbC5sb2NhdGlvbi5ocmVmO1xuXHRcdFx0XHRcdGFwaS5lbWl0KCd3aW5kb3cvJytrZXksIHBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIHdpZGdldFdpbmRvdy5Nb2R1bGUuaW5pdE1vZHVsZSgpO1xuXG5cdFx0fSwgZnVuY3Rpb24oKXtcblx0XHRcdGNvbnNvbGUud2FybignV2NoYXQgbW9kdWxlIHdhcyBub3QgaW5pdGlhdGVkIGR1ZSB0byBuZXR3b3JrIGNvbm5lY3Rpb24gaXNzdWVzLicpO1xuXHRcdH0sIDEyMDAwMCk7XG5cdFx0XG5cdFx0d2lkZ2V0V2luZG93Lm9uYmVmb3JldW5sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vY2xvc2UgY2hhdCBpZiB1c2VyIGNsb3NlIHRoZSB3aWRnZXQgd2luZG93XG5cdFx0XHQvL3dpdGhvdXQgZW5kaW5nIGEgZGlhbG9nXG5cdFx0XHRpZihzdG9yYWdlLmdldFN0YXRlKCdjaGF0JywgJ3Nlc3Npb24nKSkgY2xvc2VDaGF0KCk7XG5cdFx0fTtcblx0fVxuXHRpZih3aWRnZXRXaW5kb3cuZm9jdXMpIHdpZGdldFdpbmRvdy5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RXaW5kb3cod2luZG93T2JqZWN0KXtcblx0dmFyIGxvYWRlcixcblx0c2NyaXB0LFxuXHRsaW5rLFxuXHRjaGFyc2V0LFxuXHR2aWV3cG9ydCxcblx0dGl0bGUsXG5cdGxvYWRlckVsZW1lbnRzID0gd2luZG93T2JqZWN0LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRsb2FkZXJTdHlsZXMgPSBjcmVhdGVTdHlsZXNoZWV0KHdpbmRvd09iamVjdCwgJ3N3Yy1sb2FkZXItc3R5bGVzJyksXG5cdGhlYWQgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcblx0Ym9keSA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXG5cdGxvYWRlckVsZW1lbnRzLmNsYXNzTmFtZSA9IFwic3djLXdpZGdldC1sb2FkZXJcIjtcblx0bG9hZGVyRWxlbWVudHMuaW5uZXJIVE1MID0gXCI8c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj5cIjtcblxuXHR2aWV3cG9ydCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdHZpZXdwb3J0Lm5hbWUgPSAndmlld3BvcnQnO1xuXHR2aWV3cG9ydC5jb250ZW50ID0gJ3dpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIHVzZXItc2NhbGFibGU9MCc7XG5cblx0Y2hhcnNldCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG5cdGNoYXJzZXQuc2V0QXR0cmlidXRlKCdjaGFyc2V0JywgJ3V0Zi04Jyk7XG5cblx0dGl0bGUgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGl0bGUnKTtcblx0dGl0bGUudGV4dENvbnRlbnQgPSBmcmFzZXMuVE9QX0JBUi50aXRsZTtcblxuXHQvLyBsb2FkZXIgPSB3aW5kb3dPYmplY3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdC8vIGxvYWRlci5zcmMgPSBkZWZhdWx0cy5jbGllbnRQYXRoKydsb2FkZXIuanMnO1xuXG5cdHNjcmlwdCA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcblx0c2NyaXB0LnNyYyA9IGRlZmF1bHRzLmNsaWVudFBhdGgrJ3djaGF0Lm1pbi5qcyc7XG5cdHNjcmlwdC5jaGFyc2V0ID0gJ1VURi04JztcblxuXHRoZWFkLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcblx0aGVhZC5hcHBlbmRDaGlsZChjaGFyc2V0KTtcblx0aGVhZC5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cdGhlYWQuYXBwZW5kQ2hpbGQobG9hZGVyU3R5bGVzKTtcblx0aGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG5cdGJvZHkuaWQgPSAnc3djLXdnLXdpbmRvdyc7XG5cdGJvZHkuYXBwZW5kQ2hpbGQobG9hZGVyRWxlbWVudHMpO1xuXHQvLyBib2R5LmFwcGVuZENoaWxkKGxvYWRlcik7XG5cblx0YWRkTG9hZGVyUnVsZXMoaGVhZC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3R5bGUnKVswXSk7XG5cblx0cmV0dXJuIHdpbmRvd09iamVjdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3R5bGVzaGVldCh3aW5kb3dPYmplY3QsIGlkKXtcblx0Ly8gQ3JlYXRlIHRoZSA8c3R5bGU+IHRhZ1xuXHRcdHZhciBzdHlsZSA9IHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cdFx0c3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XG5cdFx0aWYoaWQpIHN0eWxlLmlkID0gaWQ7XG5cblx0XHQvLyBXZWJLaXQgaGFjayA6KFxuXHRcdHN0eWxlLmFwcGVuZENoaWxkKHdpbmRvd09iamVjdC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKSk7XG5cblx0XHRyZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIGFkZExvYWRlclJ1bGVzKHN0eWxlKXtcblx0dmFyIHRoZVJ1bGVzID0gW1xuXHRcdFwiYm9keSB7IG1hcmdpbjowOyBiYWNrZ3JvdW5kLWNvbG9yOiAjZWVlOyB9XCIsXG5cdFx0XCJAa2V5ZnJhbWVzIHByZWxvYWRpbmcge1wiLFxuXHRcdFx0XCIwIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XHRcIjUwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgfVwiLFxuXHRcdFx0XCIxMDAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyB9XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCJALXdlYmtpdC1rZXlmcmFtZXMgcHJlbG9hZGluZyB7XCIsXG5cdFx0XHRcIjAgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcdFwiNTAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyB9XCIsXG5cdFx0XHRcIjEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcIn1cIixcblx0XHRcIkAtbW96LWtleWZyYW1lcyBwcmVsb2FkaW5nIHtcIixcblx0XHRcdFwiMCB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFx0XCI1MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IH1cIixcblx0XHRcdFwiMTAwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1vei10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtbXMtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW8tdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgfVwiLFxuXHRcdFwifVwiLFxuXHRcdFwiQC1tcy1rZXlmcmFtZXMgcHJlbG9hZGluZyB7XCIsXG5cdFx0XHRcIjAgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcdFwiNTAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyB9XCIsXG5cdFx0XHRcIjEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcIn1cIixcblx0XHRcIkAtby1rZXlmcmFtZXMgcHJlbG9hZGluZyB7XCIsXG5cdFx0XHRcIjAgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcdFwiNTAlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwxNXB4KTsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtbW96LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMTVweCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyAtby10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDE1cHgpOyB9XCIsXG5cdFx0XHRcIjEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLDApOyAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1tb3otdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwwKTsgLW1zLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IC1vLXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsMCk7IH1cIixcblx0XHRcIn1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciB7XCIsXG5cdFx0XHRcInBvc2l0aW9uOiBhYnNvbHV0ZTtcIixcblx0XHRcdFwid2lkdGg6IDEwMCU7XCIsXG5cdFx0XHRcInRvcDogNTAlO1wiLFxuXHRcdFx0XCJtYXJnaW4tdG9wOiAtMThweDtcIixcblx0XHRcdFwidGV4dC1hbGlnbjogY2VudGVyO1wiLFxuXHRcdFwifVwiLFxuXHRcdFwiLnN3Yy13aWRnZXQtbG9hZGVyIHNwYW4ge1wiLFxuXHRcdFx0XCJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XCIsXG5cdFx0XHRcIndpZHRoOiAxOHB4O1wiLFxuXHRcdFx0XCJoZWlnaHQ6IDE4cHg7XCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXM6IDUwJTtcIixcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcIixcblx0XHRcdFwibWFyZ2luOiAzcHg7XCIsXG5cdFx0XCJ9XCIsXG5cdFx0XCIuc3djLXdpZGdldC1sb2FkZXIgc3BhbjpudGgtbGFzdC1jaGlsZCgxKSB7IC13ZWJraXQtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuMXMgbGluZWFyIGluZmluaXRlOyAtbW96LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgLW1zLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjFzIGxpbmVhciBpbmZpbml0ZTsgLW8tYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuMXMgbGluZWFyIGluZmluaXRlOyBhbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4xcyBsaW5lYXIgaW5maW5pdGU7IH1cIixcblx0XHRcIi5zd2Mtd2lkZ2V0LWxvYWRlciBzcGFuOm50aC1sYXN0LWNoaWxkKDIpIHsgLXdlYmtpdC1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4zcyBsaW5lYXIgaW5maW5pdGU7IC1tb3otYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyAtbXMtYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuM3MgbGluZWFyIGluZmluaXRlOyAtby1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC4zcyBsaW5lYXIgaW5maW5pdGU7IGFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjNzIGxpbmVhciBpbmZpbml0ZTsgfVwiLFxuXHRcdFwiLnN3Yy13aWRnZXQtbG9hZGVyIHNwYW46bnRoLWxhc3QtY2hpbGQoMykgeyAtd2Via2l0LWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjVzIGxpbmVhciBpbmZpbml0ZTsgLW1vei1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IC1tcy1hbmltYXRpb246IHByZWxvYWRpbmcgLjhzIC41cyBsaW5lYXIgaW5maW5pdGU7IC1vLWFuaW1hdGlvbjogcHJlbG9hZGluZyAuOHMgLjVzIGxpbmVhciBpbmZpbml0ZTsgYW5pbWF0aW9uOiBwcmVsb2FkaW5nIC44cyAuNXMgbGluZWFyIGluZmluaXRlOyB9XCIsXG5cdF0uam9pbihcIiBcIik7XG5cblx0c3R5bGUuaW5uZXJIVE1MID0gdGhlUnVsZXM7XG59XG5cbi8qKlxuICogU2V0IFdpZGdldCBldmVudCBsaXN0ZW5lcnNcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gd2lkZ2V0IC0gV2lkZ2V0IEhUTUwgZWxlbWVudFxuICovXG5mdW5jdGlvbiBzZXRMaXN0ZW5lcnMod2lkZ2V0KXtcblx0Ly8gdmFyIHNlbmRNc2dCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1zZW5kLW1lc3NhZ2UnKSxcblx0dmFyIGZpbGVTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1maWxlLXNlbGVjdCcpO1xuXHR2YXIgdGV4dEZpZWxkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbWVzc2FnZS10ZXh0Jyk7XG5cdHZhciBpbnB1dHMgPSBbXS5zbGljZS5jYWxsKHdpZGdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJytkZWZhdWx0cy5wcmVmaXgrJy1pbnB1dGZpbGUnKSk7XG5cdHZhciBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1idG4tY29udCcpO1xuXHR2YXIgcGFuZXMgPSBbXS5zbGljZS5jYWxsKHdpZGdldC5xdWVyeVNlbGVjdG9yQWxsKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1wYW5lJykpO1xuXHR2YXIgbWVzc2FnZXNDb250ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVmYXVsdHMucHJlZml4KyctbWVzc2FnZXMtY29udCcpO1xuXG5cdGlucHV0cy5mb3JFYWNoKGZ1bmN0aW9uKGlucHV0KXtcblx0XHR2YXIgbGFiZWwgPSBpbnB1dC5uZXh0RWxlbWVudFNpYmxpbmcsXG5cdFx0XHRsYWJlbFZhbCA9IGxhYmVsLnRleHRDb250ZW50O1xuXG5cdFx0YWRkRXZlbnQoaW5wdXQsICdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcblx0XHRcdHZhciBmaWxlTmFtZSA9IGUudGFyZ2V0LnZhbHVlLnNwbGl0KCAnXFxcXCcgKS5wb3AoKTtcblx0XHRcdGlmKGZpbGVOYW1lKVxuXHRcdFx0XHRsYWJlbC50ZXh0Q29udGVudCA9IGZpbGVOYW1lO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRsYWJlbC50ZXh0Q29udGVudCA9IGxhYmVsVmFsO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRhZGRFdmVudChidG4sICdjbGljaycsIGJ0bkNsaWNrSGFuZGxlcik7XG5cdGFkZEV2ZW50KHdpZGdldCwgJ2NsaWNrJywgd2dDbGlja0hhbmRsZXIpO1xuXHRhZGRFdmVudCh3aWRnZXQsICdzdWJtaXQnLCB3Z1N1Ym1pdEhhbmRsZXIpO1xuXHQvLyBhZGRFdmVudChzZW5kTXNnQnRuLCAnY2xpY2snLCB3Z1NlbmRNZXNzYWdlKTtcblx0YWRkRXZlbnQoZmlsZVNlbGVjdCwgJ2NoYW5nZScsIHdnU2VuZEZpbGUpO1xuXHRhZGRFdmVudCh0ZXh0RmllbGQsICdrZXlwcmVzcycsIHdnVHlwaW5nSGFuZGxlcik7XG5cdGFkZEV2ZW50KHRleHRGaWVsZCwgJ2ZvY3VzJywgd2dUZXh0YXJlYUZvY3VzSGFuZGxlcik7XG5cdGFkZEV2ZW50KHRleHRGaWVsZCwgJ2JsdXInLCB3Z1RleHRhcmVhQmx1ckhhbmRsZXIpO1xuXG5cdGFkZEV2ZW50KGdsb2JhbCwgJ0RPTU1vdXNlU2Nyb2xsJywgd2dHbG9iYWxTY3JvbGxIYW5kbGVyKTtcblx0YWRkRXZlbnQoZ2xvYmFsLCAnd2hlZWwnLCB3Z0dsb2JhbFNjcm9sbEhhbmRsZXIpO1xuXHQvLyB3aW5kb3cub250b3VjaG1vdmUgID0gd2dHbG9iYWxTY3JvbGxIYW5kbGVyOyAvLyBtb2JpbGVcblxuXHRhZGRFdmVudCh3aWRnZXQsICdtb3VzZWVudGVyJywgb25Nb3VzZUVudGVyKTtcblx0YWRkRXZlbnQod2lkZ2V0LCAnbW91c2VsZWF2ZScsIG9uTW91c2VMZWF2ZSk7XG5cblx0Ly8gaWYoZGVmYXVsdHMuYnV0dG9uRWxlbWVudCkgXG5cdC8vIFx0ZGVmYXVsdHMuYnV0dG9uRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHB1YmxpY0FwaS5vcGVuV2lkZ2V0LCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHNldEhhbmRsZXJzKHNlbGVjdG9yKSB7XG5cdHZhciBmbiA9IGRlZmF1bHRzLndpZGdldCA/IGluaXRXaWRnZXRTdGF0ZSA6IG9wZW5XaWRnZXQ7XG5cdHZhciBlbHMgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcblx0ZWxzLm1hcChmdW5jdGlvbihlbCkgeyBhZGRFdmVudChlbCwgJ2NsaWNrJywgZm4pOyByZXR1cm4gZWw7IH0pO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIFdpZGdldCBldmVudCBoYW5kbGVycyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIG9uTW91c2VFbnRlcigpIHtcblx0bW91c2VGb2N1c2VkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb25Nb3VzZUxlYXZlKCkge1xuXHRtb3VzZUZvY3VzZWQgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gd2dDbGlja0hhbmRsZXIoZSl7XG5cdHZhciB0YXJnID0gZS50YXJnZXQsXG5cdFx0aGFuZGxlcixcblx0XHRwYW5lLFxuXHRcdGhyZWYsXG5cdFx0ZGF0YUhyZWY7XG5cblx0aWYodGFyZy5wYXJlbnROb2RlLnRhZ05hbWUgPT09ICdBJyB8fCB0YXJnLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ0JVVFRPTicpXG5cdFx0dGFyZyA9IHRhcmcucGFyZW50Tm9kZTtcblx0XG5cdGhhbmRsZXIgPSB0YXJnLmdldEF0dHJpYnV0ZSgnZGF0YS0nK2RlZmF1bHRzLnByZWZpeCsnLWhhbmRsZXInKTtcblx0ZGF0YUhyZWYgPSB0YXJnLmdldEF0dHJpYnV0ZSgnZGF0YS0nK2RlZmF1bHRzLnByZWZpeCsnLWxpbmsnKTtcblxuXHRpZihoYW5kbGVyID09PSAnY2xvc2VXaWRnZXQnKSB7XG5cdFx0Y2xvc2VXaWRnZXQoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdmaW5pc2gnKSB7XG5cdFx0aWYoZGVmYXVsdHMuaXNJcGNjICYmIHN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnc2Vzc2lvbicpKSB7XG5cdFx0XHRzd2l0Y2hQYW5lKCdjbG9zZWNoYXQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2xvc2VDaGF0KCk7XG5cdFx0XHRjbG9zZVdpZGdldCgpO1xuXHRcdH1cblx0XHRcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICd0cmlnZ2VyU291bmRzJykge1xuXHRcdHRyaWdnZXJTb3VuZHMoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdzZW5kTWVzc2FnZScpIHtcblx0XHR3Z1NlbmRNZXNzYWdlKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnb3BlbldpbmRvdycpIHtcblx0XHRvcGVuV2lkZ2V0KCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAncmVqZWN0Rm9ybScpIHtcblx0XHRhcGkuZW1pdCgnZm9ybS9yZWplY3QnLCB7IGZvcm1OYW1lOiBfLmZpbmRQYXJlbnQodGFyZywgJ2Zvcm0nKS5uYW1lIH0pO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ2luaXRDYWxsJykge1xuXHRcdGluaXRDYWxsKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnaW5pdEZhbGxiYWNrQ2FsbCcpIHtcblx0XHRpbml0RmFsbGJhY2tDYWxsKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnaW5pdENhbGxiYWNrJykge1xuXHRcdGluaXRDYWxsYmFjaygpO1xuXHR9IGVsc2UgaWYoaGFuZGxlciA9PT0gJ3NldENhbGxiYWNrJykge1xuXHRcdHNldENhbGxiYWNrKCk7XG5cdH0gZWxzZSBpZihoYW5kbGVyID09PSAnaW5pdENoYXQnKSB7XG5cdFx0aW5pdENoYXQoKTtcblx0fSBlbHNlIGlmKGhhbmRsZXIgPT09ICdlbmRDYWxsJykge1xuXHRcdGVuZENhbGwoKTtcblx0fVxuXG5cdGlmKHRhcmcudGFnTmFtZSA9PT0gJ0EnKSB7XG5cdFx0aHJlZiA9IHRhcmcuaHJlZjtcblxuXHRcdGlmKGRhdGFIcmVmKSB7XG5cdFx0XHRhcGkubGlua0ZvbGxvd2VkKGRhdGFIcmVmKTtcblx0XHR9IGVsc2UgaWYoaHJlZi5pbmRleE9mKCcjJykgIT09IC0xKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRwYW5lID0gaHJlZi5zdWJzdHJpbmcodGFyZy5ocmVmLmluZGV4T2YoJyMnKSsxKTtcblx0XHRcdGlmKHBhbmUpIHN3aXRjaFBhbmUocGFuZSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGJ0bkNsaWNrSGFuZGxlcihlKXtcblx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0LFxuXHRcdGNsb3NlQnRuSWQgPSBkZWZhdWx0cy5wcmVmaXgrJy11bm5vdGlmeS1idG4nO1xuXHRcdGN1cnJUYXJnID0gZS5jdXJyZW50VGFyZ2V0O1xuXG5cdC8vIHJlbW92ZSBub3RpZmljYXRpb24gb2YgYSBuZXcgbWVzc2FnZVxuXHRpZih0YXJnLmlkID09PSBjbG9zZUJ0bklkIHx8IHRhcmcucGFyZW50Tm9kZS5pZCA9PT0gY2xvc2VCdG5JZCkge1xuXHRcdHJlbW92ZVdnU3RhdGUoJ25vdGlmaWVkJyk7XG5cdFx0Ly8gcmVzZXQgYnV0dG9uIGhlaWdodFxuXHRcdC8vIHJlc2V0U3R5bGVzKGJ0bi5jaGlsZHJlblswXSk7XG5cdFx0c2V0QnV0dG9uU3R5bGUod2lkZ2V0U3RhdGUuc3RhdGUpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmKGN1cnJUYXJnLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1idG4tY29udCcpIHtcblx0XHRpbml0V2lkZ2V0U3RhdGUoKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3Z0dsb2JhbFNjcm9sbEhhbmRsZXIoZSkge1xuXHR2YXIgdGFyZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblx0dmFyIGRpciA9IGdldFNjcm9sbERpcmVjdGlvbihlKTtcblx0aWYobW91c2VGb2N1c2VkKSB7XG5cdFx0aWYodGFyZy5zY3JvbGxUb3AgPT09IDAgJiYgZGlyID09PSAndXAnKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0gZWxzZSBpZiAodGFyZy5zY3JvbGxUb3AgPj0gKHRhcmcuc2Nyb2xsSGVpZ2h0LXRhcmcuY2xpZW50SGVpZ2h0KSAmJiBkaXIgPT09ICdkb3duJykge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsRGlyZWN0aW9uKGV2ZW50KSB7XG5cdHZhciBkZWx0YTtcblxuICAgIGlmKGV2ZW50LndoZWVsRGVsdGEpIHtcbiAgICAgICAgZGVsdGEgPSBldmVudC53aGVlbERlbHRhO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhID0gLTEgKiBldmVudC5kZWx0YVk7XG4gICAgfVxuXG4gICAgaWYoZGVsdGEgPCAwKSB7XG4gICAgICAgIHJldHVybiBcImRvd25cIjtcbiAgICB9IGVsc2UgaWYoZGVsdGEgPiAwKSB7XG4gICAgICAgIHJldHVybiBcInVwXCI7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc09mZmxpbmUoKSB7XG5cdHZhciBzdGF0ZSA9IGdldFdpZGdldFN0YXRlKCk7XG5cdHJldHVybiBzdGF0ZSA9PT0gJ29mZmxpbmUnO1xufVxuXG5mdW5jdGlvbiBpbml0V2lkZ2V0U3RhdGUoZSl7XG5cdGlmKGUpIGUucHJldmVudERlZmF1bHQoKTtcblx0dmFyIGNoYXRJblByb2dyZXNzID0gc3RvcmFnZS5nZXRTdGF0ZSgnY2hhdCcsICdzZXNzaW9uJyk7XG5cdHZhciB3YXNPcGVuZWQgPSBzdG9yYWdlLmdldFN0YXRlKCdvcGVuZWQnLCAnc2Vzc2lvbicpO1xuXHR2YXIgY2FsbEluUHJvZ3Jlc3MgPSBzdG9yYWdlLmdldFN0YXRlKCdjYWxsJywgJ2NhY2hlJyk7XG5cblx0ZGVidWcubG9nKCdpbml0V2lkZ2V0U3RhdGUnKTtcblxuXHQvLyBJZiBlbGVtZW50IGlzIGludGVyYWN0ZWQsIHRoZW4gbm8gbm90aWZpY2F0aW9ucyBvZiBhIG5ldyBtZXNzYWdlIFxuXHQvLyB3aWxsIG9jY3VyIGR1cmluZyBjdXJyZW50IGJyb3dzZXIgc2Vzc2lvblxuXHRzZXRJbnRlcmFjdGVkKCk7XG5cdC8vIElmIHRpbWVvdXQgaXMgb2NjdXJlZCwgaW5pdCBzZXNzaW9uIGZpcnN0XG5cdGlmKGhhc1dnU3RhdGUoJ3RpbWVvdXQnKSkge1xuXHRcdGluaXRNb2R1bGUoKTtcblx0fSBlbHNlIGlmKGNoYXRJblByb2dyZXNzKXtcblx0XHRzaG93V2lkZ2V0KCk7XG5cdH0gZWxzZSBpZihpc09mZmxpbmUoKSl7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdFx0c2hvd1dpZGdldCgpO1xuXHR9IGVsc2UgaWYoZGVmYXVsdHMud2VicnRjRW5hYmxlZCl7XG5cdFx0Ly8gaWYgY2FsbCBpcyBpbiBwcm9ncmVzcyAtIGp1c3Qgc2hvdyB0aGUgd2lkZ2V0XG5cdFx0aWYoY2FsbEluUHJvZ3Jlc3MpIHtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIWRlZmF1bHRzLmNoYXQgJiYgIWRlZmF1bHRzLmNoYW5uZWxzLmNhbGxiYWNrLnRhc2spIHtcblx0XHRcdFx0aW5pdENhbGwoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN3aXRjaFBhbmUoJ2Nob29zZUNvbm5lY3Rpb24nKTtcblx0XHRcdH1cblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9XG5cdH0gZWxzZSBpZihkZWZhdWx0cy5jaGFubmVscy5jYWxsYmFjay50YXNrKSB7XG5cdFx0aWYoIWRlZmF1bHRzLmNoYXQgJiYgIWRlZmF1bHRzLndlYnJ0Y0VuYWJsZWQpIHtcblx0XHRcdHN3aXRjaFBhbmUoJ2NhbGxiYWNrJyk7XG5cdFx0XHRzaG93V2lkZ2V0KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN3aXRjaFBhbmUoJ2Nob29zZUNvbm5lY3Rpb24nKTtcblx0XHRcdHNob3dXaWRnZXQoKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0aW5pdENoYXQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3Z1NlbmRNZXNzYWdlKCl7XG5cdHZhciBtc2csXG5cdFx0dGV4dGFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWZhdWx0cy5wcmVmaXgrJy1tZXNzYWdlLXRleHQnKTtcblxuXHRtc2cgPSB0ZXh0YXJlYS52YWx1ZS50cmltKCk7XG5cdGlmKG1zZykge1xuXG5cdFx0aWYoIXN0b3JhZ2UuZ2V0U3RhdGUoJ2NoYXQnLCAnc2Vzc2lvbicpKSB7XG5cdFx0XHRpbml0Q2hhdCgpO1xuXHRcdH1cblxuXHRcdHNlbmRNZXNzYWdlKHsgbWVzc2FnZTogbXNnIH0pO1xuXHRcdHRleHRhcmVhLnZhbHVlID0gJyc7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3Z1R5cGluZ0hhbmRsZXIoZSl7XG5cdHZhciB0YXJnID0gZS50YXJnZXQ7XG5cdHZhciBjbG9uZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3djLW1lc3NhZ2UtdGV4dC1jbG9uZVwiKTtcblxuXHRpZihlLmtleUNvZGUgPT09IDEwIHx8IGUua2V5Q29kZSA9PT0gMTMpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0d2dTZW5kTWVzc2FnZSgpO1xuXHR9IGVsc2Uge1xuXHRcdGlmKCF1c2VySXNUeXBpbmdUaW1lb3V0KSB7XG5cdFx0XHR1c2VySXNUeXBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0dXNlcklzVHlwaW5nVGltZW91dCA9IG51bGw7XG5cdFx0XHRcdGFwaS51c2VySXNUeXBpbmcoKTtcblx0XHRcdH0sIDEwMDApO1xuXHRcdH1cblx0fVxuXG5cdGNsb25lLmlubmVyVGV4dCA9IHRhcmcudmFsdWU7XG5cdHRhcmcuc3R5bGUuaGVpZ2h0ID0gY2xvbmUuY2xpZW50SGVpZ2h0KydweCc7XG5cblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPj0gODAgJiYgIWhhc1dnU3RhdGUoJ3R5cGUtZXh0ZW5kJykpXG5cdC8vIFx0YWRkV2dTdGF0ZSgndHlwZS1leHRlbmQnKTtcblx0Ly8gaWYodGFyZy52YWx1ZS5sZW5ndGggPCA4MCAmJiBoYXNXZ1N0YXRlKCd0eXBlLWV4dGVuZCcpKVxuXHQvLyBcdHJlbW92ZVdnU3RhdGUoJ3R5cGUtZXh0ZW5kJyk7XG59XG5cbmZ1bmN0aW9uIHdnVGV4dGFyZWFGb2N1c0hhbmRsZXIoZSkge1xuXHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cdHRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9IGRlZmF1bHRzLnN0eWxlcy5wcmltYXJ5LmJhY2tncm91bmRDb2xvcjtcbn1cblxuZnVuY3Rpb24gd2dUZXh0YXJlYUJsdXJIYW5kbGVyKGUpIHtcblx0dmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXHR0YXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIiNmZmZcIjtcbn1cblxuZnVuY3Rpb24gd2dTdWJtaXRIYW5kbGVyKGUpe1xuXHR2YXIgdGFyZyA9IGUudGFyZ2V0O1xuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdGlmKHRhcmcudGFnTmFtZSA9PT0gJ0ZPUk0nKVxuXHRcdGFwaS5lbWl0KCdmb3JtL3N1Ym1pdCcsIHsgZm9ybUVsZW1lbnQ6IHRhcmcsIGZvcm1EYXRhOiBnZXRGb3JtRGF0YSh0YXJnKSB9KTtcbn1cblxuZnVuY3Rpb24gd2dTZW5kRmlsZShlKXtcblx0dmFyIHRhcmcgPSBlLnRhcmdldDtcblx0dmFyIGZpbGUgPSBnZXRGaWxlQ29udGVudCh0YXJnLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuXHRcdGRlYnVnLmxvZygnd2dTZW5kRmlsZTogJywgZXJyLCByZXN1bHQpO1xuXHRcdGlmKGVycikge1xuXHRcdFx0aWYoZnJhc2VzLkVSUk9SU1tlcnJdKSBhbGVydChmcmFzZXMuRVJST1JTW2Vycl0pXG5cdFx0XHRyZXR1cm4gZGVidWcud2FybignRmlsZSB3YXNuXFwndCBzZW50Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbmRNZXNzYWdlKHsgbWVzc2FnZTogcmVzdWx0LmZpbGVuYW1lLCBmaWxlOiByZXN1bHQuZmlsZWRhdGEgfSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBXaWRnZXQgZWxlbWVudHMgbWFuaXB1bGF0aW9uICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuZnVuY3Rpb24gc3dpdGNoUGFuZShwYW5lKXtcblx0Ly8gdmFyIHBhbmVJZCA9IGRlZmF1bHRzLnByZWZpeCsnLScrcGFuZSsnLXBhbmUnO1xuXHR2YXIgYXR0ciA9ICdkYXRhLScrZGVmYXVsdHMucHJlZml4KyctcGFuZSc7XG5cdHZhciBwYW5lcyA9IFtdLnNsaWNlLmNhbGwod2lkZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy4nK2RlZmF1bHRzLnByZWZpeCsnLXdnLXBhbmUnKSk7XG5cdC8vIGRlYnVnLmxvZygnc3dpdGNoUGFuZSBwYW5lczonLCBwYW5lcywgJ3BhbmU6ICcsIHBhbmUpO1xuXHRwYW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdGlmKGl0ZW0uZ2V0QXR0cmlidXRlKGF0dHIpID09PSBwYW5lKSB7XG5cdFx0XHRpdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gaWYoIXdpZGdldFN0YXRlLmFjdGl2ZSkgc2hvd1dpZGdldCgpO1xufVxuXG5mdW5jdGlvbiBjaGFuZ2VXZ1N0YXRlKHBhcmFtcyl7XG5cdGRlYnVnLmxvZygnY2hhbmdlV2dTdGF0ZTogJywgcGFyYW1zKTtcblx0aWYoIXdpZGdldCB8fCB3aWRnZXRTdGF0ZS5zdGF0ZSA9PT0gcGFyYW1zLnN0YXRlKSByZXR1cm47XG5cdGlmKHBhcmFtcy5zdGF0ZSA9PT0gJ29mZmxpbmUnKSB7XG5cdFx0Y2xvc2VDaGF0KCk7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgnb25saW5lJyk7XG5cdFx0c3dpdGNoUGFuZSgnc2VuZGVtYWlsJyk7XG5cdH0gZWxzZSBpZihwYXJhbXMuc3RhdGUgPT09ICdvbmxpbmUnKSB7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgnb2ZmbGluZScpO1xuXHRcdFxuXHR9XG5cblx0dmFyIHN0YXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicrZGVmYXVsdHMucHJlZml4Kyctd2ctc3RhdGUnKTtcblx0aWYoc3RhdGUpIHN0YXRlLnRleHRDb250ZW50ID0gZnJhc2VzLlRPUF9CQVIuU1RBVFVTW3BhcmFtcy5zdGF0ZV07XG5cblx0d2lkZ2V0U3RhdGUuc3RhdGUgPSBwYXJhbXMuc3RhdGU7XG5cdGFkZFdnU3RhdGUocGFyYW1zLnN0YXRlKTtcblx0c2V0QnV0dG9uU3R5bGUocGFyYW1zLnN0YXRlKTtcblx0YXBpLmVtaXQoJ3dpZGdldC9zdGF0ZWNoYW5nZScsIHsgc3RhdGU6IHBhcmFtcy5zdGF0ZSB9KTtcblx0XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldFN0YXRlKCkge1xuXHR2YXIgc3RhdGUgPSAnJzsgXG5cdGlmKGRlZmF1bHRzLmlzSXBjYylcblx0XHRzdGF0ZSA9IHdpZGdldFN0YXRlLnN0YXRlID8gd2lkZ2V0U3RhdGUuc3RhdGUgOiAobGFuZ3MubGVuZ3RoID8gJ29ubGluZScgOiAnb2ZmbGluZScpO1xuXHRlbHNlXG5cdFx0c3RhdGUgPSB3aWRnZXRTdGF0ZS5zdGF0ZSA/IHdpZGdldFN0YXRlLnN0YXRlIDogKGFwaS5zZXNzaW9uLnN0YXRlID8gJ29ubGluZScgOiAnb2ZmbGluZScpO1xuXHRcblx0cmV0dXJuIHN0YXRlO1xufVxuXG5mdW5jdGlvbiBzZXRTdHlsZXMoKSB7XG5cdHZhciB3Z0J0biA9IHdpZGdldC5xdWVyeVNlbGVjdG9yKCcuJytkZWZhdWx0cy5wcmVmaXgrJy13Zy1idG4nKTtcblxuXHRkZWJ1Zy5sb2coJ3NldFN0eWxlczogJywgd2dCdG4sIGRlZmF1bHRzLmJ1dHRvblN0eWxlcyk7XG5cblx0d2dCdG4uc3R5bGUuYm9yZGVyUmFkaXVzID0gZGVmYXVsdHMuYnV0dG9uU3R5bGVzLmJvcmRlclJhZGl1cztcblx0d2dCdG4uc3R5bGUuYm94U2hhZG93ID0gZGVmYXVsdHMuYnV0dG9uU3R5bGVzLmJveFNoYWRvdztcbn1cblxuLy8gVE9ETzogVGhpcyBpcyBub3QgYSBnb29kIHNvbHV0aW9uIG9yIG1heWJlIG5vdCBhIGdvb2QgaW1wbGVtZW50YXRpb25cbmZ1bmN0aW9uIHNldEJ1dHRvblN0eWxlKHN0YXRlKSB7XG5cdC8vIGRlYnVnLmxvZygnc2V0QnV0dG9uU3R5bGU6ICcsIHN0YXRlKTtcblx0aWYoIXdpZGdldCB8fCBkZWZhdWx0cy5idXR0b25TdHlsZXNbc3RhdGVdID09PSB1bmRlZmluZWQpIHJldHVybjtcblx0dmFyIHdnQnRuID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3IoJy4nK2RlZmF1bHRzLnByZWZpeCsnLXdnLWJ0bicpLFxuXHRcdGJ0bkljb24gPSB3aWRnZXQucXVlcnlTZWxlY3RvcignLicrZGVmYXVsdHMucHJlZml4KyctYnRuLWljb24nKTtcblxuXHR3Z0J0bi5zdHlsZS5iYWNrZ3JvdW5kID0gZGVmYXVsdHMuYnV0dG9uU3R5bGVzW3N0YXRlXS5iYWNrZ3JvdW5kQ29sb3I7XG5cdGJ0bkljb24uc3R5bGUuY29sb3IgPSBkZWZhdWx0cy5idXR0b25TdHlsZXNbc3RhdGVdLmNvbG9yIHx8IGRlZmF1bHRzLmJ1dHRvblN0eWxlcy5jb2xvcjtcbn1cblxuZnVuY3Rpb24gYWRkV2dTdGF0ZShzdGF0ZSl7XG5cdGlmKHdpZGdldCkgd2lkZ2V0LmNsYXNzTGlzdC5hZGQoc3RhdGUpO1xufVxuXG5mdW5jdGlvbiBoYXNXZ1N0YXRlKHN0YXRlKXtcblx0aWYod2lkZ2V0KSByZXR1cm4gd2lkZ2V0LmNsYXNzTGlzdC5jb250YWlucyhzdGF0ZSk7XG5cdGVsc2UgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVXZ1N0YXRlKHN0YXRlKXtcblx0aWYod2lkZ2V0KSB3aWRnZXQuY2xhc3NMaXN0LnJlbW92ZShzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIHNob3dXaWRnZXQoKXtcblx0dmFyIG1lc3NhZ2VzQ29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblxuXHR3aWRnZXRTdGF0ZS5hY3RpdmUgPSB0cnVlO1xuXHRzdG9yYWdlLnNhdmVTdGF0ZSgnb3BlbmVkJywgdHJ1ZSwgJ3Nlc3Npb24nKTtcblx0YWRkV2dTdGF0ZSgnYWN0aXZlJyk7XG5cdHJlbW92ZVdnU3RhdGUoJ25vdGlmaWVkJyk7XG5cblx0Ly8gcmVzZXQgYnV0dG9uIGhlaWdodFxuXHQvLyByZXNldFN0eWxlcyhidG4uY2hpbGRyZW5bMF0pO1xuXHRzZXRCdXR0b25TdHlsZSh3aWRnZXRTdGF0ZS5zdGF0ZSk7XG5cblx0bWVzc2FnZXNDb250LnNjcm9sbFRvcCA9IG1lc3NhZ2VzQ29udC5zY3JvbGxIZWlnaHQ7XG59XG5cbmZ1bmN0aW9uIGNsb3NlV2lkZ2V0KCl7XG5cdGlmKHdpbmRvdy5vcGVuZXIpIHtcblx0XHR3aW5kb3cuY2xvc2UoKTtcblx0fSBlbHNlIHtcblx0XHR3aWRnZXRTdGF0ZS5hY3RpdmUgPSBmYWxzZTtcblx0XHRzdG9yYWdlLnNhdmVTdGF0ZSgnb3BlbmVkJywgZmFsc2UsICdzZXNzaW9uJyk7XG5cdFx0cmVtb3ZlV2dTdGF0ZSgnYWN0aXZlJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gb25Gb3JtU3VibWl0KHBhcmFtcyl7XG5cdHZhciBmb3JtID0gcGFyYW1zLmZvcm1FbGVtZW50O1xuXHR2YXIgZm9ybURhdGEgPSBwYXJhbXMuZm9ybURhdGE7XG5cdGRlYnVnLmxvZygnb25Gb3JtU3VibWl0OiAnLCBmb3JtLCBmb3JtRGF0YSk7XG5cdGlmKGZvcm0uZ2V0QXR0cmlidXRlKCdkYXRhLXZhbGlkYXRlLWZvcm0nKSkge1xuXHRcdHZhciB2YWxpZCA9IHZhbGlkYXRlRm9ybShmb3JtKTtcblx0XHRpZighdmFsaWQpIHJldHVybjtcblx0XHQvLyBkZWJ1Zy5sb2coJ29uRm9ybVN1Ym1pdCB2YWxpZDogJywgdmFsaWQpO1xuXHR9XG5cdGlmKGZvcm0uaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLWNsb3NlY2hhdC1mb3JtJykge1xuXHRcdHN1Ym1pdENsb3NlQ2hhdEZvcm0oZm9ybSwgZm9ybURhdGEpO1xuXHR9IGVsc2UgaWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4Kyctc2VuZG1haWwtZm9ybScpIHtcblx0XHRzdWJtaXRTZW5kTWFpbEZvcm0oZm9ybSwgZm9ybURhdGEpO1xuXHR9IGVsc2UgaWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctaW50cm8tZm9ybScpIHtcblx0XHRyZXF1ZXN0Q2hhdChmb3JtRGF0YSk7XG5cdH0gZWxzZSBpZihmb3JtLmlkID09PSBkZWZhdWx0cy5wcmVmaXgrJy1jYWxsLWJ0bi1mb3JtJyl7XG5cdFx0aW5pdENhbGwoKTtcblx0fSBlbHNlIGlmKGZvcm0uaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLWNoYXQtYnRuLWZvcm0nKXtcblx0XHRpbml0Q2hhdCgpO1xuXHR9IGVsc2UgaWYoZm9ybS5pZCA9PT0gZGVmYXVsdHMucHJlZml4KyctcXVldWVfb3ZlcmxvYWQnKXtcblx0XHRzZW5kUmVxdWVzdChmb3JtRGF0YSk7XG5cdFx0Y2xvc2VGb3JtKHsgZm9ybU5hbWU6IGZvcm0ubmFtZSB9LCB0cnVlKTtcblx0fSBlbHNlIGlmKGZvcm0uaWQgPT09IGRlZmF1bHRzLnByZWZpeCsnLXJlcXVlc3RfYnJvd3Nlcl9hY2Nlc3MnKXtcblx0XHRqb2luU2Vzc2lvbih7IHVybDogZ2xvYmFsLmxvY2F0aW9uLmhyZWYgfSk7XG5cdFx0Y2xvc2VGb3JtKHsgZm9ybU5hbWU6IGZvcm0ubmFtZSB9LCB0cnVlKTtcblx0XHRjbG9zZVdpZGdldCgpO1xuXHR9IGVsc2Uge1xuXHRcdGNsb3NlRm9ybSh7IGZvcm1OYW1lOiBmb3JtLm5hbWUgfSwgdHJ1ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY2xvc2VGb3JtKHBhcmFtcywgc3VibWl0dGVkKXtcblx0dmFyIGZvcm0gPSBnbG9iYWxbcGFyYW1zLmZvcm1OYW1lXTtcblx0aWYoIWZvcm0pIHJldHVybiBmYWxzZTtcblx0aWYoc3VibWl0dGVkKSB7XG5cdFx0Zm9ybS5vdXRlckhUTUwgPSAnPHAgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtY2VudGVyXCI+Jytcblx0XHRcdFx0XHRcdFx0JzxpIGNsYXNzPVwiJytkZWZhdWx0cy5wcmVmaXgrJy10ZXh0LXN1Y2Nlc3MgJytkZWZhdWx0cy5wcmVmaXgrJy1pY29uLWNoZWNrXCI+PC9pPicrXG5cdFx0XHRcdFx0XHRcdCc8c3Bhbj4gJytmcmFzZXMuRk9STVMuc3VibWl0dGVkKyc8L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L3A+Jztcblx0fSBlbHNlIHtcblx0XHRmb3JtLm91dGVySFRNTCA9ICc8cCBjbGFzcz1cIicrZGVmYXVsdHMucHJlZml4KyctdGV4dC1jZW50ZXJcIj4nK1xuXHRcdFx0XHRcdFx0XHQnPGkgY2xhc3M9XCInK2RlZmF1bHRzLnByZWZpeCsnLXRleHQtZGFuZ2VyICcrZGVmYXVsdHMucHJlZml4KyctaWNvbi1yZW1vdmVcIj48L2k+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPiAnK2ZyYXNlcy5GT1JNUy5jYW5jZWxlZCsnPC9zcGFuPicrXG5cdFx0XHRcdFx0XHQnPC9wPic7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0RmlsZUNvbnRlbnQoZWxlbWVudCwgY2Ipe1xuXHR2YXIgZmlsZXMgPSBlbGVtZW50LmZpbGVzLFxuXHRcdGZpbGUsXG5cdFx0ZGF0YSxcblx0XHRyZWFkZXI7XG5cblx0aWYoIWZpbGVzLmxlbmd0aCkgcmV0dXJuO1xuXHRpZighZ2xvYmFsLkZpbGVSZWFkZXIpIHtcblx0XHRpZihjYikgY2IoJ09CU09MRVRFX0JST1dTRVInKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmaWxlID0gZmlsZXNbMF07XG5cblx0dmFyIGVycm9ycyA9IGNoZWNrRmlsZVBhcmFtcyhmaWxlKTtcblxuXHRpZihlcnJvcnMubGVuZ3RoKSByZXR1cm4gY2IoZXJyb3JzWzBdKTtcblxuXHR2YXIgYmxvYiA9IG5ldyBCbG9iKFtmaWxlXSwgeyB0eXBlOiBmaWxlLnR5cGUgfSk7XG5cdHJldHVybiBjYihudWxsLCB7IGZpbGVkYXRhOiBibG9iLCBmaWxlbmFtZTogZmlsZS5uYW1lIH0pO1xuXG5cdC8vIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdC8vIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldmVudCkge1xuXHQvLyBcdGRhdGEgPSBldmVudC50YXJnZXQucmVzdWx0O1xuXHQvLyBcdC8vIGRhdGEgPSBkYXRhLnN1YnN0cmluZyhkYXRhLmluZGV4T2YoJywnKSsxKTtcblx0Ly8gXHRpZihjYikgY2IobnVsbCwgeyBmaWxlZGF0YTogZGF0YSwgZmlsZW5hbWU6IGZpbGUubmFtZSB9KTtcblx0Ly8gfTtcblx0Ly8gcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHQvLyBcdGFwaS5lbWl0KCdFcnJvcicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdC8vIFx0aWYoY2IpIGNiKGV2ZW50LnRhcmdldC5lcnJvcik7XG5cdC8vIH07XG5cdC8vIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xufVxuXG5mdW5jdGlvbiBjaGVja0ZpbGVQYXJhbXMoZmlsZSkge1xuXHRkZWJ1Zy5sb2coJ2NoZWNrRmlsZVBhcmFtczogJywgZmlsZSwgZmlsZS5zaXplLCBmaWxlLm5hbWUsIGRlZmF1bHRzLmFsbG93ZWRGaWxlRXh0ZW5zaW9ucywgKGRlZmF1bHRzLm1heEZpbGVTaXplKjEwMDAqMTAwMCkpO1x0XG5cdHZhciBlcnJvcnMgPSBbXTtcblx0dmFyIGZpbGVFeHQgPSBmaWxlLm5hbWUuc3BsaXQoJy4nKVtmaWxlLm5hbWUuc3BsaXQoJy4nKS5sZW5ndGgtMV07XG5cdGlmKGZpbGVFeHQgJiYgZGVmYXVsdHMuYWxsb3dlZEZpbGVFeHRlbnNpb25zICYmIGRlZmF1bHRzLmFsbG93ZWRGaWxlRXh0ZW5zaW9ucy5sZW5ndGggJiYgZGVmYXVsdHMuYWxsb3dlZEZpbGVFeHRlbnNpb25zLmluZGV4T2YoZmlsZUV4dC50b0xvd2VyQ2FzZSgpKSA9PT0gLTEpIGVycm9ycy5wdXNoKCdmaWxlX3R5cGVfZXJyb3InKTtcblx0aWYoZGVmYXVsdHMubWF4RmlsZVNpemUgJiYgKGRlZmF1bHRzLm1heEZpbGVTaXplKjEwMDAqMTAwMCkgPCBmaWxlLnNpemUpIGVycm9ycy5wdXNoKCdmaWxlX3NpemVfZXJyb3InKTtcblxuXG5cdGRlYnVnLmxvZygnY2hlY2tGaWxlUGFyYW1zIGVycm9yczogJywgZXJyb3JzKTtcdFxuXG5cdHJldHVybiBlcnJvcnM7XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVUZW1wbGF0ZSh0ZW1wbGF0ZSwgZGF0YSl7XG5cdHZhciBjb21waWxlZCA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XG5cdHJldHVybiBjb21waWxlZChkYXRhKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJXZ01lc3NhZ2VzKCkge1xuXHR2YXIgY29udCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlZmF1bHRzLnByZWZpeCsnLW1lc3NhZ2VzLWNvbnQnKTtcblx0dmFyIGNsb25lID0gY29udC5jbG9uZU5vZGUoKTtcblx0Y29udC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjbG9uZSwgY29udCk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogSGVscGVyIGZ1bmN0aW9ucyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIGJyb3dzZXJJc09ic29sZXRlKCkge1xuXHRkZWJ1Zy53YXJuKCdZb3VyIGJyb3dzZXIgaXMgb2Jzb2xldGUhJyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGltZSh0cykge1xuXHR2YXIgZGF0ZSA9IG5ldyBEYXRlKCh0eXBlb2YgdHMgPT09ICdzdHJpbmcnID8gcGFyc2VJbnQodHMsIDEwKSA6IHRzKSksXG5cdFx0aG91cnMgPSBkYXRlLmdldEhvdXJzKCksXG5cdFx0bWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpLFxuXHRcdHRpbWUgPSAoaG91cnMgPCAxMCA/ICcwJytob3VycyA6IGhvdXJzKSArICc6JyArIChtaW51dGVzIDwgMTAgPyAnMCcrbWludXRlcyA6IG1pbnV0ZXMpO1xuXG5cdHJldHVybiB0aW1lO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1lc3NhZ2UodGV4dCwgZmlsZSwgZW50aXR5KXtcblx0dmFyIGZpbGVuYW1lLCBmb3JtO1xuXHRpZihmaWxlKSB7XG5cdFx0ZmlsZW5hbWUgPSB0ZXh0LnN1YnN0cmluZyh0ZXh0LmluZGV4T2YoJ18nKSsxKTtcblx0XHRpZihpc0ltYWdlKGZpbGUpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0XHRjb250ZW50OiAnPGEgaHJlZj1cIicrYXBpLm9wdGlvbnMuc2VydmVyKycvaXBjYy8nK3RleHQrJ1wiIGRvd25sb2FkPVwiJytmaWxlbmFtZSsnXCI+JyArXG5cdFx0XHRcdFx0XHQnPGltZyBzcmM9XCInK2FwaS5vcHRpb25zLnNlcnZlcisnL2lwY2MvJyt0ZXh0KydcIiBhbHQ9XCJmaWxlIHByZXZpZXdcIiAvPicgK1xuXHRcdFx0XHRcdCc8L2E+J1xuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZTogJ2ZpbGUnLFxuXHRcdFx0XHRjb250ZW50OiAnPGEgaHJlZj1cIicrYXBpLm9wdGlvbnMuc2VydmVyKycvaXBjYy8nK3RleHQrJ1wiIGRvd25sb2FkPVwiJytmaWxlbmFtZSsnXCI+JytmaWxlbmFtZSsnPC9hPidcblx0XHRcdH07XG5cdFx0fVxuXHR9IGVsc2UgaWYoZW50aXR5ID09PSAnYWdlbnQnICYmIGlzTGluayh0ZXh0KSAmJiBpc0ltYWdlKHRleHQpKSB7XG5cdFx0ZmlsZW5hbWUgPSB0ZXh0LnN1YnN0cmluZyh0ZXh0LmluZGV4T2YoJ18nKSsxKVxuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0Y29udGVudDogJzxhIGhyZWY9XCInK3RleHQrJ1wiIHRhcmdldD1cIl9ibGFua1wiPicgK1xuXHRcdFx0XHRcdCc8aW1nIHNyYz1cIicrdGV4dCsnXCIgYWx0PVwiJytmaWxlbmFtZSsnXCIgLz4nICtcblx0XHRcdFx0JzwvYT4nXG5cdFx0fTtcblx0fSBlbHNlIGlmKGVudGl0eSA9PT0gJ2FnZW50JyAmJiBuZXcgUmVnRXhwKCdeey4rfSQnKS50ZXN0KHRleHQpKSB7XG5cdFx0Zm9ybXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRpZihpdGVtLm5hbWUgPT09IHRleHQuc3Vic3RyaW5nKDEsIHRleHQubGVuZ3RoLTEpKSB7XG5cdFx0XHRcdGZvcm0gPSBpdGVtO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IGZvcm0gPyAnZm9ybScgOiAndGV4dCcsXG5cdFx0XHRjb250ZW50OiBmb3JtID8gZm9ybSA6IHRleHRcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRjb250ZW50OiB0ZXh0LnJlcGxhY2UoL1xcbi9nLCAnIDxicj4gJykuc3BsaXQoXCIgXCIpLm1hcChjb252ZXJ0TGlua3MpLmpvaW4oXCIgXCIpLnJlcGxhY2UoJyA8YnI+ICcsICc8YnI+Jylcblx0XHR9O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaW5rcyh0ZXh0KXtcblx0dmFyIGxlZnRvdmVycyA9IDA7XG5cdHZhciBocmVmID0gdGV4dDtcblx0aWYoaXNMaW5rKHRleHQpKXtcblxuXHRcdHdoaWxlKCEoaHJlZi5jaGFyQXQoaHJlZi5sZW5ndGgtMSkubWF0Y2goL1thLXowLTlcXC9dL2kpKSl7XG5cdFx0XHRocmVmID0gaHJlZi5zbGljZSgwLC0xKTtcblx0XHRcdGxlZnRvdmVycyArPSAxO1xuXHRcdH1cblxuXHRcdGRlYnVnLmxvZygnY29udmVydExpbmtzOiAnLCBocmVmKTtcblxuXHRcdHJldHVybiAnPGEgaHJlZj1cIicrKGhyZWYuaW5kZXhPZignd3d3LicpICE9PSAtMSA/ICgnaHR0cDovLycraHJlZikgOiBocmVmKSsnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgZGF0YS0nK2RlZmF1bHRzLnByZWZpeCsnLWxpbms9XCInK2hyZWYrJ1wiPicraHJlZisnPC9hPicgKyB0ZXh0LnN1YnN0cih0ZXh0Lmxlbmd0aCAtIGxlZnRvdmVycyk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHRleHQ7XG5cdH1cbn1cblxuZnVuY3Rpb24gaXNMaW5rKHRleHQpe1xuXHR2YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAoJ15odHRwOlxcL1xcL3xeaHR0cHM6XFwvXFwvfF53d3dcXC5bYS16QS16MC05LV0qLlthLXpBLVowLTldJyk7XG5cdHJldHVybiBwYXR0ZXJuLnRlc3QodGV4dCk7XG59XG5cbmZ1bmN0aW9uIGlzSW1hZ2UoZmlsZW5hbWUpe1xuXHR2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCdwbmd8UE5HfGpwZ3xKUEd8SlBFR3xqcGVnfGdpZnxHSUYnKTtcblx0dmFyIGV4dCA9IGZpbGVuYW1lLnN1YnN0cmluZyhmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpKzEpO1xuXHRyZXR1cm4gcmVnZXgudGVzdChleHQpO1xufVxuXG5mdW5jdGlvbiBnZXRGb3JtRGF0YShmb3JtKXtcblx0dmFyIGZvcm1EYXRhID0ge307XG5cdFtdLnNsaWNlLmNhbGwoZm9ybS5lbGVtZW50cykuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuXHRcdGlmKGVsLnR5cGUgPT09ICdjaGVja2JveCcpIGZvcm1EYXRhW2VsLm5hbWVdID0gZWwuY2hlY2tlZDtcblx0XHRlbHNlIHtcblx0XHRcdGlmKGVsLnZhbHVlKSBmb3JtRGF0YVtlbC5uYW1lXSA9IGVsLnZhbHVlO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBmb3JtRGF0YTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVGb3JtKGZvcm0pe1xuXHR2YXIgdmFsaWQgPSB0cnVlO1xuXHRbXS5zbGljZS5jYWxsKGZvcm0uZWxlbWVudHMpLmV2ZXJ5KGZ1bmN0aW9uKGVsKSB7XG5cdFx0Ly8gZGVidWcubG9nKCd2YWxpZGF0ZUZvcm0gZWw6JywgZWwsIGVsLmhhc0F0dHJpYnV0ZSgncmVxdWlyZWQnKSwgZWwudmFsdWUsIGVsLnR5cGUpO1xuXHRcdGlmKGVsLmhhc0F0dHJpYnV0ZSgncmVxdWlyZWQnKSAmJiAoZWwudmFsdWUgPT09IFwiXCIgfHwgZWwudmFsdWUgPT09IG51bGwpKSB7XG5cdFx0XHRhbGVydChmcmFzZXMuRVJST1JTW2VsLnR5cGVdIHx8IGZyYXNlcy5FUlJPUlMucmVxdWlyZWQpO1xuXHRcdFx0dmFsaWQgPSBmYWxzZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9KTtcblx0Ly8gZGVidWcubG9nKCd2YWxpZGF0ZUZvcm0gdmFsaWQ6ICcsIHZhbGlkKTtcblx0cmV0dXJuIHZhbGlkO1xufVxuXG4vLyBmdW5jdGlvbiByZXNldFN0eWxlcyhlbGVtZW50KXtcbi8vIFx0ZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4vLyB9XG5cbmZ1bmN0aW9uIGFkZFdpZGdldFN0eWxlcygpe1xuXHRcblx0dmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG5cdFx0bGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG5cdFx0bGluay5ocmVmID0gZGVmYXVsdHMuc3R5bGVzUGF0aCB8fCBkZWZhdWx0cy5jbGllbnRQYXRoKydtYWluLmNzcyc7XG5cblx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbn1cblxuZnVuY3Rpb24gUHJlZml4ZWRFdmVudChlbGVtZW50LCB0eXBlLCBwZngsIGNhbGxiYWNrKSB7XG5cdGZvciAodmFyIHAgPSAwOyBwIDwgcGZ4Lmxlbmd0aDsgcCsrKSB7XG5cdFx0aWYgKCFwZnhbcF0pIHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHBmeFtwXSt0eXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFRoZW1lVGV4dENvbG9yKHRoZW1lQ29sb3IpIHtcblx0dmFyIHJnYk9iaiA9IGhleFRvUmdiKGRlZmF1bHRzLnRoZW1lQ29sb3IpO1xuXHRkZWJ1Zy5sb2coJ2dldFRoZW1lVGV4dENvbG9yOiAnLCByZ2JPYmosIHJlbGF0aXZlTHVtaW5hbmNlVzNDKHJnYk9iai5yLCByZ2JPYmouZywgcmdiT2JqLmIpKTtcblx0cmV0dXJuIChyZWxhdGl2ZUx1bWluYW5jZVczQyhyZ2JPYmouciwgcmdiT2JqLmcsIHJnYk9iai5iKSA+IDAuNSA/ICcjMzMzJyA6ICcjZjFmMWYxJyk7XG59XG5cbi8vIGZyb20gaHR0cDovL3d3dy53My5vcmcvVFIvV0NBRzIwLyNyZWxhdGl2ZWx1bWluYW5jZWRlZlxuZnVuY3Rpb24gcmVsYXRpdmVMdW1pbmFuY2VXM0MoUjhiaXQsIEc4Yml0LCBCOGJpdCkge1xuXG4gICAgdmFyIFJzUkdCID0gUjhiaXQvMjU1O1xuICAgIHZhciBHc1JHQiA9IEc4Yml0LzI1NTtcbiAgICB2YXIgQnNSR0IgPSBCOGJpdC8yNTU7XG5cbiAgICB2YXIgUiA9IChSc1JHQiA8PSAwLjAzOTI4KSA/IFJzUkdCLzEyLjkyIDogTWF0aC5wb3coKFJzUkdCKzAuMDU1KS8xLjA1NSwgMi40KTtcbiAgICB2YXIgRyA9IChHc1JHQiA8PSAwLjAzOTI4KSA/IEdzUkdCLzEyLjkyIDogTWF0aC5wb3coKEdzUkdCKzAuMDU1KS8xLjA1NSwgMi40KTtcbiAgICB2YXIgQiA9IChCc1JHQiA8PSAwLjAzOTI4KSA/IEJzUkdCLzEyLjkyIDogTWF0aC5wb3coKEJzUkdCKzAuMDU1KS8xLjA1NSwgMi40KTtcblxuICAgIC8vIEZvciB0aGUgc1JHQiBjb2xvcnNwYWNlLCB0aGUgcmVsYXRpdmUgbHVtaW5hbmNlIG9mIGEgY29sb3IgaXMgZGVmaW5lZCBhczogXG4gICAgdmFyIEwgPSAwLjIxMjYgKiBSICsgMC43MTUyICogRyArIDAuMDcyMiAqIEI7XG5cbiAgICByZXR1cm4gTDtcbn1cblxuZnVuY3Rpb24gaGV4VG9SZ2IoaGV4KSB7XG4gICAgLy8gRXhwYW5kIHNob3J0aGFuZCBmb3JtIChlLmcuIFwiMDNGXCIpIHRvIGZ1bGwgZm9ybSAoZS5nLiBcIjAwMzNGRlwiKVxuICAgIHZhciBzaG9ydGhhbmRSZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2k7XG4gICAgaGV4ID0gaGV4LnJlcGxhY2Uoc2hvcnRoYW5kUmVnZXgsIGZ1bmN0aW9uKG0sIHIsIGcsIGIpIHtcbiAgICAgICAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjtcbiAgICB9KTtcblxuICAgIHZhciByZXN1bHQgPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWMoaGV4KTtcbiAgICByZXR1cm4gcmVzdWx0ID8ge1xuICAgICAgICByOiBwYXJzZUludChyZXN1bHRbMV0sIDE2KSxcbiAgICAgICAgZzogcGFyc2VJbnQocmVzdWx0WzJdLCAxNiksXG4gICAgICAgIGI6IHBhcnNlSW50KHJlc3VsdFszXSwgMTYpXG4gICAgfSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCggYSwgYiApIHtcbiAgICBmb3IoIHZhciBrZXkgaW4gYiApIHtcbiAgICAgICAgaWYoIGIuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICAgICAgYVtrZXldID0gYltrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGltZShzZWNvbmRzKXtcblx0dmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCksXG5cdFx0c2Vjc1JlbWFpbiA9IHNlY29uZHMgJSA2MCxcblx0XHRzdHIgPSAobWludXRlcyA+IDkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcykgKyAnOicgKyAoc2Vjc1JlbWFpbiA+IDkgPyBzZWNzUmVtYWluIDogJzAnICsgc2Vjc1JlbWFpbik7XG5cdHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFBob25lTnVtYmVyKHBob25lKSB7XG5cdHJldHVybiBwaG9uZS5yZXBsYWNlKC9cXEQrL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJTdXBwb3J0ZWQoKSB7XG5cdHJldHVybiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdCAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudChvYmosIGV2VHlwZSwgZm4pIHtcbiAgaWYgKG9iai5hZGRFdmVudExpc3RlbmVyKSBvYmouYWRkRXZlbnRMaXN0ZW5lcihldlR5cGUsIGZuLCBmYWxzZSk7XG4gIGVsc2UgaWYgKG9iai5hdHRhY2hFdmVudCkgb2JqLmF0dGFjaEV2ZW50KFwib25cIitldlR5cGUsIGZuKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG9iaiwgZXZUeXBlLCBmbikge1xuICBpZiAob2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2VHlwZSwgZm4sIGZhbHNlKTtcbiAgZWxzZSBpZiAob2JqLmRldGFjaEV2ZW50KSBvYmouZGV0YWNoRXZlbnQoXCJvblwiK2V2VHlwZSwgZm4pO1xufVxuIl19
