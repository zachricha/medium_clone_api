const expect = require('chai').expect;
const request = require('supertest');
const {ObjectID} = require('mongodb');

const app = require('../app');
const { User, Post } = require('../models');
const { posts, populatePosts, users, populateUsers } = require('./seed/seed');

beforeEach(populatePosts);
beforeEach(populateUsers);

describe('POST /signup', () => {

  it('should create a user', (done) => {
    const email = 'example4@example.com';
    const obj = {
      fullName: 'example4 example',
      email: email,
      username: 'example4',
      password: '123456'
    }

    request(app)
      .post('/signup')
      .send(obj)
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).to.exist;
        expect(res.body._id).to.exist;
        expect(res.body.email).to.equal(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).to.exist;
          expect(user.password).to.not.equal(obj.password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {

    request(app)
      .post('/signup')
      .send({
        email: 'example',
        password: '123',
        username: 'example',
        fullName: 'example example'
      })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {

    request(app)
      .post('/signup')
      .send({
        email: users[0].email,
        password: '123456',
        fullName: 'test testing',
        username: 'test1'
      })
      .expect(400)
      .end(done);
  });

  it('should not create user if username in use', (done) => {

    request(app)
      .post('/signup')
      .send({
        email: 'testing1@testing.com',
        password: '123456',
        username: users[0].username,
        fullName: 'test testing',
      })
      .expect(400)
      .end(done);
  });
});

describe('POST /login', () => {

  it('should login user and return auth token', (done) => {

    request(app)
      .post('/login')
      .send({
        email: users[2].email,
        password: users[2].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).to.exist;
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[2]._id).then((user) => {
          expect(user.tokens[0]).to.include({
            access: 'auth',
            token: res.header['x-auth'],
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {

    request(app)
      .post('/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).to.not.exist;
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).to.equal(1);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('DELETE /logout', () => {
  
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/logout')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).to.equal(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
