const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true
  },
  professorName: {
    type: String,
    default: 'Associate Professor'
  }
});

module.exports = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
