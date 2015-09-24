"use strict";
var menubar = require('menubar')
var menu = menubar({height: 800, preloadWindow: true})

var ipc = require('ipc')

const config = require('./config.json')
process.env.CONSUMER_KEY = config.consumer_key
process.env.CONSUMER_SECRET = config.consumer_secret
process.env.ACCESS_TOKEN = config.access_token
process.env.ACCESS_TOKEN_SECRET = config.access_token_secret

menu.on('ready', function ready () {
  require('electron-compile').init();
  var app = require('./backend.js')

  ipc.on('keywords', (_, keywords) => app.changeStream(keywords) )

  if(process.env.ACCESS_TOKEN=="" || process.env.ACCESS_TOKEN_SECRET=="") {
    app.authenticate(function(url) {
      menu.window.loadUrl(url)
      menu.showWindow()
    })
  }
  console.log("menubar ready")
})
