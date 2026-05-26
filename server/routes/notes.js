const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/db');
const mockDb = require('../utils/mockDb');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, PPT, and Images are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// @route   POST /api/notes/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please select a document file' });
  }

  const { title, subject, semester, unitNumber, description, tags } = req.body;

  if (!title || !subject || !semester || !unitNumber) {
    fs.unlinkSync(req.file.path); // remove file if validation fails
    return res.status(400).json({ message: 'Please enter all details' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

  try {
    const isFallback = dbConfig.isFallback();

    const cleanSubject = subject.trim();

    if (isFallback) {
      // Auto-create subject card if it doesn't exist for this semester in db_subjects.json
      const subjects = mockDb.getSubjects();
      const subjectExists = subjects.some(s => s.semester === Number(semester) && s.subjectName.toLowerCase() === cleanSubject.toLowerCase());
      if (!subjectExists) {
        const cleanCode = cleanSubject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB';
        const newSubject = {
          id: 'sub-' + Date.now(),
          semester: Number(semester),
          subjectName: cleanSubject,
          subjectCode: `${cleanCode}-${Math.floor(100 + Math.random() * 900)}`,
          professorName: 'Department Panel'
        };
        subjects.push(newSubject);
        mockDb.saveSubjects(subjects);
      }

      const users = mockDb.getUsers();
      const userIndex = users.findIndex(u => u.id === req.user.id);
      
      const newNote = {
        id: 'note-' + Date.now(),
        title,
        subject: cleanSubject,
        semester: Number(semester),
        unitNumber: Number(unitNumber),
        description: description || '',
        fileUrl,
        uploadedBy: {
          name: users[userIndex]?.name || req.user.email.split('@')[0],
          email: req.user.email,
          userId: req.user.id
        },
        uploadDate: new Date().toISOString(),
        tags: parsedTags,
        downloads: 0,
        rating: 5.0,
        ratingsCount: 1,
        ratingsTotal: 5,
        comments: []
      };

      const notes = mockDb.getNotes();
      notes.push(newNote);
      mockDb.saveNotes(notes);

      if (userIndex !== -1) {
        if (!users[userIndex].uploadedNotes) users[userIndex].uploadedNotes = [];
        users[userIndex].uploadedNotes.push(newNote.id);
        mockDb.saveUsers(users);
      }

      return res.status(201).json(newNote);
    } else {
      // Check MongoDB Subject collection
      const Subject = require('../models/Subject');
      const subjectExists = await Subject.findOne({ semester: Number(semester), subjectName: { $regex: new RegExp('^' + cleanSubject + '$', 'i') } });
      if (!subjectExists) {
        const cleanCode = cleanSubject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB';
        await Subject.create({
          semester: Number(semester),
          subjectName: cleanSubject,
          subjectCode: `${cleanCode}-${Math.floor(100 + Math.random() * 900)}`,
          professorName: 'Department Panel'
        });
      }

      const note = await Note.create({
        title,
        subject: cleanSubject,
        semester: Number(semester),
        unitNumber: Number(unitNumber),
        description: description || '',
        fileUrl,
        uploadedBy: {
          name: req.user.name || req.user.email.split('@')[0],
          email: req.user.email,
          userId: req.user.id
        },
        tags: parsedTags
      });

      await User.findByIdAndUpdate(req.user.id, {
        $push: { uploadedNotes: note._id }
      });

      return res.status(201).json(note);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database file index failure.' });
  }
});

// @route   GET /api/notes
router.get('/', async (req, res) => {
  const { search, semester, subject, tag } = req.query;

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      let notes = mockDb.getNotes();

      if (semester) {
        notes = notes.filter(n => n.semester === Number(semester));
      }
      if (subject) {
        notes = notes.filter(n => n.subject.toLowerCase() === subject.toLowerCase());
      }
      if (tag) {
        notes = notes.filter(n => n.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
      }
      if (search) {
        const query = search.toLowerCase();
        notes = notes.filter(n => 
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          n.subject.toLowerCase().includes(query) ||
          n.tags.some(t => t.toLowerCase().includes(query))
        );
      }

      notes.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      return res.json(notes);
    } else {
      let query = {};

      if (semester) {
        query.semester = Number(semester);
      }
      if (subject) {
        query.subject = { $regex: new RegExp('^' + subject + '$', 'i') };
      }
      if (tag) {
        query.tags = { $regex: new RegExp('^' + tag + '$', 'i') };
      }
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { subject: searchRegex },
          { tags: searchRegex }
        ];
      }

      const notes = await Note.find(query).sort({ uploadDate: -1 });
      return res.json(notes);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving notes list.' });
  }
});

// @route   GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const notes = mockDb.getNotes();
      const note = notes.find(n => n.id === req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.json(note);
    } else {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.json(note);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving note.' });
  }
});

// @route   POST /api/notes/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const notes = mockDb.getNotes();
      const noteIndex = notes.findIndex(n => n.id === req.params.id);
      if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

      const users = mockDb.getUsers();
      const userObj = users.find(u => u.id === req.user.id);
      const userName = userObj ? userObj.name : req.user.email.split('@')[0];

      const newComment = {
        id: 'comment-' + Date.now(),
        user: userName,
        text,
        date: new Date().toISOString()
      };

      notes[noteIndex].comments.push(newComment);
      mockDb.saveNotes(notes);

      return res.status(201).json(newComment);
    } else {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });

      const userObj = await User.findById(req.user.id);
      const userName = userObj ? userObj.name : req.user.email.split('@')[0];

      const comment = {
        user: userName,
        text,
        date: new Date()
      };

      note.comments.push(comment);
      await note.save();

      return res.status(201).json(note.comments[note.comments.length - 1]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// @route   POST /api/notes/:id/rate
router.post('/:id/rate', protect, async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating stars (1-5).' });
  }

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const notes = mockDb.getNotes();
      const noteIndex = notes.findIndex(n => n.id === req.params.id);
      if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

      const note = notes[noteIndex];
      note.ratingsCount = (note.ratingsCount || 0) + 1;
      note.ratingsTotal = (note.ratingsTotal || 0) + Number(rating);
      note.rating = parseFloat((note.ratingsTotal / note.ratingsCount).toFixed(1));

      mockDb.saveNotes(notes);
      return res.json({ rating: note.rating, ratingsCount: note.ratingsCount });
    } else {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });

      note.ratingsCount += 1;
      note.ratingsTotal += Number(rating);
      note.rating = parseFloat((note.ratingsTotal / note.ratingsCount).toFixed(1));

      await note.save();
      return res.json({ rating: note.rating, ratingsCount: note.ratingsCount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Rating failure' });
  }
});

// @route   POST /api/notes/:id/download
router.post('/:id/download', protect, async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const notes = mockDb.getNotes();
      const noteIndex = notes.findIndex(n => n.id === req.params.id);
      if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

      notes[noteIndex].downloads = (notes[noteIndex].downloads || 0) + 1;
      mockDb.saveNotes(notes);

      const users = mockDb.getUsers();
      const userIndex = users.findIndex(u => u.id === req.user.id);
      if (userIndex !== -1) {
        if (!users[userIndex].downloadHistory) users[userIndex].downloadHistory = [];
        if (!users[userIndex].downloadHistory.includes(req.params.id)) {
          users[userIndex].downloadHistory.push(req.params.id);
        }
        if (users[userIndex].downloadHistory.length === 1 && !users[userIndex].badges.includes('Knowledge Seeker')) {
          users[userIndex].badges.push('Knowledge Seeker');
        }
        mockDb.saveUsers(users);
      }

      return res.json({ downloads: notes[noteIndex].downloads });
    } else {
      const note = await Note.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
      if (!note) return res.status(404).json({ message: 'Note not found' });

      const user = await User.findById(req.user.id);
      if (user) {
        if (!user.downloadHistory.includes(note._id)) {
          user.downloadHistory.push(note._id);
        }
        if (user.downloadHistory.length === 1 && !user.badges.includes('Knowledge Seeker')) {
          user.badges.push('Knowledge Seeker');
        }
        await user.save();
      }

      return res.json({ downloads: note.downloads });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Download tracker error' });
  }
});

// @route   POST /api/notes/:id/favorite
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      const userIndex = users.findIndex(u => u.id === req.user.id);
      if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

      if (!users[userIndex].favorites) users[userIndex].favorites = [];
      const favIndex = users[userIndex].favorites.indexOf(req.params.id);

      let favorited = false;
      if (favIndex === -1) {
        users[userIndex].favorites.push(req.params.id);
        favorited = true;
      } else {
        users[userIndex].favorites.splice(favIndex, 1);
      }

      if (users[userIndex].favorites.length >= 1 && !users[userIndex].badges.includes('Book Archivist')) {
        users[userIndex].badges.push('Book Archivist');
      }

      mockDb.saveUsers(users);
      return res.json({ favorited, favoritesCount: users[userIndex].favorites.length });
    } else {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const noteId = req.params.id;
      const favIndex = user.favorites.indexOf(noteId);

      let favorited = false;
      if (favIndex === -1) {
        user.favorites.push(noteId);
        favorited = true;
      } else {
        user.favorites.pull(noteId);
      }

      if (user.favorites.length >= 1 && !user.badges.includes('Book Archivist')) {
        user.badges.push('Book Archivist');
      }

      await user.save();
      return res.json({ favorited, favoritesCount: user.favorites.length });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Bookmark tracker error' });
  }
});

// @route   DELETE /api/notes/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const notes = mockDb.getNotes();
      const noteIndex = notes.findIndex(n => n.id === req.params.id);
      if (noteIndex === -1) return res.status(404).json({ message: 'Note not found' });

      const note = notes[noteIndex];
      if (note.uploadedBy.userId !== req.user.id && req.user.email !== 'admin@notes.edu') {
        return res.status(401).json({ message: 'Unauthorized removal' });
      }

      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }

      notes.splice(noteIndex, 1);
      mockDb.saveNotes(notes);

      const users = mockDb.getUsers();
      users.forEach(u => {
        if (u.uploadedNotes) u.uploadedNotes = u.uploadedNotes.filter(nid => nid !== req.params.id);
        if (u.favorites) u.favorites = u.favorites.filter(nid => nid !== req.params.id);
        if (u.downloadHistory) u.downloadHistory = u.downloadHistory.filter(nid => nid !== req.params.id);
      });
      mockDb.saveUsers(users);

      return res.json({ message: 'Removed note' });
    } else {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });

      if (note.uploadedBy.userId?.toString() !== req.user.id && req.user.email !== 'admin@notes.edu') {
        return res.status(401).json({ message: 'Unauthorized removal' });
      }

      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }

      await Note.findByIdAndDelete(req.params.id);
      await User.updateMany({}, {
        $pull: { uploadedNotes: req.params.id, favorites: req.params.id, downloadHistory: req.params.id }
      });

      return res.json({ message: 'Removed note' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

module.exports = router;
