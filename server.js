//console.log(os.networkInterfaces())
const hostname = 'http://192.168.1.30'		// Change this to whatever you want
const port = 3000;


const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os')

const readline = require("node:readline");
let rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question("What event key to start in? ", (input) => {
	startServer(input)
	rl.close()
})






function startServer(event_key) {

	console.log("reading scheme.json")
	let scheme = JSON.parse(fs.readFileSync(`./data/${event_key}/scheme.json`))
	console.log("reading meta.json")
	let meta = JSON.parse(fs.readFileSync(`./data/${event_key}/meta.json`))
	console.log("reading teamData.json\n")
	let teamData = JSON.parse(fs.readFileSync(`./data/${event_key}/teamData.json`))


	const server = http.createServer((req, res) => {
	    if (req.url === "/favicon.ico") {
	        return
	    }

	    if (req.method == 'GET') {
	    	console.log(req.url)
	    	let [domain, method, ...otherArgs] = req.url.split("/")
	    	let response;
	    	let error = false;
	    	switch (method) {
	    		case "status":
					console.log("Responding to status")
	    			break
	    		case "scheme.json":
	    			console.log("Responding to scheme.json")
  					response = JSON.stringify(scheme);
  					break
  				case "meta.json":
  				    console.log("Responding to meta.json")
  					response = JSON.stringify(meta);
  					break
  				case "teamData":
  					console.log("Responding to teamData")
  					response = JSON.stringify(teamData);
  					break
  				default:
  					console.log("ERROR: Unable to find page " + req.url)
  					error = true
	    	}
	    	if (error) {
				res.statusCode = 404;
				res.setHeader('Content-Type', 'text/plain');
				res.end("404 Not Found");
	    	} else {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.end(response);
			}

	    } else if (req.method == 'POST') {

	    	let body = ''

		    req.on('data', (data) => body += data)

		    req.on('end', () => {
		      console.log('Data: ' + body)
		      let username = req.headers.username
		      let jsonBody =  JSON.parse(body)

		      let answer = jsonBody.answers
		      answer.author = username
		      answer.timestamp = Date.now()

		      teamData[jsonBody.team_num].responses.push(answer)

		      fs.writeFile(`./data/${event_key}/teamData.json`, JSON.stringify(teamData, null, 2), (err) => {
		      	if (err) {
		      		console.error("Error updating teamData.json", err)
		      		return
		      	}
		      	console.log("teamData updated successfully")
		      })

		      res.writeHead(200, {'Content-Type': 'text/plain'})
		      res.end()
		    })
	    } else {
	        console.log("Error, request method", req.method)
	    }

	});

	server.listen(port, hostname, () => {
	    console.log(`Server running at http://${hostname}:${port}/`);
	});
}