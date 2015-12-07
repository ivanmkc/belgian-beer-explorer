#!/usr/local/bin/node

var path = require('path');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var util = require('util');
var Parse = require("parse/node");
Parse.initialize("ZjuQjiF1XPzUA2iY82cGKhmE5czhi4AhCnbNNeTO", "ulaJU0JGr7oPGXB9nolxMzUvXn2gV1otu8MTOVJw", "cD3d8LxY8CnS180zczxQGjjMKycE2la8UNPwnmYJ");

var kEmail = 'ivyangel2015@gmail.com';
var kPassword = 'canada2015!'

var url = "http://www.buyma.com/my/itemedit/";//http://shop.lululemon.com/products/clothes-accessories/relaxed-sensation/Jet-Crop-Slim-Luxtreme?c_4";
var kTimeoutInSeconds = 600;
//Selenium
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    Key = webdriver.Key,
    until = webdriver.until;
var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();	

//Product
var kTempFilename = 'temp.png';
var objectId = "ZfX011hDbA";

//Get the page
console.log("1. Logging in");
driver.get(url);
driver.findElement(By.id('txtLoginId')).sendKeys(kEmail);
driver.findElement(By.id('txtLoginPass')).sendKeys(kPassword);
driver.findElement(By.id('login_do')).click();

// //Close annoying popup
driver.findElement(By.className('js-new-release-tour__close-bt')).click();
driver.findElement(By.className('js-release-alert__close-bt')).click().then(
	function()
	{		
		var Product = Parse.Object.extend("Product");
		var query = new Parse.Query(Product);
		query.equalTo("objectId", objectId);
		console.log("2. Looking for an existing product");
		query.first().then(function(productFromParse)
		{
			if (productFromParse != null)
			{
				console.log("	>Found the product");

				var product = productFromParse.toJSON();
				var swatchId = 0
				// for (var swatchId = 0; swatchId < product.swatches.length; swatchId++)
				{
					var swatch = product.swatches[swatchId];

					// //Product edit page
					//Category
					driver.findElement(By.className('popup_category')).click();
					var categoryElements = [product.categoryPrimaryBuyma, product.categorySecondaryBuyma];
					categoryElements.forEach(
						function(categoryElement)
						{
							driver.wait(until.elementLocated(By.css("a[value='"+ categoryElement + "']")), kTimeoutInSeconds * 1000)
								.then(function(element) {
									console.log('	>Category finished!');
								    element.click();
								});
						});

					//Name
					driver.findElement(By.name('itemedit[syo_name]')).sendKeys(product.nameBuyma);

					

					//Add images	
					var imageUrls = swatch.images;
					var directoryName = path.dirname(require.main.filename);
					var filePath = directoryName + "/" + kTempFilename;
					driver.wait(until.elementLocated(By.className("js-async-file-upload")), kTimeoutInSeconds * 1000)
						.then(function() {
							loadImageRecursive(0, imageUrls, filePath).then
							(
								function()
								{
									// console.log("	>Finished loading images!");
									return loadBrand(product.brand);								
								}
							).then(
								function()
								{
									// console.log("	>Finished loading brand!");
									// console.log("Swatch = " + util.inspect(swatch));
									return loadSizeAndColor(driver, swatch, product.sizeCountryCode);
								}
							).then(
								function()
								{						
									//Comment
									driver.findElement(By.id('item_comment')).sendKeys(product.descriptionJP);			

									//Pricing: CAUSES SERVER TO REJECT THE SAVE =(
									// driver.findElement(By.name('itemedit[price]')).sendKeys(product.priceBuyma);

									//Quantity
									driver.findElement(By.name('itemedit[yukosu]')).sendKeys(product.quantityBuyma);

									//Shop name
									driver.findElement(By.name('itemedit[konyuchi]')).sendKeys(product.shopNameBuyma);

									//Tags
									// driver.wait(until.elementLocated(By.className("popup_tags")), kTimeoutInSeconds * 1000)
									// 	.then(function(element) {
									// 		element.click();
									// 	});						

									//Draft button
									driver.findElement(By.id('draftButton')).click().then(
										function()
										{
											console.log('	>Draft button clicked!')
										})

									// //Confirm button
									// driver.wait(until.elementLocated(By.id("done")), kTimeoutInSeconds * 1000)
									// 	.then(function(element) {
									// 		// element.click();
									// 	});

									pause(driver);
									// //Pause
									// driver.wait(function() {
									//   return driver.findElements(By.id('asdffoo')).then(function(elements) {
									//     return elements[0];
									//   });
									// }, 100000, 'Failed to find element after timeout');
								}
							).catch(
							function(err)
							{
								console.error(err);
							});
						});										
				}
			}
			else
			{
				console.log("	>Could not find product");
			}
		});
	}
);

function translateToBuymaCountryName(countryCode)
{
	switch (countryCode)
	{
		case 'US':
			return "アメリカ";
		case 'IT':
			return "イタリア";
		case 'JP':
			return "日本";
		case 'FR':
			return "フランス";
		case 'EN':
			return "イギリス";
		default:
			return "その他ヨーロッパ";
	}
}

function getBuymaSizeName(sizeAsInt, countryCode)
{
	if (countryCode == 'US')
	{
		return countryCode + sizeAsInt;
	}
}

function loadImageRecursive(imageIndex, imageUrls, filePath)
{
	return new Promise(
		function (resolve, reject) {
			var imageUrl = imageUrls[imageIndex];
			console.log("	>Downloading image: " + imageUrl);
			//Download the image
			request.head(imageUrl, function(err, res, body){
			    // console.log('content-type:', res.headers['content-type']);
			    // console.log('content-length:', res.headers['content-length']);			    					    
			    var r = request(imageUrl).pipe(fs.createWriteStream(filePath));
			    r.on('close', function()
					{
						//Upload to site
						// console.log("	>Finished downloading!");
						
						var uploadName = "updfile" + (imageIndex+1);
						// console.log("	>Upload name: " + uploadName);
						driver.wait(until.elementLocated(By.name(uploadName)), kTimeoutInSeconds * 1000)
							.then(function(element)
							{
								element.sendKeys(filePath).then(
										function()
										{
											console.log("		>Upload finished");

											//Delete temp.png
											fs.unlink(filePath);	
											resolve();
										}
									);
							});
					});
		  	});
	}).then(
		function()
		{
			var nextIndex = imageIndex+1;
			if (nextIndex<imageUrls.length)
			{
				return loadImageRecursive(nextIndex, imageUrls, filePath);	
			}			
			else
			{
				console.log("	>Images all uploaded!");
			}	
		}
	);
}

function loadSizeAndColor(driver, swatch, sizeCountryCode)
{
	return new Promise(
		function(resolve, reject)
		{
			//Determine if multiple sizes or one size
			driver.findElement(By.className('js-color-size-popup-box')).then(
				function(popupBox)
				{
					driver.wait(until.elementLocated(By.className("js-popup-color-size")), kTimeoutInSeconds * 1000)
						.then(function(element) {
							console.log("	>Color+size started!");
							// setTimeout(function () {
					            element.click().then(
					            	function()
					            	{
					            		//Click multisize or free\one size
										var isFreeSize = false;
										// pause(driver);
										var sizeSelectId = isFreeSize ? "rdoSelectSize2" : "rdoSelectSize1";
										popupBox.findElement(By.id(sizeSelectId)).click();
										// console.log(util.inspect(swatch))
										//Click the right color
										popupBox.findElements(By.className('item_color'))
											.then(function(elements){
												console.log("	>Selecting color: " + swatch.descriptionBuyma);
										  		var promises = elements.map(
										  			function(element){
											    		return element.getAttribute('className').then(function(className){
											    			// console.log("	>Classname: " + className);
											    			var classes = className.trim().toLowerCase().split(' ');
											    			var isMatch = classes.indexOf(swatch.descriptionBuyma) > -1;
											    			// console.log("	>Color text: " + util.inspect(classes) + ' and isMatch = ' + isMatch);
											      			return isMatch;
														});    
										  			});

										  		Promise.all(promises).then(
										  			function(isMatchArray)
										  			{
										  				// console.log('isMatchArray = ' + util.inspect(isMatchArray));
										  				var matchingElement = null;
										  				for (var elementIndex = 0; elementIndex < isMatchArray.length; elementIndex++)
										  				{
										  					if (isMatchArray[elementIndex])
										  					{
										  						matchingElement = elements[elementIndex];					  						
										  						matchingElement.click();
										  						console.log('	>Clicked color!')
										  						break;
										  					}
										  				}					  										  		
										  			});
									  	})

										//Type the color name
										popupBox.findElement(By.className('js-color-size-color-name')).sendKeys(swatch.descriptionBuyma);

										//Click the size defaults
										// driver.wait(until.elementLocated(By.name('js-size-guide-header')), kTimeoutInSeconds * 1000)
										// 	.then(function() {
										console.log('	>Clicking header');
										popupBox.findElement(By.className('js-size-guide-header')).click();
											// });

										popupBox.findElements(By.className('js-color-size-set-from-temlpate'))
											.then(function(elements){
												console.log("	>Selecting size defaults: " + sizeCountryCode);
										  		var promises = elements.map(
										  			function(element){
											    		return element.getText().then(
											    			function(countryText){						    			
												      			var isMatch = countryText.trim() == translateToBuymaCountryName(sizeCountryCode);

												      			// console.log("	>Country text: " + countryText + ' and isMatch = ' + isMatch);

												      			return isMatch;
															});    						    		
										  			});

										  		Promise.all(promises).then(
										  			function(isMatchArray)
										  			{
										  				// console.log('isMatchArray = ' + util.inspect(isMatchArray));
										  				var matchingElement = null;
										  				for (var elementIndex = 0; elementIndex < isMatchArray.length; elementIndex++)
										  				{
										  					if (isMatchArray[elementIndex])
										  					{
										  						matchingElement = elements[elementIndex];					  						
										  						matchingElement.click().then(
										  							function()
										  							{
										  								console.log('	>Clicked default size!')

										  								popupBox.findElement(By.className('js-color-size-color-name')).sendKeys(Key.ENTER).then(
										  									function()
										  									{
										  										console.log('	>Added color!')
										  										
										  										//Get buyma size names
																  				var sizeKeys = Object.getOwnPropertyNames(swatch.sizes);
																  				var buymaSizeNames = sizeKeys.map(
																  					function(size)
																  					{
																  						return getBuymaSizeName(size, sizeCountryCode);
																  					});		

																  				console.log('	>Deselecting unneeded rows!')
												  								//Delete rows in table that don't match swatch sizes
												  								driver.wait(until.elementLocated(By.name('colorsize_2_8')), kTimeoutInSeconds * 1000)
																					.then(function() {
																						console.log('	>Rows appeared!')
																		  				popupBox.findElements(By.className('js-color-size-size-table'))
																							.then(function(elements){
																								console.log("	>Selecting size rows. Found " + elements.length + " elements.");
																						  		var promises = elements.map(
																						  			function(element){
																							    		return element.getAttribute('innerHTML').then(
																							    			function(body){				
																							    				var $ = cheerio.load(body);
																							    				var rowValue = $("input.js-size-text").val();
																								      			var isMatch = buymaSizeNames.indexOf(rowValue) > -1;
																								      			// console.log("	>Row text: " + rowValue + ' and isMatch = ' + isMatch);

																								      			return isMatch;
																											});    						    		
																						  			});

																						  		Promise.all(promises).then(
																						  			function(isMatchArray)
																						  			{
																						  				// console.log('isMatchArray = ' + util.inspect(isMatchArray));
																						  				var matchingElement = null;
																						  				for (var elementIndex = 0; elementIndex < isMatchArray.length; elementIndex++)
																						  				{
																						  					//Click to deselect the row
																						  					if (!isMatchArray[elementIndex])
																						  					{
																						  						matchingElement = elements[elementIndex];					  						
																						  						matchingElement.findElement(By.className('js-colorsize-checkbox')).click();
																						  						console.log('	>Deselected size row!');
																						  					}
																						  				}	
																						  				
																										//Commit the changes
																						  				popupBox.findElement(By.className('js-commit-changes')).click().then(
																						  						function()
																						  						{															  							
																						  							console.log('	>Finished color+sizes!');
																						  							resolve();
																						  						}
																						  					);													  				
																						  			});
																							  	});
																						  	});
														  							})
										  									});

										  											
										  						break;
										  					}
										  				}			
										  			});
					            	});
						    // }, 5000);

							
						  	})					
						});
				});
			
		}
	);
}

function loadBrand(brand)
{
	return new Promise(
		function(resolve, reject)
		{
			// Brand
			// var brand = product.brand;
			console.log("	>loadBrand: Started");
			driver.wait(until.elementLocated(By.className('popup_brand')), kTimeoutInSeconds * 1000)
				.then(function(button) {					
					return button.click();
			}).then(
				function()
				{					
					console.log("	>loadBrand: Popup button clicked");					
					return driver.findElement(By.className('popup_box'));
				}
			).then(
				function(popupBox)
				{
					console.log("	>loadBrand: Typing brand");					
					driver.wait(until.elementLocated(By.id('brand_suggest_inputTxt')), kTimeoutInSeconds * 1000)
					// popupBox.findElement(By.id('brand_suggest_inputTxt')).then(
						.then(
						function(brandInputContainer) {
						    var brandInput = brandInputContainer.findElement(By.tagName('input'));
						    brand.split('').forEach(
						    	function(brandCharacter)
						    	{
						    		brandInput.sendKeys(brandCharacter);
						    	});

							// brandInput.sendKeys(brand) //brand
							brandInput.sendKeys(Key.DOWN) //down key
							brandInput.sendKeys(Key.ENTER) //enter key
							console.log("	>loadBrand: Brand finished.");
							pause(driver);
							resolve();
					});
				}
			);
		});
}

function pause(driver)
{
	//Pause
	driver.wait(function() {
	  return driver.findElements(By.id('asdffoo')).then(function(elements) {
	    return elements[0];
	  });
	}, 100000, 'Failed to find element after timeout');
}