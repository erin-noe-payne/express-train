var path = require('path'),
    fs = require('fs'),
    ps = require('child_process'),
    spawn = require('child_process').spawn
_ = require('underscore');

module.exports = function (program) {
    var cmd = program.command('cycle')
        .usage('runs the express train application using nodemon to restart on file change for easier development')
        .option('-d, --debug', 'Node process will listen on debug port');

    cmd.action(function () {
        //todo: support main or index.js using require.resolve( process.cwd() );
        var appPath = path.join(process.cwd(), '/app/index.js');
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

        var nodemon = spawn('./node_modules/express-train/node_modules/.bin/nodemon', args, {
            cwd:process.cwd()
        });

        nodemon.stdout.pipe(process.stdout);
        nodemon.stderr.pipe(process.stderr);
    });
}