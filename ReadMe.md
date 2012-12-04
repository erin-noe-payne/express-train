# All board!

Welcome to Express Train. Express Train is a framework for building [12 factor](http://www.12factor
.net/) web applications in nodejs, based on [express 3](http://expressjs.com/).

# Why use Express Train?

Because express is excellent, but it makes no decisions for you and does not enforce any structure.  The result can be
a steep learning curve for new developers to node, or to a given project. Even very good developers using the same
tools to build towards the same goals can end up with very different products. And individuals or organizations can
struggle to define a repeatable process or consistent structure for their projects.

Our goal is to provide a framework that will make some reasonable decisions to get a new project up and running
quickly and give a consistent structure for your web applications, without asking you to sacrifice any of the
flexibility you are used to from express.

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
config              -- sample configuration files
test                -- tests

package.json        -- npm package.json (needs to have express-train as a dependency)
.env.js             -- environment-specific configuration file
```

For a fully functioning example, you can view [express-train-template](https://github
.com/autoric/express-train-template). This is the default project scaffolding
that ships with Express Train.

## Modules (controllers, models, middleware and libs)

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

var mongoose = require('mongoose'),
    bcrypt = require('bcrypt');

module.exports = function (app) {
    var UserSchema = new mongoose.Schema({
        username:{ type:String, required:true, unique:true },
        email:{ type:String, required:false, unique:false },
        password:{ type:String, required:true, set: hash},
        subscriptions:[
            {type:mongoose.Schema.Types.ObjectId, ref:'comics'}
        ]
    });

    function hash(password){
        return bcrypt.hashSync(password, 10)
    }

    UserSchema.methods = {
        authenticate:function (password, cb) {
            return bcrypt.compare(password, this.password, cb);
        }
    }

    return mongoose.model('users', UserSchema);
}
```

Following the same an example, a controller might look like:
```javascript
// controllers/Home.js

module.exports = function (app) {
    var Users = app.models.Users;

    var controller = {};

    controller.userPage = function (req, res, next) {
            res.view = 'userpage.html';
            var username = req.params.username;
            Users.findOne({username:username}, {password:0}).populate('subscriptions').exec(function (err, user) {
                if (err) return next(err);
                if (user === null) return res.send(404);
                res.locals.viewData.owner = user;
                next();
            })
        }

    controller.signup = function (req, res, next) {
            res.view = 'signup.html';
            next();
        }


    return controller;

}
```

## Autoloading

Express Train does a small amount of magic to glue your files together.  The app argument received by each of your
modules is an express 3 application and conforms entirely to the [express api](http://expressjs.com/api.html).

On top of the standard express application, express train autoloads files from the project in this order:
    - .env.js -> app.config
    - app/models -> app.models
    - app/middleware -> app.middleware
    - app/controllers -> app.controllers
    - app/lib (lib files are not loaded onto an object, but are invoked before app start)

### Config

config placeholder

### Models, middleware, controllers

By default, modules are loaded to these hashes based on their file name (models/Users.js is loaded on to app.models
.Users;  controllers/home.js to app.controllers.home and so on). However, if you want to take more control
you can add an index.js file. Index.js may conform to one of two signatures:

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

### Lib

lib placeholder

# Credits

Express Train was heavily influenced by the work of Skookum and [Base12](https://github.com/Skookum/base12).  Thanks
to them for sharing their work and ideas!