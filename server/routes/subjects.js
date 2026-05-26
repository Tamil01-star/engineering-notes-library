const express = require('express');
const router = express.Router();
const dbConfig = require('../config/db');
const mockDb = require('../utils/mockDb');
const Subject = require('../models/Subject');

// @route   GET /api/subjects
router.get('/', async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();
    if (isFallback) {
      const subjects = mockDb.getSubjects();
      return res.json(subjects);
    } else {
      const subjects = await Subject.find({});
      return res.json(subjects);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving subjects' });
  }
});

// @route   GET /api/subjects/semester/:sem
router.get('/semester/:sem', async (req, res) => {
  const sem = Number(req.params.sem);
  
  if (isNaN(sem) || sem < 1 || (sem > 8 && sem !== 9)) {
    return res.status(400).json({ message: 'Invalid semester index (1-8, or 9 for Govt Exams)' });
  }

  try {
    const isFallback = dbConfig.isFallback();
    if (isFallback) {
      const subjects = mockDb.getSubjects();
      const filtered = subjects.filter(sub => sub.semester === sem);
      return res.json(filtered);
    } else {
      const subjects = await Subject.find({ semester: sem });
      return res.json(subjects);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving semester subjects' });
  }
});

// @route   POST /api/subjects
router.post('/', async (req, res) => {
  const { semester, subjectName, subjectCode, professorName } = req.body;

  if (!semester || !subjectName || !subjectCode) {
    return res.status(400).json({ message: 'Please provide all details' });
  }

  try {
    const isFallback = dbConfig.isFallback();
    if (isFallback) {
      const subjects = mockDb.getSubjects();
      
      if (subjects.find(s => s.subjectCode.toLowerCase() === subjectCode.toLowerCase())) {
        return res.status(400).json({ message: 'Subject code exists' });
      }

      const newSub = {
        id: 'sub-' + Date.now(),
        semester: Number(semester),
        subjectName,
        subjectCode: subjectCode.toUpperCase(),
        professorName: professorName || 'Dept. Panel'
      };

      subjects.push(newSub);
      mockDb.saveSubjects(subjects);

      return res.status(201).json(newSub);
    } else {
      const subExists = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
      if (subExists) {
        return res.status(400).json({ message: 'Subject code exists' });
      }

      const subject = await Subject.create({
        semester: Number(semester),
        subjectName,
        subjectCode: subjectCode.toUpperCase(),
        professorName: professorName || 'Dept. Panel'
      });

      return res.status(201).json(subject);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

module.exports = router;
