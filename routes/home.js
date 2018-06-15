const express = require('express');
const { User, Post } = require('../models');
const {auth} = require('../middleware/auth');

const Router = express.Router();

Router.route('/posts').get((req, res) => {

  Post.find().populate('user').exec().then((posts) => {

    return res.send({posts});
  }).catch(e => {
    return res.status(400).send(e);
  });
});

Router.route('/login').post((req, res) => {

  User.findByCredentials(req.body.email, req.body.password).then((user) => {
    return user.createToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch(e => {
    res.status(400).send(e);
  });
});

Router.route('/signup').post((req, res) => {
  const user = new User(req.body);

  user.save().then(() => {
    return user.createToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch(e => {
    res.status(400).send(e);
  });
});

Router.route('/logout').delete(auth, (req, res) => {

  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }).catch(e => {
    res.status(400).send(e);
  });
});

module.exports = Router;
