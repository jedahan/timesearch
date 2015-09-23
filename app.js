var track = ['job', 'work', 'opportunity'];

const keywordsInput = document.querySelector('#keywords')
keywordsInput.value = track.join(', ')
keywordsInput.focus()

keywordsInput.addEventListener('change', function (evt) {
  const track = this.value.split(',')
  if(track.length>0){ changeStream(track) }
})

const config = require('./config.json');

const nedb = require('nedb');
const jobs = new nedb({ filename: 'tweets.db', autoload: true });
jobs.persistence.setAutocompactionInterval(10*1000);

// POPUPS
const open = require('open')
const notifier = require('node-notifier')

//GETTING
const Twit = require('Twit')
var t = null
var stream = null

const changeStream = function(keywords) {
  track = keywords
  console.log(`we are now tracking ${track}`)
  t = new Twit(config)
  stream = t.stream('user', { track })

  stream.on('tweet', (tweet) => {
    if(friends.indexOf(tweet.user.id) > -1)
      processTweet(tweet)
  });

  t.get('statuses/home_timeline', {track, count: 200}, function(err, data, response){
    if(!err) { data.forEach((tweet) => { processTweet(tweet) }) }
  });

  // FILTERING
  const friends = [];
  stream.on('friends', (msg) => friends.push(msg.friends.sort((a,b) => a-b)) )
}

const anyKeywordInText = (keywords, text) => {
  return keywords
    .map((keyword) => text.indexOf(keyword) > -1)
    .reduce((previous, current) => previous || current, false)
}

const processTweet = function(tweet) {
  if(anyKeywordInText(track, tweet.text)) {
    const {text, id_str} = tweet;
    const {screen_name} = tweet.user;
    const url = `https://twitter.com/${screen_name}/status/${id_str}`;
    const job = {screen_name, text, url};
    jobs.insert(job);
    notify(job);
  }
}

const notify = function(tweet){
  const notification = {
    title: `@${tweet.screen_name}`,
    message: tweet.text,
    wait: true
  }
  notifier.notify(notification)
  notifier.on('click', () => { console.log(tweet.url); open(tweet.url) })
}

changeStream(track)
