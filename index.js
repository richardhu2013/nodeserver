const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');

const app = express();


// Get the config from env variables
const config = {
  port: process.env.PORT || 9000,
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: process.env.REDIS_PORT || 6379,
  redisAuthPass: process.env.REDIS_AUTH_PASS,
};

const redisOptions = {
  port: config.redisPort,
  host: config.redisHost,
  password: config.redisAuthPass,
};

// Connect to redis with the provided creds
const redisClient = redis.createClient(redisOptions);


app.use(bodyParser.text());


/**
 * GET /healthcheck
 * responds 200 ok
 */
app.get('/healthcheck', function(req, res) {
  const reply = 'ok';
  res.status(200).send(reply);
});


/**
 * POST /save-string
 * responds 202 accepted or 500 <error>
 * saves the body as a key in redis with value 1
 */
app.post('/save-string', function(req, res) {
  if (typeof req.body !== 'string' || req.body.length > 30) {
    console.log(req.body);
    res.status(400).send('request body should be a < 30 character string');
    return;
  }

  redisClient.set(
      req.body,
      '1', // just save the value of 1 to indicate we have it
      (err) => {
        if (err) {
          console.log(`${Date.now()} error saving key ${req.body}`, err);
          res.status(500).send(`Error saving ${req.body}`);
          return;
        }
        const reply = 'accepted';
        return res.status(202).send(reply);
      }
  );
});


/**
 * GET /has-string
 * responds 200 yes or 200 no or 500 error
 * Tries to find the specified key in redis
 * if found responds yes
 * if not found responds no
 */
app.get('/has-string/:key', function(req, res) {
  const key = req.params.key;

  redisClient.get(
      key,
      (err, value) => {
        if (err) {
          console.log(`${Date.now()} error getting key ${req.body}`, err);
          res.status(500).send(`Error getting ${key}`);
          return;
        }
        if (value) {
          res.status(200).send('yes');
          return;
        }
        res.status(200).send('no');
      }
  );
});


// start the app
redisClient.on('connect', () => {
  app.listen(config.port);
  console.log(`${Date.now()} listening on ${config.port}`);
});
