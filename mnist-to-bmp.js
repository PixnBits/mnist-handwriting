// create a bitmap of some data in the training set

/// native
const fs = require('fs');
const path = require('path');

/// 3rd-party
const through2 = require('through2');

// lib
const getTrainingImagesStream = require('./lib/getTrainingImagesStream');

const bmpDirectoryPath = path.join(__dirname, 'bmp');

const imageIndexesToSave = [];

getTrainingImagesStream()
  .on('started', function(stream) {
    console.log(
      'numberOfImages', stream.numberOfImages,
      'numberOfRows', stream.numberOfRows,
      'numberOfColumns', stream.numberOfColumns
    );

    for (var i=0; i<10; i++) {
      imageIndexesToSave.push((Math.random() * stream.numberOfImages) | 0);
    }
  })
  .pipe(through2({ objectMode: true }, function(trainingImage, enc, callback) {
    if (imageIndexesToSave.indexOf(trainingImage.index) !== -1) {
      fs.writeFile(
        path.join(bmpDirectoryPath, `${trainingImage.index}.bmp`),
        trainingImage.toBitmap(),
        callback
      );
    } else {
      callback();
    }
  }));
