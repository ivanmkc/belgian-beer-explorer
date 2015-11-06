#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
// var LineByLineReader = require('line-by-line');
var lineReader = require('line-reader');
var Spreadsheet = require('edit-google-spreadsheet');
 
//Settings
kSpreadSheetId = '1yKGFddSma3ABYudt6aWDs3zi8tLpRpR-WQysuyKpjnk';
kWorksheetName = 'Sheet1';
kServiceAccountEmail = '486557618341-7f7p526uvfdr9r950tolunf01pvpu66s@developer.gserviceaccount.com';
kKeyFile = 'buyma.pem';

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

		program
		  .version('0.0.1')
		  .option('-i, --in [file]', 'Specify the file to input', 'items.txt')
		  .parse(process.argv);

	    spreadsheet.receive(function(err, rows, info) {
	        if (err) {
	            throw err;
	        }

			//Parse data and send to Parse server
			var itemCounter = 0;
			var urlPrefix = "http://www.buyma.com";
			// var itemsFile = "CanadaItems2.txt";
			var itemsFile = program.in;
			var outFile = itemsFile.replace(/\.txt/, "Details.txt");    

			var alreadyProcessedLines = [];
			fs.writeFileSync(outFile, "[");
			lineReader.eachLine(itemsFile, function(line, last, resume) {
			  
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

							fs.appendFileSync(outFile, lineToWrite);

							//Send to spreadsheet
							var row = info.lastRow + itemCounter;
							itemCounter++;
							var rowItem = new Object();
							rowItem[row] = {1: item.name,
											2: item.price,
											3: item.brand,
											4: item.link};
							spreadsheet.add(rowItem);
							spreadsheet.send(function(err) {
						      if(err) throw err;
						      	console.log("	>Updated spreadsheet!")
						      resume();
						    });						
				    });
				}
				else
				{
					resume();
				}			
		    });
		});
	  });
