'use strict'

//load mongoose library
var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.PORT || 3999;

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
//adress bd and name bd
mongoose.connect('mongodb://localhost:27017/api_rest_node',
    { useNewUrlParser: true, useUnifiedTopology: true })
 
	.then(() => {
		console.log('Connection to mongo BD has been done correctly');
		//Create server
		app.listen(port, ()=>{
			console.log('Server http://localhost:3999 is working !!!');
		});

	})
	.catch(error => console.log(error));

//http://localhost:3999/ in browser