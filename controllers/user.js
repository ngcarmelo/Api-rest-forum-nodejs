'use strict'

var validator = require('validator');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var jwt = require('../services/jwt');

var controller = {

	trying: function(req, res) {
		return res.status(200).send({
			message: 'I am  trying method'
		});
	},

	testing: function(req, res) {
		return res.status(200).send({
			message: 'I am  testing method'
		});
	},

	save: function(req, res) {
		//Collect parameters from request
		var params = req.body

		//Validate data
		try {
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
			//console.log(validate_name, validate_surname, validate_email, validate_password);
		} catch (err) {
			return res.status(200).send({
				message: 'Missing data to send',
				params
			});
		}

		if (validate_name && validate_surname && validate_email && validate_password) {
			//Create user object
			var user = new User();

			//Assign values to user
			user.name = params.name;
			user.surname = params.surname;
			user.email = params.email.toLowerCase();
			user.role = 'ROLE_USER';
			user.image = null;

			//Check if user exist
			User.findOne({
				email: user.email
			}, (err, issetUser) => {
				if (err) {
					return res.status(500).send({
						message: 'Error checking user duplicity'
					});
				}
				if (!issetUser) {
					//if it does not exist, 

					//encrypt the password 			 
					const saltRounds = 10;
					bcrypt.hash(params.password, saltRounds, function(err, hash) {
						// Store hash in your password DB.
						user.password = hash;

						//and save the user
						user.save((err, userStored) => {
							if (err) {
								return res.status(500).send({
									message: 'Error saving user'
								});
							}
							if (!userStored) {
								return res.status(400).send({
									message: 'The user has not been saved'
								});
							}

							//return a response						
							return res.status(200).send({
								status: 'success',
								user: userStored

							});
						}); //close save
					}); //close bcrypt

				} else {
					return res.status(200).send({
						message: 'User is already registered'
					});
				}
			}); //close findOne

		} else {
			return res.status(200).send({
				message: 'Validation incorrect, try again',
				params: params
			});
		}
	},

	login: function(req, res) {
		//Collect parameters
		var params = req.body;

		//Validate data
		try {
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
		} catch (err) {
			return res.status(200).send({
				message: 'Missing data to send',
				params
			});
		}

		if (!validate_email || !validate_password) {
			return res.status(200).send({
				message: 'The data is incorrect, send them well'
			});
		}

		//Find users that match the email
		User.findOne({
			email: params.email.toLowerCase()
		}, (err, user) => {
			if (err) {
				return res.status(500).send({
					message: 'error when trying to login'
				});
			}
			if (!user) {
				return res.status(404).send({
					message: 'Username does not exist'
				});
			}
			//if you find it

			//check password (email and password match)/bcrypt
			bcrypt.compare(params.password, user.password, (err, check) => {

				//if it is correct
				if (check) {
					//generate jwt token  and return it (later)
					if (params.gettoken) {
						return res.status(200).send({
							token: jwt.createToken(user)

						});

					} else {
						//Clean object
						user.password = undefined;

						//Return data					
						return res.status(200).send({
							status: 'success',
							user
						});
					}
				} else {
					return res.status(200).send({
						message: 'Credentials are not correct'
					});
				}
			});
		});
	},

	update: function(req, res) {

		//0. Create middleware to check the jwt token, add it to the route
		//Collect user data
		var params = req.body;

		//Validate data
		try {
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
		} catch (err) {
			return res.status(200).send({
				message: 'Missing data to send',
				params
			});
		}

		//Remove unnecessary properties
		delete params.password;

		var userId = req.user.sub;

		//Check if the email is unique
		if (req.user.email != params.email) {
			//Find users that match the email
			User.findOne({
				email: req.user.email.toLowerCase()
			}, (err, user) => {

				if (err) {
					return res.status(500).send({
						message: 'error when trying to login'
					});
				}

				if (user && user.email == params.email) {
					return res.status(200).send({
						message: 'Email cannot be modified'
					});
				} else {
					//Find and update document
					User.findOneAndUpdate({
						_id: userId
					}, params, {
						new: true
					}, (err, userUpdated) => {

						if (err || !userUpdated) {
							return res.status(500).send({
								status: 'error',
								message: 'Error updating user'
							});
						}
						//Return response
						return res.status(200).send({
							status: 'success',
							user: userUpdated
						});
					});
				}
			});
		}
	},

	uploadAvatar: function(req, res) {
		//Configurate multiparty module (md) routes/user.js

		//Collect the request file
		var file_name = 'Avatar no uploaded...';
		console.log(req.files);

		if (!req.files) {

			//Return response
			return res.status(404).send({
				status: 'error',
				message: file_name
			});
		}
		//Get name and extension file
		var file_path = req.files.file0.path;
		var file_split = file_path.split('\\');
		//**Warning: Linux and Mac var file_split = file_path.split('/');
		var file_name = file_split[2];

		//Check extension (only images), if not valid remove file
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif') {
			fs.unlink(file_path, (err) => {
				//Return response
				return res.status(200).send({
					status: 'error',
					message: 'File extension is not valid'
				});
			});

		} else {
			//Get id from identify user
			var userId = req.user.sub;

			//Find and update document
			User.findOneAndUpdate({
				_id: userId
			}, {
				image: file_name
			}, {
				new: true
			}, (err, userUpdated) => {
				if (err || !userUpdated) {
					return res.status(500).send({
						status: 'error',
						message: 'Error saving user'
					});
				}
				//Return response
				return res.status(200).send({
					status: 'success',
					message: 'Upload Avatar',
					user: userUpdated
				});
			});

		}
	},

	avatar: function(req, res) {
		var fileName = req.params.fileName;
		var pathFile = './uploads/users/' + fileName;

		fs.exists(pathFile, (exists) => {
			if (exists) {
				return res.sendFile(path.resolve(pathFile));

			} else {
				return res.status(404).send({
					message: 'The image does not exist'
				});
			}
		});



	},

	getUsers(req, res) {
		User.find().exec((err, users) => {
			if (err || !users) {
				return res.status(404).send({
					status: 'error',
					message: 'There are no users'
				});
			}

			return res.status(200).send({
				status: 'success',
				users
			});


		});


	},

	getUser(req, res) {
		var userId = req.params.userId;

		User.findById(userId).exec((err, user) => {
			if (err || !user) {
				return res.status(404).send({
					status: 'error',
					message: 'There are no users'
				});
			}

			return res.status(200).send({
				status: 'success',
				user
			});



		});


	}


};

module.exports = controller;