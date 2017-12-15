#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const start = process.hrtime();

const { Network } = require('neataptic');
const mnist = require('mnist');
// const data = mnist.set(5e3, 20);
// const data = mnist.set(1e3, 20);
const data = mnist.set(10, 1000);

function getAnswer(output) {
  return output.reduce((p, c, i, a) => {
    if (!p) { return i; }
    if (a[i] > a[p]) { return i; }
    return p;
  }, null);
}

fs.readFile(path.resolve(__dirname, 'mnist.json'), 'utf8', function (err, mnist) {
  if (err) {
    throw err;
  }
  const network = Network.fromJSON(JSON.parse(mnist));

  var attempts = 0;
  var successes = 0;
  var failures = 0;
  data.test.forEach((test) => {
    const prediction = network.activate(test.input);
    const predictionIndex = getAnswer(prediction);
    // console.log('test', test.output, getAnswer(test.output), 'predicted', predictionIndex, prediction.map(v => Math.round(v)), prediction);
    attempts += 1;
    if (getAnswer(test.output) === predictionIndex) {
      successes += 1;
    } else {
      failures += 1;
    }
  });
  console.log('tested!', process.hrtime(start));
  console.log(`attempts: ${attempts}, successes: ${successes}, failures: ${failures}`);
  if ((successes + failures) !== attempts) {
    console.error(`(successes + failures) !== attempts [(${successes} + ${failures}) !== ${attempts}]`);
  }
  console.log(`success rate: ${Math.round(successes * 100 / attempts)}%`);
  console.log(`failure rate: ${Math.round(failures * 100 / attempts)}%`);
});
