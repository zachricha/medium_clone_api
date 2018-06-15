const expect = require('chai').expect;
const request = require('supertest');
const {ObjectID} = require('mongodb');

const app = require('../app');
const { User, Post } = require('../models');
const { posts, populatePosts, users, populateUsers } = require('./seed/seed');

beforeEach(populatePosts);
beforeEach(populateUsers);

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).to.equal(users[0]._id.toString());
        expect(res.body.email).to.equal(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body._id).to.not.exist;
      })
      .end(done);
  });
});

describe('POST /users/post', () => {

  it('should create a post', (done) => {
    const header = 'header';
    const post = 'post';

    request(app)
      .post('/users/post')
      .set('x-auth', users[0].tokens[0].token)
      .send({header, post})
      .expect(200)
      .expect((res) => {
        expect(res.body.header).to.equal(header);
        expect(res.body.post).to.equal(post);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        }

        Post.findOne({header}).then((testPost) => {
          expect(testPost.header).to.equal(header);
          expect(testPost.post).to.equal(post);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create a post with invalid body data', (done) => {
    request(app)
      .post('/users/post')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.find().then((posts) => {
          expect(posts.length).to.equal(2);
          done();
        }).catch(e => done(e));
      });
  });
});

describe('DELETE /users/delete', () => {

  it('should delete a user', (done) => {

    request(app)
      .delete('/users/delete')
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).to.equal(users[1].id);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        User.findById(users[1]._id).then((user) => {
          expect(user).to.be.null;
          done();
        }).catch(e => done(e));
      });
  });
});

describe('PATCH /users/update/email', () => {
  it('should update a users email', (done) => {
    const email = 'testing@testing.com';

    request(app)
      .patch('/users/update/email')
      .set('x-auth', users[0].tokens[0].token)
      .send({email})
      .expect(200)
      .expect((res) => {
        expect(res.body.email).to.equal(email);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        User.findById(users[0]._id).then((user) => {
          expect(user.email).to.equal(email);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not update a users email with invalid email', (done) => {
    const email = 'notanemail';

    request(app)
      .patch('/users/update/email')
      .set('x-auth', users[0].tokens[0].token)
      .send({email})
      .expect(400)
      .end((err, res) => {
        if(err) {
          done(err);
        };

        User.findById(users[0]._id).then((user) => {
          expect(user.email).to.not.equal(email);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not update a users email with email already in use', (done) => {
    const email = 'example2@example.com';

    request(app)
      .patch('/users/update/email')
      .set('x-auth', users[0].tokens[0].token)
      .send({email})
      .expect(400)
      .end((err, res) => {
        if(err) {
          done(err);
        };

        User.findById(users[0]._id).then((user) => {
          expect(user.email).to.not.equal(email);
          done();
        }).catch(e => done(e));
      });
  });
});

describe('PATCH /users/update/bio', () => {

  it('should update a users bio', (done) => {
    const bio = 'this is the bio';

    request(app)
      .patch('/users/update/bio')
      .set('x-auth', users[0].tokens[0].token)
      .send({bio})
      .expect(200)
      .expect((res) => {
        expect(res.body.bio).to.equal(bio);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        User.findById(users[0]._id).then((user) => {
          expect(user.bio).to.equal(bio);
          done();
        }).catch(e => done(e));
      });
  });
});

describe('PATCH /users/update/password', () => {

  it('should update a users password', (done) => {
    const password = '123456';
    const retypePassword = '123456';
    const oldPassword = 'password';

    request(app)
      .patch('/users/update/password')
      .set('x-auth', users[0].tokens[0].token)
      .send({password, retypePassword, oldPassword})
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        User.findById(users[0]._id).then((user) => {
          expect(user.password).to.not.equal(password);
          expect(user.password).to.not.equal(oldPassword);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not update password when passwords do not match', (done) => {
    const password = '123456';
    const retypePassword = '1234567';
    const oldPassword = 'password';

    request(app)
      .patch('/users/update/password')
      .set('x-auth', users[0].tokens[0].token)
      .send({password, retypePassword, oldPassword})
      .expect(406)
      .end(done);
  });

  it('should not update password when oldPassword is incorrect', (done) => {
    const password = '123456';
    const retypePassword = '123456';
    const oldPassword = 'password1';

    request(app)
      .patch('/users/update/password')
      .set('x-auth', users[0].tokens[0].token)
      .send({password, retypePassword, oldPassword})
      .expect(406)
      .end(done);
  });
});

describe('GET /users/:username/posts', () => {
  it('should get a users info and posts of same user', (done) => {

    request(app)
      .get(`/users/${users[0].username}/posts`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).to.equal(users[0].email);
        expect(res.body.posts[0].user).to.equal(users[0]._id.toString());
        expect(res.body.sameUser).to.equal(true);
      })
      .end(done);
  });

  it('should get a users info and posts of a different user', (done) => {

    request(app)
      .get(`/users/${users[1].username}/posts`)
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).to.equal(users[1].email);
        expect(res.body.posts[0].user).to.equal(users[1]._id.toString());
        expect(res.body.sameUser).to.equal(false);
      })
      .end(done);
  });

  it('should return 404 if user not found', (done) => {

    request(app)
      .get('/users/notauser/posts')
      .expect(404)
      .end(done);
    });
});

describe('GET /users/:username/likes', () => {
  it('should get a users info and likes of same user', (done) => {

    request(app)
      .get(`/users/${users[0].username}/likes`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).to.equal(users[0].email);
        expect(res.body.likes[0].user._id).to.equal(users[0]._id.toString());
        expect(res.body.sameUser).to.equal(true);
      })
      .end(done);
  });

  it('should get a users info and likes of a different user', (done) => {

    request(app)
      .get(`/users/${users[1].username}/likes`)
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).to.equal(users[1].email);
        expect(res.body.likes[0].user._id).to.equal(users[1]._id.toString());
        expect(res.body.sameUser).to.equal(false);
      })
      .end(done);
  });

  it('should return 404 if user not found', (done) => {

    request(app)
      .get('/users/notauser/likes')
      .expect(404)
      .end(done);
  });
});
