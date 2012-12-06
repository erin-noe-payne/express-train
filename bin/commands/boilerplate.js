var boilerplate = require('boilerplate');

module.exports = function(program){
    var cmd = program.command('boilerplate <command>')
        .usage('<command> [options]');

    cmd.command('register <alias> <source>')
        .usage('register a boilerplate source with an alias for easier usage')
        .action(function(alias, source){
            console.log('registering template %s: %s', alias, source)
            boilerplate.register(alias, source);
        });

    cmd.command('unregister <alias>')
        .usage('unregister a boilerplate alias')
        .action(boilerplate.unregister);

    cmd.command('view <alias>')
        .usage('show the source for a boilerplate alias')
        .action(boilerplate.view);

    cmd.action(function(){
        var args = process.argv.slice(1);
        //console.log();
        cmd.parse(args)
    });
}