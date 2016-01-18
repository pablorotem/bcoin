// Update preloader
var assert = require('assert');
var dns = require('dns');
var net = require('net');
var path = require('path');
var bcoin = require('../');
var utils = bcoin.utils;
var assert = utils.assert;
var network = bcoin.protocol.network;

var pool = bcoin.pool({
  size: 6,
  redundancy: 1,
  parallel: 4000,
  loadWindow: 750,
  fullNode: false
});

pool.startSync();

pool.on('error', function(err) {
  utils.print('Error: %s', err.message);
});

console.log('Updating bcoin preloaded chain...');

pool.on('block', function(block) {
  console.log('Got: %s from %s chain len %d orp %d act %d queue %d',
              block.hash('hex'),
              new Date(block.ts * 1000).toString(),
              pool.chain.index.hashes.length,
              pool.chain.orphan.count,
              pool.request.active,
              pool.request.queue.length);
});

// pool.on('addr', function(data) {
//   console.log('Found new peer: %s:%d', data.host, data.port);
// });

pool.once('full', finish);
process.once('SIGINT', finish);

var once = false;
function finish() {
  if (once)
    return;
  once = true;

  console.log('Done...');
  var chain = '// Autogenerated, use scripts/update.js to update\n' +
              'module.exports = ' +
              JSON.stringify(pool.chain.toJSON(), null, 2) + '\n';
  var name = network.type === 'main' ? 'preload.js' : 'preload-test.js';
  var file =
      path.resolve(__dirname, '..', 'lib', 'bcoin', 'protocol', name);

  require('fs').writeFileSync(file, chain);
  pool.destroy();
}
