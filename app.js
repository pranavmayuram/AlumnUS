// modules for the application
var express         = require('express');
var app             = express();
var config          = require("./config");
var bodyParser      = require('body-parser');
var morgan          = require('morgan');
var fs              = require('fs');
var http            = require('http');

// use commands
app.use(bodyParser.urlencoded({extended:true, limit: '4mb'}));
app.use(bodyParser.json({limit: '4mb'}));
app.use(morgan('dev'));

// connect directories to save in memory before app is run, makes filepaths simpler
app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
app.use(express.static(__dirname + '/icons'));
app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/node_modules'));

/* create cluster and create buckets using config file
var cluster = new couchbase.Cluster(config.couchbase.server);
module.exports.userBucket = cluster.openBucket(config.couchbase.userBucket);
module.exports.pictureBucket = cluster.openBucket(config.couchbase.pictureBucket);
module.exports.publishBucket = cluster.openBucket(config.couchbase.publishBucket);*/

// include API endpoints
var routes = require("./routes/routes.js")(app);

// set up HTTP and HTTPS if possible
var httpServer = http.createServer(app);
httpServer.listen(config.setup.AlumnUSPort);

// inform user of IP                     
console.log('View Touchbase at localhost:' + config.setup.AlumnUSPort);
