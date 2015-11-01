#!/usr/local/bin/node

var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");

function getNextPage(urlFormat, pageNumber, itemsSoFar) {
    // maxRedirects = maxRedirects || 0;
    // if (maxRedirects > 10) {
    //     throw new Error("Redirected too many times.");
    // }
    var url = urlFormat.replace(/<page>/gi, pageNumber.toString());
    return new Promise(function (resolve, reject) {
    	console.log("Accessing page: " + pageNumber)
    	request({uri: url}, 
			function(error, response, body) {			  	    	
		    	console.log("	>Received page: " + pageNumber);

		    	//Parse with cheerio
		    	var $ = cheerio.load(body);
		    	var itemsInPage = [];
		    	//Find items and save to array
		    	$(".product_img > a").each(function() {
				    var link = $(this);
				    // var text = link.text();
				    var href = link.attr("href");

				    // console.log(link + " -> " + href);

				    itemsInPage.push(href);
				  });	    	

		    	//Check apology message

		    	//See if there are more pages
		    	var stillHasPages = !$("p").hasClass("search_apologymsg");

		    	//Add to total pages
		    	itemsSoFar = itemsSoFar.concat(itemsInPage);

		        if (stillHasPages) {
		            resolve(getNextPage(urlFormat, pageNumber+1, itemsSoFar));
		        }
		        else
		        {
		        	resolve(itemsSoFar);
		        }
	    });
    });
}

var urlFormat = "http://www.buyma.com/r/_CANADA-GOOSE-%E3%82%AB%E3%83%8A%E3%83%80%E3%82%B0%E3%83%BC%E3%82%B9/-C1001_<page>/";
var startingPage = 1;
var outFile = "CanadaGooseItems.txt";

//Get first page of website
getNextPage(urlFormat, startingPage, []).then(
		function(itemsSoFar)
		{
			console.log("Number of items: " + itemsSoFar.length);
			itemsSoFar.forEach(
				function(item)
				{
					console.log("	>Item found: " + item);
					fs.appendFileSync(outFile, item.toString() + "\n");
				});
		}
	);