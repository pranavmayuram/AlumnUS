var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var node_xj     = require("xls-to-json");
var fs			= require("fs");
var config      = require('../config.json');
var pipl        = require('pipl')(config.piplKey);
var sleep       = require('sleep');
var Bottleneck  = require("bottleneck");

var MAX_RPS     = 2;
var limiter     = new Bottleneck(MAX_RPS, 1000);

// max number of API requests pipl can handle per second

function Pipl() { };

Pipl.searchJSONfile = function(filename, params, callback) {

    var currentJSON = require("."+filename);
    // var requestArray = [];
    console.log("start");
    var start = new Date().getTime();
    console.log(start);

    async.each(currentJSON, function (person, cb) {
        limiter.submit(Pipl.searchIndividual, person, params.nameattribute, function(error, result) {
            if (error) {

            }
            else {
                console.log("found a person");
                console.log((new Date().getTime() - start)/1000);
                if (!result.geography) {
                    person.geography = "NOT FOUND";
                }
                else {
                    person.geography = result.geography;
                }
                cb();
            }
        });
    },
    function(error) {
        if (error) {
            console.log(error);
            console.log("callback error time");
            console.log((new Date().getTime() - start)/1000);
            callback(error, null);
        }
        else {
            console.log("callback time");
            console.log((new Date().getTime() - start)/1000);
            callback(null, currentJSON);
        }
    }); 

    /*async.each(currentJSON, function (person, cb) {

        Pipl.searchIndividual(person, params.nameattribute, function (err, result) {
            if (err) {
                sleep.usleep(1500000);
                console.log("err");
                console.log((new Date().getTime() - start)/1000);
                cb(err);
            }
            else {
                // throttle API requests with blocking sleep tool
                sleep.usleep(1500000);

                // log time if someone is found
                console.log("found a person");
                console.log((new Date().getTime() - start)/1000);

                // update geography of user
                if (!result.geography) {
                    person.geography = null;
                }
                else {
                    person.geography = result.geography;
                }
                cb();
            }
        });

    },  

    function(error) {
        if (error) {
            console.log(error);
            console.log("callback time");
            console.log((new Date().getTime() - start)/1000);
            callback(error, null);
        }
        else {
            console.log("callback time");
            console.log((new Date().getTime() - start)/1000);
            callback(null, currentJSON);
        }
    });*/

    /*async.each(result, function (person, callback) {
        var someObj = {userID: person.authorID};
        User.advancedSearch(someObj, function (error, result) {
            if (error) {
                callback(error);
            }
            else {
                console.log('PERSON INIT : ' + person);
                console.log(result);
                if (!result[0]) {
                    console.log('user deleted, post ignored');
                    callback();
                }
                else {
                    console.log('result : ' + JSON.stringify(result[0]));
                    person.author = result[0][primaryAttribute];
                    console.log(person);
                    callback();
                }
            }
        });
    }, function(err) {
        if (err) {
            console.log(error);
        }
        else {
            console.log('final result: ' + JSON.stringify(result));
            res.json(result);
        }
    });*/

    // we want to be able to loop through 'currentJSON', and make it into multiple arrays
    // then move through each array separately - loop within a loop

    /*console.log('lengthJSON: '+ Math.ceil(currentJSON.length/MAX_REQUESTS));

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

    console.log('requestArray');
    console.log(requestArray);

    async.forEachOf(requestArray, function (smallArray, arrayIterator, callb) {

        // wait 1 second to throttle API requests
        sleep.sleep(2);

        //requestArray.forEach(  ,smallArray);

        async.forEachOf(smallArray, function (person, innerIterator, cb) {

            Pipl.searchIndividual(person, params.nameattribute, function (error, result) {
                if (error) {
                    cb(error, null);
                }
                else {
                    //console.log('person: ');
                    //console.log(result.names);
                    console.log("currentIter: "+ (arrayIterator*MAX_REQUESTS + innerIterator));
                    cb(null, arrayIterator*MAX_REQUESTS + innerIterator);
                }
            });

        }, function(error, index) {
            if (error) {
                // console.log(error);
                callb(error);
            }
            else if (index == (currentJSON.length - 1)) {
                callb();
            }
        });

    }, function(err) {
        // console.log('finished');
        if (err) {
            // console.log(err);
            callback(err, null);
        }
        else {
            callback(null, currentJSON);
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

// take in params from form when uploaded to find attribute that contains name
Pipl.searchIndividual = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

        // Here you go 
        if (err) {
            console.log("error: ");
            console.log(err);
        }
        else {
            //console.log("data: ")
            if (data.possible_persons && data.possible_persons[0]) {
                var obj = data.possible_persons[0];
                /*Object.keys(obj).forEach(function(key) {
                    console.log(params[nameattribute]);
                    if (key != '@search_pointer') {
                        console.log(key, obj[key]);
                    }
                    // having some issues, keeps hitting the same name
                }); */
                return callback(null, data.possible_persons[0]);
            }
            else {
                console.log(data);

                // should soon be changed to callback(data, null);
                return callback(null, data);
            }
            //console.log(data.possible_persons[0]);
        }
    });
};



module.exports = Pipl;
