const Reader = require('buffer-read');
const encodeBmp = require('bmp-js').encode;

function MnistImage(buf, rows, cols) {
  const reader = new Reader(buf);
  this.rows = rows;
  this.columns = cols;
  this.pixels = [];

  for (var r=0; r<rows; r++) {
    var pixelRow = [];
    for (var c=0; c<cols; c++) {
      pixelRow.push(reader.readUInt8());
    }
    this.pixels.push(pixelRow);
  }
}

MnistImage.prototype.toString = function() {
  return `[object MnistImage (${this.rows}x${this.columns})]`;
};

MnistImage.prototype.toBitmap = function() {
  const rows = this.rows;
  const columns = this.columns;
  const data = new Buffer(rows * columns * 4);
  data.fill(0);
  var offset = 0;

  for (var r=0; r<rows; r++) {
    var pixelRow = this.pixels[r];
    for (var c=0; c<columns; c++) {
      var pixelValue = pixelRow[c]; 
      // console.log('pixelValue', pixelValue, offset, data.length);
      data.writeUInt8(0xFF - pixelValue, offset++); // r
      data.writeUInt8(0xFF - pixelValue, offset++); // g
      data.writeUInt8(0xFF - pixelValue, offset++); // b
      data.writeUInt8(0xFF, offset++); // a
    }
  }

  return encodeBmp({
    data,
    height: rows,
    width: columns,
  }).data;
}

module.exports = MnistImage;