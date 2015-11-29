#!/usr/local/bin/node

var fs = require("fs");
var cheerio = require("cheerio");
var htmlToText = require('html-to-text');
var unirest = require('unirest');
var trans = require('translate-google-free');
var accounting = require('accounting');

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

			//Set the brand
			product.brand = "lululemon";
			
			//DESCRIPTION
			//Find items and save to array
			var price = $("span.amount").text();
			//Clean price
			var priceCleanerRegex = /\$(\s*[0-9,]+(?:\s*\.\s*\d{2}))?/g;
			var regexMatches = priceCleanerRegex.exec(price);
			if ((regexMatches != null)&&(regexMatches.length>=1))
			{
				price = regexMatches[1];
			}

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
			product.price = accounting.unformat(price);
			product.name = name;
			product.whyWeMadeThis = whyWeMadeThis;
			product.fabricAndFeatures = fabricAndFeatures;
			product.fitAndFunction = fitAndFunction;

			//TRANSLATION: Description
			//Translate
	    	var descriptionPromise = new Promise(
	    		function(descriptionResolve, descriptionReject)
	    		{
	    			trans(product.whyWeMadeThis, 'en', 'ja', 
	    				function(err, translation)
	    				{
	    					if (err == null)
	    					{
	    						descriptionResolve(translation);
	    					}
	    					else
	    					{
	    						descriptionReject(err);
	    					}
	    				}
    				)
	    		});

	    	descriptionPromise.then(
				function(descriptionTranslated)
				{
					product.whyWeMadeThisJP = descriptionTranslated;

					//TRANSLATION
					var fabricAndFeaturesPromises = product.fabricAndFeatures.map(
						function(feature)
						{
							return new Promise(
								function(featureResolve, featureReject)
								{
									//Translate
							    	trans(feature, 'en', 'ja', 
							    		function(err, translation) {
							    			if (err == null)
							    			{
										  		// console.log("Translation complete!");
										  		featureResolve(translation);
										  	}
										});
							    }
							);
						});

					//After all translations are completed
					return Promise.all(fabricAndFeaturesPromises)
				}
			).then(
				function(featuresTranslated)
				{
					//Assign to product
					product.fabricAndFeaturesJP = featuresTranslated;
				
					//TRANSLATION
					var fitAndFunctionPromises = product.fitAndFunction.map(
						function(fit)
						{
							return new Promise(
								function(functionResolve, functionReject)
								{
									//Translate
							    	trans(fit, 'en', 'ja', 
							    		function(err, translation) {
							    			if (err == null)
							    			{
										  		// console.log("Translation complete!");
										  		functionResolve(translation);
										  	}
										});
							    }
							);
						});

					return Promise.all(fitAndFunctionPromises);
				}
			).then(
				function (functionsTranslated)
				{
					//Assign to product
					product.fitAndFunctionJP = functionsTranslated;

					//COLOR AND SIZES
					//Swatches
					var swatches = [];
					// console.log("	>Finding swatches!");
					var productId = "";
					$("ul#swatches").find(".pickColor").each(function(i, elem) {
					 	var color = $(this).attr("title");
					 	var url = $(this).children("img").attr("src");

					 	//Get the product id
					 	productId = $(this).attr("rel");
					 	var swatchId = $(this).attr("rev");

					 	var swatch = new Object();
					  	swatch.descriptionOriginal = color;
					  	swatch.imageUrl = url;
					  	swatch.swatchId = swatchId;

					  	swatches.push(swatch);

					  	// console.log("	>Color: '" + color + "' at " + url);
					});
					product.productId = productId;

					// console.log("	>Found " + swatches.length + " swatches!");

					//Sizes
					var sizes = [];
					$("ul#sizes").find(".pickSize").each(function(i, elem) {
					 	var size = $(this).attr("title");
					 	// console.log("	>Size: " + size);
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
									if (Object.keys(colorTagToBuymaColorMap).indexOf(swatch.descriptionOriginal) != -1)
									{
										var buymaColor = colorTagToBuymaColorMap[swatch.descriptionOriginal];

										//Add to the swatch
										swatch.descriptionTagged = swatch.descriptionOriginal;
										swatch.sizes = sizes;
										swatch.descriptionBuyma = buymaColor;
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
												swatch.descriptionTagged = combinedColor;
												swatch.sizes = sizes;
												swatch.descriptionBuyma = combinedColorArray.length > 1 ? "multi" : combinedColor;

												swatchResolve(swatch);
											}
										});
									}
								});
						});
						
						Promise.all(swatchPromises).then(function() { 
							//Get image for each swatch
							var imagePromises = swatches.map(
							function(swatch)
							{
								return new Promise(
									function(swatchResolve, swatchReject)
									{
										unirest.post("http://shop.lululemon.com/shop/gadgets/productImageChanger.jsp")
											.query(
													{
														isMainImage : true,
														prodId : product.productId,
														cc : swatch.swatchId,
														isPDPSoldOut : false
													}
												)
											.end(function (result) {
												// console.log(result.status, result.headers, result.body);
												if (result.status == 200)
												{					 			  
													// console.log("Got images for swatch!");

													var images = [];
													var swatch$ = cheerio.load(result.body);
													swatch$("img").each(
														function(i, elem)
														{
															var imageLink = $(this).attr("src");
															// console.log("imageLink: " + imageLink);
															images.push(imageLink);
														});
													swatch.images = images;												

													//Get thumbnails
													unirest.post("http://shop.lululemon.com/shop/gadgets/productImageChanger.jsp")
													.query(
															{
																isMainImage : false,
																prodId : product.productId,
																cc : swatch.swatchId,
																isPDPSoldOut : false
															}
														)
													.end(function (result) {
														// console.log(result.status, result.headers, result.body);
														if (result.status == 200)
														{					 			  
															// console.log("Got images for swatch!");

															var images = [];
															var swatch$ = cheerio.load(result.body);
															swatch$("img").each(
																function(i, elem)
																{
																	var imageLink = $(this).attr("src");
																	// console.log("imageLink: " + imageLink);
																	images.push(imageLink);
																});
															swatch.thumbnailImages = images;												
														}
														swatchResolve(swatch);
													});
												}
											})
										// }
									});
							});							
							
							return Promise.all(imagePromises);
						}).then(function() { 
							product.swatches = swatches;

							//Combine into description
							var description = 'WHY WE MADE THIS:\n';
							description = description + product.whyWeMadeThis + '\n';

							description = description + '\nFABRIC AND FEATURES:' + '\n';

							description = description + product.fabricAndFeatures.map(
								function(fabricAndFeature)
								{
									return '• ' + fabricAndFeature + '\n';
								}).join("");

							description = description + '\nFIT AND FUNCTION:' + '\n';

							description = description + product.fitAndFunction.map(
								function(fit)
								{
									return '• ' + fit + '\n';
								}).join("");

							product.description = description;

							//Combine into description
							var descriptionJP = 'WHY WE MADE THIS:\n';
							descriptionJP = descriptionJP + product.whyWeMadeThisJP + '\n';

							descriptionJP = descriptionJP + '\nFABRIC AND FEATURES:' + '\n';

							descriptionJP = descriptionJP + product.fabricAndFeaturesJP.map(
								function(fabricAndFeature)
								{
									return '• ' + fabricAndFeature + '\n';
								}).join("");

							descriptionJP = descriptionJP + '\nFIT AND FUNCTION:' + '\n';

							descriptionJP = descriptionJP + product.fitAndFunctionJP.map(
								function(fit)
								{
									return '• ' + fit + '\n';
								}).join("");

							product.descriptionJP = descriptionJP;						

							//Return product
							resolve(product);			  
					}, function(reason) {
					  console.log(reason)
					});			
				},
				function (error)
				{
					// console.log(error)
					reject(error);
				}
			);		
	});

	return promise;
}

module.exports.parseLululemon = parseLululemon;

// var kFile = "lululemonProduct.html"
// var body = fs.readFileSync(kFile);
// productParser.parseLululemon(body).then(
// 		function(result)
// 		{
// 			console.log("Result: " + JSON.stringify(result, null, 2));
// 		}
// 	);