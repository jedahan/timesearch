"use strict";
var menubar = require('menubar')
var mb = menubar()

mb.on('ready', function ready () {
  require('electron-compile').init();
  console.log("menubar ready")
} )
