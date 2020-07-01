const express = require("express");
const sessionParser = require('express-session');
const app = express();

const router = require('./authServerRouter');
const config = require('./config.json');

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

var server = app.listen(port, "127.0.0.1", onListening);

function onListening() {}

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		return val;
	}

	if (port >= 0) {
		return port;
	}

	return false;
}

app.use(sessionParser({
	secret: config.sessionSecret,
	resave: true,
	saveUninitialized: true
}));

app.use(awsServerlessExpressMiddleware.eventContext())

app.use('/', router);

module.exports = app;