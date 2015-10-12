var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var graph 		= require('fbgraph');
var request     = require('request');
var config      = require('../config.json');
var pipl        = require('pipl')(config.piplKey);
var fs          = require('fs');
var node_xj     = require("xls-to-json");
var Excel       = require("../models/excelmodel");
var Pipl        = require("../models/piplmodel");

var upload      = multer({dest: './uploads/', 
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
                graph.get("zuck", function(err, resp) {
                    console.log(resp);
                    res.send(resp); // { id: '4', name: 'Mark Zuckerberg'... }
                });
            }
        });
    });

    app.get("/api/piplTry", function(req, res) {
        pipl.search.query({"raw_name": "Pranav Mayuram",}, function(err, data) {
            // Here you go 
            if (err) {
                console.log("error: ");
                console.log(err);
            }
            else {
                console.log("data: ");
                if (data.possible_persons && data.possible_persons[0]) {
                    var obj = data.possible_persons[0];
                    Object.keys(obj).forEach(function(key) {
                        if (key != '@search_pointer') {
                            console.log(key, obj[key]);
                        }
                    });
                }
                else {
                    console.log(data);
                }
                //console.log(data.possible_persons[0]);
            }
        });
    });

    /*app.get("/api/excel2json", function(req, res) {
        node_xj({
            input: "ExcelSampleRetry.xls",  // input xls 
            output: null, // output json 
            sheet: "Sheet1",  // specific sheetname 
        }, function(err, result) {
            if(err) {
              console.error(err);
            } else {
              console.log(result);
              res.json(result);
            }
        });

    });*/

    app.post("/api/uploadExcel", upload.single('userPhoto'), function(req, res) {
        console.log("endpoint hit");
        console.log(req.body);
        console.log(req.file);
        // var x = {"sheetname": "Sheet1", "path": "ExcelSampleRetry.xls"};

        Excel.upload(req.body, req.file, function(error, JSONfilename) {
            if (error) {
                console.log(error);
                return res.send(error);
            }
            console.log(JSONfilename);

            Pipl.searchJSONfile(JSONfilename, req.body, function(err, JSONresults) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                return res.send('pipldone');
            });
            // return res.send('woot');
        });
    });

    app.get('/', function(req, res) {
            console.log("getting to index.html"); // load the single view file (angular will handle the page changes on the front-end)
            res.sendfile('index.html');
    });
};

module.exports = appRouter;