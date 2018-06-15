const { User } = require('../models');

const auth = (req, res, next) => {
  const token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    if(!user) {
      return Promise.reject();
    };

    req.user = user;
    req.token = token;
    return next();
  }).catch(e => {
    return res.status(401).send(e);
  });
};

const checkAuth = (req, res, next) => {
  const token = req.header('x-auth');

  if(!token) {
    return next();
  };

  User.findByToken(token).then((user) => {

    if(!user) {
      return next();
    };

    req.user = user;
    req.token = token;
    return next();
  }).catch(e => {
    return next();
  });
};

module.exports = {auth, checkAuth};
