// ═══════════════════════════════════════════════════════════════════════════════
// Mock API Layer — Dual Mode
//   • Firebase mode  : when VITE_FIREBASE_* env vars are set (cross-device ✅)
//   • Offline mode   : localStorage fallback (single-browser only)
// ═══════════════════════════════════════════════════════════════════════════════

import { isFirebaseReady, firebaseAuth, firestore, firebaseStorage } from './firebase.js';

// Firebase Auth & Firestore imports (tree-shaken when not used)
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, setDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// ── Firestore helpers ────────────────────────────────────────────────────────
const FS = {
  async getUser(uid) {
    const snap = await getDoc(doc(firestore, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  async getUserByEmail(email) {
    const q = query(collection(firestore, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },
  async setUser(uid, data) {
    await setDoc(doc(firestore, 'users', uid), data, { merge: true });
  },
  async getSubjectsBySemester(semNum) {
    const q = query(collection(firestore, 'subjects'), where('semester', '==', semNum));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async getAllSubjects() {
    const snap = await getDocs(collection(firestore, 'subjects'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addSubject(data) {
    const ref = await addDoc(collection(firestore, 'subjects'), data);
    return { id: ref.id, ...data };
  },
  async deleteSubject(id) {
    await deleteDoc(doc(firestore, 'subjects', id));
  },
  async getNotes(filters = {}) {
    let q = collection(firestore, 'notes');
    const constraints = [];
    if (filters.semester) constraints.push(where('semester', '==', Number(filters.semester)));
    if (filters.subject)  constraints.push(where('subjectLower', '==', filters.subject.toLowerCase()));
    if (constraints.length) q = query(q, ...constraints);
    const snap = await getDocs(q);
    let notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      notes = notes.filter(n =>
        (n.title||'').toLowerCase().includes(s) ||
        (n.subject||'').toLowerCase().includes(s) ||
        (n.description||'').toLowerCase().includes(s) ||
        (n.tags||[]).some(t => t.toLowerCase().includes(s))
      );
    }
    return notes;
  },
  async getNote(id) {
    const snap = await getDoc(doc(firestore, 'notes', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  async addNote(data) {
    const ref = await addDoc(collection(firestore, 'notes'), data);
    return { id: ref.id, ...data };
  },
  async updateNote(id, updates) {
    await updateDoc(doc(firestore, 'notes', id), updates);
  },
  async deleteNote(id) {
    await deleteDoc(doc(firestore, 'notes', id));
  },
  async subjectExists(semNum, name) {
    const q = query(
      collection(firestore, 'subjects'),
      where('semester', '==', semNum),
      where('subjectNameLower', '==', name.toLowerCase())
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },
  async toggleFavorite(uid, noteId) {
    const userRef = doc(firestore, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;
    const favs = snap.data().favorites || [];
    const isFav = favs.includes(noteId);
    await updateDoc(userRef, {
      favorites: isFav ? arrayRemove(noteId) : arrayUnion(noteId)
    });
    return !isFav;
  },
  async uploadFile(file, noteId) {
    if (!firebaseStorage) return null;
    try {
      const ext = file.name.substring(file.name.lastIndexOf('.'));
      const path = `notes/${noteId}/${Date.now()}${ext}`;
      const sRef = storageRef(firebaseStorage, path);
      await uploadBytes(sRef, file);
      return await getDownloadURL(sRef);
    } catch (e) {
      console.warn('[Firebase Storage] Upload failed, using base64 fallback:', e.message);
      return null;
    }
  }
};

// ── Token utilities ─────────────────────────────────────────────────────────
// Token formats:
//   "firebase-uid-{uid}"  → Firebase mode
//   "mock-jwt-{email}"    → localStorage mode

const getUserFromToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  if (isFirebaseReady && token.startsWith('firebase-uid-')) {
    const uid = token.replace('firebase-uid-', '');
    try { return await FS.getUser(uid); } catch { return null; }
  }

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

      if (isFirebaseReady) {
        try {
          const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const uid = cred.user.uid;
          const userData = {
            id: uid, name, email,
            semester: semester || '1',
            department: department || 'General',
            role: email === 'admin@notes.edu' ? 'admin' : 'student',
            favorites: [],
            uploadCount: 0
          };
          await FS.setUser(uid, userData);
          const token = 'firebase-uid-' + uid;
          return R({ token, user: userData }, 201);
        } catch (err) {
          const msg = err.code === 'auth/email-already-in-use'
            ? 'An account with this email already exists.'
            : err.code === 'auth/weak-password'
            ? 'Password must be at least 6 characters.'
            : err.message;
          return R({ message: msg }, 400);
        }
      } else {
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
    }

    if (urlStr === '/api/auth/login') {
      const body = JSON.parse(init.body);
      const { email, password } = body;

      if (isFirebaseReady) {
        try {
          const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
          const uid = cred.user.uid;
          let userData = await FS.getUser(uid);
          if (!userData) {
            // First login — create profile in Firestore
            userData = {
              id: uid, name: cred.user.displayName || email.split('@')[0],
              email, semester: '1', department: 'General',
              role: email === 'admin@notes.edu' ? 'admin' : 'student',
              favorites: [], uploadCount: 0
            };
            await FS.setUser(uid, userData);
          }
          return R({ token: 'firebase-uid-' + uid, user: userData }, 200);
        } catch (err) {
          const msg = err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
            ? 'Invalid email or password. Please check your credentials.'
            : err.message;
          return R({ message: msg }, 400);
        }
      } else {
        const { users } = getDb();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return R({ message: 'Invalid email or password' }, 400);
        return R({ token: 'mock-jwt-' + email, user }, 200);
      }
    }

    if (urlStr === '/api/auth/google') {
      const body = JSON.parse(init.body);
      const email = body.email || 'google-student@gmail.com';
      const name  = body.name  || 'Google Scholar';

      if (isFirebaseReady) {
        // In Firebase mode, Google SSO is handled directly by Firebase on the client
        // This route is a fallback for the mock Google button
        let user = await FS.getUserByEmail(email);
        if (!user) {
          // For real Google auth this would be handled by FirebaseAuth.signInWithPopup
          // Here we just create a profile if it doesn't exist
          const uid = 'google-' + Date.now();
          user = { id: uid, name, email, semester: '1', department: 'General', role: 'student', favorites: [], uploadCount: 0 };
          await FS.setUser(uid, user);
        }
        return R({ token: 'firebase-uid-' + user.id, user }, 200);
      } else {
        const { users } = getDb();
        let user = users.find(u => u.email === email);
        if (!user) {
          user = { id: 'user-' + Date.now(), name, email, password: 'google-oauth', semester: '1', department: 'General', role: 'student', favorites: [], uploadCount: 0 };
          users.push(user);
          saveDb({ users });
        }
        return R({ token: 'mock-jwt-' + email, user }, 200);
      }
    }

    if (urlStr === '/api/auth/profile') {
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Unauthorized' }, 401);

      if (method === 'GET') {
        return R(user, 200);
      }

      if (method === 'PUT') {
        const body = JSON.parse(init.body);
        if (isFirebaseReady) {
          const updates = {};
          if (body.name)       updates.name       = body.name;
          if (body.semester)   updates.semester   = body.semester;
          if (body.department) updates.department = body.department;
          await FS.setUser(user.id, updates);
          const updated = { ...user, ...updates };
          return R({ message: 'Profile updated', user: updated }, 200);
        } else {
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
    }

    // ────────────────── SUBJECTS ROUTES ──────────────────────────────────────

    if (urlStr.startsWith('/api/subjects/semester/')) {
      const semNum = Number(urlStr.split('/').pop());
      if (isFirebaseReady) {
        const subjects = await FS.getSubjectsBySemester(semNum);
        return R(subjects, 200);
      } else {
        const { subjects } = getDb();
        return R(subjects.filter(s => s.semester === semNum), 200);
      }
    }

    if (urlStr === '/api/subjects') {
      if (method === 'GET') {
        if (isFirebaseReady) {
          return R(await FS.getAllSubjects(), 200);
        } else {
          return R(getDb().subjects, 200);
        }
      }
      if (method === 'POST') {
        const user = await getUserFromToken(authHeader);
        if (!user) return R({ message: 'Sign-in required to create courses' }, 401);
        const body = JSON.parse(init.body);
        const semNum = Number(body.semester);
        const name   = (body.subjectName || '').trim();
        const code   = body.subjectCode || (name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g,'') + '-' + Math.floor(100 + Math.random() * 900));

        if (isFirebaseReady) {
          const exists = await FS.subjectExists(semNum, name);
          if (exists) return R({ message: 'Course already exists in this semester' }, 409);
          const subject = { semester: semNum, subjectName: name, subjectNameLower: name.toLowerCase(), subjectCode: code, professorName: body.professorName || user.name || 'Department Panel' };
          const created = await FS.addSubject(subject);
          return R(created, 201);
        } else {
          const { subjects } = getDb();
          if (subjects.some(s => s.semester === semNum && s.subjectName.toLowerCase() === name.toLowerCase()))
            return R({ message: 'Course already exists in this semester' }, 409);
          const subject = { id: 'sub-' + Date.now(), semester: semNum, subjectName: name, subjectCode: code, professorName: body.professorName || user.name || 'Department Panel' };
          subjects.push(subject);
          saveDb({ subjects });
          return R(subject, 201);
        }
      }
    }

    // DELETE /api/subjects/:id
    const subjectDeleteMatch = urlStr.match(/^\/api\/subjects\/([^/?]+)$/);
    if (subjectDeleteMatch && method === 'DELETE') {
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Sign-in required' }, 401);
      const subId = subjectDeleteMatch[1];
      if (isFirebaseReady) {
        await FS.deleteSubject(subId);
      } else {
        const { subjects } = getDb();
        const idx = subjects.findIndex(s => (s.id || s._id) === subId);
        if (idx === -1) return R({ message: 'Subject not found' }, 404);
        subjects.splice(idx, 1);
        saveDb({ subjects });
      }
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
        // 1. Try Firebase Storage (cross-device, permanent URLs)
        if (isFirebaseReady && firebaseStorage) {
          fileUrl = await FS.uploadFile(file, noteId) || '';
        }
        // 2. Fallback: base64 for small files (<1.5MB), else blob URL
        if (!fileUrl) {
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
      }

      // ── Auto-create subject if it doesn't exist ───────────────────────────
      if (isFirebaseReady) {
        const exists = await FS.subjectExists(semester, subject);
        if (!exists) {
          const code = subject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g,'') + '-' + Math.floor(100 + Math.random() * 900);
          await FS.addSubject({ semester, subjectName: subject, subjectNameLower: subject.toLowerCase(), subjectCode: code, professorName: user.name || 'Department Panel' });
        }
        // Increment user upload count
        await FS.setUser(user.id, { uploadCount: (user.uploadCount || 0) + 1 });
      } else {
        const { subjects } = getDb();
        if (!subjects.some(s => s.semester === semester && s.subjectName.toLowerCase() === subject.toLowerCase())) {
          const code = subject.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g,'') + '-' + Math.floor(100 + Math.random() * 900);
          subjects.push({ id: 'sub-' + Date.now(), semester, subjectName: subject, subjectCode: code, professorName: 'Department Panel' });
        }
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

      if (isFirebaseReady) {
        const { notes, subjects } = getDb();  // Needed for saveDb call below
        await addDoc(collection(firestore, 'notes'), note);
      } else {
        const { notes, subjects } = getDb();
        notes.push(note);
        saveDb({ notes, subjects });
      }

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

      if (isFirebaseReady) {
        return R(await FS.getNotes(filters), 200);
      } else {
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
    }

    // GET | DELETE /api/notes/:id
    const noteIdMatch = urlStr.match(/^\/api\/notes\/([^\/]+)$/);
    if (noteIdMatch) {
      const noteId = noteIdMatch[1];

      if (method === 'GET') {
        if (isFirebaseReady) {
          const note = await FS.getNote(noteId);
          return note ? R(note, 200) : R({ message: 'Note not found' }, 404);
        } else {
          const { notes } = getDb();
          const note = notes.find(n => n.id === noteId);
          return note ? R(note, 200) : R({ message: 'Note not found' }, 404);
        }
      }

      if (method === 'DELETE') {
        const user = await getUserFromToken(authHeader);
        if (!user) return R({ message: 'Authentication required' }, 401);

        if (isFirebaseReady) {
          const note = await FS.getNote(noteId);
          if (!note) return R({ message: 'Note not found' }, 404);
          const isOwner = note.uploadedBy?.userId === user.id || note.uploadedBy?.email === user.email || user.role === 'admin';
          if (!isOwner) return R({ message: 'You can only delete your own notes' }, 403);
          await FS.deleteNote(noteId);
        } else {
          const { notes } = getDb();
          const idx = notes.findIndex(n => n.id === noteId);
          if (idx === -1) return R({ message: 'Note not found' }, 404);
          const isOwner = notes[idx].uploadedBy?.userId === user.id || notes[idx].uploadedBy?.email === user.email || user.role === 'admin';
          if (!isOwner) return R({ message: 'You can only delete your own notes' }, 403);
          notes.splice(idx, 1);
          saveDb({ notes });
        }
        return R({ message: 'Note deleted' }, 200);
      }
    }

    // POST /api/notes/:id/favorite
    const noteFavMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/favorite$/);
    if (noteFavMatch && method === 'POST') {
      const noteId = noteFavMatch[1];
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Session expired' }, 401);

      if (isFirebaseReady) {
        const favorited = await FS.toggleFavorite(user.id, noteId);
        return R({ favorited }, 200);
      } else {
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
    }

    // POST /api/notes/:id/download
    const noteDownloadMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/download$/);
    if (noteDownloadMatch && method === 'POST') {
      const noteId = noteDownloadMatch[1];
      if (isFirebaseReady) {
        try { await FS.updateNote(noteId, { downloads: (await FS.getNote(noteId))?.downloads + 1 || 1 }); } catch {}
        return R({ success: true }, 200);
      } else {
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);
        if (note) { note.downloads = (note.downloads || 0) + 1; saveDb({ notes }); }
        return R({ success: true }, 200);
      }
    }

    // POST /api/notes/:id/comment
    const noteCommentMatch = urlStr.match(/^\/api\/notes\/([^\/]+)\/comment$/);
    if (noteCommentMatch && method === 'POST') {
      const noteId = noteCommentMatch[1];
      const user = await getUserFromToken(authHeader);
      if (!user) return R({ message: 'Auth required' }, 401);
      const body = JSON.parse(init.body);
      const newComment = { id: 'comment-' + Date.now(), user: user.name, text: body.text, date: new Date().toISOString() };

      if (isFirebaseReady) {
        const note = await FS.getNote(noteId);
        if (!note) return R({ message: 'Note not found' }, 404);
        const comments = [...(note.comments || []), newComment];
        await FS.updateNote(noteId, { comments });
      } else {
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);
        if (!note) return R({ message: 'Note not found' }, 404);
        if (!note.comments) note.comments = [];
        note.comments.push(newComment);
        saveDb({ notes });
      }
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

      if (isFirebaseReady) {
        const note = await FS.getNote(noteId);
        if (!note) return R({ message: 'Note not found' }, 404);
        const ratingsList = [...(note.ratingsList || [note.rating || 5.0]), ratingVal];
        const rating = Number((ratingsList.reduce((s, r) => s + r, 0) / ratingsList.length).toFixed(1));
        await FS.updateNote(noteId, { ratingsList, rating });
        return R({ rating }, 200);
      } else {
        const { notes } = getDb();
        const note = notes.find(n => n.id === noteId);
        if (!note) return R({ message: 'Note not found' }, 404);
        if (!note.ratingsList) note.ratingsList = [note.rating || 5.0];
        note.ratingsList.push(ratingVal);
        note.rating = Number((note.ratingsList.reduce((s, r) => s + r, 0) / note.ratingsList.length).toFixed(1));
        saveDb({ notes });
        return R({ rating: note.rating }, 200);
      }
    }

    // ────────────────── ADMIN ANALYTICS ──────────────────────────────────────
    if (urlStr === '/api/admin/analytics') {
      const user = await getUserFromToken(authHeader);
      if (!user || user.role !== 'admin') return R({ message: 'Access denied' }, 403);

      if (isFirebaseReady) {
        const notes = await FS.getNotes({});
        const usersSnap = await getDocs(collection(firestore, 'users'));
        return R({
          usersCount: usersSnap.size,
          notesCount: notes.length,
          downloadsCount: notes.reduce((s, n) => s + (n.downloads || 0), 0),
          commentsCount:  notes.reduce((s, n) => s + (n.comments?.length || 0), 0),
        }, 200);
      } else {
        const { users, notes } = getDb();
        return R({
          usersCount: users.length,
          notesCount: notes.length,
          downloadsCount: notes.reduce((s, n) => s + (n.downloads || 0), 0),
          commentsCount:  notes.reduce((s, n) => s + (n.comments?.length || 0), 0),
        }, 200);
      }
    }

    return R({ message: 'Route not found' }, 404);

  } catch (e) {
    console.error('🚨 API Interceptor error:', e);
    return R({ message: 'Internal Error: ' + e.message }, 500);
  }
};
