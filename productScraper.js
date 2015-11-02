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
			function(err, response, body) {			  	    	
				if (err)
				{
					reject(err);
				}
				else if (response.statusCode !== 200)
				{
					err = new Error("Unexpected status code: " + response.statusCode);
	                err.res = response;
	                return reject(err);
				}
				else
				{
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
			    }
	    });
    });
}

// var urlFormat = "http://www.buyma.com/r/_CANADA-GOOSE-%E3%82%AB%E3%83%8A%E3%83%80%E3%82%B0%E3%83%BC%E3%82%B9/-C1001_<page>/";
// var urlFormat = "http://www.buyma.com/r/_KATE-SPADE-%E3%82%B1%E3%82%A4%E3%83%88%E3%82%B9%E3%83%9A%E3%83%BC%E3%83%89_<page>/";
// var urlFormat = "http://www.buyma.com/r/-A2001003000_<page>/";
// var urlFormat = "http://www.buyma.com/r/_LULULEMON-%E3%83%AB%E3%83%AB%E3%83%AC%E3%83%A2%E3%83%B3_<page>/";
var urlFormat = "http://www.buyma.com/r/_VICTORIAS-SECRET-%E3%83%B4%E3%82%A3%E3%82%AF%E3%83%88%E3%83%AA%E3%82%A2%E3%82%B7%E3%83%BC%E3%82%AF%E3%83%AC%E3%83%83%E3%83%88_<page>/"
var startingPage = 1;
var outFile = "VictoriasSecretItems.txt";

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