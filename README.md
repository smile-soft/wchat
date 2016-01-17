# Wchat.js
### About
Official javascript webchat module for Smile IPCC
[Detailed about Smile IP Contact Center](https://smile-soft.com/index.php/en/ipcc-overview)
### Prerequisites
This module could be used only with the installed Smile IPCC server and appropriate licence must be purchased.
[Read the full documentation](http://smile-soft.com/resources/ru/Smile%20IPCC%20Webchat.pdf)
### Examples
### Getting Started
1. Download all files from 'dist' folder and put them to the website's folder on the webserver, where your website/web application is hosted.
2. Add a script tag to the webpages where the module should be loaded.
```html
<script src="wchat.min.js"></script>
```
**Note**: do not use non minified version of the script, it's very big and is used only for debugging purposes.
3. Add a link tag to the webpages where the module should be loaded.
```html
<link href="main.css"></link>
```
4. Initiate module with the appropriate options (the options are listed below).
```js
Wchat({ server: 'http://ipcc-server-domain.com:8880' }).initModule();
```

Option            | Type    | Default     | Description
------------------|---------|-------------|-----------------
server            | String  |             | IPCC server IP address and http port
title             | String  | Live chat   | Displayed in the widget's header element. Usualy a company/service name
lang              | String  | en          | Default language of interface and dialog. Used when automaticaly determined user language is not supported (ask your IPCC administrator for additional information). Possible values are `en`, `uk`, `ru`
widget            | Boolean | true        | Whether the webchat widget should be opened within the main tab (if `true`) or in a separate window (if `false`)
position          | String  | right       | Widget position on the page. Actual if `widget` is set to true. Possiblr values are `right` and `left`
hideOfflineButton | Boolean | false       | If set to `true`, then the widget button will be hidden when none of the IPCC agents is not registered
intro             | Array   | []          | If defined, then the user must introduce him/herself before starting a dialog. [Read more](#setting-intro)
offer             | Object  | false       | When set, the predefined message would be shown to the user after a certain number of minutes. [Read more](#setting-offer)
styles            | Obejct  |             | A basic widget styles. [Read more](#setting-styles)
buttonStyles      | Object  |             | A set of widget's button styles. [Read more](#setting-button-styles)
path              | String  |             | Absolute path to the module's folder on the web server

### API
Module's API exposes the following methods
#### `initModule()`
Initiate module with all the options set and all the events subscribed.
#### `openWidget()`
Open webchat widget in the separate window.
#### `initChat()`
Initiate dialog
#### `on`
Subscribe to event
#### `emit`
Emit event

### Events
Module emits the following events
#### `session/create`
#### `session/continue`
#### `session/join`
#### `session/disjoin`
#### `widget/load`
#### `widget/init`
#### `chat/start`
#### `chat/close`
#### `chat/send`
#### `chat/timeout`
#### `chat/languages`
#### `message/new`
#### `message/typing`
#### `form/submit`
#### `Error`

### Setting Intro
### Setting Offer
### Setting Styles
### Setting Button Styles
### Browser Support
Google Chrome (latest)
Mozilla Firefox (latest)
Safari
Opera (latest)
IE 10+
Microsoft Edge

### License
