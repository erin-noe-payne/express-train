/**
 * module dependencies
 */

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    pkg = require('../package.json'),
    _ = require('underscore');

/**
 * expose `createApplication()`
 */

module.exports = createApplication;

/**
 * framework version
 */

exports.version = pkg.version;

/**
 * expose objects that can be overridden
 */

exports.locations = locations;

/**
 * Create a train application
 */

function createApplication(dir) {
    be_disposable();

    var app = express();
    app.dir = dir;
    app.load = load;
    app.start = start_app;

    var pkg = app.load(locations.pkg);
    app.constants = pkg.constants || {};
    app.constants.name = pkg.name;
    app.constants.locations = locations;
    app.config = app.load(locations.config);

    app.models = app.load(locations.models);
    app.middleware = app.load(locations.middleware);
    app.controllers = app.load(locations.controllers);

    configure_views(app);

    app.load(locations.lib);

    return app;
}

var locations = {
    pkg:'/../package.json',
    config:'/../.env.json',
    models:'/models',
    views:'/views',
    lib:'/lib',
    controllers:'/controllers',
    pub:'/public',
    middleware:'/middleware',
    locals:'/locals',
    tmp:'/../tmp'
};

function be_disposable() {
    process.on("uncaughtException", function (err) {
        console.error("Exiting process due to uncaught exception!");
        console.error(err.stack || err);
        process.exit();
    });
}

function load(p) {
    var app = this,
        loaded = {},
        stat;
    p = path.resolve(app.dir, p);
    stat = fs.statSync(p);
    if (stat.isDirectory()) {
        if (fs.existsSync(path.join(p, 'index.js'))) {
            loaded = require(p)(app);
        } else {
            var files = fs.readdirSync(p);
            files.forEach(function (file) {
                var filePath = path.join(p, file);
                var fileName = path.basename(p, path.extname(p));
                //TODO: should i make any check to see if the filepath is a file and .js?
                loaded[fileName] = require(filePath)(app);
            });
        }
    }
    else if (stat.isFile()) {
        loaded = require(p);
    }

    return loaded;
}

function configure_views(app) {
    //TODO: take view options out of config, that is not environment specific!
    app.set('view engine', app.config.view_engine);
    app.set('view options', app.config.view_options);
    app.set('views', app.dir + locations.views);
    app.set('public', app.dir + locations.pub);
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