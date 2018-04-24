const express = require('express'),
    _  = require('lodash'),
    router = express.Router(),
    redis = require("redis"),
    client = redis.createClient(process.env.REDIS_URL),
    {promisify} = require('util'),
    asyncClient = promisify(client.get).bind(client),
    nearByQueryRadius = "1",
    nearByQueryRadiusMetric = "km";

client.on("error", function (err) {
    console.log("REDIS ERROR !!! - \n\n ", err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  client.hgetall("users", function (error, users) {
    users = users || {};
    console.log('users: ', users);

    client.geopos("user_locations", ..._.keys(users), (error, user_locations) => {
      console.log(user_locations);
      res.render('index', { users: users, user_locations: user_locations });
    });
  });
});

// register
router.post('/register', function(req, res, next) {
  if (_.isEmpty(req.body.username)) {
    res.writeHead( 400, 'Username is blank', {'content-type' : 'text/plain'});
    res.end('Username is blank');
    return;
  }

  if (_.isEmpty(req.body.password)) {
    res.writeHead( 400, 'Password is blank', {'content-type' : 'text/plain'});
    res.end('Password is blank');
    return;
  }

  const username = req.body.username.toLowerCase();
  const password = req.body.password.toLowerCase();

  client.hexists("users", username, (error, replies) => {
    if (replies === 1) {
      res.writeHead( 400, 'User is already registered', {'content-type' : 'text/plain'});
      res.end('User is already registered');
    } else {
      client.hset("users", username, password, redis.print);

      res.writeHead( 200, 'User registered successfully', {'content-type' : 'text/plain'});
      res.end('User registered successfully');
    }
  });
});


// login
router.post('/login', function(req, res, next) {
  if (_.isEmpty(req.body.username)) {
    res.writeHead( 400, 'Username is blank', {'content-type' : 'text/plain'});
    res.end('Username is blank');
    return;
  }

  if (_.isEmpty(req.body.password)) {
    res.writeHead( 400, 'Password is blank', {'content-type' : 'text/plain'});
    res.end('Password is blank');
    return;
  }

  const username = req.body.username.toLowerCase();
  const password = req.body.password.toLowerCase();

  client.hexists("users", username, (error, replies) => {
    if (_.isEmpty(error) && replies == 1) {

      client.hget("users", username, (error, replies) => {
        console.log('error: ', JSON.stringify(error))

        if (replies) {
          res.writeHead( 400, 'Password is invalid', {'content-type' : 'text/plain'});
          res.end('Password is invalid');
          return;
        }

        res.writeHead( 200, 'User logged in successfully', {'content-type' : 'text/plain'});
        res.end('User logged in successfully');
      });
    } else {
      res.writeHead( 400, 'Username is invalid', {'content-type' : 'text/plain'});
      res.end('Username is invalid');
    }
  });
});

router.put('/update_location', function(req, res, next) {
  if (_.isEmpty(req.body.username)) {
    res.writeHead( 400, 'Username is blank', {'content-type' : 'text/plain'});
    res.end('Username is blank');
    return;
  }

  const username = req.body.username.toLowerCase();

  client.hexists("users", username, (error, replies) => {
    if (_.isEmpty(error) && replies == 1) {
      client.geoadd("user_locations", req.body.latitude, req.body.longitude, username, redis.print);

      client.georadiusbymember("user_locations", username, nearByQueryRadius, nearByQueryRadiusMetric, "WITHDIST", "WITHCOORD", (error, user_locations) => {
        console.log('error: ', JSON.stringify(error))

        if (user_locations) {
          console.log('user_locations: ', JSON.stringify(user_locations))

          _.remove(user_locations, (user_location) => {
            return user_location[0] === username;
          })
        }

        res.send(user_locations);
      });
    } else {
      res.send(JSON.stringify([]));
    }
  });
});

/*
  GET - /nearbyfriends?username=vineet
*/
router.get('/nearbyfriends', function(req, res, next) {
  if (_.isEmpty(req.query.username)) {
    res.writeHead( 400, 'Username is blank', {'content-type' : 'text/plain'});
    res.end('Username is blank');
    return;
  }

  const username = req.query.username.toLowerCase();

  client.georadiusbymember("user_locations", username, nearByQueryRadius, nearByQueryRadiusMetric, "WITHDIST", "WITHCOORD", (error, user_locations) => {
    console.log('error: ', JSON.stringify(error))

    if (user_locations) {
      console.log('user_locations: ', JSON.stringify(user_locations))

      _.remove(user_locations, (user_location) => {
        return user_location[0] === username;
      })
    }

    res.send(user_locations);
  });

});

// delete user
router.delete('/user', function(req, res, next) {
  const username = req.query.username.toLowerCase();
  client.sadd("users", username, redis.print);
});

router.get('/seed', function(req, res, next) {
  client.flushall("async", redis.print);

  _.each(["vineet", "vipin", "prasad"], (name, i) => {
    client.hset("users", name, name, redis.print);
    client.geoadd("user_locations", (39.25561219453811646 + 0.0000000001 * i), (-76.71097479463344371 + 0.000000000 * i), name.toLowerCase(), redis.print);
  })

  res.send(200);
});

router.get('/flushall', function(req, res, next) {
  client.flushall("async", redis.print);
  res.writeHead( 200, 'Redis Database flushed', {'content-type' : 'text/plain'});
  res.end('Redis Database flushed');
});

module.exports = router;