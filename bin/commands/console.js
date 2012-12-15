var repl = require('repl'),
    path = require('path'),
    train = require('../../lib/app');

module.exports = function(program) {
    var cmd = program.command('console')
            .usage('opens an interactive node console with the your express train application available as "app"');

    //TODO: implement sandbox?
    cmd.action(function(){
        var appPath = path.join(process.cwd(), '/app');
        var app = train(appPath);

        var r = repl.start({
            prompt: '> ',
            input: process.stdin,
            output: process.stdout
        });

        r.on('exit', process.exit);

        r.context.app = app;
    });

}
