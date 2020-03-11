# Wchat.js
### About
Official javascript module for Smile IPCC

[Detailed about Smile IP Contact Center](https://smile-soft.com/index.php/en/ipcc-overview)
### Prerequisites
This module could be used only with Smile IPCC server. Appropriate licence must be purchased.

### Examples
#### Initiate module
```js
window.WchatSettings = {
    pageid: "1234567890123" // the only required property
};

(function(w,d,s,l,g,a,b,o){w[a]=w[a]||{};w[a].clientPath=w[a].clientPath||l;
   if(w[g]){w[g](w[a]||{})}else{b=d.createElement(s),o=d.getElementsByTagName(s)[0];
   b.async=1;b.src=l+"wchat.min.js";o.parentNode.insertBefore(b,o)}
})(window,document,'script','https://cdn.smile-soft.com/wchat/v1/','Wchat','WchatSettings');

// Alternatively, you can initiate module like this
Wchat({
	pageid: "1234567890123"
}).initModule();
// in this case, you need to wait until the script loads and Wchat function will be loaded into global scope
```
#### Initiate module with settings
```js
window.WchatSettings = {
    pageid: "1234567890123",
    lang: "uk",
    intro: [{
        name: "uname",
        required: true,
        save: true
    }, {
        name: "email",
        placeholder: "Ваш логін"
    }, {
        name: "message"
    }],
    offer: {
        from: "Онлайн підтримка",
        text: "Ми тут якщо потрібна допомога :)",
        inSeconds: 1
    },
    channels:[
        {
            type: "telegram",
            link: "tg://resolve?domain=CloutalkBot"
        },
        {
            type: "viber",
            link: "viber://pa?chatURI=cloutalk"
        },
        {
            type: "messenger",
            link: "http://m.me/185667542056310"
        },
        {
            type: "callback",
            task: "Incoming.Callback"
        }
    ]
};

(function(w,d,s,l,g,a,b,o){w[a]=w[a]||{};w[a].clientPath=w[a].clientPath||l;
   if(w[g]){w[g](w[a]||{})}else{b=d.createElement(s),o=d.getElementsByTagName(s)[0];
   b.async=1;b.src=l+"wchat.min.js";o.parentNode.insertBefore(b,o)}
})(window,document,'script','https://cdn.smile-soft.com/wchat/v1/','Wchat','WchatSettings');
````
#### Default settings
```js
var defaults = {
	allowedFileExtensions: [], // Allowed file types for uploading. No restriction if empty array provided. Ex: ['txt', 'gif', 'png', 'jpeg', 'pdf']
	autoStart: true, // Init module on page load
	buttonSelector: "", // DOM element[s] selector that opens a widget
	buttonStyles: {
		backgroundColor: 'rgba(255,255,255)',
		color: 'rgb(70,70,70)'
	},
	channels: [], // list of channels and their settings
	chat: true, // enable chat feature
	cleanPhoneNumber: true, // if true, a phone number string will be sanitized before validating with the regexp in the phonePattern field
	clientPath: 'https://cdn.smile-soft.com/wchat/v1/', // absolute path to the clients files. If not set, files requested from defaults.server + defaults.path.
	cobrowsing: false, // [deprecated] enable cobrowsing feature
	concentText: "", // message that contains the text of concent that user should accept in order to start a chat
	hideOfflineButton: false, // hide chat button if widget is offline
	host: window.location.host, // displayed in the email template
	intro: false, // whether or not to ask user to introduce him self before the chat session
	introMessage: "", // message that asks user for introduction
	lang: '', // widget language
	langFromUrl: true, // detect widget language from current url
	listeners: [], // list the events to subscribe for
	maxFileSize: 100, // maximum filesize to upload (MB), if 0 - no restrictions
	offer: false, // greet users on the web page
	path: '/ipcc/webchat/', // absolute path to the wchat folder
	phonePattern: /^\+?\d{10,12}$/, // regexp to validate a phone number
	prefix: 'swc', // prefix for CSS classes and ids. 
					// Change it only if the default prefix 
					// matches with existed classes or ids on the website
	position: 'right', // button position on the page
	reCreateSession: true,
	sounds: true,
	styles: {
		backgroundColor: '#74b9ff',
		color: '#FFFFFF'
	},
	stylesPath: '', // absolute path to the css flie
	themeColor: "",
	title: '',
	translationsPath: '', // absolute path to the translations.json flie
	webrtcEnabled: false,
	widget: true, // whether or not to add widget to the webpage
	widgetWindowName: 'wchat',
	widgetWindowOptions: 'left=10,top=10,width=350,height=550,resizable'
};
```
#### Initiate module without widget icon
```js
window.WchatSettings = {
    pageid: "1234567890123",
    widget: false,
    buttonSelector: '.chat-button'
};

(function(w,d,s,l,g,a,b,o){w[a]=w[a]||{};w[a].clientPath=w[a].clientPath||l;
   if(w[g]){w[g](w[a]||{})}else{b=d.createElement(s),o=d.getElementsByTagName(s)[0];
   b.async=1;b.src=l+"wchat.min.js";o.parentNode.insertBefore(b,o)}
})(window,document,'script','https://cdn.smile-soft.com/wchat/v1/','Wchat','WchatSettings');

// Alternatively, you can do it like this
var wchat = Wchat({ 
	page: '1234567890123', 
	... // any other settings
	widget: false })
document.getElementById('openWidget').addEventListener('click', wchat.openWidget, false);
wchat.initModule();
// in this case, you need to wait until the script loads and Wchat function will be loaded into global scope
```
#### Initiate module and subscribe to events
```js
window.WchatSettings = {
    pageid: "1234567890123",
    widget: false,
    buttonSelector: '.chat-button'
    listeners: [{
		name: 'widget/load’,
		handler: function(params, api) {
			api.setDefaultCredentials({ uname: 'Bob', phone: '0501234567' })
		}
	}, {
		name: 'message/new',
		handler: newMessageHandler
	}, {
		name: 'chat/close',
		handler: chatCloseHandler
	}]
};

(function(w,d,s,l,g,a,b,o){w[a]=w[a]||{};w[a].clientPath=w[a].clientPath||l;
   if(w[g]){w[g](w[a]||{})}else{b=d.createElement(s),o=d.getElementsByTagName(s)[0];
   b.async=1;b.src=l+"wchat.min.js";o.parentNode.insertBefore(b,o)}
})(window,document,'script','https://cdn.smile-soft.com/wchat/v1/','Wchat','WchatSettings');
```
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

#### `setDefaultCredentials`
Set default credentials. Cloud be used to auto-identify user before starting a chat.

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
