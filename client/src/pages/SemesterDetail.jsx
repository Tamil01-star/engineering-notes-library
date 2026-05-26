import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowLeft, BookOpen, Upload, FileText, ChevronRight, User, Hash, Star, Trash2 } from 'lucide-react';

const SemesterDetail = () => {
  const { sem } = useParams();
  const navigate = useNavigate();
  const semNum = Number(sem);
  const { user, token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetchSubjects = fetch(`/api/subjects/semester/${semNum}`)
      .then(res => res.ok ? res.json() : []);

    const fetchNotes = fetch(`/api/notes?semester=${semNum}`)
      .then(res => res.ok ? res.json() : []);

    Promise.all([fetchSubjects, fetchNotes])
      .then(([subjectsData, notesData]) => {
        setSubjects(subjectsData);
        setNotes(notesData);
        if (subjectsData.length > 0) {
          setActiveSubject(subjectsData[0].subjectName);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [semNum]);

  const getSubjectNotes = (subjectName) => {
    return notes.filter(n => n.subject.toLowerCase() === subjectName.toLowerCase());
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation(); // Stop routing to details viewer page
    if (!window.confirm('Are you sure you want to delete this study note permanently?')) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Delete operation failed');
      }

      setNotes(prev => prev.filter(n => (n.id || n._id) !== noteId));
      alert('Note deleted successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/semesters')}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-all mb-2"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Dashboard
          </button>
          
          <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-purple-400" />
            <span>{semNum === 9 ? 'GOVT EXAM Prep Library' : `Semester ${semNum} Courses`}</span>
          </h1>
          <p className="text-sm text-slate-400 font-sans">
            {semNum === 9 
              ? 'Select a government exam category block (GATE, TNPSC, UPSC, etc.) to review all preparation sheets.' 
              : 'Select a course module to review all uploaded summaries and lecture guides.'}
          </p>
        </div>

        <div className="rounded-full bg-slate-800/80 px-4 py-2 border border-white/5 text-xs font-mono font-semibold text-purple-300">
          {semNum === 9 ? 'Special Module' : `Semester ${semNum} / 8`}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Subjects list grid (exactly 10 courses) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              {subjects.map((sub) => {
                const subNotes = getSubjectNotes(sub.subjectName);
                
                return (
                  <div
                    key={sub.id || sub._id}
                    onClick={() => setActiveSubject(sub.subjectName)}
                    className={`group cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] ${
                      activeSubject === sub.subjectName
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
                          {subNotes.length} Files
                        </span>
                      </div>

                      <div>
                        <h3 className="font-poppins text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                          {sub.subjectName}
                        </h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <User className="h-3 w-3 text-slate-500" />
                          <span>Professor: {sub.professorName || 'Dept. Panel'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-4 flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubject(sub.subjectName);
                        }}
                        className="flex-1 flex justify-center items-center gap-1 rounded-lg bg-slate-900 border border-white/10 text-[11px] font-semibold py-1.5 text-slate-300 hover:text-white"
                      >
                        <BookOpen className="h-3 w-3 text-cyan-400" />
                        <span>Show Files</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/upload?subject=${encodeURIComponent(sub.subjectName)}&semester=${semNum}`);
                        }}
                        className="flex-shrink-0 flex items-center justify-center p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"
                        title="Upload notes to this subject"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Multiple notes lists container */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Files Index ({activeSubject})</span>
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                You can append multiple notes files to this subject module. Click a note below to preview or download:
              </p>

              <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto pr-1">
                {activeSubject && getSubjectNotes(activeSubject).map((note) => {
                  const isOwner = user && (
                    (note.uploadedBy && note.uploadedBy.userId === user.id) || 
                    (note.uploadedBy && note.uploadedBy.email === user.email) ||
                    user.email === 'admin@notes.edu'
                  );

                  return (
                    <div
                      key={note.id || note._id}
                      onClick={() => navigate(`/notes/${note.id || note._id}`)}
                      className="group flex items-center justify-between py-3 cursor-pointer hover:bg-white/5 rounded-lg px-2.5 transition-colors"
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                          {note.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-medium font-mono">
                          <span>Unit {note.unitNumber}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" /> {note.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => isOwner ? handleDeleteNote(e, note.id || note._id) : e.stopPropagation()}
                          disabled={!isOwner}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isOwner 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' 
                              : 'bg-slate-900/50 border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                          }`}
                          title={isOwner ? "Delete note permanently" : "Only the author can delete this note"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4.5 w-4.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}

                {(!activeSubject || getSubjectNotes(activeSubject).length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-xs text-slate-500">No notes uploaded for this module yet.</p>
                    <button
                      onClick={() => navigate(`/upload?semester=${semNum}&subject=${encodeURIComponent(activeSubject)}`)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <Upload className="h-3.5 w-3.5" /> Add First Document
                    </button>
                  </div>
                )}
              </div>

              {activeSubject && getSubjectNotes(activeSubject).length > 0 && (
                <button
                  onClick={() => navigate(`/upload?semester=${semNum}&subject=${encodeURIComponent(activeSubject)}`)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-cyan-400 font-bold flex items-center justify-center gap-1.5 transition-colors font-poppins"
                >
                  <Upload className="h-4 w-4" /> Add Another Document
                </button>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/5 text-xs text-slate-400 space-y-3 bg-gradient-to-tr from-purple-950/10 to-indigo-950/10">
              <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[9px]">Course Stats</h4>
              <div className="flex justify-between py-1 border-b border-white/5 font-mono">
                <span>Total Modules Available</span>
                <span className="font-bold text-white">10 Courses</span>
              </div>
              <div className="flex justify-between py-1 font-mono">
                <span>Uploaded Documents</span>
                <span className="font-bold text-white">{notes.length} Files</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
          <p className="text-slate-400">Loading semester courses...</p>
        </div>
      )}

    </div>
  );
};

export default SemesterDetail;
