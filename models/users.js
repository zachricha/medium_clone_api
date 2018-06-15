const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email',
    }
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  bio: {
    type: String,
    default: 'Bio',
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    }
  ],
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  }]
});

userSchema.methods.toJSON = function() {
  const user = this;
  return {_id: user.id, fullName: user.fullName, email: user.email, username: user.username, bio: user.bio};
};

userSchema.methods.createToken = function() {
  const user = this;
  const access = 'auth';
  const token = jwt.sign({_id: user._id, access}, process.env.JWT_SECRET).toString();
  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

userSchema.methods.removeToken = function(token) {
  const user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

userSchema.methods.comparePassword = function(candidatePassword, next) {
  return bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if(err) {
      return next(err);
    }
    return next(null, isMatch);
  });
};

userSchema.statics.findByToken = function(token) {
  const user = this;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return user.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth',
  });
};

userSchema.statics.findByCredentials = function(email, password) {
  const user = this;

  return user.findOne({ email }).then((user) => {
    if(!user) {
      return Promise.reject();
    };

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if(res) {
          resolve(user);
        } else {
          reject();
        };
      });
    });
  });
};

userSchema.pre('save', function(next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  };

  return bcrypt
    .hash(user.password, 10)
    .then(hashedPassword => {
      user.password = hashedPassword;
      return next();
    }, (e) => {
      return next(e);
    });
});

const User = mongoose.model('User', userSchema);

module.exports = User;
