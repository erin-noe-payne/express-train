var should = require('should'),
    path = require('path'),
    train = require('../index.js').app;

var appPath = path.join(process.cwd(), 'test/example/app');

describe('train app', function(){
  
  describe('config',function(){
    describe('when in development mode', function(){
      process.env.NODE_ENV = 'development';
      var app = train(appPath);
      var devJson = require('./example/config/development.json');

      it('should have the development-secret key', function(){
        app.config.cookie_secret.should.equal(devJson.cookie_secret);
      })
    })

    describe('when env does not match a file', function(){
      process.env.NODE_ENV = 'ferret';
      var app = train(appPath);
      var defaultCfg = require(path.join(appPath,'../config/default.json'));
      it('should have the default secret key', function(){
        app.config.cookie_secret.should.equal(defaultCfg.cookie_secret);
      })
    })

  })
})