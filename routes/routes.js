var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var request     = require('request');
var config      = require('../config.json');
var pipl        = require('pipl')(config.piplKey);
var fs          = require('fs');
var node_xj     = require("xls-to-json");
var Excel       = require("../models/excelmodel");
var Pipl        = require("../models/piplmodel");
var moment      = require("moment");

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


// var options = {
//     timeout:  3000
//   , pool:     { maxSockets:  Infinity }
//   , headers:  { connection:  "keep-alive" }
// };


var appRouter = function(app) {

    app.get("/api/piplTry", function(req, res) {
        var start = new Date();
        pipl.search.query({raw_name: "Raj Patel", gender: "male", age: 19}, function(err, data) {
        // Pipl.personObjQuery({"emails":[{"address": "clark.kent@example.com"}],"addresses":[{"country":"US", "state": "KS", "city": "Metropolis"},{"country":"US", "state": "KS", "city": "Metropolis"}]}, function(err, data) {
            if (err) {
                console.log("error: ");
                console.log(err);
            }
            else {
                // console.log(data);
                console.log("-------------------------------------------------------------");
                console.log(data);
                if (data.person) {
                    console.log("-------------------------------person-------------------------");
                    var obj = data.person;
                    Object.keys(obj).forEach(function(key) {
                        if (key != '@search_pointer') {
                            console.log(key, obj[key]);
                        }
                    });
                }
                else if (data.possible_persons && data.possible_persons[0]) {
                    console.log("-----------------------possible_persons-------------------------");
                    for (i=0; i < data.possible_persons.length; ++i) {
                        console.log("---------------------------------person "+i+"--------------------------");
                        var obj = data.possible_persons[i];
                        Object.keys(obj).forEach(function(key) {
                            if (key != '@search_pointer') {
                                console.log(key, obj[key]);
                            }
                        });
                    }
                }
                else {
                    console.log("--------------------------neither----------------------------");
                    console.log(data);
                }
                //console.log(data.possible_persons[0]);
            }
            var end = new Date();
            console.log("time = " + (end - start));
        });
    });

    app.get("/api/curlRecreate", function(req, res) {
        // recreate CURL COMMAND
        // var formed_JSON = JSON.stringify({"emails":[{"address": "clark.kent@example.com"}],"addresses":[{"country":"US", "state": "KS", "city": "Metropolis"},{"country":"US", "state": "KS", "city": "Metropolis"}]});

        var date_start = (moment().year() - 20 - 3) + "-01-01";
        var date_end = (moment().year() - 20 + 2) + "-12-31";

        var formed_JSON = {
            educations : [{"school":"University of Michigan"}],
            gender : {"content": "male"},
            names : [{"raw": "Pranav Mayuram"}],
            dob : {
                "date_range": {
                    "start":date_start,
                    "end":date_end
                }
            }
        };
        request.post('http://api.pipl.com/search/v4/', {
            form: {
                person: JSON.stringify(formed_JSON),
                key: config.piplKey
            }
        },
        function (error, response, body) {
            if (error) {
                console.log("error: ");
                console.log(error);
            }
            else {
                console.log("BODY:");
                console.log(body);
            }
        });
    });


    app.post("/api/uploadExcel", upload.single('userPhoto'), function(req, res) {
        console.log("endpoint hit");
        console.log(req.body);
        console.log(req.file);

        Excel.upload(req.body, req.file, function(error, JSONfilename) {
            if (error) {
                console.log(error);
                return res.send(error);
            }
            console.log(JSONfilename);

            Pipl.searchJSONfile(JSONfilename, req.body, function(err, JSONresults) {
                if (err) {
                    console.log('ended on error');
                    // res.send(err);
                }
                else {
                    console.log('ended on success');
                    // res.send('pipldone');
                }
                console.log("JSON OUTPUT: ");
                console.log(JSONresults);
                fs.unlink(JSONfilename, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(JSONfilename + " deleted successfully");
                    Excel.download(JSONresults, function (err, fileLocation) {
                        res.download(fileLocation, "AlumnUS_"+req.file.originalname+".xls", function (err) {
                            if (err) {
                                console.log(err);
                            }
                            fs.unlinkSync(fileLocation);
                            console.log("Excel file "+fileLocation+" successfully deleted");
                        });
                    });
                });
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
