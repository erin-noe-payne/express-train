/**
 * module dependencies
 */

var express = require('express'),
    fs = require('fs'),
    hbs = require('handlebars'),
    path = require('path'),
    package = require('../package.json'),
    _ = require('underscore'),
    winston = require('winston'),
    nject = require('nject');

/**
 * expose `createApplication()`
 */

module.exports = createApplication;

/**
 * framework version
 */
createApplication.version = package.version;

/**
 * expose objects that can be overridden
 */
var LOCATIONS = createApplication.locations = {
    pkg:'../package.json',
    config:'../config',
    logs:'../logs',
    models:'models',
    views:'views',
    lib:'lib',
    controllers:'controllers',
    pub:'public',
    middleware:'middleware',
    locals:'locals'
};

/**
 * Create a train application
 */
function createApplication(dir, locs) {
    var log = winston;
    catchErrors(log);

    var app = express(),
        locations = _.defaults(locs || {}, LOCATIONS),
        tree = new nject.Tree();

    app.set('views', path.join(dir, locations.views));
    app.set('public', path.join(dir, locations.pub));

    var config = loadConfig(path.join(dir, locations.config));

    tree.constant('app', app);
    //TODO: probably create a new log here
    tree.constant('log', log);
    tree.constant('config', config);

    traverseAndRegister(path.join(dir, locations.lib), tree);
    traverseAndRegister(path.join(dir, locations.models), tree);
    traverseAndRegister(path.join(dir, locations.middleware), tree);
    traverseAndRegister(path.join(dir, locations.controllers), tree);
    tree.register('__appStart', function(app, config){
        return function(){
            var port = config.port || config.http.port || 3000;
            app.server = app.listen(port);

            console.log('[ express-train ] application listening on port ' + port);

            return app.server;
        }
    });

    tree.resolve();
    app.start = tree.resolved['__appStart'];

    return app;
}

function traverseAndRegister(p, tree) {
    var stat,
        key = path.basename(p, path.extname(p));

    try {
        stat = fs.statSync(p);
    }
    catch (err) {
        throw new Error('File or directory ' + p + ' could not be found. This is necessary for your application to conform to the express train framework!');
    }

    if (path.extname(p) == '.json' || path.extname(p) == '.js') {
        var loaded = require(p);
        if (_.isFunction(loaded)) {
            tree.register(key, loaded);
        }
        else {
            tree.constant(key, loaded);
        }
    }
    else if (stat.isDirectory()) {
        var files = fs.readdirSync(p);
        files.forEach(function (file) {
            var filePath = path.join(p, file);
            traverseAndRegister(filePath, tree);
        });
    }
}

function catchErrors(log) {
    process.on("uncaughtException", function (err) {
        log.error("Exiting process due to uncaught exception!");
        log.error(err.stack || err);
        process.exit();
    });
}

function loadConfig(p) {
    var env = process.env.NODE_ENV;

    var configFile = path.join(p, env+'.json');

    if(!fs.existsSync(configFile)) {
        configFile = path.join(p, 'default.json');
    }

    var config = require(configFile);
    var template = hbs.compile(JSON.stringify(config));
    return JSON.parse(template(process.env));
}




