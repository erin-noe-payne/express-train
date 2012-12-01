var //spawn = require('child_process').spawn,
    up = require('up'),
    path = require('path'),
    train = require('../../lib/app'),
    _ = require('underscore');

module.exports = function (program) {
    var cmd = program.command('run [workers]')
    //.option('-w, --workers', 'Number of worker processes to run, defaulting to number of cpus');

    var opts = {
        numWorkers:undefined,
        workerTimeout:undefined,
        title:undefined

    }

    cmd.action(function () {
        var args = _.toArray(arguments);
        var appPath = path.join(process.cwd(), '/app');

        var app = train(appPath);
        /*var srv = up(app.start(), appPath, {
            numWorkers:1
        });

        process.on('SIGUSR2', function () {
            srv.reload();
        });*/
        app.start();
    });
}