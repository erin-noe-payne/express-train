var path = require('path');

module.exports = function (program) {
    var cmd = program.command('run')
        .usage("runs the express train application");

    cmd.action(function () {
        var canResolve=false;
        try {
            canResolve = require.resolve(process.cwd());
        }
        catch(e) {}

        if(canResolve) {
            require(process.cwd());
        }
        else {
            var appPath = path.join(process.cwd(), '/app/index.js');
            require(appPath)
        }
    });

}
