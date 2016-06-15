const TrainingStream = require('../lib/TrainingStream');

const start = process.hrtime();

new TrainingStream()
  .on('data', function(image) {
    console.log('image!', image.index, image.label);
  })
  .on('end', function() {
    console.log(process.hrtime(start));
  });