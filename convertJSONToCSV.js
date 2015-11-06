#!/usr/local/bin/node

var json2csv = require('json2csv');
var fs = require('fs');
var jsonlint = require("jsonlint");
var program = require('commander');

program
  .version('0.0.1')
  .option('-i, --in [file]', 'Specify the file to input', 'itemsDetails.txt')
  .parse(process.argv);

// var fields = ['field1', 'field2', 'field3'];
 
var itemDetailsFile = program.in;//"CanadaItemsDetails.txt";
var outFile = itemDetailsFile.replace(/\.txt/, ".csv");    

var myData = fs.readFileSync(itemDetailsFile);
var myDataAsObject = JSON.parse(myData);
var firstObject = myDataAsObject[0];

var fields = Object.getOwnPropertyNames(firstObject);

fields.forEach(
	function(field)
	{
		console.log("Field: " + field);
	});

json2csv({data: myDataAsObject, fields: fields}, function(err, csv) {
  if (err) console.log(err);
  console.log("Finished!");
  fs.writeFileSync(outFile, csv);
});

// var json2csv = require('json2csv');
// var fields = ['field1', 'field2', 'field3'];
 
// json2csv({ data: myData, fields: fields }, function(err, csv) {
//   if (err) console.log(err);
//   console.log(csv);
// });