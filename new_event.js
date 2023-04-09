const fs = require('node:fs');
const readline = require("node:readline");
const https = require('node:https');

const API_KEY = fs.readFileSync("TBA_API_KEY.txt")


function API_request(url, callback) {
        let options = {
            hostname: "www.thebluealliance.com",
            path: "/api/v3" + url,
            //method: "GET",
            headers: {
                "X-TBA-Auth-Key": API_KEY,
                //"cache-control": "no-cache"
            }
        }

        console.log("Getting page: " + options.path)

        let api_req = https.get(options, (res) => {
            if (res.statusCode !== 200) {
            	console.error(`Problem with request, status code ${res.statusCode}`)
                return;
            }

            res.setEncoding('utf8');

            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });


            res.on('end', () => {
                callback(JSON.parse(rawData))
            });
        })


        api_req.on("error", (err) => {
            console.error(`Problem with request: ${err.message}`)
        })
}

function writeJsonFile(path, filename, outputString) {
	console.log("Writing " + filename)
	if (!fs.existsSync(path)) {
	    fs.mkdirSync(path, { recursive: true });
	}
	fs.writeFile(path + "/" + filename, outputString, (err) => {
		    if (err) {
		    	throw err;
		    }
		    console.log('Finished writing ' + filename);
	    }
	);
}

function new_event(event_key){
	let filePath = `./data/${event_key}`

	if (fs.existsSync(filePath)) {
		console.error("Event Already Exists")
		return
	}

	let meta = {}
	let teams = {}

	API_request(`/event/${event_key}/simple`, (result) => {
		meta.key = result.key
		meta.name = result.name
		if (!fs.existsSync(filePath)) {
		    fs.mkdirSync(filePath, { recursive: true });
		}
		writeJsonFile(filePath, "meta.json", JSON.stringify(meta))
	})
	API_request(`/event/${event_key}/teams/simple`, (result) => {
		result.forEach((team) => {
			let dataObj = {}
			dataObj.team_number = team.team_number
			dataObj.key = team.key
			dataObj.nickname = team.nickname
			dataObj.responses = []

			teams[dataObj.team_number] = dataObj
		})


		writeJsonFile(filePath, "teamData.json", JSON.stringify(teams))

		console.log("Copying scheme.json")
		fs.copyFileSync(`./data/DEFAULT_scheme.json`, `./data/${event_key}/scheme.json`)	// Just stuffing it in here so it works
	})


}

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
rl.question("New Event Key?", (input) => {
	new_event(input)
	rl.close()
})