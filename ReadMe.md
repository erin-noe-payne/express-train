# Express train 3.x! What's new?

 - Drop dependency on express, no more app reserved variable. What does your application do? It's totally up to you!
 - No more default locations. You define your directory structure.
 - Support for include and exclude patterns.

# Getting Started

Welcome to Express Train! Express Train is a framework for building web applications in nodejs, based on [express 3](http://expressjs.com/).

Express Train does not provide command line tools, and instead uses [yeoman](http://yeoman.io/index.html) to manage project scaffolding. 

To get started:
```sh
$ npm install -g yo generator-express-train
```

You are now ready to create and run new projects:
```
$ mkdir myProject && cd $_
$ yo express-train
$ node .
```

# Why use Express Train?

Because express is excellent, but it makes no decisions for you and does not enforce any structure.  The result can be a steep learning curve for new developers to node, or to a given project. Even very good developers using the same tools to build towards the same goals can end up with very different products. And individuals or organizations can struggle to define a repeatable process or consistent structure for their web applications - especially as projects grow in scale and complexity.

Fundamentally, you are still dealing with "just" an express application. Express Train makes no move to obscure or change express's api. However, we are providing some features around that application: 

 - A consistent directory structure. 
 - A powerful and flexible dependency injection system. 

# How it works

## The file structure

Out of the box, an express train project starts with a basic file structure:

```
app
  /controllers      -- application controllers (**autoinjected**)
  /lib              -- application specific modules (**autoinjected**)
  /middleware       -- application middleware (**autoinjected**)
  /models           -- application models (**autoinjected**)
  /public           -- static content (html, js, css, etc)
  /views            -- view templates (loaded into express' view engine)
  index.js          -- index file bootstraps and exports the express train application

bin                 -- executable scripts
doc                 -- documentation
logs                -- logs
config              -- environmental configuration files
test                -- tests
```

## Modules (controllers, models, middleware, and libs)

**File names and variable names matter.** All files in the models, controllers, middleware, and lib directories are subject to autoinjection. To read about the exact mechanics check out [nject] (https://github.com/autoric/nject). Within the project, it means that...

 - Each of those directories is scanned recursively and each file is registered by filename as a dependency. Therefore no two files should have the same name. Hidden files and directories (name starts with a '.') will be ignored.
 - Any module that exports an object will be registered as a constant.
 - Any module that exports a function will have dependencies injected by variable name. The function arguments will be matched against the registered dependencies (by file name). The return value of the function will be used when it is referenced as a dependency.

For an example, consider this project...

```
# ApiController, HomeController, routes, Authentication, Users and Blogs are registered on the nject dependency tree.
app
  /controllers
    ApiController.js
    HomeController.js
  /lib
    routes.js
  /middleware
    Authentication.js
  /models
    Users.js
  /public
  /views
  index.js
```

```javascript
// models/Users.js

var mongoose = require('mongoose');

/* This module has no dependencies */
module.exports = function () {
    var UserSchema = new mongoose.Schema({
        username:{ type:String, required:true, unique:true },
        email:{ type:String, required:false, unique:false },
        password:{ type:String, required:true}
    });

    /* This return value is what will be injected when Users is referenced */
    return mongoose.model('users', UserSchema);
}
```

```javascript
// controllers/ApiController.js

/* The Users variable is injected with the return value from Users.js, a mongoose model */
module.exports = function (Users) {

    return {
        read: function(req, res, next) {
            Users.find(...);
        },
        create: function(req, res, next) {
            Users.create(...)
        },
        ...
    }
}
```

```javascript
// lib/routes.js

/* app is a dependency provided by express train and is your express application.
   ApiController is injected with the return value from ApiController.js */
module.exports = function (app, ApiController) {

    app.get('/api/Users', ApiController.read);
    app.post('/api/Users/:id', ApiController.create)

}
```

## Dependencies and Application Lifecycle

Express Train does not have a strict application lifecycle. Instead each module is registered and its dependencies are declared. At application startup, the dependency tree is built and modules are resolved in whatever order needed to make sure each module gets what it needs. In addition to your modules, there are a couple 'reserved' dependencies provided by express train that can be injected into your modules:

 - app An [express 3 application] (http://expressjs.com/api.html). Note that for advanced use, you can [override app with a custom implementation](#overriding-app).
 - models An object that aggregates all of the files from the models directory onto a hash. The key / value pairs are the filename and the resolved model. 
 - config Your project's configuration object...

### Configuration

Environmental configuration is stored by default in the config directory. These should be values specific to an environment, such as database connection strings, port number, etc. When the application starts, it inspects NODE_ENV environmental variable and looks for a .json file in the config directory with a corresponding name (e.g. config/production.json).  If one is not found, it will look for config/default.json.   Because some web hosts expect apps to extract configuration parameters such as port number from environmental variables they set, express-train config file values will be compiled as handlebars templates with the environmental variables provided as data for the template.  As an example, if the environment is exposing a variable named MONGO_URL that represents the connection string for your MongoDB instance, your config file might have the following entry:

```javascript
{
  "mongoUrl": "{{MONGO_URL}}"
}
```

When config is complete, the values are all loaded on the app.config object, and so app.config.mongoUrl would evaluate to the value provided by the environment variable.

# Learn More...

For full documentation take a look at the [wiki](https://github.com/autoric/express-train/wiki)
