import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import { Search, GraduationCap, Clock, Award, ChevronRight, FileText, Compass, BookOpen } from 'lucide-react';

const SemesterDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notesList, setNotesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Each semester has exactly 10 Course modules
  const semestersData = [
    { num: 1, title: 'Freshman Foundations', subjectsCount: 10 },
    { num: 2, title: 'Introductory Core', subjectsCount: 10 },
    { num: 3, title: 'Intermediate Core', subjectsCount: 10 },
    { num: 4, title: 'System Architectures', subjectsCount: 10 },
    { num: 5, title: 'Advanced Algorithms', subjectsCount: 10 },
    { num: 6, title: 'Application Dev & AI', subjectsCount: 10 },
    { num: 7, title: 'Network Security & IoT', subjectsCount: 10 },
    { num: 8, title: 'Deep Specializations', subjectsCount: 10 }
  ];

  useEffect(() => {
    fetch('/api/notes')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setNotesList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getNoteCount = (semNum) => {
    return notesList.filter(n => n.semester === semNum).length;
  };

  const activeSemester = user?.semester || 3;
  const progressPercent = Math.min(((activeSemester - 1) / 8) * 100 + 12, 100);

  const filteredSemesters = semestersData.filter(sem => {
    const term = searchQuery.toLowerCase();
    return (
      `semester ${sem.num}`.includes(term) ||
      sem.title.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-cyan-400" />
            <span>Academic Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back, {user ? user.name : 'Student'}. Explore semesters or review your current progress.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search semester or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-0.5">
              <h3 className="font-poppins font-bold text-white text-base">Semester Progress</h3>
              <p className="text-xs text-slate-400">Currently attending Semester {activeSemester}</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{Math.round(progressPercent)}% Completed</span>
          </div>

          <div className="space-y-4">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>SEM 1</span>
              <span>SEM 4</span>
              <span>SEM 8</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-400/20">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Contributor Rank</h4>
              <p className="text-xs text-slate-400">{user?.badges?.length || 1} Badges Earned</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-purple-400 block">Current Status</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">{user?.badges?.[0] || 'Junior Member'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-montserrat text-lg font-bold text-white">Textbook Curriculums</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSemesters.map((sem, idx) => (
            <BookCard
              key={sem.num}
              semester={sem.num}
              title={sem.title}
              subtitle={`${sem.subjectsCount} Course Modules`}
              count={getNoteCount(sem.num)}
              colorIndex={sem.num - 1}
              onClick={() => navigate(`/semester/${sem.num}`)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h2 className="font-montserrat text-lg font-bold text-white flex items-center gap-2">
          <Compass className="h-5 w-5 text-purple-400" />
          <span>GOVT EXAM Special Module</span>
        </h2>
        
        <div 
          onClick={() => navigate('/semester/9')}
          className="cursor-pointer glass-panel rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-slate-900/60 hover:scale-[1.01] transition-all flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-300"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
              <BookOpen className="h-7 w-7 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-poppins text-lg font-bold text-white group-hover:text-purple-300 transition-colors">GOVT EXAM</h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Access 10 dedicated blocks for national & state-level government examinations (GATE, TNPSC, UPSC, SSC CGL, RRB JE, etc.). Upload reference guide notes and preview prep papers.
              </p>
            </div>
          </div>
          
          <button className="px-5 py-2.5 rounded-xl bg-purple-500 text-slate-950 font-bold hover:bg-purple-400 transition-colors text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.25)] flex-shrink-0">
            <span>Access Exam Library</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <span>Recently Uploaded Study Files</span>
          </h3>

          <div className="divide-y divide-white/5">
            {loading ? (
              <p className="text-xs text-slate-500 py-4">Scanning records...</p>
            ) : notesList.length > 0 ? (
              notesList.slice(0, 5).map((note) => (
                <div
                  key={note.id || note._id}
                  onClick={() => navigate(`/notes/${note.id || note._id}`)}
                  className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10 flex-shrink-0">
                      <FileText className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{note.title}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {note.subject} • Unit {note.unitNumber} • Semester {note.semester}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4">No recent uploads found.</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">Library Tip of the Day</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              "You can register new course modules or add files to any existing courses at any time. When compiling notes, try grouping them by unit numbers (1 to 5) for quick search operations!"
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SemesterDashboard;
