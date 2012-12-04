var path = require('path');

module.exports = function (program) {
    var cmd = program.command('run [workers]');

    cmd.action(function () {
        var appPath = path.join(process.cwd(), '/app/index.js');

        require(appPath);
    });


    /*
     in both cases I want to pass on arbitrary command line options!
     train run: runs the application
     train cycle: uses nodemon to cycle the application
     allow index.js to give users ability to do whatever they want
     */
}
