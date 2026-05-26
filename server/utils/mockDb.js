const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'db_users.json');
const subjectsFile = path.join(__dirname, '..', 'db_subjects.json');
const notesFile = path.join(__dirname, '..', 'db_notes.json');

const initFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

// Generate exactly 10 subjects per semester for 8 semesters
const defaultSubjects = [];
const profNames = [
  'Dr. Evelyn Carter', 'Prof. Marcus Vance', 'Dr. Sarah Lin', 'Prof. Alan Turing',
  'Dr. Nikola Tesla', 'Prof. Donald Knuth', 'Dr. Claude Shannon', 'Dr. Bjarne Stroustrup',
  'Prof. Rachel Carson', 'Dr. Grace Hopper', 'Dr. Edgar Codd', 'Prof. Linus Torvalds'
];

for (let sem = 1; sem <= 8; sem++) {
  for (let c = 1; c <= 10; c++) {
    defaultSubjects.push({
      id: `sub-s${sem}-${c}`,
      semester: sem,
      subjectName: `Semester ${sem} Course ${c}`,
      subjectCode: `SEM${sem}-C${c}`,
      professorName: profNames[(sem + c) % profNames.length]
    });
  }
}

const defaultNotes = [
  {
    id: 'note-1',
    title: 'Introduction to Course 1 Concepts',
    subject: 'Semester 1 Course 1',
    semester: 1,
    unitNumber: 1,
    description: 'Lecture overview summaries for Course 1, including baseline definitions and syllabus references.',
    fileUrl: '/uploads/sample_c_pointers.pdf',
    uploadedBy: { name: 'Dr. Evelyn Carter', email: 'carter@university.edu' },
    uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Intro', 'Core', 'Course1'],
    downloads: 12,
    rating: 4.8,
    comments: [
      { id: 'c1', user: 'David Kim', text: 'Very clear intro slides. Thanks!', date: new Date().toISOString() }
    ]
  },
  {
    id: 'note-2',
    title: 'Core Fundamentals of Course 2',
    subject: 'Semester 1 Course 2',
    semester: 1,
    unitNumber: 2,
    description: 'Unit 2 equations, problem sets, and key theorems summaries.',
    fileUrl: '/uploads/sample_physics.pdf',
    uploadedBy: { name: 'Prof. Marcus Vance', email: 'vance@university.edu' },
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Theorems', 'Formulas'],
    downloads: 8,
    rating: 4.6,
    comments: []
  },
  {
    id: 'note-3',
    title: 'Course 1 Advanced Logic and Graphs',
    subject: 'Semester 2 Course 1',
    semester: 2,
    unitNumber: 3,
    description: 'Complete syllabus guide covering graph traversals, recursively stacked parameters, and flow charts.',
    fileUrl: '/uploads/sample_data_structures.pdf',
    uploadedBy: { name: 'Prof. Donald Knuth', email: 'knuth@university.edu' },
    uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Graphs', 'Algorithms'],
    downloads: 27,
    rating: 4.9,
    comments: []
  }
];

initFile(usersFile, []);
initFile(subjectsFile, defaultSubjects);
initFile(notesFile, defaultNotes);

const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = {
  getUsers: () => readJSON(usersFile),
  saveUsers: (users) => writeJSON(usersFile, users),
  getSubjects: () => readJSON(subjectsFile),
  saveSubjects: (subjects) => writeJSON(subjectsFile, subjects),
  getNotes: () => readJSON(notesFile),
  saveNotes: (notes) => writeJSON(notesFile, notes)
};
