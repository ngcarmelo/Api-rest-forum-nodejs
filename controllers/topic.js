'user strict'

var validator = require('validator');
var Topic = require('../models/topic');


var controller = {

	test: function(req, res) {
		return res.status(200).send({
			message: 'I am  topic method'
		});
	},

	save: function(req, res) {

		//Collect data from POST
		var params = req.body;

		//Validate data
		try {
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);

		} catch (err) {
			return res.status(200).send({
				message: 'Missing fields to fill'
			});
		}

		if (validate_content && validate_title && validate_lang) {
			//Create topic Object to save
			var topic = new Topic();

			//Assign values
			topic.title = params.title;
			topic.content = params.content;
			topic.code = params.code;
			topic.lang = params.lang;
			topic.user = req.user.sub;

			//Save topic
			topic.save((err, topicStored) => {

				if (err || !topicStored) {
					return res.status(404).send({
						status: 'error',
						message: 'the topic has not been saved',
						topic: topicStored
					});
				}
				//Return response
				return res.status(200).send({
					status: 'success',
					topic: topicStored
				});
			});

		} else {
			return res.status(200).send({
				message: 'Data is not valid'
			});
		}
	},

	getTopics: function(req, res) {

		//Load paginate library (model)

		//Collect current page
		if (!req.params.page || req.params.page == 0 || req.params.page == '0' || req.params.page == null || req.params.page == undefined) {
			var page = 1;
		} else {
			var page = parseInt(req.params.page);
		}
		//Setup paginate options
		var options = {
			sort: {
				date: -1
			},
			populate: 'user',
			limit: 5,
			page: page
		};

		//Find paginate
		Topic.paginate({}, options, (err, topics) => {
			if (err) {
				return res.status(500).send({
					status: 'error',
					message: 'Error making the query'
				});
			}
			if (!topics) {
				return res.status(404).send({
					status: 'error',
					message: 'There are no topics'
				});
			}

			//Return response (topics, total topics, total pages)

			return res.status(200).send({
				status: 'success',
				topics: topics.docs,
				totalDocs: topics.totalDocs,
				totalPages: topics.totalPages,
				page: page,
				options
			});
		});

	},

	getTopicsByUser: function(req, res) {
		//Get user Id
		var userId = req.params.user;

		//Find user --> 
		Topic.find({
				user: userId
			})
			.sort([
				['date', 'descending']
			])
			.exec((err, topics) => {
				if (err) {
					return res.status(500).send({
						status: 'error',
						message: 'Request error'
					});
				}
				if (!topics) {
					return res.status(404).send({
						status: 'error',
						message: 'There are no topics'
					});
				}
				//Return response
				return res.status(200).send({
					status: 'success',
					topics
				});
			});
	},

	getTopic: function(req, res) {

		//Get topic Id from URL
		var topicId = req.params.id;

		//Find Topic-id
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
	},

	update: function(req, res) {
		//Collect data from Url
		var topicId = req.params.id;

		//Collect data from Post
		var params = req.body;

		//Validate data
		try {
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);

		} catch (err) {
			return res.status(200).send({
				message: 'Missing fields to fill'
			});
		}

		if (validate_title && validate_content && validate_lang) {
			//Json with the data to update
			var update = {
				title: params.title,
				content: params.content,
				code: params.code,
				lang: params.lang
			};

			//Find and update topic --> id and user
			//topicId ---> id from topic and  'req.user.sub'  userId from token/middleware
			Topic.findOneAndUpdate({
				_id: topicId,
				user: req.user.sub
			}, update, {
				new: true
			}, (err, topicUpdated) => {

				if (err) {
					return res.status(500).send({
						status: 'error',
						message: 'Request error'
					});
				}
				if (!topicUpdated) {
					return res.status(404).send({
						status: 'error',
						message: 'There is no topic'
					});
				}
				//Return response
				return res.status(200).send({
					status: 'success',
					topic: topicUpdated
				});
			});

		} else {
			return res.status(200).send({
				status: 'error',
				message: 'Data validation is not correct'
			});
		}


	},

	delete: function(req, res) {

		//Get topicId from URL
		var topicId = req.params.id;

		//Find and delete by topicId and userID
		Topic.findOneAndDelete({
			_id: topicId,
			user: req.user.sub
		}, (err, topicRemoved) => {
			if (err) {
				return res.status(500).send({
					status: 'error',
					message: 'Request error'
				});
			}
			if (!topicRemoved) {
				return res.status(404).send({
					status: 'error',
					message: 'Topic has not been deleted'
				});
			}
			//Return response
			return res.status(200).send({
				status: 'success',
				topic: topicRemoved
			});
		});
	},



		search: function(req, res) {

		//Get string to search from URL
		var searchString = req.params.search;

		//Find or
		Topic.find({
			"$or": [{
				'title': {
					'$regex': searchString,
					'$options': 'i'
				}
			}, {
				'content': {
					'$regex': searchString,
					'$options': 'i'
				}
			}, {
				'lang': {
					'$regex': searchString,
					'$options': 'i'
				}
			}, {
				'code': {
					'$regex': searchString,
					'$options': 'i'
				}
			}
			]
		}).populate('user').sort([
		['date', 'descending']
		]).exec((err, topics) => {
			if (err) {
				return res.status(500).send({
					message: 'Error request'
				});
			}
			if (!topics) {
				return res.status(404).send({
					message: 'There are not topics'
				});
			}
			//Return response
			return res.status(200).send({
				status: 'success',
				topics

			});

		});



	}

};

module.exports = controller;