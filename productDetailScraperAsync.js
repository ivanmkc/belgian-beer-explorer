#!/usr/local/bin/node

var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var LineByLineReader = require('line-by-line');

//Parse data and send to Parse server
var itemCounter = 0;
var urlPrefix = "http://www.buyma.com";
var itemsFile = "CanadaGooseItems.txt";

var lr = new LineByLineReader(itemsFile);
// var allItems = [];
var allPromises = [];

lr.on('line', function (line) { 	
 	// lr.pause();    
 	allPromises.push(getProductDetails(line)); // return a new Promise
});


lr.on('end', function () {
	Promise.all(allPromises).then(
		function (allItems) {
			console.log("Retrieved " + allItems.length);
			var outFile = itemsFile.replace(/\.txt/, "Details2.txt");
		    fs.writeFileSync(outFile, JSON.stringify(allItems));
		});
});

function getProductDetails(relativeURL)
{
	return new Promise(function(resolve, reject) {
		  	var url = urlPrefix + relativeURL;
		  	console.log("Processing " + itemCounter++  + " at: " + url);
			return request({uri: url}, 
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
						    	console.log("	>Received item");
						    	//Parse with cheerio
						    	var $ = cheerio.load(body);
						    	var itemsInPage = [];
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
						    	item.buyerLink = buyerLink;

						    	console.log("	>Item details: " + JSON.stringify(item));
								  //   var link = $(this);
								  //   // var text = link.text();
								  //   var href = link.attr("href");

								  //   // console.log(link + " -> " + href);

								  //   itemsInPage.push(href);
								  // });	    	
								
								// allItems.push(item);
								// lr.resume();
								resolve(item);
							}
				    });
			    });
};
// lr.on('end', function () {
// 	var outFile = itemsFile.replace(/\.txt/, "Details.txt");
//     fs.writeFileSync(outFile, JSON.stringify(allItems));
// });

// function getMovie(title) {
//   return new Promise(function(resolve, reject) {
//     var request = new XMLHttpRequest();

//     request.open('GET', 'http://mymovieapi.com/?q=' + title);
//     request.onload = function() {
//       if (request.status == 200) {
//         resolve(request.response); // we get the data here, so resolve the Promise
//       } else {
//         reject(Error(request.statusText)); // if status is not 200 OK, reject.
//       }
//     };

//     request.onerror = function() {
//       reject(Error("Error fetching data.")); // error occurred, so reject the Promise
//     };

//     request.send(); // send the request
//   });
// }