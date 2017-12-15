const fs = require('fs');
const path = require('path');

const start = process.hrtime();

const mnist = require('mnist');
const data = mnist.set(5e3, 20);
// const data = mnist.set(1e3, 20);
// const data = mnist.set(10, 10);

const { architect } = require('neataptic');
const network = new architect.Perceptron(28 * 28, 10, 10);
console.log('training...');
// network.evolve(data.training, { error: 0.01 }).then(() => {
  // console.log('evolved!', process.hrtime(start));
network.train(data.training, { iterations: 1000 });
console.log('trained!', process.hrtime(start));
fs.writeFile(path.resolve(__dirname, 'mnist.json'), JSON.stringify(network.toJSON()), (err) => (err ? console.error(err) : console.log('wrote mnist.json')));
data.test.forEach((test) => {
  const prediction = network.activate(test.input);
  console.log('test', test.output, 'predicted', prediction.map(v => Math.round(v)), prediction);
});
