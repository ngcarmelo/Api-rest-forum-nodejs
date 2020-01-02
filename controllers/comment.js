'user strict'

var validator = require('validator');
var Topic = require('../models/topic');



var controller = {

	add: function(req, res) {
		//Get topicId from URL
		var topicId = req.params.topicId;

		//Find id  from topic
		Topic.findById(topicId).populate('user').populate('comments.user').exec((err, topic) => {

			if (err) {
				return res.status(500).send({
					message: 'Error request'
				});
			}
			if (!topic) {
				return res.status(404).send({
					message: 'There is not topic'
				});
			}		
			//Check user object and validate
			//console.log('user:');			
			// req.user.sub
			if (req.body.content) {


				try {
					var validate_content = !validator.isEmpty(req.body.content);
				} catch (err) {
					return res.status(200).send({
						message: 'You have not commented anything'
					});
				}

				if (validate_content) {

					var comment = {
						user: req.user.sub,
						content: req.body.content
					};
					//In comments property (inside topic object) from the object do a push
					topic.comments.push(comment);

					//Save the whole topic
					topic.save((err) => {
						if (err) {
							return res.status(500).send({
								status: 'error',
								message: 'Error saving'
							});
						}


						Topic.findById(topicId).populate('user').populate('comments.user').exec((err, topic) => {
							if (err) {
								return res.status(500).send({
									status: 'error',
									message: 'Request error'
								});
							}
							if (!topic) {
								return res.status(404).send({
									status: 'error',
									message: 'There is no topic'
								});
							}
			//Return response
			return res.status(200).send({
				status: 'success',
				topic
			});
		});
					});

				} else {
					return res.status(200).send({
						message: 'Comments have not been validated'
					});
				}
			}
		});
	},


	update: function(req, res) {

		//Get Comment id from URL
		var commentId = req.params.commentId;

		//Collect data and validate
		var params = req.body;
		try {
			var validate_content = !validator.isEmpty(params.content);
		} catch (err) {
			return res.status(200).send({
				message: 'You have not commented anything'
			});
		}

		if (validate_content) {

			//Find and update sub-document
			//operador de actualizacion
			Topic.findOneAndUpdate({
				'comments._id': commentId
			}, {
				'$set': {
					'comments.$.content': params.content
				}
			}, {
				new: true
			}, (err, topicUpdated) => {
				if (err) {
					return res.status(500).send({
						message: 'Error request'
					});
				}
				if (!topicUpdated) {
					return res.status(404).send({
						message: 'There is not topic'
					});
				}

				//Return response
				return res.status(200).send({
					status: 'success',
					topic: topicUpdated
				});

			});


		}



	},


	delete: function(req, res) {
		//Get topicId and comment to delete
		var topicId = req.params.topicId;
		var commentId = req.params.commentId;

		//Find topic
		Topic.findById(topicId, (err, topic) => {
			if (err) {
				return res.status(500).send({
					message: 'Error request'
				});
			}
			if (!topic) {
				return res.status(404).send({
					message: 'There is not topic'
				});
			}

			//Select subdocument (comment)
			var comment = topic.comments.id(commentId);

			//Delete comment
			if (comment) {
				comment.remove();
				//Save topic
				topic.save((err) => {
					if (err) {
						return res.status(500).send({
							message: 'Error request'
						});
					}
					//Return response
					
					// return res.status(200).send({
					// 	status: 'success',
					// 	topic
					// });
					Topic.findById(topicId).populate('user').populate('comments.user').exec((err, topic) => {
						if (err) {
							return res.status(500).send({
								status: 'error',
								message: 'Request error'
							});
						}
						if (!topic) {
							return res.status(404).send({
								status: 'error',
								message: 'There is no topic'
							});
						}
			//Return response
			return res.status(200).send({
				status: 'success',
				topic
			});
		});





				});



			} else {
				if (!comment) {
					return res.status(404).send({
						message: 'There is not comment'
					});
				}

			}



		});


	},





};

module.exports = controller;