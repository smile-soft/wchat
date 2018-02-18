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
'\n                                    </td>\n                                </tr>\n                                <tr>\n                                    <td>\n                                        <p class="copyright">Copyright (c) 2016 SmileSoft</p>\n                                    </td>\n                                </tr>\n                            </table>\n                        </td>\n                    </tr>\n                </table>\n                <!--[if (gte mso 9)|(IE)]>\n                </td>\n                </tr>\n                </table>\n                <![endif]-->\n            </div>\n        </center>\n    </body>\n</html>';

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
'</span>\n\t<span class="' +
__e( defaults.prefix ) +
'-message-time"> ' +
__e( message.time ) +
'</span>\n\t<br>\n\t<div class="' +
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
'</button>\n\t\t</form>\n\t</div>\n</div>';

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
'-msg">\n\t<div class="' +
__e( defaults.prefix ) +
'-message-content" \n\t\t';
 if(message.entity === "user") { ;
__p += ' \n\t\t\tstyle="border-color:';
 defaults.styles.primary.backgroundColor ;
__p += '" \n\t\t';
 } ;
__p += '\n\t>\n\t\t<span class="' +
__e( defaults.prefix ) +
'-message-from">' +
__e( message.from ) +
'</span>\n\t\t<p>' +
((__t = ( message.text )) == null ? '' : __t) +
'</p>\n\t</div>\n\t<br>\n\t<span class="' +
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
__p += '">\n\n\t\t<!-- ***** Top bar ***** -->\n\t\t<div class="' +
__e( defaults.prefix ) +
'-top-bar">\n\n\t\t\t<!-- Main title -->\n\t\t\t<h4 class="' +
__e( defaults.prefix ) +
'-wg-title ' +
__e( defaults.prefix ) +
'-uppercase">\n\t\t\t\t' +
__e( defaults.title || frases.TOP_BAR.title ) +
'\n\t\t\t</h4>\n\n\t\t\t<!-- Action buttons (minimize, close) -->\n\t\t\t<div class="' +
__e( defaults.prefix ) +
'-wg-minimize">\n\n\t\t\t\t<a \n\t\t\t\t\thref="#" \n\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="closeWidget">\n\t\t\t\t\t\n\t\t\t\t\t<span style="font-weight: bold">_</span>\n\t\t\t\t\n\t\t\t\t</a>\n\t\t\t\t\n\t\t\t\t<a \n\t\t\t\t\thref="#" \n\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="finish">\n\n\t\t\t\t\t<span class="' +
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
'InitForm">\n\n\t\t\t\t\t<!-- Display call button if WebRTC is enabled and supported by the browser -->\n\t\t\t\t\t';
 if(defaults.webrtcEnabled) { ;
__p += ' \n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
';"\n\t\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initCall">\n\n\t\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.call_agent_btn ) +
'\n\n\t\t\t\t\t\t</button>\n\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t<!-- If WebRTC is not supported and fallback is set -->\n\t\t\t\t\t';
 if(!defaults.webrtcEnabled && defaults.webrtc.fallback && defaults.webrtc.fallback.sipCall) { ;
__p += ' \n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
';"\n\t\t\t\t\t\t\tdata-' +
__e( defaults.prefix ) +
'-handler="initFallbackCall">\n\n\t\t\t\t\t\t\t' +
__e( panels.CONNECTION_TYPES.call_agent_btn ) +
'\n\n\t\t\t\t\t\t</button>\n\t\t\t\t\t';
 } ;
__p += '\n\n\t\t\t\t\t<!-- Display callback button if callback task is configured in the settings -->\n\t\t\t\t\t';
 if(defaults.callback && defaults.callback.task) { ;
__p += '\n\t\t\t\t\t\t<button \n\t\t\t\t\t\t\ttype="button" \n\t\t\t\t\t\t\tclass="' +
__e( defaults.prefix ) +
'-button ' +
__e( defaults.prefix ) +
'-button-primary ' +
__e( defaults.prefix ) +
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'-block" \n\t\t\t\t\t\tstyle="background-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
'; border: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'-block" \n\t\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'-write-cont">\n\t\t\t\t\n\t\t\t\t<!-- "Agent is typing" indicator -->\n\t\t\t\t<div class="' +
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
'">\n\t\t\t\t\t<span>\n\n\t\t\t\t</label>\n\n\t\t\t\t<!-- Field for typing the user message -->\n\t\t\t\t<textarea \n\t\t\t\t\tid="' +
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
'-dark">\n\t\t\t\t\t<br><br>\n\t\t\t\t\t<p>' +
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
'-block" \n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'-block" \n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'-hidden"\n\t\t\t\t\t\tstyle="background-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; color: ' +
__e( defaults.styles.primary.color ) +
'; border: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
'</h3>\n\t\t\t\t\t<br>\n\t\t\t\t\t<a href="' +
__e( defaults.webrtc.fallback.sipCall ) +
'">call.jnlp</a>\n\t\t\t\t</div>\n\t\t\t\t<form>\n\t\t\t\t\t<hr>\n\t\t\t\t\t<a href="#chooseConnection" class="' +
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
'-block"\n\t\t\t\t\t\tstyle="\n\t\t\t\t\t\t\tbackground-color: ' +
__e( defaults.styles.primary.backgroundColor ) +
'; \n\t\t\t\t\t\t\tcolor: ' +
__e( defaults.styles.primary.color ) +
'; \n\t\t\t\t\t\t\tborder: 1px solid ' +
__e( defaults.styles.primary.backgroundColor ) +
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
' x</span>\n\t\t\t\t<div id="' +
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