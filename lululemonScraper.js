#!/usr/local/bin/node

var program = require('commander');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var lineReader = require('line-reader');
var htmlToText = require('html-to-text');
var productParser = require('./productParser.js');
var Parse = require("parse/node");
Parse.initialize("ZjuQjiF1XPzUA2iY82cGKhmE5czhi4AhCnbNNeTO", "ulaJU0JGr7oPGXB9nolxMzUvXn2gV1otu8MTOVJw", "cD3d8LxY8CnS180zczxQGjjMKycE2la8UNPwnmYJ");

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
							result.link = url;
							products.push(result);
							console.log("Result: " + JSON.stringify(result, null, 2));

							if (last)
							{		
								//Save to disk
								fs.writeFileSync(outFile, JSON.stringify(products, null, 2));

							    itemCounterProcessed = 0;

							    console.log("Saving products to server...");
							    products.forEach(
							    	function(product)
							    	{				        		
							    		//Save to Parse
							    		var Product = Parse.Object.extend("Product");

										//Find an existing product
										var query = new Parse.Query(Product);
										query.equalTo("productId", product.productId);
										console.log("	>Looking for an existing product");
										query.first().then(function(productOnParse)
										{
											var isNewProduct = productOnParse == null;
											if (isNewProduct)
											{
												//Create a new product
												console.log("	>Creating a new product");
												productOnParse = new Product();
											}
											else
											{
												// console.log("	>Updating an existing product: " + productOnParse.id);
												console.log("	>Skipping an existing product: " + productOnParse.id);
											}
											
											//Skip existing products as it will overwrite user-submitted information
											if (isNewProduct)
											{
												productOnParse.set("name", product.name);
												productOnParse.set("price", product.price);
												productOnParse.set("description", product.description);
												productOnParse.set("descriptionJP", product.descriptionJP);
												productOnParse.set("swatches", product.swatches);
												productOnParse.set("link", product.link);
												productOnParse.set("productId", product.productId);
												productOnParse.set("brand", product.brand);
												productOnParse.save();
											}
										});										

									    itemCounterProcessed++;	
									});									
							}

							resume();
						});
				}
		});	  	
	}
	else
	{
		resume();
	}
});