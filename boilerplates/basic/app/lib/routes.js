module.exports = function (app, HomeController) {

    app.get('/', HomeController.index);

};