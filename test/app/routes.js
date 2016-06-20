var path = require('path');
module.exports = function(app){
   app.get('/', function (req, res, next){
	res.append('Content-Type', 'text/html; charset=windows-1251');
	res.sendFile(path.resolve('app/views/index.html'));
   });

   app.get('/products', function (req, res, next){
	res.sendFile(path.resolve('app/views/products.html'));
   });

   app.get('/solutions', function (req, res, next){
	res.sendFile(path.resolve('app/views/solutions.html'));
   });
};
