module.exports = {
    log: function(){ log(arguments, 'log'); },
    info: function(){ log(arguments, 'info'); },
    warn: function(){ log(arguments, 'warn'); },
    error: function(){ log(arguments, 'error'); }
};

function log(args, method){
    if(global.localStorage.getItem('swc.debug')) {
        [].forEach.call(args, function(arg){
            global.console[method] ? global.console[method](arg) : global.console.log(arg);
        });
        return;
    }
}