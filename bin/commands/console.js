var repl = require('repl'),
    path = require('path'),
    train = require('../../lib/app');

module.exports = function(program) {
    var cmd = program.command('console');

    //TODO: implement sandbox?
    cmd.action(function(){
        var appPath = path.join(process.cwd(), '/app');
        var app = train(appPath);

        var context = repl.start({
            prompt: '> ',
            input: process.stdin,
            output: process.stdout
        }).context;

        context.app = app;
    });

}
