const express = require("express");
const sessionParser = require('express-session');
const app = express();

const config = require('./config.json');

const Evernote = require("evernote");
const accessToken = require('./accessToken.json');

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const createError = require('http-errors');

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

app.get("/auth", (req, res, next) => {

  var callbackUrl = `${config.awsUrl}/oauth_callback`;

	const client = new Evernote.Client({
		consumerKey: accessToken.consumerKey,
		consumerSecret: accessToken.consumerSecret,
		sandbox: false,
		china: false,
  });

	client.getRequestToken(callbackUrl, function (
		error,
		oauthToken,
		oauthTokenSecret
	) {
    
    if (error) {
      console.log("Temporary OAuth token error", error);

      res.json({
        Error: error,
        Valid: false
      })

      return;
    }

	req.session.oauthToken = oauthToken;
  req.session.oauthTokenSecret = oauthTokenSecret;

  res.redirect(client.getAuthorizeUrl(oauthToken));
  });
});

app.get("/oauth_callback", (req, res, next) => {

  if(req.query.reason == "token_expired") {
    res.json({
      Msg: "Token deleted successfully."
    })
  } else if (req.query.reason == "cancelled"){
    res.json({
      Msg: "Canceled."
    })
  } else if (req.query.reason == "token_expired") {
    res.json({
      Msg: "Token expired!"
    })
  }

  var client = new Evernote.Client({
    consumerKey: accessToken.consumerKey,
    consumerSecret: accessToken.consumerSecret,
    sandbox: false,
    china: false,
  });
  
  client.getAccessToken(
    req.session.oauthToken,
    req.session.oauthTokenSecret,
    req.query.oauth_verifier,
    function (error, oauthToken, oauthTokenSecret, results) {
      if (error) {
        console.log("error in getAccessToken: ", error);
        res.json({
          Error: error,
          Valid: false
        })
      } else {
        res.json({
          oauthToken
        });
      }
    }
  );
});

// 404 error
app.use(function(req, res, next) {
  console.log(`404 not found:: Method:${req.method}, Url: ${req.url}`);
  next(createError(404));
});

module.exports = app;