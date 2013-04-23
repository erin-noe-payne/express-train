//var resource = require('express-resource');

module.exports = function (app) {

    // Home
    //app.resource(app.controllers.home);
    app.get('/', app.controllers.home.index);

    //Generic restful api for all models - if previous routes are not matched, will fall back to these
    //See libs/params.js, which adds param middleware to load & set req.Model based on :model argument
    app.get('/api/:model', app.controllers.api.search);
    app.post('/api/:model', app.controllers.api.create);
    app.get('/api/:model/:id', app.controllers.api.read);
    app.post('/api/:model/:id', app.controllers.api.update);
    app.del('/api/:model/:id', app.controllers.api.destroy);


    //whenever a router parameter :model is matched, this is run
    app.param('model', function(req, res, next, model) {
        var Model = app.models[model];
        if(Model === undefined) {
            //if the request is for a model that does not exist, 404
            return res.send(404);
        }

        req.Model = Model;
        return next();
    });
};