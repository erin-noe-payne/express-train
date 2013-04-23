module.exports = function (app) {

    app.get('/', app.controllers.home.index);

};