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
		    	console.log("	>Received item");

		    	if (body != null)
		    	{
		    		productParser.parseLululemon(body).then(
						function(result)
						{
							console.log("Result: " + JSON.stringify(result, null, 2));
							resume();
						}
					);
			  //   	//Parse with cheerio
			  //   	var $ = cheerio.load(body);

			  //   	//Find items and save to array
			  //   	var price = $("span.amount").text();
			  //   	var name = $("div.OneLinkNoTx").text();
			  //   	// var description = $("div#productImage").text();
			  //   	var whyWeMadeThis = $(".why-we-made-this > p").html();			    	
					// var fabricAndFeatures = $(".why-we-made-this").next().next().html();					
					// var fitAndFunction = $(".why-we-made-this").next().next().next().next().html();					

					// //Convert to text
					// whyWeMadeThis = htmlToText.fromString(whyWeMadeThis);
					// fabricAndFeatures = htmlToText.fromString(fabricAndFeatures);
					// fitAndFunction = htmlToText.fromString(fitAndFunction);

					// // //Remove new lines
			  // //   	whyWeMadeThis = whyWeMadeThis.replace(/(\n)+/g, " ");
			  // //   	fabricAndFeatures = fabricAndFeatures.replace(/(\n)+/g, " ");
			  // //   	fitAndFunction = fitAndFunction.replace(/(\n)+/g, " ");

			  // //   	//Replace asterisks
					// // whyWeMadeThis = whyWeMadeThis.replace(/\*/gi, "\.");
			  // //   	fabricAndFeatures = fabricAndFeatures.replace(/\*/gi, "\.");
			  // //   	fitAndFunction = fitAndFunction.replace(/\*/gi, "\.");

			  // //   	//Remove non-standard characters
					// // whyWeMadeThis = whyWeMadeThis.replace(/[^a-z0-9\.\-]+/gi, " ");
			  // //   	fabricAndFeatures = fabricAndFeatures.replace(/[^a-z0-9\.\-]+/gi, " ");
			  // //   	fitAndFunction = fitAndFunction.replace(/[^a-z0-9\.\-]+/gi, " "); 	

					// console.log("	>Why We Made This: " + whyWeMadeThis);
					// console.log("	>Fabric and Features: " + fabricAndFeatures);
					// console.log("	>Fit and Function: " + fitAndFunction);

			  //   	//Translate
			  // 		var item = new Object();
			  //   	item.price = price.trim();

			  //   	//English
			  //   	item.name = name;
			  //   	item.whyWeMadeThis = whyWeMadeThis;
			  //   	item.fabricAndFeatures = fabricAndFeatures;
			  //   	item.fitAndFunction = fitAndFunction;

			  //   	console.log("	>Item details: " + JSON.stringify(item, null, 2));

					// //Write to file directly to save memory
					// var lineToWrite =  JSON.stringify(item);

					// if (!last)
					// {
					// 	lineToWrite = lineToWrite  + ", ";
					// }
					// else
					// {
					// 	lineToWrite = lineToWrite + "]";
					// }

					// //Write to file
					// fs.appendFileSync(outFile, lineToWrite);

					// resume();  	
			    };
		});	  	
	}
	else
	{
		resume();
	}
});