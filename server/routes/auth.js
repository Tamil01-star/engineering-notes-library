const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/db');
const mockDb = require('../utils/mockDb');
const User = require('../models/User');
const Note = require('../models/Note');
const { protect, JWT_SECRET } = require('../middleware/auth');

const generateToken = (id, email) => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '30d' });
};

// Helper validation for Google mail IDs
const isValidGoogleMail = (email) => {
  const emailLower = email.toLowerCase().trim();
  return emailLower.endsWith('@gmail.com') || emailLower.endsWith('@googlemail.com') || emailLower.endsWith('@google.com');
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, semester, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  if (!isValidGoogleMail(email)) {
    return res.status(400).json({ message: 'Only Google Mail IDs (@gmail.com) are allowed for secure login.' });
  }

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ message: 'A student account is already registered with this Gmail.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id: 'user-' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        semester: Number(semester) || 1,
        department: department || 'Computer Science',
        profileImage: '',
        uploadedNotes: [],
        favorites: [],
        downloadHistory: [],
        badges: ['New Joiner'],
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      mockDb.saveUsers(users);

      return res.status(201).json({
        token: generateToken(newUser.id, newUser.email),
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          semester: newUser.semester,
          department: newUser.department,
          profileImage: newUser.profileImage,
          badges: newUser.badges
        }
      });
    } else {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ message: 'A student account is already registered with this Gmail.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        semester: Number(semester) || 1,
        department: department || 'Computer Science',
        badges: ['New Joiner']
      });

      return res.status(201).json({
        token: generateToken(user._id, user.email),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database onboarding failure' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter Gmail and password fields.' });
  }

  if (!isValidGoogleMail(email)) {
    return res.status(400).json({ message: 'Only Google Mail IDs (@gmail.com) are allowed for authentication.' });
  }

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials or Google account not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials or incorrect password.' });
      }

      return res.json({
        token: generateToken(user.id, user.email),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges || []
        }
      });
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials or Google account not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials or incorrect password.' });
      }

      return res.json({
        token: generateToken(user._id, user.email),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges || []
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server login error.' });
  }
});

// @route   POST /api/auth/google
router.post('/google', async (req, res) => {
  const { name, email, googleId, imageUrl } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Google Auth Token failure.' });
  }

  if (!isValidGoogleMail(email)) {
    return res.status(400).json({ message: 'Only standard Google Mail handles are authorized.' });
  }

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        user = {
          id: 'user-google-' + Date.now(),
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password: 'google-oauth-password-hashed-placeholder',
          semester: 1,
          department: 'Computer Science',
          profileImage: imageUrl || '',
          uploadedNotes: [],
          favorites: [],
          downloadHistory: [],
          badges: ['Explorer', 'Google Signed'],
          createdAt: new Date().toISOString()
        };
        users.push(user);
        mockDb.saveUsers(users);
      }

      return res.json({
        token: generateToken(user.id, user.email),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges || []
        }
      });
    } else {
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        user = await User.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password: 'google-oauth-password-hashed-placeholder',
          profileImage: imageUrl || '',
          badges: ['Explorer', 'Google Signed']
        });
      }

      return res.json({
        token: generateToken(user._id, user.email),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges || []
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google sign-in error.' });
  }
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      const user = users.find(u => u.id === req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const notes = mockDb.getNotes();
      const uploadedNotesData = notes.filter(n => n.uploadedBy && (n.uploadedBy.userId === user.id || n.uploadedBy.email === user.email));
      const favoritesData = notes.filter(n => user.favorites && user.favorites.includes(n.id));
      const downloadHistoryData = notes.filter(n => user.downloadHistory && user.downloadHistory.includes(n.id));

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        semester: user.semester,
        department: user.department,
        profileImage: user.profileImage,
        badges: user.badges || [],
        uploadedNotes: uploadedNotesData,
        favorites: favoritesData,
        downloadHistory: downloadHistoryData
      });
    } else {
      const user = await User.findById(req.user.id)
        .populate('uploadedNotes')
        .populate('favorites')
        .populate('downloadHistory');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        semester: user.semester,
        department: user.department,
        profileImage: user.profileImage,
        badges: user.badges || [],
        uploadedNotes: user.uploadedNotes,
        favorites: user.favorites,
        downloadHistory: user.downloadHistory
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Profile failed to load.' });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  const { name, semester, department, profileImage } = req.body;

  try {
    const isFallback = dbConfig.isFallback();

    if (isFallback) {
      const users = mockDb.getUsers();
      const index = users.findIndex(u => u.id === req.user.id);

      if (index === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (name) users[index].name = name;
      if (semester) users[index].semester = Number(semester);
      if (department) users[index].department = department;
      if (profileImage !== undefined) users[index].profileImage = profileImage;

      if (users[index].uploadedNotes && users[index].uploadedNotes.length >= 3 && !users[index].badges.includes('Scholar Upload Master')) {
        users[index].badges.push('Scholar Upload Master');
      }

      mockDb.saveUsers(users);

      return res.json({
        message: 'Profile updated',
        user: {
          id: users[index].id,
          name: users[index].name,
          email: users[index].email,
          semester: users[index].semester,
          department: users[index].department,
          profileImage: users[index].profileImage,
          badges: users[index].badges
        }
      });
    } else {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (name) user.name = name;
      if (semester) user.semester = Number(semester);
      if (department) user.department = department;
      if (profileImage !== undefined) user.profileImage = profileImage;

      if (user.uploadedNotes.length >= 3 && !user.badges.includes('Scholar Upload Master')) {
        user.badges.push('Scholar Upload Master');
      }

      await user.save();

      return res.json({
        message: 'Profile updated',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          semester: user.semester,
          department: user.department,
          profileImage: user.profileImage,
          badges: user.badges
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
