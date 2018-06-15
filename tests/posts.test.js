const expect = require('chai').expect;
const request = require('supertest');
const {ObjectID} = require('mongodb');

const app = require('../app');
const { User, Post } = require('../models');
const { posts, populatePosts, users, populateUsers } = require('./seed/seed');

beforeEach(populatePosts);
beforeEach(populateUsers);

describe('GET /posts/:id', () => {

  it('should get a post by id logged in as the user who posted', (done) => {

    request(app)
      .get(`/posts/${posts[0]._id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.post.header).to.equal(posts[0].header);
        expect(res.body.post.post).to.equal(posts[0].post);
        expect(res.body.loggedIn).to.equal(true);
        expect(res.body.usersPost).to.equal(true);
      })
      .end(done);
  });

  it('should get a post by id logged in not as the user who posted', (done) => {

    request(app)
      .get(`/posts/${posts[0]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.post.header).to.equal(posts[0].header);
        expect(res.body.post.post).to.equal(posts[0].post);
        expect(res.body.loggedIn).to.equal(true);
        expect(res.body.usersPost).to.equal(false);
      })
      .end(done);
  });

  it('should get a post by id without being logged in', (done) => {

    request(app)
      .get(`/posts/${posts[0]._id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.post.header).to.equal(posts[0].header);
        expect(res.body.post.post).to.equal(posts[0].post);
        expect(res.body.loggedIn).to.equal(false);
        expect(res.body.usersPost).to.equal(false);
      })
      .end(done);
  });

  it('should return 404 if post not found', (done) => {
    const id = new ObjectID();

    request(app)
      .get(`/posts/${id}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get('/posts/123')
      .expect(404)
      .end(done);
  });
});

describe('PATCH /posts/:id', () => {

  it('should edit a post', (done) => {
    const header = 'this is the header';
    const post = 'this is the post';

    request(app)
      .patch(`/posts/${posts[0]._id}`)
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
        };

        Post.findById(posts[0]._id).then((testPost) => {
          expect(testPost.header).to.equal(header);
          expect(testPost.post).to.equal(post);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not edit a post of a different user', (done) => {
    const header = 'test header';
    const post = 'test post';

    request(app)
      .patch(`/posts/${posts[0]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({header, post})
      .expect(401)
      .expect((res) => {
        expect(res.body.header).to.not.equal(header);
        expect(res.body.post).to.not.equal(post);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.findById(posts[0]._id).then((testPost) => {
          expect(testPost.header).to.not.equal(header);
          expect(testPost.post).to.not.equal(post);
          done();
        }).catch(e => done(e));
      });
  });

  it('should return 404 if post not found', (done) => {
    const id = new ObjectID();

    request(app)
      .patch(`/posts/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .patch('/posts/123')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /posts/:id', () => {

  it('should delete a post', (done) => {

    request(app)
      .delete(`/posts/${posts[0]._id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.header).to.equal(posts[0].header);
        expect(res.body.post).to.equal(posts[0].post);
      })
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.findById(posts[0]._id).then((testPost) => {
          expect(testPost).to.not.exist;
          done();
        }).catch(e => done(e));
      });
  });

  it('should not delete a post of a different user', (done) => {

    request(app)
      .patch(`/posts/${posts[0]._id}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(401)
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.findById(posts[0]._id).then((testPost) => {
          expect(testPost).to.exist;
          done();
        }).catch(e => done(e));
      });
  });

  it('should return 404 if post not found', (done) => {
    const id = new ObjectID();

    request(app)
      .delete(`/posts/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .delete('/posts/123')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('POST /posts/:id/like', () => {

  it('should like a post', (done) => {

    request(app)
      .post(`/posts/${posts[0]._id}/like`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.findById(posts[0]._id).then((post) => {
          expect(post.likes).to.include(users[1]._id);

          User.findById(users[1]._id).then((user) => {
            expect(user.likes).to.include(post.id);
            done();
          }).catch(e => done(e));
        }).catch(e => done(e));
      });
  });

  it('should unlike a post', (done) => {

    request(app)
      .post(`/posts/${posts[0]._id}/like`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        };

        Post.findById(posts[0]._id).then((post) => {
          expect(post.likes).to.not.include(users[0]._id);

          User.findById(users[0]._id).then((user) => {
            expect(user.likes).to.not.include(post.id);
            done();
          }).catch(e => done(e));
        }).catch(e => done(e));
      });
  });

  it('should return 404 if post not found', (done) => {
    const id = new ObjectID();

    request(app)
      .post(`/posts/${id}/like`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .post('/posts/123/like')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});
