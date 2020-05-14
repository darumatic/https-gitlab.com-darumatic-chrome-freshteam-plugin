'use strict'

const path = require('path')
const cpx = require('cpx')
const fs = require('fs-extra')
const noop = function() {
}

exports.core = function(options) {
  const onManifestCopy = options.dev ? updateDevManifest : null
  processItems([
    {
      src: 'src/manifest.json',
      dest: `${options.outDir}/`,
      onCopy: onManifestCopy
    },
    { src: 'src/frame-0.png', dest: `${options.outDir}/` },
    { src: 'src/frame-1.png', dest: `${options.outDir}/` },
    { src: 'src/frame-2.png', dest: `${options.outDir}/` },
    { src: 'src/frame-3.png', dest: `${options.outDir}/` },
    { src: 'src/frame-4.png', dest: `${options.outDir}/` },
    { src: 'src/frame-5.png', dest: `${options.outDir}/` },
    { src: 'src/frame-6.png', dest: `${options.outDir}/` },
    { src: 'src/frame-7.png', dest: `${options.outDir}/` },
    { src: 'src/frame-8.png', dest: `${options.outDir}/` },
    { src: 'src/favicon-16x16.png', dest: `${options.outDir}/` },
    { src: 'src/favicon-48x48.png', dest: `${options.outDir}/` },
    { src: 'src/favicon-128x128.png', dest: `${options.outDir}/` },
    { src: 'src/logo-left.png', dest: `${options.outDir}/` },
    { src: 'src/logo-right.png', dest: `${options.outDir}/` },
    { src: 'src/popup/popup.html', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/popup.css', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/shield.png', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/safe.png', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/search.png', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/menu.png', dest: `${options.outDir}/core/popup/` },
    { src: 'src/popup/menu--active.png', dest: `${options.outDir}/core/popup/` },
    { src: 'src/options/options.html', dest: `${options.outDir}/core/options/` },
    { src: 'src/options/options.css', dest: `${options.outDir}/core/options/` }
  ], options)
}

exports.tests = function(options) {
  processItems([
    { src: 'test/specs/**', dest: `${options.outDir}/tests/` }
  ], options)
}

function processItems(items, options = {}) {
  items.forEach(item => {
    console.log(`copy${options.watch ? ' and watch' : ''}: ${item.src} --> ${item.dest}`)
    item.onCopy = item.onCopy || noop
    copy(item)
    if (options.watch) {
      watch(item)
    }
  })
}

function copy(item) {
  cpx.copySync(item.src, item.dest, { clean: true })
  item.onCopy(item)
}

function watch(item) {
  cpx.watch(item.src, item.dest, { initialCopy: false })
    .on('copy', e => {
      console.log(`copy: ${e.srcPath} --> ${e.dstPath}`)
      item.onCopy(item)
    })
}

/**
 * Update dev manifest key to have different extension id
 */
function updateDevManifest(item) {
  const relPath = path.join(item.dest, path.basename(item.src))
  updateJsonFile(relPath, {
    name: '',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoNcz4LvR5bPGLO6A9whCnxdfkX21YlAf5V12kgrR09Te7Rkm0SFgBpjvNCdDWN8bc1OpiKVMtiT6hArtr53pOrVB1UWA2YslBRxg18HizQxZB26edPI1gyTSrX59Dm4h0P5RuaKxHVJOVqldbe0Y1t5fCDLbiq0aPNlmvOnwV/Yk3gvJdA6N7slXvLR4/aNCekpvF/EYn7rs32LbWMSjYSTJ0b1OjrTRVNqGI3w97xLFNtqSHPvtrZ5OvWeDT4reqBhJ+xGbJFKKDUMLEq/fo3DJtGyLGywQoEtho4vRJO6WFNdAYjypxSSwryTYq+gL/MkQzL64guGZxYqp1M0p9QIDAQAB'
  })
}

function updateJsonFile(relPath, data) {
  const absPath = path.resolve(relPath)
  const json = fs.readJsonSync(absPath)
  Object.assign(json, data)
  fs.writeJsonSync(absPath, json)
}
