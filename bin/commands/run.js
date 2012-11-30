var //spawn = require('child_process').spawn,
    up = require('up'),
    path = require('path'),
    train = require('express-train'),
    _ = require('underscore');

module.exports = function(program) {
    /*var cmd = program.command('run');

    cmd.action(function(){
        var args = _.toArray(arguments);
        var up = spawn(up, arguments, {})

    })

    var up = path.resolve(__dirname, '../../node_modules/up/bin/up');
    var app = train.app(path.join(process.cwd(), '/app'));


    spawn('up', )*/

    var cmd = program.command('run [workers]');

    cmd.action(function(){
        var args = _.toArray(arguments);
        var appPath = path.join(process.cwd(), '/app')

        var app = train.app(appPath);
        var srv = up(app.start(), appPath);

        process.on('SIGUSR2', function () {
            srv.reload();
        });
    });



}