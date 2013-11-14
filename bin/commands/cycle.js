var path = require('path'),
    fs = require('fs'),
    ps = require('child_process'),
    spawn = require('child_process').spawn,
    resolveProjectRoot = require('../../lib/resolveProjectRoot'),
    _ = require('lodash');

module.exports = function (program) {
    var cmd = program.command('cycle')
        .usage('cycle [file]')
        .description('runs the express train application using nodemon to restart on file change for easier development')
        .option('-d, --debug', 'Node process will listen on debug port');

    cmd.action(function () {
        var fileArg = process.argv[3]
        var args = [];

        var appPath = resolveProjectRoot(fileArg)
        args = [appPath];

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