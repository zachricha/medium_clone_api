const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const { User, Post } = require('../../models');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const userThreeId = new ObjectID();
const postOneId = new ObjectID();
const postTwoId = new ObjectID();

const users = [{
  _id: userOneId,
  fullName: 'example1 example',
  email: 'example@example.com',
  username: 'example1',
  password: 'password',
  posts: [postOneId],
  likes: [postOneId],
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString(),
  }]
}, {
  _id: userTwoId,
  fullName: 'example2 example',
  email: 'example2@example.com',
  username: 'example2',
  password: 'password',
  posts: [postTwoId],
  likes: [postTwoId],
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString(),
  }]
}, {
  _id: userThreeId,
  fullName: 'example3 example',
  email: 'example3@example.com',
  username: 'example3',
  password: 'password',
}];

const posts = [{
  _id: postOneId,
  header: 'example header1',
  post: 'example post1',
  likes: [userOneId],
  user: userOneId,
}, {
  _id: postTwoId,
  header: 'example header2',
  post: 'example post2',
  likes: [userTwoId],
  user: userTwoId,
}];

const populatePosts = (done) => {
  Post.remove({}).then(() => {
    return Post.insertMany(posts);
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(users[0]).save();
    const userTwo = new User(users[1]).save();
    const userThree = new User(users[2]).save();

    return Promise.all([userOne, userTwo, userThree]);
  }).then(() => done());
};

module.exports = {posts, populatePosts, users, populateUsers};
