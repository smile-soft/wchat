module.exports = {
    log: function(){ log(arguments, 'log'); },
    info: function(){ log(arguments, 'info'); },
    warn: function(){ log(arguments, 'warn'); },
    error: function(){ log(arguments, 'error'); }
};

function log(args, method){
    var func = global.console[method] ? global.console[method] : global.console.log;
    if(global.localStorage.getItem('swc.debug')) {
        [].forEach.call(args, function(arg){
            func(getCurrentTime(), arg);
        });
        return;
    }
}

function getCurrentTime() {
    return new Date().toISOString();
}