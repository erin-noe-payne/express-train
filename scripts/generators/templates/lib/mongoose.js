// Connect to mongodb

var mongoose = require('mongoose');

module.exports = function(app) {
  mongoose.connect('mongodb://' + app.config.mongoose.host + '/' + app.config.mongoose.db, function(err) {
    if (err) throw new Error(err.message);
  });
};
