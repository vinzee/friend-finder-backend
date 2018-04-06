const express = require('express'),
    router = express.Router(),
    redis = require("redis"),
    client = redis.createClient(),
    {promisify} = require('util'),
    asyncClient = promisify(client.get).bind(client);

client.on("error", function (err) {
    console.log("Error " + err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/users', function(req, res, next) {
  client.smembers("users", function (error, users) {
    console.log('users: ', JSON.stringify(users))
    res.send(users);
  });
});

router.post('/user', function(req, res, next) {
  client.sadd("users", "Vineet", redis.print);
});

router.delete('/user', function(req, res, next) {
  client.sadd("users", req.body.username, redis.print);
});

router.put('/user/:username/location', function(req, res, next) {
  console.log('/location/update !!!!')

  client.geoadd("user_locations", "13.361389", "38.115555", "Vipin", redis.print);

  res.send(200);
});

/*
  http://localhost:3000/nearbyfriends?current_lat=1.1212&current_lng=1.1213
*/
router.get('/nearbyfriends', function(req, res, next) {
    console.log('/nearbyfriends - ' , req.query)

    const username = req.query.username;
    // const current_lat = req.query.current_lat || "13.361389";
    // const current_lng = req.query.current_lng || "38.115556";
    const radius = 100;
    const radius_metric = "mi";

    // client.georadius("user_locations", current_lat, current_lng, radius, radius_metric, "WITHCOORD", "WITHDIST", (error, user_locations) => {
    client.georadiusbymember("user_locations", username, radius, radius_metric, "WITHCOORD", "WITHDIST", (error, user_locations) => {
      console.log('error: ', JSON.stringify(error))
      console.log('user_locations: ', JSON.stringify(user_locations))

      res.send(user_locations);
    });

});

module.exports = router;