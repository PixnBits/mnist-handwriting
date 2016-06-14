/// native
const fs = require('fs');
const path = require('path');

/// 3rd-party
const encodeBmp = require('bmp-js').encode;
const decodeBmp = require('bmp-js').decode;

// decode Gimp-created
fs.readFile(
  path.join(__dirname, 'data', 'rgbw.bmp'),
  function(err, buff) {
    if (err) {
      throw err;
    }

    console.log('decodeBmp gimp');
    console.log(decodeBmp(buff));
  }
);

// attempt to encode and then decode an image
const data = new Buffer(2 * 2 * 4);
var o = 0; // offset
data.writeUInt8(0xFF, o++); // r
data.writeUInt8(0x00, o++); // g
data.writeUInt8(0x00, o++); // b
data.writeUInt8(0xFF, o++); // a

data.writeUInt8(0x00, o++); // r
data.writeUInt8(0xFF, o++); // g
data.writeUInt8(0x00, o++); // b
data.writeUInt8(0xFF, o++); // a

data.writeUInt8(0x00, o++); // r
data.writeUInt8(0x00, o++); // g
data.writeUInt8(0xFF, o++); // b
data.writeUInt8(0xFF, o++); // a

data.writeUInt8(0xFF, o++); // r
data.writeUInt8(0xFF, o++); // g
data.writeUInt8(0xFF, o++); // b
data.writeUInt8(0xFF, o++); // a

fs.writeFile(
  path.join(__dirname, 'bmp', 'simple.bmp'),
  encodeBmp({
    data,
    width: 2,
    height: 2,
  }).data,
  function(err) {
    fs.readFile(
      path.join(__dirname, 'bmp', 'simple.bmp'),
      function(err, buff) {
        if (err) {
          throw err;
        }

        console.log('decodeBmp generated');
        console.log(decodeBmp(buff));
      }
    );
  }
);
