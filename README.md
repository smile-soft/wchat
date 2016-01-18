# Wchat.js
### About
Official javascript module for Smile IPCC

[Detailed about Smile IP Contact Center](https://smile-soft.com/index.php/en/ipcc-overview)
### Prerequisites
This module could be used only with Smile IPCC server. Appropriate licence must be purchased.

[Read the full documentation](http://smile-soft.com/resources/ru/Smile%20IPCC%20Webchat.pdf)
### Examples
```js
// Initiate module
Wchat({
	server: 'http://ipcc-server-domain.com:8880', 
	lang: 'uk', // default language - ukranian
	title: 'SmileSoft',
	position: 'left',
	offer: {
		inMinutes: 0.20,
		from: 'Ringotel'
	},
	styles: {
		primary: {
			backgroundColor: "#33C3F0",
			color: "#fff"
		}
	},
	path: "<?php echo get_template_directory_uri(); ?>/wchat/" // absolute path to the module's folder in wordpress template
}).initModule();

// Set widget option to false
var wchat = Wchat({ server: 'http://ipcc-server-domain.com:8880', widget: false })
document.getElementById('openWidget').addEventListener('click', wchat.openWidget, false);
wchat.initModule();

// Subscribe to events
Wchat({ server: 'http://ipcc-server-domain.com:8880' })
.on('session/create', sessionCreateedHandler)
.on('widget/init', widgetInitHandler)
.on('chat/start', chatStartedHandler)
.on('chat/close', chatClosedHandler)
.initModule();
```
### Getting Started
1) Put all files from `dist` folder to the website's folder on the webserver, where your website/web application is hosted.

2) Add a script tag to the webpages where the module should be loaded.
```html
<script src="wchat.min.js"></script>
```
**Note**: do not use non minified version of the script, it's very big and is used only for debugging purposes.

3) Add a link tag to the webpages where the module should be loaded.
```html
<link href="main.css"></link>
```
4) Initiate module with the appropriate options (listed below).
```js
Wchat({ server: 'http://ipcc-server-domain.com:8880' }).initModule();
```

Option            | Type    | Default     | Description
------------------|---------|-------------|-----------------
server            | String  |             | IPCC server IP address and http port
title             | String  | Live chat   | Displayed in the widget's header element
lang              | String  | en          | Default language of interface and dialog. Used when automaticaly determined user language is not supported (ask your IPCC administrator for additional information). Possible values are `en`, `uk`, `ru`
widget            | Boolean | true        | Whether the webchat widget should be opened within the main tab (if `true`) or in a separate window (if `false`)
position          | String  | right       | Widget position on the page. Option is actual if `widget` is set to true. Possible values are `right` and `left`
hideOfflineButton | Boolean | false       | If set to `true`, then widget's button will be hidden when there are no registered IPCC agents that could serve current task
intro             | Array   | []          | If defined, then the user must introduce him/herself before starting a dialog. [Read more](#setting-intro)
offer             | Object  | false       | When set, the predefined message will be shown to the user after a certain number of minutes. [Read more](#setting-offer)
styles            | Obejct  |             | A basic widget styles. [Read more](#setting-styles)
buttonStyles      | Object  |             | A set of widget's button styles. [Read more](#setting-button-styles)
path              | String  |             | Absolute path to the module's folder on the web server

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

Parameters:
- `sid`: current session ID

#### `session/continue`
Active session continues. Emits after module initiation, when current session is active.

Parameters:
- `entity`: could be `user` or `agent`

#### `session/join`
Join active session. Emits when IPCC agent is joined the session, aka cobrowsing initiated.

#### `session/disjoin`
Current session closed.

#### `widget/load`
Widget template is fully loaded, compiled and inserted to the DOM.

Parameters: 
- `widget`: widget's DOM node

#### `chat/start`
Chat request was sent to the server and was accepted.

Parameters:
- `timeout`: time (in seconds) before the dialog would be closed

#### `chat/close`
Dialog closed.

Parameters:
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

#### `Error`
Erro was emitted.

### Setting Intro
You can set which of the fields user must fill in before starting the dialog. Example values:
```
[{
	name: 'uname',
	required: true,
	placeholder: 'name_pholder',
	save: true
}, {
	name: 'phone',
	placeholder: 'phone_pholder',
	type: 'tel',
	save: true
}, {
	name: 'subject',
	placeholder: 'dialog_subject_pholder',
}, {
	name: 'lang'
}]
```
Parameters:
- `name`: name of the field
- `required`: the value of that field shouldn't be empty
- `placeholder`: could be a translation key or any other string
- `save`: if `true`, the value would be stored in the session's memory and autofilled during the active session

### Setting Offer
Parameters:
- `inMinutes`: time since module initiation, when the offer message will be shown to the user
- `from`: string representation of the message sender
- `text`: if not defined, the value will be a default tranlation key

### Setting Styles
Default values:
```
{
	width: '270px',
	height: '435px',
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
Parameters:
- `width`: widget width
- `height`: widget height
- `primary.backgroundColor`: the background color of the elements, that represent widget's color schema
- `primary.color`: the font color of the elemennts, that represent widget's color schema
- `intro.backgroundImage`: url of the background image on the `intro` pane
- `sendmail.backgroundImage`: url of the background image on the `sendmail` pane

### Setting Button Styles
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
Parameters:
- `[widgetState].backgroundColor`: button background color depending on widget's state
- `[widgetState].color`: button icon color depending on widget's state
- `color`: if `[widgetState].color` is not specified, this value will be used

### Browser Support
* Google Chrome (latest)
* Mozilla Firefox (latest)
* Opera (latest)
* Safari
* IE 10+
* Microsoft Edge

### License
MIT
