var path = require('path'),
    fs = require('fs'),
    ps = require('child_process');
_ = require('underscore');

module.exports = function (program) {
    var cmd = program.command('cycle')
        .usage('runs the express train application with a watch on all files to restart on change for easier development')
        .option('-d, --debug', 'Node process will listen on debug port');

    //capture arbitrary options and pass them on
    cmd.action(function () {
        var appPath = path.join(process.cwd(), '/app/index.js');
        var runnerPath = path.join('./node_modules/express-train/lib/runner')
        var app;

        run();

        function run() {
            console.log('  \033[37mstarting application...\033[0m');
            app = ps.fork(runnerPath, [appPath, cmd.debug ? '--debug' : ''], {cwd:process.cwd()});

            app.once('exit', run);
        }


        function watch(dir, cb) {

        }
        //TODO: watch fires only once.
        fs.watch(path.join('.', 'package.json'), kill);

        function kill(){
            console.log('\n');
            console.log('  \033[37file change detected, killing application...\033[0m');
            app.kill('SIGKILL');
        }

    });
}