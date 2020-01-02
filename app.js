'use strict'

//Requires
var express = require('express');
var bodyParser = require('body-parser'); //allow us receive http request int javascript objects
//Run Express
var app = express();
//Load routes files
var user_routes = require('./routes/user');
var topic_routes = require('./routes/topic');
var comment_routes = require('./routes/comment');


//req ->send rest -->return
//app.get('/prueba', (req, res)=>{
//	return res.status(200).send("<h1>Hello World </h1>");
	// return res.status(200).send({
	// 	name: "carmelo",
	// 	message: 'Hello World'
	// });

//});

//Middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()); //request into json
//CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


//Rewrite Routes
app.use('/api', user_routes);
app.use('/api', topic_routes);
app.use('/api', comment_routes);
//Export module
module.exports = app;