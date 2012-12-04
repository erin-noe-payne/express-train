var spawn = require('child_process').spawn;

module.exports = function(program) {
    var cmd = program.command('cycle');

    //capture arbitrary options and pass them on
    cmd.action(function(){
        var appPath = path.join(process.cwd(), '/app/index.js');

        spawn('./node_modules/.bin/nodemon ', [appPath], {
            cwd: process.cwd()
        });
    });
}