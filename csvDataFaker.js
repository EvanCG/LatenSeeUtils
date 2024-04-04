const csv = require('csv-parser');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

// Merged all CSV files into one with https://merge-csv.com/

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

// read through merged.csv and create an object with the results of all of the data

// console.log(result);
const processData = async () => {
  let answer = await readData();

  let dayAdjustment = 0;

  // iterate through answer
  for (let i = 0; i < answer.length; i++) {
    // if firstRun isn't false, then set it to true
    if (answer[i].firstRun !== 'false') {
      // set answer to true
      answer[i].firstRun = 'true';
    }

    // console.log('Raw invoke was ', answer[i].invokeTime);
    // console.log('Invoke date was ', new Date(Number(answer[i].invokeTime)));

    // subtract dayAdjustment *  (24hrs in miliseconds) from: invokeTime, serverStart, serverEnd,
    let rowAdjust = dayAdjustment * 86400000;
    // console.log('rowAdjust is ', rowAdjust);
    answer[i].invokeTime = answer[i].invokeTime - rowAdjust;
    answer[i].serverStart = answer[i].serverStart - rowAdjust;
    answer[i].serverEnd = answer[i].serverEnd - rowAdjust;

    // console.log('Now raw invoke is ', answer[i].invokeTime);
    // console.log('Now Invoke date is ', new Date(Number(answer[i].invokeTime)));

    // Iterate dayAdjustment up to 8, then cycle again
    dayAdjustment = dayAdjustment === 8 ? 0 : dayAdjustment + 1;
  }

  // sort answer
  answer.sort((a, b) => {
    // console.log(`Comparing ${a.invokeTime} and ${b.invokeTime}: ${a.invokeTime - b.invokeTime}`);

    return Number(a.invokeTime) - Number(b.invokeTime);
  });

  return answer;
};

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
