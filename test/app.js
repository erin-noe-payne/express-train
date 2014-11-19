var should  = require('should'),
  path      = require('path'),
  fs        = require('fs'),
  _         = require('lodash'),
  train     = require('../lib/app');


var BASE_DIR  = path.resolve(__dirname, 'scaffold'),
    APP_DIR   = path.join(BASE_DIR, 'app');
var MODULE_TEMPLATE = 'module.exports = function(){return true}';

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
          'burried.js': 1,
          'content.js': 1
        },
        'ApiCtrl.js': 1,
        'ViewCtrl.js': 1
      },
      lib: {},
      middleware: {
        subDirectory: {
          'SubMiddleware.coffee': 1
        },
        'Middleware.js': 1
      },
      models: {
        'Users.coffee': 1,
        'Accounts.js': 1,
        'Banks.json': '{}'
      },
      public: {},
      views: {},
      'configOverride.json': '{"name":"william"}'
    }
  };

  var app;
  /*
    Clean up any required directory.  This is useful if the test don't run
    fully to completion and leave any directory behind.  So, what happens
    then is that we might get a 'file already exists' error.
   */
  before(function () {
    cleanup(BASE_DIR)
    delete app;
  });

  beforeEach(function () {
    hydrate(dirStructure, BASE_DIR)
  });

  afterEach(function () {
    cleanup(BASE_DIR)
    delete process.env.NODE_ENV
    delete app;
  });

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

    it('respects global include patterns', function (done) {
      var tree = train(APP_DIR, {directories: [
        {path: 'controllers'}
      ]});

      tree.resolve(function (err, resolved) {
        resolved.ApiCtrl.should.exist
        resolved.ViewCtrl.should.exist
        done()
      })
    })

    it('correctly walks nested directories', function (done) {
      var tree = train(APP_DIR, {directories: [
        {path: 'middleware'}
      ]});

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        done()
      })
    })

    it('respects local include patterns', function (done) {
      var tree = train(APP_DIR, {directories: [
        {path: 'middleware', include: '**/*.js'},
        {path: 'models'}
      ]});

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.not.exist(resolved.SubMiddleware)
        should.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)
        done()
      })
    })

    it('respects global exclude patterns', function (done) {
      var tree = train(APP_DIR, {
        exclude: '**/*.coffee',
        directories: [
          {path: 'middleware'},
          {path: 'models'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.not.exist(resolved.SubMiddleware)
        should.not.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)
        done()
      })

    })

    it('respects local exclude patterns', function (done) {
      var tree = train(APP_DIR, {
        directories: [
          {path: 'middleware'},
          {path: 'models', exclude : '**/*.coffee'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        should.not.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)
        done()
      })
    })

    it('supports an array of include patterns', function(done){
      var tree = train(APP_DIR, {
        include : ['**/*.js', '**/*.coffee'],
        directories: [
          {path: 'middleware'},
          {path: 'models'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        should.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.not.exist(resolved.Banks)
        done()
      })
    })

    it('supports an array of exclude patterns', function(done){
      var tree = train(APP_DIR, {
        exclude : ['**/*.js', '**/*.coffee'],
        directories: [
          {path: 'middleware'},
          {path: 'models'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.not.exist(resolved.Middleware)
        should.not.exist(resolved.SubMiddleware)
        should.not.exist(resolved.Users)
        should.not.exist(resolved.Accounts)
        should.exist(resolved.Banks)
        done()
      })
    })
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
  });

  describe('callbacks', function() {
    it('should call onConfiguration if provided', function(done) {
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function (tree, config) {
            done()
          }
        }
      })
    })

    it('should call onConfiguration prior to adding configuration', function(done) {
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function(tree, config) {
            tree.isRegistered('config').should.be.false
            config.name.should.equal('max')
            done()
          }
        }
      })
    })

    it('should call onConfiguration prior to adding configuration', function(done) {
      var calledInfo = false;
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function(tree, config) {
            tree.on('info', function(msg) {
              calledInfo = true;
            })
          }
        }
      }).resolve(function(err, res) {
        calledInfo.should.be.true
        done()
      })
    })
  })

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

});


