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
var kSwatchId = 0;
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
		var swatch = product.swatches[kSwatchId];
		// var product = {};
		// product.category = [2102, 3022];
		// product.brand = "lululemon";
		// product.name = "Nice Pants";
		// product.descriptionJP = "Blue nice pants with stripes";
		// product.swatches = [{"descriptionBuyma":"multi","descriptionOriginal":"diamond jacquard space dye slate clarity yellow","descriptionTagged":"gray+brown","imageUrl":"https://images.lululemon.com/is/image/lululemon/18683?$swatch_lg$","images":["https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_1?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_2?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_3?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_4?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_5?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_6?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_7?$pdp_main$"],"sizes":["2","4","6","8","10","12"],"swatchId":"18683","thumbnailImages":["https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_1?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_2?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_3?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_4?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_5?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_6?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6D44S_018683_7?$pdp_thumb$"]},{"descriptionBuyma":"gray","descriptionOriginal":"heathered slate","descriptionTagged":"gray","imageUrl":"https://images.lululemon.com/is/image/lululemon/9445?$swatch_lg$","images":["https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_1?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_2?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_3?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_4?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_5?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_6?$pdp_main$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_7?$pdp_main$"],"sizes":["2","4","6","8","10","12"],"swatchId":"9445","thumbnailImages":["https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_1?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_2?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_3?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_4?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_5?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_6?$pdp_thumb$","https://images.lululemon.com/is/image/lululemon/LW6E85S_9445_7?$pdp_thumb$"]}];

		//Get the page
		driver.get(url);
		driver.findElement(By.id('txtLoginId')).sendKeys(kEmail);
		driver.findElement(By.id('txtLoginPass')).sendKeys(kPassword);
		driver.findElement(By.id('login_do')).click();

		//Product edit page

		//Close annoying popup
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
					    element.click();
					});
			});

		//Brand
		var brand = product.brand;
		driver.findElement(By.className('popup_brand')).click();
		driver.wait(until.elementLocated(By.id('brand_suggest_inputTxt')), kTimeoutInSeconds * 1000)
			.then(function(brandInputContainer) {
			    var brandInput = brandInputContainer.findElement(By.tagName('input'));
				brandInput.sendKeys(brand) //brand
				brandInput.sendKeys(Key.DOWN) //down key
				brandInput.sendKeys(Key.ENTER) //enter key
				console.log("Brand finished.")
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

		//Comment
		driver.findElement(By.id('item_comment')).sendKeys(product.descriptionJP);

		//Tags
		driver.wait(until.elementLocated(By.className("popup_tags")), kTimeoutInSeconds * 1000)
			.then(function(element) {
				element.click();
			});

		//Pricing
		driver.findElement(By.name('itemedit[price]')).sendKeys(product.priceBuyma);

		//Quantity
		driver.findElement(By.name('itemedit[yukosu]')).sendKeys(product.quantityBuyma);

		//Shop name
		driver.findElement(By.name('itemedit[konyuchi]')).sendKeys(product.shopNameBuyma);

		//Pause
		driver.wait(function() {
		  return driver.findElements(By.id('asdffoo')).then(function(elements) {
		    return elements[0];
		  });
		}, 100000, 'Failed to find element after timeout');
	}
	else
	{
		console.log("	>Could not find product");
	}
});
