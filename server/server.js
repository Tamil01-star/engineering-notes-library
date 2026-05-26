const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { connectDB, isFallback } = require('./config/db');
const mockDb = require('./utils/mockDb');
const Subject = require('./models/Subject');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Connect database and seed subjects if MongoDB is empty
connectDB().then(async () => {
  if (!isFallback()) {
    try {
      const subjectCount = await Subject.countDocuments({});
      if (subjectCount === 0) {
        console.log('🌱 Seeding 80 course modules into MongoDB...');
        const subjects = mockDb.getSubjects();
        const subjectsToSeed = subjects.map(({ id, ...rest }) => rest);
        await Subject.insertMany(subjectsToSeed);
        console.log('✅ 80 Course modules seeded successfully.');
      }
    } catch (err) {
      console.error('❌ Failed to seed subjects:', err.message);
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    fallbackMode: isFallback(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, req, res, next) => {
  console.error('🚨 Express Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Academic server running on port http://localhost:${PORT}`);
  console.log(`📂 Uploads directory served at http://localhost:${PORT}/uploads/`);
});
