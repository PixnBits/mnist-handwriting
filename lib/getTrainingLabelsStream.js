/// native
const fs = require('fs');
const path = require('path');

/// 3rd-party
const through2 = require('through2');
const gunzip = require('gunzip-maybe');
const Reader = require('buffer-read');

// local constants
const MAGIC_NUMBER = 2049;
const TRAINING_LABELS_FILE_PATH = path.join(
  __dirname, 
  '../data/train-labels-idx1-ubyte.gz'
);

function getTrainingLabelsStream() {
  var started = false;
  var imageNumber = null;

  return fs
    .createReadStream(TRAINING_LABELS_FILE_PATH)
    .pipe(gunzip())
    .pipe(through2({ objectMode: true }, function(chunk, enc, callback) {
      var reader = new Reader(chunk);
      
      if (!started) {
        if (reader.readInt32BE() !== MAGIC_NUMBER) {
          throw('the first part of the file should be the magic number');
        }

        this.numberOfLabels = reader.readInt32BE(); // 60000

        started = true;
        this.emit('started', this);
      }

      while (chunk.length - reader.offset) {
        this.push({
          index: imageNumber++,
          label: reader.readUInt8(),
        });
      }

      callback();
    }));
}

module.exports = getTrainingLabelsStream;
