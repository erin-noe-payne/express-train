//var resource = require('express-resource');

module.exports = function(app) {
  
  // Home
  //app.resource(app.controllers.home);

  app.get('/', app.controllers.home.index);

  /**
   * should create 26 routes:
   *
   * /first (GET, POST)
   * /first/:first (GET, PUT, DELETE)
   * /first/:first/second (GET, POST)
   * /second/:second (GET, PUT, DELETE)
   * /second/:second/third (GET, POST)
   * /third/:third (GET, PUT, DELETE)
   * /second/:second/third/innersub (GET) <-- or should it be /third/:third/innersub? Where should mappings go when they're nested?
   * /first/:first/ii (GET, POST)
   * /ii/:ii (GET, PUT, DELETE)
   * /first/sub1 (GET, POST, PUT, DELETE) <-- or should it be /first/:first/sub1?
   * /first/sub2 (POST) <-- ditto
   */

  // A
  app.resource('first', function() {
    this.resource('second', function() {
      this.resource('third', function() {
        this.get('innersub');
      });
    });
    this.resource('ii');
    this.all('sub1');
    this.post('subtwo', 'sub2');
  });

};