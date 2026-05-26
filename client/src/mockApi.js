// Mock API Layer for client-only deployment on Vercel
// This file intercepts all '/api/*' requests and handles them using localStorage/session memory.

const PROF_NAMES = [
  'Dr. Evelyn Carter', 'Prof. Marcus Vance', 'Dr. Sarah Lin', 'Prof. Alan Turing',
  'Dr. Nikola Tesla', 'Prof. Donald Knuth', 'Dr. Claude Shannon', 'Dr. Bjarne Stroustrup',
  'Prof. Rachel Carson', 'Dr. Grace Hopper', 'Dr. Edgar Codd', 'Prof. Linus Torvalds'
];


// All subjects start empty — users create their own course names
const defaultSubjects = [];

// Initialize default notes — empty, users create their own
const defaultNotes = [];

// ── One-time Migration: wipe legacy pre-seeded course data ───────────────────
// If localStorage still has the old 80-entry auto-generated subjects, clear them.
const DB_VERSION = '3';
if (localStorage.getItem('notes_db_version') !== DB_VERSION) {
  try {
    const storedSubs = JSON.parse(localStorage.getItem('notes_subjects') || '[]');
    // Legacy data had subjects named "Semester N Course N" or GATE/TNPSC default
    const hasLegacy = storedSubs.some(s => /^Semester \d+ Course \d+$/.test(s.subjectName) || s.id?.startsWith('sub-s'));
    if (hasLegacy) {
      localStorage.removeItem('notes_subjects');
      localStorage.removeItem('notes_notes');
      console.info('[MockDB] Cleared legacy seeded data. Fresh start!');
    }
  } catch (e) {}
  localStorage.setItem('notes_db_version', DB_VERSION);
}
// ────────────────────────────────────────────────────────────────────────────




// Helper to interact with LocalStorage
const getStorageItem = (key, defaultValue) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Database state accessor
const getDb = () => {
  const users = getStorageItem('notes_users', [
    {
      id: 'user-default',
      name: 'Academic Board',
      email: 'admin@notes.edu',
      password: 'password123',
      semester: '1',
      department: 'CSE',
      role: 'admin',
      favorites: []
    }
  ]);
  const subjects = getStorageItem('notes_subjects', defaultSubjects);
  const notes = getStorageItem('notes_notes', defaultNotes);

  return { users, subjects, notes };
};

const saveDb = (db) => {
  if (db.users) setStorageItem('notes_users', db.users);
  if (db.subjects) setStorageItem('notes_subjects', db.subjects);
  if (db.notes) setStorageItem('notes_notes', db.notes);
};

// Parse JWT tokens
const getUserFromToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token.startsWith('mock-jwt-')) return null;
  const email = token.replace('mock-jwt-', '');
  const { users } = getDb();
  return users.find(u => u.email === email) || null;
};

// Mock Response Creator
const mockResponse = (data, status = 200) => {
  const jsonString = JSON.stringify(data);
  return new Response(jsonString, {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Global Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  
  // Resolve standard origin relative urls
  if (urlStr.startsWith('/') && !urlStr.startsWith('//')) {
    // Keep it local
  } else {
    // If it points to an external API baseUrl, trim it to matching route
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl && urlStr.startsWith(baseUrl)) {
      urlStr = urlStr.substring(baseUrl.length);
    }
  }

  // Check if we are targetting the API
  if (urlStr.startsWith('/api')) {
    const method = (init && init.method ? init.method.toUpperCase() : 'GET');
    const authHeader = init && init.headers ? (init.headers.Authorization || init.headers.authorization) : null;
    
    console.log(`[Mock API Interceptor] ${method} ${urlStr}`);

    try {
      // 1. AUTH ROUTES
      if (urlStr === '/api/auth/register') {
        const body = JSON.parse(init.body);
        const { users } = getDb();
        
        if (users.some(u => u.email === body.email)) {
          return mockResponse({ message: 'User with this email already exists' }, 400);
        }

        const newUser = {
          id: 'user-' + Date.now(),
          name: body.name,
          email: body.email,
          password: body.password || 'social-auth',
          semester: body.semester || '1',
          department: body.department || 'General',
          role: body.email === 'admin@notes.edu' ? 'admin' : 'student',
          favorites: []
        };

        users.push(newUser);
        saveDb({ users });

        return mockResponse({
          token: 'mock-jwt-' + newUser.email,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            semester: newUser.semester,
            department: newUser.department,
            role: newUser.role,
            favorites: newUser.favorites
          }
        }, 201);
      }

      if (urlStr === '/api/auth/login') {
        const body = JSON.parse(init.body);
        const { users } = getDb();
        
        const user = users.find(u => u.email === body.email && u.password === body.password);
        if (!user) {
          return mockResponse({ message: 'Invalid email or password' }, 400);
        }

        return mockResponse({
          token: 'mock-jwt-' + user.email,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            semester: user.semester,
            department: user.department,
            role: user.role,
            favorites: user.favorites || []
          }
        }, 200);
      }

      if (urlStr === '/api/auth/google') {
        const body = JSON.parse(init.body);
        const { users } = getDb();
        
        // Simulating Google verification: body typically contains { credential } which is JWT
        // We can unpack or use a fallback email/name
        const email = body.email || 'google-student@notes.edu';
        const name = body.name || 'Google Scholar';

        let user = users.find(u => u.email === email);
        if (!user) {
          user = {
            id: 'user-' + Date.now(),
            name,
            email,
            password: 'google-oauth-pass',
            semester: '1',
            department: 'General',
            role: 'student',
            favorites: []
          };
          users.push(user);
          saveDb({ users });
        }

        return mockResponse({
          token: 'mock-jwt-' + user.email,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            semester: user.semester,
            department: user.department,
            role: user.role,
            favorites: user.favorites || []
          }
        }, 200);
      }

      if (urlStr === '/api/auth/profile') {
        const user = getUserFromToken(authHeader);
        if (!user) {
          return mockResponse({ message: 'Unauthorized - Invalid Session' }, 401);
        }

        if (method === 'GET') {
          return mockResponse({
            id: user.id,
            name: user.name,
            email: user.email,
            semester: user.semester,
            department: user.department,
            role: user.role,
            favorites: user.favorites || []
          }, 200);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init.body);
          const { users } = getDb();
          const userIdx = users.findIndex(u => u.id === user.id);
          
          if (userIdx !== -1) {
            users[userIdx].name = body.name || users[userIdx].name;
            users[userIdx].semester = body.semester || users[userIdx].semester;
            users[userIdx].department = body.department || users[userIdx].department;
            saveDb({ users });
            
            return mockResponse({
              message: 'Profile updated successfully',
              user: {
                id: users[userIdx].id,
                name: users[userIdx].name,
                email: users[userIdx].email,
                semester: users[userIdx].semester,
                department: users[userIdx].department,
                role: users[userIdx].role,
                favorites: users[userIdx].favorites || []
              }
            }, 200);
          }
          return mockResponse({ message: 'User not found' }, 404);
        }
      }

      // 2. SUBJECTS ROUTES
      if (urlStr.startsWith('/api/subjects/semester/')) {
        const semNum = Number(urlStr.split('/').pop());
        const { subjects } = getDb();
        const filtered = subjects.filter(s => s.semester === semNum);
        return mockResponse(filtered, 200);
      }

      if (urlStr === '/api/subjects') {
        const { subjects } = getDb();
        if (method === 'GET') {
          return mockResponse(subjects, 200);
        }
        if (method === 'POST') {
          const user = getUserFromToken(authHeader);
          if (!user) {
            return mockResponse({ message: 'Sign-in required to create courses' }, 401);
          }

          const body = JSON.parse(init.body);
          // Check for duplicate within same semester
          const dup = subjects.find(s => s.semester === Number(body.semester) && s.subjectName.toLowerCase() === (body.subjectName || '').trim().toLowerCase());
          if (dup) return mockResponse({ message: 'Course name already exists in this semester' }, 409);

          const newSubject = {
            id: 'sub-' + Date.now(),
            semester: Number(body.semester),
            subjectName: body.subjectName.trim(),
            subjectCode: body.subjectCode || (body.subjectName.substring(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)),
            professorName: body.professorName || user.name || 'Department Panel'
          };

          subjects.push(newSubject);
          saveDb({ subjects });
          return mockResponse(newSubject, 201);
        }
      }

      // DELETE /api/subjects/:id
      const subjectDeleteMatch = urlStr.match(/^\/api\/subjects\/([^/?]+)$/);
      if (subjectDeleteMatch && method === 'DELETE') {
        const user = getUserFromToken(authHeader);
        if (!user) return mockResponse({ message: 'Sign-in required' }, 401);
        const subId = subjectDeleteMatch[1];
        const { subjects } = getDb();
        const idx = subjects.findIndex(s => (s.id || s._id) === subId);
        if (idx === -1) return mockResponse({ message: 'Subject not found' }, 404);
        subjects.splice(idx, 1);
        saveDb({ subjects });
        return mockResponse({ message: 'Course module deleted' }, 200);
      }

      // 3. NOTES ROUTES
      if (urlStr === '/api/notes/upload' && method === 'POST') {
        const user = getUserFromToken(authHeader);
        if (!user) {
          return mockResponse({ message: 'Sign-in required to upload files' }, 401);
        }

        // Body is a FormData object. We parse fields from FormData.
        const formData = init.body;
        const title = formData.get('title');
        const subject = formData.get('subject');
        const semester = Number(formData.get('semester'));
        const unitNumber = Number(formData.get('unitNumber'));
        const description = formData.get('description') || '';
        const tagsInput = formData.get('tags') || '';
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        const file = formData.get('file');

        let fileUrl = 'https://arxiv.org/pdf/2103.00020.pdf';

        if (file && file instanceof File) {
          try {
            if (file.size < 1.5 * 1024 * 1024) {
              // Convert small files to Base64 to make them fully persistent
              const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
              });
              if (dataUrl) {
                fileUrl = dataUrl;
              }
            } else {
              // Larger files get Blob Object URLs for current browser session preview
              fileUrl = URL.createObjectURL(file);
            }
          } catch (e) {
            console.error('FileReader base64 failed, using default PDF url:', e);
          }
        }

        const { notes, subjects } = getDb();
        const cleanSubject = subject.trim();
        
        // Auto-create subject card if it doesn't exist for this semester
        const subjectExists = subjects.some(s => s.semester === semester && s.subjectName.toLowerCase() === cleanSubject.toLowerCase());
        if (!subjectExists) {
          const cleanCode = cleanSubject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB';
          const newSubject = {
            id: 'sub-' + Date.now(),
            semester: semester,
            subjectName: cleanSubject,
            subjectCode: `${cleanCode}-${Math.floor(100 + Math.random() * 900)}`,
            professorName: 'Department Panel'
          };
          subjects.push(newSubject);
        }

        const topicGroup = formData.get('topicGroup') || title;
        const fileExt = formData.get('fileExt') || '';

        const newNote = {
          id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          title,
          topicGroup,
          fileExt,
          subject: cleanSubject,
          semester,
          unitNumber,
          description,
          fileUrl,
          uploadedBy: {
            userId: user.id,
            name: user.name,
            email: user.email
          },
          uploadDate: new Date().toISOString(),
          tags,
          downloads: 0,
          rating: 5.0,
          ratingsList: [5],
          comments: []
        };

        notes.push(newNote);
        saveDb({ notes, subjects });

        return mockResponse(newNote, 201);
      }

      if (urlStr.startsWith('/api/notes?') || urlStr === '/api/notes') {
        const { notes } = getDb();
        
        // Parse Query Params
        const parsedUrl = new URL(urlStr, window.location.origin);
        const semester = parsedUrl.searchParams.get('semester');
        const subject = parsedUrl.searchParams.get('subject');
        const search = parsedUrl.searchParams.get('search');
        
        let filtered = [...notes];

        if (semester) {
          filtered = filtered.filter(n => n.semester === Number(semester));
        }

        if (subject) {
          filtered = filtered.filter(n => n.subject.toLowerCase() === decodeURIComponent(subject).toLowerCase());
        }

        if (search) {
          const query = search.toLowerCase();
          filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(query) ||
            n.subject.toLowerCase().includes(query) ||
            n.description.toLowerCase().includes(query) ||
            n.tags.some(t => t.toLowerCase().includes(query))
          );
        }

        return mockResponse(filtered, 200);
      }

      // Check endpoints with notes/:id
      const noteIdMatch = urlStr.match(/^\/api\/notes\/([^\/]+)$/);
      if (noteIdMatch) {
        const noteId = noteIdMatch[1];
        const { notes } = getDb();
        const noteIdx = notes.findIndex(n => n.id === noteId);

        if (noteIdx === -1) {
          return mockResponse({ message: 'Note not found in library catalog' }, 404);
        }

        if (method === 'GET') {
          return mockResponse(notes[noteIdx], 200);
        }

        if (method === 'DELETE') {
          const user = getUserFromToken(authHeader);
          if (!user) {
            return mockResponse({ message: 'Authentication required' }, 401);
          }

          const targetNote = notes[noteIdx];
          const isOwner = targetNote.uploadedBy?.userId === user.id || 
                          targetNote.uploadedBy?.email === user.email || 
                          user.role === 'admin';

          if (!isOwner) {
            return mockResponse({ message: 'Unauthorized - You can only delete your own notes' }, 403);
          }

          notes.splice(noteIdx, 1);
          saveDb({ notes });
          return mockResponse({ message: 'Note deleted successfully' }, 200);
        }
      }

      const noteFavMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/favorite$/);
      if (noteFavMatch && method === 'POST') {
        const noteId = noteFavMatch[1];
        const user = getUserFromToken(authHeader);
        if (!user) {
          return mockResponse({ message: 'Session expired' }, 401);
        }

        const { users } = getDb();
        const userIdx = users.findIndex(u => u.id === user.id);
        
        if (userIdx !== -1) {
          if (!users[userIdx].favorites) users[userIdx].favorites = [];
          
          const isFav = users[userIdx].favorites.includes(noteId);
          if (isFav) {
            users[userIdx].favorites = users[userIdx].favorites.filter(id => id !== noteId);
          } else {
            users[userIdx].favorites.push(noteId);
          }
          
          saveDb({ users });
          return mockResponse({ favorited: !isFav }, 200);
        }
        return mockResponse({ message: 'User not found' }, 404);
      }

      const noteDownloadMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/download$/);
      if (noteDownloadMatch && method === 'POST') {
        const noteId = noteDownloadMatch[1];
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
          note.downloads = (note.downloads || 0) + 1;
          saveDb({ notes });
          return mockResponse({ success: true }, 200);
        }
        return mockResponse({ message: 'Note not found' }, 404);
      }

      const noteCommentMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/comment$/);
      if (noteCommentMatch && method === 'POST') {
        const noteId = noteCommentMatch[1];
        const user = getUserFromToken(authHeader);
        if (!user) {
          return mockResponse({ message: 'Auth token expired' }, 401);
        }

        const body = JSON.parse(init.body);
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);

        if (note) {
          const newComment = {
            id: 'comment-' + Date.now(),
            user: user.name,
            text: body.text,
            date: new Date().toISOString()
          };

          if (!note.comments) note.comments = [];
          note.comments.push(newComment);
          saveDb({ notes });
          return mockResponse(newComment, 201);
        }
        return mockResponse({ message: 'Note not found' }, 404);
      }

      const noteRateMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/rate$/);
      if (noteRateMatch && method === 'POST') {
        const noteId = noteRateMatch[1];
        const user = getUserFromToken(authHeader);
        if (!user) {
          return mockResponse({ message: 'Unauthorized to rate' }, 401);
        }

        const body = JSON.parse(init.body);
        const ratingVal = Number(body.rating);

        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);

        if (note) {
          if (!note.ratingsList) note.ratingsList = [note.rating || 5.0];
          note.ratingsList.push(ratingVal);
          
          const avg = note.ratingsList.reduce((sum, r) => sum + r, 0) / note.ratingsList.length;
          note.rating = Number(avg.toFixed(1));
          
          saveDb({ notes });
          return mockResponse({ rating: note.rating }, 200);
        }
        return mockResponse({ message: 'Note not found' }, 404);
      }

      // 4. ADMIN ANALYTICS ROUTE
      if (urlStr === '/api/admin/analytics') {
        const user = getUserFromToken(authHeader);
        if (!user || user.role !== 'admin') {
          return mockResponse({ message: 'Access denied' }, 403);
        }

        const { users, notes } = getDb();
        const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
        const totalComments = notes.reduce((sum, n) => sum + (n.comments?.length || 0), 0);

        return mockResponse({
          usersCount: users.length,
          notesCount: notes.length,
          downloadsCount: totalDownloads,
          commentsCount: totalComments
        }, 200);
      }

      // Fallback default API response
      return mockResponse({ message: 'API Route Mocked, but no handler defined' }, 404);
    } catch (e) {
      console.error('🚨 Client Mock API Interceptor error:', e);
      return mockResponse({ message: 'Internal Client Error: ' + e.message }, 500);
    }
  }

  // Pass through normal static page loads and external media fetches to originalFetch
  return originalFetch(input, init);
};
