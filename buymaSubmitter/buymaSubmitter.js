#!/usr/local/bin/node

var path = require('path');
var request = require("request");
var cheerio = require("cheerio")
var fs = require("fs");
var util = require('util');
var Parse = require("parse/node");
var fx = require('money');
var oxr = require('open-exchange-rates');
oxr.set({ app_id: 'dfd2acfdf4d64bfea3fe0f9fa673485a' })

Parse.initialize("ZjuQjiF1XPzUA2iY82cGKhmE5czhi4AhCnbNNeTO", "ulaJU0JGr7oPGXB9nolxMzUvXn2gV1otu8MTOVJw", "cD3d8LxY8CnS180zczxQGjjMKycE2la8UNPwnmYJ");

var kEmail = 'ivyangel2015@gmail.com';
var kPassword = 'canada2015!'

var kProductEditUrl = "http://www.buyma.com/my/itemedit/";//http://shop.lululemon.com/products/clothes-accessories/relaxed-sensation/Jet-Crop-Slim-Luxtreme?c_4";
var kTimeoutInMilliseconds = 10000;

kSalesTaxPercentage = 13;
kMarkupPercentage = 20;

//Selenium
var webdriverio = require('webdriverio');
var options = {
    desiredCapabilities: {
        browserName: 'firefox'
    }
};

//Product
var kTempFilename = 'temp.png';
var objectId = "jkuBiAlXGd";

//Get the page
console.log("1. Logging in");
var client = webdriverio
    .remote(options)
    .init()
    .url(kProductEditUrl)
    .timeoutsImplicitWait(10000)
    .setValue('#txtLoginId', kEmail)
    .setValue('#txtLoginPass', kPassword)
    .click('#login_do')
    .click('.js-new-release-tour__close-bt')	//Close annoying popup
    .click('.js-release-alert__close-bt')		//Close annoying popup

var Product = Parse.Object.extend("Product");
var query = new Parse.Query(Product);
query.equalTo("objectId", objectId);
console.log("2. Looking for an existing product");
query.first().then(function(productFromParse)
{
	if (productFromParse != null)
	{
		console.log(">Found the product");

		var product = productFromParse.toJSON();
		// console.log(util.inspect(product));
		//Product edit page
		return processSwatchRecursive(product, 0)
	}
	else
	{
		console.log("	>Could not find product");
	}
}).then(
	function()
	{
		console.log("Finished all swatches for product!");
	}
)

function processSwatchRecursive(product, swatchIndex)
{
	// return new Promise(
	// 	function (resolve, reject) {
		console.log('>Processing swatch at index: ' + swatchIndex);
		var swatch = product.swatches[swatchIndex];		
		//Category
		return client.url(kProductEditUrl)
		.click('.popup_category')
			.then(
				function()
				{
					// try{
						//Category
						var primaryCategorySelector = "a[value='"+ product.categoryPrimaryBuyma + "']";
						var secondaryCategorySelector = "a[value='"+ product.categorySecondaryBuyma + "']";
						return client.waitForVisible(primaryCategorySelector, kTimeoutInMilliseconds)
						.click(primaryCategorySelector)
						.waitForVisible(secondaryCategorySelector, kTimeoutInMilliseconds)
						.click(secondaryCategorySelector)
						.catch(
							function(err)
							{									
								console.error('	>Category could not be loaded!');
								return Promise.resolve();
							})
					// }catch(e){
					// 	console.log('	>Category not found!');
					// 	return Promise.resolve();
					// }						
				}
			).then(
				function()
				{
					//Name
					console.log('	>Category finished!');
					return client.setValue('input[name=\'itemedit[syo_name]\']', getStylizedName(product, swatch))
					.catch(
							function(err)
							{									
								console.error('	>Name could not be loaded!');
								return Promise.resolve();
							})
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
					//Images
					var directoryName = path.dirname(require.main.filename);
					var filePath = directoryName + "/" + kTempFilename;
					return loadImageRecursive(client, 0, swatch.images, filePath);
				}
			)
			.then(
				function()
				{
					//Misc
					var description = product.descriptionJP != null ? product.descriptionJP : '';
					var quantity = product.quantityBuyma != null ? product.quantityBuyma : 1;
					var shopName = product.shopNameBuyma != null ? product.shopNameBuyma : '';

					return getAdjustedPrice(product).then(
							function(price)
							{
								return client.setValue('#item_comment', description)	//Comment
									.setValue('[name=\'itemedit[yukosu]\']', quantity)	//Quantity
									.setValue('[name=\'itemedit[konyuchi]\']', shopName)	//Shop name
									.setValue('[name=\'itemedit[price]\']', price)	//Price, must be high enough. Too low will cause rejection
									.click('#draftButton')
									.click('#done')
									.catch(
											function(err)
											{									
												console.error('	>Misc could not be loaded!');
												return Promise.resolve();
											})

									//Season
									//Tag .popup_tags
									//Theme
									//Shipping
									//通常出品価格/参考価格
									//購入者の支払方法
									//購入期限(日本時間)
									//買付地
									//発送地
							}
						)															
				}
			).then(
				function()
				{
					console.log('	>Finished!');

					var nextIndex = swatchIndex+1;
					if (nextIndex < product.swatches.length)
					{
						//Move onto next swatch
						return processSwatchRecursive(product, nextIndex);
					}
					// else
					// {
					// 	resolve();
					// }
				}
			).catch(
				function(err)
				{
					console.error(err);
					// resolve();
				});
		// });
}

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
						console.log("	>loadImageRecursive: Finished downloading!");
						
						var uploadName = "updfile" + (imageIndex+1);
						// console.log("	>loadImageRecursive Upload name: " + uploadName);
						var uploadSelector = 'input[name=\"' + uploadName + '\"]';
						client//.waitForVisible(uploadSelector, 50*10000)
							.chooseFile(uploadSelector, filePath)
									.then(
										function()
										{
											console.log("		>loadImageRecursive: Upload finished");

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
				console.log("	>loadImageRecursive: Images all uploaded!");
			}	
		}
	).catch(
		function(err)
		{
			console.log("	>loadImageRecursive: Images could not be loaded!")
		}
	)
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

					console.log('	>loadSizeAndColor buymaSizeNames: ' + util.inspect(buymaSizeNames));
					
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
											// console.log('	>loadSizeAndColor value: ' + rowValue + ' checkbox-name: ' + checkboxName + ' isMatch: ' + isMatch);
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
						)
				}).catch(
							function(err)
							{
								console.error('	>loadSizeAndColor: Size and color could not be loaded!');
								resolve();
							}
						)
		})
}

function loadBrand(client, brand)
{
	return new Promise(
		function(resolve, reject)
		{
			console.log("	>loadBrand: Started");
			// Brand
			// var brand = product.brand;
			var firstLetter = brand.slice(0,1);
			var firstLetterSelector = '.brand_list_popup[brandindex=' + firstLetter + ']';
			console.log('	>loadBrand: First letter is ' + firstLetter);			
			client.click('.popup_brand')
			.waitForVisible(firstLetterSelector, kTimeoutInMilliseconds)
			.click(firstLetterSelector)	//Click the first letter
			// .waitForVisible('a*=' + 'L\'ecole', 10000)
			// .click('a*=' + brand)							//Click the brand with the matching row
			.elements('ul.brand_list > li > a').then(
			function(result)
			{
				var elements = result.value;
				// console.log('	>loadSizeAndColor: Found elements:' + util.inspect(elements));
				var isAlreadyMatched = false;
				var promises = elements.map(
					function(element)
					{
						// console.log(util.inspect(element));
						var elementId = element.ELEMENT;
						// console.log('	>loadSizeAndColor id: ' + elementId);
						return client
						.elementIdAttribute(elementId, 'outerHTML')
						.then(
							function(result)
							{									
								var elementValue = result.value;	
								// console.log(elementValue);
								var $ = cheerio.load(elementValue);
								var value = $('a').attr('value');
								var textValue = $('a').text();
								// var checkboxName = $('input.js-colorsize-checkbox').attr('name');

								var isMatch = textValue.match(brand, 'i') != null;
								// console.log('	>loadBrand value: ' + value + ' text:' + textValue + ' isMatch: ' + isMatch);
								if (isMatch&&!isAlreadyMatched)
								{
									console.log('	>loadBrand: Match found!');
									return client.click('a[value=\'' + value + '\']');
								}
							});								
					});		
				return Promise.all(promises);
			})
			.then(
				function()
				{
					console.log('	>loadBrand: Finished!');
					resolve();
				}
			).catch(
			function(err)
			{
				console.error('	>loadBrand: Brand could not be loaded!');
				return resolve();
			})
		});
}

function getShippingCost(product)
{
	//TODO switch based on categories
	return 40;
}

function getAdjustedPrice(product)
{
	return new Promise(
		function(resolve, reject)
		{
			if (product.price == null)
			{
				resolve(0);
			}
			else
			{
				// console.log('	>getAdjustedPrice: price (original)=' + product.price);
				var salesTax = kSalesTaxPercentage / 100 + 1;
				var shippingCost = getShippingCost(product);
				var markup = kMarkupPercentage / 100 + 1;
				// console.log('	>getAdjustedPrice: getShippingCost=' + shippingCost);
				var adjustedPrice = (product.price * salesTax) * markup + shippingCost;
				// console.log('	>getAdjustedPrice: adjustedPrice=' + adjustedPrice);

				//Convert to Japanese yen
				oxr.latest(function() {
					// Apply exchange rates and base rate to `fx` library object:
					fx.rates = oxr.rates;
					fx.base = oxr.base;

					// console.log('	>getAdjustedPrice: price (adjusted)=' + adjustedPrice);
					var priceInJPY = fx(adjustedPrice).from("CAD").to("JPY");
					// console.log('	>getAdjustedPrice: price (adjusted in JPY)=' + priceInJPY);
					//Round up to nearest 900
					priceInJPY = Math.round(priceInJPY/1000)*1000 - 100;
					console.log('	>getAdjustedPrice: price (rounded in JPY)=' + priceInJPY);
					resolve(priceInJPY);
				});
			}
		});
}

function getStylizedName(product, swatch)
{
	var productName = product.nameBuyma != null ? product.nameBuyma : product.name;
	// var brandDescription = '';

	// switch (product.brand)
	// {
	// 	case 'lululemon':
	// 	brandDescription = 'ヨガ&普段使い';
	// 	break;
	// }	

	return util.format('【%s】%s ★ %s', product.brand, productName, swatch.descriptionBuyma);
}