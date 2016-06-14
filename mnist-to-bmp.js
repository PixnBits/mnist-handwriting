// create a bitmap of some data in the training set

/// native
const fs = require('fs');
const path = require('path');

/// 3rd-party
const through2 = require('through2');
const gunzip = require('gunzip-maybe');
const Reader = require('buffer-read');

// lib
const MnistImage = require('./lib/MnistImage');

const MAGIC_NUMBER = 2051;

const trainingImagesFilePath = path.join(__dirname, 'data/train-images-idx3-ubyte.gz');
const bmpDirectoryPath = path.join(__dirname, 'bmp');

const imagesToSave = [];

fs
  .createReadStream(trainingImagesFilePath)
  .pipe(gunzip())
  .pipe(through2({ objectMode: true }, function(chunk, enc, callback) {
    this.offset = this.offset || 0;

    var buff = chunk;
    if (this.unprocessed) {
      // paste image data buffers together
      buff = Buffer.concat([this.unprocessed, chunk]);
      delete this.unprocessed;
    }
    
    var reader = new Reader(buff);
    
    if (this.offset === 0) {
      if (reader.readInt32BE() !== MAGIC_NUMBER) {
        throw('the first part of the file should be the magic number');
      }

      this.numberOfImages = reader.readInt32BE(); // 60000
      this.numberOfRows = reader.readInt32BE(); // 28
      this.numberOfColumns = reader.readInt32BE(); // 28
      console.log(
        'numberOfImages', this.numberOfImages,
        'numberOfRows', this.numberOfRows,
        'numberOfColumns', this.numberOfColumns
      );

      for (var i=0; i<10; i++) {
        imagesToSave.push((Math.random() * this.numberOfImages) | 0);
      }
    }

    const rows = this.numberOfRows;
    const columns = this.numberOfColumns;
    const pixelsPerImage = rows * columns;

    while ((buff.length - reader.offset) >= pixelsPerImage) {
      this.push(
        new MnistImage(
          reader.slice(this.numberOfRows * this.numberOfColumns),
          this.numberOfRows,
          this.numberOfColumns
        )
      );
    }

    // keep for the next go-around
    this.unprocessed = reader.slice();
    this.offset += chunk.length;
    callback();
  }))
  .pipe(through2({ objectMode: true }, function(chunk, enc, callback) {
    this.number = this.number || 0;
    
    if (imagesToSave.indexOf(this.number) !== -1) {
      fs.writeFile(
        path.join(bmpDirectoryPath, `${this.number++}.bmp`),
        chunk.toBitmap(),
        callback
      );
    } else {
      this.number++;
      callback();
    }
  }));
