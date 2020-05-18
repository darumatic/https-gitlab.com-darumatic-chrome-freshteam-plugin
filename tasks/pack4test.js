/**
 * Packs 2 crx for self testing
 */
'use strict';

const crx = require('./helper/crx');

crx.pack({
  dir: 'dist/unpacked-dev',
  key: 'tasks/keys/freshteam-dev.pem',
  out: 'dist/freshteam-dev.crx',
});

crx.pack({
  dir: 'dist/unpacked',
  key: 'tasks/keys/freshteam.pem',
  out: 'dist/freshteam.crx',
});
