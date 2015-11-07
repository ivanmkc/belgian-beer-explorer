#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
// var LineByLineReader = require('line-by-line');
var lineReader = require('line-reader');
var Spreadsheet = require('edit-google-spreadsheet');
 
program
	.version('0.0.1')
	.option('-i, --in [file]', 'Specify the file to input', 'items.txt')
	.option('-s, --sheet [sheetId]', 'Specify the sheet id', '')
	.option('-w, --worksheet [wordsheetName]', 'Specify the worksheet name', 'Sheet1')
	.option('-x, --index [startIndex]', 'Specify the starting index', 0)
	.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

//Settings
kSpreadSheetId = program.sheet;
kWorksheetName = program.worksheet;
kServiceAccountEmail = '486557618341-7f7p526uvfdr9r950tolunf01pvpu66s@developer.gserviceaccount.com';
kKeyFile = 'buyma.pem';
kStartIndex = program.index;

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

			//Parse data and send to Parse server
			var itemCounter = 0;
			var itemCounterProcessed = 0;

			var urlPrefix = "http://www.buyma.com";
			// var itemsFile = "CanadaItems2.txt";
			var itemsFile = program.in;
			var outFile = itemsFile.replace(/\.txt/, "Details.txt");    

			var alreadyProcessedLines = [];
			fs.writeFileSync(outFile, "[");
			lineReader.eachLine(itemsFile, function(line, last, resume) {
			  
	  			if (itemCounter<kStartIndex)
				{
					resume();
				}
				else
				{
				  	var relativeURL = line;

				  	//Make sure we don't process the same url twice
				  	if (alreadyProcessedLines.indexOf(relativeURL) == -1)
				  	{
				  		//Track the line we already processed
				  		alreadyProcessedLines.push(relativeURL);

					  	var url = urlPrefix + relativeURL;
					  	console.log("Processing " + itemCounter  + " at: " + url);
						request({uri: url}, 
							function(error, response, body) {
								if (error)
								{
									throw error;
								}			  	

						    	console.log("	>Received item");

						    	//Parse with cheerio
						    	var $ = cheerio.load(body);

						    	//Find items and save to array
						    	var price = $("span.price_txt").text();
						    	var priceOriginal = $("span.percent_refer").text();
						    	var percentDiscount = $("span.percent_box").text();
						    	var accessCount = $("span.ac_count").text();
						    	var favCount = $("span.fav_count").text();
						    	// var brand = $("a.ulinelink").text();
						    	var name = $("span[itemprop='name']").text();
						    	var season = $("#s_season > dd").text();
						    	var brand = $("a[itemprop='brand']").text();
						    	var location = $("#s_buying_area > dd > a").text();
						    	var numberOfInquiries = $("#tabmenu_inqcnt").text();
						    	var buyerName = $("#buyer_name > a").text();
						    	var buyerLink = $("#buyer_name > a").attr("href");
						    	// var buyerSex = $("#buyer_status > .fab-design-mg--l5").text();
						    	// var buyerCreationDate = $("#buyer_status > .fab-design-mg--b15").text();
						    	// var buyerNumberOfItemsSelling
						    	// var buyerFunLevel = 			

						    	var item = new Object();
						    	item.price = price;
						    	item.priceOriginal = priceOriginal;
						    	item.percentDiscount = percentDiscount;
						    	item.accessCount = accessCount;
						    	item.favCount = favCount;
						    	item.name = name;
						    	item.season = season;
						    	item.brand = brand;
						    	item.location = location;
						    	item.numberOfInquiries = numberOfInquiries;
						    	item.buyerName = buyerName;
						    	item.buyerLink = urlPrefix + buyerLink;
						    	item.link = urlPrefix + relativeURL;
						    	item.pageRanking = itemCounter;

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

								//Write to file
								fs.appendFileSync(outFile, lineToWrite);

								//Convert item to spreadsheet format
								var rowItem = new Object();
								var keys = Object.getOwnPropertyNames(item);
								var itemAsRow = new Object();
								for (var keyIndex = 1; keyIndex <= keys.length; keyIndex++)
								{
									itemAsRow[keyIndex] = item[keys[keyIndex]];
								}

								//If is the first row, write header
								if (info.lastRow == 1)
								{
									var headerItem = new Object();
									var headersAsRow = new Object();
									for (var keyIndex = 1; keyIndex <= keys.length; keyIndex++)
									{
										headersAsRow[keyIndex] = keys[keyIndex];
									}
									headerItem[1] = headersAsRow;
									spreadsheet.add(headerItem);
								}

								//Increment item counter
								itemCounterProcessed++;

								//Set the row
								var row = info.lastRow + itemCounterProcessed;
								rowItem[row] = itemAsRow;
								// console.log("Current row: " + JSON.stringify(rowItem));

								spreadsheet.add(rowItem);
								spreadsheet.send(function(err) {
							      if(err)
							      {
							      	console.log("Error with row: " + JSON.stringify(rowItem))
							      	throw err;
							      }
							      	console.log("	>Updated spreadsheet!")
							      resume();
							    });						
					    });
					}
					else
					{
						resume();
					}		
				}	

				itemCounter++;
		    });
		});
	  });
