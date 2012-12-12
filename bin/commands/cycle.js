var path = require('path'),
    spawn = require('child_process').spawn;

module.exports = function(program) {
    var cmd = program.command('cycle')
        .option('-d, --debug', 'Node process will listen on debug port');

    //capture arbitrary options and pass them on
    cmd.action(function(){
        var appPath = path.join('./app');

        //todo excvp() error?
        var nodemon = spawn('node_modules/.bin/nodemon', [cmd.debug?'--debug':'', appPath],{
            cwd: process.cwd()
        });

        nodemon.stdout.pipe(process.stdout);
        nodemon.stderr.pipe(process.stderr);
    });
}