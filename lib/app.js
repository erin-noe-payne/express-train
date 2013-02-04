/**
 * module dependencies
 */

var express = require('express'),
    fs = require('fs'),
    hbs = require('handlebars'),
    path = require('path'),
    package = require('../package.json'),
    _ = require('underscore'),
    winston = require('winston');

/**
 * expose `createApplication()`
 */

module.exports = Application;

/**
 * framework version
 */

exports.version = package.version;

/**
 * expose objects that can be overridden
 */

exports.locations = LOCATIONS;

/**
 * Create a train application
 */

var log;

var LOCATIONS = {
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

//init, setup, start
var LIFECYCLE_STAGES = ['init', 'setup', 'start'];

function Application(dir, locs) {
    catchErrors();

    var locations = _.defaults(locs || {}, LOCATIONS);

    var app = express();
    _.extend(app, {
        log:winston,
        dir:dir,
        load:load,
        registerLifecycleCallbacks:registerLifecycleCallbacks,
        start:start,
        locations:locations
    });
    log = app.log;

    app.registerLifecycleCallbacks(locations.lib);

    app.set('views', path.join(app.dir, locations.views));
    app.set('public', path.join(app.dir, locations.pub));

    app.config = loadConfig(app.load(locations.config));
    app.emit('init', app);

    app.models = app.load(locations.models);
    app.middleware = app.load(locations.middleware);
    app.controllers = app.load(locations.controllers);
    app.emit('setup', app);

    return app;
}

function load(p) {

    //if its a json file - just load it up
    //if its a file load and invoke with (app)
    //if it is a directory (with no index.js), load each file
    //if it is a directory with index.js, load that file

    var app = this,
        log = this.log,
        loaded = {},
        stat;
    p = path.resolve(app.dir, p);

    try {
        stat = fs.statSync(p);
    }
    catch (err) {
        throw new Error('File or directory ' + p + ' could not be found. This is necessary for your application to conform to the express train framework!');
    }

    if (path.extname(p) == '.json') {
        loaded = require(p);
    }
    else if (stat.isFile()) {
        loaded = require(p)(app);
    }
    else if (stat.isDirectory()) {
        var index = path.join(p, 'index.js');
        if (fs.existsSync(index)) {
            loaded = app.load(index)
        } else {
            var files = fs.readdirSync(p);
            files.forEach(function (file) {
                var filePath = path.join(p, file);
                var extension = path.extname(filePath);
                var isDirectory = fs.statSync(filePath).isDirectory();
                //loads only js files or directories
                if (extension == '.js' || extension == '.json' || isDirectory) {
                    var fileName = path.basename(filePath, extension);
                    loaded[fileName] = app.load(filePath);
                }
            });
        }
    }

    return loaded;
}

function start() {
    //TODO: currently no https support, expect that to be handled by nginx, or for user to register a lib after start
    var port = this.config.port || this.config.http.port || 3000;
    this.server = this.listen(port);

    console.log('[ express-train ] application listening on port ' + port);
    //TODO: start event will not emit unless .start() is called. May need to add a mount listener?
    this.emit('start', this);

    return this.server;
}

function registerLifecycleCallbacks(libDir) {
    var app = this;

    //allow index.js or index.json
    var index = path.resolve(app.dir, libDir, 'index.json');
    if (!fs.existsSync(index)) {
        index = path.resolve(app.dir, libDir, 'index.js');
        if (!fs.existsSync(index)) {
            return;
        }
    }

    var events = require(index);

    _.each(events, function (libs, event) {
        //support onStart, onInit etc.
        event = event.toLowerCase();
        if (event.slice(0, 2) == 'on') {
            event = event.slice(2);
        }

        if (!_.contains(LIFECYCLE_STAGES, event)) {
            throw new Error('Unrecognized lifecycle stage ' + event + '. See express train documentation for details.');
        }
        if (_.isString(libs)) {
            listen(libs, event);
        }
        else if (_.isArray(libs)) {
            _.each(libs, function (lib) {
                listen(lib, event);
            });
        }
        else {
            throw new Error('Bad index.js. Event handlers should be a string or array referencing lib files. See express train documentation for details.');
        }
    });

    function listen(lib, event) {
        if (path.extname(lib) != '.js') {
            lib += '.js';
        }
        app.once(event, function () {
            app.load(path.join(libDir, lib));
        });
    }

}

function catchErrors() {
    process.on("uncaughtException", function (err) {
        log.error("Exiting process due to uncaught exception!");
        log.error(err.stack || err);
        process.exit();
    });
}

function loadConfig(configs) {
    var env = process.env.NODE_ENV;

    //TODO: there is overlap if config is overridden with a new file or directory. Unintended behavior possible.
    var config = configs[env] || configs.default || configs;
    var rendered = traverse(config);
    return rendered;

    //TODO: could stringify & parse - does that make more sense?
    function traverse(o) {
        _.each(o, function (val, key) {
            if (_.isObject(val)) {
                traverse(val);
            } else if (_.isString(val)) {
                o[key] = hbs.compile(val)(process.env);
            }
        })
        return o;
    }
}




