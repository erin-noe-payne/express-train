var should = require('should'),
  path = require('path'),
  fs = require('fs'),
  _ = require('lodash'),
  train = require('../lib/app');


var BASE_DIR = path.resolve(__dirname, 'scaffold'),
  APP_DIR = path.join(BASE_DIR, 'app');
var MODULE_TEMPLATE = 'module.exports = function(){return true}';

describe('express-train', function () {

  var dirStructure = {
    config: {
      'default.json'   : '{"name":"max"}',
      'production.json': '{"name":"bart"}',
      'handlebars.json': '{"name":"{{NAME}}"}'
    },
    app   : {
      controllers          : {
        '.hiddenFile'     : 1,
        '.hiddenDirectory': {
          'burried.js': 1,
          'content.js': 1
        },
        'ApiCtrl.js'      : 1,
        'ViewCtrl.js'     : 1
      },
      lib                  : {},
      middleware           : {
        subDirectory   : {
          'SubMiddleware.coffee': 1
        },
        'Middleware.js': 1
      },
      models               : {
        'Users.coffee': 1,
        'Accounts.js' : 1,
        'Banks.json'  : '{}'
      },
      'configOverride.json': '{"name":"william"}'
    }
  };

  /*
   Clean up any required directory.  This is useful if the test don't run
   fully to completion and leave any directory behind.  So, what happens
   then is that we might get a 'file already exists' error.
   */
  before(function () {
    cleanup(BASE_DIR)
  });

  beforeEach(function () {
    hydrate(dirStructure, BASE_DIR)
  });

  afterEach(function () {
    cleanup(BASE_DIR)
    delete process.env.NODE_ENV
  });

  describe('app', function () {
    it('returns an unresolved nject tree object', function () {
      var tree = train({base: APP_DIR})
      tree.should.be.an.instanceOf(Object)
      should.exist(tree._registry)
      should.exist(tree._resolved)
      tree._resolved.should.eql({})
    });

    it('the tree should support resolved event', function (done) {
      var tree = train({base: APP_DIR})

      tree.on('resolved', function () {
        done();
      });

      tree.resolve();
    });

    it('provides a the config constant', function (done) {
      var tree = train({base: APP_DIR})

      tree.resolve(function (err, app) {
        app.config.should.be.an.instanceOf(Object);
        done()
      });
    });

    it('respects global include patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          'controllers/**'
        ]
      });

      tree.resolve(function (err, resolved) {
        resolved.ApiCtrl.should.exist
        resolved.ViewCtrl.should.exist
        done()
      })
    })

    it('correctly walks nested directories', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          'middleware/**'
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        done()
      })
    })


    it('respects include patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          'middleware/**/*.js',
          'models/**'
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.not.exist(resolved.SubMiddleware)
        should.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)
        done()
      })
    })

    it('should default to a ** include if given only exclude patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee'
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.ApiCtrl)
        should.exist(resolved.ViewCtrl)
        should.not.exist(resolved.SubMiddleware)
        should.exist(resolved.Middleware)
        should.not.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)

        done()
      });
    });

    it('should respect multiple exclude patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee',
          '!middleware/**'
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.ApiCtrl)
        should.exist(resolved.ViewCtrl)
        should.not.exist(resolved.SubMiddleware)
        should.not.exist(resolved.Middleware)
        should.not.exist(resolved.Users)
        should.exist(resolved.Accounts)
        should.exist(resolved.Banks)

        done()
      });
    });

    it('should exclude files only from a specified include pattern', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee',
          'middleware/**'
        ]
      });

      tree.resolve(function (err, resolved) {
        should.not.exist(resolved.ApiCtrl)
        should.not.exist(resolved.ViewCtrl)
        should.not.exist(resolved.SubMiddleware)
        should.exist(resolved.Middleware)
        should.not.exist(resolved.Users)
        should.not.exist(resolved.Accounts)
        should.not.exist(resolved.Banks)

        done()
      });
    });

    it('should accept object syntax for file patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        done()
      });
    });
    it('should accept aggregate strings for specific patterns', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**', aggregateOn: 'middleware'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.Middleware)
        should.exist(resolved.SubMiddleware)
        should.exist(resolved.middleware)
        should.exist(resolved.middleware.Middleware)
        should.exist(resolved.middleware.SubMiddleware)
        done()
      });
    });
    it('should place a loaded module on more than one aggregate key where there is overlap', function (done) {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**', aggregateOn: 'middleware'},
          {pattern: '**/*.coffee', aggregateOn: 'coffee'}
        ]
      });

      tree.resolve(function (err, resolved) {
        should.exist(resolved.middleware)
        should.exist(resolved.middleware.Middleware)
        should.exist(resolved.middleware.SubMiddleware)
        should.exist(resolved.coffee)
        should.not.exist(resolved.coffee.Middleware)
        should.exist(resolved.coffee.SubMiddleware)
        done()
      });
    });

    describe('config', function () {
      it('if node env is not set, defaults to default.json', function (done) {
        process.env.NODE_ENV = undefined;

        var tree = train({base: APP_DIR})

        tree.resolve(function (err, app) {
          app.config.name.should.equal('max');
          done();
        });
      });

      it('loads based on NODE_ENV', function (done) {
        process.env.NODE_ENV = 'production';

        var tree = train({base: APP_DIR})

        tree.resolve(function (err, app) {
          app.config.name.should.equal('bart')
          done()
        });
      })

      it('if NODE_ENV does not match a config, defaults to default.json', function (done) {
        process.env.NODE_ENV = 'test';
        var tree = train({base: APP_DIR})

        tree.resolve(function (err, app) {
          app.config.name.should.equal('max')
          done()
        });
      })

      it('is handlebars compiled against env variables', function (done) {
        process.env.NODE_ENV = 'handlebars';
        process.env.NAME = 'ted';

        var tree = train({base: APP_DIR})

        tree.resolve(function (err, app) {
          app.config.name.should.equal('ted')
          done()
        });
      });
    });
  });

  xdescribe('callbacks', function () {
    it('should call onConfiguration if provided', function (done) {
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function (tree, config) {
            done()
          }
        }
      })
    })

    it('should call onConfiguration prior to adding configuration', function (done) {
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function (tree, config) {
            tree.isRegistered('config').should.be.false
            config.name.should.equal('max')
            done()
          }
        }
      })
    })

    it('should call onConfiguration prior to adding configuration', function (done) {
      var calledInfo = false;
      train(APP_DIR, {
        callbacks: {
          onConfiguration: function (tree, config) {
            tree.on('info', function (msg) {
              calledInfo = true;
            })
          }
        }
      }).resolve(function (err, res) {
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


