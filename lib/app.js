/**
 * module dependencies
 */
var express = require('express'),
    fs = require('fs'),
    hbs = require('handlebars'),
    path = require('path'),
    package = require('../package.json'),
    _ = require('lodash'),
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
    pkg:{
        path: '../package.json'
    },
    config:{
        path: '../config'
    },
    logs:{
        path: '../logs'
    },
    models: {
        path: 'models',
        autoinject: true,
        aggregateOn: 'models'
    },
    views: {
        path: 'views'
    },
    lib: {
        path: 'lib',
        autoinject: true
    },
    controllers: {
        path: 'controllers',
        autoinject: true
    },
    pub: {
        path: 'public'
    },
    middleware: {
        path: 'middleware',
        autoinject: true
    }
};

/**
 * Create a train application
 */
function createApplication(dir, locs) {
    catchErrors();

    var app,
        config,
        locations = _.defaults((locs || {}), LOCATIONS),
        tree = new nject.Tree();

    config = loadConfig(path.join(dir, locations.config.path));
    tree.constant('config', config);

    _.each(_.where(locations, {autoinject: true}), function(location) {
        traverseAndRegister(path.join(dir, location.path), tree, location.aggregateOn)
    });

    //allow override of app
    if(!tree.isRegistered('app')) {
        app = express()
        app.set('views', path.join(dir, locations.views.path));
        app.set('public', path.join(dir, locations.pub.path));
        tree.constant('app', app);
    }

    return tree.resolve();
}

function traverseAndRegister(p, tree, aggregateOn) {
    var stat,
        key = path.basename(p, path.extname(p));

    //ignore hidden files and directories
    if(key[0]=='.') return;

    try {
        stat = fs.statSync(p);
    }
    catch (err) {
        throw new Error('File or directory ' + p + ' could not be found. This is necessary for your application to conform to the express train framework!');
    }

    if (stat.isDirectory()) {
        var files = fs.readdirSync(p);
        files.forEach(function (file) {
            var filePath = path.join(p, file);
            traverseAndRegister(filePath, tree, aggregateOn);
        });
    }
    else {
       var loaded = require(p);
        if (_.isFunction(loaded)) {
            tree.register(key, loaded, {
                identifier: p,
                aggregateOn: aggregateOn
            });
        }
        else {
            tree.constant(key, loaded, {
                identifier: p,
                aggregateOn: aggregateOn
            });
        } 
    }
}

function catchErrors() {
    process.on("uncaughtException", function (err) {
        console.error("Exiting process due to uncaught exception!");
        console.error(err.stack || err);
        process.exit();
    });
}

function loadConfig(p) {
    var configFile,
        env = process.env.NODE_ENV,
        stat = fs.statSync(p);

    //if config path is overridden with a specific file, respect that
    if(stat.isFile()) {
        configFile = p
    } else {
        configFile = path.join(p, env);

        if (!fs.existsSync(configFile)) {
            configFile = path.join(p, 'default');
        }
    }

    var config = require(configFile);
    var template = hbs.compile(JSON.stringify(config));
    return JSON.parse(template(process.env));
}




