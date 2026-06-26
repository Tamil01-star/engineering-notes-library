// ═══════════════════════════════════════════════════════════════════════════════
// Mock API Layer — Offline LocalStorage Mode
// ═══════════════════════════════════════════════════════════════════════════════

// ── One-time Migration: wipe legacy pre-seeded course data ───────────────────
const DB_VERSION = '3';
if (localStorage.getItem('notes_db_version') !== DB_VERSION) {
  try {
    const storedSubs = JSON.parse(localStorage.getItem('notes_subjects') || '[]');
    const hasLegacy = storedSubs.some(s =>
      /^Semester \d+ Course \d+$/.test(s.subjectName) || s.id?.startsWith('sub-s')
    );
    if (hasLegacy) {
      localStorage.removeItem('notes_subjects');
      localStorage.removeItem('notes_notes');
    }
  } catch (e) {}
  localStorage.setItem('notes_db_version', DB_VERSION);
}

// ── LocalStorage helpers ─────────────────────────────────────────────────────
const ls = (key, def) => {
  const v = localStorage.getItem(key);
  if (!v) { localStorage.setItem(key, JSON.stringify(def)); return def; }
  try { return JSON.parse(v); } catch { return def; }
};
const lsSave = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const getDb = () => ({
  users:    ls('notes_users',    []),
  subjects: ls('notes_subjects', []),
  notes:    ls('notes_notes',    []),
});
const saveDb = ({ users, subjects, notes }) => {
  if (users    !== undefined) lsSave('notes_users',    users);
  if (subjects !== undefined) lsSave('notes_subjects', subjects);
  if (notes    !== undefined) lsSave('notes_notes',    notes);
};

// ── Token utilities ─────────────────────────────────────────────────────────
// Token format: "mock-jwt-{email}" → localStorage mode
const getUserFromToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  if (token.startsWith('mock-jwt-')) {
    const email = token.replace('mock-jwt-', '');
    const { users } = getDb();
    return users.find(u => u.email === email) || null;
  }
  return null;
};

// ── Mock Response helper ─────────────────────────────────────────────────────
const R = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

// ── Global Fetch Interceptor ─────────────────────────────────────────────────
const originalFetch = window.fetch;

window.fetch = async (input, init) => {
  let rawUrl = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  
  // Normalize to pathname to support absolute URLs (e.g. from Vercel/production fetches)
  let urlStr = rawUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    urlStr = parsed.pathname;
  } catch (e) {}

  if (!urlStr.startsWith('/api')) return originalFetch(input, init);

  const method = (init?.method || 'GET').toUpperCase();
  const authHeader = init?.headers?.Authorization || init?.headers?.authorization || null;

  console.log(`[API] ${method} ${urlStr}`);

  try {

    // ────────────────── AUTH ROUTES ──────────────────────────────────────────

    if (urlStr === '/api/auth/register') {
      const body = JSON.parse(init.body);
      const { name, email, password, semester, department } = body;

      // localStorage fallback
      const { users } = getDb();
      if (users.some(u => u.email === email)) return R({ message: 'Email already registered' }, 400);
      const user = {
        id: 'user-' + Date.now(), name, email, password,
        semester: semester || '1',
        department: department || 'General',
        role: email === 'admin@notes.edu' ? 'admin' : 'student',
        favorites: [], uploadCount: 0
      };
      users.push(user);
      saveDb({ users });
      return R({ token: 'mock-jwt-' + email, user }, 201);
    }

    if (urlStr === '/api/auth/login') {
      const body = JSON.parse(init.body);
      const { email, password } = body;

      const { users } = getDb();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return R({ message: 'Invalid email or password' }, 400);
      return R({ token: 'mock-jwt-' + email, user }, 200);
    }

    if (urlStr === '/api/auth/google') {
      const body = JSON.parse(init.body);
      const email = body.email || 'google-student@gmail.com';
      const name  = body.name  || 'Google Scholar';

      const { users } = getDb();
      let user = users.find(u => u.email === email);
      if (!user) {
        user = { id: 'user-' + Date.now(), name, email, password: 'google-oauth', semester: '1', department: 'General', role: 'student', favorites: [], uploadCount: 0 };
        users.push(user);
        saveDb({ users });
      }
      return R({ token: 'mock-jwt-' + email, user }, 200);
    }

    if (urlStr === '/api/auth/profile') {
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Unauthorized' }, 401);

      if (method === 'GET') {
        return R(user, 200);
      }

      if (method === 'PUT') {
        const body = JSON.parse(init.body);
        const { users } = getDb();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          if (body.name)       users[idx].name       = body.name;
          if (body.semester)   users[idx].semester   = body.semester;
          if (body.department) users[idx].department = body.department;
          saveDb({ users });
          return R({ message: 'Profile updated', user: users[idx] }, 200);
        }
        return R({ message: 'User not found' }, 404);
      }
    }

    // ────────────────── SUBJECTS ROUTES ──────────────────────────────────────

    if (urlStr.startsWith('/api/subjects/semester/')) {
      const semNum = Number(urlStr.split('/').pop());
      const { subjects } = getDb();
      return R(subjects.filter(s => s.semester === semNum), 200);
    }

    if (urlStr === '/api/subjects') {
      if (method === 'GET') {
        return R(getDb().subjects, 200);
      }
      if (method === 'POST') {
        const user = await getUserFromToken(authHeader);
        if (!user) return R({ message: 'Sign-in required to create courses' }, 401);
        const body = JSON.parse(init.body);
        const semNum = Number(body.semester);
        const name   = (body.subjectName || '').trim();
        const code   = body.subjectCode || (name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g,'') + '-' + Math.floor(100 + Math.random() * 900));

        const { subjects } = getDb();
        if (subjects.some(s => s.semester === semNum && s.subjectName.toLowerCase() === name.toLowerCase()))
          return R({ message: 'Course already exists in this semester' }, 409);
        const subject = { id: 'sub-' + Date.now(), semester: semNum, subjectName: name, subjectCode: code, professorName: body.professorName || user.name || 'Department Panel' };
        subjects.push(subject);
        saveDb({ subjects });
        return R(subject, 201);
      }
    }

    // DELETE /api/subjects/:id
    const subjectDeleteMatch = urlStr.match(/^\/api\/subjects\/([^/?]+)$/);
    if (subjectDeleteMatch && method === 'DELETE') {
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Sign-in required' }, 401);
      const subId = subjectDeleteMatch[1];
      const { subjects } = getDb();
      const idx = subjects.findIndex(s => (s.id || s._id) === subId);
      if (idx === -1) return R({ message: 'Subject not found' }, 404);
      subjects.splice(idx, 1);
      saveDb({ subjects });
      return R({ message: 'Course deleted' }, 200);
    }

    // ────────────────── NOTES ROUTES ─────────────────────────────────────────

    if (urlStr === '/api/notes/upload' && method === 'POST') {
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Sign-in required to upload' }, 401);

      const formData  = init.body;
      const title      = formData.get('title');
      const topicGroup = formData.get('topicGroup') || title;
      const fileExt    = formData.get('fileExt') || '';
      const subject    = (formData.get('subject') || '').trim();
      const semester   = Number(formData.get('semester'));
      const unitNumber = Number(formData.get('unitNumber'));
      const description= formData.get('description') || '';
      const tagsInput  = formData.get('tags') || '';
      const tags       = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
      const file       = formData.get('file');

      // ── File storage ──────────────────────────────────────────────────────
      const noteId = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      let fileUrl  = '';

      if (file instanceof File) {
        // Fallback: base64 for small files (<1.5MB), else blob URL
        if (file.size < 1.5 * 1024 * 1024) {
          fileUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result || '');
            reader.onerror   = () => resolve('');
            reader.readAsDataURL(file);
          });
        } else {
          fileUrl = URL.createObjectURL(file);
        }
      }

      // ── Auto-create subject if it doesn't exist ───────────────────────────
      const { notes, subjects, users } = getDb();
      if (!subjects.some(s => s.semester === semester && s.subjectName.toLowerCase() === subject.toLowerCase())) {
        const code = subject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g,'') + '-' + Math.floor(100 + Math.random() * 900);
        subjects.push({ id: 'sub-' + Date.now(), semester, subjectName: subject, subjectCode: code, professorName: 'Department Panel' });
      }

      // Increment user upload count
      const userIdx = users.findIndex(u => u.id === user.id);
      if (userIdx !== -1) {
        users[userIdx].uploadCount = (users[userIdx].uploadCount || 0) + 1;
      }

      // ── Create note document ──────────────────────────────────────────────
      const note = {
        id: noteId, title, topicGroup, fileExt, subject,
        subjectLower: subject.toLowerCase(),
        semester, unitNumber, description, fileUrl,
        uploadedBy: { userId: user.id, name: user.name, email: user.email },
        uploadDate: new Date().toISOString(),
        tags, downloads: 0, rating: 5.0, ratingsList: [5], comments: []
      };

      notes.push(note);
      saveDb({ notes, subjects, users });

      return R(note, 201);
    }

    // GET /api/notes
    if (urlStr.startsWith('/api/notes?') || urlStr === '/api/notes') {
      const parsedUrl = new URL(urlStr, window.location.origin);
      const filters = {
        semester: parsedUrl.searchParams.get('semester'),
        subject:  parsedUrl.searchParams.get('subject'),
        search:   parsedUrl.searchParams.get('search'),
      };

      let notes = [...getDb().notes];
      if (filters.semester) notes = notes.filter(n => n.semester === Number(filters.semester));
      if (filters.subject)  notes = notes.filter(n => n.subject.toLowerCase() === decodeURIComponent(filters.subject).toLowerCase());
      if (filters.search) {
        const q = filters.search.toLowerCase();
        notes = notes.filter(n =>
          (n.title||'').toLowerCase().includes(q) ||
          (n.subject||'').toLowerCase().includes(q) ||
          (n.description||'').toLowerCase().includes(q) ||
          (n.tags||[]).some(t => t.toLowerCase().includes(q))
        );
      }
      return R(notes, 200);
    }

    // GET | DELETE /api/notes/:id
    const noteIdMatch = urlStr.match(/^\/api\/notes\/([^\/]+)$/);
    if (noteIdMatch) {
      const noteId = noteIdMatch[1];

      if (method === 'GET') {
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);
        return note ? R(note, 200) : R({ message: 'Note not found' }, 404);
      }

      if (method === 'DELETE') {
        const user = await getUserFromToken(authHeader);
        if (!user) return R({ message: 'Authentication required' }, 401);

        const { notes } = getDb();
        const idx = notes.findIndex(n => n.id === noteId);
        if (idx === -1) return R({ message: 'Note not found' }, 404);
        const isOwner = notes[idx].uploadedBy?.userId === user.id || notes[idx].uploadedBy?.email === user.email || user.role === 'admin';
        if (!isOwner) return R({ message: 'You can only delete your own notes' }, 403);
        notes.splice(idx, 1);
        saveDb({ notes });
        return R({ message: 'Note deleted' }, 200);
      }
    }

    // POST /api/notes/:id/favorite
    const noteFavMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/favorite$/);
    if (noteFavMatch && method === 'POST') {
      const noteId = noteFavMatch[1];
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Session expired' }, 401);

      const { users } = getDb();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) return R({ message: 'User not found' }, 404);
      if (!users[idx].favorites) users[idx].favorites = [];
      const isFav = users[idx].favorites.includes(noteId);
      users[idx].favorites = isFav
        ? users[idx].favorites.filter(id => id !== noteId)
        : [...users[idx].favorites, noteId];
      saveDb({ users });
      return R({ favorited: !isFav }, 200);
    }

    // POST /api/notes/:id/download
    const noteDownloadMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/download$/);
    if (noteDownloadMatch && method === 'POST') {
      const noteId = noteDownloadMatch[1];
      const { notes } = getDb();
      const note = notes.find(n => n.id === noteId);
      if (note) { note.downloads = (note.downloads || 0) + 1; saveDb({ notes }); }
      return R({ success: true }, 200);
    }

    // POST /api/notes/:id/comment
    const noteCommentMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/comment$/);
    if (noteCommentMatch && method === 'POST') {
      const noteId = noteCommentMatch[1];
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Auth required' }, 401);
      const body = JSON.parse(init.body);
      const newComment = { id: 'comment-' + Date.now(), user: user.name, text: body.text, date: new Date().toISOString() };

      const { notes } = getDb();
      const note = notes.find(n => n.id === noteId);
      if (!note) return R({ message: 'Note not found' }, 404);
      if (!note.comments) note.comments = [];
      note.comments.push(newComment);
      saveDb({ notes });
      return R(newComment, 201);
    }

    // POST /api/notes/:id/rate
    const noteRateMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/rate$/);
    if (noteRateMatch && method === 'POST') {
      const noteId = noteRateMatch[1];
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Auth required' }, 401);
      const body = JSON.parse(init.body);
      const ratingVal = Number(body.rating);

      const { notes } = getDb();
      const note = notes.find(n => n.id === noteId);
      if (!note) return R({ message: 'Note not found' }, 404);
      if (!note.ratingsList) note.ratingsList = [note.rating || 5.0];
      note.ratingsList.push(ratingVal);
      note.rating = Number((note.ratingsList.reduce((s, r) => s + r, 0) / note.ratingsList.length).toFixed(1));
      saveDb({ notes });
      return R({ rating: note.rating }, 200);
    }

    // ────────────────── ADMIN ANALYTICS ──────────────────────────────────────
    if (urlStr === '/api/admin/analytics') {
      const user = await getUserFromToken(authHeader);
      if (!user || user.role !== 'admin') return R({ message: 'Access denied' }, 403);

      const { users, notes } = getDb();
      return R({
        usersCount: users.length,
        notesCount: notes.length,
        downloadsCount: notes.reduce((s, n) => s + (n.downloads || 0), 0),
        commentsCount:  notes.reduce((s, n) => s + (n.comments?.length || 0), 0),
      }, 200);
    }

    return R({ message: 'Route not found' }, 404);

  } catch (e) {
    console.error('🚨 API Interceptor error:', e);
    return R({ message: 'Internal Error: ' + e.message }, 500);
  }
};
