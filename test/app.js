var should = require('should'),
  path = require('path'),
  fs = require('fs'),
  _ = require('lodash'),
  train = require('../lib/app'),
  nject = require('nject');


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
      tree.should.be.an.instanceOf(nject.Tree)
      //should.exist(tree._registry)
      //should.exist(tree._resolved)
      //tree._resolved.should.eql({})
    });

    it('provides a the config constant', function() {
      var tree = train({base: APP_DIR})

      tree.resolve('config').should.be.an.instanceOf(Object);
    });

    it('respects global include patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          'controllers/**'
        ]
      });

      tree.resolve().should.have.keys(['config', 'ApiCtrl','ViewCtrl'])
    })

    it('correctly walks nested directories', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          'middleware/**'
        ]
      });

      tree.resolve().should.have.keys(['config', 'Middleware','SubMiddleware'])
    });


    it('respects include patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          'middleware/**/*.js',
          'models/**'
        ]
      });

      tree.resolve().should.have.keys(['config',
        'Middleware',
        'Users',
        'Accounts',
        'Banks'
      ]);
    });

    it('should default to a ** include if given only exclude patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee'
        ]
      });

      tree.resolve().should.have.keys(['config',
        'ApiCtrl',
        'ViewCtrl',
        'Middleware',
        'Accounts',
        'Banks',
        'configOverride'
      ]);
    });

    it('should respect multiple exclude patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee',
          '!middleware/**'
        ]
      });

      tree.resolve().should.have.keys(['config',
        'ApiCtrl',
        'ViewCtrl',
        'Accounts',
        'Banks',
        'configOverride'
      ]);
    });

    it('should exclude files only from a specified include pattern', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          '!**/*.coffee',
          'middleware/**'
        ]
      });

      tree.resolve().should.have.keys(['config',
        'Middleware'
      ]);
    });

    it('should accept object syntax for file patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**'}
        ]
      });

      tree.resolve().should.have.keys(['config',
        'Middleware',
        'SubMiddleware'
      ]);
    });

    it('should accept aggregate strings for specific patterns', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**', aggregateOn: 'middleware'}
        ]
      });

      var resolved = tree.resolve()

      resolved.should.have.keys(['config',
        'Middleware',
        'SubMiddleware',
        'middleware'
      ]);

      resolved.middleware.should.eql({
        Middleware: resolved.Middleware,
        SubMiddleware :resolved.SubMiddleware
      })

    });

    it('should place a loaded module on more than one aggregate key where there is overlap', function() {
      var tree = train({
        base : APP_DIR,
        files: [
          {pattern: 'middleware/**', aggregateOn: 'middleware'},
          {pattern: '**/*.coffee', aggregateOn: 'coffee'}
        ]
      });

      var resolved = tree.resolve()

      resolved.middleware.should.eql({
        Middleware: resolved.Middleware,
        SubMiddleware :resolved.SubMiddleware
      });

      resolved.coffee.should.eql({
        SubMiddleware : resolved.SubMiddleware,
        Users : resolved.Users
      })
    });

    describe('config', function () {
      it('if node env is not set, defaults to default.json', function() {
        process.env.NODE_ENV = undefined;

        var tree = train({base: APP_DIR})

        tree.resolve('config').name.should.equal('max');
      });

      it('loads based on NODE_ENV', function() {
        process.env.NODE_ENV = 'production';

        var tree = train({base: APP_DIR})

        tree.resolve('config').name.should.equal('bart');
      })

      it('if NODE_ENV does not match a config, defaults to default.json', function() {
        process.env.NODE_ENV = 'test';
        var tree = train({base: APP_DIR})

        tree.resolve('config').name.should.equal('max');

      })

      it('is handlebars compiled against env variables', function() {
        process.env.NODE_ENV = 'handlebars';
        process.env.NAME = 'ted';

        var tree = train({base: APP_DIR})

        tree.resolve('config').name.should.equal('ted');
      });
    });
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

});


