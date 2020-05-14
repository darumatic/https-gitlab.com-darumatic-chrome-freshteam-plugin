/**
 * Packs 2 crx for self testing
 */
'use strict';

const crx = require('./helper/crx');

crx.pack({
  dir: 'dist/unpacked-dev',
  key: 'tasks/keys/donkeyscript-dev.pem',
  out: 'dist/donkeyscript-dev.crx',
});

crx.pack({
  dir: 'dist/unpacked',
  key: 'tasks/keys/donkeyscript.pem',
  out: 'dist/donkeyscript.crx',
});
