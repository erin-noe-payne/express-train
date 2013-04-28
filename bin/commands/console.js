var repl = require('repl'),
    _ = require('underscore'),
    path = require('path'),
    train = require('../../lib/app'),
    history = require('repl.history');

module.exports = function(program) {
    var cmd = program.command('console')
            .usage('opens an interactive node console with the your express train application available as "app"');

    //TODO: implement sandbox?
    cmd.action(function(){
        var appPath = path.join(process.cwd(), '/app');
        var historyPath = path.join(__dirname, '../../.console_history');
        var app = require(appPath);

        var r = repl.start({
            prompt: '> ',
            input: process.stdin,
            output: process.stdout
        });

        history(r, historyPath);

        r.on('exit', process.exit);

        _.extend(r.context, app);
    });

}
