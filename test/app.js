var should = require('should'),
    path = require('path'),
    fs = require('fs'),
    express = require('express'),
    _ = require('lodash'),
    train = require('../lib/app');

var BASE_DIR = path.resolve(__dirname, 'scaffold'),
    APP_DIR = path.join(BASE_DIR, 'app')
var MODULE_TEMPLATE = 'module.exports = function(){}';

describe('express-train', function () {

  var dirStructure = {
    config: {
      'default.json': '{"name":"max"}',
      'production.json': '{"name":"bart"}',
      'handlebars.json': '{"name":"{{NAME}}"}'
    },
    app: {
      controllers: {
        '.hiddenFile': 1,
        '.hiddenDirectory': {
          burried: 1,
          content: 1
        },
        ApiCtrl: 1,
        ViewCtrl: 1
      },
      lib: {},
      middleware: {},
      models: {
        Users: 1,
        Accounts: 1
      },
      public: {},
      views: {},
      'configOverride.json': '{"name":"william"}'
    }
  }

  var app;
  beforeEach(function () {
    hydrate(dirStructure, BASE_DIR)
  })

  afterEach(function () {
    cleanup(BASE_DIR)
    process.removeAllListeners('uncaughtException')
    delete process.env.NODE_ENV
    delete app;
  })

  describe('app', function () {
    it('returns an object', function () {
      train(APP_DIR, function (err, app) {
        app.should.be.an.instanceOf(Object)
      })
    })
    it('provides a the config constant', function () {
      app = train(APP_DIR, function (err, app) {
        app.config.should.be.an.instanceOf(Object)
      })
    })
    it('provides an express app via `app`', function () {
      app = train(APP_DIR, function (err, app) {
        should.exist(app.app)
        app.app.listen.should.be.an.instanceOf(Function)
      })
    })
    it('allows override of app if an app.js file is present', function () {
      var localDirStructure = _.cloneDeep(dirStructure),
          appFile = "module.exports = function(){return 'hello world'}";

      localDirStructure.app.lib.app = appFile;

      cleanup(BASE_DIR);
      hydrate(localDirStructure, BASE_DIR);

      app = train(APP_DIR, function (err, app) {
        app.app.should.equal('hello world');
      });
    })
    it('ignores files that begin with `.`', function () {
      app = train(APP_DIR, function (err, app) {
        should.not.exist(app['.hiddenFile'])
      })
    })
    it('ignores directories that begin with `.`', function () {
      app = train(APP_DIR, function (err, app) {
        should.not.exist(app.burried)
        should.not.exist(app.content)
      })
    })
    it('respects the locations override', function () {
      app = train(APP_DIR, {config: {path: 'configOverride.json'}}, function (err, app) {
        app.config.name.should.equal('william')
      })
    })
  })

  describe('config', function () {
    it('if node env is not set, defaults to default.json', function () {
      process.env.NODE_ENV = undefined;
      app = train(APP_DIR, function (err, app) {
        app.config.name.should.equal('max')
      })
    })
    it('loads based on NODE_ENV', function () {
      process.env.NODE_ENV = 'production';
      app = train(APP_DIR, function (err, app) {
        app.config.name.should.equal('bart')
      })
    })
    it('if NODE_ENV does not match a config, defaults to default.json', function () {
      process.env.NODE_ENV = 'test';
      app = train(APP_DIR, function (err, app) {
        app.config.name.should.equal('max')
      })
    })
    it('is handlebars compiled against env variables', function () {
      process.env.NODE_ENV = 'handlebars';
      process.env.NAME = 'ted';
      app = train(APP_DIR, function (err, app) {
        app.config.name.should.equal('ted')
      })
    })
  })
});

function hydrate(structure, location) {
  fs.mkdirSync(location)
  _.each(structure, function (definition, name) {
    var nextLocation = path.join(location, name)
    if (_.isObject(definition)) {
      hydrate(definition, nextLocation);
    } else {
      var template = MODULE_TEMPLATE
      if (_.isString(definition)) {
        template = definition
      }
      fs.writeFileSync(nextLocation, template)
    }
  });
}

function cleanup(dir) {
  var files = [];
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir);
    files.forEach(function (file, index) {
      var curPath = dir + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        cleanup(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
};
