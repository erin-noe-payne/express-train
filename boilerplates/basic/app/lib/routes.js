module.exports = function (app, middleware, HomeController) {

    app.get('/', HomeController.index);

};