import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, BarChart2, Users, FileText, Download, Plus, Check, ArrowRight } from 'lucide-react';

const AdminPanel = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subSem, setSubSem] = useState('1');
  const [subProf, setSubProf] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user || user.email !== 'admin@notes.edu') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 relative z-20 min-h-[calc(100vh-200px)] flex flex-col justify-center">
        <div className="glass-panel rounded-2xl p-8 border border-white/5 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center">
            <Settings className="h-6 w-6 text-red-400 animate-spin" />
          </div>
          <h2 className="font-montserrat text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You must be signed in with admin credentials (`admin@notes.edu`) to view this dashboard panel.
          </p>
          <button
            onClick={() => navigate('/login?redirect=admin')}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In as Admin</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!subName || !subCode || !subSem) {
      setFormError('Please fill in name, code, and semester.');
      return;
    }

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectName: subName,
          subjectCode: subCode,
          semester: Number(subSem),
          professorName: subProf
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create subject');
      }

      setFormSuccess(true);
      setSubName('');
      setSubCode('');
      setSubProf('');

      const analyticsRes = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (analyticsRes.ok) {
        const updatedAnalytics = await analyticsRes.json();
        setAnalytics(updatedAnalytics);
      }
    } catch (err) {
      setFormError(err.message || 'Error creating subject.');
    }
  };

  const summary = analytics?.summary || { totalNotes: 0, totalDownloads: 0, activeStudents: 0, subjectsCount: 0 };
  const uploadStats = analytics?.charts?.uploadsBySemester || [0, 0, 0, 0, 0, 0, 0, 0];
  const popularNotes = analytics?.charts?.popularNotes || [];
  const activityList = analytics?.recentActivity || [];

  const maxUploadVal = Math.max(...uploadStats, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div>
        <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Settings className="h-8 w-8 text-cyan-400" />
          <span>Admin Controls & Analytics</span>
        </h1>
        <p className="text-sm text-slate-400">
          Monitor note indexings, user logs, and subjects allocations.
        </p>
      </div>

      {!analytics ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Total notes</span>
                <span className="text-lg font-bold text-white">{summary.totalNotes}</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Downloads</span>
                <span className="text-lg font-bold text-white">{summary.totalDownloads}</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Students</span>
                <span className="text-lg font-bold text-white">{summary.activeStudents}</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Courses</span>
                <span className="text-lg font-bold text-white">{summary.subjectsCount}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-poppins font-bold text-white text-base">Semester Upload Statistics</h3>
              <p className="text-xs text-slate-400">Note counts mapped from Semesters 1 to 8.</p>

              <div className="w-full h-48 bg-slate-900/60 rounded-xl border border-white/5 p-4 flex items-end justify-around relative">
                {uploadStats.map((val, idx) => {
                  const percentHeight = (val / maxUploadVal) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-8 group relative">
                      <span className="absolute bottom-full mb-1 text-[9px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-white/10 hidden group-hover:block whitespace-nowrap z-10">
                        {val} files
                      </span>
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-purple-600 to-cyan-400 transition-all duration-500"
                        style={{ height: `${Math.max(percentHeight, 4)}%` }}
                      ></div>
                      <span className="text-[9px] font-mono text-slate-500">S{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-poppins font-bold text-white text-base">Popular Downloads</h3>
              <p className="text-xs text-slate-400">Top study notes with the highest download counters.</p>

              <div className="space-y-3.5 pt-2">
                {popularNotes.map((pop, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[200px]">{pop.title}</span>
                      <span className="text-cyan-400 font-mono">{pop.downloads} dls</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${Math.min((pop.downloads / 150) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {popularNotes.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-4">No download files indexed.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4 h-fit">
              <h3 className="font-poppins font-bold text-white text-base flex items-center gap-1.5">
                <Plus className="h-5 w-5 text-cyan-400" />
                <span>Register Course</span>
              </h3>
              
              <form onSubmit={handleAddSubject} className="space-y-4">
                {formError && (
                  <p className="p-2 rounded bg-red-950/20 border border-red-500/20 text-[10px] text-red-400 font-semibold">{formError}</p>
                )}
                {formSuccess && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex items-center justify-center gap-1 font-semibold">
                    <Check className="h-3.5 w-3.5" /> Subject added to database!
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Name</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Course 11"
                    required
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Code</label>
                  <input
                    type="text"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="e.g. SEM1-C11"
                    required
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</label>
                  <select
                    value={subSem}
                    onChange={(e) => setSubSem(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lecturer Name</label>
                  <input
                    type="text"
                    value={subProf}
                    onChange={(e) => setSubProf(e.target.value)}
                    placeholder="e.g. Dr. Alfred Aho"
                    className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-xs font-bold text-white hover:opacity-95"
                >
                  Create Course Index
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="font-poppins font-bold text-white text-base">Recent Registrations</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead className="border-b border-white/10 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="py-2.5">Student</th>
                      <th className="py-2.5">Branch</th>
                      <th className="py-2.5 text-center">Sem</th>
                      <th className="py-2.5 text-center">Files</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activityList.map((act, idx) => (
                      <tr key={idx}>
                        <td className="py-3">
                          <span className="font-semibold text-white block">{act.name}</span>
                          <span className="text-[10px] text-slate-500">{act.email}</span>
                        </td>
                        <td className="py-3 truncate max-w-[120px]">{act.department}</td>
                        <td className="py-3 text-center font-mono font-bold text-purple-400">{act.semester}</td>
                        <td className="py-3 text-center font-mono font-bold text-cyan-400">{act.uploads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default AdminPanel;
