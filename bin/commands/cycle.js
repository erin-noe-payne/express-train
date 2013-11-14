var path = require('path'),
    fs = require('fs'),
    ps = require('child_process'),
    spawn = require('child_process').spawn,
    _ = require('lodash');

module.exports = function (program) {
    var cmd = program.command('cycle')
        .usage('cycle [file]')
        .description('runs the express train application using nodemon to restart on file change for easier development')
        .option('-d, --debug', 'Node process will listen on debug port');

    cmd.action(function () {
        var appPath = process.argv[3] || path.join(process.cwd(), '/app');
        var args = [];

        try {
            appPath = require.resolve(process.cwd());
            args = [appPath];
        }
        catch(err){
            var runnerPath = path.join('./node_modules/express-train/lib/runner')
            args = [runnerPath, appPath];
        }

        if(cmd.debug) {
            args.unshift('--debug');
        }

        var nodemon = spawn(path.resolve('./node_modules/express-train/node_modules/.bin/nodemon'), args, {
            cwd:process.cwd()
        });

        nodemon.stdout.pipe(process.stdout);
        nodemon.stderr.pipe(process.stderr);
    });
}