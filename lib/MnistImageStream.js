/// native
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

/// 3rd-party
const gunzip = require('gunzip-maybe');
const Reader = require('buffer-read');

/// lib
const MnistImage = require('./MnistImage');

// local constants
const MAGIC_NUMBER = 2051;
const TRAINING_IMAGES_FILE_PATH = path.join(__dirname, '../data/train-images-idx3-ubyte.gz');
const TESTING_IMAGES_FILE_PATH = path.join(__dirname, '../data/t10k-images-idx3-ubyte.gz');

class MnistLabelStream extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });

    this.started = false;
    this.imageNumber = null;

    fs.createReadStream(
      options && options.training ? TRAINING_IMAGES_FILE_PATH : TESTING_IMAGES_FILE_PATH
    )
      .pipe(gunzip())
        .on('end', () => this.maybeEnd())
      .pipe(this);
  }
  _transform(chunk, encoding, callback) {
    var buff = chunk;
    if (this.unprocessed) {
      // paste image data buffers together
      buff = Buffer.concat([this.unprocessed, chunk]);
      delete this.unprocessed;
    }

    var reader = new Reader(buff);

    if (!this.started) {
      if (reader.readInt32BE() !== MAGIC_NUMBER) {
        throw('the first part of the file should be the magic number');
      }

      this.numberOfImages = reader.readInt32BE(); // 60000
      this.numberOfRows = reader.readInt32BE(); // 28
      this.numberOfColumns = reader.readInt32BE(); // 28

      this.started = true;
    }

    const pixelsPerImage = this.numberOfRows * this.numberOfColumns;
    while ((buff.length - reader.offset) >= pixelsPerImage) {
      this.push(
        new MnistImage(
          this.imageNumber++,
          reader.slice(this.numberOfRows * this.numberOfColumns),
          this.numberOfRows,
          this.numberOfColumns
        )
      );
    }

    // keep for the next go-around
    this.unprocessed = reader.slice();
    callback();
  }
  maybeEnd() {
    if (this.unprocessed && this.unprocessed.length) {
      this.emit('error', new Error('data left over'));
    } else {
      // doesn't seem to end this stream...why?
      this.push(false);
      this.push(null);
      this.emit('end');
    }
  }
}

module.exports = MnistLabelStream;
