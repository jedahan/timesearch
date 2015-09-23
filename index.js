"use strict";
var menubar = require('menubar')
var mb = menubar({width: 200, height: 40})

mb.on('ready', function ready () {
  require('electron-compile').init();
  console.log("menubar ready")
} )
