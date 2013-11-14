var path = require('path');

module.exports = function (program) {
    var cmd = program.command('run')
        .usage('run [file]')
        .description("Runs the express train application. If a file is given, runs that file. Otherwise respects " +
            "package.json, falling back to the app directory");

    cmd.action(function () {
        var appPath = process.argv[3]
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

        require(appPath)


    });

}
