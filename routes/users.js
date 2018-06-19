const express = require('express');
const { User, Post } = require('../models');
const { auth, checkAuth } = require('../middleware/auth');

const Router = express.Router();

// gets a user
Router.route('/users/me').get(auth, (req, res) => {
    return res.send(req.user);
});
// creates a post
Router.route('/users/post')
.post(auth, (req, res) => {

  const newPost = new Post(req.body);
  newPost.user = req.user.id;

  newPost.save().then((post) => {

    req.user.posts.push(post);

    req.user.save().then(() => {
      return res.send(post);
    });
  }).catch(e => {
    return res.status(400).send();
  });
});
// deletes a user
Router.route('/users/delete')
.delete(auth, (req, res) => {

  User.findByIdAndRemove(req.user.id)
  .populate('likes').exec().then((user) => {

    Post.deleteMany({ user: user.id }).then(() => {

      user.likes.forEach((post) => {
        const likeIndex = post.likes.indexOf(user.id);

        if(likeIndex > -1 && post.user.toString() !== user.id) {
          post.likes.splice(likeIndex, 1);
          post.save();
        };
      });

      return res.send(user);
    }).catch(e => {
      return res.status(400).send(e);
    });
  }).catch(e => {
    return res.status(400).send(e);
  });
});
// updates email
Router.route('/users/update/email')
.patch(auth, (req, res) => {
  req.user.email = req.body.email;

  req.user.save().then((user) => {
    return res.send(user);
  }).catch(e => {
    return res.status(400).send(e);
  });
});
// updates bio
Router.route('/users/update/bio')
.patch(auth, (req, res) => {
  
  if(!req.body.bio) {
    req.body.bio = 'Bio';
  };

  req.user.bio = req.body.bio;

  req.user.save().then((user) => {
    return res.send(user);
  }).catch(e => {
    return res.status(400).send(e);
  });
});
// updates password
Router.route('/users/update/password')
.patch(auth, (req, res) => {

  if(req.body.password !== req.body.retypePassword) {
    return res.status(406).send();
  };

  req.user.comparePassword(req.body.oldPassword, (err, isMatch) => {
    if(isMatch) {
      req.user.password = req.body.password;
      req.user.save().then(() => {
        return res.send();
      });
    } else {
      return res.status(406).send();
    };
  });
});

// displays user info and user posts
Router.route('/users/:username/posts')
.get(checkAuth, (req, res) => {

  User.findOne({ username: req.params.username })
  .populate('posts').exec().then((user) => {
    if(!user) {
      return res.status(404).send();
    };

    let sameUser = null;

    if(req.user && req.user.id === user.id) {
      sameUser = true;
    } else {
      sameUser = false;
    };

    return res.send({user, posts: user.posts, sameUser});
  }).catch(e => {
    return res.status(400).send(e);
  });
});
// displays user info and user likes
Router.route('/users/:username/likes')
.get(checkAuth, (req, res) => {

  User.findOne({ username: req.params.username })
  .populate({ path: 'likes', populate: { path: 'user' }}).exec().then((user) => {
    if(!user) {
      return res.status(404).send();
    };

    let sameUser = null;

    if(req.user && req.user.id === user.id) {
      sameUser = true;
    } else {
      sameUser = false;
    };
    return res.send({user, likes: user.likes, sameUser});
  }).catch(e => {
    return res.status(400).send(e);
  });
});

module.exports = Router;
