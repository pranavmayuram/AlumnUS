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
                console.log(error);
            }
            else {
                // console.log("found a person");
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

};

// take in params from form when uploaded to find attribute that contains name
Pipl.searchIndividual = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

        // Here you go 
        if (err) {
            console.log("error: ");
            console.log(err);
            return callback(err, null);
        }
        else {
            var universityExists = universityTrue = universityFalse = universityNonExistent = 0;
            var ageExists = ageTrue = ageFalse = ageNonExistent = 0;
            var genderExists = genderTrue = genderFalse = genderNonExistent = 0;
            if (data.person) {
                console.log(params[nameattribute] + " : person");
                console.log("------------------------------------------");
                var obj = data.person;

                // check date of birth
                if (obj.dob && obj.dob.display) {
                    console.log("dob display: "+obj.dob.display);
                    console.log("params Age: "+params.Age);
                    ++ageExists;
                    if (obj.dob.display == params.Age) {
                        ++ageTrue;
                    }
                    else {
                        ++ageFalse;
                    }
                }
                else {
                    ++ageNonExistent;
                }

                // check gender
                if (obj.gender && obj.gender.content) {
                    ++genderExists;
                    if (obj.gender.content == params.gender) {
                        ++genderTrue;
                    }
                    else {
                        ++genderFalse;
                    }
                }
                else {
                    ++genderNonExistent;
                }

                // check university
                if (obj.educations) {
                    ++universityExists;
                    for (j=0; j < obj.educations.length; ++j) {
                        if (obj.educations[j].school == 'University of Michigan') {
                            ++universityTrue;
                            break;
                        }
                        else if (j == (obj.educations.length - 1)) {
                            ++universityFalse;
                        }
                    }
                }
                else {
                    ++universityNonExistent;
                }
                console.log("AGE \nageExists: "+ageExists+"\nageNonExistent: "+ageNonExistent+"\nageTrue: "+ageTrue+"\nageFalse: "+ageFalse+"\n");
                console.log("GENDER \ngenderExists: "+genderExists+"\ngenderNonExistent: "+genderNonExistent+"\ngenderTrue: "+genderTrue+"\ngenderFalse: "+genderFalse+"\n");
                console.log("EDUCATION \nuniversityExists: "+universityExists+"\nuniversityNonExistent: "+universityNonExistent+"\nuniversityTrue: "+universityTrue+"\nuniversityFalse: "+universityFalse+"\n");
                return callback(null, "person found");
            }
            else if (data.possible_persons) {
                var dataobj = data.possible_persons;
                // console.log(dataobj.length);
                var lengthdataobj = dataobj.length;
                console.log(params[nameattribute] + " : "+lengthdataobj+" possible_persons");
                console.log("------------------------------------------");
                for (i=0; i < lengthdataobj; ++i) {
                    var obj = data.possible_persons[i];   
                    
                    // check date of birth
                    if (obj.dob && obj.dob.display) {
                        ++ageExists;
                        // age given by pipl displays as '42 years old', this reads until first space
                        if (obj.dob.display.substr(0, obj.dob.display.indexOf(' ')) == params.Age) {
                            ++ageTrue;
                        }
                        else {
                            ++ageFalse;
                        }
                    }
                    else {
                        ++ageNonExistent;
                    }

                    // check gender
                    if (obj.gender && obj.gender.content) {
                        ++genderExists;
                        // gender given by pipl is lowercase, check equivalence with both lowercase
                        if (obj.gender.content.toLowerCase() == params.Gender.toLowerCase()) {
                            ++genderTrue;
                        }
                        else {
                            ++genderFalse;
                        }
                    }
                    else {
                        ++genderNonExistent;
                    }

                    // check university -- issues with university false
                    if (obj.educations) {
                        ++universityExists;
                        for (j=0; j < obj.educations.length; ++j) {
                            if (obj.educations[j].school == 'University of Michigan') {
                                ++universityTrue;
                                break;
                            }
                            else if (j == (obj.educations.length - 1)) {
                                ++universityFalse;
                            }
                        }
                    }
                    else {
                        ++universityNonExistent;
                    }
                }
                console.log("AGE \nageExists: "+ageExists+"\nageNonExistent: "+ageNonExistent+"\nageTrue: "+ageTrue+"\nageFalse: "+ageFalse+"\n");
                console.log("GENDER \ngenderExists: "+genderExists+"\ngenderNonExistent: "+genderNonExistent+"\ngenderTrue: "+genderTrue+"\ngenderFalse: "+genderFalse+"\n");
                console.log("EDUCATION \nuniversityExists: "+universityExists+"\nuniversityNonExistent: "+universityNonExistent+"\nuniversityTrue: "+universityTrue+"\nuniversityFalse: "+universityFalse+"\n");
                return callback(null, "possible_persons found");
            }
            else {
                console.log(params[nameattribute]+" : no person found");
                return callback(null, "no one found");
            }
            //console.log("data: ")
            /*
            if (data.possible_persons && data.possible_persons[0]) {
                var obj = data.possible_persons[0];
                /*Object.keys(obj).forEach(function(key) {
                    console.log(params[nameattribute]);
                    if (key != '@search_pointer') {
                        console.log(key, obj[key]);
                    }
                    // having some issues, keeps hitting the same name
                }); 
                return callback(null, data.possible_persons[0]);
            }
            else {
                console.log(data);

                // should soon be changed to callback(data, null);
                return callback(null, data);
            }
            //console.log(data.possible_persons[0]); */
        }
    });
};



module.exports = Pipl;
