module.exports = function () {
    return {

        // Landing

        index:[
            function (req, res, next) {
                res.render('index');
            }]

    };
};
