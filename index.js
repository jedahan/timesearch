"use strict";
var menubar = require('menubar')
var mb = menubar({width: 200, height: 40})

var ipc = require('ipc')

mb.on('ready', function ready () {
  require('electron-compile').init();

  var app = require('./backend.js')

  ipc.on('keywords', (_, keywords) => app.changeStream(keywords) )

  console.log("menubar ready")
})
