/// native
const util = require('util');
const Readable = require('stream').Readable;

/// lib
const getTrainingLabelsStream = require('./getTrainingLabelsStream');
const getTrainingImagesStream = require('./getTrainingImagesStream');

function TrainingStream() {
  Readable.call(this, { objectMode: true });

  this.pendingLabels = {};
  this.pendingImages = {};

  this.ended = 0;

  this.labelStream = getTrainingLabelsStream()
    .on('data', this.handleLabels.bind(this))
    .on('end', this.handleLabelsEnd.bind(this));

  this.imageStream = getTrainingImagesStream()
    .on('data', this.handleImages.bind(this))
    .on('end', this.handleImagesEnd.bind(this));
}

util.inherits(TrainingStream, Readable);

TrainingStream.prototype.handleLabels = function(label) {
  this.pendingLabels[label.index] = label.label;
  this.findMatches();
};

TrainingStream.prototype.handleImages = function(image) {
  this.pendingImages[image.index] = image;
  this.findMatches();
};

TrainingStream.prototype.handleLabelsEnd = function() {
  if (this.imageStream.isPaused()) {
    this.imageStream.resume();
  }
  this.maybeEnd();
};

TrainingStream.prototype.handleImagesEnd = function() {
  if (this.labelStream.isPaused()) {
    this.labelStream.resume();
  }
  this.maybeEnd();
};

TrainingStream.prototype.maybeEnd = function() {
  if (++this.ended < 2) {
    return;
  }

  this.push(null);
};

TrainingStream.prototype.findMatches = function() {
  const stream = this;

  const pendingLabelCount = Object.keys(stream.pendingLabels).length;
  const pendingImageCount = Object.keys(stream.pendingImages).length;

  // don't store too much of either, switch off who's active
  if (pendingLabelCount > 100 && pendingImageCount < 10) {
    this.labelStream.pause();
    this.imageStream.resume();
  }

  if (pendingImageCount > 100 && pendingLabelCount < 10) {
    this.imageStream.pause();
    this.labelStream.resume();
  }

  Object
    .keys(stream.pendingLabels)
    .filter(labelIndex => !!stream.pendingImages[labelIndex])
    .forEach(index => {
      const image = stream.pendingImages[index];
      image.label = stream.pendingLabels[index];

      delete stream.pendingImages[index];
      delete stream.pendingLabels[index];

      stream.push(image);
    });
};

TrainingStream.prototype._read = function(amount) {
  // TODO: use the amount parameter?
  this.findMatches();
};

module.exports = TrainingStream;