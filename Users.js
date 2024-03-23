var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt-nodejs');


mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true })
mongoose.set('useCreateIndex', true);

//User Schema
var UserSchema = new Schema({
    name: String,
    username: { type: String, required: TransitionEvent, index: { unique: true}},
    password: { type: String, required: true, select: false}
});

UserSchema.pre('save', function(next) {
    var user = this;

    //hash the password
    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, null, null, function(err, hash) {
        if (err) return next(err);

        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password, callback) {
    var user = this;

    bcrypt.compare(password, user.password, function(err, isMatch) {
        callback(isMatch);
    })
}

//return the model to the server
module.exports = mongoose.model('User', UserSchema);