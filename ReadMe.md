# Express train 3.x! What's new?

 - Drop dependency on express, no more app reserved variable. What does your application do? It's totally up to you!
 - No more default locations. Express train no longer expects a specific project structure.
 - Uses [node-glob](https://github.com/isaacs/node-glob) to define file patterns.

# Getting Started

Welcome to Express Train! Express Train is a framework for building applications in nodejs by walking your directory structure, building & resolving an [nject](https://github.com/autoric/nject) dependency tree.

# How it works

## Specifiy your project structure

Imagine you have a project like the one outlined below

```
app
  /controllers      -- application controllers
  /lib              -- application specific modules
  /middleware       -- application middleware
  /models           -- application models
  /public           -- static content (html, js, css, etc)
  /views            -- view templates (loaded into express' view engine)
  /test             -- your app tests
  index.js          -- index file bootstraps and exports the express train application

bin                 -- executable scripts
doc                 -- documentation
logs                -- logs
config              -- environmental configuration files
test                -- tests
```

You can use express-train to automatically walk your project structure, and process each file as a module in a dependency tree. You may write an index.js to process all application code, skipping public, views, and tests.

```javascript
//index.js
train = require('express-train')
tree = train({
    base : __dirname,
    files : [
        '**/*.js',
        '!{public, views, test}/**
    ]
})
```


## Modules (controllers, models, middleware, and libs)

**File names and variable names matter.** All files processed by express train are subject to autoinjection. To read about the exact mechanics check out [nject] (https://github.com/autoric/nject). Within the project, it means that...

 - Each file that is processed is registered by filename as a dependency. Therefore no two files should have the same name.
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
    app.js
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
// lib/app.js
module.exports = function () {
    return require('express')()
}
```

```javascript
// lib/routes.js
module.exports = function (app, ApiController) {

    app.get('/api/Users', ApiController.read);
    app.post('/api/Users/:id', ApiController.create)

}
```

## Dependencies and Application Lifecycle

Express Train does not have a strict application lifecycle. Instead each module is registered and its dependencies are declared. At application startup, the dependency tree is built and modules are resolved in whatever order needed to make sure each module gets what it needs. In addition to your modules, there is one 'reserved' dependencies provided by express train that can be injected into your modules

 - config **object** Your project's configuration object...

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
