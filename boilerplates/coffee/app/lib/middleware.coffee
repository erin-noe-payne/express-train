express = require "express"

module.exports = (app) -> 
    errorConfig = 
        dumpExceptions: true
        showStack: true

    error_middleware = express.errorHandler errorConfig

    app.use express.static( app.get "public" )
    app.use express.cookieParser()
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use (req, res, next) -> 
        res.send 404
    app.use error_middleware