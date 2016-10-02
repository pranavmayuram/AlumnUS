var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var request     = require('request');
var config      = require('../config.json');
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

var RequestProcessing       = {
    total: -1,
    processed: -1,
    incrementProcessed: function() {
        RequestProcessing.processed += 1;
    },
    setTotal: function(someInt) {
        RequestProcessing.processed = 0;
        RequestProcessing.total = someInt;
    },
    getObj: function() {
        return {"total": RequestProcessing.total, "processed": RequestProcessing.processed};
    },
    reset: function() {
        RequestProcessing.total = -1;
        RequestProcessing.processed = -1;
    }
};

exports.RequestProcessing = RequestProcessing;


var appRouter = function(router) {

    router.get("/api/requestProcessing", function(req, res) {
        return res.json(RequestProcessing.getObj());
    });

    router.post("/api/uploadExcel", upload.single('userPhoto'), function(req, res) {
        console.log("endpoint hit");
        console.log(req.body);
        console.log(req.file);
        if (RequestProcessing.total > -1) {
            return res.send("A request is currently processing, please try again in a few minutes, once the request has been processed.");
        }

        Excel.upload(req.body, req.file, function(error, JSONfilename) {
            if (error) {
                console.log(error);
                return next(error);
            }
            console.log(JSONfilename);

            Pipl.searchJSONfile(JSONfilename, req.body, function(err, JSONresults) {
                if (err) {
                    console.log('ended on error');
                    // raise error to caller
                    return next(err);
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
                        return next(err);
                    }
                    console.log(JSONfilename + " deleted successfully");
                    Excel.download(JSONresults, function (err, fileLocation) {
                        res.download(fileLocation, "AlumnUS_"+req.file.originalname+".xls", function (err) {
                            if (err) {
                                console.log(err);
                                return next(err);
                            }
                            RequestProcessing.reset();
                            fs.unlinkSync(fileLocation);
                            console.log("Excel file "+fileLocation+" successfully deleted");
                        });
                    });
                });
            });
            // return res.send('woot');
        });
    });

    router.get("/*", function(req, res) {
        console.log("getting to index.html"); // load the single view file (angular will handle the page changes on the front-end)
        res.sendfile('public/index.html');
    });

};

module.exports = appRouter;
