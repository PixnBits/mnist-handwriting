#!/usr/bin/env node
const start = process.hrtime();

const fs = require('fs');
const path = require('path');

const { Network } = require('neataptic');

const MnistStream = require('../lib/MnistStream');

function flattenPixelsToArray(arr) {
  return [].concat.apply([], arr).map(v => v/255);
}

function expandNumberToArray(number) {
  if (number > 9 || number < 0) {
    throw new Error(`number must be 0 - 9, given ${number}`);
  }
  if (Math.floor(number) !== number) {
    throw new Error(`number must be an integer, given ${number}`);
  }
  const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  arr[number] = 1;
  return arr;
}

// function flattenBooleanPredictionToNumber(arr, scales) {
//   const numbers = arr
//     .map((v, i) => v === 1 ? i : null)
//     .filter(n => n !== null);
//   if (numbers.length < 1) {
//     console.warn('no prediction', arr, scales.map(v => Math.round(v*100)/100));
//     return null;
//   }
//   if (numbers.length > 1) {
//     console.warn('multiple predictions', numbers);
//     // return NaN;
//   }
//   return numbers[0];
// }
// function strongestPredictionToNumber(scales) {
//   const sorted = scales
//     .map((v, i) => ({ v, i }))
//     .filter(({v}) => v >= 0.5)
//     .sort((a, b) => b.v - a.v);
//
//   if (!sorted.length) {
//     return null;
//   }
//
//   return sorted[0].i;
// }

function getAnswer(output) {
  return output.reduce((p, c, i, a) => {
    if (!p) { return i; }
    if (a[i] > a[p]) { return i; }
    return p;
  }, null);
}

fs.readFile(path.resolve(__dirname, 'perceptron.json'), 'utf8', function (err, neataptic) {
  if (err) {
    throw err;
  }
  const network = Network.fromJSON(JSON.parse(neataptic));

  var attempts = 0;
  var successes = 0;
  var failures = 0;

  new MnistStream()
    .on('data', function(image) {
      if (image.index > 100) {
        // return;
      }
      // console.log('image!', image.index, image.label);
      const rawPrediction = network.activate(flattenPixelsToArray(image.pixels));
      const prediction = getAnswer(rawPrediction);
      // console.log(`${image.index} actual: ${image.label}, predicted: ${prediction}`);
      attempts += 1;
      if (image.label === prediction) {
        successes += 1;
      } else {
        failures += 1;
      }
    })
    .on('end', function() {
      console.log('ended', process.hrtime(start));
      console.log(`attempts: ${attempts}, successes: ${successes}, failures: ${failures}`);
      if ((successes + failures) !== attempts) {
        console.error(`(successes + failures) !== attempts [(${successes} + ${failures}) !== ${attempts}]`);
      }
      console.log(`success rate: ${Math.round(successes * 100 / attempts)}%`);
      console.log(`failure rate: ${Math.round(failures * 100 / attempts)}%`);
    });
});
