const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  unitNumber: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    name: String,
    email: String,
    userId: mongoose.Schema.Types.ObjectId
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String
  }],
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0
  },
  ratingsCount: {
    type: Number,
    default: 1
  },
  ratingsTotal: {
    type: Number,
    default: 5
  },
  comments: [CommentSchema]
});

module.exports = mongoose.models.Note || mongoose.model('Note', NoteSchema);
