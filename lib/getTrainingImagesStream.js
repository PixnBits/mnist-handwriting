/// native
const fs = require('fs');
const path = require('path');

/// 3rd-party
const through2 = require('through2');
const gunzip = require('gunzip-maybe');
const Reader = require('buffer-read');

/// lib
const MnistImage = require('./MnistImage');

// local constants
const MAGIC_NUMBER = 2051;
const TRAINING_IMAGES_FILE_PATH = path.join(__dirname, '../data/train-images-idx3-ubyte.gz');

function getTrainingImagesStream() {
  var started = false;
  var imageNumber = null;

  return fs
    .createReadStream(TRAINING_IMAGES_FILE_PATH)
    .pipe(gunzip())
    .pipe(through2({ objectMode: true }, function(chunk, enc, callback) {
      var buff = chunk;
      if (this.unprocessed) {
        // paste image data buffers together
        buff = Buffer.concat([this.unprocessed, chunk]);
        delete this.unprocessed;
      }
      
      var reader = new Reader(buff);
      
      if (!started) {
        if (reader.readInt32BE() !== MAGIC_NUMBER) {
          throw('the first part of the file should be the magic number');
        }

        this.numberOfImages = reader.readInt32BE(); // 60000
        this.numberOfRows = reader.readInt32BE(); // 28
        this.numberOfColumns = reader.readInt32BE(); // 28

        started = true;
        this.emit('started', this);
      }

      const pixelsPerImage = this.numberOfRows * this.numberOfColumns;
      while ((buff.length - reader.offset) >= pixelsPerImage) {
        this.push(
          new MnistImage(
            imageNumber++,
            reader.slice(this.numberOfRows * this.numberOfColumns),
            this.numberOfRows,
            this.numberOfColumns
          )
        );
      }

      // keep for the next go-around
      this.unprocessed = reader.slice();
      callback();
    }));
}

module.exports = getTrainingImagesStream;
