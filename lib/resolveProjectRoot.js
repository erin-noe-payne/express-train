path = require('path')

module.exports = function(file) {

    var appPath = file

    if(!appPath) {
        var canResolve=false;
        try {
            canResolve = require.resolve(process.cwd());
        }
        catch(e) {}

        if(canResolve) {
            appPath = process.cwd();
        }
        else {
            appPath = path.join(process.cwd(), '/app');
        }
    }

    return appPath
}