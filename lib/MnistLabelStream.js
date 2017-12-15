/// native
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

/// 3rd-party
const gunzip = require('gunzip-maybe');
const Reader = require('buffer-read');

// local constants
const MAGIC_NUMBER = 2049;
const TRAINING_LABELS_FILE_PATH = path.resolve(
  __dirname,
  '../data/train-labels-idx1-ubyte.gz'
);
const TESTING_LABELS_FILE_PATH = path.resolve(
  __dirname,
  '../data/t10k-labels-idx1-ubyte.gz'
);

class MnistLabelStream extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });

    this.started = false;
    this.imageNumber = null;

    fs.createReadStream(
      options && options.training ? TRAINING_LABELS_FILE_PATH : TESTING_LABELS_FILE_PATH
    )
      .pipe(gunzip())
      .pipe(this);
  }
  _transform(chunk, encoding, callback) {
    var reader = new Reader(chunk);

    if (!this.started) {
      if (reader.readInt32BE() !== MAGIC_NUMBER) {
        throw new Error('the first part of the file should be the magic number');
      }

      this.numberOfLabels = reader.readInt32BE(); // 60000 training, 10000 testing

      this.started = true;
    }

    while (chunk.length - reader.offset) {
      this.push({
        index: this.imageNumber++,
        label: reader.readUInt8(),
      });
    }
    callback();
  }
}

module.exports = MnistLabelStream;
