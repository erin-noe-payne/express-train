var hbs = require('express-hbs'),
    path = require('path');

module.exports = function (app) {

    //set up view engine
    app.set('view engine', 'hbs');

    app.engine('hbs', hbs.express3({
        partialsDir:path.join(app.dir, "/views/partials")
    }));

    // Static locals
    app.locals({
    });
};