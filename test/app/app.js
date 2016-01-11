var express = require('express');
var routes = require('./routes');
var path = require('path');
var app = express();

app.use(express.static(path.join(__dirname, 'public')));

routes(app);

app.listen(3000, function(){
   console.log('App is listening on 3000');
});
