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
var kTimeoutInSeconds = 300;
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

var Product = Parse.Object.extend("Product");
var query = new Parse.Query(Product);
query.equalTo("objectId", objectId);
console.log("Looking for an existing product");
query.first().then(function(productFromParse)
{
	if (productFromParse != null)
	{
		console.log("	>Found the product");
		var product = productFromParse.toJSON();

		for (var swatchId = 0; swatchId < product.swatches.length; swatchId++)
		{
			var swatch = product.swatches[swatchId];

			//Get the page
			driver.get(url);
			driver.findElement(By.id('txtLoginId')).sendKeys(kEmail);
			driver.findElement(By.id('txtLoginPass')).sendKeys(kPassword);
			driver.findElement(By.id('login_do')).click();

			// //Product edit page

			// //Close annoying popup
			driver.findElement(By.className('js-new-release-tour__close-bt')).click();
			driver.findElement(By.className('js-release-alert__close-bt')).click();

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
			var imageIndex = 1;

			var loadImageRecursive = function (imageIndex)
										{
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
														console.log("	>Finished downloading!");
														
														var uploadName = "updfile" + (imageIndex+1);
														console.log("	>Upload name: " + uploadName);
														driver.wait(until.elementLocated(By.name(uploadName)), kTimeoutInSeconds * 1000)
															.then(function(element)
															{
																element.sendKeys(filePath).then(
																		function()
																		{
																			console.log("	>Upload finished");

																			//Delete temp.png
																			fs.unlink(filePath);

																			var nextIndex = imageIndex+1
																			if (nextIndex<imageUrls.length)
																			{
																				loadImageRecursive(nextIndex);	
																			}					
																		}
																	);
															});
													});
										  	});
										}

			driver.wait(until.elementLocated(By.className("js-async-file-upload")), kTimeoutInSeconds * 1000)
				.then(function() {
					loadImageRecursive(0);					
				});

			
			//Determine if multiple sizes or one size
			driver.wait(until.elementLocated(By.className("js-popup-color-size")), kTimeoutInSeconds * 1000)
				.then(function(element) {
					console.log("	>Color+size started!");
					element.click();

					//Click multisize or free\one size
					var isFreeSize = false;
					var sizeSelectId = isFreeSize ? "rdoSelectSize2" : "rdoSelectSize1";
					driver.findElement(By.id(sizeSelectId)).click();
					// console.log(util.inspect(swatch))
					//Click the right color
					driver.findElements(By.className('item_color'))
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
					  						console('	>Clicked color!')
					  						break;
					  					}
					  				}					  										  		
					  			});
				  	})

					//Type the color name
					driver.findElement(By.className('js-color-size-color-name')).sendKeys(swatch.descriptionBuyma);

					//Click the size defaults
					driver.findElement(By.className('js-size-guide-header')).click()
					driver.findElements(By.className('js-color-size-set-from-temlpate'))
						.then(function(elements){
							console.log("	>Selecting size defaults: " + product.sizeCountryCode);
					  		var promises = elements.map(
					  			function(element){
						    		return element.getText().then(
						    			function(countryText){						    			
							      			var isMatch = countryText.trim() == translateToBuymaCountryName(product.sizeCountryCode);

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
					  						matchingElement.click();
					  						console('	>Clicked default size!')
					  						break;
					  					}
					  				}					  										  		
					  			});
				  	})					
				});
					
			// driver.findElement(By.className('js-popup-color-size')).click();
			// //For the swatch, click the right color square based on class
			// driver.findElements(By.className('item_color'))
			// 	.then(function(elements){
			// 		console.log("HERE");
			//   		return elements.filter(
			//   			function(element){
			// 	    		return element.getAttribute('className').then(function(className){
			// 	    			console.log("Classname: " + className);
			// 	      			return className.trim().toLowerCase() == swatch.buymaColor;
			// 				});    
			//   			});
		 //  	})
				//Get all spans with class = item_color
				//Get span with the right color class, e.g. blue

			//Click\Hover over the size guide at class = js-size-guide-header
				//and click 'America' (or whatever the swatch.sizeCountryCode says): HOW?
			//Get checkboxes with class js-colorsize-checkbox
				//Deselect checkbox based on size, colorsize_2_1, colorsize_2_2, etc. How to determine which checkbox from size?

			//Click commit button with class = js-commit-changes

			// Brand
			var brand = product.brand;
			driver.findElement(By.className('popup_brand')).click();
			driver.wait(until.elementLocated(By.id('brand_suggest_inputTxt')), kTimeoutInSeconds * 1000)
				.then(function(brandInputContainer) {
				    var brandInput = brandInputContainer.findElement(By.tagName('input'));
					brandInput.sendKeys(brand) //brand
					brandInput.sendKeys(Key.DOWN) //down key
					brandInput.sendKeys(Key.ENTER) //enter key
					console.log("	>Brand finished.");
				});

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
			// driver.findElement(By.id('draftButton')).click();

			// //Confirm button
			// driver.wait(until.elementLocated(By.id("done")), kTimeoutInSeconds * 1000)
			// 	.then(function(element) {
			// 		// element.click();
			// 	});

			//Pause
			driver.wait(function() {
			  return driver.findElements(By.id('asdffoo')).then(function(elements) {
			    return elements[0];
			  });
			}, 100000, 'Failed to find element after timeout');
		}
	}
	else
	{
		console.log("	>Could not find product");
	}
});

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