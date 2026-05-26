import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, ArrowLeft, BookOpen, Upload, FileText, 
  ChevronRight, User, Hash, Star, Trash2, Plus, Folder, 
  FolderOpen, X, Check, AlertCircle
} from 'lucide-react';

const SemesterDetail = () => {
  const { sem } = useParams();
  const navigate = useNavigate();
  const semNum = Number(sem);
  const { user, token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});

  // New course creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    const fetchSubjects = fetch(`/api/subjects/semester/${semNum}`)
      .then(res => res.ok ? res.json() : []);
    const fetchNotes = fetch(`/api/notes?semester=${semNum}`)
      .then(res => res.ok ? res.json() : []);

    Promise.all([fetchSubjects, fetchNotes])
      .then(([subjectsData, notesData]) => {
        setSubjects(subjectsData);
        setNotes(notesData);
        if (subjectsData.length > 0 && !activeSubject) {
          setActiveSubject(subjectsData[0].subjectName);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [semNum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get notes grouped by topic (title) for a subject — folder structure
  const getNotesByTopic = (subjectName) => {
    const subjectNotes = notes.filter(n => n.subject.toLowerCase() === subjectName.toLowerCase());
    const topicMap = {};
    subjectNotes.forEach(note => {
      const key = note.topicGroup || note.title;
      if (!topicMap[key]) topicMap[key] = [];
      topicMap[key].push(note);
    });
    return topicMap;
  };

  const getSubjectNoteCount = (subjectName) => {
    return notes.filter(n => n.subject.toLowerCase() === subjectName.toLowerCase()).length;
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this file permanently?')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Delete failed');
      }
      setNotes(prev => prev.filter(n => (n.id || n._id) !== noteId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async (e, subjectId, subjectName) => {
    e.stopPropagation();
    const courseNotes = notes.filter(n => n.subject.toLowerCase() === subjectName.toLowerCase());
    if (courseNotes.length > 0) {
      if (!window.confirm(`Delete course "${subjectName}" and all ${courseNotes.length} file(s) inside it?`)) return;
      // Delete all notes in this course
      for (const note of courseNotes) {
        await fetch(`/api/notes/${note.id || note._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setNotes(prev => prev.filter(n => n.subject.toLowerCase() !== subjectName.toLowerCase()));
    } else {
      if (!window.confirm(`Delete empty course module "${subjectName}"?`)) return;
    }
    // Delete the subject
    await fetch(`/api/subjects/${subjectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setSubjects(prev => prev.filter(s => (s.id || s._id) !== subjectId));
    if (activeSubject === subjectName) setActiveSubject(null);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      setCreateError('Course name is required.');
      return;
    }
    const exists = subjects.some(s => s.subjectName.toLowerCase() === newCourseName.trim().toLowerCase());
    if (exists) {
      setCreateError('A course with this name already exists in this semester.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const code = newCourseCode.trim() || newCourseName.trim().substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          semester: semNum,
          subjectName: newCourseName.trim(),
          subjectCode: code,
          professorName: user?.name || 'Department Panel'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create course');
      }

      const created = await res.json();
      setSubjects(prev => [...prev, created]);
      setActiveSubject(created.subjectName);
      setNewCourseName('');
      setNewCourseCode('');
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleTopic = (topicKey) => {
    setExpandedTopics(prev => ({ ...prev, [topicKey]: !prev[topicKey] }));
  };

  const activeTopicGroups = activeSubject ? getNotesByTopic(activeSubject) : {};
  const topicGroupCount = Object.keys(activeTopicGroups).length;
  const totalFilesInActive = activeSubject ? getSubjectNoteCount(activeSubject) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/semesters')}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-all mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-purple-400" />
            <span>{semNum === 9 ? 'GOVT EXAM Prep Library' : `Semester ${semNum} Courses`}</span>
          </h1>
          <p className="text-sm text-slate-400 font-sans">
            {subjects.length === 0 
              ? 'No course modules yet. Create your first course below.'
              : `${subjects.length} course module${subjects.length !== 1 ? 's' : ''} • ${notes.length} total file${notes.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-800/80 px-4 py-2 border border-white/5 text-xs font-mono font-semibold text-purple-300">
            {semNum === 9 ? 'GOVT EXAM' : `Semester ${semNum} / 8`}
          </div>
          {user && (
            <button
              onClick={() => { setShowCreateForm(true); setCreateError(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Plus className="h-4 w-4" /> New Course
            </button>
          )}
        </div>
      </div>

      {/* Create Course Form (inline modal) */}
      {showCreateForm && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-poppins font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-400" /> Create New Course Module
            </h3>
            <button onClick={() => { setShowCreateForm(false); setCreateError(''); }} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateCourse} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course / Subject Name *</label>
              <input
                type="text"
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                placeholder="e.g. Engineering Mathematics, GATE CSE, Data Structures..."
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Short Code (optional)</label>
              <input
                type="text"
                value={newCourseCode}
                onChange={e => setNewCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g. ENGM-301"
                maxLength={12}
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>
            {createError && (
              <div className="sm:col-span-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {createError}
              </div>
            )}
            <div className="sm:col-span-3 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setCreateError(''); }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creating ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check className="h-3.5 w-3.5" />}
                Create Course
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : subjects.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-montserrat text-xl font-bold text-white">No Course Modules Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              This semester has no courses created. Click "New Course" above to create your first subject module, then upload files to it.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" /> Create First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Course cards grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              {subjects.map((sub) => {
                const fileCount = getSubjectNoteCount(sub.subjectName);
                const isActive = activeSubject === sub.subjectName;
                const isAdmin = user && (user.role === 'admin' || user.email === 'admin@notes.edu');
                
                return (
                  <div
                    key={sub.id || sub._id}
                    onClick={() => setActiveSubject(sub.subjectName)}
                    className={`group cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] ${
                      isActive
                        ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] bg-slate-800/60'
                        : 'border-white/5 hover:border-cyan-500/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-[9px] font-mono text-cyan-400 border border-cyan-400/20">
                          <Hash className="h-3 w-3" /> {sub.subjectCode}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase font-mono">
                          {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-poppins text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                          {sub.subjectName}
                        </h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <User className="h-3 w-3 text-slate-500" />
                          <span>{sub.professorName || 'Dept. Panel'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-4 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveSubject(sub.subjectName); }}
                        className="flex-1 flex justify-center items-center gap-1 rounded-lg bg-slate-900 border border-white/10 text-[11px] font-semibold py-1.5 text-slate-300 hover:text-white"
                      >
                        <BookOpen className="h-3 w-3 text-cyan-400" />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/upload?subject=${encodeURIComponent(sub.subjectName)}&semester=${semNum}`);
                        }}
                        className="flex items-center justify-center p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"
                        title="Upload files to this course"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>

                      {(user && (isAdmin || sub.professorName === user.name)) && (
                        <button
                          onClick={(e) => handleDeleteCourse(e, sub.id || sub._id, sub.subjectName)}
                          className="flex items-center justify-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                          title="Delete this course and all its files"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Files panel with folder-grouped topic view */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <span className="truncate">{activeSubject || 'Select a Course'}</span>
                </h3>
                {activeSubject && (
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-2">
                    {topicGroupCount} folder{topicGroupCount !== 1 ? 's' : ''} • {totalFilesInActive} file{totalFilesInActive !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {!activeSubject ? (
                <p className="text-xs text-slate-500 text-center py-8">Click a course card to view its files.</p>
              ) : totalFilesInActive === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-500">No files uploaded to this course yet.</p>
                  <button
                    onClick={() => navigate(`/upload?semester=${semNum}&subject=${encodeURIComponent(activeSubject)}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload First Files
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {Object.entries(activeTopicGroups).map(([topicKey, topicNotes]) => {
                    const isExpanded = expandedTopics[topicKey] !== false; // default open
                    const isFolder = topicNotes.length > 1;

                    return (
                      <div key={topicKey} className="border border-white/5 rounded-xl overflow-hidden">
                        {/* Topic header (folder row) */}
                        <button
                          onClick={() => toggleTopic(topicKey)}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isFolder ? (
                              isExpanded 
                                ? <FolderOpen className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                : <Folder className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                            )}
                            <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                              {topicKey}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-slate-500">{topicNotes.length} file{topicNotes.length !== 1 ? 's' : ''}</span>
                            <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {/* Topic files list */}
                        {isExpanded && (
                          <div className="divide-y divide-white/5">
                            {topicNotes.map((note) => {
                              const isOwner = user && (
                                (note.uploadedBy?.userId === user.id) ||
                                (note.uploadedBy?.email === user.email) ||
                                user.email === 'admin@notes.edu'
                              );
                              return (
                                <div
                                  key={note.id || note._id}
                                  onClick={() => navigate(`/notes/${note.id || note._id}`)}
                                  className="group/file flex items-center justify-between py-2.5 px-4 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-xs font-medium text-slate-300 group-hover/file:text-cyan-400 transition-colors truncate">
                                      {note.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5 font-mono">
                                      <span>Unit {note.unitNumber}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" /> {note.rating}</span>
                                      {note.fileExt && <span className="uppercase text-purple-400">{note.fileExt}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => isOwner ? handleDeleteNote(e, note.id || note._id) : e.stopPropagation()}
                                      disabled={!isOwner}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        isOwner
                                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                                          : 'bg-slate-900/50 border-white/5 text-slate-700 opacity-30 cursor-not-allowed'
                                      }`}
                                      title={isOwner ? 'Delete file' : 'Only owner can delete'}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover/file:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSubject && totalFilesInActive > 0 && (
                <button
                  onClick={() => navigate(`/upload?semester=${semNum}&subject=${encodeURIComponent(activeSubject)}`)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-cyan-400 font-bold flex items-center justify-center gap-1.5 transition-colors font-poppins"
                >
                  <Upload className="h-4 w-4" /> Upload More Files
                </button>
              )}
            </div>

            {/* Stats card */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 text-xs text-slate-400 space-y-3 bg-gradient-to-tr from-purple-950/10 to-indigo-950/10">
              <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[9px]">Semester Stats</h4>
              <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                <span>Course Modules</span>
                <span className="font-bold text-white">{subjects.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                <span>Total Files</span>
                <span className="font-bold text-white">{notes.length}</span>
              </div>
              {activeSubject && (
                <div className="flex justify-between py-1 font-mono">
                  <span>Selected Course</span>
                  <span className="font-bold text-white truncate ml-2">{totalFilesInActive} files</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default SemesterDetail;
