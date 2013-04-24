var mongoose = require('mongoose')

module.exports = function (dal) {
    var UserSchema = new mongoose.Schema({
        username:{ type:String, required:true, unique:true },
        email:{ type:String, required:false, unique:false }
    });

    return mongoose.model('users', UserSchema);
}