# All Aboard!

Welcome to Express Train! Express Train is a framework for building [12 factor](http://www.12factor.net/) web applications in nodejs, based on [express 3](http://expressjs.com/).

To get started:
```
npm install -g express-train
```


# Why use Express Train?

Because express is excellent, but it makes no decisions for you and does not enforce any structure.  The result can be
a steep learning curve for new developers to node, or to a given project. Even very good developers using the same
tools to build towards the same goals can end up with very different products. And individuals or organizations can
struggle to define a repeatable process or consistent structure for their projects.

Our goal is to provide a framework that will make some reasonable decisions to get a new project up and running
quickly and give a consistent structure for your web applications, without asking you to sacrifice any of the
flexibility you are used to from express.  We also aim to provide a powerful and fully featured set of CLI tools to
set up project scaffolding, explore your application, and define custom boilerplates for any situation.

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
init                -- files that will run after configuration, to help initialize the state of the app
test                -- tests

package.json        -- npm package.json (needs to have express-train as a dependency)
constants.json      -- universal application configuration file
.env.js             -- environment-specific configuration file
```

For a fully functioning example, you can view [express-train-template](https://github.com/autoric/express-train-template). This is the default project scaffolding
that ships with Express Train.

## Modules (controllers, models, middleware, inits and libs)

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

## Autoloading

Express Train does a small amount of magic to glue your files together.  The app argument received by each of your
modules is an express 3 application and conforms entirely to the [express api](http://expressjs.com/api.html).

Module loading is designed to be fairly flexible.  If you do not define an index.js, the loader will just call require() on each file in the directory and if that module returns a function as described above it will call that function and pass it the app instance.  If you want to take more control of which files are loaded or in what order they are loaded, you can add an index.js file. Index.js may conform to one of two signatures:

 - Express train module. This gives you the most control - and the resulting hash on app.models / middleware /
controllers will match the return value of the function.

```javascript

// models/index.js

module.exports = function(app) {
  return {
    people: require('./Users')(app)
  }
}
```

 - List.  This is a useful shorthand syntax in case you want to control the order in which files are loaded. Modules
will be loaded in the order declared in the list. This will mostly be used for the lib autoloader,
but may be important if there are interdependencies between models.

```javascript
// models/index.js

module.exports = ['Users', 'Blogs', 'Orders'];
```

On top of the standard express application, express train autoloads files from the project to extend the app in this order
object in this order:
    - config/[NODE_ENV].json -> app.config
    - init (init files are not loaded onto an object, but are invoked right after config)
    - app/models -> app.models
    - app/middleware -> app.middleware
    - app/controllers -> app.controllers
    - app/lib (lib files are not loaded onto an object, but are invoked before app start)

### Constants and Configuration

Application constants - configuration values that will not change from one environment / deployment to the next -
are written to constants.json.

Environmental configuration is stored by default in the config directory. These should be values specific to an environment,
such as database connection strings, http / https settings, port number, etc. When the application starts, it inspects NODE_ENV environmental variable and looks for a .json file in the config directory with a corresponding name (e.g. config/production.json).  If one is not found, it will look for config/default.json.   Because some web hosts expect apps to extract configuration parameters such as port number from environmental variables they set, express-train config file values will be compiled as handlebars templates with the environmental variables provided as data for the template.  As an example, if the environment is exposing a variable named MONGO_URL that represents the connection string for your MongoDB instance, your config file might have the following entry:

```javascript
{
  "mongoUrl": "{{MONGO_URL}}"
}
```

When config is complete, the values are all loaded on the app.config object, and so app.config.mongoUrl would evaluate to the value provided by the environment variable.

### Init

Initialization logic for the application which needs to happen after configs have been loaded, but before other modules have been loaded.  Examples include setting up a database connection or loading global functions that you expect to be used by other modules (e.g. a logging provider). 


### Models, middleware, controllers

By default, modules are loaded to these hashes based on their file name (models/Users.js is loaded on to app.models
.Users;  controllers/home.js to app.controllers.home and so on). However, as mentioned in Autoloading, if you want to take more control
you can add an index.js file. 

### Lib

The app/lib directory should contain your application libs.  These modules will set up your view engine,
define your routes, authentication, set up your middleware stack, or anything else you want to do with your
application. You can organize the files any way you want, but you will need an index.js file to define the order that
 the lib modules are invoked when they are autoloaded at run time.  Again, for a working example check the
 [express-train-template](https://github.com/autoric/express-train-template).

# API

Express Train is meant to be installed and used globally. It provides a rich cli for creating boilerplates,
building scaffolding for new projects, and running and development.

## CLI

To use the Express Train CLI, install the module globally with
```
npm install -g express-train
```

The cli is now available via
```sh
$ train
```

### train boilerplate

Express Train uses [boilerplate](https://github.com/pvencill/boilerplate) under the hood to generate your app.  It exposes that underlying functionality for your convenience

- register <alias> <source>
- unregister <alias>

### train new <destination>

Creates a new Express Train application 


## Programmatic API



# Credits

Express Train was heavily influenced by the work of Skookum and [Base12](https://github.com/Skookum/base12).  Many
thanks for sharing their work and ideas with the community!