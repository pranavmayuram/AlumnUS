var uuid        = require("uuid");
var multer      = require("multer");
var node_xj     = require("xls-to-json");
var json2xls    = require("json2xls");
var fs			= require("fs");

function Excel() { };

Excel.upload = function(params, fileInfo, callback) {

    if (!fileInfo) {
        return callback(null, 'blah');
    }

    //if(done==true) {
        if (fileInfo.size >= 300000) {
            fs.unlink(fileInfo.path, function (err) {
                if (err) {
                    return callback(err, null);
                }
                console.log('deleted file that was too large: '+fileInfo.size);
                return callback({status: "error", message: "Spreadsheet was too large; not uploaded. Please try again."}, null);
            });
        }
        else {
        	var jsonpath = "./JSON/alumnus_" + uuid.v1() + ".json";

            var node_excel = node_xj({
	            input: fileInfo.path,  // input xls
	            output: null, // output json 			// can this be exported to a variable? (can also do from a file if need be)
	            sheet: params.sheetname  // specific sheetname
	        }, function(err, result) {
	            if(err) {
	            	console.error(err);
	            	return callback(err, null);
	            }
	            else {
                    fs.writeFileSync(jsonpath, JSON.stringify(result));
                    fs.unlink(fileInfo.path, function (error) {
                        if (error) {
                            return callback(error, null);
                        }
                        console.log(result);
                        console.log('deleted file '+fileInfo.path+' after conversion to JSON');
                        return callback(null, jsonpath);
                    });
	            	// read the file and get JSON, and make a call for each person using PIPL
	            	// SHOULD THAT BE A DIFFERENT FUNCTION?

	            	// ONCE IT IS PARSED AND U HAVE THE JSON, YOU NEED TO EXPORT TO EXCEL
	            	// SAME AS ABOVE
	            }
	        });
        };
    //}
};

Excel.download = function(JSONresults, callback) {
    var xls = json2xls(JSONresults);
    var cachePath = "./uploads/download_" + uuid.v1() + ".xls";
    fs.writeFileSync(cachePath, xls, 'binary');
    return callback(null, cachePath);
};



module.exports = Excel;
