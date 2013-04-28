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
/*
TODO: ideas -
replace loc with a config object that takes locations, autoinject locations and aggregate on keys so users can add or remove their own autoinject locations
 */
function createApplication(dir, locs) {
    catchErrors();

    var app = express(),
        locations = _.defaults((locs || {}), LOCATIONS);
        tree = new nject.Tree();

    app.set('views', path.join(dir, locations.views.path));
    app.set('public', path.join(dir, locations.pub.path));

    var config = loadConfig(path.join(dir, locations.config.path));

    tree.constant('app', app);
    tree.constant('config', config);

    _.each(_.where(locations, {autoinject: true}), function(location) {
        traverseAndRegister(path.join(dir, location.path), tree, location.aggregateOn)
    });

    return tree.resolve();
}

function traverseAndRegister(p, tree, aggregateOn) {
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
    else if (stat.isDirectory()) {
        var files = fs.readdirSync(p);
        files.forEach(function (file) {
            var filePath = path.join(p, file);
            traverseAndRegister(filePath, tree, aggregateOn);
        });
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
    var env = process.env.NODE_ENV;

    var configFile = path.join(p, env + '.json');

    if (!fs.existsSync(configFile)) {
        configFile = path.join(p, 'default.json');
    }

    var config = require(configFile);
    var template = hbs.compile(JSON.stringify(config));
    return JSON.parse(template(process.env));
}




