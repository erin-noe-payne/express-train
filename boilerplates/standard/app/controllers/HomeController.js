module.exports = function (app) {
    return {

        // Landing

        index:[
            function (req, res, next) {
                res.locals.title = 'hello world';
                res.render('index');
            }]

    };
};
