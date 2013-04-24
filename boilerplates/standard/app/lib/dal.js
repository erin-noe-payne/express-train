var mongoose = require('mongoose');

module.exports = function (config) {
    //set up mongoose database connection
    if(!mongoose.connection.readyState){
      mongoose.connect(config.mongodb.uri, function(err){
        if(err) {
            var msg = 'Failed to connect to mongodb instance at '+config.mongodb.uri+'. Please confirm database instance is running.'
            throw new Error(msg);
        }
      });
    }
}