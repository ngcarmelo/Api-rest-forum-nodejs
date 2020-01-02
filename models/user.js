'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name: String,
	surname: String,
	email: String,
	password: String,
	image: String,
	role: String
});

//Because we don't to show the password when whe show the user data (public methods)
// UserSchema.methods.toJSON = function(){
// 	var obj = this.toObject();
// 	delete obj.password;
// }


module.exports = mongoose.model('User', UserSchema);
			//mongoose in bd --> lowercase and pluralize the name
			//users --> documents (schema)