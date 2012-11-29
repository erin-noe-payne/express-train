var boilerplate = require('boilerplate'),
    path = require('path'),
    fs = require('fs'),
    ps = require('child_process');


module.exports = function (program) {
    var cmd = program.command('new <destination>')
        .option('-b, --boilerplate', 'A valid boilerplate to use for the new project');

    cmd.action(function (destination) {
        var source = cmd.boilerplate || 'default';
        var destination = path.resolve(process.cwd(), destination);

        boilerplate.generate(source, destination, function (err, stdout) {
            var install = ps.spawn('npm',['install'], {
                cwd: destination
            });

            install.stdout.pipe(process.stdout);
            install.stderr.pipe(process.stderr);
        });
    });

    /*var source = program.boilerplate || 'default';
     var destination = path.resolve(program.dir, program.args[1]);

     boilerplate.generate(source, destination, function(err) {
     if(err) return console.error(err);

     });*/
}