import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, GraduationCap, Tag, X, Clock, AlertCircle, Book } from 'lucide-react';
import BookCard from '../components/BookCard';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_searches');
    return saved ? JSON.parse(saved) : ['Course 1', 'Advanced', 'Intro'];
  });

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const semParam = searchParams.get('semester') || '';
    const subParam = searchParams.get('subject') || '';
    const tagParam = searchParams.get('tag') || '';

    setQuery(qParam);
    setSelectedSem(semParam);
    setSelectedSubject(subParam);
    setSelectedTag(tagParam);

    setLoading(true);
    let url = '/api/notes?';
    if (qParam) url += `search=${encodeURIComponent(qParam)}&`;
    if (semParam) url += `semester=${encodeURIComponent(semParam)}&`;
    if (subParam) url += `subject=${encodeURIComponent(subParam)}&`;
    if (tagParam) url += `tag=${encodeURIComponent(tagParam)}&`;

    fetch(url)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setNotes(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [searchParams]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/notes?search=${encodeURIComponent(query)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const titles = data.map(n => n.title).slice(0, 5);
        setSuggestions(titles);
      })
      .catch(() => {});
  }, [query]);

  const executeSearch = (searchVal = query, semVal = selectedSem, subVal = selectedSubject, tagVal = selectedTag) => {
    const params = {};
    if (searchVal) params.q = searchVal;
    if (semVal) params.semester = semVal;
    if (subVal) params.subject = subVal;
    if (tagVal) params.tag = tagVal;

    setSearchParams(params);

    if (searchVal.trim() && !recentSearches.includes(searchVal.trim())) {
      const updatedHistory = [searchVal.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedHistory);
      localStorage.setItem('recent_searches', JSON.stringify(updatedHistory));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
      setSuggestions([]);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedSem('');
    setSelectedSubject('');
    setSelectedTag('');
    setSearchParams({});
  };

  const removeFilter = (filterType) => {
    const params = Object.fromEntries(searchParams.entries());
    delete params[filterType];
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div>
        <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Search className="h-8 w-8 text-cyan-400" />
          <span>Advanced Notes Search</span>
        </h1>
        <p className="text-sm text-slate-400">
          Find topics, units, and course codes instantaneously.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Type notes topic, key terms, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-5 py-3.5 pl-12 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
          />
          <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-400" />
          
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl bg-slate-900 border border-white/10 p-2 shadow-2xl z-50">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    setSuggestions([]);
                    executeSearch(suggestion);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                executeSearch(query, e.target.value);
              }}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Semesters</option>
              {Array.from({ length: 8 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Book className="h-3.5 w-3.5" /> Subject/Course
            </label>
            <input
              type="text"
              placeholder="e.g. Semester 1 Course 1"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              onBlur={() => executeSearch(query, selectedSem, selectedSubject)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(query, selectedSem, selectedSubject)}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-slate-300 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Tag Query
            </label>
            <input
              type="text"
              placeholder="e.g. Intro"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              onBlur={() => executeSearch(query, selectedSem, selectedSubject, selectedTag)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(query, selectedSem, selectedSubject, selectedTag)}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {searchParams.get('q') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full text-cyan-400">
                Query: {searchParams.get('q')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('q')} />
              </span>
            )}
            {searchParams.get('semester') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-500/10 border border-purple-400/20 px-2.5 py-1 rounded-full text-purple-400">
                Sem: {searchParams.get('semester')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('semester')} />
              </span>
            )}
            {searchParams.get('subject') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1 rounded-full text-emerald-400">
                Subject: {searchParams.get('subject')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('subject')} />
              </span>
            )}
            {searchParams.get('tag') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full text-amber-400">
                Tag: {searchParams.get('tag')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('tag')} />
              </span>
            )}
          </div>

          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            Clear All Search Criteria
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-white/5 space-y-4 h-fit">
          <h3 className="font-poppins font-bold text-white text-sm flex items-center gap-1.5">
            <Clock className="h-4.5 w-4.5 text-cyan-400" />
            <span>Recent Queries</span>
          </h3>

          <div className="flex flex-col gap-2">
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(term);
                  executeSearch(term);
                }}
                className="w-full text-left text-xs text-slate-400 hover:text-cyan-400 py-1.5 border-b border-white/5 transition-colors truncate font-semibold"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
            <span>Search Results Index</span>
            <span>{notes.length} match(es) located</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {notes.map((note) => (
                <BookCard
                  key={note.id || note._id}
                  semester={note.semester}
                  title={note.title}
                  subtitle={note.subject}
                  subjectCode={`UNIT ${note.unitNumber}`}
                  count={note.downloads}
                  colorIndex={note.semester - 1}
                  rating={note.rating}
                  onClick={() => navigate(`/notes/${note.id || note._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-panel rounded-2xl border border-white/5 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 text-slate-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-poppins font-bold text-white text-base">No Matching Notes Located</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn't locate any notes matching your search filter. Try clearing filters or using general topics.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SearchPage;
