#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var lineReader = require('line-reader');
var htmlToText = require('html-to-text');
var productParser = require('./productParser.js');

program
  .version('0.0.1')
  .option('-i, --in [file]', 'Specify the file to input', 'items.txt')
  .parse(process.argv);

//Selenium
var webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;
var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

//Parse data and send to Parse server
var itemCounter = 0;
var itemsFile = "lululemonSources.txt";//program.in;
var outFile = itemsFile.replace(/\.txt/, "Details.txt");    

var alreadyProcessedLines = [];
fs.writeFileSync(outFile, "[");
lineReader.eachLine(itemsFile, function(line, last, resume) {
  
  	var url = line;

  	//Make sure we don't process the same url twice
  	if (alreadyProcessedLines.indexOf(url) == -1)
  	{
  		//Track the line we already processed
  		alreadyProcessedLines.push(url);

	  	console.log("Processing " + itemCounter++  + " at: " + url);

	  	//Get the page
	  	driver.get(url);
	  	driver.getPageSource().then(
	  		function(body)
	  		{		    	
		    	if (body != null)
		    	{
		    		console.log("	>Received body of length: " + body.length);
		    		productParser.parseLululemon(body).then(
						function(result)
						{
							console.log("Result: " + JSON.stringify(result, null, 2));
							resume();
						},
						function(error)
						{
							console.log("Error: " + error);
							resume();
						}
					);
			    };
		});	  	
	}
	else
	{
		resume();
	}
});