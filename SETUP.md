
### Node.js Setup
For the purposes of this project, the only build known to be stable is v0.12.7. There are a few ways of doing this:
* If you do not already have Node.js installed, you can download a workable version from the <a href="https://nodejs.org/download/release/v0.12.7/">official Node previous versions</a>.
* If you do have Node.js already installed, look into <a href="https://www.npmjs.com/package/nvm">Node Version Manager (NVM)</a> and once installed, use the ````$ nvm install 0.12.7```` and ````$ nvm use 0.12.7```` to get up and running!
* If you're working on an external server, use a package manager (instructions on the <a href="https://github.com/joyent/node/wiki/installing-node.js-via-package-manager">Official Joyent github page</a>) to either download v0.12.7 directly, or download the newest version of node, and then use NVM.

### App Specific Setup
1. Once completely set up with Node.js, clone the repository using the ````$ git clone https://github.com/pranavmayuram/AlumnUS.git```` command, in the directory you desire.
2. Then run the command ````$ npm install```` which will install all the necessary packages for the project from the <a href="https://www.npmjs.com/">Node Package Manager</a> which should have been installed with Node.
3. To ensure that your Pipl API key is properly used, and the API calls can be made, first rename **config_public.json** to  **config.json**, and fill the "piplKey" field with your API key obtained from the <a href="http://pipl.com/dev">Pipl developer portal</a>.
4. Finally, run the command ````$ node app.js```` which will start the server for the project, allowing your back-end to accept API calls.
5. Redirect your IP to **http://IPofYourMachine:4300**, (use localhost for IPofYourMachine if the Node server is running on the same machine that you are currently on).
6. Here, you can upload your XLS files easily, and wait for a download of an XLS sheet with addresses and error codes appended. To interpret this, refer to the <a href="./README.md">README.md</a>.
