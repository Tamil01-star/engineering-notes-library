const express = require('express');
const router = express.Router();
const dbConfig = require('../config/db');
const mockDb = require('../utils/mockDb');
const Note = require('../models/Note');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

// @route   GET /api/admin/analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    let totalNotes = 0;
    let totalDownloads = 0;
    let activeStudents = 0;
    let subjectsCount = 0;
    let popularNotes = [];
    let uploadStatsBySemester = [0, 0, 0, 0, 0, 0, 0, 0];
    let studentActivity = [];

    if (isFallback) {
      const notes = mockDb.getNotes();
      const users = mockDb.getUsers();
      const subjects = mockDb.getSubjects();

      totalNotes = notes.length;
      totalDownloads = notes.reduce((acc, note) => acc + (note.downloads || 0), 0);
      activeStudents = users.length + 12;
      subjectsCount = subjects.length;

      popularNotes = [...notes]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5)
        .map(n => ({
          title: n.title,
          downloads: n.downloads,
          subject: n.subject,
          rating: n.rating
        }));

      notes.forEach(n => {
        if (n.semester >= 1 && n.semester <= 8) {
          uploadStatsBySemester[n.semester - 1]++;
        }
      });

      studentActivity = users.map(u => ({
        name: u.name,
        email: u.email,
        semester: u.semester,
        uploads: u.uploadedNotes ? u.uploadedNotes.length : 0,
        joined: u.createdAt || new Date().toISOString()
      })).slice(0, 6);

      if (studentActivity.length === 0) {
        studentActivity = [
          { name: 'Elena Rostova', email: 'elena@gmail.com', semester: 3, uploads: 4, joined: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
          { name: 'Alex Rivera', email: 'rivera@gmail.com', semester: 5, uploads: 8, joined: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
          { name: 'David Kim', email: 'kim@gmail.com', semester: 2, uploads: 2, joined: new Date(Date.now() - 7*24*60*60*1000).toISOString() }
        ];
      }
    } else {
      totalNotes = await Note.countDocuments({});
      const downloadAgg = await Note.aggregate([
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]);
      totalDownloads = downloadAgg[0] ? downloadAgg[0].total : 0;
      activeStudents = await User.countDocuments({}) + 12;
      subjectsCount = await Subject.countDocuments({});

      const dbPopular = await Note.find({}).sort({ downloads: -1 }).limit(5);
      popularNotes = dbPopular.map(n => ({
        title: n.title,
        downloads: n.downloads,
        subject: n.subject,
        rating: n.rating
      }));

      for (let i = 1; i <= 8; i++) {
        uploadStatsBySemester[i - 1] = await Note.countDocuments({ semester: i });
      }

      const dbUsers = await User.find({}).sort({ createdAt: -1 }).limit(6);
      studentActivity = dbUsers.map(u => ({
        name: u.name,
        email: u.email,
        semester: u.semester,
        uploads: u.uploadedNotes.length,
        joined: u.createdAt
      }));
    }

    return res.json({
      summary: {
        totalNotes,
        totalDownloads,
        activeStudents,
        subjectsCount,
        semestersCount: 8
      },
      charts: {
        uploadsBySemester: uploadStatsBySemester,
        popularNotes
      },
      recentActivity: studentActivity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error compiling admin metrics.' });
  }
});

module.exports = router;
