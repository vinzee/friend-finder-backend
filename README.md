### Express App for CMSC 628 Mobile Computing

To have launchd start redis now and restart at login:
  brew services start redis
Or, if you don't want/need a background service you can just run:
  redis-server /usr/local/etc/redis.conf


https://code.tutsplus.com/tutorials/building-a-store-finder-with-nodejs-and-redis--cms-26283

https://redis.io/commands#geo# friend-finder-backend

```
# run app on locally on http://localhost:5000
$ heroku run build

$ heroku addons:docs heroku-redis

$ heroku logs -a android-friend-finder

$ heroku logs --tail  -a android-friend-finder

$ heroku addons:info redis-fitted-10737

$ heroku redis:cli -a android-friend-finder -c android-friend-finder

$ zrem user_locations "key"
```