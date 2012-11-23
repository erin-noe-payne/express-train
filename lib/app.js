/**
 * module dependencies
 */

var express = require('express'),
    fs = require('fs'),
    path = require('path');

/**
 * expose `createApplication()`
 */

module.exports = createApplication;

/**
 * framework version
 */

exports.version = '1.0.0';

/**
 * expose objects that can be overridden
 */

exports.locations = locations;

/**
 * Create a base12 application
 */

function createApplication(dir) {
  be_disposable();

  var app = express();
  app.dir = dir;

  var pkg = load_obj(app, locations.pkg);
  app.constants = pkg.constants;
  app.constants.name = pkg.name;
  app.constants.locations = locations;
  app.config = load_obj(app, locations.config);
  
  app.models = load_fn(app, locations.models);
  app.middleware = load_fn(app, locations.middleware);
  app.controllers = load_fn(app, locations.controllers);

  app.start = start_app;

  configure_views(app);
  inject_into_views(app);
  init(app);

  return app;
}

var locations = {
  pkg: '/../package.json',
  config: '/../.env.json',
  models: '/models',
  views: '/views',
  lib: '/lib',
  controllers: '/controllers',
  pub: '/public',
  shared: '/shared',
  middleware: '/middleware',
  locals: '/locals',
  tmp: '/../tmp'
};

function be_disposable() {
  process.on("uncaughtException", function(err){
    console.warn("Exiting process due to uncaught exception!");
    console.warn(err.stack || err);
    process.exit();
  });
}

function load_obj(app, path) {
  var obj = require(app.dir + path);
  return obj;
}

function load_fn(app, subdir) {
  var dir = app.dir + subdir,
      obj = {},
      files = fs.readdirSync(dir),
      name, filepath, stat;
  files.forEach(function(file) {
    filepath = dir + '/' + file;
    stat = fs.statSync(filepath);
    if (!stat.isDirectory() && path.extname(file) === '.js') {
      name = path.basename(file, '.js');
      var fn = require(dir + '/' + name);
      obj[name] = fn(app);
    }
  });
  return obj;
}

function configure_views(app) {
  app.set('view engine', app.config.view_engine);
  app.set('view options', app.config.view_options);
  app.set('views', app.dir + locations.views);
  app.set('public', app.dir + locations.pub);
}

function inject_into_views(app) {
  app.locals.use(function(req, res) {
    res.locals.app = app;
  });
}

function init(app) {
  var lib = require(app.dir + locations.lib + '/index.json');
  var autorun = lib.autorun, task;
  autorun.forEach(function(file) {
    task = require(app.dir + locations.lib + '/' + file);
    task(app);
  });
}

function start_app() {
  var port;

  if (this.config.https) {
    port = this.config.https.port;

    // setup main https server
    this.server = require('https').createServer({
      key: fs.readFileSync(this.dir+this.config.https.key),
      cert: fs.readFileSync(this.dir+this.config.https.cert)
    }, this).listen(port);

    // setup forwarding http server if specified
    if (this.config.http) {
      require('http').createServer(function (req, res) {
        res.writeHead(302, {'Location': 'https://'+req.headers.host+req.url});
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
}