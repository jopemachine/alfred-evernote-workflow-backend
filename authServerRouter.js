const express = require("express");
const Evernote = require("evernote");
const router = express.Router();
const fs = require('fs');

const accessToken = require('./accessToken.json');

router.get("/oauth", (req, res, next) => {

  var callbackUrl = "http://localhost:3000/oauth_callback";

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

router.get("/oauth_callback", (req, res, next) => {

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
          Comment: "Create OAuth.json file in your workflow repository and paste below oauthToken",
          Valid: true,
          OAuth: JSON.stringify({ oauthToken })
        });
      }
    }
  );
});

module.exports = router;