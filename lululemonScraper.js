#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var lineReader = require('line-reader');
var htmlToText = require('html-to-text');
var productParser = require('./productParser.js');
var Spreadsheet = require('edit-google-spreadsheet');

program
  .version('0.0.1')
  .option('-i, --in [file]', 'Specify the file to input', 'items.txt')
  .parse(process.argv);

  //Settings
kWorksheetName = 'Sheet1';
kSpreadSheetId = '1LIVMXxaLEm7bs5HmLNiIjiL_snjObKBh0AWVxhJE4Pk';
kServiceAccountEmail = '486557618341-7f7p526uvfdr9r950tolunf01pvpu66s@developer.gserviceaccount.com';
kKeyFile = 'buyma.pem';

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
// fs.writeFileSync(outFile, "[");
var products = [];
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
							products.push(result);
							console.log("Result: " + JSON.stringify(result, null, 2));

							if (last)
	{		
		//Save to disk
		fs.writeFileSync(outFile, JSON.stringify(products));

		//Send to Google spreadsheets
		Spreadsheet.load({
			debug: true,
			spreadsheetId: kSpreadSheetId,
			worksheetName: kWorksheetName,
			 oauth : {
			      email: kServiceAccountEmail,
			      keyFile: kKeyFile
			}},
				function sheetReady(err, spreadsheet) {	
					if (err) {
				        throw err;
				    }

				    spreadsheet.receive(function(err, rows, info) {
				        if (err) {
				            throw err;
				        }

				        itemCounterProcessed = 0;
				        products.forEach(
				        	function(product)
				        	{				        		
				        		var row = info.lastRow + itemCounterProcessed;
				        		var rowItem = new Object();

				        		//Convert to Google format
				        		var itemAsRow = new Object();
				        		itemAsRow[1] = product.name;
				        		itemAsRow[2] = product.price;
				        		itemAsRow[3] = JSON.stringify(product.whyWeMadeThis, null, 2);
				        		// console.log("ASDF : " + product.fabricAndFeatures);
				        		itemAsRow[4] = JSON.stringify(product.fabricAndFeatures, null,2);
				        		itemAsRow[5] = JSON.stringify(product.fitAndFunction, null,2);
				        		itemAsRow[6] = JSON.stringify(product.whyWeMadeThisJP, null,2);
				        		itemAsRow[7] = JSON.stringify(product.fabricAndFeaturesJP, null,2);
				        		itemAsRow[8] = JSON.stringify(product.fitAndFunctionJP, null,2);


				        		rowItem[row] = itemAsRow;

								spreadsheet.add(rowItem);
								spreadsheet.send(function(err) {
							      if(err)
							      {
							      	console.log("Error with row: " + JSON.stringify(rowItem))
							      	//Try one more time
							      	spreadsheet.send(function(err) 
							      	{
							      		console.log("	>Updated spreadsheet!")
								      	resume();
							      	});
							      	// throw err;
							      }
							      else
							      {
							      	console.log("	>Updated spreadsheet!")
							      	resume();
							      }
							    });	


							    itemCounterProcessed++;	
							});
					});
				});
			// });
	}
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