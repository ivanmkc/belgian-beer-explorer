#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var lineReader = require('line-reader');
var trans = require('translate-google-free');

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
		    	console.log("	>Received item");

		    	if (body != null)
		    	{
			    	//Parse with cheerio
			    	var $ = cheerio.load(body);

			    	//Find items and save to array
			    	var price = $("span.amount").text();
			    	var name = $("div.OneLinkNoTx").text();
			    	var description = $("#productImage").text();
			    	description = description.replace(/(\n)+/g, ".");
			    	description = description.replace(/(\t)+/g, " ");

			    	//Translate
			    	trans(name + ":::" + description, 'en', 'ja', 
			    		function(err, translation) {
			    			if (err == null)
			    			{
						  		console.log("Translation complete!");

						  		var item = new Object();
						    	item.price = price;
						    	item.name = name;
						    	item.description = description;
						    	var translations = translation.split(":::");
						    	item.nameJP = translations[0];
						    	item.descriptionJP = translations[1];

						    	console.log("	>Item details: " + JSON.stringify(item));

								//Write to file directly to save memory
								var lineToWrite =  JSON.stringify(item);

								if (!last)
								{
									lineToWrite = lineToWrite  + ", ";
								}
								else
								{
									lineToWrite = lineToWrite + "]";
								}

								fs.appendFileSync(outFile, lineToWrite);
							}
							else
							{
								console.log("Error translating: " + err);
							}
							resume();
					});			    	
			    };
		});	  	
	}
	else
	{
		resume();
	}
});