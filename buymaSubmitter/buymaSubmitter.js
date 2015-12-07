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
var kTimeoutInMilliseconds = 10000;
//Selenium
// var webdriver = require('selenium-webdriver'),
//     By = webdriver.By,
//     Key = webdriver.Key,
//     until = webdriver.until;
// var driver = new webdriver.Builder()
//     .forBrowser('firefox')
//     .build();	
var webdriverio = require('webdriverio');
var options = {
    desiredCapabilities: {
        browserName: 'firefox'
    }
};

//Product
var kTempFilename = 'temp.png';
var objectId = "ZfX011hDbA";

//Get the page
console.log("1. Logging in");
var client = webdriverio
    .remote(options)
    .init()
    .url(url)
    .timeoutsImplicitWait(10000)
    // .waitForVisible('.dummyWait', 10000)
    // .setValue('#q', 'webdriver')
    .setValue('#txtLoginId', kEmail)
    .setValue('#txtLoginPass', kPassword)
    .click('#login_do')
    .click('.js-new-release-tour__close-bt')
    .click('.js-release-alert__close-bt')

// driver.get(url);
// driver.findElement(By.id('txtLoginId')).sendKeys(kEmail);
// driver.findElement(By.id('txtLoginPass')).sendKeys(kPassword);
// driver.findElement(By.id('login_do')).click();

// // //Close annoying popup
// driver.findElement(By.className('js-new-release-tour__close-bt')).click();
// driver.findElement(By.className('js-release-alert__close-bt')).click().then(
// 	function()
// 	{		
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
// 				// for (var swatchId = 0; swatchId < product.swatches.length; swatchId++)
// 				{
					var swatch = product.swatches[swatchId];

					//Product edit page
					//Category
					client.click('.popup_category').then(
						function()
						{
							// var categoryElements = [product.categoryPrimaryBuyma, product.categorySecondaryBuyma];
							return client.click("a[value='"+ product.categoryPrimaryBuyma + "']")
							.click("a[value='"+ product.categorySecondaryBuyma + "']");
							// categoryElements.forEach(
							// 	function(categoryElement)
							// 	{
							// 		// driver.wait(until.elementLocated(By.css("a[value='"+ categoryElement + "']")), kTimeoutInSeconds * 1000)
							// 			// .then(function(element) {
							// 				console.log('	>Category finished!');
							// 			    client.click("a[value='"+ categoryElement + "']");
							// 			// });
							// 	});
						}).then(
							function()
							{
								console.log('	>Category finished!');
								return client.setValue('input[name=\'itemedit[syo_name]\']', product.nameBuyma);
							}
						).then(
							function()
							{
								return loadBrand(client, product.brand);
							}

						).then(
							function()
							{
								return loadSizeAndColor(client, swatch, product.sizeCountryCode);
							}
						).then(
							function()
							{
								var directoryName = path.dirname(require.main.filename);
								var filePath = directoryName + "/" + kTempFilename;
								return loadImageRecursive(client, 0, swatch.images, filePath);
							}
						).then(
							function()
							{
								console.log('	>Finished!');
							}
						).catch(
							function(err)
							{
								console.error(err);
							});
					

// 					//Name
// 					driver.findElement(By.name('itemedit[syo_name]')).sendKeys(product.nameBuyma);

					

// 					//Add images	
// 					var imageUrls = swatch.images;
// 					var directoryName = path.dirname(require.main.filename);
// 					var filePath = directoryName + "/" + kTempFilename;
// 					driver.wait(until.elementLocated(By.className("js-async-file-upload")), kTimeoutInSeconds * 1000)
// 						.then(function() {
// 							loadImageRecursive(0, imageUrls, filePath).then
// 							(
// 								function()
// 								{
// 									// console.log("	>Finished loading images!");
// 									return loadBrand(product.brand);								
// 								}
// 							).then(
// 								function()
// 								{
// 									// console.log("	>Finished loading brand!");
// 									// console.log("Swatch = " + util.inspect(swatch));
// 									return loadSizeAndColor(driver, swatch, product.sizeCountryCode);
// 								}
// 							).then(
// 								function()
// 								{						
// 									//Comment
// 									driver.findElement(By.id('item_comment')).sendKeys(product.descriptionJP);			

// 									//Pricing: CAUSES SERVER TO REJECT THE SAVE =(
// 									// driver.findElement(By.name('itemedit[price]')).sendKeys(product.priceBuyma);

// 									//Quantity
// 									driver.findElement(By.name('itemedit[yukosu]')).sendKeys(product.quantityBuyma);

// 									//Shop name
// 									driver.findElement(By.name('itemedit[konyuchi]')).sendKeys(product.shopNameBuyma);

// 									//Tags
// 									// driver.wait(until.elementLocated(By.className("popup_tags")), kTimeoutInSeconds * 1000)
// 									// 	.then(function(element) {
// 									// 		element.click();
// 									// 	});						

// 									//Draft button
// 									driver.findElement(By.id('draftButton')).click().then(
// 										function()
// 										{
// 											console.log('	>Draft button clicked!')
// 										})

// 									// //Confirm button
// 									// driver.wait(until.elementLocated(By.id("done")), kTimeoutInSeconds * 1000)
// 									// 	.then(function(element) {
// 									// 		// element.click();
// 									// 	});

// 									pause(driver);
// 									// //Pause
// 									// driver.wait(function() {
// 									//   return driver.findElements(By.id('asdffoo')).then(function(elements) {
// 									//     return elements[0];
// 									//   });
// 									// }, 100000, 'Failed to find element after timeout');
// 								}
// 							).catch(
// 							function(err)
// 							{
// 								console.error(err);
// 							});
// 						});										
// 				}
			}
			else
			{
				console.log("	>Could not find product");
			}
		});
//	}
// );

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

function loadImageRecursive(client, imageIndex, imageUrls, filePath)
{
	return new Promise(
		function (resolve, reject) {
			var imageUrl = imageUrls[imageIndex];
			console.log("	>loadImageRecursive downloading image: " + imageUrl);
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
						var uploadSelector = 'input[name=\"' + uploadName + '\"]';
						client//.waitForVisible(uploadSelector, 50*10000)
							.chooseFile(uploadSelector, filePath)
									.then(
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
	}).then(
		function()
		{
			var nextIndex = imageIndex+1;
			if (nextIndex<imageUrls.length)
			{
				return loadImageRecursive(client, nextIndex, imageUrls, filePath);	
			}			
			else
			{
				console.log("	>Images all uploaded!");
			}	
		}
	);
}

function loadSizeAndColor(client, swatch, sizeCountryCode)
{
	return new Promise(
		function(resolve, reject)
		{
			var isFreeSize = false;
			var sizeSelectId = isFreeSize ? "#rdoSelectSize2" : "#rdoSelectSize1";

			var defaultSizesSelector = 'span.js-color-size-set-from-temlpate=' + translateToBuymaCountryName(sizeCountryCode) + '';
			// console.log('Selector: ' + asdf);

			client
			.waitForVisible('.js-popup-color-size', kTimeoutInMilliseconds)
			.click('.js-popup-color-size')
			.click(sizeSelectId)	//Click the size type
			.click('.' + 'item_color' + '.' + swatch.descriptionBuyma)	//Click the color
			.setValue('.js-color-size-color-name', swatch.descriptionBuyma)	//Type the name
			.keys('Enter')
			.click('.js-size-guide-header')	//Click default sizes header
			.click(defaultSizesSelector)	//Click default sizes
			// .click('span.js-color-size-set-from-temlpate')//[text=\''+ translateToBuymaCountryName(sizeCountryCode) + '\']')
			.then(
				function()
				{
					//Select the relevant rows
					var sizeKeys = Object.getOwnPropertyNames(swatch.sizes);
					var buymaSizeNames = sizeKeys.map(
	  					function(size)
	  					{
	  						return getBuymaSizeName(size, sizeCountryCode);
	  					});

					console.log('	loadSizeAndColor buymaSizeNames: ' + util.inspect(buymaSizeNames));
					
					client.waitForVisible('input[name=colorsize_2_5]', kTimeoutInMilliseconds)
					.elements('tr.js-color-size-size-table').then(
						function(result)
						{
							var elements = result.value;
							// console.log('	>loadSizeAndColor: Found elements:' + util.inspect(elements));
							var promises = elements.map(
								function(element)
								{
									// console.log(util.inspect(element));
									var elementId = element.ELEMENT;
									// console.log('	>loadSizeAndColor id: ' + elementId);
									return client
									.elementIdAttribute(elementId, 'innerHTML')
									.then(
										function(result)
										{									
											var elementValue = result.value;		
											var $ = cheerio.load(elementValue);
											var rowValue = $('input.js-size-text').val();
											var checkboxName = $('input.js-colorsize-checkbox').attr('name');
											var isMatch = buymaSizeNames.indexOf(rowValue) != -1;
											console.log('	>loadSizeAndColor value: ' + rowValue + ' checkbox-name: ' + checkboxName + ' isMatch: ' + isMatch);
											if (!isMatch)
											{
												return client.click('input[name=' + checkboxName + ']')
											}
										});								
								});		
							return Promise.all(promises);
							}
						).then(
	  						function()
	  						{															  							
	  							return client.click('.js-commit-changes')
	  						}
						).then(
							function()
							{
								console.log('	>loadSizeAndColor: Finished');
								resolve();
							}
						);
				})
		})
}

function loadBrand(client, brand)
{
	return new Promise(
		function(resolve, reject)
		{
			// Brand
			// var brand = product.brand;
			console.log("	>loadBrand: Started");
			client.click('.popup_brand')
			.waitForVisible('#brand_suggest_inputTxt', 10000)
			.click('#brand_suggest_inputTxt > input')
			.keys(brand)
			.click('input.close_box')
			// .waitForVisible('.bm_auto_complete', 10000)
			// .click('.bm_auto_complete')
			.then(
				function()
				{
					console.log('	>loadBrand: Finished!');
					resolve();
				}
			);
		});
}

// function pause(driver)
// {
// 	//Pause
// 	driver.wait(function() {
// 	  return driver.findElements(By.id('asdffoo')).then(function(elements) {
// 	    return elements[0];
// 	  });
// 	}, 100000, 'Failed to find element after timeout');
// }