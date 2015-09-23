const config = require('./config.json')
var {keywords} = require('./keywords.json')

const nedb = require('nedb');
const jobs = new nedb({ filename: 'tweets.db', autoload: true });
jobs.persistence.setAutocompactionInterval(10*1000);
const fs = require('fs')
const ipc = require('ipc')

// POPUPS
const open = require('open')
const notifier = require('node-notifier')

//GETTING
const Twit = require('Twit')
var t = null
var stream = null
var friends = [];

exports.changeStream = function changeStream(newKeywords) {
  const keywords = newKeywords.split(', ')
  if(keywords.length < 1){ return }

  fs.writeFile('./keywords.json', JSON.stringify({ keywords }), function(err){
    if (err) throw err;
    console.log(`we are now tracking ${keywords}`)
    t = new Twit(config)
    stream = t.stream('user', { track: keywords })

    stream.on('tweet', (tweet) => {
      if(friends.indexOf(tweet.user.id) > -1){
        processTweet(tweet)
      }
    });

    t.get('statuses/home_timeline', {track: keywords, count: 20}, function(err, data, response){
      if(!err) { data.forEach((tweet) => { processTweet(tweet) }) }
    });

    // FILTERING
    stream.on('friends', (msg) => {
      friends = msg.friends.sort((a,b) => a-b)
    })
  })
}

const anyKeywordInText = (words, text) => {
  return words
    .map((keyword) => text.indexOf(keyword) > -1)
    .reduce((previous, current) => previous || current, false)
}

const processTweet = function(tweet) {
  if(anyKeywordInText(keywords, tweet.text)) {
    const {text, id_str} = tweet;
    const {screen_name} = tweet.user;
    const url = `https://twitter.com/${screen_name}/status/${id_str}`;
    const job = {screen_name, text, url};
    jobs.insert(job);
    notify(job);
  }
}

const notify = function(tweet){
  notifier.notify({
    title: `@${tweet.screen_name}`,
    message: tweet.text,
    open: tweet.url,
    wait: true
  })
}

exports.changeStream(keywords.join(", "))
