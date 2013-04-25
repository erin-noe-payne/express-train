//var resource = require('express-resource');

module.exports = function (app, ApiController, HomeController, models) {

    // Home
    //app.resource(app.controllers.home);
    app.get('/', HomeController.index);

    //Generic restful api for all models - if previous routes are not matched, will fall back to these
    //See libs/params.js, which adds param middleware to load & set req.Model based on :model argument
    app.get('/api/:model', ApiController.search);
    app.post('/api/:model', ApiController.create);
    app.get('/api/:model/:id', ApiController.read);
    app.post('/api/:model/:id', ApiController.update);
    app.del('/api/:model/:id', ApiController.destroy);


    //whenever a router parameter :model is matched, this is run
    app.param('model', function(req, res, next, model) {
        //TODO: what instead?
        var Model = models[model];
        if(Model === undefined) {
            //if the request is for a model that does not exist, 404
            return res.send(404);
        }

        req.Model = Model;
        return next();
    });
};