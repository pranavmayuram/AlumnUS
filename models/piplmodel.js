var async       = require("async");
var fs			= require("fs");
var config      = require('../config.json');
var pipl        = require('pipl')(config.piplKey);
var Bottleneck  = require("bottleneck");
var request     = require("request");
var moment      = require("moment");

var MAX_RPS     = 1;
var limiter     = new Bottleneck(MAX_RPS, 500);
var result_arr  = [];
var high_scores = [];
var high_objs   = [];

// max number of API requests pipl can handle per second

function Pipl() { };

Pipl.personObjQuery = function(params, nameattribute, callback) {

    // var formed_JSON = JSON.stringify({"emails":[{"address": "clark.kent@example.com"}],"addresses":[{"country":"US", "state": "KS", "city": "Metropolis"},{"country":"US", "state": "KS", "city": "Metropolis"}]});
    // could use the "degree" attribute if you want?
    var date_start = (moment().year() - params.Age - 3) + "-01-01";
    var date_end = (moment().year() - params.Age + 2) + "-12-31";
    var formed_JSON = {
        educations : [{"school":"University of Michigan"}],
        gender : {"content":params.Age},
        names : [{"raw":params[nameattribute]}],
        dob : {
            "date_range": {
                "start":date_start,
                "end":date_end
            }
        }
    };

    // {"raw_name": params[nameattribute], "gender": params.Gender.toLowerCase(), "age": params.Age}
    request.post({'url': 'http://api.pipl.com/search/v4/'} , {
        form: {
            person: JSON.stringify(formed_JSON),
            key: config.piplKey
        }
    },
    function (error, response, body) {
        if (error || body.error) {
            console.log("error: ");
            console.log(error);
            return callback(error, null);

        }
        console.log("BODY:");
        var bodyParsed = JSON.parse(body);
        console.log(bodyParsed);
        if (bodyParsed.possible_persons) {
            console.log("dataPurified has " + bodyParsed.possible_persons.length + " results");
        }
        else {
            console.log("no dataPurified possible_persons");
        }
        return callback(null, bodyParsed);
    });
};

Pipl.searchJSONfile = function(filename, params, callback) {

    var currentJSON = require("."+filename);
    // var requestArray = [];
    console.log("start");
    var start = new Date().getTime();
    console.log(start);
    console.log("currentJSONlength : " + currentJSON.length);
    result_arr = [];
    high_scores = [];
    high_objs = [];

    async.each(currentJSON, function (person, cb) {
        console.log(person[params.nameattribute] + " was submitted to limiter");
        limiter.submit(function(get_out) {
            Pipl.filter (person, params.nameattribute, function(error) {
                if (error) {
                    console.log(error);
                }

                // determine address here!!
                console.log("high_scores.length: " + high_scores.length);
                console.log("high_objs.length: " + high_objs.length);
                var highest_index = 0;
                for (i=0; i < high_scores.length; ++i) {
                    if (high_scores[i] > high_scores[highest_index]) {
                        highest_index = i;
                    }
                }
                result = high_objs[highest_index];
                highScore = high_scores[highest_index];

                var err_code = "";
                console.log((new Date().getTime() - start)/1000);
                if (result) {
                    if (result.address) {
                        console.log(params.nameattribute + " lives at: " + result.address.display);
                        person.address = result.address.display;
                    }
                    else if (result.addresses) {
                        console.log(params.nameattribute + " lives at: " + result.addresses[0].display);
                        person.address = result.addresses[0].display;
                    }
                    else {
                        person.address = "NOT FOUND";
                    }
                }
                else {
                    // handles cases of no results found
                    person.address = "NOT FOUND";
                }


                // determine strength of result here!!
                var num_same = 0;
                var num_close = 0;
                console.log("result_arr.length: " + result_arr.length);
                for (i=0; i < result_arr.length; ++i) {
                    if (result_arr[i] == highScore) {
                        ++num_same;
                    }
                    else if ((highScore - result_arr[i]) <= highScore/4) {
                        ++num_close;
                    }
                }

                console.log("highScore/4: " + highScore/4);
                console.log("num_same: " + num_same + ", num_close: " + num_close);

                if (person.address === "NOT FOUND") {
                    err_code = "NR";
                }
                else if (highScore >= 8) {
                    err_code = "SR";
                }
                else if (highScore <= 4) {
                    err_code = "WK";
                }
                else if (num_same >= 3 || num_close >= 6 || (num_same + num_close >= 6)) {
                    err_code = "TM";
                }
                else {
                    err_code = "MD";
                }

                person.errorCode = err_code;

                result_arr = [];
                high_scores = [];
                high_objs = [];

                get_out();
                cb();

            });
        }, null);
        // cb();
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

Pipl.filter = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

        if (err) {
            console.log("error: ");
            console.log(err);
            return callback(err);
        }
        else {
            console.log("-----------------------------"+params[nameattribute]+"-----------------");
            if (data.person) {
                console.log("ONE RUN");
                console.log("PERSON");
                logObjectResults(data.person);
                var newArr = [data.person];
                Pipl.internalCheck(newArr, params, nameattribute, function (correctIndividual) {
                    return callback(null);
                });
            }
            else if (data.possible_persons.length < 49) {
                // if (data.possible_persons.length == 0) {
                //     return callback("no one found", null);
                // }
                console.log("ONE RUN " + data.possible_persons.length + " results");
                logArrayResults(data.possible_persons);
                Pipl.internalCheck(data.possible_persons, params, nameattribute, function (correctIndividual) {
                    return callback(null);
                });
            }
            else if (data.possible_persons.length >= 49) {
                Pipl.internalCheck(data.possible_persons, params, nameattribute, function (correctIndividual) {
                    pipl.search.query({"raw_name": params[nameattribute], "gender": params.Gender.toLowerCase(), "age": params.Age}, function (errFiltered, dataFiltered) {
                        if (errFiltered) {
                            console.log("errFiltered: ");
                            console.log(errFiltered);
                            return callback(errFiltered);
                        }
                        else if (dataFiltered.person) {
                            console.log("TWO RUNS");
                            console.log("PERSON");
                            logObjectResults(dataFiltered.person);
                            var newArrFiltered = [dataFiltered.person];
                            Pipl.internalCheck(newArrFiltered, params, nameattribute, function (correctIndividual) {
                                return callback(null);
                            });
                        }
                        else {
                            logArrayResults(dataFiltered.possible_persons);
                            Pipl.internalCheck(dataFiltered.possible_persons, params, nameattribute, function (correctIndividual) {
                                if (dataFiltered.possible_persons.length >= 49) {
                                    Pipl.personObjQuery(params, nameattribute, function (errPurified, dataPurified) {
                                        if (errPurified) {
                                            console.log("errPurified: ");
                                            console.log(errPurified);
                                            return callback(errPurified);
                                        }
                                        else if (dataPurified.person) {
                                            console.log("THREE RUNS");
                                            console.log("PERSON");
                                            logObjectResults(dataPurified.person);
                                            var newArrPurified = [dataPurified.person];
                                            Pipl.internalCheck(newArrPurified, params, nameattribute, function (correctIndividual) {
                                                return callback(null);
                                            });
                                        }
                                        else if (dataPurified.possible_persons) {
                                            console.log("THREE RUNS " + dataPurified.possible_persons.length + " RESULTS");
                                            logArrayResults(dataPurified.possible_persons);
                                            Pipl.internalCheck(dataPurified.possible_persons, params, nameattribute, function (correctIndividual) {
                                                return callback(null);
                                            });
                                        }
                                        else {
                                            return callback("no one found in Purified Search");
                                        }
                                    });
                                }
                                else {
                                    return callback(null);
                                }
                            });
                        }
                    });
                });
            }
        }
    });
};

Pipl.internalCheck = function(data, params, nameattribute, callback) {

    // set values for each attribute
    var ageTrue = 2;
    var genderTrue = 2;
    var annArborAddress = 4;
    var universityTrue = 5;
    var scoreArray = [];

    // loop through all possible_persons and add score to array
    for (i=0; i < data.length; ++i) {
        var score = 0;
        var obj = data[i];

        // check date of birth
        if (obj.dob && obj.dob.display) {
            for (j = params.Age - 2; j <= params.Age + 2; ++j) {
                if (obj.dob.display.substr(0, obj.dob.display.indexOf(' ')) == j) {
                    if (j >= params.Age) {
                        score += ageTrue;
                    }
                    else {
                        score += ageTrue/2;
                    }
                }
                // increase if we know correct, decrease if false
            }
        }
        // don't add or diminish if no field for age

        // check gender
        if (obj.gender && obj.gender.content) {
            if (obj.gender.content.toLowerCase() == params.Gender.toLowerCase()) {
                score += genderTrue;
            }
        }

        // check university -- issues with university false
        if (obj.educations) {
            for (j=0; j < obj.educations.length; ++j) {
                if (obj.educations[j].school == "University of Michigan") {
                    score += universityTrue;
                    break;
                }
            }
        }

        // check if they ever lived in Ann Arbor
        if (obj.addresses) {
            var found = false;
            for (n=0; n< obj.addresses.length; ++n) {
                if (obj.addresses[n].city == "Ann Arbor") {
                    score += annArborAddress;
                    found = true;
                    break;
                }
            }
            // if address in AA already found, then ignore this loop
            if (!found) {
                for (n=0; n< obj.addresses.length; ++n) {
                    if (obj.addresses[n].city == "Ypsilanti") {
                        score += annArborAddress/2;
                        found = true;
                        break;
                    }
                }
            }
            // if address in AA or Ypsi already found, then ignore this loop
            if (!found) {
                for (n=0; n< obj.addresses.length; ++n) {
                    if (obj.addresses[n].state == "MI") {
                        score += annArborAddress/4;
                        found = true;
                        break;
                    }
                }
            }
        }

        // add total score to scoreArray
        scoreArray[i] = score;
    }

    // loop through score array to find highest score
    var highIndex = 0;
    for (z=0; z < scoreArray.length; ++z) {
        if (scoreArray[z] > scoreArray[highIndex]) {
            highIndex = z;
        }
    }
    console.log(scoreArray);
    result_arr.push.apply(result_arr, scoreArray);
    high_objs.push(data[highIndex]);
    high_scores.push(scoreArray[highIndex]);
    console.log(params[nameattribute] + " had highest score of " + scoreArray[highIndex]);

    // not really using this at the moment, but whatever
    return callback(data[highIndex]);
}

var logArrayResults = function(arrayObjects) {
    for (i=0; i < arrayObjects.length; ++i) {
        var obj = arrayObjects[i];
        console.log("-------------------result "+i+"------------------");
        Object.keys(obj).forEach(function(key) {
            // console.log(params[nameattribute]);
            if (key != '@search_pointer') {
                console.log(key, obj[key]);
            }
            // having some issues, keeps hitting the same name
        });
    }
}

var logObjectResults = function(someObj) {
    var obj = someObj;
    Object.keys(obj).forEach(function(key) {
        // console.log(params[nameattribute]);
        if (key != '@search_pointer') {
            console.log(key, obj[key]);
        }
        // having some issues, keeps hitting the same name
    });
}


// take in params from form when uploaded to find attribute that contains name
// TESTING - DEPRECATED
Pipl.metadata = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

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
                    if (obj.gender.content == params.Gender) {
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

// DEPRECATED
Pipl.searchIndividual = function(params, nameattribute, callback) {

    pipl.search.query({"raw_name": params[nameattribute]}, function(err, data) {

        if (err) {
            console.log("error: ");
            console.log(err);
            return callback(err, null);
        }
        else {
            if (data.person) {
                return callback(null, data.person);
            }
            else if (data.possible_persons) {
                return callback(null, data.possible_persons[0]);
            }
            else {
                return callback("no one found", null);
            }
        }
    });
    // look through addresses (how to decide which is newest)
};


module.exports = Pipl;
