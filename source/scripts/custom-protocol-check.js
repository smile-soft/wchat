var browser = {
  getUserAgent: function() {
    return window.navigator.userAgent;
  },

  userAgentContains: function(browserName) {
    browserName = browserName.toLowerCase();
    return (
      this.getUserAgent()
        .toLowerCase()
        .indexOf(browserName) > -1
    );
  },

  isOSX: function() {
    return this.userAgentContains("Macintosh");
  },

  isFirefox: function() {
    return this.userAgentContains("firefox");
  },

  isInternetExplorer: function() {
    return this.userAgentContains("trident");
  },
  /**
   * Detects IE 11 and older
   * @return {Boolean} Returns true when IE 11 and older
   */
  isIE: function() {
    var ua = this.getUserAgent().toLowerCase();

    // Test values.
    // Uncomment to check result

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko/20100101 Firefox/12.0';

    var msie = ua.indexOf("msie");
    if (msie > 0) {
      // IE 10 or older
      return true;
    }

    var trident = ua.indexOf("trident/");
    if (trident > 0) {
      // IE 11
      return true;
    }

    // other browser
    return false;
  },

  isEdge: function() {
    var ua = this.getUserAgent().toLowerCase();

    // Test values.
    // Uncomment to check result

    // Edge
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240';

    var edge = ua.indexOf("edge");
    if (edge > 0) {
      return true;
    }

    return false;
  },

  isChrome: function() {
    // IE11 returns undefined for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // but needs to check if window.opr is not undefined
    // and new IE Edge outputs to true for window.chrome
    // and if not iOS Chrome check
    var isChromium = window.chrome;
    var winNav = window.navigator;
    var vendorName = winNav.vendor;
    var isOpera = typeof window.opr !== "undefined";
    var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
    var isIOSChrome = winNav.userAgent.match("CriOS");
    return (
      (isChromium !== null &&
        typeof isChromium !== "undefined" &&
        vendorName === "Google Inc." &&
        isOpera === false &&
        isIEedge === false) ||
      isIOSChrome
    );
  },

  isOpera: function() {
    return this.userAgentContains(" OPR/");
  },

  isIOS: function() {
      var ua = window.navigator.userAgent;
      var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      var webkit = !!ua.match(/WebKit/i);
      return iOS && webkit && !ua.match(/CriOS/i);
  }
};

var DEFAULT_CUSTOM_PROTOCOL_FAIL_CALLBACK_TIMEOUT = 2000;
var IFRAME_ID = 'swcHiddenIframe';

var registerEvent = function(target, eventType, cb) {
  if (target.addEventListener) {
    target.addEventListener(eventType, cb);
    return {
      remove: function() {
        target.removeEventListener(eventType, cb);
      }
    };
  } else {
    target.attachEvent(eventType, cb);
    return {
      remove: function() {
        target.detachEvent(eventType, cb);
      }
    };
  }
};

var createHiddenIframe = function(target, uri) {
  var iframe = document.createElement("iframe");
  iframe.src = uri;
  iframe.id = IFRAME_ID;
  iframe.style.display = "none";
  target.appendChild(iframe);

  return iframe;
};

var openUriWithHiddenFrame = function(uri, failCb, successCb) {
  var timeout = setTimeout(function() {
    failCb();
    handler.remove();
  }, DEFAULT_CUSTOM_PROTOCOL_FAIL_CALLBACK_TIMEOUT);

  var iframe = document.querySelector("#"+IFRAME_ID);
  if (!iframe) {
    iframe = createHiddenIframe(document.body, "about:blank");
  }

  var onBlur = function() {
    clearTimeout(timeout);
    handler.remove();
    successCb();
  };
  var handler = registerEvent(window, "blur", onBlur);

  iframe.contentWindow.location.href = uri;
};

var openUriWithTimeoutHack = function(uri, failCb, successCb) {
  var timeout = setTimeout(function() {
    failCb();
    handler.remove();
  }, DEFAULT_CUSTOM_PROTOCOL_FAIL_CALLBACK_TIMEOUT);

  //handle page running in an iframe (blur must be registered with top level window)
  var target = window;
  while (target.parent && target != target.parent) {
    target = target.parent;
  }

  var onBlur = function() {
    clearTimeout(timeout);
    handler.remove();
    successCb();
  };

  var handler = registerEvent(target, "blur", onBlur);

  // window.open(uri, '_blank');
  window.location = uri;
};

var openUriUsingFirefox = function(uri, failCb, successCb) {
  var iframe = document.querySelector("#"+IFRAME_ID);

  if (!iframe) {
    iframe = createHiddenIframe(document.body, "about:blank");
  }

  try {
    iframe.contentWindow.location.href = uri;
    successCb();
  } catch (e) {
    if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
      failCb();
    }
  }
};

var openUriWithMsLaunchUri = function(uri, failCb, successCb) {
  navigator.msLaunchUri(uri, successCb, failCb);
};

var getBrowserVersion = function() {
  var ua = window.navigator.userAgent;
  var tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return parseFloat(tem[1]) || "";
  }
  if (M[1] === "Chrome") {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) {
      return parseFloat(tem[2]);
    }
  }
  M = M[2] ? [M[1], M[2]] : [window.navigator.appName, window.navigator.appVersion, "-?"];

  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return parseFloat(M[1]);
};

var protocolCheck = function(uri, failCb, successCb, unsupportedCb) {
  var failCallback = function() {
    return failCb && failCb();
  };

  var successCallback = function() {
    return successCb && successCb();
  };

  var unsupportedCallback = function() {
    return unsupportedCb && unsupportedCb();
  };

  var openUri = function() {
    if (browser.isFirefox()) {
      var browserVersion = getBrowserVersion();
      if (browserVersion >= 64) {
        openUriWithHiddenFrame(uri, failCallback, successCallback);
      } else {
        openUriUsingFirefox(uri, failCallback, successCallback);
      }
    } else if (browser.isChrome() || browser.isIOS()) {
      openUriWithTimeoutHack(uri, failCallback, successCallback);
    } else if (browser.isOSX()) {
      openUriWithHiddenFrame(uri, failCallback, successCallback);
    } else {
      //not supported, implement please
      unsupportedCallback();
    }
  };

  if (browser.isEdge() || browser.isIE()) {
    //for IE and Edge in Win 8 and Win 10
    openUriWithMsLaunchUri(uri, failCb, successCb);
  } else {
    if (document.hasFocus()) {
      openUri();
    } else {
      var focusHandler = registerEvent(window, "focus", function() {
        focusHandler.remove();
        openUri();
      });
    }
  }
};

module.exports = protocolCheck;
