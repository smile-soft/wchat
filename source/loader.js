(function(window, document){
	
	function init(){

		var opts = JSON.parse(window.sessionStorage.getItem('wchat_options')),
		wchat;

		console.log('chat options: ', opts);

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
		interval = interval || 100;

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
		return typeof Wchat !== 'undefined';
	}, function(){
		init();
	}, function(){
		window.reload();
	}, 20000);

})(window, document);