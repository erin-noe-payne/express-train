/**
 * module dependencies
 */

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    package = require('../package.json'),
    _ = require('underscore');

/**
 * expose `createApplication()`
 */

module.exports = createApplication;

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

function createApplication(dir, locs) {
    be_disposable();

    var locations = _.defaults(locs || {}, LOCATIONS);

    var app = express();
    app.dir = dir;
    app.load = load;
    app.start = start_app;

    app.set('views', path.join(app.dir, locations.views));
    app.set('public', path.join(app.dir, locations.pub));

    app.constants = app.load(locations.constants);
    app.config = app.load(locations.config);

    app.models = app.load(locations.models);
    app.middleware = app.load(locations.middleware);
    app.controllers = app.load(locations.controllers);

    app.load(locations.lib);

    return app;
}

var LOCATIONS = {
    pkg:'../package.json',
    constants:'../constants.json',
    config:'../.env.json',
    models:'models',
    views:'views',
    lib:'lib',
    controllers:'controllers',
    pub:'public',
    middleware:'middleware',
    locals:'locals',
    tmp:'../tmp'
};

function be_disposable() {
    process.on("uncaughtException", function (err) {
        console.error("Exiting process due to uncaught exception!");
        console.error(err.stack || err);
        process.exit();
    });
}

function load(p) {

    //if its a json file - just load it up
    //if its a file (not index.js), load and invoke with (app)
    //if it is a directory (with no index.js), load each file
    //if it is a directory with index.js, load that file
    //if it is index.js...
    //if it is a function, invoke with app
    //if it is an object / array ...
    //if the members are strings, require and invoke with app
    //if the members are functions, invoke with app

    var app = this,
        loaded = {},
        stat;
    p = path.resolve(app.dir, p);
    console.log(p);
    //TODO: if a file does not exist, should I throw an error?
    stat = fs.statSync(p);

    if (path.extname(p) == '.json') {
        loaded = require(p);
    }
    else if (stat.isFile()) {
        if (path.basename(p) == 'index.js') {
            loaded = require(p);
            if (_.isFunction(loaded)) {
                loaded = loaded(app);
            }
            else {
                _.each(loaded, function (val, i) {
                    if (_.isFunction(val)) {
                        loaded[i] = val(app);
                    }
                    else if (_.isString(val)) {
                        var filePath = path.join(p, '..', val);
                        if (path.extname(filePath) != '.js') {
                            filePath += '.js'
                        }
                        var fileName = path.basename(filePath, path.extname(filePath));
                        loaded[fileName] = app.load(filePath);
                    }
                });
            }
        }
        else {
            loaded = require(p)(app);
        }
    }
    else if (stat.isDirectory()) {
        var index = path.join(p, 'index.js');
        if (fs.existsSync(index)) {
            loaded = app.load(index)
        } else {
            var files = fs.readdirSync(p);
            files.forEach(function (file) {
                var filePath = path.join(p, file);
                var fileName = path.basename(filePath, path.extname(filePath));
                if (fs.statSync(filePath).isFile()) {
                    loaded[fileName] = app.load(filePath);
                }
            });
        }
    }

    return loaded;
}

function start_app() {
    var port;

    if (this.config.https) {
        port = this.config.https.port;

        // setup main https server
        this.server = require('https').createServer({
            key:fs.readFileSync(this.dir + this.config.https.key),
            cert:fs.readFileSync(this.dir + this.config.https.cert)
        }, this).listen(port);

        // setup forwarding http server if specified
        if (this.config.http) {
            require('http').createServer(
                function (req, res) {
                    res.writeHead(302, {'Location':'https://' + req.headers.host + req.url});
                    res.end();
                }).listen(this.config.http.port);
        }
    }

    else {
        port = this.config.port || this.config.http.port;
        this.server = this.listen(this.config.http.port);
    }

    console.log('[ ' + this.constants.name + ' ] worker listening on port ' + port);
    this.emit('listen', this.server);

    return this.server;
}