var uuid        = require("uuid");
var async       = require("async");
var multer      = require("multer");
var node_xj     = require("xls-to-json");
var fs			= require("fs");

function Pipl { };

Pipl.searchJSONfile = function(filename, params, callback) {
    
    if (!fileInfo) {
        return callback(null, 'blah');
    }

    if(done==true) {
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
        	var excelpath = 
        	node_xj({
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
	        });
        }
    }
};



module.exports = Pipl;
