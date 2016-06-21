(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Wchat = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":1,"ieee754":8,"isarray":11}],4:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Moved Temporarily",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Time-out",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Request Entity Too Large",
  "414": "Request-URI Too Large",
  "415": "Unsupported Media Type",
  "416": "Requested Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Time-out",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
}

},{}],5:[function(require,module,exports){
(function (Buffer){
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})

},{"../../is-buffer/index.js":10}],6:[function(require,module,exports){

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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],11:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],12:[function(require,module,exports){
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

},{"../internal/arrayEach":18,"../internal/baseEach":24,"../internal/createForEach":41}],13:[function(require,module,exports){
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

},{"../internal/getNative":48}],14:[function(require,module,exports){
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

},{"../date/now":13,"../lang/isObject":68}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"../lang/isObject":68,"./debounce":14}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"../object/keys":73}],22:[function(require,module,exports){
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

},{"../object/keys":73,"./baseCopy":23}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{"./baseForOwn":27,"./createBaseEach":39}],25:[function(require,module,exports){
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

},{"./createBaseFor":40}],26:[function(require,module,exports){
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

},{"../object/keysIn":74,"./baseFor":25}],27:[function(require,module,exports){
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

},{"../object/keys":73,"./baseFor":25}],28:[function(require,module,exports){
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

},{"../lang/isObject":68,"./baseIsEqualDeep":29,"./isObjectLike":53}],29:[function(require,module,exports){
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

},{"../lang/isArray":63,"../lang/isTypedArray":70,"./equalArrays":42,"./equalByTag":43,"./equalObjects":44}],30:[function(require,module,exports){
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

},{"../lang/isArray":63,"../lang/isObject":68,"../lang/isTypedArray":70,"../object/keys":73,"./arrayEach":18,"./baseMergeDeep":31,"./isArrayLike":49,"./isObjectLike":53}],31:[function(require,module,exports){
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

},{"../lang/isArguments":62,"../lang/isArray":63,"../lang/isPlainObject":69,"../lang/isTypedArray":70,"../lang/toPlainObject":71,"./arrayCopy":17,"./isArrayLike":49}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{"../utility/identity":81}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
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

},{"../function/restParam":15,"./bindCallback":35,"./isIterateeCall":51}],39:[function(require,module,exports){
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

},{"./getLength":47,"./isLength":52,"./toObject":59}],40:[function(require,module,exports){
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

},{"./toObject":59}],41:[function(require,module,exports){
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

},{"../lang/isArray":63,"./bindCallback":35}],42:[function(require,module,exports){
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

},{"./arraySome":19}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{"../object/keys":73}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{"./baseProperty":32}],48:[function(require,module,exports){
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

},{"../lang/isNative":67}],49:[function(require,module,exports){
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

},{"./getLength":47,"./isLength":52}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{"../lang/isObject":68,"./isArrayLike":49,"./isIndex":50}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
/** Used to match template delimiters. */
var reEscape = /<%-([\s\S]+?)%>/g;

module.exports = reEscape;

},{}],56:[function(require,module,exports){
/** Used to match template delimiters. */
var reEvaluate = /<%([\s\S]+?)%>/g;

module.exports = reEvaluate;

},{}],57:[function(require,module,exports){
/** Used to match template delimiters. */
var reInterpolate = /<%=([\s\S]+?)%>/g;

module.exports = reInterpolate;

},{}],58:[function(require,module,exports){
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

},{"../lang/isArguments":62,"../lang/isArray":63,"../object/keysIn":74,"./isIndex":50,"./isLength":52}],59:[function(require,module,exports){
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

},{"../lang/isObject":68}],60:[function(require,module,exports){
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

},{"./isSpace":54}],61:[function(require,module,exports){
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

},{"./isSpace":54}],62:[function(require,module,exports){
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

},{"../internal/isArrayLike":49,"../internal/isObjectLike":53}],63:[function(require,module,exports){
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

},{"../internal/getNative":48,"../internal/isLength":52,"../internal/isObjectLike":53}],64:[function(require,module,exports){
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

},{"../internal/baseIsEqual":28,"../internal/bindCallback":35}],65:[function(require,module,exports){
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

},{"../internal/isObjectLike":53}],66:[function(require,module,exports){
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

},{"./isObject":68}],67:[function(require,module,exports){
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

},{"../internal/isObjectLike":53,"./isFunction":66}],68:[function(require,module,exports){
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

},{}],69:[function(require,module,exports){
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

},{"../internal/baseForIn":26,"../internal/isObjectLike":53,"./isArguments":62}],70:[function(require,module,exports){
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

},{"../internal/isLength":52,"../internal/isObjectLike":53}],71:[function(require,module,exports){
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

},{"../internal/baseCopy":23,"../object/keysIn":74}],72:[function(require,module,exports){
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

},{"../internal/assignWith":21,"../internal/baseAssign":22,"../internal/createAssigner":38}],73:[function(require,module,exports){
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

},{"../internal/getNative":48,"../internal/isArrayLike":49,"../internal/shimKeys":58,"../lang/isObject":68}],74:[function(require,module,exports){
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

},{"../internal/isIndex":50,"../internal/isLength":52,"../lang/isArguments":62,"../lang/isArray":63,"../lang/isObject":68}],75:[function(require,module,exports){
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

},{"../internal/baseMerge":30,"../internal/createAssigner":38}],76:[function(require,module,exports){
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

},{"../internal/baseToString":33,"../internal/escapeHtmlChar":45}],77:[function(require,module,exports){
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

},{"../internal/assignOwnDefaults":20,"../internal/assignWith":21,"../internal/baseAssign":22,"../internal/baseToString":33,"../internal/baseValues":34,"../internal/escapeStringChar":46,"../internal/isIterateeCall":51,"../internal/reInterpolate":57,"../lang/isError":65,"../object/keys":73,"../utility/attempt":80,"./templateSettings":78}],78:[function(require,module,exports){
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

},{"../internal/reEscape":55,"../internal/reEvaluate":56,"../internal/reInterpolate":57,"./escape":76}],79:[function(require,module,exports){
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

},{"../internal/baseToString":33,"../internal/charsLeftIndex":36,"../internal/charsRightIndex":37,"../internal/isIterateeCall":51,"../internal/trimmedLeftIndex":60,"../internal/trimmedRightIndex":61}],80:[function(require,module,exports){
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

},{"../function/restParam":15,"../lang/isError":65}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}

}).call(this,require('_process'))

},{"_process":83}],83:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],84:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],85:[function(require,module,exports){
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

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],86:[function(require,module,exports){
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

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],87:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":85,"./encode":86}],88:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":89}],89:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/



/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

},{"./_stream_readable":91,"./_stream_writable":93,"core-util-is":5,"inherits":9,"process-nextick-args":82}],90:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":92,"core-util-is":5,"inherits":9}],91:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/



/*<replacement>*/
var debugUtil = require('util');
var debug;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function')
    this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function() {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}


// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (ret !== null)
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      processNextTick(emitReadable_, stream);
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    processNextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 &&
          state.pipes[0] === dest &&
          src.listenerCount('data') === 1 &&
          !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];


  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined))
      return;
    else if (!state.objectMode && (!chunk || !chunk.length))
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }; }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};


// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else if (list.length === 1)
      ret = list[0];
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))

},{"./_stream_duplex":89,"_process":83,"buffer":3,"core-util-is":5,"events":7,"inherits":9,"isarray":11,"process-nextick-args":82,"string_decoder/":103,"util":2}],92:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function')
      this._transform = options.transform;

    if (typeof options.flush === 'function')
      this._flush = options.flush;
  }

  this.once('prefinish', function() {
    if (typeof this._flush === 'function')
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":89,"core-util-is":5,"inherits":9}],93:[function(require,module,exports){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/


/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function (){try {
Object.defineProperty(WritableState.prototype, 'buffer', {
  get: internalUtil.deprecate(function() {
    return this.getBuffer();
  }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' +
     'instead.')
});
}catch(_){}}());


function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function')
      this._write = options.write;

    if (typeof options.writev === 'function')
      this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = nop;

  if (state.ended)
    writeAfterEnd(this, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.bufferedRequest)
      clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string')
    encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64',
'ucs2', 'ucs-2','utf16le', 'utf-16le', 'raw']
.indexOf((encoding + '').toLowerCase()) > -1))
    throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync)
    processNextTick(cb, er);
  else
    cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      processNextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var buffer = [];
    var cbs = [];
    while (entry) {
      cbs.push(entry.callback);
      buffer.push(entry);
      entry = entry.next;
    }

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    state.lastBufferedRequest = null;
    doWrite(stream, state, true, state.length, buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null)
      state.lastBufferedRequest = null;
  }
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined)
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(state) {
  return (state.ending &&
          state.length === 0 &&
          state.bufferedRequest === null &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      processNextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./_stream_duplex":89,"buffer":3,"core-util-is":5,"events":7,"inherits":9,"process-nextick-args":82,"util-deprecate":106}],94:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":90}],95:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":89,"./lib/_stream_passthrough.js":90,"./lib/_stream_readable.js":91,"./lib/_stream_transform.js":92,"./lib/_stream_writable.js":93}],96:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":92}],97:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":93}],98:[function(require,module,exports){
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

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":7,"inherits":9,"readable-stream/duplex.js":88,"readable-stream/passthrough.js":94,"readable-stream/readable.js":95,"readable-stream/transform.js":96,"readable-stream/writable.js":97}],99:[function(require,module,exports){
var ClientRequest = require('./lib/request')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	var protocol = opts.protocol || ''
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
},{"./lib/request":101,"builtin-status-codes":4,"url":104,"xtend":107}],100:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableByteStream)

exports.blobConstructor = false
try {
	new Blob([new ArrayBuffer(1)])
	exports.blobConstructor = true
} catch (e) {}

var xhr = new global.XMLHttpRequest()
// If location.host is empty, e.g. if this page/worker was loaded
// from a Blob, then use example.com to avoid an error
xhr.open('GET', global.location.host ? '/' : 'https://example.com')

function checkTypeSupport (type) {
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
// Safari 7.1 appears to have fixed this bug.
var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

exports.arraybuffer = haveArrayBuffer && checkTypeSupport('arraybuffer')
// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
	checkTypeSupport('moz-chunked-arraybuffer')
exports.overrideMimeType = isFunction(xhr.overrideMimeType)
exports.vbArray = isFunction(global.VBArray)

function isFunction (value) {
  return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],101:[function(require,module,exports){
(function (process,global,Buffer){
// var Base64 = require('Base64')
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('stream')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary) {
	if (capability.fetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else if (capability.vbArray && preferBinary) {
		return 'text:vbarray'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary)

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var self = this
	return self._headers[name.toLowerCase()].value
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body
	if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
		if (capability.blobConstructor) {
			body = new global.Blob(self._body.map(function (buffer) {
				return buffer.toArrayBuffer()
			}), {
				type: (headersObj['content-type'] || {}).value || ''
			})
		} else {
			// get utf8 string
			body = Buffer.concat(self._body).toString()
		}
	}

	if (self._mode === 'fetch') {
		var headers = Object.keys(headersObj).map(function (name) {
			return [headersObj[name].name, headersObj[name].value]
		})

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headers,
			body: body,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin'
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode.split(':')[0]

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		Object.keys(headersObj).forEach(function (name) {
			xhr.setRequestHeader(headersObj[name].name, headersObj[name].value)
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable. Even though the spec says it should
 * be available in readyState 3, accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		return (xhr.status !== null)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode)
	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	// Currently, there isn't a way to truly abort a fetch.
	// If you like bikeshedding, see https://github.com/whatwg/fetch/issues/27
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'user-agent',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"./capability":100,"./response":102,"_process":83,"buffer":3,"inherits":9,"stream":98}],102:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.statusCode = response.status
		self.statusMessage = response.statusText
		// backwards compatible version of for (<item> of <iterable>):
		// for (var <item>,_i,_it = <iterable>[Symbol.iterator](); <item> = (_i = _it.next()).value,!_i.done;)
		for (var header, _i, _it = response.headers[Symbol.iterator](); header = (_i = _it.next()).value, !_i.done;) {
			self.headers[header[0].toLowerCase()] = header[1]
			self.rawHeaders.push(header[0], header[1])
		}

		// TODO: this doesn't respect backpressure. Once WritableStream is available, this can be fixed
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					self.push(null)
					return
				}
				self.push(new Buffer(result.value))
				read()
			})
		}
		read()

	} else {
		self._xhr = xhr
		self._pos = 0

		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (self.headers[key] !== undefined)
					self.headers[key] += ', ' + matches[2]
				else
					self.headers[key] = matches[2]
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text:vbarray': // For IE9
			if (xhr.readyState !== rStates.DONE)
				break
			try {
				// This fails in IE8
				response = new global.VBArray(xhr.responseBody).toArray()
			} catch (e) {}
			if (response !== null) {
				self.push(new Buffer(response))
				break
			}
			// Falls through in IE8	
		case 'text':
			try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
				response = xhr.responseText
			} catch (e) {
				self._mode = 'text:vbarray'
				break
			}
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = new Buffer(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE)
				break
			response = xhr.response
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"./capability":100,"_process":83,"buffer":3,"inherits":9,"stream":98}],103:[function(require,module,exports){
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

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":3}],104:[function(require,module,exports){
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

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":105,"punycode":84,"querystring":87}],105:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],106:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],107:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],108:[function(require,module,exports){
var _ = require('./lodash');
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

function init(options){
	if(initiated) return console.info('Cobrowsing already initiated');

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

	console.log('cobrowsing module initiated with parameters: ', options);
	emit('cobrowsing/init');
}

function shareBrowser(){
    if(shared) return console.info('Browser already shared');
    addEvent(document, 'scroll', eventsHandler);
    addEvent(document, 'select', eventsHandler);
    addEvent(document, 'mousemove', eventsHandler);

    // addEvent(document, 'mouseover', eventsHandler);
    // addEvent(document, 'mouseout', eventsHandler);
    
    createRemoteCursor();
    shared = true;
    updateStateInterval = setInterval(updateState, updateIntervalValue);
    clearInterval(updateInterval);

    console.log('browser shared');
    emit('cobrowsing/shared', { entity: entity });
}

function unshareBrowser(){
	if(!shared) return console.info('Browser already unshared');

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
    console.log('browser unshared');
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

	// console.log('eventsHandler: ', params);
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

			// if(evt.shared !== undefined) console.log('shared events', eventTimestamp, evt, result.init);
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
	share: shareBrowser,
	unshare: unshareBrowser,
	unshareAll: unshareAll,
	emitEvents: emitEvents,
	updateEvents: updateEvents
};
},{"./lodash":111}],109:[function(require,module,exports){

var EventEmitter = require('events').EventEmitter;
var storage = require('./storage');
var request = require('./request');
var url = require('url').parse(document.URL, true);
var _ = require('./lodash');
var inherits = require('inherits');

/**
 * Core module implements main internal functionality
 * 
 * @param  {Object} options Instantiation options that overrides module defaults
 * @return {Object}         Return public API
 */

var defaults = {
	// IPCC server IP address/domain name and port number.
	// ex.: "http://192.168.1.100:8880"
	server: '',
	// Absolute path to the webchat folder on the web server
	// where the website is located
	path: '/wchat/'
};

inherits(WchatAPI, EventEmitter);

module.exports = WchatAPI;

function WchatAPI(options){

	// extend default options
	// with provided object
	this.options = _.assign(defaults, options || {});

	this.options.serverUrl = this.options.server + '/ipcc/$$$';

	// Current session state object
	this.session = {
		sid: null,
		eventTimestamp: 0,
		msgTimestamp: 0,
		entity: undefined,
		chat: null
	};

	this.on('session/create', function (result){
		this.session.sid = result.sid;
		// this.updateUrl(url.href);
	});
	this.on('session/continue', function (result){
		// this.updateUrl(url.href);
	});

	this.on('Error', function (err, params){
		console.log('ERROR: ', err, params);
		if(err.code === 404) {
			this.sessionTimeout(params);
		}
		console.error(err, params);
	});

	return this;

}

/**
 * Module initiation
 * Emits module/start event if module started
 */
WchatAPI.prototype.initModule = function(){
	var entity = this.getState('entity', 'session'),
		sid = this.getState('sid');

	// A chatSessionId parameter in the url query 
	// indicates that the web page was opened by agent.
	// In that case agent should join the session.
	if(url.href.indexOf('chatSessionId') !== -1) {
		sid = getSidFromUrl(url.href);
		this.saveState('entity', 'agent', 'session');
		this.saveState('sid', sid);
		this.joinSession(sid);
	} else if(entity === 'agent' && sid) { // In case the cobrowsing session is active
		this.joinSession(sid, url.href);
	} else {

		// In case a session is already initiated 
		// and storage containes sid parameter
		if(sid) {
			this.updateEvents([{ entity: entity, url: url.href }], function (err, result){
				if(err) {
					return;
				}
				this.saveState('sid', sid);
				this.emit('session/continue', { entity: entity });
			}.bind(this));
		} else {
			this.saveState('entity', 'user', 'session');
			// Create new session
			this.createSession(url.href);
		}
	}
};

/**
 * Create session
 * Emits session/create event
 * if initiation is successful
 *
 * @param {String} url Current full URL
 */
WchatAPI.prototype.createSession = function(pageUrl){
	// console.log('createSession, '+this.options.serverUrl);
	request.post(this.options.serverUrl, {
		method: 'createSession',
		params: {
			url: (pageUrl || url.href)
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}

		this.saveState('sid', body.result.sid);
		this.emit('session/create', body.result);
	}.bind(this));
};

WchatAPI.prototype.joinSession = function(sid, url){
	// this.saveState('shared', true, 'session');
	this.emit('session/join', { sid: sid, url: url });
};

WchatAPI.prototype.updateEvents = function(events, cb){
	var params = {
		method: 'updateEvents',
		params: {
			sid: this.getState('sid'),
			timestamp: this.getState('eventTimestamp', 'cache'),
			events: events
		}
	};
	request.post(this.options.serverUrl, params, function (err, res, body){
		if(err) {
			this.emit('Error', err, params);
			return cb(err); // TODO: handle error
		}

		if(body.result.timestamp > this.getState('eventTimestamp', 'cache')) {
			this.saveState('eventTimestamp', body.result.timestamp, 'cache');
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
 * languages weren't set by administrator
 */
WchatAPI.prototype.getLanguages = function(cb){
	request.post(this.options.serverUrl, {
		method: 'getLanguages',
		params: {
			sid: this.getState('sid')
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}

		cb(null, body);
	}.bind(this));
};

/**
 * Request chat session
 * 
 * @param  {Object} params - user parameters (name, phone, etc.)
 */
WchatAPI.prototype.chatRequest = function(params, cb){
	params.sid = this.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'chatRequest',
		params: params
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			if(cb) cb(err);
			return;
		}

		this.emit('chat/start', body.result);
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
			sid: this.getState('sid'),
			timestamp: this.getState('msgTimestamp')
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}

		if(body.result.messages) {
			this.emit('message/new', body.result);
		} else if(body.result.typing) {
			this.emit('message/typing', body.result);
		}
		this.saveState('msgTimestamp', body.result.timestamp);
		if(cb) cb(null, body.result);
	}.bind(this));
};

/**
 * Send message to the agent
 * 
 * @param  {String} text - message content in case of regular message 
 * or dataURL in case of file transfer
 * @param  {String} file - (Optional) file name
 */
WchatAPI.prototype.sendMessage = function(text, file){
	var params = {
		sid: this.getState('sid'),
		text: text
	};
	if(file) params.file = file;
	request.post(this.options.serverUrl, {
		method: 'setMessage',
		params: params
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
			return cb(err);
		}
	});
};

/**
 * Close current chat session
 * 
 * @param  {Number} rating Service rating
 */
WchatAPI.prototype.closeChat = function(rating){
	var reqParams = {
		method: 'closeChat',
		params: {
			sid: this.getState('sid')
		}
	};
	if(rating) reqParams.params.rating = rating;
	request.post(this.options.serverUrl, reqParams, function (err, res, body){
		if(err) {
			this.emit('Error', err, reqParams);
			return;
		}
		this.saveState('chat', false);
		this.emit('chat/close', { rating: rating });
	}.bind(this));
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
	params.sid = this.getState('sid');
	request.post(this.options.serverUrl, {
		method: 'sendMail',
		params: params
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			if(cb) cb(err);
			return;
		}

		this.emit('chat/send', params);
		if(cb) cb(null, body);
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
	request.post(this.options.serverUrl, {
		method: 'disjoinSession',
		params: {
			sid: sid
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}

		this.emit('session/disjoin');
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
			sid: this.getState('sid'),
			url: url
		}
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
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
	// console.log('user is typing!');
	request.post(this.options.serverUrl, {
		method: 'typing',
		params: {
			sid: this.getState('sid')
		}
	}, function (err){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.updateUrl = function(url){
	request.post(this.options.serverUrl, {
		method: 'updateUrl',
		params: {
			sid: this.getState('sid'),
			url: url
		}
	}, function(err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.linkFollowed = function(url){
	request.post(this.options.serverUrl, {
		method: 'linkFollowed',
		params: {
			sid: this.getState('sid'),
			url: url
		}
	}, function (err, res, body){
		if(err) {
			this.emit('Error', err);
			return;
		}
	}.bind(this));
};

WchatAPI.prototype.saveState = function(key, value, location){
	this.session[key] = value;
	if(location !== 'cache') {
		storage.set(key, value, location);
	}
	return value;
};

/**
 * Get saved property from localStorage or from session cache
 * @param  {String} key      - item key in storage memory
 * @param  {[type]} location - from where to retrieve item. 
 * Could be either "storage" - from localStorage, or "cache" - from session cache
 * @return {String|Object|Function}          - item value
 */
WchatAPI.prototype.getState = function(key, location){
	if(!location) {
		return (this.session[key] !== undefined && this.session[key] !== null) ? this.session[key] : storage.get(key);
	} else if(location === 'cache') {
		return this.session[key];
	} else {
		return storage.get(key, location);
	}
};

WchatAPI.prototype.removeState = function(key, location) {
	delete this.session[key];
	storage.remove(key);
};

WchatAPI.prototype.sessionTimeout = function(params){
	// console.log('sessionTimeout params: ', params);
	this.emit('session/timeout', params);
};

function getSidFromUrl(url){
	var substr = url.substring(url.indexOf('chatSessionId='));
	substr = substr.substring(substr.indexOf('=')+1);
	return substr;
}

},{"./lodash":111,"./request":113,"./storage":114,"events":7,"inherits":9,"url":104}],110:[function(require,module,exports){
(function (global){
/*
 * JsSIP v2.0.1
 * the Javascript SIP library
 * Copyright: 2012-2016 José Luis Millán <jmillan@aliax.net> (https://github.com/jmillan)
 * Homepage: http://jssip.net
 * License: MIT
 */

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.JsSIP=e()}}(function(){var e;return function t(e,n,r){function s(i,o){if(!n[i]){if(!e[i]){var u="function"==typeof require&&require;if(!o&&u)return u(i,!0);if(l)return l(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var c=n[i]={exports:{}};e[i][0].call(c.exports,function(t){var n=e[i][1][t];return s(n?n:t)},c,c.exports,t,e,n,r)}return n[i].exports}for(var l="function"==typeof require&&require,i=0;i<r.length;i++)s(r[i]);return s}({1:[function(e,t,n){var r=e("../package.json"),s={USER_AGENT:r.title+" "+r.version,SIP:"sip",SIPS:"sips",causes:{CONNECTION_ERROR:"Connection Error",REQUEST_TIMEOUT:"Request Timeout",SIP_FAILURE_CODE:"SIP Failure Code",INTERNAL_ERROR:"Internal Error",BUSY:"Busy",REJECTED:"Rejected",REDIRECTED:"Redirected",UNAVAILABLE:"Unavailable",NOT_FOUND:"Not Found",ADDRESS_INCOMPLETE:"Address Incomplete",INCOMPATIBLE_SDP:"Incompatible SDP",MISSING_SDP:"Missing SDP",AUTHENTICATION_ERROR:"Authentication Error",BYE:"Terminated",WEBRTC_ERROR:"WebRTC Error",CANCELED:"Canceled",NO_ANSWER:"No Answer",EXPIRES:"Expires",NO_ACK:"No ACK",DIALOG_ERROR:"Dialog Error",USER_DENIED_MEDIA_ACCESS:"User Denied Media Access",BAD_MEDIA_DESCRIPTION:"Bad Media Description",RTP_TIMEOUT:"RTP Timeout"},SIP_ERROR_CAUSES:{REDIRECTED:[300,301,302,305,380],BUSY:[486,600],REJECTED:[403,603],NOT_FOUND:[404,604],UNAVAILABLE:[480,410,408,430],ADDRESS_INCOMPLETE:[484,424],INCOMPATIBLE_SDP:[488,606],AUTHENTICATION_ERROR:[401,407]},ACK:"ACK",BYE:"BYE",CANCEL:"CANCEL",INFO:"INFO",INVITE:"INVITE",MESSAGE:"MESSAGE",NOTIFY:"NOTIFY",OPTIONS:"OPTIONS",REGISTER:"REGISTER",REFER:"REFER",UPDATE:"UPDATE",SUBSCRIBE:"SUBSCRIBE",REASON_PHRASE:{100:"Trying",180:"Ringing",181:"Call Is Being Forwarded",182:"Queued",183:"Session Progress",199:"Early Dialog Terminated",200:"OK",202:"Accepted",204:"No Notification",300:"Multiple Choices",301:"Moved Permanently",302:"Moved Temporarily",305:"Use Proxy",380:"Alternative Service",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",410:"Gone",412:"Conditional Request Failed",413:"Request Entity Too Large",414:"Request-URI Too Long",415:"Unsupported Media Type",416:"Unsupported URI Scheme",417:"Unknown Resource-Priority",420:"Bad Extension",421:"Extension Required",422:"Session Interval Too Small",423:"Interval Too Brief",424:"Bad Location Information",428:"Use Identity Header",429:"Provide Referrer Identity",430:"Flow Failed",433:"Anonymity Disallowed",436:"Bad Identity-Info",437:"Unsupported Certificate",438:"Invalid Identity Header",439:"First Hop Lacks Outbound Support",440:"Max-Breadth Exceeded",469:"Bad Info Package",470:"Consent Needed",478:"Unresolvable Destination",480:"Temporarily Unavailable",481:"Call/Transaction Does Not Exist",482:"Loop Detected",483:"Too Many Hops",484:"Address Incomplete",485:"Ambiguous",486:"Busy Here",487:"Request Terminated",488:"Not Acceptable Here",489:"Bad Event",491:"Request Pending",493:"Undecipherable",494:"Security Agreement Required",500:"JsSIP Internal Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Server Time-out",505:"Version Not Supported",513:"Message Too Large",580:"Precondition Failure",600:"Busy Everywhere",603:"Decline",604:"Does Not Exist Anywhere",606:"Not Acceptable"},ALLOWED_METHODS:"INVITE,ACK,CANCEL,BYE,UPDATE,MESSAGE,OPTIONS,REFER,INFO",ACCEPTED_BODY_TYPES:"application/sdp, application/dtmf-relay",MAX_FORWARDS:69,SESSION_EXPIRES:90,MIN_SESSION_EXPIRES:60};t.exports=s},{"../package.json":47}],2:[function(e,t,n){function r(e,t,n,r){var o;return this.uac_pending_reply=!1,this.uas_pending_reply=!1,t.hasHeader("contact")?(r=t instanceof i.IncomingResponse?t.status_code<200?s.STATUS_EARLY:s.STATUS_CONFIRMED:r||s.STATUS_CONFIRMED,o=t.parseHeader("contact"),"UAS"===n?(this.id={call_id:t.call_id,local_tag:t.to_tag,remote_tag:t.from_tag,toString:function(){return this.call_id+this.local_tag+this.remote_tag}},this.state=r,this.remote_seqnum=t.cseq,this.local_uri=t.parseHeader("to").uri,this.remote_uri=t.parseHeader("from").uri,this.remote_target=o.uri,this.route_set=t.getHeaders("record-route")):"UAC"===n&&(this.id={call_id:t.call_id,local_tag:t.from_tag,remote_tag:t.to_tag,toString:function(){return this.call_id+this.local_tag+this.remote_tag}},this.state=r,this.local_seqnum=t.cseq,this.local_uri=t.parseHeader("from").uri,this.remote_uri=t.parseHeader("to").uri,this.remote_target=o.uri,this.route_set=t.getHeaders("record-route").reverse()),this.owner=e,e.ua.dialogs[this.id.toString()]=this,void l("new "+n+" dialog created with status "+(this.state===s.STATUS_EARLY?"EARLY":"CONFIRMED"))):{error:"unable to create a Dialog without Contact header field"}}t.exports=r;var s={STATUS_EARLY:1,STATUS_CONFIRMED:2};r.C=s;var l=e("debug")("JsSIP:Dialog"),i=e("./SIPMessage"),o=e("./Constants"),u=e("./Transactions"),a=e("./Dialog/RequestSender");r.prototype={update:function(e,t){this.state=s.STATUS_CONFIRMED,l("dialog "+this.id.toString()+"  changed to CONFIRMED state"),"UAC"===t&&(this.route_set=e.getHeaders("record-route").reverse())},terminate:function(){l("dialog "+this.id.toString()+" deleted"),delete this.owner.ua.dialogs[this.id.toString()]},createRequest:function(e,t,n){var r,s;return t=t&&t.slice()||[],this.local_seqnum||(this.local_seqnum=Math.floor(1e4*Math.random())),r=e===o.CANCEL||e===o.ACK?this.local_seqnum:this.local_seqnum+=1,s=new i.OutgoingRequest(e,this.remote_target,this.owner.ua,{cseq:r,call_id:this.id.call_id,from_uri:this.local_uri,from_tag:this.id.local_tag,to_uri:this.remote_uri,to_tag:this.id.remote_tag,route_set:this.route_set},t,n),s.dialog=this,s},checkInDialogRequest:function(e){var t=this;if(this.remote_seqnum){if(e.cseq<this.remote_seqnum)return e.method!==o.ACK&&e.reply(500),!1;e.cseq>this.remote_seqnum&&(this.remote_seqnum=e.cseq)}else this.remote_seqnum=e.cseq;if(e.method===o.INVITE||e.method===o.UPDATE&&e.body){if(this.uac_pending_reply===!0)e.reply(491);else{if(this.uas_pending_reply===!0){var n=(10*Math.random()|0)+1;return e.reply(500,null,["Retry-After:"+n]),!1}this.uas_pending_reply=!0,e.server_transaction.on("stateChanged",function r(){this.state!==u.C.STATUS_ACCEPTED&&this.state!==u.C.STATUS_COMPLETED&&this.state!==u.C.STATUS_TERMINATED||(e.server_transaction.removeListener("stateChanged",r),t.uas_pending_reply=!1)})}e.hasHeader("contact")&&e.server_transaction.on("stateChanged",function(){this.state===u.C.STATUS_ACCEPTED&&(t.remote_target=e.parseHeader("contact").uri)})}else e.method===o.NOTIFY&&e.hasHeader("contact")&&e.server_transaction.on("stateChanged",function(){this.state===u.C.STATUS_COMPLETED&&(t.remote_target=e.parseHeader("contact").uri)});return!0},sendRequest:function(e,t,n){n=n||{};var r=n.extraHeaders&&n.extraHeaders.slice()||[],s=n.body||null,l=this.createRequest(t,r,s),i=new a(this,e,l);return i.send(),l},receiveRequest:function(e){this.checkInDialogRequest(e)&&this.owner.receiveRequest(e)}}},{"./Constants":1,"./Dialog/RequestSender":3,"./SIPMessage":18,"./Transactions":21,debug:33}],3:[function(e,t,n){function r(e,t,n){this.dialog=e,this.applicant=t,this.request=n,this.reattempt=!1,this.reattemptTimer=null}t.exports=r;var s=e("../Constants"),l=e("../Transactions"),i=e("../RTCSession"),o=e("../RequestSender");r.prototype={send:function(){var e=this,t=new o(this,this.dialog.owner.ua);t.send(),(this.request.method===s.INVITE||this.request.method===s.UPDATE&&this.request.body)&&t.clientTransaction.state!==l.C.STATUS_TERMINATED&&(this.dialog.uac_pending_reply=!0,t.clientTransaction.on("stateChanged",function n(){this.state!==l.C.STATUS_ACCEPTED&&this.state!==l.C.STATUS_COMPLETED&&this.state!==l.C.STATUS_TERMINATED||(t.clientTransaction.removeListener("stateChanged",n),e.dialog.uac_pending_reply=!1)}))},onRequestTimeout:function(){this.applicant.onRequestTimeout()},onTransportError:function(){this.applicant.onTransportError()},receiveResponse:function(e){var t=this;408===e.status_code||481===e.status_code?this.applicant.onDialogError(e):e.method===s.INVITE&&491===e.status_code?this.reattempt?this.applicant.receiveResponse(e):(this.request.cseq.value=this.dialog.local_seqnum+=1,this.reattemptTimer=setTimeout(function(){t.applicant.owner.status!==i.C.STATUS_TERMINATED&&(t.reattempt=!0,t.request_sender.send())},1e3)):this.applicant.receiveResponse(e)}}},{"../Constants":1,"../RTCSession":11,"../RequestSender":17,"../Transactions":21}],4:[function(e,t,n){function r(e){this.credentials=e,this.cnonce=null,this.nc=0,this.ncHex="00000000",this.algorithm=null,this.realm=null,this.nonce=null,this.opaque=null,this.stale=null,this.qop=null,this.method=null,this.uri=null,this.ha1=null,this.response=null}t.exports=r;var s=e("debug")("JsSIP:DigestAuthentication"),l=e("debug")("JsSIP:ERROR:DigestAuthentication");l.log=console.warn.bind(console);var i=e("./Utils");r.prototype.get=function(e){switch(e){case"realm":return this.realm;case"ha1":return this.ha1;default:return void l('get() | cannot get "%s" parameter',e)}},r.prototype.authenticate=function(e,t){var n,r;if(this.algorithm=t.algorithm,this.realm=t.realm,this.nonce=t.nonce,this.opaque=t.opaque,this.stale=t.stale,this.algorithm){if("MD5"!==this.algorithm)return l('authenticate() | challenge with Digest algorithm different than "MD5", authentication aborted'),!1}else this.algorithm="MD5";if(!this.nonce)return l("authenticate() | challenge without Digest nonce, authentication aborted"),!1;if(!this.realm)return l("authenticate() | challenge without Digest realm, authentication aborted"),!1;if(!this.credentials.password){if(!this.credentials.ha1)return l("authenticate() | no plain SIP password nor ha1 provided, authentication aborted"),!1;if(this.credentials.realm!==this.realm)return l('authenticate() | no plain SIP password, and stored `realm` does not match the given `realm`, cannot authenticate [stored:"%s", given:"%s"]',this.credentials.realm,this.realm),!1}if(t.qop)if(t.qop.indexOf("auth")>-1)this.qop="auth";else{if(!(t.qop.indexOf("auth-int")>-1))return l('authenticate() | challenge without Digest qop different than "auth" or "auth-int", authentication aborted'),!1;this.qop="auth-int"}else this.qop=null;return this.method=e.method,this.uri=e.ruri,this.cnonce=i.createRandomToken(12),this.nc+=1,r=Number(this.nc).toString(16),this.ncHex="00000000".substr(0,8-r.length)+r,4294967296===this.nc&&(this.nc=1,this.ncHex="00000001"),this.credentials.password?this.ha1=i.calculateMD5(this.credentials.username+":"+this.realm+":"+this.credentials.password):this.ha1=this.credentials.ha1,"auth"===this.qop?(n=i.calculateMD5(this.method+":"+this.uri),this.response=i.calculateMD5(this.ha1+":"+this.nonce+":"+this.ncHex+":"+this.cnonce+":auth:"+n)):"auth-int"===this.qop?(n=i.calculateMD5(this.method+":"+this.uri+":"+i.calculateMD5(this.body?this.body:"")),this.response=i.calculateMD5(this.ha1+":"+this.nonce+":"+this.ncHex+":"+this.cnonce+":auth-int:"+n)):null===this.qop&&(n=i.calculateMD5(this.method+":"+this.uri),this.response=i.calculateMD5(this.ha1+":"+this.nonce+":"+n)),s("authenticate() | response generated"),!0},r.prototype.toString=function(){var e=[];if(!this.response)throw new Error("response field does not exist, cannot generate Authorization header");return e.push("algorithm="+this.algorithm),e.push('username="'+this.credentials.username+'"'),e.push('realm="'+this.realm+'"'),e.push('nonce="'+this.nonce+'"'),e.push('uri="'+this.uri+'"'),e.push('response="'+this.response+'"'),this.opaque&&e.push('opaque="'+this.opaque+'"'),this.qop&&(e.push("qop="+this.qop),e.push('cnonce="'+this.cnonce+'"'),e.push("nc="+this.ncHex)),"Digest "+e.join(", ")}},{"./Utils":25,debug:33}],5:[function(e,t,n){var r={ConfigurationError:function(){var e=function(e,t){this.code=1,this.name="CONFIGURATION_ERROR",this.parameter=e,this.value=t,this.message=this.value?"Invalid value "+JSON.stringify(this.value)+' for parameter "'+this.parameter+'"':"Missing parameter: "+this.parameter};return e.prototype=new Error,e}(),InvalidStateError:function(){var e=function(e){this.code=2,this.name="INVALID_STATE_ERROR",this.status=e,this.message="Invalid status: "+e};return e.prototype=new Error,e}(),NotSupportedError:function(){var e=function(e){this.code=3,this.name="NOT_SUPPORTED_ERROR",this.message=e};return e.prototype=new Error,e}(),NotReadyError:function(){var e=function(e){this.code=4,this.name="NOT_READY_ERROR",this.message=e};return e.prototype=new Error,e}()};t.exports=r},{}],6:[function(e,t,n){t.exports=function(){function t(e){return'"'+e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g,escape)+'"'}var n={parse:function(n,r){function s(e){Cr>_r||(_r>Cr&&(Cr=_r,Sr=[]),Sr.push(e))}function l(){var e;return"\r\n"===n.substr(_r,2)?(e="\r\n",_r+=2):(e=null,0===vr&&s('"\\r\\n"')),e}function i(){var e;return/^[0-9]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[0-9]")),e}function o(){var e;return/^[a-zA-Z]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[a-zA-Z]")),e}function u(){var e;return/^[0-9a-fA-F]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[0-9a-fA-F]")),e}function a(){var e;return e=d(),null===e&&(e=p()),e}function c(){var e;return/^[\0-\xFF]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[\\0-\\xFF]")),e}function h(){var e;return/^["]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s('["]')),e}function d(){var e;return 32===n.charCodeAt(_r)?(e=" ",_r++):(e=null,0===vr&&s('" "')),e}function p(){var e;return 9===n.charCodeAt(_r)?(e="	",_r++):(e=null,0===vr&&s('"\\t"')),e}function f(){var e;return/^[a-zA-Z0-9]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[a-zA-Z0-9]")),e}function m(){var e;return 59===n.charCodeAt(_r)?(e=";",_r++):(e=null,0===vr&&s('";"')),null===e&&(47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"')),null===e&&(63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(64===n.charCodeAt(_r)?(e="@",_r++):(e=null,0===vr&&s('"@"')),null===e&&(38===n.charCodeAt(_r)?(e="&",_r++):(e=null,0===vr&&s('"&"')),null===e&&(61===n.charCodeAt(_r)?(e="=",_r++):(e=null,0===vr&&s('"="')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')),null===e&&(44===n.charCodeAt(_r)?(e=",",_r++):(e=null,0===vr&&s('","'))))))))))),e}function g(){var e;return e=f(),null===e&&(e=T()),e}function T(){var e;return 45===n.charCodeAt(_r)?(e="-",_r++):(e=null,0===vr&&s('"-"')),null===e&&(95===n.charCodeAt(_r)?(e="_",_r++):(e=null,0===vr&&s('"_"')),null===e&&(46===n.charCodeAt(_r)?(e=".",_r++):(e=null,0===vr&&s('"."')),null===e&&(33===n.charCodeAt(_r)?(e="!",_r++):(e=null,0===vr&&s('"!"')),null===e&&(126===n.charCodeAt(_r)?(e="~",_r++):(e=null,0===vr&&s('"~"')),null===e&&(42===n.charCodeAt(_r)?(e="*",_r++):(e=null,0===vr&&s('"*"')),null===e&&(39===n.charCodeAt(_r)?(e="'",_r++):(e=null,0===vr&&s('"\'"')),null===e&&(40===n.charCodeAt(_r)?(e="(",_r++):(e=null,0===vr&&s('"("')),null===e&&(41===n.charCodeAt(_r)?(e=")",_r++):(e=null,0===vr&&s('")"')))))))))),e}function _(){var e,t,r,l,i;return l=_r,i=_r,37===n.charCodeAt(_r)?(e="%",_r++):(e=null,0===vr&&s('"%"')),null!==e?(t=u(),null!==t?(r=u(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){return t.join("")}(l,e)),null===e&&(_r=l),e}function v(){var e,t,n,r,s,i;for(r=_r,s=_r,i=_r,e=[],t=a();null!==t;)e.push(t),t=a();if(null!==e?(t=l(),null!==t?e=[e,t]:(e=null,_r=i)):(e=null,_r=i),e=null!==e?e:"",null!==e){if(n=a(),null!==n)for(t=[];null!==n;)t.push(n),n=a();else t=null;null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return null!==e&&(e=function(e){return" "}(r)),null===e&&(_r=r),e}function C(){var e;return e=v(),e=null!==e?e:""}function S(){var e,t,r,l,i;for(l=_r,i=_r,e=[],t=d(),null===t&&(t=p());null!==t;)e.push(t),t=d(),null===t&&(t=p());return null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return":"}(l)),null===e&&(_r=l),e}function E(){var e,t,r,s,l,i,o;if(l=_r,i=_r,t=A(),null!==t)for(e=[];null!==t;)e.push(t),t=A();else e=null;if(null!==e){for(t=[],o=_r,r=[],s=v();null!==s;)r.push(s),s=v();for(null!==r?(s=A(),null!==s?r=[r,s]:(r=null,_r=o)):(r=null,_r=o);null!==r;){for(t.push(r),o=_r,r=[],s=v();null!==s;)r.push(s),s=v();null!==r?(s=A(),null!==s?r=[r,s]:(r=null,_r=o)):(r=null,_r=o)}null!==t?e=[e,t]:(e=null,_r=i)}else e=null,_r=i;return null!==e&&(e=function(e){return n.substring(_r,e)}(l)),null===e&&(_r=l),e}function A(){var e;return/^[!-~]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[!-~]")),null===e&&(e=y()),e}function y(){var e;return/^[\x80-\uFFFF]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[\\x80-\\uFFFF]")),e}function R(){var e;return/^[\x80-\xBF]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[\\x80-\\xBF]")),e}function b(){var e;return e=i(),null===e&&(/^[a-f]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[a-f]"))),e}function I(){var e,t,r;if(r=_r,t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"')))))))))))),null!==t)for(e=[];null!==t;)e.push(t),t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"'))))))))))));else e=null;return null!==e&&(e=function(e){return n.substring(_r,e)}(r)),null===e&&(_r=r),e}function w(){var e,t,r;if(r=_r,t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"'))))))))))),null!==t)for(e=[];null!==t;)e.push(t),t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"')))))))))));else e=null;return null!==e&&(e=function(e){return n.substring(_r,e)}(r)),null===e&&(_r=r),e}function N(){var e;return 40===n.charCodeAt(_r)?(e="(",_r++):(e=null,0===vr&&s('"("')),null===e&&(41===n.charCodeAt(_r)?(e=")",_r++):(e=null,0===vr&&s('")"')),null===e&&(60===n.charCodeAt(_r)?(e="<",_r++):(e=null,0===vr&&s('"<"')),null===e&&(62===n.charCodeAt(_r)?(e=">",_r++):(e=null,0===vr&&s('">"')),null===e&&(64===n.charCodeAt(_r)?(e="@",_r++):(e=null,0===vr&&s('"@"')),null===e&&(44===n.charCodeAt(_r)?(e=",",_r++):(e=null,0===vr&&s('","')),null===e&&(59===n.charCodeAt(_r)?(e=";",_r++):(e=null,0===vr&&s('";"')),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(92===n.charCodeAt(_r)?(e="\\",_r++):(e=null,0===vr&&s('"\\\\"')),null===e&&(e=h(),null===e&&(47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"')),null===e&&(91===n.charCodeAt(_r)?(e="[",_r++):(e=null,0===vr&&s('"["')),null===e&&(93===n.charCodeAt(_r)?(e="]",_r++):(e=null,0===vr&&s('"]"')),null===e&&(63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null===e&&(61===n.charCodeAt(_r)?(e="=",_r++):(e=null,0===vr&&s('"="')),null===e&&(123===n.charCodeAt(_r)?(e="{",_r++):(e=null,0===vr&&s('"{"')),null===e&&(125===n.charCodeAt(_r)?(e="}",_r++):(e=null,0===vr&&s('"}"')),null===e&&(e=d(),null===e&&(e=p())))))))))))))))))),e}function D(){var e,t,r;if(r=_r,t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"')),null===t&&(40===n.charCodeAt(_r)?(t="(",_r++):(t=null,0===vr&&s('"("')),null===t&&(41===n.charCodeAt(_r)?(t=")",_r++):(t=null,0===vr&&s('")"')),null===t&&(60===n.charCodeAt(_r)?(t="<",_r++):(t=null,0===vr&&s('"<"')),null===t&&(62===n.charCodeAt(_r)?(t=">",_r++):(t=null,0===vr&&s('">"')),null===t&&(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null===t&&(92===n.charCodeAt(_r)?(t="\\",_r++):(t=null,0===vr&&s('"\\\\"')),null===t&&(t=h(),null===t&&(47===n.charCodeAt(_r)?(t="/",_r++):(t=null,0===vr&&s('"/"')),null===t&&(91===n.charCodeAt(_r)?(t="[",_r++):(t=null,0===vr&&s('"["')),null===t&&(93===n.charCodeAt(_r)?(t="]",_r++):(t=null,0===vr&&s('"]"')),null===t&&(63===n.charCodeAt(_r)?(t="?",_r++):(t=null,0===vr&&s('"?"')),null===t&&(123===n.charCodeAt(_r)?(t="{",_r++):(t=null,0===vr&&s('"{"')),null===t&&(125===n.charCodeAt(_r)?(t="}",_r++):(t=null,0===vr&&s('"}"'))))))))))))))))))))))))),null!==t)for(e=[];null!==t;)e.push(t),t=f(),null===t&&(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null===t&&(46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null===t&&(33===n.charCodeAt(_r)?(t="!",_r++):(t=null,0===vr&&s('"!"')),null===t&&(37===n.charCodeAt(_r)?(t="%",_r++):(t=null,0===vr&&s('"%"')),null===t&&(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null===t&&(95===n.charCodeAt(_r)?(t="_",_r++):(t=null,0===vr&&s('"_"')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(96===n.charCodeAt(_r)?(t="`",_r++):(t=null,0===vr&&s('"`"')),null===t&&(39===n.charCodeAt(_r)?(t="'",_r++):(t=null,0===vr&&s('"\'"')),null===t&&(126===n.charCodeAt(_r)?(t="~",_r++):(t=null,0===vr&&s('"~"')),null===t&&(40===n.charCodeAt(_r)?(t="(",_r++):(t=null,0===vr&&s('"("')),null===t&&(41===n.charCodeAt(_r)?(t=")",_r++):(t=null,0===vr&&s('")"')),null===t&&(60===n.charCodeAt(_r)?(t="<",_r++):(t=null,0===vr&&s('"<"')),null===t&&(62===n.charCodeAt(_r)?(t=">",_r++):(t=null,0===vr&&s('">"')),null===t&&(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null===t&&(92===n.charCodeAt(_r)?(t="\\",_r++):(t=null,0===vr&&s('"\\\\"')),null===t&&(t=h(),null===t&&(47===n.charCodeAt(_r)?(t="/",_r++):(t=null,0===vr&&s('"/"')),null===t&&(91===n.charCodeAt(_r)?(t="[",_r++):(t=null,0===vr&&s('"["')),null===t&&(93===n.charCodeAt(_r)?(t="]",_r++):(t=null,0===vr&&s('"]"')),null===t&&(63===n.charCodeAt(_r)?(t="?",_r++):(t=null,0===vr&&s('"?"')),null===t&&(123===n.charCodeAt(_r)?(t="{",_r++):(t=null,0===vr&&s('"{"')),null===t&&(125===n.charCodeAt(_r)?(t="}",_r++):(t=null,0===vr&&s('"}"')))))))))))))))))))))))));else e=null;return null!==e&&(e=function(e){return n.substring(_r,e)}(r)),null===e&&(_r=r),e}function O(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(42===n.charCodeAt(_r)?(t="*",_r++):(t=null,0===vr&&s('"*"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return"*"}(l)),null===e&&(_r=l),e}function x(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(47===n.charCodeAt(_r)?(t="/",_r++):(t=null,0===vr&&s('"/"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return"/"}(l)),null===e&&(_r=l),e}function U(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return"="}(l)),null===e&&(_r=l),e}function M(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(40===n.charCodeAt(_r)?(t="(",_r++):(t=null,0===vr&&s('"("')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return"("}(l)),null===e&&(_r=l),e}function P(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(41===n.charCodeAt(_r)?(t=")",_r++):(t=null,0===vr&&s('")"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return")"}(l)),null===e&&(_r=l),e}function q(){var e,t,r,l;return r=_r,l=_r,62===n.charCodeAt(_r)?(e=">",_r++):(e=null,0===vr&&s('">"')),null!==e?(t=C(),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e){return">"}(r)),null===e&&(_r=r),e}function L(){var e,t,r,l;return r=_r,l=_r,e=C(),null!==e?(60===n.charCodeAt(_r)?(t="<",_r++):(t=null,0===vr&&s('"<"')),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e){return"<"}(r)),null===e&&(_r=r),e}function k(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(44===n.charCodeAt(_r)?(t=",",_r++):(t=null,0===vr&&s('","')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return","}(l)),null===e&&(_r=l),e}function H(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(59===n.charCodeAt(_r)?(t=";",_r++):(t=null,0===vr&&s('";"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return";"}(l)),null===e&&(_r=l),e}function F(){var e,t,r,l,i;return l=_r,i=_r,e=C(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=C(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return":"}(l)),null===e&&(_r=l),e}function G(){var e,t,n,r;return n=_r,r=_r,e=C(),null!==e?(t=h(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),null!==e&&(e=function(e){return'"'}(n)),null===e&&(_r=n),e}function j(){var e,t,n,r;return n=_r,r=_r,e=h(),null!==e?(t=C(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),null!==e&&(e=function(e){return'"'}(n)),null===e&&(_r=n),e}function W(){var e,t,n,r;if(r=_r,e=M(),null!==e){for(t=[],n=B(),null===n&&(n=J(),null===n&&(n=W()));null!==n;)t.push(n),n=B(),null===n&&(n=J(),null===n&&(n=W()));null!==t?(n=P(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)}else e=null,_r=r;return e}function B(){var e;return/^[!-']/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[!-']")),null===e&&(/^[*-[]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[*-[]")),null===e&&(/^[\]-~]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[\\]-~]")),null===e&&(e=y(),null===e&&(e=v())))),e}function z(){var e,t,r,s,l,i;if(l=_r,i=_r,e=C(),null!==e)if(t=h(),null!==t){for(r=[],s=Y(),null===s&&(s=J());null!==s;)r.push(s),s=Y(),null===s&&(s=J());null!==r?(s=h(),null!==s?e=[e,t,r,s]:(e=null,_r=i)):(e=null,_r=i)}else e=null,_r=i;else e=null,_r=i;return null!==e&&(e=function(e){return n.substring(_r,e)}(l)),null===e&&(_r=l),e}function V(){var e,t,r,s,l,i;if(l=_r,i=_r,e=C(),null!==e)if(t=h(),null!==t){for(r=[],s=Y(),null===s&&(s=J());null!==s;)r.push(s),s=Y(),null===s&&(s=J());null!==r?(s=h(),null!==s?e=[e,t,r,s]:(e=null,_r=i)):(e=null,_r=i)}else e=null,_r=i;else e=null,_r=i;return null!==e&&(e=function(e){return n.substring(_r-1,e+1)}(l)),null===e&&(_r=l),e}function Y(){var e;return e=v(),null===e&&(33===n.charCodeAt(_r)?(e="!",_r++):(e=null,0===vr&&s('"!"')),null===e&&(/^[#-[]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[#-[]")),null===e&&(/^[\]-~]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[\\]-~]")),null===e&&(e=y())))),e}function J(){var e,t,r;return r=_r,92===n.charCodeAt(_r)?(e="\\",_r++):(e=null,0===vr&&s('"\\\\"')),null!==e?(/^[\0-\t]/.test(n.charAt(_r))?(t=n.charAt(_r),_r++):(t=null,0===vr&&s("[\\0-\\t]")),null===t&&(/^[\x0B-\f]/.test(n.charAt(_r))?(t=n.charAt(_r),_r++):(t=null,0===vr&&s("[\\x0B-\\f]")),null===t&&(/^[\x0E-]/.test(n.charAt(_r))?(t=n.charAt(_r),_r++):(t=null,0===vr&&s("[\\x0E-]")))),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e}function K(){var e,t,r,l,i,o;return i=_r,o=_r,e=X(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=ee(),r=null!==r?r:"",null!==r?(l=se(),null!==l?e=[e,t,r,l]:(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o),null!==e&&(e=function(e){try{yr.uri=new Er(yr.scheme,yr.user,yr.host,yr.port),delete yr.scheme,delete yr.user,delete yr.host,delete yr.host_type,delete yr.port}catch(t){yr=-1}}(i)),null===e&&(_r=i),e}function $(){var e,t,l,i,o,u,a,c;return a=_r,c=_r,e=X(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(l=ee(),l=null!==l?l:"",null!==l?(i=se(),null!==i?(o=ge(),null!==o?(u=Ne(),u=null!==u?u:"",null!==u?e=[e,t,l,i,o,u]:(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c),null!==e&&(e=function(e){try{yr.uri=new Er(yr.scheme,yr.user,yr.host,yr.port,yr.uri_params,yr.uri_headers),delete yr.scheme,delete yr.user,delete yr.host,delete yr.host_type,delete yr.port,delete yr.uri_params,"SIP_URI"===r&&(yr=yr.uri)}catch(t){yr=-1}}(a)),null===e&&(_r=a),e}function X(){var e;return e=Q(),null===e&&(e=Z()),e}function Q(){var e,t;return t=_r,"sips"===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"sips"')),null!==e&&(e=function(e,t){yr.scheme=t.toLowerCase()}(t,e)),null===e&&(_r=t),e}function Z(){var e,t;return t=_r,"sip"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"sip"')),null!==e&&(e=function(e,t){yr.scheme=t.toLowerCase()}(t,e)),null===e&&(_r=t),e}function ee(){var e,t,r,l,i,o;return l=_r,i=_r,e=te(),null!==e?(o=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=re(),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o),t=null!==t?t:"",null!==t?(64===n.charCodeAt(_r)?(r="@",
_r++):(r=null,0===vr&&s('"@"')),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){yr.user=decodeURIComponent(n.substring(_r-1,e))}(l)),null===e&&(_r=l),e}function te(){var e,t;if(t=g(),null===t&&(t=_(),null===t&&(t=ne())),null!==t)for(e=[];null!==t;)e.push(t),t=g(),null===t&&(t=_(),null===t&&(t=ne()));else e=null;return e}function ne(){var e;return 38===n.charCodeAt(_r)?(e="&",_r++):(e=null,0===vr&&s('"&"')),null===e&&(61===n.charCodeAt(_r)?(e="=",_r++):(e=null,0===vr&&s('"="')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')),null===e&&(44===n.charCodeAt(_r)?(e=",",_r++):(e=null,0===vr&&s('","')),null===e&&(59===n.charCodeAt(_r)?(e=";",_r++):(e=null,0===vr&&s('";"')),null===e&&(63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null===e&&(47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"'))))))))),e}function re(){var e,t,r;for(r=_r,e=[],t=g(),null===t&&(t=_(),null===t&&(38===n.charCodeAt(_r)?(t="&",_r++):(t=null,0===vr&&s('"&"')),null===t&&(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(36===n.charCodeAt(_r)?(t="$",_r++):(t=null,0===vr&&s('"$"')),null===t&&(44===n.charCodeAt(_r)?(t=",",_r++):(t=null,0===vr&&s('","'))))))));null!==t;)e.push(t),t=g(),null===t&&(t=_(),null===t&&(38===n.charCodeAt(_r)?(t="&",_r++):(t=null,0===vr&&s('"&"')),null===t&&(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')),null===t&&(36===n.charCodeAt(_r)?(t="$",_r++):(t=null,0===vr&&s('"$"')),null===t&&(44===n.charCodeAt(_r)?(t=",",_r++):(t=null,0===vr&&s('","'))))))));return null!==e&&(e=function(e){yr.password=n.substring(_r,e)}(r)),null===e&&(_r=r),e}function se(){var e,t,r,l,i;return l=_r,e=le(),null!==e?(i=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=me(),null!==r?t=[t,r]:(t=null,_r=i)):(t=null,_r=i),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),e}function le(){var e,t;return t=_r,e=ie(),null===e&&(e=pe(),null===e&&(e=ae())),null!==e&&(e=function(e){return yr.host=n.substring(_r,e).toLowerCase(),yr.host}(t)),null===e&&(_r=t),e}function ie(){var e,t,r,l,i,o;for(l=_r,i=_r,e=[],o=_r,t=oe(),null!==t?(46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."')),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o);null!==t;)e.push(t),o=_r,t=oe(),null!==t?(46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."')),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o);return null!==e?(t=ue(),null!==t?(46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."')),r=null!==r?r:"",null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return yr.host_type="domain",n.substring(_r,e)}(l)),null===e&&(_r=l),e}function oe(){var e,t,r,l;if(l=_r,e=f(),null!==e){for(t=[],r=f(),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(95===n.charCodeAt(_r)?(r="_",_r++):(r=null,0===vr&&s('"_"'))));null!==r;)t.push(r),r=f(),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(95===n.charCodeAt(_r)?(r="_",_r++):(r=null,0===vr&&s('"_"'))));null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return e}function ue(){var e,t,r,l;if(l=_r,e=o(),null!==e){for(t=[],r=f(),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(95===n.charCodeAt(_r)?(r="_",_r++):(r=null,0===vr&&s('"_"'))));null!==r;)t.push(r),r=f(),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(95===n.charCodeAt(_r)?(r="_",_r++):(r=null,0===vr&&s('"_"'))));null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return e}function ae(){var e,t,r,l,i;return l=_r,i=_r,91===n.charCodeAt(_r)?(e="[",_r++):(e=null,0===vr&&s('"["')),null!==e?(t=ce(),null!==t?(93===n.charCodeAt(_r)?(r="]",_r++):(r=null,0===vr&&s('"]"')),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){return yr.host_type="IPv6",n.substring(_r,e)}(l)),null===e&&(_r=l),e}function ce(){var e,t,r,l,i,o,u,a,c,h,d,p,f,m,g,T;return m=_r,g=_r,e=he(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?(58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?(58===n.charCodeAt(_r)?(o=":",_r++):(o=null,0===vr&&s('":"')),null!==o?(u=he(),null!==u?(58===n.charCodeAt(_r)?(a=":",_r++):(a=null,0===vr&&s('":"')),null!==a?(c=he(),null!==c?(58===n.charCodeAt(_r)?(h=":",_r++):(h=null,0===vr&&s('":"')),null!==h?(d=he(),null!==d?(58===n.charCodeAt(_r)?(p=":",_r++):(p=null,0===vr&&s('":"')),null!==p?(f=de(),null!==f?e=[e,t,r,l,i,o,u,a,c,h,d,p,f]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?(58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?(58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?(58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=he(),null!==a?(58===n.charCodeAt(_r)?(c=":",_r++):(c=null,0===vr&&s('":"')),null!==c?(h=he(),null!==h?(58===n.charCodeAt(_r)?(d=":",_r++):(d=null,0===vr&&s('":"')),null!==d?(p=de(),null!==p?e=[e,t,r,l,i,o,u,a,c,h,d,p]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?(58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?(58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?(58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=he(),null!==a?(58===n.charCodeAt(_r)?(c=":",_r++):(c=null,0===vr&&s('":"')),null!==c?(h=de(),null!==h?e=[e,t,r,l,i,o,u,a,c,h]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?(58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?(58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?(58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=de(),null!==a?e=[e,t,r,l,i,o,u,a]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?(58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?(58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=de(),null!==o?e=[e,t,r,l,i,o]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?(58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=de(),null!==l?e=[e,t,r,l]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=de(),null!==t?e=[e,t]:(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,"::"===n.substr(_r,2)?(e="::",_r+=2):(e=null,0===vr&&s('"::"')),null!==e?(t=he(),null!==t?e=[e,t]:(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?("::"===n.substr(_r,2)?(t="::",_r+=2):(t=null,0===vr&&s('"::"')),null!==t?(r=he(),null!==r?(58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?(58===n.charCodeAt(_r)?(o=":",_r++):(o=null,0===vr&&s('":"')),null!==o?(u=he(),null!==u?(58===n.charCodeAt(_r)?(a=":",_r++):(a=null,0===vr&&s('":"')),null!==a?(c=he(),null!==c?(58===n.charCodeAt(_r)?(h=":",_r++):(h=null,0===vr&&s('":"')),null!==h?(d=de(),null!==d?e=[e,t,r,l,i,o,u,a,c,h,d]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?("::"===n.substr(_r,2)?(r="::",_r+=2):(r=null,0===vr&&s('"::"')),null!==r?(l=he(),null!==l?(58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?(58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=he(),null!==a?(58===n.charCodeAt(_r)?(c=":",_r++):(c=null,0===vr&&s('":"')),null!==c?(h=de(),null!==h?e=[e,t,r,l,i,o,u,a,c,h]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?(T=_r,58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?r=[r,l]:(r=null,_r=T)):(r=null,_r=T),r=null!==r?r:"",null!==r?("::"===n.substr(_r,2)?(l="::",_r+=2):(l=null,0===vr&&s('"::"')),null!==l?(i=he(),null!==i?(58===n.charCodeAt(_r)?(o=":",_r++):(o=null,0===vr&&s('":"')),null!==o?(u=he(),null!==u?(58===n.charCodeAt(_r)?(a=":",_r++):(a=null,0===vr&&s('":"')),null!==a?(c=de(),null!==c?e=[e,t,r,l,i,o,u,a,c]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?(T=_r,58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?r=[r,l]:(r=null,_r=T)):(r=null,_r=T),r=null!==r?r:"",null!==r?(T=_r,58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?l=[l,i]:(l=null,_r=T)):(l=null,_r=T),l=null!==l?l:"",null!==l?("::"===n.substr(_r,2)?(i="::",_r+=2):(i=null,0===vr&&s('"::"')),null!==i?(o=he(),null!==o?(58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=de(),null!==a?e=[e,t,r,l,i,o,u,a]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?(T=_r,58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?r=[r,l]:(r=null,_r=T)):(r=null,_r=T),r=null!==r?r:"",null!==r?(T=_r,58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?l=[l,i]:(l=null,_r=T)):(l=null,_r=T),l=null!==l?l:"",null!==l?(T=_r,58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?i=[i,o]:(i=null,_r=T)):(i=null,_r=T),i=null!==i?i:"",null!==i?("::"===n.substr(_r,2)?(o="::",_r+=2):(o=null,0===vr&&s('"::"')),null!==o?(u=de(),null!==u?e=[e,t,r,l,i,o,u]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?(T=_r,58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?r=[r,l]:(r=null,_r=T)):(r=null,_r=T),r=null!==r?r:"",null!==r?(T=_r,58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?l=[l,i]:(l=null,_r=T)):(l=null,_r=T),l=null!==l?l:"",null!==l?(T=_r,58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?i=[i,o]:(i=null,_r=T)):(i=null,_r=T),i=null!==i?i:"",null!==i?(T=_r,58===n.charCodeAt(_r)?(o=":",_r++):(o=null,0===vr&&s('":"')),null!==o?(u=he(),null!==u?o=[o,u]:(o=null,_r=T)):(o=null,_r=T),o=null!==o?o:"",null!==o?("::"===n.substr(_r,2)?(u="::",_r+=2):(u=null,0===vr&&s('"::"')),null!==u?(a=he(),null!==a?e=[e,t,r,l,i,o,u,a]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g),null===e&&(g=_r,e=he(),null!==e?(T=_r,58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?t=[t,r]:(t=null,_r=T)):(t=null,_r=T),t=null!==t?t:"",null!==t?(T=_r,58===n.charCodeAt(_r)?(r=":",_r++):(r=null,0===vr&&s('":"')),null!==r?(l=he(),null!==l?r=[r,l]:(r=null,_r=T)):(r=null,_r=T),r=null!==r?r:"",null!==r?(T=_r,58===n.charCodeAt(_r)?(l=":",_r++):(l=null,0===vr&&s('":"')),null!==l?(i=he(),null!==i?l=[l,i]:(l=null,_r=T)):(l=null,_r=T),l=null!==l?l:"",null!==l?(T=_r,58===n.charCodeAt(_r)?(i=":",_r++):(i=null,0===vr&&s('":"')),null!==i?(o=he(),null!==o?i=[i,o]:(i=null,_r=T)):(i=null,_r=T),i=null!==i?i:"",null!==i?(T=_r,58===n.charCodeAt(_r)?(o=":",_r++):(o=null,0===vr&&s('":"')),null!==o?(u=he(),null!==u?o=[o,u]:(o=null,_r=T)):(o=null,_r=T),o=null!==o?o:"",null!==o?(T=_r,58===n.charCodeAt(_r)?(u=":",_r++):(u=null,0===vr&&s('":"')),null!==u?(a=he(),null!==a?u=[u,a]:(u=null,_r=T)):(u=null,_r=T),u=null!==u?u:"",null!==u?("::"===n.substr(_r,2)?(a="::",_r+=2):(a=null,0===vr&&s('"::"')),null!==a?e=[e,t,r,l,i,o,u,a]:(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g)):(e=null,_r=g))))))))))))))),null!==e&&(e=function(e){return yr.host_type="IPv6",n.substring(_r,e)}(m)),null===e&&(_r=m),e}function he(){var e,t,n,r,s;return s=_r,e=u(),null!==e?(t=u(),t=null!==t?t:"",null!==t?(n=u(),n=null!==n?n:"",null!==n?(r=u(),r=null!==r?r:"",null!==r?e=[e,t,n,r]:(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s),e}function de(){var e,t,r,l;return l=_r,e=he(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=he(),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),null===e&&(e=pe()),e}function pe(){var e,t,r,l,i,o,u,a,c;return a=_r,c=_r,e=fe(),null!==e?(46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null!==t?(r=fe(),null!==r?(46===n.charCodeAt(_r)?(l=".",_r++):(l=null,0===vr&&s('"."')),null!==l?(i=fe(),null!==i?(46===n.charCodeAt(_r)?(o=".",_r++):(o=null,0===vr&&s('"."')),null!==o?(u=fe(),null!==u?e=[e,t,r,l,i,o,u]:(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c)):(e=null,_r=c),null!==e&&(e=function(e){return yr.host_type="IPv4",n.substring(_r,e)}(a)),null===e&&(_r=a),e}function fe(){var e,t,r,l;return l=_r,"25"===n.substr(_r,2)?(e="25",_r+=2):(e=null,0===vr&&s('"25"')),null!==e?(/^[0-5]/.test(n.charAt(_r))?(t=n.charAt(_r),_r++):(t=null,0===vr&&s("[0-5]")),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null===e&&(l=_r,50===n.charCodeAt(_r)?(e="2",_r++):(e=null,0===vr&&s('"2"')),null!==e?(/^[0-4]/.test(n.charAt(_r))?(t=n.charAt(_r),_r++):(t=null,0===vr&&s("[0-4]")),null!==t?(r=i(),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),null===e&&(l=_r,49===n.charCodeAt(_r)?(e="1",_r++):(e=null,0===vr&&s('"1"')),null!==e?(t=i(),null!==t?(r=i(),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),null===e&&(l=_r,/^[1-9]/.test(n.charAt(_r))?(e=n.charAt(_r),_r++):(e=null,0===vr&&s("[1-9]")),null!==e?(t=i(),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null===e&&(e=i())))),e}function me(){var e,t,n,r,s,l,o;return l=_r,o=_r,e=i(),e=null!==e?e:"",null!==e?(t=i(),t=null!==t?t:"",null!==t?(n=i(),n=null!==n?n:"",null!==n?(r=i(),r=null!==r?r:"",null!==r?(s=i(),s=null!==s?s:"",null!==s?e=[e,t,n,r,s]:(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o),null!==e&&(e=function(e,t){return t=parseInt(t.join("")),yr.port=t,t}(l,e)),null===e&&(_r=l),e}function ge(){var e,t,r,l;for(e=[],l=_r,59===n.charCodeAt(_r)?(t=";",_r++):(t=null,0===vr&&s('";"')),null!==t?(r=Te(),null!==r?t=[t,r]:(t=null,_r=l)):(t=null,_r=l);null!==t;)e.push(t),l=_r,59===n.charCodeAt(_r)?(t=";",_r++):(t=null,0===vr&&s('";"')),null!==t?(r=Te(),null!==r?t=[t,r]:(t=null,_r=l)):(t=null,_r=l);return e}function Te(){var e;return e=_e(),null===e&&(e=ve(),null===e&&(e=Ce(),null===e&&(e=Se(),null===e&&(e=Ee(),null===e&&(e=Ae(),null===e&&(e=ye())))))),e}function _e(){var e,t,r,l;return r=_r,l=_r,"transport="===n.substr(_r,10).toLowerCase()?(e=n.substr(_r,10),_r+=10):(e=null,0===vr&&s('"transport="')),null!==e?("udp"===n.substr(_r,3).toLowerCase()?(t=n.substr(_r,3),_r+=3):(t=null,0===vr&&s('"udp"')),null===t&&("tcp"===n.substr(_r,3).toLowerCase()?(t=n.substr(_r,3),_r+=3):(t=null,0===vr&&s('"tcp"')),null===t&&("sctp"===n.substr(_r,4).toLowerCase()?(t=n.substr(_r,4),_r+=4):(t=null,0===vr&&s('"sctp"')),null===t&&("tls"===n.substr(_r,3).toLowerCase()?(t=n.substr(_r,3),_r+=3):(t=null,0===vr&&s('"tls"')),null===t&&(t=I())))),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e,t){yr.uri_params||(yr.uri_params={}),yr.uri_params.transport=t.toLowerCase()}(r,e[1])),null===e&&(_r=r),e}function ve(){var e,t,r,l;return r=_r,l=_r,"user="===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"user="')),null!==e?("phone"===n.substr(_r,5).toLowerCase()?(t=n.substr(_r,5),_r+=5):(t=null,0===vr&&s('"phone"')),null===t&&("ip"===n.substr(_r,2).toLowerCase()?(t=n.substr(_r,2),_r+=2):(t=null,0===vr&&s('"ip"')),null===t&&(t=I())),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e,t){yr.uri_params||(yr.uri_params={}),yr.uri_params.user=t.toLowerCase()}(r,e[1])),null===e&&(_r=r),e}function Ce(){var e,t,r,l;return r=_r,l=_r,"method="===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"method="')),null!==e?(t=at(),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e,t){yr.uri_params||(yr.uri_params={}),yr.uri_params.method=t}(r,e[1])),null===e&&(_r=r),e}function Se(){var e,t,r,l;return r=_r,l=_r,"ttl="===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"ttl="')),null!==e?(t=Jn(),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e,t){yr.params||(yr.params={}),yr.params.ttl=t}(r,e[1])),null===e&&(_r=r),e}function Ee(){var e,t,r,l;return r=_r,l=_r,"maddr="===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"maddr="')),null!==e?(t=le(),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),null!==e&&(e=function(e,t){yr.uri_params||(yr.uri_params={}),yr.uri_params.maddr=t}(r,e[1])),null===e&&(_r=r),e}function Ae(){var e,t,r,l,i,o;return l=_r,i=_r,"lr"===n.substr(_r,2).toLowerCase()?(e=n.substr(_r,2),_r+=2):(e=null,0===vr&&s('"lr"')),null!==e?(o=_r,61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null!==t?(r=I(),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){yr.uri_params||(yr.uri_params={}),yr.uri_params.lr=void 0}(l)),null===e&&(_r=l),e}function ye(){var e,t,r,l,i,o;return l=_r,i=_r,e=Re(),null!==e?(o=_r,61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null!==t?(r=be(),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t,n){yr.uri_params||(yr.uri_params={}),n="undefined"==typeof n?void 0:n[1],yr.uri_params[t.toLowerCase()]=n}(l,e[0],e[1])),null===e&&(_r=l),e}function Re(){var e,t,n;if(n=_r,t=Ie(),null!==t)for(e=[];null!==t;)e.push(t),t=Ie();else e=null;return null!==e&&(e=function(e,t){return t.join("")}(n,e)),null===e&&(_r=n),e}function be(){var e,t,n;if(n=_r,t=Ie(),null!==t)for(e=[];null!==t;)e.push(t),t=Ie();else e=null;return null!==e&&(e=function(e,t){return t.join("")}(n,e)),null===e&&(_r=n),e}function Ie(){var e;return e=we(),null===e&&(e=g(),null===e&&(e=_())),e}function we(){var e;return 91===n.charCodeAt(_r)?(e="[",_r++):(e=null,0===vr&&s('"["')),null===e&&(93===n.charCodeAt(_r)?(e="]",_r++):(e=null,0===vr&&s('"]"')),null===e&&(47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"')),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(38===n.charCodeAt(_r)?(e="&",_r++):(e=null,0===vr&&s('"&"')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')))))))),e}function Ne(){var e,t,r,l,i,o,u;if(o=_r,63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null!==e)if(t=De(),null!==t){for(r=[],u=_r,38===n.charCodeAt(_r)?(l="&",_r++):(l=null,0===vr&&s('"&"')),null!==l?(i=De(),null!==i?l=[l,i]:(l=null,_r=u)):(l=null,_r=u);null!==l;)r.push(l),u=_r,38===n.charCodeAt(_r)?(l="&",_r++):(l=null,0===vr&&s('"&"')),null!==l?(i=De(),null!==i?l=[l,i]:(l=null,_r=u)):(l=null,_r=u);null!==r?e=[e,t,r]:(e=null,_r=o)}else e=null,_r=o;else e=null,_r=o;return e}function De(){var e,t,r,l,i;return l=_r,i=_r,e=Oe(),null!==e?(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null!==t?(r=xe(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t,n){t=t.join("").toLowerCase(),n=n.join(""),yr.uri_headers||(yr.uri_headers={}),yr.uri_headers[t]?yr.uri_headers[t].push(n):yr.uri_headers[t]=[n]}(l,e[0],e[2])),null===e&&(_r=l),e}function Oe(){var e,t;if(t=Ue(),null===t&&(t=g(),null===t&&(t=_())),null!==t)for(e=[];null!==t;)e.push(t),t=Ue(),null===t&&(t=g(),null===t&&(t=_()));else e=null;return e}function xe(){var e,t;for(e=[],t=Ue(),null===t&&(t=g(),null===t&&(t=_()));null!==t;)e.push(t),t=Ue(),null===t&&(t=g(),null===t&&(t=_()));return e}function Ue(){var e;return 91===n.charCodeAt(_r)?(e="[",_r++):(e=null,0===vr&&s('"["')),null===e&&(93===n.charCodeAt(_r)?(e="]",_r++):(e=null,0===vr&&s('"]"')),null===e&&(47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"')),null===e&&(63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')))))))),e}function Me(){var e;return e=ct(),null===e&&(e=Pe()),e}function Pe(){var e,t,n,r,s,l;return l=_r,e=at(),null!==e?(t=d(),null!==t?(n=qe(),null!==n?(r=d(),null!==r?(s=Ze(),null!==s?e=[e,t,n,r,s]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function qe(){var e;return e=$(),null===e&&(e=Le()),e}function Le(){var e,t,r,l;return l=_r,e=Je(),null!==e?(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null!==t?(r=ke(),null===r&&(r=Ge()),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function ke(){var e,t,r,l,i;return l=_r,e=He(),null===e&&(e=Fe()),null!==e?(i=_r,63===n.charCodeAt(_r)?(t="?",_r++):(t=null,0===vr&&s('"?"')),null!==t?(r=Qe(),null!==r?t=[t,r]:(t=null,_r=i)):(t=null,_r=i),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),e}function He(){var e,t,r,l;return l=_r,"//"===n.substr(_r,2)?(e="//",_r+=2):(e=null,0===vr&&s('"//"')),null!==e?(t=Ke(),null!==t?(r=Fe(),r=null!==r?r:"",null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function Fe(){var e,t,r;return r=_r,47===n.charCodeAt(_r)?(e="/",_r++):(e=null,0===vr&&s('"/"')),null!==e?(t=Be(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e}function Ge(){var e,t,n,r;if(r=_r,e=We(),null!==e){for(t=[],n=je();null!==n;)t.push(n),n=je();null!==t?e=[e,t]:(e=null,_r=r)}else e=null,_r=r;return e}function je(){var e;return e=m(),null===e&&(e=g(),null===e&&(e=_())),e}function We(){var e;return e=g(),null===e&&(e=_(),null===e&&(59===n.charCodeAt(_r)?(e=";",_r++):(e=null,0===vr&&s('";"')),null===e&&(63===n.charCodeAt(_r)?(e="?",_r++):(e=null,0===vr&&s('"?"')),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(64===n.charCodeAt(_r)?(e="@",_r++):(e=null,0===vr&&s('"@"')),null===e&&(38===n.charCodeAt(_r)?(e="&",_r++):(e=null,0===vr&&s('"&"')),null===e&&(61===n.charCodeAt(_r)?(e="=",_r++):(e=null,0===vr&&s('"="')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')),null===e&&(44===n.charCodeAt(_r)?(e=",",_r++):(e=null,0===vr&&s('","')))))))))))),e}function Be(){var e,t,r,l,i,o;if(i=_r,e=ze(),null!==e){for(t=[],o=_r,47===n.charCodeAt(_r)?(r="/",_r++):(r=null,0===vr&&s('"/"')),null!==r?(l=ze(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==r;)t.push(r),o=_r,47===n.charCodeAt(_r)?(r="/",_r++):(r=null,0===vr&&s('"/"')),null!==r?(l=ze(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==t?e=[e,t]:(e=null,_r=i)}else e=null,_r=i;return e}function ze(){var e,t,r,l,i,o;for(i=_r,e=[],t=Ye();null!==t;)e.push(t),t=Ye();if(null!==e){for(t=[],o=_r,59===n.charCodeAt(_r)?(r=";",_r++):(r=null,0===vr&&s('";"')),null!==r?(l=Ve(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==r;)t.push(r),o=_r,59===n.charCodeAt(_r)?(r=";",_r++):(r=null,0===vr&&s('";"')),null!==r?(l=Ve(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==t?e=[e,t]:(e=null,_r=i)}else e=null,_r=i;return e}function Ve(){var e,t;for(e=[],t=Ye();null!==t;)e.push(t),t=Ye();return e}function Ye(){var e;return e=g(),null===e&&(e=_(),null===e&&(58===n.charCodeAt(_r)?(e=":",_r++):(e=null,0===vr&&s('":"')),null===e&&(64===n.charCodeAt(_r)?(e="@",_r++):(e=null,0===vr&&s('"@"')),null===e&&(38===n.charCodeAt(_r)?(e="&",_r++):(e=null,0===vr&&s('"&"')),null===e&&(61===n.charCodeAt(_r)?(e="=",_r++):(e=null,0===vr&&s('"="')),null===e&&(43===n.charCodeAt(_r)?(e="+",_r++):(e=null,0===vr&&s('"+"')),null===e&&(36===n.charCodeAt(_r)?(e="$",_r++):(e=null,0===vr&&s('"$"')),null===e&&(44===n.charCodeAt(_r)?(e=",",_r++):(e=null,0===vr&&s('","')))))))))),e}function Je(){var e,t,r,l,u;if(l=_r,u=_r,e=o(),null!==e){for(t=[],r=o(),null===r&&(r=i(),null===r&&(43===n.charCodeAt(_r)?(r="+",_r++):(r=null,0===vr&&s('"+"')),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."'))))));null!==r;)t.push(r),r=o(),null===r&&(r=i(),null===r&&(43===n.charCodeAt(_r)?(r="+",_r++):(r=null,0===vr&&s('"+"')),null===r&&(45===n.charCodeAt(_r)?(r="-",_r++):(r=null,0===vr&&s('"-"')),null===r&&(46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."'))))));null!==t?e=[e,t]:(e=null,_r=u)}else e=null,_r=u;return null!==e&&(e=function(e){yr.scheme=n.substring(_r,e)}(l)),null===e&&(_r=l),e}function Ke(){var e;return e=$e(),null===e&&(e=Xe()),e}function $e(){var e,t,r,l;return r=_r,l=_r,e=ee(),null!==e?(64===n.charCodeAt(_r)?(t="@",_r++):(t=null,0===vr&&s('"@"')),null!==t?e=[e,t]:(e=null,_r=l)):(e=null,_r=l),e=null!==e?e:"",null!==e?(t=se(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e=null!==e?e:""}function Xe(){var e,t;if(t=g(),null===t&&(t=_(),null===t&&(36===n.charCodeAt(_r)?(t="$",_r++):(t=null,0===vr&&s('"$"')),null===t&&(44===n.charCodeAt(_r)?(t=",",_r++):(t=null,0===vr&&s('","')),null===t&&(59===n.charCodeAt(_r)?(t=";",_r++):(t=null,0===vr&&s('";"')),null===t&&(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null===t&&(64===n.charCodeAt(_r)?(t="@",_r++):(t=null,0===vr&&s('"@"')),null===t&&(38===n.charCodeAt(_r)?(t="&",_r++):(t=null,0===vr&&s('"&"')),null===t&&(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"'))))))))))),null!==t)for(e=[];null!==t;)e.push(t),t=g(),null===t&&(t=_(),null===t&&(36===n.charCodeAt(_r)?(t="$",_r++):(t=null,0===vr&&s('"$"')),null===t&&(44===n.charCodeAt(_r)?(t=",",_r++):(t=null,0===vr&&s('","')),null===t&&(59===n.charCodeAt(_r)?(t=";",_r++):(t=null,0===vr&&s('";"')),null===t&&(58===n.charCodeAt(_r)?(t=":",_r++):(t=null,0===vr&&s('":"')),null===t&&(64===n.charCodeAt(_r)?(t="@",_r++):(t=null,0===vr&&s('"@"')),null===t&&(38===n.charCodeAt(_r)?(t="&",_r++):(t=null,0===vr&&s('"&"')),null===t&&(61===n.charCodeAt(_r)?(t="=",_r++):(t=null,0===vr&&s('"="')),null===t&&(43===n.charCodeAt(_r)?(t="+",_r++):(t=null,0===vr&&s('"+"')))))))))));else e=null;return e}function Qe(){var e,t;for(e=[],t=je();null!==t;)e.push(t),t=je();return e}function Ze(){var e,t,r,l,o,u,a,c;if(a=_r,c=_r,"sip"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"SIP"')),null!==e)if(47===n.charCodeAt(_r)?(t="/",_r++):(t=null,0===vr&&s('"/"')),null!==t){if(l=i(),null!==l)for(r=[];null!==l;)r.push(l),l=i();else r=null;if(null!==r)if(46===n.charCodeAt(_r)?(l=".",_r++):(l=null,0===vr&&s('"."')),null!==l){if(u=i(),null!==u)for(o=[];null!==u;)o.push(u),u=i();else o=null;null!==o?e=[e,t,r,l,o]:(e=null,_r=c)}else e=null,_r=c;else e=null,_r=c}else e=null,_r=c;else e=null,_r=c;return null!==e&&(e=function(e){yr.sip_version=n.substring(_r,e)}(a)),null===e&&(_r=a),e}function et(){var e;return"INVITE"===n.substr(_r,6)?(e="INVITE",_r+=6):(e=null,0===vr&&s('"INVITE"')),e}function tt(){var e;return"ACK"===n.substr(_r,3)?(e="ACK",_r+=3):(e=null,0===vr&&s('"ACK"')),e}function nt(){var e;return"OPTIONS"===n.substr(_r,7)?(e="OPTIONS",_r+=7):(e=null,0===vr&&s('"OPTIONS"')),e}function rt(){var e;return"BYE"===n.substr(_r,3)?(e="BYE",_r+=3):(e=null,0===vr&&s('"BYE"')),e}function st(){var e;return"CANCEL"===n.substr(_r,6)?(e="CANCEL",_r+=6):(e=null,0===vr&&s('"CANCEL"')),e}function lt(){var e;return"REGISTER"===n.substr(_r,8)?(e="REGISTER",_r+=8):(e=null,0===vr&&s('"REGISTER"')),e}function it(){var e;return"SUBSCRIBE"===n.substr(_r,9)?(e="SUBSCRIBE",_r+=9):(e=null,0===vr&&s('"SUBSCRIBE"')),e}function ot(){var e;return"NOTIFY"===n.substr(_r,6)?(e="NOTIFY",_r+=6):(e=null,0===vr&&s('"NOTIFY"')),e}function ut(){var e;return"REFER"===n.substr(_r,5)?(e="REFER",_r+=5):(e=null,0===vr&&s('"REFER"')),e}function at(){var e,t;return t=_r,e=et(),null===e&&(e=tt(),null===e&&(e=nt(),null===e&&(e=rt(),null===e&&(e=st(),null===e&&(e=lt(),null===e&&(e=it(),null===e&&(e=ot(),null===e&&(e=ut(),null===e&&(e=I()))))))))),null!==e&&(e=function(e){return yr.method=n.substring(_r,e),yr.method}(t)),null===e&&(_r=t),e}function ct(){var e,t,n,r,s,l;return l=_r,e=Ze(),null!==e?(t=d(),null!==t?(n=ht(),null!==n?(r=d(),null!==r?(s=pt(),null!==s?e=[e,t,n,r,s]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function ht(){var e,t;return t=_r,e=dt(),null!==e&&(e=function(e,t){yr.status_code=parseInt(t.join(""))}(t,e)),null===e&&(_r=t),e}function dt(){var e,t,n,r;return r=_r,e=i(),null!==e?(t=i(),null!==t?(n=i(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function pt(){var e,t,r;for(r=_r,e=[],t=m(),null===t&&(t=g(),null===t&&(t=_(),null===t&&(t=y(),null===t&&(t=R(),null===t&&(t=d(),null===t&&(t=p()))))));null!==t;)e.push(t),t=m(),null===t&&(t=g(),null===t&&(t=_(),null===t&&(t=y(),null===t&&(t=R(),null===t&&(t=d(),null===t&&(t=p()))))));return null!==e&&(e=function(e){yr.reason_phrase=n.substring(_r,e)}(r)),null===e&&(_r=r),e}function ft(){var e,t,n,r,s,l;if(s=_r,e=Yt(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=Yt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=Yt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function mt(){var e,t,r,l,i,o;return l=_r,i=_r,e=D(),null!==e?(o=_r,64===n.charCodeAt(_r)?(t="@",_r++):(t=null,0===vr&&s('"@"')),null!==t?(r=D(),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){yr=n.substring(_r,e)}(l)),null===e&&(_r=l),e}function gt(){var e,t,n,r,s,l,i;if(s=_r,e=O(),null===e)if(l=_r,e=Tt(),null!==e){for(t=[],i=_r,n=k(),null!==n?(r=Tt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=k(),null!==n?(r=Tt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,
_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t,n;for(n=yr.multi_header.length,t=0;n>t;t++)if(null===yr.multi_header[t].parsed){yr=null;break}yr=null!==yr?yr.multi_header:-1}(s)),null===e&&(_r=s),e}function Tt(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=K(),null===e&&(e=_t()),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Ct(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Ct(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t;yr.multi_header||(yr.multi_header=[]);try{t=new Ar(yr.uri,yr.display_name,yr.params),delete yr.uri,delete yr.display_name,delete yr.params}catch(n){t=null}yr.multi_header.push({possition:_r,offset:e,parsed:t})}(s)),null===e&&(_r=s),e}function _t(){var e,t,n,r,s;return s=_r,e=vt(),e=null!==e?e:"",null!==e?(t=L(),null!==t?(n=$(),null!==n?(r=q(),null!==r?e=[e,t,n,r]:(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s),e}function vt(){var e,t,r,s,l,i,o;if(l=_r,i=_r,e=I(),null!==e){for(t=[],o=_r,r=v(),null!==r?(s=I(),null!==s?r=[r,s]:(r=null,_r=o)):(r=null,_r=o);null!==r;)t.push(r),o=_r,r=v(),null!==r?(s=I(),null!==s?r=[r,s]:(r=null,_r=o)):(r=null,_r=o);null!==t?e=[e,t]:(e=null,_r=i)}else e=null,_r=i;return null===e&&(e=z()),null!==e&&(e=function(e,t){t=n.substring(_r,e).trim(),'"'===t[0]&&(t=t.substring(1,t.length-1)),yr.display_name=t}(l,e)),null===e&&(_r=l),e}function Ct(){var e;return e=St(),null===e&&(e=Et(),null===e&&(e=Rt())),e}function St(){var e,t,r,l,i;return l=_r,i=_r,"q"===n.substr(_r,1).toLowerCase()?(e=n.substr(_r,1),_r++):(e=null,0===vr&&s('"q"')),null!==e?(t=U(),null!==t?(r=yt(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.params||(yr.params={}),yr.params.q=t}(l,e[2])),null===e&&(_r=l),e}function Et(){var e,t,r,l,i;return l=_r,i=_r,"expires"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"expires"')),null!==e?(t=U(),null!==t?(r=At(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.params||(yr.params={}),yr.params.expires=t}(l,e[2])),null===e&&(_r=l),e}function At(){var e,t,n;if(n=_r,t=i(),null!==t)for(e=[];null!==t;)e.push(t),t=i();else e=null;return null!==e&&(e=function(e,t){return parseInt(t.join(""))}(n,e)),null===e&&(_r=n),e}function yt(){var e,t,r,l,o,u,a,c;return u=_r,a=_r,48===n.charCodeAt(_r)?(e="0",_r++):(e=null,0===vr&&s('"0"')),null!==e?(c=_r,46===n.charCodeAt(_r)?(t=".",_r++):(t=null,0===vr&&s('"."')),null!==t?(r=i(),r=null!==r?r:"",null!==r?(l=i(),l=null!==l?l:"",null!==l?(o=i(),o=null!==o?o:"",null!==o?t=[t,r,l,o]:(t=null,_r=c)):(t=null,_r=c)):(t=null,_r=c)):(t=null,_r=c),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=a)):(e=null,_r=a),null!==e&&(e=function(e){return parseFloat(n.substring(_r,e))}(u)),null===e&&(_r=u),e}function Rt(){var e,t,n,r,s,l;return r=_r,s=_r,e=I(),null!==e?(l=_r,t=U(),null!==t?(n=bt(),null!==n?t=[t,n]:(t=null,_r=l)):(t=null,_r=l),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=s)):(e=null,_r=s),null!==e&&(e=function(e,t,n){yr.params||(yr.params={}),n="undefined"==typeof n?void 0:n[1],yr.params[t.toLowerCase()]=n}(r,e[0],e[1])),null===e&&(_r=r),e}function bt(){var e;return e=I(),null===e&&(e=le(),null===e&&(e=z())),e}function It(){var e,t,n,r,s,l;if(s=_r,e=wt(),null!==e){for(t=[],l=_r,n=H(),null!==n?(r=Nt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=H(),null!==n?(r=Nt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function wt(){var e;return"render"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"render"')),null===e&&("session"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"session"')),null===e&&("icon"===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"icon"')),null===e&&("alert"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"alert"')),null===e&&(e=I())))),e}function Nt(){var e;return e=Dt(),null===e&&(e=Rt()),e}function Dt(){var e,t,r,l;return l=_r,"handling"===n.substr(_r,8).toLowerCase()?(e=n.substr(_r,8),_r+=8):(e=null,0===vr&&s('"handling"')),null!==e?(t=U(),null!==t?("optional"===n.substr(_r,8).toLowerCase()?(r=n.substr(_r,8),_r+=8):(r=null,0===vr&&s('"optional"')),null===r&&("required"===n.substr(_r,8).toLowerCase()?(r=n.substr(_r,8),_r+=8):(r=null,0===vr&&s('"required"')),null===r&&(r=I())),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function Ot(){var e,t,n,r,s,l;if(s=_r,e=I(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function xt(){var e,t,n;if(n=_r,t=i(),null!==t)for(e=[];null!==t;)e.push(t),t=i();else e=null;return null!==e&&(e=function(e,t){yr=parseInt(t.join(""))}(n,e)),null===e&&(_r=n),e}function Ut(){var e,t;return t=_r,e=Mt(),null!==e&&(e=function(e){yr=n.substring(_r,e)}(t)),null===e&&(_r=t),e}function Mt(){var e,t,n,r,s,l,i,o;if(i=_r,e=Pt(),null!==e)if(t=x(),null!==t)if(n=Ft(),null!==n){for(r=[],o=_r,s=H(),null!==s?(l=Gt(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==s;)r.push(s),o=_r,s=H(),null!==s?(l=Gt(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==r?e=[e,t,n,r]:(e=null,_r=i)}else e=null,_r=i;else e=null,_r=i;else e=null,_r=i;return e}function Pt(){var e;return e=qt(),null===e&&(e=Lt()),e}function qt(){var e;return"text"===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"text"')),null===e&&("image"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"image"')),null===e&&("audio"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"audio"')),null===e&&("video"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"video"')),null===e&&("application"===n.substr(_r,11).toLowerCase()?(e=n.substr(_r,11),_r+=11):(e=null,0===vr&&s('"application"')),null===e&&(e=kt()))))),e}function Lt(){var e;return"message"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"message"')),null===e&&("multipart"===n.substr(_r,9).toLowerCase()?(e=n.substr(_r,9),_r+=9):(e=null,0===vr&&s('"multipart"')),null===e&&(e=kt())),e}function kt(){var e;return e=I(),null===e&&(e=Ht()),e}function Ht(){var e,t,r;return r=_r,"x-"===n.substr(_r,2).toLowerCase()?(e=n.substr(_r,2),_r+=2):(e=null,0===vr&&s('"x-"')),null!==e?(t=I(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e}function Ft(){var e;return e=kt(),null===e&&(e=I()),e}function Gt(){var e,t,n,r;return r=_r,e=I(),null!==e?(t=U(),null!==t?(n=jt(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function jt(){var e;return e=I(),null===e&&(e=z()),e}function Wt(){var e,t,n,r;return r=_r,e=Bt(),null!==e?(t=v(),null!==t?(n=at(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function Bt(){var e,t,n;if(n=_r,t=i(),null!==t)for(e=[];null!==t;)e.push(t),t=i();else e=null;return null!==e&&(e=function(e,t){yr.value=parseInt(t.join(""))}(n,e)),null===e&&(_r=n),e}function zt(){var e,t;return t=_r,e=At(),null!==e&&(e=function(e,t){yr=t}(t,e)),null===e&&(_r=t),e}function Vt(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=Yt(),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e,t){yr.event=t.join("").toLowerCase()}(s,e[0])),null===e&&(_r=s),e}function Yt(){var e,t,r,l,i,o;if(i=_r,e=w(),null!==e){for(t=[],o=_r,46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."')),null!==r?(l=w(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==r;)t.push(r),o=_r,46===n.charCodeAt(_r)?(r=".",_r++):(r=null,0===vr&&s('"."')),null!==r?(l=w(),null!==l?r=[r,l]:(r=null,_r=o)):(r=null,_r=o);null!==t?e=[e,t]:(e=null,_r=i)}else e=null,_r=i;return e}function Jt(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=K(),null===e&&(e=_t()),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Kt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Kt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t=yr.tag;try{yr=new Ar(yr.uri,yr.display_name,yr.params),t&&yr.setParam("tag",t)}catch(n){yr=-1}}(s)),null===e&&(_r=s),e}function Kt(){var e;return e=$t(),null===e&&(e=Rt()),e}function $t(){var e,t,r,l,i;return l=_r,i=_r,"tag"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"tag"')),null!==e?(t=U(),null!==t?(r=I(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.tag=t}(l,e[2])),null===e&&(_r=l),e}function Xt(){var e,t,n;if(n=_r,t=i(),null!==t)for(e=[];null!==t;)e.push(t),t=i();else e=null;return null!==e&&(e=function(e,t){yr=parseInt(t.join(""))}(n,e)),null===e&&(_r=n),e}function Qt(){var e,t;return t=_r,e=At(),null!==e&&(e=function(e,t){yr=t}(t,e)),null===e&&(_r=t),e}function Zt(){var e,t,n,r,s,l,i,o,u,a;for(o=_r,u=_r,e=[],t=vt();null!==t;)e.push(t),t=vt();if(null!==e)if(t=L(),null!==t)if(n=$(),null!==n)if(r=q(),null!==r){for(s=[],a=_r,l=H(),null!==l?(i=Rt(),null!==i?l=[l,i]:(l=null,_r=a)):(l=null,_r=a);null!==l;)s.push(l),a=_r,l=H(),null!==l?(i=Rt(),null!==i?l=[l,i]:(l=null,_r=a)):(l=null,_r=a);null!==s?e=[e,t,n,r,s]:(e=null,_r=u)}else e=null,_r=u;else e=null,_r=u;else e=null,_r=u;else e=null,_r=u;return null!==e&&(e=function(e){try{yr=new Ar(yr.uri,yr.display_name,yr.params)}catch(t){yr=-1}}(o)),null===e&&(_r=o),e}function en(){var e;return e=tn()}function tn(){var e,t,r,l,i,o,u,a;if(u=_r,"digest"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"Digest"')),null!==e)if(t=v(),null!==t)if(r=sn(),null!==r){for(l=[],a=_r,i=k(),null!==i?(o=sn(),null!==o?i=[i,o]:(i=null,_r=a)):(i=null,_r=a);null!==i;)l.push(i),a=_r,i=k(),null!==i?(o=sn(),null!==o?i=[i,o]:(i=null,_r=a)):(i=null,_r=a);null!==l?e=[e,t,r,l]:(e=null,_r=u)}else e=null,_r=u;else e=null,_r=u;else e=null,_r=u;return null===e&&(e=nn()),e}function nn(){var e,t,n,r,s,l,i,o;if(i=_r,e=I(),null!==e)if(t=v(),null!==t)if(n=rn(),null!==n){for(r=[],o=_r,s=k(),null!==s?(l=rn(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==s;)r.push(s),o=_r,s=k(),null!==s?(l=rn(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==r?e=[e,t,n,r]:(e=null,_r=i)}else e=null,_r=i;else e=null,_r=i;else e=null,_r=i;return e}function rn(){var e,t,n,r;return r=_r,e=I(),null!==e?(t=U(),null!==t?(n=I(),null===n&&(n=z()),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function sn(){var e;return e=ln(),null===e&&(e=un(),null===e&&(e=cn(),null===e&&(e=dn(),null===e&&(e=pn(),null===e&&(e=fn(),null===e&&(e=mn(),null===e&&(e=rn()))))))),e}function ln(){var e,t,r,l;return l=_r,"realm"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"realm"')),null!==e?(t=U(),null!==t?(r=on(),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function on(){var e,t;return t=_r,e=V(),null!==e&&(e=function(e,t){yr.realm=t}(t,e)),null===e&&(_r=t),e}function un(){var e,t,r,l,i,o,u,a,c;if(a=_r,"domain"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"domain"')),null!==e)if(t=U(),null!==t)if(r=G(),null!==r)if(l=an(),null!==l){if(i=[],c=_r,u=d(),null!==u)for(o=[];null!==u;)o.push(u),u=d();else o=null;for(null!==o?(u=an(),null!==u?o=[o,u]:(o=null,_r=c)):(o=null,_r=c);null!==o;){if(i.push(o),c=_r,u=d(),null!==u)for(o=[];null!==u;)o.push(u),u=d();else o=null;null!==o?(u=an(),null!==u?o=[o,u]:(o=null,_r=c)):(o=null,_r=c)}null!==i?(o=j(),null!==o?e=[e,t,r,l,i,o]:(e=null,_r=a)):(e=null,_r=a)}else e=null,_r=a;else e=null,_r=a;else e=null,_r=a;else e=null,_r=a;return e}function an(){var e;return e=Le(),null===e&&(e=Fe()),e}function cn(){var e,t,r,l;return l=_r,"nonce"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"nonce"')),null!==e?(t=U(),null!==t?(r=hn(),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function hn(){var e,t;return t=_r,e=V(),null!==e&&(e=function(e,t){yr.nonce=t}(t,e)),null===e&&(_r=t),e}function dn(){var e,t,r,l,i;return l=_r,i=_r,"opaque"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"opaque"')),null!==e?(t=U(),null!==t?(r=V(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.opaque=t}(l,e[2])),null===e&&(_r=l),e}function pn(){var e,t,r,l,i;return l=_r,"stale"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"stale"')),null!==e?(t=U(),null!==t?(i=_r,"true"===n.substr(_r,4).toLowerCase()?(r=n.substr(_r,4),_r+=4):(r=null,0===vr&&s('"true"')),null!==r&&(r=function(e){yr.stale=!0}(i)),null===r&&(_r=i),null===r&&(i=_r,"false"===n.substr(_r,5).toLowerCase()?(r=n.substr(_r,5),_r+=5):(r=null,0===vr&&s('"false"')),null!==r&&(r=function(e){yr.stale=!1}(i)),null===r&&(_r=i)),null!==r?e=[e,t,r]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function fn(){var e,t,r,l,i;return l=_r,i=_r,"algorithm"===n.substr(_r,9).toLowerCase()?(e=n.substr(_r,9),_r+=9):(e=null,0===vr&&s('"algorithm"')),null!==e?(t=U(),null!==t?("md5"===n.substr(_r,3).toLowerCase()?(r=n.substr(_r,3),_r+=3):(r=null,0===vr&&s('"MD5"')),null===r&&("md5-sess"===n.substr(_r,8).toLowerCase()?(r=n.substr(_r,8),_r+=8):(r=null,0===vr&&s('"MD5-sess"')),null===r&&(r=I())),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.algorithm=t.toUpperCase()}(l,e[2])),null===e&&(_r=l),e}function mn(){var e,t,r,l,i,o,u,a,c,h;if(a=_r,"qop"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"qop"')),null!==e)if(t=U(),null!==t)if(r=G(),null!==r){if(c=_r,l=gn(),null!==l){for(i=[],h=_r,44===n.charCodeAt(_r)?(o=",",_r++):(o=null,0===vr&&s('","')),null!==o?(u=gn(),null!==u?o=[o,u]:(o=null,_r=h)):(o=null,_r=h);null!==o;)i.push(o),h=_r,44===n.charCodeAt(_r)?(o=",",_r++):(o=null,0===vr&&s('","')),null!==o?(u=gn(),null!==u?o=[o,u]:(o=null,_r=h)):(o=null,_r=h);null!==i?l=[l,i]:(l=null,_r=c)}else l=null,_r=c;null!==l?(i=j(),null!==i?e=[e,t,r,l,i]:(e=null,_r=a)):(e=null,_r=a)}else e=null,_r=a;else e=null,_r=a;else e=null,_r=a;return e}function gn(){var e,t;return t=_r,"auth-int"===n.substr(_r,8).toLowerCase()?(e=n.substr(_r,8),_r+=8):(e=null,0===vr&&s('"auth-int"')),null===e&&("auth"===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"auth"')),null===e&&(e=I())),null!==e&&(e=function(e,t){yr.qop||(yr.qop=[]),yr.qop.push(t.toLowerCase())}(t,e)),null===e&&(_r=t),e}function Tn(){var e,t,n,r,s,l;if(s=_r,e=I(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function _n(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=vn(),null!==e){for(t=[],i=_r,n=k(),null!==n?(r=vn(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=k(),null!==n?(r=vn(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t,n;for(n=yr.multi_header.length,t=0;n>t;t++)if(null===yr.multi_header[t].parsed){yr=null;break}yr=null!==yr?yr.multi_header:-1}(s)),null===e&&(_r=s),e}function vn(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=_t(),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t;yr.multi_header||(yr.multi_header=[]);try{t=new Ar(yr.uri,yr.display_name,yr.params),delete yr.uri,delete yr.display_name,delete yr.params}catch(n){t=null}yr.multi_header.push({possition:_r,offset:e,parsed:t})}(s)),null===e&&(_r=s),e}function Cn(){var e,t,r,l,i,o,u;if(i=_r,o=_r,"sip"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"SIP"')),null===e&&(e=I()),null!==e){for(t=[],u=_r,r=H(),null!==r?(l=Sn(),null!==l?r=[r,l]:(r=null,_r=u)):(r=null,_r=u);null!==r;)t.push(r),u=_r,r=H(),null!==r?(l=Sn(),null!==l?r=[r,l]:(r=null,_r=u)):(r=null,_r=u);null!==t?e=[e,t]:(e=null,_r=o)}else e=null,_r=o;return null!==e&&(e=function(e,t){if(yr.protocol=t.toLowerCase(),yr.params||(yr.params={}),yr.params.text&&'"'===yr.params.text[0]){var n=yr.params.text;yr.text=n.substring(1,n.length-1),delete yr.params.text}}(i,e[0])),null===e&&(_r=i),e}function Sn(){var e;return e=En(),null===e&&(e=Rt()),e}function En(){var e,t,r,l,o,u;if(o=_r,u=_r,"cause"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"cause"')),null!==e)if(t=U(),null!==t){if(l=i(),null!==l)for(r=[];null!==l;)r.push(l),l=i();else r=null;null!==r?e=[e,t,r]:(e=null,_r=u)}else e=null,_r=u;else e=null,_r=u;return null!==e&&(e=function(e,t){yr.cause=parseInt(t.join(""))}(o,e[2])),null===e&&(_r=o),e}function An(){var e,t,n,r,s,l;if(s=_r,e=I(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function yn(){var e,t,n,r,s,l;if(s=_r,e=Rn(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=Rn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=Rn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function Rn(){var e,t,n,r,s,l;if(s=_r,e=_t(),null!==e){for(t=[],l=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function bn(){var e,t,n,r,s,l;if(s=_r,e=In(),null!==e){for(t=[],l=_r,n=H(),null!==n?(r=wn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=H(),null!==n?(r=wn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function In(){var e,t;return t=_r,"active"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"active"')),null===e&&("pending"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"pending"')),null===e&&("terminated"===n.substr(_r,10).toLowerCase()?(e=n.substr(_r,10),_r+=10):(e=null,0===vr&&s('"terminated"')),null===e&&(e=I()))),null!==e&&(e=function(e){yr.state=n.substring(_r,e)}(t)),null===e&&(_r=t),e}function wn(){var e,t,r,l,i;return l=_r,i=_r,"reason"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"reason"')),null!==e?(t=U(),null!==t?(r=Nn(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){"undefined"!=typeof t&&(yr.reason=t)}(l,e[2])),null===e&&(_r=l),null===e&&(l=_r,i=_r,"expires"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"expires"')),null!==e?(t=U(),null!==t?(r=At(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){"undefined"!=typeof t&&(yr.expires=t)}(l,e[2])),null===e&&(_r=l),null===e&&(l=_r,i=_r,"retry_after"===n.substr(_r,11).toLowerCase()?(e=n.substr(_r,11),_r+=11):(e=null,0===vr&&s('"retry_after"')),null!==e?(t=U(),null!==t?(r=At(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){"undefined"!=typeof t&&(yr.retry_after=t)}(l,e[2])),null===e&&(_r=l),null===e&&(e=Rt()))),e}function Nn(){var e;return"deactivated"===n.substr(_r,11).toLowerCase()?(e=n.substr(_r,11),_r+=11):(e=null,0===vr&&s('"deactivated"')),null===e&&("probation"===n.substr(_r,9).toLowerCase()?(e=n.substr(_r,9),_r+=9):(e=null,0===vr&&s('"probation"')),null===e&&("rejected"===n.substr(_r,8).toLowerCase()?(e=n.substr(_r,8),_r+=8):(e=null,0===vr&&s('"rejected"')),null===e&&("timeout"===n.substr(_r,7).toLowerCase()?(e=n.substr(_r,7),_r+=7):(e=null,0===vr&&s('"timeout"')),null===e&&("giveup"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"giveup"')),null===e&&("noresource"===n.substr(_r,10).toLowerCase()?(e=n.substr(_r,10),_r+=10):(e=null,0===vr&&s('"noresource"')),null===e&&("invariant"===n.substr(_r,9).toLowerCase()?(e=n.substr(_r,9),_r+=9):(e=null,0===vr&&s('"invariant"')),null===e&&(e=I()))))))),e}function Dn(){var e;return e=E(),e=null!==e?e:""}function On(){var e,t,n,r,s,l;if(s=_r,e=I(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=I(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e=null!==e?e:""}function xn(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=K(),null===e&&(e=_t()),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Un(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Un(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){var t=yr.tag;try{yr=new Ar(yr.uri,yr.display_name,yr.params),t&&yr.setParam("tag",t)}catch(n){yr=-1}}(s)),null===e&&(_r=s),e}function Un(){var e;return e=$t(),null===e&&(e=Rt()),e}function Mn(){var e,t,n,r,s,l;if(s=_r,e=Pn(),null!==e){for(t=[],l=_r,n=k(),null!==n?(r=Pn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=k(),null!==n?(r=Pn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function Pn(){var e,t,n,r,s,l,i,o;if(i=_r,e=jn(),null!==e)if(t=v(),null!==t)if(n=zn(),null!==n){for(r=[],o=_r,s=H(),null!==s?(l=qn(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==s;)r.push(s),o=_r,s=H(),null!==s?(l=qn(),null!==l?s=[s,l]:(s=null,_r=o)):(s=null,_r=o);null!==r?e=[e,t,n,r]:(e=null,_r=i)}else e=null,_r=i;else e=null,_r=i;else e=null,_r=i;return e}function qn(){var e;return e=Ln(),null===e&&(e=kn(),null===e&&(e=Hn(),null===e&&(e=Fn(),null===e&&(e=Gn(),null===e&&(e=Rt()))))),e}function Ln(){var e,t,r,l,i;return l=_r,i=_r,"ttl"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"ttl"')),null!==e?(t=U(),null!==t?(r=Jn(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.ttl=t}(l,e[2])),null===e&&(_r=l),e}function kn(){var e,t,r,l,i;return l=_r,i=_r,"maddr"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"maddr"')),null!==e?(t=U(),null!==t?(r=le(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.maddr=t}(l,e[2])),null===e&&(_r=l),e}function Hn(){var e,t,r,l,i;return l=_r,i=_r,"received"===n.substr(_r,8).toLowerCase()?(e=n.substr(_r,8),_r+=8):(e=null,0===vr&&s('"received"')),null!==e?(t=U(),null!==t?(r=pe(),null===r&&(r=ce()),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.received=t}(l,e[2])),null===e&&(_r=l),e}function Fn(){var e,t,r,l,i;return l=_r,i=_r,"branch"===n.substr(_r,6).toLowerCase()?(e=n.substr(_r,6),_r+=6):(e=null,0===vr&&s('"branch"')),null!==e?(t=U(),null!==t?(r=I(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.branch=t}(l,e[2])),null===e&&(_r=l),e}function Gn(){var e,t,r,l,o,u,a;if(o=_r,u=_r,"rport"===n.substr(_r,5).toLowerCase()?(e=n.substr(_r,5),_r+=5):(e=null,0===vr&&s('"rport"')),null!==e){if(a=_r,t=U(),null!==t){for(r=[],l=i();null!==l;)r.push(l),l=i();null!==r?t=[t,r]:(t=null,_r=a)}else t=null,_r=a;t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=u)}else e=null,_r=u;return null!==e&&(e=function(e){"undefined"!=typeof response_port&&(yr.rport=response_port.join(""))}(o)),null===e&&(_r=o),e}function jn(){var e,t,n,r,s,l;return l=_r,e=Wn(),null!==e?(t=x(),null!==t?(n=I(),null!==n?(r=x(),null!==r?(s=Bn(),null!==s?e=[e,t,n,r,s]:(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l)):(e=null,_r=l),e}function Wn(){var e,t;return t=_r,"sip"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"SIP"')),null===e&&(e=I()),null!==e&&(e=function(e,t){yr.protocol=t}(t,e)),null===e&&(_r=t),e}function Bn(){var e,t;return t=_r,"udp"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"UDP"')),null===e&&("tcp"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"TCP"')),null===e&&("tls"===n.substr(_r,3).toLowerCase()?(e=n.substr(_r,3),_r+=3):(e=null,0===vr&&s('"TLS"')),null===e&&("sctp"===n.substr(_r,4).toLowerCase()?(e=n.substr(_r,4),_r+=4):(e=null,0===vr&&s('"SCTP"')),null===e&&(e=I())))),null!==e&&(e=function(e,t){yr.transport=t}(t,e)),null===e&&(_r=t),e}function zn(){var e,t,n,r,s;return r=_r,e=Vn(),null!==e?(s=_r,t=F(),null!==t?(n=Yn(),null!==n?t=[t,n]:(t=null,_r=s)):(t=null,_r=s),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e}function Vn(){var e,t;return t=_r,e=pe(),null===e&&(e=ae(),null===e&&(e=ie())),null!==e&&(e=function(e){yr.host=n.substring(_r,e)}(t)),null===e&&(_r=t),e}function Yn(){var e,t,n,r,s,l,o;return l=_r,o=_r,e=i(),e=null!==e?e:"",null!==e?(t=i(),t=null!==t?t:"",null!==t?(n=i(),n=null!==n?n:"",null!==n?(r=i(),r=null!==r?r:"",null!==r?(s=i(),s=null!==s?s:"",null!==s?e=[e,t,n,r,s]:(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o)):(e=null,_r=o),null!==e&&(e=function(e,t){yr.port=parseInt(t.join(""))}(l,e)),null===e&&(_r=l),e}function Jn(){var e,t,n,r,s;return r=_r,s=_r,e=i(),null!==e?(t=i(),t=null!==t?t:"",null!==t?(n=i(),n=null!==n?n:"",null!==n?e=[e,t,n]:(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s),null!==e&&(e=function(e,t){return parseInt(t.join(""))}(r,e)),null===e&&(_r=r),e}function Kn(){var e;return e=tn()}function $n(){var e,t,n,r,s,l;if(s=_r,e=Xn(),null!==e){for(t=[],l=_r,n=H(),null!==n?(r=Qn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=H(),null!==n?(r=Qn(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function Xn(){var e,t;return t=_r,e=At(),null!==e&&(e=function(e,t){yr.expires=t}(t,e)),null===e&&(_r=t),e}function Qn(){var e;return e=Zn(),null===e&&(e=Rt()),e}function Zn(){var e,t,r,l,i;return l=_r,i=_r,"refresher"===n.substr(_r,9).toLowerCase()?(e=n.substr(_r,9),_r+=9):(e=null,0===vr&&s('"refresher"')),null!==e?(t=U(),null!==t?("uac"===n.substr(_r,3).toLowerCase()?(r=n.substr(_r,3),_r+=3):(r=null,0===vr&&s('"uac"')),null===r&&("uas"===n.substr(_r,3).toLowerCase()?(r=n.substr(_r,3),_r+=3):(r=null,0===vr&&s('"uas"'))),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.refresher=t.toLowerCase()}(l,e[2])),null===e&&(_r=l),e}function er(){var e,t,n,r;return r=_r,e=I(),null!==e?(t=S(),null!==t?(n=tr(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function tr(){var e,t;for(e=[],t=A(),null===t&&(t=R(),null===t&&(t=v()));null!==t;)e.push(t),t=A(),null===t&&(t=R(),null===t&&(t=v()));return e}function nr(){var e,t;for(e=[],t=c();null!==t;)e.push(t),t=c();return e}function rr(){var e,t,r;return r=_r,"uuid:"===n.substr(_r,5)?(e="uuid:",_r+=5):(e=null,0===vr&&s('"uuid:"')),null!==e?(t=sr(),null!==t?e=[e,t]:(e=null,_r=r)):(e=null,_r=r),e}function sr(){var e,t,r,l,i,o,u,a,c,h,d;return h=_r,d=_r,e=ir(),null!==e?(45===n.charCodeAt(_r)?(t="-",_r++):(t=null,0===vr&&s('"-"')),null!==t?(r=lr(),null!==r?(45===n.charCodeAt(_r)?(l="-",_r++):(l=null,0===vr&&s('"-"')),null!==l?(i=lr(),null!==i?(45===n.charCodeAt(_r)?(o="-",_r++):(o=null,0===vr&&s('"-"')),null!==o?(u=lr(),null!==u?(45===n.charCodeAt(_r)?(a="-",_r++):(a=null,0===vr&&s('"-"')),null!==a?(c=or(),null!==c?e=[e,t,r,l,i,o,u,a,c]:(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d)):(e=null,_r=d),null!==e&&(e=function(e,t){yr=n.substring(_r+5,e)}(h,e[0])),null===e&&(_r=h),e}function lr(){var e,t,n,r,s;return s=_r,e=u(),null!==e?(t=u(),null!==t?(n=u(),null!==n?(r=u(),null!==r?e=[e,t,n,r]:(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s)):(e=null,_r=s),e}function ir(){var e,t,n;return n=_r,e=lr(),null!==e?(t=lr(),null!==t?e=[e,t]:(e=null,_r=n)):(e=null,_r=n),e}function or(){var e,t,n,r;return r=_r,e=lr(),null!==e?(t=lr(),null!==t?(n=lr(),null!==n?e=[e,t,n]:(e=null,_r=r)):(e=null,_r=r)):(e=null,_r=r),e}function ur(){var e,t,n,r,s,l,i;if(s=_r,l=_r,e=K(),null===e&&(e=_t()),null!==e){for(t=[],i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==n;)t.push(n),i=_r,n=H(),null!==n?(r=Rt(),null!==r?n=[n,r]:(n=null,_r=i)):(n=null,_r=i);null!==t?e=[e,t]:(e=null,_r=l)}else e=null,_r=l;return null!==e&&(e=function(e){try{yr=new Ar(yr.uri,yr.display_name,yr.params)}catch(t){yr=-1}}(s)),null===e&&(_r=s),e}function ar(){var e,t,n,r,s,l;if(s=_r,e=cr(),null!==e){for(t=[],l=_r,n=H(),null!==n?(r=hr(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==n;)t.push(n),l=_r,n=H(),null!==n?(r=hr(),null!==r?n=[n,r]:(n=null,_r=l)):(n=null,_r=l);null!==t?e=[e,t]:(e=null,_r=s)}else e=null,_r=s;return e}function cr(){var e,t,r,l,i,o;return l=_r,i=_r,e=D(),null!==e?(o=_r,64===n.charCodeAt(_r)?(t="@",_r++):(t=null,0===vr&&s('"@"')),null!==t?(r=D(),null!==r?t=[t,r]:(t=null,_r=o)):(t=null,_r=o),t=null!==t?t:"",null!==t?e=[e,t]:(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e){yr.call_id=n.substring(_r,e)}(l)),null===e&&(_r=l),e}function hr(){var e;return e=dr(),null===e&&(e=pr(),null===e&&(e=fr(),null===e&&(e=Rt()))),e}function dr(){var e,t,r,l,i;return l=_r,i=_r,"to-tag"===n.substr(_r,6)?(e="to-tag",_r+=6):(e=null,0===vr&&s('"to-tag"')),null!==e?(t=U(),null!==t?(r=I(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.to_tag=t}(l,e[2])),null===e&&(_r=l),e}function pr(){var e,t,r,l,i;return l=_r,i=_r,"from-tag"===n.substr(_r,8)?(e="from-tag",_r+=8):(e=null,0===vr&&s('"from-tag"')),null!==e?(t=U(),null!==t?(r=I(),null!==r?e=[e,t,r]:(e=null,_r=i)):(e=null,_r=i)):(e=null,_r=i),null!==e&&(e=function(e,t){yr.from_tag=t}(l,e[2])),null===e&&(_r=l),e}function fr(){var e,t;return t=_r,"early-only"===n.substr(_r,10)?(e="early-only",_r+=10):(e=null,0===vr&&s('"early-only"')),null!==e&&(e=function(e){yr.early_only=!0}(t)),null===e&&(_r=t),e}function mr(e){e.sort();for(var t=null,n=[],r=0;r<e.length;r++)e[r]!==t&&(n.push(e[r]),t=e[r]);return n}function gr(){for(var e=1,t=1,r=!1,s=0;s<Math.max(_r,Cr);s++){var l=n.charAt(s);"\n"===l?(r||e++,t=1,r=!1):"\r"===l||"\u2028"===l||"\u2029"===l?(e++,t=1,r=!0):(t++,r=!1)}return{line:e,column:t}}var Tr={CRLF:l,DIGIT:i,ALPHA:o,HEXDIG:u,WSP:a,OCTET:c,DQUOTE:h,SP:d,HTAB:p,alphanum:f,reserved:m,unreserved:g,mark:T,escaped:_,LWS:v,SWS:C,HCOLON:S,TEXT_UTF8_TRIM:E,TEXT_UTF8char:A,UTF8_NONASCII:y,UTF8_CONT:R,LHEX:b,token:I,token_nodot:w,separators:N,word:D,STAR:O,SLASH:x,EQUAL:U,LPAREN:M,RPAREN:P,RAQUOT:q,LAQUOT:L,COMMA:k,SEMI:H,COLON:F,LDQUOT:G,RDQUOT:j,comment:W,ctext:B,quoted_string:z,quoted_string_clean:V,qdtext:Y,quoted_pair:J,SIP_URI_noparams:K,SIP_URI:$,uri_scheme:X,uri_scheme_sips:Q,uri_scheme_sip:Z,userinfo:ee,user:te,user_unreserved:ne,password:re,hostport:se,host:le,hostname:ie,domainlabel:oe,toplabel:ue,IPv6reference:ae,IPv6address:ce,h16:he,ls32:de,IPv4address:pe,dec_octet:fe,port:me,uri_parameters:ge,uri_parameter:Te,transport_param:_e,user_param:ve,method_param:Ce,ttl_param:Se,maddr_param:Ee,lr_param:Ae,other_param:ye,pname:Re,pvalue:be,paramchar:Ie,param_unreserved:we,headers:Ne,header:De,hname:Oe,hvalue:xe,hnv_unreserved:Ue,Request_Response:Me,Request_Line:Pe,Request_URI:qe,absoluteURI:Le,hier_part:ke,net_path:He,abs_path:Fe,opaque_part:Ge,uric:je,uric_no_slash:We,path_segments:Be,segment:ze,param:Ve,pchar:Ye,scheme:Je,authority:Ke,srvr:$e,reg_name:Xe,query:Qe,SIP_Version:Ze,INVITEm:et,ACKm:tt,OPTIONSm:nt,BYEm:rt,CANCELm:st,REGISTERm:lt,SUBSCRIBEm:it,NOTIFYm:ot,REFERm:ut,Method:at,Status_Line:ct,Status_Code:ht,extension_code:dt,Reason_Phrase:pt,
Allow_Events:ft,Call_ID:mt,Contact:gt,contact_param:Tt,name_addr:_t,display_name:vt,contact_params:Ct,c_p_q:St,c_p_expires:Et,delta_seconds:At,qvalue:yt,generic_param:Rt,gen_value:bt,Content_Disposition:It,disp_type:wt,disp_param:Nt,handling_param:Dt,Content_Encoding:Ot,Content_Length:xt,Content_Type:Ut,media_type:Mt,m_type:Pt,discrete_type:qt,composite_type:Lt,extension_token:kt,x_token:Ht,m_subtype:Ft,m_parameter:Gt,m_value:jt,CSeq:Wt,CSeq_value:Bt,Expires:zt,Event:Vt,event_type:Yt,From:Jt,from_param:Kt,tag_param:$t,Max_Forwards:Xt,Min_Expires:Qt,Name_Addr_Header:Zt,Proxy_Authenticate:en,challenge:tn,other_challenge:nn,auth_param:rn,digest_cln:sn,realm:ln,realm_value:on,domain:un,URI:an,nonce:cn,nonce_value:hn,opaque:dn,stale:pn,algorithm:fn,qop_options:mn,qop_value:gn,Proxy_Require:Tn,Record_Route:_n,rec_route:vn,Reason:Cn,reason_param:Sn,reason_cause:En,Require:An,Route:yn,route_param:Rn,Subscription_State:bn,substate_value:In,subexp_params:wn,event_reason_value:Nn,Subject:Dn,Supported:On,To:xn,to_param:Un,Via:Mn,via_param:Pn,via_params:qn,via_ttl:Ln,via_maddr:kn,via_received:Hn,via_branch:Fn,response_port:Gn,sent_protocol:jn,protocol_name:Wn,transport:Bn,sent_by:zn,via_host:Vn,via_port:Yn,ttl:Jn,WWW_Authenticate:Kn,Session_Expires:$n,s_e_expires:Xn,s_e_params:Qn,s_e_refresher:Zn,extension_header:er,header_value:tr,message_body:nr,uuid_URI:rr,uuid:sr,hex4:lr,hex8:ir,hex12:or,Refer_To:ur,Replaces:ar,call_id:cr,replaces_param:hr,to_tag:dr,from_tag:pr,early_flag:fr};if(void 0!==r){if(void 0===Tr[r])throw new Error("Invalid rule name: "+t(r)+".")}else r="CRLF";var _r=0,vr=0,Cr=0,Sr=[],Er=e("./URI"),Ar=e("./NameAddrHeader"),yr={},Rr=Tr[r]();if(null===Rr||_r!==n.length){var br=Math.max(_r,Cr),Ir=br<n.length?n.charAt(br):null,wr=gr();return new this.SyntaxError(mr(Sr),Ir,br,wr.line,wr.column),-1}return yr},toSource:function(){return this._source}};return n.SyntaxError=function(e,n,r,s,l){function i(e,n){var r,s;switch(e.length){case 0:r="end of input";break;case 1:r=e[0];break;default:r=e.slice(0,e.length-1).join(", ")+" or "+e[e.length-1]}return s=n?t(n):"end of input","Expected "+r+" but "+s+" found."}this.name="SyntaxError",this.expected=e,this.found=n,this.message=i(e,n),this.offset=r,this.line=s,this.column=l},n.SyntaxError.prototype=Error.prototype,n}()},{"./NameAddrHeader":9,"./URI":24}],7:[function(e,t,n){var r=e("debug")("JsSIP"),s=e("../package.json");r("version %s",s.version);var l=e("rtcninja"),i=e("./Constants"),o=e("./Exceptions"),u=e("./Utils"),a=e("./UA"),c=e("./URI"),h=e("./NameAddrHeader"),d=e("./Grammar"),p=e("./Socket"),f=e("./WebSocketInterface"),m=t.exports={C:i,Exceptions:o,Utils:u,UA:a,URI:c,NameAddrHeader:h,Socket:p,WebSocketInterface:f,Grammar:d,debug:e("debug"),rtcninja:l};Object.defineProperties(m,{name:{get:function(){return s.title}},version:{get:function(){return s.version}}})},{"../package.json":47,"./Constants":1,"./Exceptions":5,"./Grammar":6,"./NameAddrHeader":9,"./Socket":19,"./UA":23,"./URI":24,"./Utils":25,"./WebSocketInterface":26,debug:33,rtcninja:38}],8:[function(e,t,n){function r(e){this.ua=e,this.data={},l.EventEmitter.call(this)}t.exports=r;var s=e("util"),l=e("events"),i=e("./Constants"),o=e("./SIPMessage"),u=e("./Utils"),a=e("./RequestSender"),c=e("./Transactions"),h=e("./Exceptions");s.inherits(r,l.EventEmitter),r.prototype.send=function(e,t,n){var r,s,l,u,c,h=e;if(void 0===e||void 0===t)throw new TypeError("Not enough arguments");if(e=this.ua.normalizeTarget(e),!e)throw new TypeError("Invalid target: "+h);n=n||{},c=n.extraHeaders&&n.extraHeaders.slice()||[],u=n.eventHandlers||{},l=n.contentType||"text/plain",this.content_type=l;for(s in u)this.on(s,u[s]);this.closed=!1,this.ua.applicants[this]=this,c.push("Content-Type: "+l),this.request=new o.OutgoingRequest(i.MESSAGE,e,this.ua,null,c),t?(this.request.body=t,this.content=t):this.content=null,r=new a(this,this.ua),this.newMessage("local",this.request),r.send()},r.prototype.receiveResponse=function(e){var t;if(!this.closed)switch(!0){case/^1[0-9]{2}$/.test(e.status_code):break;case/^2[0-9]{2}$/.test(e.status_code):delete this.ua.applicants[this],this.emit("succeeded",{originator:"remote",response:e});break;default:delete this.ua.applicants[this],t=u.sipErrorCause(e.status_code),this.emit("failed",{originator:"remote",response:e,cause:t})}},r.prototype.onRequestTimeout=function(){this.closed||this.emit("failed",{originator:"system",cause:i.causes.REQUEST_TIMEOUT})},r.prototype.onTransportError=function(){this.closed||this.emit("failed",{originator:"system",cause:i.causes.CONNECTION_ERROR})},r.prototype.close=function(){this.closed=!0,delete this.ua.applicants[this]},r.prototype.init_incoming=function(e){var t;this.request=e,this.content_type=e.getHeader("Content-Type"),e.body?this.content=e.body:this.content=null,this.newMessage("remote",e),t=this.ua.transactions.nist[e.via_branch],!t||t.state!==c.C.STATUS_TRYING&&t.state!==c.C.STATUS_PROCEEDING||e.reply(200)},r.prototype.accept=function(e){e=e||{};var t=e.extraHeaders&&e.extraHeaders.slice()||[],n=e.body;if("incoming"!==this.direction)throw new h.NotSupportedError('"accept" not supported for outgoing Message');this.request.reply(200,null,t,n)},r.prototype.reject=function(e){e=e||{};var t=e.status_code||480,n=e.reason_phrase,r=e.extraHeaders&&e.extraHeaders.slice()||[],s=e.body;if("incoming"!==this.direction)throw new h.NotSupportedError('"reject" not supported for outgoing Message');if(300>t||t>=700)throw new TypeError("Invalid status_code: "+t);this.request.reply(t,n,r,s)},r.prototype.newMessage=function(e,t){"remote"===e?(this.direction="incoming",this.local_identity=t.to,this.remote_identity=t.from):"local"===e&&(this.direction="outgoing",this.local_identity=t.from,this.remote_identity=t.to),this.ua.newMessage({originator:e,message:this,request:t})}},{"./Constants":1,"./Exceptions":5,"./RequestSender":17,"./SIPMessage":18,"./Transactions":21,"./Utils":25,events:28,util:32}],9:[function(e,t,n){function r(e,t,n){var r;if(!(e&&e instanceof s))throw new TypeError('missing or invalid "uri" parameter');this.uri=e,this.parameters={};for(r in n)this.setParam(r,n[r]);Object.defineProperties(this,{display_name:{get:function(){return t},set:function(e){t=0===e?"0":e}}})}t.exports=r;var s=e("./URI"),l=e("./Grammar");r.prototype={setParam:function(e,t){e&&(this.parameters[e.toLowerCase()]="undefined"==typeof t||null===t?null:t.toString())},getParam:function(e){return e?this.parameters[e.toLowerCase()]:void 0},hasParam:function(e){return e?this.parameters.hasOwnProperty(e.toLowerCase())&&!0||!1:void 0},deleteParam:function(e){var t;return e=e.toLowerCase(),this.parameters.hasOwnProperty(e)?(t=this.parameters[e],delete this.parameters[e],t):void 0},clearParams:function(){this.parameters={}},clone:function(){return new r(this.uri.clone(),this.display_name,JSON.parse(JSON.stringify(this.parameters)))},toString:function(){var e,t;e=this.display_name||0===this.display_name?'"'+this.display_name+'" ':"",e+="<"+this.uri.toString()+">";for(t in this.parameters)e+=";"+t,null!==this.parameters[t]&&(e+="="+this.parameters[t]);return e}},r.parse=function(e){return e=l.parse(e,"Name_Addr_Header"),-1!==e?e:void 0}},{"./Grammar":6,"./URI":24}],10:[function(e,t,n){function r(e,t){var n=t,r=0,s=0;if(e.substring(n,n+2).match(/(^\r\n)/))return-2;for(;0===r;){if(s=e.indexOf("\r\n",n),-1===s)return s;!e.substring(s+2,s+4).match(/(^\r\n)/)&&e.charAt(s+2).match(/(^\s+)/)?n=s+2:r=s}return r}function s(e,t,n,r){var s,l,i,a,c=t.indexOf(":",n),h=t.substring(n,c).trim(),d=t.substring(c+1,r).trim();switch(h.toLowerCase()){case"via":case"v":e.addHeader("via",d),1===e.getHeaders("via").length?(a=e.parseHeader("Via"),a&&(e.via=a,e.via_branch=a.branch)):a=0;break;case"from":case"f":e.setHeader("from",d),a=e.parseHeader("from"),a&&(e.from=a,e.from_tag=a.getParam("tag"));break;case"to":case"t":e.setHeader("to",d),a=e.parseHeader("to"),a&&(e.to=a,e.to_tag=a.getParam("tag"));break;case"record-route":for(a=o.parse(d,"Record_Route"),-1===a&&(a=void 0),i=a.length,l=0;i>l;l++)s=a[l],e.addHeader("record-route",d.substring(s.possition,s.offset)),e.headers["Record-Route"][e.getHeaders("record-route").length-1].parsed=s.parsed;break;case"call-id":case"i":e.setHeader("call-id",d),a=e.parseHeader("call-id"),a&&(e.call_id=d);break;case"contact":case"m":for(a=o.parse(d,"Contact"),-1===a&&(a=void 0),i=a.length,l=0;i>l;l++)s=a[l],e.addHeader("contact",d.substring(s.possition,s.offset)),e.headers.Contact[e.getHeaders("contact").length-1].parsed=s.parsed;break;case"content-length":case"l":e.setHeader("content-length",d),a=e.parseHeader("content-length");break;case"content-type":case"c":e.setHeader("content-type",d),a=e.parseHeader("content-type");break;case"cseq":e.setHeader("cseq",d),a=e.parseHeader("cseq"),a&&(e.cseq=a.value),e instanceof u.IncomingResponse&&(e.method=a.method);break;case"max-forwards":e.setHeader("max-forwards",d),a=e.parseHeader("max-forwards");break;case"www-authenticate":e.setHeader("www-authenticate",d),a=e.parseHeader("www-authenticate");break;case"proxy-authenticate":e.setHeader("proxy-authenticate",d),a=e.parseHeader("proxy-authenticate");break;case"session-expires":case"x":e.setHeader("session-expires",d),a=e.parseHeader("session-expires"),a&&(e.session_expires=a.expires,e.session_expires_refresher=a.refresher);break;case"refer-to":case"r":e.setHeader("refer-to",d),a=e.parseHeader("refer-to"),a&&(e.refer_to=a);break;case"replaces":e.setHeader("replaces",d),a=e.parseHeader("replaces"),a&&(e.replaces=a);break;case"event":case"o":e.setHeader("event",d),a=e.parseHeader("event"),a&&(e.event=a);break;default:e.setHeader(h,d),a=0}return void 0===a?{error:'error parsing header "'+h+'"'}:!0}var l={};t.exports=l;var i=e("debug")("JsSIP:ERROR:Parser");i.log=console.warn.bind(console);var o=e("./Grammar"),u=e("./SIPMessage");l.parseMessage=function(e,t){var n,l,a,c,h,d=0,p=e.indexOf("\r\n");if(-1===p)return void i("parseMessage() | no CRLF found, not a SIP message");if(l=e.substring(0,p),h=o.parse(l,"Request_Response"),-1===h)return void i('parseMessage() | error parsing first line of SIP message: "'+l+'"');for(h.status_code?(n=new u.IncomingResponse,n.status_code=h.status_code,n.reason_phrase=h.reason_phrase):(n=new u.IncomingRequest(t),n.method=h.method,n.ruri=h.uri),n.data=e,d=p+2;;){if(p=r(e,d),-2===p){c=d+2;break}if(-1===p)return void i("parseMessage() | malformed message");if(h=s(n,e,d,p),h!==!0)return void i("parseMessage() |",h.error);d=p+2}return n.hasHeader("content-length")?(a=n.getHeader("content-length"),n.body=e.substr(c,a)):n.body=e.substring(c),n}},{"./Grammar":6,"./SIPMessage":18,debug:33}],11:[function(e,t,n){function r(e){G("new"),this.ua=e,this.status=k.STATUS_NULL,this.dialog=null,this.earlyDialogs={},this.connection=null,this.is_confirmed=!1,this.late_sdp=!1,this.rtcOfferConstraints=null,this.rtcAnswerConstraints=null,this.localMediaStream=null,this.localMediaStreamLocallyGenerated=!1,this.rtcReady=!0,this.timers={ackTimer:null,expiresTimer:null,invite2xxTimer:null,userNoAnswerTimer:null},this.direction=null,this.local_identity=null,this.remote_identity=null,this.start_time=null,this.end_time=null,this.tones=null,this.audioMuted=!1,this.videoMuted=!1,this.localHold=!1,this.remoteHold=!1,this.sessionTimers={enabled:this.ua.configuration.session_timers,defaultExpires:z.SESSION_EXPIRES,currentExpires:null,running:!1,refresher:!1,timer:null},this.referSubscribers={},this.data={},F.EventEmitter.call(this)}function s(e,t){var n=this,r=K.T1;this.timers.invite2xxTimer=setTimeout(function s(){n.status===k.STATUS_WAITING_FOR_ACK&&(e.reply(200,null,["Contact: "+n.contact],t),r<K.T2&&(r=2*r,r>K.T2&&(r=K.T2)),n.timers.invite2xxTimer=setTimeout(s,r))},r)}function l(){var e=this;this.timers.ackTimer=setTimeout(function(){e.status===k.STATUS_WAITING_FOR_ACK&&(G("no ACK received, terminating the session"),clearTimeout(e.timers.invite2xxTimer),v.call(e,z.BYE),x.call(e,"remote",null,z.causes.NO_ACK))},K.TIMER_H)}function i(e,t){var n=this;this.connection=new W.RTCPeerConnection(e,t),this.connection.onaddstream=function(e,t){n.emit("addstream",{stream:t})},this.connection.onremovestream=function(e,t){n.emit("removestream",{stream:t})},this.connection.oniceconnectionstatechange=function(e,t){n.emit("iceconnectionstatechange",{state:t}),"failed"===t&&n.terminate({cause:z.causes.RTP_TIMEOUT,status_code:200,reason_phrase:z.causes.RTP_TIMEOUT})}}function o(e,t,n,r){function s(r){i.onicecandidate=function(n,r){if(!r){if(i.onicecandidate=null,l.rtcReady=!0,t){var s={originator:"local",type:e,sdp:i.localDescription.sdp};l.emit("sdp",s),t(s.sdp)}t=null}},i.setLocalDescription(r,function(){if("complete"===i.iceGatheringState){if(l.rtcReady=!0,t){var n={originator:"local",type:e,sdp:i.localDescription.sdp};l.emit("sdp",n),t(n.sdp)}t=null}},function(e){l.rtcReady=!0,n&&n(e)})}G("createLocalDescription()");var l=this,i=this.connection;if(this.rtcReady=!1,"offer"===e)i.createOffer(s,function(e){l.rtcReady=!0,n&&n(e)},r);else{if("answer"!==e)throw new Error('createLocalDescription() | type must be "offer" or "answer", but "'+e+'" was given');i.createAnswer(s,function(e){l.rtcReady=!0,n&&n(e)},r)}}function u(e,t,n){var r,s,l="UAS"===t?e.to_tag:e.from_tag,i="UAS"===t?e.from_tag:e.to_tag,o=e.call_id+l+i;return s=this.earlyDialogs[o],n?s?!0:(s=new X(this,e,t,X.C.STATUS_EARLY),s.error?(G(s.error),U.call(this,"remote",e,z.causes.INTERNAL_ERROR),!1):(this.earlyDialogs[o]=s,!0)):(this.from_tag=e.from_tag,this.to_tag=e.to_tag,s?(s.update(e,t),this.dialog=s,delete this.earlyDialogs[o],!0):(r=new X(this,e,t),r.error?(G(r.error),U.call(this,"remote",e,z.causes.INTERNAL_ERROR),!1):(this.dialog=r,!0)))}function a(e){function t(t){t=t||{},f=!0;var n=t.status_code||403,r=t.reason_phrase||"",s=t.extraHeaders&&t.extraHeaders.slice()||[];if(this.status!==k.STATUS_CONFIRMED)return!1;if(300>n||n>=700)throw new TypeError("Invalid status_code: "+n);e.reply(n,r,s)}function n(){r(function(t){var n=["Contact: "+h.contact];E.call(h,e,n),h.late_sdp&&(t=C.call(h,t)),e.reply(200,null,n,t,function(){h.status=k.STATUS_WAITING_FOR_ACK,s.call(h,e,t),l.call(h)}),"function"==typeof m.callback&&m.callback()},function(){e.reply(500)})}function r(e,t){h.late_sdp?o.call(h,"offer",e,t,h.rtcOfferConstraints):(h.remoteHold===!0&&p===!1?(h.remoteHold=!1,P.call(h,"remote")):h.remoteHold===!1&&p===!0&&(h.remoteHold=!0,M.call(h,"remote")),o.call(h,"answer",e,t,h.rtcAnswerConstraints))}G("receiveReinvite()");var i,u,a,c,h=this,d=e.getHeader("Content-Type"),p=!1,f=!1,m={request:e,callback:void 0,reject:t.bind(this)};if(this.emit("reinvite",m),!f)if(e.body){if(this.late_sdp=!1,"application/sdp"!==d)return G("invalid Content-Type"),void e.reply(415);for(i=e.parseSDP(),u=0;u<i.media.length;u++)if(c=i.media[u],-1!==re.indexOf(c.type)){if(a=c.direction||i.direction||"sendrecv","sendonly"!==a&&"inactive"!==a){p=!1;break}p=!0}var g={originator:"remote",type:"offer",sdp:e.body};this.emit("sdp",g),this.connection.setRemoteDescription(new W.RTCSessionDescription({type:"offer",sdp:g.sdp}),n,function(){e.reply(488)})}else this.late_sdp=!0,n()}function c(e){function t(t){t=t||{},a=!0;var n=t.status_code||403,r=t.reason_phrase||"",s=t.extraHeaders&&t.extraHeaders.slice()||[];if(this.status!==k.STATUS_CONFIRMED)return!1;if(300>n||n>=700)throw new TypeError("Invalid status_code: "+n);e.reply(n,r,s)}G("receiveUpdate()");var n,r,s,l,i=this,u=e.getHeader("Content-Type"),a=!1,c=!1,h={request:e,callback:void 0,reject:t.bind(this)};if(this.emit("update",h),!a){if(!e.body){var d=[];return E.call(this,e,d),void e.reply(200,null,d)}if("application/sdp"!==u)return G("invalid Content-Type"),void e.reply(415);for(n=e.parseSDP(),r=0;r<n.media.length;r++)if(l=n.media[r],-1!==re.indexOf(l.type)){if(s=l.direction||n.direction||"sendrecv","sendonly"!==s&&"inactive"!==s){c=!1;break}c=!0}var p={originator:"remote",type:"offer",sdp:e.body};this.emit("sdp",p),this.connection.setRemoteDescription(new W.RTCSessionDescription({type:"offer",sdp:p.sdp}),function(){i.remoteHold===!0&&c===!1?(i.remoteHold=!1,P.call(i,"remote")):i.remoteHold===!1&&c===!0&&(i.remoteHold=!0,M.call(i,"remote")),o.call(i,"answer",function(t){var n=["Contact: "+i.contact];E.call(i,e,n),e.reply(200,null,n,t),"function"==typeof h.callback&&h.callback()},function(){e.reply(500)})},function(){e.reply(488)},this.rtcAnswerConstraints)}}function h(e){function t(t,n){var l,i;return n=n||{},t="function"==typeof t?t:null,this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED?!1:(l=new r(this.ua),l.on("progress",function(e){s.notify(e.response.status_code,e.response.reason_phrase)}),l.on("accepted",function(e){s.notify(e.response.status_code,e.response.reason_phrase)}),l.on("failed",function(e){e.message?s.notify(e.message.status_code,e.message.reason_phrase):s.notify(487,e.cause)}),e.refer_to.uri.hasHeader("replaces")&&(i=decodeURIComponent(e.refer_to.uri.getHeader("replaces")),n.extraHeaders=n.extraHeaders||[],n.extraHeaders.push("Replaces: "+i)),void l.connect(e.refer_to.uri.toAor(),n,t))}function n(){s.notify(603)}G("receiveRefer()");var s,l=this;return void 0===typeof e.refer_to?(G("no Refer-To header field present in REFER"),void e.reply(400)):e.refer_to.uri.scheme!==z.SIP?(G("Refer-To header field points to a non-SIP URI scheme"),void e.reply(416)):(e.reply(202),s=new te(this,e.cseq),void this.emit("refer",{request:e,accept:function(e,n){t.call(l,e,n)},reject:function(){n.call(l)}}))}function d(e){switch(G("receiveNotify()"),void 0===typeof e.event&&e.reply(400),e.event.event){case"refer":var t=e.event.params.id,n=this.referSubscribers[t];if(!n)return void e.reply(481,"Subscription does not exist");n.receiveNotify(e),e.reply(200);break;default:e.reply(489)}}function p(e){function t(t){var n;return this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED?!1:(n=new r(this.ua),n.on("confirmed",function(){s.terminate()}),void n.init_incoming(e,t))}function n(){G("Replaced INVITE rejected by the user"),e.reply(486)}G("receiveReplaces()");var s=this;this.emit("replaces",{request:e,accept:function(e){t.call(s,e)},reject:function(){n.call(s)}})}function f(e,t,n){function r(e){u.status!==k.STATUS_TERMINATED&&(u.localMediaStream=e,e&&u.connection.addStream(e),u.emit("peerconnection",{peerconnection:u.connection}),w.call(u,u.request),o.call(u,"offer",l,i,t))}function s(){u.status!==k.STATUS_TERMINATED&&U.call(u,"local",null,z.causes.USER_DENIED_MEDIA_ACCESS)}function l(e){u.isCanceled||u.status===k.STATUS_TERMINATED||(u.request.body=e,u.status=k.STATUS_INVITE_SENT,u.emit("sending",{request:u.request}),a.send())}function i(){u.status!==k.STATUS_TERMINATED&&U.call(u,"system",null,z.causes.WEBRTC_ERROR)}var u=this,a=new Q(u,this.ua);this.receiveResponse=function(e){m.call(u,e)},n?setTimeout(function(){r(n)}):e.audio||e.video?(this.localMediaStreamLocallyGenerated=!0,W.getUserMedia(e,r,s)):r(null)}function m(e){G("receiveInviteResponse()");var t,n,r,s=this;if(this.dialog&&e.status_code>=200&&e.status_code<=299)return this.dialog.id.call_id===e.call_id&&this.dialog.id.local_tag===e.from_tag&&this.dialog.id.remote_tag===e.to_tag?void v.call(this,z.ACK):(n=new X(this,e,"UAC"),void 0!==n.error?void G(n.error):(n.sendRequest({owner:{status:k.STATUS_TERMINATED},onRequestTimeout:function(){},onTransportError:function(){},onDialogError:function(){},receiveResponse:function(){}},z.ACK),void n.sendRequest({owner:{status:k.STATUS_TERMINATED},onRequestTimeout:function(){},onTransportError:function(){},onDialogError:function(){},receiveResponse:function(){}},z.BYE)));if(this.isCanceled)return this.isCanceled=!1,void(e.status_code>=100&&e.status_code<200?this.request.cancel(this.cancelReason):e.status_code>=200&&e.status_code<299&&_.call(this,e));if(this.status===k.STATUS_INVITE_SENT||this.status===k.STATUS_1XX_RECEIVED)switch(!0){case/^100$/.test(e.status_code):this.status=k.STATUS_1XX_RECEIVED;break;case/^1[0-9]{2}$/.test(e.status_code):if(!e.to_tag){G("1xx response received without to tag");break}if(e.hasHeader("contact")&&!u.call(this,e,"UAC",!0))break;if(this.status=k.STATUS_1XX_RECEIVED,N.call(this,"remote",e),!e.body)break;r={originator:"remote",type:"pranswer",sdp:e.body},this.emit("sdp",r),this.connection.setRemoteDescription(new W.RTCSessionDescription({type:"pranswer",sdp:r.sdp}),null,null);break;case/^2[0-9]{2}$/.test(e.status_code):if(this.status=k.STATUS_CONFIRMED,!e.body){_.call(this,e,400,z.causes.MISSING_SDP),U.call(this,"remote",e,z.causes.BAD_MEDIA_DESCRIPTION);break}if(!u.call(this,e,"UAC"))break;r={originator:"remote",type:"answer",sdp:e.body},this.emit("sdp",r),this.connection.setRemoteDescription(new W.RTCSessionDescription({type:"answer",sdp:r.sdp}),function(){A.call(s,e),D.call(s,"remote",e),v.call(s,z.ACK),O.call(s,"local",null)},function(){_.call(s,e,488,"Not Acceptable Here"),U.call(s,"remote",e,z.causes.BAD_MEDIA_DESCRIPTION)});break;default:t=J.sipErrorCause(e.status_code),U.call(this,"remote",e,t)}}function g(e){function t(e){if(r.status!==k.STATUS_TERMINATED&&(v.call(r,z.ACK),!u)){if(A.call(r,e),!e.body)return void n();if("application/sdp"!==e.getHeader("Content-Type"))return void n();var t={originator:"remote",type:"answer",sdp:e.body};r.emit("sdp",t),r.connection.setRemoteDescription(new W.RTCSessionDescription({type:"answer",sdp:t.sdp}),function(){l.succeeded&&l.succeeded(e)},function(){n()})}}function n(e){l.failed&&l.failed(e)}G("sendReinvite()"),e=e||{};var r=this,s=e.extraHeaders||[],l=e.eventHandlers||{},i=e.rtcOfferConstraints||this.rtcOfferConstraints||null,u=!1;s.push("Contact: "+this.contact),s.push("Content-Type: application/sdp"),this.sessionTimers.running&&s.push("Session-Expires: "+this.sessionTimers.currentExpires+";refresher="+(this.sessionTimers.refresher?"uac":"uas")),o.call(this,"offer",function(e){e=C.call(r,e);var l=new Z(r,z.INVITE);l.send({extraHeaders:s,body:e,eventHandlers:{onSuccessResponse:function(e){t(e),u=!0},onErrorResponse:function(e){n(e)},onTransportError:function(){r.onTransportError()},onRequestTimeout:function(){r.onRequestTimeout()},onDialogError:function(){r.onDialogError()}}})},function(){n()},i)}function T(e){function t(e){if(r.status!==k.STATUS_TERMINATED&&!a)if(A.call(r,e),u){if(!e.body)return void n();if("application/sdp"!==e.getHeader("Content-Type"))return void n();var t={originator:"remote",type:"answer",sdp:e.body};r.emit("sdp",t),r.connection.setRemoteDescription(new W.RTCSessionDescription({type:"answer",sdp:t.sdp}),function(){l.succeeded&&l.succeeded(e)},function(){n()})}else l.succeeded&&l.succeeded(e)}function n(e){l.failed&&l.failed(e)}G("sendUpdate()"),e=e||{};var r=this,s=e.extraHeaders||[],l=e.eventHandlers||{},i=e.rtcOfferConstraints||this.rtcOfferConstraints||null,u=e.sdpOffer||!1,a=!1;if(s.push("Contact: "+this.contact),this.sessionTimers.running&&s.push("Session-Expires: "+this.sessionTimers.currentExpires+";refresher="+(this.sessionTimers.refresher?"uac":"uas")),u)s.push("Content-Type: application/sdp"),o.call(this,"offer",function(e){e=C.call(r,e);var l=new Z(r,z.UPDATE);l.send({extraHeaders:s,body:e,eventHandlers:{onSuccessResponse:function(e){t(e),a=!0},onErrorResponse:function(e){n(e)},onTransportError:function(){r.onTransportError()},onRequestTimeout:function(){r.onRequestTimeout()},onDialogError:function(){r.onDialogError()}}})},function(){n()},i);else{var c=new Z(r,z.UPDATE);c.send({extraHeaders:s,eventHandlers:{onSuccessResponse:function(e){t(e)},onErrorResponse:function(e){n(e)},onTransportError:function(){r.onTransportError()},onRequestTimeout:function(){r.onRequestTimeout()},onDialogError:function(){r.onDialogError()}}})}}function _(e,t,n){G("acceptAndTerminate()");var r=[];t&&(n=n||z.REASON_PHRASE[t]||"",r.push("Reason: SIP ;cause="+t+'; text="'+n+'"')),(this.dialog||u.call(this,e,"UAC"))&&(v.call(this,z.ACK),v.call(this,z.BYE,{extraHeaders:r})),this.status=k.STATUS_TERMINATED}function v(e,t){G("sendRequest()");var n=new Z(this,e);n.send(t)}function C(e){var t,n,r;if(!this.localHold&&!this.remoteHold)return e;if(e=B.parse(e),this.localHold&&!this.remoteHold)for(G("mangleOffer() | me on hold, mangling offer"),n=e.media.length,t=0;n>t;t++)r=e.media[t],-1!==re.indexOf(r.type)&&(r.direction?"sendrecv"===r.direction?r.direction="sendonly":"recvonly"===r.direction&&(r.direction="inactive"):r.direction="sendonly");else if(this.localHold&&this.remoteHold)for(G("mangleOffer() | both on hold, mangling offer"),n=e.media.length,t=0;n>t;t++)r=e.media[t],-1!==re.indexOf(r.type)&&(r.direction="inactive");else if(this.remoteHold)for(G("mangleOffer() | remote on hold, mangling offer"),n=e.media.length,t=0;n>t;t++)r=e.media[t],-1!==re.indexOf(r.type)&&(r.direction?"sendrecv"===r.direction?r.direction="recvonly":"recvonly"===r.direction&&(r.direction="inactive"):r.direction="recvonly");return B.write(e)}function S(){var e=!0,t=!0;(this.localHold||this.remoteHold)&&(e=!1,t=!1),this.audioMuted&&(e=!1),this.videoMuted&&(t=!1),R.call(this,!e),b.call(this,!t)}function E(e,t){if(this.sessionTimers.enabled){var n;e.session_expires&&e.session_expires>=z.MIN_SESSION_EXPIRES?(this.sessionTimers.currentExpires=e.session_expires,n=e.session_expires_refresher||"uas"):(this.sessionTimers.currentExpires=this.sessionTimers.defaultExpires,n="uas"),t.push("Session-Expires: "+this.sessionTimers.currentExpires+";refresher="+n),this.sessionTimers.refresher="uas"===n,y.call(this)}}function A(e){if(this.sessionTimers.enabled){var t;e.session_expires&&e.session_expires>=z.MIN_SESSION_EXPIRES?(this.sessionTimers.currentExpires=e.session_expires,t=e.session_expires_refresher||"uac"):(this.sessionTimers.currentExpires=this.sessionTimers.defaultExpires,t="uac"),this.sessionTimers.refresher="uac"===t,y.call(this)}}function y(){var e=this,t=this.sessionTimers.currentExpires;this.sessionTimers.running=!0,clearTimeout(this.sessionTimers.timer),this.sessionTimers.refresher?this.sessionTimers.timer=setTimeout(function(){e.status!==k.STATUS_TERMINATED&&(G("runSessionTimer() | sending session refresh request"),T.call(e,{eventHandlers:{succeeded:function(t){A.call(e,t)}}}))},500*t):this.sessionTimers.timer=setTimeout(function(){e.status!==k.STATUS_TERMINATED&&(j("runSessionTimer() | timer expired, terminating the session"),e.terminate({cause:z.causes.REQUEST_TIMEOUT,status_code:408,reason_phrase:"Session Timer Expired"}))},1100*t)}function R(e){var t,n,r,s,l,i=this.connection.getLocalStreams();for(r=i.length,t=0;r>t;t++)for(l=i[t].getAudioTracks(),s=l.length,n=0;s>n;n++)l[n].enabled=!e}function b(e){var t,n,r,s,l,i=this.connection.getLocalStreams();for(r=i.length,t=0;r>t;t++)for(l=i[t].getVideoTracks(),s=l.length,n=0;s>n;n++)l[n].enabled=!e}function I(e,t){G("newRTCSession"),this.ua.newRTCSession({originator:e,session:this,request:t})}function w(e){G("session connecting"),this.emit("connecting",{request:e})}function N(e,t){G("session progress"),this.emit("progress",{originator:e,response:t||null})}function D(e,t){G("session accepted"),this.start_time=new Date,this.emit("accepted",{originator:e,response:t||null})}function O(e,t){G("session confirmed"),this.is_confirmed=!0,this.emit("confirmed",{originator:e,ack:t||null})}function x(e,t,n){G("session ended"),this.end_time=new Date,this.close(),this.emit("ended",{originator:e,message:t||null,cause:n})}function U(e,t,n){G("session failed"),this.close(),this.emit("failed",{originator:e,message:t||null,cause:n})}function M(e){G("session onhold"),S.call(this),this.emit("hold",{originator:e})}function P(e){G("session onunhold"),S.call(this),this.emit("unhold",{originator:e})}function q(e){G("session onmute"),S.call(this),this.emit("muted",{audio:e.audio,video:e.video})}function L(e){G("session onunmute"),S.call(this),this.emit("unmuted",{audio:e.audio,video:e.video})}t.exports=r;var k={STATUS_NULL:0,STATUS_INVITE_SENT:1,STATUS_1XX_RECEIVED:2,STATUS_INVITE_RECEIVED:3,STATUS_WAITING_FOR_ANSWER:4,STATUS_ANSWERED:5,STATUS_WAITING_FOR_ACK:6,STATUS_CANCELED:7,STATUS_TERMINATED:8,STATUS_CONFIRMED:9};r.C=k;var H=e("util"),F=e("events"),G=e("debug")("JsSIP:RTCSession"),j=e("debug")("JsSIP:ERROR:RTCSession");j.log=console.warn.bind(console);var W=e("rtcninja"),B=e("sdp-transform"),z=e("./Constants"),V=e("./Exceptions"),Y=e("./Transactions"),J=e("./Utils"),K=e("./Timers"),$=e("./SIPMessage"),X=e("./Dialog"),Q=e("./RequestSender"),Z=e("./RTCSession/Request"),ee=e("./RTCSession/DTMF"),te=e("./RTCSession/ReferNotifier"),ne=e("./RTCSession/ReferSubscriber"),re=["audio","video"];H.inherits(r,F.EventEmitter),r.prototype.isInProgress=function(){switch(this.status){case k.STATUS_NULL:case k.STATUS_INVITE_SENT:case k.STATUS_1XX_RECEIVED:case k.STATUS_INVITE_RECEIVED:case k.STATUS_WAITING_FOR_ANSWER:return!0;default:return!1}},r.prototype.isEstablished=function(){switch(this.status){case k.STATUS_ANSWERED:case k.STATUS_WAITING_FOR_ACK:case k.STATUS_CONFIRMED:return!0;default:return!1}},r.prototype.isEnded=function(){switch(this.status){case k.STATUS_CANCELED:case k.STATUS_TERMINATED:return!0;default:return!1}},r.prototype.isMuted=function(){return{audio:this.audioMuted,video:this.videoMuted}},r.prototype.isOnHold=function(){return{local:this.localHold,remote:this.remoteHold}},r.prototype.isReadyToReOffer=function(){return this.rtcReady?this.dialog?this.dialog.uac_pending_reply===!0||this.dialog.uas_pending_reply===!0?(G("isReadyToReOffer() | there is another INVITE/UPDATE transaction in progress"),!1):!0:(G("isReadyToReOffer() | session not established yet"),!1):(G("isReadyToReOffer() | internal WebRTC status not ready"),!1)},r.prototype.connect=function(e,t,n){G("connect()"),t=t||{};var r,s,l=e,o=t.eventHandlers||{},u=t.extraHeaders&&t.extraHeaders.slice()||[],a=t.mediaConstraints||{audio:!0,video:!0},c=t.mediaStream||null,h=t.pcConfig||{iceServers:[]},d=t.rtcConstraints||null,p=t.rtcOfferConstraints||null;if(this.rtcOfferConstraints=p,this.rtcAnswerConstraints=t.rtcAnswerConstraints||null,this.sessionTimers.enabled&&J.isDecimal(t.sessionTimersExpires)&&(t.sessionTimersExpires>=z.MIN_SESSION_EXPIRES?this.sessionTimers.defaultExpires=t.sessionTimersExpires:this.sessionTimers.defaultExpires=z.SESSION_EXPIRES),this.data=t.data||this.data,void 0===e)throw new TypeError("Not enough arguments");if(!W.hasWebRTC())throw new V.NotSupportedError("WebRTC not supported");if(e=this.ua.normalizeTarget(e),!e)throw new TypeError("Invalid target: "+l);if(this.status!==k.STATUS_NULL)throw new V.InvalidStateError(this.status);for(r in o)this.on(r,o[r]);this.from_tag=J.newTag(),this.anonymous=t.anonymous||!1,this.isCanceled=!1,s={from_tag:this.from_tag},this.contact=this.ua.contact.toString({anonymous:this.anonymous,outbound:!0}),this.anonymous&&(s.from_display_name="Anonymous",s.from_uri="sip:anonymous@anonymous.invalid",u.push("P-Preferred-Identity: "+this.ua.configuration.uri.toString()),u.push("Privacy: id")),u.push("Contact: "+this.contact),u.push("Content-Type: application/sdp"),this.sessionTimers.enabled&&u.push("Session-Expires: "+this.sessionTimers.defaultExpires),this.request=new $.OutgoingRequest(z.INVITE,e,this.ua,s,u),this.id=this.request.call_id+this.from_tag,i.call(this,h,d),this.ua.sessions[this.id]=this,this.direction="outgoing",this.local_identity=this.request.from,this.remote_identity=this.request.to,n?n(this):I.call(this,"local",this.request),f.call(this,a,p,c)},r.prototype.init_incoming=function(e,t){G("init_incoming()");var n,r=this,s=e.getHeader("Content-Type");return e.body&&"application/sdp"!==s?void e.reply(415):(this.status=k.STATUS_INVITE_RECEIVED,this.from_tag=e.from_tag,this.id=e.call_id+this.from_tag,this.request=e,this.contact=this.ua.contact.toString(),this.ua.sessions[this.id]=this,e.hasHeader("expires")&&(n=1e3*e.getHeader("expires")),e.to_tag=J.newTag(),u.call(this,e,"UAS",!0)?(e.body?this.late_sdp=!1:this.late_sdp=!0,this.status=k.STATUS_WAITING_FOR_ANSWER,this.timers.userNoAnswerTimer=setTimeout(function(){e.reply(408),U.call(r,"local",null,z.causes.NO_ANSWER)},this.ua.configuration.no_answer_timeout),n&&(this.timers.expiresTimer=setTimeout(function(){r.status===k.STATUS_WAITING_FOR_ANSWER&&(e.reply(487),U.call(r,"system",null,z.causes.EXPIRES));
},n)),this.direction="incoming",this.local_identity=e.to,this.remote_identity=e.from,t?t(this):I.call(this,"remote",e),void(this.status!==k.STATUS_TERMINATED&&(e.reply(180,null,["Contact: "+r.contact]),N.call(r,"local",null)))):void e.reply(500,"Missing Contact header field"))},r.prototype.answer=function(e){function t(e){if(v.status!==k.STATUS_TERMINATED)if(v.localMediaStream=e,e&&v.connection.addStream(e),v.request.body||v.emit("peerconnection",{peerconnection:v.connection}),v.late_sdp)r();else{var t={originator:"remote",type:"offer",sdp:C.body};v.emit("sdp",t),v.connection.setRemoteDescription(new W.RTCSessionDescription({type:"offer",sdp:t.sdp}),r,function(){C.reply(488),U.call(v,"system",null,z.causes.WEBRTC_ERROR)})}}function n(){v.status!==k.STATUS_TERMINATED&&(C.reply(480),U.call(v,"local",null,z.causes.USER_DENIED_MEDIA_ACCESS))}function r(){w.call(v,C),v.late_sdp?o.call(v,"offer",a,c,v.rtcOfferConstraints):o.call(v,"answer",a,c,I)}function a(e){function t(){v.status=k.STATUS_WAITING_FOR_ACK,s.call(v,C,e),l.call(v),D.call(v,"local")}function n(){U.call(v,"system",null,z.causes.CONNECTION_ERROR)}v.status!==k.STATUS_TERMINATED&&(E.call(v,C,S),C.reply(200,null,S,e,t,n))}function c(){v.status!==k.STATUS_TERMINATED&&(C.reply(500),U.call(v,"system",null,z.causes.WEBRTC_ERROR))}G("answer()"),e=e||{};var h,d,p,f,m=!1,g=!1,T=!1,_=!1,v=this,C=this.request,S=e.extraHeaders&&e.extraHeaders.slice()||[],A=e.mediaConstraints||{},y=e.mediaStream||null,R=e.pcConfig||{iceServers:[]},b=e.rtcConstraints||null,I=e.rtcAnswerConstraints||null;if(this.rtcAnswerConstraints=I,this.rtcOfferConstraints=e.rtcOfferConstraints||null,this.sessionTimers.enabled&&J.isDecimal(e.sessionTimersExpires)&&(e.sessionTimersExpires>=z.MIN_SESSION_EXPIRES?this.sessionTimers.defaultExpires=e.sessionTimersExpires:this.sessionTimers.defaultExpires=z.SESSION_EXPIRES),this.data=e.data||this.data,"incoming"!==this.direction)throw new V.NotSupportedError('"answer" not supported for outgoing RTCSession');if(this.status!==k.STATUS_WAITING_FOR_ANSWER)throw new V.InvalidStateError(this.status);if(this.status=k.STATUS_ANSWERED,!u.call(this,C,"UAS"))return void C.reply(500,"Error creating dialog");for(clearTimeout(this.timers.userNoAnswerTimer),S.unshift("Contact: "+v.contact),p=C.parseSDP(),Array.isArray(p.media)||(p.media=[p.media]),h=p.media.length;h--;){var N=p.media[h];"audio"===N.type&&(m=!0,N.direction&&"sendrecv"!==N.direction||(T=!0)),"video"===N.type&&(g=!0,N.direction&&"sendrecv"!==N.direction||(_=!0))}if(y&&A.audio===!1)for(f=y.getAudioTracks(),d=f.length,h=0;d>h;h++)y.removeTrack(f[h]);if(y&&A.video===!1)for(f=y.getVideoTracks(),d=f.length,h=0;d>h;h++)y.removeTrack(f[h]);y||void 0!==A.audio||(A.audio=T),y||void 0!==A.video||(A.video=_),y||m||(A.audio=!1),y||g||(A.video=!1),i.call(this,R,b),y?t(y):A.audio||A.video?(v.localMediaStreamLocallyGenerated=!0,W.getUserMedia(A,t,n)):t(null)},r.prototype.terminate=function(e){G("terminate()"),e=e||{};var t,n,r=e.cause||z.causes.BYE,s=e.status_code,l=e.reason_phrase,i=e.extraHeaders&&e.extraHeaders.slice()||[],o=e.body,u=this;if(this.status===k.STATUS_TERMINATED)throw new V.InvalidStateError(this.status);switch(this.status){case k.STATUS_NULL:case k.STATUS_INVITE_SENT:case k.STATUS_1XX_RECEIVED:if(G("canceling sesssion"),s&&(200>s||s>=700))throw new TypeError("Invalid status_code: "+s);s&&(l=l||z.REASON_PHRASE[s]||"",t="SIP ;cause="+s+' ;text="'+l+'"'),this.status===k.STATUS_NULL?(this.isCanceled=!0,this.cancelReason=t):this.status===k.STATUS_INVITE_SENT?(this.isCanceled=!0,this.cancelReason=t):this.status===k.STATUS_1XX_RECEIVED&&this.request.cancel(t),this.status=k.STATUS_CANCELED,U.call(this,"local",null,z.causes.CANCELED);break;case k.STATUS_WAITING_FOR_ANSWER:case k.STATUS_ANSWERED:if(G("rejecting session"),s=s||480,300>s||s>=700)throw new TypeError("Invalid status_code: "+s);this.request.reply(s,l,i,o),U.call(this,"local",null,z.causes.REJECTED);break;case k.STATUS_WAITING_FOR_ACK:case k.STATUS_CONFIRMED:if(G("terminating session"),l=e.reason_phrase||z.REASON_PHRASE[s]||"",s&&(200>s||s>=700))throw new TypeError("Invalid status_code: "+s);s&&i.push("Reason: SIP ;cause="+s+'; text="'+l+'"'),this.status===k.STATUS_WAITING_FOR_ACK&&"incoming"===this.direction&&this.request.server_transaction.state!==Y.C.STATUS_TERMINATED?(n=this.dialog,this.receiveRequest=function(e){e.method===z.ACK&&(v.call(this,z.BYE,{extraHeaders:i,body:o}),n.terminate())},this.request.server_transaction.on("stateChanged",function(){this.state===Y.C.STATUS_TERMINATED&&(v.call(u,z.BYE,{extraHeaders:i,body:o}),n.terminate())}),x.call(this,"local",null,r),this.dialog=n,this.ua.dialogs[n.id.toString()]=n):(v.call(this,z.BYE,{extraHeaders:i,body:o}),x.call(this,"local",null,r))}},r.prototype.close=function(){G("close()");var e;if(this.status!==k.STATUS_TERMINATED){if(this.connection)try{this.connection.close()}catch(t){j("close() | error closing the RTCPeerConnection: %o",t)}this.localMediaStream&&this.localMediaStreamLocallyGenerated&&(G("close() | closing local MediaStream"),W.closeMediaStream(this.localMediaStream));for(e in this.timers)clearTimeout(this.timers[e]);clearTimeout(this.sessionTimers.timer),this.dialog&&(this.dialog.terminate(),delete this.dialog);for(e in this.earlyDialogs)this.earlyDialogs[e].terminate(),delete this.earlyDialogs[e];this.status=k.STATUS_TERMINATED,delete this.ua.sessions[this.id]}},r.prototype.sendDTMF=function(e,t){function n(){var e,o;if(i.status===k.STATUS_TERMINATED||!i.tones||l>=i.tones.length)return void(i.tones=null);if(e=i.tones[l],l+=1,","===e)o=2e3;else{var u=new ee(i);t.eventHandlers={failed:function(){i.tones=null}},u.send(e,t),o=r+s}setTimeout(n,o)}G("sendDTMF() | tones: %s",e);var r,s,l=0,i=this;if(t=t||{},r=t.duration||null,s=t.interToneGap||null,void 0===e)throw new TypeError("Not enough arguments");if(this.status!==k.STATUS_CONFIRMED&&this.status!==k.STATUS_WAITING_FOR_ACK)throw new V.InvalidStateError(this.status);if("number"==typeof e&&(e=e.toString()),!e||"string"!=typeof e||!e.match(/^[0-9A-D#*,]+$/i))throw new TypeError("Invalid tones: "+e);if(r&&!J.isDecimal(r))throw new TypeError("Invalid tone duration: "+r);if(r?r<ee.C.MIN_DURATION?(G('"duration" value is lower than the minimum allowed, setting it to '+ee.C.MIN_DURATION+" milliseconds"),r=ee.C.MIN_DURATION):r>ee.C.MAX_DURATION?(G('"duration" value is greater than the maximum allowed, setting it to '+ee.C.MAX_DURATION+" milliseconds"),r=ee.C.MAX_DURATION):r=Math.abs(r):r=ee.C.DEFAULT_DURATION,t.duration=r,s&&!J.isDecimal(s))throw new TypeError("Invalid interToneGap: "+s);return s?s<ee.C.MIN_INTER_TONE_GAP?(G('"interToneGap" value is lower than the minimum allowed, setting it to '+ee.C.MIN_INTER_TONE_GAP+" milliseconds"),s=ee.C.MIN_INTER_TONE_GAP):s=Math.abs(s):s=ee.C.DEFAULT_INTER_TONE_GAP,this.tones?void(this.tones+=e):(this.tones=e,void n())},r.prototype.mute=function(e){G("mute()"),e=e||{audio:!0,video:!1};var t=!1,n=!1;this.audioMuted===!1&&e.audio&&(t=!0,this.audioMuted=!0,R.call(this,!0)),this.videoMuted===!1&&e.video&&(n=!0,this.videoMuted=!0,b.call(this,!0)),t!==!0&&n!==!0||q.call(this,{audio:t,video:n})},r.prototype.unmute=function(e){G("unmute()"),e=e||{audio:!0,video:!0};var t=!1,n=!1;this.audioMuted===!0&&e.audio&&(t=!0,this.audioMuted=!1,this.localHold===!1&&R.call(this,!1)),this.videoMuted===!0&&e.video&&(n=!0,this.videoMuted=!1,this.localHold===!1&&b.call(this,!1)),t!==!0&&n!==!0||L.call(this,{audio:t,video:n})},r.prototype.hold=function(e,t){G("hold()"),e=e||{};var n,r=this;return this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED?!1:this.localHold===!0?!1:this.isReadyToReOffer()?(this.localHold=!0,M.call(this,"local"),n={succeeded:function(){t&&t()},failed:function(){r.terminate({cause:z.causes.WEBRTC_ERROR,status_code:500,reason_phrase:"Hold Failed"})}},e.useUpdate?T.call(this,{sdpOffer:!0,eventHandlers:n,extraHeaders:e.extraHeaders}):g.call(this,{eventHandlers:n,extraHeaders:e.extraHeaders}),!0):!1},r.prototype.unhold=function(e,t){G("unhold()"),e=e||{};var n,r=this;return this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED?!1:this.localHold===!1?!1:this.isReadyToReOffer()?(this.localHold=!1,P.call(this,"local"),n={succeeded:function(){t&&t()},failed:function(){r.terminate({cause:z.causes.WEBRTC_ERROR,status_code:500,reason_phrase:"Unhold Failed"})}},e.useUpdate?T.call(this,{sdpOffer:!0,eventHandlers:n,extraHeaders:e.extraHeaders}):g.call(this,{eventHandlers:n,extraHeaders:e.extraHeaders}),!0):!1},r.prototype.renegotiate=function(e,t){G("renegotiate()"),e=e||{};var n,r=this,s=e.rtcOfferConstraints||null;return this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED?!1:this.isReadyToReOffer()?(n={succeeded:function(){t&&t()},failed:function(){r.terminate({cause:z.causes.WEBRTC_ERROR,status_code:500,reason_phrase:"Media Renegotiation Failed"})}},S.call(this),e.useUpdate?T.call(this,{sdpOffer:!0,eventHandlers:n,rtcOfferConstraints:s,extraHeaders:e.extraHeaders}):g.call(this,{eventHandlers:n,rtcOfferConstraints:s,extraHeaders:e.extraHeaders}),!0):!1},r.prototype.refer=function(e,t){G("refer()");var n,r,s=this,l=e;if(this.status!==k.STATUS_WAITING_FOR_ACK&&this.status!==k.STATUS_CONFIRMED)return!1;if(e=this.ua.normalizeTarget(e),!e)throw new TypeError("Invalid target: "+l);return n=new ne(this),n.sendRefer(e,t),r=n.outgoingRequest.cseq,this.referSubscribers[r]=n,n.on("requestFailed",function(){delete s.referSubscribers[r]}),n.on("accepted",function(){delete s.referSubscribers[r]}),n.on("failed",function(){delete s.referSubscribers[r]}),n},r.prototype.receiveRequest=function(e){G("receiveRequest()");var t,n=this;if(e.method===z.CANCEL)this.status!==k.STATUS_WAITING_FOR_ANSWER&&this.status!==k.STATUS_ANSWERED||(this.status=k.STATUS_CANCELED,this.request.reply(487),U.call(this,"remote",e,z.causes.CANCELED));else switch(e.method){case z.ACK:if(this.status!==k.STATUS_WAITING_FOR_ACK)return;if(this.status=k.STATUS_CONFIRMED,clearTimeout(this.timers.ackTimer),clearTimeout(this.timers.invite2xxTimer),this.late_sdp){if(!e.body){this.terminate({cause:z.causes.MISSING_SDP,status_code:400});break}var r={originator:"remote",type:"answer",sdp:e.body};this.emit("sdp",r),this.connection.setRemoteDescription(new W.RTCSessionDescription({type:"answer",sdp:r.sdp}),function(){n.is_confirmed||O.call(n,"remote",e)},function(){n.terminate({cause:z.causes.BAD_MEDIA_DESCRIPTION,status_code:488})})}else this.is_confirmed||O.call(this,"remote",e);break;case z.BYE:this.status===k.STATUS_CONFIRMED?(e.reply(200),x.call(this,"remote",e,z.causes.BYE)):this.status===k.STATUS_INVITE_RECEIVED?(e.reply(200),this.request.reply(487,"BYE Received"),x.call(this,"remote",e,z.causes.BYE)):e.reply(403,"Wrong Status");break;case z.INVITE:this.status===k.STATUS_CONFIRMED?e.hasHeader("replaces")?p.call(this,e):a.call(this,e):e.reply(403,"Wrong Status");break;case z.INFO:this.status===k.STATUS_CONFIRMED||this.status===k.STATUS_WAITING_FOR_ACK||this.status===k.STATUS_INVITE_RECEIVED?(t=e.getHeader("content-type"),t&&t.match(/^application\/dtmf-relay/i)?new ee(this).init_incoming(e):e.reply(415)):e.reply(403,"Wrong Status");break;case z.UPDATE:this.status===k.STATUS_CONFIRMED?c.call(this,e):e.reply(403,"Wrong Status");break;case z.REFER:this.status===k.STATUS_CONFIRMED?h.call(this,e):e.reply(403,"Wrong Status");break;case z.NOTIFY:this.status===k.STATUS_CONFIRMED?d.call(this,e):e.reply(403,"Wrong Status");break;default:e.reply(501)}},r.prototype.onTransportError=function(){j("onTransportError()"),this.status!==k.STATUS_TERMINATED&&this.terminate({status_code:500,reason_phrase:z.causes.CONNECTION_ERROR,cause:z.causes.CONNECTION_ERROR})},r.prototype.onRequestTimeout=function(){G("onRequestTimeout"),this.status!==k.STATUS_TERMINATED&&this.terminate({status_code:408,reason_phrase:z.causes.REQUEST_TIMEOUT,cause:z.causes.REQUEST_TIMEOUT})},r.prototype.onDialogError=function(){j("onDialogError()"),this.status!==k.STATUS_TERMINATED&&this.terminate({status_code:500,reason_phrase:z.causes.DIALOG_ERROR,cause:z.causes.DIALOG_ERROR})},r.prototype.newDTMF=function(e){G("newDTMF()"),this.emit("newDTMF",e)},r.prototype.resetLocalMedia=function(){G("resetLocalMedia()"),this.localHold=!1,this.audioMuted=!1,this.videoMuted=!1,S.call(this)}},{"./Constants":1,"./Dialog":2,"./Exceptions":5,"./RTCSession/DTMF":12,"./RTCSession/ReferNotifier":13,"./RTCSession/ReferSubscriber":14,"./RTCSession/Request":15,"./RequestSender":17,"./SIPMessage":18,"./Timers":20,"./Transactions":21,"./Utils":25,debug:33,events:28,rtcninja:38,"sdp-transform":44,util:32}],12:[function(e,t,n){function r(e){this.owner=e,this.direction=null,this.tone=null,this.duration=null}t.exports=r;var s={MIN_DURATION:70,MAX_DURATION:6e3,DEFAULT_DURATION:100,MIN_INTER_TONE_GAP:50,DEFAULT_INTER_TONE_GAP:500};r.C=s;var l=e("debug")("JsSIP:RTCSession:DTMF"),i=e("debug")("JsSIP:ERROR:RTCSession:DTMF");i.log=console.warn.bind(console);var o=e("../Constants"),u=e("../Exceptions"),a=e("../RTCSession");r.prototype.send=function(e,t){var n,r;if(void 0===e)throw new TypeError("Not enough arguments");if(this.direction="outgoing",this.owner.status!==a.C.STATUS_CONFIRMED&&this.owner.status!==a.C.STATUS_WAITING_FOR_ACK)throw new u.InvalidStateError(this.owner.status);if(t=t||{},n=t.extraHeaders?t.extraHeaders.slice():[],this.eventHandlers=t.eventHandlers||{},"string"==typeof e)e=e.toUpperCase();else{if("number"!=typeof e)throw new TypeError("Invalid tone: "+e);e=e.toString()}if(!e.match(/^[0-9A-D#*]$/))throw new TypeError("Invalid tone: "+e);this.tone=e,this.duration=t.duration,n.push("Content-Type: application/dtmf-relay"),r="Signal="+this.tone+"\r\n",r+="Duration="+this.duration,this.owner.newDTMF({originator:"local",dtmf:this,request:this.request}),this.owner.dialog.sendRequest(this,o.INFO,{extraHeaders:n,body:r})},r.prototype.receiveResponse=function(e){switch(!0){case/^1[0-9]{2}$/.test(e.status_code):break;case/^2[0-9]{2}$/.test(e.status_code):l("onSuccessResponse"),this.eventHandlers.onSuccessResponse&&this.eventHandlers.onSuccessResponse(e);break;default:this.eventHandlers.onErrorResponse&&this.eventHandlers.onErrorResponse(e)}},r.prototype.onRequestTimeout=function(){i("onRequestTimeout"),this.eventHandlers.onRequestTimeout&&this.eventHandlers.onRequestTimeout()},r.prototype.onTransportError=function(){i("onTransportError"),this.eventHandlers.onTransportError&&this.eventHandlers.onTransportError()},r.prototype.onDialogError=function(){i("onDialogError"),this.eventHandlers.onDialogError&&this.eventHandlers.onDialogError()},r.prototype.init_incoming=function(e){var t,n=/^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/,r=/^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;this.direction="incoming",this.request=e,e.reply(200),e.body&&(t=e.body.split("\n"),t.length>=1&&n.test(t[0])&&(this.tone=t[0].replace(n,"$2")),t.length>=2&&r.test(t[1])&&(this.duration=parseInt(t[1].replace(r,"$2"),10))),this.duration||(this.duration=s.DEFAULT_DURATION),this.tone?this.owner.newDTMF({originator:"remote",dtmf:this,request:e}):l("invalid INFO DTMF received, discarded")}},{"../Constants":1,"../Exceptions":5,"../RTCSession":11,debug:33}],13:[function(e,t,n){function r(e,t,n){this.session=e,this.id=t,this.expires=n||s.expires,this.active=!0,this.notify(100)}t.exports=r;var s={event_type:"refer",body_type:"message/sipfrag;version=2.0",expires:300},l=e("debug")("JsSIP:RTCSession:ReferNotifier"),i=e("../Constants"),o=e("./Request");r.prototype.notify=function(e,t){l("notify()");var n,r=this;if(this.active!==!1){t=t||i.REASON_PHRASE[e]||"",n=e>=200?"terminated;reason=noresource":"active;expires="+this.expires;var u=new o(this.session,i.NOTIFY);u.send({extraHeaders:["Event: "+s.event_type+";id="+r.id,"Subscription-State: "+n,"Content-Type: "+s.body_type],body:"SIP/2.0 "+e+" "+t,eventHandlers:{onErrorResponse:function(){r.active=!1}}})}}},{"../Constants":1,"./Request":15,debug:33}],14:[function(e,t,n){function r(e){this.session=e,this.timer=null,this.outgoingRequest=null,o.EventEmitter.call(this)}function s(){console.log("removeSubscriber()"),clearTimeout(this.timer),this.session.referSubscriber=null}t.exports=r;var l={expires:120},i=e("util"),o=e("events"),u=e("debug")("JsSIP:RTCSession:ReferSubscriber"),a=e("../Constants"),c=e("../Grammar"),h=e("./Request");i.inherits(r,o.EventEmitter),r.prototype.sendRefer=function(e,t){u("sendRefer()");var n,r,i,o=null,c=this;t=t||{},n=t.extraHeaders?t.extraHeaders.slice():[],r=t.eventHandlers||{};for(var d in r)this.on(d,r[d]);t.replaces&&(o=t.replaces.request.call_id,o+=";to-tag="+t.replaces.to_tag,o+=";from-tag="+t.replaces.from_tag,o=encodeURIComponent(o)),i="Refer-To: <"+e+(o?"?Replaces="+o:"")+">",n.push(i);var p=new h(this.session,a.REFER);this.timer=setTimeout(function(){s.call(c)},1e3*l.expires),p.send({extraHeaders:n,eventHandlers:{onSuccessResponse:function(e){c.emit("requestSucceeded",{response:e})},onErrorResponse:function(e){c.emit("requestFailed",{response:e,cause:a.causes.REJECTED})},onTransportError:function(){s.call(c),c.emit("requestFailed",{response:null,cause:a.causes.CONNECTION_ERROR})},onRequestTimeout:function(){s.call(c),c.emit("requestFailed",{response:null,cause:a.causes.REQUEST_TIMEOUT})},onDialogError:function(){s.call(c),c.emit("requestFailed",{response:null,cause:a.causes.DIALOG_ERROR})}}}),this.outgoingRequest=p.outgoingRequest},r.prototype.receiveNotify=function(e){u("receiveNotify()");var t;if(e.body){if(t=c.parse(e.body,"Status_Line"),-1===t)return void u('receiveNotify() | error parsing NOTIFY body: "'+e.body+'"');switch(!0){case/^100$/.test(t.status_code):this.emit("trying",{request:e,status_line:t});break;case/^1[0-9]{2}$/.test(t.status_code):this.emit("progress",{request:e,status_line:t});break;case/^2[0-9]{2}$/.test(t.status_code):s.call(this),this.emit("accepted",{request:e,status_line:t});break;default:s.call(this),this.emit("failed",{request:e,status_line:t})}}}},{"../Constants":1,"../Grammar":6,"./Request":15,debug:33,events:28,util:32}],15:[function(e,t,n){function r(e,t){if(s("new | %s",t),this.session=e,this.method=t,this.outgoingRequest=null,this.session.status!==u.C.STATUS_1XX_RECEIVED&&this.session.status!==u.C.STATUS_WAITING_FOR_ANSWER&&this.session.status!==u.C.STATUS_WAITING_FOR_ACK&&this.session.status!==u.C.STATUS_CONFIRMED&&this.session.status!==u.C.STATUS_TERMINATED)throw new o.InvalidStateError(this.session.status);if(this.session.status===u.C.STATUS_TERMINATED&&t!==i.BYE)throw new o.InvalidStateError(this.session.status)}t.exports=r;var s=e("debug")("JsSIP:RTCSession:Request"),l=e("debug")("JsSIP:ERROR:RTCSession:Request");l.log=console.warn.bind(console);var i=e("../Constants"),o=e("../Exceptions"),u=e("../RTCSession");r.prototype.send=function(e){e=e||{};var t=e.extraHeaders&&e.extraHeaders.slice()||[],n=e.body||null;this.eventHandlers=e.eventHandlers||{},this.outgoingRequest=this.session.dialog.sendRequest(this,this.method,{extraHeaders:t,body:n})},r.prototype.receiveResponse=function(e){switch(!0){case/^1[0-9]{2}$/.test(e.status_code):s("onProgressResponse"),this.eventHandlers.onProgressResponse&&this.eventHandlers.onProgressResponse(e);break;case/^2[0-9]{2}$/.test(e.status_code):s("onSuccessResponse"),this.eventHandlers.onSuccessResponse&&this.eventHandlers.onSuccessResponse(e);break;default:s("onErrorResponse"),this.eventHandlers.onErrorResponse&&this.eventHandlers.onErrorResponse(e)}},r.prototype.onRequestTimeout=function(){l("onRequestTimeout"),this.eventHandlers.onRequestTimeout&&this.eventHandlers.onRequestTimeout()},r.prototype.onTransportError=function(){l("onTransportError"),this.eventHandlers.onTransportError&&this.eventHandlers.onTransportError()},r.prototype.onDialogError=function(){l("onDialogError"),this.eventHandlers.onDialogError&&this.eventHandlers.onDialogError()}},{"../Constants":1,"../Exceptions":5,"../RTCSession":11,debug:33}],16:[function(e,t,n){function r(e,t){var n=1;this.ua=e,this.transport=t,this.registrar=e.configuration.registrar_server,this.expires=e.configuration.register_expires,this.call_id=l.createRandomToken(22),this.cseq=0,this.to_uri=e.configuration.uri,this.registrationTimer=null,this.registered=!1,this.contact=this.ua.contact.toString(),this.contact+=";+sip.ice",this.extraHeaders=[],this.extraContactParams="",n&&(this.contact+=";reg-id="+n,this.contact+=';+sip.instance="<urn:uuid:'+this.ua.configuration.instance_id+'>"')}t.exports=r;var s=e("debug")("JsSIP:Registrator"),l=e("./Utils"),i=e("./Constants"),o=e("./SIPMessage"),u=e("./RequestSender");r.prototype={setExtraHeaders:function(e){Array.isArray(e)||(e=[]),this.extraHeaders=e.slice()},setExtraContactParams:function(e){e instanceof Object||(e={}),this.extraContactParams="";for(var t in e){var n=e[t];this.extraContactParams+=";"+t,n&&(this.extraContactParams+="="+n)}},register:function(){var e,t,n,r=this;n=this.extraHeaders.slice(),n.push("Contact: "+this.contact+";expires="+this.expires+this.extraContactParams),n.push("Expires: "+this.expires),this.request=new o.OutgoingRequest(i.REGISTER,this.registrar,this.ua,{to_uri:this.to_uri,call_id:this.call_id,cseq:this.cseq+=1},n),e=new u(this,this.ua),this.receiveResponse=function(e){var n,o,u=e.getHeaders("contact").length;if(e.cseq===this.cseq)switch(null!==this.registrationTimer&&(clearTimeout(this.registrationTimer),this.registrationTimer=null),!0){case/^1[0-9]{2}$/.test(e.status_code):break;case/^2[0-9]{2}$/.test(e.status_code):if(e.hasHeader("expires")&&(o=e.getHeader("expires")),!u){s("no Contact header in response to REGISTER, response ignored");break}for(;u--;){if(n=e.parseHeader("contact",u),n.uri.user===this.ua.contact.uri.user){o=n.getParam("expires");break}n=null}if(!n){s("no Contact header pointing to us, response ignored");break}o||(o=this.expires),this.registrationTimer=setTimeout(function(){r.registrationTimer=null,r.register()},1e3*o-3e3),n.hasParam("temp-gruu")&&(this.ua.contact.temp_gruu=n.getParam("temp-gruu").replace(/"/g,"")),n.hasParam("pub-gruu")&&(this.ua.contact.pub_gruu=n.getParam("pub-gruu").replace(/"/g,"")),this.registered||(this.registered=!0,this.ua.registered({response:e}));break;case/^423$/.test(e.status_code):e.hasHeader("min-expires")?(this.expires=e.getHeader("min-expires"),this.register()):(s("423 response received for REGISTER without Min-Expires"),this.registrationFailure(e,i.causes.SIP_FAILURE_CODE));break;default:t=l.sipErrorCause(e.status_code),this.registrationFailure(e,t)}},this.onRequestTimeout=function(){this.registrationFailure(null,i.causes.REQUEST_TIMEOUT)},this.onTransportError=function(){this.registrationFailure(null,i.causes.CONNECTION_ERROR)},e.send()},unregister:function(e){var t;if(!this.registered)return void s("already unregistered");e=e||{},this.registered=!1,null!==this.registrationTimer&&(clearTimeout(this.registrationTimer),this.registrationTimer=null),t=this.extraHeaders.slice(),e.all?(t.push("Contact: *"+this.extraContactParams),t.push("Expires: 0"),this.request=new o.OutgoingRequest(i.REGISTER,this.registrar,this.ua,{to_uri:this.to_uri,call_id:this.call_id,cseq:this.cseq+=1},t)):(t.push("Contact: "+this.contact+";expires=0"+this.extraContactParams),t.push("Expires: 0"),this.request=new o.OutgoingRequest(i.REGISTER,this.registrar,this.ua,{to_uri:this.to_uri,call_id:this.call_id,cseq:this.cseq+=1},t));var n=new u(this,this.ua);this.receiveResponse=function(e){var t;switch(!0){case/^1[0-9]{2}$/.test(e.status_code):break;case/^2[0-9]{2}$/.test(e.status_code):this.unregistered(e);break;default:t=l.sipErrorCause(e.status_code),this.unregistered(e,t)}},this.onRequestTimeout=function(){this.unregistered(null,i.causes.REQUEST_TIMEOUT)},this.onTransportError=function(){this.unregistered(null,i.causes.CONNECTION_ERROR)},n.send()},registrationFailure:function(e,t){this.ua.registrationFailed({response:e||null,cause:t}),this.registered&&(this.registered=!1,this.ua.unregistered({response:e||null,cause:t}))},unregistered:function(e,t){this.registered=!1,this.ua.unregistered({response:e||null,cause:t||null})},onTransportClosed:function(){null!==this.registrationTimer&&(clearTimeout(this.registrationTimer),this.registrationTimer=null),this.registered&&(this.registered=!1,this.ua.unregistered({}))},close:function(){this.registered&&this.unregister()}}},{"./Constants":1,"./RequestSender":17,"./SIPMessage":18,"./Utils":25,debug:33}],17:[function(e,t,n){function r(e,t){this.ua=t,this.applicant=e,this.method=e.request.method,this.request=e.request,this.auth=null,this.challenged=!1,this.staled=!1,t.status!==i.C.STATUS_USER_CLOSED||this.method===l.BYE&&this.method===l.ACK||this.onTransportError()}t.exports=r;var s=e("debug")("JsSIP:RequestSender"),l=e("./Constants"),i=e("./UA"),o=e("./DigestAuthentication"),u=e("./Transactions");r.prototype={send:function(){switch(this.method){case"INVITE":this.clientTransaction=new u.InviteClientTransaction(this,this.request,this.ua.transport);break;case"ACK":this.clientTransaction=new u.AckClientTransaction(this,this.request,this.ua.transport);break;default:this.clientTransaction=new u.NonInviteClientTransaction(this,this.request,this.ua.transport)}this.clientTransaction.send()},onRequestTimeout:function(){this.applicant.onRequestTimeout()},onTransportError:function(){this.applicant.onTransportError()},receiveResponse:function(e){var t,n,r,i=e.status_code;if(401!==i&&407!==i||null===this.ua.configuration.password&&null===this.ua.configuration.ha1)this.applicant.receiveResponse(e);else{if(401===e.status_code?(n=e.parseHeader("www-authenticate"),r="authorization"):(n=e.parseHeader("proxy-authenticate"),r="proxy-authorization"),!n)return s(e.status_code+" with wrong or missing challenge, cannot authenticate"),void this.applicant.receiveResponse(e);if(!this.challenged||!this.staled&&n.stale===!0){if(this.auth||(this.auth=new o({username:this.ua.configuration.authorization_user,password:this.ua.configuration.password,realm:this.ua.configuration.realm,ha1:this.ua.configuration.ha1})),!this.auth.authenticate(this.request,n))return void this.applicant.receiveResponse(e);this.challenged=!0,this.ua.set("realm",this.auth.get("realm")),this.ua.set("ha1",this.auth.get("ha1")),n.stale&&(this.staled=!0),t=e.method===l.REGISTER?this.applicant.cseq+=1:this.request.dialog?this.request.dialog.local_seqnum+=1:this.request.cseq+1,this.request=this.request.clone(),this.request.cseq=t,this.request.setHeader("cseq",t+" "+this.method),this.request.setHeader(r,this.auth.toString()),this.send()}else this.applicant.receiveResponse(e)}}}},{"./Constants":1,"./DigestAuthentication":4,"./Transactions":21,"./UA":23,debug:33}],18:[function(e,t,n){function r(e,t,n,r,s,l){var i,o,u,d;return r=r||{},e&&t&&n?(this.ua=n,this.headers={},this.method=e,this.ruri=t,this.body=l,this.extraHeaders=s&&s.slice()||[],r.route_set?this.setHeader("route",r.route_set):n.configuration.use_preloaded_route&&this.setHeader("route","<"+n.transport.sip_uri+";lr>"),this.setHeader("via",""),this.setHeader("max-forwards",a.MAX_FORWARDS),i=r.to_display_name||0===r.to_display_name?'"'+r.to_display_name+'" ':"",i+="<"+(r.to_uri||t)+">",i+=r.to_tag?";tag="+r.to_tag:"",this.to=new h.parse(i),this.setHeader("to",i),o=r.from_display_name||0===r.from_display_name?'"'+r.from_display_name+'" ':n.configuration.display_name?'"'+n.configuration.display_name+'" ':"",o+="<"+(r.from_uri||n.configuration.uri)+">;tag=",o+=r.from_tag||c.newTag(),this.from=new h.parse(o),this.setHeader("from",o),u=r.call_id||n.configuration.jssip_id+c.createRandomToken(15),this.call_id=u,this.setHeader("call-id",u),d=r.cseq||Math.floor(1e4*Math.random()),this.cseq=d,void this.setHeader("cseq",d+" "+e)):null}function s(){this.data=null,this.headers=null,this.method=null,this.via=null,this.via_branch=null,this.call_id=null,this.cseq=null,this.from=null,this.from_tag=null,this.to=null,this.to_tag=null,this.body=null,this.sdp=null}function l(e){this.ua=e,this.headers={},this.ruri=null,this.transport=null,this.server_transaction=null}function i(){this.headers={},this.status_code=null,this.reason_phrase=null}t.exports={OutgoingRequest:r,IncomingRequest:l,IncomingResponse:i};var o=e("debug")("JsSIP:SIPMessage"),u=e("sdp-transform"),a=e("./Constants"),c=e("./Utils"),h=e("./NameAddrHeader"),d=e("./Grammar");r.prototype={setHeader:function(e,t){var n,r;for(n=new RegExp("^\\s*"+e+"\\s*:","i"),r=0;r<this.extraHeaders.length;r++)n.test(this.extraHeaders[r])&&this.extraHeaders.splice(r,1);this.headers[c.headerize(e)]=Array.isArray(t)?t:[t]},getHeader:function(e){var t,n,r=this.extraHeaders.length,s=this.headers[c.headerize(e)];if(s){if(s[0])return s[0]}else for(t=new RegExp("^\\s*"+e+"\\s*:","i"),n=0;r>n;n++)if(s=this.extraHeaders[n],t.test(s))return s.substring(s.indexOf(":")+1).trim()},getHeaders:function(e){var t,n,r,s=this.headers[c.headerize(e)],l=[];if(s){for(n=s.length,t=0;n>t;t++)l.push(s[t]);return l}for(n=this.extraHeaders.length,r=new RegExp("^\\s*"+e+"\\s*:","i"),t=0;n>t;t++)s=this.extraHeaders[t],r.test(s)&&l.push(s.substring(s.indexOf(":")+1).trim());return l},hasHeader:function(e){var t,n,r=this.extraHeaders.length;if(this.headers[c.headerize(e)])return!0;for(t=new RegExp("^\\s*"+e+"\\s*:","i"),n=0;r>n;n++)if(t.test(this.extraHeaders[n]))return!0;return!1},parseSDP:function(e){return!e&&this.sdp?this.sdp:(this.sdp=u.parse(this.body||""),this.sdp)},toString:function(){var e,t,n,r="",s=[];r+=this.method+" "+this.ruri+" SIP/2.0\r\n";for(e in this.headers)for(t=this.headers[e].length,n=0;t>n;n++)r+=e+": "+this.headers[e][n]+"\r\n";for(t=this.extraHeaders.length,n=0;t>n;n++)r+=this.extraHeaders[n].trim()+"\r\n";switch(this.method){case a.REGISTER:s.push("path","gruu");break;case a.INVITE:this.ua.configuration.session_timers&&s.push("timer"),(this.ua.contact.pub_gruu||this.ua.contact.temp_gruu)&&s.push("gruu"),s.push("ice","replaces");break;case a.UPDATE:this.ua.configuration.session_timers&&s.push("timer"),s.push("ice")}return s.push("outbound"),r+="Allow: "+a.ALLOWED_METHODS+"\r\n",r+="Supported: "+s+"\r\n",r+="User-Agent: "+a.USER_AGENT+"\r\n",this.body?(t=c.str_utf8_length(this.body),r+="Content-Length: "+t+"\r\n\r\n",r+=this.body):r+="Content-Length: 0\r\n\r\n",r},clone:function(){var e=new r(this.method,this.ruri,this.ua);return Object.keys(this.headers).forEach(function(t){e.headers[t]=this.headers[t].slice()},this),e.body=this.body,e.extraHeaders=this.extraHeaders&&this.extraHeaders.slice()||[],e.to=this.to,e.from=this.from,e.call_id=this.call_id,e.cseq=this.cseq,e}},s.prototype={addHeader:function(e,t){var n={raw:t};e=c.headerize(e),this.headers[e]?this.headers[e].push(n):this.headers[e]=[n]},getHeader:function(e){var t=this.headers[c.headerize(e)];if(t)return t[0]?t[0].raw:void 0},getHeaders:function(e){var t,n,r=this.headers[c.headerize(e)],s=[];if(!r)return[];for(n=r.length,t=0;n>t;t++)s.push(r[t].raw);return s},hasHeader:function(e){return!!this.headers[c.headerize(e)]},parseHeader:function(e,t){var n,r,s;return e=c.headerize(e),t=t||0,this.headers[e]?t>=this.headers[e].length?void o('not so many "'+e+'" headers present'):(n=this.headers[e][t],r=n.raw,n.parsed?n.parsed:(s=d.parse(r,e.replace(/-/g,"_")),-1===s?(this.headers[e].splice(t,1),void o('error parsing "'+e+'" header field with value "'+r+'"')):(n.parsed=s,s))):void o('header "'+e+'" not present')},s:function(e,t){return this.parseHeader(e,t)},setHeader:function(e,t){var n={raw:t};this.headers[c.headerize(e)]=[n]},parseSDP:function(e){return!e&&this.sdp?this.sdp:(this.sdp=u.parse(this.body||""),this.sdp)},toString:function(){return this.data}},l.prototype=new s,l.prototype.reply=function(e,t,n,r,s,l){var i,o,u,h,d,p=[],f=this.getHeader("To"),m=0,g=0;if(e=e||null,t=t||null,!e||100>e||e>699)throw new TypeError("Invalid status_code: "+e);if(t&&"string"!=typeof t&&!(t instanceof String))throw new TypeError("Invalid reason_phrase: "+t);if(t=t||a.REASON_PHRASE[e]||"",n=n&&n.slice()||[],d="SIP/2.0 "+e+" "+t+"\r\n",this.method===a.INVITE&&e>100&&200>=e)for(i=this.getHeaders("record-route"),u=i.length,m;u>m;m++)d+="Record-Route: "+i[m]+"\r\n";for(o=this.getHeaders("via"),u=o.length,g;u>g;g++)d+="Via: "+o[g]+"\r\n";for(!this.to_tag&&e>100?f+=";tag="+c.newTag():this.to_tag&&!this.s("to").hasParam("tag")&&(f+=";tag="+this.to_tag),
d+="To: "+f+"\r\n",d+="From: "+this.getHeader("From")+"\r\n",d+="Call-ID: "+this.call_id+"\r\n",d+="CSeq: "+this.cseq+" "+this.method+"\r\n",u=n.length,h=0;u>h;h++)d+=n[h].trim()+"\r\n";switch(this.method){case a.INVITE:this.ua.configuration.session_timers&&p.push("timer"),(this.ua.contact.pub_gruu||this.ua.contact.temp_gruu)&&p.push("gruu"),p.push("ice","replaces");break;case a.UPDATE:this.ua.configuration.session_timers&&p.push("timer"),r&&p.push("ice"),p.push("replaces")}p.push("outbound"),this.method===a.OPTIONS?(d+="Allow: "+a.ALLOWED_METHODS+"\r\n",d+="Accept: "+a.ACCEPTED_BODY_TYPES+"\r\n"):405===e?d+="Allow: "+a.ALLOWED_METHODS+"\r\n":415===e&&(d+="Accept: "+a.ACCEPTED_BODY_TYPES+"\r\n"),d+="Supported: "+p+"\r\n",r?(u=c.str_utf8_length(r),d+="Content-Type: application/sdp\r\n",d+="Content-Length: "+u+"\r\n\r\n",d+=r):d+="Content-Length: 0\r\n\r\n",this.server_transaction.receiveResponse(e,d,s,l)},l.prototype.reply_sl=function(e,t){var n,r,s=0,l=this.getHeaders("via"),i=l.length;if(e=e||null,t=t||null,!e||100>e||e>699)throw new TypeError("Invalid status_code: "+e);if(t&&"string"!=typeof t&&!(t instanceof String))throw new TypeError("Invalid reason_phrase: "+t);for(t=t||a.REASON_PHRASE[e]||"",r="SIP/2.0 "+e+" "+t+"\r\n",s;i>s;s++)r+="Via: "+l[s]+"\r\n";n=this.getHeader("To"),!this.to_tag&&e>100?n+=";tag="+c.newTag():this.to_tag&&!this.s("to").hasParam("tag")&&(n+=";tag="+this.to_tag),r+="To: "+n+"\r\n",r+="From: "+this.getHeader("From")+"\r\n",r+="Call-ID: "+this.call_id+"\r\n",r+="CSeq: "+this.cseq+" "+this.method+"\r\n",r+="Content-Length: 0\r\n\r\n",this.transport.send(r)},i.prototype=new s},{"./Constants":1,"./Grammar":6,"./NameAddrHeader":9,"./Utils":25,debug:33,"sdp-transform":44}],19:[function(e,t,n){function r(){}t.exports=r;var s=e("./Utils"),l=e("./Grammar"),i=e("debug")("JsSIP:ERROR:Socket");r.isSocket=function(e){if("undefined"==typeof e)return i("undefined JsSIP.Socket instance"),!1;try{if(!s.isString(e.url))throw i("missing or invalid JsSIP.Socket url property"),new Error;if(!s.isString(e.via_transport))throw i("missing or invalid JsSIP.Socket via_transport property"),new Error;if(-1===l.parse(e.sip_uri,"SIP_URI"))throw i("missing or invalid JsSIP.Socket sip_uri property"),new Error}catch(t){return!1}try{["connect","disconnect","send"].forEach(function(t){if(!s.isFunction(e[t]))throw i("missing or invalid JsSIP.Socket method: "+t),new Error})}catch(t){return!1}return!0}},{"./Grammar":6,"./Utils":25,debug:33}],20:[function(e,t,n){var r=500,s=4e3,l=5e3,i={T1:r,T2:s,T4:l,TIMER_B:64*r,TIMER_D:0*r,TIMER_F:64*r,TIMER_H:64*r,TIMER_I:0*r,TIMER_J:0*r,TIMER_K:0*l,TIMER_L:64*r,TIMER_M:64*r,PROVISIONAL_RESPONSE_INTERVAL:6e4};t.exports=i},{}],21:[function(e,t,n){function r(e,t,n){var r;this.type=a.NON_INVITE_CLIENT,this.transport=n,this.id="z9hG4bK"+Math.floor(1e7*Math.random()),this.request_sender=e,this.request=t,r="SIP/2.0/"+n.via_transport,r+=" "+e.ua.configuration.via_host+";branch="+this.id,this.request.setHeader("via",r),this.request_sender.ua.newTransaction(this),h.EventEmitter.call(this)}function s(e,t,n){var r,s=this;this.type=a.INVITE_CLIENT,this.transport=n,this.id="z9hG4bK"+Math.floor(1e7*Math.random()),this.request_sender=e,this.request=t,r="SIP/2.0/"+n.via_transport,r+=" "+e.ua.configuration.via_host+";branch="+this.id,this.request.setHeader("via",r),this.request_sender.ua.newTransaction(this),this.request.cancel=function(e){s.cancel_request(s,e)},h.EventEmitter.call(this)}function l(e,t,n){var r;this.transport=n,this.id="z9hG4bK"+Math.floor(1e7*Math.random()),this.request_sender=e,this.request=t,r="SIP/2.0/"+n.via_transport,r+=" "+e.ua.configuration.via_host+";branch="+this.id,this.request.setHeader("via",r),h.EventEmitter.call(this)}function i(e,t){this.type=a.NON_INVITE_SERVER,this.id=e.via_branch,this.request=e,this.transport=e.transport,this.ua=t,this.last_response="",e.server_transaction=this,this.state=a.STATUS_TRYING,t.newTransaction(this),h.EventEmitter.call(this)}function o(e,t){this.type=a.INVITE_SERVER,this.id=e.via_branch,this.request=e,this.transport=e.transport,this.ua=t,this.last_response="",e.server_transaction=this,this.state=a.STATUS_PROCEEDING,t.newTransaction(this),this.resendProvisionalTimer=null,e.reply(100),h.EventEmitter.call(this)}function u(e,t){var n;switch(t.method){case T.INVITE:if(n=e.transactions.ist[t.via_branch]){switch(n.state){case a.STATUS_PROCEEDING:n.transport.send(n.last_response);break;case a.STATUS_ACCEPTED:}return!0}break;case T.ACK:if(n=e.transactions.ist[t.via_branch],!n)return!1;if(n.state===a.STATUS_ACCEPTED)return!1;if(n.state===a.STATUS_COMPLETED)return n.state=a.STATUS_CONFIRMED,n.I=setTimeout(function(){n.timer_I()},_.TIMER_I),!0;break;case T.CANCEL:return n=e.transactions.ist[t.via_branch],n?(t.reply_sl(200),n.state!==a.STATUS_PROCEEDING):(t.reply_sl(481),!0);default:if(n=e.transactions.nist[t.via_branch]){switch(n.state){case a.STATUS_TRYING:break;case a.STATUS_PROCEEDING:case a.STATUS_COMPLETED:n.transport.send(n.last_response)}return!0}}}t.exports={C:null,NonInviteClientTransaction:r,InviteClientTransaction:s,AckClientTransaction:l,NonInviteServerTransaction:i,InviteServerTransaction:o,checkTransaction:u};var a={STATUS_TRYING:1,STATUS_PROCEEDING:2,STATUS_CALLING:3,STATUS_ACCEPTED:4,STATUS_COMPLETED:5,STATUS_TERMINATED:6,STATUS_CONFIRMED:7,NON_INVITE_CLIENT:"nict",NON_INVITE_SERVER:"nist",INVITE_CLIENT:"ict",INVITE_SERVER:"ist"};t.exports.C=a;var c=e("util"),h=e("events"),d=e("debug")("JsSIP:NonInviteClientTransaction"),p=e("debug")("JsSIP:InviteClientTransaction"),f=e("debug")("JsSIP:AckClientTransaction"),m=e("debug")("JsSIP:NonInviteServerTransaction"),g=e("debug")("JsSIP:InviteServerTransaction"),T=e("./Constants"),_=e("./Timers");c.inherits(r,h.EventEmitter),r.prototype.stateChanged=function(e){this.state=e,this.emit("stateChanged")},r.prototype.send=function(){var e=this;this.stateChanged(a.STATUS_TRYING),this.F=setTimeout(function(){e.timer_F()},_.TIMER_F),this.transport.send(this.request)||this.onTransportError()},r.prototype.onTransportError=function(){d("transport error occurred, deleting transaction "+this.id),clearTimeout(this.F),clearTimeout(this.K),this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this),this.request_sender.onTransportError()},r.prototype.timer_F=function(){d("Timer F expired for transaction "+this.id),this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this),this.request_sender.onRequestTimeout()},r.prototype.timer_K=function(){this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this)},r.prototype.receiveResponse=function(e){var t=this,n=e.status_code;if(200>n)switch(this.state){case a.STATUS_TRYING:case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_PROCEEDING),this.request_sender.receiveResponse(e)}else switch(this.state){case a.STATUS_TRYING:case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_COMPLETED),clearTimeout(this.F),408===n?this.request_sender.onRequestTimeout():this.request_sender.receiveResponse(e),this.K=setTimeout(function(){t.timer_K()},_.TIMER_K);break;case a.STATUS_COMPLETED:}},c.inherits(s,h.EventEmitter),s.prototype.stateChanged=function(e){this.state=e,this.emit("stateChanged")},s.prototype.send=function(){var e=this;this.stateChanged(a.STATUS_CALLING),this.B=setTimeout(function(){e.timer_B()},_.TIMER_B),this.transport.send(this.request)||this.onTransportError()},s.prototype.onTransportError=function(){clearTimeout(this.B),clearTimeout(this.D),clearTimeout(this.M),this.state!==a.STATUS_ACCEPTED&&(p("transport error occurred, deleting transaction "+this.id),this.request_sender.onTransportError()),this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this)},s.prototype.timer_M=function(){p("Timer M expired for transaction "+this.id),this.state===a.STATUS_ACCEPTED&&(clearTimeout(this.B),this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this))},s.prototype.timer_B=function(){p("Timer B expired for transaction "+this.id),this.state===a.STATUS_CALLING&&(this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this),this.request_sender.onRequestTimeout())},s.prototype.timer_D=function(){p("Timer D expired for transaction "+this.id),clearTimeout(this.B),this.stateChanged(a.STATUS_TERMINATED),this.request_sender.ua.destroyTransaction(this)},s.prototype.sendACK=function(e){var t=this;this.ack="ACK "+this.request.ruri+" SIP/2.0\r\n",this.ack+="Via: "+this.request.headers.Via.toString()+"\r\n",this.request.headers.Route&&(this.ack+="Route: "+this.request.headers.Route.toString()+"\r\n"),this.ack+="To: "+e.getHeader("to")+"\r\n",this.ack+="From: "+this.request.headers.From.toString()+"\r\n",this.ack+="Call-ID: "+this.request.headers["Call-ID"].toString()+"\r\n",this.ack+="CSeq: "+this.request.headers.CSeq.toString().split(" ")[0],this.ack+=" ACK\r\n",this.ack+="Content-Length: 0\r\n\r\n",this.D=setTimeout(function(){t.timer_D()},_.TIMER_D),this.transport.send(this.ack)},s.prototype.cancel_request=function(e,t){var n=e.request;this.cancel=T.CANCEL+" "+n.ruri+" SIP/2.0\r\n",this.cancel+="Via: "+n.headers.Via.toString()+"\r\n",this.request.headers.Route&&(this.cancel+="Route: "+n.headers.Route.toString()+"\r\n"),this.cancel+="To: "+n.headers.To.toString()+"\r\n",this.cancel+="From: "+n.headers.From.toString()+"\r\n",this.cancel+="Call-ID: "+n.headers["Call-ID"].toString()+"\r\n",this.cancel+="CSeq: "+n.headers.CSeq.toString().split(" ")[0]+" CANCEL\r\n",t&&(this.cancel+="Reason: "+t+"\r\n"),this.cancel+="Content-Length: 0\r\n\r\n",this.state===a.STATUS_PROCEEDING&&this.transport.send(this.cancel)},s.prototype.receiveResponse=function(e){var t=this,n=e.status_code;if(n>=100&&199>=n)switch(this.state){case a.STATUS_CALLING:this.stateChanged(a.STATUS_PROCEEDING),this.request_sender.receiveResponse(e);break;case a.STATUS_PROCEEDING:this.request_sender.receiveResponse(e)}else if(n>=200&&299>=n)switch(this.state){case a.STATUS_CALLING:case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_ACCEPTED),this.M=setTimeout(function(){t.timer_M()},_.TIMER_M),this.request_sender.receiveResponse(e);break;case a.STATUS_ACCEPTED:this.request_sender.receiveResponse(e)}else if(n>=300&&699>=n)switch(this.state){case a.STATUS_CALLING:case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_COMPLETED),this.sendACK(e),this.request_sender.receiveResponse(e);break;case a.STATUS_COMPLETED:this.sendACK(e)}},c.inherits(l,h.EventEmitter),l.prototype.send=function(){this.transport.send(this.request)||this.onTransportError()},l.prototype.onTransportError=function(){f("transport error occurred for transaction "+this.id),this.request_sender.onTransportError()},c.inherits(i,h.EventEmitter),i.prototype.stateChanged=function(e){this.state=e,this.emit("stateChanged")},i.prototype.timer_J=function(){m("Timer J expired for transaction "+this.id),this.stateChanged(a.STATUS_TERMINATED),this.ua.destroyTransaction(this)},i.prototype.onTransportError=function(){this.transportError||(this.transportError=!0,m("transport error occurred, deleting transaction "+this.id),clearTimeout(this.J),this.stateChanged(a.STATUS_TERMINATED),this.ua.destroyTransaction(this))},i.prototype.receiveResponse=function(e,t,n,r){var s=this;if(100===e)switch(this.state){case a.STATUS_TRYING:this.stateChanged(a.STATUS_PROCEEDING),this.transport.send(t)||this.onTransportError();break;case a.STATUS_PROCEEDING:this.last_response=t,this.transport.send(t)?n&&n():(this.onTransportError(),r&&r())}else if(e>=200&&699>=e)switch(this.state){case a.STATUS_TRYING:case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_COMPLETED),this.last_response=t,this.J=setTimeout(function(){s.timer_J()},_.TIMER_J),this.transport.send(t)?n&&n():(this.onTransportError(),r&&r());break;case a.STATUS_COMPLETED:}},c.inherits(o,h.EventEmitter),o.prototype.stateChanged=function(e){this.state=e,this.emit("stateChanged")},o.prototype.timer_H=function(){g("Timer H expired for transaction "+this.id),this.state===a.STATUS_COMPLETED&&g("ACK not received, dialog will be terminated"),this.stateChanged(a.STATUS_TERMINATED),this.ua.destroyTransaction(this)},o.prototype.timer_I=function(){this.stateChanged(a.STATUS_TERMINATED)},o.prototype.timer_L=function(){g("Timer L expired for transaction "+this.id),this.state===a.STATUS_ACCEPTED&&(this.stateChanged(a.STATUS_TERMINATED),this.ua.destroyTransaction(this))},o.prototype.onTransportError=function(){this.transportError||(this.transportError=!0,g("transport error occurred, deleting transaction "+this.id),null!==this.resendProvisionalTimer&&(clearInterval(this.resendProvisionalTimer),this.resendProvisionalTimer=null),clearTimeout(this.L),clearTimeout(this.H),clearTimeout(this.I),this.stateChanged(a.STATUS_TERMINATED),this.ua.destroyTransaction(this))},o.prototype.resend_provisional=function(){this.transport.send(this.last_response)||this.onTransportError()},o.prototype.receiveResponse=function(e,t,n,r){var s=this;if(e>=100&&199>=e)switch(this.state){case a.STATUS_PROCEEDING:this.transport.send(t)||this.onTransportError(),this.last_response=t}if(e>100&&199>=e&&this.state===a.STATUS_PROCEEDING)null===this.resendProvisionalTimer&&(this.resendProvisionalTimer=setInterval(function(){s.resend_provisional()},_.PROVISIONAL_RESPONSE_INTERVAL));else if(e>=200&&299>=e)switch(this.state){case a.STATUS_PROCEEDING:this.stateChanged(a.STATUS_ACCEPTED),this.last_response=t,this.L=setTimeout(function(){s.timer_L()},_.TIMER_L),null!==this.resendProvisionalTimer&&(clearInterval(this.resendProvisionalTimer),this.resendProvisionalTimer=null);case a.STATUS_ACCEPTED:this.transport.send(t)?n&&n():(this.onTransportError(),r&&r())}else if(e>=300&&699>=e)switch(this.state){case a.STATUS_PROCEEDING:null!==this.resendProvisionalTimer&&(clearInterval(this.resendProvisionalTimer),this.resendProvisionalTimer=null),this.transport.send(t)?(this.stateChanged(a.STATUS_COMPLETED),this.H=setTimeout(function(){s.timer_H()},_.TIMER_H),n&&n()):(this.onTransportError(),r&&r())}}},{"./Constants":1,"./Timers":20,debug:33,events:28,util:32}],22:[function(e,t,n){function r(e,t){if(c("new()"),this.status=d.STATUS_DISCONNECTED,this.socket=null,this.sockets=[],this.recovery_options=t||d.recovery_options,this.recover_attempts=0,this.recovery_timer=null,this.close_requested=!1,"undefined"==typeof e)throw new TypeError("Invalid argument. undefined 'sockets' argument");e instanceof Array||(e=[e]),e.forEach(function(e){if(!a.isSocket(e.socket))throw new TypeError("Invalid argument. invalid 'JsSIP.Socket' instance");if(e.weight&&!Number(e.weight))throw new TypeError("Invalid argument. 'weight' attribute is not a number");this.sockets.push({socket:e.socket,weight:e.weight||0,status:d.SOCKET_STATUS_READY})},this),Object.defineProperties(this,{via_transport:{get:function(){return this.socket.via_transport}},url:{get:function(){return this.socket.url}},sip_uri:{get:function(){return this.socket.sip_uri}}}),u.call(this)}function s(){this.recover_attempts=0,this.status=d.STATUS_CONNECTED,null!==this.recovery_timer&&(clearTimeout(this.recovery_timer),this.recovery_timer=null),this.onconnect({socket:this})}function l(e,t,n){this.status=d.STATUS_DISCONNECTED,this.ondisconnect({socket:this.socket,error:e,code:t,reason:n}),this.close_requested||(e&&(this.socket.status=d.SOCKET_STATUS_ERROR),o.call(this,e))}function i(e){if("\r\n"===e)return void c("received message with CRLF Keep Alive response");if("string"!=typeof e){try{e=String.fromCharCode.apply(null,new Uint8Array(e))}catch(t){return void c("received binary message failed to be converted into string, message discarded")}c("received binary message:\n\n"+e+"\n")}else c("received text message:\n\n"+e+"\n");this.ondata({transport:this,message:e})}function o(){var e,t=this;this.recover_attempts+=1,e=Math.floor(Math.random()*Math.pow(2,this.recover_attempts)+1),e<this.recovery_options.min_interval?e=this.recovery_options.min_interval:e>this.recovery_options.max_interval&&(e=this.recovery_options.max_interval),c("reconnection attempt: "+this.recover_attempts+". next connection attempt in "+e+" seconds"),this.recovery_timer=setTimeout(function(){t.close_requested||t.isConnected()||t.isConnecting()||(u.call(t),t.connect())},1e3*e)}function u(){var e=[];if(this.sockets.forEach(function(t){t.status!==d.SOCKET_STATUS_ERROR&&(0===e.length?e.push(t):t.weight>e[0].weight?e=[t]:t.weight===e[0].weight&&e.push(t))}),0===e.length)return this.sockets.forEach(function(e){e.status=d.SOCKET_STATUS_READY}),void u.call(this);var t=Math.floor(Math.random()*e.length);this.socket=e[t].socket}t.exports=r;var a=e("./Socket"),c=e("debug")("JsSIP:Transport"),h=e("debug")("JsSIP:ERROR:Transport"),d={STATUS_CONNECTED:0,STATUS_CONNECTING:1,STATUS_DISCONNECTED:2,SOCKET_STATUS_READY:0,SOCKET_STATUS_ERROR:1,recovery_options:{min_interval:2,max_interval:30}};r.prototype.connect=function(){return c("connect()"),this.isConnected()?void c("Transport is already connected"):this.isConnecting()?void c("Transport is connecting"):(this.close_requested=!1,this.status=d.STATUS_CONNECTING,this.onconnecting({socket:this.socket,attempts:this.recover_attempts}),void(this.close_requested||(this.socket.onconnect=s.bind(this),this.socket.ondisconnect=l.bind(this),this.socket.ondata=i.bind(this),this.socket.connect())))},r.prototype.disconnect=function(){c("close()"),this.close_requested=!0,this.recover_attempts=0,this.status=d.STATUS_DISCONNECTED,null!==this.recovery_timer&&(clearTimeout(this.recovery_timer),this.recovery_timer=null),this.socket.onconnect=function(){},this.socket.ondisconnect=function(){},this.socket.ondata=function(){},this.socket.disconnect(),this.ondisconnect()},r.prototype.send=function(e){if(c("send()"),!this.isConnected())return h("unable to send message, transport is not connected"),!1;var t=e.toString();return c("sending message:\n\n"+t+"\n"),this.socket.send(t)},r.prototype.isConnected=function(){return this.status===d.STATUS_CONNECTED},r.prototype.isConnecting=function(){return this.status===d.STATUS_CONNECTING}},{"./Socket":19,debug:33}],23:[function(e,t,n){function r(e){if(this.cache={credentials:{}},this.configuration={},this.dynConfiguration={},this.dialogs={},this.applicants={},this.sessions={},this.transport=null,this.contact=null,this.status=u.STATUS_INIT,this.error=null,this.transactions={nist:{},nict:{},ist:{},ict:{}},this.data={},Object.defineProperties(this,{transactionsCount:{get:function(){var e,t=["nist","nict","ist","ict"],n=0;for(e in t)n+=Object.keys(this.transactions[t[e]]).length;return n}},nictTransactionsCount:{get:function(){return Object.keys(this.transactions.nict).length}},nistTransactionsCount:{get:function(){return Object.keys(this.transactions.nist).length}},ictTransactionsCount:{get:function(){return Object.keys(this.transactions.ict).length}},istTransactionsCount:{get:function(){return Object.keys(this.transactions.ist).length}}}),void 0===e)throw new TypeError("Not enough arguments");try{this.loadConfig(e)}catch(t){throw this.status=u.STATUS_NOT_READY,this.error=u.CONFIGURATION_ERROR,t}this._registrator=new m(this),c.EventEmitter.call(this),p.called||p()}function s(e){this.emit("connecting",e)}function l(e){this.status!==u.STATUS_USER_CLOSED&&(this.status=u.STATUS_READY,this.error=null,this.emit("connected",e),this.dynConfiguration.register&&this._registrator.register())}function i(e){var t,n,r,s=["nict","ict","nist","ist"];for(r=s.length,t=0;r>t;t++)for(n in this.transactions[s[t]])this.transactions[s[t]][n].onTransportError();this.emit("disconnected",e),this._registrator.onTransportClosed(),this.status!==u.STATUS_USER_CLOSED&&(this.status=u.STATUS_NOT_READY,this.error=u.NETWORK_ERROR)}function o(e){var t,n=e.transport,s=e.message;if(s=b.parseMessage(s,this),s&&!(this.status===r.C.STATUS_USER_CLOSED&&s instanceof I.IncomingRequest)&&w(s,this,n))if(s instanceof I.IncomingRequest)s.transport=n,this.receiveRequest(s);else if(s instanceof I.IncomingResponse)switch(s.method){case f.INVITE:t=this.transactions.ict[s.via_branch],t&&t.receiveResponse(s);break;case f.ACK:break;default:t=this.transactions.nict[s.via_branch],t&&t.receiveResponse(s)}}t.exports=r;var u={STATUS_INIT:0,STATUS_READY:1,STATUS_USER_CLOSED:2,STATUS_NOT_READY:3,CONFIGURATION_ERROR:1,NETWORK_ERROR:2};r.C=u;var a=e("util"),c=e("events"),h=e("debug")("JsSIP:UA"),d=e("debug")("JsSIP:ERROR:UA");d.log=console.warn.bind(console);var p=e("rtcninja"),f=e("./Constants"),m=e("./Registrator"),g=e("./RTCSession"),T=e("./Message"),_=e("./Transactions"),v=e("./Transport"),C=e("./WebSocketInterface"),S=e("./Socket"),E=e("./Utils"),A=e("./Exceptions"),y=e("./URI"),R=e("./Grammar"),b=e("./Parser"),I=e("./SIPMessage"),w=e("./sanityCheck");a.inherits(r,c.EventEmitter),r.prototype.start=function(){function e(){h("restarting UA"),t.status=u.STATUS_READY,t.transport.connect()}h("start()");var t=this;this.status===u.STATUS_INIT?this.transport.connect():this.status===u.STATUS_USER_CLOSED?this.isConnected()?this.once("disconnected",e):e():h(this.status===u.STATUS_READY?"UA is in READY status, not restarted":"ERROR: connection is down, Auto-Recovery system is trying to reconnect"),this.dynConfiguration.register=this.configuration.register},r.prototype.register=function(){h("register()"),this.dynConfiguration.register=!0,this._registrator.register()},r.prototype.unregister=function(e){h("unregister()"),this.dynConfiguration.register=!1,this._registrator.unregister(e)},r.prototype.registrator=function(){return this._registrator},r.prototype.isRegistered=function(){return!!this._registrator.registered},r.prototype.isConnected=function(){return this.transport.isConnected()},r.prototype.call=function(e,t){h("call()");var n;return n=new g(this),n.connect(e,t),n},r.prototype.sendMessage=function(e,t,n){h("sendMessage()");var r;return r=new T(this),r.send(e,t,n),r},r.prototype.terminateSessions=function(e){h("terminateSessions()");for(var t in this.sessions)this.sessions[t].isEnded()||this.sessions[t].terminate(e)},r.prototype.stop=function(){h("stop()");var e,t,n,r=this;if(this.dynConfiguration={},this.status===u.STATUS_USER_CLOSED)return void h("UA already closed");this._registrator.close(),n=Object.keys(this.sessions).length;for(e in this.sessions){h("closing session "+e);try{this.sessions[e].terminate()}catch(s){}}for(t in this.applicants)try{this.applicants[t].close()}catch(s){}this.status=u.STATUS_USER_CLOSED,0===this.nistTransactionsCount&&0===this.nictTransactionsCount&&0===this.ictTransactionsCount&&0===this.istTransactionsCount&&0===n?r.transport.disconnect():setTimeout(function(){r.transport.disconnect()},2e3)},r.prototype.normalizeTarget=function(e){return E.normalizeTarget(e,this.configuration.hostport_params)},r.prototype.get=function(e){switch(e){case"realm":return this.configuration.realm;case"ha1":return this.configuration.ha1;default:return void d('get() | cannot get "%s" parameter in runtime',e)}return!0},r.prototype.set=function(e,t){switch(e){case"password":this.configuration.password=String(t);break;case"realm":this.configuration.realm=String(t);break;case"ha1":this.configuration.ha1=String(t),this.configuration.password=null;break;case"display_name":if(-1===R.parse('"'+t+'"',"display_name"))return d('set() | wrong "display_name"'),!1;this.configuration.display_name=t;break;default:return d('set() | cannot set "%s" parameter in runtime',e),!1}return!0},r.prototype.newTransaction=function(e){this.transactions[e.type][e.id]=e,this.emit("newTransaction",{transaction:e})},r.prototype.destroyTransaction=function(e){delete this.transactions[e.type][e.id],this.emit("transactionDestroyed",{transaction:e})},r.prototype.newMessage=function(e){this.emit("newMessage",e)},r.prototype.newRTCSession=function(e){this.emit("newRTCSession",e)},r.prototype.registered=function(e){this.emit("registered",e)},r.prototype.unregistered=function(e){this.emit("unregistered",e)},r.prototype.registrationFailed=function(e){this.emit("registrationFailed",e)},r.prototype.receiveRequest=function(e){var t,n,r,s,l=e.method;if(e.ruri.user!==this.configuration.uri.user&&e.ruri.user!==this.contact.uri.user)return h("Request-URI does not point to us"),void(e.method!==f.ACK&&e.reply_sl(404));if(e.ruri.scheme===f.SIPS)return void e.reply_sl(416);if(!_.checkTransaction(this,e)){if(l===f.INVITE?new _.InviteServerTransaction(e,this):l!==f.ACK&&l!==f.CANCEL&&new _.NonInviteServerTransaction(e,this),l===f.OPTIONS)e.reply(200);else if(l===f.MESSAGE){if(0===this.listeners("newMessage").length)return void e.reply(405);r=new T(this),r.init_incoming(e)}else if(l===f.INVITE&&!e.to_tag&&0===this.listeners("newRTCSession").length)return void e.reply(405);if(e.to_tag)t=this.findDialog(e.call_id,e.from_tag,e.to_tag),t?t.receiveRequest(e):l===f.NOTIFY?(n=this.findSession(e),n?n.receiveRequest(e):(h("received NOTIFY request for a non existent subscription"),e.reply(481,"Subscription does not exist"))):l!==f.ACK&&e.reply(481);else switch(l){case f.INVITE:p.hasWebRTC()?e.hasHeader("replaces")?(s=e.replaces,t=this.findDialog(s.call_id,s.from_tag,s.to_tag),t?(n=t.owner,n.isEnded()?e.reply(603):n.receiveRequest(e)):e.reply(481)):(n=new g(this),n.init_incoming(e)):(h("INVITE received but WebRTC is not supported"),e.reply(488));break;case f.BYE:e.reply(481);break;case f.CANCEL:n=this.findSession(e),n?n.receiveRequest(e):h("received CANCEL request for a non existent session");break;case f.ACK:break;default:e.reply(405)}}},r.prototype.findSession=function(e){var t=e.call_id+e.from_tag,n=this.sessions[t],r=e.call_id+e.to_tag,s=this.sessions[r];return n?n:s?s:null},r.prototype.findDialog=function(e,t,n){var r=e+t+n,s=this.dialogs[r];return s?s:(r=e+n+t,s=this.dialogs[r],s?s:null)},r.prototype.loadConfig=function(e){var t,n,u,a,c,p={via_host:E.createRandomToken(12)+".invalid",contact_uri:null,password:null,realm:null,ha1:null,register_expires:600,register:!0,registrar_server:null,use_preloaded_route:!1,no_answer_timeout:60,session_timers:!0};for(t in r.configuration_check.mandatory){if(!e.hasOwnProperty(t))throw new A.ConfigurationError(t);if(n=e[t],u=r.configuration_check.mandatory[t].call(this,n),void 0===u)throw new A.ConfigurationError(t,n);p[t]=u}for(t in r.configuration_check.optional)if(e.hasOwnProperty(t)){if(n=e[t],E.isEmpty(n))continue;if(u=r.configuration_check.optional[t].call(this,n,e),void 0===u)throw new A.ConfigurationError(t,n);p[t]=u}0===p.display_name&&(p.display_name="0"),p.instance_id||(p.instance_id=E.newUUID()),p.jssip_id=E.createRandomToken(5),a=p.uri.clone(),a.user=null,p.hostport_params=a.toString().replace(/^sip:/i,"");var f=[];if(p.ws_servers&&Array.isArray(p.ws_servers)&&(f=f.concat(p.ws_servers)),p.sockets&&Array.isArray(p.sockets)&&(f=f.concat(p.sockets)),0===f.length)throw new A.ConfigurationError("sockets");try{this.transport=new v(f,{max_interval:p.connection_recovery_max_interval,min_interval:p.connection_recovery_min_interval}),this.transport.onconnecting=s.bind(this),this.transport.onconnect=l.bind(this),this.transport.ondisconnect=i.bind(this),this.transport.ondata=o.bind(this),delete p.connection_recovery_max_interval,delete p.connection_recovery_min_interval,delete p.ws_servers,delete p.sockets}catch(m){throw d(m),new A.ConfigurationError("sockets",f)}p.authorization_user||(p.authorization_user=p.uri.user),p.registrar_server||(c=p.uri.clone(),c.user=null,c.clearParams(),c.clearHeaders(),p.registrar_server=c),p.no_answer_timeout=1e3*p.no_answer_timeout,p.contact_uri?p.via_host=p.contact_uri.host:p.contact_uri=new y("sip",E.createRandomToken(8),p.via_host,null,{transport:"ws"}),this.contact={pub_gruu:null,temp_gruu:null,uri:p.contact_uri,toString:function(e){e=e||{};var t=e.anonymous||null,n=e.outbound||null,r="<";return r+=t?this.temp_gruu||"sip:anonymous@anonymous.invalid;transport=ws":this.pub_gruu||this.uri.toString(),!n||(t?this.temp_gruu:this.pub_gruu)||(r+=";ob"),r+=">"}};for(t in p)r.configuration_skeleton[t].value=p[t];Object.defineProperties(this.configuration,r.configuration_skeleton);for(t in p)r.configuration_skeleton[t].value="";h("configuration parameters after validation:");for(t in p)switch(t){case"uri":case"registrar_server":h("- "+t+": "+p[t]);break;case"password":case"ha1":h("- "+t+": NOT SHOWN");break;default:h("- "+t+": "+JSON.stringify(p[t]))}},r.configuration_skeleton=function(){var e,t,n,r={},s=["jssip_id","hostport_params","uri","authorization_user","contact_uri","display_name","instance_id","no_answer_timeout","session_timers","password","realm","ha1","register_expires","registrar_server","sockets","use_preloaded_route","ws_servers","via_core_value","via_host"],l=["password","realm","ha1","display_name"];for(e in s)t=s[e],n=-1!==l.indexOf(t),r[t]={value:"",writable:n,configurable:!1};return r.register={value:"",writable:!0,configurable:!1},r}(),r.configuration_check={mandatory:{uri:function(e){var t;return/^sip:/i.test(e)||(e=f.SIP+":"+e),t=y.parse(e),t&&t.user?t:void 0}},optional:{authorization_user:function(e){return-1===R.parse('"'+e+'"',"quoted_string")?void 0:e},connection_recovery_max_interval:function(e){var t;return E.isDecimal(e)&&(t=Number(e),t>0)?t:void 0},connection_recovery_min_interval:function(e){var t;return E.isDecimal(e)&&(t=Number(e),t>0)?t:void 0},contact_uri:function(e){if("string"==typeof e){var t=R.parse(e,"SIP_URI");if(-1!==t)return t}},display_name:function(e){return-1===R.parse('"'+e+'"',"display_name")?void 0:e},instance_id:function(e){return/^uuid:/i.test(e)&&(e=e.substr(5)),-1===R.parse(e,"uuid")?void 0:e},no_answer_timeout:function(e){var t;return E.isDecimal(e)&&(t=Number(e),t>0)?t:void 0},session_timers:function(e){return"boolean"==typeof e?e:void 0},password:function(e){return String(e)},realm:function(e){return String(e)},ha1:function(e){return String(e)},register:function(e){return"boolean"==typeof e?e:void 0},register_expires:function(e){var t;return E.isDecimal(e)&&(t=Number(e),t>0)?t:void 0},registrar_server:function(e){var t;return/^sip:/i.test(e)||(e=f.SIP+":"+e),t=y.parse(e),t?t.user?void 0:t:void 0},sockets:function(e){var t,n;if(S.isSocket(e))e=[{socket:e}];else{if(!Array.isArray(e)||!e.length)return;for(n=e.length,t=0;n>t;t++)S.isSocket(e[t])&&(e[t]={socket:e[t]})}return e},use_preloaded_route:function(e){return"boolean"==typeof e?e:void 0},ws_servers:function(e){var t,n,r=[];if("string"==typeof e)e=[{ws_uri:e}];else{if(!Array.isArray(e)||!e.length)return;for(n=e.length,t=0;n>t;t++)"string"==typeof e[t]&&(e[t]={ws_uri:e[t]})}for(n=e.length,t=0;n>t;t++)try{r.push({socket:new C(e[t].ws_uri),weight:e[t].weight||0})}catch(s){return void d(s)}return r}}}},{"./Constants":1,"./Exceptions":5,"./Grammar":6,"./Message":8,"./Parser":10,"./RTCSession":11,"./Registrator":16,"./SIPMessage":18,"./Socket":19,"./Transactions":21,"./Transport":22,"./URI":24,"./Utils":25,"./WebSocketInterface":26,"./sanityCheck":27,debug:33,events:28,rtcninja:38,util:32}],24:[function(e,t,n){function r(e,t,n,r,l,i){var o,u;if(!n)throw new TypeError('missing or invalid "host" parameter');e=e||s.SIP,this.parameters={},this.headers={};for(o in l)this.setParam(o,l[o]);for(u in i)this.setHeader(u,i[u]);Object.defineProperties(this,{scheme:{get:function(){return e},set:function(t){e=t.toLowerCase()}},user:{get:function(){return t},set:function(e){t=e}},host:{get:function(){return n},set:function(e){n=e.toLowerCase()}},port:{get:function(){return r},set:function(e){r=0===e?e:parseInt(e,10)||null}}})}t.exports=r;var s=e("./Constants"),l=e("./Utils"),i=e("./Grammar");r.prototype={setParam:function(e,t){e&&(this.parameters[e.toLowerCase()]="undefined"==typeof t||null===t?null:t.toString())},getParam:function(e){return e?this.parameters[e.toLowerCase()]:void 0},hasParam:function(e){return e?this.parameters.hasOwnProperty(e.toLowerCase())&&!0||!1:void 0},deleteParam:function(e){var t;return e=e.toLowerCase(),this.parameters.hasOwnProperty(e)?(t=this.parameters[e],delete this.parameters[e],t):void 0},clearParams:function(){this.parameters={}},setHeader:function(e,t){this.headers[l.headerize(e)]=Array.isArray(t)?t:[t]},getHeader:function(e){return e?this.headers[l.headerize(e)]:void 0;
},hasHeader:function(e){return e?this.headers.hasOwnProperty(l.headerize(e))&&!0||!1:void 0},deleteHeader:function(e){var t;return e=l.headerize(e),this.headers.hasOwnProperty(e)?(t=this.headers[e],delete this.headers[e],t):void 0},clearHeaders:function(){this.headers={}},clone:function(){return new r(this.scheme,this.user,this.host,this.port,JSON.parse(JSON.stringify(this.parameters)),JSON.parse(JSON.stringify(this.headers)))},toString:function(){var e,t,n,r,s=[];r=this.scheme+":",this.user&&(r+=l.escapeUser(this.user)+"@"),r+=this.host,(this.port||0===this.port)&&(r+=":"+this.port);for(t in this.parameters)r+=";"+t,null!==this.parameters[t]&&(r+="="+this.parameters[t]);for(e in this.headers)for(n=0;n<this.headers[e].length;n++)s.push(e+"="+this.headers[e][n]);return s.length>0&&(r+="?"+s.join("&")),r},toAor:function(e){var t;return t=this.scheme+":",this.user&&(t+=l.escapeUser(this.user)+"@"),t+=this.host,e&&(this.port||0===this.port)&&(t+=":"+this.port),t}},r.parse=function(e){return e=i.parse(e,"SIP_URI"),-1!==e?e:void 0}},{"./Constants":1,"./Grammar":6,"./Utils":25}],25:[function(e,t,n){var r={};t.exports=r;var s=e("./Constants"),l=e("./URI"),i=e("./Grammar");r.str_utf8_length=function(e){return unescape(encodeURIComponent(e)).length},r.isFunction=function(e){return void 0!==e?"[object Function]"===Object.prototype.toString.call(e):!1},r.isString=function(e){return void 0!==e?"[object String]"===Object.prototype.toString.call(e):!1},r.isDecimal=function(e){return!isNaN(e)&&parseFloat(e)===parseInt(e,10)},r.isEmpty=function(e){return null===e||""===e||void 0===e||Array.isArray(e)&&0===e.length||"number"==typeof e&&isNaN(e)?!0:void 0},r.hasMethods=function(e){for(var t,n=1;t=arguments[n++];)if(this.isFunction(e[t]))return!1;return!0},r.createRandomToken=function(e,t){var n,r,s="";for(t=t||32,n=0;e>n;n++)r=Math.random()*t|0,s+=r.toString(t);return s},r.newTag=function(){return r.createRandomToken(10)},r.newUUID=function(){var e="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=16*Math.random()|0,n="x"===e?t:3&t|8;return n.toString(16)});return e},r.hostType=function(e){return e?(e=i.parse(e,"host"),-1!==e?e.host_type:void 0):void 0},r.normalizeTarget=function(e,t){var n,i,o,u;if(e){if(e instanceof l)return e;if("string"==typeof e){switch(i=e.split("@"),i.length){case 1:if(!t)return;o=e,u=t;break;case 2:o=i[0],u=i[1];break;default:o=i.slice(0,i.length-1).join("@"),u=i[i.length-1]}return o=o.replace(/^(sips?|tel):/i,""),/^[\-\.\(\)]*\+?[0-9\-\.\(\)]+$/.test(o)&&(o=o.replace(/[\-\.\(\)]/g,"")),e=s.SIP+":"+r.escapeUser(o)+"@"+u,(n=l.parse(e))?n:void 0}}else;},r.escapeUser=function(e){return encodeURIComponent(decodeURIComponent(e)).replace(/%3A/gi,":").replace(/%2B/gi,"+").replace(/%3F/gi,"?").replace(/%2F/gi,"/")},r.headerize=function(e){var t,n={"Call-Id":"Call-ID",Cseq:"CSeq","Www-Authenticate":"WWW-Authenticate"},r=e.toLowerCase().replace(/_/g,"-").split("-"),s="",l=r.length;for(t=0;l>t;t++)0!==t&&(s+="-"),s+=r[t].charAt(0).toUpperCase()+r[t].substring(1);return n[s]&&(s=n[s]),s},r.sipErrorCause=function(e){var t;for(t in s.SIP_ERROR_CAUSES)if(-1!==s.SIP_ERROR_CAUSES[t].indexOf(e))return s.causes[t];return s.causes.SIP_FAILURE_CODE},r.getRandomTestNetIP=function(){function e(e,t){return Math.floor(Math.random()*(t-e+1)+e)}return"192.0.2."+e(1,254)},r.calculateMD5=function(e){function t(e,t){return e<<t|e>>>32-t}function n(e,t){var n,r,s,l,i;return s=2147483648&e,l=2147483648&t,n=1073741824&e,r=1073741824&t,i=(1073741823&e)+(1073741823&t),n&r?2147483648^i^s^l:n|r?1073741824&i?3221225472^i^s^l:1073741824^i^s^l:i^s^l}function r(e,t,n){return e&t|~e&n}function s(e,t,n){return e&n|t&~n}function l(e,t,n){return e^t^n}function i(e,t,n){return t^(e|~n)}function o(e,s,l,i,o,u,a){return e=n(e,n(n(r(s,l,i),o),a)),n(t(e,u),s)}function u(e,r,l,i,o,u,a){return e=n(e,n(n(s(r,l,i),o),a)),n(t(e,u),r)}function a(e,r,s,i,o,u,a){return e=n(e,n(n(l(r,s,i),o),a)),n(t(e,u),r)}function c(e,r,s,l,o,u,a){return e=n(e,n(n(i(r,s,l),o),a)),n(t(e,u),r)}function h(e){for(var t,n=e.length,r=n+8,s=(r-r%64)/64,l=16*(s+1),i=new Array(l-1),o=0,u=0;n>u;)t=(u-u%4)/4,o=u%4*8,i[t]=i[t]|e.charCodeAt(u)<<o,u++;return t=(u-u%4)/4,o=u%4*8,i[t]=i[t]|128<<o,i[l-2]=n<<3,i[l-1]=n>>>29,i}function d(e){var t,n,r="",s="";for(n=0;3>=n;n++)t=e>>>8*n&255,s="0"+t.toString(16),r+=s.substr(s.length-2,2);return r}function p(e){e=e.replace(/\r\n/g,"\n");for(var t="",n=0;n<e.length;n++){var r=e.charCodeAt(n);128>r?t+=String.fromCharCode(r):r>127&&2048>r?(t+=String.fromCharCode(r>>6|192),t+=String.fromCharCode(63&r|128)):(t+=String.fromCharCode(r>>12|224),t+=String.fromCharCode(r>>6&63|128),t+=String.fromCharCode(63&r|128))}return t}var f,m,g,T,_,v,C,S,E,A=[],y=7,R=12,b=17,I=22,w=5,N=9,D=14,O=20,x=4,U=11,M=16,P=23,q=6,L=10,k=15,H=21;for(e=p(e),A=h(e),v=1732584193,C=4023233417,S=2562383102,E=271733878,f=0;f<A.length;f+=16)m=v,g=C,T=S,_=E,v=o(v,C,S,E,A[f+0],y,3614090360),E=o(E,v,C,S,A[f+1],R,3905402710),S=o(S,E,v,C,A[f+2],b,606105819),C=o(C,S,E,v,A[f+3],I,3250441966),v=o(v,C,S,E,A[f+4],y,4118548399),E=o(E,v,C,S,A[f+5],R,1200080426),S=o(S,E,v,C,A[f+6],b,2821735955),C=o(C,S,E,v,A[f+7],I,4249261313),v=o(v,C,S,E,A[f+8],y,1770035416),E=o(E,v,C,S,A[f+9],R,2336552879),S=o(S,E,v,C,A[f+10],b,4294925233),C=o(C,S,E,v,A[f+11],I,2304563134),v=o(v,C,S,E,A[f+12],y,1804603682),E=o(E,v,C,S,A[f+13],R,4254626195),S=o(S,E,v,C,A[f+14],b,2792965006),C=o(C,S,E,v,A[f+15],I,1236535329),v=u(v,C,S,E,A[f+1],w,4129170786),E=u(E,v,C,S,A[f+6],N,3225465664),S=u(S,E,v,C,A[f+11],D,643717713),C=u(C,S,E,v,A[f+0],O,3921069994),v=u(v,C,S,E,A[f+5],w,3593408605),E=u(E,v,C,S,A[f+10],N,38016083),S=u(S,E,v,C,A[f+15],D,3634488961),C=u(C,S,E,v,A[f+4],O,3889429448),v=u(v,C,S,E,A[f+9],w,568446438),E=u(E,v,C,S,A[f+14],N,3275163606),S=u(S,E,v,C,A[f+3],D,4107603335),C=u(C,S,E,v,A[f+8],O,1163531501),v=u(v,C,S,E,A[f+13],w,2850285829),E=u(E,v,C,S,A[f+2],N,4243563512),S=u(S,E,v,C,A[f+7],D,1735328473),C=u(C,S,E,v,A[f+12],O,2368359562),v=a(v,C,S,E,A[f+5],x,4294588738),E=a(E,v,C,S,A[f+8],U,2272392833),S=a(S,E,v,C,A[f+11],M,1839030562),C=a(C,S,E,v,A[f+14],P,4259657740),v=a(v,C,S,E,A[f+1],x,2763975236),E=a(E,v,C,S,A[f+4],U,1272893353),S=a(S,E,v,C,A[f+7],M,4139469664),C=a(C,S,E,v,A[f+10],P,3200236656),v=a(v,C,S,E,A[f+13],x,681279174),E=a(E,v,C,S,A[f+0],U,3936430074),S=a(S,E,v,C,A[f+3],M,3572445317),C=a(C,S,E,v,A[f+6],P,76029189),v=a(v,C,S,E,A[f+9],x,3654602809),E=a(E,v,C,S,A[f+12],U,3873151461),S=a(S,E,v,C,A[f+15],M,530742520),C=a(C,S,E,v,A[f+2],P,3299628645),v=c(v,C,S,E,A[f+0],q,4096336452),E=c(E,v,C,S,A[f+7],L,1126891415),S=c(S,E,v,C,A[f+14],k,2878612391),C=c(C,S,E,v,A[f+5],H,4237533241),v=c(v,C,S,E,A[f+12],q,1700485571),E=c(E,v,C,S,A[f+3],L,2399980690),S=c(S,E,v,C,A[f+10],k,4293915773),C=c(C,S,E,v,A[f+1],H,2240044497),v=c(v,C,S,E,A[f+8],q,1873313359),E=c(E,v,C,S,A[f+15],L,4264355552),S=c(S,E,v,C,A[f+6],k,2734768916),C=c(C,S,E,v,A[f+13],H,1309151649),v=c(v,C,S,E,A[f+4],q,4149444226),E=c(E,v,C,S,A[f+11],L,3174756917),S=c(S,E,v,C,A[f+2],k,718787259),C=c(C,S,E,v,A[f+9],H,3951481745),v=n(v,m),C=n(C,g),S=n(S,T),E=n(E,_);var F=d(v)+d(C)+d(S)+d(E);return F.toLowerCase()}},{"./Constants":1,"./Grammar":6,"./URI":24}],26:[function(e,t,n){function r(e){a("new()");var t=null,n=null;this.ws=null,Object.defineProperties(this,{via_transport:{get:function(){return n},set:function(e){n=e.toUpperCase()}},sip_uri:{get:function(){return t}},url:{get:function(){return e}}});var r=u.parse(e,"absoluteURI");if(-1===r)throw c("invalid WebSocket URI: "+e),new TypeError("Invalid argument: "+e);if("wss"!==r.scheme&&"ws"!==r.scheme)throw c("invalid WebSocket URI scheme: "+r.scheme),new TypeError("Invalid argument: "+e);t="sip:"+r.host+(r.port?":"+r.port:"")+";transport=ws",this.via_transport=r.scheme}function s(){a("WebSocket "+this.url+" connected"),this.onconnect()}function l(e){a("WebSocket "+this.url+" closed"),e.wasClean===!1&&a("WebSocket abrupt disconnection"),this.ondisconnect(e.wasClean,e.code,e.reason)}function i(e){a("received WebSocket message"),this.ondata(e.data)}function o(e){c("WebSocket "+this.url+" error: "+e)}t.exports=r;var u=e("./Grammar"),a=e("debug")("JsSIP:WebSocketInterface"),c=e("debug")("JsSIP:ERROR:WebSocketInterface");r.prototype.connect=function(){if(a("connect()"),this.isConnected())return void a("WebSocket "+this.url+" is already connected");if(this.isConnecting())return void a("WebSocket "+this.url+" is connecting");this.ws&&this.ws.close(),a("connecting to WebSocket "+this.url);try{this.ws=new WebSocket(this.url,"sip"),this.ws.binaryType="arraybuffer",this.ws.onopen=s.bind(this),this.ws.onclose=l.bind(this),this.ws.onmessage=i.bind(this),this.ws.onerror=o.bind(this)}catch(e){o.call(this,e)}},r.prototype.disconnect=function(){a("disconnect()"),this.ws&&(this.ws.close(),this.ws=null)},r.prototype.send=function(e){return a("send()"),this.isConnected()?(this.ws.send(e),!0):(c("unable to send message, WebSocket is not open"),!1)},r.prototype.isConnected=function(){return this.ws&&this.ws.readyState===this.ws.OPEN},r.prototype.isConnecting=function(){return this.ws&&this.ws.readyState===this.ws.CONNECTING}},{"./Grammar":6,debug:33}],27:[function(e,t,n){function r(e,t,n){var r,s;for(d=e,p=t,f=n,r=S.length;r--;)if(s=S[r](d),s===!1)return!1;if(d instanceof T.IncomingRequest){for(r=v.length;r--;)if(s=v[r](d),s===!1)return!1}else if(d instanceof T.IncomingResponse)for(r=C.length;r--;)if(s=C[r](d),s===!1)return!1;return!0}function s(){return"sip"!==d.s("to").uri.scheme?(h(416),!1):void 0}function l(){return d.to_tag||d.call_id.substr(0,5)!==p.configuration.jssip_id?void 0:(h(482),!1)}function i(){var e=_.str_utf8_length(d.body),t=d.getHeader("content-length");return t>e?(h(400),!1):void 0}function o(){var e,t,n=d.from_tag,r=d.call_id,s=d.cseq;if(!d.to_tag)if(d.method===g.INVITE){if(p.transactions.ist[d.via_branch])return!1;for(t in p.transactions.ist)if(e=p.transactions.ist[t],e.request.from_tag===n&&e.request.call_id===r&&e.request.cseq===s)return h(482),!1}else{if(p.transactions.nist[d.via_branch])return!1;for(t in p.transactions.nist)if(e=p.transactions.nist[t],e.request.from_tag===n&&e.request.call_id===r&&e.request.cseq===s)return h(482),!1}}function u(){return d.getHeaders("via").length>1?(m("more than one Via header field present in the response, dropping the response"),!1):void 0}function a(){var e=_.str_utf8_length(d.body),t=d.getHeader("content-length");return t>e?(m("message body length is lower than the value in Content-Length header field, dropping the response"),!1):void 0}function c(){for(var e=["from","to","call_id","cseq","via"],t=e.length;t--;)if(!d.hasHeader(e[t]))return m("missing mandatory header field : "+e[t]+", dropping the response"),!1}function h(e){var t,n="SIP/2.0 "+e+" "+g.REASON_PHRASE[e]+"\r\n",r=d.getHeaders("via"),s=r.length,l=0;for(l;s>l;l++)n+="Via: "+r[l]+"\r\n";t=d.getHeader("To"),d.to_tag||(t+=";tag="+_.newTag()),n+="To: "+t+"\r\n",n+="From: "+d.getHeader("From")+"\r\n",n+="Call-ID: "+d.call_id+"\r\n",n+="CSeq: "+d.cseq+" "+d.method+"\r\n",n+="\r\n",f.send(n)}t.exports=r;var d,p,f,m=e("debug")("JsSIP:sanityCheck"),g=e("./Constants"),T=e("./SIPMessage"),_=e("./Utils"),v=[],C=[],S=[];v.push(s),v.push(l),v.push(i),v.push(o),C.push(u),C.push(a),S.push(c)},{"./Constants":1,"./SIPMessage":18,"./Utils":25,debug:33}],28:[function(e,t,n){function r(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0}function s(e){return"function"==typeof e}function l(e){return"number"==typeof e}function i(e){return"object"==typeof e&&null!==e}function o(e){return void 0===e}t.exports=r,r.EventEmitter=r,r.prototype._events=void 0,r.prototype._maxListeners=void 0,r.defaultMaxListeners=10,r.prototype.setMaxListeners=function(e){if(!l(e)||0>e||isNaN(e))throw TypeError("n must be a positive number");return this._maxListeners=e,this},r.prototype.emit=function(e){var t,n,r,l,u,a;if(this._events||(this._events={}),"error"===e&&(!this._events.error||i(this._events.error)&&!this._events.error.length)){if(t=arguments[1],t instanceof Error)throw t;throw TypeError('Uncaught, unspecified "error" event.')}if(n=this._events[e],o(n))return!1;if(s(n))switch(arguments.length){case 1:n.call(this);break;case 2:n.call(this,arguments[1]);break;case 3:n.call(this,arguments[1],arguments[2]);break;default:l=Array.prototype.slice.call(arguments,1),n.apply(this,l)}else if(i(n))for(l=Array.prototype.slice.call(arguments,1),a=n.slice(),r=a.length,u=0;r>u;u++)a[u].apply(this,l);return!0},r.prototype.addListener=function(e,t){var n;if(!s(t))throw TypeError("listener must be a function");return this._events||(this._events={}),this._events.newListener&&this.emit("newListener",e,s(t.listener)?t.listener:t),this._events[e]?i(this._events[e])?this._events[e].push(t):this._events[e]=[this._events[e],t]:this._events[e]=t,i(this._events[e])&&!this._events[e].warned&&(n=o(this._maxListeners)?r.defaultMaxListeners:this._maxListeners,n&&n>0&&this._events[e].length>n&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),"function"==typeof console.trace&&console.trace())),this},r.prototype.on=r.prototype.addListener,r.prototype.once=function(e,t){function n(){this.removeListener(e,n),r||(r=!0,t.apply(this,arguments))}if(!s(t))throw TypeError("listener must be a function");var r=!1;return n.listener=t,this.on(e,n),this},r.prototype.removeListener=function(e,t){var n,r,l,o;if(!s(t))throw TypeError("listener must be a function");if(!this._events||!this._events[e])return this;if(n=this._events[e],l=n.length,r=-1,n===t||s(n.listener)&&n.listener===t)delete this._events[e],this._events.removeListener&&this.emit("removeListener",e,t);else if(i(n)){for(o=l;o-- >0;)if(n[o]===t||n[o].listener&&n[o].listener===t){r=o;break}if(0>r)return this;1===n.length?(n.length=0,delete this._events[e]):n.splice(r,1),this._events.removeListener&&this.emit("removeListener",e,t)}return this},r.prototype.removeAllListeners=function(e){var t,n;if(!this._events)return this;if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[e]&&delete this._events[e],this;if(0===arguments.length){for(t in this._events)"removeListener"!==t&&this.removeAllListeners(t);return this.removeAllListeners("removeListener"),this._events={},this}if(n=this._events[e],s(n))this.removeListener(e,n);else if(n)for(;n.length;)this.removeListener(e,n[n.length-1]);return delete this._events[e],this},r.prototype.listeners=function(e){var t;return t=this._events&&this._events[e]?s(this._events[e])?[this._events[e]]:this._events[e].slice():[]},r.prototype.listenerCount=function(e){if(this._events){var t=this._events[e];if(s(t))return 1;if(t)return t.length}return 0},r.listenerCount=function(e,t){return e.listenerCount(t)}},{}],29:[function(e,t,n){"function"==typeof Object.create?t.exports=function(e,t){e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}})}:t.exports=function(e,t){e.super_=t;var n=function(){};n.prototype=t.prototype,e.prototype=new n,e.prototype.constructor=e}},{}],30:[function(e,t,n){function r(){c&&o&&(c=!1,o.length?a=o.concat(a):h=-1,a.length&&s())}function s(){if(!c){var e=setTimeout(r);c=!0;for(var t=a.length;t;){for(o=a,a=[];++h<t;)o&&o[h].run();h=-1,t=a.length}o=null,c=!1,clearTimeout(e)}}function l(e,t){this.fun=e,this.array=t}function i(){}var o,u=t.exports={},a=[],c=!1,h=-1;u.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];a.push(new l(e,t)),1!==a.length||c||setTimeout(s,0)},l.prototype.run=function(){this.fun.apply(null,this.array)},u.title="browser",u.browser=!0,u.env={},u.argv=[],u.version="",u.versions={},u.on=i,u.addListener=i,u.once=i,u.off=i,u.removeListener=i,u.removeAllListeners=i,u.emit=i,u.binding=function(e){throw new Error("process.binding is not supported")},u.cwd=function(){return"/"},u.chdir=function(e){throw new Error("process.chdir is not supported")},u.umask=function(){return 0}},{}],31:[function(e,t,n){t.exports=function(e){return e&&"object"==typeof e&&"function"==typeof e.copy&&"function"==typeof e.fill&&"function"==typeof e.readUInt8}},{}],32:[function(e,t,n){(function(t,r){function s(e,t){var r={seen:[],stylize:i};return arguments.length>=3&&(r.depth=arguments[2]),arguments.length>=4&&(r.colors=arguments[3]),m(t)?r.showHidden=t:t&&n._extend(r,t),S(r.showHidden)&&(r.showHidden=!1),S(r.depth)&&(r.depth=2),S(r.colors)&&(r.colors=!1),S(r.customInspect)&&(r.customInspect=!0),r.colors&&(r.stylize=l),u(r,e,r.depth)}function l(e,t){var n=s.styles[t];return n?"["+s.colors[n][0]+"m"+e+"["+s.colors[n][1]+"m":e}function i(e,t){return e}function o(e){var t={};return e.forEach(function(e,n){t[e]=!0}),t}function u(e,t,r){if(e.customInspect&&t&&b(t.inspect)&&t.inspect!==n.inspect&&(!t.constructor||t.constructor.prototype!==t)){var s=t.inspect(r,e);return v(s)||(s=u(e,s,r)),s}var l=a(e,t);if(l)return l;var i=Object.keys(t),m=o(i);if(e.showHidden&&(i=Object.getOwnPropertyNames(t)),R(t)&&(i.indexOf("message")>=0||i.indexOf("description")>=0))return c(t);if(0===i.length){if(b(t)){var g=t.name?": "+t.name:"";return e.stylize("[Function"+g+"]","special")}if(E(t))return e.stylize(RegExp.prototype.toString.call(t),"regexp");if(y(t))return e.stylize(Date.prototype.toString.call(t),"date");if(R(t))return c(t)}var T="",_=!1,C=["{","}"];if(f(t)&&(_=!0,C=["[","]"]),b(t)){var S=t.name?": "+t.name:"";T=" [Function"+S+"]"}if(E(t)&&(T=" "+RegExp.prototype.toString.call(t)),y(t)&&(T=" "+Date.prototype.toUTCString.call(t)),R(t)&&(T=" "+c(t)),0===i.length&&(!_||0==t.length))return C[0]+T+C[1];if(0>r)return E(t)?e.stylize(RegExp.prototype.toString.call(t),"regexp"):e.stylize("[Object]","special");e.seen.push(t);var A;return A=_?h(e,t,r,m,i):i.map(function(n){return d(e,t,r,m,n,_)}),e.seen.pop(),p(A,T,C)}function a(e,t){if(S(t))return e.stylize("undefined","undefined");if(v(t)){var n="'"+JSON.stringify(t).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return e.stylize(n,"string")}return _(t)?e.stylize(""+t,"number"):m(t)?e.stylize(""+t,"boolean"):g(t)?e.stylize("null","null"):void 0}function c(e){return"["+Error.prototype.toString.call(e)+"]"}function h(e,t,n,r,s){for(var l=[],i=0,o=t.length;o>i;++i)O(t,String(i))?l.push(d(e,t,n,r,String(i),!0)):l.push("");return s.forEach(function(s){s.match(/^\d+$/)||l.push(d(e,t,n,r,s,!0))}),l}function d(e,t,n,r,s,l){var i,o,a;if(a=Object.getOwnPropertyDescriptor(t,s)||{value:t[s]},a.get?o=a.set?e.stylize("[Getter/Setter]","special"):e.stylize("[Getter]","special"):a.set&&(o=e.stylize("[Setter]","special")),O(r,s)||(i="["+s+"]"),o||(e.seen.indexOf(a.value)<0?(o=g(n)?u(e,a.value,null):u(e,a.value,n-1),o.indexOf("\n")>-1&&(o=l?o.split("\n").map(function(e){return"  "+e}).join("\n").substr(2):"\n"+o.split("\n").map(function(e){return"   "+e}).join("\n"))):o=e.stylize("[Circular]","special")),S(i)){if(l&&s.match(/^\d+$/))return o;i=JSON.stringify(""+s),i.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(i=i.substr(1,i.length-2),i=e.stylize(i,"name")):(i=i.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),i=e.stylize(i,"string"))}return i+": "+o}function p(e,t,n){var r=0,s=e.reduce(function(e,t){return r++,t.indexOf("\n")>=0&&r++,e+t.replace(/\u001b\[\d\d?m/g,"").length+1},0);return s>60?n[0]+(""===t?"":t+"\n ")+" "+e.join(",\n  ")+" "+n[1]:n[0]+t+" "+e.join(", ")+" "+n[1]}function f(e){return Array.isArray(e)}function m(e){return"boolean"==typeof e}function g(e){return null===e}function T(e){return null==e}function _(e){return"number"==typeof e}function v(e){return"string"==typeof e}function C(e){return"symbol"==typeof e}function S(e){return void 0===e}function E(e){return A(e)&&"[object RegExp]"===w(e)}function A(e){return"object"==typeof e&&null!==e}function y(e){return A(e)&&"[object Date]"===w(e)}function R(e){return A(e)&&("[object Error]"===w(e)||e instanceof Error)}function b(e){return"function"==typeof e}function I(e){return null===e||"boolean"==typeof e||"number"==typeof e||"string"==typeof e||"symbol"==typeof e||"undefined"==typeof e}function w(e){return Object.prototype.toString.call(e)}function N(e){return 10>e?"0"+e.toString(10):e.toString(10)}function D(){var e=new Date,t=[N(e.getHours()),N(e.getMinutes()),N(e.getSeconds())].join(":");return[e.getDate(),P[e.getMonth()],t].join(" ")}function O(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var x=/%[sdj%]/g;n.format=function(e){if(!v(e)){for(var t=[],n=0;n<arguments.length;n++)t.push(s(arguments[n]));return t.join(" ")}for(var n=1,r=arguments,l=r.length,i=String(e).replace(x,function(e){if("%%"===e)return"%";if(n>=l)return e;switch(e){case"%s":return String(r[n++]);case"%d":return Number(r[n++]);case"%j":try{return JSON.stringify(r[n++])}catch(t){return"[Circular]"}default:return e}}),o=r[n];l>n;o=r[++n])i+=g(o)||!A(o)?" "+o:" "+s(o);return i},n.deprecate=function(e,s){function l(){if(!i){if(t.throwDeprecation)throw new Error(s);t.traceDeprecation?console.trace(s):console.error(s),i=!0}return e.apply(this,arguments)}if(S(r.process))return function(){return n.deprecate(e,s).apply(this,arguments)};if(t.noDeprecation===!0)return e;var i=!1;return l};var U,M={};n.debuglog=function(e){if(S(U)&&(U=t.env.NODE_DEBUG||""),e=e.toUpperCase(),!M[e])if(new RegExp("\\b"+e+"\\b","i").test(U)){var r=t.pid;M[e]=function(){var t=n.format.apply(n,arguments);console.error("%s %d: %s",e,r,t)}}else M[e]=function(){};return M[e]},n.inspect=s,s.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},s.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"},n.isArray=f,n.isBoolean=m,n.isNull=g,n.isNullOrUndefined=T,n.isNumber=_,n.isString=v,n.isSymbol=C,n.isUndefined=S,n.isRegExp=E,n.isObject=A,n.isDate=y,n.isError=R,n.isFunction=b,n.isPrimitive=I,n.isBuffer=e("./support/isBuffer");var P=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];n.log=function(){console.log("%s - %s",D(),n.format.apply(n,arguments))},n.inherits=e("inherits"),n._extend=function(e,t){if(!t||!A(t))return e;for(var n=Object.keys(t),r=n.length;r--;)e[n[r]]=t[n[r]];return e}}).call(this,e("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./support/isBuffer":31,_process:30,inherits:29}],33:[function(e,t,n){function r(){return"WebkitAppearance"in document.documentElement.style||window.console&&(console.firebug||console.exception&&console.table)||navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31}function s(){var e=arguments,t=this.useColors;if(e[0]=(t?"%c":"")+this.namespace+(t?" %c":" ")+e[0]+(t?"%c ":" ")+"+"+n.humanize(this.diff),!t)return e;var r="color: "+this.color;e=[e[0],r,"color: inherit"].concat(Array.prototype.slice.call(e,1));var s=0,l=0;return e[0].replace(/%[a-z%]/g,function(e){"%%"!==e&&(s++,"%c"===e&&(l=s))}),e.splice(l,0,r),e}function l(){return"object"==typeof console&&console.log&&Function.prototype.apply.call(console.log,console,arguments)}function i(e){try{null==e?n.storage.removeItem("debug"):n.storage.debug=e}catch(t){}}function o(){var e;try{e=n.storage.debug}catch(t){}return e}function u(){try{return window.localStorage}catch(e){}}n=t.exports=e("./debug"),n.log=l,n.formatArgs=s,n.save=i,n.load=o,n.useColors=r,n.storage="undefined"!=typeof chrome&&"undefined"!=typeof chrome.storage?chrome.storage.local:u(),n.colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"],n.formatters.j=function(e){return JSON.stringify(e)},n.enable(o())},{"./debug":34}],34:[function(e,t,n){function r(){return n.colors[c++%n.colors.length]}function s(e){function t(){}function s(){var e=s,t=+new Date,l=t-(a||t);e.diff=l,e.prev=a,e.curr=t,a=t,null==e.useColors&&(e.useColors=n.useColors()),null==e.color&&e.useColors&&(e.color=r());var i=Array.prototype.slice.call(arguments);i[0]=n.coerce(i[0]),"string"!=typeof i[0]&&(i=["%o"].concat(i));var o=0;i[0]=i[0].replace(/%([a-z%])/g,function(t,r){if("%%"===t)return t;o++;var s=n.formatters[r];if("function"==typeof s){var l=i[o];t=s.call(e,l),i.splice(o,1),o--}return t}),"function"==typeof n.formatArgs&&(i=n.formatArgs.apply(e,i));var u=s.log||n.log||console.log.bind(console);u.apply(e,i)}t.enabled=!1,s.enabled=!0;var l=n.enabled(e)?s:t;return l.namespace=e,l}function l(e){n.save(e);for(var t=(e||"").split(/[\s,]+/),r=t.length,s=0;r>s;s++)t[s]&&(e=t[s].replace(/\*/g,".*?"),"-"===e[0]?n.skips.push(new RegExp("^"+e.substr(1)+"$")):n.names.push(new RegExp("^"+e+"$")))}function i(){n.enable("")}function o(e){var t,r;for(t=0,r=n.skips.length;r>t;t++)if(n.skips[t].test(e))return!1;for(t=0,r=n.names.length;r>t;t++)if(n.names[t].test(e))return!0;return!1}function u(e){return e instanceof Error?e.stack||e.message:e}n=t.exports=s,n.coerce=u,n.disable=i,n.enable=l,n.enabled=o,n.humanize=e("ms"),n.names=[],n.skips=[],n.formatters={};var a,c=0},{ms:35}],35:[function(e,t,n){function r(e){if(e=""+e,!(e.length>1e4)){var t=/^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);if(t){var n=parseFloat(t[1]),r=(t[2]||"ms").toLowerCase();switch(r){case"years":case"year":case"yrs":case"yr":case"y":return n*h;case"days":case"day":case"d":return n*c;case"hours":case"hour":case"hrs":case"hr":case"h":return n*a;case"minutes":case"minute":case"mins":case"min":case"m":return n*u;case"seconds":case"second":case"secs":case"sec":case"s":return n*o;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return n}}}}function s(e){return e>=c?Math.round(e/c)+"d":e>=a?Math.round(e/a)+"h":e>=u?Math.round(e/u)+"m":e>=o?Math.round(e/o)+"s":e+"ms"}function l(e){return i(e,c,"day")||i(e,a,"hour")||i(e,u,"minute")||i(e,o,"second")||e+" ms"}function i(e,t,n){return t>e?void 0:1.5*t>e?Math.floor(e/t)+" "+n:Math.ceil(e/t)+" "+n+"s"}var o=1e3,u=60*o,a=60*u,c=24*a,h=365.25*c;t.exports=function(e,t){return t=t||{},"string"==typeof e?r(e):t["long"]?l(e):s(e)}},{}],36:[function(e,t,n){(function(n){"use strict";function r(e){function t(e){return function(){throw new Error("rtcninja: WebRTC not supported, missing "+e+" [browser: "+i.name+" "+i.version+"]")}}if(v&&i.chrome&&_>=32||i.android&&i.chrome&&_>=39||v&&i.opera&&_>=27||i.android&&i.opera&&_>=24||i.android&&i.webkit&&!i.chrome&&_>=37||l.webkitGetUserMedia&&s.webkitRTCPeerConnection)C=!0,a=l.webkitGetUserMedia.bind(l),c=s.webkitRTCPeerConnection,h=s.RTCSessionDescription,d=s.RTCIceCandidate,p=s.MediaStreamTrack,p&&p.getSources?f=p.getSources.bind(p):l.getMediaDevices&&(f=l.getMediaDevices.bind(l)),m=function(e,t){return e.src=URL.createObjectURL(t),e},g=!0,T=!1;else if(v&&i.firefox&&_>=22||i.android&&i.firefox&&_>=33||l.mozGetUserMedia&&s.mozRTCPeerConnection)C=!0,a=l.mozGetUserMedia.bind(l),c=s.mozRTCPeerConnection,h=s.mozRTCSessionDescription,d=s.mozRTCIceCandidate,p=s.MediaStreamTrack,m=function(e,t){return e.src=URL.createObjectURL(t),e},g=!1,T=!1;else if(e.plugin&&"function"==typeof e.plugin.isRequired&&e.plugin.isRequired()&&"function"==typeof e.plugin.isInstalled&&e.plugin.isInstalled()){var n=e.plugin["interface"];C=!0,a=n.getUserMedia,c=n.RTCPeerConnection,h=n.RTCSessionDescription,d=n.RTCIceCandidate,p=n.MediaStreamTrack,p&&p.getSources?f=p.getSources.bind(p):l.getMediaDevices&&(f=l.getMediaDevices.bind(l)),m=n.attachMediaStream,g=n.canRenegotiate,T=!0}else l.getUserMedia&&s.RTCPeerConnection&&(C=!0,a=l.getUserMedia.bind(l),c=s.RTCPeerConnection,h=s.RTCSessionDescription,d=s.RTCIceCandidate,p=s.MediaStreamTrack,p&&p.getSources?f=p.getSources.bind(p):l.getMediaDevices&&(f=l.getMediaDevices.bind(l)),m=s.attachMediaStream||function(e,t){return e.src=URL.createObjectURL(t),e},g=!0,T=!1);return r.hasWebRTC=function(){return C},a?r.getUserMedia=function(e,t,n){o("getUserMedia() | constraints: %o",e);try{a(e,function(e){o("getUserMedia() | success"),t&&t(e)},function(e){o("getUserMedia() | error:",e),n&&n(e)})}catch(r){u("getUserMedia() | error:",r),n&&n(r)}}:r.getUserMedia=function(e,n,r){u("getUserMedia() | WebRTC not supported"),r?r(new Error("rtcninja: WebRTC not supported, missing getUserMedia [browser: "+i.name+" "+i.version+"]")):t("getUserMedia")},r.RTCPeerConnection=c||t("RTCPeerConnection"),r.RTCSessionDescription=h||t("RTCSessionDescription"),r.RTCIceCandidate=d||t("RTCIceCandidate"),r.MediaStreamTrack=p||t("MediaStreamTrack"),r.getMediaDevices=f,r.attachMediaStream=m||t("attachMediaStream"),r.canRenegotiate=g,r.closeMediaStream=function(e){if(e)try{o("closeMediaStream() | calling stop() on all the MediaStreamTrack");var t,n,r;if(e.getTracks)for(t=e.getTracks(),n=0,r=t.length;r>n;n+=1)t[n].stop();else{for(t=e.getAudioTracks(),n=0,r=t.length;r>n;n+=1)t[n].stop();for(t=e.getVideoTracks(),n=0,r=t.length;r>n;n+=1)t[n].stop()}}catch(s){"function"!=typeof e.stop&&"object"!=typeof e.stop||(o("closeMediaStream() | calling stop() on the MediaStream"),e.stop())}},r.fixPeerConnectionConfig=function(e){var t,n,r,s,l;for(Array.isArray(e.iceServers)||(e.iceServers=[]),t=0,n=e.iceServers.length;n>t;t+=1)r=e.iceServers[t],s=r.hasOwnProperty("urls"),l=r.hasOwnProperty("url"),"object"==typeof r&&(s&&!l?r.url=Array.isArray(r.urls)?r.urls[0]:r.urls:!s&&l&&(r.urls=Array.isArray(r.url)?r.url.slice():r.url),l&&Array.isArray(r.url)&&(r.url=r.url[0]))},r.fixRTCOfferOptions=function(e){e=e||{},T?(e.hasOwnProperty("offerToReceiveAudio")&&(e.mandatory=e.mandatory||{},e.mandatory.OfferToReceiveAudio=!!e.offerToReceiveAudio),e.hasOwnProperty("offerToReceiveVideo")&&(e.mandatory=e.mandatory||{},e.mandatory.OfferToReceiveVideo=!!e.offerToReceiveVideo)):(e.mandatory&&e.mandatory.hasOwnProperty("OfferToReceiveAudio")&&(e.offerToReceiveAudio=e.mandatory.OfferToReceiveAudio?1:0),e.mandatory&&e.mandatory.hasOwnProperty("OfferToReceiveVideo")&&(e.offerToReceiveVideo=e.mandatory.OfferToReceiveVideo?1:0),delete e.mandatory)},r}t.exports=r;var s,l,i=e("bowser"),o=e("debug")("rtcninja:Adapter"),u=e("debug")("rtcninja:ERROR:Adapter"),a=null,c=null,h=null,d=null,p=null,f=null,m=null,g=!1,T=!1,_=Number(i.version)||0,v=!(i.mobile||i.tablet&&!(i.msie&&_>=10)),C=!1;u.log=console.warn.bind(console),s=n.window||n,l=s.navigator||{}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{bowser:40,debug:33}],37:[function(e,t,n){"use strict";function r(e,t){h("new | [pcConfig:%o, pcConstraints:%o]",e,t),s.call(this,e),this.pcConstraints=t,this.ourLocalDescription=null,this.ourSignalingState=null,this.ourIceConnectionState=null,this.ourIceGatheringState=null,this.timerGatheringTimeout=null,this.timerGatheringTimeoutAfterRelay=null,this.ignoreIceGathering=!1,this.closed=!1,o.call(this),a.call(this)}function s(e){this.pcConfig=c(!0,e),p.fixPeerConnectionConfig(this.pcConfig),this.options={iceTransportsRelay:"relay"===this.pcConfig.iceTransports,iceTransportsNone:"none"===this.pcConfig.iceTransports,gatheringTimeout:this.pcConfig.gatheringTimeout,gatheringTimeoutAfterRelay:this.pcConfig.gatheringTimeoutAfterRelay},delete this.pcConfig.gatheringTimeout,delete this.pcConfig.gatheringTimeoutAfterRelay,h("setConfigurationAndOptions | processed pcConfig: %o",this.pcConfig)}function l(){return this.closed||this.pc&&"closed"===this.pc.iceConnectionState}function i(){var e=this,t=this.pc;t.onnegotiationneeded=function(t){l.call(e)||(h("onnegotiationneeded()"),e.onnegotiationneeded&&e.onnegotiationneeded(t))},t.onicecandidate=function(t){var n,r,s;if(!l.call(e)&&!e.ignoreIceGathering&&!e.options.iceTransportsNone)if(n=t.candidate){if(r=f.REGEXP_RELAY_CANDIDATE.test(n.candidate),e.options.iceTransportsRelay&&!r)return;r&&!e.timerGatheringTimeoutAfterRelay&&"number"==typeof e.options.gatheringTimeoutAfterRelay&&(h("onicecandidate() | first relay candidate found, ending gathering in %d ms",e.options.gatheringTimeoutAfterRelay),
e.timerGatheringTimeoutAfterRelay=setTimeout(function(){l.call(e)||(h("forced end of candidates after timeout"),delete e.timerGatheringTimeoutAfterRelay,clearTimeout(e.timerGatheringTimeout),delete e.timerGatheringTimeout,e.ignoreIceGathering=!0,e.onicecandidate&&e.onicecandidate({candidate:null},null))},e.options.gatheringTimeoutAfterRelay)),s=new p.RTCIceCandidate({sdpMid:n.sdpMid,sdpMLineIndex:n.sdpMLineIndex,candidate:n.candidate}),null===m.normalizeCandidate&&(f.REGEXP_NORMALIZED_CANDIDATE.test(n.candidate)?m.normalizeCandidate=!1:(h('onicecandidate() | normalizing ICE candidates syntax (remove "a=" and "\\r\\n")'),m.normalizeCandidate=!0)),m.normalizeCandidate&&(s.candidate=n.candidate.replace(f.REGEXP_FIX_CANDIDATE,"")),h("onicecandidate() | m%d(%s) %s",s.sdpMLineIndex,s.sdpMid||"no mid",s.candidate),e.onicecandidate&&e.onicecandidate(t,s)}else h("onicecandidate() | end of candidates"),clearTimeout(e.timerGatheringTimeout),delete e.timerGatheringTimeout,clearTimeout(e.timerGatheringTimeoutAfterRelay),delete e.timerGatheringTimeoutAfterRelay,e.onicecandidate&&e.onicecandidate(t,null)},t.onaddstream=function(t){l.call(e)||(h("onaddstream() | stream: %o",t.stream),e.onaddstream&&e.onaddstream(t,t.stream))},t.onremovestream=function(t){l.call(e)||(h("onremovestream() | stream: %o",t.stream),e.onremovestream&&e.onremovestream(t,t.stream))},t.ondatachannel=function(t){l.call(e)||(h("ondatachannel() | datachannel: %o",t.channel),e.ondatachannel&&e.ondatachannel(t,t.channel))},t.onsignalingstatechange=function(n){t.signalingState!==e.ourSignalingState&&(h("onsignalingstatechange() | signalingState: %s",t.signalingState),e.ourSignalingState=t.signalingState,e.onsignalingstatechange&&e.onsignalingstatechange(n,t.signalingState))},t.oniceconnectionstatechange=function(n){t.iceConnectionState!==e.ourIceConnectionState&&(h("oniceconnectionstatechange() | iceConnectionState: %s",t.iceConnectionState),e.ourIceConnectionState=t.iceConnectionState,e.oniceconnectionstatechange&&e.oniceconnectionstatechange(n,t.iceConnectionState))},t.onicegatheringstatechange=function(n){l.call(e)||t.iceGatheringState!==e.ourIceGatheringState&&(h("onicegatheringstatechange() | iceGatheringState: %s",t.iceGatheringState),e.ourIceGatheringState=t.iceGatheringState,e.onicegatheringstatechange&&e.onicegatheringstatechange(n,t.iceGatheringState))},t.onidentityresult=function(t){l.call(e)||(h("onidentityresult()"),e.onidentityresult&&e.onidentityresult(t))},t.onpeeridentity=function(t){l.call(e)||(h("onpeeridentity()"),e.onpeeridentity&&e.onpeeridentity(t))},t.onidpassertionerror=function(t){l.call(e)||(h("onidpassertionerror()"),e.onidpassertionerror&&e.onidpassertionerror(t))},t.onidpvalidationerror=function(t){l.call(e)||(h("onidpvalidationerror()"),e.onidpvalidationerror&&e.onidpvalidationerror(t))}}function o(){this.pcConstraints?this.pc=new p.RTCPeerConnection(this.pcConfig,this.pcConstraints):this.pc=new p.RTCPeerConnection(this.pcConfig),i.call(this)}function u(){var e=this.pc,t=this.options,n=null;return e.localDescription?(t.iceTransportsRelay?n=e.localDescription.sdp.replace(f.REGEXP_SDP_NON_RELAY_CANDIDATES,""):t.iceTransportsNone&&(n=e.localDescription.sdp.replace(f.REGEXP_SDP_CANDIDATES,"")),this.ourLocalDescription=new p.RTCSessionDescription({type:e.localDescription.type,sdp:n||e.localDescription.sdp}),this.ourLocalDescription):(this.ourLocalDescription=null,null)}function a(){var e=this;Object.defineProperties(this,{peerConnection:{get:function(){return e.pc}},signalingState:{get:function(){return e.pc.signalingState}},iceConnectionState:{get:function(){return e.pc.iceConnectionState}},iceGatheringState:{get:function(){return e.pc.iceGatheringState}},localDescription:{get:function(){return u.call(e)}},remoteDescription:{get:function(){return e.pc.remoteDescription}},peerIdentity:{get:function(){return e.pc.peerIdentity}}})}t.exports=r;var c=e("merge"),h=e("debug")("rtcninja:RTCPeerConnection"),d=e("debug")("rtcninja:ERROR:RTCPeerConnection"),p=e("./Adapter"),f={REGEXP_NORMALIZED_CANDIDATE:new RegExp(/^candidate:/i),REGEXP_FIX_CANDIDATE:new RegExp(/(^a=|\r|\n)/gi),REGEXP_RELAY_CANDIDATE:new RegExp(/ relay /i),REGEXP_SDP_CANDIDATES:new RegExp(/^a=candidate:.*\r\n/gim),REGEXP_SDP_NON_RELAY_CANDIDATES:new RegExp(/^a=candidate:(.(?!relay ))*\r\n/gim)},m={normalizeCandidate:null};d.log=console.warn.bind(console),r.prototype.createOffer=function(e,t,n){h("createOffer()");var r=this;p.fixRTCOfferOptions(n),this.pc.createOffer(function(t){l.call(r)||(h("createOffer() | success"),e&&e(t))},function(e){l.call(r)||(d("createOffer() | error:",e),t&&t(e))},n)},r.prototype.createAnswer=function(e,t,n){h("createAnswer()");var r=this;this.pc.createAnswer(function(t){l.call(r)||(h("createAnswer() | success"),e&&e(t))},function(e){l.call(r)||(d("createAnswer() | error:",e),t&&t(e))},n)},r.prototype.setLocalDescription=function(e,t,n){function r(){"number"==typeof s.options.gatheringTimeout&&"complete"!==s.pc.iceGatheringState&&(h("setLocalDescription() | ending gathering in %d ms (gatheringTimeout option)",s.options.gatheringTimeout),s.timerGatheringTimeout=setTimeout(function(){l.call(s)||(h("forced end of candidates after gatheringTimeout timeout"),delete s.timerGatheringTimeout,clearTimeout(s.timerGatheringTimeoutAfterRelay),delete s.timerGatheringTimeoutAfterRelay,s.ignoreIceGathering=!0,s.onicecandidate&&s.onicecandidate({candidate:null},null))},s.options.gatheringTimeout))}h("setLocalDescription()");var s=this;this.pc.setLocalDescription(e,function(){l.call(s)||(h("setLocalDescription() | success"),clearTimeout(s.timerGatheringTimeout),delete s.timerGatheringTimeout,clearTimeout(s.timerGatheringTimeoutAfterRelay),delete s.timerGatheringTimeoutAfterRelay,r(),t&&t())},function(e){l.call(s)||(d("setLocalDescription() | error:",e),n&&n(e))}),this.ignoreIceGathering=!1},r.prototype.setRemoteDescription=function(e,t,n){h("setRemoteDescription()");var r=this;this.pc.setRemoteDescription(e,function(){l.call(r)||(h("setRemoteDescription() | success"),t&&t())},function(e){l.call(r)||(d("setRemoteDescription() | error:",e),n&&n(e))})},r.prototype.updateIce=function(e){h("updateIce() | pcConfig: %o",e),s.call(this,e),this.pc.updateIce(this.pcConfig),this.ignoreIceGathering=!1},r.prototype.addIceCandidate=function(e,t,n){h("addIceCandidate() | candidate: %o",e);var r=this;this.pc.addIceCandidate(e,function(){l.call(r)||(h("addIceCandidate() | success"),t&&t())},function(e){l.call(r)||(d("addIceCandidate() | error:",e),n&&n(e))})},r.prototype.getConfiguration=function(){return h("getConfiguration()"),this.pc.getConfiguration()},r.prototype.getLocalStreams=function(){return h("getLocalStreams()"),this.pc.getLocalStreams()},r.prototype.getRemoteStreams=function(){return h("getRemoteStreams()"),this.pc.getRemoteStreams()},r.prototype.getStreamById=function(e){return h("getStreamById() | streamId: %s",e),this.pc.getStreamById(e)},r.prototype.addStream=function(e){h("addStream() | stream: %s",e),this.pc.addStream(e)},r.prototype.removeStream=function(e){h("removeStream() | stream: %o",e),this.pc.removeStream(e)},r.prototype.close=function(){h("close()"),this.closed=!0,clearTimeout(this.timerGatheringTimeout),delete this.timerGatheringTimeout,clearTimeout(this.timerGatheringTimeoutAfterRelay),delete this.timerGatheringTimeoutAfterRelay,this.pc.close()},r.prototype.createDataChannel=function(){return h("createDataChannel()"),this.pc.createDataChannel.apply(this.pc,arguments)},r.prototype.createDTMFSender=function(e){return h("createDTMFSender()"),this.pc.createDTMFSender(e)},r.prototype.getStats=function(){return h("getStats()"),this.pc.getStats.apply(this.pc,arguments)},r.prototype.setIdentityProvider=function(){return h("setIdentityProvider()"),this.pc.setIdentityProvider.apply(this.pc,arguments)},r.prototype.getIdentityAssertion=function(){return h("getIdentityAssertion()"),this.pc.getIdentityAssertion()},r.prototype.reset=function(e){h("reset() | pcConfig: %o",e);var t=this.pc;t.onnegotiationneeded=null,t.onicecandidate=null,t.onaddstream=null,t.onremovestream=null,t.ondatachannel=null,t.onsignalingstatechange=null,t.oniceconnectionstatechange=null,t.onicegatheringstatechange=null,t.onidentityresult=null,t.onpeeridentity=null,t.onidpassertionerror=null,t.onidpvalidationerror=null,clearTimeout(this.timerGatheringTimeout),delete this.timerGatheringTimeout,clearTimeout(this.timerGatheringTimeoutAfterRelay),delete this.timerGatheringTimeoutAfterRelay,h("reset() | closing current peerConnection"),t.close(),s.call(this,e),o.call(this)}},{"./Adapter":36,debug:33,merge:41}],38:[function(e,t,n){"use strict";function r(e){var t=u(e||{});return c=!0,r.RTCPeerConnection=a,r.getUserMedia=t.getUserMedia,r.RTCSessionDescription=t.RTCSessionDescription,r.RTCIceCandidate=t.RTCIceCandidate,r.MediaStreamTrack=t.MediaStreamTrack,r.getMediaDevices=t.getMediaDevices,r.attachMediaStream=t.attachMediaStream,r.closeMediaStream=t.closeMediaStream,r.canRenegotiate=t.canRenegotiate,t.hasWebRTC()?(l("WebRTC supported"),!0):(i("WebRTC not supported"),!1)}t.exports=r;var s=e("bowser"),l=e("debug")("rtcninja"),i=e("debug")("rtcninja:ERROR"),o=e("./version"),u=e("./Adapter"),a=e("./RTCPeerConnection"),c=!1;i.log=console.warn.bind(console),l("version %s",o),l("detected browser: %s %s [mobile:%s, tablet:%s, android:%s, ios:%s]",s.name,s.version,!!s.mobile,!!s.tablet,!!s.android,!!s.ios),r.hasWebRTC=function(){return c||r(),u.hasWebRTC()},Object.defineProperty(r,"version",{get:function(){return o}}),Object.defineProperty(r,"called",{get:function(){return c}}),r.debug=e("debug"),r.browser=s},{"./Adapter":36,"./RTCPeerConnection":37,"./version":39,bowser:40,debug:33}],39:[function(e,t,n){"use strict";t.exports=e("../package.json").version},{"../package.json":42}],40:[function(t,n,r){!function(t,r){"undefined"!=typeof n&&n.exports?n.exports=r():"function"==typeof e&&e.amd?e(r):this[t]=r()}("bowser",function(){function e(e){function n(t){var n=e.match(t);return n&&n.length>1&&n[1]||""}function r(t){var n=e.match(t);return n&&n.length>1&&n[2]||""}var s,l=n(/(ipod|iphone|ipad)/i).toLowerCase(),i=/like android/i.test(e),o=!i&&/android/i.test(e),u=/nexus\s*[0-6]\s*/i.test(e),a=!u&&/nexus\s*[0-9]+/i.test(e),c=/CrOS/.test(e),h=/silk/i.test(e),d=/sailfish/i.test(e),p=/tizen/i.test(e),f=/(web|hpw)os/i.test(e),m=/windows phone/i.test(e),g=!m&&/windows/i.test(e),T=!l&&!h&&/macintosh/i.test(e),_=!o&&!d&&!p&&!f&&/linux/i.test(e),v=n(/edge\/(\d+(\.\d+)?)/i),C=n(/version\/(\d+(\.\d+)?)/i),S=/tablet/i.test(e),E=!S&&/[^-]mobi/i.test(e),A=/xbox/i.test(e);/opera|opr|opios/i.test(e)?s={name:"Opera",opera:t,version:C||n(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)}:/coast/i.test(e)?s={name:"Opera Coast",coast:t,version:C||n(/(?:coast)[\s\/](\d+(\.\d+)?)/i)}:/yabrowser/i.test(e)?s={name:"Yandex Browser",yandexbrowser:t,version:C||n(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)}:/ucbrowser/i.test(e)?s={name:"UC Browser",ucbrowser:t,version:n(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)}:/mxios/i.test(e)?s={name:"Maxthon",maxthon:t,version:n(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)}:/epiphany/i.test(e)?s={name:"Epiphany",epiphany:t,version:n(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)}:/puffin/i.test(e)?s={name:"Puffin",puffin:t,version:n(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)}:/sleipnir/i.test(e)?s={name:"Sleipnir",sleipnir:t,version:n(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)}:/k-meleon/i.test(e)?s={name:"K-Meleon",kMeleon:t,version:n(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)}:m?(s={name:"Windows Phone",windowsphone:t},v?(s.msedge=t,s.version=v):(s.msie=t,s.version=n(/iemobile\/(\d+(\.\d+)?)/i))):/msie|trident/i.test(e)?s={name:"Internet Explorer",msie:t,version:n(/(?:msie |rv:)(\d+(\.\d+)?)/i)}:c?s={name:"Chrome",chromeos:t,chromeBook:t,chrome:t,version:n(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)}:/chrome.+? edge/i.test(e)?s={name:"Microsoft Edge",msedge:t,version:v}:/vivaldi/i.test(e)?s={name:"Vivaldi",vivaldi:t,version:n(/vivaldi\/(\d+(\.\d+)?)/i)||C}:d?s={name:"Sailfish",sailfish:t,version:n(/sailfish\s?browser\/(\d+(\.\d+)?)/i)}:/seamonkey\//i.test(e)?s={name:"SeaMonkey",seamonkey:t,version:n(/seamonkey\/(\d+(\.\d+)?)/i)}:/firefox|iceweasel|fxios/i.test(e)?(s={name:"Firefox",firefox:t,version:n(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)},/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(e)&&(s.firefoxos=t)):h?s={name:"Amazon Silk",silk:t,version:n(/silk\/(\d+(\.\d+)?)/i)}:/phantom/i.test(e)?s={name:"PhantomJS",phantom:t,version:n(/phantomjs\/(\d+(\.\d+)?)/i)}:/slimerjs/i.test(e)?s={name:"SlimerJS",slimer:t,version:n(/slimerjs\/(\d+(\.\d+)?)/i)}:/blackberry|\bbb\d+/i.test(e)||/rim\stablet/i.test(e)?s={name:"BlackBerry",blackberry:t,version:C||n(/blackberry[\d]+\/(\d+(\.\d+)?)/i)}:f?(s={name:"WebOS",webos:t,version:C||n(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)},/touchpad\//i.test(e)&&(s.touchpad=t)):/bada/i.test(e)?s={name:"Bada",bada:t,version:n(/dolfin\/(\d+(\.\d+)?)/i)}:p?s={name:"Tizen",tizen:t,version:n(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i)||C}:/qupzilla/i.test(e)?s={name:"QupZilla",qupzilla:t,version:n(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i)||C}:/chromium/i.test(e)?s={name:"Chromium",chromium:t,version:n(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i)||C}:/chrome|crios|crmo/i.test(e)?s={name:"Chrome",chrome:t,version:n(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)}:o?s={name:"Android",version:C}:/safari|applewebkit/i.test(e)?(s={name:"Safari",safari:t},C&&(s.version=C)):l?(s={name:"iphone"==l?"iPhone":"ipad"==l?"iPad":"iPod"},C&&(s.version=C)):s=/googlebot/i.test(e)?{name:"Googlebot",googlebot:t,version:n(/googlebot\/(\d+(\.\d+))/i)||C}:{name:n(/^(.*)\/(.*) /),version:r(/^(.*)\/(.*) /)},!s.msedge&&/(apple)?webkit/i.test(e)?(/(apple)?webkit\/537\.36/i.test(e)?(s.name=s.name||"Blink",s.blink=t):(s.name=s.name||"Webkit",s.webkit=t),!s.version&&C&&(s.version=C)):!s.opera&&/gecko\//i.test(e)&&(s.name=s.name||"Gecko",s.gecko=t,s.version=s.version||n(/gecko\/(\d+(\.\d+)?)/i)),s.msedge||!o&&!s.silk?l?(s[l]=t,s.ios=t):T?s.mac=t:A?s.xbox=t:g?s.windows=t:_&&(s.linux=t):s.android=t;var y="";s.windowsphone?y=n(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i):l?(y=n(/os (\d+([_\s]\d+)*) like mac os x/i),y=y.replace(/[_\s]/g,".")):o?y=n(/android[ \/-](\d+(\.\d+)*)/i):s.webos?y=n(/(?:web|hpw)os\/(\d+(\.\d+)*)/i):s.blackberry?y=n(/rim\stablet\sos\s(\d+(\.\d+)*)/i):s.bada?y=n(/bada\/(\d+(\.\d+)*)/i):s.tizen&&(y=n(/tizen[\/\s](\d+(\.\d+)*)/i)),y&&(s.osversion=y);var R=y.split(".")[0];return S||a||"ipad"==l||o&&(3==R||R>=4&&!E)||s.silk?s.tablet=t:(E||"iphone"==l||"ipod"==l||o||u||s.blackberry||s.webos||s.bada)&&(s.mobile=t),s.msedge||s.msie&&s.version>=10||s.yandexbrowser&&s.version>=15||s.vivaldi&&s.version>=1||s.chrome&&s.version>=20||s.firefox&&s.version>=20||s.safari&&s.version>=6||s.opera&&s.version>=10||s.ios&&s.osversion&&s.osversion.split(".")[0]>=6||s.blackberry&&s.version>=10.1?s.a=t:s.msie&&s.version<10||s.chrome&&s.version<20||s.firefox&&s.version<20||s.safari&&s.version<6||s.opera&&s.version<10||s.ios&&s.osversion&&s.osversion.split(".")[0]<6?s.c=t:s.x=t,s}var t=!0,n=e("undefined"!=typeof navigator?navigator.userAgent:"");return n.test=function(e){for(var t=0;t<e.length;++t){var r=e[t];if("string"==typeof r&&r in n)return!0}return!1},n._detect=e,n})},{}],41:[function(e,t,n){!function(e){function n(e,t){if("object"!==s(e))return t;for(var r in t)"object"===s(e[r])&&"object"===s(t[r])?e[r]=n(e[r],t[r]):e[r]=t[r];return e}function r(e,t,r){var i=r[0],o=r.length;(e||"object"!==s(i))&&(i={});for(var u=0;o>u;++u){var a=r[u],c=s(a);if("object"===c)for(var h in a){var d=e?l.clone(a[h]):a[h];t?i[h]=n(i[h],d):i[h]=d}}return i}function s(e){return{}.toString.call(e).slice(8,-1).toLowerCase()}var l=function(e){return r(e===!0,!1,arguments)},i="merge";l.recursive=function(e){return r(e===!0,!0,arguments)},l.clone=function(e){var t,n,r=e,i=s(e);if("array"===i)for(r=[],n=e.length,t=0;n>t;++t)r[t]=l.clone(e[t]);else if("object"===i){r={};for(t in e)r[t]=l.clone(e[t])}return r},e?t.exports=l:window[i]=l}("object"==typeof t&&t&&"object"==typeof t.exports&&t.exports)},{}],42:[function(e,t,n){t.exports={name:"rtcninja",version:"0.6.7",description:"WebRTC API wrapper to deal with different browsers",author:{name:"Iñaki Baz Castillo",email:"inaki.baz@eface2face.com",url:"http://eface2face.com"},contributors:[{name:"Jesús Pérez",email:"jesus.perez@eface2face.com"}],license:"MIT",main:"lib/rtcninja.js",homepage:"https://github.com/eface2face/rtcninja.js",repository:{type:"git",url:"git+https://github.com/eface2face/rtcninja.js.git"},keywords:["webrtc"],engines:{node:">=0.10.32"},dependencies:{bowser:"^1.2.0",debug:"^2.2.0",merge:"^1.2.0"},devDependencies:{browserify:"^13.0.1",gulp:"git+https://github.com/gulpjs/gulp.git#4.0","gulp-expect-file":"0.0.7","gulp-filelog":"^0.4.1","gulp-header":"^1.8.2","gulp-jscs":"^3.0.2","gulp-jscs-stylish":"^1.4.0","gulp-jshint":"^2.0.1","gulp-rename":"^1.2.2","gulp-uglify":"^1.5.3","jshint-stylish":"^2.2.0","vinyl-source-stream":"^1.1.0"},readme:'# rtcninja.js <img src="http://www.pubnub.com/blog/wp-content/uploads/2014/01/google-webrtc-logo.png" height="30" width="30">\n\nWebRTC API wrapper to deal with different browsers transparently, [eventually](http://iswebrtcreadyyet.com/) this library shouldn\'t be needed. We only have to wait until W3C group in charge [finishes the specification](https://tools.ietf.org/wg/rtcweb/) and the different browsers implement it correctly :sweat_smile:.\n\n<img src="http://images4.fanpop.com/image/photos/21800000/browser-fight-google-chrome-21865454-600-531.jpg" height="250" width="250">\n\nSupported environments:\n* [Google Chrome](https://www.google.com/chrome/browser/desktop/index.html) (desktop & mobile)\n* [Google Canary](https://www.google.com/chrome/browser/canary.html) (desktop & mobile)\n* [Mozilla Firefox](https://www.mozilla.org/en-GB/firefox/new) (desktop & mobile)\n* [Firefox Nigthly](https://nightly.mozilla.org/) (desktop & mobile)\n* [Opera](http://www.opera.com/)\n* [Vivaldi](https://vivaldi.com/)\n* [CrossWalk](https://crosswalk-project.org/)\n* [Cordova](http://cordova.apache.org/): iOS support, you only have to use our plugin [following these steps](https://github.com/eface2face/cordova-plugin-iosrtc#usage).\n* [NW.js](https://github.com/nwjs/nw.js/)\n* [Electron](https://github.com/atom/electron)\n\n\n## Installation\n\n### **npm**:\n\n```bash\n$ npm install rtcninja\n```\n\nand then:\n\n```javascript\nvar rtcninja = require(\'rtcninja\');\n```\n\n### **bower**:\n\n```bash\n$ bower install rtcninja\n```\n\n\n## Browserified library\n\nTake a browserified version of the library from the `dist/` folder:\n\n* `dist/rtcninja.js`: The uncompressed version.\n* `dist/rtcninja.min.js`: The compressed production-ready version.\n\nThey expose the global `window.rtcninja` module.\n\n\n## Usage\n\nIn the [examples](./examples/) folder we provide a complete one.\n\n```javascript\n// Must first call it.\nrtcninja();\n\n// Then check.\nif (rtcninja.hasWebRTC()) {\n    // Do something.\n}\nelse {\n    // Do something.\n}\n```\n\n\n## Documentation\n\nYou can read the full [API documentation](docs/index.md) in the docs folder.\n\n\n## Issues\n\nhttps://github.com/eface2face/rtcninja.js/issues\n\n\n## Developer guide\n\n* Create a branch with a name including your user and a meaningful word about the fix/feature you\'re going to implement, ie: "jesusprubio/fixstuff"\n* Use [GitHub pull requests](https://help.github.com/articles/using-pull-requests).\n* Conventions:\n * We use [JSHint](http://jshint.com/) and [Crockford\'s Styleguide](http://javascript.crockford.com/code.html).\n * Please run `grunt lint` to be sure your code fits with them.\n\n\n### Debugging\n\nThe library includes the Node [debug](https://github.com/visionmedia/debug) module. In order to enable debugging:\n\nIn Node set the `DEBUG=rtcninja*` environment variable before running the application, or set it at the top of the script:\n\n```javascript\nprocess.env.DEBUG = \'rtcninja*\';\n```\n\nIn the browser run `rtcninja.debug.enable(\'rtcninja*\');` and reload the page. Note that the debugging settings are stored into the browser LocalStorage. To disable it run `rtcninja.debug.disable(\'rtcninja*\');`.\n\n\n## Copyright & License\n\n* eFace2Face Inc.\n* [MIT](./LICENSE)\n',readmeFilename:"README.md",gitHead:"d36b02d0503ca152771692935a4096130f28dc5d",bugs:{url:"https://github.com/eface2face/rtcninja.js/issues"},_id:"rtcninja@0.6.7",scripts:{},_shasum:"f7c8855f2c0e41ae08c638375bad1dc977369ec2",_from:"rtcninja@>=0.6.7 <0.7.0"}},{}],43:[function(e,t,n){var r=t.exports={v:[{name:"version",reg:/^(\d*)$/}],o:[{name:"origin",reg:/^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,names:["username","sessionId","sessionVersion","netType","ipVer","address"],format:"%s %s %d %s IP%d %s"}],s:[{name:"name"}],i:[{name:"description"}],u:[{name:"uri"}],e:[{name:"email"}],p:[{name:"phone"}],z:[{name:"timezones"}],r:[{name:"repeats"}],t:[{name:"timing",reg:/^(\d*) (\d*)/,names:["start","stop"],format:"%d %d"}],c:[{name:"connection",reg:/^IN IP(\d) (\S*)/,names:["version","ip"],format:"IN IP%d %s"}],b:[{push:"bandwidth",reg:/^(TIAS|AS|CT|RR|RS):(\d*)/,names:["type","limit"],format:"%s:%s"}],m:[{reg:/^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,names:["type","port","protocol","payloads"],format:"%s %d %s %s"}],a:[{push:"rtp",reg:/^rtpmap:(\d*) ([\w\-\.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,names:["payload","codec","rate","encoding"],format:function(e){return e.encoding?"rtpmap:%d %s/%s/%s":e.rate?"rtpmap:%d %s/%s":"rtpmap:%d %s"}},{push:"fmtp",reg:/^fmtp:(\d*) ([\S| ]*)/,names:["payload","config"],format:"fmtp:%d %s"},{name:"control",reg:/^control:(.*)/,format:"control:%s"},{name:"rtcp",reg:/^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,names:["port","netType","ipVer","address"],format:function(e){return null!=e.address?"rtcp:%d %s IP%d %s":"rtcp:%d"}},{push:"rtcpFbTrrInt",reg:/^rtcp-fb:(\*|\d*) trr-int (\d*)/,names:["payload","value"],format:"rtcp-fb:%d trr-int %d"},{push:"rtcpFb",reg:/^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,names:["payload","type","subtype"],format:function(e){return null!=e.subtype?"rtcp-fb:%s %s %s":"rtcp-fb:%s %s"}},{push:"ext",reg:/^extmap:([\w_\/]*) (\S*)(?: (\S*))?/,names:["value","uri","config"],format:function(e){return null!=e.config?"extmap:%s %s %s":"extmap:%s %s"}},{push:"crypto",reg:/^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,names:["id","suite","config","sessionConfig"],format:function(e){return null!=e.sessionConfig?"crypto:%d %s %s %s":"crypto:%d %s %s"}},{name:"setup",reg:/^setup:(\w*)/,format:"setup:%s"},{name:"mid",reg:/^mid:([^\s]*)/,format:"mid:%s"},{name:"msid",reg:/^msid:(.*)/,format:"msid:%s"},{name:"ptime",reg:/^ptime:(\d*)/,format:"ptime:%d"},{name:"maxptime",reg:/^maxptime:(\d*)/,format:"maxptime:%d"},{name:"direction",reg:/^(sendrecv|recvonly|sendonly|inactive)/},{name:"icelite",reg:/^(ice-lite)/},{name:"iceUfrag",reg:/^ice-ufrag:(\S*)/,format:"ice-ufrag:%s"},{name:"icePwd",reg:/^ice-pwd:(\S*)/,format:"ice-pwd:%s"},{name:"fingerprint",reg:/^fingerprint:(\S*) (\S*)/,names:["type","hash"],format:"fingerprint:%s %s"},{push:"candidates",reg:/^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?/,names:["foundation","component","transport","priority","ip","port","type","raddr","rport","tcptype","generation"],format:function(e){var t="candidate:%s %d %s %d %s %d typ %s";return t+=null!=e.raddr?" raddr %s rport %d":"%v%v",t+=null!=e.tcptype?" tcptype %s":"%v",null!=e.generation&&(t+=" generation %d"),t}},{name:"endOfCandidates",reg:/^(end-of-candidates)/},{name:"remoteCandidates",reg:/^remote-candidates:(.*)/,format:"remote-candidates:%s"},{name:"iceOptions",reg:/^ice-options:(\S*)/,format:"ice-options:%s"},{push:"ssrcs",reg:/^ssrc:(\d*) ([\w_]*):(.*)/,names:["id","attribute","value"],format:"ssrc:%d %s:%s"},{push:"ssrcGroups",reg:/^ssrc-group:(\w*) (.*)/,names:["semantics","ssrcs"],format:"ssrc-group:%s %s"},{name:"msidSemantic",reg:/^msid-semantic:\s?(\w*) (\S*)/,names:["semantic","token"],format:"msid-semantic: %s %s"},{push:"groups",reg:/^group:(\w*) (.*)/,names:["type","mids"],format:"group:%s %s"},{name:"rtcpMux",reg:/^(rtcp-mux)/},{name:"rtcpRsize",reg:/^(rtcp-rsize)/},{name:"sctpmap",reg:/^sctpmap:([\w_\/]*) (\S*)(?: (\S*))?/,names:["sctpmapNumber","app","maxMessageSize"],format:function(e){return null!=e.maxMessageSize?"sctpmap:%s %s %s":"sctpmap:%s %s"}},{push:"invalid",names:["value"]}]};Object.keys(r).forEach(function(e){var t=r[e];t.forEach(function(e){e.reg||(e.reg=/(.*)/),e.format||(e.format="%s")})})},{}],44:[function(e,t,n){var r=e("./parser"),s=e("./writer");n.write=s,n.parse=r.parse,n.parseFmtpConfig=r.parseFmtpConfig,n.parsePayloads=r.parsePayloads,n.parseRemoteCandidates=r.parseRemoteCandidates},{"./parser":45,"./writer":46}],45:[function(e,t,n){var r=function(e){return String(Number(e))===e?Number(e):e},s=function(e,t,n,s){if(s&&!n)t[s]=r(e[1]);else for(var l=0;l<n.length;l+=1)null!=e[l+1]&&(t[n[l]]=r(e[l+1]))},l=function(e,t,n){var r=e.name&&e.names;e.push&&!t[e.push]?t[e.push]=[]:r&&!t[e.name]&&(t[e.name]={});var l=e.push?{}:r?t[e.name]:t;s(n.match(e.reg),l,e.names,e.name),e.push&&t[e.push].push(l)},i=e("./grammar"),o=RegExp.prototype.test.bind(/^([a-z])=(.*)/);n.parse=function(e){var t={},n=[],r=t;return e.split(/(\r\n|\r|\n)/).filter(o).forEach(function(e){var t=e[0],s=e.slice(2);"m"===t&&(n.push({rtp:[],fmtp:[]}),r=n[n.length-1]);for(var o=0;o<(i[t]||[]).length;o+=1){var u=i[t][o];if(u.reg.test(s))return l(u,r,s)}}),t.media=n,t};var u=function(e,t){var n=t.split(/=(.+)/,2);return 2===n.length&&(e[n[0]]=r(n[1])),e};n.parseFmtpConfig=function(e){return e.split(/\;\s?/).reduce(u,{})},n.parsePayloads=function(e){return e.split(" ").map(Number)},n.parseRemoteCandidates=function(e){for(var t=[],n=e.split(" ").map(r),s=0;s<n.length;s+=3)t.push({component:n[s],ip:n[s+1],port:n[s+2]});return t}},{"./grammar":43}],46:[function(e,t,n){var r=e("./grammar"),s=/%[sdv%]/g,l=function(e){var t=1,n=arguments,r=n.length;return e.replace(s,function(e){if(t>=r)return e;var s=n[t];switch(t+=1,e){case"%%":return"%";case"%s":return String(s);case"%d":return Number(s);case"%v":return""}})},i=function(e,t,n){var r=t.format instanceof Function?t.format(t.push?n:n[t.name]):t.format,s=[e+"="+r];if(t.names)for(var i=0;i<t.names.length;i+=1){var o=t.names[i];t.name?s.push(n[t.name][o]):s.push(n[t.names[i]])}else s.push(n[t.name]);return l.apply(null,s)},o=["v","o","s","i","u","e","p","c","b","t","r","z","a"],u=["i","c","b","a"];t.exports=function(e,t){t=t||{},null==e.version&&(e.version=0),null==e.name&&(e.name=" "),e.media.forEach(function(e){null==e.payloads&&(e.payloads="")});var n=t.outerOrder||o,s=t.innerOrder||u,l=[];return n.forEach(function(t){r[t].forEach(function(n){n.name in e&&null!=e[n.name]?l.push(i(t,n,e)):n.push in e&&null!=e[n.push]&&e[n.push].forEach(function(e){l.push(i(t,n,e))})})}),e.media.forEach(function(e){l.push(i("m",r.m[0],e)),s.forEach(function(t){r[t].forEach(function(n){n.name in e&&null!=e[n.name]?l.push(i(t,n,e)):n.push in e&&null!=e[n.push]&&e[n.push].forEach(function(e){l.push(i(t,n,e))})})})}),l.join("\r\n")+"\r\n"}},{"./grammar":43}],47:[function(e,t,n){t.exports={name:"jssip",title:"JsSIP",description:"the Javascript SIP library",version:"2.0.1",homepage:"http://jssip.net",author:"José Luis Millán <jmillan@aliax.net> (https://github.com/jmillan)",contributors:["Iñaki Baz Castillo <ibc@aliax.net> (https://github.com/ibc)","Saúl Ibarra Corretgé <saghul@gmail.com> (https://github.com/saghul)"],main:"lib/JsSIP.js",keywords:["sip","websocket","webrtc","node","browser","library"],license:"MIT",repository:{type:"git",url:"https://github.com/versatica/JsSIP.git"},bugs:{url:"https://github.com/versatica/JsSIP/issues"},dependencies:{debug:"^2.2.0",rtcninja:"^0.6.7","sdp-transform":"^1.6.2"},devDependencies:{browserify:"^13.0.1",gulp:"git+https://github.com/gulpjs/gulp.git#4.0","gulp-expect-file":"0.0.7","gulp-header":"^1.8.2","gulp-jshint":"^2.0.1","gulp-nodeunit-runner":"^0.2.2","gulp-rename":"^1.2.2","gulp-uglify":"^1.5.3","gulp-util":"^3.0.7",jshint:"^2.9.2","jshint-stylish":"^2.2.0",pegjs:"0.7.0","vinyl-buffer":"^1.0.0","vinyl-source-stream":"^1.1.0"},scripts:{test:"gulp test"}}},{}]},{},[7])(7)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],111:[function(require,module,exports){
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

module.exports = {
	template: _template,
	forEach: _forEach,
	assign: _assign,
	merge: _merge,
	isEqual: _isEqual,
	trim: _trim,
	throttle: _throttle,
	debounce: debounce
};
},{"lodash/collection/forEach":12,"lodash/function/debounce":14,"lodash/function/throttle":16,"lodash/lang/isEqual":64,"lodash/object/assign":72,"lodash/object/merge":75,"lodash/string/template":77,"lodash/string/trim":79}],112:[function(require,module,exports){
var widget = require('./widget.js');
var api = require('./core.js');

module.exports = widget.module;

},{"./core.js":109,"./widget.js":116}],113:[function(require,module,exports){
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
				// body = JSON.parse({result: 'OK'});
				body = "{result: 'OK'}";
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

},{"http":99,"url":104}],114:[function(require,module,exports){
(function (global){
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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],115:[function(require,module,exports){
var events = {},
JsSIP = require('./jssip.min.js'),
// JsSIP = global.JsSIP,
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
	sipClient.on('connected', function(e){ console.log('sip connected event: ', e); });
	sipClient.on('disconnected', function(e){ console.log('sip disconnected event: ', e); });
	sipClient.on('newMessage', function(e){ console.log('sip newMessage event: ', e); });
	sipClient.on('newRTCSession', function(e){
		console.log('sip newRTCSession event: ', e);
		events.emit('webrtc/newRTCSession', e);
		// if(e.session.direction === 'outgoing')
		// 	events.emit('webrtc/outgoingCall', e);
		// else
		// 	events.emit('webrtc/incomingCall', e);
		
			sipSession = e.session;
	});
	sipClient.on('registered', function(e){ console.log('sip registered event: ', e); });
	sipClient.on('unregistered', function(e){ console.log('sip unregistered event: ', e); });
	sipClient.on('registrationFailed', function(e){ console.log('sip registrationFailed event: ', e); });

	sipCallEvents = {
		progress: function(e){
			console.log('call progress event: ', e);
			events.emit('webrtc/progress', e);
		},
		failed: function(e){
			console.log('call failed event:', e);
			events.emit('webrtc/failed', e);
		},
		ended: function(e){
			console.log('call ended event: ', e);
			events.emit('webrtc/ended', e);
		},
		confirmed: function(e){
			console.log('call confirmed event: ', e);
			events.emit('webrtc/confirmed', e);
		},
		addstream: function(e){
			console.log('call addstream event: ', e);
			events.emit('webrtc/addstream', e);
			var stream = e.stream;
			options.audioRemote = JsSIP.rtcninja.attachMediaStream(options.audioRemote, stream);
		}
		// sdp: function(e){
		// 	console.log('sdp: ', e);
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
	console.log('answer: ',sipClient);
	sipSession.answer();
}

function hold(){
	console.log('hold: ', sipSession.isOnHold());
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
	console.log('Initiating WebRTC module:', opts);
	options = opts;

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
},{"./jssip.min.js":110}],116:[function(require,module,exports){
(function (global){
var domify = require('domify');
var api = require('./core');
var request = require('./request');
var _ = require('./lodash');
var frases = require('../translations.json');
var cobrowsing = require('./cobrowsing');
var WebRTC = require('./webrtc');
var serverUrl = {};
var forms;

// Widget initiation options
var defaults = {
	// prefix for CSS classes and ids. 
	// Change it only if the default prefix 
	// matches with existed classes or ids on the website
	prefix: 'swc',
	// whether or not to ask user 
	// to introduce him self before the chat session
	intro: false,
	// whether or not to add widget to the webpage
	widget: true,
	title: '',
	lang: 'en',
	langFromUrl: false,
	position: 'right',
	hideOfflineButton: false,
	offer: false,
	styles: {
		primary: {
			backgroundColor: '#555555',
			color: '#FFFFFF'
		},
		intro: {
			backgroundImage: "images/bgr-02.jpg"
		},
		sendmail: {
			backgroundImage: "images/bgr-01.jpg"
		},
		closeChat: {
			backgroundImage: "images/bgr-02.jpg"
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
		color: '#777'
	},
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable,location,toolbar',
	// absolute path to the wchat folder
	path: '/ipcc/webchat/',
	// in seconds
	checkStatusTimeout: 30,
	// in seconds
	getMessagesTimeout: 1,
	// displayed in the email template
	host: window.location.host,
	// webrtc options
	webrtc: {
		sip: {},
		hotline: ''
	},
},

// Current widget state
widgetState = {
	initiated: false,
	active: false,
	state: '', // "online" | "offline" | "timeout",
	share: false
},
dialog = [],

// available dialog languages
langs = [],
currLang = '',
messagesTimeout,
chatTimeout,
// Container for messages
messagesCont,
// Widget dom element
widget,

// Widget in a separate window
widgetWindow,
// Widget panes elements
panes,
agentIsTypingTimeout,
userIsTypingTimeout,
timerUpdateInterval;

function Widget(options){

	_.merge(defaults, options || {});
	// _.assign(defaults, options || {});

	serverUrl = require('url').parse(defaults.server, true);

	api = new api(options)
	.on('session/create', onSessionSuccess)
	.on('session/continue', onSessionSuccess)
	.on('session/join', onSessionJoin);
	// .on('chat/languages', onNewLanguages);
	
	if(defaults.widget) {
		api.on('chat/start', startChat)
		.on('chat/close', onChatClose)
		.on('chat/timeout', onChatTimeout)
		.on('message/new', newMessage)
		.on('message/typing', onAgentTyping)
		.on('form/submit', onFormSubmit)
		.on('form/reject', closeForm)
		.on('widget/load', onWidgetLoad);
		// .on('widget/init', onWidgetInit);
		// .on('widget/statechange', changeWgState);
	}

	if(defaults.webrtc.sip.ws_servers !== undefined && WebRTC.isSupported()) {

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

		initWebrtcModule({
			sip: defaults.webrtc.sip,
			emit: publicApi.emit,
			on: publicApi.on
		});
	}
		
	setSessionTimeoutHandler();
	addWidgetStyles();

	// load forms
	request.get('forms_json', defaults.server+defaults.path+'forms.json', function (err, result){
		if(err) return api.emit('Error', err);
		forms = JSON.parse(result).forms;
	});

	request.get('forms_tmp', defaults.server+defaults.path+'partials/forms.html', function (err, template){
		if(err) return api.emit('Error', err);
	});

	return publicApi;
}

var publicApi = {

	initModule: initModule,
	initWidgetState: initWidgetState,
	openWidget: openWidget,
	initChat: initChat,
	getWidgetElement: getWidgetElement,
	isWebrtcSupported: WebRTC.isSupported,
	getEntity: function(){ return api.getState('entity', 'session'); },
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

function initModule(){
	api.initModule();
	return publicApi;
}

function initWebrtcModule(opts){
	console.log('initWebrtcModule: ', opts);
	WebRTC.init(opts);
}

// Session is either created or continues
function onSessionSuccess(){
	// console.log('Session success!');

	// set current user language
	currLang = detectLanguage();
	setSessionTimeoutHandler();

	// If page loaded and "widget" property is set - load widget
	if(defaults.widget && !widgetState.initiated && isBrowserSupported()) {
		loadWidget();
	}

	// If timeout was occured, init chat after a session is created
	if(hasWgState('timeout')) {
		removeWgState('timeout');
		getLanguages();
	}

	// if window is not a opened window
	if(!defaults.external) {
		api.updateUrl(window.location.href);

		initCobrowsingModule({
			url: window.location.href,
			entity: api.getState('entity', 'session'),
			widget: '#'+defaults.prefix+'-wg-cont'
		});
	}
		
}

// send shared event to the user's browser
function onSessionJoin(params){
	// console.log('onSessionJoin: ', params);
	initCobrowsingModule({ url: params.url, entity: api.getState('entity', 'session') });
}

function loadWidget(cb){
	// console.log('load widget!');
	var compiled;
	request.get('widget_tmp', defaults.server+defaults.path+'widget.html', function (err, body){
		if(err) return;
		compiled = compileTemplate(body, {
			defaults: defaults,
			languages: langs,
			translations: frases,
			currLang: currLang || defaults.lang,
			// frases: frases[currLang] || defaults.lang,
			credentials: api.getState('credentials', 'session') || {},
			_: _
		});

		// Widget variable assignment
		widget = domify(compiled);
		// document.body.insertBefore(widget, document.body.firstChild);
		document.body.appendChild(widget);
		api.emit('widget/load', widget);

	});
}

function onWidgetLoad(widget){
	// console.log('widget loaded!');
	api.once('chat/languages', initWidget);
	getLanguages();
	// initWidget();
}

function initCobrowsingModule(params){
	// init cobrowsing module only on main window
	if(defaults.external) return;

	api.on('cobrowsing/init', function(){
		if(api.getState('shared', 'session') || params.entity === 'agent') cobrowsing.share();
		// cobrowsing.emitEvents();
	});
	api.on('cobrowsing/event', function(params){
		api.updateEvents(params.events, function(err, result){
			if(err) return;
			cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/shared', function(){
		if(!api.getState('shared', 'session') && params.entity === 'user') {
			api.saveState('shared', true, 'session');
			api.switchShareState(true, params.url);
		}
		api.updateEvents([{ entity: params.entity, url: params.url, shared: true }], function(err, result){
			// if(err) return;
			result.historyEvents = true;
			// console.log('cobrowsing update: ', result);
			cobrowsing.updateEvents(result);
		});
	});

	api.on('cobrowsing/unshared', function(params){
		api.saveState('shared', false, 'session');
		api.updateEvents([{ entity: params.entity, url: params.url, shared: false }], function(err, resul){
			// if(err) return;
			if(params.entity === 'user') api.switchShareState(false, window.location.href);
			else cobrowsing.unshareAll();
		});
	});
	
	cobrowsing.init({ widget: params.widget, entity: params.entity, emit: publicApi.emit, path: (defaults.server+defaults.path) });
}

function getWidgetElement(){
	return widget;
}

function getLanguages(){
	api.getLanguages(function (err, body){
		if(err) return;
		if(body) onNewLanguages(body.result);
		setTimeout(getLanguages, defaults.checkStatusTimeout*1000);
	});
}

function onNewLanguages(languages){
	// console.log('languages: ', languages);
	var state = languages.length ? 'online' : 'offline',
	options = '', selected;

	// if(hasWgState(state)) return;
	if(widgetState.state === state) return;
	
	langs = languages;

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

	changeWgState({ state: state });
	api.emit('chat/languages', languages);
}

function initWidget(){
	// console.log('Init widget!');
	widgetState.initiated = true;

	setListeners(widget);
	changeWgState({ state: widgetState.state });

	if(defaults.hideOfflineButton) {
		addWgState('no-button');
	}

	if(defaults.offer) {
		setOffer();
	}

	// if chat started
	if(api.getState('chat') === true) {
		requestChat(api.getState('credentials', 'session') || {});
		showWidget();
		// initChat();
	}

	// if webrtc supported by the browser and ws_servers parameter is set - change button icon
	if(WebRTC && WebRTC.isSupported() && defaults.webrtc.sip.ws_servers) {
		addWgState('webrtc-enabled');
	}

	// Widget is initiated
	api.emit('widget/init');
}

function setOffer() {
	setTimeout(function() {
		showOffer({
			from: defaults.offer.from || frases[currLang].default_title,
			time: Date.now(),
			text: defaults.offer.text || frases[currLang].default_offer
		});
	}, defaults.offer.inSeconds ? defaults.offer.inSeconds*1000 : 30000);
}

function showOffer(message) {
	// Return if user already interact with the widget
	if(widgetState.state !== 'online' || api.getState('interacted', 'session')) return;
	newMessage({ messages: [message] });
}

function initChat(){
	showWidget();

	// // if chat already started and widget was minimized - just show the widget
	if(api.getState('chat', 'cache')) return;

	if(!langs.length) {
		switchPane('sendemail');
	} else if(defaults.intro.length) {
		if(api.getState('chat')) {
			requestChat(api.getState('credentials', 'session'));
		} else {
			switchPane('credentials');
		}
	} else {
		requestChat({ lang: currLang });
	}
}

function requestChat(credentials){
	if(!credentials.uname) credentials.uname = api.getState('sid').split('_')[0];
	
	// Save user language based on preferable dialog language
	if(credentials.lang && credentials.lang !== currLang ) {
		api.saveState('lang', credentials.lang);
	}
	if(!credentials.lang) {
		credentials.lang = currLang;
	}
	
	// Save credentials for current session
	// It will be removed on session timeout
	api.saveState('credentials', credentials, 'session');

	api.chatRequest(credentials);
}

function startChat(params){
	switchPane('messages');
	api.saveState('chat', true);
	if(params.timeout) {
		// console.log('chat timeout: ', params.timeout);
		chatTimeout = api.setChatTimeout(params.timeout);
	}
	getMessages();
	addWgState('chat');
}

function getMessages(){
	// console.log('get messages!');
	api.getMessages(function() {
		if(api.getState('chat')) {
			messagesTimeout = setTimeout(getMessages, defaults.getMessagesTimeout*1000);
		}
	});
}

function sendMessage(message){
	api.sendMessage(message);
	if(chatTimeout) clearTimeout(chatTimeout);
}

function newMessage(result){
	// console.log('new messages arrived!', result);

	var str,
		els = [],
		text,
		compiled,
		defaultUname = false,
		credentials = api.getState('credentials', 'session') || {},
		aname = api.getState('aname', 'session'),
		uname = credentials.uname ? credentials.uname : '';

	if(uname === api.getState('sid').split('_')[0]) {
		defaultUname = true;
	}

	result.messages.forEach(function(message, index) {
		
		message.entity = message.from === uname ? 'user' : 'agent';
		message.from = (message.entity === 'user' && defaultUname) ? frases[currLang].default_user_name : message.from;
		message.time = message.time ? parseTime(message.time) : parseTime(Date.now());

		text = parseMessage(message.text, message.file, message.entity);

		if(text.type === 'form') {
			request.get('forms_tmp', defaults.server+defaults.path+'partials/forms.html', function (err, template){
				if(err) return cb(err);

				compiled = compileTemplate(template, {
					defaults: defaults,
					message: message,
					form: text.content,
					credentials: credentials,
					frases: frases[(currLang || defaults.lang)],
					_: _
				});
				if(global[text.content.name]) closeForm(text.content.name);
				messagesCont.insertAdjacentHTML('beforeend', '<li>'+compiled+'</li>');
				messagesCont.scrollTop = messagesCont.scrollHeight;
			});
		} else {
			message.text = text.content;
			compiled = compileTemplate(messageTemplate(), message);
			messagesCont.insertAdjacentHTML('beforeend', '<li>'+compiled+'</li>');

			if(index === result.messages.length-1) {
				onLastMessage(compiled);
			}

			// Need for sending dialog to email
			dialog.push(compiled);
		}

		// Save agent name
		if(message.entity === 'agent' && aname !== message.from) {
			api.saveState('aname', message.from, 'session');
		}

	});

	messagesCont.scrollTop = messagesCont.scrollHeight;
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

		PrefixedEvent(lastMsg, 'animationend', ["webkit", "moz", "MS", "o", ""], function(e) {
			btn.children[0].style.height = e.target.scrollHeight + 'px';
		});

		lastMsg.innerHTML = message;
		// changeWgState({ state: 'notified' });
		addWgState('notified');
		setButtonStyle('notified');
	}
}

function compileEmail(content, cb) {
	var compiled;
	request.get('email_tmp', defaults.server+defaults.path+'partials/email.html', function (err, body){
		if(err) return cb(err);

		compiled = compileTemplate(body, {
			defaults: defaults,
			content: content,
			frases: frases[(currLang || defaults.lang)],
			_: _
		});

		if(cb) return cb(null, compiled);
	});
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
	var complain = compileTemplate(messageTemplate(), {
		from: frases[currLang].email_subjects.complain+' '+params.email,
		text: params.text,
		entity: '',
		time: ''
	});

	body = body.concat(
		complain,
		'<br><p class="h1">'+frases[currLang].email_subjects.dialog+' '+defaults.host+'</p><br>',
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
	var msg = compileTemplate(messageTemplate(), {
		from: frases[currLang].email_subjects.request+' '+params.uname+' ('+params.email+')',
		text: params.text,
		entity: '',
		time: ''
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
		alert(frases[currLang].required_error.email);
		return;
	}

	data.subject = frases[currLang].email_subjects.request+' '+data.email;

	if(data.file) {
		file = getFileContent(form.file, function(err, result) {
			if(!err) {
				data.filename = result.filename;
				data.filedata = result.filedata;
			} else {
				console.warn('File was not sent');
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
			alert(frases[currLang].required_error.email);
			return;
		}
		// console.log('send dialog');
		sendDialog({
			to: data.email,
			subject: frases[currLang].email_subjects.dialog+' '+defaults.host,
			text: dialog // global variable
		});
	}
	if(data && data.text) {
		if(!data.email) {
			alert(frases[currLang].required_error.email);
			return;
		} else {
			// console.log('send complain!');
			sendComplain({
				email: data.email,
				subject: frases[currLang].email_subjects.complain+' '+data.email,
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
	api.saveState('chat', false);
	api.closeChat(rating);
	removeWgState('chat');
}

function onChatClose(){
	if(api.getState('shared', 'session')) cobrowsing.unshare();
}

function onChatTimeout(){
	// console.log('chat timeout!');
	switchPane('closechat');
	closeChat();
}

function onAgentTyping(opts){
	// console.log('Agent is typing!');
	if(!agentIsTypingTimeout) {
		addWgState('agent-typing');
	}
	clearTimeout(agentIsTypingTimeout);
	agentIsTypingTimeout = setTimeout(function() {
		agentIsTypingTimeout = null;
		removeWgState('agent-typing');
		// console.log('agent is not typing anymore!');
	}, 5000);
}

function setSessionTimeoutHandler(){
	if(api.listenerCount('session/timeout') >= 1) return;
	api.once('session/timeout', function (params){
		// console.log('Session timeout!', params);

		if(api.getState('chat') === true) {
			closeChat();
		}
		if(widget) {
			// addWgState('timeout');
			closeWidget();
		}
		changeWgState({ state: 'timeout' });
		// widgetState.state = 'timeout';
		// addWgState('timeout');
		setButtonStyle('timeout');
		api.removeState('sid');

		if(params && params.method === 'updateEvents') {
			initModule();
		}
	});
}

function initCall(){
	switchPane('callAgent');
	WebRTC.audiocall('sip:'+defaults.webrtc.hotline+'@'+serverUrl.host);
}

function initCallState(state){
	console.log('initCallState: ', state);

	var spinner = document.getElementById(defaults.prefix+'-call-spinner'),
		info = document.getElementById(defaults.prefix+'-call-info'),
		textState = document.getElementById(defaults.prefix+'-call-state'),
		timer = document.getElementById(defaults.prefix+'-call-timer'),
		tryAgain = document.getElementById(defaults.prefix+'-tryagain-btn');

	if(state === 'newRTCSession') {
		initCallState('oncall');

	} else if(state === 'confirmed') {
		textState.innerText = frases[currLang].call_pane.calling_agent;
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.add(defaults.prefix+'-hidden');

	} else if(state === 'ringing') {
		setTimer(timer, 'init', 0);
		timer.classList.remove(defaults.prefix+'-hidden');
	} else if(state === 'connected') {
		textState.innerText = frases[currLang].call_pane.connected_with_agent;
		setTimer(timer, 'start', 0);

	} else if(state === 'ended') {
		textState.innerText = frases[currLang].call_pane.call_ended;
		setTimer(timer, 'stop');
		initCallState('oncallend');
		
	} else if(state === 'failed' || state === 'canceled') {
		if(state === 'failed') {
			textState.innerText = frases[currLang].call_pane.call_failed;
		} else {
			textState.innerText = frases[currLang].call_pane.call_canceled;
		}
		info.classList.remove(defaults.prefix+'-hidden');
		spinner.classList.add(defaults.prefix+'-hidden');
		timer.classList.add(defaults.prefix+'-hidden');
		tryAgain.classList.remove(defaults.prefix+'-hidden');
		initCallState('oncallend');

	} else if(state === 'oncall') {
		window.onbeforeunload = function(){
			return 'Your connection is in progress. Do you realy want to close it?';
		};
		api.saveState('call', true, 'cache');
		addWgState('webrtc-call');

	} else if(state === 'oncallend') {
		window.onbeforeunload = null;
		api.saveState('call', false, 'cache');
		removeWgState('webrtc-call');

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
	console.log('endCall: ', WebRTC.isEstablished(), WebRTC.isInProgress(), WebRTC.isEnded());
	if(WebRTC.isEstablished() || WebRTC.isInProgress()) {
		WebRTC.terminate();
	} else {
		closeWidget();
		initCallState('init');
	}
}

/**
 * Open web chat widget in a new window
 */
function openWidget(){
	// console.log('open widget!');
	var url = defaults.server+defaults.path+'window.html',
		optsEncoded = '';
	
	if(!widgetWindow || widgetWindow.closed) {

		widgetWindow = window.open('', 'wchat', defaults.widgetWindowOptions);
		widgetWindow.sessionStorage.setItem('wchat_options', JSON.stringify(defaults));

		constructWindow(widgetWindow);
		
		widgetWindow.onbeforeunload = function(){
			//close chat if user close the widget window
			//without ending a dialog
			if(api.getState('chat', 'storage')) closeChat();
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
	title;

	viewport = document.createElement('meta');
	viewport.name = 'viewport';
	viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';

	charset = document.createElement('meta');
	charset.setAttribute('charset', 'utf-8');

	title = document.createElement('title');
	title.textContent = frases[currLang].default_title;

	loader = document.createElement('script');
	loader.src = defaults.server+defaults.path+'loader.js';

	script = document.createElement('script');
	script.src = defaults.server+defaults.path+'wchat.min.js';
	script.charset = 'UTF-8';

	link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = defaults.server+defaults.path+'main.css';

	windowObject.document.body.id = 'swc-wg-window';
	windowObject.document.body.style = 'margin:0;';
	windowObject.document.head.appendChild(viewport);
	windowObject.document.head.appendChild(charset);
	windowObject.document.head.appendChild(title);
	windowObject.document.head.appendChild(link);
	windowObject.document.head.appendChild(script);
	windowObject.document.body.appendChild(loader);
}

/**
 * Set Widget event listeners
 * @param {DOMElement} widget - Widget HTML element
 */
function setListeners(widget){
	// var sendMsgBtn = document.getElementById(defaults.prefix+'-send-message'),
	var fileSelect = document.getElementById(defaults.prefix+'-file-select'),
		textField = document.getElementById(defaults.prefix+'-message-text');

	btn = document.getElementById(defaults.prefix+'-btn-cont');
	panes = [].slice.call(widget.querySelectorAll('.'+defaults.prefix+'-wg-pane'));
	messagesCont = document.getElementById(defaults.prefix+'-messages-cont');

	addEvent(btn, 'click', btnClickHandler);
	addEvent(widget, 'click', wgClickHandler);
	addEvent(widget, 'submit', wgSubmitHandler);
	// addEvent(sendMsgBtn, 'click', wgSendMessage);
	addEvent(fileSelect, 'change', wgSendFile);
	addEvent(textField, 'keypress', wgTypingHandler);
}

/********************************
 * Widget event handlers *
 ********************************/

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
		if(api.getState('chat')) switchPane('closechat');
		else closeWidget();
	} else if(handler === 'sendMessage') {
		wgSendMessage();
	} else if(handler === 'openWindow') {
		openWidget();
	} else if(handler === 'rejectForm') {
		api.emit('form/reject', targ.parentNode.name);
	} else if(handler === 'initCall') {
		initCall();
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

	// If element is interacted, then no notifications of a new message 
	// will occur during current browser session
	if(!api.getState('interacted', 'session')) {
		api.saveState('interacted', true, 'session');
	}

	// remove notification of a new message
	if(targ.id === defaults.prefix+'-unnotify-btn') {
		removeWgState('notified');
		// reset button height
		resetStyles(btn.children[0]);
		setButtonStyle(widgetState.state);
		return;
	}

	if(currTarg.id === defaults.prefix+'-btn-cont') {
		initWidgetState();
	}
}

function initWidgetState(){
	// If timeout is occured, init session first
	if(hasWgState('timeout')) {
		initModule();
	} else if(api.getState('chat', 'cache')){
		showWidget();
	// } else if(defaults.webrtc.sip.ws_servers !== undefined && defaults.webrtc.sip.uri !== undefined){
	} else if(defaults.webrtc.sip.ws_servers && WebRTC.isSupported()){
		// if call is in progress - just show the widget
		if(api.getState('call', 'cache')) {
			showWidget();
		} else {
			switchPane('chooseConnection');
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
		sendMessage(msg);
		textarea.value = '';
		removeWgState('type-extend');
	}
	if(!api.getState('chat')) {
		initChat();
	}
}

function wgTypingHandler(e){
	var targ = e.target;
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

	if(targ.value.length >= 80 && !hasWgState('type-extend'))
		addWgState('type-extend');
	if(targ.value.length < 80 && hasWgState('type-extend'))
		removeWgState('type-extend');
}

function wgSubmitHandler(e){
	var targ = e.target;
	e.preventDefault();
	if(targ.tagName === 'FORM')
		api.emit('form/submit', targ);
}

function wgSendFile(e){
	var targ = e.target;
	var file = getFileContent(targ, function(err, result) {
		if(err) {
			alert('File was not sent');
		} else {
			api.sendMessage(result.filedata, result.filename);
		}
	});
}

/********************************
 * Widget elements manipulation *
 ********************************/

function switchPane(pane){
	// var paneId = defaults.prefix+'-'+pane+'-pane';
	var attr = 'data-'+defaults.prefix+'-pane';
	// console.log('switchPane panes:', panes, 'pane: ', pane);
	panes.forEach(function(item){
		if(item.getAttribute(attr) === pane) {
			item.classList.add('active');
		} else {
			item.classList.remove('active');
		}
	});

	if(!widgetState.active) showWidget();
}

function changeWgState(params){
	if(!widget || widgetState.state === params.state) return;
	if(params.state === 'offline') {
		removeWgState('online');
	} else if(params.state === 'online') {
		removeWgState('offline');
		
	}

	widgetState.state = params.state;
	addWgState(params.state);
	// api.emit('widget/statechange', { state: params.state });
	setButtonStyle(params.state);
}

// TODO: This is not a good solution or maybe not a good implementation
function setButtonStyle(state) {
	// console.log('setButtonStyle: ', state);
	if(!widget || defaults.buttonStyles[state] === undefined) return;
	var wgBtn = widget.querySelector('.'+defaults.prefix+'-wg-btn'),
		btnIcon = widget.querySelector('.'+defaults.prefix+'-btn-icon');

	wgBtn.style.backgroundColor = defaults.buttonStyles[state].backgroundColor;
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
	widgetState.active = true;
	addWgState('active');
	removeWgState('notified');

	// reset button height
	resetStyles(btn.children[0]);
	setButtonStyle(widgetState.state);

	messagesCont.scrollTop = messagesCont.scrollHeight;
}

function closeWidget(){
	if(window.opener) {
		window.close();
	} else {
		widgetState.active = false;
		removeWgState('active');
	}
}

function onFormSubmit(form){
	var formData = getFormData(form);
	// console.log('onFormSubmit: ', form, formData);
	if(form.getAttribute('data-validate-form')) {
		var valid = validateForm(form);
		if(!valid) return;
		// console.log('onFormSubmit valid: ', valid);
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
		closeForm(form.name, true);
	}

}

function closeForm(name, submit){
	var form = global[name];
	if(!form) return false;
	if(submit) {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-success '+defaults.prefix+'-icon-check"></i>'+
							'<span> '+frases[currLang].form_submitted+'</span>'+
						'</p>';
	} else {
		form.outerHTML = '<p class="'+defaults.prefix+'-text-center">'+
							'<i class="'+defaults.prefix+'-text-danger '+defaults.prefix+'-icon-remove"></i>'+
							'<span> '+frases[currLang].form_canceled+'</span>'+
						'</p>';
	}
}

function getFileContent(element, cb){
	var files = element.files,
		file,
		reader;

	if(!files.length) return;
	if(!global.FileReader) {
		if(cb) cb('OBSOLETE_BROWSER');
		return;
	}

	file = files[0];

	reader = new FileReader();
	reader.onload = function(event) {
		if(cb) cb(null, { filedata: event.target.result, filename: file.name });
	};
	reader.onerror = function(event) {
		api.emit('Error', event.target.error);
		if(cb) cb(event.target.error);
	};
	reader.readAsDataURL(file);
}

function messageTemplate(){
	var str = '<div class="'+defaults.prefix+'-message '+defaults.prefix+'-<%=entity %>-msg">' +
					'<span class="'+defaults.prefix+'-message-from"><%=from %></span>' +
					'<span class="'+defaults.prefix+'-message-time"> <%= time %></span>' +
					'<br>' +
					'<p class="'+defaults.prefix+'-message-content" <% if(entity === "user") { %> style="border-color:'+defaults.styles.primary.backgroundColor+'" <% } %>><%=text %></p>' +
				'</div>';
				// '</li>';
	return str;
}

// function agentIsTypingTemplate(){
// 	var str = '<div id="'+defaults.prefix+'-agent-typing" class="'+defaults.prefix+'-agent-typing">' +
// 					'<span><%=aname %></span>' +
// 					'<span> <%= text %></span>' +
// 				'</div>';
// 	return str;
// }

function compileTemplate(template, data){
	var compiled = _.template(template);
	return compiled(data);
}

/********************************
 * Helper functions *
 ********************************/

function detectLanguage(){
	var storageLang = api.getState('lang'),
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

	// console.log('detected lang: ', lang);

	return lang;
}

function browserIsObsolete() {
	console.warn('Your browser is obsolete!');
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
			content: text.split(" ").map(convertLinks).join(" ")
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
		// console.log('validateForm el:', el, el.hasAttribute('required'), el.value, el.type);
		if(el.hasAttribute('required') && (el.value === "" || el.value === null)) {
			alert(frases[currLang].required_error[el.type] || frases[currLang].required_error.fields);
			valid = false;
			return false;
		} else {
			return true;
		}
	});
	// console.log('validateForm valid: ', valid);
	return valid;
}

function resetStyles(element){
	element.removeAttribute('style');
}

function addWidgetStyles(){
	
	var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = defaults.server+defaults.path+'main.css';

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

module.exports = {
	module: Widget,
	api: publicApi
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../translations.json":117,"./cobrowsing":108,"./core":109,"./lodash":111,"./request":113,"./webrtc":115,"domify":6,"url":104}],117:[function(require,module,exports){
module.exports={
    "en": {
		"lang": "English",
		"default_user_name": "You",
		"default_title": "Live chat",
		"default_offer": "Welcome, need some help?",
		"greets": "Greetings!",
		"cancel": "Cancel",
		"close": "Close",
		"finish": "Finish",
		"back": "Back",
		"send": "Send",
		"send_message_button": "Send message",
		"start_dialog_button": "Start dialog",
		"finish_dialog_button": "Finish dialog",
		"choose_dialog_lang": "Choose dialog language",
		"intro_message": "Please, introduce yourself",
		"offline_message": "We are offline now, please leave us a message, we'll contact you shortly",
		"send_message_header": "Send a message",
		"close_chat_header": "Thank you for reaching us!",
		"send_dialog_label": "Send dialog to your email?",
		"rate_agent": "Rate agent service",
		"rates": {
			"excellent": "Excellent",
			"good": "Good",
			"fair": "Fair",
			"bad": "Bad"
		},
		"email_subjects": {
			"dialog": "Your dialog on",
			"complain": "Dialog comment from",
			"request": "New message from"
		},
		"required_error": {
			"fields": "Please fill in all required fields",
			"email": "Please fill in your email",
			"tel": "Please fill in your telephone number"
		},
		"form_submitted": "Form sent, thank you!",
		"form_canceled": "Form cancelled",
		"pholder": {
			"uname": "Your name",
			"email": "Your email",
			"phone": "Your phone",
			"subject": "Dialog's subject",
			"message": "Your message here...",
			"comment": "Please, leave your comment here..."
		},
		"init_pane": {
			"choose_conn_type": "Please, choose a connection type",
			"call_agent_btn": "Call agent",
			"chat_agent_btn": "Start chat"
		},
		"call_pane": {
			"confirm_access": "Please, confirm access to microphone",
			"calling_agent": "Calling Agent",
			"connected_with_agent": "Connected with Agent",
			"call_ended": "Call ended",
			"call_failed": "Call failed \n Please, try again later",
			"call_canceled": "Call canceled",
			"end_call": "End call",
			"try_again": "Try again"
		}
    },
    "uk": {
    	"lang": "Українська",
    	"default_user_name": "Ви",
    	"default_title": "Онлайн чат",
    	"default_offer": "Ласкаво просимо, потрібна допомога?",
    	"greets": "Вітаємо!",
		"cancel": "Відміна",
		"close": "Закрити",
		"finish": "Завершити",
		"back": "Назад",
		"send": "Відправити",
		"send_message_button": "Відправити",
    	"start_dialog_button": "Розпочати діалог",
    	"finish_dialog_button": "Закінчити діалог",
		"choose_dialog_lang": "Оберіть мову діалогу",
		"intro_message": "Будь-ласка, заповніть необхідні поля",
		"offline_message": "Наразі ми оффлайн, будь ласка, залиште нам повідомлення, ми зв'яжемося з Вами найближчим часом",
		"send_message_header": "Відправити повідомлення",
		"close_chat_header": "Дякуємо, що звернулися до нас!",
		"send_dialog_label": "Відправити діалог на ваш email?",
		"rate_agent": "Оцінити роботу оператора",
		"rates": {
			"excellent": "Відмінно",
			"good": "Добре",
			"fair": "Задовільно",
			"bad": "Погано"
		},
		"email_subjects": {
			"dialog": "Ваш діалог на",
			"complain": "Коментар до діалогу від",
			"request": "Нове повідомлення від"
		},
		"required_error": {
			"fields": "Будь-ласка, заповніть всі необхідні поля",
			"email": "Будь-ласка, введіть свою електронну адресу",
			"tel": "Будь-ласка, введіть свій номер телефону"
		},
		"form_submitted": "Форма відправлена, дякуємо!",
		"form_canceled": "Форма відхилена",
		"pholder": {
			"uname": "Ваше ім'я",
			"email": "Ваша електронна адреса",
			"phone": "Ваш телефон",
			"subject": "Тема діалогу",
			"message": "Ваше повідомлення тут...",
			"comment": "Будь-ласка, залиште тут свій коментар..."
		},
		"init_pane": {
			"choose_conn_type": "Будь-ласка, виберіть тип з'єднання",
			"call_agent_btn": "Виклик агента",
			"chat_agent_btn": "Почати чат"
		},
		"call_pane": {
			"confirm_access": "Будь-ласка, підтвердіть доступ до мікрофона",
			"calling_agent": "Йде виклик",
			"connected_with_agent": "Виклик з'єднаний",
			"call_ended": "Виклик завершено",
			"call_failed": "Збій виклику \n Будь-ласка спробуйте пізніше",
			"call_canceled": "Виклик скасований",
			"end_call": "Завершити виклик",
			"try_again": "Спробувати ще раз"
		}
    },
    "ru": {
    	"lang": "Русский",
    	"default_user_name": "Вы",
		"default_title": "Онлайн чат",
		"default_offer": "Добро пожаловать, нужна помощь?",
    	"greets": "Приветствуем!",
		"cancel": "Отмена",
		"close": "Закрыть",
		"finish": "Завершить",
		"back": "Назад",
		"send": "Отправить",
		"send_message_button": "Отправить",
    	"start_dialog_button": "Начать диалог",
    	"finish_dialog_button": "Завершить диалог",
		"choose_dialog_lang": "Выберите язык диалога",
		"intro_message": "Пожалуйста, звполните необходимые поля",
		"offline_message": "Сейчас мы оффлайн, пожалуйста, оставьте нам сообщение, мы свяжемся с Вами в ближайшее время",
		"send_message_header": "Отправить сообщение",
		"close_chat_header": "Спасибо, что обратились к нам!",
		"send_dialog_label": "Отправить диалог на ваш email?",
		"rate_agent": "Оценить работу оператора",
		"rates": {
			"excellent": "Отлично",
			"good": "Хорошо",
			"fair": "Нормально",
			"bad": "Плохо"
		},
		"email_subjects": {
			"dialog": "Ваш диалог на",
			"complain": "Комментарий к диалогу от",
			"request": "Новое сообщение от"
		},
		"required_error": {
			"fields": "Пожалуйста, заполните все необходимые поля",
			"email": "Пожалуйста, введите свой электронный адрес",
			"tel": "Пожалуйста, введите свой номер телефона"
		},
		"form_submitted": "Форма отправлена, спасибо!",
		"form_canceled": "Форма отклонена",
		"pholder": {
			"uname": "Ваше имя",
			"email": "Ваш электронный адрес",
			"phone": "Ваш телефон",
			"subject": "Тема диалога",
			"message": "Ваше сообщение здесь...",
			"comment": "Пожалуйста, оставьте здесь свой комментарий..."
		},
		"init_pane": {
			"choose_conn_type": "Пожалуйста, выберите способ соединения",
			"call_agent_btn": "Вызов агента",
			"chat_agent_btn": "Начать чат"
		},
		"call_pane": {
			"confirm_access": "Пожалуйста, подтвердите доступ к микрофону",
			"calling_agent": "Идет вызов",
			"connected_with_agent": "Вызов соединен",
			"call_ended": "Вызов завешен",
			"call_failed": "Сбой вызова \n Пожалуйста, попробуйте позже",
			"call_canceled": "Вызов отменен",
			"end_call": "Заверший вызов",
			"try_again": "Попробовать еще раз"
		}
    }
};

},{}]},{},[112])(112)
});