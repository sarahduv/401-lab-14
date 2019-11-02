'use strict';

const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then( async (user) => {
      req.token = await user.generateToken();
      req.user = user;
      res.set('token', req.token);
      res.cookie('auth', req.token);
      res.send(req.token);
    })
    .then(() => {})
    .catch(next);
});

// eslint-disable-next-line no-unused-vars
authRouter.post('/signin', auth(), (req, res, next) => {
  res.cookie('auth', req.token);
  res.send(req.token);
});

authRouter.get('/oauth', (req,res,next) => {
  oauth.authorize(req)
    .then( token => {
      res.status(200).send(token);
    })
    .catch(next);
});

// eslint-disable-next-line no-unused-vars
authRouter.post('/key', auth(), (req,res,next) => {
  req.user.generateKey()
    .then(key => {res.status(200).send(key); });
});

// eslint-disable-next-line no-unused-vars
authRouter.get('/public-stuff', (req, res, next) => {
  res.status(200).send('public stuff worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.get('/hidden-stuff', auth(), (req, res, next) => {
  res.status(200).send('hidden stuff worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.get('/something-to-read', auth('read'), (req, res, next) => {
  res.status(200).send('read stuff worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.post('/create-a-thing', auth('create'), (req, res, next) => {
  res.status(200).send('create a thing worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.put('/update', auth('update'), (req, res, next) => {
  res.status(200).send('update worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.patch('/jp', auth('update'), (req, res, next) => {
  res.status(200).send('jp thing worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.delete('/bye-bye', auth('delete'), (req, res, next) => {
  res.status(200).send('bye-bye thing worked');
});

// eslint-disable-next-line no-unused-vars
authRouter.post('/router-get-everything', auth('superuser'), (req, res, next) => {
  res.status(200).send('router get everything thing worked, but it wont work');
});

module.exports = authRouter;