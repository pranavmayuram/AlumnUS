var uuid        = require("uuid");
var async       = require("async");
// var Linkedin 	= require('node-linkedin')('api', 'secret', 'callback');
// var linkedin 	= Linkedin.init('CrmEPV92cLdVFoBA');
var graph 		= require('fbgraph');
var request     = require('request');
var config      = require('../config.json');
/*var bucket      = require("../app.js").bucket;
var couchbase   = require('couchbase');
var N1qlQuery   = require('couchbase').N1qlQuery;*/

var options = {
    timeout:  3000
  , pool:     { maxSockets:  Infinity }
  , headers:  { connection:  "keep-alive" }
};


var appRouter = function(app) {

	app.get("/api/fbData", function(req, res) {
        request("https://graph.facebook.com/oauth/access_token?client_id="+config.fbAuth.client_id+"&client_secret="+config.fbAuth.client_secret+"&grant_type=client_credentials", function (error, response, result) {
            if (error) {
                return res.status(400).send(error);
            }
            else if (!error && response.statusCode == 200) {
                // receives the access token for the API to then access it
                console.log('result');
                console.log(result);
                result = result.replace('access_token=', '');
                console.log(result);
                graph.setAccessToken(result);
                graph.get("zuck", function(err, res) {
                    console.log(res); // { id: '4', name: 'Mark Zuckerberg'... }
                });
            }
        });
    });
};

module.exports = appRouter;