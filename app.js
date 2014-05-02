var util = require('util');
var fs = require('fs');
var beautify = require('js-beautify').js_beautify;
var sleep = require('sleep');
var request = require('request');

var bingkey ="AjwCgUFJFqC19tz3taTaMBDJimU67dknhaBxDvSqjVN6YcBeGJKFlT6NlvKly_tE";
var googlekey = "AIzaSyDcvUt88ePSXWiHZPAeZCmdGxvk5Old8ps";


function fixCurrentData() {
	var grabs = fs.readFileSync("grabbed.txt", {
		encoding : "utf-8"
	}).split("\n");
	var grabbed = {};
	
	for (var i=0;i<grabs.length;i+=2) {
		grabbed[grabs[i]] = grabs[i+1].split(" ");
	}
	
	var resturl = "http://maps.google.com/maps/api/geocode/json?address=ADDRESS&sensor=false";
	var str = fs.readFileSync("USPostsecondarySchools.json", {
		encoding : "utf-8"
	});
	var schools = JSON.parse(str);
	var len = schools.length;
	for (i=0;i<len;i++) {
		var school = schools[i];
		var addr = (school.addr+","+school.city+","+school.zip+","+school.state).replace(/\s+/g,"+");
		var url = resturl.replace(/ADDRESS/,addr);
		if (grabbed[url]) {
			school.lat = grabbed[url][0];
		    school.lng = grabbed[url][1];
		    console.log(school.lat,school.lng);
		}
	}
	str = beautify(JSON.stringify(schools), { indent_size: 2 });
	fs.writeFileSync("USPostsecondarySchools.json", str);
	console.log("JSON file created.");
}

function findLongLat() {
	var resturl = "http://maps.google.com/maps/api/geocode/json?address=ADDRESS&sensor=false";
	var str = fs.readFileSync("USPostsecondarySchools.json", {
		encoding : "utf-8"
	});
	var schools = JSON.parse(str);
	var len = schools.length;
	var index = 0;
	for (var i=0;i<len;i++) {
		if (!schools.lat) {
			index = i;
			break;
		}
	}
	function grab(i) {
		var school = schools[i];
		var addr = (school.addr+","+school.city+","+school.zip+","+school.state).replace(/\s+/g,"+");
		var url = resturl.replace(/ADDRESS/,addr);
		console.log(url);
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			  console.log("grabbing.")
			  try {
			    var obj = JSON.parse(body);
			    school.lat = obj.results[0].geometry.location.lat;
			    school.lng = obj.results[0].geometry.location.lng;
			    console.log(school.lat,school.lng);
			  }
			  catch(e) {}
		  }
		  else console.log("request error");
		  if (i == len -1) {
				str = beautify(JSON.stringify(schools), { indent_size: 2 });
				fs.writeFileSync("USPostsecondarySchoolsWithCoordinates.json", str);
				console.log("JSON file created.");
		  }
		  else {
				sleep.usleep(500000);
				grab(++i);
		  }
		});
	}
	grab(index);
}
//fixCurrentData();
findLongLat();

function createJson() {

	var obj = [];
	var doms = {};

	var str = fs.readFileSync("USPostsecondarySchools.csv", {
		encoding : "utf-8"
	});
	var rows = str.split("\n");
	
	for (var i=0;i<rows.length;i++) {
		var row =  rows[i].split("|"),
			name = row[0],
			addr = row[1],
			city = row[2],
			state = row[3],
			zip = row[4];
		
		if (row[5])
			dom = row[5].replace(/^\/+/,"").replace(/^www\./,"").split("/")[0];
		
		if (dom && !doms[dom]) {
			dom = dom.replace(/^\/+/,"").replace(/^www\./,"").split("/")[0];
			obj.push({
				name: name,
				addr: addr,
				city: city,
				state: state,
				zip: zip,
				dom: dom
			});
			
			doms[dom] = true;
		}
	}
	
	obj.sort(function(a,b) {
		var A = a.state;
		var B = b.state;
		if (A > B) return 1;
		else if (A < B) return -1;
		A = a.name;
		B = b.name;
		if (A > B) return 1;
		else if (A < B) return -1;
		return 0;
	});
	
	str = beautify(JSON.stringify(obj), { indent_size: 2 });
	
	fs.writeFileSync("USPostsecondarySchools.json", str);
	console.log("JSON file created.");

}


