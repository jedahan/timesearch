const ipc = require('ipc')

const keywordsInput = document.querySelector('#keywords')

keywordsInput.addEventListener('change', function(evt) {
  ipc.send('keywords', this.value)
})

keywordsInput.value = require('./keywords.json').keywords.join(", ")
