# All Aboard!

Welcome to Express Train! Express Train is a framework for building [12 factor](http://www.12factor.net/) web applications in nodejs, based on [express 3](http://expressjs.com/).

To get started:
```
npm install -g express-train
```


# Why use Express Train?

Because express is excellent, but it makes no decisions for you and does not enforce any structure.  The result can be a steep learning curve for new developers to node, or to a given project. Even very good developers using the same tools to build towards the same goals can end up with very different products. And individuals or organizations can struggle to define a repeatable process or consistent structure for their projects.

Our goal is to provide a framework that will make some reasonable decisions to get a new project up and running quickly and give a consistent structure for your web applications, without asking you to sacrifice any of the flexibility you are used to from express.  We also aim to provide a powerful and fully featured set of CLI tools to set up project scaffolding, explore your application, and define custom boilerplates for any situation.

# How it works


## The file structure

An express train project starts with a specific file structure:

```
app
  /controllers      -- application controllers (automatically loaded onto app.controllers)
  /lib              -- application specific modules you will use to glue your app together
  /middleware       -- application middleware (automatically loaded onto app.middleware)
  /models           -- application models (automatically loaded onto app.models)
  /public           -- static content (html, js, css, etc)
  /views            -- view templates (loaded into express' view engine)
  index.js          -- basic index file that will run your application

bin                 -- executable scripts
doc                 -- documentation
config              -- environmental configuration files
test                -- tests

package.json        -- npm package.json (needs to have express-train as a dependency)
```

For a fully functioning example, you can view [express-train-template](https://github.com/autoric/express-train-template). This is the default  project scaffolding that ships with Express Train.

## Modules (controllers, models, middleware, and libs)

All express-train modules will have the following signature

```javascript
module.exports = function(app) {
  var model = {/*...*/}
  return model;
}
```

An example model using [mongoose](https://github.com/LearnBoost/mongoose):
```javascript
// models/Users.js

var mongoose = require('mongoose');

module.exports = function (app) {
    var UserSchema = new mongoose.Schema({
        username:{ type:String, required:true, unique:true },
        email:{ type:String, required:false, unique:false },
        password:{ type:String, required:true}
    });

    return mongoose.model('users', UserSchema);
}
```

Following the same example, a controller might look like:
```javascript
// controllers/Home.js

module.exports = function (app) {
    var Users = app.models.Users;

    var controller = {};

    controller.index = function (req, res, next) {
            var username = req.params.username;
            Users.findOne({username:username}, {password:0}).exec(function (err, user) {
                if (err) return next(err);
                if (user === null) return res.send(404);
                res.locals.user = user;
                res.render('index');;
            })
        }

    controller.signup = function (req, res, next) {
            res.render('signup');
        }


    return controller;
}
```

## Autoloading and Application Lifecycle

The app argument received by each of your modules is an express 3 application - find the documentation at the [express api](http://expressjs.com/api.html). On top of the standard express application, Express Train autoloads files from the project to extend the app. At several stages, lifecycle events are fired, which are used to determine when your autoloaded lib files are invoked.

- app/lib (libs are registered to be autoloaded at a lifecycle event, according to an index.js file you define)
- config/[NODE_ENV].json -> app.config
  - lifecycle event: 'config' (you may want to initiate logging or db connections here)
- app/models -> app.models
- app/middleware -> app.middleware
- app/controllers -> app.controllers
  - lifecycle event: 'load' (set up middleware stack, route handlers, etc)
- application start
  - lifecycle event: 'start' (set up socket.io or other functionality requiring the http server)



### Configuration

Environmental configuration is stored by default in the config directory. These should be values specific to an environment, such as database connection strings, port number, etc. When the application starts, it inspects NODE_ENV environmental variable and looks for a .json file in the config directory with a corresponding name (e.g. config/production.json).  If one is not found, it will look for config/default.json.   Because some web hosts expect apps to extract configuration parameters such as port number from environmental variables they set, express-train config file values will be compiled as handlebars templates with the environmental variables provided as data for the template.  As an example, if the environment is exposing a variable named MONGO_URL that represents the connection string for your MongoDB instance, your config file might have the following entry:

```javascript
{
  "mongoUrl": "{{MONGO_URL}}"
}
```

When config is complete, the values are all loaded on the app.config object, and so app.config.mongoUrl would evaluate to the value provided by the environment variable.

### Models, middleware, controllers

By default, modules are loaded to these hashes based on their file name (models/Users.js is loaded on to app.models.Users;  controllers/home.js to app.controllers.home and so on). However if the directory contains an index.js file, that file will be loaded instead and override the default behavior, allowing you to take explicit control of the autoloading process. The index.js should be written as Express Train module. It will be invoked, and the return value will be loaded onto the corresponding hash.

```javascript
// models/index.js

module.exports = function(app) {
  return {
    people: require('./Users')(app),
    blogs: require('./Blogs')(app)
  }
}
//app.models.people, app.models.blogs are now available
```

### Lib

The app/lib directory will contain modules your application will use internally. Some of these, such as your routing and application middleware stack, you will want to autoload during application startup. Others you may not.

To configure autoloading, Express Train uses an index.js or index.json file. This file will tell express train which lib modules to autoload at which lifecycle stages of the application startup. The return value should be a json object in which each key is a valid lifecycle stage, and each value is either a string or array of strings for the file to be autoloaded. The order declared will be the order loaded.

```javascript
module.exports = {
    config: 'logging',
    load: ['views', 'routes', 'middleware'],
    start: 'socketio'
}
/*
    'config' event: app.config is now available. lib/logging.js will be loaded
    'load' event: app.models, app.middleware, app.controllers are now available. lib/views.js, lib/routes.js, lib/middleware.js will be loaded in that order
    'start' event: app.server, a node htttp server is now available. lib/socketio will be loaded
*/
```


# API

Express Train is meant to be installed and used globally. It provides a rich cli for creating boilerplates, building scaffolding for new projects, and running and development.

## CLI

To use the Express Train CLI, install the module globally with
```
npm install -g express-train
```

The cli is now available via
```sh
$ train
```

We are working on more documentation for the cli. In the meantime, use --help to view commands and options.

## Programmatic API

**train(directory, [locations])**

*directory* - The root directory of a correctly formatted express-train file structure.

*locations* - Object representing the location of directories and configuration files relative to the application directory. Allows you to override Express Train defaults for autoloading locations. Possible locations and their default values:

```
{
    pkg: '../package.json',
    config:'../config',
    logs: '../logs',
    models:'models',
    views:'views',
    lib:'lib',
    controllers:'controllers',
    pub:'public',
    middleware:'middleware',
    locals:'locals'
}
```

Creates an express train application, autoloading configuration, models, etc. Returns the Express Train application, which has not been started yet.

```javascript
var train = require('express-train');

var app = train(__dirname, { config: '/etc/labs/config.json'});
app.start();
```

# Credits

Express Train was heavily influenced by the work of Skookum and [Base12](https://github.com/Skookum/base12).  Many thanks for sharing their work and ideas with the community!
