import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import { User, Award, Upload, Bookmark, Trash2, Edit2, Check } from 'lucide-react';

const ProfilePage = () => {
  const { user, token, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uploads');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState('1');
  const [editDepartment, setEditDepartment] = useState('Computer Science');
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProfile(data);
        if (data) {
          setEditName(data.name);
          setEditSemester(data.semester.toString());
          setEditDepartment(data.department);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({
        name: editName,
        semester: Number(editSemester),
        department: editDepartment
      });
      setProfile(prev => ({
        ...prev,
        name: updated.name,
        semester: updated.semester,
        department: updated.department,
        badges: updated.badges
      }));
      setIsEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note from ENotes Library index?')) return;
    
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setProfile(prev => ({
          ...prev,
          uploadedNotes: prev.uploadedNotes.filter(n => n.id !== noteId && n._id !== noteId),
          favorites: prev.favorites.filter(n => n.id !== noteId && n._id !== noteId)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const badgeDetails = {
    'New Joiner': 'Joined the futuristic Engineering Notes Library platform.',
    'Knowledge Seeker': 'Downloaded their first academic lecture sheet.',
    'Book Archivist': 'Saved one or more summaries to their bookmark library.',
    'Scholar Upload Master': 'Uploaded 3 or more high-quality lecture files.',
    'Explorer': 'Created an account using Google single sign-on.',
    'Google Signed': 'Connected account via Google SSO.'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-cyan-500 to-sky-400"></div>
            
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 p-1">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-3xl uppercase">
                  {profile?.name ? profile.name.charAt(0) : 'S'}
                </div>
              </div>

              <div>
                <h2 className="font-montserrat text-xl font-extrabold text-white">{profile?.name}</h2>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdits} className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Computer Science">Computer Science (CSE)</option>
                    <option value="Electronics & Comm">Electronics (ECE)</option>
                    <option value="Electrical Engineering">Electrical (EE)</option>
                    <option value="Mechanical Engineering">Mechanical (ME)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Semester</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-900 hover:bg-cyan-400"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Semester</span>
                    <span className="text-base font-extrabold text-white">Sem {profile?.semester}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Uploads</span>
                    <span className="text-base font-extrabold text-white">{profile?.uploadedNotes?.length || 0}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Branch/Department</span>
                  <span className="text-xs font-bold text-cyan-400">{profile?.department}</span>
                </div>

                {editSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1.5 font-mono">
                    <Check className="h-3.5 w-3.5" /> Profile Updated!
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="py-2.5 px-4 rounded-xl bg-red-950/20 border border-red-500/25 hover:bg-red-900/10 text-xs font-bold text-red-400"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Uploads by Course Summary */}
                {profile?.uploadedNotes && profile.uploadedNotes.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider font-mono">Uploads by Course</span>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {(() => {
                        const counts = {};
                        profile.uploadedNotes.forEach(n => {
                          counts[n.subject] = (counts[n.subject] || 0) + 1;
                        });
                        return Object.entries(counts).map(([courseName, count], idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2 last:border-0 last:pb-0 font-sans">
                            <span className="text-slate-300 truncate pr-2 font-medium" title={courseName}>{courseName}</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold flex-shrink-0 text-[10px]">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex border-b border-white/10 p-1.5 bg-slate-900/40 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('uploads')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'uploads' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="h-4 w-4" /> Uploaded Notes
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'favorites' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="h-4 w-4" /> Saved Files
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'badges' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="h-4 w-4" /> Badges
              </button>
            </div>

            <div className="min-h-[300px]">
              {activeTab === 'uploads' && (
                <div className="space-y-4">
                  {profile?.uploadedNotes && profile.uploadedNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {profile.uploadedNotes.map((note) => (
                        <div key={note.id || note._id} className="relative group/delete">
                          <BookCard
                            semester={note.semester}
                            title={note.title}
                            subtitle={note.subject}
                            subjectCode={`UNIT ${note.unitNumber}`}
                            count={note.downloads}
                            rating={note.rating}
                            colorIndex={note.semester - 1}
                            onClick={() => navigate(`/notes/${note.id || note._id}`)}
                          />
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id || note._id);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all z-20 md:opacity-0 group-hover/delete:opacity-100"
                            title="Delete note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 space-y-4">
                      <p className="text-xs text-slate-500">You haven't contributed any notes yet.</p>
                      <button
                        onClick={() => navigate('/upload')}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg text-xs font-bold text-white"
                      >
                        Upload Study Sheets
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-4">
                  {profile?.favorites && profile.favorites.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {profile.favorites.map((note) => (
                        <BookCard
                          key={note.id || note._id}
                          semester={note.semester}
                          title={note.title}
                          subtitle={note.subject}
                          subjectCode={`UNIT ${note.unitNumber}`}
                          count={note.downloads}
                          rating={note.rating}
                          colorIndex={note.semester - 1}
                          onClick={() => navigate(`/notes/${note.id || note._id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500">No bookmarked sheets saved.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'badges' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile?.badges && profile.badges.length > 0 ? (
                    profile.badges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="glass-panel rounded-2xl p-5 border border-white/5 flex gap-4 items-center hover:border-cyan-500/20 hover:scale-[1.01] transition-all"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 flex-shrink-0 flex items-center justify-center shadow-lg">
                          <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-cyan-400">
                            <Award className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-poppins text-sm font-bold text-white leading-tight">{badge}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{badgeDetails[badge] || 'Engineering contributor recognition achievement badge.'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 glass-panel rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500">No badges awarded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ProfilePage;
