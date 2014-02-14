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
 * expose `ExpressTrain()`
 */
module.exports = ExpressTrain;

/**
 * framework version
 */
ExpressTrain.version = package.version;

/**
 * expose objects that can be overridden
 */
var LOCATIONS = ExpressTrain.locations = {
    config: {
        path: '../config'
    },
    views: {
        path: 'views'
    },
    pub: {
        path: 'public'
    },
    models: {
        path: 'models',
        autoinject: true,
        aggregateOn: 'models'
    },
    lib: {
        path: 'lib',
        autoinject: true
    },
    controllers: {
        path: 'controllers',
        autoinject: true
    },
    middleware: {
        path: 'middleware',
        autoinject: true
    }
};

/**
 * Create a train application
 */
function ExpressTrain(dir, locs) {
    var app,
        config,
        locations = _.defaults((locs || {}), LOCATIONS),
        tree = new nject.Tree();

    config = loadConfig(path.resolve(dir, locations.config.path));
    tree.constant('config', config);

    _.each(_.where(locations, {autoinject: true}), function (location) {
        traverseAndRegister(path.resolve(dir, location.path), tree, location.aggregateOn)
    });

    //allow override of app
    if (!tree.isRegistered('app')) {
        app = express()
        app.set('views', path.join(dir, locations.views.path));
        app.set('public', path.join(dir, locations.pub.path));
        tree.constant('app', app);
    }

    return tree
}

function traverseAndRegister(p, tree, aggregateOn) {
    var stat,
        key = path.basename(p, path.extname(p));

    //ignore hidden files and directories
    if (key[0] == '.') return;

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

function loadConfig(p) {
    var configFile,
        env = process.env.NODE_ENV || 'default',
        stat = fs.statSync(p);

    //if config path is overridden with a specific file, respect that
    if (stat.isFile()) {
        configFile = p
    } else {
        configFile = path.join(p, env);

        try {
            require.resolve(configFile);
        } catch (e) {
            configFile = path.join(p, 'default');
            try {
                require.resolve(configFile);
            } catch (e) {
                var msg = 'Express train is unable to resolve a valid configuration file. A configuration file is expected in' +
                    'one of the following locations: \n' +
                    '  ' + path.join(p, env) + '\n' +
                    '  ' + path.join(p, 'default')

                throw new Error(msg)
            }
        }
    }

    var config = require(configFile);
    var template = hbs.compile(JSON.stringify(config));
    return JSON.parse(template(process.env));
}




