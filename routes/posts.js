const express = require('express');
const {ObjectID} = require('mongodb');
const { User, Post } = require('../models');
const { auth, checkAuth } = require('../middleware/auth');

const Router = express.Router();

Router
  .route('/posts/:id')
  // gets a single post
  .get(checkAuth, (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Post.findById(req.params.id).populate('user').exec().then((post) => {
      if(!post) {
        return res.status(404).send();
      };

      const loggedIn = req.user ? true : false;
      let usersPost = null;

      if(loggedIn && req.user.id === post.user.id) {
        usersPost = true;
      } else {
        usersPost = false;
      };

      return res.send({post, loggedIn, usersPost});
    }).catch(e => {
      return res.status(400).send(e);
    });
  })
  // edits post
  .patch(auth, (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Post.findById(req.params.id).then((post) => {
      if(!post) {
        return res.status(404).send();
      } else if(req.user.id !== post.user.toString()) {
        return res.status(401).send();
      };

      post.header = req.body.header;
      post.post = req.body.post;

      post.save().then((post) => {
        return res.send(post);
      });
    }).catch(e => {
      return res.status(400).send(e);
    });
  })
  // deletes post
  .delete(auth, (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)) {
      return res.status(404).send();
    };

    Post.findById(req.params.id).then((post) => {
      if(!post) {
        return res.status(404).send();
      } else if(req.user.id !== post.user.toString()) {
        return res.status(401).send();
      };

      post.remove().then(() => {

        req.user.posts.splice(req.user.posts.indexOf(post.id),1);

        const likeIndex = req.user.likes.indexOf(post.id);
        if(likeIndex !== -1) {
          req.user.likes.splice(likeIndex,1);
        };

        req.user.save().then(() => {
          return res.send(post);
        });

      });
    }).catch(e => {
      return res.status(400).send(e);
    });
  });
// likes a post
Router.route('/posts/:id/like').post(auth, (req, res) => {
  const id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  };

  Post.findById(req.params.id).then((post) => {
    if(!post) {
      return res.status(404).send();
    };

    const postIndex = post.likes.indexOf(req.user.id);

    const alreadyLiked = postIndex > -1 ? true : false;

    if(alreadyLiked) {
      post.likes.splice(postIndex, 1);
    } else {
      post.likes.push(req.user.id);
    };
    post.save().then(() => {
      const userIndex = req.user.likes.indexOf(post.id);

      if(alreadyLiked) {
        req.user.likes.splice(userIndex, 1);
      } else {
        req.user.likes.push(post.id);
      };

      req.user.save().then(() => {
        return res.send();
      });
    });
  }).catch(e => {
    return res.status(400).send(e);
  });
});

module.exports = Router;
