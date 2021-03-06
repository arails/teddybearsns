var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
	image: String,
	imageId: String,
	firstName: String,
	lastName: String,
	location: String,
	email: {type: String, unique: true, required: true},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	aboutMe: String,
    isAdmin: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);