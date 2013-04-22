var boilerplate = require('boilerplate'),
    path = require('path'),
    fs = require('fs'),
    ps = require('child_process'),
    _ = require('underscore');

var templates = {
    'train-template-basic':path.resolve(__dirname, '../../boilerplates/basic'),
    'train-template-standard':path.resolve(__dirname, '../../boilerplates/standard'),
    'basic':'train-template-basic',
    'default':'train'
}

module.exports = function (program) {
    var cmd = program.command('new <destination>')
        .option('-b, --boilerplate <source>', 'A valid boilerplate to use for the new project')
        .option('-v, --verbose', 'Verbose output');

    cmd.action(function (destination) {
        registerTemplates();

        var source = cmd.boilerplate || 'default';
        var destination = path.resolve(process.cwd(), destination);

        boilerplate.generate(source, destination, function (err) {
            if (err) return console.error(err);
            var install = ps.spawn('npm', ['install', (cmd.verbose ? '--verbose' : '')], {
                cwd:destination
            });

            install.stdout.pipe(process.stdout);
            install.stderr.pipe(process.stderr);
            install.on('exit', function () {
                console.log('express train app is ready!');
                console.log('go to %s and type "train run" to get started', destination);
            })
        });
    });
}

function registerTemplates() {
    boilerplate.register('basic', path.resolve(__dirname, '../../boilerplates/basic'));
    boilerplate.register('train', path.resolve(__dirname, '../../boilerplates/standard'));
    if (!boilerplate.view('default')) {
        boilerplate.register('default', 'train');
    }
}
