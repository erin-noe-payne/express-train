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
    delete process.env.NODE_ENV
    delete app;
  })

  describe('app', function () {
    it('returns an unresolved nject tree object', function () {
      var tree = train(APP_DIR)
      tree.should.be.an.instanceOf(Object)
      should.exist(tree._registry)
      should.exist(tree._resolved)
      tree._resolved.should.eql({})
    });

    it('the tree should support resolved event', function (done) {
      var tree = train(APP_DIR);

      tree.on('resolved', function () {
        done();
      });

      tree.resolve();
    });

    it('provides a the config constant', function (done) {
      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.config.should.be.an.instanceOf(Object);
        done()
      });
    });

    it('provides an express app via `app`', function (done) {
      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        should.exist(app.app);
        app.app.listen.should.be.an.instanceOf(Function);        done()
      });
    });

    it('allows override of app if an app.js file is present', function (done) {
      var localDirStructure = _.cloneDeep(dirStructure),
          appFile = "module.exports = function(){return 'hello world'}";

      localDirStructure.app.lib.app = appFile;

      cleanup(BASE_DIR);
      hydrate(localDirStructure, BASE_DIR);

      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.app.should.equal('hello world');
        done()
      });
    });

    it('ignores files that begin with `.`', function (done) {
      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        should.not.exist(app['.hiddenFile']);
        done()
      });
    });

    it('ignores directories that begin with `.`', function (done) {
      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        should.not.exist(app.burried);
        should.not.exist(app.content);
        done()
      });
    });

    it('respects the locations override', function (done) {
      var tree = train(APP_DIR, {config: {path: 'configOverride.json'}})

      tree.resolve(function (err, app) {
        app.config.name.should.equal('william');
        done()
      });
    });
  });

  describe('config', function () {
    it('if node env is not set, defaults to default.json', function (done) {
      process.env.NODE_ENV = undefined;

      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.config.name.should.equal('max');
        done();
      });
    });
    it('loads based on NODE_ENV', function (done) {
      process.env.NODE_ENV = 'production';

      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.config.name.should.equal('bart')
        done()
      });
    })
    it('if NODE_ENV does not match a config, defaults to default.json', function (done) {
      process.env.NODE_ENV = 'test';
      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.config.name.should.equal('max')
        done()
      });
    })
    it('is handlebars compiled against env variables', function (done) {
      process.env.NODE_ENV = 'handlebars';
      process.env.NAME = 'ted';

      var tree = train(APP_DIR)

      tree.resolve(function (err, app) {
        app.config.name.should.equal('ted')
        done()
      });
    });
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
