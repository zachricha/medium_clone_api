const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  post: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  likes: [
    {
      type: String,
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
