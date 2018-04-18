const express = require('express'),
    _  = require('lodash'),
    router = express.Router(),
    redis = require("redis"),
    client = redis.createClient(process.env.REDIS_URL),
    {promisify} = require('util'),
    asyncClient = promisify(client.get).bind(client),
    nearByQueryRadius = 100,
    nearByQueryRadiusMetric = "mi";

client.on("error", function (err) {
    console.log("Error " + err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  client.smembers("users", function (error, users) {
    client.geopos("user_locations", ...users, (error, user_locations) => {
      res.render('index', { users: users, user_locations: user_locations });
    });
  });
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
  client.geoadd("user_locations", req.body.latitude, req.body.longitude, req.body.username, redis.print);
  res.send(200);
});

router.get('/seed', function(req, res, next) {
  client.flushall("async", redis.print);

  _.each(["Vineet", "Vipin", "Prasad"], (name, i) => {
    client.sadd("users", name, redis.print);
    client.geoadd("user_locations", (13.361389 + 0.0000001 * i), (38.115555 + 0.0000001 * i), name, redis.print);
  })

  res.send(200);
});

/*
  /nearbyfriends?current_lat=1.1212&current_lng=1.1213
*/
router.get('/nearbyfriends', function(req, res, next) {
    const current_lat = req.query.current_lat || "13.361389";
    const current_lng = req.query.current_lng || "38.115556";

    client.georadius("user_locations", current_lat, current_lng, nearByQueryRadius, nearByQueryRadiusMetric, "WITHCOORD", "WITHDIST", (error, user_locations) => {
      console.log('error: ', JSON.stringify(error))
      console.log('user_locations: ', JSON.stringify(user_locations))

      res.send(user_locations);
    });

});

router.get('/nearbyfriends2', function(req, res, next) {
    const username = req.query.username;

    client.georadiusbymember("user_locations", username, nearByQueryRadius, nearByQueryRadiusMetric, "WITHCOORD", "WITHDIST", (error, user_locations) => {
      console.log('error: ', JSON.stringify(error))
      console.log('user_locations: ', JSON.stringify(user_locations))

      res.send(user_locations);
    });

});

module.exports = router;