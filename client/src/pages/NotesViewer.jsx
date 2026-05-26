import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Download, Trash2, Bookmark, Star, Layers, 
  MessageSquare, Send, BookOpen, Eye, Info
} from 'lucide-react';const getFileExtension = (url, title) => {
  if (url && url.startsWith('data:')) {
    const mime = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('word') || mime.includes('officedocument.wordprocessing')) return 'docx';
    if (mime.includes('presentation') || mime.includes('officedocument.presentation')) return 'pptx';
    if (mime.includes('image')) return 'image';
  }
  const cleanUrl = url ? url.split('?')[0].split('#')[0] : '';
  const ext = cleanUrl.substring(cleanUrl.lastIndexOf('.') + 1).toLowerCase();
  if (['pdf', 'docx', 'doc', 'pptx', 'ppt', 'jpg', 'jpeg', 'png'].includes(ext)) {
    return ext;
  }
  if (title) {
    const titleExt = title.substring(title.lastIndexOf('.') + 1).toLowerCase();
    if (['pdf', 'docx', 'doc', 'pptx', 'ppt', 'jpg', 'jpeg', 'png'].includes(titleExt)) {
      return titleExt;
    }
  }
  return 'pdf'; // fallback
};

const WordPreview = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = React.useRef(null);

  useEffect(() => {
    let active = true;
    const renderDoc = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadScript = (src) => new Promise((resolve, reject) => {
          if (window.docx) { resolve(); return; }
          if (document.querySelector(`script[src="${src}"]`)) {
            const interval = setInterval(() => {
              if (window.docx) {
                clearInterval(interval);
                resolve();
              }
            }, 50);
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.1.20/dist/docx-preview.min.js');

        if (!active) return;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load file content');
        const blob = await res.blob();
        
        if (!active) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await window.docx.renderAsync(blob, containerRef.current, null, {
            className: "docx-document",
            inWrapper: false
          });
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (active) {
          setError('Could not render Word document preview. Download the file to view.');
          setLoading(false);
        }
      }
    };

    renderDoc();
    return () => { active = false; };
  }, [url]);

  return (
    <div className="w-full bg-slate-900 rounded-xl p-2 md:p-4 min-h-[600px] flex flex-col">
      {loading && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Rendering Word pages...</p>
        </div>
      )}
      {error && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4 py-16">
          <p className="text-sm text-rose-400 font-medium">{error}</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="flex-grow overflow-auto max-h-[600px] bg-white text-black p-4 md:p-8 rounded-lg docx-preview-container"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

const PptxPreview = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = React.useRef(null);

  useEffect(() => {
    let active = true;
    const renderPpt = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load presentation file');
        const blob = await res.blob();
        
        if (!active) return;

        const module = await import('https://cdn.jsdelivr.net/npm/pptx-viewer/+esm');
        
        if (!active) return;
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const viewer = new module.PPTXViewer(containerRef.current);
          await viewer.load(blob);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (active) {
          setError('Could not render slides preview. Download the file to view.');
          setLoading(false);
        }
      }
    };

    renderPpt();
    return () => { active = false; };
  }, [url]);

  return (
    <div className="w-full bg-slate-900 rounded-xl p-2 md:p-4 min-h-[600px] flex flex-col">
      {loading && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-mono">Rendering presentation slides...</p>
        </div>
      )}
      {error && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4 py-16">
          <p className="text-sm text-rose-400 font-medium">{error}</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="flex-grow overflow-auto max-h-[600px] bg-slate-950 p-4 rounded-lg pptx-preview-container"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

const NotesViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, toggleFavorite } = useAuth();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [readingMode, setReadingMode] = useState(false); // false = Preview PDF/Image, true = Notebook Text Summary
  const [favorited, setFavorited] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchNoteAndData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/notes/${id}`);
        if (!res.ok) throw new Error('Note not found');
        const data = await res.json();
        setNote(data);

        // Check favorite state
        if (user && user.favorites) {
          setFavorited(user.favorites.includes(data.id || data._id));
        } else {
          setFavorited(false);
        }

        // Fetch related notes of same subject
        const relatedRes = await fetch(`/api/notes?subject=${encodeURIComponent(data.subject)}`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          const filtered = relatedData.filter(n => (n.id || n._id) !== id);
          setRelatedNotes(filtered);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNoteAndData();
  }, [id, user]);

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setActionLoading(true);
    const result = await toggleFavorite(note.id || note._id);
    setFavorited(result);
    setActionLoading(false);
  };

  const handleDownload = async () => {
    try {
      await fetch(`/api/notes/${note.id || note._id}/download`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      setNote(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);

      const link = document.createElement('a');
      const isAbsolute = note.fileUrl.startsWith('http') || note.fileUrl.startsWith('data:') || note.fileUrl.startsWith('blob:');
      const resolvedFileUrl = isAbsolute ? note.fileUrl : (import.meta.env.VITE_API_URL || '') + note.fileUrl;
      link.href = resolvedFileUrl;
      link.setAttribute('download', note.title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download registration failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this study note permanently?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/notes/${note.id || note._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Delete operation failed');
      }

      alert('Note deleted successfully.');
      navigate(`/semester/${note.semester}`);
    } catch (err) {
      alert(err.message);
      setActionLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/notes/${note.id || note._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });

      if (res.ok) {
        const newComment = await res.json();
        setNote(prev => prev ? {
          ...prev,
          comments: [...(prev.comments || []), newComment]
        } : null);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateSubmit = async (stars) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notes/${note.id || note._id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: stars })
      });

      if (res.ok) {
        const ratingData = await res.json();
        setNote(prev => prev ? {
          ...prev,
          rating: ratingData.rating
        } : null);
        setRatingSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] relative z-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        <p className="mt-4 text-xs text-slate-400 font-mono">Retrieving academic document...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 relative z-20 min-h-[calc(100vh-200px)] flex flex-col justify-center">
        <div className="glass-panel rounded-2xl p-8 border border-white/5 space-y-4">
          <h2 className="font-montserrat text-xl font-bold text-white">Document Lost in Library</h2>
          <p className="text-sm text-slate-400">
            {error || 'The requested note file was not found or was removed from database catalog.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl font-bold bg-slate-900 border border-white/10 text-cyan-400 hover:text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && (
    (note.uploadedBy && note.uploadedBy.userId === user.id) || 
    (note.uploadedBy && note.uploadedBy.email === user.email) ||
    user.email === 'admin@notes.edu'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1 font-montserrat">
          <button
            onClick={() => navigate(`/semester/${note.semester}`)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-all mb-2"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Course Index
          </button>
          <h1 className="font-montserrat text-xl md:text-2xl font-extrabold text-white line-clamp-1">
            {note.title}
          </h1>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-purple-300">{note.subject}</span>
            <span>•</span>
            <span>Semester {note.semester}</span>
            <span>•</span>
            <span>Unit {note.unitNumber}</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Favorite Toggle Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={actionLoading}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
              favorited 
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
            title={favorited ? "Remove bookmark" : "Bookmark this study sheet"}
          >
            <Bookmark className={`h-4.5 w-4.5 ${favorited ? 'fill-purple-300' : ''}`} />
            <span className="hidden sm:inline">{favorited ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Download</span>
          </button>

          {/* Delete Button (Always visible) */}
          <button
            onClick={handleDelete}
            disabled={!isOwner || actionLoading}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              isOwner
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                : 'bg-slate-900/50 border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title={isOwner ? "Delete this note permanently" : "Only the author can delete this note"}
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Document Viewport */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            
            {/* View Mode Tabs */}
            <div className="flex border-b border-white/5 bg-slate-950/40 p-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setReadingMode(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !readingMode 
                      ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-400' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>Document Preview</span>
                </button>
                <button
                  onClick={() => setReadingMode(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    readingMode 
                      ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-400' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  <span>Notebook Summary</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                Uploaded by: <span className="text-slate-300 font-sans font-semibold">{note.uploadedBy?.name || 'Academic Board'}</span>
              </div>
            </div>

            {/* Document View Area */}
            <div className="flex-1 bg-slate-950 min-h-[500px] flex items-center justify-center p-1 sm:p-4">
              {!readingMode ? (
                <div className="w-full h-full min-h-[600px] relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  {(() => {
                    const isAbsolute = note.fileUrl.startsWith('http') || note.fileUrl.startsWith('data:') || note.fileUrl.startsWith('blob:');
                    const resolvedFileUrl = isAbsolute ? note.fileUrl : (import.meta.env.VITE_API_URL || '') + note.fileUrl;
                    const ext = getFileExtension(resolvedFileUrl, note.title);

                    if (ext === 'docx' || ext === 'doc') {
                      return <WordPreview url={resolvedFileUrl} />;
                    } else if (ext === 'pptx' || ext === 'ppt') {
                      return <PptxPreview url={resolvedFileUrl} />;
                    } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                      return (
                        <div className="w-full min-h-[500px] flex items-center justify-center p-4 bg-slate-900 rounded-xl overflow-auto">
                          <img 
                            src={resolvedFileUrl} 
                            alt={note.title} 
                            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg border border-white/5" 
                          />
                        </div>
                      );
                    } else {
                      return (
                        <iframe 
                          src={resolvedFileUrl} 
                          className="w-full h-[600px] border-none bg-slate-900 rounded-xl"
                          title={note.title}
                        />
                      );
                    }
                  })()}
                </div>
              ) : (
                // Notebook overview texture mode
                <div className="w-full max-w-2xl mx-auto my-6 bg-[#FAF6EE] p-8 rounded-xl shadow-2xl relative border border-slate-300/80 notebook-paper text-slate-800">
                  {/* Red margin line */}
                  <div className="absolute left-[3.5rem] top-0 bottom-0 w-[1.5px] bg-red-400"></div>
                  
                  {/* Notebook content */}
                  <div className="pl-16 space-y-6 select-text font-serif">
                    <div className="border-b-2 border-dashed border-slate-300 pb-2">
                      <h2 className="text-xl font-bold font-poppins text-slate-900 tracking-tight leading-none mb-1">{note.title}</h2>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">{note.subject} — UNIT {note.unitNumber}</span>
                    </div>

                    <div className="space-y-4 text-sm leading-8 text-slate-700">
                      <p><strong>Contributor:</strong> {note.uploadedBy?.name || 'Anonymous Student'} ({note.uploadedBy?.email || 'N/A'})</p>
                      <p><strong>Upload Date:</strong> {new Date(note.uploadDate || note.uploadDate || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Total Downloads:</strong> {note.downloads || 0} times</p>
                      <p><strong>Average Rating:</strong> {note.rating || 5.0} / 5★</p>
                      
                      <div className="pt-4 border-t border-slate-200 mt-6 font-sans">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Detailed Notes Summary</h4>
                        <p className="italic text-xs text-slate-600 bg-amber-50 border border-amber-200/60 p-3.5 rounded-lg leading-relaxed whitespace-pre-line">
                          {note.description || 'No detailed syllabus text entered by the contributor. Refer to standard notes tags below to query similar courses.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Footer */}
            <div className="flex flex-wrap justify-between items-center px-6 py-4 bg-slate-950/20 border-t border-white/5 text-xs text-slate-400 font-mono gap-y-2">
              <div className="flex gap-4">
                <span>Downloads: <strong className="text-white">{note.downloads || 0}</strong></span>
                <span>Rating: <strong className="text-white">{note.rating || 5.0}★</strong></span>
              </div>
              <div>
                <span>Added: <strong className="text-white">{new Date(note.uploadDate || note.uploadDate || Date.now()).toLocaleDateString()}</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Meta details, Discussions & rating modules */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-3">
            <h3 className="font-poppins font-bold text-white text-sm flex items-center gap-1.5"><Layers className="h-4.5 w-4.5 text-cyan-400" /> Syllabus Overview</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {note.description || 'No detailed syllabus text entered by the contributor. Refer to standard notes tags below to query similar courses.'}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {note.tags?.map((t, idx) => (
                <span
                  key={idx}
                  onClick={() => navigate(`/search?tag=${encodeURIComponent(t)}`)}
                  className="cursor-pointer text-[10px] font-semibold bg-slate-800 border border-white/5 px-2.5 py-1 rounded-full text-slate-300 hover:border-cyan-400/40 hover:text-white"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <span>Student Discussion ({note.comments?.length || 0})</span>
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 divide-y divide-white/5">
              {note.comments && note.comments.length > 0 ? (
                note.comments.map((c, idx) => (
                  <div key={idx} className="space-y-1.5 pt-3 first:pt-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-cyan-400">{c.user}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-2">No comments posted yet. Start the academic discussion!</p>
              )}
            </div>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-3 pt-4 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Ask a question or leave a review..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  className="flex-1 rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 rounded-xl bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-colors flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="text-center py-3 bg-slate-800/40 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400">
                  Please <Link to="/login" className="text-cyan-400 hover:underline">sign in</Link> to join the student conversation.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-poppins font-bold text-white text-sm flex items-center gap-1.5"><Star className="h-4.5 w-4.5 text-yellow-400 fill-yellow-400" /> Rate Study Sheets</h3>
            <p className="text-xs text-slate-400">Rate this study material to help peer engineers select better reviews:</p>
            
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRateSubmit(star)}
                  disabled={ratingSubmitted || !user}
                  onMouseEnter={() => !ratingSubmitted && setUserRating(star)}
                  className={`p-1 transition-all ${
                    star <= (ratingSubmitted ? Math.round(note.rating) : userRating)
                      ? 'text-yellow-400 hover:scale-110' 
                      : 'text-slate-600 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`h-6 w-6 ${star <= (ratingSubmitted ? Math.round(note.rating) : userRating) ? 'fill-yellow-400' : ''}`} />
                </button>
              ))}
            </div>

            {ratingSubmitted ? (
              <p className="text-[10px] font-semibold text-emerald-400 font-mono">Feedback submitted! Average rating: {note.rating}★</p>
            ) : !user ? (
              <p className="text-[10px] text-slate-500">Sign in to rate this file.</p>
            ) : (
              <p className="text-[10px] text-slate-500 font-mono">Click a star to submit your review rating.</p>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="font-poppins font-bold text-white text-sm flex items-center gap-1.5"><BookOpen className="h-4.5 w-4.5 text-cyan-400" /> Related Materials</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Similar resources for "{note.subject}":</p>

            <div className="divide-y divide-white/5">
              {relatedNotes.length > 0 ? (
                relatedNotes.map((rel) => (
                  <div
                    key={rel.id || rel._id}
                    onClick={() => navigate(`/notes/${rel.id || rel._id}`)}
                    className="py-3.5 cursor-pointer group flex flex-col gap-1.5 first:pt-0"
                  >
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {rel.title}
                    </h4>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Unit {rel.unitNumber} • Semester {rel.semester}</span>
                      <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> {rel.rating}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 italic py-2">No other notes registered for this subject.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NotesViewer;
