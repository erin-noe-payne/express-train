# All Aboard!

Welcome to Express Train! Express Train is a framework for building [12 factor](http://www.12factor.net/) web applications in nodejs, based on [express 3](http://expressjs.com/).

To get started:
```
npm install -g express-train
```

Then create a new project by typing and get running! 

```
train new <projname>
cd projname
train run
```

# Why use Express Train?

Because express is excellent, but it makes no decisions for you and does not enforce any structure.  The result can be a steep learning curve for new developers to node, or to a given project. Even very good developers using the same tools to build towards the same goals can end up with very different products. And individuals or organizations can struggle to define a repeatable process or consistent structure for their web applications.

Our goal is to provide a framework that will make some reasonable decisions to get a new project up and running quickly and give a consistent structure for your web applications, without asking you to sacrifice any of the flexibility you are used to from express.  We also aim to provide a powerful and fully featured set of CLI tools to set up project scaffolding, explore your application, and define custom boilerplates for any situation.

# How it works


## The file structure

An express train project starts with a specific file structure:

```
app
  /controllers      -- application controllers (**autoinjected**)
  /lib              -- application specific modules (**autoinjected**)
  /middleware       -- application middleware (**autoinjected**)
  /models           -- application models (**autoinjected**)
  /public           -- static content (html, js, css, etc)
  /views            -- view templates (loaded into express' view engine)
  index.js          -- index file exports the express train application

bin                 -- executable scripts
doc                 -- documentation
config              -- environmental configuration files
test                -- tests

package.json        -- npm package.json (needs to have express-train as a dependency)
```

For a fully functioning example, you can view the [express train standard template](https://github.com/autoric/express-train/tree/1.x/boilerplates/standard). This is the default  project scaffolding that ships with Express Train.

## Modules (controllers, models, middleware, and libs)

**File names and variable names matter.** All files in the models, controllers, middleware, and lib directories are subject to autoinjection. To read about the exact mechanics check out [nject] (https://github.com/autoric/nject). Within the project, it means that...

 - Each of those directories is scanned recursively and each file is registered by filename as a dependency. Therefore no two files should have the same name.
 - Any module that exports an object will be registered as a constant.
 - Any module that exports a function will have dependencies injected by variable name. The function arguments will be matched against the registered dependencies (by file name). The return value of the function will be used when it is referenced as a dependency.

For an example, consider this project...

```
# ApiController, HomeController, routes, Authentication, Users and Blogs are registered.
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

/* app is a dependency provided by express train and is you express application.
   ApiController is injected with the return value from ApiController.js */
module.exports = function (app, ApiController) {

    app.get('/api/Users', ApiController.read);
    app.post('/api/Users/:id', ApiController.create)

}
```

## Dependencies and Application Lifecycle

Express Train does not have a strict application lifecycle. Instead each module is registered and its dependencies are declared. At application startup, the depedency tree is built and modules are resolved in whatever order needed to make sure each module gets what it needs. In addition to your modules, there are a couple 'reserved' dependencies provided by express train that can be injected into your modules:

 - app An [express 3 application] (http://expressjs.com/api.html).
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

# API

Express Train is meant to be installed and used globally. It provides a rich cli for creating boilerplates, building scaffolding for new projects, and running and development.

## CLI

To use the Express Train CLI, install the module globally with
```
npm install -g express-train
```

The cli is now available via
```sh
$ train <command>
```

All commands support --help for inline help on usage and options.

### train new <destination> [options]

Creates a new train project at the destination folder. Supports the following options:

- `-b, --boilerplate` Specify the project boilerplate to use. If left blank, will use your 'default' boilerplate - on install this will be the standard express train template. However you can specify any valid git url (will be cloned to make your new project), local directory (will be copied to make your new project) to be used as a template, or registered alias. See documentation on train boilerplate for more info.
- `-v, --verbose' Verbose output

### train run

This is a convenience method to start your application. Run from the root directory of an express trian project it will attempt to resolve a main file via package.json's main property or an index.js file in your application root directory, so in most cases it will be equivalent to `node .`. Otherwise it will require app/index.js and invoke the start() method.

### train cycle

Like train run, this is a convenience method for development. The app file will be resolved in the same way as run, but will be invoked using nodemon to stop / start the application on file changes.

### train console

Starts a standard node console in the context of your express train application. All dependencies are available on the global scope for easier inspection and expirementing. (models/Users.js will be available as Users, ApiController.js as ApiController and so on).

### train boilerplate <command>

Express train supports the concept of boilerplates. These are project templates that can be specified when you generate a new express train project. For example, you may have one template that you like to use for mobile applications, and another for realtime apps with socket.io.  A boilerplate is just a valid express train directory structure with any customizations or standard configuration you want to put in place. A boilerplate can be defined as a local directory structure that will be copied, or a git url which will be cloned.

### train boilerplate register <alias> <source>

Registers any valid directory or git url as a source with he given alias. On install express train provides two boilerplates - basic and train. It also registers 'train' as the default boilerplate that will be used in the absence of a -b option on train new.

```
train boilerplate register mobileTemplate ~/local/mobileTemplate
train boilerplate register singlePageApp https://github.com/autoric/example-template.git
train boilerplate register default singlePageApp

train new -b mobileTemplate
# creates a new project using mobileTemplate as the boilerplate

train new -b singlePageApp
# creates a new project using singlePageApp as the boilerplate

train new
# creates a new project using singlePageApp as the boilerplate
```

### train boilerplate view <alias>

Returns the source for an alias.

```
train boilerplate view singlePageApp
# returns https://github.com/autoric/example-template.git
```

### train boilerplate unregister <alias>

Deletes the alias for your boilerplate.

## Programmatic API

**train(directory, [locations])**

*directory* - The root directory of a correctly formatted express-train file structure.

*locations* - A configuration object representing the location of directories and configuration files relative to the application directory, which directories will be autoinjected and which will be aggregated. Allows you to override Express Train defaults. Possible locations and their default values:

```
{
    pkg:{
        path: '../package.json'
    },
    config:{
        path: '../config'
    },
    logs:{
        path: '../logs'
    },
    views: {
        path: 'views'
    },
    pub: {
        path: 'public'
    },
    models: {
        path: 'models',
        autoinject: true,
        aggregateOn: 'models'
    },
    lib: {
        path: 'lib',
        autoinject: true
    },
    controllers: {
        path: 'controllers',
        autoinject: true
    },

    middleware: {
        path: 'middleware',
        autoinject: true
    }
}
```

Creates and runs an express train application.

```javascript
var train = require('express-train');

//setup an application with a custom config file location
train(__dirname, { config: {path: '/etc/myproject/config.json'}});
```

# Credits

Express Train was heavily influenced by the work of Skookum and [Base12](https://github.com/Skookum/base12).  Many thanks for sharing their work and ideas with the community!

#License

(The MIT License)

Copyright (c) 2012 Erin Noe-Payne

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
