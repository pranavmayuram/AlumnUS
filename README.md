<p align="center"><img src="https://www.eecs.umich.edu/eecs/images/EECS-Logo-Mobile.png" width="200"></p>

# AlumnUS

Alumnus serves as a simple REST API which can be used to find Alumni that U of M has lost touch with.

Typical input would be an Excel file, and in response, the app will send a new Excel file with updated results.

It will store information from the API call into a datastore, which can later be queried to find historical results.

There are a few different tools the app makes use of:

* Node.js & NPM
* Express.js
* HTML5/Bootstrap CSS
* <a href="https://pipl.com/dev/">Pipl API to search user information</a>
* <a href="https://www.npmjs.com/package/pipl">Pipl Node Wrapper</a>
* <a href="https://github.com/expressjs/multer">Multer for file uploads</a>
* <a href="https://www.npmjs.com/package/xls-to-json">xls-to-json</a>
* <a href="https://github.com/rikkertkoppes/json2xls">json2xls</a>
