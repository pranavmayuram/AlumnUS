// modules for the application
var express         = require('express');
var app             = express();
var router          = express.Router([]);
var config          = require("./config");
var bodyParser      = require('body-parser');
var morgan          = require('morgan');
var fs              = require('fs');
var http            = require('http');
var multer          = require("multer");

var upload          = multer({dest: './uploads/',
    onFileUploadStart: function (file) {
      console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path)
      done=true;
    },
    limits: {
      fieldNameSize: 100,
      fileSize: 20000000,
      files: 1
    }
});

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
app.use(express.static(__dirname + '/JSON'));

// route from "/alumnus"
app.use('/alumnus', router);

// include API endpoints
var routes = require("./routes/routes.js")(router);

// make sure app does not crash, send 500 errors instead
app.use(function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});

// set up HTTP and HTTPS if possible
var httpServer = http.createServer(app);
httpServer.listen(config.setup.AlumnUSPort);

// inform user of IP
console.log('View AlumnUS at localhost:' + config.setup.AlumnUSPort);
