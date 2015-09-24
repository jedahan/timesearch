var {keywords} = require('./keywords.json')

// DATABASE
const nedb = require('nedb');
const jobs = new nedb({ filename: 'tweets.db', autoload: true });
jobs.persistence.setAutocompactionInterval(10*1000);
const fs = require('fs')

// POPUPS
const notifier = require('node-notifier')

// AUTH
const ipc = require('ipc')
const twitterApi = require('node-twitter-api')
const twitter = new twitterApi({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callback: 'http://127.0.0.1:5000/oauth'
});

var http = require('http');

http.createServer(function (req, res) {
  const query = require('url').parse(req.url, true).query
  console.log(query)
  twitter.getAccessToken(
    process.env.REQUEST_TOKEN,
    process.env.REQUEST_TOKEN_SECRET,
    query.oauth_verifier, function(error, accessToken, accessTokenSecret, results) {
      if (error) {
        console.log(error);
      } else {
        process.env.ACCESS_TOKEN = accessToken;
        process.env.ACCESS_TOKEN_SECRET = accessTokenSecret;
        fs.writeFile('./config.json', JSON.stringify({
            consumer_key: process.env.CONSUMER_KEY
            , consumer_secret:  process.env.CONSUMER_SECRET
            , access_token: process.env.ACCESS_TOKEN
            , access_token_secret:  process.env.ACCESS_TOKEN_SECRET
          }), function(err){
            if (err) throw err;
            exports.changeStream(keywords.join(", "))
        })
      }
    });
  res.writeHead(301, {"Location": 'index.html'});
  res.end();
}).listen(5000, "127.0.0.1");

const util = require('util');
exports.authenticate = function authenticate(callback) {
  if(!process.env.REQUEST_TOKEN && !process.env.REQUEST_TOKEN_SECRET){
    twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
        if (error) {
            console.log("Error getting OAuth request token : " + util.inspect(error));
        } else {
            process.env.REQUEST_TOKEN = requestToken;
            process.env.REQUEST_TOKEN_SECRET = requestTokenSecret;
            callback(twitter.getAuthUrl(process.env.REQUEST_TOKEN))
        }
    });
  } else {
    callback(twitter.getAuthUrl(process.env.REQUEST_TOKEN))
  }
}

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
    t = new Twit({
      consumer_key: process.env.CONSUMER_KEY
    , consumer_secret:  process.env.CONSUMER_SECRET
    , access_token: process.env.ACCESS_TOKEN
    , access_token_secret:  process.env.ACCESS_TOKEN_SECRET
    })
    stream = t.stream('user', { track: keywords })

    stream.on('tweet', (tweet) => {
      if(friends.indexOf(tweet.user.id) > -1){
        processTweet(tweet)
      }
    });

    t.get('statuses/home_timeline', {track: keywords, count: 100}, function(err, data, response){
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
    customPath: __dirname,
    wait: true
  })
}
