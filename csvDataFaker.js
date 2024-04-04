const csv = require('csv-parser');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

// Merged all CSV files into one with https://merge-csv.com/

/**
 * Reads all of the objects in merged.csv and then returns an array
 *
 * @returns array of objects from merged.csv
 */
const readData = async () => {
  const result = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('merged.csv')
      .pipe(csv())
      .on('data', (data) => result.push(data))
      .on('end', () => {
        console.log(`Finished reading result is ${result.length} rows long.`);
        resolve(result);
      });
  });
};

/**
 *
 * Takes an array of raw objects and fills in missing data with 'true', decrements by number of days between 0-8 and sorts data
 *
 * @returns Array of objects sorted chronologically
 */
const processData = async () => {
  let answer = await readData();

  let dayAdjustment = 0;

  // iterate through answer
  for (let i = 0; i < answer.length; i++) {
    // if firstRun isn't false, then set it to true
    if (answer[i].firstRun !== 'false') {
      answer[i].firstRun = 'true';
    }

    // subtract dayAdjustment *  (24hrs in miliseconds) from: invokeTime, serverStart, serverEnd,
    let rowAdjust = dayAdjustment * 86400000;
    // console.log('rowAdjust is ', rowAdjust);
    answer[i].invokeTime = answer[i].invokeTime - rowAdjust;
    answer[i].serverStart = answer[i].serverStart - rowAdjust;
    answer[i].serverEnd = answer[i].serverEnd - rowAdjust;

    // Iterate dayAdjustment up to 8, then cycle again
    dayAdjustment = dayAdjustment === 8 ? 0 : dayAdjustment + 1;
  }

  // sort answer chronologically
  answer.sort((a, b) => {
    return Number(a.invokeTime) - Number(b.invokeTime);
  });

  return answer;
};

/**
 * takes array of objects, converts to an array of arrays, and writes that to data.csv
 * 
 * Assumes that data.csv already exists and has headers
 * 
 */
const writeData = async () => {
  let finalData = await processData();

  let allRows = [];

  for (let i = 0; i < finalData.length; i++) {
    let row = [
      finalData[i].funcID,
      finalData[i].name,
      finalData[i].cold,
      finalData[i].invokeTime,
      finalData[i].serverStart,
      finalData[i].serverEnd,
      finalData[i].serverDifference,
    ];
    allRows.push(row);
  }

  const csvData = stringify(allRows);

  fs.appendFile('./data.csv', csvData, 'utf-8', (err) => {
    if (err) console.log('error writing file', err);
    else console.log('write to file completed');
  });
};

writeData();
