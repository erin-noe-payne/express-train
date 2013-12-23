var path = require('path'),
    resolveProjectRoot = require('../../lib/resolveProjectRoot');

module.exports = function (program) {
    var cmd = program.command('run')
        .usage('run [file]')
        .description("Runs the express train application. If a file is given, runs that file. Otherwise respects " +
            "package.json, falling back to the app directory");

    cmd.action(function () {
        var fileArg = process.argv[3];

        var app = require(resolveProjectRoot(fileArg));
        app.resolve()
    });

}
