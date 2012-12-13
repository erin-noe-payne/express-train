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
    });

    describe('when env does not match a file', function(){
      process.env.NODE_ENV = 'ferret';
      var app = train(appPath);
      var defaultCfg = require(path.join(appPath,'../config/default.json'));
      it('should have the default secret key', function(){
        app.config.cookie_secret.should.equal(defaultCfg.cookie_secret);
      })
    });

    describe('when there are handlebars tokens in the values', function(){
      process.env.NODE_ENV = 'production';
      process.env.PORT = 8080;
      var app = train(appPath);

      it('should inject an environment variable into the token', function(){
        app.config.http.port.should.equal(process.env.PORT);
      });
    });
  });

  describe('init', function(){
    describe('on app create', function(){
      var app = train(appPath);
      it('should load and execute files in the init directory', function(){
        // assumes the file in appdir/init will add this simple value
        should.exist(app.initValue);
      })
    })
  });
});