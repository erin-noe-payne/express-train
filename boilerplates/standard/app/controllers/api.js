
module.exports = function (app) {
    var controller = {};

    /*
     Generic CRUD functions for any model
     */
    controller.search = [
        /*
         route functions get 3 args - the request object, the response object, and next - a callback to move on
         to the next middleware.
         req.query = json object with query string arguments
         req.params = json object with values of routing params such as :model or :id
         req.body = json request body from post / put requests
         */
        function (req, res, next) {
            var query = req.query;
            //req.Model is a value I set in libs/params.js
            req.Model.find(query, function (err, docs) {
                if (err) return next(err);
                return res.json(docs);
            });
        }
    ]
    controller.create = [
        function (req, res, next) {
            console.log(req.body);
            var model = new req.Model(req.body);
            model.save(function (err, doc) {
                if (err) return next(err);
                return res.json(doc);
            })
        }
    ]
    controller.read = [
        function (req, res, next) {
            var id = req.params.id;
            req.Model.findById(id, function (err, doc) {
                if (err) return next(err);
                if (doc === null) return res.send(404);
                return res.json(doc);
            });
        }
    ]
    controller.update = [
        function (req, res, next) {
            var id = req.params.id;
            //default update is a full replace
            //may want to give attribute replacement instead?
            req.Model.findByIdAndUpdate(id, req.body, function (err, doc) {
                if (err) return next(err);
                if (doc === null) return res.send(404);
                return res.json(doc);
            })
        }
    ]
    controller.destroy = [
        function (req, res, next) {
            var id = req.params.id;
            req.Model.findByIdAndRemove(id, function (err, doc) {
                if (err) return next(err);
                if (doc === null) return res.send(404);
                return res.send(204);
            })
        }
    ]

    return controller;
}