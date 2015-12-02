#!/usr/local/bin/node
var Parse = require("parse/node");
Parse.initialize("ZjuQjiF1XPzUA2iY82cGKhmE5czhi4AhCnbNNeTO", "ulaJU0JGr7oPGXB9nolxMzUvXn2gV1otu8MTOVJw", "cD3d8LxY8CnS180zczxQGjjMKycE2la8UNPwnmYJ");


var template = "【<brand>】<name> ★ <colour>"

var Product = Parse.Object.extend("Product");
var query = new Parse.Query(Product);
console.log("Looking for an existing product");
query.find().then(function(products)
{
	products.forEach(
			function(product)
			{
				if (product.nameBuyma == null)
				{
					var nameBuyma = template.replace(/\<name\>/, product.get('name'));
					nameBuyma = nameBuyma.replace(/\<brand\>/, product.get('brand'));
					nameBuyma = nameBuyma.replace(/\<colour\>/, colourName);

					product.nameBuyma = nameBuyma;
					console.log('	>New name: ' + product.nameBuyma);
				}
			}
		)
});