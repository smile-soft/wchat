(function(window, document){
	
	var opts = JSON.parse(window.sessionStorage.getItem('wchat_options')),
		wchat;

	console.log('chat options: ', opts, window.sessionStorage.getItem(opts.prefix+'.sid'));

	function init(){

		// console.log('chat options: ', opts, window.sessionStorage.getItem(opts.prefix+'.sid'));

		opts.widget = true;
		// set external flag to indicate that the module loads not in the main window
		opts.external = true;
		wchat = Wchat(opts);
		wchat.on('widget/init', function(){
			wchat.initWidgetState();
		});
		wchat.initModule();
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

	poll(function(){
		// console.log(typeof Wchat !== 'undefined');
		// console.log(opts.prefix+'.init');
		// console.log(window.localStorage.getItem(opts.prefix+'.init'));
		return (typeof Wchat !== 'undefined' && window.sessionStorage.getItem(opts.prefix+'.init') !== null);
	}, function(){
		init();
	}, function(){
		window.reload();
	}, 120000);

})(window, document);