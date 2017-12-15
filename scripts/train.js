#!/usr/bin/env node
const start = process.hrtime();

const fs = require('fs');
const path = require('path');

const { architect } = require('neataptic');

const MnistStream = require('../lib/MnistStream');

const network = new architect.Perceptron(28 * 28, 10, 10);

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

function saveNetwork(cb) {
  console.log('attempting to save training...');
  fs.writeFile(path.join(__dirname, 'perceptron.json'), JSON.stringify(network.toJSON()), function(err) {
    if (err) {
      console.error('issue saving training', err);
    } else {
      console.log('training saved!');
    }
    if (typeof cb === 'function') {
      setImmediate(cb, err);
    }
  });
}

const trainingSet = [];
var trainingSessions = 0;
const imageStream = new MnistStream({ training: true }).on('data', (image) => {
  trainingSet.push({
    input: flattenPixelsToArray(image.pixels),
    output: expandNumberToArray(image.label),
  });
  if (trainingSet.length < 2000) {
    return;
  }
  imageStream.pause();
  console.log('training...');
  network.train(trainingSet, { iterations: 1000 });
  trainingSessions += 1;
  console.log(`trained! (${trainingSessions})`, process.hrtime(start));
  saveNetwork(() => imageStream.resume());
  trainingSet.splice(0, Infinity);
});

// const trainedImages = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// new TrainingStream()
//   .on('data', function(image) {
//     // console.log('data, pleaseStop?', pleaseStop);
//     // if (pleaseStop) {
//     //   return;
//     // }
//     if (image.index < 34200 || image.index > 34250) {
//       return;
//     }
//     // console.log('image!', image.index, image.label);
//     net.train(flattenPixelsToArray(image.pixels), expandNumberToArray(image.label));
//     trainedImages[image.label] += 1;
//
//     const trainedImagesCount = trainedImages.reduce((p, c) => p + c, 0);
//     // console.log('trained images:', trainedImages, trainedImages.map(v => `${Math.round(v * 100 / trainedImagesCount)}%`));
//     console.log(image.index, image.label, trainedImages, trainedImages.map(v => `${Math.round(v * 100 / trainedImagesCount)}%`));
//     if (image.index % 10 === 0 && image.index !== 0) {
//       // saveLayers();
//       fs.writeFileSync(path.join(__dirname, 'mnist.layers'), JSON.stringify(net.layers));
//       console.log('saved layers');
//     }
//   })
//   .on('end', function() {
//     console.log(process.hrtime(start));
//     console.log('trained!');
//     saveLayers();
//     const trainedImagesCount = trainedImages.reduce((p, c) => p + c, 0);
//     console.log('trained images:', trainedImages, trainedImages.map(v => `${Math.round(v * 100 / trainedImagesCount)}%`));
//     // const saved = JSON.stringify(net.layers);
//     // net.layers = JSON.parse(saved);
//   });
