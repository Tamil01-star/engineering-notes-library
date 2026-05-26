const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    default: 1
  },
  department: {
    type: String,
    default: 'Computer Science'
  },
  profileImage: {
    type: String,
    default: ''
  },
  uploadedNotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  badges: [{
    type: String
  }],
  downloadHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
