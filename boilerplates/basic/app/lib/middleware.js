var express = require('express');

// Middleware

module.exports = function (app) {


    // Error handler
    var error_middleware = express.errorHandler({
        dumpExceptions:true,
        showStack:true
    });

    // Middleware stack for all requests
    app.use(express['static'](app.get('public')));                      // static files in /public
    app.use(express.cookieParser());                                    // req.cookies
    app.use(express.bodyParser());                                      // req.body & req.files
    app.use(express.methodOverride());                                  // '_method' property in body (POST -> DELETE / PUT)
    app.use(app.router);                                                // routes in lib/routes.js
    app.use(function(req, res, next){                                   // barebones 404 handler
        res.send(404);
    });
    
    // Handle errors thrown from middleware/routes
    app.use(error_middleware);
};