# Wchat.js
### About
Official javascript module for Smile IPCC

[Detailed about Smile IP Contact Center](https://smile-soft.com/index.php/en/ipcc-overview)
### Prerequisites
This module could be used only with Smile IPCC server. Appropriate licence must be purchased.

### Examples
#### Initiate module
```js
Wchat({
	server: 'http://ipcc-server-domain.com:8880', 
	lang: 'uk',
	title: 'SmileSoft',
	position: 'left',
	offer: {
		inSeconds: 0.20,
		from: 'SmileSoft support'
	},
	styles: {
		primary: {
			backgroundColor: "#33C3F0",
			color: "#fff"
		}
	}
}).initModule();
```
#### Initiate module and set widget option to false
```js
var wchat = Wchat({ server: 'http://ipcc-server-domain.com:8880', widget: false })
document.getElementById('openWidget').addEventListener('click', wchat.openWidget, false);
wchat.initModule();
```
#### Initiate module and subscribe to events
```js
Wchat({ server: 'http://ipcc-server-domain.com:8880' })
.on('session/create', sessionCreateedHandler)
.on('widget/init', widgetInitHandler)
.on('chat/start', chatStartedHandler)
.on('chat/close', chatClosedHandler)
.initModule();
```
### Getting Started
1) Put all files from `dist` folder to the folder on the IPCC webserver. The default path is: *path-to-the-ipcc-directory>/web/ipcc/webchat*.
**Note**: if you prefer to change the default directory for the webchat files, then change the path property in the module's options declaration.

2) Add a script tag to the webpages where the module should be loaded.
```html
<script src="ipcc-server-domain-or-ip/ipcc/webchat/wchat.min.js" charset="UTF-8"></script>
```
**Note**: do not use non minified version of the script, it's very big and is used only for debugging purposes.

3) Initiate module with the appropriate options (listed below).
```js
Wchat({ server: 'http://ipcc-server-domain.com:8880' }).initModule();
```

Option            | Type    | Default     | Description
------------------|---------|-------------|-----------------
server            | String  |             | Required. IPCC server IP address and http port
title             | String  | Live chat   | Displayed in the widget's header element
lang              | String  | en          | Default language of interface and dialog. Used when automaticaly determined user language is not supported (ask your IPCC administrator for additional information).
langFromUrl	  | Boolean | false	  | Experimental. This feature parses page url to figure out user's preferred language
widget            | Boolean | true        | Whether the webchat widget should be opened within the main tab (if `true`) or in a separate window (if `false`)
position          | String  | right       | Widget position on the page. Option is actual if `widget` is set to true. Possible values are `right` and `left`
hideOfflineButton | Boolean | false       | If set to `true`, then widget's button will be hidden when there are no registered IPCC agents that could serve current task
intro             | Array   | []          | If defined, then the user must introduce him/herself before starting a dialog. [Read more](#intro-setting)
offer             | Object  | false       | When set, the predefined message will be shown to the user after a certain number of minutes. [Read more](#offer-setting)
styles            | Obejct  |             | A basic widget styles. [Read more](#widget-styles)
buttonStyles      | Object  |             | A set of widget's button styles. [Read more](#button-styles)
path              | String  | /ipcc/webchat | Absolute path to the module's folder on the web server
webrtc		  | Object  |		  | Settings for the WebRTC call feature. [Read more](#webrtc-setting)
callback		| Object |			| Settings for the Callback feature. [Read more](#callback-setting)

### API
Module's API exposes the following methods:

#### `initModule()`
Initiate module with all the options set and all the events subscribed.

#### `openWidget()`
Open webchat widget in the separate window.

#### `initChat()`
Initiate dialog

#### `on`
Subscribe to specified event.

#### `emit`
Emit a specified event.

### Events
Module emits the following events:

#### `session/create`
New session created.

Properties:
- `sid`: current session ID

#### `session/continue`
Active session continues. Emits after module initiation, when current session is active.

Properties:
- `entity`: could be `user` or `agent`

#### `session/join`
Join active session. Emits when IPCC agent is joined the session, aka cobrowsing initiated.

#### `session/disjoin`
Current session closed.

#### `widget/load`
Widget template is fully loaded, compiled and inserted to the DOM.

Properties: 
- `widget`: widget's DOM node

#### `chat/start`
Chat request was sent to the server and was accepted.

Properties:
- `timeout`: time (in seconds) before the dialog would be closed

#### `chat/close`
Dialog closed.

Properties:
- `rating`: agent's service rating that was set by the user

#### `chat/send`
An email message was sent.

#### `chat/timeout`
This event occures when user stood in a queue for a certain period of time, which is specified in Admin Studio by Smile IPCC administrator.

#### `chat/languages`
New list of available dialog languages was loaded from the server. If an empty array was recieved then there are no registered IPCC agents that could serve current task.

#### `message/new`
New message recieved.

#### `message/typing`
Agent is typing a message.

#### `form/submit`
Form submitted.

Properties: 
- `formElement`: form element
- `formData`: serialized object, represented as an object of keys and values

#### `form/reject`
Form rejected.

Properties: 
- `formName`: the value of the name attribute of the form that was rejected

#### `Error`
Erro was emitted.

### Intro Setting
You can set which of the fields user must fill in before starting the dialog. Example values:
```
[{
	name: 'uname',
	required: true,
	placeholder: 'Your name',
	save: true
}, {
	name: 'phone',
	placeholder: 'Your phone',
	type: 'tel',
	save: true
}, {
	name: 'subject',
	placeholder: 'Dialog's subject',
}, {
	name: 'lang'
}]
```
Properties:
- `name`: name of the field
- `required`: the value of that field shouldn't be empty
- `placeholder`: could be any string value. If not defined, then it will be set automatically.
- `save`: if `true`, the value would be stored in the session's memory and autofilled during the active session

### Offer Setting
Properties:
- `inSeconds`: time since module initiation, when the offer message will be shown to the user
- `from`: string representation of the message sender
- `text`: if not defined, the value will be a default tranlation key

### Widget Styles
Default values:
```
{
	width: '270px',
	height: '400px',
	primary: {
		backgroundColor: '#555555',
		color: '#FFFFFF'
	},
	intro: {
		backgroundImage: "images/bgr-02.jpg"
	},
		sendmail: {
		backgroundImage: "images/bgr-01.jpg"
	}
}
```
Properties:
- `width`: widget width
- `height`: height of the messages container
- `primary.backgroundColor`: the background color of the elements, that represent widget's color schema
- `primary.color`: the font color of the elemennts, that represent widget's color schema
- `intro.backgroundImage`: url of the background image on the `intro` pane
- `sendmail.backgroundImage`: url of the background image on the `sendmail` pane

### Button Styles
Default values:
```
{
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
}
```
Properties:
- `[widgetState].backgroundColor`: button background color depending on widget's state
- `[widgetState].color`: button icon color depending on widget's state
- `color`: if `[widgetState].color` is not specified, this value will be used

### WebRTC Settings
Properties:
- `sip`: User Agent configuration object with mandatory and optional Properties. The full list of Properties you can find at: [http://jssip.net/documentation/2.0.x/api/ua_configuration_Properties/](http://jssip.net/documentation/2.0.x/api/ua_configuration_Properties/). The mandatory Properties are:

   * `ws_servers`: domain name or ip address of the websocket server (the same as IPCC server). Example: *wss://ipcc-domain-name-or-ip-address.com*

   * `uri`: SIP URI associated to the User Agent. Example: "sip:online@ipcc-domain-name-org-ip-address.com"

- `hotline`: Destination of the call. String assosiated with the record in the IPCC routing table.

**Note**: WebRTC feature will not work on insecure origins. To use this feature, you should consider switching your application to a secure origin, such as HTTPS. See https://goo.gl/rStTGz for more details. Also, you neet to obtain and install valid SSL certificate (self-signed certificates will not work) on IPCC server.

### Callback Settings
Properties:
- `task`: Callback task name in the following format: 'task_group'.'task_name'.

### Browser Support
* Google Chrome (latest)
* Mozilla Firefox (latest)
* Opera (latest)
* Safari
* IE 10+
* Microsoft Edge

### License
MIT
