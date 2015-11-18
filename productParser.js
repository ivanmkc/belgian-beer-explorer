#!/usr/local/bin/node

var fs = require("fs");
var cheerio = require("cheerio");
var htmlToText = require('html-to-text');
var unirest = require('unirest');
// var lineReader = require('line-reader');

var kMashapeKey_development = "FBpajofTTTmshaKXOOXLhh8oqTSAp1b9yBPjsn6N0nOTXKiTM9";
var kMashapeKey_production = "FBpajofTTTmshaKXOOXLhh8oqTSAp1b9yBPjsn6N0nOTXKiTM9";
var kMashapeKey = kMashapeKey_development;

var productParser = new Object();
parseLululemon = function(body)
{
	var promise = new Promise(
		function(resolve, reject)
		{
			var product = new Object();
			var $ = cheerio.load(body);

			//DESCRIPTION
			//Find items and save to array
			var price = $("span.amount").text();
			var name = $("div.OneLinkNoTx").text();

			//WHY WE MADE THIS
			var whyWeMadeThis = $(".why-we-made-this").children().html();

			//FABRIC AND FEATURES
			var fabricAndFeatures = [];			
			$(".why-we-made-this").next().next().find("li").each(
				function(i, elem)
				{
					var text = $(this).text();
					// console.log("	f&f: " + text);
					fabricAndFeatures.push(text);
					// return text;
				});


			//FIT AND FUNCTION
			var fitAndFunction = [];			
			$(".why-we-made-this").next().next().next().next().find("li").each(
				function(i, elem)
				{
					var text = $(this).text();
					// console.log("	f&f: " + text);
					fitAndFunction.push(text);
					// return text;
				});
			// var fabricAndFeatures = $(".why-we-made-this").next().next().html();


			// var fitAndFunction = $(".why-we-made-this").next().next().html();
			//Assign to product
			product.price = price;
			product.name = name;
			product.whyWeMadeThis = whyWeMadeThis;
			product.fabricAndFeatures = fabricAndFeatures;
			product.fitAndFunction = fitAndFunction;

			//COLOR AND SIZES
			//Swatches
			var swatches = [];
			console.log("	>Finding swatches!");

			$("ul#swatches").find(".pickColor").each(function(i, elem) {
			 	var color = $(this).attr("title");
			 	var url = $(this).children("img").attr("src");
			 	var swatch = new Object();
			  	swatch.description = color;
			  	swatch.imageUrl = url;

			  	swatches.push(swatch);

			  	console.log("	>Color: '" + color + "' at " + url);
			});
			console.log("	>Found " + swatches.length + " swatches!");

			//Sizes
			var sizes = [];
			$("ul#sizes").find(".pickSize").each(function(i, elem) {
			 	var size = $(this).attr("title");
			 	console.log("	>Size: " + size);
			  	sizes[i] = size;
			});

			// console.log("Why We Made This: " + whyWeMadeThis);
			// console.log("Fabric and Features: " + fabricAndFeatures);
			// console.log("Fit and Function: " + fitAndFunction);
			var text = htmlToText.fromString(whyWeMadeThis + fabricAndFeatures + fitAndFunction);
			// console.log("Beautiful text: " + text);

			//Buyma colors
			// buymaColors = ["white", "black", "gray", "brown", "beige", "green", "blue", "navy", "purple", "yellow", "pink", "red", "orange", "silver", "gold"];
			// colortagColors = ["white", "black", "gray", "brown", "beige", "green", "blue", "purple", "yellow", "pink", "red", "orange", "cyan"];
			colorTagToBuymaColorMap = {
				"white": "white",
				"black": "black", 
				"gray": "gray", 
				"brown": "brown", 
				"beige": "beige", 
				"green": "green", 
				"blue": "blue", 
				"purple": "purple", 
				"yellow": "yellow", 
				"pink": "pink", 
				"red": "red", 
				"orange": "orange", 
				"cyan": "blue"
			}

			//For each swatch image			
			console.log("	>Processing " + swatches.length + " swatches!");
			var swatchPromises = swatches.map(
				function(swatch)
				{
					return new Promise(
						function(swatchResolve, swatchReject)
						{
							//See if the description is a basic color			
							var swatchImageUrl = swatch.imageUrl;
							if (Object.keys(colorTagToBuymaColorMap).indexOf(swatch.description) != -1)
							{
								var buymaColor = colorTagToBuymaColorMap[swatch.description];

								//Add to the swatch
								swatch.taggedColor = buymaColor;
								swatch.sizes = sizes;
								swatchResolve(swatch);
							}
							else
							{
								// These code snippets use an open-source library. http://unirest.io/nodejs
								unirest.get("https://apicloud-colortag.p.mashape.com/tag-url.json?palette=simple&sort=weight&url=" + swatchImageUrl)
								.header("X-Mashape-Key", kMashapeKey)
								.header("Accept", "application/json")
								.end(function (result) {
									// console.log(result.status, result.headers, result.body);
									if (result.status == 200)
									{					 			  	
										//Get the tags
										var tags = result.body.tags;

										//Get the dominant color 
										// var dominantColor = tags[0].label.toLowerCase();

										//Get the buyma color equivalent
										// var buymaColor = colorTagToBuymaColorMap[dominantColor];									

										var combinedColorArray = tags.map(
											function(tag)
											{
												return tag.label.toLowerCase();
											});

										//Keep the first 2 colors
										combinedColorArray = combinedColorArray.slice(0,2);

										var combinedColor = combinedColorArray.join('+');

										//Add to the swatch
										swatch.taggedColor = combinedColor;
										swatch.sizes = sizes;

										swatchResolve(swatch);
									}
								});
							}
						});
				});

			Promise.all(swatchPromises).then(function(value) { 
				product.swatches = swatches;
				//Return product
				resolve(product);			  
			}, function(reason) {
			  console.log(reason)
			});
	});

	return promise;
}

module.exports.parseLululemon = parseLululemon;

// productUrlList = []
// // lineReader.eachLine(, function(line, last, resume) {
// productUrlList.forEach(
// 	function(productUrl)
// 	{		
		// var kFile = "lululemonProduct.html"
		// var body = fs.readFileSync(kFile);
		// productParser.parseLululemon(body).then(
		// 		function(result)
		// 		{
		// 			console.log("Result: " + JSON.stringify(result, null, 2));
		// 		}
		// 	);
// 	}
// }