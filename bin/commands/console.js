var repl = require('repl'),
    _ = require('lodash'),
    path = require('path'),
    train = require('../../lib/app'),
    resolveProjectRoot = require('../../lib/resolveProjectRoot'),
    history = require('repl.history');

module.exports = function (program) {
    var cmd = program.command('console')
        .usage('console [file]')
        .description('Opens an interactive node console with the your express train application loaded. Each registered ' +
        'dependency is available globally on the command line. Defaults to loading app/index.js, unless a ' +
        'main file is specified');

    cmd.action(function () {
        var fileArg = process.argv[3]

        var historyPath = path.join(__dirname, '../../.console_history');

        var r = repl.start({
            prompt: '> ',
            input: process.stdin,
            output: process.stdout
        });

        history(r, historyPath);

        r.on('exit', process.exit);

        console.log('console starting ...')
        var app = require(resolveProjectRoot(fileArg));
        app.on('error', function(err){
            console.error(err)
        });

        app.on('resolved', function(resolved){
            console.log('console ready ...')
            _.extend(r.context, resolved);
        });

        app.resolve()
    });

}
