/// native
const { Transform } = require('stream');

/// lib
const MnistLabelStream = require('./MnistLabelStream');
const MnistImageStream = require('./MnistImageStream');

class MnistStream extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    const training = !!(options && options.training);

    this._labels = new MnistLabelStream({ training })
      .on('end', () => this.maybeEnd());
    this._labels.pipe(this, { end: false });
    this._images = new MnistImageStream({ training })
      .on('end', () => this.maybeEnd());
    this._images.pipe(this, { end: false });

    this._pending = {
      labels: {},
      images: {},
    };
  }
  _transform(chunk, encoding, callback) {
    const { labels, images } = this._pending;
    if ('label' in chunk) {
      labels[chunk.index] = chunk.label;
      this._labels.pause();
      this._images.resume();
    } else {
      images[chunk.index] = chunk;
      this._images.pause();
      this._labels.resume();
    }
    Object
      .keys(labels)
      .filter(labelIndex => !!images[labelIndex])
      .forEach(index => {
        const image = images[index];
        image.label = labels[index];

        delete images[index];
        delete labels[index];

        this.push(image);
      });
    callback();
  }
  maybeEnd(who) {
    this._ended = this._ended || 0;
    this._ended += 1;
    if (this._ended >= 2) {
      this.push(null);
    }
  }
}

module.exports = MnistStream;
