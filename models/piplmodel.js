var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var node_xj     = require("xls-to-json");
var fs			= require("fs");
var config      = require('../config.json');
var pipl        = require('pipl')(config.piplKey);
var sleep       = require('sleep');

// max number of API requests pipl can handle per second
var MAX_REQUESTS = 2;

function Pipl() { };

Pipl.searchJSONfile = function(filename, params, callback) {

    var currentJSON = require("."+filename);
    var requestArray = [];

    // we want to be able to loop through 'currentJSON', and make it into multiple arrays
    // then move through each array separately - loop within a loop

    console.log('lengthJSON: '+ Math.ceil(currentJSON.length/MAX_REQUESTS));

    var currentIndex = 0;
    for (i=0; i<Math.ceil(currentJSON.length/MAX_REQUESTS); ++i) {
        var innerArray = [];
        console.log("i: " + i);
        for (j=currentIndex; j < (currentIndex + MAX_REQUESTS); ++j) { 
            console.log("j: "+j);
            innerArray.push(currentJSON[j]);
        }
        requestArray.push(innerArray);
        currentIndex += MAX_REQUESTS;
    }

    console.log(requestArray);


    async.each(requestArray, function (smallArray, callb) {
        console.log('innerArray: ');
        console.log(smallArray);

        // wait 1 second to throttle API requests
        sleep.sleep(1);

        async.each(smallArray, function (person, cb) {

            console.log('smallArray: ');
            console.log(smallArray);
            
            Pipl.searchIndividual(person, params.nameattribute, function (error, result) {
                if (error) {
                    cb(error);
                }
                else {
                    person.geography = result;
                    console.log(person);
                    cb();
                }
            });

        }, function(error) {
            if (error) {
                console.log(error);
            }
            callb();
        });

    }, function(err) {
        if (err) {
            console.log(err);
        }
        else {
            return callback(null, currentJSON);
        }
    });
    /*node_xj({
        input: fileInfo.path,  // input xls 
        output: null, // output json 			// can this be exported to a variable? (can also do from a file if need be)
        sheet: params.sheetname  // specific sheetname 
    }, function(err, result) {
        if(err) {
        	console.error(err);
        	return callback(err, null);
        } 
        else {
        	console.log(result);
        	// read the file and get JSON, and make a call for each person using PIPL
        	// SHOULD THAT BE A DIFFERENT FUNCTION?

        	// ONCE IT IS PARSED AND U HAVE THE JSON, YOU NEED TO EXPORT TO EXCEL
        	// SAME AS ABOVE
        }
    });*/
};

Pipl.searchIndividual = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

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
                    console.log(params[nameattribute]);
                    /*if (key != '@search_pointer') {
                        console.log(key, obj[key]);
                    }*/
                    // having some issues, keeps hitting the same name
                });
                return callback(null, data.possible_persons[0]);
            }
            else {
                console.log(data);
            }
            //console.log(data.possible_persons[0]);
        }
    });
};



module.exports = Pipl;
