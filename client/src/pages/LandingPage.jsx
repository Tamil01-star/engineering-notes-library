import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Upload, Search, Shield, Cpu, RefreshCw, Eye, Star, ChevronDown, CheckCircle, Award } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState({});
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    fetch('/api/notes')
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecentNotes(data.slice(0, 4)))
      .catch(() => {});
  }, []);

  const toggleFaq = (idx) => {
    setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const stats = [
    { value: '120+', label: 'Academic Notes Files', color: 'text-cyan-400' },
    { value: '80', label: 'Course Modules', color: 'text-purple-400' },
    { value: '2,400+', label: 'Joined Gmail Students', color: 'text-sky-400' },
    { value: '8 of 8', label: 'Semesters Coverages', color: 'text-indigo-400' }
  ];

  const features = [
    { title: 'Organized Semester Notes', desc: 'Find notes structured by academic semesters, subjects, and units.', icon: BookOpen },
    { title: 'Easy Upload System', desc: 'Contribute and share your engineering documents via drag & drop.', icon: Upload },
    { title: 'Fast Search & Filter', desc: 'Locate topics instantly using keywords, tags, or subject codes.', icon: Search },
    { title: 'PDF Preview', desc: 'Read course files inside the browser with custom notebook styles.', icon: Eye },
    { title: 'Mobile Friendly', desc: 'Review notes on the go with responsive mobile and tablet layouts.', icon: Cpu },
    { title: 'Dark Reading Mode', desc: 'Rest your eyes during late-night study sessions with our neon toggle.', icon: Shield }
  ];

  const faqs = [
    { q: 'Is this notes library free for all engineering students?', a: 'Yes, this platform is open source and entirely free for students to view, download, and upload academic engineering notes.' },
    { q: 'What file formats are supported for notes upload?', a: 'We support PDF, DOCX, PPT/PPTX slide decks, and image files (JPG, PNG) up to 50MB per file.' },
    { q: 'Can I bookmark notes to study later?', a: 'Absolutely! Simply click the favorite/bookmark icon on any book cover to save it to your Profile and Favorites tab.' },
    { q: 'How can I become a contributor?', a: 'Register for an account using your Gmail address, choose your semester, and upload your notes. You will earn contributor badges!' }
  ];

  return (
    <div className="relative min-h-screen text-slate-100 pb-20 md:pb-0">
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-28">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-900/40 via-purple-900/40 to-cyan-500/10 rounded-full blur-[100px] z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-mono tracking-wider">
              <Award className="h-4 w-4 animate-bounce" /> 80 CORE COURSES INDEXED
            </div>
            
            <h1 className="font-montserrat text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-white">
              Engineering Notes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500">
                Library
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto md:mx-0">
              All your semester subjects organized beautifully. Download study materials, review lecture slides, and upload notes using your Gmail credentials.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={() => navigate('/semesters')}
                className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-all text-white"
              >
                Explore Semesters
              </button>
              
              <button
                onClick={() => navigate('/upload')}
                className="px-8 py-3.5 rounded-xl font-bold bg-slate-800 border border-white/10 hover:bg-slate-700 hover:border-cyan-500/40 transition-all text-slate-300"
              >
                Upload Your Notes
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute w-72 h-72 bg-gradient-to-tr from-cyan-400/10 to-purple-600/10 rounded-full blur-[60px] animate-pulse"></div>

            <div className="w-full max-w-[400px] aspect-[4/3] flex flex-col justify-end items-center relative">
              <div className="flex items-end gap-1.5 z-10 mb-[-6px]">
                <div className="w-8 h-36 bg-gradient-to-t from-red-800 to-rose-700 rounded-sm border-r border-black/40 shadow-lg transform rotate-[-4deg] origin-bottom hover:translate-y-[-10px] transition-transform duration-300">
                  <div className="w-full h-full flex flex-col justify-around py-3 items-center opacity-30 text-[9px] font-mono text-white select-none">
                    <span>M</span><span>A</span><span>T</span><span>H</span>
                  </div>
                </div>
                <div className="w-9 h-40 bg-gradient-to-t from-indigo-950 to-purple-800 rounded-sm border-r border-black/40 shadow-lg hover:translate-y-[-15px] transition-transform duration-300">
                  <div className="w-full h-full flex flex-col justify-around py-3 items-center opacity-30 text-[9px] font-mono text-white select-none">
                    <span>P</span><span>H</span><span>Y</span><span>S</span>
                  </div>
                </div>
                <div className="w-8 h-32 bg-gradient-to-t from-amber-700 to-yellow-600 rounded-sm border-r border-black/40 shadow-lg transform rotate-[3deg] hover:translate-y-[-8px] transition-transform duration-300"></div>
                <div className="w-10 h-44 bg-gradient-to-t from-teal-900 to-cyan-700 rounded-sm border-r border-black/40 shadow-lg hover:translate-y-[-20px] transition-transform duration-300">
                  <div className="w-full h-full flex flex-col justify-around py-3 items-center opacity-30 text-[9px] font-mono text-white select-none">
                    <span>D</span><span>S</span><span>A</span>
                  </div>
                </div>
                <div className="w-8 h-38 bg-gradient-to-t from-book-leatherDark to-book-leather rounded-sm border-r border-black/40 shadow-lg transform rotate-[15deg] origin-bottom hover:rotate-[5deg] transition-transform duration-300"></div>
              </div>

              <div className="w-full h-4 bg-gradient-to-r from-amber-950 to-amber-900 rounded-md border border-amber-900 shadow-2xl relative">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow-500/50"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-900/60 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className={`font-montserrat text-3xl sm:text-4xl font-extrabold ${stat.color}`}>{stat.value}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-montserrat text-2xl sm:text-3xl font-bold">Engineered for Academic Excellence</h2>
          <p className="text-sm text-slate-400 mt-2">Get high-fidelity notes designed and uploaded by top-tier engineering students and teachers.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-cyan-500/25 hover:bg-slate-800/30 transition-all duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mb-4">
                <feat.icon className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="font-poppins text-lg font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-slate-900/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 text-center sm:text-left gap-4">
            <div>
              <h2 className="font-montserrat text-2xl sm:text-3xl font-bold">Trending Lecture Notes</h2>
              <p className="text-sm text-slate-400 mt-1">Highly-downloaded documents on the platform today.</p>
            </div>
            <Link to="/search" className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              View All Notes <RefreshCw className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="cursor-pointer glass-panel rounded-2xl p-5 border border-white/5 hover:border-purple-500/30 hover:bg-slate-800/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-semibold uppercase text-cyan-400 font-mono tracking-widest">{note.subject}</span>
                    <h3 className="font-poppins text-base font-bold text-white leading-snug line-clamp-2">{note.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3">{note.description || 'Lecture summary sheets.'}</p>
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {note.rating}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-slate-400" /> {note.downloads} dls</span>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between opacity-80"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-semibold uppercase text-cyan-400 font-mono tracking-widest">Semester {i + 1} Core</span>
                    <h3 className="font-poppins text-base font-bold text-white leading-snug line-clamp-2">Academic Core Lecture Sheet - {i + 1}</h3>
                    <p className="text-xs text-slate-400">Class notes covering formulas, theorems, and assignments.</p>
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.9</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-slate-400" /> {23 + (i * 12)} dls</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-montserrat text-2xl sm:text-3xl font-bold">What Engineering Students Say</h2>
          <p className="text-sm text-slate-400 mt-2">Helping undergrads survive exams and score top grades.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 relative">
            <p className="text-sm text-slate-300 italic">"The Course 1 lecture sheets from Semester 1 literally saved my math exam! The summaries were extremely clear and easy to follow."</p>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-9 w-9 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold text-xs">SW</div>
              <div>
                <h4 className="text-xs font-semibold text-white">Sam Wilson</h4>
                <p className="text-[10px] text-slate-500">ECE Undergrad, Year 2</p>
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/5 relative">
            <p className="text-sm text-slate-300 italic">"Uploading my notebook scans here using Google Mail credentials has been really secure and rewarding. I love getting badges!"</p>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-9 w-9 rounded-full bg-purple-400/20 text-purple-300 flex items-center justify-center font-bold text-xs">ER</div>
              <div>
                <h4 className="text-xs font-semibold text-white">Elena Rostova</h4>
                <p className="text-[10px] text-slate-500">CSE Undergrad, Year 3</p>
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/5 relative">
            <p className="text-sm text-slate-300 italic">"The search system is so fast! I can just type the subject code or a tag like 'Graphs' and immediately pull the PDF in a second."</p>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-9 w-9 rounded-full bg-sky-400/20 text-sky-300 flex items-center justify-center font-bold text-xs">DK</div>
              <div>
                <h4 className="text-xs font-semibold text-white">David Kim</h4>
                <p className="text-[10px] text-slate-500">EE Undergrad, Year 2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900/20 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-montserrat text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 mt-2">Everything you need to know about the ENotes platform.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-cyan-400 transition-transform duration-200 ${faqOpen[idx] ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen[idx] && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 border-t border-white/5 leading-relaxed bg-slate-950/20 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="flex items-center gap-2 font-montserrat text-lg font-extrabold tracking-wider text-cyan-400">
              <BookOpen className="h-6 w-6 text-cyan-400" />
              <span>ENotes.edu</span>
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Elevating academic resources for engineering candidates globally. Beautifully organized, free to access.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Resources</h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <Link to="/semesters" className="hover:text-white transition-colors">Semester Dashboard</Link>
              <Link to="/search" className="hover:text-white transition-colors">Advanced Search</Link>
              <Link to="/upload" className="hover:text-white transition-colors">Upload Portal</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Legal</h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contact</h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <span>Support: support@enotes.edu</span>
              <span>Offices: Cyber Campus Library Center</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-12 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
          <p>© 2026 Engineering Notes Library. All rights reserved. Designed for Futuristic Academy.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
